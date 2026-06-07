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
        video: { facingMode: { exact: "environment" } }
      };

      await reader.decodeFromConstraints(constraints, videoRef.current!, (result, err) => {
        if (result && !processing) {
          const text = result.getText();
          if (text) {
            stopScanning();
            onDetected(text);
          }
        }
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

  // Função para ler imagem usando a API nativa BarcodeDetector (melhor para Data Matrix)
  const detectWithNativeAPI = async (imageBitmap: ImageBitmap): Promise<string | null> => {
    if (!('BarcodeDetector' in window)) {
      return null; // API não suportada
    }
    try {
      const detector = new (window as any).BarcodeDetector({ formats: ['qr_code', 'data_matrix', 'aztec', 'pdf417'] });
      const barcodes = await detector.detect(imageBitmap);
      if (barcodes.length > 0 && barcodes[0].rawValue) {
        return barcodes[0].rawValue;
      }
      return null;
    } catch (err) {
      console.warn('BarcodeDetector falhou', err);
      return null;
    }
  };

  // Fallback com @zxing (caso a API nativa não exista ou falhe)
  const detectWithZXing = async (imageUrl: string): Promise<string | null> => {
    const reader = new BrowserMultiFormatReader();
    try {
      const result = await reader.decodeFromImageUrl(imageUrl);
      return result ? result.getText() : null;
    } catch (err) {
      return null;
    } finally {
      reader.reset();
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProcessing(true);
    let imageUrl: string | null = null;

    try {
      // Cria uma URL temporária para a imagem
      imageUrl = URL.createObjectURL(file);

      // Carrega a imagem em um ImageBitmap (carregamento otimizado)
      const img = new Image();
      img.src = imageUrl;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      // Redimensiona a imagem para melhorar a detecção (max 1024px no maior lado)
      const maxSize = 1024;
      let width = img.width;
      let height = img.height;
      if (width > maxSize || height > maxSize) {
        const scale = maxSize / Math.max(width, height);
        width = Math.floor(width * scale);
        height = Math.floor(height * scale);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      const imageBitmap = await createImageBitmap(canvas);

      let decodedText: string | null = null;

      // Tenta primeiro com a API nativa (mais rápida e precisa)
      decodedText = await detectWithNativeAPI(imageBitmap);
      
      // Se falhar, tenta com o @zxing
      if (!decodedText) {
        decodedText = await detectWithZXing(imageUrl);
      }

      if (decodedText) {
        onDetected(decodedText);
      } else {
        alert('Nenhum código Data Matrix ou QR Code detectado na imagem. Tente uma foto mais nítida e com boa iluminação.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao processar a imagem. Verifique se o código está bem visível.');
    } finally {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
      setProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
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