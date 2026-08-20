import { describe, expect, it } from 'vitest';
import { ROLES_PROPOSES, libelleRole, libelleRoles } from './roles';

describe('rôles', () => {
  it('parle la langue du métier, pas celle du jeton', () => {
    expect(libelleRole('ROLE_ADMIN')).toBe('Administrateur');
    expect(libelleRole('ROLE_USER')).toBe('Utilisateur');
  });

  it('assemble plusieurs rôles en une phrase lisible', () => {
    expect(libelleRoles(['ROLE_USER', 'ROLE_ADMIN'])).toBe('Utilisateur, Administrateur');
  });

  it('reste lisible sans rôle', () => {
    expect(libelleRoles([])).toBe('—');
    expect(libelleRoles(undefined)).toBe('—');
  });

  it('propose les deux rôles déclarés par la spécification, du plus étroit au plus large', () => {
    expect(ROLES_PROPOSES.map((role) => role.valeur)).toEqual(['ROLE_USER', 'ROLE_ADMIN']);
  });
});
