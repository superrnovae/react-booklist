/**
 * Génération d'identifiants côté client. Sert de clé d'idempotence pour les
 * mutations (conservée entre deux tentatives de synchronisation) et d'id
 * temporaire pour les ouvrages créés hors ligne.
 */
export function genererId(): string {
  const g = globalThis as { crypto?: { randomUUID?: () => string } };
  if (g.crypto?.randomUUID) return g.crypto.randomUUID();
  // Repli v4 si l'environnement n'expose pas crypto.randomUUID (Hermes ancien).
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
