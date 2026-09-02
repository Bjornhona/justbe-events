import type { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Just Be Events — Studio',
  robots: { index: false, follow: false },
};

// The Studio ships its own styles and expects to own the whole viewport, so
// this shell stays bare — no globals.css, no Tailwind classes.
export default function StudioLayout({ children }: LayoutProps<"/studio">) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
