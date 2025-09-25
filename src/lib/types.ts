// Professional application types for BusiMap Rwanda - Updated to match API responses

export interface User {
  id?: string;
  email: string;
  phone_number?: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  profile_picture?: string;
  date_of_birth?: string;
  location_province?: string;
  location_district?: string;
  location_sector?: string;
  location_cell?: string;
  current_latitude?: string;
  current_longitude?: string;
  user_type: 'customer' | 'business_owner' | 'admin';
  preferred_language: 'en' | 'rw' | 'fr';
  notifications_enabled?: boolean;
  location_sharing_enabled?: boolean;
  email_verified?: boolean;
  phone_verified?: boolean;
  is_verified?: boolean;
  date_joined?: string;
  profile?: any;
}

export interface LoginCredentials {
  email?: string;
  phone_number?: string;
  password: string;
}

// FIXED: Made confirm_password required to match backend validation
export interface RegisterData {
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  password: string;
  confirm_password: string; // REQUIRED for backend validation
  preferred_language: 'en' | 'rw' | 'fr';
  location_province?: string;
  location_district?: string;
  user_type: 'customer' | 'business_owner';
}

export interface BusinessCategory {
  category_id: string;
  name: string;
  name_kinyarwanda?: string;
  name_french?: string;
  description?: string;
  description_kinyarwanda?: string;
  description_french?: string;
  parent_category?: string | null;
  icon?: string;
  color_code?: string;
  is_active: boolean;
}

export interface BusinessImage {
  image_id: string;
  image: string;
  caption?: string;
  is_primary?: boolean;
  uploaded_at?: string;
}

export interface BusinessReview {
  review_id: string;
  rating_score: number;
  review_text?: string;
  service_rating?: number;
  quality_rating?: number;
  value_rating?: number;
  is_verified_purchase?: boolean;
  is_anonymous?: boolean;
  helpful_votes?: number;
  business_response?: string;
  response_date?: string;
  created_at?: string;
  reviewer_name?: string;
  reviewer_profile_picture?: string;
}

export interface Business {
  business_id: string;
  business_name: string;
  business_name_kinyarwanda?: string;
  description: string;
  description_kinyarwanda?: string;
  category?: BusinessCategory;
  subcategories?: BusinessCategory[];
  province: string;
  district: string;
  sector: string;
  cell?: string;
  address: string;
  latitude?: string;
  longitude?: string;
  phone_number: string;
  secondary_phone?: string;
  email?: string;
  website?: string;
  business_hours?: any;
  price_range: 'low' | 'medium' | 'high' | 'premium';
  amenities?: any;
  services_offered?: any;
  payment_methods?: any;
  logo?: string;
  cover_image?: string;
  search_keywords?: any;
  operating_hours?: BusinessHours[];
  average_rating_score?: number;
  total_reviews?: number;
  verification_status: 'pending' | 'verified' | 'rejected';
  is_featured?: boolean;
  images?: BusinessImage[];
  reviews?: BusinessReview[];
  created_at?: string;
}

export interface NearbyBusiness {
  business_id: string;
  business_name: string;
  business_category: number;
  business_category_id?: string;
  category_name?: string;
  short_summary: string;
  latitude: string;
  longitude: string;
  address: string;
  average_rating_score?: string;
  total_reviews_count?: number;
  price_range: 'budget' | 'moderate' | 'premium' | 'luxury';
  distance_km: string;
}

export interface SearchFilters {
  categories?: BusinessCategory[];
  provinces?: string[];
  districts?: string[];
  price_ranges?: Array<{
    key: string;
    label: string;
  }>;
  amenities?: string[];
  rating_ranges?: Array<{
    min: number;
    max: number;
    label: string;
  }>;
}

export interface Location {
  latitude?: number;
  longitude?: number;
  address?: string;
  province?: string;
  district?: string;
  sector?: string;
  cell?: string;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  language?: string;
  metadata?: any;
}

export interface ChatState {
  messages: AIMessage[];
  isLoading: boolean;
  error?: string;
  conversationId?: string;
  context: {
    userLocation?: Location;
    language: string;
    lastIntent?: string;
    lastCategory?: string;
  };
}

