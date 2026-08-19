import { HttpParams } from '@angular/common/http';
import type { components } from './generated/api';

/**
 * Enveloppe de pagination du backend, rendue générique.
 *
 * Le type est dérivé du schéma généré plutôt que réécrit : si le backend renomme un champ,
 * la compilation le signale ici. Le champ est bien `isLast`, et il n'existe ni `isFirst`
 * ni `numberOfElements` — voir `docs/06-API-CONTRAT.md`.
 */
type EnveloppeGeneree = components['schemas']['PageResponseArticleResponse'];

export type ReponsePage<T> = Omit<EnveloppeGeneree, 'content'> & { content?: T[] };

/** Sens de tri, tel que Spring l'attend dans le paramètre `sort`. */
export type SensTri = 'asc' | 'desc';

export interface Tri {
  readonly champ: string;
  readonly sens: SensTri;
}

/** Ce qu'un écran de liste demande au serveur. */
export interface DemandePage {
  /** Numéro de page, à partir de 0 — c'est la convention de Spring, pas celle de l'écran. */
  readonly page: number;
  readonly taille: number;
  readonly tri?: Tri | null;
}

/** Taille de page par défaut des listes. Une valeur, un seul endroit. */
export const TAILLE_PAGE_PAR_DEFAUT = 20;

/**
 * Taille demandée pour remplir une liste déroulante.
 *
 * Le backend ne publie aucun endpoint de recherche : pour proposer des articles ou des
 * tiers dans un `select`, il faut charger une page large. Au-delà, l'écran le dit plutôt
 * que de laisser croire que la liste est complète.
 */
export const TAILLE_LISTE_DEROULANTE = 200;

/** Tailles proposées à l'utilisateur. */
export const TAILLES_PAGE: readonly number[] = [10, 20, 50, 100];

/**
 * État d'une page, normalisé pour l'affichage.
 *
 * `premiere` et `nombreElements` sont dérivés : le backend ne les renvoie pas.
 */
export interface EtatPage {
  readonly numero: number;
  readonly taille: number;
  readonly total: number;
  readonly pages: number;
  readonly premiere: boolean;
  readonly derniere: boolean;
  readonly nombreElements: number;
}

export function parametresDePage(demande: DemandePage): HttpParams {
  let parametres = new HttpParams()
    .set('page', String(demande.page))
    .set('size', String(demande.taille));

  if (demande.tri) {
    parametres = parametres.set('sort', `${demande.tri.champ},${demande.tri.sens}`);
  }

  return parametres;
}

export function contenuDePage<T>(reponse: ReponsePage<T> | undefined): readonly T[] {
  return reponse?.content ?? [];
}

export function etatDePage(reponse: ReponsePage<unknown> | undefined): EtatPage {
  const numero = reponse?.pageNumber ?? 0;
  const nombreElements = reponse?.content?.length ?? 0;

  return {
    numero,
    taille: reponse?.pageSize ?? TAILLE_PAGE_PAR_DEFAUT,
    total: reponse?.totalElements ?? 0,
    pages: reponse?.totalPages ?? 0,
    premiere: numero === 0,
    derniere: reponse?.isLast ?? true,
    nombreElements,
  };
}
