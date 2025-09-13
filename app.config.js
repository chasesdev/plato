export default {
  expo: {
    name: "Plato AR",
    slug: "plato-ar",
    version: "1.0.0",
    autolinking: {
      modules: "./modules",
      searchPaths: ["node_modules", "./modules"]
    },
    experiments: {
      autolinkingModuleResolution: true
    },
    updates: {
      fallbackToCacheTimeout: 0
    },
    assetBundlePatterns: [
      "**/*"
    ],
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      "expo-asset",
      "./modules/plato-ar/expo-plugin.js",
      [
        "expo-speech-recognition",
        {
          speechRecognitionPermission: "This app uses speech recognition to understand your observations during AR experiences",
          recordAudioAndroid: {
            recordAudioPermission: "This app uses the microphone for voice interactions during AR"
          }
        }
      ]
    ],
    extra: {
      eas: {
        projectId: "ca63e2b4-dd19-4c35-b8de-33220943f8b5"
      },
      openRouterApiKey: process.env.REACT_APP_OPENROUTER_KEY || ""
    }
  }
};