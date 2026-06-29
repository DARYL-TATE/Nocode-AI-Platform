import type { Metadata } from 'next';
import './globals.css';  // This line MUST exist



export const metadata: Metadata = {
  title: 'SmartML - No-Code AI Platform',
  description: 'Simplify data analysis and machine learning without coding',
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