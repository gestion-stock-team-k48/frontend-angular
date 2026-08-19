import { HttpClient, HttpContext, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import {
  Observable,
  catchError,
  finalize,
  map,
  of,
  shareReplay,
  switchMap,
  tap,
  throwError,
} from 'rxjs';
import { API_BASE_URL } from '../config/app-config';
import { SANS_JETON, SANS_NOTIFICATION_ERREUR, SANS_RAFRAICHISSEMENT } from '../http/http-contexte';
import type {
  DemandeAuthentification,
  DemandeChangementMotDePasse,
  DemandeInscription,
  DemandeMotDePasseOublie,
  DemandeReinitialisationMotDePasse,
  ReponseAuthentification,
  Role,
  Utilisateur,
} from '../api/api-types';

/**
 * Clé de persistance du jeton de rafraîchissement.
 * Le jeton d'accès, lui, n'est jamais persisté : il vit en mémoire (ADR-003).
 */
const CLE_JETON_RAFRAICHISSEMENT = 'gestion-stock.refresh-token';

@Injectable({ providedIn: 'root' })
export class ServiceAuthentification {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  /** Jeton d'accès, en mémoire uniquement. Perdu au rechargement, puis reconstruit. */
  private readonly jetonAcces = signal<string | null>(null);

  private readonly utilisateurCourant = signal<Utilisateur | null>(null);

  /** Rafraîchissement en cours, partagé par toutes les requêtes en attente. */
  private fluxRafraichissement: Observable<string> | null = null;

  readonly utilisateur = this.utilisateurCourant.asReadonly();
  readonly jeton = this.jetonAcces.asReadonly();

  /**
   * Une session est ouverte dès qu'un jeton de rafraîchissement est disponible : le jeton
   * d'accès peut très bien manquer juste après un rechargement de page.
   */
  readonly estAuthentifie = computed(
    () => this.jetonAcces() !== null || this.jetonRafraichissement() !== null,
  );

  readonly roles = computed<readonly Role[]>(() => this.utilisateurCourant()?.roles ?? []);

  readonly estAdministrateur = computed(() => this.roles().includes('ROLE_ADMIN'));

  /**
   * Vrai tant que l'utilisateur n'a pas remplacé le mot de passe temporaire que lui a
   * attribué son administrateur. Le backend porte l'information sur le profil ; l'interface
   * se contente de la relayer à la garde qui bloque le reste de l'application.
   */
  readonly doitChangerMotDePasse = computed(
    () => this.utilisateurCourant()?.mustChangePassword === true,
  );

  /** Entreprise de l'utilisateur connecté, affichée dans le bandeau applicatif. */
  readonly entreprise = computed(() => {
    const utilisateur = this.utilisateurCourant();
    if (!utilisateur?.entrepriseId) {
      return null;
    }
    return { id: utilisateur.entrepriseId, nom: utilisateur.entrepriseNom ?? '' };
  });

  aRole(...roles: readonly Role[]): boolean {
    const actuels = this.roles();
    return roles.some((role) => actuels.includes(role));
  }

  jetonRafraichissement(): string | null {
    return localStorage.getItem(CLE_JETON_RAFRAICHISSEMENT);
  }

  /** Authentifie l'utilisateur, puis charge son profil pour connaître ses rôles. */
  authentifier(identifiants: DemandeAuthentification): Observable<Utilisateur> {
    return this.http
      .post<ReponseAuthentification>(`${this.baseUrl}/auth/authenticate`, identifiants, {
        context: contexteHorsSession(),
      })
      .pipe(
        tap((reponse) => this.appliquerJetons(reponse)),
        switchMap(() => this.chargerUtilisateur()),
      );
  }

  /**
   * Inscrit une entreprise et son premier administrateur.
   *
   * Le backend renvoie directement un couple de jetons : l'inscription ouvre donc la
   * session, sans repasser par l'écran de connexion.
   */
  inscrire(demande: DemandeInscription): Observable<Utilisateur> {
    return this.http
      .post<ReponseAuthentification>(`${this.baseUrl}/auth/register`, demande, {
        context: contexteHorsSession(),
      })
      .pipe(
        tap((reponse) => this.appliquerJetons(reponse)),
        switchMap(() => this.chargerUtilisateur()),
      );
  }

  /**
   * Demande l'envoi d'un code de réinitialisation.
   *
   * Le backend répond de la même façon que l'email soit connu ou non : l'interface ne peut
   * donc pas — et ne doit pas — dire à l'utilisateur si le compte existe.
   */
  demanderReinitialisation(demande: DemandeMotDePasseOublie): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/auth/forgot-password`, demande, {
      context: contexteHorsSession(),
    });
  }

  /** Définit un nouveau mot de passe à partir du code reçu par email. */
  reinitialiser(demande: DemandeReinitialisationMotDePasse): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/auth/reset-password`, demande, {
      context: contexteHorsSession(),
    });
  }

  /**
   * Change le mot de passe de l'utilisateur connecté, puis recharge son profil — c'est lui
   * qui porte `mustChangePassword`, et la garde s'appuie dessus.
   *
   * Le rafraîchissement est désactivé sur cet appel : un `401` y signifie « ancien mot de
   * passe incorrect », pas « session expirée ». Sans cette exclusion, une faute de frappe
   * déconnecterait l'utilisateur au lieu de lui afficher l'erreur.
   */
  changerMotDePasse(demande: DemandeChangementMotDePasse): Observable<Utilisateur> {
    return this.http
      .post<void>(`${this.baseUrl}/utilisateurs/change-password`, demande, {
        context: new HttpContext()
          .set(SANS_RAFRAICHISSEMENT, true)
          .set(SANS_NOTIFICATION_ERREUR, true),
      })
      .pipe(switchMap(() => this.chargerUtilisateur()));
  }

  /** Recharge le profil courant. Source de vérité des rôles et de l'entreprise. */
  chargerUtilisateur(): Observable<Utilisateur> {
    return this.http
      .get<Utilisateur>(`${this.baseUrl}/utilisateurs/me`)
      .pipe(tap((utilisateur) => this.utilisateurCourant.set(utilisateur)));
  }

  /**
   * Rafraîchit le jeton d'accès, une seule fois à la fois.
   *
   * Toutes les requêtes qui échouent pendant qu'un rafraîchissement est en vol
   * s'abonnent au même flux et sont rejouées avec le jeton obtenu. L'échec du
   * rafraîchissement déconnecte proprement.
   */
  rafraichir(): Observable<string> {
    this.fluxRafraichissement ??= this.appelerRafraichissement().pipe(
      tap((reponse) => this.appliquerJetons(reponse)),
      map((reponse) => reponse.token ?? ''),
      catchError((erreur: HttpErrorResponse) => {
        this.deconnecter();
        return throwError(() => erreur);
      }),
      finalize(() => {
        this.fluxRafraichissement = null;
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    return this.fluxRafraichissement;
  }

  /** Efface toute trace de session, en mémoire comme sur le disque. */
  deconnecter(): void {
    this.jetonAcces.set(null);
    this.utilisateurCourant.set(null);
    this.fluxRafraichissement = null;
    localStorage.removeItem(CLE_JETON_RAFRAICHISSEMENT);
  }

  /**
   * Restaure la session au démarrage de l'application : le jeton d'accès a disparu avec le
   * rechargement, seul le jeton de rafraîchissement subsiste.
   */
  restaurerSession(): Observable<Utilisateur | null> {
    if (this.jetonRafraichissement() === null) {
      return of(null);
    }

    return this.rafraichir().pipe(
      switchMap(() => this.chargerUtilisateur()),
      catchError(() => of(null)),
    );
  }

  private appelerRafraichissement(): Observable<ReponseAuthentification> {
    const jeton = this.jetonRafraichissement();
    if (jeton === null) {
      return throwError(
        () => new HttpErrorResponse({ status: 401, statusText: 'Aucun jeton de rafraîchissement' }),
      );
    }

    // Le backend lit le jeton de rafraîchissement dans l'en-tête Authorization, sans corps
    // de requête. Ce détail n'est pas décrit par la spécification, voir docs/06-API-CONTRAT.
    return this.http.post<ReponseAuthentification>(`${this.baseUrl}/auth/refresh-token`, null, {
      headers: { Authorization: `Bearer ${jeton}` },
      context: contexteHorsSession(),
    });
  }

  private appliquerJetons(reponse: ReponseAuthentification): void {
    this.jetonAcces.set(reponse.token ?? null);
    if (reponse.refreshToken) {
      localStorage.setItem(CLE_JETON_RAFRAICHISSEMENT, reponse.refreshToken);
    }
  }
}

/**
 * Contexte des appels qui n'ont pas de session à présenter : ni jeton attaché, ni tentative
 * de rafraîchissement si le serveur refuse — le refus est alors la réponse attendue.
 */
function contexteHorsSession(): HttpContext {
  return new HttpContext()
    .set(SANS_JETON, true)
    .set(SANS_RAFRAICHISSEMENT, true)
    .set(SANS_NOTIFICATION_ERREUR, true);
}
