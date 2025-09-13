import React, { useEffect, useRef } from 'react';
import { View, Text, ViewProps, StyleSheet, Platform } from 'react-native';
import { requireNativeViewManager } from 'expo-modules-core';

export type PlatoArViewProps = ViewProps & {
  modelUrl?: string;
  onTap?: (event: any) => void;
  onPinch?: (event: any) => void;
  onRotate?: (event: any) => void;
};

// Get the native view component
let NativeView: React.ComponentType<PlatoArViewProps> | null = null;

console.log('=== NATIVE VIEW DEBUG ===');

// Try different view manager names
const viewManagerNames = [
  'PlatoAr_PlatoArView',
  'PlatoArView',
  'PlatoAr',
  'plato-ar'
];

for (const name of viewManagerNames) {
  try {
    console.log(`Trying view manager: ${name}`);
    const TestView = requireNativeViewManager(name);
    if (TestView) {
      console.log(`✅ Found view manager: ${name}`);
      NativeView = TestView;
      break;
    }
  } catch (error: any) {
    console.log(`❌ Failed to load view manager ${name}:`, error.message);
  }
}

if (NativeView) {
  console.log('✅ Using NATIVE PlatoArView implementation');
} else {
  console.log('❌ Using FALLBACK PlatoArView implementation');
}
console.log('=========================');

// Fallback view for when native module isn't available
const FallbackView: React.FC<PlatoArViewProps> = (props) => {
  return (
    <View {...props} style={[styles.fallback, props.style]}>
      <Text style={styles.text}>❌ FALLBACK VIEW</Text>
      <Text style={styles.subtext}>
        NATIVE MODULE NOT FOUND
      </Text>
      <Text style={styles.debugText}>
        This means the app is using mock/stub implementations
      </Text>
      {props.modelUrl && (
        <Text style={styles.modelText}>
          Model: {props.modelUrl.split('/').pop()}
        </Text>
      )}
    </View>
  );
};

const PlatoArView: React.FC<PlatoArViewProps> = (props) => {
  const viewRef = useRef<any>(null);

  useEffect(() => {
    // Log for debugging
    if (NativeView) {
      console.log('Using native PlatoArView');
      console.log('🎯 REACT: PlatoArView mounted, props modelUrl:', props.modelUrl);

      // WORKAROUND: Manually trigger model loading since view props aren't working
      if (props.modelUrl) {
        console.log('🎯 REACT: Calling view.captureARScreenshot() to test view functions');

        // Try to call the view-level screenshot function to test if view methods work
        if (viewRef.current && viewRef.current.captureARScreenshot) {
          console.log('🎯 REACT: View has captureARScreenshot method');

          setTimeout(() => {
            console.log('🎯 REACT: Calling view.captureARScreenshot after 2s delay');
            viewRef.current.captureARScreenshot()
              .then((result: string) => {
                console.log('🎯 REACT: View screenshot success:', result ? 'got image' : 'null');
              })
              .catch((error: Error) => {
                console.log('🎯 REACT: View screenshot error:', error);
              });
          }, 2000);
        } else {
          console.log('🎯 REACT: View does not have captureARScreenshot method');
        }
      }
    } else {
      console.log('Using fallback view - native module not available');
    }
  }, [props.modelUrl]);

  // Use native view if available, otherwise use fallback
  if (NativeView) {
    console.log('🎯 REACT: Rendering native view with props:', JSON.stringify(props, null, 2));
    console.log('🎯 REACT: modelUrl being passed:', props.modelUrl);

    return (
      <View style={{ flex: 1 }}>
        <NativeView ref={viewRef} {...props} />
        {/* Debug indicator for native view */}
        <View style={styles.nativeIndicator}>
          <Text style={styles.nativeText}>✅ NATIVE AR VIEW</Text>
          <Text style={styles.nativeText}>Model: {props.modelUrl ? props.modelUrl.split('/').pop() : 'None'}</Text>
        </View>
      </View>
    );
  }

  return <FallbackView {...props} />;
};

const styles = StyleSheet.create({
  fallback: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtext: {
    color: '#ff4444',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: 'bold',
  },
  debugText: {
    color: '#888',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 20,
  },
  modelText: {
    color: '#00B4D8',
    fontSize: 12,
  },
  nativeIndicator: {
    position: 'absolute',
    top: 100,
    right: 20,
    backgroundColor: 'rgba(0, 255, 0, 0.9)',
    padding: 8,
    borderRadius: 8,
  },
  nativeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default PlatoArView;