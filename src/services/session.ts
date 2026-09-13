// Pont minimal entre les fonctions fetch (hors React) et CoachAuthContext :
// un 401 sur une requête métier prévient un unique abonné plutôt que de
// dupliquer la détection dans chaque page. Même mécanisme que EkvaraFrontend.
type UnauthorizedListener = () => void;

let listener: UnauthorizedListener | null = null;

export function setUnauthorizedListener(fn: UnauthorizedListener | null): void {
  listener = fn;
}

export function notifyUnauthorized(): void {
  listener?.();
}
