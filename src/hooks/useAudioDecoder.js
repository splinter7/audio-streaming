import { useState, useRef, useCallback } from 'react';
import { config } from '../config';
import { estimateBufferedDuration, accumulateChunks } from '../utils/bufferEstimation';

export const useAudioDecoder = (audioContextRef, initPromiseRef = null, ensureContextReady = null) => {
  const [bufferedSeconds, setBufferedSeconds] = useState(0);
  const rawChunksRef = useRef([]);
  const accumulatedBufferRef = useRef(null);
  const decodedBuffersRef = useRef([]);
  const isDecodingRef = useRef(false);
  const lastDecodedBytesRef = useRef(0);

  const performAccumulation = useCallback(() => {
    const { buffer, totalBytes } = accumulateChunks(rawChunksRef.current);
    accumulatedBufferRef.current = buffer;
    return totalBytes;
  }, []);

  const tryDecode = useCallback(async (forceMode = false) => {
    // Wait for AudioContext if not available yet (handles async initialization after refresh)
    if (!audioContextRef.current && accumulatedBufferRef.current) {
      // Always call ensureContextReady directly - it handles user gesture requirements
      // The promise from useEffect might be stuck waiting for a gesture that happened later
      if (ensureContextReady) {
        try {
          const ctx = await ensureContextReady();
          audioContextRef.current = ctx;
        } catch (err) {
          return null;
        }
      } else {
        return null;
      }
    }
    
    if (!audioContextRef.current || !accumulatedBufferRef.current || isDecodingRef.current) {
      return null;
    }

    const currentBufferSize = accumulatedBufferRef.current.byteLength;
    
    // Check if we should decode based on buffer growth
    const hasGrown = currentBufferSize > lastDecodedBytesRef.current * 1.2;
    const shouldDecode = forceMode || decodedBuffersRef.current.length === 0 || hasGrown;
    
    if (!shouldDecode) {
      return null;
    }

    isDecodingRef.current = true;

    try {
      const audioBuffer = await audioContextRef.current.decodeAudioData(
        accumulatedBufferRef.current.slice(0)
      );

      decodedBuffersRef.current = [audioBuffer];
      setBufferedSeconds(audioBuffer.duration);
      lastDecodedBytesRef.current = currentBufferSize;
      
      console.log(`Decoded audio: ${audioBuffer.duration.toFixed(2)}s (${currentBufferSize} bytes)`);
      
      return audioBuffer;
    } catch (error) {
      console.log('Waiting for more audio data to decode...', error.message);
      return null;
    } finally {
      isDecodingRef.current = false;
    }
  }, [audioContextRef, initPromiseRef, ensureContextReady]);

  const addChunk = useCallback(async (arrayBuffer) => {
    rawChunksRef.current.push(arrayBuffer);
    
    const totalBytes = performAccumulation();
    const estimatedDuration = estimateBufferedDuration(totalBytes);
    
    // Update with estimate only if we don't have decoded data yet
    if (decodedBuffersRef.current.length === 0) {
      setBufferedSeconds(estimatedDuration);
    }

    // Try to decode if we have enough estimated data OR if buffer has grown significantly
    const shouldAttemptDecode = 
      estimatedDuration >= config.bufferThresholdSeconds || 
      (decodedBuffersRef.current.length > 0 && totalBytes > lastDecodedBytesRef.current * 1.2);
    
    if (shouldAttemptDecode && !isDecodingRef.current) {
      await tryDecode();
    }
  }, [performAccumulation, tryDecode]);

  const reset = useCallback(() => {
    rawChunksRef.current = [];
    accumulatedBufferRef.current = null;
    decodedBuffersRef.current = [];
    isDecodingRef.current = false;
    lastDecodedBytesRef.current = 0;
    setBufferedSeconds(0);
  }, []);

  const getDecodedBuffer = useCallback(() => {
    return decodedBuffersRef.current[0] || null;
  }, []);

  const hasDecodedBuffer = useCallback(() => {
    return decodedBuffersRef.current.length > 0;
  }, []);

  return {
    bufferedSeconds,
    addChunk,
    tryDecode,
    reset,
    getDecodedBuffer,
    hasDecodedBuffer,
    accumulatedBufferRef
  };
};
