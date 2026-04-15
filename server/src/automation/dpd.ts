import { Page } from 'playwright';
import { AutomationContext, Label, SenderProfile } from './types';

// Automates https://www.mydpd.at/
export async function runDpd(page: Page, ctx: AutomationContext) {
  const { sender, labels, onProgress } = ctx;

  await page.goto('https://www.mydpd.at/', { waitUntil: 'domcontentloaded', timeout: 30000 });

  // Accept cookies if shown
  try {
    const cookieBtn = page.locator('button:has-text("Alle akzeptieren"), button:has-text("Akzeptieren"), #onetrust-accept-btn-handler, .cookie-accept');
    await cookieBtn.first().click({ timeout: 5000 });
  } catch {}

  // Try to navigate to parcel label creation
  try {
    const shipBtn = page.locator('a:has-text("Paket versenden"), a:has-text("Versenden"), a[href*="versenden"], a[href*="paket"]');
    if (await shipBtn.count() > 0) {
      await shipBtn.first().click();
      await page.waitForLoadState('domcontentloaded');
    }
  } catch {}

  for (const label of labels) {
    onProgress(label.id, 'processing', 'Filling myDPD form...');
    try {
      await fillDpdLabel(page, label, sender);
      onProgress(label.id, 'done', 'Added to cart on myDPD.at');
    } catch (err: any) {
      onProgress(label.id, 'error', err.message);
    }
  }
}

async function fillDpdLabel(page: Page, label: Label, sender: SenderProfile) {
  // DPD Austria form fields
  const senderFull = sender.company || sender.name;

  await fillIfExists(page, '#senderName, [name="senderName"], input[placeholder*="Absender"]', senderFull);
  await fillIfExists(page, '#senderStreet, [name="senderStreet"]', sender.street);
  await fillIfExists(page, '#senderHouseNo, [name="senderHouseNo"], input[placeholder*="Nr"]', sender.street_number);
  await fillIfExists(page, '#senderZip, [name="senderZipCode"], input[placeholder*="PLZ"]', sender.postal_code);
  await fillIfExists(page, '#senderCity, [name="senderCity"], input[placeholder*="Ort"]', sender.city);

  await fillIfExists(page, '#recipientName, [name="recipientName"]', label.recipient_company || label.recipient_name);
  await fillIfExists(page, '#recipientContact, [name="recipientContact"]', label.recipient_name);
  await fillIfExists(page, '#recipientStreet, [name="recipientStreet"]', label.recipient_street);
  await fillIfExists(page, '#recipientHouseNo, [name="recipientHouseNo"]', label.recipient_street_number);
  await fillIfExists(page, '#recipientZip, [name="recipientZipCode"]', label.recipient_postal_code);
  await fillIfExists(page, '#recipientCity, [name="recipientCity"]', label.recipient_city);
  await fillIfExists(page, '#recipientPhone, [name="recipientPhone"]', label.recipient_phone || '');

  if (label.weight_kg) {
    await fillIfExists(page, '#weight, [name="weight"], input[placeholder*="Gewicht"]', String(label.weight_kg));
  }

  const nextBtn = page.locator('button:has-text("Weiter"), button[type="submit"], button:has-text("In den Warenkorb")');
  if (await nextBtn.count() > 0) {
    await nextBtn.first().click();
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
