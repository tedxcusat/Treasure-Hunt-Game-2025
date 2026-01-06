import type { Metadata } from 'next';
import { Space_Grotesk } from 'next/font/google';
import './globals.css';

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'GeoQuest: Mission Access',
  description: 'Augmented Reality Treasure Hunt',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#000000',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${spaceGrotesk.variable} antialiased bg-zinc-900 text-foreground min-h-screen flex items-center justify-center`}
      >
        {/* Desktop Background Elements */}
        <div className="fixed inset-0 z-0 opacity-50 pointer-events-none hidden md:block">
          <div className="absolute inset-0 bg-[radial-gradient(#e60000_1px,transparent_1px)] [background-size:40px_40px] opacity-10"></div>
        </div>

        {/* Mobile Frame Container */}
        <main className="relative z-10 w-full md:max-w-[400px] md:h-[850px] md:rounded-[3rem] md:border-[8px] md:border-zinc-800 md:shadow-2xl overflow-hidden bg-background h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
