import ExpoModulesCore
import ARKit
import RealityKit
import Speech
import AVFoundation
import Combine

public class PlatoArModule: Module {
  private var arView: ARView?
  private var speechRecognizer: SFSpeechRecognizer?
  private var audioEngine: AVAudioEngine?
  private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
  private var recognitionTask: SFSpeechRecognitionTask?

  public func definition() -> ModuleDefinition {
    Name("PlatoAr")

    Events("onSpeechDetected", "onModelInteraction", "onARSessionStarted", "onARError")

    // Define the View with proper ViewManager setup
    View(PlatoArView.self) {
      Prop("modelUrl") { (view: PlatoArView, url: String?) in
        if let url = url {
          view.loadModel(from: url)
        }
      }

      Events("onTap", "onPinch", "onRotate")
    }

    AsyncFunction("startARSession") { (modelPath: String, promise: Promise) in
      DispatchQueue.main.async {
        self.initializeARSession(modelPath: modelPath) { success, error in
          if success {
            promise.resolve(true)
          } else {
            promise.reject("AR_INIT_ERROR", error ?? "Failed to initialize AR session")
          }
        }
      }
    }

    AsyncFunction("startVoiceRecognition") { (promise: Promise) in
      self.requestSpeechAuthorization { authorized in
        if authorized {
          self.startListening()
          promise.resolve(true)
        } else {
          promise.reject("SPEECH_AUTH_ERROR", "Speech recognition not authorized")
        }
      }
    }

    Function("stopVoiceRecognition") {
      self.stopListening()
    }

    Function("loadUSDZModel") { (modelPath: String) -> Bool in
      guard let arView = self.arView else { return false }

      // Load USDZ model
      if let url = URL(string: modelPath) {
        let anchor = AnchorEntity(plane: .horizontal)

        Entity.loadModelAsync(contentsOf: url)
          .sink(receiveCompletion: { completion in
            if case .failure(let error) = completion {
              self.sendEvent("onARError", ["error": error.localizedDescription])
            }
          }, receiveValue: { entity in
            anchor.addChild(entity)
            arView.scene.addAnchor(anchor)
            self.sendEvent("onARSessionStarted", ["modelLoaded": true])
          })
          .store(in: &self.cancellables)

        return true
      }
      return false
    }

    AsyncFunction("captureARScreenshot") { (promise: Promise) in
      guard let arView = self.arView else {
        promise.resolve(nil)
        return
      }

      arView.snapshot(saveToHDR: false) { image in
        if let image = image {
          // Convert to base64 or save to temp file
          if let data = image.pngData() {
            promise.resolve(data.base64EncodedString())
          } else {
            promise.resolve(nil)
          }
        } else {
          promise.resolve(nil)
        }
      }
    }
  }

  // MARK: - Private Methods

  private var cancellables = Set<AnyCancellable>()

  private func initializeARSession(modelPath: String, completion: @escaping (Bool, String?) -> Void) {
    // Initialize AR View
    arView = ARView(frame: .zero)

    guard let arView = arView else {
      completion(false, "Failed to create AR view")
      return
    }

    // Configure AR session
    let configuration = ARWorldTrackingConfiguration()
    configuration.planeDetection = [.horizontal, .vertical]
    configuration.environmentTexturing = .automatic

    arView.session.run(configuration)

    // Add gesture recognizers
    setupGestureRecognizers(for: arView)

    completion(true, nil)
  }

