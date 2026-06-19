import { useState, useEffect, useMemo } from 'react';

interface Registro {
  id: string;
  timestamp: string;
  marcaId: string;
  marcaDescr: string;
  produtoClasse: string;
  produtoEan: string;
  produtoDescr: string;
  produtoValidade: string;
  camara: string;
  camaraVaga: string;
}

export default function Relatorio() {
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados dos filtros
  const [filtroBusca, setFiltroBusca] = useState('');
  const [filtroMarca, setFiltroMarca] = useState('');
  const [filtroCamara, setFiltroCamara] = useState('');
  const [filtroVaga, setFiltroVaga] = useState('');
  const [filtroClasse, setFiltroClasse] = useState('');
  const [filtroVencimentoSmart, setFiltroVencimentoSmart] = useState('todos');
  const [filtroVencimentoExato, setFiltroVencimentoExato] = useState('');
  const [filtroRecebimentoSmart, setFiltroRecebimentoSmart] = useState('todos');
  const [filtroRecebimentoExato, setFiltroRecebimentoExato] = useState('');

  // Paginação
  const [pagina, setPagina] = useState(1);
  const itensPorPagina = 10;

  // Carregar dados da API
  const carregarDados = () => {
    setIsLoading(true);
    setError(null);
    fetch('/api/cadastrados')
      .then((res) => {
        if (!res.ok) throw new Error('Falha ao carregar registros cadastrados.');
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          // Ordena decrescente por ID ou data de registro para os mais recentes aparecerem primeiro
          const ordenados = [...data].sort((a, b) => {
            const idA = parseInt(a.id, 10) || 0;
            const idB = parseInt(b.id, 10) || 0;
            return idB - idA;
          });
          setRegistros(ordenados);
        } else {
          setError('Dados retornados em formato incorreto.');
        }
      })
      .catch((err) => {
        console.error(err);
        setError(err.message || 'Erro de conexão.');
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    carregarDados();
  }, []);

  // Lógica de parser de datas para filtros inteligentes
  const parseValidade = (str: string): Date | null => {
    if (!str) return null;
    const parts = str.split('/');
    if (parts.length !== 3) return null;
    const d = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const a = parseInt(parts[2], 10);
    if (isNaN(d) || isNaN(m) || isNaN(a)) return null;
    return new Date(a, m, d, 12, 0, 0, 0); // meio dia para mitigar fuso horário
  };

  const parseTimestamp = (str: string): Date | null => {
    if (!str) return null;
    const cleaned = str.replace(',', '');
    const parts = cleaned.split(' ');
    if (parts.length < 1) return null;
    const dateParts = parts[0].split('/');
    if (dateParts.length !== 3) return null;
    const d = parseInt(dateParts[0], 10);
    const m = parseInt(dateParts[1], 10) - 1;
    const a = parseInt(dateParts[2], 10);
    
    let hours = 12, minutes = 0, seconds = 0;
    if (parts.length >= 2) {
      const timeParts = parts[1].split(':');
      if (timeParts.length >= 3) {
        hours = parseInt(timeParts[0], 10);
        minutes = parseInt(timeParts[1], 10);
        seconds = parseInt(timeParts[2], 10);
      }
    }
    
    if (isNaN(d) || isNaN(m) || isNaN(a)) return null;
    return new Date(a, m, d, hours, minutes, seconds);
  };

  // Obter referências de data
  const dateRanges = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const day = hoje.getDay();
    // Ajusta para segunda-feira da semana atual (no JS: 0=Dom, 1=Seg, ..., 6=Sáb)
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const inicioSemanaAtual = new Date(hoje);
    inicioSemanaAtual.setDate(hoje.getDate() + diffToMonday);
    inicioSemanaAtual.setHours(0, 0, 0, 0);

    const fimSemanaAtual = new Date(inicioSemanaAtual);
    fimSemanaAtual.setDate(inicioSemanaAtual.getDate() + 6);
    fimSemanaAtual.setHours(23, 59, 59, 999);

    const inicioProximaSemana = new Date(inicioSemanaAtual);
    inicioProximaSemana.setDate(inicioSemanaAtual.getDate() + 7);
    inicioProximaSemana.setHours(0, 0, 0, 0);

    const fimProximaSemana = new Date(inicioProximaSemana);
    fimProximaSemana.setDate(inicioProximaSemana.getDate() + 6);
    fimProximaSemana.setHours(23, 59, 59, 999);

    const inicioSemanaAnterior = new Date(inicioSemanaAtual);
    inicioSemanaAnterior.setDate(inicioSemanaAtual.getDate() - 7);
    inicioSemanaAnterior.setHours(0, 0, 0, 0);

    const fimSemanaAnterior = new Date(inicioSemanaAnterior);
    fimSemanaAnterior.setDate(inicioSemanaAnterior.getDate() + 6);
    fimSemanaAnterior.setHours(23, 59, 59, 999);

    const inicioMesAtual = new Date(hoje.getFullYear(), hoje.getMonth(), 1, 0, 0, 0, 0);
    const fimMesAtual = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59, 999);

    return {
      hoje,
      inicioSemanaAtual,
      fimSemanaAtual,
      inicioProximaSemana,
      fimProximaSemana,
      inicioSemanaAnterior,
      fimSemanaAnterior,
      inicioMesAtual,
      fimMesAtual,
    };
  }, []);

  // Classifica os registros e calcula as estatísticas sobre os dados gerais
  const stats = useMemo(() => {
    let vencidos = 0;
    let venceEstaSemana = 0;
    let venceProximaSemana = 0;

    registros.forEach((reg) => {
      const validade = parseValidade(reg.produtoValidade);
      if (validade) {
        if (validade < dateRanges.hoje) {
          vencidos++;
        } else if (validade >= dateRanges.inicioSemanaAtual && validade <= dateRanges.fimSemanaAtual) {
          venceEstaSemana++;
        } else if (validade >= dateRanges.inicioProximaSemana && validade <= dateRanges.fimProximaSemana) {
          venceProximaSemana++;
        }
      }
    });

    return {
      total: registros.length,
      vencidos,
      venceEstaSemana,
      venceProximaSemana,
    };
  }, [registros, dateRanges]);

  // Listas exclusivas para preencher as opções dos selects de filtros
  const marcasDisponiveis = useMemo(() => {
    const set = new Set(registros.map((r) => r.marcaDescr).filter(Boolean));
    return Array.from(set).sort();
  }, [registros]);

  const camarasDisponiveis = useMemo(() => {
    const set = new Set(registros.map((r) => r.camara).filter(Boolean));
    return Array.from(set).sort();
  }, [registros]);

  const classesDisponiveis = useMemo(() => {
    const set = new Set(registros.map((r) => r.produtoClasse).filter(Boolean));
    return Array.from(set).sort();
  }, [registros]);

  // Filtragem dos registros
  const registrosFiltrados = useMemo(() => {
    return registros.filter((reg) => {
      // 1) Busca global por texto (EAN, Descrição, Marca, ID, Vaga)
      if (filtroBusca.trim()) {
        const busca = filtroBusca.toLowerCase();
        const matchBusca =
          reg.id.toLowerCase().includes(busca) ||
          reg.produtoDescr.toLowerCase().includes(busca) ||
          reg.produtoEan.toLowerCase().includes(busca) ||
          reg.marcaDescr.toLowerCase().includes(busca) ||
          reg.camaraVaga.toLowerCase().includes(busca);
        if (!matchBusca) return false;
      }

      // 2) Filtro por Marca
      if (filtroMarca && reg.marcaDescr !== filtroMarca) return false;

      // 3) Filtro por Câmara
      if (filtroCamara && reg.camara !== filtroCamara) return false;

      // 4) Filtro por Vaga
      if (filtroVaga.trim() && !reg.camaraVaga.toLowerCase().includes(filtroVaga.toLowerCase())) return false;

      // 5) Filtro por Classe do Produto
      if (filtroClasse && reg.produtoClasse !== filtroClasse) return false;

      // 6) Filtro inteligente de Vencimento
      if (filtroVencimentoSmart !== 'todos') {
        const validade = parseValidade(reg.produtoValidade);
        if (!validade) return false;

        switch (filtroVencimentoSmart) {
          case 'vencidos':
            if (validade >= dateRanges.hoje) return false;
            break;
          case 'estaSemana':
            if (validade < dateRanges.inicioSemanaAtual || validade > dateRanges.fimSemanaAtual) return false;
            break;
          case 'proximaSemana':
            if (validade < dateRanges.inicioProximaSemana || validade > dateRanges.fimProximaSemana) return false;
            break;
          case 'esteMes':
            if (validade < dateRanges.inicioMesAtual || validade > dateRanges.fimMesAtual) return false;
            break;
          default:
            break;
        }
      }

      // 7) Filtro inteligente de Recebimento
      if (filtroRecebimentoSmart !== 'todos') {
        const recebido = parseTimestamp(reg.timestamp);
        if (!recebido) return false;

        switch (filtroRecebimentoSmart) {
          case 'estaSemana':
            if (recebido < dateRanges.inicioSemanaAtual || recebido > dateRanges.fimSemanaAtual) return false;
            break;
          case 'anteriorSemana':
            if (recebido < dateRanges.inicioSemanaAnterior || recebido > dateRanges.fimSemanaAnterior) return false;
            break;
          case 'esteMes':
            if (recebido < dateRanges.inicioMesAtual || recebido > dateRanges.fimMesAtual) return false;
            break;
          default:
            break;
        }
      }

      // 8) Filtro exato de Vencimento
      if (filtroVencimentoExato) {
        const parts = filtroVencimentoExato.split('-');
        if (parts.length === 3) {
          const dataBr = `${parts[2]}/${parts[1]}/${parts[0]}`;
          if (reg.produtoValidade !== dataBr) return false;
        } else {
          return false;
        }
      }

      // 9) Filtro exato de Recebimento
      if (filtroRecebimentoExato) {
        const parts = filtroRecebimentoExato.split('-');
        if (parts.length === 3) {
          const dataBr = `${parts[2]}/${parts[1]}/${parts[0]}`;
          const dataRecebimentoBR = reg.timestamp.split(' ')[0].replace(',', '');
          if (dataRecebimentoBR !== dataBr) return false;
        } else {
          return false;
        }
      }

      return true;
    });
  }, [
    registros,
    filtroBusca,
    filtroMarca,
    filtroCamara,
    filtroVaga,
    filtroClasse,
    filtroVencimentoSmart,
    filtroVencimentoExato,
    filtroRecebimentoSmart,
    filtroRecebimentoExato,
    dateRanges,
  ]);

  // Reseta para a primeira página quando os filtros mudam
  useEffect(() => {
    setPagina(1);
  }, [
    filtroBusca,
    filtroMarca,
    filtroCamara,
    filtroVaga,
    filtroClasse,
    filtroVencimentoSmart,
    filtroVencimentoExato,
    filtroRecebimentoSmart,
    filtroRecebimentoExato,
  ]);

  // Paginação dos registros filtrados
  const totalPaginas = Math.ceil(registrosFiltrados.length / itensPorPagina) || 1;
  const registrosPaginados = useMemo(() => {
    const inicio = (pagina - 1) * itensPorPagina;
    return registrosFiltrados.slice(inicio, inicio + itensPorPagina);
  }, [registrosFiltrados, pagina]);

  const limparFiltros = () => {
    setFiltroBusca('');
    setFiltroMarca('');
    setFiltroCamara('');
    setFiltroVaga('');
    setFiltroClasse('');
    setFiltroVencimentoSmart('todos');
    setFiltroVencimentoExato('');
    setFiltroRecebimentoSmart('todos');
    setFiltroRecebimentoExato('');
    setPagina(1);
  };

  // Retorna a sinalização do status de validade de um registro
  const obterSinalizacaoVencimento = (validadeStr: string) => {
    const validade = parseValidade(validadeStr);
    if (!validade) return null;

    if (validade < dateRanges.hoje) {
      return {
        tipo: 'vencido',
        badgeClass: 'bg-danger-100 dark:bg-danger-900/40 text-danger-800 dark:text-danger-300 border border-danger-200 dark:border-danger-800',
        texto: 'Vencido',
        icone: (
          <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        ),
      };
    }

    if (validade >= dateRanges.inicioSemanaAtual && validade <= dateRanges.fimSemanaAtual) {
      return {
        tipo: 'estaSemana',
        badgeClass: 'bg-danger-100 dark:bg-danger-900/40 text-danger-700 dark:text-danger-400 border border-danger-300 dark:border-danger-850 animate-pulse-subtle font-semibold shadow-sm',
        texto: 'Vence esta semana!',
        icone: (
          <svg className="w-3.5 h-3.5 mr-1 text-danger-600 dark:text-danger-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
      };
    }

    if (validade >= dateRanges.inicioProximaSemana && validade <= dateRanges.fimProximaSemana) {
      return {
        tipo: 'proximaSemana',
        badgeClass: 'bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-300 border border-warning-300 dark:border-warning-800 font-semibold',
        texto: 'Vence semana que vem',
        icone: (
          <svg className="w-3.5 h-3.5 mr-1 text-warning-600 dark:text-warning-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
      };
    }

    return null;
  };

  return (
    <div className="space-y-6">
      {/* 1) Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Cadastros */}
        <div className="card p-4 flex items-center gap-3.5 hover:shadow-card-hover transition-all duration-200">
          <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div>
            <p className="text-[10px] sm:text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Cadastrado</p>
            <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.total}</p>
          </div>
        </div>

        {/* Vencem Esta Semana (Alerta Máximo) */}
        <div className="card p-4 flex items-center gap-3.5 hover:shadow-card-hover transition-all duration-200 border-l-4 border-l-danger-500 dark:border-l-danger-600">
          <div className="w-10 h-10 rounded-xl bg-danger-100 dark:bg-danger-900/30 flex items-center justify-center flex-shrink-0 animate-pulse-subtle">
            <svg className="w-5 h-5 text-danger-600 dark:text-danger-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <p className="text-[10px] sm:text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Vence esta Semana</p>
            <p className="text-xl sm:text-2xl font-bold text-danger-600 dark:text-danger-400">{stats.venceEstaSemana}</p>
          </div>
        </div>

        {/* Vencem Próxima Semana (Alerta) */}
        <div className="card p-4 flex items-center gap-3.5 hover:shadow-card-hover transition-all duration-200 border-l-4 border-l-warning-500">
          <div className="w-10 h-10 rounded-xl bg-warning-100 dark:bg-warning-900/30 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-warning-600 dark:text-warning-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-[10px] sm:text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Vence próxima Semana</p>
            <p className="text-xl sm:text-2xl font-bold text-warning-600 dark:text-warning-500">{stats.venceProximaSemana}</p>
          </div>
        </div>

        {/* Já Vencidos */}
        <div className="card p-4 flex items-center gap-3.5 hover:shadow-card-hover transition-all duration-200">
          <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <div>
            <p className="text-[10px] sm:text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Já Vencidos</p>
            <p className="text-xl sm:text-2xl font-bold text-slate-700 dark:text-slate-300">{stats.vencidos}</p>
          </div>
        </div>
      </div>

      {/* 2) Painel de Filtros */}
      <div className="card-elevated p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <svg className="w-4 h-4 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filtros de Pesquisa
          </h3>
          {(filtroBusca || filtroMarca || filtroCamara || filtroVaga || filtroClasse || filtroVencimentoSmart !== 'todos' || filtroVencimentoExato || filtroRecebimentoSmart !== 'todos' || filtroRecebimentoExato) && (
            <button
              onClick={limparFiltros}
              className="text-xs font-semibold text-danger-600 dark:text-danger-400 hover:underline flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Limpar Filtros
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Busca Global */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Busca Rápida</label>
            <input
              type="text"
              placeholder="Pesquisar EAN, produto, ID..."
              value={filtroBusca}
              onChange={(e) => setFiltroBusca(e.target.value)}
              className="input-field py-2 text-sm"
            />
          </div>

          {/* Filtro Marca */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Marca</label>
            <select
              value={filtroMarca}
              onChange={(e) => setFiltroMarca(e.target.value)}
              className="input-field py-2 text-sm bg-none cursor-pointer"
            >
              <option value="">Todas as marcas</option>
              {marcasDisponiveis.map((marca) => (
                <option key={marca} value={marca}>{marca}</option>
              ))}
            </select>
          </div>

          {/* Filtro Classe */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Classe</label>
            <select
              value={filtroClasse}
              onChange={(e) => setFiltroClasse(e.target.value)}
              className="input-field py-2 text-sm bg-none cursor-pointer"
            >
              <option value="">Todas as classes</option>
              {classesDisponiveis.map((classe) => (
                <option key={classe} value={classe}>{classe}</option>
              ))}
            </select>
          </div>

          {/* Filtro Câmara */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Câmara</label>
            <select
              value={filtroCamara}
              onChange={(e) => setFiltroCamara(e.target.value)}
              className="input-field py-2 text-sm bg-none cursor-pointer"
            >
              <option value="">Todas as câmaras</option>
              {camarasDisponiveis.map((camara) => (
                <option key={camara} value={camara}>{camara}</option>
              ))}
            </select>
          </div>

          {/* Filtro Vaga */}
          <div className="space-y-1 col-span-1">
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Vaga</label>
            <input
              type="text"
              placeholder="Digite o código da vaga..."
              value={filtroVaga}
              onChange={(e) => setFiltroVaga(e.target.value)}
              className="input-field py-2 text-sm"
            />
          </div>

          {/* Filtro inteligente de Vencimento */}
          <div className="space-y-1 col-span-1">
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Vencimento Inteligente
            </label>
            <select
              value={filtroVencimentoSmart}
              onChange={(e) => {
                setFiltroVencimentoSmart(e.target.value);
                if (e.target.value !== 'todos') setFiltroVencimentoExato('');
              }}
              className="input-field py-2 text-sm font-medium text-slate-800 dark:text-slate-100 cursor-pointer"
            >
              <option value="todos">Qualquer validade</option>
              <option value="vencidos">❌ Já vencidos</option>
              <option value="estaSemana">🚨 Vence nesta semana</option>
              <option value="proximaSemana">⏳ Vence na próxima semana</option>
              <option value="esteMes">📅 Vence este mês</option>
            </select>
          </div>

          {/* Filtro de Vencimento Exato */}
          <div className="space-y-1 col-span-1">
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Vencimento Exato
            </label>
            <input
              type="date"
              value={filtroVencimentoExato}
              onChange={(e) => {
                setFiltroVencimentoExato(e.target.value);
                if (e.target.value) setFiltroVencimentoSmart('todos');
              }}
              className="input-field py-2 text-sm cursor-pointer"
            />
          </div>

          {/* Filtro inteligente de Recebimento */}
          <div className="space-y-1 col-span-1">
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Recebimento Inteligente
            </label>
            <select
              value={filtroRecebimentoSmart}
              onChange={(e) => {
                setFiltroRecebimentoSmart(e.target.value);
                if (e.target.value !== 'todos') setFiltroRecebimentoExato('');
              }}
              className="input-field py-2 text-sm font-medium text-slate-800 dark:text-slate-100 cursor-pointer"
            >
              <option value="todos">Qualquer recebimento</option>
              <option value="estaSemana">📥 Recebido nesta semana</option>
              <option value="anteriorSemana">📅 Recebido na semana anterior</option>
              <option value="esteMes">🗓️ Recebido este mês</option>
            </select>
          </div>

          {/* Filtro de Recebimento Exato */}
          <div className="space-y-1 col-span-1">
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Recebimento Exato
            </label>
            <input
              type="date"
              value={filtroRecebimentoExato}
              onChange={(e) => {
                setFiltroRecebimentoExato(e.target.value);
                if (e.target.value) setFiltroRecebimentoSmart('todos');
              }}
              className="input-field py-2 text-sm cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 3) Tabela de Registros */}
      <div className="card-elevated overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center flex-wrap gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Registros Cadastrados</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Mostrando {registrosFiltrados.length === 0 ? '0' : `${(pagina - 1) * itensPorPagina + 1} a ${Math.min(pagina * itensPorPagina, registrosFiltrados.length)}`} de {registrosFiltrados.length} registro(s) encontrado(s)
            </p>
          </div>
          <button
            onClick={carregarDados}
            disabled={isLoading}
            className="btn-secondary py-2 text-xs flex items-center gap-1.5 border border-slate-300 dark:border-slate-600 shadow-sm"
          >
            {isLoading ? (
              <svg className="w-3.5 h-3.5 animate-spin text-slate-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18.5" />
              </svg>
            )}
            Atualizar Relatório
          </button>
        </div>

        {error && (
          <div className="p-6 text-center">
            <div className="inline-flex items-center gap-2 bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 rounded-xl px-4 py-3 text-sm text-danger-700 dark:text-danger-400">
              <svg className="w-5 h-5 text-danger-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}

        {!error && registrosFiltrados.length === 0 && (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">
            <svg className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-medium">Nenhum registro encontrado.</p>
            <p className="text-xs text-slate-400 mt-1">Experimente limpar ou ajustar os filtros de pesquisa.</p>
          </div>
        )}

        {!error && registrosFiltrados.length > 0 && (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full table-auto border-separate border-spacing-0">
              <thead className="bg-slate-100 dark:bg-slate-800/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Recebido em</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Marca</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Produto / EAN</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Classe</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Câmara / Vaga</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Validade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {registrosPaginados.map((reg) => {
                  const sinalizacao = obterSinalizacaoVencimento(reg.produtoValidade);
                  return (
                    <tr
                      key={reg.id}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors ${
                        sinalizacao?.tipo === 'estaSemana'
                          ? 'bg-danger-50/20 dark:bg-danger-900/5'
                          : sinalizacao?.tipo === 'proximaSemana'
                          ? 'bg-warning-50/20 dark:bg-warning-900/5'
                          : ''
                      }`}
                    >
                      <td className="px-4 py-3.5 text-xs font-bold text-slate-400 dark:text-slate-500 whitespace-nowrap">
                        #{reg.id}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap font-mono">
                        {reg.timestamp}
                      </td>
                      <td className="px-4 py-3.5 text-sm font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        {reg.marcaDescr}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-slate-700 dark:text-slate-300 min-w-[240px]">
                        <div className="font-medium text-slate-900 dark:text-slate-100">{reg.produtoDescr}</div>
                        <div className="text-xs font-mono text-slate-400 dark:text-slate-500 mt-0.5">{reg.produtoEan}</div>
                      </td>
                      <td className="px-4 py-3.5 text-xs whitespace-nowrap">
                        <span className="badge badge-primary">{reg.produtoClasse}</span>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        <span className="font-semibold">{reg.camara}</span>
                        {reg.camaraVaga && (
                          <span className="text-slate-400 dark:text-slate-500 ml-1 font-mono text-xs">
                            ({reg.camaraVaga})
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-sm whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span className="badge badge-success font-bold font-mono w-max">
                            {reg.produtoValidade}
                          </span>
                          {sinalizacao && (
                            <span className={`badge ${sinalizacao.badgeClass} text-[9px] py-0 px-1.5 flex items-center w-max`}>
                              {sinalizacao.icone}
                              {sinalizacao.texto}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginação */}
        {!error && registrosFiltrados.length > 0 && (
          <div className="px-4 py-3.5 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Página {pagina} de {totalPaginas}
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPagina((prev) => Math.max(prev - 1, 1))}
                disabled={pagina === 1}
                className="btn-secondary px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-600 disabled:opacity-40"
              >
                Anterior
              </button>
              <button
                onClick={() => setPagina((prev) => Math.min(prev + 1, totalPaginas))}
                disabled={pagina === totalPaginas}
                className="btn-secondary px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-600 disabled:opacity-40"
              >
                Próximo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
