
import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Product } from "@/types/catalog";
import { formatPrice } from "@/utils/formatters";
import { Laptop, PcCase, Smartphone, Monitor, Package } from "lucide-react";

type ProductCardProps = {
  product: Product;
  onClick?: (product: Product) => void;
};

// Helper function to get the appropriate icon based on category
function getCategoryIcon(category: string) {
  switch (category.toLowerCase()) {
    case 'laptop':
      return <Laptop className="h-4 w-4" />;
    case 'desktop':
      return <PcCase className="h-4 w-4" />;
    case 'smartphone':
      return <Smartphone className="h-4 w-4" />;
    case 'display':
      return <Monitor className="h-4 w-4" />;
    default:
      return <Package className="h-4 w-4" />;
  }
}

export default function ProductCard({ product, onClick }: ProductCardProps) {
  // Function to handle fallback if the image fails to load
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = '/placeholder.svg';
  };

  // Get image source, supporting both naming conventions
  const imageSource = product.imageUrl || product.image_url || '/placeholder.svg';

  // Get the alt text, supporting both naming conventions
  const imageAlt = product.imageAlt || product.image_alt || `${product.name} image`;

  return (
    <Card className="h-full flex flex-col overflow-hidden hover:shadow-md transition-shadow duration-300 border-transparent hover:border-primary/20">
      <div className="aspect-square overflow-hidden relative">
        <img 
          src={imageSource}
          alt={imageAlt}
          onError={handleImageError}
          className="object-cover w-full h-full transition-transform duration-300 hover:scale-105"
        />
        <Badge className="absolute top-2 right-2 bg-primary/80 hover:bg-primary/90">
          {product.category}
        </Badge>
      </div>
      <CardHeader className="p-4 pb-2">
        <CardDescription className="text-xs font-medium text-primary/70">
          {product.brand}
        </CardDescription>
        <CardTitle className="text-base font-semibold truncate leading-tight">
          {product.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 flex-grow">
        <p className="text-sm text-muted-foreground line-clamp-2 h-10">
          {product.description || "Aucune description disponible"}
        </p>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between items-center">
        <div className="font-bold text-lg">
          {formatPrice(product.price)}
        </div>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={() => onClick && onClick(product)}
          className="flex items-center gap-1"
        >
          {getCategoryIcon(product.category)}
          <span>Détails</span>
        </Button>
      </CardFooter>
    </Card>
  );
}