export interface AIResponse {
  success: boolean;
  data?: {
    conversation_id: string;
    ai_response: {
      response: string;
      suggestions?: string[];
      conversation_state: {
        last_intent: string;
        last_category?: string;
        language: string;
        confidence?: number;
        urgency?: string;
      };
      next_step?: string;
      analysis?: {
        intent: string;
        category?: string;
        sentiment?: string;
        urgency?: string;
        entities?: Record<string, string[]>;
      };
    };
  };
  error?: {
    message: string;
    code: string;
    timestamp: number;
  };
  timestamp?: number | string;
  message?: string;
}

export interface SearchResponse {
  success: boolean;
  data?: {
    results?: Business[];
    total_found?: number;
    search_metadata?: {
      query: string;
      language?: string;
      ai_analysis?: any;
      search_suggestions?: string[];
    };
    pagination?: {
      current_page: number;
      total_pages: number;
      page_size: number;
    };
  };
  error?: {
    message: string;
    code: string;
    timestamp: string;
  };
  timestamp?: string;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
    timestamp: number | string;
  };
  timestamp?: number | string;
  message?: string;
}

export interface PaginatedResponse<T = any> {
  count: number;
  next?: string | null;
  previous?: string | null;
  results: T[];
}

export interface AuthResponse {
  user?: User;
  access_token?: string;
  refresh_token?: string;
  token?: string;
  refresh?: string;
  user_id?: string;
}

export interface BusinessInsights {
  popular_categories: Array<{
    name: string;
    growth: number;
    searches: number;
  }>;
  trending_searches: string[];
  performance_metrics: {
    total_businesses: number;
    verified_businesses: number;
    average_rating: number;
    total_reviews: number;
  };
  growth_trends: Array<{
    period: string;
    new_businesses: number;
    growth_rate: number;
  }>;
}

export interface MarketTrends {
  growth_metrics: {
    overall_growth: number;
    new_businesses: number;
    market_expansion: number;
    digital_adoption: number;
  };
  category_trends: Array<{
    category: string;
    trend: 'up' | 'down' | 'stable';
    change: number;
  }>;
  predictions: {
    next_quarter: {
      expected_growth: number;
      trending_categories: string[];
    };
  };
}

export interface SearchSuggestion {
  text: string;
  type: 'business' | 'category' | 'location' | 'query';
  metadata?: any;
}

export interface SearchHistoryItem {
  id: string;
  query: string;
  timestamp: string;
  results_count: number;
  language?: string;
  metadata?: any;
}

// Additional type definitions for Django backend compatibility

export interface BusinessHours {
  day_of_week: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  opening_time: string;
  closing_time: string;
  is_closed: boolean;
  is_special_day?: boolean;
  special_date?: string;
  special_note?: string;
}

export interface Province {
  province_id: string;
  name: string;
  name_kinyarwanda: string;
  name_french: string;
  latitude: string;
  longitude: string;
  area_km2: number;
  population?: number;
  boundaries?: any;
  created_at: string;
}

export interface District {
  district_id: string;
  province: string;
  province_name: string;
  name: string;
  name_kinyarwanda: string;
  name_french: string;
  latitude: string;
  longitude: string;
  area_km2: number;
  population?: number;
  boundaries?: any;
  created_at: string;
}

export interface Sector {
  sector_id: string;
  district: string;
  district_name: string;
  province_name: string;
  name: string;
  name_kinyarwanda: string;
  name_french?: string;
  latitude?: string;
  longitude?: string;
  created_at: string;
}

export interface Cell {
  cell_id: string;
  sector: string;
  sector_name: string;
  district_name: string;
  province_name: string;
  name: string;
  name_kinyarwanda: string;
  latitude?: string;
  longitude?: string;
  created_at: string;
}

export interface PaymentMethod {
  method_id: string;
  name: string;
  payment_type: 'mobile_money' | 'bank_transfer' | 'credit_card' | 'cash';
  provider: string;
  is_active: boolean;
  min_amount?: string;
  max_amount?: string;
  supported_currencies?: any;
  fixed_fee?: string;
  percentage_fee?: string;
  description?: string;
  icon_url?: string;
}

