import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { 
  Home, 
  MessageCircle, 
  Search, 
  Building, 
  Heart, 
  User, 
  TrendingUp, 
  Settings,
  History,
  MapPin,
  Star,
  Bell,
  X,
  Bot
} from 'lucide-react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { ScrollArea } from '../ui/scroll-area'
import { useAuth, useRole } from '../../contexts/AuthContext'
import { cn } from '../../lib/utils'

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
  className?: string
}

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<any>
  badge?: number
  description?: string
  requiresAuth?: boolean
  businessOwnerOnly?: boolean
}

const navItems: NavItem[] = [
  {
    name: 'Home',
    href: '/',
    icon: Home,
    description: 'Discover businesses near you'
  },
  {
    name: 'AI Assistant',
    href: '/chat',
    icon: Bot,
    description: 'Chat with our intelligent assistant'
  },
  {
    name: 'Search',
    href: '/search',
    icon: Search,
    description: 'Advanced business search'
  },
  {
    name: 'Businesses',
    href: '/businesses',
    icon: Building,
    description: 'Browse all businesses'
  },
  {
    name: 'Favorites',
    href: '/favorites',
    icon: Heart,
    description: 'Your saved businesses',
    requiresAuth: true
  },
  {
    name: 'History',
    href: '/history',
    icon: History,
    description: 'Your search history',
    requiresAuth: true
  },
  {
    name: 'My Reviews',
    href: '/reviews',
    icon: Star,
    description: 'Reviews you\'ve written',
    requiresAuth: true
  },
  {
    name: 'Business Dashboard',
    href: '/business/dashboard',
    icon: TrendingUp,
    description: 'Manage your business',
    requiresAuth: true,
    businessOwnerOnly: true
  },
  {
    name: 'My Business',
    href: '/business/manage',
    icon: Building,
    description: 'Edit business details',
    requiresAuth: true,
    businessOwnerOnly: true
  }
]

const bottomNavItems: NavItem[] = [
  {
    name: 'Notifications',
    href: '/notifications',
    icon: Bell,
    badge: 3,
    requiresAuth: true
  },
  {
    name: 'Profile',
    href: '/profile',
    icon: User,
    requiresAuth: true
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
    requiresAuth: true
  }
]

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen = true,
  onClose,
  className = ''
}) => {
  const { isAuthenticated, user } = useAuth()
  const { isBusinessOwner } = useRole()
  const navigate = useNavigate()

  const filteredNavItems = navItems.filter(item => {
    if (item.requiresAuth && !isAuthenticated) return false
    if (item.businessOwnerOnly && !isBusinessOwner) return false
    return true
  })

  const filteredBottomNavItems = bottomNavItems.filter(item => {
    if (item.requiresAuth && !isAuthenticated) return false
    return true
  })

  const NavItemComponent: React.FC<{ item: NavItem; onClick?: () => void }> = ({ 
    item, 
    onClick 
  }) => (
    <NavLink
      to={item.href}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          'flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors group',
          isActive
            ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
        )
      }
    >
      {({ isActive }) => (
        <>
          <item.icon 
            size={20} 
            className={cn(
              'flex-shrink-0',
              isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'
            )} 
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="font-medium truncate">{item.name}</span>
              {item.badge && (
                <Badge className="bg-red-500 text-white ml-2">
                  {item.badge}
                </Badge>
              )}
            </div>
            {item.description && (
              <p className="text-xs text-gray-500 mt-0.5 truncate">
                {item.description}
              </p>
            )}
          </div>
        </>
      )}
    </NavLink>
  )

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && onClose && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        'fixed left-0 top-0 h-full w-80 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out z-50',
        isOpen ? 'translate-x-0' : '-translate-x-full',
        'lg:translate-x-0 lg:static lg:z-auto',
        className
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">BizMap</h1>
                <p className="text-xs text-gray-500">Rwanda Business Discovery</p>
              </div>
            </div>
            
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="lg:hidden"
              >
                <X size={20} />
              </Button>
            )}
          </div>

          {/* User Info */}
          {isAuthenticated && user && (
            <div className="p-4 bg-blue-50 border-b">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {user.first_name} {user.last_name}
                  </p>
                  <p className="text-sm text-blue-600 capitalize">
                    {user.user_type.replace('_', ' ')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <ScrollArea className="flex-1">
            <div className="p-4">
              {/* Main Navigation */}
              <div className="space-y-1 mb-8">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Navigation
                </h2>
                {filteredNavItems.map((item) => (
                  <NavItemComponent 
                    key={item.name} 
                    item={item} 
                    onClick={onClose}
                  />
                ))}
              </div>

              {/* Business Owner Section */}
              {isBusinessOwner && (
                <div className="space-y-1 mb-8">
                  <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Business Tools
                  </h2>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <TrendingUp size={16} className="text-green-600" />
                      <span className="text-sm font-medium text-green-800">
                        Business Performance
                      </span>
                    </div>
                    <p className="text-xs text-green-600">
                      Your business has been viewed 120 times this week
                    </p>
                  </div>
                </div>
              )}

              {/* Quick Stats */}
              <div className="space-y-1 mb-8">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Quick Stats
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-blue-600">1,247</div>
                    <div className="text-xs text-blue-600">Businesses</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-green-600">4.8</div>
                    <div className="text-xs text-green-600">Avg Rating</div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>

          {/* Bottom Navigation */}
          {filteredBottomNavItems.length > 0 && (
            <div className="border-t p-4">
              <div className="space-y-1">
                {filteredBottomNavItems.map((item) => (
                  <NavItemComponent 
                    key={item.name} 
                    item={item} 
                    onClick={onClose}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="p-4 border-t text-center">
            <p className="text-xs text-gray-500">
              © 2024 BizMap Rwanda
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Powered by AI • Made with ❤️
            </p>
          </div>
        </div>
      </div>
    </>
  )
}