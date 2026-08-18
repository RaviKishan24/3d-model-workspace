import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Grid, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { centerAndFit, setWireframe, toVector } from '../../utils/three';

const BACKGROUNDS = {
  dark: '#0b1220',
  slate: '#1e293b',
  light: '#e2e8f0',
};

/**
 * Lives inside the Canvas: owns the camera, the OrbitControls and every
 * imperative camera operation (reset, capture, smooth restore).
 */
function SceneContents({ object, autoRotate, wireframe, showGrid, onReady, apiRef }) {
  const controlsRef = useRef(null);
  const groupRef = useRef(null);
  const { camera } = useThree();
  const fitRef = useRef({ distance: 5, maxDim: 1 });

  // Tween state for a smooth glide to a saved view.
  const tween = useRef(null);

  const applyFit = useCallback(() => {
    const group = groupRef.current;
    const controls = controlsRef.current;
    if (!group || !controls) return;

    const fit = centerAndFit(group, camera);
    fitRef.current = fit;

    const distance = fit.distance;
    camera.position.set(distance * 0.85, distance * 0.6, distance);
    camera.near = Math.max(distance / 1000, 0.01);
    camera.far = distance * 100;
    camera.zoom = 1;
    camera.updateProjectionMatrix();

    controls.target.set(0, 0, 0);
    controls.minDistance = distance * 0.05;
    controls.maxDistance = distance * 12;
    controls.update();
  }, [camera]);

  // Re-fit whenever a different model is mounted.
  useEffect(() => {
    if (!object) return;
    applyFit();
    if (onReady) onReady();
  }, [object, applyFit, onReady]);

  useEffect(() => {
    setWireframe(object, wireframe);
  }, [object, wireframe]);

  useImperativeHandle(
    apiRef,
    () => ({
      reset: () => {
        tween.current = null;
        applyFit();
      },
      /** Snapshot used by "Save View". */
      capture: () => ({
        camera: {
          position: toVector(camera.position),
          rotation: {
            x: camera.rotation.x,
            y: camera.rotation.y,
            z: camera.rotation.z,
          },
          zoom: camera.zoom,
        },
        target: toVector(controlsRef.current ? controlsRef.current.target : new THREE.Vector3()),
      }),
      /** Restores a saved view, animating position and target. */
      restore: (state, { animate = true } = {}) => {
        const controls = controlsRef.current;
        if (!state || !controls) return;

        const targetPosition = new THREE.Vector3(
          state.camera.position.x,
          state.camera.position.y,
          state.camera.position.z
        );
        const targetTarget = new THREE.Vector3(state.target.x, state.target.y, state.target.z);
        const zoom = state.camera.zoom || 1;

        if (!animate) {
          camera.position.copy(targetPosition);
          camera.zoom = zoom;
          camera.updateProjectionMatrix();
          controls.target.copy(targetTarget);
          controls.update();
          return;
        }

        tween.current = {
          fromPosition: camera.position.clone(),
          toPosition: targetPosition,
          fromTarget: controls.target.clone(),
          toTarget: targetTarget,
          fromZoom: camera.zoom,
          toZoom: zoom,
          t: 0,
        };
      },
    }),
    [applyFit, camera]
  );

  useFrame((_, delta) => {
    const active = tween.current;
    if (!active) return;

    const controls = controlsRef.current;
    active.t = Math.min(1, active.t + delta * 1.8);
    // ease-in-out cubic
    const e = active.t < 0.5 ? 4 * active.t ** 3 : 1 - (-2 * active.t + 2) ** 3 / 2;

    camera.position.lerpVectors(active.fromPosition, active.toPosition, e);
    camera.zoom = active.fromZoom + (active.toZoom - active.fromZoom) * e;
    camera.updateProjectionMatrix();

    if (controls) {
      controls.target.lerpVectors(active.fromTarget, active.toTarget, e);
      controls.update();
    }

    if (active.t >= 1) tween.current = null;
  });

  const gridSize = Math.max(4, (fitRef.current.maxDim || 1) * 4);

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 8, 5]} intensity={1.1} />
      <directionalLight position={[-6, -3, -5]} intensity={0.35} />
      <Environment preset="city" />

      <group ref={groupRef}>{object ? <primitive object={object} /> : null}</group>

      {showGrid ? (
        <Grid
          args={[gridSize, gridSize]}
          position={[0, -(fitRef.current.maxDim || 1) * 0.5, 0]}
          cellSize={gridSize / 20}
          cellColor="#334155"
          sectionSize={gridSize / 4}
          sectionColor="#12b476"
          fadeDistance={gridSize * 3}
          infiniteGrid
        />
      ) : null}

      <OrbitControls
        ref={controlsRef}
        makeDefault
        enableDamping
        dampingFactor={0.08}
        enablePan
        enableZoom
        enableRotate
        autoRotate={autoRotate}
        autoRotateSpeed={1.2}
        // Touch: one finger orbits, two fingers pan/zoom.
        touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }}
      />
    </>
  );
}

/**
 * Canvas wrapper. Exposes { reset, capture, restore } to the page through a ref.
 */
const ModelScene = forwardRef(function ModelScene(
  { object, autoRotate = false, wireframe = false, showGrid = true, background = 'dark', onReady },
  ref
) {
  const [dpr, setDpr] = useState([1, 2]);

  const glProps = useMemo(
    () => ({ antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: false }),
    []
  );

  useEffect(() => {
    // Cap DPR on low-power devices to keep the frame rate usable.
    if (window.devicePixelRatio > 2) setDpr([1, 1.5]);
  }, []);

  // frameloop stays "always": OrbitControls damping and saved-view tweens need frames.
  return (
    <Canvas
      dpr={dpr}
      gl={glProps}
      camera={{ fov: 45, near: 0.1, far: 1000, position: [4, 3, 5] }}
      style={{ background: BACKGROUNDS[background] || BACKGROUNDS.dark }}
      frameloop="always"
    >
      <SceneContents
        object={object}
        autoRotate={autoRotate}
        wireframe={wireframe}
        showGrid={showGrid}
        onReady={onReady}
        apiRef={ref}
      />
    </Canvas>
  );
});

export default ModelScene;
