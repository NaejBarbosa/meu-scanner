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
  id: string; // timestamp + ean
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

  // Carrega a base de produtos válidos
  useEffect(() => {
    fetch('/api/validar')
      .then((res) => res.json())
      .then((data) => setProdutosValidos(data))
      .catch((err) => console.error('Erro ao carregar base', err));
  }, []);

  // Salva no banco_cadastro
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

  // Adiciona item à tabela de registros da sessão
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

  // Handler chamado pelo Scanner ao decodificar
  const handleQRCode = (text: string) => {
    const dados = extrairDados(text);
    if (!dados) {
      alert(`❌ Formato inválido\n\nTexto recebido:\n${text}`);
      return;
    }

    const { ean, validade } = dados;

    if (scannedEans.has(ean)) {
      alert('⚠️ Este código já foi processado e salvo anteriormente.');
      return;
    }

    const produtoEncontrado = produtosValidos.find((p) => p.produtoEan === ean);
    // Exibe modal com os dados do produto (se encontrado)
    setConfirmacao({ ean, validade, produto: produtoEncontrado });
  };

  // Ação quando o usuário clica em "Gravar" no modal
  const handleGravar = async () => {
    if (!confirmacao) return;
    const { ean, validade, produto } = confirmacao;

    if (!produto) {
      // Produto não encontrado: vai para cadastro manual
      setCurrentScan({ ean, validade });
      setModoManual(true);
      setConfirmacao(null);
      return;
    }

    // Produto encontrado: salva no banco_cadastro e adiciona à tabela
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

  // Nova leitura: fecha modal, permite novo scan
  const handleNovaLeitura = () => {
    setConfirmacao(null);
  };

  // Descartar: simplesmente fecha o modal sem fazer nada
  const handleDescartar = () => {
    setConfirmacao(null);
  };

  // Cadastro manual (quando produto não existe na base)
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

      {/* Scanner */}
      <Scanner onDetected={handleQRCode} />

      {/* Modal de confirmação com dados do produto */}
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
                <p className="text-red-600">⚠️ Produto não encontrado na base. Será necessário cadastro manual.</p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleGravar}
                className="bg-green-600 text-white py-2 rounded hover:bg-green-700"
              >
                💾 Gravar no banco_cadastro
              </button>
              <button
                onClick={handleNovaLeitura}
                className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
              >
                📷 Nova leitura
              </button>
              <button
                onClick={handleDescartar}
                className="bg-gray-400 text-white py-2 rounded hover:bg-gray-500"
              >
                ❌ Descartar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cadastro manual (caso produto não exista) */}
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

      {/* Tabela de produtos já registrados na sessão */}
      {itensRegistrados.length > 0 && (
        <div className="mt-8 bg-white rounded shadow p-4">
          <h2 className="text-xl font-bold mb-3">📋 Produtos registrados nesta sessão</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-300 text-sm">
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
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="border p-2 font-mono">{item.ean}</td>
                    <td className="border p-2">{item.marcaDescr}</td>
                    <td className="border p-2">{item.produtoDescr}</td>
                    <td className="border p-2">{item.validade}</td>
                    <td className="border p-2">{item.dataRegistro.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            * Os registros acima já foram salvos no banco_cadastro.
          </p>
        </div>
      )}
    </main>
  );
}