
import React from "react";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { Product } from "@/types/catalog";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface AddToCartButtonProps {
  product: Product;
  quantity: number;
  duration: number;
  currentPrice?: number;  // Added explicit currentPrice prop
  selectedOptions?: Record<string, string>;
  navigateToCart?: boolean;
}

const AddToCartButton: React.FC<AddToCartButtonProps> = ({
  product,
  quantity,
  duration,
  currentPrice,
  selectedOptions = {},
  navigateToCart = true // Default to true to always navigate to cart page
}) => {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent the default behavior
    e.stopPropagation(); // Stop event propagation
    
    // Make a deep copy of the product to avoid any reference issues
    const productClone = JSON.parse(JSON.stringify(product));
    
    // Add the current price from the product details page if available
    if (currentPrice && !isNaN(currentPrice) && currentPrice > 0) {
      productClone.currentPrice = currentPrice;
      
      // Also set monthly_price directly if it's not already set
      if (!productClone.monthly_price || productClone.monthly_price <= 0) {
        productClone.monthly_price = currentPrice;
      }
    }
    
    // Log the product and its price for debugging
    console.log("AddToCartButton: Adding product to cart:", { 
      product: productClone.name,
      originalPrice: productClone.monthly_price,
      currentPrice: currentPrice,
      priceType: typeof productClone.monthly_price,
      quantity, 
      duration, 
      selectedOptions
    });
    
    addToCart({
      product: productClone,
      quantity,
      duration,
      selectedOptions
    });
    
    toast.success(`${product.name} ajouté au panier`);
    
    // Always navigate to the cart page if navigateToCart is true
    if (navigateToCart) {
      navigate('/panier');
    }
  };
  
  return (
    <Button 
      onClick={handleAddToCart}
      className="px-8 bg-[#2d618f] hover:bg-[#347599] w-full sm:w-auto"
      type="button"
    >
      <ShoppingCart className="mr-2 h-4 w-4" />
      Ajouter au panier
    </Button>
  );
};

export default AddToCartButton;
