// pages/api/cadastrar.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getSheetData, appendRow } from '../../lib/googleSheets';

// Função para obter o próximo ID sequencial
async function getNextRegistroId(sheetId: string): Promise<number> {
  try {
    // Lê os dados da coluna A (registro-id)
    const data = await getSheetData(sheetId, 'A:A');
    if (!data || data.length <= 1) return 1; // Apenas cabeçalho ou vazio

    // Pula o cabeçalho (primeira linha)
    const ids = data.slice(1).map(row => parseInt(row[0], 10)).filter(id => !isNaN(id));
    const maxId = ids.length > 0 ? Math.max(...ids) : 0;
    return maxId + 1;
  } catch (error) {
    console.error('Erro ao buscar próximo ID:', error);
    return 1; // Fallback seguro
  }
}

// Função para gerar timestamp no fuso de Santa Catarina (America/Sao_Paulo)
function getSantaCatarinaTimestamp(): string {
  const now = new Date();
  // Formata para o horário local de São Paulo (mesmo fuso de Florianópolis)
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
  const formatter = new Intl.DateTimeFormat('pt-BR', options);
  return formatter.format(now);
}

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
    produtoDun,
    produtoDescr,
    produtoConservacao,
    produtoValidade,
  } = req.body;

  if (!produtoEan || !produtoValidade) {
    return res.status(400).json({ error: 'Dados incompletos' });
  }

  try {
    const sheetId = process.env.BANCO_CADASTRO_SHEET_ID as string;
    
    // Gera o próximo ID sequencial
    const registroId = await getNextRegistroId(sheetId);
    // Gera o timestamp de Santa Catarina
    const registroTimestamp = getSantaCatarinaTimestamp();

    // Agora a planilha tem 10 colunas: A=ID, B=Timestamp, C=MarcaId, D=MarcaDesc, E=ProdutoClasse, F=ProdutoEan, G=ProdutoDun, H=ProdutoDesc, I=ProdutoConservacao, J=ProdutoValidade
    await appendRow(sheetId, 'A:J', [
      registroId,
      registroTimestamp,
      marcaId || '',
      marcaDescr || '',
      produtoClasse || '',
      produtoEan,
      produtoDun || '',
      produtoDescr || '',
      produtoConservacao || '',
      produtoValidade,
    ]);

    res.status(200).json({ success: true, registroId, registroTimestamp });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao gravar no banco_cadastro' });
  }
}