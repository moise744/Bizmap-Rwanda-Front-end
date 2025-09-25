import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { SupportedLanguage } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Language utilities
export const getLanguageNativeName = (code: SupportedLanguage): string => {
  const languages = {
    'en': 'English',
    'rw': 'Ikinyarwanda', 
    'fr': 'Français'
  }
  return languages[code] || 'English'
}

// Date utilities
export const formatRelativeTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000)

  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`
  
  return dateObj.toLocaleDateString()
}

// Distance utilities
export const formatDistance = (distance: number): string => {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`
  }
  return `${distance.toFixed(1)}km`
}

// Rating utilities
export const formatRating = (rating: number): string => {
  return rating.toFixed(1)
}

// Number utilities
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-US').format(num)
}

// Form validation
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const isValidPhone = (phone: string): boolean => {
  // Rwanda phone number format: +250XXXXXXXXX
  const phoneRegex = /^\+250[0-9]{9}$/
  return phoneRegex.test(phone)
}

export const isValidPassword = (password: string): boolean => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  return password.length >= 8 &&
         /[A-Z]/.test(password) &&
         /[a-z]/.test(password) &&
         /[0-9]/.test(password)
}

// Price range utilities
export const getPriceRangeInfo = (priceRange: string) => {
  const ranges = {
    budget: { label: 'Budget', symbol: '$', description: 'Under 5,000 RWF' },
    moderate: { label: 'Moderate', symbol: '$$', description: '5,000 - 20,000 RWF' },
    premium: { label: 'Premium', symbol: '$$$', description: '20,000 - 50,000 RWF' },
    luxury: { label: 'Luxury', symbol: '$$$$', description: '50,000+ RWF' }
  }
  return ranges[priceRange as keyof typeof ranges] || ranges.moderate
}