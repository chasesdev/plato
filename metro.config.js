const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add USDZ and GLB to asset extensions
config.resolver.assetExts.push('usdz', 'glb');

module.exports = config;