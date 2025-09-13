import React, { useState, useCallback, useEffect, useRef } from 'react';
import ARView from './components/ARView';
import VoiceInput from './components/VoiceInput';
import { getSocraticResponse, type AIResponse } from './services/SocraticAI';
import './App.css';

interface ConversationEntry {
  role: 'student' | 'ai' | 'system';
  content: string;
  reasoning?: string;
  model?: string;
  timestamp: string;
}

type ModelType = 'cell' | 'molecule' | 'volcano';
type Language = 'english' | 'spanish';

function App() {
  const [currentModel, setCurrentModel] = useState<ModelType>('molecule');
  const [language, setLanguage] = useState<Language>('english');
  const [conversation, setConversation] = useState<ConversationEntry[]>([]);
  const [observations, setObservations] = useState<string[]>([]);
  const [showReasoning, setShowReasoning] = useState(true);
  const [loading, setLoading] = useState(false);
  const [lastInteraction, setLastInteraction] = useState('');
  const conversationEndRef = useRef<HTMLDivElement>(null);

  // Welcome message on mount
  useEffect(() => {
    const welcomeMessage: ConversationEntry = {
      role: 'system',
      content: language === 'english' 
        ? '🔬 Welcome to Plato! Select a phenomenon to investigate. I\'ll guide your scientific thinking through careful questioning, helping you discover concepts yourself.'
        : '🔬 ¡Bienvenido a Plato! Selecciona un fenómeno para investigar. Guiaré tu pensamiento científico a través de preguntas cuidadosas, ayudándote a descubrir conceptos por ti mismo.',
      timestamp: new Date().toISOString()
    };
    setConversation([welcomeMessage]);
  }, [language]);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  const handleVoiceInput = useCallback(async (input: string) => {
    // Add student input to conversation
    const studentEntry: ConversationEntry = { 
      role: 'student', 
      content: input,
      timestamp: new Date().toISOString()
    };
    setConversation(prev => [...prev, studentEntry]);
    setLoading(true);
    
    try {
      // Get Socratic response
      const aiResponse: AIResponse = await getSocraticResponse(
        input, 
        currentModel, 
        observations,
        lastInteraction || 'Viewing the model',
        language
      );
      
      // Add AI response with reasoning
      const aiEntry: ConversationEntry = {
        role: 'ai',
        content: aiResponse.question,
        reasoning: aiResponse.reasoning,
        model: aiResponse.model,
        timestamp: new Date().toISOString()
      };
      setConversation(prev => [...prev, aiEntry]);
      
      // Add to observations
      setObservations(prev => [...prev, input]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      const errorEntry: ConversationEntry = {
        role: 'ai',
        content: language === 'spanish' 
          ? '¿Qué más observas sobre este modelo?' 
          : 'What else do you observe about this model?',
        reasoning: '[Error: Using fallback response]',
        model: 'Offline',
        timestamp: new Date().toISOString()
      };
      setConversation(prev => [...prev, errorEntry]);
    } finally {
      setLoading(false);
    }
  }, [currentModel, observations, language, lastInteraction]);

  const handleModelInteraction = useCallback((interaction: string) => {
    console.log('Model interaction:', interaction);
    setLastInteraction(interaction);
    
    // Only log significant interactions to observations
    if (interaction.includes('Clicked') || interaction.includes('Loaded')) {
      setObservations(prev => [...prev, interaction]);
    }
  }, []);

  const clearConversation = () => {
    setConversation([{
      role: 'system',
      content: language === 'english' 
        ? '🔄 Conversation cleared. Let\'s start fresh! What do you observe?'
        : '🔄 Conversación borrada. ¡Empecemos de nuevo! ¿Qué observas?',
      timestamp: new Date().toISOString()
    }]);
    setObservations([]);
  };

  const changeModel = (model: ModelType) => {
    setCurrentModel(model);
    const modelNames = {
      cell: language === 'english' ? 'cell' : 'célula',
      molecule: language === 'english' ? 'water molecule' : 'molécula de agua',
      volcano: language === 'english' ? 'volcano' : 'volcán'
    };
    
    setConversation(prev => [...prev, {
      role: 'system',
      content: language === 'english' 
        ? `🔬 Switched to ${modelNames[model]} model. What do you notice?`
        : `🔬 Cambiado al modelo de ${modelNames[model]}. ¿Qué notas?`,
      timestamp: new Date().toISOString()
    }]);
  };

  const toggleLanguage = () => {
    const newLang = language === 'english' ? 'spanish' : 'english';
    setLanguage(newLang);
    setConversation(prev => [...prev, {
      role: 'system',
      content: newLang === 'english' 
        ? '🌐 Switched to English'
        : '🌐 Cambiado a Español',
      timestamp: new Date().toISOString()
    }]);
  };

  return (
    <div className="plato-app">
      <header>
        <div className="header-content">
          <div className="title-section">
            <div>
              <h1>
                Plato
                <span className="amplify-badge">by Amplify</span>
              </h1>
              <div className="subtitle">
                {language === 'english' ? 'Socratic AI for Science Learning • Interactive 3D Models' : 'IA Socrática para Aprendizaje Científico • Modelos 3D Interactivos'}
              </div>
            </div>
          </div>
          <div className="controls">
            <select 
              value={currentModel}
              onChange={(e) => changeModel(e.target.value as ModelType)}
              className="model-selector"
              aria-label="Select model"
            >
              <option value="cell">🦠 {language === 'english' ? 'Cell' : 'Célula'}</option>
              <option value="molecule">💧 {language === 'english' ? 'Water Molecule' : 'Molécula de Agua'}</option>
              <option value="volcano">🌋 {language === 'english' ? 'Volcano' : 'Volcán'}</option>
            </select>
            
            <button 
              onClick={toggleLanguage}
              className="language-toggle"
              aria-label="Toggle language"
            >
              {language === 'english' ? '🇺🇸 EN' : '🇪🇸 ES'}
            </button>
            
            <button 
              onClick={() => setShowReasoning(!showReasoning)}
              className="reasoning-toggle"
              aria-label="Toggle AI reasoning visibility"
            >
              🧠 {showReasoning ? 'Hide' : 'Show'}
            </button>
            
            <button 
              onClick={clearConversation} 
              className="clear-button"
              aria-label="Clear conversation"
            >
              🗑️
            </button>
          </div>
        </div>
      </header>

      <main>
        <div className="ar-section">
          <ARView 
            currentModel={currentModel}
            onInteraction={handleModelInteraction}
          />
        </div>
        
        <div className="interaction-section">
          <div className="conversation-panel">
            <div className="conversation">
              {conversation.map((entry, i) => (
                <div key={i} className={`message ${entry.role}`}>
                  {entry.role === 'student' ? (
                    <>
                      <span className="role-label">
                        {language === 'english' ? 'Student' : 'Estudiante'}
                      </span>
                      <div className="content">{entry.content}</div>
                    </>
                  ) : entry.role === 'system' ? (
                    <div className="system-message">{entry.content}</div>
                  ) : (
                    <>
                      <span className="role-label">
                        {language === 'english' ? 'Science Guide' : 'Guía Científico'}
                      </span>
                      {showReasoning && entry.reasoning && (
                        <div className="reasoning">
                          <span className="reasoning-label">
                            {language === 'english' ? '💭 AI Thinking' : '💭 Pensamiento IA'}:
                          </span>
                          <span className="reasoning-text">{entry.reasoning}</span>
                        </div>
                      )}
                      <div className="content">{entry.content}</div>
                      {entry.model && (
                        <div className="model-tag">{entry.model}</div>
                      )}
                    </>
                  )}
                </div>
              ))}
              {loading && (
                <div className="loading-message">
                  <span className="loading-spinner">⚛️</span>
                  {language === 'english' ? 'Thinking...' : 'Pensando...'}
                </div>
              )}
              <div ref={conversationEndRef} />
            </div>
            
            <VoiceInput 
              onVoiceInput={handleVoiceInput}
              language={language}
              disabled={loading}
            />
          </div>

          <div className="notebook">
            <h3>📔 {language === 'english' ? 'Investigation Notebook' : 'Cuaderno de Investigación'}</h3>
            {observations.length === 0 ? (
              <p className="empty-notebook">
                {language === 'english' 
                  ? 'Your observations will appear here...' 
                  : 'Tus observaciones aparecerán aquí...'}
              </p>
            ) : (
              <ul>
                {observations.map((obs, i) => (
                  <li key={i}>
                    <span className="obs-number">{i + 1}.</span>
                    <span className="obs-text">{obs}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="notebook-footer">
              <small>
                {language === 'english' 
                  ? `${observations.length} observation${observations.length !== 1 ? 's' : ''} recorded`
                  : `${observations.length} observaci${observations.length !== 1 ? 'ones' : 'ón'} registrada${observations.length !== 1 ? 's' : ''}`}
              </small>
            </div>
          </div>
        </div>
      </main>

      <footer>
        <div className="stats">
          <span>© 2024 Amplify Education</span>
          <span className="separator">•</span>
          <span>{language === 'english' ? 'Phenomena-Based Learning' : 'Aprendizaje Basado en Fenómenos'}</span>
          <span className="separator">•</span>
          <span>{language === 'english' ? 'Powered by Open Source AI' : 'Impulsado por IA de Código Abierto'}</span>
        </div>
      </footer>
    </div>
  );
}

export default App;