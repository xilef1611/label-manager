// Uses Node.js built-in sqlite (available since Node 22.5 - experimental, stable in v25)
import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';

const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new DatabaseSync(path.join(DATA_DIR, 'labels.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS sender_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    company TEXT,
    street TEXT NOT NULL,
    street_number TEXT NOT NULL,
    address_supplement TEXT,
    postal_code TEXT NOT NULL,
    city TEXT NOT NULL,
    country TEXT NOT NULL DEFAULT 'AT',
    phone TEXT,
    email TEXT,
    is_default INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS labels (
    id TEXT PRIMARY KEY,
    sender_profile_id INTEGER,
    courier TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    order_ref TEXT,
    source TEXT NOT NULL DEFAULT 'manual',
    recipient_company TEXT,
    recipient_name TEXT NOT NULL,
    recipient_phone TEXT,
    recipient_street TEXT NOT NULL,
    recipient_street_number TEXT NOT NULL,
    recipient_address_supplement TEXT,
    recipient_postal_code TEXT NOT NULL,
    recipient_city TEXT NOT NULL,
    recipient_country TEXT NOT NULL DEFAULT 'AT',
    weight_kg REAL,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    processed_at TEXT,
    error_message TEXT,
    FOREIGN KEY (sender_profile_id) REFERENCES sender_profiles(id)
  );

  CREATE TABLE IF NOT EXISTS api_keys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT NOT NULL UNIQUE,
    label TEXT NOT NULL,
    shop_type TEXT NOT NULL DEFAULT 'generic',
    default_courier TEXT NOT NULL DEFAULT 'post-at',
    default_sender_id INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_used_at TEXT
  );

  CREATE TABLE IF NOT EXISTS automation_sessions (
    id TEXT PRIMARY KEY,
    courier TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'running',
    label_ids TEXT NOT NULL,
    started_at TEXT NOT NULL DEFAULT (datetime('now')),
    finished_at TEXT,
    error TEXT
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

// Thin wrapper matching the better-sqlite3 API shape used in routes
export default {
  prepare(sql: string) {
    const stmt = db.prepare(sql);
    return {
      run: (...params: unknown[]) => stmt.run(...params),
      get: (...params: unknown[]) => stmt.get(...params),
      all: (...params: unknown[]) => stmt.all(...params),
    };
  },
  exec(sql: string) { db.exec(sql); },
};
