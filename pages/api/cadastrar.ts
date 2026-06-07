// pages/api/cadastrar.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { appendRow } from '../../lib/googleSheets';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') return res.status(405).end();

  const {
    marcaId,
    marcaDescr,
    produtoClasse,
    produtoEan,
    produtoDescr,
    produtoValidade,
  } = req.body;

  if (!produtoEan || !produtoValidade) {
    return res.status(400).json({ error: 'Dados incompletos' });
  }

  try {
    const sheetId = process.env.BANCO_CADASTRO_SHEET_ID as string;
    // Colunas A..F
    await appendRow(sheetId, 'A:F', [
      marcaId,
      marcaDescr,
      produtoClasse,
      produtoEan,
      produtoDescr,
      produtoValidade,
    ]);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao gravar no banco_cadastro' });
  }
}