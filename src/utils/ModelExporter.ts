import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter';
import { createCell, createWaterMolecule, createVolcano } from '../models/ScienceModels';

export const exportModelsAsGLB = async () => {
  const exporter = new GLTFExporter();

  const models = {
    cell: createCell(),
    molecule: createWaterMolecule(),
    volcano: createVolcano()
  };

  const exports: { [key: string]: Blob } = {};

  for (const [name, model] of Object.entries(models)) {
    // Create a scene for export
    const scene = new THREE.Scene();
    scene.add(model);

    // Add basic lighting for the export
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Export as GLB (binary GLTF)
    const glb = await new Promise<Blob>((resolve, reject) => {
      exporter.parse(
        scene,
        (result) => {
          if (result instanceof ArrayBuffer) {
            resolve(new Blob([result], { type: 'model/gltf-binary' }));
          } else {
            reject(new Error('Expected ArrayBuffer from GLTFExporter'));
          }
        },
        (error) => reject(error),
        { binary: true }
      );
    });

    exports[name] = glb;
  }

  return exports;
};

// Helper function to download the GLB files (for development)
export const downloadGLB = (blob: Blob, filename: string) => {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
};