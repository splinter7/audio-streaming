import express from 'express';
import { createServer } from 'http';
import { readFileSync, statSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import wrtc from '@roamhq/wrtc';

const { RTCPeerConnection, RTCSessionDescription } = wrtc;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);

const PORT = 3001;
const CHUNK_SIZE = 64 * 1024; // 64KB chunks

// Middleware
app.use(express.json());

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.static(join(__dirname, '../dist')));

// Store active peer connections
const peerConnections = new Map();

// STUN/TURN configuration (needed for ICE candidate generation in node-webrtc)
const iceServers = [
  { urls: 'stun:stun.l.google.com:19302' }
];

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'WebRTC signaling server is running' });
});

// POST /api/offer - Handle WebRTC offer from client
app.post('/api/offer', async (req, res) => {
  try {
    const { offer, clientId } = req.body;

    if (!offer || !offer.type || !offer.sdp) {
      return res.status(400).json({ error: 'Invalid offer' });
    }

    console.log(`Received offer from client ${clientId}`);

    // Create peer connection
    const peerConnection = new RTCPeerConnection({ iceServers });
    const connectionId = clientId || Date.now().toString();
    
    // Store peer connection
    peerConnections.set(connectionId, peerConnection);

    // Handle connection state changes
    // Note: streamingActive and chunkTimeoutId are scoped within ondatachannel
    // so we'll handle cleanup via the data channel handlers
    peerConnection.onconnectionstatechange = () => {
      console.log(`Connection state: ${peerConnection.connectionState}`);
      if (peerConnection.connectionState === 'disconnected' || 
          peerConnection.connectionState === 'failed' ||
          peerConnection.connectionState === 'closed') {
        // The data channel handlers will stop streaming when connection fails
        peerConnections.delete(connectionId);
      }
    };

    // Listen for data channel created by client
    peerConnection.ondatachannel = (event) => {
      const dataChannel = event.channel;
      console.log('Received data channel from client, state:', dataChannel.readyState);

      // Track streaming state to allow cancellation
      let streamingActive = true;
      let chunkTimeoutId = null;

      // Setup data channel
      dataChannel.onopen = async () => {
        console.log('Data channel opened, starting audio stream');
      
      try {
        // Read the audio file
        const audioPath = join(__dirname, 'audio', 'sample.mp3');
        
        // Check if file exists
        try {
          statSync(audioPath);
        } catch (err) {
          dataChannel.send(JSON.stringify({ 
            type: 'error', 
            message: 'Audio file not found' 
          }));
          dataChannel.close();
          return;
        }

        const audioBuffer = readFileSync(audioPath);
        const totalChunks = Math.ceil(audioBuffer.length / CHUNK_SIZE);

        console.log(`Streaming ${audioBuffer.length} bytes in ${totalChunks} chunks`);

        // Send initial metadata
        dataChannel.send(JSON.stringify({
          type: 'metadata',
          totalSize: audioBuffer.length,
          totalChunks: totalChunks,
          chunkSize: CHUNK_SIZE
        }));

        let chunkIndex = 0;

        // Send chunks at intervals to simulate streaming
        const sendChunk = () => {
          // Check if streaming should stop
          if (!streamingActive || 
              dataChannel.readyState !== 'open' || 
              peerConnection.connectionState === 'failed' ||
              peerConnection.connectionState === 'disconnected' ||
              peerConnection.connectionState === 'closed') {
            console.log('Connection failed or closed, stopping stream');
            if (chunkTimeoutId) {
              clearTimeout(chunkTimeoutId);
              chunkTimeoutId = null;
            }
            return;
          }

          if (chunkIndex >= totalChunks) {
            dataChannel.send(JSON.stringify({ type: 'complete' }));
            streamingActive = false;
            return;
          }

          const start = chunkIndex * CHUNK_SIZE;
          const end = Math.min(start + CHUNK_SIZE, audioBuffer.length);
          const chunk = audioBuffer.slice(start, end);

          // Check buffered amount for flow control
          if (dataChannel.bufferedAmount < 256 * 1024) {
            try {
              // Send chunk as binary data
              dataChannel.send(chunk);
              chunkIndex++;
            } catch (err) {
              console.error('Error sending chunk:', err);
              streamingActive = false;
              return;
            }
          }

          // Send next chunk after a small delay (simulate network streaming)
          if (chunkIndex < totalChunks && streamingActive) {
            chunkTimeoutId = setTimeout(sendChunk, 50); // ~20 chunks per second
          }
        };

        // Start sending chunks
        sendChunk();
      } catch (error) {
        console.error('Error streaming audio:', error);
        streamingActive = false;
        if (chunkTimeoutId) {
          clearTimeout(chunkTimeoutId);
          chunkTimeoutId = null;
        }
        try {
          dataChannel.send(JSON.stringify({ 
            type: 'error', 
            message: error.message 
          }));
        } catch (sendErr) {
          console.error('Error sending error message:', sendErr);
        }
        dataChannel.close();
      }
      };

      dataChannel.onerror = (error) => {
        console.error('Data channel error:', error);
        streamingActive = false;
        if (chunkTimeoutId) {
          clearTimeout(chunkTimeoutId);
          chunkTimeoutId = null;
        }
      };

      dataChannel.onclose = () => {
        console.log('Data channel closed');
        streamingActive = false;
        if (chunkTimeoutId) {
          clearTimeout(chunkTimeoutId);
          chunkTimeoutId = null;
        }
        peerConnection.close();
        peerConnections.delete(connectionId);
      };

      dataChannel.onstatechange = () => {
        console.log('Data channel state changed to:', dataChannel.readyState);
        if (dataChannel.readyState !== 'open') {
          streamingActive = false;
          if (chunkTimeoutId) {
            clearTimeout(chunkTimeoutId);
            chunkTimeoutId = null;
          }
        }
      };
    };

    // Set remote description (client's offer)
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    console.log('Remote description set (client offer)');

    // Create answer
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    console.log('Local description set (server answer)');

    // Wait for ICE gathering to complete
    if (peerConnection.iceGatheringState !== 'complete') {
      await new Promise((resolve) => {
        const checkState = () => {
          if (peerConnection.iceGatheringState === 'complete') {
            peerConnection.removeEventListener('icegatheringstatechange', checkState);
            resolve();
          }
        };
        peerConnection.addEventListener('icegatheringstatechange', checkState);
        checkState(); // Check immediately in case it's already complete
        // Timeout after 3 seconds even if not complete
        setTimeout(() => {
          peerConnection.removeEventListener('icegatheringstatechange', checkState);
          resolve();
        }, 3000);
      });
    }

    // Send answer back to client
    // Note: ICE candidates are embedded in the SDP (localDescription.sdp)
    res.json({
      answer: peerConnection.localDescription
    });

  } catch (error) {
    console.error('Error handling offer:', error);
    res.status(500).json({ error: error.message });
  }
});

// Cleanup on shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  peerConnections.forEach((pc) => pc.close());
  peerConnections.clear();
  process.exit(0);
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`WebRTC signaling ready for connections`);
});
