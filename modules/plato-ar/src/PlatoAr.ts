import { NativeModulesProxy, EventEmitter } from 'expo-modules-core';
import PlatoArModule from './PlatoArModule';


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
  private eventEmitter: any;

  constructor() {
    console.log('🏗️ SETUP: Initializing PlatoAr with module:', PlatoArModule);
    console.log('🏗️ SETUP: Module functions available:', PlatoArModule ? Object.keys(PlatoArModule) : 'NO MODULE');
    console.log('🏗️ SETUP: Module type:', typeof PlatoArModule);
    console.log('🏗️ SETUP: Module instance:', PlatoArModule);

    // Check if module has expected functions
    const expectedFunctions = ['startARSession', 'loadUSDZModel', 'captureARScreenshot'];
    expectedFunctions.forEach(func => {
      console.log(`🏗️ SETUP: ${func} available:`, typeof PlatoArModule?.[func] === 'function');
    });

    // Try different EventEmitter creation approaches
    try {
      console.log('🏗️ SETUP: Creating EventEmitter with native module...');
      this.eventEmitter = new EventEmitter(PlatoArModule);
      console.log('🏗️ SETUP: EventEmitter created successfully:', !!this.eventEmitter);
      console.log('🏗️ SETUP: EventEmitter methods:', Object.keys(this.eventEmitter));

    } catch (error) {
      console.log('🏗️ SETUP: Error creating EventEmitter:', error);
      throw error;
    }
  }

  async startARSession(modelPath: string): Promise<boolean> {
    console.log('📱 Calling native startARSession with:', modelPath);
    const result = await PlatoArModule.startARSession(modelPath);
    console.log('✅ startARSession result:', result);
    return result;
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

  scaleModel(scale: number): boolean {
    console.log('🔄 Calling native scaleModel with:', scale);
    const result = PlatoArModule.scaleModel(scale);
    console.log('✅ scaleModel result:', result);
    return result;
  }

  rotateModel(rotation: number): boolean {
    console.log('🔄 Calling native rotateModel with:', rotation);
    const result = PlatoArModule.rotateModel(rotation);
    console.log('✅ rotateModel result:', result);
    return result;
  }



  addModelInteractionListener(listener: (event: ModelInteractionEvent) => void) {
    console.log('📝 Adding model interaction listener');
    return this.eventEmitter.addListener('modelInteraction', (event) => {
      console.log('👆 Model interaction event received:', event);
      listener(event);
    });
  }

  addARSessionListener(listener: (event: ARSessionEvent) => void) {
    console.log('📝 Adding AR session listener');
    return this.eventEmitter.addListener('arSessionStarted', (event) => {
      console.log('🎯 AR session event received:', event);
      listener(event);
    });
  }

  addARErrorListener(listener: (event: ARErrorEvent) => void) {
    console.log('📝 Adding AR error listener');
    return this.eventEmitter.addListener('arError', (event) => {
      console.log('❌ AR error event received:', event);
      listener(event);
    });
  }

  removeAllListeners() {
    this.eventEmitter.removeAllListeners('modelInteraction');
    this.eventEmitter.removeAllListeners('arSessionStarted');
    this.eventEmitter.removeAllListeners('arError');
  }
}

export default new PlatoAr();