import { useEffect, useRef } from 'react';

/**
 * Custom hook to handle audio stream initialization
 * Manages AudioContext setup and initial state
 */
export const useAudioStreamInit = ({ ensureContextReady }) => {
  const audioContextRef = useRef(null);
  const initPromiseRef = useRef(null);
  
  // Initialize AudioContext early so decoder can use it
  useEffect(() => {
    // Store the promise so we can await it if needed
    initPromiseRef.current = ensureContextReady().then(ctx => {
      audioContextRef.current = ctx;
      return ctx;
    });
  }, [ensureContextReady]);

  return {
    audioContextRef,
    initPromiseRef
  };
};
