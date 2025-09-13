import ExpoModulesCore
import ARKit
import RealityKit
import Speech
import AVFoundation
import Combine

public class PlatoArModule: Module {
  private var speechRecognizer: SFSpeechRecognizer?
  private var audioEngine: AVAudioEngine?
  private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
  private var recognitionTask: SFSpeechRecognitionTask?

  public func definition() -> ModuleDefinition {
    Name("PlatoAr")

    Events("onSpeechDetected", "onModelInteraction", "onARSessionStarted", "onARError")

    // Define the View with proper ViewManager setup
    View(PlatoArView.self) {
      // Configure view props with explicit type definitions
      Prop("modelUrl") { (view: PlatoArView, url: String?) in
        print("🎯 PROP HANDLER CALLED - PlatoArView received modelUrl prop: \(url ?? "nil")")
        print("🎯 View instance: \(view)")
        print("🎯 Module instance: \(self)")

        // Set module reference
        view.setModule(self)
        print("🎯 Module reference set successfully")

        if let url = url, !url.isEmpty {
          print("🎯 URL is valid, scheduling model load in 1 second...")
          // Wait a bit for AR session to be ready
          DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
            print("🎯 About to call loadModel from prop handler")
            view.loadModel(from: url)
          }
        } else {
          print("🔴 URL is nil or empty, cannot load model")
        }
      }

      // Define view events
      Events("onTap", "onPinch", "onRotate")

      // Add screenshot function at view level
      AsyncFunction("captureARScreenshot") { (view: PlatoArView, promise: Promise) in
        view.captureScreenshot(promise: promise)
      }
    }

    AsyncFunction("startARSession") { (modelPath: String, promise: Promise) in
      // Note: AR session is automatically started when view is displayed
      // But we can trigger model loading here for compatibility
      print("startARSession called with modelPath: \(modelPath)")

      // For now, just resolve successfully - the actual loading happens via props
      promise.resolve(true)
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

    AsyncFunction("captureARScreenshot") { (promise: Promise) in
      print("🎯 MODULE captureARScreenshot called")

      // Find the active view instance and trigger screenshot
      // This is a workaround for the view config issue
      DispatchQueue.main.async {
        let userInfo: [String: Any] = ["promise": promise]
        NotificationCenter.default.post(name: NSNotification.Name("CaptureARScreenshot"), object: nil, userInfo: userInfo)
        print("🎯 MODULE sent CaptureARScreenshot notification")
      }
    }

    Function("stopVoiceRecognition") {
      self.stopListening()
    }

    Function("loadUSDZModel") { (modelPath: String) -> Bool in
      print("🚀 SWIFT CHANGES WORKING! loadUSDZModel called with: \(modelPath)")

      // Find the active view instance and trigger model loading
      // This is a workaround for the view config issue
      DispatchQueue.main.async {
        NotificationCenter.default.post(name: NSNotification.Name("LoadUSDZModel"), object: modelPath)
        print("🎯 MODULE sent LoadUSDZModel notification")
      }

      return true
    }

  }

  // MARK: - Private Methods

  private var cancellables = Set<AnyCancellable>()


  // MARK: - Speech Recognition

  private func requestSpeechAuthorization(completion: @escaping (Bool) -> Void) {
    SFSpeechRecognizer.requestAuthorization { authStatus in
      DispatchQueue.main.async {
        completion(authStatus == .authorized)
      }
    }
  }

