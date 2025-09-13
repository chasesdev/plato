import * as THREE from 'three';

export const createCell = (): THREE.Group => {
  const cell = new THREE.Group();
  
  // Nucleus (Amplify purple center)
  const nucleus = new THREE.Mesh(
    new THREE.SphereGeometry(0.3, 32, 16),
    new THREE.MeshPhongMaterial({ color: 0x7209B7 })
  );
  nucleus.name = 'nucleus';
  
  // Cell membrane (Amplify cyan translucent outer layer)
  const membrane = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 32, 16),
    new THREE.MeshPhongMaterial({ 
      color: 0x00B4D8, 
      transparent: true, 
      opacity: 0.3 
    })
  );
  membrane.name = 'membrane';
  
  // Mitochondria (Amplify success green organelles)
  for (let i = 0; i < 5; i++) {
    const mitochondrion = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.05, 0.1, 8, 16),
      new THREE.MeshPhongMaterial({ color: 0x52B788 })
    );
    mitochondrion.position.set(
      (Math.random() - 0.5) * 0.4,
      (Math.random() - 0.5) * 0.4,
      (Math.random() - 0.5) * 0.4
    );
    mitochondrion.name = `mitochondrion-${i}`;
    cell.add(mitochondrion);
  }
  
  // Endoplasmic reticulum (Amplify primary blue ribbons)
  const erGeometry = new THREE.TorusGeometry(0.2, 0.02, 8, 20);
  const erMaterial = new THREE.MeshPhongMaterial({ color: 0x0F4C81 });
  const er = new THREE.Mesh(erGeometry, erMaterial);
  er.rotation.x = Math.PI / 4;
  er.name = 'endoplasmic-reticulum';
  cell.add(er);
  
  cell.add(nucleus, membrane);
  return cell;
};

export const createWaterMolecule = (): THREE.Group => {
  const molecule = new THREE.Group();
  
  // Oxygen atom (red, larger)
  const oxygen = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 32, 16),
    new THREE.MeshPhongMaterial({ 
      color: 0xFF0000,
      emissive: 0xFF0000,
      emissiveIntensity: 0.1
    })
  );
  oxygen.name = 'oxygen';
  
  // Hydrogen atoms (white, smaller)
  const h1 = new THREE.Mesh(
    new THREE.SphereGeometry(0.1, 32, 16),
    new THREE.MeshPhongMaterial({ 
      color: 0xFFFFFF,
      emissive: 0xFFFFFF,
      emissiveIntensity: 0.1
    })
  );
  // Position at 104.5 degree angle
  h1.position.set(0.3, 0.2, 0);
  h1.name = 'hydrogen-1';
  
  const h2 = h1.clone();
  h2.position.set(-0.3, 0.2, 0);
  h2.name = 'hydrogen-2';
  
  // Covalent bonds (gray cylinders)
  const bondGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.35);
  const bondMaterial = new THREE.MeshPhongMaterial({ 
    color: 0x666666,
    emissive: 0x333333,
    emissiveIntensity: 0.2
  });
  
  const bond1 = new THREE.Mesh(bondGeometry, bondMaterial);
  bond1.position.set(0.15, 0.1, 0);
  bond1.rotation.z = -Math.PI / 6;
  bond1.name = 'bond-1';
  
  const bond2 = bond1.clone();
  bond2.position.set(-0.15, 0.1, 0);
  bond2.rotation.z = Math.PI / 6;
  bond2.name = 'bond-2';
  
  molecule.add(oxygen, h1, h2, bond1, bond2);
  return molecule;
};

