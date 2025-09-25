import React, { useState } from 'react';
import { Bell, CheckCircle, Clock, Star, Heart, MessageCircle } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

const NotificationsPage: React.FC = () => {
  const [notifications] = useState([
    {
      id: '1',
      type: 'review',
      title: 'New review for Heaven Restaurant',
      message: 'Someone left a 5-star review for a business you favorited',
      timestamp: '2024-01-15T10:30:00Z',
      read: false,
      icon: Star
    },
    {
      id: '2',
      type: 'favorite',
      title: 'Business update',
      message: 'Kigali Marriot Hotel updated their hours',
      timestamp: '2024-01-14T16:45:00Z',
      read: true,
      icon: Heart
    },
    {
      id: '3',
      type: 'message',
      title: 'AI recommendation',
      message: 'New restaurants matching your preferences are available',
      timestamp: '2024-01-14T09:15:00Z',
      read: false,
      icon: MessageCircle
    }
  ]);

  const getIconColor = (type: string) => {
    switch (type) {
      case 'review': return 'text-yellow-500';
      case 'favorite': return 'text-red-500';
      case 'message': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Bell className="w-8 h-8 text-gray-600" />
            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          </div>
          <Button variant="outline">
            Mark All as Read
          </Button>
        </div>

        {notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((notification) => {
              const IconComponent = notification.icon;
              return (
                <Card key={notification.id} className={`hover:shadow-md transition-shadow ${
                  !notification.read ? 'border-l-4 border-l-blue-500 bg-blue-50/30' : ''
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-full bg-gray-100 ${getIconColor(notification.type)}`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-1">
                          <h3 className="font-medium text-gray-900">{notification.title}</h3>
                          {!notification.read && (
                            <Badge className="bg-blue-500 text-white text-xs">New</Badge>
                          )}
                        </div>
                        
                        <p className="text-gray-600 text-sm mb-2">{notification.message}</p>
                        
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(notification.timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
            <p className="text-gray-600">You're all caught up!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;