/**
 * WebRTC data channel message handlers
 * Pure functions for processing messages from WebRTC data channels
 */

/**
 * Handles JSON messages from WebRTC data channel
 * @param {string} data - JSON string data
 * @param {Object} callbacks - Message type callbacks
 * @param {Function} callbacks.onMetadata - Metadata message handler
 * @param {Function} callbacks.onError - Error message handler
 * @param {Function} callbacks.onComplete - Complete message handler
 * @param {RTCDataChannel} dataChannel - Data channel instance for closing on error
 * @returns {boolean} True if message was handled
 */
export const handleJsonMessage = (data, callbacks, dataChannel) => {
  const { onMetadata, onError, onComplete } = callbacks;
  
  try {
    const message = JSON.parse(data);
    
    switch (message.type) {
      case 'metadata':
        onMetadata?.(message);
        break;
      case 'error':
        onError?.(message.message || 'An error occurred while streaming');
        dataChannel?.close();
        break;
      case 'complete':
        onComplete?.();
        break;
      default:
        console.warn('Unknown message type:', message.type);
    }
    return true;
  } catch (err) {
    console.error('Error parsing JSON message:', err);
    return false;
  }
};

/**
 * Handles binary messages from WebRTC data channel
 * @param {ArrayBuffer} data - Binary ArrayBuffer data
 * @param {Function} onBinaryMessage - Binary message handler
 * @returns {Promise<void>}
 */
export const handleBinaryMessage = async (data, onBinaryMessage) => {
  try {
    onBinaryMessage?.(data);
  } catch (err) {
    console.error('Error processing binary message:', err);
    throw err;
  }
};
