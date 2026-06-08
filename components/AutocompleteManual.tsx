// components/AutocompleteManual.tsx
import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

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

export default function AutocompleteManual({ produtosValidos, onSelect, validadeAtual }: Props) {
  const { theme } = useTheme();
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
      <label className="block mb-1 font-medium">Buscar marca ou descrição</label>
      <input
        type="text"
        value={busca}
        onChange={(e) => handleSearch(e.target.value)}
        className={`w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
        placeholder="Digite parte do nome..."
      />
      {sugestoes.length > 0 && (
        <ul className={`border mt-1 max-h-40 overflow-y-auto rounded-lg shadow-lg ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}>
          {sugestoes.map((s, i) => (
            <li
              key={i}
              onClick={() => selecionarProduto(s)}
              className={`p-2 cursor-pointer transition-colors ${theme === 'dark' ? 'hover:bg-gray-600' : 'hover:bg-gray-100'}`}
            >
              {s.marcaDescr} - {s.produtoDescr} (EAN: {s.produtoEan})
            </li>
          ))}
        </ul>
      )}
      {produtoEscolhido && (
        <div className={`mt-4 p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-green-50'}`}>
          <p><strong>Marca:</strong> {produtoEscolhido.marcaDescr}</p>
          <p><strong>Produto:</strong> {produtoEscolhido.produtoDescr}</p>
          <p><strong>EAN:</strong> {produtoEscolhido.produtoEan}</p>
          <label className="block mt-2">Data de Validade (editável)</label>
          <input
            type="date"
            value={validade}
            onChange={(e) => setValidade(e.target.value)}
            className={`w-full border rounded p-1 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme === 'dark' ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'}`}
          />
          <button onClick={finalizar} className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-colors">
            Salvar e Finalizar
          </button>
        </div>
      )}
    </div>
  );
}