import type { Browser } from "puppeteer-core";

// Server-only. Renders an HTML string to a PDF buffer using headless
// Chromium. Waits for web fonts (Noto Sans Sinhala) to finish loading before
// snapshotting — otherwise Sinhala glyphs can render as tofu/boxes.
//
// Two Chromium sources, picked at runtime:
// - On Vercel: puppeteer-core + @sparticuz/chromium, a Linux binary sized
//   for serverless functions (the full "puppeteer" package's ~300MB bundled
//   Chromium download doesn't fit).
// - Locally: the full "puppeteer" package (devDependency only) — it
//   downloads a Chrome build for the local OS, which @sparticuz/chromium
//   can't provide (it ships Linux-only, won't launch on Windows/Mac).
async function launchBrowser(): Promise<Browser> {
  if (process.env.VERCEL) {
    const chromium = (await import("@sparticuz/chromium")).default;
    const puppeteerCore = (await import("puppeteer-core")).default;
    return puppeteerCore.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });
  }
  const puppeteer = (await import("puppeteer")).default;
  return puppeteer.launch({ headless: true }) as unknown as Browser;
}

export async function renderHtmlToPdf(html: string): Promise<Buffer> {
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    await page.evaluateHandle("document.fonts.ready");
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "10mm", bottom: "8mm", left: "10mm", right: "10mm" },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
