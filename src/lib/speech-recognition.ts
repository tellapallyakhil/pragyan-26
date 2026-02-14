/**
 * Speech Recognition Utility
 * Uses the Web Speech API (SpeechRecognition) for real-time voice-to-text.
 * Supported in Chrome, Edge, and Safari.
 */

// Extend the Window interface for browser SpeechRecognition APIs
interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
    resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
    error: string;
    message: string;
}

interface SpeechRecognitionInstance extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start: () => void;
    stop: () => void;
    abort: () => void;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
    onend: (() => void) | null;
    onstart: (() => void) | null;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

/**
 * Check if the browser supports speech recognition
 */
export function isSpeechRecognitionSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return !!(
        (window as unknown as Record<string, unknown>).SpeechRecognition ||
        (window as unknown as Record<string, unknown>).webkitSpeechRecognition
    );
}

/**
 * Get the SpeechRecognition constructor
 */
function getSpeechRecognition(): SpeechRecognitionConstructor | null {
    if (typeof window === 'undefined') return null;
    const win = window as unknown as Record<string, SpeechRecognitionConstructor | undefined>;
    return win.SpeechRecognition || win.webkitSpeechRecognition || null;
}

export interface SpeechRecognitionOptions {
    language?: string;
    continuous?: boolean;
    onTranscript: (transcript: string, isFinal: boolean) => void;
    onError?: (error: string) => void;
    onStart?: () => void;
    onEnd?: () => void;
}

/**
 * Create and manage a speech recognition session
 */
export function createSpeechRecognizer(options: SpeechRecognitionOptions) {
    const SpeechRecognitionClass = getSpeechRecognition();

    if (!SpeechRecognitionClass) {
        return null;
    }

    const recognition = new SpeechRecognitionClass();

    // Configure
    recognition.continuous = options.continuous ?? true;
    recognition.interimResults = true;
    recognition.lang = mapLanguageCode(options.language || 'en');

    // Handle results
    recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            const transcript = result[0].transcript;

            if (result.isFinal) {
                finalTranscript += transcript + ' ';
            } else {
                interimTranscript += transcript;
            }
        }

        if (finalTranscript) {
            options.onTranscript(finalTranscript.trim(), true);
        } else if (interimTranscript) {
            options.onTranscript(interimTranscript, false);
        }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        const errorMessages: Record<string, string> = {
            'no-speech': 'No speech detected. Please try again.',
            'audio-capture': 'No microphone found. Please check your device.',
            'not-allowed': 'Microphone access denied. Please allow microphone access in your browser settings.',
            'network': 'Network error. Please check your internet connection.',
            'aborted': 'Speech recognition was aborted.',
        };

        const message = errorMessages[event.error] || `Speech recognition error: ${event.error}`;
        options.onError?.(message);
    };

    recognition.onstart = () => {
        options.onStart?.();
    };

    recognition.onend = () => {
        options.onEnd?.();
    };

    return {
        start: () => {
            try {
                recognition.start();
            } catch (err) {
                // If already started, stop and restart
                recognition.stop();
                setTimeout(() => recognition.start(), 100);
            }
        },
        stop: () => {
            try {
                recognition.stop();
            } catch {
                // Ignore if not started
            }
        },
        abort: () => {
            try {
                recognition.abort();
            } catch {
                // Ignore
            }
        },
    };
}

/**
 * Map our language codes to BCP-47 codes for Web Speech API
 */
function mapLanguageCode(code: string): string {
    const map: Record<string, string> = {
        en: 'en-US',
        es: 'es-ES',
        fr: 'fr-FR',
        de: 'de-DE',
        hi: 'hi-IN',
        ta: 'ta-IN',
        te: 'te-IN',
        zh: 'zh-CN',
        ar: 'ar-SA',
        ja: 'ja-JP',
    };
    return map[code] || 'en-US';
}
