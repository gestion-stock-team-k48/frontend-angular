/**
 * Mise en place commune aux tests unitaires.
 *
 * jsdom implémente `<dialog>` comme un élément ordinaire : ni `showModal`, ni `close`, ni
 * `open`. La modale du design system s'appuie sur ces méthodes natives (ADR-011). Les
 * combler ici évite que chaque test qui croise une modale ait à s'en occuper — et évite
 * surtout de tordre le composant pour l'amuser d'un environnement de test.
 */
const dialogue = globalThis.HTMLDialogElement?.prototype;

if (dialogue !== undefined && typeof dialogue.showModal !== 'function') {
  Object.defineProperty(dialogue, 'open', {
    configurable: true,
    get(this: HTMLDialogElement) {
      return this.hasAttribute('open');
    },
    set(this: HTMLDialogElement, valeur: boolean) {
      if (valeur) {
        this.setAttribute('open', '');
      } else {
        this.removeAttribute('open');
      }
    },
  });

  dialogue.showModal = function showModal(this: HTMLDialogElement): void {
    this.setAttribute('open', '');
  };

  dialogue.show = function show(this: HTMLDialogElement): void {
    this.setAttribute('open', '');
  };

  dialogue.close = function close(this: HTMLDialogElement): void {
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  };
}
