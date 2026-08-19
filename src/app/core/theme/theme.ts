import { DOCUMENT, Injectable, computed, effect, inject, signal } from '@angular/core';
import {
  contrasteSurMarque,
  genererRampe,
  niveauMarqueLisible,
  versCssOklch,
  type CouleurOklch,
  NIVEAUX_RAMPE,
} from './couleur-oklch';

export type ModeTheme = 'clair' | 'sombre' | 'systeme';
export type Densite = 'confortable' | 'compact';
export type Rayon = 'net' | 'doux' | 'arrondi';

export interface PresetAmorce {
  readonly nom: string;
  readonly couleur: CouleurOklch;
}

/** Amorce par défaut, arbitrée en ADR-009. */
export const AMORCE_PAR_DEFAUT: CouleurOklch = { l: 0.55, c: 0.13, h: 250 };

/**
 * Presets proposés dans l'écran « Apparence ».
 * Aucun ne se situe dans la plage vert–orange–rouge : ces teintes appartiennent à la jauge
 * de seuil, et une marque qui les emprunte se lit comme un signal d'état.
 */
export const PRESETS_AMORCE: readonly PresetAmorce[] = [
  { nom: 'Indigo', couleur: { l: 0.55, c: 0.13, h: 250 } },
  { nom: 'Ardoise', couleur: { l: 0.52, c: 0.05, h: 250 } },
  { nom: 'Océan', couleur: { l: 0.55, c: 0.11, h: 220 } },
  { nom: 'Prune', couleur: { l: 0.5, c: 0.13, h: 315 } },
  { nom: 'Encre', couleur: { l: 0.45, c: 0.09, h: 275 } },
];

interface ThemeEnregistre {
  readonly mode: ModeTheme;
  readonly amorce: CouleurOklch;
  readonly densite: Densite;
  readonly rayon: Rayon;
}

const CLE_STOCKAGE = 'gestion-stock.theme';

@Injectable({ providedIn: 'root' })
export class ServiceTheme {
  private readonly document = inject(DOCUMENT);

  private readonly modeChoisi = signal<ModeTheme>('systeme');
  private readonly amorceChoisie = signal<CouleurOklch>(AMORCE_PAR_DEFAUT);
  private readonly densiteChoisie = signal<Densite>('confortable');
  private readonly rayonChoisi = signal<Rayon>('doux');

  /** Préférence du système, suivie en direct quand le mode vaut « systeme ». */
  private readonly systemeEnSombre = signal(false);

  readonly mode = this.modeChoisi.asReadonly();
  readonly amorce = this.amorceChoisie.asReadonly();
  readonly densite = this.densiteChoisie.asReadonly();
  readonly rayon = this.rayonChoisi.asReadonly();

  /** Thème réellement appliqué, une fois la préférence système résolue. */
  readonly themeApplique = computed<'clair' | 'sombre'>(() => {
    const mode = this.modeChoisi();
    if (mode !== 'systeme') {
      return mode;
    }
    return this.systemeEnSombre() ? 'sombre' : 'clair';
  });

  readonly rampe = computed(() => genererRampe(this.amorceChoisie()));

  /** Niveau de la rampe utilisé comme fond de marque, choisi pour rester lisible. */
  readonly niveauMarque = computed(() => niveauMarqueLisible(this.rampe()) ?? 600);

  constructor() {
    this.restaurer();
    this.suivrePreferenceSysteme();

    effect(() => {
      this.appliquer();
      this.enregistrer();
    });
  }

  definirMode(mode: ModeTheme): void {
    this.modeChoisi.set(mode);
  }

  definirAmorce(amorce: CouleurOklch): void {
    this.amorceChoisie.set(amorce);
  }

  definirDensite(densite: Densite): void {
    this.densiteChoisie.set(densite);
  }

  definirRayon(rayon: Rayon): void {
    this.rayonChoisi.set(rayon);
  }

  /** Revient à l'apparence par défaut, sans toucher au reste de la session. */
  reinitialiser(): void {
    this.modeChoisi.set('systeme');
    this.amorceChoisie.set(AMORCE_PAR_DEFAUT);
    this.densiteChoisie.set('confortable');
    this.rayonChoisi.set('doux');
  }

