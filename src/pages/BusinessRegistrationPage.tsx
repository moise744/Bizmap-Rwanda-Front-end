import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building, MapPin, Phone, Globe, Clock, DollarSign, 
  Camera, Star, CheckCircle, AlertCircle, Navigation,
  ArrowRight, ArrowLeft, Save, Eye, EyeOff, Loader
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Alert, AlertDescription } from '../components/ui/alert';
import { businessAPI } from '../lib/api';
import { toast } from 'sonner';

const BusinessRegistrationPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
  
  // Business data state
  const [businessData, setBusinessData] = useState({
    // Essential fields (Step 1)
    business_name: '',
    business_name_kinyarwanda: '',
    description: '',
    category: '',
    phone_number: '',
    province: '',
    district: '',
    address: '',
    
    // Location coordinates (auto-filled)
    latitude: null,
    longitude: null,
    location_accuracy: null,
    
    // Optional fields that can be filled later
    secondary_phone: '',
    email: '',
    website: '',
    sector: '',
    cell: '',
    description_kinyarwanda: '',
    price_range: 'medium',
    amenities: [],
    services_offered: [],
    payment_methods: [],
    business_hours: {},
    search_keywords: []
  });

  // Form validation state
  const [errors, setErrors] = useState({});
  const [completionPercentage, setCompletionPercentage] = useState(0);

 const [categories, setCategories] = useState([]);

