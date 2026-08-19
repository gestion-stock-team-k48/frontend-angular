import { InjectionToken, makeEnvironmentProviders, type EnvironmentProviders } from '@angular/core';
import { environment } from '../../../environments/environment';

/** Racine de l'API. Toujours injectée, jamais écrite en dur dans un service. */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL');

/** Locale de l'interface, au format BCP 47. */
export const APP_LOCALE = new InjectionToken<string>('APP_LOCALE');

/** Format monétaire de l'entreprise. Voir ADR-009. */
export interface ConfigurationDevise {
  /** Code ISO 4217, par exemple `XAF`. */
  readonly code: string;
  /** Symbole affiché après le montant, par exemple `FCFA`. */
  readonly symbole: string;
  /** Nombre de décimales. Le franc CFA n'a pas de subdivision en usage : 0. */
  readonly decimales: number;
}

export const DEVISE = new InjectionToken<ConfigurationDevise>('DEVISE');

const DEVISE_PAR_DEFAUT: ConfigurationDevise = {
  code: 'XAF',
  symbole: 'FCFA',
  decimales: 0,
};

/**
 * Fournit la configuration applicative. Les valeurs par défaut viennent de
 * `environment.ts` et d'ADR-009 ; elles restent surchargeables au démarrage.
 */
export function provideAppConfig(options?: {
  apiBaseUrl?: string;
  locale?: string;
  devise?: ConfigurationDevise;
}): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: API_BASE_URL, useValue: options?.apiBaseUrl ?? environment.apiBaseUrl },
    { provide: APP_LOCALE, useValue: options?.locale ?? 'fr' },
    { provide: DEVISE, useValue: options?.devise ?? DEVISE_PAR_DEFAUT },
  ]);
}
