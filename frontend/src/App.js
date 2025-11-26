import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [conversation, setConversation] = useState([]);
  const [isSupported, setIsSupported] = useState(true);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const recognitionRef = useRef(null);
  const conversationEndRef = useRef(null);

  // Check if browser supports Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setIsSupported(false);
      setError('Speech Recognition is not supported in your browser. Try Chrome or Edge.');
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      setTranscript(finalTranscript || interimTranscript);
    };

    recognitionRef.current.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setError(`Error: ${event.error}`);
      setIsListening(false);
    };

    recognitionRef.current.onend = () => {
      if (isListening) {
        // Auto-restart if we're still supposed to be listening
        recognitionRef.current.start();
      }
    };
  }, []);

  // Scroll to bottom of conversation
  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  // Request microphone permission
  const requestMicrophonePermission = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Stop all tracks immediately after getting permission
      stream.getTracks().forEach(track => track.stop());
      
      setPermissionGranted(true);
      setError('');
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError('Microphone access denied. Please allow microphone permissions to use speech recognition.');
      setPermissionGranted(false);
    } finally {
      setIsLoading(false);
    }
  };

  const startListening = () => {
    if (!permissionGranted) {
      setError('Please grant microphone permission first.');
      return;
    }

    try {
      recognitionRef.current.start();
      setIsListening(true);
      setError('');
    } catch (err) {
      console.error('Error starting recognition:', err);
      setError('Error starting speech recognition. Please try again.');
    }
  };

  const stopListening = () => {
    try {
      recognitionRef.current.stop();
      setIsListening(false);
      
      // Add final transcript to conversation
      if (transcript.trim()) {
        const newEntry = {
          id: Date.now(),
          text: transcript,
          timestamp: new Date().toLocaleTimeString(),
          type: 'user'
        };
        setConversation(prev => [...prev, newEntry]);
        setTranscript('');
      }
    } catch (err) {
      console.error('Error stopping recognition:', err);
    }
  };

  const clearConversation = () => {
    setConversation([]);
    setTranscript('');
    setError('');
  };

  const addSampleText = () => {
    const samples = [
      "Hello, this is a test of the speech recognition system.",
      "The weather is beautiful today in this virtual environment.",
      "I'm demonstrating the Web Speech API with React.js",
      "This technology can convert spoken words into text instantly.",
      "Try speaking into your microphone to see real-time transcription!"
    ];
    
    samples.forEach((sample, index) => {
      setTimeout(() => {
        const newEntry = {
          id: Date.now() + index,
          text: sample,
          timestamp: new Date().toLocaleTimeString(),
          type: 'sample'
        };
        setConversation(prev => [...prev, newEntry]);
      }, index * 800);
    });
  };

  if (!isSupported) {
    return (
      <div className="App">
        <header className="app-header">
          <h1>Web Speech API Demo</h1>
        </header>
        <main className="main-content">
          <div className="error-message">
            <h2>Browser Not Supported</h2>
            <p>{error}</p>
            <p>Please try using Google Chrome or Microsoft Edge for the best experience.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="app-header">
        <h1>Web Speech API Demo</h1>
        <p>Real-time Speech to Text Recognition</p>
        <div className="server-info">
          <p>Browser: {navigator.userAgent.split(' ')[0]}</p>
          <p>Status: {permissionGranted ? 'Microphone Access Granted' : 'Permission Required'}</p>
        </div>
      </header>

      <main className="main-content">
        {/* Permission Section */}
        {!permissionGranted && (
          <section className="section permission-section">
            <h2>Microphone Permission Required</h2>
            <p>This demo requires access to your microphone for speech recognition.</p>
            <button 
              onClick={requestMicrophonePermission}
              disabled={isLoading}
              className="permission-btn"
            >
              {isLoading ? 'Requesting Access...' : 'Allow Microphone Access'}
            </button>
            {error && <div className="error-message">{error}</div>}
          </section>
        )}

        {/* Controls Section */}
        {permissionGranted && (
          <section className="section controls-section">
            <h2>Speech Recognition Controls</h2>
            <div className="controls">
              <button 
                onClick={startListening}
                disabled={isListening}
                className={`control-btn listen-btn ${isListening ? 'active' : ''}`}
              >
                🎤 Start Listening
              </button>
              <button 
                onClick={stopListening}
                disabled={!isListening}
                className="control-btn stop-btn"
              >
                ⏹️ Stop Listening
              </button>
              <button 
                onClick={addSampleText}
                className="control-btn sample-btn"
              >
                📝 Add Sample Text
              </button>
              <button 
                onClick={clearConversation}
                className="control-btn clear-btn"
              >
                🗑️ Clear All
              </button>
            </div>
            
            {/* Current Transcript */}
            {transcript && (
              <div className="current-transcript">
                <h3>Current Speech:</h3>
                <div className="transcript-bubble user-bubble">
                  <p>{transcript}</p>
                  <span className="timestamp">Listening...</span>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Conversation History */}
        {permissionGranted && (
          <section className="section conversation-section">
            <h2>Conversation History</h2>
            <div className="conversation-container">
              {conversation.length === 0 ? (
                <div className="empty-conversation">
                  <p>No speech recorded yet. Start listening or add sample text!</p>
                </div>
              ) : (
                conversation.map((entry) => (
                  <div key={entry.id} className={`conversation-bubble ${entry.type}-bubble`}>
                    <p>{entry.text}</p>
                    <span className="timestamp">{entry.timestamp}</span>
                  </div>
                ))
              )}
              <div ref={conversationEndRef} />
            </div>
          </section>
        )}

        {/* Error Display */}
        {error && permissionGranted && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* Instructions */}
        <section className="section instructions-section">
          <h2>How to Use</h2>
          <div className="instructions">
            <div className="instruction">
              <h3>1. Grant Permission</h3>
              <p>Click "Allow Microphone Access" to enable speech recognition</p>
            </div>
            <div className="instruction">
              <h3>2. Start Listening</h3>
              <p>Click "Start Listening" and begin speaking</p>
            </div>
            <div className="instruction">
              <h3>3. View Results</h3>
              <p>See real-time transcription and conversation history</p>
            </div>
            <div className="instruction">
              <h3>4. Stop When Done</h3>
              <p>Click "Stop Listening" to end the session</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="app-footer">
        <p>Built with React.js and Web Speech API</p>
      </footer>
    </div>
  );
}

export default App;