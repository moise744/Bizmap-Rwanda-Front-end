import React, { useState } from 'react';
import { Star, MessageSquare, Calendar, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { useAuth } from '../contexts/AuthContext';

const ReviewsPage: React.FC = () => {
  const { user } = useAuth();
  const [reviews] = useState([
    {
      id: '1',
      businessName: 'Heaven Restaurant',
      rating: 5,
      reviewText: 'Excellent food and service. The local dishes were amazing and the staff was very friendly.',
      createdAt: '2024-01-15T10:30:00Z',
      businessId: 'BIZ-001'
    },
    {
      id: '2',
      businessName: 'Kigali Marriot Hotel',
      rating: 4,
      reviewText: 'Great hotel with modern amenities. The location is perfect and rooms are clean.',
      createdAt: '2024-01-10T14:20:00Z',
      businessId: 'BIZ-002'
    }
  ]);

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating
            ? 'fill-yellow-400 text-yellow-400'
            : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center gap-3 mb-8">
          <MessageSquare className="w-8 h-8 text-gray-600" />
          <h1 className="text-3xl font-bold text-gray-900">My Reviews</h1>
        </div>

        {reviews.length > 0 ? (
          <div className="space-y-6">
            {reviews.map((review) => (
              <Card key={review.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback>
                        {user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900 mb-1">
                            {review.businessName}
                          </h3>
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1">
                              {renderStars(review.rating)}
                            </div>
                            <span className="text-sm text-gray-600">
                              {review.rating} out of 5 stars
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline">
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                      
                      <p className="text-gray-700 mb-3 leading-relaxed">
                        {review.reviewText}
                      </p>
                      
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          Verified Review
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
            <p className="text-gray-600 mb-4">Share your experiences with businesses you've visited</p>
            <Button className="bg-[#0D80F2] hover:bg-blue-700">
              Write Your First Review
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewsPage;