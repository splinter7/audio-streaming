import './BufferingIndicator.css';

export const BufferingIndicator = ({ bufferedSeconds, thresholdSeconds }) => {
  const progress = Math.min((bufferedSeconds / thresholdSeconds) * 100, 100);

  return (
    <div className="buffering-indicator">
      <div className="spinner"></div>
      <p className="buffering-text">Buffering audio...</p>
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <p className="progress-text">
        {bufferedSeconds.toFixed(1)}s / {thresholdSeconds}s buffered
      </p>
    </div>
  );
};
