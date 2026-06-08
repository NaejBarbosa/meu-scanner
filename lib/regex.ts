// lib/regex.ts
export function extrairDados(qrData: string) {
  const clean = qrData.trim();
  console.log('[extrairDados] Texto bruto:', clean);

  // Tentativa 1: regex flexível para padrão "xxx;1yyyyyyyyyyyyy;zzzzzzzz..."
  const regex = /^\d+;(1\d{13});(\d{8})/;
  let match = clean.match(regex);

  if (!match) {
    // Tentativa 2: split por ';' (fallback manual)
    const parts = clean.split(';');
    if (parts.length >= 3) {
      const possibleEan = parts[1];
      if (possibleEan && possibleEan.startsWith('1')) {
        const codigoBruto = possibleEan;
        const dataFabricacao = parts[2].substring(0, 8);
        match = ['', codigoBruto, dataFabricacao];
      }
    }
  }

  if (!match || !match[1] || !match[2]) {
    console.error('[extrairDados] Falha ao extrair dados do texto:', clean);
    return null;
  }

  const codigoBruto = match[1];       // "17896419732515"
  const dataFabricacao = match[2];    // "20260319"

  // Remove o primeiro dígito "1" para obter o EAN de 13 dígitos
  const ean = codigoBruto.substring(1);

  // Calcula validade = fabricação + 365 dias
  const ano = parseInt(dataFabricacao.substring(0, 4));
  const mes = parseInt(dataFabricacao.substring(4, 6)) - 1;
  const dia = parseInt(dataFabricacao.substring(6, 8));
  const fabricacao = new Date(ano, mes, dia);
  const validade = new Date(fabricacao);
  validade.setDate(validade.getDate() + 365);
  const validadeStr = validade.toISOString().split('T')[0];

  return { ean, dataFabricacao, validade: validadeStr };
}