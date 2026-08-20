/**
 * Mise en place commune aux tests unitaires.
 *
 * jsdom implémente `<dialog>` comme un élément ordinaire : ni `showModal`, ni `close`, ni
 * `open`. La modale du design system s'appuie sur ces méthodes natives (ADR-011). Les
 * combler ici évite que chaque test qui croise une modale ait à s'en occuper — et évite
 * surtout de tordre le composant pour l'amuser d'un environnement de test.
 */
const dialogue = globalThis.HTMLDialogElement?.prototype;

if (dialogue !== undefined && typeof dialogue.showModal !== 'function') {
  Object.defineProperty(dialogue, 'open', {
    configurable: true,
    get(this: HTMLDialogElement) {
      return this.hasAttribute('open');
    },
    set(this: HTMLDialogElement, valeur: boolean) {
      if (valeur) {
        this.setAttribute('open', '');
      } else {
        this.removeAttribute('open');
      }
    },
  });

  dialogue.showModal = function showModal(this: HTMLDialogElement): void {
    this.setAttribute('open', '');
  };

  dialogue.show = function show(this: HTMLDialogElement): void {
    this.setAttribute('open', '');
  };

  dialogue.close = function close(this: HTMLDialogElement): void {
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  };
}

/**
 * Mouvement réduit, toujours, pour les tests.
 *
 * `nombreAnime` fait courir les mesures du tableau de bord vers leur valeur sur 900 ms. Un
 * test qui veut lire le chiffre final devait donc dormir plus d'une seconde par cas — une
 * attente d'horloge, qui rapprochait la suite du plafond de cinq secondes et la faisait
 * basculer dès que la machine était chargée.
 *
 * Déclarer `prefers-reduced-motion` emprunte le chemin que le composant prévoit déjà : la
 * valeur est posée d'un coup. C'est aussi ce qui décrit le mieux un environnement sans
 * écran — il n'y a aucune animation à regarder. Les autres requêtes restent servies par
 * jsdom, pour ne rien changer au thème ni aux points de rupture.
 */
const cible: { matchMedia?: (requete: string) => MediaQueryList } =
  (globalThis as { window?: typeof globalThis }).window ?? globalThis;
const interrogerLesMedias = cible.matchMedia?.bind(cible);

/** Réponse minimale, pour le cas où l'environnement n'implémente pas `matchMedia`. */
function reponse(requete: string, correspond: boolean): MediaQueryList {
  return {
    media: requete,
    matches: correspond,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  } as MediaQueryList;
}

const interrogation = (requete: string): MediaQueryList => {
  if (requete.includes('prefers-reduced-motion')) {
    return reponse(requete, true);
  }
  return interrogerLesMedias?.(requete) ?? reponse(requete, false);
};

for (const portee of new Set<object>([cible, globalThis])) {
  Object.defineProperty(portee, 'matchMedia', {
    configurable: true,
    writable: true,
    value: interrogation,
  });
}
