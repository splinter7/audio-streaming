# Audio Streaming WebRTC App

A React frontend application that streams MP3 audio in chunks over WebRTC DataChannel, with buffering, playback controls, and error handling.

## Features

- WebRTC-based audio streaming with peer-to-peer data channels
- Automatic buffering (10 seconds before playback)
- Play, Pause, and Stop controls
- Visual buffering indicator
- Error handling with automatic retry and reconnection
- Modern, responsive UI

## Setup

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Install frontend dependencies:
```bash
npm install
```

2. Install backend dependencies:
```bash
cd server
npm install
```

3. Add an audio file:
   - Place an MP3 file at `server/audio/sample.mp3`
   - Or modify `server/index.js` to point to your audio file

### Running the Application

1. Start the backend server (in one terminal):
```bash
npm run server
```

2. Start the frontend dev server (in another terminal):
```bash
npm run dev
```

3. Open your browser to `http://localhost:3000`

## Testing

This project includes comprehensive test suites for both frontend and backend components.

### Running Tests

**Frontend Tests (Vitest):**
```bash
npm test                  # Run all tests
npm test -- --watch       # Watch mode for development
npm run test:ui          # Interactive visual UI
npm run test:coverage    # Generate coverage report
```

**Backend Tests (Jest):**
```bash
cd server
npm test                 # Run all tests
npm run test:watch       # Watch mode for development
```

### Test Coverage

Frontend test files include:
- Configuration and constants tests
- WebSocket message handler tests
- Audio context manager tests
- Component integration tests

Backend test files cover:
- API endpoint functionality
- WebSocket server behavior
- Error handling

View detailed coverage reports at `coverage/index.html` after running `npm run test:coverage`.

For more testing details, see [Testing Quick Start Guide](docs/TESTING_QUICKSTART.md).

## Project Structure

```
streaming/
├── server/                    # Backend WebRTC signaling server
│   ├── index.js               # Express + WebRTC server
│   ├── package.json
│   └── audio/                 # Place MP3 files here
├── src/                       # React frontend
│   ├── App.jsx                # Main app component
│   ├── components/            # UI components
│   ├── hooks/                 # Custom React hooks
│   │   ├── useWebRTCConnection.js  # WebRTC connection management
│   │   ├── useAudioStream.js       # Main audio streaming logic
│   │   └── ...
│   ├── tests/                 # Test files
│   └── utils/                 # Utility functions
└── package.json               # Frontend dependencies
```

## How It Works

1. **WebRTC Connection Establishment:**
   - Client creates RTCPeerConnection and DataChannel
   - Client sends SDP offer to server via HTTP POST to `/api/offer`
   - Server creates its own RTCPeerConnection and responds with SDP answer
   - ICE candidates are exchanged to establish peer-to-peer connection

2. **Audio Streaming:**
   - Backend reads an MP3 file and sends it in 64KB chunks over the DataChannel
   - Frontend receives chunks and decodes them using Web Audio API
   - Audio is buffered until 10 seconds are accumulated
   - Playback starts automatically when buffer threshold is reached

3. **Playback Control:**
   - User can control playback with Play/Pause/Stop buttons
   - Automatic reconnection on connection failures

## Documentation

This project includes comprehensive documentation:

- **[Code Walkthrough](docs/CODE_WALKTHROUGH.md)** - Simplified explanation of the codebase in plain language
- **[How It Works](docs/HOW_IT_WORKS.md)** - High-level explanation of the app's functionality
- **[System Design](docs/SYSTEM_DESIGN.md)** - Detailed architecture and design decisions
- **[Technical Overview](docs/TECHNICAL_OVERVIEW.md)** - Deep dive into WebRTC implementation and technical details

## Notes

- The app requires a sample MP3 file at `server/audio/sample.mp3`
- Uses WebRTC DataChannel for efficient peer-to-peer audio streaming
- Signaling server (HTTP) runs on port 3001
- Frontend dev server runs on port 3000
