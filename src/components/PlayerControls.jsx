import './PlayerControls.css';

export const PlayerControls = ({ onPlay, onPause, onStop, isPlaying, isPaused, disabled }) => {
  return (
    <div className="player-controls">
      <button
        className="control-btn play-btn"
        onClick={onPlay}
        disabled={disabled || isPlaying}
        aria-label="Play"
      >
        ▶
      </button>
      <button
        className="control-btn pause-btn"
        onClick={onPause}
        disabled={disabled || !isPlaying}
        aria-label="Pause"
      >
        ⏸
      </button>
      <button
        className="control-btn stop-btn"
        onClick={onStop}
        disabled={disabled}
        aria-label="Stop"
      >
        ⏹
      </button>
    </div>
  );
};
