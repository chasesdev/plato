import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
// @ts-ignore - OrbitControls doesn't have TypeScript definitions in this version
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { 
  createCell, 
  createWaterMolecule, 
  createVolcano,
  animateCell,
  animateWaterMolecule,
  animateVolcano
} from '../models/ScienceModels';

interface ARViewProps {
  currentModel: 'cell' | 'molecule' | 'volcano';
  onInteraction: (interaction: string) => void;
}

const ARView: React.FC<ARViewProps> = ({ currentModel, onInteraction }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationIdRef = useRef<number>();
  const [isARSupported, setIsARSupported] = useState(false);

  useEffect(() => {
    if (!mountRef.current) return;

    // Initialize Three.js scene with Amplify neutral background
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xF8F9FA); // Amplify gray-100
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 3;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true 
    });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    mountRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -10;
    directionalLight.shadow.camera.right = 10;
    directionalLight.shadow.camera.top = 10;
    directionalLight.shadow.camera.bottom = -10;
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0xffffff, 0.5);
    pointLight.position.set(-5, 3, -5);
    scene.add(pointLight);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.minDistance = 1;
    controls.maxDistance = 10;

    // Add interaction listeners
    controls.addEventListener('change', () => {
      onInteraction(`Rotated model to view from different angle`);
    });

    // Raycaster for click interactions
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleClick = (event: MouseEvent) => {
      const bounds = mountRef.current?.getBoundingClientRect();
      if (!bounds) return;

      mouse.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
      mouse.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      if (modelRef.current) {
        const intersects = raycaster.intersectObjects(modelRef.current.children, true);
        if (intersects.length > 0) {
          const clickedObject = intersects[0].object;
          onInteraction(`Clicked on ${clickedObject.name || 'model part'}`);
          
          // Visual feedback
          if (clickedObject instanceof THREE.Mesh) {
            // Store original color for potential future use
            // const originalColor = (clickedObject.material as THREE.MeshPhongMaterial).color.getHex();
            (clickedObject.material as THREE.MeshPhongMaterial).emissive = new THREE.Color(0xffff00);
            (clickedObject.material as THREE.MeshPhongMaterial).emissiveIntensity = 0.5;
            setTimeout(() => {
              (clickedObject.material as THREE.MeshPhongMaterial).emissiveIntensity = 0;
            }, 300);
          }
        }
      }
    };

    renderer.domElement.addEventListener('click', handleClick);

    // Check for WebXR support
    if ('xr' in navigator) {
      (navigator as any).xr?.isSessionSupported('immersive-ar').then((supported: boolean) => {
        setIsARSupported(supported);
        if (supported) {
          renderer.xr.enabled = true;
        }
      });
    }

    // Animation loop
    const clock = new THREE.Clock();
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      
      const time = clock.getElapsedTime() * 1000;
      
      // Animate current model
      if (modelRef.current) {
        switch (currentModel) {
          case 'cell':
            animateCell(modelRef.current, time);
            break;
          case 'molecule':
            animateWaterMolecule(modelRef.current, time);
            break;
          case 'volcano':
            animateVolcano(modelRef.current, time);
            break;
        }
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!mountRef.current) return;
      
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      renderer.domElement.removeEventListener('click', handleClick);
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      renderer.dispose();
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, [onInteraction]);

  // Update model when currentModel changes
  useEffect(() => {
    if (!sceneRef.current) return;

    // Remove old model
    if (modelRef.current) {
      sceneRef.current.remove(modelRef.current);
      modelRef.current = null;
    }

    // Add new model
    let newModel: THREE.Group;
    switch (currentModel) {
      case 'cell':
        newModel = createCell();
        onInteraction('Loaded cell model');
        break;
      case 'molecule':
        newModel = createWaterMolecule();
        onInteraction('Loaded water molecule model');
        break;
      case 'volcano':
        newModel = createVolcano();
        onInteraction('Loaded volcano model');
        break;
      default:
        return;
    }

    newModel.castShadow = true;
    newModel.receiveShadow = true;
    modelRef.current = newModel;
    sceneRef.current.add(newModel);
  }, [currentModel, onInteraction]);

  return (
    <div className="ar-container-wrapper">
      <div ref={mountRef} className="ar-container" />
      {isARSupported && (
        <button className="ar-button" onClick={() => {
          // AR session would be started here
          onInteraction('Attempted to start AR session');
        }}>
          🥽 Enter AR
        </button>
      )}
      <div className="ar-instructions">
        🖱️ Click and drag to rotate • Scroll to zoom • Click parts to interact
      </div>
    </div>
  );
};

export default ARView;