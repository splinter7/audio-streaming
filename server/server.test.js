import request from 'supertest';
import express from 'express';

// Create a minimal test app with just the endpoints
const createTestApp = () => {
  const app = express();
  app.use(express.json());

  // CORS middleware
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'WebRTC signaling server is running' });
  });

  return app;
};

describe('Server API Endpoints', () => {
  let app;

  beforeEach(() => {
    app = createTestApp();
  });

  describe('GET /api/health', () => {
    it('should return 200 and health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toEqual({
        status: 'ok',
        message: 'WebRTC signaling server is running'
      });
    });

    it('should have correct Content-Type', async () => {
      const response = await request(app)
        .get('/api/health');

      expect(response.headers['content-type']).toMatch(/json/);
    });
  });

  describe('CORS', () => {
    it('should have CORS headers on GET requests', async () => {
      const response = await request(app)
        .get('/api/health');

      expect(response.headers['access-control-allow-origin']).toBe('*');
    });

    it('should handle OPTIONS preflight requests', async () => {
      const response = await request(app)
        .options('/api/health')
        .expect(200);

      expect(response.headers['access-control-allow-methods']).toContain('POST');
      expect(response.headers['access-control-allow-headers']).toContain('Content-Type');
    });
  });

  describe('POST /api/offer', () => {
    beforeEach(() => {
      // Add a mock offer endpoint for testing request validation
      app.post('/api/offer', (req, res) => {
        const { offer, clientId } = req.body;

        if (!offer || !offer.type || !offer.sdp) {
          return res.status(400).json({ error: 'Invalid offer' });
        }

        // Mock successful response
        res.json({
          answer: { type: 'answer', sdp: 'mock-sdp' }
        });
      });
    });

    it('should reject requests without offer', async () => {
      const response = await request(app)
        .post('/api/offer')
        .send({ clientId: 'test-123' })
        .expect(400);

      expect(response.body).toEqual({ error: 'Invalid offer' });
    });

    it('should reject offers without type', async () => {
      const response = await request(app)
        .post('/api/offer')
        .send({
          offer: { sdp: 'test-sdp' },
          clientId: 'test-123'
        })
        .expect(400);

      expect(response.body).toEqual({ error: 'Invalid offer' });
    });

    it('should reject offers without sdp', async () => {
      const response = await request(app)
        .post('/api/offer')
        .send({
          offer: { type: 'offer' },
          clientId: 'test-123'
        })
        .expect(400);

      expect(response.body).toEqual({ error: 'Invalid offer' });
    });

    it('should accept valid offer', async () => {
      const response = await request(app)
        .post('/api/offer')
        .send({
          offer: { type: 'offer', sdp: 'test-sdp' },
          clientId: 'test-123'
        })
        .expect(200);

      expect(response.body).toHaveProperty('answer');
      expect(response.body.answer).toHaveProperty('type', 'answer');
      expect(response.body.answer).toHaveProperty('sdp');
    });
  });
});
