// components/CadastroProdutoModal.tsx
import { useState, useEffect, useRef } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';

interface Marca {
  id: string;
  descr: string;
}

interface CadastroProdutoModalProps {
  initialEan?: string;
  initialDun?: string;
  tipoDetectado: 'ean' | 'dun'; // qual código foi detectado no scanner principal
  onClose: () => void;
  onSuccess: (produto: any) => void; // produto recém-cadastrado no formato ProdutoValido
}

export default function CadastroProdutoModal({
  initialEan,
  initialDun,
  tipoDetectado,
  onClose,
  onSuccess,
}: CadastroProdutoModalProps) {
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Campos do formulário
  const [ean, setEan] = useState(initialEan || '');
  const [dun, setDun] = useState(initialDun || '');
  const [marcaId, setMarcaId] = useState('');
  const [marcaDescr, setMarcaDescr] = useState('');
  const [produtoDescr, setProdutoDescr] = useState('');
  const [produtoClasse, setProdutoClasse] = useState('');
  const [produtoConservacao, setProdutoConservacao] = useState('Resfriado');

  // Para escaneamento do código faltante via upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Carrega marcas
  useEffect(() => {
    fetch('/api/marcas')
      .then(res => res.json())
      .then(data => setMarcas(data))
      .catch(err => console.error('Erro ao carregar marcas', err));
  }, []);

  // Quando a marca é selecionada (via select), atualiza os dois campos
  const handleMarcaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const marca = marcas.find(m => m.id === selectedId);
    if (marca) {
      setMarcaId(marca.id);
      setMarcaDescr(marca.descr);
    } else {
      setMarcaId('');
      setMarcaDescr('');
    }
  };

  // Valida se o código (EAN ou DUN) já existe na base atual
  const verificarDuplicidade = async (codigo: string, tipo: 'ean' | 'dun'): Promise<boolean> => {
    try {
      const res = await fetch('/api/validar');
      const produtos: any[] = await res.json();
      if (tipo === 'ean') {
        return produtos.some(p => p.produtoEan === codigo);
      } else {
        return produtos.some(p => p.produtoDun === codigo);
      }
    } catch {
      return false;
    }
  };

  // Escaneia um código a partir de uma imagem (upload)
  const scanFromImage = async (targetField: 'ean' | 'dun') => {
    if (!fileInputRef.current) return;
    fileInputRef.current.click();
    fileInputRef.current.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setLoading(true);
      const imageUrl = URL.createObjectURL(file);
      const reader = new BrowserMultiFormatReader();
      try {
        const result = await reader.decodeFromImageUrl(imageUrl);
        if (result) {
          const code = result.getText();
          // tenta extrair apenas números
          const numericCode = code.replace(/\D/g, '');
          if (targetField === 'ean') {
            if (numericCode.length === 13 || numericCode.length === 8) {
              setEan(numericCode);
              setError(null);
            } else {
              setError('Código EAN inválido (deve ter 8 ou 13 dígitos)');
            }
          } else {
            if (numericCode.length === 14) {
              setDun(numericCode);
              setError(null);
            } else {
              setError('Código DUN inválido (deve ter 14 dígitos)');
            }
          }
        } else {
          setError('Nenhum código detectado na imagem');
        }
      } catch (err) {
        setError('Erro ao ler imagem');
      } finally {
        reader.reset();
        URL.revokeObjectURL(imageUrl);
        setLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
  };

  const handleSubmit = async () => {
    setError(null);

    // Validação dos campos
    if (tipoDetectado === 'dun' && !ean) {
      setError('O código EAN é obrigatório (escaneie ou digite)');
      return;
    }
    if (tipoDetectado === 'ean' && !dun) {
      setError('O código DUN é obrigatório (escaneie ou digite)');
      return;
    }
    if (!ean && !dun) {
      setError('Pelo menos um código (EAN ou DUN) deve ser informado');
      return;
    }
    if (!marcaId) {
      setError('Selecione uma marca');
      return;
    }
    if (!produtoDescr.trim()) {
      setError('Informe a descrição do produto');
      return;
    }
    if (!produtoClasse.trim()) {
      setError('Informe a classe do produto');
      return;
    }
    if (!produtoConservacao) {
      setError('Selecione o tipo de conservação');
      return;
    }

    // Verificar se o EAN já existe (se foi informado)
    if (ean) {
      const exists = await verificarDuplicidade(ean, 'ean');
      if (exists) {
        setError(`EAN ${ean} já cadastrado na base.`);
        return;
      }
    }
    // Verificar se o DUN já existe (se foi informado)
    if (dun) {
      const exists = await verificarDuplicidade(dun, 'dun');
      if (exists) {
        setError(`DUN ${dun} já cadastrado na base.`);
        return;
      }
    }

    setLoading(true);
    try {
      const payload = {
        marcaId,
        marcaDescr,
        produtoClasse,
        produtoEan: ean,
        produtoDun: dun,
        produtoConservacao,
        produtoDescr,
      };
      const res = await fetch('/api/inserir-produto-base', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Erro ao cadastrar produto');
      
      // Cria objeto ProdutoValido igual ao retornado por /api/validar
      const novoProduto = {
        marcaId,
        marcaDescr,
        produtoClasse,
        produtoEan: ean,
        produtoDun: dun || '',
        produtoConservacao,
        produtoDescr,
      };
      onSuccess(novoProduto);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao cadastrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="card-elevated max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-900 z-10">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Produto não encontrado na base
          </h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
            <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-5">
          {error && (
            <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 rounded-lg p-3 text-danger-700 text-sm">
              {error}
            </div>
          )}

          {/* Campo do código que NÃO foi detectado (obrigatório) */}
          {tipoDetectado === 'dun' ? (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Código EAN * (escaneie ou digite)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={ean}
                  onChange={(e) => setEan(e.target.value.replace(/\D/g, '').slice(0,13))}
                  placeholder="8 ou 13 dígitos"
                  className="input-field flex-1"
                />
                <button
                  type="button"
                  onClick={() => scanFromImage('ean')}
                  className="btn-secondary whitespace-nowrap"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l2.586-2.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Escanear
                </button>
              </div>
            </div>
          ) : tipoDetectado === 'ean' ? (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Código DUN * (escaneie ou digite)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={dun}
                  onChange={(e) => setDun(e.target.value.replace(/\D/g, '').slice(0,14))}
                  placeholder="14 dígitos"
                  className="input-field flex-1"
                />
                <button
                  type="button"
                  onClick={() => scanFromImage('dun')}
                  className="btn-secondary whitespace-nowrap"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l2.586-2.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Escanear
                </button>
              </div>
            </div>
          ) : null}

          {/* Caso nenhum dos dois tenha sido detectado (fallback) - ambos editáveis */}
          {!initialEan && !initialDun && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Código EAN
                </label>
                <input
                  type="text"
                  value={ean}
                  onChange={(e) => setEan(e.target.value.replace(/\D/g, '').slice(0,13))}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Código DUN
                </label>
                <input
                  type="text"
                  value={dun}
                  onChange={(e) => setDun(e.target.value.replace(/\D/g, '').slice(0,14))}
                  className="input-field"
                />
              </div>
            </>
          )}

          {/* Marca (dropdown com busca) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Marca *
            </label>
            <select
              value={marcaId}
              onChange={handleMarcaChange}
              className="input-field"
            >
              <option value="">Selecione uma marca</option>
              {marcas.map(m => (
                <option key={m.id} value={m.id}>{m.descr}</option>
              ))}
            </select>
            {marcas.length === 0 && (
              <p className="text-xs text-slate-500 mt-1">Carregando marcas...</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Descrição do Produto *
            </label>
            <input
              type="text"
              value={produtoDescr}
              onChange={(e) => setProdutoDescr(e.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Classe do Produto *
            </label>
            <input
              type="text"
              value={produtoClasse}
              onChange={(e) => setProdutoClasse(e.target.value)}
              placeholder="Ex: Bebidas, Limpeza, etc."
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Conservação *
            </label>
            <select
              value={produtoConservacao}
              onChange={(e) => setProdutoConservacao(e.target.value)}
              className="input-field"
            >
              <option value="Resfriado">Resfriado</option>
              <option value="Congelado">Congelado</option>
            </select>
          </div>

          {/* Input file oculto para escaneamento via upload */}
          <input type="file" ref={fileInputRef} accept="image/*" className="hidden" />

          <div className="flex gap-3 pt-4">
            <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1">
              {loading ? 'Gravando...' : 'Gravar na Base'}
            </button>
            <button onClick={onClose} className="btn-secondary">
              Descartar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}