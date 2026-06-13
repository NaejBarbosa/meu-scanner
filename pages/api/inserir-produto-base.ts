// pages/api/inserir-produto-base.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { appendRow } from '../../lib/googleSheets';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const {
    marcaId,
    marcaDescr,
    produtoClasse,
    produtoEan,
    produtoDun,
    produtoConservacao,
    produtoDescr,
  } = req.body;

  if (!produtoEan || !marcaId || !produtoDescr || !produtoClasse || !produtoConservacao) {
    return res.status(400).json({ error: 'Campos obrigatórios faltando' });
  }

  try {
    const sheetId = process.env.BANCO_VALIDA_SHEET_ID as string;
    // range A:G conforme a planilha banco_valida
    await appendRow(sheetId, 'A:G', [
      marcaId,
      marcaDescr,
      produtoClasse,
      produtoEan,
      produtoDun || '',
      produtoConservacao,
      produtoDescr,
    ]);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao gravar na base de produtos' });
  }
}