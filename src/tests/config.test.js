import { describe, it, expect } from 'vitest';
import { config } from '../config';

describe('config', () => {
  it('should have apiUrl defined', () => {
    expect(config.apiUrl).toBeDefined();
    expect(typeof config.apiUrl).toBe('string');
    expect(config.apiUrl).toMatch(/^http/);
  });

  it('should have valid bufferThresholdSeconds', () => {
    expect(config.bufferThresholdSeconds).toBeDefined();
    expect(typeof config.bufferThresholdSeconds).toBe('number');
    expect(config.bufferThresholdSeconds).toBeGreaterThan(0);
  });

  it('should have valid maxReconnectAttempts', () => {
    expect(config.maxReconnectAttempts).toBeDefined();
    expect(typeof config.maxReconnectAttempts).toBe('number');
    expect(config.maxReconnectAttempts).toBeGreaterThan(0);
  });

  it('should have iceServers array', () => {
    expect(config.iceServers).toBeDefined();
    expect(Array.isArray(config.iceServers)).toBe(true);
  });

  it('should have expected values', () => {
    expect(config).toEqual({
      apiUrl: 'http://localhost:3001/api',
      bufferThresholdSeconds: 10,
      maxReconnectAttempts: 3,
      iceServers: []
    });
  });
});
