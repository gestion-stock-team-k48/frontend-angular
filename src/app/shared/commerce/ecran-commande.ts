import { httpResource } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  linkedSignal,
  output,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormField, form, maxLength, required, submit } from '@angular/forms/signals';
import { firstValueFrom, type Observable } from 'rxjs';
import { ServiceNotifications } from '../../core/notifications/notifications';
import { Badge } from '../ui/badge/badge';
import { Bouton } from '../ui/bouton/bouton';
import { Champ } from '../ui/champ/champ';
import { EtatVide } from '../ui/etat-vide/etat-vide';
import { MontantPipe } from '../pipes/montant';
import { messageDuChamp, repartirErreur } from '../formulaires/erreurs-formulaire';
import {
  TAILLE_LISTE_DEROULANTE,
  parametresDePage,
  type ReponsePage,
} from '../../core/api/pagination';
import { EditeurLignes } from './editeur-lignes';
import { lignesValides, type LigneSaisie } from './lignes';
import { actionVers, libelleEtat, modifiable, tonEtat, transitionsLegales } from './etats-commande';
import {
  libelleTiers as nomDuTiers,
  saisieDepuis,
  type CommandeVue,
  type OptionTiers,
  type SaisieCommande,
} from './commande';
import type { Article, EtatCommande } from '../../core/api/api-types';

/** Longueur reprise des contraintes portées par les deux DTO de commande. */
const MAX_CODE = 30;

/**
 * Écran d'une commande : création, modification, et lecture.
 *
 * Un seul écran pour les trois, parce qu'ils montrent la même chose. Une commande ne se
 * modifie que tant qu'elle est en préparation ; passée cette étape, l'écran devient une
 * fiche, et ne propose plus que les transitions que le serveur accepte.
 */
@Component({
  selector: 'app-ecran-commande',
  templateUrl: './ecran-commande.html',
  styleUrl: './ecran-commande.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    FormField,
    RouterLink,
    Badge,
    Bouton,
    Champ,
    EtatVide,
    EditeurLignes,
    MontantPipe,
  ],
})
export class EcranCommande {
  private readonly notifications = inject(ServiceNotifications);

  readonly libelleTiers = input.required<string>();
  readonly cheminBase = input.required<string>();
  readonly urlTiers = input.required<string>();
  readonly urlArticles = input.required<string>();

  /** Nom du champ tiers côté backend — `idClient` ou `idFournisseur`. */
  readonly champTiers = input.required<string>();

  readonly commande = input<CommandeVue | null>(null);
  readonly chargement = input(false);
  readonly introuvable = input(false);

  readonly enregistrer = input.required<(saisie: SaisieCommande) => Observable<unknown>>();
  readonly changerEtat = input<((etat: EtatCommande) => Observable<unknown>) | null>(null);

  readonly enregistree = output<void>();
  readonly etatChange = output<void>();

  protected readonly libelleEtat = libelleEtat;
  protected readonly tonEtat = tonEtat;

  private readonly ressourceTiers = httpResource<ReponsePage<OptionTiers>>(() => ({
    url: this.urlTiers(),
    params: parametresDePage({ page: 0, taille: TAILLE_LISTE_DEROULANTE }),
  }));

  private readonly ressourceArticles = httpResource<ReponsePage<Article>>(() => ({
    url: this.urlArticles(),
    params: parametresDePage({ page: 0, taille: TAILLE_LISTE_DEROULANTE }),
  }));

  protected readonly tiers = computed(() => this.ressourceTiers.value()?.content ?? []);

  protected readonly articles = computed(() => this.ressourceArticles.value()?.content ?? []);

  /** Vrai quand le serveur en a plus que ce que la liste déroulante peut montrer. */
  protected readonly catalogueTronque = computed(
    () => (this.ressourceArticles.value()?.totalElements ?? 0) > TAILLE_LISTE_DEROULANTE,
  );

  protected readonly tiersTronques = computed(
    () => (this.ressourceTiers.value()?.totalElements ?? 0) > TAILLE_LISTE_DEROULANTE,
  );

  protected readonly nomDuTiers = nomDuTiers;

  protected readonly creation = computed(() => this.commande() === null);

  protected readonly ouvertALaSaisie = computed(
    () => this.creation() || modifiable(this.commande()?.etat),
  );

  protected readonly transitions = computed(() => transitionsLegales(this.commande()?.etat));

  protected readonly actionVers = actionVers;

  private readonly saisie = linkedSignal<SaisieCommande>(() => saisieDepuis(this.commande()));

  protected readonly lignes = linkedSignal<LigneSaisie[]>(() => this.saisie().lignes);

  protected readonly formulaire = form(this.saisie, (champ) => {
    maxLength(champ.code, MAX_CODE, {
      message: `Le code ne doit pas dépasser ${MAX_CODE} caractères`,
    });
    required(champ.date, { message: 'La date de commande est obligatoire' });
    required(champ.tiersId, { message: 'Le tiers est obligatoire' });
  });

  protected readonly message = signal<string | null>(null);

  protected readonly enCours = computed(() => this.formulaire().submitting());

  protected readonly transitionEnCours = signal<EtatCommande | null>(null);

  protected readonly erreurCode = this.erreurDe('code');
  protected readonly erreurDate = this.erreurDe('date');
  protected readonly erreurTiers = this.erreurDe('tiersId');

  protected async soumettre(): Promise<void> {
    this.message.set(null);

    if (!lignesValides(this.lignes())) {
      this.message.set('La commande doit contenir au moins une ligne complète.');
      return;
    }

    await submit(this.formulaire, {
      action: async () => {
        const saisie: SaisieCommande = { ...this.saisie(), lignes: this.lignes() };

        try {
          await firstValueFrom(this.enregistrer()(saisie));
          this.enregistree.emit();
          return undefined;
        } catch (erreur) {
          const echec = repartirErreur(erreur, {
            codeCommande: this.formulaire.code,
            dateCommande: this.formulaire.date,
            [this.champTiers()]: this.formulaire.tiersId,
          });
          this.message.set(echec.message);
          return echec.erreurs;
        }
      },
    });
  }

  protected async appliquer(etat: EtatCommande): Promise<void> {
    const action = this.changerEtat();
    if (action === null) {
      return;
    }

    this.message.set(null);
    this.transitionEnCours.set(etat);
    try {
      await firstValueFrom(action(etat));
      this.notifications.succes(actionVers(etat).succes, this.commande()?.code ?? '');
      this.etatChange.emit();
    } catch {
      // Stock insuffisant, transition devenue illégale : l'intercepteur a présenté le refus.
      // L'écran se recharge pour repartir de l'état réel.
      this.etatChange.emit();
    } finally {
      this.transitionEnCours.set(null);
    }
  }

  private erreurDe(nom: 'code' | 'date' | 'tiersId') {
    return computed(() => {
      const champ = this.formulaire[nom]();
      return champ.touched() ? messageDuChamp(champ.errors()) : null;
    });
  }
}
