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

try {
  // This matches the name registered in Swift: View(PlatoArView.self)
  NativeView = requireNativeViewManager('PlatoArView');
} catch (error) {
  console.warn('PlatoArView: Native module not available, using fallback view');
}

// Fallback view for when native module isn't available
const FallbackView: React.FC<PlatoArViewProps> = (props) => {
  return (
    <View {...props} style={[styles.fallback, props.style]}>
      <Text style={styles.text}>🎯 AR View</Text>
      <Text style={styles.subtext}>
        {Platform.OS === 'ios'
          ? 'Native AR module loading...'
          : 'AR not supported on this platform'}
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
    } else {
      console.log('Using fallback view - native module not available');
    }
  }, []);

  // Use native view if available, otherwise use fallback
  if (NativeView) {
    return <NativeView ref={viewRef} {...props} />;
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
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  modelText: {
    color: '#00B4D8',
    fontSize: 12,
  },
});

export default PlatoArView;