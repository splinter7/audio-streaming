/**
 * Audio playback helper functions
 * Pure functions for managing Web Audio API source nodes
 */

/**
 * Creates and configures an audio source node
 * @param {AudioContext} ctx - The audio context
 * @param {AudioBuffer} audioBuffer - The audio buffer to play
 * @param {Function} onEnded - Callback when playback ends
 * @param {number} offset - Offset in seconds to start playback from (default: 0)
 * @returns {{ source: AudioBufferSourceNode, startTime: number, offset: number }}
 */
export const createAudioSource = (ctx, audioBuffer, onEnded, offset = 0) => {
  if (!ctx || !audioBuffer) {
    throw new Error('AudioContext and AudioBuffer are required');
  }

  const source = ctx.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(ctx.destination);
  
  if (onEnded) {
    source.onended = onEnded;
  }

  const startTime = ctx.currentTime;
  // Start with offset to support resuming from a specific position
  source.start(0, offset);

  return { source, startTime, offset };
};

/**
 * Cleans up an audio source node
 * @param {AudioBufferSourceNode} source - The source to cleanup
 * @returns {boolean} True if cleanup was successful
 */
export const cleanupSource = (source) => {
  if (!source) {
    return false;
  }

  try {
    // Disconnect from audio graph immediately to stop audio output
    source.disconnect();
    // Then schedule the stop
    source.stop();
    return true;
  } catch (e) {
    // Already stopped or disconnected
    return false;
  }
};
