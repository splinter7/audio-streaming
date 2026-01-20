import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Web Audio API
global.AudioContext = vi.fn(() => ({
  createBufferSource: vi.fn(() => ({
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    addEventListener: vi.fn(),
    buffer: null,
  })),
  createGain: vi.fn(() => ({
    connect: vi.fn(),
    gain: { value: 1 },
  })),
  decodeAudioData: vi.fn((buffer) => 
    Promise.resolve({
      duration: 10,
      sampleRate: 44100,
      numberOfChannels: 2,
      length: 441000,
    })
  ),
  destination: {},
  state: 'running',
  resume: vi.fn(() => Promise.resolve()),
  suspend: vi.fn(() => Promise.resolve()),
  close: vi.fn(() => Promise.resolve()),
}));

// Mock RTCPeerConnection
global.RTCPeerConnection = vi.fn(() => ({
  createDataChannel: vi.fn(() => ({
    send: vi.fn(),
    close: vi.fn(),
    addEventListener: vi.fn(),
    readyState: 'open',
    onopen: null,
    onmessage: null,
    onerror: null,
    onclose: null,
  })),
  createOffer: vi.fn(() => Promise.resolve({ type: 'offer', sdp: 'mock-sdp' })),
  createAnswer: vi.fn(() => Promise.resolve({ type: 'answer', sdp: 'mock-sdp' })),
  setLocalDescription: vi.fn(() => Promise.resolve()),
  setRemoteDescription: vi.fn(() => Promise.resolve()),
  addIceCandidate: vi.fn(() => Promise.resolve()),
  close: vi.fn(),
  connectionState: 'new',
  iceConnectionState: 'new',
  iceGatheringState: 'new',
  localDescription: { type: 'offer', sdp: 'mock-sdp' },
  onconnectionstatechange: null,
  oniceconnectionstatechange: null,
  ondatachannel: null,
}));

global.RTCSessionDescription = vi.fn((desc) => desc);

// Mock fetch
global.fetch = vi.fn();
