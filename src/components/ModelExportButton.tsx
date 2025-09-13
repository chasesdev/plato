import React from 'react';
import { exportModelsAsGLB, downloadGLB } from '../utils/ModelExporter';

const ModelExportButton: React.FC = () => {
  const handleExport = async () => {
    try {
      console.log('Starting model export...');
      const models = await exportModelsAsGLB();

      // Download each model
      for (const [name, blob] of Object.entries(models)) {
        downloadGLB(blob, `${name}.glb`);
        console.log(`Exported ${name}.glb`);
      }

      alert('Models exported! Check your downloads folder.');
    } catch (error) {
      console.error('Error exporting models:', error);
      alert('Error exporting models. Check console for details.');
    }
  };

  return (
    <button
      onClick={handleExport}
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        padding: '10px 20px',
        backgroundColor: '#0F4C81',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '600',
        zIndex: 1000,
        display: 'none' // Hidden by default, enable for development
      }}
    >
      Export Models as GLB
    </button>
  );
};

export default ModelExportButton;