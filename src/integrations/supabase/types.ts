export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          address_line1: string
          address_line2: string | null
          city: string
          created_at: string
          full_name: string
          id: string
          is_default: boolean | null
          label: string
          phone: string
          pincode: string
          state: string
          user_id: string
        }
        Insert: {
          address_line1: string
          address_line2?: string | null
          city: string
          created_at?: string
          full_name: string
          id?: string
          is_default?: boolean | null
          label?: string
          phone: string
          pincode: string
          state: string
          user_id: string
        }
        Update: {
          address_line1?: string
          address_line2?: string | null
          city?: string
          created_at?: string
          full_name?: string
          id?: string
          is_default?: boolean | null
          label?: string
          phone?: string
          pincode?: string
          state?: string
          user_id?: string
        }
        Relationships: []
      }
      attribute_template_options: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_default: boolean | null
          label: string
          metal_type: string | null
          price_adjustment: number | null
          template_id: string
          updated_at: string | null
          value: string
          weight_adjustment: number | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_default?: boolean | null
          label: string
          metal_type?: string | null
          price_adjustment?: number | null
          template_id: string
          updated_at?: string | null
          value: string
          weight_adjustment?: number | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_default?: boolean | null
          label?: string
          metal_type?: string | null
          price_adjustment?: number | null
          template_id?: string
          updated_at?: string | null
          value?: string
          weight_adjustment?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "attribute_template_options_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "attribute_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      attribute_templates: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          selection_mode: string
          slug: string
          template_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          selection_mode?: string
          slug: string
          template_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          selection_mode?: string
          slug?: string
          template_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      carousel_categories: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_view_all: boolean | null
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_view_all?: boolean | null
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_view_all?: boolean | null
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          selected_variations: Json | null
          user_id: string
          variation_price_adjustment: number
          variation_signature: string
          variation_weight_adjustment: number
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          selected_variations?: Json | null
          user_id: string
          variation_price_adjustment?: number
          variation_signature?: string
          variation_weight_adjustment?: number
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          selected_variations?: Json | null
          user_id?: string
          variation_price_adjustment?: number
          variation_signature?: string
          variation_weight_adjustment?: number
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "low_stock_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      category_making_charges: {
        Row: {
          category: Database["public"]["Enums"]["product_category"]
          id: string
          making_charge_percent: number
          min_making_charge: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["product_category"]
          id?: string
          making_charge_percent?: number
          min_making_charge?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["product_category"]
          id?: string
          making_charge_percent?: number
          min_making_charge?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      chit_funds: {
        Row: {
          created_at: string
          created_by: string | null
          customer_name: string
          email: string | null
          id: string
          monthly_amount: number
          months_paid: number
          next_due_date: string | null
          notes: string | null
          phone: string
          plan_name: string
          start_date: string
          status: string
          total_gold_grams: number | null
          total_months: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          customer_name: string
          email?: string | null
          id?: string
          monthly_amount: number
          months_paid?: number
          next_due_date?: string | null
          notes?: string | null
          phone: string
          plan_name: string
          start_date?: string
          status?: string
          total_gold_grams?: number | null
          total_months?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          customer_name?: string
          email?: string | null
          id?: string
          monthly_amount?: number
          months_paid?: number
          next_due_date?: string | null
          notes?: string | null
          phone?: string
          plan_name?: string
          start_date?: string
          status?: string
          total_gold_grams?: number | null
          total_months?: number
          updated_at?: string
        }
        Relationships: []
      }
      chit_payments: {
        Row: {
          amount: number
          chit_fund_id: string
          created_at: string
          created_by: string | null
          gold_grams: number
          gold_rate_applied: number
          id: string
          notes: string | null
          payment_date: string
          payment_method: string | null
          receipt_number: string | null
        }
        Insert: {
          amount: number
          chit_fund_id: string
          created_at?: string
          created_by?: string | null
          gold_grams: number
          gold_rate_applied: number
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          receipt_number?: string | null
        }
        Update: {
          amount?: number
          chit_fund_id?: string
          created_at?: string
          created_by?: string | null
          gold_grams?: number
          gold_rate_applied?: number
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          receipt_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chit_payments_chit_fund_id_fkey"
            columns: ["chit_fund_id"]
            isOneToOne: false
            referencedRelation: "chit_funds"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          description: string | null
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean | null
          max_discount: number | null
          min_order_value: number | null
          usage_limit: number | null
          used_count: number | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          discount_type?: string
          discount_value: number
          id?: string
          is_active?: boolean | null
          max_discount?: number | null
          min_order_value?: number | null
          usage_limit?: number | null
          used_count?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean | null
          max_discount?: number | null
          min_order_value?: number | null
          usage_limit?: number | null
          used_count?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      enquiries: {
        Row: {
          created_at: string
          email: string
          id: string
          is_resolved: boolean | null
          message: string
          name: string
          phone: string
          product_id: string | null
          store_id: string | null
          subject: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_resolved?: boolean | null
          message: string
          name: string
          phone: string
          product_id?: string | null
          store_id?: string | null
          subject?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_resolved?: boolean | null
          message?: string
          name?: string
          phone?: string
          product_id?: string | null
          store_id?: string | null
          subject?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enquiries_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "low_stock_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enquiries_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enquiries_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      gold_rates: {
        Row: {
          created_at: string
          created_by: string | null
          effective_date: string
          id: string
          is_current: boolean | null
          rate_18k: number | null
          rate_22k: number
          rate_24k: number
          silver_rate: number | null
          source: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          effective_date?: string
          id?: string
          is_current?: boolean | null
          rate_18k?: number | null
          rate_22k: number
          rate_24k: number
          silver_rate?: number | null
          source?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          effective_date?: string
          id?: string
          is_current?: boolean | null
          rate_18k?: number | null
          rate_22k?: number
          rate_24k?: number
          silver_rate?: number | null
          source?: string | null
        }
        Relationships: []
      }
      hero_slides: {
        Row: {
          alt_text: string | null
          created_at: string | null
          desktop_image_url: string
          display_order: number | null
          id: string
          is_active: boolean | null
          link_url: string | null
          mobile_image_url: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string | null
          desktop_image_url: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          link_url?: string | null
          mobile_image_url?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string | null
          desktop_image_url?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          link_url?: string | null
          mobile_image_url?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      megamenu_categories: {
        Row: {
          category_name: string
          category_slug: string
          created_at: string | null
          display_order: number | null
          featured_limit: number | null
          id: string
          is_active: boolean | null
          updated_at: string | null
        }
        Insert: {
          category_name: string
          category_slug: string
          created_at?: string | null
          display_order?: number | null
          featured_limit?: number | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
        }
        Update: {
          category_name?: string
          category_slug?: string
          created_at?: string | null
          display_order?: number | null
          featured_limit?: number | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      megamenu_featured_products: {
        Row: {
          created_at: string | null
          id: string
          megamenu_category_id: string
          product_id: string
          product_image_url: string | null
          product_order: number | null
          product_title: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          megamenu_category_id: string
          product_id: string
          product_image_url?: string | null
          product_order?: number | null
          product_title?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          megamenu_category_id?: string
          product_id?: string
          product_image_url?: string | null
          product_order?: number | null
          product_title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "megamenu_featured_products_megamenu_category_id_fkey"
            columns: ["megamenu_category_id"]
            isOneToOne: false
            referencedRelation: "megamenu_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "megamenu_featured_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "low_stock_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "megamenu_featured_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      megamenu_item_products: {
        Row: {
          created_at: string | null
          id: string
          megamenu_item_id: string
          product_id: string
          product_image_url: string | null
          product_order: number | null
          product_title: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          megamenu_item_id: string
          product_id: string
          product_image_url?: string | null
          product_order?: number | null
          product_title?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          megamenu_item_id?: string
          product_id?: string
          product_image_url?: string | null
          product_order?: number | null
          product_title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "megamenu_item_products_megamenu_item_id_fkey"
            columns: ["megamenu_item_id"]
            isOneToOne: false
            referencedRelation: "megamenu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "megamenu_item_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "low_stock_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "megamenu_item_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      megamenu_item_rules: {
        Row: {
          created_at: string | null
          id: string
          megamenu_item_id: string
          rule_order: number | null
          rule_type: string
          rule_value: Json
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          megamenu_item_id: string
          rule_order?: number | null
          rule_type: string
          rule_value?: Json
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          megamenu_item_id?: string
          rule_order?: number | null
          rule_type?: string
          rule_value?: Json
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "megamenu_item_rules_megamenu_item_id_fkey"
            columns: ["megamenu_item_id"]
            isOneToOne: false
            referencedRelation: "megamenu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      megamenu_items: {
        Row: {
          created_at: string | null
          icon_emoji: string | null
          id: string
          is_active: boolean | null
          item_name: string
          item_order: number | null
          item_slug: string | null
          megamenu_section_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          icon_emoji?: string | null
          id?: string
          is_active?: boolean | null
          item_name: string
          item_order?: number | null
          item_slug?: string | null
          megamenu_section_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          icon_emoji?: string | null
          id?: string
          is_active?: boolean | null
          item_name?: string
          item_order?: number | null
          item_slug?: string | null
          megamenu_section_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "megamenu_items_megamenu_section_id_fkey"
            columns: ["megamenu_section_id"]
            isOneToOne: false
            referencedRelation: "megamenu_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      megamenu_sections: {
        Row: {
          column: number | null
          created_at: string | null
          id: string
          is_featured: boolean | null
          megamenu_category_id: string
          section_name: string
          section_order: number | null
          updated_at: string | null
        }
        Insert: {
          column?: number | null
          created_at?: string | null
          id?: string
          is_featured?: boolean | null
          megamenu_category_id: string
          section_name: string
          section_order?: number | null
          updated_at?: string | null
        }
        Update: {
          column?: number | null
          created_at?: string | null
          id?: string
          is_featured?: boolean | null
          megamenu_category_id?: string
          section_name?: string
          section_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "megamenu_sections_megamenu_category_id_fkey"
            columns: ["megamenu_category_id"]
            isOneToOne: false
            referencedRelation: "megamenu_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      megamenu_settings: {
        Row: {
          created_at: string | null
          id: string
          is_enabled: boolean
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_enabled?: boolean
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_enabled?: boolean
          updated_at?: string | null
        }
        Relationships: []
      }
      menu_categories: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      menu_subcategories: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          menu_category_id: string
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          menu_category_id: string
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          menu_category_id?: string
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "menu_subcategories_menu_category_id_fkey"
            columns: ["menu_category_id"]
            isOneToOne: false
            referencedRelation: "menu_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      metal_types: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          rate_per_gram: number
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          rate_per_gram?: number
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          rate_per_gram?: number
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      notification_queue: {
        Row: {
          body: string
          created_at: string
          created_by: string | null
          id: string
          notification_type: string
          sent_at: string | null
          target_users: string[] | null
          title: string
          url: string | null
        }
        Insert: {
          body: string
          created_at?: string
          created_by?: string | null
          id?: string
          notification_type?: string
          sent_at?: string | null
          target_users?: string[] | null
          title: string
          url?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string | null
          id?: string
          notification_type?: string
          sent_at?: string | null
          target_users?: string[] | null
          title?: string
          url?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          diamond_cost: number | null
          gold_rate_applied: number
          id: string
          making_charges: number
          order_id: string
          product_id: string | null
          product_image: string | null
          product_name: string
          quantity: number
          selected_variations: Json | null
          stone_cost: number | null
          total_price: number
          unit_price: number
          variation_price_adjustment: number
          variation_weight_adjustment: number
          weight_grams: number
        }
        Insert: {
          diamond_cost?: number | null
          gold_rate_applied: number
          id?: string
          making_charges: number
          order_id: string
          product_id?: string | null
          product_image?: string | null
          product_name: string
          quantity?: number
          selected_variations?: Json | null
          stone_cost?: number | null
          total_price: number
          unit_price: number
          variation_price_adjustment?: number
          variation_weight_adjustment?: number
          weight_grams: number
        }
        Update: {
          diamond_cost?: number | null
          gold_rate_applied?: number
          id?: string
          making_charges?: number
          order_id?: string
          product_id?: string | null
          product_image?: string | null
          product_name?: string
          quantity?: number
          selected_variations?: Json | null
          stone_cost?: number | null
          total_price?: number
          unit_price?: number
          variation_price_adjustment?: number
          variation_weight_adjustment?: number
          weight_grams?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "low_stock_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          billing_address: Json | null
          created_at: string
          gold_rate_at_order: number
          gst_amount: number
          id: string
          notes: string | null
          order_number: string
          payment_id: string | null
          payment_method: string | null
          payment_proof_url: string | null
          payment_utr: string | null
          payment_verified: boolean | null
          payment_verified_at: string | null
          payment_verified_by: string | null
          shipping_address: Json
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total_amount: number
          updated_at: string
          upi_phone: string | null
          upi_provider: string | null
          user_id: string | null
        }
        Insert: {
          billing_address?: Json | null
          created_at?: string
          gold_rate_at_order: number
          gst_amount: number
          id?: string
          notes?: string | null
          order_number: string
          payment_id?: string | null
          payment_method?: string | null
          payment_proof_url?: string | null
          payment_utr?: string | null
          payment_verified?: boolean | null
          payment_verified_at?: string | null
          payment_verified_by?: string | null
          shipping_address: Json
          status?: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total_amount: number
          updated_at?: string
          upi_phone?: string | null
          upi_provider?: string | null
          user_id?: string | null
        }
        Update: {
          billing_address?: Json | null
          created_at?: string
          gold_rate_at_order?: number
          gst_amount?: number
          id?: string
          notes?: string | null
          order_number?: string
          payment_id?: string | null
          payment_method?: string | null
          payment_proof_url?: string | null
          payment_utr?: string | null
          payment_verified?: boolean | null
          payment_verified_at?: string | null
          payment_verified_by?: string | null
          shipping_address?: Json
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total_amount?: number
          updated_at?: string
          upi_phone?: string | null
          upi_provider?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      page_views: {
        Row: {
          created_at: string
          id: string
          page_path: string
          page_title: string | null
          referrer: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          page_path: string
          page_title?: string | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          page_path?: string
          page_title?: string | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      product_attribute_templates: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          is_enabled: boolean | null
          product_id: string
          template_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_enabled?: boolean | null
          product_id: string
          template_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_enabled?: boolean | null
          product_id?: string
          template_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_attribute_templates_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "low_stock_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_attribute_templates_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_attribute_templates_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "attribute_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          banner_image_url: string | null
          created_at: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          banner_image_url?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          banner_image_url?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      product_menu_categories: {
        Row: {
          created_at: string | null
          id: string
          menu_category_id: string
          menu_subcategory_id: string | null
          product_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          menu_category_id: string
          menu_subcategory_id?: string | null
          product_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          menu_category_id?: string
          menu_subcategory_id?: string | null
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_menu_categories_menu_category_id_fkey"
            columns: ["menu_category_id"]
            isOneToOne: false
            referencedRelation: "menu_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_menu_categories_menu_subcategory_id_fkey"
            columns: ["menu_subcategory_id"]
            isOneToOne: false
            referencedRelation: "menu_subcategories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_menu_categories_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "low_stock_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_menu_categories_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_subcategories: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          product_category_id: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          product_category_id: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          product_category_id?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_subcategories_product_category_id_fkey"
            columns: ["product_category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variations: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          is_available: boolean | null
          is_default: boolean | null
          metal_label: string | null
          metal_type: Database["public"]["Enums"]["metal_type"] | null
          price_adjustment: number | null
          product_id: string
          selection_mode: string | null
          size_label: string | null
          size_value: string | null
          sku_suffix: string | null
          stock_quantity: number | null
          updated_at: string
          variation_group: string | null
          variation_type: string
          weight_adjustment: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          is_default?: boolean | null
          metal_label?: string | null
          metal_type?: Database["public"]["Enums"]["metal_type"] | null
          price_adjustment?: number | null
          product_id: string
          selection_mode?: string | null
          size_label?: string | null
          size_value?: string | null
          sku_suffix?: string | null
          stock_quantity?: number | null
          updated_at?: string
          variation_group?: string | null
          variation_type: string
          weight_adjustment?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          is_default?: boolean | null
          metal_label?: string | null
          metal_type?: Database["public"]["Enums"]["metal_type"] | null
          price_adjustment?: number | null
          product_id?: string
          selection_mode?: string | null
          size_label?: string | null
          size_value?: string | null
          sku_suffix?: string | null
          stock_quantity?: number | null
          updated_at?: string
          variation_group?: string | null
          variation_type?: string
          weight_adjustment?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_variations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "low_stock_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: Database["public"]["Enums"]["product_category"] | null
          created_at: string
          description: string | null
          diamond_cost: number | null
          id: string
          images: string[] | null
          is_active: boolean | null
          is_bestseller: boolean | null
          is_bridal: boolean | null
          is_featured: boolean | null
          is_new_arrival: boolean | null
          low_stock_threshold: number | null
          making_charge_percent: number | null
          metal_type: Database["public"]["Enums"]["metal_type"]
          metal_type_id: string | null
          name: string
          product_category_id: string | null
          product_subcategory_id: string | null
          short_description: string | null
          sku: string | null
          slug: string
          specifications: Json | null
          stock_quantity: number | null
          stone_cost: number | null
          stones: Json | null
          tags: string[] | null
          updated_at: string
          video_url: string | null
          weight_grams: number
        }
        Insert: {
          category?: Database["public"]["Enums"]["product_category"] | null
          created_at?: string
          description?: string | null
          diamond_cost?: number | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          is_bestseller?: boolean | null
          is_bridal?: boolean | null
          is_featured?: boolean | null
          is_new_arrival?: boolean | null
          low_stock_threshold?: number | null
          making_charge_percent?: number | null
          metal_type?: Database["public"]["Enums"]["metal_type"]
          metal_type_id?: string | null
          name: string
          product_category_id?: string | null
          product_subcategory_id?: string | null
          short_description?: string | null
          sku?: string | null
          slug: string
          specifications?: Json | null
          stock_quantity?: number | null
          stone_cost?: number | null
          stones?: Json | null
          tags?: string[] | null
          updated_at?: string
          video_url?: string | null
          weight_grams: number
        }
        Update: {
          category?: Database["public"]["Enums"]["product_category"] | null
          created_at?: string
          description?: string | null
          diamond_cost?: number | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          is_bestseller?: boolean | null
          is_bridal?: boolean | null
          is_featured?: boolean | null
          is_new_arrival?: boolean | null
          low_stock_threshold?: number | null
          making_charge_percent?: number | null
          metal_type?: Database["public"]["Enums"]["metal_type"]
          metal_type_id?: string | null
          name?: string
          product_category_id?: string | null
          product_subcategory_id?: string | null
          short_description?: string | null
          sku?: string | null
          slug?: string
          specifications?: Json | null
          stock_quantity?: number | null
          stone_cost?: number | null
          stones?: Json | null
          tags?: string[] | null
          updated_at?: string
          video_url?: string | null
          weight_grams?: number
        }
        Relationships: [
          {
            foreignKeyName: "products_metal_type_id_fkey"
            columns: ["metal_type_id"]
            isOneToOne: false
            referencedRelation: "metal_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_product_category_id_fkey"
            columns: ["product_category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_product_subcategory_id_fkey"
            columns: ["product_subcategory_id"]
            isOneToOne: false
            referencedRelation: "product_subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          order_updates: boolean
          p256dh: string
          promo_alerts: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          order_updates?: boolean
          p256dh: string
          promo_alerts?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          order_updates?: boolean
          p256dh?: string
          promo_alerts?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          content: string
          created_at: string
          id: string
          is_approved: boolean | null
          is_published: boolean | null
          product_id: string
          rating: number
          title: string | null
          updated_at: string
          user_id: string
          user_name: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_approved?: boolean | null
          is_published?: boolean | null
          product_id: string
          rating: number
          title?: string | null
          updated_at?: string
          user_id: string
          user_name: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_approved?: boolean | null
          is_published?: boolean | null
          product_id?: string
          rating?: number
          title?: string | null
          updated_at?: string
          user_id?: string
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "low_stock_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      search_logs: {
        Row: {
          created_at: string
          id: string
          query: string
          results_count: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          query: string
          results_count?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          query?: string
          results_count?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      size_charts: {
        Row: {
          category: string
          chart_data: Json
          column_headers: Json
          created_at: string
          guide_image_url: string | null
          id: string
          instructions: string | null
          updated_at: string
        }
        Insert: {
          category: string
          chart_data?: Json
          column_headers?: Json
          created_at?: string
          guide_image_url?: string | null
          id?: string
          instructions?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          chart_data?: Json
          column_headers?: Json
          created_at?: string
          guide_image_url?: string | null
          id?: string
          instructions?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      stores: {
        Row: {
          address: string
          city: string
          created_at: string
          email: string | null
          id: string
          is_active: boolean | null
          latitude: number | null
          longitude: number | null
          name: string
          phone: string | null
          pincode: string
          state: string
          timings: string | null
        }
        Insert: {
          address: string
          city: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name: string
          phone?: string | null
          pincode: string
          state: string
          timings?: string | null
        }
        Update: {
          address?: string
          city?: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          phone?: string | null
          pincode?: string
          state?: string
          timings?: string | null
        }
        Relationships: []
      }
      upi_payment_settings: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          merchant_name: string | null
          qr_code_url: string | null
          updated_at: string | null
          updated_by: string | null
          upi_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          merchant_name?: string | null
          qr_code_url?: string | null
          updated_at?: string | null
          updated_by?: string | null
          upi_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          merchant_name?: string | null
          qr_code_url?: string | null
          updated_at?: string | null
          updated_by?: string | null
          upi_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wishlist: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "low_stock_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlist_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      low_stock_products: {
        Row: {
          category: Database["public"]["Enums"]["product_category"] | null
          id: string | null
          is_active: boolean | null
          low_stock_threshold: number | null
          name: string | null
          sku: string | null
          stock_quantity: number | null
        }
        Insert: {
          category?: Database["public"]["Enums"]["product_category"] | null
          id?: string | null
          is_active?: boolean | null
          low_stock_threshold?: number | null
          name?: string | null
          sku?: string | null
          stock_quantity?: number | null
        }
        Update: {
          category?: Database["public"]["Enums"]["product_category"] | null
          id?: string | null
          is_active?: boolean | null
          low_stock_threshold?: number | null
          name?: string | null
          sku?: string | null
          stock_quantity?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_product_price: {
        Args: {
          p_diamond_cost?: number
          p_making_charge_percent: number
          p_metal_type: Database["public"]["Enums"]["metal_type"]
          p_stone_cost?: number
          p_weight: number
        }
        Returns: {
          gold_value: number
          gst: number
          making_charges: number
          subtotal: number
          total: number
        }[]
      }
      get_current_gold_rate: {
        Args: never
        Returns: {
          effective_date: string
          rate_18k: number
          rate_22k: number
          rate_24k: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      metal_type: "gold_22k" | "gold_24k" | "gold_18k" | "silver" | "platinum"
      order_status:
        | "pending"
        | "confirmed"
        | "processing"
        | "shipped"
        | "delivered"
        | "cancelled"
      product_category:
        | "necklaces"
        | "earrings"
        | "rings"
        | "bangles"
        | "bracelets"
        | "chains"
        | "pendants"
        | "wedding_sets"
        | "diamond_jewellery"
        | "mens_jewellery"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      metal_type: ["gold_22k", "gold_24k", "gold_18k", "silver", "platinum"],
      order_status: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ],
      product_category: [
        "necklaces",
        "earrings",
        "rings",
        "bangles",
        "bracelets",
        "chains",
        "pendants",
        "wedding_sets",
        "diamond_jewellery",
        "mens_jewellery",
      ],
    },
  },
} as const
