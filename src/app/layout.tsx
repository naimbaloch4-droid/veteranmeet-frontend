import './globals.css'; // <-- THIS LINE IS CRITICAL
import Link from 'next/link';
export const metadata = {
  title: 'VeteranMeet',
  description: 'Veteran platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="m-0 p-0">
        {children}
      </body>
    </html>
  );
}