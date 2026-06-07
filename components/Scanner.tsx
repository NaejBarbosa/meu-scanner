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

      // Obtém a lista de dispositivos de vídeo
      const videoInputDevices = await reader.listVideoInputDevices();

      // Usa a câmera traseira (environment) ou a primeira disponível
      const deviceId = videoInputDevices.find(
        (device) => device.label.toLowerCase().includes('environment')
      )?.deviceId || videoInputDevices[0]?.deviceId;

      if (!deviceId) throw new Error('Nenhuma câmera encontrada');

      // Inicia a decodificação contínua
      await reader.decodeFromVideoDevice(deviceId, videoRef.current!, (result, err) => {
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
      alert('Não foi possível acessar a câmera ou nenhum código suportado foi encontrado.');
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
      const img = new Image();
      img.src = imageUrl;

      // Aguarda o carregamento da imagem
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      // Tenta decodificar a partir do elemento img
      const result = await reader.decodeFromImageElement(img);
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
        alert('Erro ao ler a imagem.');
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