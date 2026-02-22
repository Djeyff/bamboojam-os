import './globals.css';

export const metadata = {
  title: '🌴 BamboojamVilla OS',
  description: 'Vacation rental management system for BamboojamVilla, DR',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
