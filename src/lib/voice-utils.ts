// Revolutionary Voice Integration Utilities for BusiMap Rwanda
// Supports Kinyarwanda, English, and French with advanced features

export interface VoiceConfig {
  language: 'rw' | 'en' | 'fr';
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  voiceGender: 'male' | 'female';
  speechRate: number;
  pitch: number;
  volume: number;
}

export interface VoiceRecognitionResult {
  transcript: string;
  confidence: number;
  language: string;
  alternatives: string[];
  isFinal: boolean;
}

export interface VoiceSynthesisOptions {
  text: string;
  language: 'rw' | 'en' | 'fr';
  gender: 'male' | 'female';
  rate: number;
  pitch: number;
  volume: number;
  emotion?: 'neutral' | 'friendly' | 'excited' | 'calm' | 'urgent';
}

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

export class VoiceManager {
  private recognition: SpeechRecognition | null = null;
  private synthesis: SpeechSynthesis | null = null;
  private isListening = false;
  private config: VoiceConfig;
  private onResult?: (result: VoiceRecognitionResult) => void;
  private onError?: (error: string) => void;
  private onStatusChange?: (status: string) => void;

  constructor(config: Partial<VoiceConfig> = {}) {
    this.config = {
      language: 'rw',
      continuous: false,
      interimResults: true,
      maxAlternatives: 3,
      voiceGender: 'female',
      speechRate: 1.0,
      pitch: 1.0,
      volume: 0.8,
      ...config
    };

    this.initializeRecognition();
    this.initializeSynthesis();
  }

  private initializeRecognition() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Speech recognition not supported');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();

    this.recognition.continuous = this.config.continuous;
    this.recognition.interimResults = this.config.interimResults;
    this.recognition.maxAlternatives = this.config.maxAlternatives;
    this.recognition.lang = this.getLanguageCode(this.config.language);

    this.recognition.onstart = () => {
      this.isListening = true;
      this.onStatusChange?.('listening');
    };

    this.recognition.onresult = (event) => {
      const results = Array.from(event.results);
      const lastResult = results[results.length - 1];
      
      if (lastResult) {
        const transcript = lastResult[0].transcript;
        const confidence = lastResult[0].confidence;
        const alternatives = Array.from(lastResult).slice(1).map(alt => alt.transcript);

        const result: VoiceRecognitionResult = {
          transcript: transcript.trim(),
          confidence: confidence || 0.9,
          language: this.config.language,
          alternatives,
          isFinal: lastResult.isFinal
        };

        this.onResult?.(result);
      }
    };

    this.recognition.onerror = (event) => {
      const errorMessage = this.getErrorMessage(event.error, this.config.language);
      this.onError?.(errorMessage);
      this.isListening = false;
      this.onStatusChange?.('error');
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.onStatusChange?.('stopped');
    };
  }

  private initializeSynthesis() {
    if ('speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis;
    }
  }

  private getLanguageCode(language: string): string {
    const languageMap = {
      'rw': 'rw-RW',
      'en': 'en-US',
      'fr': 'fr-FR'
    };
    return languageMap[language as keyof typeof languageMap] || 'en-US';
  }

  private getErrorMessage(error: string, language: string): string {
    const errorMessages = {
      'rw': {
        'no-speech': 'Ntabwo nabonye ijwi. Gerageza nanone.',
        'audio-capture': 'Hari ikibazo n\'ibikoresho by\'amajwi.',
        'not-allowed': 'Ntiwemerera gukoresha microphone.',
        'network': 'Hari ikibazo cy\'interineti.',
        'aborted': 'Byahagaritswe.',
        'default': 'Habaye ikosa. Gerageza nanone.'
      },
      'en': {
        'no-speech': 'No speech detected. Please try again.',
        'audio-capture': 'Audio capture error.',
        'not-allowed': 'Microphone access denied.',
        'network': 'Network error occurred.',
        'aborted': 'Speech recognition aborted.',
        'default': 'An error occurred. Please try again.'
      },
      'fr': {
        'no-speech': 'Aucune parole détectée. Veuillez réessayer.',
        'audio-capture': 'Erreur de capture audio.',
        'not-allowed': 'Accès au microphone refusé.',
        'network': 'Erreur réseau.',
        'aborted': 'Reconnaissance vocale interrompue.',
        'default': 'Une erreur s\'est produite. Veuillez réessayer.'
      }
    };

    const langErrors = errorMessages[language as keyof typeof errorMessages] || errorMessages.en;
    return langErrors[error as keyof typeof langErrors] || langErrors.default;
  }

  public startListening(): boolean {
    if (!this.recognition) {
      this.onError?.('Speech recognition not supported');
      return false;
    }

    if (this.isListening) {
      return false;
    }

    try {
      this.recognition.start();
      return true;
    } catch (error) {
      this.onError?.('Failed to start listening');
      return false;
    }
  }

  public stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  public speak(options: VoiceSynthesisOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synthesis) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      // Cancel any ongoing speech
      this.synthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(options.text);
      utterance.lang = this.getLanguageCode(options.language);
      utterance.rate = options.rate || this.config.speechRate;
      utterance.pitch = options.pitch || this.config.pitch;
      utterance.volume = options.volume || this.config.volume;

      // Find appropriate voice
      const voices = this.synthesis.getVoices();
      const preferredVoice = this.findBestVoice(voices, options.language, options.gender);
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      // Adjust for emotion
      if (options.emotion) {
        this.applyEmotionalTone(utterance, options.emotion);
      }

      utterance.onend = () => resolve();
      utterance.onerror = (event) => reject(new Error(`Speech synthesis error: ${event.error}`));

      this.synthesis.speak(utterance);
    });
  }

  private findBestVoice(voices: SpeechSynthesisVoice[], language: string, gender: string): SpeechSynthesisVoice | null {
    const langCode = this.getLanguageCode(language);
    
    // First, try to find exact language match with preferred gender
    let bestVoice = voices.find(voice => 
      voice.lang.startsWith(langCode.split('-')[0]) && 
      voice.name.toLowerCase().includes(gender)
    );

    // If not found, try any voice for the language
    if (!bestVoice) {
      bestVoice = voices.find(voice => voice.lang.startsWith(langCode.split('-')[0]));
    }

    // Fallback to default voice
    if (!bestVoice) {
      bestVoice = voices.find(voice => voice.default) || voices[0];
    }

    return bestVoice || null;
  }

  private applyEmotionalTone(utterance: SpeechSynthesisUtterance, emotion: string): void {
    switch (emotion) {
      case 'excited':
        utterance.rate = Math.min(utterance.rate * 1.2, 2.0);
        utterance.pitch = Math.min(utterance.pitch * 1.1, 2.0);
        break;
      case 'calm':
        utterance.rate = Math.max(utterance.rate * 0.8, 0.5);
        utterance.pitch = Math.max(utterance.pitch * 0.9, 0.5);
        break;
      case 'urgent':
        utterance.rate = Math.min(utterance.rate * 1.3, 2.0);
        utterance.volume = Math.min(utterance.volume * 1.1, 1.0);
        break;
      case 'friendly':
        utterance.pitch = Math.min(utterance.pitch * 1.05, 2.0);
        break;
    }
  }

  public setLanguage(language: 'rw' | 'en' | 'fr'): void {
    this.config.language = language;
    if (this.recognition) {
      this.recognition.lang = this.getLanguageCode(language);
    }
  }

  public onVoiceResult(callback: (result: VoiceRecognitionResult) => void): void {
    this.onResult = callback;
  }

  public onVoiceError(callback: (error: string) => void): void {
    this.onError = callback;
  }

  public onVoiceStatusChange(callback: (status: string) => void): void {
    this.onStatusChange = callback;
  }

  public getIsListening(): boolean {
    return this.isListening;
  }

  public isSupported(): boolean {
    return !!(
      ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) &&
      'speechSynthesis' in window
    );
  }

  public getSupportedLanguages(): string[] {
    return ['rw', 'en', 'fr'];
  }

  public destroy(): void {
    if (this.recognition) {
      this.recognition.abort();
      this.recognition = null;
    }
    if (this.synthesis) {
      this.synthesis.cancel();
    }
  }
}

