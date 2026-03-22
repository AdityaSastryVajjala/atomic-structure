/**
 * NucleusRenderer — renders a capped cluster of nucleon spheres into a Three.js scene.
 *
 * Uses the Fibonacci lattice to uniformly distribute up to 20 sphere positions on a
 * small sphere (radius 0.45 units), split proportionally between proton and neutron
 * sphere counts. Protons are warm orange; neutrons are cool grey.
 *
 * The total display count is capped at 20 regardless of actual nucleon count (AD-006).
 * A disclaimer label ("Nucleus (simplified)") is rendered as an HTML overlay by the
 * host component (FR-005) — not managed here.
 *
 * No Angular imports. Pure Three.js.
 * Research ref: R-006 (nucleus rendering).
 */

import * as THREE from 'three';
import { NucleusParams } from '../models/renderer-types';

const NUCLEUS_RADIUS = 0.45;   // sphere radius of the nucleon cluster [Three.js units]
const NUCLEON_RADIUS = 0.09;   // radius of each individual nucleon sphere
const PROTON_COLOR   = 0xe8855a; // warm orange
const NEUTRON_COLOR  = 0x90a4ae; // cool blue-grey

/** Shared geometries — created once, reused for every element. */
const nucleonGeometry = new THREE.SphereGeometry(NUCLEON_RADIUS, 8, 8);

export class NucleusRenderer {
  private meshes: THREE.Mesh[] = [];

  /**
   * Adds nucleon sphere meshes to the scene based on the given params.
   * Clears any previously rendered nucleus first.
   *
   * @param params Pre-computed nucleus parameters (proton/neutron counts, display cap).
   * @param scene  The Three.js scene to add meshes into.
   */
  render(params: NucleusParams, scene: THREE.Scene): void {
    this.dispose(scene);

    const { protonCount, neutronCount, displayCount } = params;
    const total = protonCount + neutronCount;

    // Proportional split: how many of the capped displayCount are protons
    const displayProtons =
      total === 0 ? 0 : Math.round(displayCount * (protonCount / total));
    const displayNeutrons = displayCount - displayProtons;

    const positions = fibonacciLattice(displayCount, NUCLEUS_RADIUS);

    const protonMat  = new THREE.MeshPhongMaterial({ color: PROTON_COLOR });
    const neutronMat = new THREE.MeshPhongMaterial({ color: NEUTRON_COLOR });

    positions.forEach((pos, i) => {
      const mat = i < displayProtons ? protonMat : neutronMat;
      const mesh = new THREE.Mesh(nucleonGeometry, mat);
      mesh.position.copy(pos);
      scene.add(mesh);
      this.meshes.push(mesh);
    });
  }

  /**
   * Removes all nucleon meshes from the scene and frees material GPU resources.
   * Geometry is shared and NOT disposed here.
   *
   * @param scene The scene from which to remove the nucleus meshes.
   */
  dispose(scene: THREE.Scene): void {
    for (const mesh of this.meshes) {
      scene.remove(mesh);
      (mesh.material as THREE.Material).dispose();
    }
    this.meshes = [];
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Generates `count` uniformly distributed points on a sphere of `radius`
 * using the Fibonacci lattice (golden angle spiral) method.
 * Avoids polar clustering artifacts of uniform lat/lon sampling.
 *
 * @param count  Number of points to generate.
 * @param radius Sphere radius in Three.js units.
 */
function fibonacciLattice(count: number, radius: number): THREE.Vector3[] {
  if (count <= 0) return [];
  if (count === 1) return [new THREE.Vector3(0, 0, 0)];

  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const points: THREE.Vector3[] = [];

  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2; // [-1, 1]
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = goldenAngle * i;
    points.push(
      new THREE.Vector3(
        Math.cos(theta) * r * radius,
        y * radius,
        Math.sin(theta) * r * radius
      )
    );
  }
  return points;
}
