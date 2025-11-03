import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import * as THREE from 'three';

const FBXCharacter = ({ hasEmail, hasPassword }) => {
  const groupRef = useRef();
  const modelRef = useRef(null);
  const mixerRef = useRef(null);
  const meshRefs = useRef([]);
  const danceTime = useRef(0);
  const sneakyTime = useRef(0);
  
  const [model, setModel] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFBX = () => {
      const loader = new FBXLoader();
      
      loader.load(
        '/character.fbx',
        (object) => {
          console.log('FBX loaded, processing materials...');
          
          // Store all meshes
          meshRefs.current = [];
          
          // Aggressively replace ALL materials with bright unlit material
          let meshCount = 0;
          object.traverse((child) => {
            if (child.isMesh) {
              meshCount++;
              console.log(`Processing mesh ${meshCount}:`, child.name, 'Material:', child.material?.type || 'none');
              meshRefs.current.push(child);

              const brightMaterial = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                side: THREE.DoubleSide,
                transparent: false,
                opacity: 1.0,
                fog: false
              });

              if (child.material) {
                const oldMat = Array.isArray(child.material) ? child.material[0] : child.material;
                if (oldMat && oldMat.map) {
                  brightMaterial.map = oldMat.map;
                  brightMaterial.map.needsUpdate = true;
                  brightMaterial.color.setHex(0xffffff);
                  console.log('Preserved texture for:', child.name);
                }
              }
              
              // Replace material immediately
              child.material = brightMaterial;
              child.material.needsUpdate = true;
              child.visible = true;
              child.castShadow = false;
              child.receiveShadow = false;
              
              // Force geometry update
              if (child.geometry) {
                child.geometry.computeBoundingBox();
                child.geometry.computeBoundingSphere();
              }
              
              console.log('Material replaced for:', child.name, 'Visible:', child.visible);
            }
          });
          
          console.log(`Total meshes processed: ${meshCount}`);
          
          // Compute bounding box for entire model
          const box = new THREE.Box3().setFromObject(object);
          const size = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());
          console.log('Model bounding box - Size:', size, 'Center:', center);
          
          // Scale the model
          object.scale.setScalar(0.01);
          object.position.set(0, 0, 0);
          object.updateMatrixWorld(true);
          
          // Set up animation mixer if animations exist
          if (object.animations && object.animations.length > 0) {
            mixerRef.current = new THREE.AnimationMixer(object);
            const action = mixerRef.current.clipAction(object.animations[0]);
            action.play();
            console.log('FBX animations loaded:', object.animations.length);
          }
          
          modelRef.current = object;
          setModel(object);
          setLoading(false);
          console.log('FBX model loaded successfully. Total meshes:', meshRefs.current.length);
        },
        (progress) => {
          const percent = (progress.loaded / progress.total) * 100;
          console.log('Loading FBX:', percent.toFixed(2) + '%');
        },
        (error) => {
          console.error('FBX loading error:', error);
          setError('Failed to load character.fbx. Check console for details.');
          setLoading(false);
        }
      );
    };
    
    loadFBX();
  }, []);

  // Force update materials on every frame (last resort)
  useFrame(() => {
    if (meshRefs.current.length > 0) {
      meshRefs.current.forEach((mesh) => {
        if (mesh.material) {
          // Ensure material is always bright
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach(mat => {
              if (mat && !(mat instanceof THREE.MeshBasicMaterial)) {
                const newMat = new THREE.MeshBasicMaterial({
                  color: 0xffffff,
                  side: THREE.DoubleSide
                });
                mesh.material = newMat;
              }
            });
          } else if (!(mesh.material instanceof THREE.MeshBasicMaterial)) {
            mesh.material = new THREE.MeshBasicMaterial({
              color: 0xffffff,
              side: THREE.DoubleSide
            });
          }
          mesh.material.needsUpdate = true;
          mesh.visible = true;
        }
      });
    }
  });

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Update animation mixer
    if (mixerRef.current) {
      mixerRef.current.update(delta);
    }

    // Apply custom animations based on state
    if (hasEmail && !hasPassword) {
      danceTime.current += delta * 2;
      groupRef.current.position.y = Math.sin(danceTime.current) * 0.4;
      
      if (groupRef.current) {
        groupRef.current.rotation.y = Math.sin(danceTime.current * 1.5) * 0.3;
      }
      sneakyTime.current = 0;
    } else if (hasPassword) {
      sneakyTime.current += delta * 2;
      const nodAmount = Math.sin(sneakyTime.current * 3) * 0.2;
      
      groupRef.current.position.y = -0.2 + Math.sin(sneakyTime.current * 0.5) * 0.05;
      
      if (groupRef.current) {
        groupRef.current.rotation.x = Math.PI / 6 + nodAmount;
        groupRef.current.rotation.y = Math.sin(sneakyTime.current * 0.8) * 0.3 + Math.PI / 8;
      }
      danceTime.current = 0;
    } else {
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.08;
      groupRef.current.rotation.set(0, 0, 0);
    }
  });

  // Loading state
  if (loading) {
    return (
      <group ref={groupRef} position={[0, -0.3, 0]} scale={[1.2, 1.2, 1.2]}>
        <mesh>
          <boxGeometry args={[0.5, 1, 0.3]} />
          <meshBasicMaterial color="#4ECDC4" />
        </mesh>
        <mesh position={[0, 0.6, 0]}>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshBasicMaterial color="#ffdbac" />
        </mesh>
      </group>
    );
  }

  // Error state
  if (error) {
    return (
      <group ref={groupRef} position={[0, -0.3, 0]} scale={[1.2, 1.2, 1.2]}>
        <mesh>
          <boxGeometry args={[0.5, 1, 0.3]} />
          <meshBasicMaterial color="#ff6b6b" />
        </mesh>
      </group>
    );
  }

  // Render loaded model
  if (!model) {
    return null;
  }

  return (
    <group ref={groupRef} position={[0, -0.3, 0]} scale={[1.2, 1.2, 1.2]}>
      {/* Debug: Show bounding box */}
      {model && (
        <mesh>
          <boxGeometry args={[2, 2, 2]} />
          <meshBasicMaterial color={0xff0000} wireframe opacity={0.3} transparent />
        </mesh>
      )}
      <primitive object={model} dispose={null} />
      
      {/* Maximum Lighting */}
      <ambientLight intensity={5} color="#ffffff" />
      <directionalLight 
        position={[5, 10, 5]} 
        intensity={5} 
        color="#ffffff"
      />
      <directionalLight 
        position={[-5, 8, -5]} 
        intensity={4} 
        color="#ffffff"
      />
      <pointLight 
        position={[0, 5, 5]} 
        intensity={5} 
        color="#ffffff"
        distance={50}
      />
      <pointLight 
        position={[0, 0, 5]} 
        intensity={4} 
        color="#ffffff"
        distance={50}
      />
      <pointLight 
        position={[5, 3, 0]} 
        intensity={3} 
        color="#ffffff"
        distance={40}
      />
      <pointLight 
        position={[-5, 3, 0]} 
        intensity={3} 
        color="#ffffff"
        distance={40}
      />
      <spotLight 
        position={[0, 10, 3]} 
        angle={Math.PI / 2} 
        penumbra={0.5} 
        intensity={5}
        color="#ffffff"
      />
      <hemisphereLight 
        skyColor={0xffffff} 
        groundColor={0xffffff} 
        intensity={3}
      />
    </group>
  );
};

export default FBXCharacter;
