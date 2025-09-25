// Professional API layer for BusiMap Rwanda - Complete Django Backend Integration
import { Business, BusinessCategory, User, LoginCredentials, RegisterData } from './types';
import { API_BASE_URL, log, logError } from './config';

// Enhanced HTTP request helper with Django-specific auth and error handling
const makeRequest = async (endpoint: string, options: RequestInit = {}) => {
  // Get tokens with enhanced fallback logic
  const accessToken = localStorage.getItem('access_token') || localStorage.getItem('auth_token');
  const temporaryToken = localStorage.getItem('temporary_token');
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Use access token first, then temporary token for verification-only endpoints
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  } else if (temporaryToken && endpoint.includes('verify')) {
    headers['Authorization'] = `Bearer ${temporaryToken}`;
  }

  try {
    log(`Making request to: ${API_BASE_URL}${endpoint}`);
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Handle different response types
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      // Handle Django error formats
      if (data && typeof data === 'object') {
        // Handle success: false responses with errors
        if (data.success === false) {
          const errorData = {
            message: data.message || 'Request failed',
            errors: data.errors || {},
            status: response.status,
            response: { data, status: response.status }
          };
          logError('Django API Error:', errorData);
          throw errorData;
        }
        
        // Handle field validation errors
        if (data.errors || data.detail || data.error) {
          const errorData = {
            message: data.detail || data.error || 'Validation failed',
            errors: data.errors || data,
            status: response.status,
            response: { data, status: response.status }
          };
          logError('Django Validation Error:', errorData);
          throw errorData;
        }
      }
      
      // Generic error handling
      const errorData = {
        message: typeof data === 'string' ? data : `HTTP ${response.status}: ${response.statusText}`,
        status: response.status,
        response: { data, status: response.status }
      };
      logError('HTTP Error:', errorData);
      throw errorData;
    }

    log(`Request successful:`, endpoint);
    return data;
  } catch (error: any) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      // Network error - likely backend is not running
      const networkError = new Error('Backend service is not available. Please ensure the Django server is running.');
      logError('Network error - backend may not be running:', error);
      throw networkError;
    }
    logError('API request failed:', error);
    throw error;
  }
};

// File upload helper for multipart/form-data
const makeFileRequest = async (endpoint: string, formData: FormData, options: RequestInit = {}) => {
  const accessToken = localStorage.getItem('access_token') || localStorage.getItem('auth_token');
  const headers: Record<string, string> = {
    ...options.headers,
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      ...options,
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  } catch (error: any) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Backend service is not available. Please ensure the Django server is running.');
    }
    throw error;
  }
};

