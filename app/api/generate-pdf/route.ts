import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/dal";
import { buildReportHtml } from "@/lib/pdf/report-html-template";
import { renderHtmlToPdf } from "@/lib/pdf/render-pdf";
import type { ChildProfileInput } from "@/types/child-profile";
import type { ChildFutureProjection } from "@/lib/pipeline/child-future-projection";

export const maxDuration = 60;

function sanitizeFilenamePart(s: string): string {
  return s
    .trim()
    .replace(/[^a-zA-Z0-9඀-෿\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 60);
}

export async function POST(request: NextRequest) {
  // /api is excluded from the proxy matcher, so this route gates itself —
  // otherwise it's a free public PDF renderer running headless Chromium.
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      profile: ChildProfileInput;
      projection: ChildFutureProjection;
      reportSinhala: string;
    };

    const { profile, projection, reportSinhala } = body;
    if (!profile || !projection || !reportSinhala) {
      return NextResponse.json({ error: "Missing profile, projection, or reportSinhala." }, { status: 400 });
    }

    const html = buildReportHtml(profile, projection, reportSinhala);
    const pdfBuffer = await renderHtmlToPdf(html);

    // Filename is based on the child's name, falling back to the customer's
    // name, falling back to a generic label — per operator request.
    const namePart =
      sanitizeFilenamePart(profile.childName || profile.customerName || "") || "child-future-report";
    const filename = `${namePart}-future-outlook-report.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("PDF generation failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "PDF generation failed." },
      { status: 500 },
    );
  }
}
