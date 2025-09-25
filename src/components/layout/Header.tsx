import React, { useState } from 'react';
import { Search, Bell, User, Menu, MapPin, Globe, ChevronDown, Settings, LogOut, Sparkles, Home, Building2, Heart, History } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

interface HeaderProps {
  onMenuClick?: () => void;
  onSearchSubmit?: (query: string) => void;
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onMenuClick,
  onSearchSubmit,
  className = ''
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() && onSearchSubmit) {
      onSearchSubmit(searchQuery.trim());
    } else if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getUserInitials = () => {
    if (!user) return 'U';
    return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    const language = user?.preferred_language || 'en';
    
    if (language === 'kinyarwanda') {
      if (hour < 12) return 'Mwaramutse';
      if (hour < 18) return 'Mwiriwe';
      return 'Muramuke';
    } else {
      if (hour < 12) return 'Good morning';
      if (hour < 18) return 'Good afternoon';
      return 'Good evening';
    }
  };

  const getLanguageNativeName = (lang: string) => {
    const names = {
      'en': 'English',
      'kinyarwanda': 'Kinyarwanda',
      'fr': 'Français'
    };
    return names[lang as keyof typeof names] || 'English';
  };

  const navigationItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Businesses', href: '/businesses', icon: Building2 },
    { name: 'AI Chat', href: '/chat', icon: Sparkles, auth: true },
    { name: 'Favorites', href: '/favorites', icon: Heart, auth: true },
    { name: 'History', href: '/history', icon: History, auth: true },
  ];

  return (
    <header className={`bg-white border-b border-gray-200 sticky top-0 z-50 ${className}`}>
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left Section */}
        <div className="flex items-center space-x-4">
          {/* Logo */}
          <div 
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <div className="w-8 h-8 bg-[#0D80F2] rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 hidden sm:inline">
              BizMap
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => {
              if (item.auth && !isAuthenticated) return null;
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              
              return (
                <Button
                  key={item.name}
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  onClick={() => navigate(item.href)}
                  className={`flex items-center space-x-1 ${
                    isActive 
                      ? 'bg-[#0D80F2] text-white' 
                      : 'text-gray-600 hover:text-[#0D80F2]'
                  }`}
                >
                  <Icon size={16} />
                  <span className="hidden lg:inline">{item.name}</span>
                </Button>
              );
            })}
          </nav>
        </div>

        {/* Center Search Bar */}
        <div className="flex-1 max-w-xl mx-4">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Input
              type="text"
              placeholder="Search businesses, services, or ask AI..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-full border-2 focus:border-[#0D80F2]"
            />
            <Search 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
              size={18} 
            />
            {searchQuery && (
              <Button
                type="submit"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full bg-[#0D80F2] hover:bg-blue-700 px-3"
              >
                Search
              </Button>
            )}
          </form>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-3">
          {/* AI Chat Button */}
          {isAuthenticated && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/chat')}
              className="hidden sm:flex items-center space-x-1 border-[#EBA910] text-[#EBA910] hover:bg-[#EBA910] hover:text-black"
            >
              <Sparkles size={16} />
              <span>AI Chat</span>
            </Button>
          )}

          {/* Language Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="hidden sm:flex items-center space-x-1">
                <Globe size={16} />
                <span className="text-sm">
                  {getLanguageNativeName(user?.preferred_language || 'en')}
                </span>
                <ChevronDown size={12} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <span>🇷🇼 Kinyarwanda</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <span>🇺🇸 English</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <span>🇫🇷 Français</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Auth Section */}
          {isAuthenticated ? (
            <>
              {/* Notifications */}
              <Button 
                variant="ghost" 
                size="sm" 
                className="relative"
                onClick={() => navigate('/notifications')}
              >
                <Bell size={18} />
                <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center p-0">
                  3
                </Badge>
              </Button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 hover:bg-gray-50">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={user?.profile_picture} />
                      <AvatarFallback className="bg-[#0D80F2] text-white text-sm">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden md:flex flex-col items-start">
                      <span className="text-sm font-medium text-gray-900">
                        {getGreeting()}, {user?.first_name}
                      </span>
                      <span className="text-xs text-gray-500 capitalize">
                        {user?.user_type?.replace('_', ' ')}
                      </span>
                    </div>
                    <ChevronDown size={12} className="text-gray-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-3 py-2 border-b">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium text-gray-900">
                        {user?.first_name} {user?.last_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {user?.email}
                      </p>
                      <Badge variant="outline" className="w-fit text-xs">
                        {user?.user_type === 'business_owner' ? 'Business Owner' : 'Customer'}
                      </Badge>
                    </div>
                  </div>
                  
                  <DropdownMenuItem 
                    className="cursor-pointer" 
                    onClick={() => navigate('/profile')}
                  >
                    <User className="mr-2 h-4 w-4" />
                    Profile Settings
                  </DropdownMenuItem>
                  
                  {user?.user_type === 'business_owner' && (
                    <>
                      <DropdownMenuItem 
                        className="cursor-pointer"
                        onClick={() => navigate('/business-dashboard')}
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        Business Dashboard
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="cursor-pointer"
                        onClick={() => navigate('/manage-business')}
                      >
                        <Building2 className="mr-2 h-4 w-4" />
                        Manage Business
                      </DropdownMenuItem>
                    </>
                  )}
                  
                  <DropdownMenuItem 
                    className="cursor-pointer"
                    onClick={() => navigate('/favorites')}
                  >
                    <Heart className="mr-2 h-4 w-4" />
                    Favorites
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem 
                    className="cursor-pointer"
                    onClick={() => navigate('/history')}
                  >
                    <History className="mr-2 h-4 w-4" />
                    Search History
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem 
                    className="cursor-pointer"
                    onClick={() => navigate('/notifications')}
                  >
                    <Bell className="mr-2 h-4 w-4" />
                    Notifications
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem 
                    className="cursor-pointer text-red-600 focus:text-red-600"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/login')}
              >
                Sign In
              </Button>
              <Button
                size="sm"
                onClick={() => navigate('/register')}
                className="bg-[#0D80F2] hover:bg-blue-700"
              >
                Sign Up
              </Button>
            </div>
          )}

          {/* Mobile Menu Button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
              >
                <Menu size={20} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {navigationItems.map((item) => {
                if (item.auth && !isAuthenticated) return null;
                const Icon = item.icon;
                
                return (
                  <DropdownMenuItem 
                    key={item.name}
                    className="cursor-pointer"
                    onClick={() => navigate(item.href)}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {item.name}
                  </DropdownMenuItem>
                );
              })}
              {!isAuthenticated && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/login')}>
                    Sign In
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/register')}>
                    Sign Up
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Search Bar */}
      <div className="px-4 pb-3 md:hidden">
        <form onSubmit={handleSearchSubmit} className="relative">
          <Input
            type="text"
            placeholder="Search or ask AI..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-full border-2 focus:border-[#0D80F2]"
          />
          <Search 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
            size={18} 
          />
        </form>
      </div>
    </header>
  );
};