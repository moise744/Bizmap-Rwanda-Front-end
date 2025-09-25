import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Upload, MapPin, Clock, Phone, Globe, Star } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { Switch } from '../components/ui/switch';
import { businessAPI } from '../lib/api';
import { toast } from 'sonner';

const ManageBusinessPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    business_name: '',
    business_category: '',
    full_description: '',
    short_summary: '',
    address: '',
    province: 'Kigali',
    district: '',
    sector: '',
    cell: '',
    phone_number: '',
    email_address: '',
    website_url: '',
    price_range: 'moderate',
    accepts_reservations: false,
    delivery_available: false,
    takeaway_available: false,
    outdoor_seating: false,
    wheelchair_accessible: false,
    operating_schedule: {
      monday: '09:00-17:00',
      tuesday: '09:00-17:00',
      wednesday: '09:00-17:00',
      thursday: '09:00-17:00',
      friday: '09:00-17:00',
      saturday: '09:00-17:00',
      sunday: 'closed'
    }
  });

  const provinces = ['Kigali', 'Southern Province', 'Northern Province', 'Eastern Province', 'Western Province'];
  const priceRanges = [
    { value: 'budget', label: 'Budget ($)' },
    { value: 'moderate', label: 'Moderate ($$)' },
    { value: 'premium', label: 'Premium ($$$)' },
    { value: 'luxury', label: 'Luxury ($$$$)' }
  ];

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load categories
      const categoriesResponse = await businessAPI.getCategories();
      if (Array.isArray(categoriesResponse)) {
        setCategories(categoriesResponse);
      }

      // Load business data if editing
      if (id) {
        const businessResponse = await businessAPI.getBusinessDetail(id);
        if (businessResponse) {
          setFormData({
            business_name: businessResponse.business_name || '',
            business_category: businessResponse.business_category?.toString() || '',
            full_description: businessResponse.full_description || '',
            short_summary: businessResponse.short_summary || '',
            address: businessResponse.address || '',
            province: businessResponse.province || 'Kigali',
            district: businessResponse.district || '',
            sector: businessResponse.sector || '',
            cell: businessResponse.cell || '',
            phone_number: businessResponse.phone_number || '',
            email_address: businessResponse.email_address || '',
            website_url: businessResponse.website_url || '',
            price_range: businessResponse.price_range || 'moderate',
            accepts_reservations: businessResponse.accepts_reservations || false,
            delivery_available: businessResponse.delivery_available || false,
            takeaway_available: businessResponse.takeaway_available || false,
            outdoor_seating: businessResponse.outdoor_seating || false,
            wheelchair_accessible: businessResponse.wheelchair_accessible || false,
            operating_schedule: businessResponse.operating_schedule || formData.operating_schedule
          });
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load business data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      if (isEditing) {
        await businessAPI.updateBusiness(id!, formData);
        toast.success('Business updated successfully!');
      } else {
        await businessAPI.createBusiness(formData);
        toast.success('Business created successfully!');
      }
      
      navigate('/dashboard');
    } catch (error) {
      console.error('Error saving business:', error);
      toast.error('Failed to save business');
    } finally {
      setSaving(false);
    }
  };

  const updateSchedule = (day: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      operating_schedule: {
        ...prev.operating_schedule,
        [day]: value
      }
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="animate-pulse space-y-6">
            <div className="w-1/3 h-8 bg-gray-300 rounded"></div>
            <div className="w-full h-64 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEditing ? 'Edit Business' : 'Add New Business'}
            </h1>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={saving}
              className="bg-[#0D80F2] hover:bg-blue-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Business'}
            </Button>
          </div>
        </div>

        <div className="space-y-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="business_name">Business Name *</Label>
                <Input
                  id="business_name"
                  value={formData.business_name}
                  onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                  placeholder="Enter your business name"
                />
              </div>

              <div>
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.business_category}
                  onValueChange={(value) => setFormData({ ...formData, business_category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="short_summary">Short Summary *</Label>
                <Input
                  id="short_summary"
                  value={formData.short_summary}
                  onChange={(e) => setFormData({ ...formData, short_summary: e.target.value })}
                  placeholder="Brief description of your business"
                  maxLength={300}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.short_summary.length}/300 characters
                </p>
              </div>

              <div>
                <Label htmlFor="full_description">Full Description *</Label>
                <Textarea
                  id="full_description"
                  value={formData.full_description}
                  onChange={(e) => setFormData({ ...formData, full_description: e.target.value })}
                  placeholder="Detailed description of your business, services, and what makes you unique"
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="price_range">Price Range</Label>
                <Select
                  value={formData.price_range}
                  onValueChange={(value) => setFormData({ ...formData, price_range: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priceRanges.map((range) => (
                      <SelectItem key={range.value} value={range.value}>
                        {range.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Location Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Location Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="address">Street Address *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Street address, building name, etc."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="province">Province *</Label>
                  <Select
                    value={formData.province}
                    onValueChange={(value) => setFormData({ ...formData, province: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {provinces.map((province) => (
                        <SelectItem key={province} value={province}>
                          {province}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="district">District *</Label>
                  <Input
                    id="district"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    placeholder="District name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sector">Sector</Label>
                  <Input
                    id="sector"
                    value={formData.sector}
                    onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                    placeholder="Sector name"
                  />
                </div>

                <div>
                  <Label htmlFor="cell">Cell</Label>
                  <Input
                    id="cell"
                    value={formData.cell}
                    onChange={(e) => setFormData({ ...formData, cell: e.target.value })}
                    placeholder="Cell name"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="phone_number">Phone Number *</Label>
                <Input
                  id="phone_number"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  placeholder="+250788123456"
                />
              </div>

              <div>
                <Label htmlFor="email_address">Email Address</Label>
                <Input
                  id="email_address"
                  type="email"
                  value={formData.email_address}
                  onChange={(e) => setFormData({ ...formData, email_address: e.target.value })}
                  placeholder="business@example.com"
                />
              </div>

              <div>
                <Label htmlFor="website_url">Website URL</Label>
                <Input
                  id="website_url"
                  type="url"
                  value={formData.website_url}
                  onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                  placeholder="https://www.yourwebsite.com"
                />
              </div>
            </CardContent>
          </Card>

          {/* Operating Hours */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Operating Hours
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(formData.operating_schedule).map(([day, hours]) => (
                <div key={day} className="flex items-center gap-4">
                  <div className="w-24">
                    <Label className="capitalize">{day}</Label>
                  </div>
                  <div className="flex-1">
                    <Select
                      value={hours}
                      onValueChange={(value) => updateSchedule(day, value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="closed">Closed</SelectItem>
                        <SelectItem value="00:00-23:59">24 Hours</SelectItem>
                        <SelectItem value="06:00-18:00">6:00 AM - 6:00 PM</SelectItem>
                        <SelectItem value="08:00-17:00">8:00 AM - 5:00 PM</SelectItem>
                        <SelectItem value="09:00-17:00">9:00 AM - 5:00 PM</SelectItem>
                        <SelectItem value="10:00-22:00">10:00 AM - 10:00 PM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Amenities */}
          <Card>
            <CardHeader>
              <CardTitle>Amenities & Services</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="reservations"
                    checked={formData.accepts_reservations}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, accepts_reservations: checked as boolean })
                    }
                  />
                  <Label htmlFor="reservations">Accepts Reservations</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="delivery"
                    checked={formData.delivery_available}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, delivery_available: checked as boolean })
                    }
                  />
                  <Label htmlFor="delivery">Delivery Available</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="takeaway"
                    checked={formData.takeaway_available}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, takeaway_available: checked as boolean })
                    }
                  />
                  <Label htmlFor="takeaway">Takeaway Available</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="outdoor"
                    checked={formData.outdoor_seating}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, outdoor_seating: checked as boolean })
                    }
                  />
                  <Label htmlFor="outdoor">Outdoor Seating</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="wheelchair"
                    checked={formData.wheelchair_accessible}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, wheelchair_accessible: checked as boolean })
                    }
                  />
                  <Label htmlFor="wheelchair">Wheelchair Accessible</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Photos */}
          <Card>
            <CardHeader>
              <CardTitle>Business Photos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Upload photos of your business</p>
                <Button variant="outline">
                  Choose Photos
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ManageBusinessPage;