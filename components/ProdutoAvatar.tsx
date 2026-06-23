import { useState, useEffect } from 'react';
import { Package } from 'lucide-react';

interface ProdutoAvatarProps {
  ean: string;
  descricao: string;
}

export default function ProdutoAvatar({ ean, descricao }: ProdutoAvatarProps) {
  const [hasError, setHasError] = useState(false);

  // Reseta o estado de erro caso o EAN mude para que outros produtos carreguem corretamente
  useEffect(() => {
    setHasError(false);
  }, [ean]);

  return (
    <div className="w-full bg-white rounded-xl p-4 border border-slate-200 dark:border-slate-700 flex items-center justify-center flex-shrink-0">
      {hasError ? (
        <div className="h-32 w-full flex items-center justify-center text-slate-300 animate-fade-in">
          <Package className="w-14 h-14 stroke-[1.5]" />
        </div>
      ) : (
        <img
          src={`/imagens_produtos/${ean}.webp`}
          alt={descricao}
          onError={() => setHasError(true)}
          className="h-32 w-full object-contain select-none animate-fade-in"
        />
      )}
    </div>
  );
}
