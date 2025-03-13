
export interface WooCommerceProduct {
  id: number;
  name: string;
  description: string;
  short_description?: string;
  price: string;
  regular_price: string;
  sale_price: string;
  images: {
    id: number;
    src: string;
    alt: string;
  }[];
  categories: {
    id: number;
    name: string;
    slug: string;
  }[];
  attributes: {
    id: number;
    name: string;
    options: string[];
    option?: string;
  }[];
  status: string;
  variations?: number[];
  stock_status?: string;
  sku?: string;
  parent_id?: number;
  image?: {
    id: number;
    src: string;
    alt: string;
  };
  // Fields for variations
  variation_id?: number;
  is_variation?: boolean;
  variation_attributes?: Record<string, string>;
  // Added fields for credentials passing
  siteUrl?: string;
  consumerKey?: string;
  consumerSecret?: string;
}

export interface ImportResult {
  success: boolean;
  totalImported: number;
  skipped: number;
  variations_count?: number;
  errors?: string[];
}
