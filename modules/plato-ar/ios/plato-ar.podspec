require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'plato-ar'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = 'Plato AR module with ARKit and voice integration for immersive learning experiences'
  s.author         = { 'Plato' => 'dev@plato.com' }
  s.homepage       = 'https://github.com/chasesdev/plato'
  s.license        = { :type => 'MIT' }
  s.platforms      = { :ios => '13.0' }
  s.source         = { :git => "https://github.com/chasesdev/plato.git", :tag => "v#{s.version}" }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  # Expo modules require Swift 5.0
  s.swift_version    = '5.0'

  # Use standard CocoaPods directory structure
  s.source_files = [
    "Classes/**/*.{h,m,mm,swift}",
    "*.{h,m,mm}"
  ]
end