import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Mission Control - Marketing Agent Orchestrator',
  description: 'Real-time collaboration dashboard for marketing agents',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
