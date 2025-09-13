#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const EXPO_MODULES_PROVIDER_PATH = 'ios/Pods/Target Support Files/Pods-PlatoAR/ExpoModulesProvider.swift';

function updateExpoModulesProvider() {
  if (!fs.existsSync(EXPO_MODULES_PROVIDER_PATH)) {
    console.log('⚠️  ExpoModulesProvider.swift not found, skipping...');
    return;
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
    console.log('✅ Updated ExpoModulesProvider.swift with PlatoArModule');
  } else {
    console.log('✅ PlatoArModule already registered in ExpoModulesProvider.swift');
  }

  // Verify the module is properly included
  if (content.includes('PlatoArModule.self') && content.includes('import plato_ar')) {
    console.log('✅ PlatoArModule is properly configured for SDK 54');
  } else {
    console.log('❌ PlatoArModule configuration may have issues');
  }
}

updateExpoModulesProvider();