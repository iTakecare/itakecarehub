export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      clients: {
        Row: {
          address: string | null
          city: string | null
          company: string | null
          country: string | null
          created_at: string
          email: string | null
          has_user_account: boolean | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          postal_code: string | null
          status: string | null
          updated_at: string
          user_account_created_at: string | null
          user_id: string
          vat_number: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          company?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          has_user_account?: boolean | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          status?: string | null
          updated_at?: string
          user_account_created_at?: string | null
          user_id: string
          vat_number?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          company?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          has_user_account?: boolean | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          status?: string | null
          updated_at?: string
          user_account_created_at?: string | null
          user_id?: string
          vat_number?: string | null
        }
        Relationships: []
      }
      contract_workflow_logs: {
        Row: {
          contract_id: string
          created_at: string
          id: string
          new_status: string
          previous_status: string
          reason: string | null
          user_id: string
        }
        Insert: {
          contract_id: string
          created_at?: string
          id?: string
          new_status: string
          previous_status: string
          reason?: string | null
          user_id: string
        }
        Update: {
          contract_id?: string
          created_at?: string
          id?: string
          new_status?: string
          previous_status?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_workflow_logs_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          client_id: string | null
          client_name: string
          created_at: string
          delivery_carrier: string | null
          delivery_status: string | null
          equipment_description: string | null
          estimated_delivery: string | null
          id: string
          leaser_logo: string | null
          leaser_name: string
          monthly_payment: number
          offer_id: string
          status: string
          tracking_number: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          client_id?: string | null
          client_name: string
          created_at?: string
          delivery_carrier?: string | null
          delivery_status?: string | null
          equipment_description?: string | null
          estimated_delivery?: string | null
          id?: string
          leaser_logo?: string | null
          leaser_name: string
          monthly_payment?: number
          offer_id: string
          status?: string
          tracking_number?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          client_id?: string | null
          client_name?: string
          created_at?: string
          delivery_carrier?: string | null
          delivery_status?: string | null
          equipment_description?: string | null
          estimated_delivery?: string | null
          id?: string
          leaser_logo?: string | null
          leaser_name?: string
          monthly_payment?: number
          offer_id?: string
          status?: string
          tracking_number?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "admin_pending_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      leaser_ranges: {
        Row: {
          coefficient: number
          created_at: string | null
          id: string
          leaser_id: string | null
          max: number
          min: number
          updated_at: string | null
        }
        Insert: {
          coefficient?: number
          created_at?: string | null
          id?: string
          leaser_id?: string | null
          max?: number
          min?: number
          updated_at?: string | null
        }
        Update: {
          coefficient?: number
          created_at?: string | null
          id?: string
          leaser_id?: string | null
          max?: number
          min?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leaser_ranges_leaser_id_fkey"
            columns: ["leaser_id"]
            isOneToOne: false
            referencedRelation: "leasers"
            referencedColumns: ["id"]
          },
        ]
      }
      leasers: {
        Row: {
          created_at: string | null
          id: string
          logo_url: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          logo_url?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      offer_workflow_logs: {
        Row: {
          created_at: string
          id: string
          new_status: string
          offer_id: string
          previous_status: string
          reason: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          new_status: string
          offer_id: string
          previous_status: string
          reason?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          new_status?: string
          offer_id?: string
          previous_status?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      offers: {
        Row: {
          amount: number
          client_email: string | null
          client_id: string | null
          client_name: string
          coefficient: number
          commission: number | null
          converted_to_contract: boolean | null
          created_at: string | null
          equipment_description: string | null
          id: string
          monthly_payment: number
          status: string
          type: string | null
          updated_at: string | null
          user_id: string
          workflow_status: string | null
        }
        Insert: {
          amount?: number
          client_email?: string | null
          client_id?: string | null
          client_name: string
          coefficient?: number
          commission?: number | null
          converted_to_contract?: boolean | null
          created_at?: string | null
          equipment_description?: string | null
          id?: string
          monthly_payment?: number
          status?: string
          type?: string | null
          updated_at?: string | null
          user_id: string
          workflow_status?: string | null
        }
        Update: {
          amount?: number
          client_email?: string | null
          client_id?: string | null
          client_name?: string
          coefficient?: number
          commission?: number | null
          converted_to_contract?: boolean | null
          created_at?: string | null
          equipment_description?: string | null
          id?: string
          monthly_payment?: number
          status?: string
          type?: string | null
          updated_at?: string | null
          user_id?: string
          workflow_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "offers_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean | null
          brand: string | null
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          image_alt: string | null
          image_alts: string[] | null
          image_url: string | null
          image_urls: string[] | null
          imagealt: string | null
          imagealts: string[] | null
          imageurls: string[] | null
          is_parent: boolean | null
          is_variation: boolean | null
          monthly_price: number | null
          name: string
          parent_id: string | null
          price: number
          sku: string | null
          specifications: Json | null
          updated_at: string | null
          variants_ids: string[] | null
          variation_attributes: Json | null
        }
        Insert: {
          active?: boolean | null
          brand?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_alt?: string | null
          image_alts?: string[] | null
          image_url?: string | null
          image_urls?: string[] | null
          imagealt?: string | null
          imagealts?: string[] | null
          imageurls?: string[] | null
          is_parent?: boolean | null
          is_variation?: boolean | null
          monthly_price?: number | null
          name: string
          parent_id?: string | null
          price?: number
          sku?: string | null
          specifications?: Json | null
          updated_at?: string | null
          variants_ids?: string[] | null
          variation_attributes?: Json | null
        }
        Update: {
          active?: boolean | null
          brand?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_alt?: string | null
          image_alts?: string[] | null
          image_url?: string | null
          image_urls?: string[] | null
          imagealt?: string | null
          imagealts?: string[] | null
          imageurls?: string[] | null
          is_parent?: boolean | null
          is_variation?: boolean | null
          monthly_price?: number | null
          name?: string
          parent_id?: string | null
          price?: number
          sku?: string | null
          specifications?: Json | null
          updated_at?: string | null
          variants_ids?: string[] | null
          variation_attributes?: Json | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company: string | null
          created_at: string | null
          first_name: string | null
          id: string
          last_name: string | null
          role: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          role: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      woocommerce_configs: {
        Row: {
          consumer_key: string
          consumer_secret: string
          created_at: string | null
          id: string
          site_url: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          consumer_key: string
          consumer_secret: string
          created_at?: string | null
          id?: string
          site_url: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          consumer_key?: string
          consumer_secret?: string
          created_at?: string | null
          id?: string
          site_url?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      admin_pending_requests: {
        Row: {
          amount: number | null
          client_company: string | null
          client_contact_email: string | null
          client_email: string | null
          client_id: string | null
          client_name: string | null
          coefficient: number | null
          commission: number | null
          converted_to_contract: boolean | null
          created_at: string | null
          equipment_description: string | null
          id: string | null
          monthly_payment: number | null
          status: string | null
          updated_at: string | null
          user_id: string | null
          workflow_status: string | null
        }
        Relationships: [
          {
            foreignKeyName: "offers_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      calculate_total_revenue: {
        Args: {
          time_filter: string
        }
        Returns: {
          total_revenue: number
          gross_margin: number
          clients_count: number
        }[]
      }
      check_user_exists_by_email: {
        Args: {
          user_email: string
        }
        Returns: boolean
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_id_by_email: {
        Args: {
          user_email: string
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
