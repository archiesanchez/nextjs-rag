import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MORB Bot',
  description: 'Ask questions about the Manual of Regulations of the Philippine Central Bank.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
