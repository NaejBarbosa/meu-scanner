import { useState, useMemo, useEffect } from 'react';
import { CAMARAS, VAGAS } from '../lib/config';
import { useTheme } from '../context/ThemeContext';

interface VagaSelectorProps {
  onConfirm: (camara: string, vaga: string) => void;
}

export default function VagaSelector({ onConfirm }: VagaSelectorProps) {
  const { theme, toggleTheme } = useTheme();
  const [camaraSelecionada, setCamaraSelecionada] = useState<string>('');
  const [vagaSelecionada, setVagaSelecionada] = useState<string>('');
  const [buscaVaga, setBuscaVaga] = useState<string>('');
  const [vagasOcupadas, setVagasOcupadas] = useState<{ camara: string; vaga: string }[]>([]);

  useEffect(() => {
    fetch('/api/vagas-ocupadas')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setVagasOcupadas(data);
        }
      })
      .catch((err) => console.error('Erro ao buscar vagas ocupadas:', err));
  }, []);

  const isOcupada = useMemo(() => {
    if (!camaraSelecionada || !vagaSelecionada) return false;
    return vagasOcupadas.some(
      (v) =>
        v.camara.toLowerCase() === camaraSelecionada.toLowerCase() &&
        v.vaga.toLowerCase() === vagaSelecionada.toLowerCase()
    );
  }, [camaraSelecionada, vagaSelecionada, vagasOcupadas]);

  const vagasFiltradas = useMemo(() => {
    if (!buscaVaga.trim()) return VAGAS;
    return VAGAS.filter((v) =>
      v.toLowerCase().includes(buscaVaga.trim().toLowerCase())
    );
  }, [buscaVaga]);

  const podeConfirmar = camaraSelecionada !== '' && vagaSelecionada !== '' && !isOcupada;

  const handleConfirmar = () => {
    if (!podeConfirmar) return;
    onConfirm(camaraSelecionada, vagaSelecionada);
  };

  // Ícone de câmara fria / congelados
  const getCamaraIcon = (camara: string) => {
    const isCongelado = camara.toLowerCase().includes('congelado');
    return isCongelado ? (
      // Snowflake icon
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M12 3v18M3 12h18M5.636 5.636l12.728 12.728M18.364 5.636L5.636 18.364" />
      </svg>
    ) : (
      // Thermometer icon
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M9 3a3 3 0 00-3 3v8.586A5 5 0 1015 14.586V6a3 3 0 00-3-3H9z" />
      </svg>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      {/* Card principal */}
      <div className="w-full max-w-lg animate-slideUp">        {/* Header do card */}
        <div className="card-elevated overflow-hidden">
          <div className="bg-slate-50/30 dark:bg-slate-900/20 p-6 border-b border-slate-150 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <svg className="w-6 h-6 text-slate-700 dark:text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-lg font-bold tracking-tight text-slate-800 dark:text-slate-200 uppercase">Selecionar Destino</h1>
                  <p className="text-slate-400 text-xs mt-0.5">Câmara e vaga para esta sessão</p>
                </div>
              </div>

              {/* Botão de Tema */}
              <button
                onClick={toggleTheme}
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                aria-label="Alternar tema"
              >
                {theme === 'dark' ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">

            {/* Seleção de Câmara */}
            <div className="space-y-2">
              <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Câmara
              </label>
              <div className="grid grid-cols-1 gap-2">
                {CAMARAS.map((camara) => {
                  const isSelected = camaraSelecionada === camara;
                  return (
                    <button
                      key={camara}
                      id={`camara-${camara.replace(/\s+/g, '-').toLowerCase()}`}
                      onClick={() => {
                        setCamaraSelecionada(camara);
                        setVagaSelecionada('');
                      }}
                      className={`
                        flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all duration-250
                        ${isSelected
                          ? 'border-slate-900 dark:border-slate-100 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 shadow-sm font-semibold'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 text-slate-700 dark:text-slate-350 hover:border-slate-300 dark:hover:border-slate-700'
                        }
                      `}
                    >
                      <span className={`flex-shrink-0 ${isSelected
                        ? 'text-white dark:text-slate-950'
                        : 'text-slate-400 dark:text-slate-500'}`}>
                        {getCamaraIcon(camara)}
                      </span>
                      <span className="text-sm font-medium">{camara}</span>
                      {isSelected && (
                        <span className="ml-auto text-white dark:text-slate-950">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Seleção de Vaga */}
            <div className="space-y-2">
              <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Vaga
              </label>

              {/* Campo de busca */}
              <div className="relative">
                <svg
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  id="busca-vaga"
                  type="text"
                  placeholder="Buscar vaga... ex: A10"
                  value={buscaVaga}
                  onChange={(e) => setBuscaVaga(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 dark:focus:border-slate-600 transition-all duration-200 placeholder-slate-400 dark:placeholder-slate-500"
                />
              </div>

              {/* Grid de vagas */}
              <div className="max-h-52 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/20 p-2">
                {vagasFiltradas.length === 0 ? (
                  <p className="text-center text-slate-400 dark:text-slate-500 text-sm py-4">
                    Nenhuma vaga encontrada
                  </p>
                ) : (
                  <div className="grid grid-cols-4 gap-1.5">
                    {vagasFiltradas.map((vaga) => {
                      const isSelected = vagaSelecionada === vaga;
                      return (
                        <button
                          key={vaga}
                          id={`vaga-${vaga}`}
                          onClick={() => setVagaSelecionada(vaga)}
                          className={`
                            py-2.5 px-1 rounded-lg text-xs font-semibold transition-all duration-150 text-center border
                            ${isSelected
                              ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 border-slate-900 dark:border-slate-100 shadow-sm scale-105'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-700'
                            }
                          `}
                        >
                          {vaga}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Vaga selecionada: badge de confirmação ou erro de vaga ocupada */}
              {vagaSelecionada && (
                isOcupada ? (
                  <div className="mt-3 flex items-start gap-2.5 bg-rose-50/50 dark:bg-rose-950/10 border border-rose-100/80 dark:border-rose-900/30 rounded-xl px-3 py-2.5 animate-scale-in">
                    <svg className="w-4.5 h-4.5 text-rose-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="text-xs font-medium text-rose-700 dark:text-rose-400 leading-normal">
                      Esta combinação de câmara e vaga já está sendo utilizada.
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5 text-sm text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100/80 dark:border-emerald-900/30 rounded-xl px-3 py-2.5">
                    <svg className="w-4 h-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Vaga selecionada: <strong className="font-semibold">{vagaSelecionada}</strong></span>
                  </div>
                )
              )}
            </div>

            {/* Resumo da seleção */}
            {podeConfirmar && (
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 space-y-1.5 border border-slate-200/60 dark:border-slate-800">
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                  Resumo da Sessão
                </p>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Câmara</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{camaraSelecionada}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Vaga</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{vagaSelecionada}</span>
                </div>
              </div>
            )}

            {/* Botão confirmar */}
            <button
              id="btn-confirmar-vaga"
              onClick={handleConfirmar}
              disabled={!podeConfirmar}
              className={`
                w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2
                ${podeConfirmar
                  ? 'bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-950 shadow-sm active:scale-[0.98]'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-slate-700'
                }
              `}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {podeConfirmar ? 'Confirmar e Iniciar Scanner' : 'Selecione câmara e vaga'}
            </button>

          </div>
        </div>

        {/* Rodapé informativo */}
        <p className="text-center text-xs text-slate-400 dark:text-slate-600 mt-4">
          A câmara e vaga ficam fixas durante toda a sessão de escaneamento
        </p>
      </div>
    </div>
  );
}
