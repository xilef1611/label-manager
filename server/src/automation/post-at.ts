import { Page } from 'playwright';
import { AutomationContext, Label, SenderProfile } from './types';

// Automates https://www.post.at/ - Paketmarke online kaufen
export async function runPostAt(page: Page, ctx: AutomationContext) {
  const { sender, labels, onProgress } = ctx;

  await page.goto('https://services.post.at/paketmarke', { waitUntil: 'domcontentloaded', timeout: 30000 });

  // Accept cookies if shown
  try {
    const cookieBtn = page.locator('button:has-text("Alle akzeptieren"), button:has-text("Akzeptieren"), #onetrust-accept-btn-handler');
    await cookieBtn.first().click({ timeout: 5000 });
  } catch { }

  if (ctx.settings?.postat_username && ctx.settings?.postat_password) {
    onProgress('login', 'processing', 'Logging into Post.at...');
    try {
      const loginBtn = page.locator('a[href*="login"], button:has-text("Anmelden"), button:has-text("Login")').first();
      if (await loginBtn.count() > 0) {
        await loginBtn.click();
        await page.waitForLoadState('domcontentloaded');
        await page.locator('input[type="email"], input[name*="username"]').fill(ctx.settings.postat_username);
        await page.locator('input[type="password"], input[name*="password"]').fill(ctx.settings.postat_password);
        await page.keyboard.press('Enter');
        await page.waitForNavigation({ timeout: 15000 }).catch(() => {});
      }
    } catch (e: any) {
      console.error('Post.at login failed:', e.message);
    }
  }

  for (const label of labels) {
    onProgress(label.id, 'processing', 'Filling Post.at form...');
    try {
      await fillPostAtLabel(page, label, sender);
      onProgress(label.id, 'done', 'Added to cart on Post.at');
    } catch (err: any) {
      onProgress(label.id, 'error', err.message);
    }
  }
}

async function fillPostAtLabel(page: Page, label: Label, sender: SenderProfile) {
  // Navigate to new parcel form (adjust selector based on actual site structure)
  const newParcelBtn = page.locator('a:has-text("Neue Paketmarke"), button:has-text("Neue Paketmarke"), a:has-text("Paket aufgeben")');
  if (await newParcelBtn.count() > 0) {
    await newParcelBtn.first().click();
    await page.waitForLoadState('domcontentloaded');
  }

  // Sender section — fill in company/name
  await fillIfExists(page, '[name="senderName"], #sender-name, [placeholder*="Absender"], [placeholder*="Name"]', sender.company || sender.name);
  await fillIfExists(page, '[name="senderStreet"], #sender-street, [placeholder*="Straße"]', `${sender.street} ${sender.street_number}`);
  await fillIfExists(page, '[name="senderZip"], #sender-zip, [placeholder*="PLZ"]', sender.postal_code);
  await fillIfExists(page, '[name="senderCity"], #sender-city, [placeholder*="Ort"]', sender.city);
  await fillIfExists(page, '[name="senderPhone"], #sender-phone, [placeholder*="Telefon"]', sender.phone || '');

  // Recipient section
  await fillIfExists(page, '[name="recipientName"], #recipient-name, [placeholder*="Empfänger"]', label.recipient_company || label.recipient_name);
  await fillIfExists(page, '[name="recipientStreet"], #recipient-street', `${label.recipient_street} ${label.recipient_street_number}`);
  await fillIfExists(page, '[name="recipientZip"], #recipient-zip', label.recipient_postal_code);
  await fillIfExists(page, '[name="recipientCity"], #recipient-city', label.recipient_city);
  await fillIfExists(page, '[name="recipientPhone"], #recipient-phone', label.recipient_phone || '');

  // Submit / add to cart
  const submitBtn = page.locator('button[type="submit"]:has-text("Weiter"), button:has-text("In den Warenkorb"), button:has-text("Hinzufügen")');
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
  } catch { }
}
