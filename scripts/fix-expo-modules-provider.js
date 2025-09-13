#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const EXPO_MODULES_PROVIDER_PATH = 'ios/Pods/Target Support Files/Pods-PlatoAR/ExpoModulesProvider.swift';

function updateExpoModulesProvider() {
  if (!fs.existsSync(EXPO_MODULES_PROVIDER_PATH)) {
    console.log('ExpoModulesProvider.swift not found, skipping...');
    return;
  }

  let content = fs.readFileSync(EXPO_MODULES_PROVIDER_PATH, 'utf8');

  // Add import if not present
  if (!content.includes('import plato_ar')) {
    content = content.replace(
      'import ExpoSpeech',
      'import ExpoSpeech\nimport plato_ar'
    );
  }

  // Add module to array if not present
  if (!content.includes('PlatoArModule.self')) {
    content = content.replace(
      'SpeechModule.self\n    ]',
      'SpeechModule.self,\n      PlatoArModule.self\n    ]'
    );
  }

  fs.writeFileSync(EXPO_MODULES_PROVIDER_PATH, content);
  console.log('✅ Updated ExpoModulesProvider.swift with PlatoArModule');
}

updateExpoModulesProvider();