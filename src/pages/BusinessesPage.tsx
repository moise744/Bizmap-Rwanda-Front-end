import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, Filter, MapPin, Star, Clock, Phone, Globe, Heart, ExternalLink } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { businessAPI } from '../lib/api';
import { Business, BusinessCategory } from '../lib/types';
import { toast } from 'sonner';

const BusinessesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [categories, setCategories] = useState<BusinessCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [selectedProvince, setSelectedProvince] = useState(searchParams.get('province') || 'all');
  const [selectedDistrict, setSelectedDistrict] = useState(searchParams.get('district') || 'all');
  const [priceRange, setPriceRange] = useState(searchParams.get('price_range') || 'all');
  const [sortBy, setSortBy] = useState(searchParams.get('ordering') || 'business_name');
  const [showFilters, setShowFilters] = useState(false);

  const provinces = ['Kigali', 'Southern Province', 'Northern Province', 'Eastern Province', 'Western Province'];
  const priceRanges = [
    { value: 'budget', label: 'Budget ($)' },
    { value: 'moderate', label: 'Moderate ($$)' },
    { value: 'premium', label: 'Premium ($$$)' },
    { value: 'luxury', label: 'Luxury ($$$$)' }
  ];

  useEffect(() => {
    loadData();
  }, [searchQuery, selectedCategory, selectedProvince, selectedDistrict, priceRange, sortBy]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Try to load categories from API, fallback to mock data
      try {
        const categoriesResponse = await businessAPI.getCategories();
        if (Array.isArray(categoriesResponse)) {
          setCategories(categoriesResponse);
        }
      } catch (error) {
        // console.warn('API not available, using mock categories');
        const mockCategories = [
          { id: 1, category_id: 'restaurants', name: 'Food & Dining' },
          { id: 2, category_id: 'hotels', name: 'Hotels' },
          { id: 3, category_id: 'healthcare', name: 'Healthcare' },
          { id: 4, category_id: 'automotive', name: 'Automotive' },
          { id: 5, category_id: 'education', name: 'Education' },
          { id: 6, category_id: 'services', name: 'Services' }
        ];
        setCategories(mockCategories as any);
      }

      // Try to load businesses from API, fallback to mock data
      try {
        const params: any = {};
        if (searchQuery) params.search = searchQuery;
        if (selectedCategory && selectedCategory !== 'all') params.business_category = selectedCategory;
        if (selectedProvince && selectedProvince !== 'all') params.province = selectedProvince;
        if (selectedDistrict && selectedDistrict !== 'all') params.district = selectedDistrict;
        if (priceRange && priceRange !== 'all') params.price_range = priceRange;
        if (sortBy) params.ordering = sortBy;

        const businessesResponse = await businessAPI.getBusinesses(params);
        if (businessesResponse?.results) {
          setBusinesses(businessesResponse.results);
        }
      } catch (error) {
        // console.warn('API not available, using mock businesses');
        const mockBusinesses = [
          {
            business_id: 'demo-1',
            business_name: 'Heaven Restaurant',
            category_name: 'Restaurant',
            short_summary: 'Exquisite dining with local and international cuisine',
            average_rating_score: '4.8',
            total_reviews_count: 127,
            district: 'Nyarugenge',
            province: 'Kigali',
            address: 'KN 4 Ave, Nyarugenge',
            phone_number: '+250788123456',
            price_range: 'moderate',
            verification_status: 'verified'
          },
          {
            business_id: 'demo-2',
            business_name: 'Kigali Marriott Hotel',
            category_name: 'Hotel',
            short_summary: 'Luxury hotel in the heart of Kigali with modern amenities',
            average_rating_score: '4.9',
            total_reviews_count: 89,
            district: 'Kigali City',
            province: 'Kigali',
            address: 'KN 3 Ave, Kigali',
            phone_number: '+250788654321',
            price_range: 'luxury',
            verification_status: 'verified'
          }
        ];
        setBusinesses(mockBusinesses as any);
      }
    } catch (error) {
      console.error('Error loading businesses:', error);
      // console.warn('Running in demo mode with mock data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateURL();
  };

  const updateURL = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (selectedCategory && selectedCategory !== 'all') params.set('category', selectedCategory);
    if (selectedProvince && selectedProvince !== 'all') params.set('province', selectedProvince);
    if (selectedDistrict && selectedDistrict !== 'all') params.set('district', selectedDistrict);
    if (priceRange && priceRange !== 'all') params.set('price_range', priceRange);
    if (sortBy && sortBy !== 'business_name') params.set('ordering', sortBy);
    
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedProvince('all');
    setSelectedDistrict('all');
    setPriceRange('all');
    setSortBy('business_name');
    setSearchParams({});
  };

  const BusinessCard: React.FC<{ business: Business }> = ({ business }) => {
    return (
      <Card 
        className="hover:shadow-lg transition-shadow cursor-pointer"
        onClick={() => navigate(`/business/${business.business_id}`)}
      >
        <CardContent className="p-0">
          <div className="relative">
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1635249475387-6230016cf06c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBidXNpbmVzcyUyMGRpc2NvdmVyeSUyMGhlcm8lMjBpbWFnZXxlbnwxfHx8fDE3NTgyNzg3NjR8MA&ixlib=rb-4.1.0&q=80&w=1080"
              alt={business.business_name}
              className="w-full h-48 object-cover rounded-t-lg"
            />
            <div className="absolute top-3 right-3">
              <Button
                variant="ghost"
                size="sm"
                className="bg-white/80 hover:bg-white"
                onClick={(e) => {
                  e.stopPropagation();
                  toast.info('Added to favorites');
                }}
              >
                <Heart className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div className="p-4">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-lg text-gray-900">{business.business_name}</h3>
              <Badge variant="outline" className="text-xs">
                {business.verification_status === 'verified' ? '✓ Verified' : 'Pending'}
              </Badge>
            </div>
            
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
              {business.short_summary}
            </p>
            
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">
                {business.average_rating_score || '4.5'}
              </span>
              <span className="text-sm text-gray-500">
                ({business.total_reviews_count || 0} reviews)
              </span>
            </div>
            
            <div className="flex items-center gap-1 text-gray-600 mb-2">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">{business.district}, {business.province}</span>
            </div>
            
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="secondary" className="text-xs">
                {business.category_name}
              </Badge>
              <Badge variant="outline" className="text-xs capitalize">
                {business.price_range}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                {business.phone_number && (
                  <div className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    <span className="text-xs">Call</span>
                  </div>
                )}
                {business.website_url && (
                  <div className="flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    <span className="text-xs">Website</span>
                  </div>
                )}
              </div>
              
              <Button size="sm" className="bg-[#0D80F2] hover:bg-blue-700">
                View Details
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Discover Businesses</h1>
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex gap-3 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search businesses, services, or locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit" className="bg-[#0D80F2] hover:bg-blue-700">
              Search
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </form>
          
          {/* Quick Stats */}
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>{businesses.length} businesses found</span>
            {searchQuery && <span>for "{searchQuery}"</span>}
            {selectedCategory && <span>in {selectedCategory}</span>}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Filters Sidebar */}
          <div className={`${showFilters ? 'block' : 'hidden'} lg:block w-full lg:w-80 space-y-6`}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Filters</span>
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Clear All
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Category Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Category</label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All categories</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.category_id} value={category.category_id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Location Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Province</label>
                  <Select value={selectedProvince} onValueChange={setSelectedProvince}>
                    <SelectTrigger>
                      <SelectValue placeholder="All provinces" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All provinces</SelectItem>
                      {provinces.map((province) => (
                        <SelectItem key={province} value={province}>
                          {province}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Price Range Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Price Range</label>
                  <Select value={priceRange} onValueChange={setPriceRange}>
                    <SelectTrigger>
                      <SelectValue placeholder="All price ranges" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All price ranges</SelectItem>
                      {priceRanges.map((range) => (
                        <SelectItem key={range.value} value={range.value}>
                          {range.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Amenities */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Amenities</label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="delivery" />
                      <label htmlFor="delivery" className="text-sm">Delivery Available</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="wheelchair" />
                      <label htmlFor="wheelchair" className="text-sm">Wheelchair Accessible</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="outdoor" />
                      <label htmlFor="outdoor" className="text-sm">Outdoor Seating</label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Sort Options */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">Sort by:</span>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="business_name">Name (A-Z)</SelectItem>
                    <SelectItem value="-business_name">Name (Z-A)</SelectItem>
                    <SelectItem value="-average_rating_score">Highest Rated</SelectItem>
                    <SelectItem value="average_rating_score">Lowest Rated</SelectItem>
                    <SelectItem value="-created_at">Newest First</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Business Grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-0">
                      <div className="w-full h-48 bg-gray-300 rounded-t-lg"></div>
                      <div className="p-4 space-y-3">
                        <div className="w-3/4 h-6 bg-gray-300 rounded"></div>
                        <div className="w-full h-4 bg-gray-300 rounded"></div>
                        <div className="w-1/2 h-4 bg-gray-300 rounded"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : businesses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {businesses.map((business) => (
                  <BusinessCard key={business.business_id} business={business} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No businesses found</h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your search criteria or browse all businesses.
                </p>
                <Button onClick={clearFilters} variant="outline">
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessesPage;