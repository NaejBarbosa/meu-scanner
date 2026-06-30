// lib/badgeUtils.ts

/**
 * Retorna as classes CSS do Tailwind para o badge de acordo com a classe do produto,
 * garantindo cores distintas e elegantes para cada categoria, sem colidir com verde (validade)
 * e azul/amarelo (conservação).
 */
export function getClasseBadgeColor(classe: string | null | undefined): string {
  const norm = classe?.toLowerCase().trim() || '';
  
  if (norm.includes('ave')) {
    // Aves: Pink
    return 'bg-pink-100 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 border border-pink-200/50 dark:border-pink-800/30';
  }
  if (norm.includes('suín') || norm.includes('suin')) {
    // Suínos: Purple
    return 'bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200/50 dark:border-purple-800/30';
  }
  if (norm.includes('bovin')) {
    // Bovinos: Rose
    return 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/50 dark:border-rose-800/30';
  }
  if (norm.includes('lanche')) {
    // Lanches: Indigo
    return 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/30';
  }
  if (norm.includes('margarina')) {
    // Margarinas: Orange
    return 'bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border border-orange-200/50 dark:border-orange-800/30';
  }
  
  // Outros ou Fallback: Violet
  return 'bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border border-violet-200/50 dark:border-violet-800/30';
}
