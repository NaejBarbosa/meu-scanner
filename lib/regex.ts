// lib/regex.ts
export function extrairDados(qrData: string) {
  const clean = qrData.trim();
  console.log('[extrairDados] Texto bruto:', clean);

  // Padrão: número; 1 + 13 dígitos; data (8 dígitos) + resto
  // Exemplo: 315315;17896419732515;202603197004783;
  const regex = /^\d+;1(\d{13});(\d{8})/;
  const match = clean.match(regex);

  if (!match || !match[1] || !match[2]) {
    console.error('[extrairDados] Regex falhou para:', clean);
    return null;
  }

  const ean13 = match[1];          // "7896419732515" (13 dígitos)
  const dataFabricacao = match[2]; // "20260319"

  // Cálculo da validade: data de fabricação + 365 dias
  const ano = parseInt(dataFabricacao.substring(0, 4));
  const mes = parseInt(dataFabricacao.substring(4, 6)) - 1;
  const dia = parseInt(dataFabricacao.substring(6, 8));
  const fabricacao = new Date(ano, mes, dia);
  const validade = new Date(fabricacao);
  validade.setDate(validade.getDate() + 365);
  const validadeStr = validade.toISOString().split('T')[0];

  return {
    ean: ean13,
    dataFabricacao,
    validade: validadeStr,
  };
}