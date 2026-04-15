import { Router } from 'express';
import db from '../db';

const router = Router();

router.get('/', (_req, res) => {
  const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string, value: string }[];
  const settings = rows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {});
  res.json(settings);
});

router.post('/', (req, res) => {
  const updates = req.body;
  for (const [key, value] of Object.entries(updates)) {
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value);
  }
  res.json({ ok: true });
});

export default router;
