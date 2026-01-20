import './StatusDisplay.css';

export const StatusDisplay = ({ error, isConnected, onRetry }) => {
  if (error) {
    return (
      <div className="status-display error">
        <div className="error-icon">⚠️</div>
        <h3>Error</h3>
        <p>{error}</p>
        <button className="retry-btn" onClick={onRetry}>
          Try Again
        </button>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="status-display info">
        <p>Click "Play" to start streaming</p>
      </div>
    );
  }

  return null;
};
