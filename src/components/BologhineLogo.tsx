import React, { useState, useEffect, useRef } from 'react';
import { Camera, Check, RefreshCw } from 'lucide-react';

interface BologhineLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  withBorder?: boolean;
  interactive?: boolean; // When true, allows clicking to upload/replace with original photo
}

export const BologhineLogo: React.FC<BologhineLogoProps> = ({
  className = '',
  size = 'md',
  withBorder = false,
  interactive = false,
}) => {
  const [logoSrc, setLogoSrc] = useState<string>('/assets/fln-bologhine-logo.svg');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeMap = {
    xs: 'w-8 h-8',
    sm: 'w-10 h-10',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  const chosenSize = sizeMap[size] || sizeMap.md;

  const loadPreferredLogo = () => {
    // 1. Check local storage for user's explicit photo
    const customPhoto = localStorage.getItem('kasma_fln_logo_custom');
    if (customPhoto) {
      setLogoSrc(customPhoto);
      return;
    }

    // 2. Check if server has custom PNG
    const img = new Image();
    img.onload = () => {
      setLogoSrc('/assets/fln-bologhine-logo.png');
    };
    img.onerror = () => {
      // Fallback to high-res SVG
      setLogoSrc('/assets/fln-bologhine-logo.svg');
    };
    img.src = '/assets/fln-bologhine-logo.png';
  };

  useEffect(() => {
    loadPreferredLogo();

    const handleUpdate = () => {
      loadPreferredLogo();
    };

    window.addEventListener('kasma-logo-updated', handleUpdate);
    return () => {
      window.removeEventListener('kasma-logo-updated', handleUpdate);
    };
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      // Save locally for instant reactivity
      localStorage.setItem('kasma_fln_logo_custom', dataUrl);
      setLogoSrc(dataUrl);

      // Notify all logo components across the app
      window.dispatchEvent(new Event('kasma-logo-updated'));

      // Save to server so it becomes the permanent server asset
      try {
        await fetch('/api/save-logo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: dataUrl }),
        });
      } catch (err) {
        console.warn("Échec sauvegarde logo sur serveur:", err);
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div
      className={`group relative inline-flex items-center justify-center rounded-full overflow-hidden shrink-0 bg-white ${
        withBorder ? 'border-2 border-red-700/80 shadow-sm' : ''
      } ${chosenSize} ${className} ${interactive ? 'cursor-pointer' : ''}`}
      title={
        interactive
          ? 'Cliquez pour importer la photo officielle de la Kasma (image.png)'
          : 'شعار قسمة بولوغين - جبهة التحرير الوطني'
      }
      onClick={() => {
        if (interactive && fileInputRef.current) {
          fileInputRef.current.click();
        }
      }}
    >
      <img
        src={logoSrc}
        alt="شعار قسمة بولوغين - جبهة التحرير الوطني"
        className="w-full h-full object-contain select-none"
        referrerPolicy="no-referrer"
        onError={() => {
          // If custom fails, fallback gracefully to SVG
          if (logoSrc !== '/assets/fln-bologhine-logo.svg') {
            setLogoSrc('/assets/fln-bologhine-logo.svg');
          }
        }}
      />

      {interactive && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          {/* Subtle Hover Overlay */}
          <div className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {isUploading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Camera className="w-4 h-4 drop-shadow" />
            )}
          </div>
        </>
      )}
    </div>
  );
};
