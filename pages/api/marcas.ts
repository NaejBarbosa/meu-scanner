// pages/api/marcas.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getSheetData } from '../../lib/googleSheets';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const sheetId = process.env.BANCO_VALIDA_SHEET_ID as string;
    // planilha "banco_valida_marca" deve ter duas colunas: marca-id, marca-descr
    const data = await getSheetData(sheetId, 'banco_valida_marca!A:B');
    // ignora cabeçalho
    const marcas = data.slice(1).map(row => ({
      id: row[0],
      descr: row[1],
    }));
    res.status(200).json(marcas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar marcas' });
  }
}