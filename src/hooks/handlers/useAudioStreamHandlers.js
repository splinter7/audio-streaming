import { useCallback } from 'react';
import { config } from '../../config';

/**
 * Custom hook to extract audio stream event handlers
 * Reduces main hook complexity by separating handler logic
 */
export const useAudioStreamHandlers = ({
  markUserGesture,
  ensureContextReady,
  hasDecodedBuffer,
  accumulatedBufferRef,
  tryDecode,
  getDecodedBuffer,
  isPaused,
  bufferedSeconds,
  play,
  setIsBuffering,
  pause,
  stop,
  disconnect,
  resetDecoder,
  setError,
  connect,
  isConnected,
  isConnecting
}) => {
  /**
   * Handles play button click
   * Automatically connects if not already connected
   */
  const handlePlay = useCallback(async () => {
    markUserGesture();
    await ensureContextReady();
    
    // If not connected, initiate connection first
    if (!isConnected && !isConnecting) {
      setIsBuffering(true);
      await connect({ isAuto: false });
      return; // Auto-buffering and auto-play will handle the rest
    }
    
    // Decode if we haven't yet
    if (!hasDecodedBuffer() && accumulatedBufferRef.current) {
      await tryDecode(true);
    }

    const buffer = getDecodedBuffer();
    
    if (isPaused) {
      // Resume from pause
      await play(buffer);
    } else if (bufferedSeconds >= config.bufferThresholdSeconds && buffer) {
      // Start playback immediately
      await play(buffer);
    } else {
      // Not enough buffered, show buffering indicator
      setIsBuffering(true);
    }
  }, [markUserGesture, ensureContextReady, hasDecodedBuffer, accumulatedBufferRef, tryDecode, getDecodedBuffer, isPaused, bufferedSeconds, play, setIsBuffering, isConnected, isConnecting, connect]);

  /**
   * Handles pause button click
   */
  const handlePause = useCallback(() => {
    pause();
  }, [pause]);

  /**
   * Handles stop button click - disconnects and resets everything
   */
  const handleStop = useCallback(() => {
    stop();
    disconnect();
    resetDecoder();
    setIsBuffering(false);
    setError(null);
  }, [stop, disconnect, resetDecoder, setIsBuffering, setError]);

  /**
   * Retry connection after error
   */
  const retry = useCallback(() => {
    handleStop();
    setTimeout(() => {
      connect({ isAuto: false });
    }, 100);
  }, [handleStop, connect]);

  return {
    handlePlay,
    handlePause,
    handleStop,
    retry
  };
};
