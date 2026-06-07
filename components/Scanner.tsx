// components/Scanner.tsx
import { useRef, useState, useEffect } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';

interface ScannerProps {
  onDetected: (decodedText: string) => void;
}

export default function Scanner({ onDetected }: ScannerProps) {
  // Estados da câmera
  const [scanning, setScanning] = useState(false);
  const [processing, setProcessing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  // Estados do crop com zoom/pan
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [showCrop, setShowCrop] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const originalImageRef = useRef<HTMLImageElement | null>(null);

  // Transformações: posição (x,y) e escala (zoom)
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  // Dimensões originais da imagem (após redimensionamento lógico)
  const [imgDisplaySize, setImgDisplaySize] = useState({ w: 0, h: 0 });
  // Estado de interação
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [initialDistance, setInitialDistance] = useState<number | null>(null);
  const [initialScale, setInitialScale] = useState(1);

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
    } catch {
      alert('Não foi possível acessar a câmera traseira.');
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

  // ========== DESENHO DO CANVAS COM MÁSCARA ==========
  const updateCanvas = () => {
    const canvas = canvasRef.current;
    const img = originalImageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Obtém o tamanho do canvas (da tela)
    const container = canvas.parentElement;
    if (!container) return;
    const canvasWidth = container.clientWidth;
    const canvasHeight = container.clientHeight;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Calcula a área de desenho da imagem (considerando transform)
    // Primeiro, qual o tamanho da imagem em pixels no canvas (sem escala, apenas centralizada)
    // Para que ela caiba inicialmente, calculamos uma escala base que faça a imagem inteira caber no canvas.
    const baseScale = Math.min(canvasWidth / img.width, canvasHeight / img.height);
    const displayWidth = img.width * baseScale;
    const displayHeight = img.height * baseScale;
    // Guarda para limites de pan
    setImgDisplaySize({ w: displayWidth, h: displayHeight });

    // Aplica escala do usuário (zoom) em cima da baseScale
    const finalScale = baseScale * transform.scale;

    // Centraliza a imagem inicialmente (x, y relativos ao centro)
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    let offsetX = transform.x + (centerX - (displayWidth * transform.scale) / 2);
    let offsetY = transform.y + (centerY - (displayHeight * transform.scale) / 2);

    // Limites de pan (para não deixar a imagem sair completamente)
    const maxX = Math.max(0, (displayWidth * transform.scale) - canvasWidth) / 2;
    const minX = -maxX;
    const maxY = Math.max(0, (displayHeight * transform.scale) - canvasHeight) / 2;
    const minY = -maxY;
    offsetX = Math.min(maxX, Math.max(minX, offsetX));
    offsetY = Math.min(maxY, Math.max(minY, offsetY));

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(finalScale, finalScale);
    ctx.drawImage(img, 0, 0, img.width, img.height);
    ctx.restore();

    // Desenha máscara escura fora do quadrado central
    const boxSize = Math.min(canvasWidth, canvasHeight) * 0.6;
    const boxX = (canvasWidth - boxSize) / 2;
    const boxY = (canvasHeight - boxSize) / 2;
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillRect(boxX, boxY, boxSize, boxSize);
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 4;
    ctx.strokeRect(boxX, boxY, boxSize, boxSize);
  };

  // ========== EVENTOS DE PAN (MOUSE E TOQUE) ==========
  const handlePanStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setIsPanning(true);
    setPanStart({ x: clientX - transform.x, y: clientY - transform.y });
  };

  const handlePanMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isPanning) return;
    e.preventDefault();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setTransform({
      x: clientX - panStart.x,
      y: clientY - panStart.y,
      scale: transform.scale,
    });
  };

  const handlePanEnd = () => {
    setIsPanning(false);
  };

  // ========== ZOOM POR PINCH (DOIS DEDOS) ==========
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const distance = Math.hypot(dx, dy);
      setInitialDistance(distance);
      setInitialScale(transform.scale);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialDistance !== null) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const newDistance = Math.hypot(dx, dy);
      let newScale = initialScale * (newDistance / initialDistance);
      newScale = Math.min(Math.max(0.3, newScale), 5);
      setTransform({ ...transform, scale: newScale });
    }
  };

  const handleTouchEnd = () => {
    setInitialDistance(null);
  };

  // Botões de zoom +/-
  const zoomIn = () => {
    setTransform(prev => ({ ...prev, scale: Math.min(prev.scale + 0.2, 5) }));
  };
  const zoomOut = () => {
    setTransform(prev => ({ ...prev, scale: Math.max(prev.scale - 0.2, 0.3) }));
  };
  const resetView = () => {
    setTransform({ x: 0, y: 0, scale: 1 });
  };

  // ========== DETECTAR REGIÃO CENTRAL ==========
  const detectCentralRegion = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setProcessing(true);
    try {
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const boxSize = Math.min(canvasWidth, canvasHeight) * 0.6;
      const boxX = (canvasWidth - boxSize) / 2;
      const boxY = (canvasHeight - boxSize) / 2;

      // Extrai a região do canvas (já com transformações aplicadas)
      const imageData = canvas.getContext('2d')?.getImageData(boxX, boxY, boxSize, boxSize);
      if (!imageData) throw new Error('Não foi possível extrair região');

      const offCanvas = document.createElement('canvas');
      offCanvas.width = boxSize;
      offCanvas.height = boxSize;
      offCanvas.getContext('2d')?.putImageData(imageData, 0, 0);
      const bitmap = await createImageBitmap(offCanvas);
      const decoded = await detectFromImageBitmap(bitmap);
      if (decoded) {
        onDetected(decoded);
        fecharPreview();
      } else {
        alert('Nenhum código detectado na área central. Ajuste a posição/zoom e tente novamente.');
      }
    } catch (err) {
      alert('Erro ao processar a região central.');
    } finally {
      setProcessing(false);
    }
  };

  const fecharPreview = () => {
    setImagePreviewUrl(null);
    setShowCrop(false);
    setTransform({ x: 0, y: 0, scale: 1 });
    if (fileInputRef.current) fileInputRef.current.value = '';
    originalImageRef.current = null;
  };

  // ========== UPLOAD E TENTATIVA AUTOMÁTICA ==========
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProcessing(true);
    const imageUrl = URL.createObjectURL(file);
    setImagePreviewUrl(imageUrl);

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

    // Falha: abre modo manual
    setProcessing(false);
    setShowCrop(true);
    const img = new Image();
    img.onload = () => {
      originalImageRef.current = img;
      setTransform({ x: 0, y: 0, scale: 1 });
      setTimeout(() => updateCanvas(), 10);
    };
    img.src = imageUrl;
  };

  // Redesenha quando transform mudar ou canvas redimensionar
  useEffect(() => {
    if (showCrop && originalImageRef.current) {
      updateCanvas();
    }
  }, [showCrop, transform, originalImageRef.current]);

  // Observa redimensionamento da janela
  useEffect(() => {
    if (!showCrop) return;
    const handleResize = () => updateCanvas();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [showCrop]);

  // ========== RENDER ==========
  return (
    <div className="flex flex-col items-center gap-3">
      {/* Modal de ajuste */}
      {showCrop && imagePreviewUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex flex-col items-center justify-center p-4">
          <h3 className="text-white text-lg mb-2 text-center">
            Arraste e dê zoom para posicionar o código <strong>dentro do quadrado verde</strong>
          </h3>
          <div
            className="relative w-full max-w-lg h-[60vh] bg-black rounded-lg overflow-hidden"
            style={{ touchAction: 'none' }}
          >
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full"
              onMouseDown={handlePanStart}
              onMouseMove={handlePanMove}
              onMouseUp={handlePanEnd}
              onMouseLeave={handlePanEnd}
              onTouchStart={(e) => { handlePanStart(e); handleTouchStart(e); }}
              onTouchMove={(e) => { handlePanMove(e); handleTouchMove(e); }}
              onTouchEnd={(e) => { handlePanEnd(); handleTouchEnd(); }}
              style={{ touchAction: 'none' }}
            />
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={zoomIn} className="px-3 py-1 bg-gray-700 text-white rounded text-lg font-bold">+</button>
            <button onClick={zoomOut} className="px-3 py-1 bg-gray-700 text-white rounded text-lg font-bold">-</button>
            <button onClick={resetView} className="px-3 py-1 bg-gray-600 text-white rounded">Centralizar</button>
            <button onClick={detectCentralRegion} disabled={processing} className="px-4 py-2 bg-green-600 text-white rounded">
              {processing ? 'Detectando...' : 'Detectar'}
            </button>
            <button onClick={fecharPreview} className="px-4 py-2 bg-red-600 text-white rounded">Cancelar</button>
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