  private func startListening() {
    print("🎤 Starting speech recognition...")

    // Initialize speech recognizer
    speechRecognizer = SFSpeechRecognizer(locale: Locale(identifier: "en-US"))
    audioEngine = AVAudioEngine()

    guard let speechRecognizer = speechRecognizer,
          let audioEngine = audioEngine,
          speechRecognizer.isAvailable else {
      print("🔴 Speech recognizer not available")
      print("🔴 Speech recognizer: \(speechRecognizer?.description ?? "nil")")
      print("🔴 Audio engine: \(audioEngine?.description ?? "nil")")
      print("🔴 Is available: \(speechRecognizer?.isAvailable ?? false)")
      self.sendEvent("onARError", ["error": "Speech recognizer not available"])
      return
    }

    print("✅ Speech recognizer initialized successfully")
    print("🎤 Recognizer locale: \(speechRecognizer.locale.identifier)")

    do {
      // Configure audio session
      let audioSession = AVAudioSession.sharedInstance()
      print("🔧 Configuring audio session...")
      try audioSession.setCategory(.record, mode: .measurement, options: .duckOthers)
      try audioSession.setActive(true, options: .notifyOthersOnDeactivation)
      print("✅ Audio session configured successfully")

      recognitionRequest = SFSpeechAudioBufferRecognitionRequest()

      guard let recognitionRequest = recognitionRequest else {
        print("🔴 Unable to create speech recognition request")
        self.sendEvent("onARError", ["error": "Unable to create speech recognition request"])
        return
      }

      recognitionRequest.shouldReportPartialResults = true
      print("✅ Recognition request created with partial results enabled")

      let inputNode = audioEngine.inputNode
      let recordingFormat = inputNode.outputFormat(forBus: 0)
      print("🎵 Audio format: \(recordingFormat.description)")

      inputNode.installTap(onBus: 0, bufferSize: 1024, format: recordingFormat) { buffer, _ in
        recognitionRequest.append(buffer)
        // print("🔊 Audio buffer received: \(buffer.frameLength) frames") // Comment out to reduce spam
      }

      audioEngine.prepare()
      try audioEngine.start()
      print("✅ Audio engine started successfully")

      recognitionTask = speechRecognizer.recognitionTask(with: recognitionRequest) { result, error in
        DispatchQueue.main.async {
          if let result = result {
            let transcript = result.bestTranscription.formattedString
            print("🗣️ Speech recognition result: '\(transcript)', isFinal: \(result.isFinal)")
            print("🗣️ Confidence: \(result.bestTranscription.segments.count) segments")

            print("📡 About to send speech event: '\(transcript)', isFinal: \(result.isFinal)")
            self.sendEvent("onSpeechDetected", [
              "transcript": transcript,
              "isFinal": result.isFinal
            ])
            print("📡 Speech event sent successfully")
          }

          if let error = error {
            print("🔴 Speech recognition error: \(error.localizedDescription)")
            print("🔴 Error details: \(error)")
            self.sendEvent("onARError", ["error": "Speech recognition error: \(error.localizedDescription)"])
          }

          if error != nil || result?.isFinal == true {
            print("🛑 Stopping speech recognition (error: \(error != nil), final: \(result?.isFinal == true))")
            self.stopListening()

            // Auto-restart if not final and no error
            if error == nil && result?.isFinal == false {
              print("🔄 Auto-restarting speech recognition in 0.5s...")
              DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                self.startListening()
              }
            }
          }
        }
      }
      print("✅ Speech recognition task started successfully")
    } catch {
      print("🔴 Failed to start audio engine: \(error.localizedDescription)")
      print("🔴 Error details: \(error)")
      self.sendEvent("onARError", ["error": "Failed to start audio engine: \(error.localizedDescription)"])
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

public class PlatoArView: ExpoView, ARSessionDelegate {
  private var arView: ARView?
  private var isARSessionRunning = false
  private weak var module: PlatoArModule?

  public required init(appContext: AppContext? = nil) {
    print("🏗️ PlatoArView init() called with appContext: \(appContext != nil ? "present" : "nil")")
    super.init(appContext: appContext)
    print("🏗️ Calling setupARView()")
    setupARView()

    // Add notification listeners for module-triggered actions
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(handleLoadModelNotification(_:)),
      name: NSNotification.Name("LoadUSDZModel"),
      object: nil
    )
    print("🏗️ Added LoadUSDZModel notification listener")

    NotificationCenter.default.addObserver(
      self,
      selector: #selector(handleCaptureScreenshotNotification(_:)),
      name: NSNotification.Name("CaptureARScreenshot"),
      object: nil
    )
    print("🏗️ Added CaptureARScreenshot notification listener")

    print("🏗️ PlatoArView initialization complete")
  }

  @objc private func handleLoadModelNotification(_ notification: Notification) {
    print("🎯 VIEW received LoadUSDZModel notification")
    if let modelUrl = notification.object as? String {
      print("🎯 VIEW triggering loadModel with URL: \(modelUrl)")
      loadModel(from: modelUrl)
    } else {
      print("🔴 VIEW notification had invalid URL object")
    }
  }

  @objc private func handleCaptureScreenshotNotification(_ notification: Notification) {
    print("🎯 VIEW received CaptureARScreenshot notification")
    if let userInfo = notification.userInfo,
       let promise = userInfo["promise"] as? Promise {
      print("🎯 VIEW triggering captureScreenshot")
      captureScreenshot(promise: promise)
    } else {
      print("🔴 VIEW notification had invalid promise object")
    }
  }

  func setModule(_ module: PlatoArModule) {
    self.module = module
  }

  public required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  public override func layoutSubviews() {
    super.layoutSubviews()
    arView?.frame = bounds

    // Start AR session after layout is complete
    if !isARSessionRunning {
      startARSession()
    }
  }

  public override func didMoveToSuperview() {
    super.didMoveToSuperview()
    if superview != nil && !isARSessionRunning {
      startARSession()
    }
  }

  public override func removeFromSuperview() {
    stopARSession()
    super.removeFromSuperview()
  }

  private func setupARView() {
    // Initialize AR view
    arView = ARView(frame: bounds)
    arView?.autoresizingMask = [.flexibleWidth, .flexibleHeight]

    if let arView = arView {
      addSubview(arView)

      // Set session delegate for monitoring
      arView.session.delegate = self

      // Add a simple overlay to confirm the view is working
      let label = UILabel(frame: CGRect(x: 20, y: 50, width: 200, height: 30))
      label.text = "PlatoAR View Active"
      label.textColor = .white
      label.backgroundColor = UIColor.black.withAlphaComponent(0.7)
      label.textAlignment = .center
      label.layer.cornerRadius = 5
      label.clipsToBounds = true
      arView.addSubview(label)
    }
  }

  private func startARSession() {
    guard let arView = arView, !isARSessionRunning else { return }

    // Check if AR is supported
    guard ARWorldTrackingConfiguration.isSupported else {
      print("ARWorldTrackingConfiguration is not supported on this device")
      return
    }

    // Check camera permissions
    let cameraStatus = AVCaptureDevice.authorizationStatus(for: .video)
    guard cameraStatus == .authorized else {
      print("Camera permission not granted, status: \(cameraStatus.rawValue)")
      if cameraStatus == .notDetermined {
        AVCaptureDevice.requestAccess(for: .video) { granted in
          DispatchQueue.main.async {
            if granted {
              self.startARSession()
            } else {
              print("Camera access denied")
            }
          }
        }
      }
      return
    }

    // Configure AR session
    let configuration = ARWorldTrackingConfiguration()
    configuration.planeDetection = [.horizontal]
    configuration.environmentTexturing = .automatic

    // Enable additional features if available
    if ARWorldTrackingConfiguration.supportsFrameSemantics(.personSegmentationWithDepth) {
      configuration.frameSemantics.insert(.personSegmentationWithDepth)
    }

    // Start AR session with proper options
    arView.session.run(configuration, options: [.resetTracking, .removeExistingAnchors])
    isARSessionRunning = true

    print("AR Session started successfully")
  }

  private func stopARSession() {
    guard let arView = arView, isARSessionRunning else { return }

    arView.session.pause()
    isARSessionRunning = false

    print("AR Session stopped")
  }

  func loadModel(from urlString: String) {
    guard let arView = arView,
          let url = URL(string: urlString) else {
      print("🔴 Cannot load model: AR view not ready or invalid URL: \(urlString)")
      module?.sendEvent("onARError", ["error": "Invalid model URL or AR view not ready"])
      return
    }

    print("🔄 Starting to load USDZ model from: \(urlString)")
    print("🔄 AR view ready: true, AR session running: \(isARSessionRunning)")

    // Create anchor for horizontal plane
    let anchor = AnchorEntity(plane: .horizontal)

    // Load USDZ model asynchronously
    Entity.loadModelAsync(contentsOf: url)
      .sink(receiveCompletion: { completion in
        DispatchQueue.main.async {
          switch completion {
          case .finished:
            print("✅ Model loading stream completed successfully")
          case .failure(let error):
            print("🔴 Failed to load model: \(error.localizedDescription)")
            print("🔴 Error details: \(error)")
            self.module?.sendEvent("onARError", ["error": "Model loading failed: \(error.localizedDescription)"])
          }
        }
      }, receiveValue: { entity in
        DispatchQueue.main.async {
          print("✅ Model entity created successfully")
          print("📏 Original model scale: \(entity.scale)")

          // Scale down the model if needed
          entity.scale = SIMD3<Float>(0.1, 0.1, 0.1) // Increased scale for better visibility

          anchor.addChild(entity)
          arView.scene.addAnchor(anchor)

          print("✅ Model added to AR scene with anchor")
          print("🎯 Total anchors in scene: \(arView.scene.anchors.count)")

          // Notify JavaScript that model loaded successfully
          self.module?.sendEvent("onARSessionStarted", ["modelLoaded": true])
        }
      })
      .store(in: &cancellables)
  }

  func captureScreenshot(promise: Promise) {
    // Ensure we're on the main thread
    DispatchQueue.main.async {
      print("📸 SCREENSHOT DEBUG - Function called")
      print("📸 AR view exists: \(self.arView != nil)")
      print("📸 AR session running: \(self.isARSessionRunning)")
      print("📸 AR view frame: \(self.arView?.frame ?? CGRect.zero)")
      print("📸 View bounds: \(self.bounds)")
      print("📸 View superview: \(self.superview != nil ? "present" : "nil")")

      // Check if AR view exists and session is running
      guard let arView = self.arView else {
        print("🔴 SCREENSHOT FAIL: AR view is nil")
        promise.reject("AR_NOT_READY", "AR view is nil")
        return
      }

      guard self.isARSessionRunning else {
        print("🔴 SCREENSHOT FAIL: AR session not running")
        promise.reject("AR_NOT_READY", "AR session not running")
        return
      }

      print("📸 AR view and session OK, proceeding with screenshot")

      print("📸 AR session state: \(arView.session.currentFrame != nil ? "has frame" : "no frame")")
      print("📸 AR anchors count: \(arView.scene.anchors.count)")

      // Take screenshot using ARView's snapshot method
      print("📸 Taking ARView snapshot...")
      arView.snapshot(saveToHDR: false) { image in
        DispatchQueue.main.async {
          print("📸 Snapshot callback received")
          if let image = image {
            print("✅ Image captured: \(image.size.width)x\(image.size.height)")

            // Convert to PNG data and then to base64
            if let data = image.pngData() {
              let base64String = data.base64EncodedString()
              let dataSize = data.count
              print("✅ Image converted to base64: \(dataSize) bytes")
              promise.resolve(base64String)
              print("✅ AR screenshot captured successfully")
            } else {
              print("🔴 Failed to convert image to PNG data")
              promise.reject("CONVERSION_FAILED", "Failed to convert image to PNG data")
            }
          } else {
            print("🔴 Snapshot returned nil image")

            // Try alternative screenshot method
            print("📸 Attempting alternative screenshot method...")
            let renderer = UIGraphicsImageRenderer(bounds: arView.bounds)
            let alternativeImage = renderer.image { context in
              arView.layer.render(in: context.cgContext)
            }

            if let data = alternativeImage.pngData() {
              let base64String = data.base64EncodedString()
              print("✅ Alternative screenshot successful")
              promise.resolve(base64String)
            } else {
              print("🔴 Alternative screenshot also failed")
              promise.reject("CAPTURE_FAILED", "Failed to capture AR screenshot with both methods")
            }
          }
        }
      }
    }
  }

  private var cancellables = Set<AnyCancellable>()

  // MARK: - ARSessionDelegate

  public func session(_ session: ARSession, didAdd anchors: [ARAnchor]) {
    print("AR Session: Added \(anchors.count) anchors")
  }

  public func session(_ session: ARSession, didUpdate anchors: [ARAnchor]) {
    print("AR Session: Updated \(anchors.count) anchors")
  }

  public func session(_ session: ARSession, didRemove anchors: [ARAnchor]) {
    print("AR Session: Removed \(anchors.count) anchors")
  }

  public func session(_ session: ARSession, didFailWithError error: Error) {
    print("AR Session failed with error: \(error.localizedDescription)")
    isARSessionRunning = false

    // Try to restart the session after a delay
    DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
      self.startARSession()
    }
  }

  public func sessionWasInterrupted(_ session: ARSession) {
    print("AR Session was interrupted")
    isARSessionRunning = false
  }

  public func sessionInterruptionEnded(_ session: ARSession) {
    print("AR Session interruption ended")
    startARSession()
  }

  public func session(_ session: ARSession, cameraDidChangeTrackingState camera: ARCamera) {
    print("AR Camera tracking state changed to: \(camera.trackingState)")

    switch camera.trackingState {
    case .normal:
      print("AR tracking is working normally")
    case .notAvailable:
      print("AR tracking is not available")
    case .limited(let reason):
      print("AR tracking is limited: \(reason)")
    }
  }
}