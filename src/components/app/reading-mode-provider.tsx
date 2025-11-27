'use client';

import { useToast } from '@/hooks/use-toast';
import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';

interface ReadingModeContextType {
  isReadingMode: boolean;
  toggleReadingMode: () => void;
  speakText: (text: string, lang?: string) => void;
  isSupported: boolean;
}

const ReadingModeContext = createContext<ReadingModeContextType | undefined>(undefined);

type Lang = 'az' | 'en' | 'ru';

const toastTranslations = {
    az: {
        unsupportedTitle: "Dəstəklənməyən Brauzer",
        unsupportedDesc: "Brauzeriniz mətnin səsləndirilməsi funksiyasını dəstəkləmir.",
        enabledTitle: "Oxuma Modu Aktiv Edildi",
        enabledDesc: "Məzmunu dinləmək üçün siçan göstəricisini mətnlərin üzərinə gətirin.",
        disabledTitle: "Oxuma Modu Deaktiv Edildi",
    },
    en: {
        unsupportedTitle: "Unsupported Browser",
        unsupportedDesc: "Your browser does not support text-to-speech.",
        enabledTitle: "Reading Mode Enabled",
        enabledDesc: "Hover over text to listen to the content.",
        disabledTitle: "Reading Mode Disabled",
    },
    ru: {
        unsupportedTitle: "Неподдерживаемый браузер",
        unsupportedDesc: "Ваш браузер не поддерживает функцию преобразования текста в речь.",
        enabledTitle: "Режим чтения включен",
        enabledDesc: "Наведите курсор на текст, чтобы прослушать содержимое.",
        disabledTitle: "Режим чтения отключен",
    }
};


export function ReadingModeProvider({ children }: { children: ReactNode }) {
  const [isReadingMode, setIsReadingMode] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setIsSupported(true);
    }
  }, []);

  const toggleReadingMode = useCallback(() => {
    const currentLang = (localStorage.getItem('app-lang') as Lang) || 'az';
    const t = toastTranslations[currentLang];

    if (!isSupported) {
        toast({
            variant: "destructive",
            title: t.unsupportedTitle,
            description: t.unsupportedDesc,
        });
        return;
    }
    setIsReadingMode(prev => {
        const newState = !prev;
        if (!newState) {
            window.speechSynthesis.cancel(); // Turn off any ongoing speech
        }
        toast({
            title: newState ? t.enabledTitle : t.disabledTitle,
            description: newState ? t.enabledDesc : '',
        });
        return newState;
    });
  }, [isSupported, toast]);

  const speakText = useCallback((text: string, lang = 'az-AZ') => {
    if (!isReadingMode || !isSupported) return;

    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.onerror = (event) => {
        console.error("SpeechSynthesisUtterance.onerror", event);
    };
    window.speechSynthesis.speak(utterance);
  }, [isReadingMode, isSupported, toast]);

  return (
    <ReadingModeContext.Provider value={{ isReadingMode, toggleReadingMode, speakText, isSupported }}>
      {children}
    </ReadingModeContext.Provider>
  );
}

export function useReadingMode() {
  const context = useContext(ReadingModeContext);
  if (context === undefined) {
    throw new Error('useReadingMode must be used within a ReadingModeProvider');
  }
  return context;
}

    
