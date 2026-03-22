import * as THREE from 'three';
import { QuantumStrategy } from './quantum-strategy';
import { computeShellGeometry } from '../renderer-utils';
import { Element } from '../../models/element.model';

const carbon: Element = {
  atomicNumber: 6,
  name: 'Carbon',
  symbol: 'C',
  atomicMass: 12.011,
  shells: [2, 4],
};

const sodium: Element = {
  atomicNumber: 11,
  name: 'Sodium',
  symbol: 'Na',
  atomicMass: 22.990,
  shells: [2, 8, 1],
};

const PARTICLES_PER_ELECTRON = 12;

describe('QuantumStrategy', () => {
  let scene: THREE.Scene;
  let strategy: QuantumStrategy;

  beforeEach(() => {
    scene    = new THREE.Scene();
    strategy = new QuantumStrategy();
  });

  // ── init: scene object count ───────────────────────────────────────────────

  it('adds 2 Points objects to the scene for Carbon (shells [2, 4])', () => {
    strategy.init(carbon, scene, computeShellGeometry(carbon));
    expect(scene.children.length).toBe(2);
    expect(scene.children.every((c) => c instanceof THREE.Points)).toBeTrue();
  });

  it('shell 1 geometry has 2 * 12 = 24 particles for Carbon K-shell', () => {
    strategy.init(carbon, scene, computeShellGeometry(carbon));
    const points = scene.children[0] as THREE.Points;
    const posAttr = points.geometry.getAttribute('position');
    expect(posAttr.count).toBe(2 * PARTICLES_PER_ELECTRON);
  });

  it('shell 2 geometry has 4 * 12 = 48 particles for Carbon L-shell', () => {
    strategy.init(carbon, scene, computeShellGeometry(carbon));
    const points = scene.children[1] as THREE.Points;
    const posAttr = points.geometry.getAttribute('position');
    expect(posAttr.count).toBe(4 * PARTICLES_PER_ELECTRON);
  });

  it('adds 3 Points objects for Sodium (shells [2, 8, 1])', () => {
    strategy.init(sodium, scene, computeShellGeometry(sodium));
    expect(scene.children.length).toBe(3);
  });

  it('Sodium shell 2 has 8 * 12 = 96 particles', () => {
    strategy.init(sodium, scene, computeShellGeometry(sodium));
    const points = scene.children[1] as THREE.Points;
    const posAttr = points.geometry.getAttribute('position');
    expect(posAttr.count).toBe(8 * PARTICLES_PER_ELECTRON);
  });

  // ── dispose: clean removal ─────────────────────────────────────────────────

  it('removes all Points objects from scene after dispose()', () => {
    strategy.init(carbon, scene, computeShellGeometry(carbon));
    strategy.dispose(scene);
    expect(scene.children.length).toBe(0);
  });

  it('dispose() on a fresh (uninitialised) strategy is a no-op', () => {
    expect(() => strategy.dispose(scene)).not.toThrow();
    expect(scene.children.length).toBe(0);
  });

  // ── update: rotation advances with time ────────────────────────────────────

  it('update(1000) and update(2000) produce different rotation.y values', () => {
    strategy.init(carbon, scene, computeShellGeometry(carbon));
    const points = scene.children[0] as THREE.Points;

    strategy.update(1000);
    const angle1 = points.rotation.y;

    strategy.update(2000);
    const angle2 = points.rotation.y;

    expect(angle2).toBeGreaterThan(angle1);
  });

  it('update(t) called twice with the same t produces identical rotation (idempotent)', () => {
    strategy.init(carbon, scene, computeShellGeometry(carbon));
    const points = scene.children[0] as THREE.Points;

    strategy.update(1500);
    const angle1 = points.rotation.y;

    strategy.update(1500);
    const angle2 = points.rotation.y;

    expect(angle1).toBeCloseTo(angle2, 10);
  });

  it('update(0) sets rotation.y to 0', () => {
    strategy.init(carbon, scene, computeShellGeometry(carbon));
    strategy.update(0);
    for (const child of scene.children) {
      expect((child as THREE.Points).rotation.y).toBeCloseTo(0, 10);
    }
  });

  it('all shells receive the same rotation.y after update()', () => {
    strategy.init(sodium, scene, computeShellGeometry(sodium));
    strategy.update(3000);

    const angles = scene.children.map((c) => (c as THREE.Points).rotation.y);
    expect(angles[0]).toBeCloseTo(angles[1], 10);
    expect(angles[1]).toBeCloseTo(angles[2], 10);
  });
});
