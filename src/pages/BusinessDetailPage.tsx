import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Star, MapPin, Phone, Globe, Clock, Heart, Share2, 
  MessageCircle, Directions, Camera, Calendar, CheckCircle, 
  ExternalLink, Mail, Navigation
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Textarea } from '../components/ui/textarea';
import { Input } from '../components/ui/input';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { businessAPI } from '../lib/api';
import { Business, BusinessReview } from '../lib/types';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';

const BusinessDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating_score: 5,
    review_text: '',
    is_verified_purchase: false
  });

  useEffect(() => {
    if (id) {
      loadBusinessDetail();
    }
  }, [id]);

  const loadBusinessDetail = async () => {
    try {
      setLoading(true);
      const response = await businessAPI.getBusinessDetail(id!);
      setBusiness(response);
    } catch (error) {
      console.error('Error loading business:', error);
      toast.error('Failed to load business details');
    } finally {
      setLoading(false);
    }
  };

  const handleAddReview = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to add a review');
      navigate('/login');
      return;
    }

    try {
      await businessAPI.createReview(id!, reviewForm);
      toast.success('Review added successfully!');
      setShowReviewForm(false);
      setReviewForm({ rating_score: 5, review_text: '', is_verified_purchase: false });
      loadBusinessDetail(); // Reload to get updated reviews
    } catch (error) {
      console.error('Error adding review:', error);
      toast.error('Failed to add review');
    }
  };

  const handleFavorite = () => {
    if (!isAuthenticated) {
      toast.error('Please login to add to favorites');
      navigate('/login');
      return;
    }
    
    setIsFavorite(!isFavorite);
    toast.success(isFavorite ? 'Removed from favorites' : 'Added to favorites');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: business?.business_name,
        text: business?.short_summary,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    }
  };

  const handleDirections = () => {
    if (business?.latitude && business?.longitude) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${business.latitude},${business.longitude}`;
      window.open(url, '_blank');
    }
  };

  const getOperatingStatus = () => {
    const now = new Date();
    const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const currentDay = dayNames[now.getDay()]; // Get the day name (e.g., 'mon', 'tue')
    const currentTime = now.getHours() * 100 + now.getMinutes(); // e.g., 1430 for 2:30 PM

    if (business?.operating_schedule && business.operating_schedule[currentDay]) {
      const schedule = business.operating_schedule[currentDay];
      if (schedule === 'closed' || !schedule) {
        return { status: 'closed', text: 'Closed today' };
      }
      
      // Parse schedule like "08:00-22:00"
      const [openTime, closeTime] = schedule.split('-');
      if (!openTime || !closeTime) {
        return { status: 'unknown', text: 'Hours not available' };
      }
      
      const openMinutes = parseInt(openTime.replace(':', ''));
      const closeMinutes = parseInt(closeTime.replace(':', ''));
      
      if (currentTime >= openMinutes && currentTime <= closeMinutes) {
        return { status: 'open', text: `Open until ${closeTime}` };
      } else {
        return { status: 'closed', text: `Closed • Opens at ${openTime}` };
      }
    }
    
    return { status: 'unknown', text: 'Hours not available' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 animate-pulse">
        <div className="w-full h-64 bg-gray-300"></div>
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
          <div className="w-3/4 h-8 bg-gray-300 rounded"></div>
          <div className="w-1/2 h-6 bg-gray-300 rounded"></div>
          <div className="w-full h-32 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Business not found</h2>
          <p className="text-gray-600 mb-4">The business you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/businesses')}>
            Browse All Businesses
          </Button>
        </div>
      </div>
    );
  }

  const operatingStatus = getOperatingStatus();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Image */}
      <div className="relative h-64 md:h-96">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1635249475387-6230016cf06c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBidXNpbmVzcyUyMGRpc2NvdmVyeSUyMGhlcm8lMjBpbWFnZXxlbnwxfHx8fDE3NTgyNzg3NjR8MA&ixlib=rb-4.1.0&q=80&w=1080"
          alt={business.business_name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-30"></div>
        
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-4 left-4 bg-white/80 hover:bg-white"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {/* Action Buttons */}
        <div className="absolute top-4 right-4 flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="bg-white/80 hover:bg-white"
            onClick={handleShare}
          >
            <Share2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`bg-white/80 hover:bg-white ${isFavorite ? 'text-red-500' : ''}`}
            onClick={handleFavorite}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Business Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{business.business_name}</h1>
                {business.verification_status === 'verified' && (
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{business.average_rating_score || '4.5'}</span>
                  <span className="text-gray-600">({business.total_reviews_count || 0} reviews)</span>
                </div>
                <Badge variant="outline">{business.category_name}</Badge>
                <Badge variant="outline" className="capitalize">{business.price_range}</Badge>
              </div>

              <div className="flex items-center gap-4 text-gray-600 mb-4">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{business.address}, {business.district}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span className={operatingStatus.status === 'open' ? 'text-green-600' : 'text-red-600'}>
                    {operatingStatus.text}
                  </span>
                </div>
              </div>

              <p className="text-gray-700 mb-4">{business.short_summary}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            {business.phone_number && (
              <Button className="bg-[#0D80F2] hover:bg-blue-700">
                <Phone className="w-4 h-4 mr-2" />
                Call Now
              </Button>
            )}
            <Button variant="outline" onClick={handleDirections}>
              <Navigation className="w-4 h-4 mr-2" />
              Directions
            </Button>
            {business.website_url && (
              <Button variant="outline" onClick={() => window.open(business.website_url, '_blank')}>
                <ExternalLink className="w-4 h-4 mr-2" />
                Website
              </Button>
            )}
            <Button variant="outline" onClick={() => navigate('/chat')}>
              <MessageCircle className="w-4 h-4 mr-2" />
              Ask AI
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="photos">Photos</TabsTrigger>
            <TabsTrigger value="hours">Hours</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">
                  {business.full_description}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {business.phone_number && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <span>{business.phone_number}</span>
                  </div>
                )}
                {business.email_address && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <span>{business.email_address}</span>
                  </div>
                )}
                {business.website_url && (
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-gray-400" />
                    <a href={business.website_url} target="_blank" rel="noopener noreferrer" 
                       className="text-blue-600 hover:underline">
                      Visit Website
                    </a>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <span>{business.address}, {business.district}, {business.province}</span>
                </div>
              </CardContent>
            </Card>

            {/* Amenities */}
            <Card>
              <CardHeader>
                <CardTitle>Amenities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {business.delivery_available && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>Delivery Available</span>
                    </div>
                  )}
                  {business.takeaway_available && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>Takeaway</span>
                    </div>
                  )}
                  {business.outdoor_seating && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>Outdoor Seating</span>
                    </div>
                  )}
                  {business.wheelchair_accessible && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>Wheelchair Accessible</span>
                    </div>
                  )}
                  {business.accepts_reservations && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>Accepts Reservations</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">Customer Reviews</h3>
              <Button onClick={() => setShowReviewForm(!showReviewForm)}>
                Write a Review
              </Button>
            </div>

            {/* Review Form */}
            {showReviewForm && (
              <Card>
                <CardHeader>
                  <CardTitle>Write a Review</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Rating</label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setReviewForm({ ...reviewForm, rating_score: star })}
                          className={`text-2xl ${
                            star <= reviewForm.rating_score ? 'text-yellow-400' : 'text-gray-300'
                          }`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Your Review</label>
                    <Textarea
                      placeholder="Share your experience..."
                      value={reviewForm.review_text}
                      onChange={(e) => setReviewForm({ ...reviewForm, review_text: e.target.value })}
                      rows={4}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="verified"
                        checked={reviewForm.is_verified_purchase}
                        onChange={(e) => setReviewForm({ ...reviewForm, is_verified_purchase: e.target.checked })}
                      />
                      <label htmlFor="verified" className="text-sm">I visited this business</label>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setShowReviewForm(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddReview} disabled={!reviewForm.review_text.trim()}>
                        Submit Review
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reviews List */}
            <div className="space-y-4">
              {business.reviews && business.reviews.length > 0 ? (
                business.reviews.map((review, index) => (
                  <Card key={review.id || `review-${index}`}>
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <Avatar>
                          <AvatarFallback>
                            {review.user_name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium">{review.user_name || 'Anonymous'}</span>
                            <div className="flex gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={`${review.id || index}-star-${i}`}
                                  className={`w-4 h-4 ${
                                    i < review.rating_score
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            {review.is_verified_purchase && (
                              <Badge variant="outline" className="text-xs">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Verified Visit
                              </Badge>
                            )}
                          </div>
                          <p className="text-gray-700 mb-2">{review.review_text}</p>
                          <span className="text-sm text-gray-500">
                            {new Date(review.created_at!).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600">No reviews yet. Be the first to write one!</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Photos Tab */}
          <TabsContent value="photos">
            <div className="text-center py-8">
              <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No photos available yet.</p>
            </div>
          </TabsContent>

          {/* Hours Tab */}
          <TabsContent value="hours">
            <Card>
              <CardHeader>
                <CardTitle>Opening Hours</CardTitle>
              </CardHeader>
              <CardContent>
                {business.operating_schedule && Object.keys(business.operating_schedule).length > 0 ? (
                  <div className="space-y-2">
                    {Object.entries(business.operating_schedule).map(([day, hours]) => (
                      <div key={day} className="flex justify-between">
                        <span className="capitalize font-medium">{day}</span>
                        <span className={hours === 'closed' ? 'text-red-600' : 'text-gray-700'}>
                          {hours === 'closed' ? 'Closed' : hours}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">Operating hours not available.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default BusinessDetailPage;