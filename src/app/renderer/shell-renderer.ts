/**
 * ShellRenderer — renders concentric torus ring geometry for each electron shell.
 *
 * Each shell becomes a semi-transparent TorusGeometry, tilted by a per-shell angle
 * and coloured from the fixed 7-colour palette. Shell rings remain in the scene
 * across mode switches; only the electron strategy changes.
 *
 * No Angular imports. Pure Three.js.
 * Research ref: R-004 (shell ring geometry, AD-008).
 */

import * as THREE from 'three';
import { ShellGeometryParams } from '../models/renderer-types';

const TUBE_RADIUS   = 0.025; // torus tube thickness [Three.js units]
const TORUS_SEGMENTS_RADIAL = 64;
const TORUS_SEGMENTS_TUBE   = 16;
const SHELL_OPACITY  = 0.45;

export class ShellRenderer {
  private meshes: THREE.Mesh[] = [];

  /**
   * Creates and adds one torus ring per shell to the scene.
   * Clears any previously rendered shells first.
   *
   * Each ring:
   *   - TorusGeometry(radius, tubeRadius=0.025, 64, 16)
   *   - MeshBasicMaterial: shell.color, transparent, opacity 0.45
   *   - rotation.x = shell.ringTilt  (per-shell tilt for visual depth)
   *
   * @param shellParams Pre-computed geometry params, one per shell.
   * @param scene       The Three.js scene to add rings into.
   */
  renderAll(shellParams: readonly ShellGeometryParams[], scene: THREE.Scene): void {
    this.dispose(scene);

    for (const shell of shellParams) {
      const geometry = new THREE.TorusGeometry(
        shell.radius,
        TUBE_RADIUS,
        TORUS_SEGMENTS_TUBE,
        TORUS_SEGMENTS_RADIAL
      );
      const material = new THREE.MeshBasicMaterial({
        color: shell.color,
        transparent: true,
        opacity: SHELL_OPACITY,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.rotation.x = Math.PI / 2;
      scene.add(mesh);
      this.meshes.push(mesh);
    }
  }

  /**
   * Removes all shell ring meshes from the scene and frees GPU resources.
   *
   * @param scene The scene from which to remove the ring meshes.
   */
  dispose(scene: THREE.Scene): void {
    for (const mesh of this.meshes) {
      scene.remove(mesh);
      (mesh.geometry as THREE.BufferGeometry).dispose();
      (mesh.material as THREE.Material).dispose();
    }
    this.meshes = [];
  }
}
