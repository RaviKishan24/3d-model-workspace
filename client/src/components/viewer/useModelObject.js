import { useEffect, useState } from 'react';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import * as THREE from 'three';
import { disposeObject } from '../../utils/three';

const DEFAULT_MATERIAL = new THREE.MeshStandardMaterial({
  color: 0xb8c4d4,
  metalness: 0.15,
  roughness: 0.6,
});

/**
 * Loads a .glb/.gltf/.obj from a presigned URL and disposes every geometry,
 * material and texture on unmount or URL change.
 */
export function useModelObject(url, fileType) {
  const [object, setObject] = useState(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!url) return undefined;

    let cancelled = false;
    let loaded = null;
    let draco = null;

    setObject(null);
    setError('');
    setProgress(0);

    let loader;
    if (fileType === 'obj') {
      loader = new OBJLoader();
    } else {
      loader = new GLTFLoader();
      draco = new DRACOLoader();
      draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
      loader.setDRACOLoader(draco);
    }

    loader.load(
      url,
      (result) => {
        if (cancelled) {
          disposeObject(result.scene || result);
          return;
        }

        loaded = result.scene || result;

        loaded.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = false;
            child.receiveShadow = false;
            // OBJ files carry no material when there is no .mtl sidecar.
            if (!child.material) child.material = DEFAULT_MATERIAL.clone();
          }
        });

        setObject(loaded);
      },
      (event) => {
        if (!cancelled && event.total) {
          setProgress(Math.round((event.loaded / event.total) * 100));
        }
      },
      (err) => {
        if (cancelled) return;
        // eslint-disable-next-line no-console
        console.error('Model load failed', err);
        setError('This model could not be loaded. The file may be corrupt or unsupported.');
      }
    );

    return () => {
      cancelled = true;
      if (draco) draco.dispose();
      if (loaded) disposeObject(loaded);
    };
  }, [url, fileType]);

  return { object, progress, error };
}

export default useModelObject;
