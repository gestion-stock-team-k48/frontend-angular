import { Injectable, signal } from '@angular/core';

export type NiveauNotification = 'succes' | 'information' | 'avertissement' | 'erreur';

export interface Notification {
  readonly id: number;
  readonly niveau: NiveauNotification;
  readonly message: string;
  /** Action corrective proposée à l'utilisateur, quand il y en a une. */
  readonly detail?: string;
}

/**
 * File des notifications à présenter. Ce service ne dessine rien : le composant qui les
 * affiche arrive avec le design system (phase 3). Jusque-là, elles restent lisibles ici,
 * ce qui suffit à ne perdre aucune erreur.
 */
@Injectable({ providedIn: 'root' })
export class ServiceNotifications {
  private readonly file = signal<readonly Notification[]>([]);
  private compteur = 0;

  readonly notifications = this.file.asReadonly();

  succes(message: string, detail?: string): void {
    this.ajouter('succes', message, detail);
  }

  information(message: string, detail?: string): void {
    this.ajouter('information', message, detail);
  }

  avertissement(message: string, detail?: string): void {
    this.ajouter('avertissement', message, detail);
  }

  erreur(message: string, detail?: string): void {
    this.ajouter('erreur', message, detail);
  }

  fermer(id: number): void {
    this.file.update((liste) => liste.filter((notification) => notification.id !== id));
  }

  vider(): void {
    this.file.set([]);
  }

  private ajouter(niveau: NiveauNotification, message: string, detail?: string): void {
    const notification: Notification = { id: ++this.compteur, niveau, message, detail };
    this.file.update((liste) => [...liste, notification]);
  }
}
