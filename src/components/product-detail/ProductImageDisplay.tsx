
import React, { useState, useEffect, useMemo } from "react";
import ProductImageNavigationThumbnails from "./ProductImageNavigationThumbnails";
import ProductMainImage from "./ProductMainImage";
import ImageGalleryNavigation from "./ImageGalleryNavigation";
import ProductPlaceholder from "./ProductPlaceholder";
import { filterValidImages, addTimestamp } from "./utils/imageUtils";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";

interface ProductImageDisplayProps {
  imageUrl: string;
  altText: string;
  imageUrls?: string[];
}

const ProductImageDisplay: React.FC<ProductImageDisplayProps> = ({ 
  imageUrl, 
  altText,
  imageUrls = []
}) => {
  // Filter and deduplicate all valid images
  const allImages = useMemo(() => {
    console.log("ProductImageDisplay - Processing images", { imageUrl, imageUrls });
    
    // Combine main image and image URLs to create a unified list
    const combinedImages = [imageUrl, ...(imageUrls || [])];
    
    // Filter out invalid and duplicate images
    const validImages = combinedImages.filter(url => 
      url && typeof url === 'string' && url.trim() !== '' && url !== '/placeholder.svg'
    );
    
    // Remove duplicates using simple URL normalization (no query params)
    const uniqueImages = Array.from(new Set(
      validImages.map(url => url.replace(/([^:])\/\/+/g, '$1/').split('?')[0])
    )).map(normalizedUrl => {
      // Find the first original URL that matches this normalized URL
      return validImages.find(url => 
        url.replace(/([^:])\/\/+/g, '$1/').split('?')[0] === normalizedUrl
      ) || '';
    });
    
    console.log("ProductImageDisplay - Valid images:", uniqueImages);
    return uniqueImages;
  }, [imageUrl, imageUrls]);
  
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Set the first image as the selected image on component mount or when images change
  useEffect(() => {
    if (allImages.length > 0) {
      setSelectedImage(allImages[0]);
      setCurrentIndex(0);
    } else {
      setSelectedImage('');
    }
  }, [allImages]);
  
  const handleThumbnailClick = (url: string, index: number) => {
    setSelectedImage(url);
    setCurrentIndex(index);
  };

  const navigateImage = (direction: 'prev' | 'next') => {
    if (allImages.length <= 1) return;
    
    let newIndex = currentIndex;
    
    if (direction === 'prev') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : allImages.length - 1;
    } else {
      newIndex = currentIndex < allImages.length - 1 ? currentIndex + 1 : 0;
    }
    
    setCurrentIndex(newIndex);
    setSelectedImage(allImages[newIndex]);
  };

  // If no valid images, show a placeholder
  if (allImages.length === 0) {
    return <ProductPlaceholder altText={altText} />;
  }

  return (
    <div className="flex flex-col-reverse md:flex-row md:gap-4">
      {/* Side thumbnails */}
      <ProductImageNavigationThumbnails
        images={allImages}
        currentIndex={currentIndex}
        onThumbnailClick={handleThumbnailClick}
        addTimestamp={addTimestamp}
      />
      
      {/* Main image container */}
      <div className="flex-1 relative">
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden transition-all hover:shadow-md relative group">
          <ProductMainImage
            imageUrl={selectedImage}
            altText={altText}
            addTimestamp={addTimestamp}
          />
          
          {/* Navigation arrows and counter */}
          <ImageGalleryNavigation
            imagesCount={allImages.length}
            currentIndex={currentIndex}
            onNavigate={navigateImage}
          />
        </div>
      </div>
    </div>
  );
};

export default ProductImageDisplay;
