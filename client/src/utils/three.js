import * as THREE from 'three';

/**
 * Centers an object at the origin and returns the camera placement that fits
 * the whole model in view. Uploaded models vary wildly in scale and origin,
 * so this is what makes the initial view sensible for every file.
 */
export function centerAndFit(object, camera, { fovPadding = 1.5 } = {}) {
  const box = new THREE.Box3().setFromObject(object);

  if (box.isEmpty()) {
    return { center: new THREE.Vector3(), size: new THREE.Vector3(), distance: 5 };
  }

  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());

  // Shift geometry so the model's centre sits at the world origin.
  object.position.sub(center);

  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  const fov = ((camera?.fov || 45) * Math.PI) / 180;
  const distance = (maxDim / (2 * Math.tan(fov / 2))) * fovPadding;

  return { center, size, maxDim, distance };
}

/** Fully releases GPU memory for a loaded model. */
export function disposeObject(object) {
  if (!object) return;

  object.traverse((child) => {
    if (child.geometry) child.geometry.dispose();

    const materials = Array.isArray(child.material)
      ? child.material
      : child.material
        ? [child.material]
        : [];

    materials.forEach((material) => {
      Object.values(material).forEach((value) => {
        if (value && value.isTexture) value.dispose();
      });
      material.dispose();
    });
  });
}

/** Applies or removes wireframe rendering across every mesh material. */
export function setWireframe(object, enabled) {
  if (!object) return;
  object.traverse((child) => {
    const materials = Array.isArray(child.material)
      ? child.material
      : child.material
        ? [child.material]
        : [];
    materials.forEach((material) => {
      if ('wireframe' in material) material.wireframe = enabled;
    });
  });
}

export const toVector = (v) => ({ x: v.x, y: v.y, z: v.z });
