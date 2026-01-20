import { useState, useEffect } from 'react';
import { useWebRTCConnection } from './useWebRTCConnection';
import { useAudioDecoder } from './useAudioDecoder';
import { useAudioPlayback } from './useAudioPlayback';
import { useAudioStreamInit } from './initialization/useAudioStreamInit';
import { useAudioStreamHandlers } from './handlers/useAudioStreamHandlers';
import { useAutoStartPlayback } from './effects/useAutoStartPlayback';
import { useBufferReplacement } from './effects/useBufferReplacement';

export const useAudioStream = () => {
  const [error, setError] = useState(null);
  
  const {
    isPlaying, isPaused, isBuffering, setIsBuffering, play, pause, stop,
    markUserGesture, hasUserGesture, ensureContextReady, getCurrentPlaybackPosition
  } = useAudioPlayback();

  const { audioContextRef, initPromiseRef } = useAudioStreamInit({ ensureContextReady });

  const {
    bufferedSeconds, addChunk, tryDecode, reset: resetDecoder,
    getDecodedBuffer, hasDecodedBuffer, accumulatedBufferRef
  } = useAudioDecoder(audioContextRef, initPromiseRef, ensureContextReady);

  const { isConnected, isConnecting, connect, disconnect } = useWebRTCConnection({
    onBinaryMessage: async (arrayBuffer) => {
      await addChunk(arrayBuffer);
    },
    onMetadata: (metadata) => {
      console.log('Received metadata:', metadata);
    },
    onComplete: async () => {
      console.log('Stream complete');
      await tryDecode(true);
    },
    onError: async (errorMessage) => {
      setError(errorMessage);
      setIsBuffering(false);
      // Try to decode whatever data we have received before the connection failed
      // This allows playback of partial audio if enough data was received
      if (accumulatedBufferRef.current && accumulatedBufferRef.current.byteLength > 0) {
        console.log('Connection failed, attempting to decode partial audio data...');
        await tryDecode(true);
      }
    }
  });

  const { handlePlay, handlePause, handleStop, retry } = useAudioStreamHandlers({
    markUserGesture, ensureContextReady, hasDecodedBuffer, accumulatedBufferRef,
    tryDecode, getDecodedBuffer, isPaused, bufferedSeconds, play, setIsBuffering,
    pause, stop, disconnect, resetDecoder, setError, connect, isConnected, isConnecting
  });

  useAutoStartPlayback({
    isBuffering, bufferedSeconds, isPlaying, isPaused, hasUserGesture,
    hasDecodedBuffer, getDecodedBuffer, play, setIsBuffering
  });

  useBufferReplacement({
    isPlaying,
    getDecodedBuffer,
    play,
    getCurrentPlaybackPosition,
    bufferedSeconds
  });

  // Auto-start buffering when connection is established
  useEffect(() => {
    if (isConnected && !isPlaying && !isPaused && bufferedSeconds === 0) {
      console.log('Connection established, starting buffering...');
      setIsBuffering(true);
    }
  }, [isConnected, isPlaying, isPaused, bufferedSeconds, setIsBuffering]);

  // Monitor streaming and trigger periodic decodes during playback
  useEffect(() => {
    if (!isPlaying || !isConnected) {
      return;
    }

    const interval = setInterval(async () => {
      if (hasDecodedBuffer() && accumulatedBufferRef.current) {
        await tryDecode();
      }
    }, 2000); // Check every 2 seconds

    return () => clearInterval(interval);
  }, [isPlaying, isConnected, hasDecodedBuffer, accumulatedBufferRef, tryDecode]);

  return {
    isConnected,
    isConnecting,
    isPlaying,
    isPaused,
    isBuffering,
    bufferedSeconds,
    error,
    connect,
    handlePlay,
    handlePause,
    handleStop,
    retry
  };
};
