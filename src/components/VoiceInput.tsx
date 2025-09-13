import React, { useState, useEffect, KeyboardEvent } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

interface VoiceInputProps {
  onVoiceInput: (input: string) => void;
  language: 'english' | 'spanish';
  disabled?: boolean;
}

const VoiceInput: React.FC<VoiceInputProps> = ({ onVoiceInput, language, disabled = false }) => {
  const [textInput, setTextInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  useEffect(() => {
    // Send transcript when speech recognition stops
    if (transcript && !listening && !isProcessing) {
      setIsProcessing(true);
      onVoiceInput(transcript);
      resetTranscript();
      setTimeout(() => setIsProcessing(false), 500);
    }
  }, [transcript, listening, onVoiceInput, resetTranscript, isProcessing]);

  const toggleListening = () => {
    if (disabled || isProcessing) return;
    
    if (listening) {
      SpeechRecognition.stopListening();
    } else {
      resetTranscript();
      SpeechRecognition.startListening({ 
        continuous: false,
        language: language === 'spanish' ? 'es-ES' : 'en-US'
      });
    }
  };

  const handleTextSubmit = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && textInput.trim() && !disabled && !isProcessing) {
      onVoiceInput(textInput.trim());
      setTextInput('');
    }
  };

  const handleButtonSubmit = () => {
    if (textInput.trim() && !disabled && !isProcessing) {
      onVoiceInput(textInput.trim());
      setTextInput('');
    }
  };

  const placeholderText = language === 'spanish' 
    ? 'Escribe tu observación o pregunta...' 
    : 'Type your observation or question...';

  const micButtonText = listening 
    ? (language === 'spanish' ? 'Escuchando...' : 'Listening...')
    : (language === 'spanish' ? 'Hablar' : 'Speak');

  return (
    <div className="voice-input-container">
      {browserSupportsSpeechRecognition && (
        <>
          <button 
            onClick={toggleListening}
            className={`mic-button ${listening ? 'listening' : ''} ${disabled ? 'disabled' : ''}`}
            disabled={disabled || isProcessing}
            aria-label={micButtonText}
          >
            <span className="mic-icon">🎤</span>
            <span className="mic-text">{micButtonText}</span>
            {listening && (
              <span className="pulse-ring"></span>
            )}
          </button>
          
          {transcript && (
            <div className="transcript-preview">
              <span className="transcript-label">
                {language === 'spanish' ? 'Escuchando:' : 'Hearing:'}
              </span>
              <span className="transcript-text">{transcript}</span>
            </div>
          )}
          
          <div className="divider">
            <span>{language === 'spanish' ? 'o' : 'or'}</span>
          </div>
        </>
      )}
      
      <div className="text-input-wrapper">
        <input 
          type="text"
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          onKeyPress={handleTextSubmit}
          placeholder={placeholderText}
          className="text-input"
          disabled={disabled || isProcessing}
          aria-label="Text input for observations"
        />
        <button 
          onClick={handleButtonSubmit}
          className="send-button"
          disabled={!textInput.trim() || disabled || isProcessing}
          aria-label="Send message"
        >
          <span>➤</span>
        </button>
      </div>
      
      {!browserSupportsSpeechRecognition && (
        <div className="speech-not-supported">
          <small>
            {language === 'spanish' 
              ? '⚠️ Tu navegador no soporta entrada de voz. Usa el teclado.'
              : '⚠️ Your browser doesn\'t support voice input. Please type instead.'}
          </small>
        </div>
      )}
    </div>
  );
};

export default VoiceInput;