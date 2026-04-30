import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";
import "./globals.css";
import { KxThemeProvider } from "@/components/showcase/theme-provider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Kalaanba — your game, on the record.",
  description:
    "Kalaanba runs grassroots football in Ghana — leagues, tournaments, and a verified record of every player's career.",
};

// Inline before-paint script: applies the persisted theme class to <html>
// before first paint so light-mode users never see a dark flash.
const themeBootstrap = `
(function () {
  try {
    var stored = localStorage.getItem('kalaanba-theme');
    if (stored === 'light') document.documentElement.classList.add('light');
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${sora.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body className="min-h-dvh bg-bg text-fg">
        <KxThemeProvider>{children}</KxThemeProvider>
      </body>
    </html>
  );
}
