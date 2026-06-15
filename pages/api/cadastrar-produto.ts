// pages/api/cadastrar-produto.ts
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

  if (!produtoEan || !produtoDescr || !marcaId || !produtoClasse || !produtoConservacao) {
    return res.status(400).json({ error: 'Dados obrigatórios incompletos' });
  }

  try {
    const sheetId = process.env.BANCO_VALIDA_SHEET_ID;
    if (!sheetId) {
      return res.status(500).json({ error: 'Erro: A variável de ambiente BANCO_VALIDA_SHEET_ID não está configurada no servidor.' });
    }
    
    // As colunas da aba banco_valida são: 
    // marca-id, marca-descr, produto-classe, produto-ean, produto-dun, produto-conservacao, produto-descr
    await appendRow(sheetId, 'banco_valida!A:G', [
      marcaId,
      marcaDescr,
      produtoClasse,
      produtoEan,
      produtoDun || '',
      produtoConservacao,
      produtoDescr,
    ]);

    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Erro ao cadastrar produto:', error);
    const msg = error?.message || error?.toString() || 'Erro interno do servidor';
    res.status(500).json({ error: `Erro na gravação do Sheets: ${msg}` });
  }
}
