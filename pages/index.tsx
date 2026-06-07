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

  // Carrega banco_valida
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
        alert('Registro salvo com sucesso!');
      } else {
        alert('Erro ao salvar');
      }
    } catch (error) {
      alert('Erro de conexão ao salvar');
    }
  };

  const handleQRCode = (text: string) => {
    const dados = extrairDados(text);
    if (!dados) {
      alert('QR Code não reconhecido (formato inválido)');
      return;
    }

    const { ean, validade } = dados;

    if (scannedEans.has(ean)) {
      alert('Este QR Code já foi processado!');
      return;
    }

    const encontrado = produtosValidos.find((p) => p.produtoEan === ean);
    if (encontrado) {
      // Produto conhecido – salva automaticamente
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
      // Produto não encontrado → modo manual
      setCurrentScan({ ean, validade });
      setModoManual(true);
    }
  };

  const handleManualSelect = (produtoSelecionado: ProdutoValido) => {
    if (!currentScan) return;
    // Neste ponto, o componente AutocompleteManual já permite editar a validade.
    // Vamos pegar a validade do estado interno do componente? 
    // Precisamos de uma forma de obter o valor editado. 
    // O componente emite o produto selecionado, mas a validade ficou lá dentro.
    // Ajustaremos: o onSelect enviará também a validade final.
  };

  // Ajuste no AutocompleteManual: o onSelect deve receber { produto, validade }
  // Vamos modificar a assinatura do AutocompleteManual e do handler.

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
          <p>
            <strong>EAN:</strong> {currentScan.ean}
          </p>
          <p>
            <strong>Validade calculada:</strong> {currentScan.validade}
          </p>

          <AutocompleteManual
            produtosValidos={produtosValidos}
            onSelect={(produto, validadeFinal) =>
              handleManualSubmit(produto, validadeFinal)
            }
            validadeAtual={currentScan.validade}
          />
        </div>
      )}
    </main>
  );
}