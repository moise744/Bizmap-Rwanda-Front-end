# BusiMap Rwanda API Endpoints Documentation

This document outlines all the API endpoints that the React frontend expects from the Django backend. Use this as a reference for implementing the complete backend API.

## Base Configuration
- **Base URL**: `http://localhost:8000`
- **Authentication**: Bearer Token (JWT)
- **Content-Type**: `application/json`

## 🔐 Authentication Endpoints

### POST /api/auth/login/
**Description**: User login
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
**Response**:
```json
{
  "access_token": "jwt_token_here",
  "refresh_token": "refresh_token_here",
  "user": {
    "user_id": "uuid",
    "first_name": "John",
    "last_name": "Doe",
    "email": "user@example.com",
    "phone_number": "+250788123456",
    "profile_picture": "url",
    "location_province": "Kigali",
    "location_district": "Nyarugenge"
  }
}
```

### POST /api/auth/register/
**Description**: User registration
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "user@example.com",
  "password": "password123",
  "phone_number": "+250788123456"
}
```

### GET /api/auth/profile/
**Description**: Get current user profile (Protected)

### PUT /api/auth/profile/
**Description**: Update user profile (Protected)

### POST /api/auth/verify-phone/
**Description**: Verify phone number
```json
{
  "verification_code": "123456"
}
```

### POST /api/auth/password-reset/
**Description**: Request password reset
```json
{
  "email": "user@example.com"
}
```

### POST /api/auth/password-reset-confirm/
**Description**: Confirm password reset
```json
{
  "new_password": "newpassword123",
  "confirm_password": "newpassword123",
  "token": "reset_token"
}
```

## 🏢 Business Endpoints

### GET /api/businesses/categories/
**Description**: Get all business categories
**Response**:
```json
[
  {
    "category_id": "uuid",
    "name": "Restaurants",
    "name_kinyarwanda": "Amarestaurant",
    "name_french": "Restaurants",
    "description": "Food and dining establishments"
  }
]
```

### GET /api/businesses/
**Description**: Get businesses with filters
**Query Parameters**:
- `search`: Search query
- `business_category`: Category ID
- `province`: Province name
- `district`: District name
- `price_range`: low, medium, high
- `verification_status`: verified, unverified
- `ordering`: name, rating, created_at
- `page`: Page number

**Response**:
```json
{
  "count": 100,
  "next": "url_to_next_page",
  "previous": null,
  "results": [
    {
      "business_id": "uuid",
      "business_name": "Heaven Restaurant",
      "description": "Best local food in Kigali",
      "category_name": "Restaurant",
      "province": "Kigali",
      "district": "Nyarugenge",
      "sector": "Nyarugenge",
      "cell": "Gatsata",
      "address": "KN 4 Ave, Nyarugenge",
      "latitude": -1.9441,
      "longitude": 30.0619,
      "phone_number": "+250788123456",
      "email": "info@heavenrestaurant.com",
      "website": "https://heavenrestaurant.com",
      "average_rating_score": "4.8",
      "total_reviews": 150,
      "verification_status": "verified",
      "business_hours": {
        "monday": "08:00-22:00",
        "tuesday": "08:00-22:00"
      },
      "amenities": ["wifi", "parking", "air_conditioning"],
      "price_range": "medium",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### GET /api/businesses/nearby/
**Description**: Get nearby businesses
**Query Parameters**:
- `latitude`: User latitude
- `longitude`: User longitude  
- `radius`: Radius in kilometers (default: 5)
- `search`: Search query
- `ordering`: distance, rating, name
- `page`: Page number

### GET /api/businesses/{business_id}/
**Description**: Get detailed business information

### POST /api/businesses/create/
**Description**: Create new business (Protected)

### PUT /api/businesses/{business_id}/update/
**Description**: Update business (Protected, Owner only)

### PATCH /api/businesses/{business_id}/update/
**Description**: Partial update business (Protected, Owner only)

### POST /api/businesses/{business_id}/reviews/
**Description**: Create review for business (Protected)
```json
{
  "rating_score": 5,
  "review_text": "Excellent service and food!",
  "is_verified_purchase": true
}
```

## 🤖 AI & Intelligent Search Endpoints

### POST /api/ai/chat/
**Description**: AI conversation endpoint for natural language queries
```json
{
  "message": "Ndashaka kurya ariko sinzi aho narira",
  "conversation_id": "uuid_optional",
  "language": "rw", 
  "user_location": {
    "latitude": -1.9441,
    "longitude": 30.0619
  },
  "conversation_context": [
    {
      "role": "user",
      "content": "previous message"
    }
  ]
}
```
**Response**:
```json
{
  "response": "Eeehhh, urashaka kurya! Reka nkurebere amarestaurant...",
  "conversation_id": "uuid",
  "suggested_businesses": [
    {
      "business_id": "uuid",
      "business_name": "Heaven Restaurant",
      "match_score": 0.95,
      "reason": "High rating local restaurant"
    }
  ],
  "follow_up_suggestions": [
    "Ni ayahe mushobora kukwishimira?",
    "Waba ufite amoko y'ibiryo wishaka?"
  ]
}
```

### POST /api/ai/recommendations/
**Description**: Get AI-powered business recommendations
```json
{
  "user_preferences": {
    "categories": ["restaurant", "hotel"],
    "price_range": "medium",
    "rating_min": 4.0
  },
  "location": {
    "latitude": -1.9441,
    "longitude": 30.0619
  },
  "context": "looking for dinner with family"
}
```

### POST /api/ai/analyze-query/
**Description**: Analyze user query to understand intent
```json
{
  "query": "Imodoka yanje irapfuye nshaka gusana",
  "language": "rw",
  "user_context": {}
}
```
**Response**:
```json
{
  "intent": "car_repair_service",
  "entities": {
    "service_type": "car_repair",
    "urgency": "high",
    "location_mentioned": false
  },
  "suggested_categories": ["automotive", "car_repair"],
  "confidence": 0.92
}
```

### POST /api/ai/search-suggestions/
**Description**: Get intelligent search suggestions
```json
{
  "partial_query": "restaur",
  "language": "en",
  "category": "food_dining"
}
```

### POST /api/ai/detect-language/
**Description**: Detect language of user input
```json
{
  "text": "Ndashaka gusuzugura ubwoba"
}
```
**Response**:
```json
{
  "language": "rw",
  "confidence": 0.98,
  "supported_languages": ["rw", "en", "fr"]
}
```

### POST /api/ai/translate/
**Description**: Translate text between supported languages
```json
{
  "text": "Ndashaka kurya",
  "source_language": "rw",
  "target_language": "en"
}
```
**Response**:
```json
{
  "translated_text": "I want to eat",
  "source_language": "rw",
  "target_language": "en",
  "confidence": 0.95
}
```

### POST /api/ai/voice/speech-to-text/
**Description**: Convert voice input to text with language detection
```json
{
  "audio_data": "base64_encoded_audio",
  "audio_format": "webm",
  "language_hint": "rw",
  "user_context": {}
}
```
**Response**:
```json
{
  "transcribed_text": "Ndashaka kurya restaurant nziza",
  "detected_language": "rw",
  "confidence": 0.92,
  "alternative_transcriptions": [
    "Ndashaka kurira restaurant nziza",
    "Ndashaka kugura restaurant nziza"
  ]
}
```

### POST /api/ai/voice/text-to-speech/
**Description**: Convert text to speech in specified language
```json
{
  "text": "Eeehhh, urashaka kurya! Reka nkurebere amarestaurant...",
  "language": "rw",
  "voice_gender": "female",
  "speed": 1.0,
  "emotion": "friendly"
}
```
**Response**:
```json
{
  "audio_url": "https://api.example.com/audio/generated_speech.mp3",
  "audio_data": "base64_encoded_audio",
  "duration_seconds": 5.2,
  "voice_used": "rw-female-friendly"
}
```

### POST /api/ai/conversation/context/
**Description**: Manage conversation context and memory
```json
{
  "conversation_id": "uuid",
  "user_id": "uuid",
  "action": "update",
  "context_data": {
    "current_intent": "food_search",
    "user_preferences": {"cuisine": "local", "price_range": "medium"},
    "conversation_state": "searching_restaurants",
    "mentioned_entities": ["restaurant", "Kigali", "traditional_food"]
  }
}
```
**Response**:
```json
{
  "conversation_id": "uuid",
  "context_updated": true,
  "next_suggested_actions": ["show_restaurant_list", "ask_location_preference"],
  "context_summary": "User is looking for traditional restaurants in Kigali"
}
```

### POST /api/ai/emotion/detect/
**Description**: Detect emotion and urgency in user messages
```json
{
  "text": "Imodoka yanje yagize ikibazo sinzi aho ndi!",
  "language": "rw",
  "context": "transportation"
}
```
**Response**:
```json
{
  "primary_emotion": "distress",
  "urgency_level": "high",
  "sentiment_score": -0.8,
  "emotions_detected": {
    "distress": 0.9,
    "confusion": 0.7,
    "urgency": 0.85
  },
  "suggested_response_tone": "reassuring_helpful"
}
```

### POST /api/ai/intent/analyze-advanced/
**Description**: Advanced intent analysis with context awareness
```json
{
  "text": "Ejo nariye Heaven Restaurant ariko uyu munsi nshaka kintu gishya",
  "language": "rw",
  "conversation_history": [...],
  "user_profile": {...},
  "location": {"latitude": -1.9441, "longitude": 30.0619}
}
```
**Response**:
```json
{
  "primary_intent": "restaurant_recommendation",
  "sub_intents": ["new_experience", "food_variety"],
  "entities": {
    "previous_restaurant": "Heaven Restaurant",
    "time_reference": "yesterday",
    "preference": "something_new"
  },
  "confidence": 0.94,
  "suggested_actions": [
    "recommend_different_restaurants",
    "ask_cuisine_preference",
    "show_nearby_alternatives"
  ],
  "business_categories": ["restaurant", "cafe", "fast_food"],
  "exclude_businesses": ["heaven_restaurant"]
}
```

### POST /api/ai/recommendations/smart/
**Description**: Context-aware smart business recommendations
```json
{
  "user_intent": "food_search",
  "user_profile": {...},
  "location": {"latitude": -1.9441, "longitude": 30.0619},
  "conversation_context": [...],
  "preferences": {
    "exclude_previous": true,
    "price_range": "medium",
    "distance_max": 2.0
  },
  "emotional_state": "excited",
  "time_context": "lunch_time"
}
```
**Response**:
```json
{
  "recommendations": [
    {
      "business_id": "uuid",
      "business_name": "Meze Fresh",
      "match_score": 0.96,
      "match_reasons": [
        "New restaurant (not visited before)",
        "Within preferred price range",
        "Great lunch options",
        "0.5km from location"
      ],
      "estimated_wait_time": "15 minutes",
      "current_availability": "open",
      "special_offers": ["Lunch combo available"]
    }
  ],
  "explanation": "Based on your preference for something new and your location, here are fresh options!",
  "follow_up_questions": [
    "Would you like me to check if they have tables available?",
    "Should I show you their menu?"
  ]
}
```

### POST /api/ai/conversation/memory/
**Description**: Long-term conversation memory management
```json
{
  "user_id": "uuid",
  "action": "store",
  "memory_data": {
    "user_preferences": {
      "favorite_cuisines": ["rwandan", "indian"],
      "avoided_foods": ["seafood"],
      "preferred_price_range": "medium",
      "transportation_mode": "motorcycle"
    },
    "past_experiences": [
      {
        "business_id": "uuid",
        "experience_type": "positive",
        "visit_date": "2024-01-15",
        "notes": "Loved the traditional food"
      }
    ],
    "behavioral_patterns": {
      "typical_search_times": ["12:00-13:00", "18:00-20:00"],
      "preferred_locations": ["Nyarugenge", "Kimihurura"],
      "conversation_style": "friendly_informal"
    }
  }
}
```
**Response**:
```json
{
  "memory_stored": true,
  "user_profile_updated": true,
  "learning_insights": [
    "User prefers traditional food",
    "Motorcycle is primary transport",
    "Lunch searches common"
  ]
}
```

### GET /api/ai/business-insights/
**Description**: Get AI-powered business insights (Protected, Business Owners)

### GET /api/ai/market-trends/
**Description**: Get market trends and analytics

## 🔄 Real-time Communication Endpoints

### WebSocket /ws/ai/chat/{user_id}/
**Description**: Real-time bidirectional communication for AI chat
**Connection**: WebSocket protocol
**Messages**:

#### Client → Server:
```json
{
  "type": "user_message",
  "message": "Ndashaka kurya",
  "language": "rw",
  "timestamp": "2024-01-15T12:30:00Z",
  "message_id": "uuid"
}
```

#### Server → Client:
```json
{
  "type": "ai_response",
  "message": "Eeehhh, urashaka kurya! Reka nkurebere...",
  "suggestions": [...],
  "businesses": [...],
  "timestamp": "2024-01-15T12:30:05Z",
  "message_id": "uuid",
  "response_to": "user_message_uuid"
}
```

#### Typing Indicators:
```json
{
  "type": "typing_status",
  "is_typing": true,
  "estimated_response_time": 3
}
```

#### Voice Processing:
```json
{
  "type": "voice_processing",
  "status": "transcribing|processing|generating_response",
  "progress": 0.65
}
```

### WebSocket /ws/business/live-updates/
**Description**: Real-time business availability and updates
**Messages**:
```json
{
  "type": "business_update",
  "business_id": "uuid",
  "updates": {
    "availability": "busy|available|closed",
    "wait_time": 15,
    "special_offers": ["Happy hour 2-5 PM"]
  }
}
```

## 🔍 Search Endpoints

### POST /api/search/intelligent/
**Description**: Advanced intelligent search with AI
```json
{
  "query": "Good place to eat with family in Kigali",
  "language": "en",
  "location": {
    "latitude": -1.9441,
    "longitude": 30.0619
  },
  "filters": {
    "price_range": "medium",
    "rating_min": 4.0,
    "amenities": ["parking", "family_friendly"]
  },
  "sort_by": "relevance",
  "page": 1
}
```

### POST /api/search/quick-search/
**Description**: Quick search for autocomplete
```json
{
  "query": "rest",
  "limit": 5
}
```

### POST /api/search/advanced-search/
**Description**: Advanced search with detailed filters

### GET /api/search/suggestions/
**Description**: Get search suggestions
**Query Parameters**: `query`, `language`

### GET /api/search/autocomplete/
**Description**: Autocomplete suggestions
**Query Parameters**: `query`, `limit`

### GET /api/search/history/
**Description**: Get user search history (Protected)

### POST /api/search/save-search/
**Description**: Save user search (Protected)
```json
{
  "query": "restaurants in Kigali",
  "search_results": {},
  "search_metadata": {}
}
```

### GET /api/search/popular-searches/
**Description**: Get popular searches
**Query Parameters**: `time_period`, `language`

### POST /api/search/nearby/
**Description**: Location-based search
```json
{
  "latitude": -1.9441,
  "longitude": 30.0619,
  "query": "pharmacy",
  "radius_km": 2,
  "category": "healthcare",
  "page": 1
}
```

### POST /api/search/radius-search/
**Description**: Search within specific radius

### GET /api/search/by-category/
**Description**: Search businesses by category
**Query Parameters**: `category`, `location`, `sort_by`, `page`

### GET /api/search/filters/
**Description**: Get available search filters

### GET /api/search/trending/
**Description**: Get trending searches
**Query Parameters**: `time_period`, `language`

### GET /api/search/search-stats/
**Description**: Get search statistics and analytics

## 📍 Advanced Location & Navigation Endpoints

### POST /api/location/intelligent-routing/
**Description**: AI-powered route optimization for Rwanda
```json
{
  "start_location": {
    "latitude": -1.9441,
    "longitude": 30.0619,
    "address": "Nyarugenge, Kigali"
  },
  "end_location": {
    "latitude": -1.9506,
    "longitude": 30.0588,
    "address": "Kimihurura, Kigali"
  },
  "transport_mode": "motorcycle|car|walking|public_transport",
  "preferences": {
    "avoid_traffic": true,
    "prefer_main_roads": false,
    "consider_safety": true
  },
  "time_preference": "fastest|cheapest|safest"
}
```
**Response**:
```json
{
  "recommended_route": {
    "duration_minutes": 15,
    "distance_km": 3.2,
    "estimated_cost": "800 RWF",
    "safety_score": 0.9,
    "route_instructions": [
      {
        "step": 1,
        "instruction": "Head north on KN 4 Ave",
        "instruction_kinyarwanda": "Jya mu majyaruguru ku KN 4 Ave",
        "distance": "200m",
        "duration": "1 min"
      }
    ],
    "alternative_routes": [...],
    "live_traffic_data": {
      "current_traffic": "moderate",
      "estimated_delay": "2-5 minutes"
    }
  }
}
```

### GET /api/location/rwanda-places/
**Description**: Get Rwanda administrative places with local names
**Query Parameters**: `province`, `district`, `sector`, `cell`, `search`
**Response**:
```json
{
  "places": [
    {
      "id": "uuid",
      "name": "Nyarugenge",
      "name_kinyarwanda": "Nyarugenge",
      "type": "district",
      "province": "Kigali",
      "coordinates": {
        "latitude": -1.9441,
        "longitude": 30.0619
      },
      "boundaries": [...],
      "local_landmarks": [
        "Kigali Convention Centre",
        "Centenary House"
      ]
    }
  ]
}
```

### POST /api/location/emergency-services/
**Description**: Find emergency services based on location and emergency type
```json
{
  "location": {
    "latitude": -1.9441,
    "longitude": 30.0619
  },
  "emergency_type": "medical|police|fire|car_breakdown|accident",
  "urgency_level": "low|medium|high|critical"
}
```
**Response**:
```json
{
  "emergency_contacts": [
    {
      "service_name": "Rwanda National Police",
      "phone": "112",
      "type": "emergency_hotline"
    },
    {
      "service_name": "King Faisal Hospital Emergency",
      "phone": "+250788385000",
      "distance_km": 2.1,
      "estimated_arrival": "8 minutes",
      "availability": "24/7"
    }
  ],
  "instructions": [
    "Call 112 immediately for police assistance",
    "Stay calm and describe your exact location",
    "If possible, use landmarks to help responders find you"
  ],
  "instructions_kinyarwanda": [
    "Hamagara 112 ako kanya kugira ngo abapolisi bagufashe",
    "Guma utuje kandi usubireko neza aho uri",
    "Niba bishoboka, koresha ibintu bizwi kugira ngo abaguha ubufasha babashobore kubona"
  ]
}
```

## 🚗 Transportation & Mobility Endpoints

### GET /api/transport/moto-taxis/nearby/
**Description**: Find nearby motorcycle taxis (motos)
**Query Parameters**: `latitude`, `longitude`, `radius_km`
**Response**:
```json
{
  "available_motos": [
    {
      "driver_id": "uuid",
      "driver_name": "Jean Baptiste",
      "phone": "+250788123456",
      "distance_meters": 150,
      "estimated_arrival": "3 minutes",
      "rating": 4.8,
      "helmet_available": true,
      "estimated_fare": "800 RWF"
    }
  ],
  "average_wait_time": "5 minutes",
  "fare_estimate": {
    "min": 500,
    "max": 1000,
    "currency": "RWF"
  }
}
```

### POST /api/transport/fare-calculator/
**Description**: Calculate transport fares for different modes
```json
{
  "start_location": {...},
  "end_location": {...},
  "transport_modes": ["moto", "taxi", "bus"]
}
```
**Response**:
```json
{
  "fare_estimates": {
    "moto": {
      "estimated_fare": 800,
      "duration": "15 minutes",
      "distance": "3.2 km"
    },
    "taxi": {
      "estimated_fare": 5000,
      "duration": "12 minutes",
      "distance": "3.2 km"
    },
    "bus": {
      "estimated_fare": 300,
      "duration": "25 minutes",
      "walking_distance": "400m to bus stop"
    }
  }
}
```

## 💰 Payment & Financial Endpoints

### POST /api/payments/mobile-money/initiate/
**Description**: Initiate mobile money payment
```json
{
  "payment_method": "mtn_momo|airtel_money|tigo_cash",
  "phone_number": "+250788123456",
  "amount": 5000,
  "currency": "RWF",
  "transaction_type": "business_payment|service_booking",
  "business_id": "uuid",
  "description": "Payment for restaurant bill"
}
```
**Response**:
```json
{
  "transaction_id": "uuid",
  "status": "initiated",
  "payment_reference": "REF123456789",
  "instructions": "Dial *182# and follow prompts to complete payment",
  "instructions_kinyarwanda": "Kanda *182# ukurikize amabwiriza kugira ngo urangize kwishyura",
  "expires_at": "2024-01-15T12:45:00Z"
}
```

### GET /api/payments/transaction-status/{transaction_id}/
**Description**: Check payment transaction status
**Response**:
```json
{
  "transaction_id": "uuid",
  "status": "pending|completed|failed|expired",
  "amount": 5000,
  "currency": "RWF",
  "payment_time": "2024-01-15T12:35:00Z",
  "failure_reason": "insufficient_funds"
}
```

## 📊 Analytics Endpoints

### GET /api/analytics/business-performance/
**Description**: Get business performance analytics (Protected)
**Query Parameters**: `business_id`, `time_period`
**Response**:
```json
{
  "views": 1250,
  "clicks": 89,
  "reviews": 23,
  "rating_trend": [4.2, 4.5, 4.8],
  "popular_times": {
    "monday": [12, 13, 18, 19],
    "tuesday": [12, 13, 18, 19]
  },
  "search_appearances": 450,
  "conversion_rate": 0.071
}
```

## 📊 Advanced Analytics & Intelligence Endpoints

### GET /api/analytics/market-intelligence/
**Description**: Get comprehensive market intelligence for businesses
**Query Parameters**: `business_category`, `location`, `time_period`
**Response**:
```json
{
  "market_overview": {
    "total_businesses": 1250,
    "category_growth": 0.15,
    "market_saturation": "medium",
    "competition_level": 0.7
  },
  "customer_behavior": {
    "peak_search_times": ["12:00-13:00", "18:00-20:00"],
    "popular_search_terms": ["good food", "affordable", "near me"],
    "seasonal_trends": {
      "high_season": ["December", "July"],
      "low_season": ["February", "May"]
    }
  },
  "pricing_insights": {
    "average_price_range": "medium",
    "price_sensitivity": 0.8,
    "recommended_pricing": {
      "min": 2000,
      "max": 8000,
      "optimal": 4500
    }
  },
  "opportunity_analysis": {
    "underserved_areas": ["Gasabo District", "Rwamagana"],
    "emerging_trends": ["healthy eating", "quick service"],
    "recommended_improvements": [
      "Add delivery service",
      "Extend operating hours",
      "Improve online presence"
    ]
  }
}
```

### POST /api/analytics/customer-insights/
**Description**: Get AI-powered customer insights
```json
{
  "business_id": "uuid",
  "analysis_type": "behavior|preferences|satisfaction|demographics",
  "time_period": "7d|30d|90d|1y"
}
```
**Response**:
```json
{
  "customer_segments": [
    {
      "segment_name": "Young Professionals",
      "percentage": 45,
      "characteristics": {
        "age_range": "25-35",
        "income_level": "medium-high",
        "visit_frequency": "2-3 times per week",
        "preferred_times": ["lunch", "evening"]
      },
      "preferences": ["quick service", "healthy options", "wifi"],
      "spending_pattern": {
        "average_spend": 4500,
        "price_sensitivity": "medium"
      }
    }
  ],
  "satisfaction_metrics": {
    "overall_satisfaction": 4.2,
    "service_satisfaction": 4.5,
    "value_satisfaction": 3.8,
    "improvement_areas": ["waiting time", "pricing"]
  },
  "predictive_insights": {
    "growth_potential": 0.85,
    "churn_risk": 0.15,
    "revenue_forecast": {
      "next_month": 850000,
      "confidence": 0.9
    }
  }
}
```

### GET /api/analytics/competitive-analysis/
**Description**: Competitive analysis for business positioning
**Query Parameters**: `business_id`, `radius_km`, `category`
**Response**:
```json
{
  "competitors": [
    {
      "business_id": "uuid",
      "business_name": "Competitor Restaurant",
      "distance_km": 0.8,
      "rating": 4.3,
      "price_range": "medium",
      "strengths": ["location", "menu_variety"],
      "weaknesses": ["service_speed", "ambiance"],
      "market_share": 0.15
    }
  ],
  "competitive_position": {
    "market_rank": 3,
    "unique_advantages": ["traditional_cuisine", "authentic_atmosphere"],
    "areas_for_improvement": ["delivery_service", "online_presence"],
    "differentiation_score": 0.7
  },
  "recommendations": [
    "Focus on faster service to compete with nearby restaurants",
    "Highlight traditional cuisine as unique selling point",
    "Consider adding delivery to match competitor services"
  ]
}
```

### POST /api/analytics/revenue-optimization/
**Description**: AI-powered revenue optimization suggestions
```json
{
  "business_id": "uuid",
  "current_metrics": {
    "monthly_revenue": 500000,
    "customer_count": 200,
    "average_spend": 2500
  },
  "optimization_goals": ["increase_revenue", "reduce_costs", "improve_efficiency"]
}
```
**Response**:
```json
{
  "optimization_strategies": [
    {
      "strategy": "Dynamic Pricing",
      "description": "Adjust prices based on demand and time",
      "potential_impact": {
        "revenue_increase": 0.12,
        "implementation_difficulty": "medium"
      },
      "action_steps": [
        "Implement lunch hour premium pricing",
        "Offer early bird discounts",
        "Create weekend special pricing"
      ]
    }
  ],
  "predicted_outcomes": {
    "revenue_increase": "15-20%",
    "customer_satisfaction_impact": "minimal",
    "implementation_timeline": "2-4 weeks"
  }
}
```

## 🎯 Marketing & Promotion Endpoints

### POST /api/marketing/campaign-suggestions/
**Description**: AI-generated marketing campaign suggestions
```json
{
  "business_id": "uuid",
  "campaign_type": "social_media|local_advertising|promotions",
  "budget_range": "low|medium|high",
  "target_audience": "young_professionals|families|tourists"
}
```
**Response**:
```json
{
  "campaign_suggestions": [
    {
      "campaign_name": "Lunch Hour Special",
      "campaign_type": "promotion",
      "description": "Attract office workers with special lunch combos",
      "target_audience": "young_professionals",
      "estimated_budget": 50000,
      "expected_roi": 2.5,
      "duration": "30 days",
      "channels": ["social_media", "local_radio"],
      "content_suggestions": [
        "Quick lunch combos starting at 3000 RWF",
        "Free delivery for orders above 5000 RWF"
      ]
    }
  ],
  "optimal_timing": {
    "start_date": "2024-02-01",
    "peak_periods": ["12:00-14:00", "18:00-20:00"]
  }
}
```

### GET /api/marketing/social-trends/
**Description**: Current social media and marketing trends in Rwanda
**Response**:
```json
{
  "trending_topics": [
    {
      "topic": "healthy_eating",
      "trend_score": 0.9,
      "relevance_to_restaurants": "high",
      "suggested_content": [
        "Showcase fresh ingredients",
        "Highlight nutritional benefits"
      ]
    }
  ],
  "platform_insights": {
    "instagram": {
      "best_posting_times": ["12:00", "18:00", "20:00"],
      "popular_hashtags": ["#KigaliFoodie", "#RwandanCuisine"],
      "content_types": ["food_photos", "behind_scenes"]
    },
    "facebook": {
      "best_posting_times": ["14:00", "19:00"],
      "effective_ad_types": ["local_awareness", "event_promotion"]
    }
  }
}
```

## 📍 Location Data Structure
Rwanda uses a 4-level administrative system:
1. **Province**: Kigali, Eastern, Western, Northern, Southern
2. **District**: 30 districts total
3. **Sector**: Administrative sectors within districts  
4. **Cell**: Smallest administrative unit

Example location object:
```json
{
  "province": "Kigali",
  "district": "Nyarugenge", 
  "sector": "Nyarugenge",
  "cell": "Gatsata",
  "latitude": -1.9441,
  "longitude": 30.0619,
  "address": "KN 4 Ave, Nyarugenge"
}
```

## 🔄 Error Handling
All endpoints should return consistent error responses:

### 400 Bad Request
```json
{
  "error": "validation_error",
  "message": "Invalid input data",
  "details": {
    "email": ["This field is required"]
  }
}
```

### 401 Unauthorized
```json
{
  "error": "authentication_required",
  "message": "Authentication credentials were not provided"
}
```

### 403 Forbidden
```json
{
  "error": "permission_denied", 
  "message": "You do not have permission to perform this action"
}
```

### 404 Not Found
```json
{
  "error": "not_found",
  "message": "The requested resource was not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "server_error",
  "message": "An unexpected error occurred"
}
```

## 📝 Implementation Notes

1. **JWT Authentication**: Use JWT tokens for user authentication
2. **Pagination**: Use cursor-based pagination for better performance
3. **Rate Limiting**: Implement rate limiting for AI endpoints
4. **Caching**: Cache frequently accessed data like categories
5. **Search Indexing**: Use Elasticsearch or similar for advanced search
6. **Language Support**: Support Kinyarwanda (rw), English (en), French (fr)
7. **Business Verification**: Implement verification system for businesses
8. **Image Upload**: Support image uploads for business profiles
9. **Real-time Features**: Consider WebSocket for real-time chat features
10. **Analytics**: Track user behavior and search patterns

This documentation provides the complete API contract that the React frontend expects. Implement these endpoints in Django REST Framework with proper authentication, validation, and error handling.