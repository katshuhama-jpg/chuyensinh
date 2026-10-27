import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Chuyển Sinh, Tôi Trở Thành...', template: '%s · Chuyển Sinh, Tôi Trở Thành...' },
  description: 'Game pixel sống lại một đời khác: sinh ra ở đâu, năm nào, trong nhà ai - bạn không chọn được. Sống thế nào thì có.',
  applicationName: 'Chuyển Sinh, Tôi Trở Thành...',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#141a30',
};

// đặt giao diện sáng/tối trước khi vẽ để khỏi nháy màn
const THEME_JS = `try{var t=localStorage.getItem('cs.theme');if(t==='light')document.documentElement.dataset.theme='light'}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_JS }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=VT323&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
