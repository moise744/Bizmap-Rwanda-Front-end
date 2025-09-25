import React, { useState } from 'react';
import { History, Search, Clock, X } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useNavigate } from 'react-router-dom';

const HistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchHistory, setSearchHistory] = useState([
    {
      id: '1',
      query: 'restaurants in Kigali',
      timestamp: '2024-01-15T10:30:00Z',
      resultsCount: 25
    },
    {
      id: '2',
      query: 'hotels near airport',
      timestamp: '2024-01-14T16:45:00Z',
      resultsCount: 12
    },
    {
      id: '3',
      query: 'car repair services',
      timestamp: '2024-01-14T09:15:00Z',
      resultsCount: 8
    }
  ]);

  const removeFromHistory = (id: string) => {
    setSearchHistory(prev => prev.filter(item => item.id !== id));
  };

  const clearAllHistory = () => {
    setSearchHistory([]);
  };

  const repeatSearch = (query: string) => {
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <History className="w-8 h-8 text-gray-600" />
            <h1 className="text-3xl font-bold text-gray-900">Search History</h1>
          </div>
          {searchHistory.length > 0 && (
            <Button variant="outline" onClick={clearAllHistory}>
              Clear All
            </Button>
          )}
        </div>

        {searchHistory.length > 0 ? (
          <div className="space-y-3">
            {searchHistory.map((item) => (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <Search className="w-5 h-5 text-gray-400" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.query}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {item.resultsCount} results
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => repeatSearch(item.query)}
                      >
                        Search Again
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeFromHistory(item.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No search history</h3>
            <p className="text-gray-600 mb-4">Your search history will appear here</p>
            <Button onClick={() => navigate('/search')} className="bg-[#0D80F2] hover:bg-blue-700">
              Start Searching
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;