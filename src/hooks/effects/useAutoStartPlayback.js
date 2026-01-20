import { useEffect } from 'react';
import { config } from '../../config';

/**
 * Custom hook to manage auto-start playback logic
 * Monitors buffer state and triggers playback when conditions are met
 */
export const useAutoStartPlayback = ({
  isBuffering,
  bufferedSeconds,
  isPlaying,
  isPaused,
  hasUserGesture,
  hasDecodedBuffer,
  getDecodedBuffer,
  play,
  setIsBuffering
}) => {
  /**
   * Auto-start playback when buffering completes after user clicked Play
   */
  useEffect(() => {
    const shouldAutoStart = (
      isBuffering &&
      bufferedSeconds >= config.bufferThresholdSeconds &&
      !isPlaying &&
      !isPaused &&
      hasUserGesture() &&
      hasDecodedBuffer()
    );

    if (shouldAutoStart) {
      setIsBuffering(false);
      const buffer = getDecodedBuffer();
      if (buffer) {
        play(buffer); // Don't await here - let it run async
      }
    }
  }, [
    bufferedSeconds,
    isBuffering,
    isPlaying,
    isPaused,
    hasUserGesture,
    hasDecodedBuffer,
    getDecodedBuffer,
    play,
    setIsBuffering
  ]);

  // Clear buffering state when we have enough audio
  useEffect(() => {
    if (bufferedSeconds >= config.bufferThresholdSeconds && isBuffering && !isPlaying) {
      // Don't clear if we're waiting for user to click play
      if (!hasUserGesture()) {
        setIsBuffering(false);
      }
    }
  }, [bufferedSeconds, isBuffering, isPlaying, hasUserGesture, setIsBuffering]);
};
