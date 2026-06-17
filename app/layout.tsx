import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'VideoGen - AI Video Generation',
  description: 'Cinematic AI video generation studio',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-surface-900 text-gray-100 antialiased">{children}</body>
    </html>
  );
}