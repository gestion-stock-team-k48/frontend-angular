import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Tout contrôle de saisie porte-t-il un nom accessible ?
 *
 * SonarCloud pose la question — règle `Web:InputWithoutLabelCheck` — mais lit le HTML comme
 * une page statique : il ne sait pas qu'`<app-champ>` rend un `<label for>` autour du
 * contrôle qu'on lui projette, et signale donc les 71 champs de l'application comme non
 * étiquetés. Tous le sont. La règle est désactivée dans `sonar-project.properties`, et
 * remplacée par ce contrôle, qui connaît les conventions du projet.
 *
 * Ce n'est pas un contrôle de forme : sans nom accessible, un lecteur d'écran annonce
 * « zone de saisie » et rien d'autre, et le formulaire devient une devinette. Une faute de
 * frappe entre `identifiant` et `id` suffit à casser le lien sans que rien ne se voie à
 * l'écran — c'est précisément ce que ce test attrape.
 */

const RACINE = join(process.cwd(), 'src', 'app');

/** Les cinq façons dont un contrôle peut recevoir son nom, dans ce projet. */
const MECANISMES = [
  'app-champ englobant, dont `identifiant` vaut l’`id` du contrôle',
  '`<label for>` dans le même gabarit',
  '`<label>` ancêtre, qui étiquette implicitement',
  '`aria-label`',
  '`aria-labelledby`',
] as const;

function gabarits(dossier: string): string[] {
  return readdirSync(dossier).flatMap((entree) => {
    const chemin = join(dossier, entree);
    if (statSync(chemin).isDirectory()) {
      return gabarits(chemin);
    }
    return chemin.endsWith('.html') ? [chemin] : [];
  });
}

/** Découpe naïve mais suffisante : les gabarits du projet n'imbriquent pas de contrôles. */
function controles(source: string): { balise: string; attributs: string; position: number }[] {
  const trouves: { balise: string; attributs: string; position: number }[] = [];
  const motif = /<(input|select|textarea)\b([^>]*)>/gis;
  let occurrence: RegExpExecArray | null;
  while ((occurrence = motif.exec(source)) !== null) {
    trouves.push({
      balise: occurrence[1] ?? '',
      attributs: occurrence[2] ?? '',
      position: occurrence.index,
    });
  }
  return trouves;
}

function attribut(attributs: string, nom: string): string | null {
  return new RegExp(`\\b${nom}\\s*=\\s*"([^"]*)"`, 'i').exec(attributs)?.[1] ?? null;
}

/** Vrai si une balise ouvrante `<label` est ouverte, non fermée, avant cette position. */
function sousUnLabel(source: string, position: number): boolean {
  const avant = source.slice(0, position);
  const ouverts = (avant.match(/<label\b/gi) ?? []).length;
  const fermes = (avant.match(/<\/label>/gi) ?? []).length;
  return ouverts > fermes;
}

/** Vrai si un `app-champ` ouvert avant cette position déclare cet `identifiant`. */
function sousUnChamp(source: string, position: number, identifiant: string | null): boolean {
  if (identifiant === null) {
    return false;
  }
  const avant = source.slice(0, position);
  const ouverts = [...avant.matchAll(/<app-champ\b([^>]*)>/gis)];
  const fermes = (avant.match(/<\/app-champ>/gi) ?? []).length;
  const englobants = ouverts.slice(fermes);
  return englobants.some((champ) => attribut(champ[1] ?? '', 'identifiant') === identifiant);
}

describe('Étiquetage des contrôles de saisie', () => {
  const fichiers = gabarits(RACINE);

  it('trouve les gabarits à contrôler', () => {
    expect(fichiers.length).toBeGreaterThan(20);
  });

  it('donne un nom accessible à chaque contrôle', () => {
    const orphelins: string[] = [];

    for (const fichier of fichiers) {
      const source = readFileSync(fichier, 'utf8');
      for (const { balise, attributs, position } of controles(source)) {
        const type = attribut(attributs, 'type');
        // Un champ caché n'est pas présenté à l'utilisateur ; un bouton porte son propre nom.
        if (type !== null && ['hidden', 'submit', 'reset', 'button'].includes(type)) {
          continue;
        }

        const identifiant = attribut(attributs, 'id');
        const etiquete =
          sousUnChamp(source, position, identifiant) ||
          (identifiant !== null &&
            new RegExp(`<label\\b[^>]*\\bfor\\s*=\\s*"${identifiant}"`, 'i').test(source)) ||
          sousUnLabel(source, position) ||
          /\baria-label(ledby)?\s*=/i.test(attributs);

        if (!etiquete) {
          const ligne = source.slice(0, position).split('\n').length;
          orphelins.push(`${fichier.replace(process.cwd() + '/', '')}:${ligne} <${balise}>`);
        }
      }
    }

    expect(
      orphelins,
      `Contrôles sans nom accessible. Un lecteur d'écran n'annoncera rien d'utile.\n` +
        `Mécanismes acceptés :\n${MECANISMES.map((m) => `  - ${m}`).join('\n')}\n\n` +
        orphelins.join('\n'),
    ).toEqual([]);
  });
});
