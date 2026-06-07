// components/Scanner.tsx
import { useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface ScannerProps {
  onDetected: (decodedText: string) => void;
}

export default function Scanner({ onDetected }: ScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [processing, setProcessing] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startScanning = async () => {
    scannerRef.current = new Html5Qrcode('reader');
    try {
      await scannerRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          stopScanning();
          onDetected(decodedText);
        },
        () => {} // erros de scan contínuo ignorados
      );
      setScanning(true);
    } catch (err) {
      console.error('Erro ao iniciar câmera', err);
      alert('Não foi possível acessar a câmera');
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      await scannerRef.current.stop();
      scannerRef.current.clear();
      setScanning(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProcessing(true);
    try {
      // usa instância separada para não atrapalhar a câmera
      const tempScanner = new Html5Qrcode('reader-temp');
      const result = await tempScanner.scanFile(file, true); // true = mostrar imagem?
      if (result) {
        onDetected(result);
      } else {
        alert('Nenhum QR Code encontrado na imagem');
      }
      tempScanner.clear();
    } catch (err) {
      console.error(err);
      alert('Nenhum QR Code encontrado ou imagem inválida');
    } finally {
      setProcessing(false);
      // limpa o input para permitir selecionar a mesma imagem novamente
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div id="reader" className="w-full max-w-sm" />
      {/* div oculta para o scanFile (não usado para câmera) */}
      <div id="reader-temp" style={{ display: 'none' }} />

      <div className="flex gap-2">
        {!scanning ? (
          <button
            onClick={startScanning}
            className="px-4 py-2 bg-green-600 text-white rounded"
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
          className="px-4 py-2 bg-blue-600 text-white rounded"
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