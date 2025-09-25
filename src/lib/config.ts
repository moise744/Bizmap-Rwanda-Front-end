// Configuration management for BusiMap Rwanda
// This file handles environment-specific configurations in a browser-compatible way

export interface AppConfig {
  apiBaseUrl: string;
  environment: 'development' | 'staging' | 'production';
  enableLogging: boolean;
  enableVoiceFeatures: boolean;
  enableAnalytics: boolean;
  googleStaticMapsKey?: string;
}

// Default configuration
const defaultConfig: AppConfig = {
  apiBaseUrl: 'http://127.0.0.1:8000',
  environment: 'development',
  enableLogging: true,
  enableVoiceFeatures: true,
  enableAnalytics: false,
  googleStaticMapsKey: undefined,
};

// Environment-specific configurations
const environmentConfigs: Record<string, Partial<AppConfig>> = {
  development: {
    apiBaseUrl: 'http://127.0.0.1:8000',
    environment: 'development',
    enableLogging: true,
    enableAnalytics: false,
    googleStaticMapsKey: (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GOOGLE_STATIC_MAPS_KEY) || undefined,
  },
  staging: {
    apiBaseUrl: 'https://bizmap-rwanda.onrender.com',
    environment: 'staging',
    enableLogging: true,
    enableAnalytics: true,
    googleStaticMapsKey: (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GOOGLE_STATIC_MAPS_KEY) || undefined,
  },
  production: {
    apiBaseUrl: 'https://bizmap-rwanda.onrender.com',
    environment: 'production',
    enableLogging: false,
    enableAnalytics: true,
    googleStaticMapsKey: (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GOOGLE_STATIC_MAPS_KEY) || undefined,
  },
};

// Browser-compatible environment detection
const getEnvironment = (): string => {
  // Check for Vite environment variables
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env.VITE_ENVIRONMENT || 
           import.meta.env.VITE_NODE_ENV || 
           (import.meta as any).env?.MODE || 
           'development';
  }
  
  // Check for global environment variables
  if (typeof window !== 'undefined' && (window as any).ENV) {
    return (window as any).ENV.ENVIRONMENT || 'development';
  }
  
  // Check hostname for environment detection
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
      return 'development';
    }
    if (hostname.includes('staging')) {
      return 'staging';
    }
    if (hostname.includes('busimap.rw')) {
      return 'production';
    }
  }
  
  return 'development';
};

// Get current configuration
const getCurrentConfig = (): AppConfig => {
  const environment = getEnvironment();
  const envConfig = environmentConfigs[environment] || {};
  
  return {
    ...defaultConfig,
    ...envConfig,
  };
};

// Export the current configuration
export const config = getCurrentConfig();

// Export individual values for convenience
export const API_BASE_URL = config.apiBaseUrl;
export const ENVIRONMENT = config.environment;
export const IS_DEVELOPMENT = config.environment === 'development';
export const IS_PRODUCTION = config.environment === 'production';
export const ENABLE_LOGGING = config.enableLogging;
export const ENABLE_VOICE_FEATURES = config.enableVoiceFeatures;
export const ENABLE_ANALYTICS = config.enableAnalytics;
export const GOOGLE_STATIC_MAPS_KEY = config.googleStaticMapsKey;

// Logging helper
export const log = (...args: any[]) => {
  if (ENABLE_LOGGING) {
    console.log('[BusiMap]', ...args);
  }
};

export const logError = (...args: any[]) => {
  if (ENABLE_LOGGING) {
    console.error('[BusiMap Error]', ...args);
  }
};

export const logWarn = (...args: any[]) => {
  if (ENABLE_LOGGING) {
    console.warn('[BusiMap Warning]', ...args);
  }
};