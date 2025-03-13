
export interface ProductVariant {
  id: string;
  name: string;
  sku?: string;
  price: number;
  attributes: Record<string, string | number | boolean>;
  imageUrl?: string;
  imageUrls?: string[];
  image_url?: string;
  image_urls?: string[];
}

export interface Product {
  id: string;
  name: string;
  brand?: string;
  category: string;
  price: number;
  description: string;
  // Support both naming conventions for images
  imageUrl?: string;
  imageUrls?: string[];
  image_url?: string;
  image_urls?: string[];
  // SEO optimization fields
  imageAlt?: string;
  imageAlts?: string[];
  image_alt?: string;
  image_alts?: string[];
  sku?: string;
  specifications: Record<string, string | number | boolean>;
  variants?: ProductVariant[];
  parent_id?: string; // For variations, reference to parent product
  is_variation?: boolean; // Flag to indicate if this is a variation
  variation_attributes?: Record<string, string | number | boolean>; // Attributes specific to this variation
  is_parent?: boolean; // Flag to indicate if this has variations
  variants_ids?: string[]; // IDs of variations for parent products
  active?: boolean;
  createdAt: Date;
  updatedAt: Date;
  monthly_price?: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}
