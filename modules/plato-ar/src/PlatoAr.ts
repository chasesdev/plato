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
    this.eventEmitter = new EventEmitter(PlatoArModule);
  }

  async startARSession(modelPath: string): Promise<boolean> {
    return await PlatoArModule.startARSession(modelPath);
  }

  async startVoiceRecognition(): Promise<boolean> {
    return await PlatoArModule.startVoiceRecognition();
  }

  stopVoiceRecognition(): void {
    PlatoArModule.stopVoiceRecognition();
  }

  loadUSDZModel(modelPath: string): boolean {
    return PlatoArModule.loadUSDZModel(modelPath);
  }

  async captureARScreenshot(): Promise<string | null> {
    return await PlatoArModule.captureARScreenshot();
  }

  // Event listeners
  addSpeechListener(listener: (event: SpeechEvent) => void) {
    return this.eventEmitter.addListener('onSpeechDetected', listener);
  }

  addModelInteractionListener(listener: (event: ModelInteractionEvent) => void) {
    return this.eventEmitter.addListener('onModelInteraction', listener);
  }

  addARSessionListener(listener: (event: ARSessionEvent) => void) {
    return this.eventEmitter.addListener('onARSessionStarted', listener);
  }

  addARErrorListener(listener: (event: ARErrorEvent) => void) {
    return this.eventEmitter.addListener('onARError', listener);
  }

  removeAllListeners() {
    this.eventEmitter.removeAllListeners('onSpeechDetected');
    this.eventEmitter.removeAllListeners('onModelInteraction');
    this.eventEmitter.removeAllListeners('onARSessionStarted');
    this.eventEmitter.removeAllListeners('onARError');
  }
}

export default new PlatoAr();