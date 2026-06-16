// pages/api/cadastrar.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getSheetData, appendRow } from '../../lib/googleSheets';

async function getNextRegistroId(sheetId: string): Promise<number> {
  const data = await getSheetData(sheetId, 'A:A');
  if (!data || data.length <= 1) return 1;
  const ids = data.slice(1).map(row => parseInt(row[0], 10)).filter(id => !isNaN(id));
  const maxId = ids.length > 0 ? Math.max(...ids) : 0;
  return maxId + 1;
}

function getSantaCatarinaTimestamp(): string {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  };
  return new Intl.DateTimeFormat('pt-BR', options).format(now);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const {
    marcaId,
    marcaDescr,
    produtoClasse,
    produtoEan,
    produtoDescr,
    produtoValidade,
    camara,
    camaraVaga,
  } = req.body;

  if (!produtoEan || !produtoValidade) {
    return res.status(400).json({ error: 'Dados incompletos' });
  }

  try {
    const sheetId = process.env.BANCO_CADASTRO_SHEET_ID as string;
    const registroId = await getNextRegistroId(sheetId);
    const registroTimestamp = getSantaCatarinaTimestamp();

    // Colunas: A=ID, B=Timestamp, C=MarcaId, D=MarcaDesc, E=ProdutoClasse, F=ProdutoEan, G=ProdutoDesc, H=ProdutoValidade, I=Camara, J=CamaraVaga
    await appendRow(sheetId, 'A:J', [
      registroId,
      registroTimestamp,
      marcaId || '',
      marcaDescr || '',
      produtoClasse || '',
      produtoEan,
      produtoDescr || '',
      produtoValidade,
      camara || '',
      camaraVaga || '',
    ]);

    res.status(200).json({ success: true, registroId, registroTimestamp });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao gravar no banco_cadastro' });
  }
}