// Authentication API - Complete Django Backend Integration
export const authAPI = {
  // Login - Updated to handle verification flows
 // In your api.ts file, update the login function
login: async (credentials: LoginCredentials) => {
  const response = await makeRequest('/api/auth/login/', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
  
  console.log('API Login Response:', response);
  
  // Handle successful login with tokens
  if (response.success && response.access_token) {
    localStorage.setItem('access_token', response.access_token);
    localStorage.setItem('auth_token', response.access_token);
    localStorage.setItem('refresh_token', response.refresh_token);
    localStorage.setItem('user_data', JSON.stringify(response.user));
    localStorage.setItem('verification_status', JSON.stringify(response.verification_status || {}));
    
    // Clear temporary token if it exists
    localStorage.removeItem('temporary_token');
    localStorage.removeItem('pending_login');
  }
  // Handle verification required case - IMPROVED
  else if (response.requires_verification) {
    // Clear any existing access tokens
    localStorage.removeItem('access_token');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    
    // Store temporary token if provided
    if (response.temporary_token) {
      localStorage.setItem('temporary_token', response.temporary_token);
    }
    
    // Store minimal user data for verification context
    if (response.user_id && response.email) {
      const minimalUser = {
        id: response.user_id,
        email: response.email,
        email_verified: false,
        phone_verified: false,
        ...response.user // Include any additional user data
      };
      localStorage.setItem('user_data', JSON.stringify(minimalUser));
      localStorage.setItem('verification_status', JSON.stringify({
        email_verified: false,
        phone_verified: false,
        fully_verified: false
      }));
    }
    
    // Store pending login state
    localStorage.setItem('pending_login', JSON.stringify({
      email: credentials.email,
      user_id: response.user_id,
      verification_type: response.verification_type,
      timestamp: new Date().toISOString()
    }));
  }
  
  return response;
},

  // Registration - Updated to handle verification flows
  register: async (data: RegisterData) => {
    const response = await makeRequest('/api/auth/register/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    // Handle immediate login after registration (if email is pre-verified)
    if (response.success && response.access_token) {
      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('auth_token', response.access_token);
      localStorage.setItem('refresh_token', response.refresh_token);
      localStorage.setItem('user_data', JSON.stringify(response.user));
    }
    // Handle registration requiring verification
    else if (response.success && response.user_id) {
      // Store registration data for verification context
      localStorage.setItem('registration_data', JSON.stringify({
        user_id: response.user_id,
        email: response.email || data.email,
        requires_verification: response.requires_verification
      }));
    }
    
    return response;
  },

  // Token refresh - Enhanced error handling
  refreshToken: async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    
    const response = await makeRequest('/api/auth/token/refresh/', {
      method: 'POST',
      body: JSON.stringify({ refresh: refreshToken }),
    });
    
    if (response.access) {
      localStorage.setItem('access_token', response.access);
      localStorage.setItem('auth_token', response.access);
      if (response.refresh) {
        localStorage.setItem('refresh_token', response.refresh);
      }
    }
    
    return response;
  },

  // Logout - Enhanced cleanup
  logout: async () => {
    try {
      // Attempt to call logout endpoint (optional)
      await makeRequest('/api/auth/logout/', { method: 'POST' });
    } catch (error) {
      console.warn('Logout endpoint failed:', error);
    } finally {
      // Always clean up local storage
      localStorage.removeItem('access_token');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('temporary_token');
      localStorage.removeItem('user_data');
      localStorage.removeItem('verification_status');
      localStorage.removeItem('pending_login');
      localStorage.removeItem('registration_data');
    }
  },

  // Get profile - Enhanced error handling
  getProfile: async () => {
    return makeRequest('/api/auth/profile/');
  },

  // Update profile - Full and partial updates
  updateProfile: async (data: Partial<User>) => {
    return makeRequest('/api/auth/profile/', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  partialUpdateProfile: async (data: Partial<User>) => {
    return makeRequest('/api/auth/profile/', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // Change password
  changePassword: async (data: { current_password: string; new_password: string; confirm_password: string }) => {
    return makeRequest('/api/auth/change-password/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Phone verification - Complete flow
  requestPhoneVerification: async (phone_number: string) => {
    return makeRequest('/api/auth/phone/request-verification/', {
      method: 'POST',
      body: JSON.stringify({ phone_number }),
    });
  },

  verifyPhone: async (verification_code: string, phone_number?: string) => {
    return makeRequest('/api/auth/phone/verify/', {
      method: 'POST',
      body: JSON.stringify({ verification_code, phone_number }),
    });
  },

  // Email verification - Complete flow
  verifyEmail: async (token: string) => {
    return makeRequest('/api/auth/email/verify/', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  },

  resendEmailVerification: async (email?: string, user_id?: string) => {
    const requestData: any = {};
    if (email) requestData.email = email;
    if (user_id) requestData.user_id = user_id;
    
    return makeRequest('/api/auth/email/resend-verification/', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
  },

  // Password reset - Complete flow
  requestPasswordReset: async (email: string) => {
    return makeRequest('/api/auth/password-reset/', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  confirmPasswordReset: async (data: { new_password: string; confirm_password: string; token: string }) => {
    return makeRequest('/api/auth/password-reset-confirm/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Utility endpoints
  checkEmailAvailability: async (email: string) => {
    return makeRequest('/api/auth/check-email/', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  checkPhoneAvailability: async (phone_number: string) => {
    return makeRequest('/api/auth/check-phone/', {
      method: 'POST',
      body: JSON.stringify({ phone_number }),
    });
  },

  checkVerificationStatus: async (user_id: string) => {
    return makeRequest(`/api/auth/check-verification/${user_id}/`);
  },

  // Login history
  getLoginHistory: async (params: { page?: number; page_size?: number } = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
    
    const endpoint = `/api/auth/login-history/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return makeRequest(endpoint);
  },
};

// Business API - Django Backend Compatible
export const businessAPI = {
  getCategories: async (params: { ordering?: string } = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
    
    const endpoint = `/api/businesses/categories/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return makeRequest(endpoint);
  },

  getBusinesses: async (params: {
    search?: string;
    business_category?: string;
    province?: string;
    district?: string;
    price_range?: string;
    verification_status?: string;
    min_rating?: number;
    is_featured?: boolean;
    amenities?: string;
    ordering?: string;
    page?: number;
    page_size?: number;
  } = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
    
    const endpoint = `/api/businesses/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return makeRequest(endpoint);
  },

  getNearbyBusinesses: async (params: {
    latitude: number;
    longitude: number;
    radius?: number;
    search?: string;
    ordering?: string;
    page?: number;
    page_size?: number;
  }) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
    
    const endpoint = `/api/businesses/nearby/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return makeRequest(endpoint);
  },

  getBusinessDetail: async (businessId: string) => {
    return makeRequest(`/api/businesses/${businessId}/`);
  },

  createBusiness: async (data: any) => {
    return makeRequest('/api/businesses/create/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateBusiness: async (businessId: string, data: any) => {
    return makeRequest(`/api/businesses/${businessId}/update/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  partialUpdateBusiness: async (businessId: string, data: any) => {
    return makeRequest(`/api/businesses/${businessId}/update/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  getBusinessReviews: async (businessId: string, params: {
    ordering?: string;
    page?: number;
    page_size?: number;
    search?: string;
  } = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
    
    const endpoint = `/api/businesses/${businessId}/reviews/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return makeRequest(endpoint);
  },

  createReview: async (businessId: string, data: {
    rating_score: number;
    review_text?: string;
    service_rating?: number;
    quality_rating?: number;
    value_rating?: number;
    is_verified_purchase?: boolean;
    is_anonymous?: boolean;
  }) => {
    return makeRequest(`/api/businesses/${businessId}/reviews/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

createBusinessProgressive: async (businessData) => {
  const data = {
    ...businessData,
    // Ensure empty strings for optional fields
    sector: businessData.sector || '',
    cell: businessData.cell || '',
    secondary_phone: businessData.secondary_phone || '',
    email: businessData.email || '',
    website: businessData.website || '',
    business_name_kinyarwanda: businessData.business_name_kinyarwanda || '',
    description_kinyarwanda: businessData.description_kinyarwanda || '',
    
    // Handle arrays properly
    amenities: businessData.amenities || [],
    services_offered: Array.isArray(businessData.services_offered) 
      ? businessData.services_offered 
      : (businessData.services_offered || '').split(',').map(s => s.trim()).filter(s => s),
    payment_methods: businessData.payment_methods || [],
    search_keywords: Array.isArray(businessData.search_keywords)
      ? businessData.search_keywords
      : (businessData.search_keywords || '').split(',').map(s => s.trim()).filter(s => s),
    
    // Other fields
    price_range: businessData.price_range || 'medium',
    business_hours: businessData.business_hours || {}
  };

  const response = await makeRequest('/api/businesses/register/progressive/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response;
},

saveBusinessProgress: async (data: any) => {
  return makeRequest('/api/businesses/save-progress/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
},

getBusinessCompletion: async (businessId: string) => {
  return makeRequest(`/api/businesses/${businessId}/completion/`);
},

}
// Add this method to businessAPI
getUserBusinesses: async (params: {
  ordering?: string;
  page?: number;
  page_size?: number;
} = {}) => {
  const userData = getUserData();
  if (!userData) throw new Error('User not authenticated');
  
  const queryParams = new URLSearchParams();
  queryParams.append('owner', userData.id.toString());
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams.append(key, value.toString());
    }
  });
  
  const endpoint = `/api/businesses/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  return makeRequest(endpoint);
};

// AI API - Revolutionary AI Features with Voice Support
export const aiAPI = {
  chat: async (data: {
    message: string;
    conversation_id?: string;
    language?: string;
    user_location?: any;
    conversation_context?: any;
  }) => {
    return makeRequest('/api/ai/chat/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getRecommendations: async (data: {
    message?: string;
    conversation_id?: string;
    language?: string;
    user_location?: any;
    conversation_context?: any;
  }) => {
    return makeRequest('/api/ai/recommendations/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  analyzeQuery: async (data: {
    query: string;
    user_context?: any;
  }) => {
    return makeRequest('/api/ai/analyze-query/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getSearchSuggestions: async (data: {
    partial_query: string;
    language?: string;
    category?: string;
  }) => {
    return makeRequest('/api/ai/search-suggestions/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  detectLanguage: async (data: { text: string }) => {
    return makeRequest('/api/ai/detect-language/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  translate: async (data: {
    text: string;
    source_language?: string;
    target_language: string;
  }) => {
    return makeRequest('/api/ai/translate/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getBusinessInsights: async () => {
    return makeRequest('/api/ai/business-insights/');
  },

  getMarketTrends: async () => {
    return makeRequest('/api/ai/market-trends/');
  },

  getConversationContext: async () => {
    return makeRequest('/api/ai/conversation/context/');
  },

  // Voice AI Features
  startVoiceConversation: async (data: {
    success?: boolean;
    session_id?: string;
    audio_data?: string;
    text?: string;
    error?: string;
  }) => {
    return makeRequest('/api/ai/voice/start/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  continueVoiceConversation: async (data: {
    success?: boolean;
    session_id: string;
    audio_data?: string;
    text?: string;
    error?: string;
  }) => {
    return makeRequest('/api/ai/voice/continue/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  endVoiceConversation: async (data: {
    success?: boolean;
    session_id: string;
    audio_data?: string;
    text?: string;
    error?: string;
  }) => {
    return makeRequest('/api/ai/voice/end/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  processVoiceMessage: async (data: {
    success?: boolean;
    session_id?: string;
    audio_data?: string;
    text?: string;
    error?: string;
  }) => {
    return makeRequest('/api/ai/voice/message/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  speechToText: async (data: {
    transcript: string;
    confidence: number;
  }) => {
    return makeRequest('/api/ai/voice/speech-to-text/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  textToSpeech: async (data: {
    audio_url: string;
    duration: number;
  }) => {
    return makeRequest('/api/ai/voice/text-to-speech/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// Search API - Django Backend Compatible
export const searchAPI = {
  intelligentSearch: async (data: {
    query: string;
    language?: string;
    location?: any;
    filters?: any;
    sort_by?: string;
    page?: number;
  }) => {
    return makeRequest('/api/search/intelligent/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  quickSearch: async (data: {
    query: string;
    limit?: number;
  }) => {
    return makeRequest('/api/search/quick-search/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  advancedSearch: async (data: {
    query?: string;
    category?: string;
    location?: any;
    price_range?: string;
    rating_min?: number;
    amenities?: string[];
    distance_km?: number;
    sort_by?: string;
    page?: number;
  }) => {
    return makeRequest('/api/search/advanced-search/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getSuggestions: async (params: { query: string; language?: string } = { query: '' }) => {
    const queryParams = new URLSearchParams();
    if (params.query) queryParams.append('query', params.query);
    if (params.language) queryParams.append('language', params.language);
    const endpoint = `/api/search/suggestions/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return makeRequest(endpoint);
  },

  getAutocomplete: async () => {
    return makeRequest('/api/search/autocomplete/');
  },

  searchByCategory: async (category: string) => {
    return makeRequest(`/api/search/categories/${category}/`);
  },

  getSearchFilters: async () => {
    return makeRequest('/api/search/filters/');
  },

  getSearchHistory: async () => {
    return makeRequest('/api/search/history/');
  },

  radiusSearch: async (data: any) => {
    return makeRequest('/api/search/radius-search/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  saveSearch: async (data: any) => {
    return makeRequest('/api/search/save-search/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getTrendingSearches: async () => {
    return makeRequest('/api/search/trending/');
  },

  getSearchStats: async () => {
    return makeRequest('/api/search/stats/');
  },

  getSavedSearches: async (params: {
    ordering?: string;
    page?: number;
    page_size?: number;
  } = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
    
    const endpoint = `/api/search/saved/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return makeRequest(endpoint);
  },

  createSavedSearch: async (data: {
    user?: string;
    query_text: string;
    original_language?: string;
    processed_query?: string;
    user_location?: string;
    search_filters?: string;
    search_type?: string;
    results_count?: number;
    clicked_business_ids?: string;
    user_satisfaction?: number;
    response_time_ms?: number;
    search_session_id?: string;
  }) => {
    return makeRequest('/api/search/saved/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getSavedSearch: async (searchId: string) => {
    return makeRequest(`/api/search/saved/${searchId}/`);
  },

  deleteSavedSearch: async (searchId: string) => {
    return makeRequest(`/api/search/saved/${searchId}/`, {
      method: 'DELETE',
    });
  },
};

// Location API - Rwanda Administrative Divisions
export const locationAPI = {
  getProvinces: async (params: {
    ordering?: string;
    page?: number;
    page_size?: number;
    search?: string;
  } = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
    
    const endpoint = `/api/location/provinces/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return makeRequest(endpoint);
  },

  getProvince: async (provinceId: string) => {
    return makeRequest(`/api/location/provinces/${provinceId}/`);
  },

  getProvinceDistricts: async (provinceId: string, params: {
    ordering?: string;
    page?: number;
    page_size?: number;
    search?: string;
  } = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
    
    const endpoint = `/api/location/provinces/${provinceId}/districts/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return makeRequest(endpoint);
  },

  getDistricts: async (params: {
    ordering?: string;
    page?: number;
    page_size?: number;
    search?: string;
  } = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
    
    const endpoint = `/api/location/districts/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return makeRequest(endpoint);
  },

  getDistrict: async (districtId: string) => {
    return makeRequest(`/api/location/districts/${districtId}/`);
  },

  getDistrictSectors: async (districtId: string, params: {
    ordering?: string;
    page?: number;
    page_size?: number;
    search?: string;
  } = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
    
    const endpoint = `/api/location/districts/${districtId}/sectors/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return makeRequest(endpoint);
  },

  getSectors: async (params: {
    ordering?: string;
    page?: number;
    page_size?: number;
    search?: string;
  } = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
    
    const endpoint = `/api/location/sectors/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return makeRequest(endpoint);
  },

  getSector: async (sectorId: string) => {
    return makeRequest(`/api/location/sectors/${sectorId}/`);
  },

  getSectorCells: async (sectorId: string, params: {
    ordering?: string;
    page?: number;
    page_size?: number;
    search?: string;
  } = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
    
    const endpoint = `/api/location/sectors/${sectorId}/cells/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return makeRequest(endpoint);
  },

  getCells: async (params: {
    ordering?: string;
    page?: number;
    page_size?: number;
    search?: string;
  } = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
    
    const endpoint = `/api/location/cells/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return makeRequest(endpoint);
  },

  getCell: async (cellId: string) => {
    return makeRequest(`/api/location/cells/${cellId}/`);
  },

  geocodeAddress: async (address: string) => {
    return makeRequest('/api/location/geocode/', {
      method: 'POST',
      body: JSON.stringify({ address }),
    });
  },

  reverseGeocode: async (latitude: number, longitude: number) => {
    return makeRequest('/api/location/reverse-geocode/', {
      method: 'POST',
      body: JSON.stringify({ latitude, longitude }),
    });
  },
};

// Analytics API - Business Intelligence & Market Insights
export const analyticsAPI = {
  getBusinessPerformance: async () => {
    return makeRequest('/api/analytics/business-performance/');
  },

  getMarketIntelligence: async () => {
    return makeRequest('/api/analytics/market-intelligence/');
  },

  getMarketTrends: async () => {
    return makeRequest('/api/analytics/market-trends/');
  },

  getSearchAnalytics: async () => {
    return makeRequest('/api/analytics/search-analytics/');
  },

  getUserBehaviorAnalytics: async () => {
    return makeRequest('/api/analytics/user-behavior/');
  },
};

// Payments API - Mobile Money & Payment Processing
export const paymentsAPI = {
  getPaymentMethods: async (params: {
    ordering?: string;
    page?: number;
    page_size?: number;
    search?: string;
  } = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
    
    const endpoint = `/api/payments/methods/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return makeRequest(endpoint);
  },

  getPaymentMethod: async (methodId: string) => {
    return makeRequest(`/api/payments/methods/${methodId}/`);
  },

  getTransactions: async (params: {
    ordering?: string;
    page?: number;
    page_size?: number;
    search?: string;
  } = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
    
    const endpoint = `/api/payments/transactions/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return makeRequest(endpoint);
  },

  getTransaction: async (transactionId: string) => {
    return makeRequest(`/api/payments/transactions/${transactionId}/`);
  },

  getTransactionStatus: async (transactionId: string) => {
    return makeRequest(`/api/payments/transactions/${transactionId}/status/`);
  },

  // MTN Mobile Money
  initiateMTNPayment: async (data: {
    amount: number;
    phone_number: string;
    business_id?: string;
    transaction_type?: string;
    description?: string;
  }) => {
    return makeRequest('/api/payments/momo/initiate/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  handleMTNCallback: async (data: any) => {
    return makeRequest('/api/payments/momo/callback/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Airtel Money
  initiateAirtelPayment: async (data: {
    amount: number;
    phone_number: string;
    business_id?: string;
    transaction_type?: string;
    description?: string;
  }) => {
    return makeRequest('/api/payments/airtel/initiate/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  handleAirtelCallback: async (data: any) => {
    return makeRequest('/api/payments/airtel/callback/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// Transportation API - Mobility Services
export const transportAPI = {
  getVehicleTypes: async () => {
    return makeRequest('/api/transport/vehicle-types/');
  },

  getDrivers: async (params: {
    ordering?: string;
    page?: number;
    page_size?: number;
    search?: string;
  } = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
    
    const endpoint = `/api/transport/drivers/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return makeRequest(endpoint);
  },

  getDriver: async (driverId: string) => {
    return makeRequest(`/api/transport/drivers/${driverId}/`);
  },

  getDriverLocation: async (driverId: string) => {
    return makeRequest(`/api/transport/drivers/${driverId}/location/`);
  },

  updateDriverLocation: async (driverId: string, data: any) => {
    return makeRequest(`/api/transport/drivers/${driverId}/location/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  calculateFare: async (data: any) => {
    return makeRequest('/api/transport/fare/calculate/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getRides: async (params: {
    ordering?: string;
    page?: number;
    page_size?: number;
    search?: string;
  } = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
    
    const endpoint = `/api/transport/rides/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return makeRequest(endpoint);
  },

  getRide: async (rideId: string) => {
    return makeRequest(`/api/transport/rides/${rideId}/`);
  },

  createRide: async (data: {
    pickup_latitude: string;
    pickup_longitude: string;
    pickup_address: string;
    dropoff_latitude: string;
    dropoff_longitude: string;
    dropoff_address: string;
    vehicle_type: string;
    special_instructions?: string;
    passenger_count?: number;
  }) => {
    return makeRequest('/api/transport/rides/create/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  acceptRide: async (rideId: string, data?: any) => {
    return makeRequest(`/api/transport/rides/${rideId}/accept/`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  },

  cancelRide: async (rideId: string, data?: any) => {
    return makeRequest(`/api/transport/rides/${rideId}/cancel/`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  },

  completeRide: async (rideId: string, data?: any) => {
    return makeRequest(`/api/transport/rides/${rideId}/complete/`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  },
};

// Health Check API
export const healthAPI = {
  checkSystemHealth: async () => {
    return makeRequest('/api/health/');
  },

  checkDatabaseHealth: async () => {
    return makeRequest('/api/health/database/');
  },

  checkCacheHealth: async () => {
    return makeRequest('/api/health/cache/');
  },
};

// Complete API Export Object
export const api = {
  auth: authAPI,
  business: businessAPI,
  ai: aiAPI,
  search: searchAPI,
  location: locationAPI,
  analytics: analyticsAPI,
  payments: paymentsAPI,
  transport: transportAPI,
  health: healthAPI,
};

// Token management utilities
export const TokenManager = {
  getAccessToken: (): string | null => {
    return localStorage.getItem('access_token') || localStorage.getItem('auth_token');
  },
  
  getRefreshToken: (): string | null => {
    return localStorage.getItem('refresh_token');
  },
  
  getTemporaryToken: (): string | null => {
    return localStorage.getItem('temporary_token');
  },
  
  setTokens: (accessToken: string, refreshToken?: string, temporaryToken?: string): void => {
    if (accessToken) {
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('auth_token', accessToken); // Keep both for compatibility
    }
    if (refreshToken) {
      localStorage.setItem('refresh_token', refreshToken);
    }
    if (temporaryToken) {
      localStorage.setItem('temporary_token', temporaryToken);
    }
  },
  
  clearTokens: (): void => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('temporary_token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('verification_status');
    localStorage.removeItem('pending_login');
    localStorage.removeItem('registration_data');
  },
  
  isTokenExpired: (token: string): boolean => {
    try {
      const tokenData = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return tokenData.exp < (currentTime + 30); // Add 30 second buffer
    } catch {
      return true;
    }
  },
  
  getTokenExpiration: (token: string): number | null => {
    try {
      const tokenData = JSON.parse(atob(token.split('.')[1]));
      return tokenData.exp;
    } catch {
      return null;
    }
  }
};

// Utility functions
export const getAuthToken = () => TokenManager.getAccessToken();
export const getRefreshToken = () => TokenManager.getRefreshToken();
export const getUserData = () => {
  const userData = localStorage.getItem('user_data');
  return userData ? JSON.parse(userData) : null;
};
export const isAuthenticated = (): boolean => {
  const token = TokenManager.getAccessToken();
  const userData = getUserData();
  return !!(token && userData && userData.email_verified !== false);
};

export const isUnverified = (): boolean => {
  const userData = getUserData();
  const temporaryToken = TokenManager.getTemporaryToken();
  return !!(temporaryToken && userData && !userData.email_verified);
};

// Enhanced error handling for Django backend
export const handleApiError = (error: any): string => {
  console.error('API Error:', error);
  
  // Handle structured error responses
  if (error.response?.data) {
    const errorData = error.response.data;
    
    // Handle success: false format
    if (errorData.success === false) {
      if (errorData.message) return errorData.message;
      if (errorData.errors) {
        const errorMessages: string[] = [];
        Object.entries(errorData.errors).forEach(([field, fieldErrors]) => {
          if (Array.isArray(fieldErrors)) {
            errorMessages.push(...fieldErrors);
          } else if (typeof fieldErrors === 'string') {
            errorMessages.push(fieldErrors);
          }
        });
        if (errorMessages.length > 0) return errorMessages.join(', ');
      }
    }
    
    // Handle Django validation errors
    if (errorData.errors || errorData.detail || errorData.error) {
      if (errorData.detail) return errorData.detail;
      if (errorData.error) return errorData.error;
      
      // Handle field-specific errors
      if (errorData.errors) {
        const errorMessages: string[] = [];
        Object.entries(errorData.errors).forEach(([field, fieldErrors]) => {
          if (Array.isArray(fieldErrors)) {
            errorMessages.push(...fieldErrors.map((err: string) => `${field}: ${err}`));
          } else if (typeof fieldErrors === 'string') {
            errorMessages.push(`${field}: ${fieldErrors}`);
          }
        });
        if (errorMessages.length > 0) return errorMessages.join(', ');
      }
    }
  }
  
  // Handle HTTP status codes
  if (error.status || error.response?.status) {
    const status = error.status || error.response.status;
    
    switch (status) {
      case 400:
        return 'Invalid request. Please check your data and try again.';
      case 401:
        // Handle authentication errors
        TokenManager.clearTokens();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return 'Session expired. Please login again.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 429:
        return 'Too many requests. Please wait before trying again.';
      case 500:
        return 'Server error. Please try again later.';
      case 502:
        return 'Service temporarily unavailable. Please try again later.';
      case 503:
        return 'Service maintenance in progress. Please try again later.';
      default:
        return `HTTP ${status}: ${error.message || 'Request failed'}`;
    }
  }
  
  // Handle network errors
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return 'Network error. Please check your internet connection and try again.';
  }
  
  if (error.code === 'NETWORK_ERROR') {
    return 'Network error. Please check your connection and try again.';
  }
  
  // Fallback error message
  return error.message || 'An unexpected error occurred. Please try again.';
};

// Auto token refresh functionality
export const setupTokenRefresh = () => {
  const token = TokenManager.getAccessToken();
  if (token && !TokenManager.isTokenExpired(token)) {
    // Try to refresh token every 14 minutes (tokens typically expire in 15 minutes)
    setInterval(async () => {
      try {
        const currentToken = TokenManager.getAccessToken();
        if (currentToken && !TokenManager.isTokenExpired(currentToken)) {
          const expiration = TokenManager.getTokenExpiration(currentToken);
          if (expiration) {
            const currentTime = Date.now() / 1000;
            const timeUntilExpiration = expiration - currentTime;
            
            // Refresh token if it expires in less than 5 minutes
            if (timeUntilExpiration < 300 && timeUntilExpiration > 0) {
              console.log('Token expiring soon, refreshing...');
              await authAPI.refreshToken();
            }
          }
        }
      } catch (error) {
        console.warn('Token refresh failed:', error);
        // If refresh fails and token is expired, logout user
        const currentToken = TokenManager.getAccessToken();
        if (currentToken && TokenManager.isTokenExpired(currentToken)) {
          await authAPI.logout();
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
      }
    }, 60000); // Check every minute
  }
};

// Request interceptor to handle token refresh
export const createAuthenticatedRequest = async (endpoint: string, options: RequestInit = {}) => {
  let token = TokenManager.getAccessToken();
  
  // Check if token is expired and refresh if needed
  if (token && TokenManager.isTokenExpired(token)) {
    try {
      console.log('Token expired, refreshing before request...');
      await authAPI.refreshToken();
      token = TokenManager.getAccessToken();
    } catch (error) {
      console.error('Token refresh failed:', error);
      await authAPI.logout();
      throw new Error('Authentication failed. Please login again.');
    }
  }
  
  // Make request with fresh token
  return makeRequest(endpoint, options);
};

// Initialize API with automatic token refresh
if (typeof window !== 'undefined') {
  // Setup token refresh on page load
  setupTokenRefresh();
  
  // Handle visibility change to refresh tokens when user returns
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      const token = TokenManager.getAccessToken();
      if (token && TokenManager.isTokenExpired(token)) {
        authAPI.refreshToken().catch(() => {
          console.warn('Token refresh failed on visibility change');
        });
      }
    }
  });
}

// Export default api object
export default api;