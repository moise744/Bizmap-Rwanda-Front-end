import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, Filter, MapPin, Star, Sparkles, Clock, Phone, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { searchAPI, businessAPI, aiAPI } from '../lib/api';
import { Business } from '../lib/types';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';

const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    const initialQuery = searchParams.get('q');
    if (initialQuery) {
      setQuery(initialQuery);
      performSearch(initialQuery);
    }
    loadSearchHistory();
  }, []);

  useEffect(() => {
    if (query.length > 2) {
      loadSuggestions();
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [query]);

  const loadSuggestions = async () => {
    try {
      const response = await searchAPI.getSuggestions({ query });
      if (response.success && response.data) {
        setSuggestions(response.data.suggestions || []);
        setShowSuggestions(true);
      }
    } catch (error) {
      // console.warn('Suggestions API not available, using fallback');
      // Fallback suggestions
      const fallbackSuggestions = [
        'restaurants in Kigali',
        'hotels near me',
        'pharmacies open now',
        'car repair services',
        'shopping centers'
      ].filter(s => s.toLowerCase().includes(query.toLowerCase()));
      
      setSuggestions(fallbackSuggestions);
      if (fallbackSuggestions.length > 0) {
        setShowSuggestions(true);
      }
    }
  };

  const loadSearchHistory = () => {
    const history = localStorage.getItem('search_history');
    if (history) {
      setSearchHistory(JSON.parse(history).slice(0, 5));
    }
  };

  const saveToHistory = (searchQuery: string) => {
    const history = JSON.parse(localStorage.getItem('search_history') || '[]');
    const newHistory = [searchQuery, ...history.filter((item: string) => item !== searchQuery)].slice(0, 10);
    localStorage.setItem('search_history', JSON.stringify(newHistory));
    setSearchHistory(newHistory.slice(0, 5));
  };

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      setShowSuggestions(false);
      
      // Save to history
      saveToHistory(searchQuery.trim());
      
      // Update URL
      setSearchParams({ q: searchQuery.trim() });

      // Perform intelligent search
      const searchResponse = await searchAPI.intelligentSearch({
        query: searchQuery.trim(),
        language: 'en'
      });

      if (searchResponse.success && searchResponse.data) {
        setBusinesses(searchResponse.data.results || []);
        
        // If we have AI analysis, store it
        if (searchResponse.data.search_metadata?.ai_analysis) {
          setAiAnalysis(searchResponse.data.search_metadata.ai_analysis);
        }
      } else {
        // Fallback to regular business search
        const fallbackResponse = await businessAPI.getBusinesses({
          search: searchQuery.trim()
        });
        setBusinesses(fallbackResponse.results || []);
      }

      // Analyze query with AI for insights
      try {
        const analysisResponse = await aiAPI.analyzeQuery({
          query: searchQuery.trim(),
          language: 'en'
        });
        if (analysisResponse.success) {
          setAiAnalysis(analysisResponse.data);
        }
      } catch (error) {
        console.error('AI analysis failed:', error);
      }

    } catch (error) {
      // console.warn('Search API not available, using mock data');
      // Fallback to mock data when API is not available
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
        }
      ];
      setBusinesses(mockBusinesses as any);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(query);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    performSearch(suggestion);
  };

  const handleAIChat = () => {
    if (isAuthenticated) {
      navigate(`/chat?query=${encodeURIComponent(query)}`);
    } else {
      toast.info('Please login to use AI chat features.');
      navigate('/login');
    }
  };

  const BusinessCard: React.FC<{ business: Business }> = ({ business }) => (
    <Card 
      className="hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => navigate(`/business/${business.business_id}`)}
    >
      <CardContent className="p-0">
        <div className="flex gap-4 p-4">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1635249475387-6230016cf06c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBidXNpbmVzcyUyMGRpc2NvdmVyeSUyMGhlcm8lMjBpbWFnZXxlbnwxfHx8fDE3NTgyNzg3NjR8MA&ixlib=rb-4.1.0&q=80&w=1080"
            alt={business.business_name}
            className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
          />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-lg text-gray-900 truncate">
                {business.business_name}
              </h3>
              <Badge variant="outline" className="text-xs ml-2">
                {business.verification_status === 'verified' ? '✓ Verified' : 'Pending'}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">
                {business.average_rating_score || '4.5'}
              </span>
              <span className="text-sm text-gray-500">
                ({business.total_reviews_count || 0} reviews)
              </span>
              <Badge variant="secondary" className="text-xs ml-2">
                {business.category_name}
              </Badge>
            </div>
            
            <p className="text-gray-600 text-sm mb-2 line-clamp-2">
              {business.short_summary}
            </p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-gray-600">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">{business.district}, {business.province}</span>
              </div>
              
              <div className="flex items-center gap-2">
                {business.phone_number && (
                  <Button size="sm" variant="outline" onClick={(e) => {
                    e.stopPropagation();
                    window.location.href = `tel:${business.phone_number}`;
                  }}>
                    <Phone className="w-3 h-3 mr-1" />
                    Call
                  </Button>
                )}
                <Button size="sm" className="bg-[#0D80F2] hover:bg-blue-700">
                  View Details
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Header */}
      <div className="bg-white border-b sticky top-16 z-40">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <form onSubmit={handleSearch} className="relative">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search businesses, services, or ask a question..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setShowSuggestions(suggestions.length > 0)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  className="pl-10 h-12 text-lg"
                />
                
                {/* Search Suggestions */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 mt-1">
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 first:rounded-t-lg last:rounded-b-lg"
                      >
                        <div className="flex items-center gap-2">
                          <Search className="w-4 h-4 text-gray-400" />
                          <span>{suggestion}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <Button type="submit" className="bg-[#0D80F2] hover:bg-blue-700 h-12 px-6" disabled={loading}>
                {loading ? 'Searching...' : 'Search'}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                className="h-12 px-4 border-[#EBA910] text-[#EBA910] hover:bg-[#EBA910] hover:text-black"
                onClick={handleAIChat}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Ask AI
              </Button>
            </div>
          </form>

          {/* Search History */}
          {!query && searchHistory.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Recent searches:</p>
              <div className="flex flex-wrap gap-2">
                {searchHistory.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(item)}
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search Results Info */}
          {query && (
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  {loading ? 'Searching...' : `${businesses.length} results for "${query}"`}
                </span>
                {aiAnalysis && (
                  <Badge variant="outline" className="text-xs">
                    <Sparkles className="w-3 h-3 mr-1" />
                    AI Enhanced
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* AI Insights */}
        {aiAnalysis && (
          <Card className="mb-6 border-[#EBA910]/20 bg-gradient-to-r from-[#EBA910]/5 to-transparent">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-[#EBA910] mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900 mb-1">AI Understanding:</p>
                  <p className="text-sm text-gray-700 mb-2">
                    I found {businesses.length} businesses related to your search. 
                    {aiAnalysis.intent && ` It looks like you're looking for ${aiAnalysis.intent}.`}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-[#EBA910] text-[#EBA910] hover:bg-[#EBA910] hover:text-black"
                    onClick={handleAIChat}
                  >
                    Get AI Recommendations
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="w-24 h-24 bg-gray-300 rounded-lg"></div>
                    <div className="flex-1 space-y-3">
                      <div className="w-3/4 h-6 bg-gray-300 rounded"></div>
                      <div className="w-1/2 h-4 bg-gray-300 rounded"></div>
                      <div className="w-full h-4 bg-gray-300 rounded"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : businesses.length > 0 ? (
          <div className="space-y-4">
            {businesses.map((business) => (
              <BusinessCard key={business.business_id} business={business} />
            ))}
          </div>
        ) : query ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
            <p className="text-gray-600 mb-4">
              Try different keywords or browse all businesses.
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => navigate('/businesses')} variant="outline">
                Browse All Businesses
              </Button>
              <Button onClick={handleAIChat} className="bg-[#EBA910] hover:bg-yellow-600 text-black">
                <Sparkles className="w-4 h-4 mr-2" />
                Ask AI for Help
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Start your search</h3>
            <p className="text-gray-600 mb-4">
              Search for businesses, services, or ask our AI assistant for help.
            </p>
            <div className="flex flex-wrap gap-2 justify-center mb-6">
              {['restaurants', 'hotels', 'pharmacies', 'car repair', 'shopping'].map((term) => (
                <button
                  key={term}
                  onClick={() => handleSuggestionClick(term)}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-full hover:border-[#0D80F2] hover:text-[#0D80F2] transition-colors"
                >
                  {term}
                </button>
              ))}
            </div>
            <Button onClick={handleAIChat} className="bg-[#EBA910] hover:bg-yellow-600 text-black">
              <Sparkles className="w-4 h-4 mr-2" />
              Try AI Assistant
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;