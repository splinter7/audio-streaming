import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AudioContextManager } from '../utils/AudioContextManager';

describe('AudioContextManager', () => {
  let manager;

  beforeEach(() => {
    manager = new AudioContextManager();
  });

  describe('ensureContext', () => {
    it('should create and return AudioContext', async () => {
      const ctx = await manager.ensureContext();
      
      expect(ctx).toBeDefined();
      expect(ctx.state).toBe('running');
    });

    it('should return same context on multiple calls', async () => {
      const ctx1 = await manager.ensureContext();
      const ctx2 = await manager.ensureContext();
      
      expect(ctx1).toBe(ctx2);
    });

    it('should resume suspended context', async () => {
      const ctx = await manager.ensureContext();
      ctx.state = 'suspended';
      
      const resumedCtx = await manager.ensureContext();
      
      expect(ctx.resume).toHaveBeenCalled();
      expect(resumedCtx).toBe(ctx);
    });
  });

  describe('suspend', () => {
    it('should suspend active context', async () => {
      await manager.ensureContext();
      
      await manager.suspend();
      
      expect(manager.context.suspend).toHaveBeenCalled();
    });

    it('should handle suspend when no context exists', async () => {
      await expect(manager.suspend()).resolves.not.toThrow();
    });
  });

  describe('close', () => {
    it('should close and clear context', async () => {
      const ctx = await manager.ensureContext();
      
      await manager.close();
      
      expect(ctx.close).toHaveBeenCalled();
      expect(manager.context).toBeNull();
    });

    it('should handle close when no context exists', async () => {
      await expect(manager.close()).resolves.not.toThrow();
    });
  });

  describe('getContext', () => {
    it('should return null if no context', () => {
      expect(manager.getContext()).toBeNull();
    });

    it('should return context after creation', async () => {
      const ctx = await manager.ensureContext();
      
      expect(manager.getContext()).toBe(ctx);
    });
  });
});
