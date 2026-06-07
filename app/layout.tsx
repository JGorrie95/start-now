import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Start Now", description: "From stuck to started." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
