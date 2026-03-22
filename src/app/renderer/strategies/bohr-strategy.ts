/**
 * BohrStrategy — renders electrons as discrete spheres in circular orbits.
 *
 * Each shell gets a THREE.Group containing one SphereGeometry mesh per electron.
 * Electron positions are computed as pure functions of accumulatedTimeMs, so the
 * strategy is pausable without any extra logic: when time is frozen, positions
 * are frozen too.
 *
 * Orbital formula (AD-004, research.md R-004):
 *   θ(j, t) = (2π * j / n) + (ω_i * t / 1000)
 *   x = radius * cos(θ),  z = radius * sin(θ),  y = 0
 *
 * No Angular imports. Pure Three.js.
 */

import * as THREE from 'three';
import { Element } from '../../models/element.model';
import { ShellGeometryParams } from '../../models/renderer-types';
import { RenderStrategy } from './render-strategy.interface';

const ELECTRON_RADIUS = 0.12;
const ELECTRON_SEGMENTS = 16;

interface ShellData {
  group: THREE.Group;
  meshes: THREE.Mesh[];
  geometry: THREE.SphereGeometry;   // shared across all electrons in shell
  material: THREE.MeshPhongMaterial; // shared across all electrons in shell
  radius: number;
  angularVelocity: number;
  electronCount: number;
}

export class BohrStrategy implements RenderStrategy {
  private shells: ShellData[] = [];

  // ── T028: init ─────────────────────────────────────────────────────────────

  init(
    _element: Element,
    scene: THREE.Scene,
    shellParams: readonly ShellGeometryParams[]
  ): void {
    this.shells = [];

    for (const shell of shellParams) {
      const geometry = new THREE.SphereGeometry(ELECTRON_RADIUS, ELECTRON_SEGMENTS, ELECTRON_SEGMENTS);
      const material = new THREE.MeshPhongMaterial({ color: shell.color });
      const group = new THREE.Group();
      const meshes: THREE.Mesh[] = [];

      for (let j = 0; j < shell.electronCount; j++) {
        const mesh = new THREE.Mesh(geometry, material);
        // Starting angle — evenly distributed around the shell
        const theta = (2 * Math.PI * j) / shell.electronCount;
        mesh.position.set(
          shell.radius * Math.cos(theta),
          0,
          shell.radius * Math.sin(theta)
        );
        group.add(mesh);
        meshes.push(mesh);
      }

      scene.add(group);
      this.shells.push({
        group,
        meshes,
        geometry,
        material,
        radius: shell.radius,
        angularVelocity: shell.angularVelocity,
        electronCount: shell.electronCount,
      });
    }
  }

  // ── T029: update ───────────────────────────────────────────────────────────

  update(accumulatedTimeMs: number): void {
    const t = accumulatedTimeMs / 1000; // convert to seconds for ω (rad/s)

    for (const shell of this.shells) {
      const { meshes, radius, angularVelocity, electronCount } = shell;
      for (let j = 0; j < meshes.length; j++) {
        const theta = (2 * Math.PI * j) / electronCount + angularVelocity * t;
        meshes[j].position.set(
          radius * Math.cos(theta),
          0,
          radius * Math.sin(theta)
        );
      }
    }
  }

  // ── T030: dispose ──────────────────────────────────────────────────────────

  dispose(scene: THREE.Scene): void {
    for (const shell of this.shells) {
      scene.remove(shell.group);
      shell.geometry.dispose();
      shell.material.dispose();
    }
    this.shells = [];
  }
}
