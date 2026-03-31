import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, AlertCircle, RotateCcw } from 'lucide-react';

interface VoiceEditorProps {
  prompt: string;
  onPromptChange: (prompt: string) => void;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
}

interface WindowWithSpeech extends Window {
  SpeechRecognition: new () => SpeechRecognition;
  webkitSpeechRecognition: new () => SpeechRecognition;
}

const VoiceEditor = ({ prompt, onPromptChange }: VoiceEditorProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(() => {
    if (typeof window !== 'undefined' && !('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      return 'Web Speech API is not supported in this browser.';
    }
    return null;
  });
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const promptRef = useRef(prompt);
  const isRecordingRef = useRef(isRecording);

  useEffect(() => {
    promptRef.current = prompt;
  }, [prompt]);

  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as unknown as WindowWithSpeech).SpeechRecognition || (window as unknown as WindowWithSpeech).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.lang = 'en-US';

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript) {
          const basePrompt = promptRef.current || '';
          const newPrompt = basePrompt ? `${basePrompt} ${finalTranscript}` : finalTranscript;
          promptRef.current = newPrompt;
          onPromptChange(newPrompt);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error', event.error);
        setError(`Error: ${event.error}`);
        setIsRecording(false);
      };

      recognition.onend = () => {
        if (isRecordingRef.current) {
          try {
            recognition.start();
          } catch (err) {
            console.warn('Failed to restart recognition after pause', err);
            setIsRecording(false);
          }
        } else {
          setIsRecording(false);
        }
      };
    }

    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      isRecordingRef.current = false;
    } else {
      setError(null);
      if (!recognitionRef.current) {
        setError('Speech recognition is unavailable.');
        return;
      }
      try {
        recognitionRef.current.start();
        setIsRecording(true);
        isRecordingRef.current = true;
      } catch (err) {
        console.error('Speech recognition start error', err);
        setError('Unable to start voice recognition.');
      }
    }
  };
  
  const handleClear = () => {
      onPromptChange('');
  };

  return (
    <div className="space-y-6 w-full flex flex-col items-center">
      <div className={`relative flex items-center justify-center w-32 h-32 rounded-full border-4 transition-all duration-300 ${isRecording ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-gray-50'}`}>
        {isRecording && (
          <div className="absolute inset-0 rounded-full animate-ping bg-red-200 opacity-75"></div>
        )}
        <button
          onClick={toggleRecording}
          className={`relative z-10 p-6 rounded-full transition-colors shadow-lg ${
            isRecording ? 'bg-red-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isRecording ? <MicOff size={40} /> : <Mic size={40} />}
        </button>
      </div>

      <div className="text-center space-y-2">
        <h3 className="text-lg font-medium text-gray-900">
          {isRecording ? 'Listening... \n Tap to stop' : 'Tap microphone to speak'}
        </h3>
        <p className="text-sm text-gray-500 max-w-xs mx-auto">
          {isRecording 
            ? 'Speak clearly about the changes you want to make.' 
            : 'We will convert your voice to a text prompt automatically.'}
        </p>
      </div>

      {(prompt) && (
        <div className="w-full bg-gray-50 rounded-lg border border-gray-200 p-4 mt-4 relative group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase text-gray-500 tracking-wider">Transcript</span>
             <button 
                onClick={handleClear}
                className="text-gray-400 hover:text-red-500 transition-colors p-1"
                title="Clear transcript"
             >
                <RotateCcw size={14} />
             </button>
          </div>
          <p className="text-gray-800 italic">
            "{prompt}"
          </p>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 bg-red-50 p-3 rounded-md border border-red-100 text-sm text-red-800 w-full">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}
      
      {!error && (
         <div className="flex items-start gap-2 bg-blue-50 p-3 rounded-md border border-blue-100 text-sm text-blue-800 w-full">
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
            <p>Voice commands are enabled. Try saying "Add some trees" or "Remove the cars".</p>
         </div>
      )}
    </div>
  );
};

export default VoiceEditor;
