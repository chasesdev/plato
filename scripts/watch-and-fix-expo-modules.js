#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const EXPO_MODULES_PROVIDER_PATH = 'ios/Pods/Target Support Files/Pods-PlatoAR/ExpoModulesProvider.swift';

function updateExpoModulesProvider() {
  if (!fs.existsSync(EXPO_MODULES_PROVIDER_PATH)) {
    return false;
  }

  let content = fs.readFileSync(EXPO_MODULES_PROVIDER_PATH, 'utf8');
  let hasChanges = false;

  // Add import if not present
  if (!content.includes('import plato_ar')) {
    content = content.replace(
      'import ExpoSpeech',
      'import ExpoSpeech\nimport plato_ar'
    );
    hasChanges = true;
  }

  // Add module to array if not present
  if (!content.includes('PlatoArModule.self')) {
    content = content.replace(
      'SpeechModule.self\n    ]',
      'SpeechModule.self,\n      PlatoArModule.self\n    ]'
    );
    hasChanges = true;
  }

  if (hasChanges) {
    fs.writeFileSync(EXPO_MODULES_PROVIDER_PATH, content);
    console.log('🔧 Auto-fixed ExpoModulesProvider.swift with PlatoArModule');
    return true;
  }

  return false;
}

function watchAndFix() {
  console.log('👀 Watching ExpoModulesProvider.swift for changes...');

  // Initial fix
  updateExpoModulesProvider();

  // Watch for changes
  if (fs.existsSync(path.dirname(EXPO_MODULES_PROVIDER_PATH))) {
    fs.watch(path.dirname(EXPO_MODULES_PROVIDER_PATH), (eventType, filename) => {
      if (filename === 'ExpoModulesProvider.swift') {
        setTimeout(() => {
          updateExpoModulesProvider();
        }, 100); // Small delay to ensure file is written
      }
    });

    console.log('✅ File watcher active. ExpoModulesProvider will be auto-fixed when regenerated.');
    console.log('Press Ctrl+C to stop watching.');
  } else {
    console.log('⚠️  Pods directory not found. Run this after building.');
  }
}

// If run directly
if (require.main === module) {
  watchAndFix();
}

module.exports = { updateExpoModulesProvider, watchAndFix };