export interface PaymentTransaction {
  transaction_id: string;
  user: string;
  amount: string;
  currency?: string;
  payment_method: string;
  status: 'pending' | 'processing' | 'completed' | 'successful' | 'failed' | 'cancelled' | 'refunded';
  external_reference?: string;
  phone_number?: string;
  account_number?: string;
  description?: string;
  processing_fee?: string;
  total_amount?: string;
  initiated_at: string;
  completed_at?: string;
  expires_at?: string;
  failure_reason?: string;
  failure_code?: string;
}

export interface VehicleType {
  vehicle_type_id: string;
  name: 'motorcycle' | 'car' | 'van' | 'bus';
  description?: string;
  base_fare?: string;
  per_km_rate?: string;
  per_minute_rate?: string;
  minimum_fare?: string;
  capacity?: number;
  is_active: boolean;
}

export interface Driver {
  driver_id: string;
  driver_name: string;
  driver_phone: string;
  license_number: string;
  vehicle_type: string;
  vehicle_type_name: string;
  vehicle_model: string;
  vehicle_plate: string;
  vehicle_color: string;
  current_latitude?: string;
  current_longitude?: string;
  is_online: boolean;
  is_available: boolean;
  average_rating: string;
  total_rides: number;
  total_earnings: string;
}

export interface Ride {
  ride_id: string;
  passenger: string;
  passenger_name: string;
  driver?: string;
  driver_name?: string;
  pickup_latitude: string;
  pickup_longitude: string;
  pickup_address: string;
  dropoff_latitude: string;
  dropoff_longitude: string;
  dropoff_address: string;
  vehicle_type: string;
  vehicle_type_name: string;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  distance_km?: string;
  duration_minutes?: number;
  estimated_fare?: string;
  actual_fare?: string;
  currency?: string;
  requested_at: string;
  accepted_at?: string;
  started_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  special_instructions?: string;
  passenger_count?: number;
}

export interface SearchQuery {
  query_id: string;
  user?: string;
  query_text: string;
  original_language?: string;
  processed_query?: string;
  user_location?: any;
  search_filters?: any;
  search_type?: string;
  results_count?: number;
  clicked_business_ids?: any;
  user_satisfaction?: number;
  response_time_ms?: number;
  search_session_id?: string;
  created_at: string;
}

export interface UserLoginLog {
  ip_address: string;
  user_agent?: string;
  success: boolean;
  failure_reason?: string;
  created_at: string;
}

export interface VoiceResponse {
  success: boolean;
  session_id?: string;
  audio_data?: string;
  text?: string;
  error?: string;
}

export interface BusinessPerformance {
  business_id: string;
  business_name: string;
  time_period: string;
  performance_metrics: any;
  customer_insights: any;
  search_performance: any;
  growth_trends: any;
  recommendations: string[];
}

export interface MarketIntelligence {
  market_overview: any;
  category_trends: any[];
  competitive_landscape: any;
  customer_insights: any;
  growth_opportunities: any[];
  recommendations: string[];
}

export interface SearchAnalytics {
  time_period: string;
  language: string;
  total_searches: number;
  average_click_through_rate: number;
  trending_searches: any[];
  popular_searches: any[];
}

export interface UserBehaviorAnalytics {
  time_period: string;
  location?: string;
  total_sessions: number;
  average_session_duration_minutes: number;
  average_pages_viewed: number;
  average_searches_performed: number;
  average_engagement_score: number;
  top_user_segments: any[];
}

export type SupportedLanguage = 'en' | 'rw' | 'fr';
export type UserType = 'customer' | 'business_owner' | 'admin';
export type PriceRange = 'low' | 'medium' | 'high' | 'premium';
export type VerificationStatus = 'pending' | 'verified' | 'rejected';
export type PublicationStatus = 'draft' | 'published' | 'archived';
export type PaymentType = 'mobile_money' | 'bank_transfer' | 'credit_card' | 'cash';
export type TransactionStatus = 'pending' | 'processing' | 'completed' | 'successful' | 'failed' | 'cancelled' | 'refunded';
export type RideStatus = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
export type VehicleName = 'motorcycle' | 'car' | 'van' | 'bus';
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';