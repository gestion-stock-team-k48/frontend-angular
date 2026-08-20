import { httpResource } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  linkedSignal,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  FormField,
  form,
  maxLength,
  min,
  required,
  submit,
  validate,
} from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL, DEVISE } from '../../../core/config/app-config';
import { ServiceNotifications } from '../../../core/notifications/notifications';
import { Bouton } from '../../../shared/ui/bouton/bouton';
import { Champ } from '../../../shared/ui/champ/champ';
import { MontantPipe } from '../../../shared/pipes/montant';
import { messageDuChamp, repartirErreur } from '../../../shared/formulaires/erreurs-formulaire';
import { ApiArticles } from '../article-api';
import type { Article, Categorie } from '../../../core/api/api-types';

/** Longueurs reprises des contraintes de `ArticleRequest`. */
const MAX_CODE = 20;
const MAX_DESIGNATION = 255;

interface SaisieArticle {
  code: string;
  designation: string;
  prixUnitaireHt: number;
  tauxTva: number;
  seuilMinimum: number;
  /**
   * Tenue en texte, comme toute valeur de `select` : la conversion en identifiant se fait
   * à l'envoi, une seule fois, plutôt qu'à chaque frappe.
   */
  categoryId: string;
}

/** Valeur de l'option vide du `select`. */
const AUCUNE_CATEGORIE = '';

/**
 * Création et modification d'un article.
 *
 * Le prix TTC est calculé, jamais saisi. Le backend l'exige dans sa requête mais ne le
 * dérive pas lui-même : laisser les deux prix se saisir séparément mettrait tôt ou tard en
 * base un TTC en désaccord avec son HT.
 */
@Component({
  selector: 'app-formulaire-article',
  templateUrl: './formulaire-article.html',
  styleUrl: './formulaire-article.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, RouterLink, Bouton, Champ, MontantPipe],
})
export class FormulaireArticle {
  private readonly api = inject(ApiArticles);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly devise = inject(DEVISE);
  private readonly notifications = inject(ServiceNotifications);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  /** Identifiant porté par l'URL, ou `null` en création. */
  protected readonly identifiant = signal<number | null>(
    Number.parseInt(this.route.snapshot.paramMap.get('id') ?? '', 10) || null,
  );

  private readonly ressourceArticle = httpResource<Article>(() => {
    const id = this.identifiant();
    return id === null ? undefined : `${this.api.url}/${id}`;
  });

  private readonly ressourceCategories = httpResource<Categorie[]>(
    () => `${this.baseUrl}/categories`,
    { defaultValue: [] },
  );

  protected readonly categories = this.ressourceCategories.value;

  protected readonly modification = computed(() => this.identifiant() !== null);

  protected readonly chargement = computed(() => this.ressourceArticle.isLoading());

  protected readonly introuvable = computed(() => this.ressourceArticle.error() !== undefined);

  private readonly saisie = linkedSignal<SaisieArticle>(() => {
    const article = this.ressourceArticle.value();
    return {
      code: article?.code ?? '',
      designation: article?.designation ?? '',
      prixUnitaireHt: article?.prixUnitaireHt ?? 0,
      tauxTva: article?.tauxTva ?? 0,
      seuilMinimum: article?.seuilMinimum ?? 0,
      categoryId: article?.categoryId === undefined ? AUCUNE_CATEGORIE : String(article.categoryId),
    };
  });

  protected readonly formulaire = form(this.saisie, (champ) => {
    required(champ.code, { message: 'Le code est obligatoire' });
    maxLength(champ.code, MAX_CODE, {
      message: `Le code ne doit pas dépasser ${MAX_CODE} caractères`,
    });

    required(champ.designation, { message: 'La désignation est obligatoire' });
    maxLength(champ.designation, MAX_DESIGNATION, {
      message: `La désignation ne doit pas dépasser ${MAX_DESIGNATION} caractères`,
    });

    validate(champ.prixUnitaireHt, ({ value }) =>
      value() > 0 ? undefined : { kind: 'positif', message: 'Le prix HT doit être positif' },
    );

    min(champ.tauxTva, 0, { message: 'Le taux de TVA ne peut pas être négatif' });

    min(champ.seuilMinimum, 0, { message: 'Le seuil minimal ne peut pas être négatif' });

    validate(champ.categoryId, ({ value }) =>
      value() === AUCUNE_CATEGORIE
        ? { kind: 'requis', message: 'La catégorie est obligatoire' }
        : undefined,
    );
  });

  /**
   * Prix TTC dérivé du HT et du taux, arrondi selon la devise : en franc CFA, aucune
   * décimale n'a cours, et envoyer un centime que personne ne peut payer n'aurait pas de sens.
   */
  protected readonly prixTtc = computed(() => {
    const saisie = this.saisie();
    const facteur = 10 ** this.devise.decimales;
    return Math.round(saisie.prixUnitaireHt * (1 + saisie.tauxTva / 100) * facteur) / facteur;
  });

  protected readonly message = signal<string | null>(null);

  protected readonly enCours = computed(() => this.formulaire().submitting());

  protected readonly photoEnvoi = signal(false);

  protected readonly photoEnregistree = computed(
    () => this.ressourceArticle.value()?.photo ?? null,
  );

  protected readonly erreurCode = this.erreurDe('code');
  protected readonly erreurDesignation = this.erreurDe('designation');
  protected readonly erreurPrixHt = this.erreurDe('prixUnitaireHt');
  protected readonly erreurTauxTva = this.erreurDe('tauxTva');
  protected readonly erreurSeuil = this.erreurDe('seuilMinimum');
  protected readonly erreurCategorie = this.erreurDe('categoryId');

  protected async enregistrer(): Promise<void> {
    this.message.set(null);

    await submit(this.formulaire, {
      action: async () => {
        const saisie = this.saisie();
        const id = this.identifiant();
        const demande = {
          ...saisie,
          categoryId: Number(saisie.categoryId),
          prixUnitaireTtc: this.prixTtc(),
        };

        try {
          const article = await firstValueFrom(
            id === null ? this.api.creer(demande) : this.api.modifier(id, demande),
          );
          this.notifications.succes(
            id === null ? 'Article créé' : 'Article modifié',
            article.designation,
          );
          await this.router.navigate(['/articles']);
          return undefined;
        } catch (erreur) {
          const echec = repartirErreur(erreur, {
            code: this.formulaire.code,
            designation: this.formulaire.designation,
          });
          this.message.set(echec.message);
          return echec.erreurs;
        }
      },
    });
  }

  protected async envoyerPhoto(evenement: Event): Promise<void> {
    const cible = evenement.target;
    const fichier = cible instanceof HTMLInputElement ? cible.files?.[0] : undefined;
    const id = this.identifiant();

    if (fichier === undefined || id === null) {
      return;
    }

    this.photoEnvoi.set(true);
    try {
      await firstValueFrom(this.api.envoyerPhoto(id, fichier));
      this.notifications.succes('Photo enregistrée', fichier.name);
      this.ressourceArticle.reload();
    } catch {
      // L'intercepteur d'erreurs a déjà présenté l'échec de l'envoi.
    } finally {
      this.photoEnvoi.set(false);
      if (cible instanceof HTMLInputElement) {
        cible.value = '';
      }
    }
  }

  private erreurDe(nom: keyof SaisieArticle) {
    return computed(() => {
      const champ = this.formulaire[nom]();
      return champ.touched() ? messageDuChamp(champ.errors()) : null;
    });
  }
}
