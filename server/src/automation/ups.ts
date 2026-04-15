import { Page } from 'playwright';
import { AutomationContext, Label, SenderProfile } from './types';

// Automates https://www.ups.com/at/de/shipping/create
export async function runUps(page: Page, ctx: AutomationContext) {
  const { sender, labels, onProgress } = ctx;

  await page.goto('https://www.ups.com/at/de/shipping/create', {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });

  try {
    const cookieBtn = page.locator('#ups-cookie-accept, button:has-text("Akzeptieren"), button:has-text("Accept All")');
    await cookieBtn.first().click({ timeout: 5000 });
  } catch {}

  for (const label of labels) {
    onProgress(label.id, 'processing', 'Filling UPS form...');
    try {
      await fillUpsLabel(page, label, sender);
      onProgress(label.id, 'done', 'Added to cart on UPS');
    } catch (err: any) {
      onProgress(label.id, 'error', err.message);
    }
  }
}

async function fillUpsLabel(page: Page, label: Label, sender: SenderProfile) {
  // Sender (From) section
  await fillIfExists(page, 'input[name="from.name"], #from-name', sender.company || sender.name);
  await fillIfExists(page, 'input[name="from.addressLine1"], #from-address1', `${sender.street} ${sender.street_number}`);
  await fillIfExists(page, 'input[name="from.postalCode"], #from-postal', sender.postal_code);
  await fillIfExists(page, 'input[name="from.city"], #from-city', sender.city);
  await fillIfExists(page, 'input[name="from.phone"], #from-phone', sender.phone || '');

  // Recipient (To) section
  await fillIfExists(page, 'input[name="to.name"], #to-name', label.recipient_company || label.recipient_name);
  await fillIfExists(page, 'input[name="to.addressLine1"], #to-address1', `${label.recipient_street} ${label.recipient_street_number}`);
  await fillIfExists(page, 'input[name="to.postalCode"], #to-postal', label.recipient_postal_code);
  await fillIfExists(page, 'input[name="to.city"], #to-city', label.recipient_city);
  await fillIfExists(page, 'input[name="to.phone"], #to-phone', label.recipient_phone || '');

  if (label.weight_kg) {
    await fillIfExists(page, 'input[name="weight"], #package-weight', String(label.weight_kg));
  }

  const nextBtn = page.locator('button:has-text("Weiter"), button:has-text("Continue"), button[type="submit"]');
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
