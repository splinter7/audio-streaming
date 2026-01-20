import { useState, useRef, useCallback, useEffect } from 'react';
import { config } from '../config';
import { handleJsonMessage, handleBinaryMessage } from '../utils/webrtcHandlers';

export const useWebRTCConnection = ({ onBinaryMessage, onMetadata, onComplete, onError }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const peerConnectionRef = useRef(null);
  const dataChannelRef = useRef(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimeoutRef = useRef(null);
  const manualDisconnectRef = useRef(false);

  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (dataChannelRef.current) {
      dataChannelRef.current.close();
      dataChannelRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
  }, []);

  const handleReconnect = useCallback((isAuto) => {
    if (manualDisconnectRef.current) return;
    
    const shouldRetry = reconnectAttemptRef.current < config.maxReconnectAttempts;
    if (shouldRetry && isAuto) {
      const attempt = reconnectAttemptRef.current + 1;
      reconnectAttemptRef.current = attempt;
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
      
      reconnectTimeoutRef.current = setTimeout(() => {
        connect({ isAuto: true });
      }, delay);
    }
  }, []);

  const connect = useCallback(async (options = {}) => {
    if (peerConnectionRef.current?.connectionState === 'connected') {
      return;
    }

    const { isAuto = false } = options;
    manualDisconnectRef.current = false;
    setIsConnected(false);
    setIsConnecting(true);

    cleanup();

    try {
      // Create RTCPeerConnection
      const peerConnection = new RTCPeerConnection({ iceServers: config.iceServers });
      peerConnectionRef.current = peerConnection;

      // Handle connection state changes
      peerConnection.onconnectionstatechange = () => {
        console.log('WebRTC connection state:', peerConnection.connectionState);
        
        switch (peerConnection.connectionState) {
          case 'connected':
            // Don't set isConnected here - wait for data channel to open
            console.log('Peer connection established, waiting for data channel...');
            break;
          case 'disconnected':
          case 'failed':
            setIsConnected(false);
            setIsConnecting(false);
            handleReconnect(isAuto);
            if (reconnectAttemptRef.current >= config.maxReconnectAttempts) {
              onError?.('Connection lost. Please try again.');
            }
            break;
          case 'closed':
            setIsConnected(false);
            setIsConnecting(false);
            if (!manualDisconnectRef.current) {
              handleReconnect(isAuto);
              if (reconnectAttemptRef.current >= config.maxReconnectAttempts) {
                onError?.('Unable to connect. Is the server running?');
              }
            }
            break;
        }
      };

      // Handle ICE connection state changes
      peerConnection.oniceconnectionstatechange = () => {
        console.log('ICE connection state:', peerConnection.iceConnectionState);
      };

      // CLIENT creates the data channel (not server)
      const dataChannel = peerConnection.createDataChannel('audio-stream', {
        ordered: true
      });
      dataChannelRef.current = dataChannel;

      dataChannel.onopen = () => {
        console.log('Data channel opened - now truly connected and ready for data');
        setIsConnected(true);
        setIsConnecting(false);
        reconnectAttemptRef.current = 0;
      };

      dataChannel.onmessage = async (event) => {
        try {
          // Handle JSON messages (metadata/control)
          if (typeof event.data === 'string') {
            handleJsonMessage(event.data, { onMetadata, onError, onComplete }, dataChannel);
            return;
          }

          // Handle binary messages (audio chunks)
          if (event.data instanceof ArrayBuffer) {
            await handleBinaryMessage(event.data, onBinaryMessage);
          } else if (event.data instanceof Blob) {
            const arrayBuffer = await event.data.arrayBuffer();
            await handleBinaryMessage(arrayBuffer, onBinaryMessage);
          }
        } catch (err) {
          console.error('Error processing message:', err);
          onError?.('Error processing audio data');
        }
      };

      dataChannel.onerror = (err) => {
        console.error('Data channel error:', err);
        setIsConnected(false);
        handleReconnect(isAuto);
        if (reconnectAttemptRef.current >= config.maxReconnectAttempts) {
          onError?.('Data channel error. Please try again.');
        }
      };

      dataChannel.onclose = () => {
        console.log('Data channel closed');
        setIsConnected(false);
        dataChannelRef.current = null;
        // If connection closed unexpectedly (not manual disconnect), notify error handler
        // This allows frontend to attempt decoding any partial data received
        if (!manualDisconnectRef.current && peerConnectionRef.current?.connectionState === 'failed') {
          onError?.('Connection closed unexpectedly');
        }
      };

      // Create offer
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      // Send offer to server
      console.log('Sending offer to server...');
      const response = await fetch(`${config.apiUrl}/offer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offer: peerConnection.localDescription,
          clientId: `client-${Date.now()}`
        })
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const { answer } = await response.json();

      // Set remote description (server's answer)
      await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));

      console.log('WebRTC connection established');

    } catch (err) {
      console.error('Error connecting:', err);
      setIsConnected(false);
      setIsConnecting(false);
      handleReconnect(isAuto);
      if (reconnectAttemptRef.current >= config.maxReconnectAttempts) {
        onError?.('Failed to connect to server. Please try again.');
      }
    }
  }, [cleanup, handleReconnect, onBinaryMessage, onMetadata, onComplete, onError]);

  const disconnect = useCallback(() => {
    manualDisconnectRef.current = true;
    cleanup();
    setIsConnected(false);
    setIsConnecting(false);
  }, [cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      manualDisconnectRef.current = true;
      cleanup();
    };
  }, [cleanup]);

  return {
    isConnected,
    isConnecting,
    connect,
    disconnect
  };
};
