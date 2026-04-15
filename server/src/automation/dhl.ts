import { Page } from 'playwright';
import { AutomationContext, Label, SenderProfile } from './types';

// Automates https://www.dhl.de/de/privatkunden/pakete-versenden/online-frankieren.html
// Note: DHL Austria uses dhl.de for online labeling
export async function runDhl(page: Page, ctx: AutomationContext) {
  const { sender, labels, onProgress } = ctx;

  await page.goto('https://www.dhl.de/de/privatkunden/pakete-versenden/online-frankieren.html', {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });

  try {
    const cookieBtn = page.locator('#consent-layer-accept-all-button, button:has-text("Alle akzeptieren")');
    await cookieBtn.first().click({ timeout: 5000 });
  } catch {}

  for (const label of labels) {
    onProgress(label.id, 'processing', 'Filling DHL form...');
    try {
      await fillDhlLabel(page, label, sender);
      onProgress(label.id, 'done', 'Added to cart on DHL');
    } catch (err: any) {
      onProgress(label.id, 'error', err.message);
    }
  }
}

async function fillDhlLabel(page: Page, label: Label, sender: SenderProfile) {
  // Navigate to new shipment
  const newBtn = page.locator('button:has-text("Neue Sendung"), a:has-text("Neue Sendung"), button:has-text("Paket versenden")');
  if (await newBtn.count() > 0) {
    await newBtn.first().click();
    await page.waitForLoadState('domcontentloaded');
  }

  // Sender
  await fillIfExists(page, 'input[name*="sender"][name*="name"], input[id*="sender"][id*="name"]', sender.company || sender.name);
  await fillIfExists(page, 'input[name*="sender"][name*="street"], input[id*="sender"][id*="street"]', `${sender.street} ${sender.street_number}`);
  await fillIfExists(page, 'input[name*="sender"][name*="zip"], input[id*="sender"][id*="zip"]', sender.postal_code);
  await fillIfExists(page, 'input[name*="sender"][name*="city"], input[id*="sender"][id*="city"]', sender.city);

  // Recipient
  await fillIfExists(page, 'input[name*="recipient"][name*="name"], input[id*="recipient"][id*="name"]', label.recipient_company || label.recipient_name);
  await fillIfExists(page, 'input[name*="recipient"][name*="street"], input[id*="recipient"][id*="street"]', `${label.recipient_street} ${label.recipient_street_number}`);
  await fillIfExists(page, 'input[name*="recipient"][name*="zip"], input[id*="recipient"][id*="zip"]', label.recipient_postal_code);
  await fillIfExists(page, 'input[name*="recipient"][name*="city"], input[id*="recipient"][id*="city"]', label.recipient_city);

  const submitBtn = page.locator('button:has-text("Weiter"), button:has-text("In den Warenkorb"), button[type="submit"]');
  if (await submitBtn.count() > 0) {
    await submitBtn.first().click();
    await page.waitForTimeout(2000);
  }
}

async function fillIfExists(page: Page, selector: string, value: string) {
  if (!value) return;
  try {
    const el = page.locator(selector).first();
    if (await el.count() > 0) {
      await el.clear();
      await el.fill(value);
    }
  } catch {}
}
