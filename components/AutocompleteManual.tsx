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
    setSugestoes(filtrados.slice(0, 8));
  };

  const selecionarProduto = (prod: ProdutoValido) => {
    setProdutoEscolhido(prod);
    setBusca(`${prod.marcaDescr} - ${prod.produtoDescr}`);
    setSugestoes([]);
  };

  const finalizar = () => {
    if (!produtoEscolhido) {
      return;
    }
    onSelect(produtoEscolhido, validade);
  };

  const convertDateToInput = (dateStr: string) => {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [year, month, day] = e.target.value.split('-');
    setValidade(`${day}/${month}/${year}`);
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          Buscar marca ou descricao
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={busca}
            onChange={(e) => handleSearch(e.target.value)}
            className="input-field pl-10"
            placeholder="Digite pelo menos 2 caracteres..."
          />
        </div>
        {busca.length > 0 && busca.length < 2 && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Continue digitando para ver sugestoes...
          </p>
        )}
      </div>

      {/* Suggestions List */}
      {sugestoes.length > 0 && (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-elevated max-h-64 overflow-y-auto scrollbar-thin">
          <ul className="divide-y divide-slate-100 dark:divide-slate-700">
            {sugestoes.map((s, i) => (
              <li
                key={i}
                onClick={() => selecionarProduto(s)}
                className="p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 dark:text-slate-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      {s.marcaDescr}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{s.produtoDescr}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="badge badge-primary text-xs">{s.produtoClasse}</span>
                    <svg className="w-4 h-4 text-slate-400 group-hover:text-primary-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Selected Product Details */}
      {produtoEscolhido && (
        <div className="bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 rounded-xl p-4 animate-slideUp">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-success-100 dark:bg-success-900/40 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-success-600 dark:text-success-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-success-700 dark:text-success-300 font-medium">Produto Selecionado</p>
              <p className="text-lg font-semibold text-success-900 dark:text-success-100">{produtoEscolhido.marcaDescr}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
            <div className="bg-white dark:bg-slate-800/50 rounded-lg p-2.5">
              <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-medium">Produto</span>
              <p className="text-slate-900 dark:text-slate-100 font-medium truncate">{produtoEscolhido.produtoDescr}</p>
            </div>
            <div className="bg-white dark:bg-slate-800/50 rounded-lg p-2.5">
              <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-medium">EAN</span>
              <p className="font-mono text-slate-900 dark:text-slate-100">{produtoEscolhido.produtoEan}</p>
            </div>
          </div>

          {/* Validade Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Data de Validade
            </label>
            <input
              type="date"
              value={convertDateToInput(validade)}
              onChange={handleDateChange}
              className="input-field"
            />
          </div>

          <button onClick={finalizar} className="btn-success w-full">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Confirmar e Adicionar
          </button>
        </div>
      )}
    </div>
  );
}
