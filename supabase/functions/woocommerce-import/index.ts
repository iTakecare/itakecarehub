
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function callWooCommerceAPI(url: string, endpoint: string, consumerKey: string, consumerSecret: string, queryParams: Record<string, string> = {}) {
  // Format the base URL
  const baseUrl = url.endsWith('/') ? url.slice(0, -1) : url;
  const apiUrl = `${baseUrl}/wp-json/wc/v3/${endpoint}`;
  
  // Add authorization
  const headers = new Headers();
  const credentials = btoa(`${consumerKey}:${consumerSecret}`);
  headers.append("Authorization", `Basic ${credentials}`);
  
  // Add query parameters
  const params = new URLSearchParams(queryParams);
  const requestUrl = `${apiUrl}?${params.toString()}`;
  
  console.log(`Calling WooCommerce API: ${requestUrl}`);
  
  // Make the request
  try {
    const response = await fetch(requestUrl, {
      method: "GET",
      headers,
    });
    
    if (!response.ok) {
      console.error(`Error from WooCommerce API: ${response.status} ${response.statusText}`);
      const responseText = await response.text();
      console.error("Response body:", responseText);
      return { error: `API error: ${response.status} ${response.statusText}` };
    }
    
    const data = await response.json();
    return { data };
  } catch (error) {
    console.error("Error calling WooCommerce API:", error);
    return { error: error.message || "Unknown error" };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Parse request body
    const requestData = await req.json();
    const { action, url, consumerKey, consumerSecret, page, perPage } = requestData;
    
    console.log(`Processing ${action} request`);
    
    // Validate required parameters
    if (!url || !consumerKey || !consumerSecret) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    let result;
    
    // Handle different actions
    switch (action) {
      case "testConnection":
        console.log("Testing connection to:", url);
        // Test connection by fetching a single product
        const testResult = await callWooCommerceAPI(
          url, 
          "products", 
          consumerKey, 
          consumerSecret,
          { per_page: "1" }
        );
        
        if (testResult.error) {
          console.error("Test connection failed:", testResult.error);
          result = { 
            success: false,
            error: testResult.error
          };
        } else {
          console.log("Test connection successful");
          result = { 
            success: true
          };
        }
        break;
        
      case "getProducts":
        // Fetch products with pagination
        const productsResult = await callWooCommerceAPI(
          url, 
          "products", 
          consumerKey, 
          consumerSecret,
          { 
            page: page ? page.toString() : "1", 
            per_page: perPage ? perPage.toString() : "10"
          }
        );
        
        if (productsResult.error) {
          console.error("Error fetching products:", productsResult.error);
          result = {
            products: [],
            error: productsResult.error
          };
        } else {
          console.log(`Retrieved ${productsResult.data?.length || 0} products`);
          result = {
            products: productsResult.data || [],
          };
        }
        break;
        
      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
    
    // Return the result
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Error in WooCommerce import function:", error);
    
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
