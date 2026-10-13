import { describe, expect, it } from 'vitest';
import { isNavItemActive } from './Header';

describe('Header — état actif de la navigation', () => {
  it('actif sur la page et ses pages de détail', () => {
    expect(isNavItemActive('/athletes', '/athletes')).toBe(true);
    expect(isNavItemActive('/athletes', '/athletes/abc')).toBe(true);
    expect(isNavItemActive('/athletes-wt', '/athletes-wt/ext-1')).toBe(true);
    expect(isNavItemActive('/competitions', '/competitions/c1')).toBe(true);
  });

  it('athlètes WT (externes) et roster EKVARA ne s’allument jamais l’un pour l’autre', () => {
    expect(isNavItemActive('/athletes', '/athletes-wt')).toBe(false);
    expect(isNavItemActive('/athletes', '/athletes-wt/ext-1')).toBe(false);
    expect(isNavItemActive('/athletes-wt', '/athletes')).toBe(false);
  });

  it('dashboard actif uniquement sur /', () => {
    expect(isNavItemActive('/', '/')).toBe(true);
    expect(isNavItemActive('/', '/planning')).toBe(false);
  });
});
