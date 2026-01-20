/**
 * Buffer estimation utilities for audio streaming
 * Pure functions for calculating buffer sizes and durations
 */

/**
 * Estimates buffered duration based on total bytes
 * @param {number} totalBytes - Total bytes accumulated
 * @returns {number} Estimated duration in seconds
 */
export const estimateBufferedDuration = (totalBytes) => {
  // Typical MP3 bitrate is 128kbps = 16KB per second
  // Using a conservative estimate of 12KB per second
  return totalBytes / (12 * 1024);
};

/**
 * Accumulates multiple ArrayBuffer chunks into a single buffer
 * @param {ArrayBuffer[]} chunks - Array of audio chunks
 * @returns {{ buffer: ArrayBuffer, totalBytes: number }}
 */
export const accumulateChunks = (chunks) => {
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
  const combined = new Uint8Array(totalLength);
  
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(new Uint8Array(chunk), offset);
    offset += chunk.byteLength;
  }

  return {
    buffer: combined.buffer,
    totalBytes: totalLength
  };
};
