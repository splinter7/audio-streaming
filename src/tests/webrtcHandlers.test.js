import { describe, it, expect, vi } from 'vitest';
import { handleJsonMessage, handleBinaryMessage } from '../utils/webrtcHandlers';

describe('webrtcHandlers', () => {
  describe('handleJsonMessage', () => {
    it('should handle metadata message', () => {
      const onMetadata = vi.fn();
      const callbacks = { onMetadata, onError: vi.fn(), onComplete: vi.fn() };
      const dataChannel = { close: vi.fn() };
      
      const data = JSON.stringify({ type: 'metadata', totalSize: 1000 });
      
      const result = handleJsonMessage(data, callbacks, dataChannel);
      
      expect(result).toBe(true);
      expect(onMetadata).toHaveBeenCalledWith({ type: 'metadata', totalSize: 1000 });
      expect(dataChannel.close).not.toHaveBeenCalled();
    });

    it('should handle error message and close channel', () => {
      const onError = vi.fn();
      const callbacks = { onMetadata: vi.fn(), onError, onComplete: vi.fn() };
      const dataChannel = { close: vi.fn() };
      
      const data = JSON.stringify({ type: 'error', message: 'Test error' });
      
      handleJsonMessage(data, callbacks, dataChannel);
      
      expect(onError).toHaveBeenCalledWith('Test error');
      expect(dataChannel.close).toHaveBeenCalled();
    });

    it('should handle complete message', () => {
      const onComplete = vi.fn();
      const callbacks = { onMetadata: vi.fn(), onError: vi.fn(), onComplete };
      const dataChannel = { close: vi.fn() };
      
      const data = JSON.stringify({ type: 'complete' });
      
      handleJsonMessage(data, callbacks, dataChannel);
      
      expect(onComplete).toHaveBeenCalled();
    });

    it('should handle invalid JSON gracefully', () => {
      const callbacks = { onMetadata: vi.fn(), onError: vi.fn(), onComplete: vi.fn() };
      const dataChannel = { close: vi.fn() };
      
      const result = handleJsonMessage('invalid json', callbacks, dataChannel);
      
      expect(result).toBe(false);
    });

    it('should warn on unknown message type', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const callbacks = { onMetadata: vi.fn(), onError: vi.fn(), onComplete: vi.fn() };
      const dataChannel = { close: vi.fn() };
      
      const data = JSON.stringify({ type: 'unknown' });
      
      handleJsonMessage(data, callbacks, dataChannel);
      
      expect(consoleWarnSpy).toHaveBeenCalledWith('Unknown message type:', 'unknown');
      consoleWarnSpy.mockRestore();
    });
  });

  describe('handleBinaryMessage', () => {
    it('should call onBinaryMessage with ArrayBuffer', async () => {
      const onBinaryMessage = vi.fn();
      const arrayBuffer = new ArrayBuffer(8);
      
      await handleBinaryMessage(arrayBuffer, onBinaryMessage);
      
      expect(onBinaryMessage).toHaveBeenCalledWith(arrayBuffer);
    });

    it('should handle errors and rethrow', async () => {
      const onBinaryMessage = vi.fn(() => {
        throw new Error('Processing error');
      });
      const arrayBuffer = new ArrayBuffer(8);
      
      await expect(handleBinaryMessage(arrayBuffer, onBinaryMessage)).rejects.toThrow('Processing error');
    });
  });
});
