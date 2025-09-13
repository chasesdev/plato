import { NativeModulesProxy, EventEmitter } from 'expo-modules-core';
import PlatoArModule from './PlatoArModule';

export interface SpeechEvent {
  transcript: string;
  isFinal: boolean;
}

export interface ModelInteractionEvent {
  type: 'tap' | 'pinch' | 'rotation';
  entityName?: string;
  scale?: number;
  rotation?: number;
}

export interface ARSessionEvent {
  modelLoaded: boolean;
}

export interface ARErrorEvent {
  error: string;
}

class PlatoAr {
  private eventEmitter: EventEmitter;

  constructor() {
    console.log('🏗️ Initializing PlatoAr with module:', PlatoArModule);
    console.log('🏗️ Module functions available:', PlatoArModule ? Object.keys(PlatoArModule) : 'NO MODULE');
    this.eventEmitter = new EventEmitter(PlatoArModule);
    console.log('🏗️ EventEmitter created:', !!this.eventEmitter);
  }

  async startARSession(modelPath: string): Promise<boolean> {
    console.log('📱 Calling native startARSession with:', modelPath);
    const result = await PlatoArModule.startARSession(modelPath);
    console.log('✅ startARSession result:', result);
    return result;
  }

  async startVoiceRecognition(): Promise<boolean> {
    console.log('🎤 Calling native startVoiceRecognition');
    const result = await PlatoArModule.startVoiceRecognition();
    console.log('✅ startVoiceRecognition result:', result);
    return result;
  }

  stopVoiceRecognition(): void {
    console.log('🛑 Calling native stopVoiceRecognition');
    PlatoArModule.stopVoiceRecognition();
  }

  loadUSDZModel(modelPath: string): boolean {
    console.log('📦 Calling native loadUSDZModel with:', modelPath);
    const result = PlatoArModule.loadUSDZModel(modelPath);
    console.log('✅ loadUSDZModel result:', result);
    return result;
  }

  async captureARScreenshot(): Promise<string | null> {
    console.log('📸 Calling native captureARScreenshot');
    const result = await PlatoArModule.captureARScreenshot();
    console.log('✅ captureARScreenshot result:', result ? 'base64 image' : 'null');
    return result;
  }

  // Event listeners with debug logging
  addSpeechListener(listener: (event: SpeechEvent) => void) {
    console.log('📝 Adding speech listener for onSpeechDetected');
    console.log('📝 EventEmitter available events:', this.eventEmitter.listenerCount);

    return this.eventEmitter.addListener('onSpeechDetected', (event) => {
      console.log('🎤 Speech event received:', event);
      console.log('🎤 Event details - transcript:', event?.transcript, 'isFinal:', event?.isFinal);
      listener(event);
    });
  }

  addModelInteractionListener(listener: (event: ModelInteractionEvent) => void) {
    console.log('📝 Adding model interaction listener');
    return this.eventEmitter.addListener('onModelInteraction', (event) => {
      console.log('👆 Model interaction event received:', event);
      listener(event);
    });
  }

  addARSessionListener(listener: (event: ARSessionEvent) => void) {
    console.log('📝 Adding AR session listener');
    return this.eventEmitter.addListener('onARSessionStarted', (event) => {
      console.log('🎯 AR session event received:', event);
      listener(event);
    });
  }

  addARErrorListener(listener: (event: ARErrorEvent) => void) {
    console.log('📝 Adding AR error listener');
    return this.eventEmitter.addListener('onARError', (event) => {
      console.log('❌ AR error event received:', event);
      listener(event);
    });
  }

  removeAllListeners() {
    this.eventEmitter.removeAllListeners('onSpeechDetected');
    this.eventEmitter.removeAllListeners('onModelInteraction');
    this.eventEmitter.removeAllListeners('onARSessionStarted');
    this.eventEmitter.removeAllListeners('onARError');
  }
}

export default new PlatoAr();