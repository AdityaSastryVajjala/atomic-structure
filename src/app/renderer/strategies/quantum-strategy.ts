/**
 * QuantumStrategy — diffuse particle-cloud electron renderer.
 *
 * Renders each electron shell as a `THREE.Points` cloud centred on the shell
 * radius, giving a qualitative illustration of quantum-mechanical probability
 * density. Each shell creates `electronCount * 12` particles.
 *
 * Particle placement (init):
 *   r  = shell.radius + GaussianNoise(σ = 0.4)   [Box-Muller transform]
 *   θ  ∈ [0, 2π)   (uniform, azimuthal)
 *   φ  ∈ [0, π]    (uniform, polar)
 *   → Cartesian: x = r sin(φ)cos(θ), y = r cos(φ), z = r sin(φ)sin(θ)
 *
 * Animation (update):
 *   groupAngle = 0.15 * accumulatedTimeMs / 1000
 *   points.rotation.y = groupAngle  (pure function of time → idempotent)
 *
 * See contracts/render-strategy.md (QuantumStrategy section) for full spec.
 */

import * as THREE from 'three';
import { Element } from '../../models/element.model';
import { ShellGeometryParams } from '../../models/renderer-types';
import { RenderStrategy } from './render-strategy.interface';

const PARTICLES_PER_ELECTRON = 12;
const PARTICLE_SIZE          = 0.12;
const PARTICLE_OPACITY       = 0.6;
const GAUSSIAN_SIGMA         = 0.4;
const ANGULAR_VELOCITY       = 0.15; // radians per second

/** Box-Muller transform: returns one normally-distributed sample with given σ. */
function gaussianNoise(sigma: number): number {
  // Avoid log(0) by clamping u1 away from zero
  const u1 = Math.max(1e-10, Math.random());
  const u2  = Math.random();
  return sigma * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

interface ShellCloud {
  points: THREE.Points;
  geometry: THREE.BufferGeometry;
  material: THREE.PointsMaterial;
}

export class QuantumStrategy implements RenderStrategy {
  private clouds: ShellCloud[] = [];

  // ── init (T047) ─────────────────────────────────────────────────────────────

  init(
    _element: Element,
    scene: THREE.Scene,
    shellParams: readonly ShellGeometryParams[],
  ): void {
    this.clouds = [];

    for (const shell of shellParams) {
      const particleCount = shell.electronCount * PARTICLES_PER_ELECTRON;
      const positions     = new Float32Array(particleCount * 3);

      for (let i = 0; i < particleCount; i++) {
        const r   = shell.radius + gaussianNoise(GAUSSIAN_SIGMA);
        const phi = Math.acos(2 * Math.random() - 1); // uniform in [0, π]
        const theta = Math.random() * 2 * Math.PI;    // uniform in [0, 2π)

        positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta); // x
        positions[i * 3 + 1] = r * Math.cos(phi);                   // y
        positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta); // z
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      const material = new THREE.PointsMaterial({
        size: PARTICLE_SIZE,
        color: new THREE.Color(shell.color),
        transparent: true,
        opacity: PARTICLE_OPACITY,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      const points = new THREE.Points(geometry, material);
      scene.add(points);

      this.clouds.push({ points, geometry, material });
    }
  }

  // ── update (T048) ────────────────────────────────────────────────────────────

  update(accumulatedTimeMs: number): void {
    const groupAngle = ANGULAR_VELOCITY * accumulatedTimeMs / 1000;
    for (const cloud of this.clouds) {
      cloud.points.rotation.y = groupAngle;
    }
  }

  // ── dispose (T049) ───────────────────────────────────────────────────────────

  dispose(scene: THREE.Scene): void {
    for (const cloud of this.clouds) {
      scene.remove(cloud.points);
      cloud.geometry.dispose();
      cloud.material.dispose();
    }
    this.clouds = [];
  }
}
