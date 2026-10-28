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
        <p>
          Cây, đá, nước, tường, cửa và đồ vật lấy từ <a href="https://opengameart.org/content/lpc-tile-atlas">LPC Tile Atlas</a> (Liberated Pixel Cup), tác giả: Lanea Zimmerman (Sharm), Stephen Challener
          (Redshrike), Charles Sanchez (CharlesGabriel), Manuel Riecke (MrBeast), Daniel Armstrong (HughSpectrum), Casper Nilsson, Daniel Eddeland, Johann Charlot, Skyler Robert Colladay. Giấy phép CC-BY-SA 3.0 / GPL 3.0, danh sách đầy đủ ở{' '}
          <a href="/tiles/ATTRIBUTION.txt">ATTRIBUTION.txt</a>. Trời, núi, giờ trong ngày, mùa và đồ hiện đại được vẽ thêm trong game.
        </p>
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
