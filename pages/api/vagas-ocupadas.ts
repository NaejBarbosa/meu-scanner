// pages/api/vagas-ocupadas.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getSheetData } from '../../lib/googleSheets';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  try {
    const sheetId = process.env.BANCO_CADASTRO_SHEET_ID;
    if (!sheetId) {
      return res.status(500).json({ error: 'Variável BANCO_CADASTRO_SHEET_ID não configurada.' });
    }

    // Colunas: I=Camara, J=CamaraVaga
    // Vamos buscar I e J para obter todas as combinações gravadas
    const data = await getSheetData(sheetId, 'I:J');
    
    // Se não há dados ou só cabeçalho
    if (!data || data.length <= 1) {
      return res.status(200).json([]);
    }

    // Mapeia e filtra linhas válidas (pulando o cabeçalho)
    const ocupadas = data.slice(1).map((row) => ({
      camara: (row[0] || '').trim(),
      vaga: (row[1] || '').trim(),
    })).filter(item => item.camara !== '' && item.vaga !== '');

    res.status(200).json(ocupadas);
  } catch (error) {
    console.error('Erro ao buscar vagas ocupadas:', error);
    res.status(500).json({ error: 'Erro ao buscar vagas ocupadas' });
  }
}
