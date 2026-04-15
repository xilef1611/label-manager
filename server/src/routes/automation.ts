import { Router } from 'express';
import { startAutomation, stopAutomation, getActiveSession, getSessionStatus } from '../automation/runner';
import db from '../db';

const router = Router();

router.post('/start', async (req, res) => {
  const { label_ids, sender_id } = req.body;
  if (!label_ids?.length) return res.status(400).json({ error: 'label_ids required' });
  if (!sender_id) return res.status(400).json({ error: 'sender_id required' });

  try {
    const sessionId = await startAutomation(label_ids, sender_id);
    res.json({ ok: true, session_id: sessionId });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/stop', async (_req, res) => {
  await stopAutomation();
  res.json({ ok: true });
});

router.get('/status', (_req, res) => {
  const sessionId = getActiveSession();
  if (!sessionId) return res.json({ active: false });
  const session = getSessionStatus(sessionId);
  res.json({ active: true, session });
});

router.get('/sessions', (_req, res) => {
  const sessions = db.prepare('SELECT * FROM automation_sessions ORDER BY started_at DESC LIMIT 50').all();
  res.json(sessions);
});

export default router;
