import { Router } from 'express';
import crypto from 'crypto';
import db from '../db';

const router = Router();

router.get('/', (_req, res) => {
  const keys = db.prepare('SELECT id, key, label, shop_type, default_courier, default_sender_id, created_at, last_used_at FROM api_keys ORDER BY id DESC').all();
  res.json(keys);
});

router.post('/', (req, res) => {
  const { label, shop_type, default_courier, default_sender_id } = req.body;
  if (!label) return res.status(400).json({ error: 'Label is required' });
  const key = 'lm_' + crypto.randomBytes(24).toString('hex');
  const result = db.prepare(`
    INSERT INTO api_keys (key, label, shop_type, default_courier, default_sender_id)
    VALUES (?, ?, ?, ?, ?)
  `).run(key, label, shop_type || 'generic', default_courier || 'post-at', default_sender_id || null);
  res.status(201).json(db.prepare('SELECT * FROM api_keys WHERE id = ?').get(result.lastInsertRowid));
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM api_keys WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

export default router;
