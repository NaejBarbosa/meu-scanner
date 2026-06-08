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

interface ItemRegistrado {
  id: string;
  ean: string;
  validade: string;
  marcaId: string;
  marcaDescr: string;
  produtoClasse: string;
  produtoDescr: string;
  dataRegistro: Date;
}

export default function Home() {
  const [produtosValidos, setProdutosValidos] = useState<ProdutoValido[]>([]);
  const [scannedEans, setScannedEans] = useState<Set<string>>(new Set());
  const [currentScan, setCurrentScan] = useState<{ ean: string; validade: string } | null>(null);
  const [modoManual, setModoManual] = useState(false);
  const [confirmacao, setConfirmacao] = useState<{
    ean: string;
    validade: string;
    produto?: ProdutoValido;
  } | null>(null);
  const [itensRegistrados, setItensRegistrados] = useState<ItemRegistrado[]>([]);

  useEffect(() => {
    fetch('/api/validar')
      .then((res) => res.json())
      .then((data) => setProdutosValidos(data))
      .catch((err) => console.error('Erro ao carregar base', err));
  }, []);

  const salvarRegistro = async (registro: any, ean: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/cadastrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registro),
      });
      if (res.ok) {
        setScannedEans((prev) => new Set(prev).add(ean));
        return true;
      } else {
        alert('❌ Erro ao salvar no banco_cadastro');
        return false;
      }
    } catch (error) {
      alert('❌ Erro de conexão');
      return false;
    }
  };

  const adicionarItemRegistrado = (produto: ProdutoValido, ean: string, validade: string) => {
    const novoItem: ItemRegistrado = {
      id: `${Date.now()}-${ean}`,
      ean,
      validade,
      marcaId: produto.marcaId,
      marcaDescr: produto.marcaDescr,
      produtoClasse: produto.produtoClasse,
      produtoDescr: produto.produtoDescr,
      dataRegistro: new Date(),
    };
    setItensRegistrados((prev) => [...prev, novoItem]);
  };

  const handleQRCode = (text: string) => {
    alert(`[Index] Texto bruto recebido: ${text}`); // DEBUG

    const dados = extrairDados(text);
    if (!dados) {
      alert(`[Index] extrairDados retornou NULL. Texto: ${text}`);
      return;
    }
    alert(`[Index] extrairDados OK: EAN=${dados.ean}, validade=${dados.validade}`);

    const { ean, validade } = dados;

    if (scannedEans.has(ean)) {
      alert('⚠️ Código já processado.');
      return;
    }

    const produtoEncontrado = produtosValidos.find((p) => p.produtoEan === ean);
    alert(`[Index] Produto encontrado? ${produtoEncontrado ? 'SIM' : 'NÃO'}`);

    // Abre o modal
    setConfirmacao({ ean, validade, produto: produtoEncontrado });
  };

  const handleGravar = async () => {
    if (!confirmacao) return;
    const { ean, validade, produto } = confirmacao;

    if (!produto) {
      setCurrentScan({ ean, validade });
      setModoManual(true);
      setConfirmacao(null);
      return;
    }

    const registro = {
      marcaId: produto.marcaId,
      marcaDescr: produto.marcaDescr,
      produtoClasse: produto.produtoClasse,
      produtoEan: ean,
      produtoDescr: produto.produtoDescr,
      produtoValidade: validade,
    };
    const sucesso = await salvarRegistro(registro, ean);
    if (sucesso) {
      adicionarItemRegistrado(produto, ean, validade);
      alert('✅ Produto registrado com sucesso!');
      setConfirmacao(null);
    }
  };

  const handleNovaLeitura = () => {
    setConfirmacao(null);
  };

  const handleDescartar = () => {
    setConfirmacao(null);
  };

  const handleManualSubmit = async (produto: ProdutoValido, validadeFinal: string) => {
    if (!currentScan) return;
    const registro = {
      marcaId: produto.marcaId,
      marcaDescr: produto.marcaDescr,
      produtoClasse: produto.produtoClasse,
      produtoEan: currentScan.ean,
      produtoDescr: produto.produtoDescr,
      produtoValidade: validadeFinal,
    };
    const sucesso = await salvarRegistro(registro, currentScan.ean);
    if (sucesso) {
      adicionarItemRegistrado(produto, currentScan.ean, validadeFinal);
      alert('✅ Produto manual registrado!');
    }
    setModoManual(false);
    setCurrentScan(null);
  };

  return (
    <main className="min-h-screen p-4 bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">Scanner de Produtos</h1>

      <Scanner onDetected={handleQRCode} />

      {confirmacao && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">📦 Produto detectado</h2>
            <div className="mb-4 border rounded p-3 bg-gray-50">
              <p><strong>EAN:</strong> {confirmacao.ean}</p>
              <p><strong>Validade calculada:</strong> {confirmacao.validade}</p>
              {confirmacao.produto ? (
                <>
                  <p><strong>Marca:</strong> {confirmacao.produto.marcaDescr}</p>
                  <p><strong>Produto:</strong> {confirmacao.produto.produtoDescr}</p>
                  <p><strong>Classe:</strong> {confirmacao.produto.produtoClasse}</p>
                </>
              ) : (
                <p className="text-red-600">⚠️ Produto não encontrado na base.</p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <button onClick={handleGravar} className="bg-green-600 text-white py-2 rounded">
                💾 Gravar no banco_cadastro
              </button>
              <button onClick={handleNovaLeitura} className="bg-blue-600 text-white py-2 rounded">
                📷 Nova leitura
              </button>
              <button onClick={handleDescartar} className="bg-gray-400 text-white py-2 rounded">
                ❌ Descartar
              </button>
            </div>
          </div>
        </div>
      )}

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

      {itensRegistrados.length > 0 && (
        <div className="mt-8 bg-white rounded shadow p-4">
          <h2 className="text-xl font-bold mb-3">📋 Produtos registrados</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border text-sm">
              <thead className="bg-gray-200">
                <tr>
                  <th className="border p-2">EAN</th>
                  <th className="border p-2">Marca</th>
                  <th className="border p-2">Produto</th>
                  <th className="border p-2">Validade</th>
                  <th className="border p-2">Data/Hora</th>
                </tr>
              </thead>
              <tbody>
                {itensRegistrados.map((item) => (
                  <tr key={item.id}>
                    <td className="border p-2">{item.ean}</td>
                    <td className="border p-2">{item.marcaDescr}</td>
                    <td className="border p-2">{item.produtoDescr}</td>
                    <td className="border p-2">{item.validade}</td>
                    <td className="border p-2">{item.dataRegistro.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}