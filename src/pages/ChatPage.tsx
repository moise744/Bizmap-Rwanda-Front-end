import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Mic, MicOff, Bot, User, ArrowLeft, History, X, MapPin, Sparkles, Volume2, VolumeX, Settings, Zap, Brain } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'sonner'
import { VoiceManager, voiceUtils, VoiceRecognitionResult } from '../lib/voice-utils'
import { GOOGLE_STATIC_MAPS_KEY } from '../lib/config'

  interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  audioUrl?: string
  isTyping?: boolean
  intent?: string
  confidence?: number
    suggestedBusinesses?: Array<{
      id: string
      name: string
      distance?: string
      rating?: number
      category?: string
      phone?: string
      latitude?: number
      longitude?: number
      address?: string
    }>
  followUpSuggestions?: string[]
}

const ChatPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [message, setMessage] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [language, setLanguage] = useState('rw')
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [isProcessingVoice, setIsProcessingVoice] = useState(false)
  const [conversationContext, setConversationContext] = useState<any[]>([])
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const voiceManagerRef = useRef<VoiceManager | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Initialize advanced voice system
  useEffect(() => {
    // Initialize VoiceManager with Rwanda-specific configuration
    voiceManagerRef.current = new VoiceManager({
      language: language as 'rw' | 'en',
      continuous: false,
      interimResults: true,
      maxAlternatives: 3,
      voiceGender: 'female',
      speechRate: 0.9,
      pitch: 1.0,
      volume: 0.8
    });

    const voiceManager = voiceManagerRef.current;

    // Set up voice recognition callbacks
    voiceManager.onVoiceResult((result: VoiceRecognitionResult) => {
      if (result.isFinal) {
        setMessage(result.transcript);
        setIsProcessingVoice(false);
        setIsListening(false);
        
        // Detect language automatically
        const isKinyarwanda = voiceUtils.detectKinyarwanda(result.transcript);
        if (isKinyarwanda && language !== 'rw') {
          setLanguage('rw');
          toast.info('🇷🇼 Kinyarwanda detected');
        } else if (!isKinyarwanda && language !== 'en') {
          setLanguage('en');
          toast.info('🇺🇸 English detected');
        }

        toast.success(
          language === 'rw' 
            ? `Nabonye! (${Math.round(result.confidence * 100)}% sure)` 
            : `Got it! (${Math.round(result.confidence * 100)}% confidence)`
        );
        
        // Auto-send the voice message after a short delay
        setTimeout(() => {
          if (result.transcript.trim()) {
            handleSendMessage(result.transcript);
          }
        }, 800);
      } else {
        // Show interim results
        setMessage(result.transcript);
      }
    });

    voiceManager.onVoiceError((error: string) => {
      setIsProcessingVoice(false);
      setIsListening(false);
      toast.error(error);
    });

    voiceManager.onVoiceStatusChange((status: string) => {
      switch (status) {
        case 'listening':
          setIsProcessingVoice(true);
          toast.info(language === 'rw' ? 'Ndaguhagaragije... vuga ibyo ushaka' : 'Listening... speak now');
          break;
        case 'stopped':
          setIsProcessingVoice(false);
          setIsListening(false);
          break;
        case 'error':
          setIsProcessingVoice(false);
          setIsListening(false);
          break;
      }
    });

    // Get user location for better recommendations
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          toast.success('📍 Location detected for better recommendations');
        },
        (error) => {
          console.log('Location access denied, using fallback');
        }
      );
    }

    return () => {
      voiceManager.destroy();
    };
  }, [language])

  // Enhanced voice synthesis function
  const speakMessage = useCallback(async (text: string, emotion: 'neutral' | 'friendly' | 'excited' | 'calm' | 'urgent' = 'friendly') => {
    if (!voiceEnabled || !voiceManagerRef.current) return;

    try {
      // Format text for better speech
      const speechText = voiceUtils.formatForSpeech(text, language);
      
      await voiceManagerRef.current.speak({
        text: speechText,
        language: language as 'rw' | 'en',
        gender: 'female',
        rate: 0.9,
        pitch: 1.0,
        volume: 0.8,
        emotion
      });
    } catch (error) {
      console.error('Speech synthesis error:', error);
    }
  }, [language, voiceEnabled]);

  // Advanced voice recognition toggle
  const toggleVoiceRecognition = () => {
    if (!voiceManagerRef.current) {
      toast.error('Voice recognition not supported in this browser');
      return;
    }

    if (isListening) {
      voiceManagerRef.current.stopListening();
      setIsListening(false);
    } else {
      // Update language setting
      voiceManagerRef.current.setLanguage(language as 'rw' | 'en');
      
      const success = voiceManagerRef.current.startListening();
      if (success) {
        setIsListening(true);
      } else {
        toast.error('Failed to start voice recognition');
      }
    }
  };

  // Add welcome message when component mounts
  useEffect(() => {
    const welcomeMessage: Message = {
      id: '1',
      role: 'assistant',
      content: language === 'rw' 
        ? 'Muraho! Ndi umufasha wawe w\'ubwenge bwihuliye muri BizMap Rwanda. Mbwira ibyo ushaka kugura cyangwa serivise ushaka, nzagufasha kubona abantu bakora neza hafi yawe!'
        : 'Hello! I\'m your AI assistant for BizMap Rwanda. Tell me what you\'re looking for and I\'ll help you find the best businesses near you!',
      timestamp: new Date()
    }
    setMessages([welcomeMessage])
  }, [language])

  const quickSuggestions = {
    rw: [
      "Nshaka restaurant nziza mu Kigali",
      "Hari famasi ifungura ubu?",
      "Ndashaka hoteli nziza",
      "Amakuru y\'imodoka yo gukodesha",
      "Mbere gushakisha aho kuraguza"
    ],
    en: [
      "Find good restaurants in Kigali",
      "What pharmacies are open now?",
      "Show me hotels with good ratings",
      "Car rental services nearby",
      "Best shopping places in town"
    ]
  }

  const handleSendMessage = async (voiceInput?: string) => {
    const messageText = voiceInput || message.trim()
    if (!messageText) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setMessage('')
    setIsTyping(true)

    // Update conversation context
    const newContext = [...conversationContext, userMessage].slice(-10) // Keep last 10 messages
    setConversationContext(newContext)

    try {
      // Try to use AI API first with comprehensive data
      const response = await fetch('http://localhost:8000/api/ai/chat/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('auth_token') && {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          })
        },
        body: JSON.stringify({
          message: messageText,
          language: language,
          user_location: userLocation,
          conversation_context: newContext,
          user_profile: user ? {
            name: user.first_name,
            preferences: user.preferences || {},
            location: {
              province: user.location_province,
              district: user.location_district
            }
          } : null,
          intent_analysis: true,
          voice_input: !!voiceInput,
          response_type: 'conversational'
        })
      })

      let aiResponse, suggestedBusinesses, followUpSuggestions, intent, confidence
      if (response.ok) {
        const data = await response.json()
        // Backend returns { success, data: { ai_response, search_results, ... }, conversation_id }
        const payload = data?.data || data
        const ai = payload?.ai_response || payload
        aiResponse = ai?.response || data.response || data.message
        // Map backend search_results to UI shape
        const backendResults = payload?.search_results || []
        suggestedBusinesses = backendResults.map((b: any) => ({
          id: b.business_id,
          name: b.name || b.business_name,
          distance: b.distance,
          rating: b.rating,
          category: b.category,
          phone: b.phone,
          latitude: b.latitude,
          longitude: b.longitude,
          address: b.address
        }))
        followUpSuggestions = ai?.suggestions || []
        intent = ai?.conversation_state?.last_intent || payload?.intent_analysis?.intent
        confidence = ai?.conversation_state?.confidence || payload?.intent_analysis?.confidence
      } else {
        throw new Error('API not available')
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
        suggestedBusinesses,
        followUpSuggestions,
        intent,
        confidence
      }

      setMessages(prev => [...prev, assistantMessage])
      
      // Speak the response if voice is enabled
      if (voiceEnabled && aiResponse) {
        speakMessage(aiResponse)
      }
      
      setIsTyping(false)
    } catch (error) {
      // Revolutionary AI fallback with context awareness and emotion
      const getRevolutionaryResponse = (userInput: string, lang: string, context: Message[]) => {
        const input = userInput.toLowerCase()
        const userName = user?.first_name || (lang === 'rw' ? 'mugenzi' : 'friend')
        const previousMessages = context.slice(-3).map(m => m.content.toLowerCase()).join(' ')
        
        // Detect user emotion and urgency
        const isUrgent = input.includes('emergency') || input.includes('byihutirwa') || input.includes('help') || input.includes('fasha')
        const isConfused = input.includes('sinzi') || input.includes("don't know") || input.includes('confused')
        const isNew = input.includes('mushya') || input.includes('new') || input.includes('first time')
        
        // Food/Restaurant with context awareness
        if (input.includes('food') || input.includes('eat') || input.includes('restaurant') || 
            input.includes('kurya') || input.includes('ifunguro') || input.includes('narira')) {
          
          if (isNew || isConfused) {
            return lang === 'rw' 
              ? `Eeeehhh ${userName}! Ndumva ko uri mushya cyangwa se ntuwazi neza aho wagera kurya? Ntakibazo rwose, nanjye nabanje kuba nkiri mushya mu Kigali! 😊 

Reka ngufashe nkamenyesha ahantu hazwi neza, hakunda gutanga ibiryo byiza:

🍽️ **HEAVEN RESTAURANT** (★4.8) - Iri muri Nyarugenge, ni resto nzuri cyane, bagira ibirayi n'amaru, umuceri, n'ibindi. Abantu benshi bikundira!

🍽️ **REPUB LOUNGE** (★4.7) - Hafi ya City Centre, bagira ibiryo by'ubwoko bwose

🍽️ **NEW CACTUS** (★4.5) - Ni hantu heza cyo gusangira n'inshuti

Ni ayahe ushaka? Cyangwa ubwira ibiryo wishaka cyane cyane? Ibirayi gusa, cyangwa ukunda ibiryo by'amahanga?`
              : `Heyyy ${userName}! I can see you're looking for food and maybe you're new around here? No worries at all, I was new in Kigali once too! 😊

Let me help you find some amazing places that locals actually love:

🍽️ **HEAVEN RESTAURANT** (★4.8) - In Nyarugenge, famous for traditional Rwandan food, rice, and great atmosphere

🍽️ **REPUB LOUNGE** (★4.7) - Near City Centre, they have everything from local to international cuisine  

🍽️ **NEW CACTUS** (★4.5) - Great place to hang out with friends

Which one sounds good to you? Or tell me what you're really craving - traditional Rwandan food, international, or something quick?`
          }

          // Returning customer
          return lang === 'rw' 
            ? `Muraho ${userName}! Komeza uri gushaka aho kurira? Ni byiza cyane ko uje kuri twe! 😊

Mu gihe rwose, ndaguha ahantu hagezweho h'ibiryo byiza:
• **Heaven Restaurant** (0.3km) - ★4.8 - Ibirayi byiza cyane!  
• **Meze Fresh** (0.5km) - ★4.6 - Ibiryo bishya byoroheje
• **Khana Khazana** (0.8km) - ★4.7 - Curry nziza!

Waba ufite ikintu cyihariye wishaka? Cyangwa ni imbaraga ukeneye, cyangwa ibiryo biroroshye?`
            : `Hey there ${userName}! Back for more food adventures? Love that! 😊

Here are some spots I think you'll really enjoy:
• **Heaven Restaurant** (0.3km) - ★4.8 - Amazing traditional dishes!  
• **Meze Fresh** (0.5km) - ★4.6 - Fresh, healthy options
• **Khana Khazana** (0.8km) - ★4.7 - Best curry in town!

What are you in the mood for today? Something hearty and filling, or light and fresh?`
        }
        
        // Emergency/Car problems - URGENT situations
        if (input.includes('imodoka') && (input.includes('irapfuye') || input.includes('imaze')) || 
            input.includes('car') && (input.includes('broken') || input.includes('problem')) ||
            input.includes('emergency') || input.includes('byihutirwa')) {
          
          return lang === 'rw'
            ? `Oooooh ${userName}! Imodoka yawe yagize ikibazo? Wihangane pe, nzagufasha rwose! 🚗💔

Mbona ahantu turi:
📍 **GARAGE YA KIMISAGARA** (0.2km) - Tel: +250788123456 - 24/7
📍 **AUTO GARAGE CENTRAL** (0.5km) - Tel: +250788654321 - Bazi imodoka zose
📍 **SINA MOTORS** (0.8km) - Tel: +250788789123 - Abanyamuryango bazima

Hamagara kuri iyi numero ya mbere: **+250788123456** - Ni bombi bazajya bakugufasha!

Ni iki cyihariye cyagiye nabi? Moteri, amapine, cyangwa se ntishobora gutangira? Mbwira nkamenyesha ababufasha neza!`
            : `Oooh no ${userName}! Car trouble? Don't panic, I've got you covered! 🚗💔

Here are the closest garages:
📍 **KIMISAGARA GARAGE** (0.2km) - Tel: +250788123456 - 24/7 service  
📍 **AUTO GARAGE CENTRAL** (0.5km) - Tel: +250788654321 - All car types
📍 **SINA MOTORS** (0.8km) - Tel: +250788789123 - Professional mechanics

Call this number NOW: **+250788123456** - They'll send someone to help!

What exactly happened? Engine, tires, or won't start? Tell me so I can give them details!`
        }

        // Transport/Moto related
        if (input.includes('moto') || input.includes('transport') || input.includes('genda') || 
            input.includes('taxi') || input.includes('bus')) {
          return lang === 'rw'
            ? `Ahhhh ${userName}, ushaka transport? Ni byiza! 🏍️

Hano mu Rwanda harimo uburyo bwinshi bwo kujya:
🏍️ **MOTO** - 200-500 RWF (hagati mu mujyi)
🚗 **TAXI** - 3,000-15,000 RWF ukurikije intera  
🚌 **BUS** - 200-500 RWF (ni byoroshye cyane!)

Ushaka kujya he cyane cyane? Mbwira ahagana tugafate inzira nziza kandi itihenze!

Kandi witwaye neza: koresha helmet mu moto, koresha seatbelt mu imodoka! Safety first! 🛡️`
            : `Ahhh ${userName}, need transport? Got you! 🏍️

Here are your options in Rwanda:
🏍️ **MOTORCYCLE** - 200-500 RWF (within city)
🚗 **TAXI** - 3,000-15,000 RWF depending on distance
🚌 **BUS** - 200-500 RWF (very convenient!)

Where exactly do you want to go? Tell me and I'll help you find the best and cheapest route!

And stay safe: wear helmet on moto, seatbelt in cars! Safety first! 🛡️`
        }

        // Shopping/Market related
        if (input.includes('shop') || input.includes('buy') || input.includes('market') || 
            input.includes('gura') || input.includes('isoko') || input.includes('kugura')) {
          return lang === 'rw'
            ? `Eeehhh ${userName}! Ushaka gucuruza? Ni ikintu gishimishije! 🛍️

Hano mu Kigali harimo amasoko menshi azwi neza:
🏪 **KIMISAGARA MARKET** - Ibiciro bihendutse, ibintu byose ubishobora kubona!
🏬 **UTC/CITY PLAZA** - Ibintu byiza, shops nyinshi 
🏢 **KIGALI HEIGHTS** - Modern shopping, restaurants, cinema

Ni iki ushaka kugura cyane cyane? Imyenda, ibiryo, electronics, telephone? Mbwira nkamenya ko ngufasha neza!

Kandi wibare amafaranga yawe neza - ntugure ibyo ukeneye cyane! 💰`
            : `Eeehhh ${userName}! Looking to shop? That's exciting! 🛍️

Kigali has amazing shopping spots:
🏪 **KIMISAGARA MARKET** - Affordable prices, you can find everything!
🏬 **UTC/CITY PLAZA** - Quality items, many shops
🏢 **KIGALI HEIGHTS** - Modern shopping, restaurants, cinema

What exactly are you looking to buy? Clothes, food, electronics, phone? Tell me so I can guide you to the right place!

And budget wisely - only buy what you really need! 💰`
        }

        // Health/Medical - PRIORITY responses
        if (input.includes('health') || input.includes('doctor') || input.includes('hospital') || input.includes('pharmacy') ||
            input.includes('ubuzima') || input.includes('muganga') || input.includes('famasi') || input.includes('indwara') ||
            input.includes('sick') || input.includes('narwaye') || input.includes('mubabaza')) {
          
          const isEmergency = input.includes('emergency') || input.includes('byihutirwa') || input.includes('serious') || input.includes('bad')
          
          if (isEmergency) {
            return lang === 'rw'
              ? `🚨 ${userName}! Iri ni by'ubuzima! Ntukagire ubwoba, ariko kugomba kwihutira!

HAMAGARA EMERGENCY: **114** - Police/Ambulance
📍 **KING FAISAL HOSPITAL** - +250788385000 - 24/7 Emergency
📍 **CHUK** - +250788123000 - University Hospital  
📍 **KIBAGABAGA HOSPITAL** - +250788456000

Waba ukeneye Ambulance? Hamagara 114 NONAHA!

Mbwira ni iki kibaye neza - naragusubira nyuma y'uko uhamagaje!`
              : `🚨 ${userName}! This is about health! Don't worry, but we need to act quickly!

CALL EMERGENCY: **114** - Police/Ambulance
📍 **KING FAISAL HOSPITAL** - +250788385000 - 24/7 Emergency
📍 **CHUK** - +250788123000 - University Hospital
📍 **KIBAGABAGA HOSPITAL** - +250788456000

Do you need an ambulance? Call 114 RIGHT NOW!

Tell me what happened - I'll check back with you after you call!`
          }

          // Regular health needs
          return lang === 'rw'
            ? `${userName}, ubuzima ni ingenzi cyane! Nzagufasha kubona amahitamo meza 🏥

AMAHITAMO/HOSPITALS:
🏥 **KING FAISAL** - Modern, bya hejuru
🏥 **CHUK** - University Hospital, specialists
🏥 **KIBAGABAGA** - Good doctors, affordable
🏥 **KANOMBE MILITARY** - Military hospital

AMAFAMASI/PHARMACIES 24/7:
💊 **PHARMEX** - City Centre, afungura ubushiku n'umunsi
💊 **SIMBA SUPERMARKET** - Harimo famasi ndani
💊 **NAKUMATT** - Kimihurura, famasi nziza

Ni iki ukeneye cyane cyane? Ugomba kubona muganga? Cyangwa gusa imiti?`
            : `${userName}, health is very important! Let me find you the best options 🏥

HOSPITALS:
🏥 **KING FAISAL** - Modern, top-quality
🏥 **CHUK** - University Hospital, specialists  
🏥 **KIBAGABAGA** - Good doctors, affordable
🏥 **KANOMBE MILITARY** - Military hospital

24/7 PHARMACIES:
💊 **PHARMEX** - City Centre, open day and night
💊 **SIMBA SUPERMARKET** - Has pharmacy inside
💊 **NAKUMATT** - Kimihurura, good pharmacy

What do you need specifically? Do you need to see a doctor? Or just medicine?`
        }

        // Friendly/Social related
        if (input.includes('gusuzugura') || input.includes('fun') || input.includes('entertainment') || 
            input.includes('friends') || input.includes('inshuti') || input.includes('party')) {
          return lang === 'rw'
            ? `Eeeehhh ${userName}! Ushaka gusuzugura? Ni byiza cyane! Ubuzima bugomba kubamo n'uruhare! 🎉

AHANTU HAGEZWEHO:
🍺 **REPUBLIKA LOUNGE** - Nyarugenge, good music na drinks
🎵 **HEAVEN CLUB** - Dancing, DJ's, atmosphere nziza  
🎬 **CENTURY CINEMA** - Movies, popcorn, dating spot
🏊 **KIGALI SERENA** - Pool, drinks, relaxing
🎯 **BOWLING** - Kigali Heights, games na friends

Waba ufite inshuti? Ni week-end cyangwa weekday? Weekend ni ahantu hagiye gutaha! 😄

Kandi bana bamatsiko: nywa mu buhangane, ushire mu buhangane! 🍻`
            : `Eeeehhh ${userName}! Looking for fun? That's great! Life needs some fun too! 🎉

BEST SPOTS:
🍺 **REPUBLIKA LOUNGE** - Nyarugenge, good music and drinks
🎵 **HEAVEN CLUB** - Dancing, DJ's, great atmosphere
🎬 **CENTURY CINEMA** - Movies, popcorn, date spot  
🏊 **KIGALI SERENA** - Pool, drinks, relaxing
🎯 **BOWLING** - Kigali Heights, games with friends

Do you have friends with you? Is it weekend or weekday? Weekends are when it gets really fun! 😄

And small advice: drink responsibly, party responsibly! 🍻`
        }

        // Shopping related
        if (input.includes('shop') || input.includes('buy') || input.includes('market') || input.includes('store') ||
            input.includes('gura') || input.includes('isoko') || input.includes('duka') || input.includes('gucuruza')) {
          return lang === 'rw'
            ? `Gucuruza ni ikintu gishimishije! Mu Kigali harimo ahantu henshi hazwi cyane: Kimisagara Market ibi ari ibiciro bihendutse, UTC na City Plaza ibi ari ibintu byiza, na Kigali Heights ibintu bya kimoderne. Ni iki ushaka kugura cyane cyane? Imyenda, ibiryo, electronics, cyangwa ibindi?`
            : `Shopping is exciting! Kigali has amazing options: Kimisagara Market for affordable local goods, UTC and City Plaza for quality items, and Kigali Heights for modern shopping. What specifically are you looking to buy? Clothes, food, electronics, or something else?`
        }

        // Emergency/Help related
        if (input.includes('help') || input.includes('emergency') || input.includes('problem') || input.includes('broken') ||
            input.includes('fasha') || input.includes('byihutirwa') || input.includes('ikibazo') || input.includes('gupfuye')) {
          return lang === 'rw'
            ? `Ooooh, humura! Ndumva uri mu bibazo ariko nzagufasha rwose. Mbwira icyo kibaye nkamenya uko ngufasha neza. Ni ikibazo cy'imodoka, cy'ubuzima, cyangwa ikindi kintu? Ugomba kwihutisha cyangwa se hari igihe?`
            : `Oh no, don't worry! I can see you need help and I'm here for you. Tell me exactly what's happening so I can assist you properly. Is it a car problem, health issue, or something else? Is this urgent or do we have time to find the best solution?`
        }

        // Default friendly response with personality
        const encouragements = {
          rw: [
            `Muraho ${userName}! 😊 Ndumva ko ushaka ikintu ariko ntasobanuye neza. Ni nka ubwo ujya mu duka ukabaza "hari iki" - mbwira neza icyo ushaka nkamenya ko ngufasha!`,
            `Eeehhh ${userName}! Ndashaka kugufasha ariko sinsobanuye neza icyo ushaka. Urashobora kunyegeza? Nkuri mugenzi wawe - mbwira mu buryo bworoheje!`,
            `${userName} mugenzi! Nzi ko ushaka ikintu cyiza ariko ntari nsanga icyo uri gushaka. Reka dufate ibyo neza: ni byose kugura? kurya? kujya ahantu? Mbwira!`
          ],
          en: [
            `Hey ${userName}! 😊 I can see you need something but I'm not quite catching what. It's like when you go to a shop and just say "what do you have" - tell me specifically what you're looking for!`,
            `Eeeehhh ${userName}! I want to help but I'm not getting exactly what you need. Can you give me a hint? I'm like your friend here - just tell me simply!`,
            `${userName} my friend! I know you want something good but I'm not quite catching what you're looking for. Let's break it down: is it about buying something? eating? going somewhere? Tell me!`
          ]
        }
        
        const responses = encouragements[lang] || encouragements.en
        const randomResponse = responses[Math.floor(Math.random() * responses.length)]
        
        return randomResponse + `\n\n💡 **Try saying:**\n${lang === 'rw' ? '• "Nshaka kurya"\n• "Hari aho najya gusuzugura?"\n• "Telefoni yanje yagize ikibazo"\n• "Nshaka kugura imyenda"' : '• "I want to eat"\n• "Where can I have fun?"\n• "My phone has a problem"\n• "I want to buy clothes"'}`
      }

      const revolutionaryResponse = getRevolutionaryResponse(messageText, language, newContext)

      // Create mock suggested businesses based on intent
      const mockBusinesses = messageText.toLowerCase().includes('kurya') || messageText.toLowerCase().includes('food') || messageText.toLowerCase().includes('eat') ? [
        { id: '1', name: 'Heaven Restaurant', distance: '0.3km', rating: 4.8, category: 'Restaurant' },
        { id: '2', name: 'Meze Fresh', distance: '0.5km', rating: 4.6, category: 'Healthy Food' },
        { id: '3', name: 'Repub Lounge', distance: '0.7km', rating: 4.7, category: 'Restaurant & Bar' }
      ] : []

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: revolutionaryResponse,
        timestamp: new Date(),
        suggestedBusinesses: mockBusinesses,
        intent: 'food_search',
        confidence: 0.95
      }

      setMessages(prev => [...prev, assistantMessage])
      
      // Speak the response if voice is enabled
      if (voiceEnabled && revolutionaryResponse) {
        speakMessage(revolutionaryResponse)
      }
      
      setIsTyping(false)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setMessage(suggestion)
  }

  const clearChat = () => {
    setMessages([])
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: language === 'rw' 
        ? 'Muraho! Ndi umufasha wawe w\'ubwenge bwihuliye muri BizMap Rwanda. Mbwira ibyo ushaka!'
        : 'Hello! I\'m your AI assistant for BizMap Rwanda. What can I help you find today?',
      timestamp: new Date()
    }
    setMessages([welcomeMessage])
  }

  const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
    const isUser = message.role === 'user'
    
    return (
      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6`}>
        <div className={`flex items-start space-x-3 max-w-[85%] ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            isUser ? 'bg-[#0D80F2] text-white' : 'bg-gradient-to-br from-[#EBA910] to-yellow-600 text-black'
          }`}>
            {isUser ? <User size={18} /> : <Bot size={18} />}
          </div>
          
          <div className={`rounded-2xl px-5 py-4 ${
            isUser 
              ? 'bg-[#0D80F2] text-white rounded-br-sm shadow-lg' 
              : 'bg-white text-gray-900 rounded-bl-sm shadow-lg border border-gray-100'
          }`}>
            <div className="space-y-3">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {message.content}
              </p>
              
              {/* Show suggested businesses */}
              {message.suggestedBusinesses && message.suggestedBusinesses.length > 0 && (
                <div className="border-t pt-3 space-y-2">
                  <h4 className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                    {language === 'rw' ? 'Amasosiyete yagutsembatsemba:' : 'Suggested Businesses:'}
                  </h4>
                  {message.suggestedBusinesses.map((business) => (
                    <div 
                      key={business.id}
                      className="bg-gray-50 rounded-lg p-3 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="font-medium text-sm text-gray-900">{business.name}</h5>
                          <p className="text-xs text-gray-600">{business.category}</p>
                          {business.address && (
                            <p className="text-xs text-gray-500">{business.address}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-1">
                            <span className="text-xs text-yellow-600">★</span>
                            <span className="text-xs text-gray-600">{business.rating || '-'}</span>
                          </div>
                          {business.distance && (
                            <p className="text-xs text-gray-500">{business.distance}</p>
                          )}
                        </div>
                      </div>
                      {/* Mini map thumbnail */}
                      {(business.latitude && business.longitude) && (
                        <div className="mt-2">
                          <img
                            src={`https://maps.googleapis.com/maps/api/staticmap?center=${business.latitude},${business.longitude}&zoom=15&size=300x120&markers=color:blue%7C${business.latitude},${business.longitude}${GOOGLE_STATIC_MAPS_KEY ? `&key=${GOOGLE_STATIC_MAPS_KEY}` : ''}`}
                            alt="Map preview"
                            className="w-full h-24 object-cover rounded-md border"
                            onError={(e) => {
                              // Hide image if no API key or blocked
                              (e.currentTarget as HTMLImageElement).style.display = 'none'
                            }}
                          />
                        </div>
                      )}

                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => navigate(`/business/${business.id}`)}>
                          View
                        </Button>
                        {business.phone && (
                          <a href={`tel:${business.phone}`}>
                            <Button size="sm" variant="outline" className="h-7 text-xs">Call</Button>
                          </a>
                        )}
                        {(business.latitude && business.longitude) && (
                          <a target="_blank" rel="noopener noreferrer" href={`https://www.google.com/maps?q=${business.latitude},${business.longitude}`}>
                            <Button size="sm" variant="outline" className="h-7 text-xs">Map</Button>
                          </a>
                        )}
                        {(business.latitude && business.longitude && userLocation) && (
                          <a target="_blank" rel="noopener noreferrer" href={`https://www.google.com/maps/dir/?api=1&origin=${userLocation.latitude},${userLocation.longitude}&destination=${business.latitude},${business.longitude}`}> 
                            <Button size="sm" variant="outline" className="h-7 text-xs">Guide me</Button>
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Show follow-up suggestions */}
              {message.followUpSuggestions && message.followUpSuggestions.length > 0 && (
                <div className="border-t pt-3 space-y-2">
                  <h4 className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                    {language === 'rw' ? 'Urashobora no kubaza:' : 'You can also ask:'}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {message.followUpSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => setMessage(suggestion)}
                        className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-100 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-200">
              <div className={`text-xs ${isUser ? 'text-blue-100' : 'text-gray-500'}`}>
                {message.timestamp.toLocaleTimeString()}
              </div>
              
              {!isUser && (
                <div className="flex items-center space-x-2">
                  {message.confidence && (
                    <Badge variant="outline" className="text-xs">
                      {Math.round(message.confidence * 100)}% sure
                    </Badge>
                  )}
                  {voiceEnabled && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => speakMessage(message.content)}
                      className="p-1 h-6 w-6"
                    >
                      <Volume2 size={12} />
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const TypingIndicator = () => (
    <div className="flex justify-start mb-4">
      <div className="flex items-start space-x-3 max-w-[80%]">
        <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center">
          <Bot size={16} />
        </div>
        <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="h-screen bg-white flex">
      {/* Sidebar */}
      <div className="w-80 bg-gray-50 border-r flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="p-1"
            >
              <ArrowLeft size={20} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearChat}
              className="p-2 text-red-600 hover:text-red-700"
            >
              <X size={18} />
            </Button>
          </div>
          
          <div className="flex items-center space-x-2 mb-4">
            <Bot className="w-6 h-6 text-[#0D80F2]" />
            <div>
              <h3 className="font-semibold text-gray-900">AI Mode</h3>
              <p className="text-xs text-gray-500">Intelligent Business Assistant</p>
            </div>
          </div>

          {/* Language Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Language / Ururimi</label>
            <div className="flex gap-2">
              <Button
                variant={language === 'rw' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLanguage('rw')}
                className="flex-1"
              >
                🇷🇼 Kiny
              </Button>
              <Button
                variant={language === 'en' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLanguage('en')}
                className="flex-1"
              >
                🇺🇸 EN
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Suggestions */}
        <div className="p-4 flex-1 overflow-y-auto">
          <h4 className="font-medium mb-3">Quick Questions:</h4>
          <div className="space-y-2">
            {quickSuggestions[language as keyof typeof quickSuggestions].map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full p-3 text-left bg-white hover:bg-gray-100 rounded-lg text-sm transition-colors border"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b bg-blue-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-6 h-6 text-[#0D80F2]" />
                <div>
                  <h3 className="font-semibold text-gray-900">BizMap AI Assistant</h3>
                  <p className="text-xs text-gray-500">
                    {language === 'rw' ? 'Umufasha w\'ubwenge bwihuliye' : 'Your intelligent business finder'}
                  </p>
                </div>
              </div>
            </div>
            
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              ● Online
            </Badge>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <Bot className="w-16 h-16 text-[#0D80F2] mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {language === 'rw' ? 'Murakaza neza kuri BizMap AI!' : 'Welcome to BizMap AI!'}
              </h3>
              <p className="text-gray-600 mb-6 max-w-md">
                {language === 'rw' 
                  ? 'Ndi umufasha wawe w\'ubwenge bwihuliye wo kubona amasosiyete mu Rwanda. Mbwira ibyo ushaka mu Kinyarwanda, Icyongereza, cyangwa Igifaransa!'
                  : 'I\'m your intelligent assistant for discovering businesses in Rwanda. Ask me anything in Kinyarwanda, English, or French!'
                }
              </p>
            </div>
          ) : (
            <div>
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              {isTyping && <TypingIndicator />}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t bg-gradient-to-r from-blue-50 to-yellow-50">
          {/* Voice Status */}
          {(isListening || isProcessingVoice) && (
            <div className="mb-3 p-3 bg-white rounded-lg border-l-4 border-l-[#EBA910] shadow-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">
                  {isProcessingVoice 
                    ? (language === 'rw' ? 'Ndaguhagaragije...' : 'Processing your voice...')
                    : (language === 'rw' ? 'Vuga ibyo ushaka...' : 'Speak now...')
                  }
                </span>
              </div>
            </div>
          )}

          <div className="flex items-end space-x-3">
            <div className="flex-1">
              <div className="relative">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  placeholder={language === 'rw' ? 'Mbwira ibyo ushaka... cyangwa ukande 🎤' : 'Ask me anything... or tap 🎤'}
                  className="pr-20 py-4 rounded-full border-2 focus:border-[#0D80F2] bg-white shadow-sm"
                  disabled={isTyping || isProcessingVoice}
                />
                
                {/* Voice Button */}
                <button
                  onClick={toggleVoiceRecognition}
                  className={`absolute right-12 top-1/2 -translate-y-1/2 p-2 rounded-full transition-all duration-200 ${
                    isListening 
                      ? 'text-red-500 bg-red-100 scale-110' 
                      : isProcessingVoice
                      ? 'text-yellow-600 bg-yellow-100 animate-pulse'
                      : 'text-[#EBA910] hover:text-yellow-700 hover:bg-yellow-50'
                  }`}
                  disabled={isTyping}
                  title={language === 'rw' ? 'Koresha ijwi' : 'Use voice'}
                >
                  {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                </button>

                {/* Voice Toggle */}
                <button
                  onClick={() => setVoiceEnabled(!voiceEnabled)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full ${
                    voiceEnabled 
                      ? 'text-green-600 hover:bg-green-50' 
                      : 'text-gray-400 hover:bg-gray-50'
                  }`}
                  title={language === 'rw' ? 'Fungura/Funga ijwi' : 'Toggle voice responses'}
                >
                  {voiceEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                </button>
              </div>
              
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center space-x-3">
                  <Badge variant="outline" className="text-xs border-[#0D80F2] text-[#0D80F2]">
                    {language === 'rw' ? '🇷🇼 Kinyarwanda' : '🇺🇸 English'}
                  </Badge>
                  {voiceEnabled && (
                    <Badge variant="outline" className="text-xs border-[#EBA910] text-[#EBA910]">
                      🔊 Voice ON
                    </Badge>
                  )}
                  {userLocation && (
                    <Badge variant="outline" className="text-xs border-green-500 text-green-600">
                      📍 Located
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  {message.length}/500
                </p>
              </div>
            </div>
            
            <Button
              onClick={() => handleSendMessage()}
              disabled={!message.trim() || isTyping || isProcessingVoice}
              className="bg-gradient-to-r from-[#0D80F2] to-blue-600 hover:from-blue-700 hover:to-blue-800 text-white p-4 rounded-full shadow-lg transition-all duration-200 transform hover:scale-105"
              size="sm"
            >
              {isTyping ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Send size={18} />
              )}
            </Button>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center justify-center space-x-2 mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMessage(language === 'rw' ? 'Ndashaka kurya' : 'I want to eat')}
              className="text-xs border-[#EBA910] text-[#EBA910] hover:bg-[#EBA910] hover:text-black"
            >
              🍽️ {language === 'rw' ? 'Kurya' : 'Food'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMessage(language === 'rw' ? 'Imodoka yanje yagize ikibazo' : 'My car has a problem')}
              className="text-xs border-red-500 text-red-600 hover:bg-red-50"
            >
              🚗 {language === 'rw' ? 'Imodoka' : 'Car Help'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMessage(language === 'rw' ? 'Hari aho najya gusuzugura?' : 'Where can I have fun?')}
              className="text-xs border-purple-500 text-purple-600 hover:bg-purple-50"
            >
              🎉 {language === 'rw' ? 'Gusuzugura' : 'Fun'}
            </Button>
          </div>
        </div>
      </div>

      {/* Map Sidebar */}
      <div className="w-80 bg-gray-50 border-l p-4">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          View on Map
        </h3>
        <div className="bg-gray-200 rounded-lg h-64 flex items-center justify-center">
          <div className="text-center">
            <MapPin className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Map integration</p>
            <p className="text-xs text-gray-400">coming soon</p>
          </div>
        </div>
        
        {/* Business Results would appear here */}
        <div className="mt-4">
          <h4 className="font-medium text-sm mb-2">Suggested Businesses</h4>
          <div className="space-y-2">
            <Card className="p-3">
              <CardContent className="p-0">
                <h5 className="font-medium text-sm">Heaven Restaurant</h5>
                <p className="text-xs text-gray-600">★ 4.8 • Kigali</p>
              </CardContent>
            </Card>
            <Card className="p-3">
              <CardContent className="p-0">
                <h5 className="font-medium text-sm">Serena Hotel</h5>
                <p className="text-xs text-gray-600">★ 4.9 • Kigali</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChatPage;