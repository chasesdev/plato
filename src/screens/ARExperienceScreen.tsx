import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PlatoAr, PlatoArView } from '../../modules/plato-ar';
import { getSocraticResponse, AIResponse } from '../services/SocraticAI';
import * as Speech from 'expo-speech';
import { Asset } from 'expo-asset';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ConversationEntry {
  role: 'student' | 'ai' | 'system';
  content: string;
  reasoning?: string;
  timestamp: Date;
}

interface ARExperienceScreenProps {
  route: {
    params: {
      model: 'cell' | 'molecule' | 'volcano';
      language: 'english' | 'spanish';
    };
  };
}

export default function ARExperienceScreen({ route }: ARExperienceScreenProps) {
  const { model, language } = route.params;
  const [conversation, setConversation] = useState<ConversationEntry[]>([]);
  const [observations, setObservations] = useState<string[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [showConversation, setShowConversation] = useState(true);
  const [textInput, setTextInput] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

  // For now, use static URLs - in production these would be served from CDN
  // or bundled with the app
  const modelUrls = {
    cell: 'https://developer.apple.com/augmented-reality/quick-look/models/seahorse/seahorse_anim_mtl_variant.usdz',
    molecule: 'https://developer.apple.com/augmented-reality/quick-look/models/hummingbird/hummingbird_anim.usdz',
    volcano: 'https://developer.apple.com/augmented-reality/quick-look/models/pancakes/pancakes_photogrammetry.usdz',
  };

  const modelUrl = modelUrls[model];

  useEffect(() => {
    if (modelUrl) {
      initializeAR();
    }
    return () => {
      PlatoAr.removeAllListeners();
      PlatoAr.stopVoiceRecognition();
    };
  }, [modelUrl]);

  const initializeAR = async () => {
    try {
      // Start AR session with selected model
      await PlatoAr.startARSession(modelUrl);

      // WORKAROUND: Direct model loading bypass for view config issue
      console.log('🎯 WORKAROUND: Calling PlatoAr.loadUSDZModel directly with URL:', modelUrl);
      const loadResult = PlatoAr.loadUSDZModel(modelUrl);
      console.log('🎯 WORKAROUND: loadUSDZModel result:', loadResult);

      // Give the model a moment to load, then trigger additional loading mechanisms
      setTimeout(() => {
        console.log('🎯 WORKAROUND: Triggering additional AR session after model load');
        PlatoAr.startARSession(modelUrl);
      }, 2000);

      // Set up event listeners
      const speechListener = PlatoAr.addSpeechListener((event) => {
        console.log('🎯 SPEECH EVENT RECEIVED:', event);
        setCurrentTranscript(event.transcript);
        if (event.isFinal) {
          handleVoiceInput(event.transcript);
          setCurrentTranscript('');
        }
      });

      const interactionListener = PlatoAr.addModelInteractionListener((event) => {
        const interaction = `${event.type} on ${event.entityName || 'model'}`;
        addSystemMessage(`Interaction: ${interaction}`);
      });

      const errorListener = PlatoAr.addARErrorListener((event) => {
        Alert.alert('AR Error', event.error);
      });

      // Start voice recognition automatically
      startListening();

      // Add welcome message
      addSystemMessage(
        language === 'english'
          ? `Welcome! You're exploring a ${model}. What do you notice?`
          : `¡Bienvenido! Estás explorando un ${model}. ¿Qué notas?`
      );

      return () => {
        speechListener.remove();
        interactionListener.remove();
        errorListener.remove();
      };
    } catch (error) {
      Alert.alert('Error', 'Failed to initialize AR session');
      console.error(error);
    }
  };

  const startListening = async () => {
    try {
      await PlatoAr.startVoiceRecognition();
      setIsListening(true);
    } catch (error) {
      Alert.alert(
        'Permission Required',
        'Please enable microphone access to use voice input'
      );
    }
  };

  const stopListening = () => {
    PlatoAr.stopVoiceRecognition();
    setIsListening(false);
  };

  const handleVoiceInput = async (input: string) => {
    // Add student observation
    const studentEntry: ConversationEntry = {
      role: 'student',
      content: input,
      timestamp: new Date(),
    };
    setConversation((prev) => [...prev, studentEntry]);
    setObservations((prev) => [...prev, input]);

    // Get AI response
    try {
      const response: AIResponse = await getSocraticResponse(
        input,
        model,
        observations,
        'AR viewing',
        language
      );

      const aiEntry: ConversationEntry = {
        role: 'ai',
        content: response.question,
        reasoning: response.reasoning,
        timestamp: new Date(),
      };
      setConversation((prev) => [...prev, aiEntry]);

      // Speak the AI response
      Speech.speak(response.question, {
        language: language === 'spanish' ? 'es' : 'en',
        pitch: 1.0,
        rate: 0.9,
      });
    } catch (error) {
      console.error('Error getting AI response:', error);
      addSystemMessage('Unable to get AI response. Please continue observing.');
    }

    // Auto-scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const addSystemMessage = (message: string) => {
    const systemEntry: ConversationEntry = {
      role: 'system',
      content: message,
      timestamp: new Date(),
    };
    setConversation((prev) => [...prev, systemEntry]);
  };

  const toggleConversation = () => {
    setShowConversation(!showConversation);
  };

  const captureObservation = async () => {
    console.log('🎯 WORKAROUND: Calling module-level PlatoAr.captureARScreenshot()');
    const screenshot = await PlatoAr.captureARScreenshot();
    console.log('🎯 WORKAROUND: Screenshot result:', screenshot ? 'SUCCESS - got base64 image' : 'FAILED - null');

    if (screenshot) {
      addSystemMessage('Screenshot captured with current observations');
      console.log('🎯 WORKAROUND: Screenshot length:', screenshot.length, 'characters');
    } else {
      addSystemMessage('Screenshot failed - no AR content captured');
      console.log('🎯 WORKAROUND: Screenshot failed - likely no model loaded yet');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* AR View */}
      <PlatoArView
        style={styles.arView}
        modelUrl={modelUrl}
        onTap={(e) => console.log('Tap:', e.nativeEvent)}
        onPinch={(e) => console.log('Pinch:', e.nativeEvent)}
        onRotate={(e) => console.log('Rotate:', e.nativeEvent)}
      />

      {/* Floating Controls */}
      <View style={styles.floatingControls}>
        <TouchableOpacity
          style={[styles.controlButton, isListening && styles.listeningButton]}
          onPress={isListening ? stopListening : startListening}
        >
          <Text style={styles.controlButtonText}>
            {isListening ? '🔴 Listening' : '🎤 Speak'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={toggleConversation}
        >
          <Text style={styles.controlButtonText}>
            {showConversation ? '💬 Hide' : '💬 Show'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton} onPress={captureObservation}>
          <Text style={styles.controlButtonText}>📸 Capture</Text>
        </TouchableOpacity>
      </View>

      {/* Current Transcript */}
      {currentTranscript ? (
        <View style={styles.transcriptContainer}>
          <Text style={styles.transcriptText}>{currentTranscript}</Text>
        </View>
      ) : null}

      {/* Conversation Panel */}
      {showConversation && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.conversationPanel}
        >
          <ScrollView
            ref={scrollViewRef}
            style={styles.conversationScroll}
            contentContainerStyle={styles.conversationContent}
          >
            {conversation.map((entry, index) => (
              <View
                key={index}
                style={[
                  styles.messageContainer,
                  entry.role === 'student' && styles.studentMessage,
                  entry.role === 'system' && styles.systemMessage,
                ]}
              >
                {entry.role !== 'system' && (
                  <Text style={styles.roleLabel}>
                    {entry.role === 'student'
                      ? language === 'english'
                        ? 'You'
                        : 'Tú'
                      : language === 'english'
                      ? 'Guide'
                      : 'Guía'}
                  </Text>
                )}
                <Text style={styles.messageText}>{entry.content}</Text>
                {entry.reasoning && (
                  <Text style={styles.reasoningText}>
                    💭 {entry.reasoning}
                  </Text>
                )}
              </View>
            ))}
          </ScrollView>

          {/* Text Input for Development Mode */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder={language === 'english' ? 'Type observation...' : 'Escribe observación...'}
              placeholderTextColor="#999"
              value={textInput}
              onChangeText={setTextInput}
              onSubmitEditing={() => {
                if (textInput.trim()) {
                  handleVoiceInput(textInput.trim());
                  setTextInput('');
                }
              }}
              returnKeyType="send"
            />
            <TouchableOpacity
              style={styles.sendButton}
              onPress={() => {
                if (textInput.trim()) {
                  handleVoiceInput(textInput.trim());
                  setTextInput('');
                }
              }}
            >
              <Text style={styles.sendButtonText}>➤</Text>
            </TouchableOpacity>
          </View>

          {/* Observation Count */}
          <View style={styles.observationCounter}>
            <Text style={styles.observationText}>
              {language === 'english'
                ? `${observations.length} observations`
                : `${observations.length} observaciones`}
            </Text>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  arView: {
    flex: 1,
  },
  floatingControls: {
    position: 'absolute',
    top: 50,
    right: 20,
    gap: 10,
  },
  controlButton: {
    backgroundColor: 'rgba(0, 180, 216, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 100,
    alignItems: 'center',
  },
  listeningButton: {
    backgroundColor: 'rgba(255, 0, 0, 0.9)',
  },
  controlButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  transcriptContainer: {
    position: 'absolute',
    bottom: 320,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 12,
    borderRadius: 12,
  },
  transcriptText: {
    fontSize: 16,
    color: '#333',
  },
  conversationPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 300,
    backgroundColor: 'rgba(248, 249, 250, 0.95)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  conversationScroll: {
    flex: 1,
    padding: 16,
  },
  conversationContent: {
    paddingBottom: 20,
  },
  messageContainer: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  studentMessage: {
    backgroundColor: '#E3F2FD',
    alignSelf: 'flex-end',
    maxWidth: '80%',
  },
  systemMessage: {
    backgroundColor: '#FFF9C4',
    borderLeftWidth: 3,
    borderLeftColor: '#FFB300',
  },
  roleLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 20,
  },
  reasoningText: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
    fontStyle: 'italic',
  },
  observationCounter: {
    position: 'absolute',
    bottom: 10,
    right: 20,
    backgroundColor: 'rgba(0, 180, 216, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  observationText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  textInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#F5F5F5',
  },
  sendButton: {
    width: 40,
    height: 40,
    backgroundColor: '#00B4D8',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  sendButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
});