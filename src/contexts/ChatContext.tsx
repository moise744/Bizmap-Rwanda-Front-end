import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import { AIMessage, ChatState, Location, AIResponse } from '../lib/types';
import { aiAPI, handleApiError } from '../lib/api';
import { toast } from 'sonner';

// Chat Actions
type ChatAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'ADD_MESSAGE'; payload: AIMessage }
  | { type: 'SET_MESSAGES'; payload: AIMessage[] }
  | { type: 'SET_CONVERSATION_ID'; payload: string }
  | { type: 'SET_CONTEXT'; payload: Partial<ChatState['context']> }
  | { type: 'CLEAR_CHAT' }
  | { type: 'RESET_CHAT' };

// Chat Reducer
const chatReducer = (state: ChatState, action: ChatAction): ChatState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.payload],
        error: null
      };
    
    case 'SET_MESSAGES':
      return { ...state, messages: action.payload };
    
    case 'SET_CONVERSATION_ID':
      return { ...state, conversationId: action.payload };
    
    case 'SET_CONTEXT':
      return {
        ...state,
        context: { ...state.context, ...action.payload }
      };
    
    case 'CLEAR_CHAT':
      return {
        ...state,
        messages: [],
        error: null,
        conversationId: undefined
      };
    
    case 'RESET_CHAT':
      return {
        messages: [],
        isLoading: false,
        error: null,
        conversationId: undefined,
        context: {
          language: 'kinyarwanda',
        }
      };
    
    default:
      return state;
  }
};

// Initial State
const initialChatState: ChatState = {
  messages: [
    {
      id: 'welcome_msg',
      role: 'assistant',
      content: 'Muraho! Welcome to BizMap Rwanda AI Assistant. I can help you find businesses, get recommendations, and answer questions about local services. What are you looking for today?',
      timestamp: new Date(),
      language: 'en'
    }
  ],
  isLoading: false,
  error: null,
  conversationId: undefined,
  context: {
    language: 'kinyarwanda',
  }
};

// Context Type
interface ChatContextType {
  state: ChatState;
  sendMessage: (message: string, language?: string) => Promise<void>;
  clearChat: () => void;
  resetChat: () => void;
  setUserLocation: (location: Location) => void;
  setLanguage: (language: string) => void;
  getSuggestions: (query: string, language?: string) => Promise<string[]>;
  isTyping: boolean;
  analyzeQuery: (query: string) => Promise<any>;
  getRecommendations: (context?: any) => Promise<any>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialChatState);
  const [isTyping, setIsTyping] = React.useState(false);

  const generateMessageId = (): string => {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const sendMessage = useCallback(async (message: string, language?: string): Promise<void> => {
    if (!message.trim()) return;

    const userLanguage = language || state.context.language || 'kinyarwanda';
    
    // Create user message
    const userMessage: AIMessage = {
      id: generateMessageId(),
      role: 'user',
      content: message.trim(),
      timestamp: new Date(),
      language: userLanguage
    };

    // Add user message immediately
    dispatch({ type: 'ADD_MESSAGE', payload: userMessage });
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      // Start typing indicator
      setIsTyping(true);

      // Send message to AI service
      const response = await aiAPI.chat({
        message: message.trim(),
        language: userLanguage,
        conversation_id: state.conversationId,
        user_location: state.context.userLocation,
        conversation_context: {
          lastIntent: state.context.lastIntent,
          lastCategory: state.context.lastCategory
        }
      });

      // Stop typing indicator
      setIsTyping(false);

      let aiResponseContent: string;
      let conversationId: string | undefined;
      let conversationState: any = {};

      // Handle different response formats
      if (response.success && response.data) {
        const aiResponseData = response.data.ai_response;
        aiResponseContent = aiResponseData.response;
        conversationId = response.data.conversation_id;
        conversationState = aiResponseData.conversation_state || {};
      } else {
        // Fallback response
        aiResponseContent = "I understand you're looking for help. Could you please provide more details about what you're searching for?";
      }
      
      // Create AI message
      const aiMessage: AIMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: aiResponseContent,
        timestamp: new Date(),
        language: conversationState.language || userLanguage
      };

      // Add AI message
      dispatch({ type: 'ADD_MESSAGE', payload: aiMessage });

      // Update conversation context
      dispatch({ 
        type: 'SET_CONTEXT', 
        payload: {
          lastIntent: conversationState.last_intent,
          lastCategory: conversationState.last_category,
          language: conversationState.language || userLanguage
        }
      });

      // Set conversation ID if new
      if (conversationId && !state.conversationId) {
        dispatch({ type: 'SET_CONVERSATION_ID', payload: conversationId });
      }

    } catch (error: any) {
      setIsTyping(false);
      
      const errorMessage = handleApiError(error);
      
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      
      toast.error('Message Failed', {
        description: errorMessage
      });

      // Add error message from assistant
      const errorAIMessage: AIMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your message. Please try again or rephrase your question.',
        timestamp: new Date(),
        language: userLanguage
      };
      
      dispatch({ type: 'ADD_MESSAGE', payload: errorAIMessage });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.conversationId, state.context.language, state.context.userLocation, state.context.lastIntent, state.context.lastCategory]);

  const clearChat = useCallback(() => {
    dispatch({ type: 'CLEAR_CHAT' });
  }, []);

  const resetChat = useCallback(() => {
    dispatch({ type: 'RESET_CHAT' });
  }, []);

  const setUserLocation = useCallback((location: Location) => {
    dispatch({ 
      type: 'SET_CONTEXT', 
      payload: { userLocation: location }
    });
  }, []);

  const setLanguage = useCallback((language: string) => {
    dispatch({ 
      type: 'SET_CONTEXT', 
      payload: { language }
    });
  }, []);

  const getSuggestions = useCallback(async (query: string, language?: string): Promise<string[]> => {
    try {
      const response = await aiAPI.getSearchSuggestions({
        partial_query: query,
        language: language || state.context.language || 'kinyarwanda'
      });

      if (response.success && response.data) {
        return response.data.suggestions || [];
      }
      
      return [];
    } catch (error: any) {
      console.error('Suggestions failed:', error);
      return [];
    }
  }, [state.context.language]);

  const analyzeQuery = useCallback(async (query: string): Promise<any> => {
    try {
      const response = await aiAPI.analyzeQuery({
        query,
        language: state.context.language || 'kinyarwanda',
        user_context: {
          location: state.context.userLocation,
          lastIntent: state.context.lastIntent,
          lastCategory: state.context.lastCategory
        }
      });

      return response;
    } catch (error: any) {
      console.error('Query analysis failed:', error);
      return null;
    }
  }, [state.context]);

  const getRecommendations = useCallback(async (context?: any): Promise<any> => {
    try {
      const response = await aiAPI.getRecommendations({
        user_preferences: context?.preferences,
        location: state.context.userLocation,
        context: context?.searchContext || state.context.lastIntent
      });

      return response;
    } catch (error: any) {
      console.error('Recommendations failed:', error);
      return null;
    }
  }, [state.context]);

  const value: ChatContextType = {
    state,
    sendMessage,
    clearChat,
    resetChat,
    setUserLocation,
    setLanguage,
    getSuggestions,
    isTyping,
    analyzeQuery,
    getRecommendations
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};