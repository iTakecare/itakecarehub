
import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp, Info } from "lucide-react";

interface ProductDescriptionProps {
  title: string;
  description: string;
}

const ProductDescription: React.FC<ProductDescriptionProps> = ({ title, description }) => {
  const [expanded, setExpanded] = useState(false);
  const [showExpandButton, setShowExpandButton] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (contentRef.current) {
      // Check if the content is long enough to need expansion
      const isContentLong = contentRef.current.scrollHeight > 150;
      setShowExpandButton(isContentLong);
      
      // If it's short, just expand it by default
      if (!isContentLong) {
        setExpanded(true);
      }
    }
  }, [description]);
  
  const toggleExpanded = () => {
    setExpanded(!expanded);
  };
  
  return (
    <div className="mt-6 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-indigo-900 flex items-center">
          <Info className="h-5 w-5 mr-2 text-indigo-600" />
          {title}
        </h2>
      </div>
      
      <div className="relative overflow-hidden">
        <div 
          ref={contentRef}
          className={`text-gray-700 p-6 transition-all duration-300 ${!expanded && showExpandButton ? 'max-h-[150px]' : ''}`}
        >
          {description ? (
            <div className="prose max-w-none">{description}</div>
          ) : (
            <p className="text-gray-500 italic">Aucune description disponible pour ce produit.</p>
          )}
        </div>
        
        {showExpandButton && !expanded && (
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
        )}
      </div>
      
      {showExpandButton && (
        <button 
          onClick={toggleExpanded}
          className="w-full flex items-center justify-center p-3 text-indigo-600 hover:text-indigo-800 transition-colors border-t border-gray-200 bg-gray-50"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-4 w-4 mr-2" />
              <span>Réduire</span>
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-2" />
              <span>Voir plus</span>
            </>
          )}
        </button>
      )}
    </div>
  );
};

export default ProductDescription;
