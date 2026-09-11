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

// Repeats on every page via Puppeteer's header/footer template mechanism —
// content in the page body itself only flows once across page breaks, it
// doesn't re-render per page, so a per-page contact bar has to go through
// this API instead. Chromium renders header/footer templates in a very
// limited CSS environment (no external stylesheets, no @font-face), so this
// stays plain inline-styled HTML in a Latin font.
const CONTACT_FOOTER_TEMPLATE = `
  <div style="width:100%; font-family:Arial,Helvetica,sans-serif; padding:0 10mm 4px;
    box-sizing:border-box; display:flex; justify-content:flex-end;
    -webkit-print-color-adjust:exact;">
    <div style="text-align:right; line-height:1.4;">
      <div style="font-size:6.5px; color:#6b7280; letter-spacing:0.3px;">For further details, contact</div>
      <div style="font-size:8px; color:#111827;">
        <span style="font-weight:700; color:#047857;">Oshada Dilshan</span>
        <span style="color:#9ca3af;">&nbsp;|&nbsp;</span>0703633032<span style="color:#9ca3af;">&nbsp;|&nbsp;</span>oshadasayakkara@gmail.com
      </div>
    </div>
  </div>
`;

export async function renderHtmlToPdf(html: string): Promise<Buffer> {
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    await page.evaluateHandle("document.fonts.ready");
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      // Bottom margin enlarged to fit the contact footer without it
      // overlapping the report content; top margin back to normal now that
      // nothing is rendered up there.
      margin: { top: "10mm", bottom: "15mm", left: "10mm", right: "10mm" },
      displayHeaderFooter: true,
      headerTemplate: "<span></span>",
      footerTemplate: CONTACT_FOOTER_TEMPLATE,
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
