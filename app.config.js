export default {
  expo: {
    name: "Plato AR",
    slug: "plato-ar",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    autolinking: {
      modules: "./modules",
      searchPaths: ["node_modules", "./modules"]
    },
    experiments: {
      autolinkingModuleResolution: true
    },
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#00B4D8"
    },
    updates: {
      fallbackToCacheTimeout: 0
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.plato.ar",
      infoPlist: {
        NSCameraUsageDescription: "This app uses the camera for AR experiences",
        NSMicrophoneUsageDescription: "This app uses the microphone for voice interactions during AR",
        NSSpeechRecognitionUsageDescription: "This app uses speech recognition to understand your observations"
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#00B4D8"
      },
      package: "com.plato.ar"
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      "expo-asset",
      "./modules/plato-ar/expo-plugin.js"
    ],
    extra: {
      openRouterApiKey: process.env.REACT_APP_OPENROUTER_KEY || "",
      eas: {
        projectId: "your-project-id"
      }
    }
  }
};