import Link from 'next/link';
import credits from '@/lib/lpc-credits.json';

export const metadata = { title: 'Ghi nguồn hình ảnh' };

export default function TacGia() {
  return (
    <main className="app">
      <div className="head">
        <Link href="/" className="back" aria-label="Quay lại">
          ‹
        </Link>
        <h1 style={{ flex: 1 }}>Ghi nguồn hình ảnh</h1>
      </div>
      <div className="body prose">
        <p>
          Nhân vật được ghép từ bộ hình Liberated Pixel Cup (LPC), lấy qua{' '}
          <a href="https://github.com/liberatedpixelcup/Universal-LPC-Spritesheet-Character-Generator">Universal LPC Spritesheet Character Generator</a>.
        </p>
        <p>Giấy phép: {credits.licenses.join(', ')}.</p>
        <p>Tác giả: {credits.authors.join(', ')}.</p>
        <details>
          <summary>Nguồn gốc từng bộ hình</summary>
          <ul style={{ fontSize: 16, wordBreak: 'break-all' }}>
            {credits.urls.map((u) => (
              <li key={u}>
                <a href={u}>{u}</a>
              </li>
            ))}
          </ul>
        </details>
      </div>
    </main>
  );
}