// Add this useEffect after your existing useEffects (around line 120)
useEffect(() => {
  const loadCategories = async () => {
    try {
      const response = await businessAPI.getCategories();
      setCategories(response.results || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
      // Fallback categories using proper names
      setCategories([
        { category_id: 'Restaurants & Food', name: 'Restaurants & Food' },
        { category_id: 'Hotels & Accommodation', name: 'Hotels & Accommodation' },
        { category_id: 'Healthcare Services', name: 'Healthcare Services' },
        { category_id: 'Automotive Services', name: 'Automotive Services' },
        { category_id: 'Retail & Shopping', name: 'Retail & Shopping' },
        { category_id: 'Professional Services', name: 'Professional Services' },
        { category_id: 'Education & Training', name: 'Education & Training' },
        { category_id: 'Entertainment & Recreation', name: 'Entertainment & Recreation' }
      ]);
    }
  };
  loadCategories();
}, []);

  const provinces = [
    'Kigali',
    'Southern Province',
    'Northern Province', 
    'Eastern Province',
    'Western Province'
  ];

  const districts = {
    'Kigali': ['Gasabo', 'Kicukiro', 'Nyarugenge'],
    'Southern Province': ['Huye', 'Nyanza', 'Ruhango', 'Muhanga', 'Kamonyi'],
    'Northern Province': ['Musanze', 'Gicumbi', 'Rulindo', 'Gakenke', 'Burera'],
    'Eastern Province': ['Rwamagana', 'Nyagatare', 'Gatsibo', 'Kayonza', 'Kirehe'],
    'Western Province': ['Rusizi', 'Nyamasheke', 'Rutsiro', 'Karongi', 'Ngororero']
  };

  const amenitiesList = [
    'WiFi Available', 'Parking', 'Air Conditioning', 'Wheelchair Accessible',
    'Outdoor Seating', 'Delivery Available', 'Takeaway', 'Credit Cards Accepted',
    'Mobile Money', 'Reservations', 'Pet Friendly', 'Family Friendly'
  ];

  const paymentMethodsList = [
    'Cash', 'Mobile Money', 'Credit Card', 'Bank Transfer', 'Visa', 'Mastercard'
  ];

  // Calculate completion percentage
  useEffect(() => {
    const calculateCompletion = () => {
      const allFields = [
        'business_name', 'description', 'category', 'phone_number', 
        'province', 'district', 'address', 'secondary_phone', 'email',
        'website', 'sector', 'cell', 'price_range'
      ];
      
      const filledFields = allFields.filter(field => businessData[field] && businessData[field] !== '');
      const extraFields = [
        businessData.amenities.length > 0,
        businessData.services_offered.length > 0,
        businessData.payment_methods.length > 0,
        Object.keys(businessData.business_hours).length > 0,
        businessData.latitude && businessData.longitude
      ].filter(Boolean);
      
      const total = allFields.length + 5;
      const completed = filledFields.length + extraFields.length;
      
      return Math.round((completed / total) * 100);
    };
    
    setCompletionPercentage(calculateCompletion());
  }, [businessData]);

  // Auto-detect location
  const detectLocation = async () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser');
      return;
    }

    setLocationLoading(true);
    setLocationError('');

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setBusinessData(prev => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          location_accuracy: position.coords.accuracy
        }));
        setLocationLoading(false);
        toast.success('Location detected successfully!');
      },
      (error) => {
        setLocationLoading(false);
        switch(error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Location access denied. Please enable location permissions.');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('Location information unavailable.');
            break;
          case error.TIMEOUT:
            setLocationError('Location request timed out.');
            break;
          default:
            setLocationError('An unknown error occurred while retrieving location.');
            break;
        }
        toast.error('Failed to detect location');
      },
      options
    );
  };

  // Validation functions
  const validateStep = (step) => {
    const newErrors = {};
    
    if (step === 1) {
      if (!businessData.business_name.trim()) {
        newErrors.business_name = 'Business name is required';
      }
      if (!businessData.description.trim()) {
        newErrors.description = 'Business description is required';
      }
      if (!businessData.category) {
        newErrors.category = 'Please select a category';
      }
      if (!businessData.phone_number.trim()) {
        newErrors.phone_number = 'Phone number is required';
      }
      if (!businessData.province) {
        newErrors.province = 'Please select a province';
      }
      if (!businessData.district) {
        newErrors.district = 'Please select a district';
      }
      if (!businessData.address.trim()) {
        newErrors.address = 'Address is required';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input changes
  const handleInputChange = (field, value) => {
    setBusinessData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  // Handle array fields (amenities, services, etc.)
  const toggleArrayField = (field, value) => {
    setBusinessData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  // Handle form submission
 // Handle form submission - Modified to save after step 1
const handleSubmit = async () => {
  if (!validateStep(currentStep)) return;
  
  setIsSubmitting(true);
  
  try {
    const response = await businessAPI.createBusinessProgressive(businessData);
    
    // Show success message based on completion
    if (currentStep === 1) {
      toast.success('Business saved successfully! Your listing is now live and can be found by customers.');
    } else {
      toast.success('Business updated successfully!');
    }
    
    // Navigate to dashboard to see the business
    navigate('/business-dashboard');
  } catch (error) {
    console.error('Registration failed:', error);
    toast.error('Failed to save business. Please try again.');
  } finally {
    setIsSubmitting(false);
  }
};

// Add new function to handle saving and continuing later
const saveAndContinueLater = async () => {
  if (!validateStep(1)) { // Validate at least step 1 is complete
    toast.error('Please complete the essential information first');
    return;
  }
  
  setIsSubmitting(true);
  
  try {
    await businessAPI.createBusinessProgressive(businessData);
    toast.success('Business saved! You can complete the remaining details anytime from your dashboard.');
    navigate('/business-dashboard');
  } catch (error) {
    console.error('Failed to save business:', error);
    toast.error('Failed to save business. Please try again.');
  } finally {
    setIsSubmitting(false);
  }
};

  // Navigation functions
  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // Save progress (for later completion)
  const saveProgress = async () => {
    try {
      await businessAPI.saveBusinessProgress(businessData);
      toast.success('Progress saved! You can continue later from your dashboard.');
    } catch (error) {
      console.error('Failed to save progress:', error);
      toast.error('Failed to save progress');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header with Progress */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Register Your Business</h1>
              <p className="text-gray-600 mt-1">
                Start with the essentials - complete more details anytime later
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">{completionPercentage}%</div>
              <div className="text-sm text-gray-600">Complete</div>
            </div>
          </div>
          
          <Progress value={completionPercentage} className="mb-4" />
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              Step {currentStep} of 3: {
                currentStep === 1 ? 'Essential Information' :
                currentStep === 2 ? 'Additional Details' : 'Optional Enhancements'
              }
            </span>
            <Button variant="ghost" size="sm" onClick={saveProgress}>
              <Save className="w-4 h-4 mr-1" />
              Save Progress
            </Button>
          </div>
        </div>

        {/* Form Steps */}
        <div className="space-y-6">
          {/* Step 1: Essential Information */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Essential Business Information
                </CardTitle>
                <p className="text-sm text-gray-600">
                  These details are required to create your business listing
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Business Name */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Business Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={businessData.business_name}
                      onChange={(e) => handleInputChange('business_name', e.target.value)}
                      placeholder="Enter your business name"
                      className={errors.business_name ? 'border-red-500' : ''}
                    />
                    {errors.business_name && (
                      <p className="text-red-500 text-sm mt-1">{errors.business_name}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Business Name (Kinyarwanda)
                    </label>
                    <Input
                      value={businessData.business_name_kinyarwanda}
                      onChange={(e) => handleInputChange('business_name_kinyarwanda', e.target.value)}
                      placeholder="Izina ry'ubucuruzi"
                    />
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Business Category <span className="text-red-500">*</span>
                  </label>
                  <Select 
                    value={businessData.category} 
                    onValueChange={(value) => handleInputChange('category', value)}
                  >
                    <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select your business category" />
                    </SelectTrigger>

                    <SelectContent>
                    {categories.map((category) => (
                        <SelectItem key={category.category_id || category.name} value={category.name}>
                        {category.name}
                        </SelectItem>
                    ))}
                    </SelectContent>

                  </Select>
                  {errors.category && (
                    <p className="text-red-500 text-sm mt-1">{errors.category}</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Business Description <span className="text-red-500">*</span>
                  </label>
                  <Textarea
                    value={businessData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe what your business offers..."
                    rows={4}
                    className={errors.description ? 'border-red-500' : ''}
                  />
                  {errors.description && (
                    <p className="text-red-500 text-sm mt-1">{errors.description}</p>
                  )}
                </div>

                {/* Contact Information */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={businessData.phone_number}
                    onChange={(e) => handleInputChange('phone_number', e.target.value)}
                    placeholder="+250 7XX XXX XXX"
                    className={errors.phone_number ? 'border-red-500' : ''}
                  />
                  {errors.phone_number && (
                    <p className="text-red-500 text-sm mt-1">{errors.phone_number}</p>
                  )}
                </div>

                {/* Location */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Province <span className="text-red-500">*</span>
                    </label>
                    <Select 
                      value={businessData.province} 
                      onValueChange={(value) => handleInputChange('province', value)}
                    >
                      <SelectTrigger className={errors.province ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select province" />
                      </SelectTrigger>
                      <SelectContent>
                        {provinces.map((province) => (
                          <SelectItem key={province} value={province}>
                            {province}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.province && (
                      <p className="text-red-500 text-sm mt-1">{errors.province}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      District <span className="text-red-500">*</span>
                    </label>
                    <Select 
                      value={businessData.district} 
                      onValueChange={(value) => handleInputChange('district', value)}
                      disabled={!businessData.province}
                    >
                      <SelectTrigger className={errors.district ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select district" />
                      </SelectTrigger>
                      <SelectContent>
                        {businessData.province && districts[businessData.province]?.map((district) => (
                          <SelectItem key={district} value={district}>
                            {district}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.district && (
                      <p className="text-red-500 text-sm mt-1">{errors.district}</p>
                    )}
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Physical Address <span className="text-red-500">*</span>
                  </label>
                  <Textarea
                    value={businessData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Enter your business address..."
                    rows={2}
                    className={errors.address ? 'border-red-500' : ''}
                  />
                  {errors.address && (
                    <p className="text-red-500 text-sm mt-1">{errors.address}</p>
                  )}
                </div>

                {/* Location Detection */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-medium">Auto-detect Location</h4>
                        <p className="text-sm text-gray-600">
                          Help customers find you with precise coordinates
                        </p>
                      </div>
                      <Button
                        onClick={detectLocation}
                        disabled={locationLoading}
                        variant="outline"
                      >
                        {locationLoading ? (
                          <>
                            <Loader className="w-4 h-4 mr-2 animate-spin" />
                            Detecting...
                          </>
                        ) : (
                          <>
                            <Navigation className="w-4 h-4 mr-2" />
                            Get Location
                          </>
                        )}
                      </Button>
                    </div>
                    
                    {businessData.latitude && businessData.longitude && (
                      <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>
                          Location detected: {businessData.latitude.toFixed(6)}, {businessData.longitude.toFixed(6)}
                          {businessData.location_accuracy && (
                            <span className="text-sm text-gray-600">
                              {' '}(±{Math.round(businessData.location_accuracy)}m accuracy)
                            </span>
                          )}
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {locationError && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{locationError}</AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>

                {/* Next Button - Modified */}
                <div className="flex justify-between">
                <div></div>
                <div className="flex gap-3">
                    <Button 
                    onClick={saveAndContinueLater} 
                    variant="outline"
                    disabled={isSubmitting}
                    >
                    <Save className="w-4 h-4 mr-2" />
                    Save & Complete Later
                    </Button>
                    <Button onClick={nextStep} className="bg-[#0D80F2] hover:bg-blue-700">
                    Continue to Additional Details
                    <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </div>
                </div>


              </CardContent>
            </Card>
          )}

          {/* Step 2: Additional Details */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  Additional Business Details
                </CardTitle>
                <p className="text-sm text-gray-600">
                  These details help customers learn more about your business
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Contact Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Secondary Phone
                    </label>
                    <Input
                      value={businessData.secondary_phone}
                      onChange={(e) => handleInputChange('secondary_phone', e.target.value)}
                      placeholder="+250 7XX XXX XXX"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Email Address
                    </label>
                    <Input
                      type="email"
                      value={businessData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="info@yourbusiness.com"
                    />
                  </div>
                </div>

                {/* Website */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Website URL
                  </label>
                  <Input
                    type="url"
                    value={businessData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    placeholder="https://www.yourbusiness.com"
                  />
                </div>

                {/* Detailed Location */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Sector
                    </label>
                    <Input
                      value={businessData.sector}
                      onChange={(e) => handleInputChange('sector', e.target.value)}
                      placeholder="Enter sector name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Cell
                    </label>
                    <Input
                      value={businessData.cell}
                      onChange={(e) => handleInputChange('cell', e.target.value)}
                      placeholder="Enter cell name"
                    />
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Price Range
                  </label>
                  <Select 
                    value={businessData.price_range} 
                    onValueChange={(value) => handleInputChange('price_range', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low ($)</SelectItem>
                      <SelectItem value="medium">Medium ($$)</SelectItem>
                      <SelectItem value="high">High ($$$)</SelectItem>
                      <SelectItem value="premium">Premium ($$$$)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Kinyarwanda Description */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Description (Kinyarwanda)
                  </label>
                  <Textarea
                    value={businessData.description_kinyarwanda}
                    onChange={(e) => handleInputChange('description_kinyarwanda', e.target.value)}
                    placeholder="Sobanura ubucuruzi bwawe mu Kinyarwanda..."
                    rows={3}
                  />
                </div>

                {/* Navigation */}
                <div className="flex justify-between">
                  <Button onClick={prevStep} variant="outline">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button onClick={nextStep} className="bg-[#0D80F2] hover:bg-blue-700">
                    Continue to Enhancements
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Optional Enhancements */}
          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Optional Enhancements
                </CardTitle>
                <p className="text-sm text-gray-600">
                  These details make your listing more attractive to customers
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Amenities */}
                <div>
                  <label className="block text-sm font-medium mb-3">
                    Amenities & Features
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {amenitiesList.map((amenity) => (
                      <div key={amenity} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`amenity-${amenity}`}
                          checked={businessData.amenities.includes(amenity)}
                          onCheckedChange={() => toggleArrayField('amenities', amenity)}
                        />
                        <label 
                          htmlFor={`amenity-${amenity}`} 
                          className="text-sm cursor-pointer"
                        >
                          {amenity}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Services Offered */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Services Offered
                  </label>
                  <Textarea
                    value={businessData.services_offered.join(', ')}
                    onChange={(e) => handleInputChange('services_offered', 
                      e.target.value.split(',').map(s => s.trim()).filter(s => s)
                    )}
                    placeholder="Enter services separated by commas (e.g., Consultation, Repair, Installation)"
                    rows={3}
                  />
                </div>

                {/* Payment Methods */}
                <div>
                  <label className="block text-sm font-medium mb-3">
                    Payment Methods Accepted
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {paymentMethodsList.map((method) => (
                      <div key={method} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`payment-${method}`}
                          checked={businessData.payment_methods.includes(method)}
                          onCheckedChange={() => toggleArrayField('payment_methods', method)}
                        />
                        <label 
                          htmlFor={`payment-${method}`} 
                          className="text-sm cursor-pointer"
                        >
                          {method}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Search Keywords */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Search Keywords
                  </label>
                  <Input
                    value={businessData.search_keywords.join(', ')}
                    onChange={(e) => handleInputChange('search_keywords', 
                      e.target.value.split(',').map(s => s.trim()).filter(s => s)
                    )}
                    placeholder="Keywords to help customers find you (e.g., coffee, breakfast, wifi)"
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    Separate keywords with commas
                  </p>
                </div>

                {/* Navigation & Submit */}
                <div className="flex justify-between">
                  <Button onClick={prevStep} variant="outline">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <div className="flex gap-3">
                    <Button onClick={saveProgress} variant="outline">
                      <Save className="w-4 h-4 mr-2" />
                      Save & Complete Later
                    </Button>
                    <Button 
                      onClick={handleSubmit} 
                      disabled={isSubmitting}
                      className="bg-[#0D80F2] hover:bg-blue-700"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader className="w-4 h-4 mr-2 animate-spin" />
                          Registering...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Register Business
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Summary Card */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Eye className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-blue-900 mb-1">
                  Registration Progress: {completionPercentage}% Complete
                </h3>
                <p className="text-sm text-blue-700 mb-3">
                  {completionPercentage < 50 
                    ? "You're off to a great start! Complete the essential details to get your business listed."
                    : completionPercentage < 80
                    ? "Great progress! Adding more details will help customers find and choose your business."
                    : "Excellent! Your business profile is nearly complete. This will significantly improve your visibility."
                  }
                </p>
                
                {/* Completion Benefits */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className={`flex items-center gap-2 ${completionPercentage >= 30 ? 'text-green-700' : 'text-gray-500'}`}>
                    <CheckCircle className={`w-3 h-3 ${completionPercentage >= 30 ? 'text-green-600' : 'text-gray-400'}`} />
                    <span>Basic Listing (30%+)</span>
                  </div>
                  <div className={`flex items-center gap-2 ${completionPercentage >= 60 ? 'text-green-700' : 'text-gray-500'}`}>
                    <CheckCircle className={`w-3 h-3 ${completionPercentage >= 60 ? 'text-green-600' : 'text-gray-400'}`} />
                    <span>Enhanced Visibility (60%+)</span>
                  </div>
                  <div className={`flex items-center gap-2 ${completionPercentage >= 90 ? 'text-green-700' : 'text-gray-500'}`}>
                    <CheckCircle className={`w-3 h-3 ${completionPercentage >= 90 ? 'text-green-600' : 'text-gray-400'}`} />
                    <span>Premium Features (90%+)</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location Benefits Info */}
        {(businessData.latitude && businessData.longitude) && (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium text-green-900 mb-1">
                    Location Detected Successfully!
                  </h3>
                  <p className="text-sm text-green-700">
                    Your business coordinates have been saved. Customers can now:
                  </p>
                  <ul className="text-sm text-green-700 mt-2 space-y-1">
                    <li>• Find you when searching for nearby businesses</li>
                    <li>• Get accurate directions to your location</li>
                    <li>• See your business on map views</li>
                    <li>• Calculate distance and travel time</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tips Card */}
        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="text-yellow-900 text-lg">
              Tips for Success
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-yellow-800">
              <div>
                <h4 className="font-medium mb-2">Improve Your Visibility</h4>
                <ul className="space-y-1">
                  <li>• Add high-quality photos of your business</li>
                  <li>• Keep your contact information up to date</li>
                  <li>• Respond to customer reviews promptly</li>
                  <li>• Use relevant keywords in your description</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Attract More Customers</h4>
                <ul className="space-y-1">
                  <li>• Complete all optional fields when possible</li>
                  <li>• Update your operating hours regularly</li>
                  <li>• Highlight special offers and services</li>
                  <li>• Enable location services for nearby searches</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BusinessRegistrationPage;