
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/utils/formatters";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    monthly_price: number;
    image_url?: string;
  };
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  return (
    <Card className="h-full overflow-hidden hover:shadow-md transition-shadow cursor-pointer bg-white">
      <CardContent className="p-0">
        <div className="flex">
          <div className="w-1/3 bg-gray-100 h-full flex items-center justify-center">
            <img 
              src={product.image_url || "/placeholder.svg"} 
              alt={product.name}
              className="object-contain h-24 w-24"
            />
          </div>
          <div className="w-2/3 p-4">
            <h3 className="font-medium text-sm mb-1 line-clamp-2">{product.name}</h3>
            <p className="text-sm text-muted-foreground">Prix: {formatCurrency(product.monthly_price)}</p>
            <div className="mt-2 flex items-center">
              <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                Disponible
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
