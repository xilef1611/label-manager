import express from 'express';
import cors from 'cors';
import senderRoutes from './routes/sender';
import labelRoutes from './routes/labels';
import apikeyRoutes from './routes/apikeys';
import webhookRoutes from './routes/webhook';
import automationRoutes from './routes/automation';
import settingsRoutes from './routes/settings';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.use('/api/senders', senderRoutes);
app.use('/api/labels', labelRoutes);
app.use('/api/apikeys', apikeyRoutes);
app.use('/api/webhook', webhookRoutes);
app.use('/api/automation', automationRoutes);
app.use('/api/settings', settingsRoutes);

app.get('/api/health', (_req, res) => res.json({ ok: true, version: '1.0.0' }));

app.listen(PORT, () => {
  console.log(`Label Manager server running on http://localhost:${PORT}`);
  console.log(`Webhook endpoint: http://localhost:${PORT}/api/webhook/order`);
});
