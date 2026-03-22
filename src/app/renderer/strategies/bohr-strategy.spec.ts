import * as THREE from 'three';
import { BohrStrategy } from './bohr-strategy';
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

describe('BohrStrategy', () => {
  let scene: THREE.Scene;
  let strategy: BohrStrategy;

  beforeEach(() => {
    scene    = new THREE.Scene();
    strategy = new BohrStrategy();
  });

  // ── init: scene object count ───────────────────────────────────────────────

  it('adds 2 shell groups to the scene for Carbon (shells [2, 4])', () => {
    strategy.init(carbon, scene, computeShellGeometry(carbon));
    expect(scene.children.length).toBe(2);
  });

  it('shell 1 group contains 2 electron meshes (K-shell of Carbon)', () => {
    strategy.init(carbon, scene, computeShellGeometry(carbon));
    expect(scene.children[0].children.length).toBe(2);
  });

  it('shell 2 group contains 4 electron meshes (L-shell of Carbon)', () => {
    strategy.init(carbon, scene, computeShellGeometry(carbon));
    expect(scene.children[1].children.length).toBe(4);
  });

  it('total electron meshes across all groups equals atomicNumber for Carbon', () => {
    strategy.init(carbon, scene, computeShellGeometry(carbon));
    const total = scene.children.reduce((sum, g) => sum + g.children.length, 0);
    expect(total).toBe(6);
  });

  it('adds 3 shell groups for Sodium (shells [2, 8, 1])', () => {
    strategy.init(sodium, scene, computeShellGeometry(sodium));
    expect(scene.children.length).toBe(3);
    const total = scene.children.reduce((sum, g) => sum + g.children.length, 0);
    expect(total).toBe(11);
  });

  // ── dispose: clean removal ─────────────────────────────────────────────────

  it('removes all groups from scene after dispose()', () => {
    strategy.init(carbon, scene, computeShellGeometry(carbon));
    strategy.dispose(scene);
    expect(scene.children.length).toBe(0);
  });

  it('dispose() on a fresh (uninitialised) strategy is a no-op', () => {
    expect(() => strategy.dispose(scene)).not.toThrow();
    expect(scene.children.length).toBe(0);
  });

  // ── update: animation advances ─────────────────────────────────────────────

  it('update(1000) and update(2000) produce different electron positions', () => {
    strategy.init(carbon, scene, computeShellGeometry(carbon));
    const mesh = scene.children[0].children[0] as THREE.Mesh;

    strategy.update(1000);
    const pos1 = mesh.position.clone();

    strategy.update(2000);
    const pos2 = mesh.position.clone();

    // At least x or z should differ as the electron has orbited further
    expect(pos1.distanceTo(pos2)).toBeGreaterThan(0.001);
  });

  it('update(t) called twice with the same t produces identical positions (idempotent)', () => {
    strategy.init(carbon, scene, computeShellGeometry(carbon));
    const mesh = scene.children[0].children[0] as THREE.Mesh;

    strategy.update(1500);
    const pos1 = mesh.position.clone();

    strategy.update(1500);
    const pos2 = mesh.position.clone();

    expect(pos1.x).toBeCloseTo(pos2.x, 6);
    expect(pos1.z).toBeCloseTo(pos2.z, 6);
  });

  it('update(0) places electrons at their evenly-spaced starting angles', () => {
    strategy.init(carbon, scene, computeShellGeometry(carbon));
    strategy.update(0);

    const shellParams = computeShellGeometry(carbon);
    const r = shellParams[0].radius;
    const mesh0 = scene.children[0].children[0] as THREE.Mesh;
    const mesh1 = scene.children[0].children[1] as THREE.Mesh;

    // Shell 1 has 2 electrons — 180° apart on the XZ plane
    expect(mesh0.position.x).toBeCloseTo(r * Math.cos(0), 4);
    expect(mesh0.position.z).toBeCloseTo(r * Math.sin(0), 4);
    expect(mesh1.position.x).toBeCloseTo(r * Math.cos(Math.PI), 4);
    expect(mesh1.position.z).toBeCloseTo(r * Math.sin(Math.PI), 4);
  });

  it('all electron y-positions remain 0 after any update', () => {
    strategy.init(carbon, scene, computeShellGeometry(carbon));
    strategy.update(3500);
    for (const group of scene.children) {
      for (const child of group.children) {
        expect((child as THREE.Mesh).position.y).toBeCloseTo(0, 6);
      }
    }
  });
});
