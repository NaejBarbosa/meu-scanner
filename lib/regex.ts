// lib/regex.ts
export function extrairDados(qrData: string) {
  const clean = qrData.trim();
  // Exemplo: "230026;17896419729201;20260511101502613103175;"
  const regex = /^\d+;(1\d{13});(\d{8})\d{10,};\s*$/;
  const match = clean.match(regex);
  if (!match) return null;

  const codigoBruto = match[1];       // "17896419729201"
  const dataFabricacao = match[2];    // "20260511"

  // Remove o primeiro dígito "1" para obter o EAN de 13 dígitos
  const ean = codigoBruto.substring(1);

  // Calcula validade = fabricação + 365 dias
  const ano = parseInt(dataFabricacao.substring(0, 4));
  const mes = parseInt(dataFabricacao.substring(4, 6)) - 1;
  const dia = parseInt(dataFabricacao.substring(6, 8));
  const fabricacao = new Date(ano, mes, dia);
  const validade = new Date(fabricacao);
  validade.setDate(validade.getDate() + 365);

  const validadeStr = validade.toISOString().split('T')[0]; // YYYY-MM-DD

  return { ean, dataFabricacao, validade: validadeStr };
}