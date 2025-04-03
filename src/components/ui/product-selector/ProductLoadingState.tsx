
import React from "react";
import { Loader2 } from "lucide-react";

const ProductLoadingState: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-40">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <span className="ml-2">Chargement des produits...</span>
    </div>
  );
};

export default ProductLoadingState;
