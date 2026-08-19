import { Pipe, inject, type PipeTransform } from '@angular/core';
import { APP_LOCALE } from '../../core/config/app-config';

/**
 * Formate une quantité de stock.
 *
 * Le backend porte les quantités en décimal — un article peut se compter au kilo comme à
 * l'unité. Les décimales ne sont affichées que lorsqu'il y en a : « 12 », jamais « 12,000 ».
 */
@Pipe({ name: 'quantite' })
export class QuantitePipe implements PipeTransform {
  private readonly locale = inject(APP_LOCALE);

  private readonly format = new Intl.NumberFormat(this.locale, {
    maximumFractionDigits: 3,
  });

  transform(valeur: number | null | undefined): string {
    if (valeur === null || valeur === undefined) {
      return '—';
    }
    return this.format.format(valeur);
  }
}
