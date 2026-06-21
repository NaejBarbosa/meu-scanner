// types/fuzzball.d.ts
declare module 'fuzzball' {
  export function token_set_ratio(str1: string, str2: string, options?: any): number;
  export function extract(query: string, choices: any[], options?: any): any[];
}
