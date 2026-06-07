// components/Scanner.tsx
import { useRef, useState, useEffect } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

interface ScannerProps {
  onDetected: (decodedText: string) => void;
}

export default function Scanner({ onDetected }: ScannerProps) {
  // Estados da câmera
  const [scanning, setScanning] = useState(false);
  const [processing, setProcessing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  // Estados do zoom/pan
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [showCrop, setShowCrop] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageElementRef = useRef<HTMLImageElement>(null);
  const transformWrapperRef = useRef<any>(null);

  // Limpeza da câmera
  useEffect(() => {
    return () => {
      if (readerRef.current) readerRef.current.reset();
    };
  }, []);

  // ========== CÂMERA ==========
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
      const constraints = { video: { facingMode: { exact: "environment" } } };
      await reader.decodeFromConstraints(constraints, videoRef.current!, (result) => {
        if (result && !processing) {
          const text = result.getText();
          if (text) {
            stopScanning();
            onDetected(text);
          }
        }
      });
      setScanning(true);
    } catch (err: any) {
      alert('Erro ao acessar câmera: ' + (err.message || 'verifique permissões'));
      stopScanning();
    } finally {
      setProcessing(false);
    }
  };

  // ========== DETECÇÃO (nativa + fallback) ==========
  const detectWithNativeAPI = async (imageBitmap: ImageBitmap): Promise<string | null> => {
    if (!('BarcodeDetector' in window)) return null;
    try {
      const detector = new (window as any).BarcodeDetector({ formats: ['qr_code', 'data_matrix', 'aztec', 'pdf417'] });
      const barcodes = await detector.detect(imageBitmap);
      return barcodes[0]?.rawValue || null;
    } catch {
      return null;
    }
  };

  const detectWithZXing = async (imageUrl: string): Promise<string | null> => {
    const reader = new BrowserMultiFormatReader();
    try {
      const result = await reader.decodeFromImageUrl(imageUrl);
      return result ? result.getText() : null;
    } catch {
      return null;
    } finally {
      reader.reset();
    }
  };

  const detectFromImageBitmap = async (bitmap: ImageBitmap): Promise<string | null> => {
    let text = await detectWithNativeAPI(bitmap);
    if (!text) {
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(bitmap, 0, 0);
      const dataUrl = canvas.toDataURL();
      text = await detectWithZXing(dataUrl);
    }
    return text;
  };

  // ========== EXTRAÇÃO DA REGIÃO CENTRAL - MÉTODO ROBUSTO ==========
  const detectCentralRegion = async () => {
    if (!containerRef.current || !imageElementRef.current) {
      alert('Erro: elementos da interface não carregados');
      return;
    }

    setProcessing(true);
    try {
      const container = containerRef.current;
      const img = imageElementRef.current;
      const wrapper = transformWrapperRef.current;

      // 1. Obtém a transformação CSS aplicada à imagem pela biblioteca
      const transformStyle = window.getComputedStyle(img).transform;
      // Ex: matrix(1.5, 0, 0, 1.5, 100, 50)
      let scale = 1;
      let translateX = 0;
      let translateY = 0;

      if (transformStyle && transformStyle !== 'none') {
        const matrix = transformStyle.match(/matrix\(([^)]+)\)/);
        if (matrix && matrix[1]) {
          const values = matrix[1].split(',').map(parseFloat);
          scale = Math.sqrt(values[0] * values[0] + values[1] * values[1]); // fator de escala
          translateX = values[4];
          translateY = values[5];
        }
      } else if (wrapper && wrapper.state) {
        // Fallback: pegar da lib caso transformStyle não funcione
        scale = wrapper.state.scale || 1;
        translateX = wrapper.state.positionX || 0;
        translateY = wrapper.state.positionY || 0;
      }

      // Dimensões do container
      const containerRect = container.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const containerHeight = containerRect.height;

      // Tamanho natural da imagem
      const imgNaturalWidth = img.naturalWidth;
      const imgNaturalHeight = img.naturalHeight;
      if (imgNaturalWidth === 0 || imgNaturalHeight === 0) {
        throw new Error('Imagem não carregada completamente');
      }

      // Tamanho exibido da imagem (após escala)
      const imgDisplayWidth = imgNaturalWidth * scale;
      const imgDisplayHeight = imgNaturalHeight * scale;

      // Posição da imagem no container (considerando translate)
      // A biblioteca centraliza a imagem por padrão, então o ponto (0,0) da imagem está no centro do container
      const imgLeft = translateX + (containerWidth - imgDisplayWidth) / 2;
      const imgTop = translateY + (containerHeight - imgDisplayHeight) / 2;

      // Área verde central (60% do menor lado do container)
      const boxSize = Math.min(containerWidth, containerHeight) * 0.6;
      const boxX = (containerWidth - boxSize) / 2;
      const boxY = (containerHeight - boxSize) / 2;

      // Coordenadas da área verde em relação à imagem original
      const relativeX = (boxX - imgLeft) / scale;
      const relativeY = (boxY - imgTop) / scale;
      const relativeW = boxSize / scale;
      const relativeH = boxSize / scale;

      // Valida se está dentro da imagem
      if (relativeX < 0 || relativeY < 0 || relativeX + relativeW > imgNaturalWidth || relativeY + relativeH > imgNaturalHeight) {
        alert(`A área verde está fora da imagem. Ajuste a posição/zoom.
Valores: X=${relativeX.toFixed(0)}, Y=${relativeY.toFixed(0)}, Largura imagem=${imgNaturalWidth}, Altura=${imgNaturalHeight}`);
        setProcessing(false);
        return;
      }

      // Cria canvas para recortar a região
      const canvas = document.createElement('canvas');
      canvas.width = boxSize;
      canvas.height = boxSize;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Falha ao criar contexto canvas');

      // Desenha a região recortada da imagem original
      ctx.drawImage(
        img,
        relativeX, relativeY, relativeW, relativeH,
        0, 0, boxSize, boxSize
      );

      // Tenta detectar o código
      const bitmap = await createImageBitmap(canvas);
      const decoded = await detectFromImageBitmap(bitmap);

      if (decoded) {
        onDetected(decoded);
        fecharPreview();
      } else {
        alert('Nenhum código detectado na área verde. Tente ampliar o zoom e centralizar bem o código.');
      }
    } catch (err: any) {
      console.error(err);
      alert(`Erro detalhado: ${err.message || err}\n\nTente novamente com outra imagem ou contate o suporte.`);
    } finally {
      setProcessing(false);
    }
  };

  const fecharPreview = () => {
    setImagePreviewUrl(null);
    setShowCrop(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ========== UPLOAD E TENTATIVA AUTOMÁTICA ==========
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProcessing(true);
    const imageUrl = URL.createObjectURL(file);
    setImagePreviewUrl(imageUrl);

    // Detecção automática na imagem inteira
    let decoded: string | null = null;
    try {
      const img = new Image();
      img.src = imageUrl;
      await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; });
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0);
      const bitmap = await createImageBitmap(canvas);
      decoded = await detectFromImageBitmap(bitmap);
    } catch (err) {
      console.error(err);
    }

    if (decoded) {
      URL.revokeObjectURL(imageUrl);
      setProcessing(false);
      onDetected(decoded);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Falhou: abre modo manual
    setProcessing(false);
    setShowCrop(true);
    setTimeout(() => {
      if (imageElementRef.current) {
        imageElementRef.current.src = imageUrl;
      }
    }, 50);
  };

  // ========== RENDER ==========
  return (
    <div className="flex flex-col items-center gap-3">
      {/* Modal de ajuste manual */}
      {showCrop && imagePreviewUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex flex-col items-center justify-center p-4">
          <h3 className="text-white text-lg mb-2 text-center">
            Arraste e dê zoom para posicionar o código <strong className="text-green-400">dentro do quadrado verde</strong>
          </h3>
          <div
            ref={containerRef}
            className="relative w-full max-w-lg h-[60vh] bg-black rounded-lg overflow-hidden"
            style={{ touchAction: 'none' }}
          >
            <TransformWrapper
              ref={transformWrapperRef}
              initialScale={1}
              minScale={0.5}
              maxScale={5}
              centerOnInit={true}
              limitToBounds={true}
              panning={{ velocityDisabled: true }}
              pinch={{ step: 5 }}
            >
              <TransformComponent
                wrapperStyle={{ width: '100%', height: '100%' }}
                contentStyle={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <img
                  ref={imageElementRef}
                  src={imagePreviewUrl}
                  alt="Preview"
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                  draggable={false}
                  crossOrigin="anonymous"
                />
              </TransformComponent>
            </TransformWrapper>
            {/* Máscara central */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div
                className="border-4 border-green-500"
                style={{
                  width: '60%',
                  height: '60%',
                  boxShadow: '0 0 0 9999px rgba(0,0,0,0.75)',
                }}
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={detectCentralRegion}
              disabled={processing}
              className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
            >
              {processing ? 'Detectando...' : 'Detectar na área verde'}
            </button>
            <button
              onClick={fecharPreview}
              className="px-4 py-2 bg-red-600 text-white rounded"
            >
              Cancelar
            </button>
          </div>
          <p className="text-gray-300 text-sm mt-2">
            • 1 dedo: arrastar • 2 dedos: zoom
          </p>
        </div>
      )}

      {/* Câmera */}
      <video
        ref={videoRef}
        className="w-full max-w-sm rounded border bg-black"
        style={{ aspectRatio: '4/3' }}
        playsInline
        autoPlay
      />

      <div className="flex gap-2">
        {!scanning ? (
          <button onClick={startScanning} className="px-4 py-2 bg-green-600 text-white rounded" disabled={processing}>
            Iniciar Scanner
          </button>
        ) : (
          <button onClick={stopScanning} className="px-4 py-2 bg-red-600 text-white rounded" disabled={processing}>
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
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
      </div>
    </div>
  );
}