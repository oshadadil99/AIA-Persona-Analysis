// Route segment config only — page.tsx here is a client component, so
// maxDuration can't be exported from it directly. The submit action's Gemini
// call alone has taken ~17s locally, well past Vercel's default serverless
// function duration, so this must be raised explicitly.
export const maxDuration = 60;

export default function ChildReportLayout({ children }: { children: React.ReactNode }) {
  return children;
}
