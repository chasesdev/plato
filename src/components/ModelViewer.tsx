import React, { useEffect, useRef } from 'react';
import '@google/model-viewer';

// Extend JSX to include model-viewer element
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          src?: string;
          'ios-src'?: string;
          alt?: string;
          ar?: boolean;
          'ar-modes'?: string;
          'camera-controls'?: boolean;
          'auto-rotate'?: boolean;
          'shadow-intensity'?: string;
          'shadow-softness'?: string;
          loading?: string;
          reveal?: string;
          'interaction-prompt'?: string;
          'max-field-of-view'?: string;
          'min-field-of-view'?: string;
          style?: React.CSSProperties;
        },
        HTMLElement
      >;
    }
  }
}

interface ModelViewerProps {
  currentModel: 'cell' | 'molecule' | 'volcano';
  onInteraction: (interaction: string) => void;
}

const ModelViewer: React.FC<ModelViewerProps> = ({ currentModel, onInteraction }) => {
  const viewerRef = useRef<HTMLElement>(null);

  // For now, we'll use placeholder paths - we'll generate actual models next
  const modelPaths = {
    cell: {
      glb: '/models/cell.glb',
      usdz: '/models/cell.usdz',
      alt: 'Interactive 3D model of a biological cell showing nucleus, membrane, and organelles'
    },
    molecule: {
      glb: '/models/molecule.glb',
      usdz: '/models/molecule.usdz',
      alt: 'Interactive 3D model of a water molecule (H2O) showing hydrogen and oxygen atoms'
    },
    volcano: {
      glb: '/models/volcano.glb',
      usdz: '/models/volcano.usdz',
      alt: 'Interactive 3D model of an erupting volcano with lava flow'
    }
  };

  const model = modelPaths[currentModel];

  useEffect(() => {
    if (!viewerRef.current) return;

    const viewer = viewerRef.current as any;

    // Add event listeners for interactions
    const handleLoad = () => {
      onInteraction(`Loaded ${currentModel} model`);
    };

    const handleProgress = (event: any) => {
      const progress = event.detail.totalProgress;
      if (progress === 1) {
        onInteraction(`${currentModel} model fully loaded`);
      }
    };

    const handleCameraChange = () => {
      onInteraction(`Rotated ${currentModel} model to view from different angle`);
    };

    const handleModelVisibility = () => {
      onInteraction(`Interacted with ${currentModel} model`);
    };

    viewer.addEventListener('load', handleLoad);
    viewer.addEventListener('progress', handleProgress);
    viewer.addEventListener('camera-change', handleCameraChange);
    viewer.addEventListener('model-visibility', handleModelVisibility);

    return () => {
      viewer.removeEventListener('load', handleLoad);
      viewer.removeEventListener('progress', handleProgress);
      viewer.removeEventListener('camera-change', handleCameraChange);
      viewer.removeEventListener('model-visibility', handleModelVisibility);
    };
  }, [currentModel, onInteraction]);

  return (
    <div className="model-viewer-container" style={{ width: '100%', height: '100%' }}>
      <model-viewer
        ref={viewerRef}
        src={model.glb}
        ios-src={model.usdz}
        alt={model.alt}
        ar
        ar-modes="webxr scene-viewer quick-look"
        camera-controls
        auto-rotate
        shadow-intensity="1"
        shadow-softness="1"
        loading="eager"
        reveal="auto"
        interaction-prompt="auto"
        max-field-of-view="60deg"
        min-field-of-view="25deg"
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#F8F9FA',
          borderRadius: '12px'
        }}
      >
        <button
          slot="ar-button"
          style={{
            backgroundColor: '#00B4D8',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            position: 'absolute',
            bottom: '16px',
            right: '16px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}
        >
          🥽 View in AR
        </button>

        <div slot="progress-bar" className="progress-bar">
          <div className="update-bar"></div>
        </div>
      </model-viewer>

      <style>{`
        .progress-bar {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: rgba(0, 0, 0, 0.1);
        }

        .update-bar {
          height: 100%;
          background: #00B4D8;
          transition: width 0.3s;
        }

        model-viewer::part(default-progress-bar) {
          display: none;
        }

        model-viewer::part(default-ar-button) {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default ModelViewer;