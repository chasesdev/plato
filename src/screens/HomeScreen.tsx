import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

type ModelType = 'cell' | 'molecule' | 'volcano';
type Language = 'english' | 'spanish';

export default function HomeScreen() {
  const navigation = useNavigation();
  const [selectedModel, setSelectedModel] = useState<ModelType>('molecule');
  const [language, setLanguage] = useState<Language>('english');

  const models = [
    {
      id: 'cell',
      name: language === 'english' ? 'Biological Cell' : 'Célula Biológica',
      description:
        language === 'english'
          ? 'Explore the building blocks of life'
          : 'Explora los bloques de construcción de la vida',
      icon: '🦠',
      color: '#4CAF50',
    },
    {
      id: 'molecule',
      name: language === 'english' ? 'Water Molecule' : 'Molécula de Agua',
      description:
        language === 'english'
          ? 'Discover H2O molecular structure'
          : 'Descubre la estructura molecular del H2O',
      icon: '💧',
      color: '#2196F3',
    },
    {
      id: 'volcano',
      name: language === 'english' ? 'Volcano' : 'Volcán',
      description:
        language === 'english'
          ? 'Investigate geological forces'
          : 'Investiga las fuerzas geológicas',
      icon: '🌋',
      color: '#FF5722',
    },
  ];

  const startARExperience = () => {
    navigation.navigate('ARExperience', {
      model: selectedModel,
      language: language,
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Plato</Text>
          <Text style={styles.subtitle}>
            {language === 'english'
              ? 'Socratic AR Science Learning'
              : 'Aprendizaje Científico AR Socrático'}
          </Text>
        </View>

        {/* Language Toggle */}
        <View style={styles.languageContainer}>
          <Text style={styles.languageLabel}>
            {language === 'english' ? 'Language' : 'Idioma'}
          </Text>
          <View style={styles.languageToggle}>
            <Text style={styles.languageText}>EN</Text>
            <Switch
              value={language === 'spanish'}
              onValueChange={(value) => setLanguage(value ? 'spanish' : 'english')}
              trackColor={{ false: '#767577', true: '#00B4D8' }}
              thumbColor={language === 'spanish' ? '#0077B6' : '#f4f3f4'}
            />
            <Text style={styles.languageText}>ES</Text>
          </View>
        </View>

        {/* Model Selection */}
        <View style={styles.modelsSection}>
          <Text style={styles.sectionTitle}>
            {language === 'english' ? 'Choose a Model' : 'Elige un Modelo'}
          </Text>

          {models.map((model) => (
            <TouchableOpacity
              key={model.id}
              style={[
                styles.modelCard,
                selectedModel === model.id && styles.selectedCard,
                { borderLeftColor: model.color },
              ]}
              onPress={() => setSelectedModel(model.id as ModelType)}
            >
              <View style={styles.modelContent}>
                <Text style={styles.modelIcon}>{model.icon}</Text>
                <View style={styles.modelInfo}>
                  <Text style={styles.modelName}>{model.name}</Text>
                  <Text style={styles.modelDescription}>{model.description}</Text>
                </View>
              </View>
              {selectedModel === model.id && (
                <View style={styles.selectedIndicator}>
                  <Text style={styles.checkmark}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Instructions */}
        <View style={styles.instructionsSection}>
          <Text style={styles.sectionTitle}>
            {language === 'english' ? 'How it Works' : 'Cómo Funciona'}
          </Text>
          <View style={styles.instructionsList}>
            <Text style={styles.instruction}>
              {language === 'english'
                ? '1. 🎯 Point your device at a flat surface'
                : '1. 🎯 Apunta tu dispositivo a una superficie plana'}
            </Text>
            <Text style={styles.instruction}>
              {language === 'english'
                ? '2. 🗣️ Speak your observations naturally'
                : '2. 🗣️ Habla tus observaciones naturalmente'}
            </Text>
            <Text style={styles.instruction}>
              {language === 'english'
                ? '3. 🤔 Answer guided questions to discover'
                : '3. 🤔 Responde preguntas guiadas para descubrir'}
            </Text>
            <Text style={styles.instruction}>
              {language === 'english'
                ? '4. 👆 Interact with the 3D model'
                : '4. 👆 Interactúa con el modelo 3D'}
            </Text>
          </View>
        </View>

        {/* Start Button */}
        <TouchableOpacity style={styles.startButton} onPress={startARExperience}>
          <Text style={styles.startButtonText}>
            {language === 'english' ? '🚀 Start AR Experience' : '🚀 Iniciar Experiencia AR'}
          </Text>
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {language === 'english'
              ? 'Powered by AI • Built for Education'
              : 'Impulsado por IA • Construido para la Educación'}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    paddingBottom: 30,
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#00B4D8',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  languageContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    gap: 15,
  },
  languageLabel: {
    fontSize: 16,
    color: '#333',
  },
  languageToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  languageText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  modelsSection: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  modelCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedCard: {
    backgroundColor: '#E3F2FD',
  },
  modelContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modelIcon: {
    fontSize: 40,
    marginRight: 15,
  },
  modelInfo: {
    flex: 1,
  },
  modelName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modelDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  selectedIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#00B4D8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  instructionsSection: {
    paddingHorizontal: 20,
    marginTop: 30,
  },
  instructionsList: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
  },
  instruction: {
    fontSize: 15,
    color: '#555',
    marginBottom: 10,
    lineHeight: 22,
  },
  startButton: {
    backgroundColor: '#00B4D8',
    marginHorizontal: 20,
    marginTop: 30,
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  startButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
    marginTop: 30,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
  },
});