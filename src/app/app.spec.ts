import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, expect, it } from 'vitest';
import { App } from './app';
import { provideAppConfig } from './core/config/app-config';
import { ServiceNotifications } from './core/notifications/notifications';

async function monter() {
  await TestBed.configureTestingModule({
    imports: [App],
    providers: [
      provideRouter([]),
      provideHttpClient(),
      provideHttpClientTesting(),
      provideAppConfig(),
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(App);
  await fixture.whenStable();
  return fixture;
}

describe('App', () => {
  it('monte la sortie du routeur et la zone de notifications', async () => {
    const fixture = await monter();
    const racine = fixture.nativeElement as HTMLElement;

    expect(racine.querySelector('app-zone-notifications')).not.toBeNull();
  });

  it('affiche les notifications poussées depuis le noyau', async () => {
    const fixture = await monter();

    TestBed.inject(ServiceNotifications).erreur('Stock insuffisant pour ART-00187');
    await fixture.whenStable();

    const racine = fixture.nativeElement as HTMLElement;
    expect(racine.textContent).toContain('Stock insuffisant pour ART-00187');
  });
});
