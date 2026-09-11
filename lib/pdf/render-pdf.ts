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
const CONTACT_HEADER_TEMPLATE = `
  <div style="width:100%; font-family:Arial,Helvetica,sans-serif; padding:5px 10mm 2px;
    box-sizing:border-box; -webkit-print-color-adjust:exact;">
    <div style="display:flex; align-items:center; justify-content:center; gap:9px;
      width:fit-content; margin:0 auto; background-color:#ecfdf5; border:1px solid #a7f3d0;
      border-radius:999px; padding:4px 16px;">
      <span style="font-size:9px; font-weight:700; color:#047857;">Oshada Dilshan</span>
      <span style="font-size:7px; color:#6ee7b7;">&#9679;</span>
      <span style="font-size:8.5px; color:#065f46;">0703633032</span>
      <span style="font-size:7px; color:#6ee7b7;">&#9679;</span>
      <span style="font-size:8.5px; color:#065f46;">oshadasayakkara@gmail.com</span>
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
      // Top margin enlarged to fit the contact header bar without it
      // overlapping the report content.
      margin: { top: "16mm", bottom: "8mm", left: "10mm", right: "10mm" },
      displayHeaderFooter: true,
      headerTemplate: CONTACT_HEADER_TEMPLATE,
      footerTemplate: "<span></span>",
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
