import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db';

const router = Router();

router.get('/', (req, res) => {
  const { status, courier } = req.query;
  let query = 'SELECT l.*, sp.name as sender_name FROM labels l LEFT JOIN sender_profiles sp ON l.sender_profile_id = sp.id WHERE 1=1';
  const params: unknown[] = [];
  if (status) { query += ' AND l.status = ?'; params.push(status); }
  if (courier) { query += ' AND l.courier = ?'; params.push(courier); }
  query += ' ORDER BY l.created_at DESC';
  const labels = db.prepare(query).all(...params);
  res.json(labels);
});

router.get('/:id', (req, res) => {
  const label = db.prepare('SELECT * FROM labels WHERE id = ?').get(req.params.id);
  if (!label) return res.status(404).json({ error: 'Not found' });
  res.json(label);
});

router.post('/', (req, res) => {
  const {
    sender_profile_id, courier, order_ref, source,
    recipient_company, recipient_name, recipient_phone,
    recipient_street, recipient_street_number, recipient_address_supplement,
    recipient_postal_code, recipient_city, recipient_country,
    weight_kg, notes
  } = req.body;

  if (!recipient_name || !recipient_street || !recipient_street_number || !recipient_postal_code || !recipient_city || !courier) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const id = uuidv4();
  db.prepare(`
    INSERT INTO labels (id, sender_profile_id, courier, order_ref, source,
      recipient_company, recipient_name, recipient_phone,
      recipient_street, recipient_street_number, recipient_address_supplement,
      recipient_postal_code, recipient_city, recipient_country,
      weight_kg, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, sender_profile_id || null, courier, order_ref || null, source || 'manual',
    recipient_company || null, recipient_name, recipient_phone || null,
    recipient_street, recipient_street_number, recipient_address_supplement || null,
    recipient_postal_code, recipient_city, recipient_country || 'AT',
    weight_kg || null, notes || null);

  const label = db.prepare('SELECT * FROM labels WHERE id = ?').get(id);
  res.status(201).json(label);
});

router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM labels WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined;
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const fields = { ...existing, ...req.body };
  db.prepare(`
    UPDATE labels SET sender_profile_id=?, courier=?, order_ref=?, status=?,
      recipient_company=?, recipient_name=?, recipient_phone=?,
      recipient_street=?, recipient_street_number=?, recipient_address_supplement=?,
      recipient_postal_code=?, recipient_city=?, recipient_country=?,
      weight_kg=?, notes=?
    WHERE id=?
  `).run(fields.sender_profile_id, fields.courier, fields.order_ref, fields.status,
    fields.recipient_company, fields.recipient_name, fields.recipient_phone,
    fields.recipient_street, fields.recipient_street_number, fields.recipient_address_supplement,
    fields.recipient_postal_code, fields.recipient_city, fields.recipient_country,
    fields.weight_kg, fields.notes, req.params.id);
  res.json(db.prepare('SELECT * FROM labels WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM labels WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

router.delete('/', (req, res) => {
  const { ids } = req.body as { ids: string[] };
  if (!ids?.length) return res.status(400).json({ error: 'Provide ids array' });
  const placeholders = ids.map(() => '?').join(',');
  db.prepare(`DELETE FROM labels WHERE id IN (${placeholders})`).run(...ids);
  res.json({ ok: true });
});

export default router;
