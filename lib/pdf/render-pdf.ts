import puppeteer from "puppeteer";

// Server-only. Renders an HTML string to a PDF buffer using headless
// Chromium. Waits for web fonts (Noto Sans Sinhala) to finish loading before
// snapshotting — otherwise Sinhala glyphs can render as tofu/boxes.
export async function renderHtmlToPdf(html: string): Promise<Buffer> {
  const browser = await puppeteer.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    await page.evaluateHandle("document.fonts.ready");
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "16mm", bottom: "16mm", left: "14mm", right: "14mm" },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
