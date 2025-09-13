import { NativeModulesProxy } from 'expo-modules-core';

// Debug: Log all available native modules
console.log('=== NATIVE MODULE DEBUG ===');
console.log('Available NativeModulesProxy keys:', Object.keys(NativeModulesProxy));
console.log('Total modules available:', Object.keys(NativeModulesProxy).length);

// Check specific modules
const modulesToCheck = ['PlatoAr', 'PlatoArModule', 'plato-ar', 'ExpoCamera', 'ExpoFileSystem'];
modulesToCheck.forEach(moduleName => {
  const module = NativeModulesProxy[moduleName];
  console.log(`${moduleName}:`, !!module, module ? 'FOUND' : 'NOT FOUND');
  if (module) {
    console.log(`${moduleName} functions:`, Object.keys(module));
  }
});

console.log('===========================');

// Get the native module. This will be null if the module is not available (e.g., in Expo Go)
const PlatoArModule = NativeModulesProxy.PlatoAr;

if (PlatoArModule) {
  console.log('✅ Using NATIVE PlatoAr module implementation');
} else {
  console.log('❌ Using FALLBACK PlatoAr module implementation');
}

export default PlatoArModule || {
  // Fallback implementation - should not be used since native module is working
  startARSession(modelPath: string): Promise<boolean> {
    console.warn('❌ UNEXPECTED: Using fallback startARSession despite native module being found');
    return Promise.resolve(true);
  },
  startVoiceRecognition(): Promise<boolean> {
    console.warn('❌ UNEXPECTED: Using fallback startVoiceRecognition despite native module being found');
    return Promise.resolve(true);
  },
  stopVoiceRecognition(): void {
    console.warn('❌ UNEXPECTED: Using fallback stopVoiceRecognition despite native module being found');
  },
  loadUSDZModel(modelPath: string): boolean {
    console.warn('❌ UNEXPECTED: Using fallback loadUSDZModel despite native module being found');
    return false;
  },
  captureARScreenshot(): Promise<string | null> {
    console.warn('❌ UNEXPECTED: Using fallback captureARScreenshot despite native module being found');
    return Promise.resolve(null);
  }
};