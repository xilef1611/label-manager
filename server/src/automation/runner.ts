import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { v4 as uuidv4 } from 'uuid';
import db from '../db';
import { runPostAt } from './post-at';
import { runDpd } from './dpd';
import { runDhl } from './dhl';
import { runUps } from './ups';
import { AutomationContext, Label, SenderProfile } from './types';

let activeBrowser: Browser | null = null;
let activeSession: string | null = null;

export function getActiveSession() {
  return activeSession;
}

export async function startAutomation(labelIds: string[], senderId: number): Promise<string> {
  if (activeBrowser) {
    throw new Error('An automation session is already running. Wait for it to complete.');
  }

  const sender = db.prepare('SELECT * FROM sender_profiles WHERE id = ?').get(senderId) as SenderProfile | undefined;
  if (!sender) throw new Error('Sender profile not found');

  const labels = labelIds.map(id => db.prepare('SELECT * FROM labels WHERE id = ?').get(id)).filter(Boolean) as Label[];
  if (!labels.length) throw new Error('No valid labels found');

  // Group labels by courier
  const byCourier: Record<string, Label[]> = {};
  for (const label of labels) {
    if (!byCourier[label.courier]) byCourier[label.courier] = [];
    byCourier[label.courier].push(label);
  }

  const sessionId = uuidv4();
  activeSession = sessionId;

  db.prepare(`
    INSERT INTO automation_sessions (id, courier, status, label_ids)
    VALUES (?, ?, 'running', ?)
  `).run(sessionId, Object.keys(byCourier).join(','), JSON.stringify(labelIds));

  // Run async (don't await)
  runAll(sessionId, byCourier, sender).catch(err => {
    db.prepare(`UPDATE automation_sessions SET status='error', error=?, finished_at=datetime('now') WHERE id=?`).run(err.message, sessionId);
    activeSession = null;
  });

  return sessionId;
}

async function runAll(sessionId: string, byCourier: Record<string, Label[]>, sender: SenderProfile) {
  activeBrowser = await chromium.launch({ headless: false, slowMo: 100 });

  try {
    for (const [courier, labels] of Object.entries(byCourier)) {
      const context = await activeBrowser.newContext({ viewport: { width: 1280, height: 900 } });
      const page = await context.newPage();

      const onProgress = (labelId: string, status: 'processing' | 'done' | 'error', message?: string) => {
        const dbStatus = status === 'done' ? 'done' : status === 'error' ? 'error' : 'processing';
        db.prepare(`UPDATE labels SET status=?, error_message=?, processed_at=CASE WHEN ? IN ('done','error') THEN datetime('now') ELSE processed_at END WHERE id=?`)
          .run(dbStatus, message || null, dbStatus, labelId);
        console.log(`[${courier}] ${labelId}: ${status} - ${message || ''}`);
      };

      const settingsRows = db.prepare('SELECT key, value FROM settings').all() as { key: string, value: string }[];
      const settings = settingsRows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {});
      const ctx: AutomationContext = { sender, labels, onProgress, settings };

      try {
        switch (courier) {
          case 'post-at': await runPostAt(page, ctx); break;
          case 'dpd':     await runDpd(page, ctx);    break;
          case 'dhl':     await runDhl(page, ctx);    break;
          case 'ups':     await runUps(page, ctx);    break;
          default: console.warn(`Unknown courier: ${courier}`);
        }
      } catch (err: any) {
        console.error(`Courier ${courier} failed:`, err.message);
      }

      // Don't close context — user needs to review cart in browser
    }

    db.prepare(`UPDATE automation_sessions SET status='done', finished_at=datetime('now') WHERE id=?`).run(sessionId);
  } catch (err: any) {
    db.prepare(`UPDATE automation_sessions SET status='error', error=?, finished_at=datetime('now') WHERE id=?`).run(err.message, sessionId);
  } finally {
    activeBrowser = null;
    activeSession = null;
  }
}

export async function stopAutomation() {
  if (activeBrowser) {
    await activeBrowser.close();
    activeBrowser = null;
  }
  activeSession = null;
}

export function getSessionStatus(sessionId: string) {
  return db.prepare('SELECT * FROM automation_sessions WHERE id = ?').get(sessionId);
}
