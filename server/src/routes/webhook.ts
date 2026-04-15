import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db';

const router = Router();

// Middleware to validate API key
function validateApiKey(req: any, res: any, next: any) {
  const key = req.headers['x-api-key'] || req.query.api_key;
  if (!key) return res.status(401).json({ error: 'API key required' });
  const apiKey = db.prepare('SELECT * FROM api_keys WHERE key = ?').get(key) as any;
  if (!apiKey) return res.status(403).json({ error: 'Invalid API key' });
  db.prepare('UPDATE api_keys SET last_used_at = datetime("now") WHERE id = ?').run(apiKey.id);
  req.apiKey = apiKey;
  next();
}

// Generic webhook: POST /api/webhook/order
// Accepts order data and creates a label
router.post('/order', validateApiKey, (req: any, res) => {
  const { order } = req.body;
  const apiKey = req.apiKey;

  if (!order) return res.status(400).json({ error: 'order object required' });

  const shipping = order.shipping_address || order.address || order.customer || {};
  const recipient_name = shipping.name || shipping.full_name || `${shipping.first_name || ''} ${shipping.last_name || ''}`.trim();
  const recipient_street = shipping.street || shipping.address1 || shipping.address_line1 || '';
  const recipient_street_number = shipping.street_number || shipping.house_number || '';
  const recipient_postal_code = shipping.zip || shipping.postal_code || shipping.postcode || '';
  const recipient_city = shipping.city || shipping.town || '';
  const recipient_country = shipping.country_code || shipping.country || 'AT';

  if (!recipient_name || !recipient_street || !recipient_postal_code || !recipient_city) {
    return res.status(400).json({ error: 'Incomplete shipping address in order', received: shipping });
  }

  const id = uuidv4();
  db.prepare(`
    INSERT INTO labels (id, sender_profile_id, courier, order_ref, source,
      recipient_company, recipient_name, recipient_phone,
      recipient_street, recipient_street_number, recipient_address_supplement,
      recipient_postal_code, recipient_city, recipient_country, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    apiKey.default_sender_id || null,
    apiKey.default_courier,
    order.id || order.order_id || order.order_number || null,
    'api',
    shipping.company || null,
    recipient_name,
    shipping.phone || null,
    recipient_street,
    recipient_street_number,
    shipping.address2 || shipping.address_line2 || null,
    recipient_postal_code,
    recipient_city,
    recipient_country,
    order.notes || null
  );

  res.status(201).json({ ok: true, label_id: id });
});

// WooCommerce-style webhook: order.updated / order.paid
router.post('/woocommerce', validateApiKey, (req: any, res) => {
  const event = req.headers['x-wc-webhook-topic'] || req.body.webhook_topic;
  const order = req.body;

  if (!['order.paid', 'order.updated', 'order.completed'].includes(event)) {
    return res.json({ ok: true, skipped: true, reason: `Event ${event} not handled` });
  }
  if (order.status !== 'processing' && order.status !== 'completed') {
    return res.json({ ok: true, skipped: true, reason: `Status ${order.status} not actionable` });
  }

  const apiKey = req.apiKey;
  const shipping = order.shipping || order.billing || {};
  const recipient_name = `${shipping.first_name || ''} ${shipping.last_name || ''}`.trim();

  if (!recipient_name || !shipping.address_1 || !shipping.postcode || !shipping.city) {
    return res.status(400).json({ error: 'Incomplete shipping address' });
  }

  const id = uuidv4();
  db.prepare(`
    INSERT INTO labels (id, sender_profile_id, courier, order_ref, source,
      recipient_company, recipient_name, recipient_phone,
      recipient_street, recipient_street_number,
      recipient_postal_code, recipient_city, recipient_country)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, apiKey.default_sender_id || null, apiKey.default_courier,
    String(order.id || order.number || ''), 'woocommerce',
    shipping.company || null, recipient_name, shipping.phone || null,
    shipping.address_1, shipping.address_2 || '',
    shipping.postcode, shipping.city,
    shipping.country || 'AT'
  );

  res.status(201).json({ ok: true, label_id: id });
});

export default router;
