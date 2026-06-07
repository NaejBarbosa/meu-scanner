// components/Scanner.tsx
import { useRef, useState, useEffect } from 'react';
import {
  BrowserMultiFormatReader,
  NotFoundException,
  ChecksumException,
  FormatException,
} from '@zxing/library';

interface ScannerProps {
  onDetected: (decodedText: string) => void;
}

export default function Scanner({ onDetected }: ScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [processing, setProcessing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Libera recursos ao desmontar
  useEffect(() => {
    return () => {
      if (readerRef.current) {
        readerRef.current.reset();
        readerRef.current = null;
      }
    };
  }, []);

  const stopScanning = async () => {
    if (readerRef.current) {
      readerRef.current.reset();
      readerRef.current = null;
    }
    setScanning(false);
  };

  const startScanning = async () => {
    if (scanning) return;
    setProcessing(true);

    try {
      const reader = new BrowserMultiFormatReader();
      readerRef.current = reader;

      // Força o uso da câmera traseira via constraints
      const constraints = {
        video: {
          facingMode: { exact: "environment" }
        }
      };

      // Inicia a decodificação contínua com as constraints
      await reader.decodeFromConstraints(constraints, videoRef.current!, (result, err) => {
        if (result && !processing) {
          const text = result.getText();
          if (text) {
            stopScanning();
            onDetected(text);
          }
        }
        // Ignora erros (quadros sem código)
      });
      setScanning(true);
    } catch (err) {
      console.error('Erro ao iniciar câmera:', err);
      alert('Não foi possível acessar a câmera traseira. Verifique as permissões.');
      stopScanning();
    } finally {
      setProcessing(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProcessing(true);
    const reader = new BrowserMultiFormatReader();

    try {
      // Cria uma URL temporária para o arquivo
      const imageUrl = URL.createObjectURL(file);

      // Usa decodeFromImageUrl que aguarda o carregamento completo
      const result = await reader.decodeFromImageUrl(imageUrl);
      
      if (result) {
        const text = result.getText();
        if (text) {
          onDetected(text);
        } else {
          alert('Nenhum texto encontrado no código.');
        }
      } else {
        alert('Nenhum código Data Matrix / QR Code encontrado na imagem.');
      }

      URL.revokeObjectURL(imageUrl);
    } catch (err) {
      console.error(err);
      if (err instanceof NotFoundException) {
        alert('Nenhum código Data Matrix / QR Code detectado na imagem.');
      } else if (err instanceof ChecksumException || err instanceof FormatException) {
        alert('Código corrompido ou formato inválido.');
      } else {
        alert('Erro ao ler a imagem. Tente outra foto mais nítida.');
      }
    } finally {
      setProcessing(false);
      // Limpa o input para permitir reenviar o mesmo arquivo
      if (fileInputRef.current) fileInputRef.current.value = '';
      reader.reset();
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Elemento de vídeo para a câmera */}
      <video
        ref={videoRef}
        className="w-full max-w-sm rounded border bg-black"
        style={{ aspectRatio: '4/3' }}
        playsInline
        autoPlay
      />

      <div className="flex gap-2">
        {!scanning ? (
          <button
            onClick={startScanning}
            className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
            disabled={processing}
          >
            Iniciar Scanner
          </button>
        ) : (
          <button
            onClick={stopScanning}
            className="px-4 py-2 bg-red-600 text-white rounded"
            disabled={processing}
          >
            Parar Scanner
          </button>
        )}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          disabled={processing || scanning}
        >
          {processing ? 'Processando...' : 'Ler da Galeria'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />
      </div>
    </div>
  );
}