  /** Écrit la rampe et les attributs de thème sur l'élément racine. */
  private appliquer(): void {
    const racine = this.document.documentElement;
    const rampe = this.rampe();

    for (const niveau of NIVEAUX_RAMPE) {
      racine.style.setProperty(`--brand-${niveau}`, versCssOklch(rampe[niveau]));
    }

    // Le contraste du texte sur fond de marque est recalculé, jamais supposé : une amorce
    // claire produirait sinon un bouton illisible.
    const fondMarque = rampe[this.niveauMarque()];
    racine.style.setProperty('--brand-contrast', versCssOklch(contrasteSurMarque(fondMarque)));

    racine.dataset['theme'] = this.themeApplique() === 'sombre' ? 'dark' : 'light';
    racine.dataset['densite'] = this.densiteChoisie();
    racine.dataset['rayon'] = this.rayonChoisi();

    this.synchroniserCouleurNavigateur();
  }

  /**
   * Aligne la couleur de la barre du navigateur sur la surface de l'application.
   * Sans cela, le bandeau système reste clair au-dessus d'une interface sombre.
   */
  private synchroniserCouleurNavigateur(): void {
    const surface = this.themeApplique() === 'sombre' ? 'oklch(0.155 0.008 250)' : 'oklch(1 0 0)';
    let balise = this.document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');

    if (!balise) {
      balise = this.document.createElement('meta');
      balise.name = 'theme-color';
      this.document.head.appendChild(balise);
    }

    balise.content = surface;
  }

  private enregistrer(): void {
    const etat: ThemeEnregistre = {
      mode: this.modeChoisi(),
      amorce: this.amorceChoisie(),
      densite: this.densiteChoisie(),
      rayon: this.rayonChoisi(),
    };

    try {
      localStorage.setItem(CLE_STOCKAGE, JSON.stringify(etat));
    } catch {
      // Stockage indisponible — navigation privée, quota atteint. L'apparence reste
      // correcte pour la session en cours, elle ne survivra simplement pas au rechargement.
    }
  }

  private restaurer(): void {
    const brut = this.lireStockage();
    if (brut === null) {
      return;
    }

    const enregistre = this.analyser(brut);
    if (enregistre === null) {
      return;
    }

    this.modeChoisi.set(enregistre.mode);
    this.amorceChoisie.set(enregistre.amorce);
    this.densiteChoisie.set(enregistre.densite);
    this.rayonChoisi.set(enregistre.rayon);
  }

  private lireStockage(): string | null {
    try {
      return localStorage.getItem(CLE_STOCKAGE);
    } catch {
      return null;
    }
  }

  /** Relit un thème enregistré en écartant tout ce qui ne correspond plus au format. */
  private analyser(brut: string): ThemeEnregistre | null {
    let valeur: unknown;

    try {
      valeur = JSON.parse(brut);
    } catch {
      return null;
    }

    if (typeof valeur !== 'object' || valeur === null) {
      return null;
    }

    const objet = valeur as Record<string, unknown>;
    const amorce = objet['amorce'];

    if (typeof amorce !== 'object' || amorce === null) {
      return null;
    }

    const couleur = amorce as Record<string, unknown>;

    if (
      typeof couleur['l'] !== 'number' ||
      typeof couleur['c'] !== 'number' ||
      typeof couleur['h'] !== 'number'
    ) {
      return null;
    }

    return {
      mode: estMode(objet['mode']) ? objet['mode'] : 'systeme',
      amorce: { l: couleur['l'], c: couleur['c'], h: couleur['h'] },
      densite: objet['densite'] === 'compact' ? 'compact' : 'confortable',
      rayon: estRayon(objet['rayon']) ? objet['rayon'] : 'doux',
    };
  }

  private suivrePreferenceSysteme(): void {
    const fenetre = this.document.defaultView;

    if (!fenetre?.matchMedia) {
      return;
    }

    const requete = fenetre.matchMedia('(prefers-color-scheme: dark)');
    this.systemeEnSombre.set(requete.matches);
    requete.addEventListener('change', (evenement) => this.systemeEnSombre.set(evenement.matches));
  }
}

function estMode(valeur: unknown): valeur is ModeTheme {
  return valeur === 'clair' || valeur === 'sombre' || valeur === 'systeme';
}

function estRayon(valeur: unknown): valeur is Rayon {
  return valeur === 'net' || valeur === 'doux' || valeur === 'arrondi';
}
