import { useEffect, useRef } from 'react';

/**
 * Custom hook to handle buffer replacement during active playback
 * Monitors decoded buffer changes and updates playback with new buffer
 * while preserving the current playback position
 */
export const useBufferReplacement = ({
  isPlaying,
  getDecodedBuffer,
  play,
  getCurrentPlaybackPosition,
  bufferedSeconds
}) => {
  const lastBufferDurationRef = useRef(0);

  useEffect(() => {
    if (!isPlaying) {
      return;
    }

    const currentBuffer = getDecodedBuffer();
    if (!currentBuffer) {
      return;
    }

    // Check if buffer has been updated with more content
    const currentDuration = currentBuffer.duration;
    const hasNewContent = currentDuration > lastBufferDurationRef.current * 1.1;

    if (hasNewContent) {
      const currentPosition = getCurrentPlaybackPosition();
      const remainingContent = currentDuration - currentPosition;
      
      console.log(`Buffer updated: ${lastBufferDurationRef.current.toFixed(2)}s -> ${currentDuration.toFixed(2)}s, at position ${currentPosition.toFixed(2)}s`);
      
      // Only replace if we have significant new content ahead (at least 5 seconds)
      // BUT: Always replace if buffer has grown significantly (more than 10% longer)
      // This ensures we get the final buffer even when close to the end
      const shouldReplace = remainingContent > 5 || (currentDuration > lastBufferDurationRef.current * 1.1 && currentDuration > lastBufferDurationRef.current + 2);
      
      if (shouldReplace) {
        lastBufferDurationRef.current = currentDuration;
        
        // Replace the playing buffer, preserving position
        // The play function will automatically preserve the current position
        play(currentBuffer);
      } else {
        // Not enough new content to justify a replacement
      }
    }
  }, [isPlaying, getDecodedBuffer, play, getCurrentPlaybackPosition, bufferedSeconds]);

  // Reset tracking when playback stops
  useEffect(() => {
    if (!isPlaying) {
      lastBufferDurationRef.current = 0;
    }
  }, [isPlaying]);
};
