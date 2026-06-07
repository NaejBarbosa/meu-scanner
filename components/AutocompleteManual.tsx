// components/AutocompleteManual.tsx (versão corrigida)
import { useState } from 'react';

interface ProdutoValido {
  marcaId: string;
  marcaDescr: string;
  produtoClasse: string;
  produtoEan: string;
  produtoDescr: string;
}

interface Props {
  produtosValidos: ProdutoValido[];
  onSelect: (produto: ProdutoValido, validade: string) => void;
  validadeAtual: string;
}

export default function AutocompleteManual({
  produtosValidos,
  onSelect,
  validadeAtual,
}: Props) {
  const [busca, setBusca] = useState('');
  const [sugestoes, setSugestoes] = useState<ProdutoValido[]>([]);
  const [produtoEscolhido, setProdutoEscolhido] = useState<ProdutoValido | null>(null);
  const [validade, setValidade] = useState(validadeAtual);

  const handleSearch = (value: string) => {
    setBusca(value);
    if (value.length < 2) {
      setSugestoes([]);
      return;
    }
    const filtrados = produtosValidos.filter(
      (p) =>
        p.marcaDescr.toLowerCase().includes(value.toLowerCase()) ||
        p.produtoDescr.toLowerCase().includes(value.toLowerCase())
    );
    setSugestoes(filtrados);
  };

  const selecionarProduto = (prod: ProdutoValido) => {
    setProdutoEscolhido(prod);
    setBusca(`${prod.marcaDescr} - ${prod.produtoDescr}`);
    setSugestoes([]);
  };

  const finalizar = () => {
    if (!produtoEscolhido) {
      alert('Selecione um produto da lista');
      return;
    }
    onSelect(produtoEscolhido, validade);
  };

  return (
    <div className="mt-4">
      <label className="block mb-1">Buscar marca ou descrição</label>
      <input
        type="text"
        value={busca}
        onChange={(e) => handleSearch(e.target.value)}
        className="w-full border p-2 rounded"
        placeholder="Digite parte do nome..."
      />
      {sugestoes.length > 0 && (
        <ul className="border mt-1 max-h-40 overflow-y-auto bg-white">
          {sugestoes.map((s, i) => (
            <li
              key={i}
              onClick={() => selecionarProduto(s)}
              className="p-2 hover:bg-gray-200 cursor-pointer"
            >
              {s.marcaDescr} - {s.produtoDescr} (EAN: {s.produtoEan})
            </li>
          ))}
        </ul>
      )}

      {produtoEscolhido && (
        <div className="mt-4 p-3 bg-green-50 rounded">
          <p>
            <strong>Marca:</strong> {produtoEscolhido.marcaDescr}
          </p>
          <p>
            <strong>Produto:</strong> {produtoEscolhido.produtoDescr}
          </p>
          <p>
            <strong>EAN:</strong> {produtoEscolhido.produtoEan}
          </p>
          <label className="block mt-2">Data de Validade (editável)</label>
          <input
            type="date"
            value={validade}
            onChange={(e) => setValidade(e.target.value)}
            className="border p-1 rounded"
          />
          <button
            onClick={finalizar}
            className="mt-3 px-4 py-2 bg-blue-600 text-white rounded"
          >
            Salvar e Finalizar
          </button>
        </div>
      )}
    </div>
  );
}