import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';

// Mock the hooks
vi.mock('../hooks/useAudioStream', () => ({
  useAudioStream: vi.fn()
}));

import { useAudioStream } from '../hooks/useAudioStream';

describe('App', () => {
  const mockConnect = vi.fn();
  const mockHandlePlay = vi.fn();
  const mockHandlePause = vi.fn();
  const mockHandleStop = vi.fn();
  const mockRetry = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render app title', () => {
    useAudioStream.mockReturnValue({
      isConnected: false,
      isConnecting: false,
      isBuffering: false,
      isPlaying: false,
      isPaused: false,
      error: null,
      bufferedSeconds: 0,
      connect: mockConnect,
      handlePlay: mockHandlePlay,
      handlePause: mockHandlePause,
      handleStop: mockHandleStop,
      retry: mockRetry
    });

    render(<App />);
    
    expect(screen.getByText('Audio Stream Player')).toBeInTheDocument();
  });

  it('should show Play button when not connected', () => {
    useAudioStream.mockReturnValue({
      isConnected: false,
      isConnecting: false,
      isBuffering: false,
      isPlaying: false,
      isPaused: false,
      error: null,
      bufferedSeconds: 0,
      connect: mockConnect,
      handlePlay: mockHandlePlay,
      handlePause: mockHandlePause,
      handleStop: mockHandleStop,
      retry: mockRetry
    });

    render(<App />);
    
    expect(screen.getByLabelText('Play')).toBeInTheDocument();
    expect(screen.getByLabelText('Play')).not.toBeDisabled();
  });

  it('should call handlePlay when Play button is clicked while disconnected', async () => {
    const user = userEvent.setup();
    
    useAudioStream.mockReturnValue({
      isConnected: false,
      isConnecting: false,
      isBuffering: false,
      isPlaying: false,
      isPaused: false,
      error: null,
      bufferedSeconds: 0,
      connect: mockConnect,
      handlePlay: mockHandlePlay,
      handlePause: mockHandlePause,
      handleStop: mockHandleStop,
      retry: mockRetry
    });

    render(<App />);
    
    const playButton = screen.getByLabelText('Play');
    await user.click(playButton);
    
    expect(mockHandlePlay).toHaveBeenCalled();
  });

  it('should show message to click Play when not connected', () => {
    useAudioStream.mockReturnValue({
      isConnected: false,
      isConnecting: false,
      isBuffering: false,
      isPlaying: false,
      isPaused: false,
      error: null,
      bufferedSeconds: 0,
      connect: mockConnect,
      handlePlay: mockHandlePlay,
      handlePause: mockHandlePause,
      handleStop: mockHandleStop,
      retry: mockRetry
    });

    render(<App />);
    
    expect(screen.getByText('Click "Play" to start streaming')).toBeInTheDocument();
  });

  it('should show player controls and ready status when connected', () => {
    useAudioStream.mockReturnValue({
      isConnected: true,
      isConnecting: false,
      isBuffering: false,
      isPlaying: false,
      isPaused: false,
      error: null,
      bufferedSeconds: 0,
      connect: mockConnect,
      handlePlay: mockHandlePlay,
      handlePause: mockHandlePause,
      handleStop: mockHandleStop,
      retry: mockRetry
    });

    render(<App />);
    
    expect(screen.getByText('● Ready')).toBeInTheDocument();
    expect(screen.getByLabelText('Play')).toBeInTheDocument();
    expect(screen.getByLabelText('Pause')).toBeInTheDocument();
    expect(screen.getByLabelText('Stop')).toBeInTheDocument();
  });

  it('should show buffering indicator when buffering', () => {
    useAudioStream.mockReturnValue({
      isConnected: true,
      isConnecting: false,
      isBuffering: true,
      isPlaying: false,
      isPaused: false,
      error: null,
      bufferedSeconds: 5,
      connect: mockConnect,
      handlePlay: mockHandlePlay,
      handlePause: mockHandlePause,
      handleStop: mockHandleStop,
      retry: mockRetry
    });

    render(<App />);
    
    expect(screen.getByText(/Buffering/)).toBeInTheDocument();
  });

  it('should show error message when there is an error', () => {
    useAudioStream.mockReturnValue({
      isConnected: false,
      isConnecting: false,
      isBuffering: false,
      isPlaying: false,
      isPaused: false,
      error: 'Connection failed',
      bufferedSeconds: 0,
      connect: mockConnect,
      handlePlay: mockHandlePlay,
      handlePause: mockHandlePause,
      handleStop: mockHandleStop,
      retry: mockRetry
    });

    render(<App />);
    
    expect(screen.getByText('Connection failed')).toBeInTheDocument();
  });

  it('should call retry when retry button is clicked', async () => {
    const user = userEvent.setup();
    
    useAudioStream.mockReturnValue({
      isConnected: false,
      isConnecting: false,
      isBuffering: false,
      isPlaying: false,
      isPaused: false,
      error: 'Connection failed',
      bufferedSeconds: 0,
      connect: mockConnect,
      handlePlay: mockHandlePlay,
      handlePause: mockHandlePause,
      handleStop: mockHandleStop,
      retry: mockRetry
    });

    render(<App />);
    
    const retryButton = screen.getByText('Try Again');
    await user.click(retryButton);
    
    expect(mockRetry).toHaveBeenCalled();
  });

  it('should show playing status when playing', () => {
    useAudioStream.mockReturnValue({
      isConnected: true,
      isConnecting: false,
      isBuffering: false,
      isPlaying: true,
      isPaused: false,
      error: null,
      bufferedSeconds: 10,
      connect: mockConnect,
      handlePlay: mockHandlePlay,
      handlePause: mockHandlePause,
      handleStop: mockHandleStop,
      retry: mockRetry
    });

    render(<App />);
    
    expect(screen.getByText('▶ Playing')).toBeInTheDocument();
  });

  it('should show paused status when paused', () => {
    useAudioStream.mockReturnValue({
      isConnected: true,
      isConnecting: false,
      isBuffering: false,
      isPlaying: false,
      isPaused: true,
      error: null,
      bufferedSeconds: 10,
      connect: mockConnect,
      handlePlay: mockHandlePlay,
      handlePause: mockHandlePause,
      handleStop: mockHandleStop,
      retry: mockRetry
    });

    render(<App />);
    
    expect(screen.getByText('⏸ Paused')).toBeInTheDocument();
  });
});
