// pages/api/cadastrados.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getSheetData } from '../../lib/googleSheets';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  try {
    const sheetId = process.env.BANCO_CADASTRO_SHEET_ID as string;
    if (!sheetId) {
      return res.status(500).json({ error: 'Variável BANCO_CADASTRO_SHEET_ID não configurada' });
    }

    // Colunas: A=ID, B=Timestamp, C=MarcaId, D=MarcaDesc, E=ProdutoClasse, F=ProdutoEan, G=ProdutoDesc, H=ProdutoValidade, I=Camara, J=CamaraVaga
    const data = await getSheetData(sheetId, 'A:J');

    if (!data || data.length <= 1) {
      return res.status(200).json([]);
    }

    // Ignorar a linha de cabeçalho
    const rows = data.slice(1).map((row) => ({
      id: row[0] || '',
      timestamp: row[1] || '',
      marcaId: row[2] || '',
      marcaDescr: row[3] || '',
      produtoClasse: row[4] || '',
      produtoEan: row[5] || '',
      produtoDescr: row[6] || '',
      produtoValidade: row[7] || '',
      camara: row[8] || '',
      camaraVaga: row[9] || '',
    }));

    res.status(200).json(rows);
  } catch (error) {
    console.error('Erro ao buscar cadastros:', error);
    res.status(500).json({ error: 'Erro ao buscar dados de banco_cadastro' });
  }
}
