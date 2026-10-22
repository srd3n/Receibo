import { useState, useRef, useEffect, useCallback } from 'react';
import jsQR from 'jsqr';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScannedUrl: (url: string) => void;
}

export default function QRScannerModal({
  isOpen,
  onClose,
  onScannedUrl,
}: QRScannerModalProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stop camera stream cleanly
  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Frame processing loop
  const tick = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code && code.data) {
        // Successful QR scan detected!
        setScannedResult(code.data);
        stopCamera();

        // Optional vibration feedback if mobile browser supports it
        if ('vibrate' in navigator) {
          try {
            navigator.vibrate([100, 50, 100]);
          } catch {
            // Ignore
          }
        }

        setTimeout(() => {
          onScannedUrl(code.data);
        }, 600);
        return;
      }
    }

    animationFrameRef.current = requestAnimationFrame(tick);
  }, [onScannedUrl, stopCamera]);

  // Start camera
  const startCamera = useCallback(async () => {
    stopCamera();
    setErrorMessage(null);
    setScannedResult(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      setHasPermission(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true'); // required for iOS safari
        videoRef.current.play().then(() => {
          animationFrameRef.current = requestAnimationFrame(tick);
        }).catch((err) => {
          console.error('Video play error:', err);
        });
      }
    } catch (err: unknown) {
      console.warn('Could not start camera:', err);
      setHasPermission(false);
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('NotAllowedError') || msg.includes('Permission denied')) {
        setErrorMessage('Camera access was denied. Please allow camera permissions or upload a QR image below.');
      } else {
        setErrorMessage('No camera was detected. You can upload a photo of the QR code instead.');
      }
    }
  }, [facingMode, stopCamera, tick]);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  // Handle uploaded QR image file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code && code.data) {
          setScannedResult(code.data);
          stopCamera();
          setTimeout(() => {
            onScannedUrl(code.data);
          }, 400);
        } else {
          alert('Could not find a valid QR code in that image. Please try another photo.');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="scanner-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
    >
      <div className="relative w-full max-w-md bg-[#FCFAF7] border border-stone-300 rounded-lg shadow-2xl overflow-hidden my-4 flex flex-col font-mono text-stone-800">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-stone-300 bg-stone-100">
          <div className="flex items-center gap-2">
            <span className="text-lg">📷</span>
            <div>
              <h2 id="scanner-modal-title" className="font-sans font-bold text-base text-stone-900 tracking-tight">
                Scan QR Code
              </h2>
              <p className="text-[11px] text-stone-500">
                Point camera at Master Roll QR to auto-download
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="text-stone-400 hover:text-stone-700 min-h-[44px] min-w-[44px] flex items-center justify-center text-sm p-1"
            aria-label="Close scanner"
          >
            ✕
          </button>
        </div>

        {/* Viewfinder Area */}
        <div className="relative bg-black w-full aspect-square sm:aspect-4/3 flex items-center justify-center overflow-hidden">
          {/* Video element */}
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
          />

          {/* Offscreen hidden canvas for jsQR analysis */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Scanning Reticle Overlay */}
          {hasPermission && !scannedResult && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
              <div className="relative w-56 h-56 sm:w-64 sm:h-64 border-2 border-stone-100/70 rounded-lg shadow-2xl">
                {/* Corner markers */}
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-emerald-400 -mt-1 -ml-1 rounded-tl" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-emerald-400 -mt-1 -mr-1 rounded-tr" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-emerald-400 -mb-1 -ml-1 rounded-bl" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-emerald-400 -mb-1 -mr-1 rounded-br" />

                {/* Laser scan line animation */}
                <div className="w-full h-0.5 bg-emerald-400/80 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-bounce mt-24" />
              </div>
              <p className="text-[11px] text-stone-200 mt-4 bg-black/60 px-3 py-1 rounded backdrop-blur-xs">
                Align QR Code inside box
              </p>
            </div>
          )}

          {/* Scanned Success Notification */}
          {scannedResult && (
            <div className="absolute inset-0 bg-emerald-950/90 backdrop-blur-xs flex flex-col items-center justify-center text-center p-6 text-white animate-fade-in">
              <span className="text-4xl mb-2">✅</span>
              <div className="text-base font-bold font-sans">QR Code Detected!</div>
              <p className="text-xs text-emerald-200 mt-1 max-w-xs break-all">
                Initializing auto-download...
              </p>
            </div>
          )}

          {/* Camera Permission Denied or Error */}
          {errorMessage && (
            <div className="absolute inset-0 bg-stone-900/90 p-6 flex flex-col items-center justify-center text-center text-white">
              <span className="text-3xl mb-2">📷⚠️</span>
              <div className="text-sm font-semibold mb-1">Camera Notice</div>
              <p className="text-xs text-stone-300 mb-4 max-w-xs">
                {errorMessage}
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-stone-100 text-stone-900 font-semibold text-xs rounded hover:bg-white"
              >
                Upload Photo of QR Code
              </button>
            </div>
          )}
        </div>

        {/* Scanner Toolbar & Fallbacks */}
        <div className="p-4 bg-stone-100 border-t border-stone-200 space-y-3">
          <div className="flex items-center justify-between gap-2">
            {/* Flip camera */}
            <button
              type="button"
              onClick={() => {
                setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
              }}
              className="px-3 py-2 text-xs bg-white border border-stone-300 rounded text-stone-800 hover:bg-stone-50 flex items-center gap-1.5 min-h-[40px]"
            >
              <span>🔄</span>
              <span>Switch Camera</span>
            </button>

            {/* Photo upload fallback */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2 text-xs bg-white border border-stone-300 rounded text-stone-800 hover:bg-stone-50 flex items-center gap-1.5 min-h-[40px]"
            >
              <span>🖼️</span>
              <span>Upload QR Photo</span>
            </button>
          </div>

          <div className="text-[11px] text-stone-500 text-center leading-normal">
            Works with any TallyReceipt QR code. You can also use your native phone camera directly.
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-stone-50 border-t border-stone-200 flex justify-end">
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="px-4 py-2 min-h-[40px] text-xs font-semibold text-stone-700 hover:text-stone-900 rounded"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
