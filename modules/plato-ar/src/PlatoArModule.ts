import { NativeModulesProxy } from 'expo-modules-core';

// Get the native module. This will be null if the module is not available (e.g., in Expo Go)
const PlatoArModule = NativeModulesProxy.PlatoAr;

export default PlatoArModule || {
  // Fallback implementation for development/Expo Go
  startARSession(modelPath: string): Promise<boolean> {
    console.warn('PlatoAr: Running without native AR support');
    return Promise.resolve(true);
  },
  startVoiceRecognition(): Promise<boolean> {
    console.warn('PlatoAr: Voice recognition not available');
    // Don't return false - just resolve silently
    return Promise.resolve(true);
  },
  stopVoiceRecognition(): void {
    console.warn('PlatoAr: Voice recognition not available');
  },
  loadUSDZModel(modelPath: string): boolean {
    console.warn('PlatoAr: USDZ loading not available');
    return false;
  },
  captureARScreenshot(): Promise<string | null> {
    console.warn('PlatoAr: Screenshot capture not available');
    return Promise.resolve(null);
  }
};