export const createVolcano = (): THREE.Group => {
  const volcano = new THREE.Group();
  
  // Mountain cone (brown)
  const coneGeometry = new THREE.ConeGeometry(1, 1.5, 32, 1, true);
  const coneMaterial = new THREE.MeshPhongMaterial({ 
    color: 0x8B4513,
    side: THREE.DoubleSide
  });
  const cone = new THREE.Mesh(coneGeometry, coneMaterial);
  cone.position.y = 0.75;
  cone.name = 'mountain';
  
  // Magma chamber (glowing orange-red)
  const chamberGeometry = new THREE.SphereGeometry(0.4, 32, 16);
  const chamberMaterial = new THREE.MeshPhongMaterial({ 
    color: 0xFF4500,
    emissive: 0xFF0000,
    emissiveIntensity: 0.5
  });
  const chamber = new THREE.Mesh(chamberGeometry, chamberMaterial);
  chamber.position.y = -0.2;
  chamber.name = 'magma-chamber';
  
  // Lava conduit (glowing red cylinder)
  const conduitGeometry = new THREE.CylinderGeometry(0.1, 0.2, 1.5);
  const conduitMaterial = new THREE.MeshPhongMaterial({ 
    color: 0xFF6347,
    emissive: 0xFF0000,
    emissiveIntensity: 0.3
  });
  const conduit = new THREE.Mesh(conduitGeometry, conduitMaterial);
  conduit.position.y = 0.5;
  conduit.name = 'lava-conduit';
  
  // Add tectonic plates (simplified)
  const plateGeometry = new THREE.BoxGeometry(2, 0.2, 1);
  const plateMaterial = new THREE.MeshPhongMaterial({ color: 0x654321 });
  
  const plate1 = new THREE.Mesh(plateGeometry, plateMaterial);
  plate1.position.set(-0.5, -0.5, 0);
  plate1.rotation.z = 0.1;
  plate1.name = 'tectonic-plate-1';
  
  const plate2 = new THREE.Mesh(plateGeometry, plateMaterial);
  plate2.position.set(0.5, -0.5, 0);
  plate2.rotation.z = -0.1;
  plate2.name = 'tectonic-plate-2';
  
  volcano.add(cone, chamber, conduit, plate1, plate2);
  return volcano;
};

// Animation functions
export const animateCell = (cell: THREE.Group, time: number): void => {
  // Gentle rotation
  cell.rotation.y = Math.sin(time * 0.001) * 0.1;
  
  // Pulsing nucleus
  const nucleus = cell.getObjectByName('nucleus') as THREE.Mesh;
  if (nucleus) {
    nucleus.scale.setScalar(1 + Math.sin(time * 0.002) * 0.05);
  }
  
  // Floating mitochondria
  for (let i = 0; i < 5; i++) {
    const mito = cell.getObjectByName(`mitochondrion-${i}`) as THREE.Mesh;
    if (mito) {
      mito.position.y += Math.sin(time * 0.003 + i) * 0.001;
    }
  }
};

export const animateWaterMolecule = (molecule: THREE.Group, time: number): void => {
  // Vibration simulation
  molecule.rotation.y += 0.01;
  molecule.rotation.z = Math.sin(time * 0.002) * 0.1;
  
  // Slight bond stretching
  const h1 = molecule.getObjectByName('hydrogen-1') as THREE.Mesh;
  const h2 = molecule.getObjectByName('hydrogen-2') as THREE.Mesh;
  if (h1 && h2) {
    const stretch = 1 + Math.sin(time * 0.005) * 0.02;
    h1.position.x = 0.3 * stretch;
    h2.position.x = -0.3 * stretch;
  }
};

export const animateVolcano = (volcano: THREE.Group, time: number): void => {
  // Simulate magma movement
  const chamber = volcano.getObjectByName('magma-chamber') as THREE.Mesh;
  if (chamber && chamber.material instanceof THREE.MeshPhongMaterial) {
    chamber.material.emissiveIntensity = 0.5 + Math.sin(time * 0.003) * 0.3;
  }
  
  // Tectonic plate movement
  const plate1 = volcano.getObjectByName('tectonic-plate-1') as THREE.Mesh;
  const plate2 = volcano.getObjectByName('tectonic-plate-2') as THREE.Mesh;
  if (plate1 && plate2) {
    plate1.position.x = -0.5 + Math.sin(time * 0.001) * 0.02;
    plate2.position.x = 0.5 - Math.sin(time * 0.001) * 0.02;
  }
};