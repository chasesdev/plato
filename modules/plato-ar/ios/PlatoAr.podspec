Pod::Spec.new do |s|
  s.name           = 'PlatoAr'
  s.version        = '1.0.0'
  s.summary        = 'AR module for Plato with ARKit and voice integration'
  s.description    = 'Native AR module that provides ARKit integration with voice recognition for educational AR experiences'
  s.homepage       = 'https://github.com/plato/plato-ar'
  s.author         = 'Plato Team'
  s.platform       = :ios, '13.0'
  s.source         = { :git => '' }
  s.source_files   = '**/*.{h,m,swift}'

  s.dependency 'ExpoModulesCore'

  s.frameworks = 'ARKit', 'RealityKit', 'Speech', 'AVFoundation'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_VERSION' => '5.0'
  }
end