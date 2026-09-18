import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Camera, 
  X, 
  RotateCcw, 
  Check, 
  SwitchCamera, 
  AlertTriangle, 
  Upload, 
  Zap,
  Sparkles,
  Maximize2
} from 'lucide-react';
import { Language } from '../types';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (dataUrl: string, fileName: string) => void;
  titleFr: string;
  titleAr: string;
  documentKey?: string;
  defaultFacingMode?: 'environment' | 'user';
  isPortrait?: boolean;
  language: Language;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  titleFr,
  titleAr,
  documentKey = 'document',
  defaultFacingMode = 'environment',
  isPortrait = false,
  language,
}) => {
  const isAr = language === 'ar';
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileFallbackInputRef = useRef<HTMLInputElement | null>(null);

  const [facingMode, setFacingMode] = useState<'environment' | 'user'>(defaultFacingMode);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  // Stop current video stream
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Initialize camera stream
  const startCamera = useCallback(async (mode: 'environment' | 'user') => {
    setIsInitializing(true);
    setCameraError(null);
    stopStream();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(isAr 
          ? 'المتصفح لا يدعم الوصول المباشر للكاميرا. يرجى استخدام زر اختيار الصورة' 
          : "L'accès direct à la caméra n'est pas supporté par ce navigateur.");
      }

      // Check available devices
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(d => d.kind === 'videoinput');
        setHasMultipleCameras(videoDevices.length > 1);
      } catch {
        // Non-blocking device check
      }

      const constraints: MediaStreamConstraints = {
        audio: false,
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setIsInitializing(false);
    } catch (err: any) {
      console.warn("Camera access error:", err);
      stopStream();
      setIsInitializing(false);
      setCameraError(
        isAr
          ? 'تعذر تشغيل الكاميرا مباشرة (ربما بسبب صلاحيات المتصفح). يمكنك التقاط الصورة عبر تطبيق الكاميرا بهاتفك بالضغط على الزر أدناه.'
          : "Impossible d'accéder à la webcam directement. Vous pouvez utiliser le sélecteur natif de l'appareil ci-dessous."
      );
    }
  }, [isAr, stopStream]);

  useEffect(() => {
    if (isOpen) {
      setCapturedImage(null);
      startCamera(facingMode);
    } else {
      stopStream();
    }
    return () => {
      stopStream();
    };
  }, [isOpen, facingMode, startCamera, stopStream]);

  // Flip between rear and front cameras
  const handleToggleCamera = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
  };

  // Take photo snapshot
  const handleTakeSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvasRef.current = canvas;

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // If front camera, mirror image for natural selfie feel
    if (facingMode === 'user') {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, width, height);

    // Compress as JPEG to keep memory lightweight and performant
    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
    setCapturedImage(dataUrl);
    stopStream();
  };

  // Retake photo
  const handleRetake = () => {
    setCapturedImage(null);
    startCamera(facingMode);
  };

  // Confirm and return photo
  const handleConfirm = () => {
    if (!capturedImage) return;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const fileName = `${documentKey}_photo_${timestamp}.jpg`;
    onCapture(capturedImage, fileName);
    onClose();
  };

  // Fallback native file capture (for phones/tablets or blocked permissions)
  const handleNativeFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setCapturedImage(result);
      stopStream();
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700 w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {isAr ? `التقاط صورة: ${titleAr}` : `Prendre une photo : ${titleFr}`}
              </h3>
              <p className="text-[11px] text-slate-400">
                {isAr ? 'وجّه الكاميرا نحو الوثيقة وتأكد من وضوح الإضاءة والكتابة' : 'Cadrez la pièce administrative dans le repère'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder / Captured Photo Area */}
        <div className="relative flex-1 bg-black min-h-[320px] max-h-[58vh] flex items-center justify-center overflow-hidden">
          {capturedImage ? (
            /* Preview of Captured Photo */
            <div className="relative w-full h-full flex items-center justify-center p-2">
              <img 
                src={capturedImage} 
                alt="Capture preview" 
                className="max-h-[54vh] max-w-full rounded-lg object-contain shadow-lg border border-slate-700" 
              />
              <div className="absolute top-4 left-4 bg-emerald-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-xs flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>{isAr ? 'تم التقاط الصورة' : 'Photo capturée'}</span>
              </div>
            </div>
          ) : cameraError ? (
            /* Error / Fallback UI */
            <div className="p-6 text-center max-w-md space-y-3">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {cameraError}
              </p>
              <button
                type="button"
                onClick={() => fileFallbackInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>{isAr ? 'فتح كاميرا الهاتف لالتقاط الصورة' : "Ouvrir l'appareil photo du téléphone"}</span>
              </button>
            </div>
          ) : (
            /* Active Video Stream */
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${facingMode === 'user' ? '-scale-x-100' : ''}`}
              />

              {/* Viewfinder Guide Overlay for Documents */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
                <div className="w-full max-w-sm aspect-[4/3] border-2 border-dashed border-emerald-400/80 rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.45)] relative">
                  {/* Corner accents */}
                  <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-emerald-400 rounded-tl" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-emerald-400 rounded-tr" />
                  <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-emerald-400 rounded-bl" />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-emerald-400 rounded-br" />

                  <span className="absolute bottom-2 inset-x-0 text-center text-[10px] text-white font-medium bg-black/60 mx-auto px-2 py-0.5 rounded-full w-max backdrop-blur-2xs">
                    {isAr ? 'ضع الوثيقة بالكامل داخل الإطار' : 'Cadrez la pièce administrative'}
                  </span>
                </div>
              </div>

              {/* Loading spinner */}
              {isInitializing && (
                <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center text-white gap-2 z-10">
                  <div className="w-8 h-8 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-slate-300">
                    {isAr ? 'جاري تشغيل الكاميرا...' : 'Activation de la caméra...'}
                  </span>
                </div>
              )}
            </>
          )}

          {/* Hidden Canvas and Fallback Input */}
          <canvas ref={canvasRef} className="hidden" />
          <input
            ref={fileFallbackInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleNativeFilePick}
          />
        </div>

        {/* Footer Controls */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-2 shrink-0">
          {capturedImage ? (
            /* Actions after capture */
            <>
              <button
                type="button"
                onClick={handleRetake}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{isAr ? 'إعادة الالتقاط' : 'Reprendre'}</span>
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                <Check className="w-4 h-4" />
                <span>{isAr ? 'تأكيد وإرفاق الوثيقة' : 'Valider & Joindre'}</span>
              </button>
            </>
          ) : (
            /* Live Stream Controls */
            <>
              {/* Switch camera / Fallback to file picker */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => fileFallbackInputRef.current?.click()}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  title={isAr ? 'اختيار صورة من الهاتف أو الجهاز' : "Importer depuis l'appareil"}
                >
                  <Upload className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleToggleCamera}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  title={isAr ? 'تبديل الكاميرا (أمامية / خلفية)' : 'Changer de caméra'}
                >
                  <SwitchCamera className="w-4 h-4" />
                </button>
              </div>

              {/* Shutter Button */}
              <div className="flex-1 flex justify-center">
                <button
                  type="button"
                  disabled={isInitializing || !!cameraError}
                  onClick={handleTakeSnapshot}
                  className="w-14 h-14 rounded-full border-4 border-white/80 bg-emerald-600 hover:bg-emerald-500 active:scale-95 transition-all flex items-center justify-center shadow-lg disabled:opacity-40 cursor-pointer"
                  title={isAr ? 'التقاط الصورة الآن' : 'Prendre la photo'}
                >
                  <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center">
                    <Camera className="w-5 h-5 text-emerald-800" />
                  </div>
                </button>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white transition-colors"
              >
                {isAr ? 'إلغاء' : 'Annuler'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
