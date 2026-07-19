export type FieldErrors<T> = Partial<Record<keyof T, string>>;

export function validateEmail(email: string): string | null {
  if (!email.trim()) return 'L\'email est obligatoire';
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email) ? null : 'Adresse email invalide';
}

export function validateRequired(value: string, label: string): string | null {
  return value?.trim() ? null : `${label} est obligatoire`;
}

export function validateMinLength(value: string, min: number, label: string): string | null {
  return value.length >= min ? null : `${label} doit faire au moins ${min} caractères`;
}

export function hasErrors<T>(errors: FieldErrors<T>): boolean {
  return Object.values(errors).some((v) => v !== undefined && v !== null && v !== '');
}
