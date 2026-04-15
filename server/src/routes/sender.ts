import { Router } from 'express';
import db from '../db';

const router = Router();

router.get('/', (_req, res) => {
  const profiles = db.prepare('SELECT * FROM sender_profiles ORDER BY is_default DESC, id ASC').all();
  res.json(profiles);
});

router.get('/default', (_req, res) => {
  const profile = db.prepare('SELECT * FROM sender_profiles WHERE is_default = 1 LIMIT 1').get();
  if (!profile) return res.status(404).json({ error: 'No default sender profile set' });
  res.json(profile);
});

router.post('/', (req, res) => {
  const { name, company, street, street_number, address_supplement, postal_code, city, country, phone, email, is_default } = req.body;
  if (!name || !street || !street_number || !postal_code || !city) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (is_default) {
    db.prepare('UPDATE sender_profiles SET is_default = 0').run();
  }
  const result = db.prepare(`
    INSERT INTO sender_profiles (name, company, street, street_number, address_supplement, postal_code, city, country, phone, email, is_default)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(name, company || null, street, street_number, address_supplement || null, postal_code, city, country || 'AT', phone || null, email || null, is_default ? 1 : 0);
  const profile = db.prepare('SELECT * FROM sender_profiles WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(profile);
});

router.put('/:id', (req, res) => {
  const { name, company, street, street_number, address_supplement, postal_code, city, country, phone, email, is_default } = req.body;
  if (is_default) {
    db.prepare('UPDATE sender_profiles SET is_default = 0').run();
  }
  db.prepare(`
    UPDATE sender_profiles SET name=?, company=?, street=?, street_number=?, address_supplement=?, postal_code=?, city=?, country=?, phone=?, email=?, is_default=?
    WHERE id=?
  `).run(name, company || null, street, street_number, address_supplement || null, postal_code, city, country || 'AT', phone || null, email || null, is_default ? 1 : 0, req.params.id);
  const profile = db.prepare('SELECT * FROM sender_profiles WHERE id = ?').get(req.params.id);
  res.json(profile);
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM sender_profiles WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

export default router;
