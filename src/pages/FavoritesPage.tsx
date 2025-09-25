import React, { useState } from 'react';
import { Heart, Star, MapPin, Phone } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { useNavigate } from 'react-router-dom';

const FavoritesPage: React.FC = () => {
  const navigate = useNavigate();
  const [favorites] = useState([
    {
      id: '1',
      name: 'Heaven Restaurant',
      category: 'Restaurant',
      rating: 4.8,
      reviews: 127,
      district: 'Nyarugenge',
      province: 'Kigali',
      phone: '+250788123456',
      summary: 'Exquisite dining with local and international cuisine'
    }
  ]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center gap-3 mb-8">
          <Heart className="w-8 h-8 text-red-500 fill-current" />
          <h1 className="text-3xl font-bold text-gray-900">My Favorites</h1>
        </div>

        {favorites.length > 0 ? (
          <div className="space-y-4">
            {favorites.map((business) => (
              <Card key={business.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-0">
                  <div className="flex gap-4 p-4">
                    <ImageWithFallback
                      src="https://images.unsplash.com/photo-1635249475387-6230016cf06c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBidXNpbmVzcyUyMGRpc2NvdmVyeSUyMGhlcm8lMjBpbWFnZXxlbnwxfHx8fDE3NTgyNzg3NjR8MA&ixlib=rb-4.1.0&q=80&w=1080"
                      alt={business.name}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-lg text-gray-900">{business.name}</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-600"
                        >
                          <Heart className="w-4 h-4 fill-current" />
                        </Button>
                      </div>
                      
                      <div className="flex items-center gap-2 mb-2">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{business.rating}</span>
                        <span className="text-sm text-gray-500">({business.reviews} reviews)</span>
                        <Badge variant="secondary" className="text-xs">{business.category}</Badge>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-2">{business.summary}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-gray-600">
                          <MapPin className="w-4 h-4" />
                          <span className="text-sm">{business.district}, {business.province}</span>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Phone className="w-3 h-3 mr-1" />
                            Call
                          </Button>
                          <Button 
                            size="sm" 
                            className="bg-[#0D80F2] hover:bg-blue-700"
                            onClick={() => navigate(`/business/${business.id}`)}
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No favorites yet</h3>
            <p className="text-gray-600 mb-4">Start exploring and save your favorite businesses!</p>
            <Button onClick={() => navigate('/businesses')} className="bg-[#0D80F2] hover:bg-blue-700">
              Discover Businesses
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FavoritesPage;