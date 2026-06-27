import { useState } from 'react';

interface MenuPrincipalProps {
  onSelectScan: () => void;
  onSelectRelatorio: () => void;
  onSelectPesquisa: () => void;
}

export default function MenuPrincipal({ onSelectScan, onSelectRelatorio, onSelectPesquisa }: MenuPrincipalProps) {
  return (
    <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-12 animate-fadeIn">
      {/* Boas-vindas Header */}
      <div className="text-center space-y-3 animate-slideUp" style={{ animationDelay: '0ms' }}>
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl bg-gradient-to-r from-primary-500 to-indigo-500 bg-clip-text text-transparent uppercase tracking-wider">
          PaletScan
        </h2>
        <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
          Logística inteligente e controle automatizado de recebimento para câmaras frias.
        </p>
      </div>

      {/* Grid de Opções */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {/* Card 1: Registrar Entrada */}
        <button
          onClick={onSelectScan}
          className="group text-left card-elevated p-8 flex flex-col justify-between hover:border-primary-500/50 hover:scale-[1.02] hover:shadow-elevated transition-all duration-300 animate-scale-in cursor-pointer relative overflow-hidden"
          style={{ animationDelay: '50ms' }}
        >
          {/* Decoração sutil de gradiente de fundo */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 dark:bg-primary-500/10 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform duration-300" />
          
          <div className="space-y-6">
            {/* Ícone */}
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center shadow-lg group-hover:shadow-primary-500/25 transition-all duration-300">
              <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
                <path d="M6 10.5l6-3.5 6 3.5-6 3.5-6-3.5z" />
                <path d="M6 14.5l6-3.5 6 3.5-6 3.5-6-3.5z" />
                <path d="M6 10.5v4l6 3.5v-4M12 14v4l6-3.5v-4" />
              </svg>
            </div>

            {/* Texto informativo */}
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                Registrar Entrada
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Escaneie códigos Data Matrix, QR Code ou códigos de barras dos produtos. Valide compatibilidade com a câmara fria e defina a vaga correta de armazenamento.
              </p>
            </div>
          </div>

          <div className="mt-8 flex items-center gap-2 text-sm font-semibold text-primary-600 dark:text-primary-400">
            <span>Iniciar Processo</span>
            <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </div>
        </button>

        {/* Card 2: Relatório Geral */}
        <button
          onClick={onSelectRelatorio}
          className="group text-left card-elevated p-8 flex flex-col justify-between hover:border-success-500/50 hover:scale-[1.02] hover:shadow-elevated transition-all duration-300 animate-scale-in cursor-pointer relative overflow-hidden"
          style={{ animationDelay: '100ms' }}
        >
          {/* Decoração sutil de gradiente de fundo */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-success-500/5 dark:bg-success-500/10 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform duration-300" />
          
          <div className="space-y-6">
            {/* Ícone */}
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-success-500 to-success-600 flex items-center justify-center shadow-lg group-hover:shadow-success-500/20 transition-all duration-300">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>

            {/* Texto informativo */}
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 group-hover:text-success-600 dark:group-hover:text-success-400 transition-colors">
                Relatório Geral
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Consulte todos os produtos já armazenados. Realize buscas avançadas, aplique filtros inteligentes por datas de validade e recebimento, e acompanhe alertas de vencimento.
              </p>
            </div>
          </div>

          <div className="mt-8 flex items-center gap-2 text-sm font-semibold text-success-600 dark:text-success-400">
            <span>Visualizar Relatórios</span>
            <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </div>
        </button>

        {/* Card 3: Pesquisa e Consulta */}
        <button
          onClick={onSelectPesquisa}
          className="group text-left card-elevated p-8 flex flex-col justify-between hover:border-warning-500/50 hover:scale-[1.02] hover:shadow-elevated transition-all duration-300 animate-scale-in cursor-pointer relative overflow-hidden"
          style={{ animationDelay: '150ms' }}
        >
          {/* Decoração sutil de gradiente de fundo */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-warning-500/5 dark:bg-warning-500/10 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform duration-300" />
          
          <div className="space-y-6">
            {/* Ícone */}
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-warning-500 to-warning-600 flex items-center justify-center shadow-lg group-hover:shadow-warning-500/20 transition-all duration-300">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16l2.879-2.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            {/* Texto informativo */}
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 group-hover:text-warning-600 dark:group-hover:text-warning-400 transition-colors">
                Pesquisa e Consulta
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Consulte a ficha técnica de produtos via busca avançada (Fuzzy Search) ou leitura de código EAN/DUN. Gerencie o radar de produtos procurados (Watchlist) e gere QR Codes para integração.
              </p>
            </div>
          </div>

          <div className="mt-8 flex items-center gap-2 text-sm font-semibold text-warning-600 dark:text-warning-400">
            <span>Abrir Consulta</span>
            <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </div>
        </button>
      </div>
    </div>
  );
}
