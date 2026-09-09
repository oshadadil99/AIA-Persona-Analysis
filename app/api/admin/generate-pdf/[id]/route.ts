import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/session";
import { createServiceClient } from "@/lib/db/supabase";
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

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!verifySessionToken(token)) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { id } = await params;

  const supabase = createServiceClient();
  const { data: row, error } = await supabase
    .from("child_profiles")
    .select("raw_input, projection_output, report_sinhala, customer_name, child_name")
    .eq("id", id)
    .single();

  if (error || !row) {
    return NextResponse.json({ error: error?.message ?? "Record not found." }, { status: 404 });
  }
  if (!row.report_sinhala || !row.projection_output) {
    return NextResponse.json({ error: "This record has no generated report to export." }, { status: 400 });
  }

  const profile = row.raw_input as ChildProfileInput;
  const projection = row.projection_output as ChildFutureProjection;
  const reportSinhala = row.report_sinhala as string;

  try {
    const html = buildReportHtml(profile, projection, reportSinhala);
    const pdfBuffer = await renderHtmlToPdf(html);

    const namePart = sanitizeFilenamePart(row.child_name || row.customer_name || "") || "child-future-report";
    const filename = `${namePart}-future-outlook-report.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("Admin PDF generation failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "PDF generation failed." },
      { status: 500 },
    );
  }
}
