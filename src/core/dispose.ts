import * as THREE from 'three';

export function disposeMaterial(material: THREE.Material | THREE.Material[]) {
  const list = Array.isArray(material) ? material : [material];
  for (const mat of list) {
    for (const value of Object.values(mat)) {
      if (value && typeof value === 'object' && 'isTexture' in value && value.isTexture) {
        (value as THREE.Texture).dispose();
      }
    }
    mat.dispose();
  }
}

export function disposeObject3D(root: THREE.Object3D | null | undefined) {
  if (!root) return;
  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (mesh.geometry) {
      mesh.geometry.dispose();
    }
    if (mesh.material) {
      disposeMaterial(mesh.material);
    }
  });
}
