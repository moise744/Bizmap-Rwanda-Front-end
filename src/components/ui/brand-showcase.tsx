import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { Button } from './button';
import { Sparkles, MapPin, Users, TrendingUp } from 'lucide-react';

export const BrandShowcase: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Brand Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <div className="w-16 h-16 bg-[#0D80F2] rounded-xl flex items-center justify-center">
              <MapPin className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#0D80F2] to-[#EBA910] bg-clip-text text-transparent">
              BusiMap Rwanda
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Rwanda's Revolutionary AI-Powered Business Discovery Platform
          </p>
          <div className="flex items-center justify-center space-x-4">
            <Badge className="bg-[#0D80F2] text-white px-4 py-2">
              AI-Powered Search
            </Badge>
            <Badge className="bg-[#EBA910] text-black px-4 py-2">
              Kinyarwanda Support
            </Badge>
            <Badge className="bg-green-500 text-white px-4 py-2">
              Rwanda First
            </Badge>
          </div>
        </div>

        {/* Brand Colors Demo */}
        <Card className="border-2 border-[#0D80F2]">
          <CardHeader>
            <CardTitle className="text-2xl text-[#0D80F2] flex items-center gap-2">
              <Sparkles className="w-6 h-6" />
              Brand Color Palette
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Primary Blue */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Primary Blue #0D80F2</h3>
                <div className="h-20 bg-[#0D80F2] rounded-lg flex items-center justify-center">
                  <span className="text-white font-medium">Primary Actions & Navigation</span>
                </div>
                <div className="flex space-x-2">
                  <Button className="bg-[#0D80F2] hover:bg-blue-700">
                    Primary Button
                  </Button>
                  <Button variant="outline" className="border-[#0D80F2] text-[#0D80F2]">
                    Outline Button
                  </Button>
                </div>
              </div>

              {/* Secondary Gold */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Secondary Gold #EBA910</h3>
                <div className="h-20 bg-[#EBA910] rounded-lg flex items-center justify-center">
                  <span className="text-black font-medium">AI Features & Highlights</span>
                </div>
                <div className="flex space-x-2">
                  <Button className="bg-[#EBA910] hover:bg-yellow-600 text-black">
                    AI Button
                  </Button>
                  <Button variant="outline" className="border-[#EBA910] text-[#EBA910]">
                    Accent Button
                  </Button>
                </div>
              </div>
            </div>

            {/* Component Examples */}
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="border-[#0D80F2] bg-blue-50">
                <CardContent className="p-6 text-center">
                  <Users className="w-8 h-8 text-[#0D80F2] mx-auto mb-2" />
                  <h4 className="font-semibold text-[#0D80F2]">50,000+ Users</h4>
                  <p className="text-sm text-gray-600">Active monthly users</p>
                </CardContent>
              </Card>

              <Card className="border-[#EBA910] bg-yellow-50">
                <CardContent className="p-6 text-center">
                  <Sparkles className="w-8 h-8 text-[#EBA910] mx-auto mb-2" />
                  <h4 className="font-semibold text-[#EBA910]">AI-Powered</h4>
                  <p className="text-sm text-gray-600">Intelligent business discovery</p>
                </CardContent>
              </Card>

              <Card className="border-green-500 bg-green-50">
                <CardContent className="p-6 text-center">
                  <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <h4 className="font-semibold text-green-600">Growing Fast</h4>
                  <p className="text-sm text-gray-600">200% monthly growth</p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Feature Highlights */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="bg-gradient-to-br from-[#0D80F2] to-blue-600 text-white">
            <CardHeader>
              <CardTitle className="text-white">Revolutionary AI Chat</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                "Ndashaka kurya ariko sinzi aho narira" - Our AI understands natural Kinyarwanda 
                and helps you find exactly what you need, just like talking to a friend.
              </p>
              <Button variant="outline" className="border-white text-white hover:bg-white hover:text-[#0D80F2]">
                Try AI Chat
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#EBA910] to-yellow-600 text-black">
            <CardHeader>
              <CardTitle className="text-black">Smart Business Discovery</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                More than just search - we understand context, solve problems, and connect you 
                with the right businesses at the right time.
              </p>
              <Button variant="outline" className="border-black text-black hover:bg-black hover:text-[#EBA910]">
                Explore Businesses
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Technology Stack */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl bg-gradient-to-r from-[#0D80F2] to-[#EBA910] bg-clip-text text-transparent">
              Built with Modern Technology
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4 text-center">
              <div className="p-4 rounded-lg bg-blue-50 border-2 border-[#0D80F2]">
                <h4 className="font-semibold text-[#0D80F2] mb-2">React 18</h4>
                <p className="text-sm text-gray-600">Modern UI framework</p>
              </div>
              <div className="p-4 rounded-lg bg-yellow-50 border-2 border-[#EBA910]">
                <h4 className="font-semibold text-[#EBA910] mb-2">TypeScript</h4>
                <p className="text-sm text-gray-600">Type-safe development</p>
              </div>
              <div className="p-4 rounded-lg bg-blue-50 border-2 border-[#0D80F2]">
                <h4 className="font-semibold text-[#0D80F2] mb-2">Tailwind CSS</h4>
                <p className="text-sm text-gray-600">Modern styling</p>
              </div>
              <div className="p-4 rounded-lg bg-yellow-50 border-2 border-[#EBA910]">
                <h4 className="font-semibold text-[#EBA910] mb-2">AI Integration</h4>
                <p className="text-sm text-gray-600">Smart features</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BrandShowcase;