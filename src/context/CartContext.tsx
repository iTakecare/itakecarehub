
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '@/types/catalog';
import { toast } from 'sonner';

type CartItem = {
  product: Product;
  quantity: number;
  duration: number;
  selectedOptions?: Record<string, string>;
};

interface CartContextType {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Load cart from localStorage on component mount
  useEffect(() => {
    const savedCart = localStorage.getItem('itakecare-cart');
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Failed to parse cart from localStorage:', error);
      }
    }
  }, []);
  
  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('itakecare-cart', JSON.stringify(items));
  }, [items]);
  
  const addToCart = (newItem: CartItem) => {
    console.log("CartContext: Adding item to cart:", newItem);
    
    // Ensure the product has a price
    if (typeof newItem.product.monthly_price !== 'number' || newItem.product.monthly_price === 0) {
      console.warn("Warning: Adding product with no price to cart", newItem.product);
    }
    
    setItems(prevItems => {
      // Check if this product is already in the cart
      const existingItemIndex = prevItems.findIndex(
        item => item.product.id === newItem.product.id
      );
      
      if (existingItemIndex >= 0) {
        // Update quantity if item exists
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + newItem.quantity
        };
        
        toast.success('Quantité mise à jour dans le panier');
        return updatedItems;
      } else {
        // Add new item
        toast.success('Produit ajouté au panier');
        return [...prevItems, newItem];
      }
    });
    
    // We don't open the cart drawer automatically anymore
  };
  
  const removeFromCart = (productId: string) => {
    setItems(prevItems => prevItems.filter(item => item.product.id !== productId));
    toast.info('Produit retiré du panier');
  };
  
  const updateQuantity = (productId: string, quantity: number) => {
    setItems(prevItems => 
      prevItems.map(item => 
        item.product.id === productId 
          ? { ...item, quantity: Math.max(1, quantity) } 
          : item
      )
    );
  };
  
  const clearCart = () => {
    setItems([]);
    toast.info('Panier vidé');
  };
  
  const cartCount = items.reduce((total, item) => total + item.quantity, 0);
  
  // Fix the cartTotal calculation to ensure we're getting the proper monthly price
  const cartTotal = items.reduce((total, item) => {
    // Ensure we're getting a valid number for the monthly_price
    const itemPrice = typeof item.product.monthly_price === 'number' ? item.product.monthly_price : 0;
    const itemTotal = itemPrice * item.quantity;
    console.log(`Cart total calculation - Item: ${item.product.name}, Price: ${itemPrice}, Quantity: ${item.quantity}, Subtotal: ${itemTotal}`);
    return total + itemTotal;
  }, 0);
  
  const value = {
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartCount,
    cartTotal,
    isCartOpen,
    setIsCartOpen
  };
  
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
