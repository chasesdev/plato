const { withPodfile } = require('@expo/config-plugins');

module.exports = function withPlatoAr(config) {
  // Add iOS configuration for Podfile
  config = withPodfile(config, (config) => {
    const podfileContents = config.modResults.contents;

    // Add the local pod
    const localPodSpec = `  pod 'plato-ar', :path => '../modules/plato-ar'`;

    if (!podfileContents.includes('plato-ar')) {
      // Find the target line and add our pod
      const lines = podfileContents.split('\n');
      const targetLineIndex = lines.findIndex(line => line.includes("target"));

      if (targetLineIndex !== -1) {
        // Insert after target line
        lines.splice(targetLineIndex + 1, 0, localPodSpec);
        config.modResults.contents = lines.join('\n');
      }
    }

    return config;
  });

  return config;
};