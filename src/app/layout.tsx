import './globals.css';
import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';

export const metadata: Metadata = {
  title: 'ATORA — Northern Malaysia Aircond Specialist | Wholesale & Parts Supplier',
  description:
    'ATORA AIR COND & ELECTRICAL SDN. BHD. (东京冷气电器有限公司) is a Kedah-based Northern Malaysia aircond specialist and Midea Pro Shop. We supply air conditioners, wholesale solutions and spare parts — Midea, Daikin, Panasonic, AUX, Acson, Haier, Hisense, TCL and more — serving Padang Serai, Kulim, Sungai Petani, Alor Setar and customers across Malaysia.',
  authors: [{ name: 'ATORA AIR COND & ELECTRICAL SDN. BHD.' }],
  creator: 'ATORA',
  publisher: 'ATORA AIR COND & ELECTRICAL SDN. BHD.',
  robots: 'index, follow',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
