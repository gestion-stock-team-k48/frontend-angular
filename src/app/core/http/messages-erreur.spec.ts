import { HttpErrorResponse } from '@angular/common/http';
import { describe, expect, it } from 'vitest';
import { messageErreurUtilisateur } from './messages-erreur';
import { erreursDeValidation, estReponseErreur } from './error-response';

function erreurBackend(status: number, corps: Record<string, unknown>): HttpErrorResponse {
  return new HttpErrorResponse({ status, error: corps, url: '/api/v1/articles' });
}

describe('messageErreurUtilisateur', () => {
  it('reprend le message métier du backend, déjà rédigé en français', () => {
    const erreur = erreurBackend(409, {
      timestamp: '2026-08-19T11:00:43',
      status: 409,
      error: 'Conflict',
      message: 'Stock insuffisant pour l’article ART-00187 : 3 disponibles, 10 demandés',
      path: '/api/v1/ventes',
    });

    expect(messageErreurUtilisateur(erreur)).toBe(
      'Stock insuffisant pour l’article ART-00187 : 3 disponibles, 10 demandés',
    );
  });

  it('renvoie vers les champs quand la validation a échoué', () => {
    const erreur = erreurBackend(400, {
      timestamp: '2026-08-19T11:00:43',
      status: 400,
      error: 'Bad Request',
      message: "Un ou plusieurs champs sont invalides. Voir 'validationErrors' pour le détail.",
      path: '/api/v1/auth/authenticate',
      validationErrors: { email: "L'email est obligatoire" },
    });

    expect(messageErreurUtilisateur(erreur)).toContain('champs signalés');
    expect(erreursDeValidation(erreur)).toEqual({ email: "L'email est obligatoire" });
  });

  it('remplace un message technique par un repli lisible', () => {
    const erreur = erreurBackend(500, {
      timestamp: '2026-08-19T11:00:43',
      status: 500,
      error: 'Internal Server Error',
      message: 'java.lang.NullPointerException',
      path: '/api/v1/articles',
    });

    expect(messageErreurUtilisateur(erreur)).not.toContain('NullPointerException');
    expect(messageErreurUtilisateur(erreur)).toContain('Réessayer');
  });

  it('distingue une panne réseau d’une réponse du serveur', () => {
    const erreur = new HttpErrorResponse({ status: 0, error: new ProgressEvent('error') });

    expect(messageErreurUtilisateur(erreur)).toContain("n'a pas répondu");
  });

  it('ne prend pour une réponse d’erreur que ce qui en a la forme', () => {
    expect(estReponseErreur({ status: 404, message: 'Absent', path: '/x' })).toBe(true);
    expect(estReponseErreur({ status: '404', message: 'Absent', path: '/x' })).toBe(false);
    expect(estReponseErreur(null)).toBe(false);
    expect(estReponseErreur('erreur')).toBe(false);
  });
});
