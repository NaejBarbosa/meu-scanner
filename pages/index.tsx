// pages/index.tsx
import { useState, useEffect } from 'react';
import Scanner from '../components/Scanner';
import AutocompleteManual from '../components/AutocompleteManual';
import { extrairDados } from '../lib/regex';

interface ProdutoValido {
  marcaId: string;
  marcaDescr: string;
  produtoClasse: string;
  produtoEan: string;
  produtoDescr: string;
}

export default function Home() {
  const [produtosValidos, setProdutosValidos] = useState<ProdutoValido[]>([]);
  const [scannedEans, setScannedEans] = useState<Set<string>>(new Set());
  const [currentScan, setCurrentScan] = useState<{
    ean: string;
    validade: string;
  } | null>(null);
  const [modoManual, setModoManual] = useState(false);

  useEffect(() => {
    fetch('/api/validar')
      .then((res) => res.json())
      .then((data) => setProdutosValidos(data))
      .catch((err) => console.error('Erro ao carregar base', err));
  }, []);

  const salvarRegistro = async (registro: any, ean: string) => {
    try {
      const res = await fetch('/api/cadastrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registro),
      });
      if (res.ok) {
        setScannedEans((prev) => new Set(prev).add(ean));
        alert('✅ Registro salvo com sucesso!');
      } else {
        alert('❌ Erro ao salvar');
      }
    } catch (error) {
      alert('❌ Erro de conexão');
    }
  };

  const handleQRCode = (text: string) => {
    // 1. Extrai os dados do texto bruto
    const dados = extrairDados(text);
    if (!dados) {
      alert(`❌ Formato inválido\n\nTexto recebido:\n${text}`);
      return;
    }

    const { ean, validade } = dados;

    // 2. Exibe os dados extraídos para confirmação
    const confirmacao = confirm(
      `📦 Dados extraídos:\n\n` +
      `EAN: ${ean}\n` +
      `Validade calculada: ${validade}\n\n` +
      `Deseja prosseguir com o cadastro?`
    );
    if (!confirmacao) return;

    // 3. Verifica se já foi processado
    if (scannedEans.has(ean)) {
      alert('⚠️ Este código já foi processado anteriormente.');
      return;
    }

    // 4. Busca na base de produtos válidos
    const encontrado = produtosValidos.find((p) => p.produtoEan === ean);
    if (encontrado) {
      salvarRegistro(
        {
          marcaId: encontrado.marcaId,
          marcaDescr: encontrado.marcaDescr,
          produtoClasse: encontrado.produtoClasse,
          produtoEan: ean,
          produtoDescr: encontrado.produtoDescr,
          produtoValidade: validade,
        },
        ean
      );
    } else {
      // Produto não encontrado → entra no modo manual
      setCurrentScan({ ean, validade });
      setModoManual(true);
    }
  };

  const handleManualSubmit = (produto: ProdutoValido, validadeFinal: string) => {
    if (!currentScan) return;
    const registro = {
      marcaId: produto.marcaId,
      marcaDescr: produto.marcaDescr,
      produtoClasse: produto.produtoClasse,
      produtoEan: currentScan.ean,
      produtoDescr: produto.produtoDescr,
      produtoValidade: validadeFinal,
    };
    salvarRegistro(registro, currentScan.ean);
    setModoManual(false);
    setCurrentScan(null);
  };

  return (
    <main className="min-h-screen p-4 bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">Scanner de Produtos</h1>

      <Scanner onDetected={handleQRCode} />

      {modoManual && currentScan && (
        <div className="mt-6 p-4 bg-white rounded shadow">
          <h2 className="text-xl font-semibold">Produto não encontrado na base</h2>
          <p><strong>EAN:</strong> {currentScan.ean}</p>
          <p><strong>Validade calculada:</strong> {currentScan.validade}</p>

          <AutocompleteManual
            produtosValidos={produtosValidos}
            onSelect={(produto, validadeFinal) => handleManualSubmit(produto, validadeFinal)}
            validadeAtual={currentScan.validade}
          />
        </div>
      )}
    </main>
  );
}