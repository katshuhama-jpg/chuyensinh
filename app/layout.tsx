import type { Metadata, Viewport } from 'next';
import './globals.css';
import Music from '@/components/Music';

export const metadata: Metadata = {
  title: { default: 'Đường Tình Rẽ Lối', template: '%s · Đường Tình Rẽ Lối' },
  description: "Love's Altered Lines - không day dứt, chỉ tò mò: Nếu rẽ lối khác, đời mình sẽ ra sao?",
  applicationName: 'Đường Tình Rẽ Lối',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#211833',
};

// đặt giao diện sáng/tối trước khi vẽ để khỏi nháy màn
const THEME_JS = `try{var t=localStorage.getItem('dt.theme');if(t==='light')document.documentElement.dataset.theme='light'}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_JS }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Patrick+Hand&family=VT323&display=swap" rel="stylesheet" />
      </head>
      <body>
        {children}
        <Music />
      </body>
    </html>
  );
}
