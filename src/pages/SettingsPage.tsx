import React, { useState } from 'react';
import { Settings, Bell, Globe, Shield, HelpCircle, User, MapPin, Palette, Smartphone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Switch } from '../components/ui/switch';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    aiRecommendations: true,
    businessUpdates: true,
    reviews: true
  });
  
  const [privacy, setPrivacy] = useState({
    profileVisibility: true,
    locationSharing: true,
    searchHistory: true,
    analytics: false
  });
  
  const [language, setLanguage] = useState('en');
  const [theme, setTheme] = useState('light');

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
    toast.success('Notification settings updated');
  };

  const handlePrivacyChange = (key: string, value: boolean) => {
    setPrivacy(prev => ({ ...prev, [key]: value }));
    toast.success('Privacy settings updated');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Settings className="w-8 h-8 text-[#0D80F2]" />
            Settings
          </h1>
          <p className="text-gray-600 mt-2">Manage your BusiMap Rwanda preferences and account settings</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Account Settings */}
          <Card className="border-l-4 border-l-[#0D80F2]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-[#0D80F2]" />
                Account Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Account Status</p>
                  <p className="text-sm text-gray-600">Your account verification level</p>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  ✓ Verified
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Phone Verification</p>
                  <p className="text-sm text-gray-600">{user?.phone_number || '+250 XXX XXX XXX'}</p>
                </div>
                <Badge variant="outline" className="border-[#EBA910] text-[#EBA910]">
                  Verified
                </Badge>
              </div>
              <Button variant="outline" className="w-full border-[#0D80F2] text-[#0D80F2] hover:bg-blue-50">
                Update Account Details
              </Button>
            </CardContent>
          </Card>

          {/* Language & Region */}
          <Card className="border-l-4 border-l-[#EBA910]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-[#EBA910]" />
                Language & Region
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Preferred Language / Ururimi
                </label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rw">🇷🇼 Kinyarwanda</SelectItem>
                    <SelectItem value="en">🇺🇸 English</SelectItem>
                    <SelectItem value="fr">🇫🇷 Français</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Location Preference
                </label>
                <Select defaultValue="kigali">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kigali">Kigali City</SelectItem>
                    <SelectItem value="eastern">Eastern Province</SelectItem>
                    <SelectItem value="western">Western Province</SelectItem>
                    <SelectItem value="northern">Northern Province</SelectItem>
                    <SelectItem value="southern">Southern Province</SelectItem>
                    <SelectItem value="all">All Rwanda</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className="border-l-4 border-l-green-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-green-600" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-gray-600">Business updates and recommendations</p>
                </div>
                <Switch 
                  checked={notifications.email}
                  onCheckedChange={(checked) => handleNotificationChange('email', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Push Notifications</p>
                  <p className="text-sm text-gray-600">Mobile app notifications</p>
                </div>
                <Switch 
                  checked={notifications.push}
                  onCheckedChange={(checked) => handleNotificationChange('push', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">AI Recommendations</p>
                  <p className="text-sm text-gray-600">Personalized business suggestions</p>
                </div>
                <Switch 
                  checked={notifications.aiRecommendations}
                  onCheckedChange={(checked) => handleNotificationChange('aiRecommendations', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Review Reminders</p>
                  <p className="text-sm text-gray-600">Reminders to review businesses</p>
                </div>
                <Switch 
                  checked={notifications.reviews}
                  onCheckedChange={(checked) => handleNotificationChange('reviews', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Privacy & Security */}
          <Card className="border-l-4 border-l-red-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-red-600" />
                Privacy & Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Profile Visibility</p>
                  <p className="text-sm text-gray-600">Allow others to see your profile</p>
                </div>
                <Switch 
                  checked={privacy.profileVisibility}
                  onCheckedChange={(checked) => handlePrivacyChange('profileVisibility', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Location Sharing</p>
                  <p className="text-sm text-gray-600">Enable location-based recommendations</p>
                </div>
                <Switch 
                  checked={privacy.locationSharing}
                  onCheckedChange={(checked) => handlePrivacyChange('locationSharing', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Search History</p>
                  <p className="text-sm text-gray-600">Save search history for better results</p>
                </div>
                <Switch 
                  checked={privacy.searchHistory}
                  onCheckedChange={(checked) => handlePrivacyChange('searchHistory', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Analytics Participation</p>
                  <p className="text-sm text-gray-600">Help improve BusiMap with usage data</p>
                </div>
                <Switch 
                  checked={privacy.analytics}
                  onCheckedChange={(checked) => handlePrivacyChange('analytics', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* AI Features */}
          <Card className="border-l-4 border-l-[#EBA910] md:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-[#EBA910]" />
                AI Assistant Features
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Voice Recognition</p>
                  <p className="text-sm text-gray-600">Enable voice input for AI chat</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Smart Suggestions</p>
                  <p className="text-sm text-gray-600">Get proactive business recommendations</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Learning Mode</p>
                  <p className="text-sm text-gray-600">AI learns from your preferences</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Button className="w-full bg-[#EBA910] hover:bg-yellow-600 text-black">
                Configure AI Assistant
              </Button>
            </CardContent>
          </Card>

          {/* Support & Help */}
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-purple-600" />
                Support & Help
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start hover:border-[#0D80F2] hover:text-[#0D80F2]">
                📚 Help Center & Tutorials
              </Button>
              <Button variant="outline" className="w-full justify-start hover:border-[#0D80F2] hover:text-[#0D80F2]">
                💬 Contact Support Team
              </Button>
              <Button variant="outline" className="w-full justify-start hover:border-[#0D80F2] hover:text-[#0D80F2]">
                📋 Terms of Service
              </Button>
              <Button variant="outline" className="w-full justify-start hover:border-[#0D80F2] hover:text-[#0D80F2]">
                🔒 Privacy Policy
              </Button>
              <Button variant="outline" className="w-full justify-start hover:border-[#0D80F2] hover:text-[#0D80F2]">
                🐛 Report a Bug
              </Button>
              <Button variant="outline" className="w-full justify-start hover:border-[#0D80F2] hover:text-[#0D80F2]">
                💡 Suggest a Feature
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Danger Zone */}
        <Card className="mt-6 border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700">
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-100">
              Clear All Data
            </Button>
            <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-100">
              Deactivate Account
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;