  private func setupGestureRecognizers(for arView: ARView) {
    // Tap gesture
    let tapGesture = UITapGestureRecognizer(target: self, action: #selector(handleTap(_:)))
    arView.addGestureRecognizer(tapGesture)

    // Pinch gesture for scaling
    let pinchGesture = UIPinchGestureRecognizer(target: self, action: #selector(handlePinch(_:)))
    arView.addGestureRecognizer(pinchGesture)

    // Rotation gesture
    let rotationGesture = UIRotationGestureRecognizer(target: self, action: #selector(handleRotation(_:)))
    arView.addGestureRecognizer(rotationGesture)
  }

  @objc private func handleTap(_ gesture: UITapGestureRecognizer) {
    guard let arView = arView else { return }
    let location = gesture.location(in: arView)

    if let entity = arView.entity(at: location) {
      sendEvent("onModelInteraction", [
        "type": "tap",
        "entityName": entity.name
      ])
    }
  }

  @objc private func handlePinch(_ gesture: UIPinchGestureRecognizer) {
    sendEvent("onModelInteraction", [
      "type": "pinch",
      "scale": gesture.scale
    ])
  }

  @objc private func handleRotation(_ gesture: UIRotationGestureRecognizer) {
    sendEvent("onModelInteraction", [
      "type": "rotation",
      "rotation": gesture.rotation
    ])
  }

  // MARK: - Speech Recognition

  private func requestSpeechAuthorization(completion: @escaping (Bool) -> Void) {
    SFSpeechRecognizer.requestAuthorization { authStatus in
      DispatchQueue.main.async {
        completion(authStatus == .authorized)
      }
    }
  }

  private func startListening() {
    // Initialize speech recognizer
    speechRecognizer = SFSpeechRecognizer(locale: Locale(identifier: "en-US"))
    audioEngine = AVAudioEngine()

    guard let speechRecognizer = speechRecognizer,
          let audioEngine = audioEngine,
          speechRecognizer.isAvailable else {
      sendEvent("onARError", ["error": "Speech recognizer not available"])
      return
    }

    do {
      // Configure audio session
      let audioSession = AVAudioSession.sharedInstance()
      try audioSession.setCategory(.record, mode: .measurement, options: .duckOthers)
      try audioSession.setActive(true, options: .notifyOthersOnDeactivation)

      recognitionRequest = SFSpeechAudioBufferRecognitionRequest()

      guard let recognitionRequest = recognitionRequest else {
        sendEvent("onARError", ["error": "Unable to create speech recognition request"])
        return
      }

      recognitionRequest.shouldReportPartialResults = true

      let inputNode = audioEngine.inputNode
      let recordingFormat = inputNode.outputFormat(forBus: 0)

      inputNode.installTap(onBus: 0, bufferSize: 1024, format: recordingFormat) { buffer, _ in
        recognitionRequest.append(buffer)
      }

      audioEngine.prepare()
      try audioEngine.start()

      recognitionTask = speechRecognizer.recognitionTask(with: recognitionRequest) { result, error in
        if let result = result {
          let transcript = result.bestTranscription.formattedString
          self.sendEvent("onSpeechDetected", [
            "transcript": transcript,
            "isFinal": result.isFinal
          ])
        }

        if error != nil || result?.isFinal == true {
          self.stopListening()

          // Auto-restart if not final
          if result?.isFinal == false {
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
              self.startListening()
            }
          }
        }
      }
    } catch {
      sendEvent("onARError", ["error": "Failed to start audio engine: \(error.localizedDescription)"])
    }
  }

  private func stopListening() {
    audioEngine?.stop()
    audioEngine?.inputNode.removeTap(onBus: 0)
    recognitionRequest?.endAudio()
    recognitionTask?.cancel()

    recognitionRequest = nil
    recognitionTask = nil
  }
}

// MARK: - AR View Component

public class PlatoArView: ExpoView {
  private var arView: ARView?

  public required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    setupARView()
  }

  public required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  private func setupARView() {
    arView = ARView(frame: bounds)
    arView?.autoresizingMask = [.flexibleWidth, .flexibleHeight]

    if let arView = arView {
      addSubview(arView)

      // Start AR session
      let configuration = ARWorldTrackingConfiguration()
      configuration.planeDetection = [.horizontal]
      arView.session.run(configuration)
    }
  }

  func loadModel(from urlString: String) {
    guard let arView = arView,
          let url = URL(string: urlString) else { return }

    // Load USDZ model
    let anchor = AnchorEntity(plane: .horizontal)

    Entity.loadModelAsync(contentsOf: url)
      .sink(receiveCompletion: { _ in },
            receiveValue: { entity in
        anchor.addChild(entity)
        arView.scene.addAnchor(anchor)
      })
      .store(in: &cancellables)
  }

  private var cancellables = Set<AnyCancellable>()
}