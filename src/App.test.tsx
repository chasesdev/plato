import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

// Mock react-speech-recognition
jest.mock('react-speech-recognition', () => ({
  __esModule: true,
  default: {
    startListening: jest.fn(),
    stopListening: jest.fn(),
    browserSupportsSpeechRecognition: jest.fn(() => true),
  },
  useSpeechRecognition: () => ({
    transcript: '',
    listening: false,
    resetTranscript: jest.fn(),
    browserSupportsSpeechRecognition: true,
  }),
}));

// Mock Three.js OrbitControls
jest.mock('three/examples/jsm/controls/OrbitControls', () => ({
  OrbitControls: jest.fn().mockImplementation(() => ({
    update: jest.fn(),
    dispose: jest.fn(),
    addEventListener: jest.fn(),
    enableDamping: true,
    dampingFactor: 0.05,
    enableZoom: true,
    minDistance: 1,
    maxDistance: 10,
  })),
}));

describe('Plato App', () => {
  test('renders Plato header', () => {
    render(<App />);
    const headerElement = screen.getByText(/Plato/i);
    expect(headerElement).toBeInTheDocument();
  });

  test('renders model selector', () => {
    render(<App />);
    const cellOption = screen.getByText(/Cell|Célula/i);
    expect(cellOption).toBeInTheDocument();
  });

  test('renders language toggle', () => {
    render(<App />);
    const langButton = screen.getByLabelText(/Toggle language/i);
    expect(langButton).toBeInTheDocument();
  });
});