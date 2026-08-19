import { describe, expect, it } from 'vitest';
import { destinationSure } from './destination';

describe('destinationSure', () => {
  it('rend le chemin demandé quand il est interne', () => {
    expect(destinationSure('/articles/12')).toBe('/articles/12');
  });

  it('retombe sur la racine sans destination', () => {
    expect(destinationSure(null)).toBe('/');
  });

  it('écarte une adresse absolue', () => {
    expect(destinationSure('https://exemple-malveillant.cm/vol')).toBe('/');
  });

  it('écarte une adresse relative au protocole', () => {
    // `//hote/chemin` est une URL absolue déguisée : le navigateur y ajoute le protocole
    // courant et quitte l'application, juste après la saisie du mot de passe.
    expect(destinationSure('//exemple-malveillant.cm/vol')).toBe('/');
  });

  it('écarte un chemin relatif, qui ne désigne rien de sûr', () => {
    expect(destinationSure('articles')).toBe('/');
  });
});
