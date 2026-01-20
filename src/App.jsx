import { useAudioStream } from './hooks/useAudioStream';
import { PlayerControls } from './components/PlayerControls';
import { BufferingIndicator } from './components/BufferingIndicator';
import { StatusDisplay } from './components/StatusDisplay';
import { config } from './config';
import './App.css';

function App() {
  const {
    isConnected,
    isConnecting,
    isBuffering,
    isPlaying,
    isPaused,
    error,
    bufferedSeconds,
    connect,
    handlePlay,
    handlePause,
    handleStop,
    retry
  } = useAudioStream();

  return (
    <div className="app">
      <div className="app-container">
        <h1 className="app-title">Audio Stream Player</h1>
        
        <StatusDisplay 
          error={error} 
          isConnected={isConnected}
          onRetry={retry}
        />

        {isBuffering && !error && (
          <BufferingIndicator 
            bufferedSeconds={bufferedSeconds}
            thresholdSeconds={config.bufferThresholdSeconds}
          />
        )}

        {!error && (
          <div className="status-info">
            {isConnected && (
              <p className="status-text">
                {isPlaying ? '▶ Playing' : isPaused ? '⏸ Paused' : '● Ready'}
              </p>
            )}
          </div>
        )}

        <PlayerControls
          onPlay={handlePlay}
          onPause={handlePause}
          onStop={handleStop}
          isPlaying={isPlaying}
          isPaused={isPaused}
          disabled={error !== null}
        />
      </div>
    </div>
  );
}

export default App;
