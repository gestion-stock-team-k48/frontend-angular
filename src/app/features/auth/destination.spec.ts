import { describe, expect, it } from 'vitest';
import { destinationSure } from './destination';

describe('destinationSure', () => {
  it('rend le chemin demandé quand il est interne', () => {
    expect(destinationSure('/articles/12')).toBe('/articles/12');
  });

  it('mène au tableau de bord sans destination', () => {
    // On ne se connecte pas pour revenir à la vitrine.
    expect(destinationSure(null)).toBe('/tableau-de-bord');
  });

  it('écarte la vitrine, qui renverrait aussitôt au tableau de bord', () => {
    expect(destinationSure('/')).toBe('/tableau-de-bord');
  });

  it('écarte une adresse absolue', () => {
    expect(destinationSure('https://exemple-malveillant.cm/vol')).toBe('/tableau-de-bord');
  });

  it('écarte une adresse relative au protocole', () => {
    // `//hote/chemin` est une URL absolue déguisée : le navigateur y ajoute le protocole
    // courant et quitte l'application, juste après la saisie du mot de passe.
    expect(destinationSure('//exemple-malveillant.cm/vol')).toBe('/tableau-de-bord');
  });

  it('écarte un chemin relatif, qui ne désigne rien de sûr', () => {
    expect(destinationSure('articles')).toBe('/tableau-de-bord');
  });
});
