import { useState, useRef, useCallback, useEffect } from 'react';
import { AudioContextManager } from '../utils/AudioContextManager';
import { createAudioSource, cleanupSource } from '../utils/audioPlaybackHelpers';
import { setupGestureTracking } from '../utils/userGestureTracker';

export const useAudioPlayback = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  
  const contextManagerRef = useRef(new AudioContextManager());
  const sourceNodeRef = useRef(null);
  const startTimeRef = useRef(0);
  const pausedTimeRef = useRef(0);
  const playbackOffsetRef = useRef(0);
  const hasUserGestureRef = useRef(false);
  const currentBufferDurationRef = useRef(0);

  const play = useCallback(async (audioBuffer, resumeOffset = null) => {
    if (!audioBuffer) {
      console.warn('No audio buffer provided');
      return false;
    }

    const ctx = await contextManagerRef.current.ensureContext();
    
    // Calculate current position before stopping if we're replacing during playback
    let currentOffset = resumeOffset;
    if (currentOffset === null && sourceNodeRef.current) {
      const elapsed = ctx.currentTime - startTimeRef.current;
      currentOffset = playbackOffsetRef.current + elapsed;
      console.log(`Preserving playback position: ${currentOffset.toFixed(2)}s`);
    } else if (currentOffset === null) {
      currentOffset = pausedTimeRef.current || 0;
    }
    
    if (sourceNodeRef.current) {
      cleanupSource(sourceNodeRef.current);
      sourceNodeRef.current = null;
    }

    const onEnded = () => {
      // Check if this source is still the active one
      if (sourceNodeRef.current === source) {
        // Verify we've actually reached the end by checking playback position
        const ctx = contextManagerRef.current.getContext();
        if (ctx) {
          const elapsed = ctx.currentTime - startTimeRef.current;
          const currentPosition = playbackOffsetRef.current + elapsed;
          const bufferDuration = currentBufferDurationRef.current;

          // Only stop if we're actually at or very close to the end (within 1% tolerance)
          if (currentPosition >= bufferDuration * 0.99) {
            sourceNodeRef.current = null;
            setIsPlaying(false);
            playbackOffsetRef.current = 0;
            currentBufferDurationRef.current = 0;
          } else {
            // Ignore onEnded if we haven't reached the end; this can happen when replacing buffers
          }
        } else {
          // No context, safe to stop
          sourceNodeRef.current = null;
          setIsPlaying(false);
          playbackOffsetRef.current = 0;
          currentBufferDurationRef.current = 0;
        }
      } else {
        // onEnded from a previously replaced source; ignore
      }
    };

    const { source, startTime } = createAudioSource(ctx, audioBuffer, onEnded, currentOffset);

    startTimeRef.current = startTime;
    playbackOffsetRef.current = currentOffset;
    currentBufferDurationRef.current = audioBuffer.duration;
    sourceNodeRef.current = source;
    setIsPlaying(true);
    setIsPaused(false);
    setIsBuffering(false);

    return true;
  }, [isPlaying, isPaused]);

  const pause = useCallback(() => {
    if (!sourceNodeRef.current || !contextManagerRef.current.getContext()) {
      return;
    }

    const ctx = contextManagerRef.current.getContext();
    pausedTimeRef.current = ctx.currentTime - startTimeRef.current;
    
    sourceNodeRef.current.stop();
    sourceNodeRef.current = null;
    
    setIsPlaying(false);
    setIsPaused(true);
  }, []);

  const stop = useCallback(() => {
    if (sourceNodeRef.current) {
      cleanupSource(sourceNodeRef.current);
      sourceNodeRef.current = null;
    }

    contextManagerRef.current.suspend();
    
    setIsPlaying(false);
    setIsPaused(false);
    pausedTimeRef.current = 0;
    startTimeRef.current = 0;
    playbackOffsetRef.current = 0;
    currentBufferDurationRef.current = 0;
  }, [isPlaying, isPaused]);

  const markUserGesture = useCallback(() => {
    hasUserGestureRef.current = true;
  }, []);

  const hasUserGesture = useCallback(() => {
    return hasUserGestureRef.current;
  }, []);

  const getAudioContext = useCallback(() => {
    return contextManagerRef.current.getContext();
  }, []);

  const ensureContextReady = useCallback(() => {
    return contextManagerRef.current.ensureContext();
  }, []);

  const getCurrentPlaybackPosition = useCallback(() => {
    if (!sourceNodeRef.current || !contextManagerRef.current.getContext()) {
      return 0;
    }
    const ctx = contextManagerRef.current.getContext();
    const elapsed = ctx.currentTime - startTimeRef.current;
    const position = playbackOffsetRef.current + elapsed;
    // Clamp to buffer duration to prevent reporting position beyond end
    return Math.min(position, currentBufferDurationRef.current);
  }, []);

  useEffect(() => {
    return setupGestureTracking(hasUserGestureRef);
  }, []);

  useEffect(() => {
    return () => {
      if (sourceNodeRef.current) {
        cleanupSource(sourceNodeRef.current);
      }
      contextManagerRef.current.close();
    };
  }, []);

  return {
    isPlaying,
    isPaused,
    isBuffering,
    setIsBuffering,
    play,
    pause,
    stop,
    markUserGesture,
    hasUserGesture,
    getAudioContext,
    ensureContextReady,
    getCurrentPlaybackPosition
  };
};