// Utility functions for voice processing
export const voiceUtils = {
  // Detect if text contains Kinyarwanda
  detectKinyarwanda(text: string): boolean {
    const kinyarwandaWords = [
      'muraho', 'ndashaka', 'kurya', 'sinzi', 'aho', 'yego', 'oya', 'murakoze',
      'nibyo', 'ntakibazo', 'byamfasha', 'humura', 'rwose', 'kugura', 'gufasha',
      'amafunguro', 'imodoka', 'telefoni', 'famasi', 'muganga', 'ubuzima'
    ];
    
    const lowerText = text.toLowerCase();
    return kinyarwandaWords.some(word => lowerText.includes(word));
  },

  // Clean and format voice input
  cleanVoiceInput(text: string): string {
    return text
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s\-']/gi, '')
      .toLowerCase();
  },

  // Extract intent from voice input
  extractIntent(text: string, language: string): { intent: string, confidence: number } {
    const intents = {
      'rw': {
        'food': ['kurya', 'ifunguro', 'restaurant', 'gufungura'],
        'transport': ['moto', 'taxi', 'genda', 'kujya'],
        'emergency': ['byihutirwa', 'fasha', 'ikibazo'],
        'shopping': ['gura', 'isoko', 'duka'],
        'health': ['ubuzima', 'muganga', 'famasi', 'indwara']
      },
      'en': {
        'food': ['eat', 'food', 'restaurant', 'hungry', 'meal'],
        'transport': ['transport', 'taxi', 'moto', 'go', 'travel'],
        'emergency': ['emergency', 'help', 'problem', 'urgent'],
        'shopping': ['buy', 'shop', 'market', 'store'],
        'health': ['health', 'doctor', 'hospital', 'medicine', 'sick']
      }
    };

    const langIntents = intents[language as keyof typeof intents] || intents.en;
    const lowerText = text.toLowerCase();

    for (const [intent, keywords] of Object.entries(langIntents)) {
      const matches = keywords.filter(keyword => lowerText.includes(keyword));
      if (matches.length > 0) {
        const confidence = matches.length / keywords.length;
        return { intent, confidence };
      }
    }

    return { intent: 'general', confidence: 0.5 };
  },

  // Format response for speech
  formatForSpeech(text: string, language: string): string {
    let speechText = text;

    // Remove markdown and special characters
    speechText = speechText
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/#{1,6}\s/g, '')
      .replace(/\[.*?\]\(.*?\)/g, '')
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`([^`]+)`/g, '$1');

    // Remove emojis for speech
    speechText = speechText.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '');

    // Add natural pauses
    speechText = speechText
      .replace(/\./g, '. ')
      .replace(/,/g, ', ')
      .replace(/!/g, '! ')
      .replace(/\?/g, '? ');

    // Language-specific formatting
    if (language === 'rw') {
      // Add natural Kinyarwanda speech patterns
      speechText = speechText
        .replace(/eeehhh/gi, 'eeeh ')
        .replace(/yego/gi, 'yego, ')
        .replace(/oya/gi, 'oya, ');
    }

    return speechText.trim();
  }
};

export default VoiceManager;