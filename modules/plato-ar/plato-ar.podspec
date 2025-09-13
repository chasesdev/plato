require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'plato-ar'
  s.version        = package['version']
  s.summary        = 'AR module for Plato with ARKit and voice integration'
  s.description    = 'Native AR and voice recognition module for Plato educational app, providing ARKit integration and speech recognition capabilities'
  s.authors        = { 'Plato Team' => 'team@plato.com' }
  s.homepage       = 'https://github.com/plato/plato-ar'
  s.license        = { :type => 'MIT', :file => 'LICENSE' }
  s.platforms      = { :ios => '13.0' }
  s.source         = { :git => 'https://github.com/plato/plato-ar.git', :tag => s.version.to_s }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  # Swift/Objective-C compatibility for SDK 54
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule',
    'OTHER_SWIFT_FLAGS' => '-DEXPO_MODULES_SDK_54'
  }

  # Specify source files more precisely for SDK 54 autolinking
  s.source_files = "ios/**/*.{h,m,mm,swift,hpp,cpp}"
  s.public_header_files = "ios/**/*.h"

  # Ensure Swift version compatibility
  s.swift_version = '5.0'
end