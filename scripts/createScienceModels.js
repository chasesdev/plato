const fs = require('fs');
const path = require('path');

// Create simple GLTF 2.0 files for each science model
// These are basic but valid GLTF files that will display colored shapes

function createBasicGLTF(modelType) {
  // Basic GLTF structure with simple geometry
  const gltf = {
    asset: { version: "2.0", generator: "Plato Science Model Generator" },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [],
    meshes: [],
    materials: [],
    accessors: [],
    bufferViews: [],
    buffers: []
  };

  // Define colors and geometries for each model
  switch(modelType) {
    case 'cell':
      // Create a simple sphere to represent a cell
      gltf.materials.push({
        pbrMetallicRoughness: {
          baseColorFactor: [0.5, 0.8, 0.5, 0.7], // Green, semi-transparent
          metallicFactor: 0.1,
          roughnessFactor: 0.9
        },
        alphaMode: "BLEND",
        doubleSided: true,
        name: "CellMembrane"
      });
      break;

    case 'molecule':
      // Create representation of water molecule
      gltf.materials.push({
        pbrMetallicRoughness: {
          baseColorFactor: [1.0, 0.0, 0.0, 1.0], // Red for oxygen
          metallicFactor: 0.3,
          roughnessFactor: 0.7
        },
        name: "Oxygen"
      });
      gltf.materials.push({
        pbrMetallicRoughness: {
          baseColorFactor: [1.0, 1.0, 1.0, 1.0], // White for hydrogen
          metallicFactor: 0.3,
          roughnessFactor: 0.7
        },
        name: "Hydrogen"
      });
      break;

    case 'volcano':
      // Create a cone for volcano
      gltf.materials.push({
        pbrMetallicRoughness: {
          baseColorFactor: [0.5, 0.3, 0.1, 1.0], // Brown
          metallicFactor: 0.0,
          roughnessFactor: 1.0
        },
        name: "VolcanicRock"
      });
      gltf.materials.push({
        pbrMetallicRoughness: {
          baseColorFactor: [1.0, 0.3, 0.0, 1.0], // Orange/red for lava
          metallicFactor: 0.2,
          roughnessFactor: 0.5,
          emissiveFactor: [1.0, 0.2, 0.0]
        },
        name: "Lava"
      });
      break;
  }

  // Create a simple colored sphere as placeholder
  // This creates a basic mesh with minimal geometry
  const vertices = new Float32Array([
    // Simple triangle (will be visible as a colored shape)
    0.0, 0.5, 0.0,    // top
    -0.5, -0.5, 0.0,  // bottom left
    0.5, -0.5, 0.0    // bottom right
  ]);

  const indices = new Uint16Array([0, 1, 2]);

  // Create buffer
  const vertexBuffer = Buffer.from(vertices.buffer);
  const indexBuffer = Buffer.from(indices.buffer);
  const combinedBuffer = Buffer.concat([vertexBuffer, indexBuffer]);

  gltf.buffers.push({
    byteLength: combinedBuffer.byteLength
  });

  // Vertex positions accessor
  gltf.accessors.push({
    bufferView: 0,
    componentType: 5126, // FLOAT
    count: 3,
    type: "VEC3",
    max: [0.5, 0.5, 0.0],
    min: [-0.5, -0.5, 0.0]
  });

  // Indices accessor
  gltf.accessors.push({
    bufferView: 1,
    componentType: 5123, // UNSIGNED_SHORT
    count: 3,
    type: "SCALAR"
  });

  // Buffer views
  gltf.bufferViews.push({
    buffer: 0,
    byteOffset: 0,
    byteLength: vertexBuffer.byteLength,
    target: 34962 // ARRAY_BUFFER
  });

  gltf.bufferViews.push({
    buffer: 0,
    byteOffset: vertexBuffer.byteLength,
    byteLength: indexBuffer.byteLength,
    target: 34963 // ELEMENT_ARRAY_BUFFER
  });

  // Create mesh
  gltf.meshes.push({
    primitives: [{
      attributes: { POSITION: 0 },
      indices: 1,
      material: 0
    }]
  });

  // Create node
  gltf.nodes.push({
    mesh: 0,
    scale: modelType === 'cell' ? [2, 2, 2] :
           modelType === 'molecule' ? [1, 1, 1] : [3, 3, 3]
  });

  // Convert to GLB (GLTF Binary)
  const jsonString = JSON.stringify(gltf);
  const jsonBuffer = Buffer.from(jsonString);

  // Pad JSON to 4-byte boundary
  const jsonPadding = (4 - (jsonBuffer.length % 4)) % 4;
  const jsonPaddedBuffer = Buffer.concat([
    jsonBuffer,
    Buffer.alloc(jsonPadding, ' ')
  ]);

  // Pad binary to 4-byte boundary
  const binPadding = (4 - (combinedBuffer.length % 4)) % 4;
  const binPaddedBuffer = Buffer.concat([
    combinedBuffer,
    Buffer.alloc(binPadding, 0)
  ]);

  // Create GLB header
  const glbHeader = Buffer.alloc(12);
  glbHeader.writeUInt32LE(0x46546C67, 0); // magic "glTF"
  glbHeader.writeUInt32LE(2, 4); // version
  glbHeader.writeUInt32LE(28 + jsonPaddedBuffer.length + binPaddedBuffer.length, 8); // total length

  // Create JSON chunk header
  const jsonChunkHeader = Buffer.alloc(8);
  jsonChunkHeader.writeUInt32LE(jsonPaddedBuffer.length, 0);
  jsonChunkHeader.writeUInt32LE(0x4E4F534A, 4); // "JSON"

  // Create BIN chunk header
  const binChunkHeader = Buffer.alloc(8);
  binChunkHeader.writeUInt32LE(binPaddedBuffer.length, 0);
  binChunkHeader.writeUInt32LE(0x004E4942, 4); // "BIN\0"

  // Combine all parts
  return Buffer.concat([
    glbHeader,
    jsonChunkHeader,
    jsonPaddedBuffer,
    binChunkHeader,
    binPaddedBuffer
  ]);
}

// Generate models
const models = ['cell', 'molecule', 'volcano'];
const outputDir = path.join(__dirname, '..', 'public', 'models');

models.forEach(modelName => {
  const glbData = createBasicGLTF(modelName);
  const outputPath = path.join(outputDir, `${modelName}.glb`);

  // Backup existing file
  const backupPath = path.join(outputDir, `${modelName}.glb.backup`);
  if (fs.existsSync(outputPath)) {
    fs.copyFileSync(outputPath, backupPath);
    console.log(`Backed up existing ${modelName}.glb to ${modelName}.glb.backup`);
  }

  // Write new file
  fs.writeFileSync(outputPath, glbData);
  console.log(`Created ${modelName}.glb (${glbData.length} bytes)`);
});

console.log('\nScience models created successfully!');
console.log('Note: These are basic placeholder models. For better models:');
console.log('1. Open http://localhost:3000/export-models.html in your browser');
console.log('2. Click each export button to download detailed Three.js models');
console.log('3. Or download free science models from Sketchfab');