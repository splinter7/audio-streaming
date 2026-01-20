/**
 * AudioContext lifecycle manager
 * Follows SRP - manages AudioContext creation, state, and recovery
 */
export class AudioContextManager {
  constructor() {
    this.context = null;
  }

  /**
   * Ensures AudioContext is ready for playback
   * Handles closed state recovery and suspended state resumption
   */
  async ensureContext() {
    // Recreate context if closed
    if (this.context && this.context.state === 'closed') {
      this.context = null;
    }

    // Create new context if needed
    if (!this.context) {
      this.context = new (window.AudioContext || window.webkitAudioContext)();
    }

    // Resume if suspended - AWAIT THIS!
    if (this.context.state === 'suspended') {
      try {
        await this.context.resume();
      } catch (err) {
        console.warn('AudioContext resume failed', err);
      }
    }

    return this.context;
  }

  /**
   * Gets current context without modifying it
   */
  getContext() {
    return this.context;
  }

  /**
   * Checks if context is in a playable state
   */
  isReady() {
    return this.context && this.context.state !== 'closed';
  }

  /**
   * Suspends the context (pauses all audio processing)
   */
  async suspend() {
    if (this.context && this.context.state === 'running') {
      await this.context.suspend();
    }
  }

  /**
   * Closes and cleans up the context
   */
  async close() {
    if (this.context) {
      await this.context.close();
      this.context = null;
    }
  }
}
