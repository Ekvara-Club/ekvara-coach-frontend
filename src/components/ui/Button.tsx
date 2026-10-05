import type { ButtonHTMLAttributes } from 'react';

// Fondation du design system EKVARA, identique à EkvaraFrontend — même
// composant, même comportement, un seul système de design pour la marque.
export type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'ghost' | 'ghost-light' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const BASE_CLASSES =
  'inline-flex items-center justify-center gap-1.5 font-sans text-sm font-medium transition-[color,background-color,border-color,opacity,transform] duration-150 disabled:cursor-not-allowed disabled:opacity-50';

const SURFACE_CLASSES = 'rounded-md px-4 py-2.5 active:scale-[0.98]';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: `${SURFACE_CLASSES} bg-ekvara-black text-ekvara-surface hover:bg-black`,
  secondary: `${SURFACE_CLASSES} border border-ekvara-black/15 bg-ekvara-surface text-ekvara-black hover:border-ekvara-black/30`,
  accent: `${SURFACE_CLASSES} bg-ekvara-lime text-ekvara-black hover:bg-[#cdf22e]`,
  ghost: '-my-2.5 py-2.5 text-ekvara-black hover:opacity-70',
  'ghost-light': '-my-2.5 py-2.5 text-ekvara-surface hover:opacity-70',
  // Réservé aux confirmations destructives finales (retrait du roster,
  // suppression de groupe, annulation de séance, suppression d'exercice) —
  // jamais pour une action courante (ticket #2 §29).
  danger: `${SURFACE_CLASSES} bg-red-600 text-white hover:bg-red-700`,
};

function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  return (
    <button
      type="button"
      className={`${BASE_CLASSES} ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  );
}

export default Button;
