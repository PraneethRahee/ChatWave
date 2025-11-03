import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import AnimatedCharacter from './AnimatedCharacter';

const GLTFCharacter = ({ hasEmail, hasPassword }) => {
  const groupRef = useRef();
  const mixerRef = useRef(null);
  const meshRefs = useRef([]);
  const danceTime = useRef(0);
  const sneakyTime = useRef(0);
  
  const [model, setModel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Your FBX file is version 6100 which is NOT supported by Three.js
    // Three.js FBXLoader only supports older FBX versions (7200, 7400, etc.)
    
    // Solution: Convert FBX to GLTF/GLB format
    // Option 1: Online converter - https://products.aspose.app/3d/conversion/fbx-to-gltf
    // Option 2: Blender - File > Export > glTF 2.0 (.glb/.gltf) 
    // Option 3: Download GLTF directly from Mixamo instead of FBX
    
    // For now, we'll use the AnimatedCharacter as fallback
    // Once you convert to GLTF/GLB, you can use useGLTF hook from @react-three/drei
    setLoading(false);
  }, []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

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

  // Use the procedural AnimatedCharacter as fallback since FBX version is not supported
  // To use a 3D model:
  // 1. Convert character.fbx to character.glb using https://products.aspose.app/3d/conversion/fbx-to-gltf
  // 2. Place character.glb in the public/ folder
  // 3. Replace this component with GLTF loading code
  
  return <AnimatedCharacter hasEmail={hasEmail} hasPassword={hasPassword} />;
};

export default GLTFCharacter;
