
import React, { useState, useEffect } from "react";
import { ZoomIn } from "lucide-react";

interface ProductMainImageProps {
  imageUrl: string;
  altText: string;
  addTimestamp: (url: string) => string;
}

const ProductMainImage: React.FC<ProductMainImageProps> = ({
  imageUrl,
  altText,
  addTimestamp
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [finalImageUrl, setFinalImageUrl] = useState("/placeholder.svg");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!imageUrl || imageUrl === "/placeholder.svg") {
      setFinalImageUrl("/placeholder.svg");
      setIsLoading(false);
      setHasError(true);
      return;
    }
    
    // Réinitialiser l'état lors du changement d'URL
    setIsLoading(true);
    setHasError(false);
    
    // Apply timestamp for cache busting
    const timestampedUrl = addTimestamp(imageUrl);
    setFinalImageUrl(timestampedUrl);
    
    // Ne pas précharger l'image pour éviter les erreurs CORS
    // Laisser l'élément img gérer le chargement directement
  }, [imageUrl, addTimestamp]);

  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };
  
  const handleImageError = () => {
    // Si erreur après trop de tentatives, montrer le placeholder
    if (retryCount >= 2) {
      setIsLoading(false);
      setHasError(true);
      setFinalImageUrl("/placeholder.svg");
    } else {
      // Sinon, réessayer avec un nouveau timestamp
      setRetryCount(prev => prev + 1);
      setFinalImageUrl(`${addTimestamp(imageUrl)}&retry=${retryCount + 1}`);
    }
  };

  return (
    <div className="relative w-full aspect-square sm:aspect-[4/3] md:aspect-[3/2] flex items-center justify-center p-4">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
        </div>
      )}
      
      <img 
        src={finalImageUrl} 
        alt={altText}
        className={`max-w-full max-h-full object-contain transition-all duration-300 
          ${isLoading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
        onLoad={handleImageLoad}
        onError={handleImageError}
        loading="lazy"
      />
      
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <img 
            src="/placeholder.svg" 
            alt={altText} 
            className="max-w-[50%] max-h-[50%] opacity-40"
          />
          <div className="mt-4 bg-red-50 text-red-500 text-sm px-4 py-2 rounded">
            Image non disponible
          </div>
        </div>
      )}
      
      {/* Overlay zoom icon */}
      {!hasError && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-black bg-opacity-40 rounded-full p-2">
            <ZoomIn className="h-6 w-6 text-white" />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductMainImage;
