import { Pipe, inject, type PipeTransform } from '@angular/core';
import { APP_LOCALE, DEVISE } from '../../core/config/app-config';

/**
 * Formate un montant dans la devise de l'entreprise.
 *
 * Le symbole suit le montant et le nombre de décimales vient de la configuration : le franc
 * CFA n'a pas de subdivision en usage, mais une entreprise hors zone CFA change de devise
 * sans modification de code (ADR-009).
 */
@Pipe({ name: 'montant' })
export class MontantPipe implements PipeTransform {
  private readonly devise = inject(DEVISE);
  private readonly locale = inject(APP_LOCALE);

  private readonly format = new Intl.NumberFormat(this.locale, {
    minimumFractionDigits: this.devise.decimales,
    maximumFractionDigits: this.devise.decimales,
  });

  transform(valeur: number | null | undefined): string {
    if (valeur === null || valeur === undefined) {
      return '—';
    }
    return `${this.format.format(valeur)} ${this.devise.symbole}`;
  }
}
