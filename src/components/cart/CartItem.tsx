
import React from "react";
import { useCart } from "@/context/CartContext";
import { formatCurrency } from "@/utils/formatters";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Minus } from "lucide-react";
import { Link } from "react-router-dom";
import { Product } from "@/types/catalog";

interface CartItemProps {
  item: {
    product: Product;
    quantity: number;
    duration: number;
    selectedOptions?: Record<string, string>;
  };
}

const CartItem: React.FC<CartItemProps> = ({ item }) => {
  const { removeFromCart, updateQuantity } = useCart();
  const { product, quantity } = item;
  
  // Ensure we have a valid price (always a number)
  let price: number;
  
  if (typeof product.monthly_price === 'number' && !isNaN(product.monthly_price) && product.monthly_price > 0) {
    price = product.monthly_price;
  } else if (typeof product.monthly_price === 'string') {
    price = parseFloat(product.monthly_price);
    if (isNaN(price) || price <= 0) {
      // Try to get price from currentPrice if available
      if (product.currentPrice && !isNaN(product.currentPrice) && product.currentPrice > 0) {
        price = product.currentPrice;
      } else if (typeof product.price === 'number' && product.price > 0) {
        price = product.price;
      } else {
        price = 0;
      }
    }
  } else if (product.currentPrice && !isNaN(product.currentPrice) && product.currentPrice > 0) {
    price = product.currentPrice;
  } else if (typeof product.price === 'number' && product.price > 0) {
    price = product.price;
  } else {
    price = 0;
  }
  
  // If we still don't have a valid price, set a default for debugging
  if (isNaN(price) || price <= 0) {
    console.warn(`CartItem: Could not find valid price for ${product.name}`, product);
    // Set a default price for testing
    price = 39.99;
  }
  
  console.log(`CartItem: product ${product.name} raw price:`, product.monthly_price, typeof product.monthly_price);
  console.log(`CartItem rendering for ${product.name} with price ${price}, quantity ${quantity}, total ${price * quantity}`);
  
  // Calculate the item total price
  const itemTotal = price * quantity;
  
  // Get a display-friendly list of selected options
  const getSelectedOptionsDisplay = () => {
    if (!item.selectedOptions || Object.keys(item.selectedOptions).length === 0) {
      return null;
    }
    
    return (
      <div className="text-xs text-gray-500 mt-1">
        {Object.entries(item.selectedOptions).map(([key, value]) => (
          <div key={key}>
            <span className="font-medium">{key}:</span> {value}
          </div>
        ))}
      </div>
    );
  };
  
  return (
    <div className="flex gap-3 py-3 border-b border-gray-100 last:border-0">
      <div className="h-20 w-20 bg-gray-50 rounded flex-shrink-0">
        <img 
          src={product.image_url || "/placeholder.svg"} 
          alt={product.name}
          className="h-full w-full object-contain"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/placeholder.svg";
          }}
        />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex justify-between gap-2">
          <Link 
            to={`/produits/${product.id}`} 
            className="text-sm font-medium line-clamp-2 hover:text-[#347599]"
          >
            {product.name}
          </Link>
          
          <div className="text-sm font-bold whitespace-nowrap">
            {formatCurrency(itemTotal)} HT/mois
          </div>
        </div>
        
        <div className="text-xs text-gray-500 mt-1">
          Durée: {item.duration} mois
        </div>
        
        {getSelectedOptionsDisplay()}
        
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 rounded-r-none"
              onClick={() => updateQuantity(product.id, quantity - 1)}
              disabled={quantity <= 1}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <div className="h-7 px-3 flex items-center justify-center border-y">
              {quantity}
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 rounded-l-none"
              onClick={() => updateQuantity(product.id, quantity + 1)}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-gray-500 hover:text-red-600"
            onClick={() => removeFromCart(product.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CartItem;
