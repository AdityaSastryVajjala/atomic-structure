import { getElectronShells, getConfigurationString, Element } from './element.model';

describe('element.model helpers', () => {
  const sodium: Element = {
    atomicNumber: 11,
    name: 'Sodium',
    symbol: 'Na',
    atomicMass: 22.990,
    shells: [2, 8, 1],
  };

  const carbon: Element = {
    atomicNumber: 6,
    name: 'Carbon',
    symbol: 'C',
    atomicMass: 12.011,
    shells: [2, 4],
  };

  const hydrogen: Element = {
    atomicNumber: 1,
    name: 'Hydrogen',
    symbol: 'H',
    atomicMass: 1.008,
    shells: [1],
  };

  describe('getElectronShells', () => {
    it('returns the correct array length', () => {
      expect(getElectronShells(sodium).length).toBe(3);
      expect(getElectronShells(carbon).length).toBe(2);
      expect(getElectronShells(hydrogen).length).toBe(1);
    });

    it('assigns 1-based shell indices', () => {
      const shells = getElectronShells(sodium);
      expect(shells[0].index).toBe(1);
      expect(shells[1].index).toBe(2);
      expect(shells[2].index).toBe(3);
    });

    it('maps electron counts correctly for Sodium [2, 8, 1]', () => {
      const shells = getElectronShells(sodium);
      expect(shells[0].electrons).toBe(2);
      expect(shells[1].electrons).toBe(8);
      expect(shells[2].electrons).toBe(1);
    });

    it('maps electron counts correctly for Carbon [2, 4]', () => {
      const shells = getElectronShells(carbon);
      expect(shells[0].electrons).toBe(2);
      expect(shells[1].electrons).toBe(4);
    });

    it('handles a single-shell element (Hydrogen)', () => {
      const shells = getElectronShells(hydrogen);
      expect(shells.length).toBe(1);
      expect(shells[0].index).toBe(1);
      expect(shells[0].electrons).toBe(1);
    });
  });

  describe('getConfigurationString', () => {
    it('returns "2, 8, 1" for Sodium', () => {
      expect(getConfigurationString(sodium)).toBe('2, 8, 1');
    });

    it('returns "2, 4" for Carbon', () => {
      expect(getConfigurationString(carbon)).toBe('2, 4');
    });

    it('returns "1" for Hydrogen', () => {
      expect(getConfigurationString(hydrogen)).toBe('1');
    });
  });
});
