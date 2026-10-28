'use client';

/** Trang mẫu giao diện tương tác (gọi điện, chat quán net, quẹt Vàng, mở khóa, cổ vũ, chim vỗ cánh) - không nối vào game */

import { useMemo, useState } from 'react';
import CallScreen from '@/components/CallScreen';
import Phone from '@/components/Phone';
import SwipeDeck from '@/components/SwipeDeck';
import TapGame from '@/components/TapGame';
import Sprite from '@/components/Sprite';
import { CheerMeter, SlideUnlock } from '@/components/MiniActs';
import { CAST } from '@/lib/cast';
import { lpcLayers } from '@/lib/look';
import type { SwipeCard } from '@/lib/story';

export default function MauUi() {
  const [log, setLog] = useState('');
  const av = useMemo(() => lpcLayers(CAST.long.m, 'm', 'adult'), []);
  const avatar = <Sprite layers={av} scale={1} anim="idle" dir={2} label="" />;
  const cards: SwipeCard[] = [
    { name: 'Long', age: 24, gender: 'm', look: CAST.long.m, where: 'Cách 2 km', bio: 'Sửa xe, đá bóng, nghe nhạc rock.', tags: ['bóng đá', 'phượt'], loveId: 'long', match: 'Long gửi lời chào đầu tiên.' },
    { name: 'Tuấn', age: 31, gender: 'm', look: CAST.bao.m, where: 'Cách 5 km', bio: 'Doanh nhân trẻ, thu nhập thụ động.', result: 'Hóa ra là tài khoản bán khóa học làm giàu.' },
  ];
  const ok = (k: string) => (i: number) => setLog(`${k}: chọn ${i}`);
  return (
    <main className="app dither">
      <div className="head">
        <div>
          <div className="eyebrow">MẪU GIAO DIỆN</div>
          <h1>Gọi, chat, quẹt, chơi</h1>
        </div>
      </div>
      <div className="body" style={{ gap: 28 }}>
        <p className="mute">{log || 'Bấm thử từng màn.'}</p>
        <section id="ban">
          <div className="label">1995 · gọi điện thoại bàn</div>
          <CallScreen skin="ban" dir="out" name="Vy" lines={['(Giọng đàn ông trầm trầm) "Alô, ai đấy?"']} opts={['"Dạ cháu là bạn cùng lớp ạ"', 'Đưa máy cho bạn nói hộ', 'Cúp máy']} onChoose={ok('ban')} />
        </section>
        <section id="nokia">
          <div className="label">2008 · cục gạch gọi đến</div>
          <CallScreen skin="nokia" dir="in" name="Long" sub="Tài khoản chính: 300đ" opts={['Nghe', 'Nháy lại', 'Từ chối']} onChoose={ok('nokia')} />
        </section>
        <section id="video">
          <div className="label">2020 · mẹ gọi video từ Nhật</div>
          <CallScreen skin="smart" dir="in" video name="Mẹ" sub="Gọi từ Nhật Bản" avatar={avatar} opts={['Nghe máy', 'Đưa máy cho ông bà', 'Không nghe']} onChoose={ok('video')} />
        </section>
        <section id="pc">
          <div className="label">2007 · Chat Vàng ở quán net</div>
          <Phone skin="pc" me="Linh" name="Long" year={2007} msgs={[{ me: false, t: '*Có ai hiểu tớ không...*' }, { me: false, t: 'Ơ, cậu cũng online à?' }, { me: false, t: 'BUZZ!!!' }]} opts={['"Tớ hiểu mà"', '"BUZZ lại!"', '(Chuyển sang ẩn)']} onChoose={ok('pc')} />
        </section>
        <section id="quet">
          <div className="label">2019 · Quẹt, có gói Vàng</div>
          <SwipeDeck cards={cards} year={2019} gold={{ can: true, price: 8 }} onDone={(id, g) => setLog(`quẹt: ${id ?? 'không ai'}${g ? ' (Vàng)' : ''}`)} />
        </section>
        <section id="unlock">
          <div className="label">2008 · trượt để mở khóa</div>
          <SlideUnlock>
            <p className="mute">Đã mở khóa!</p>
          </SlideUnlock>
        </section>
        <section id="cheer">
          <div className="label">2023 · cổ vũ chung kết</div>
          <CheerMeter goal={24} alt={['Cá cược với cả hội', 'Về ngủ sớm']} onChoose={ok('cheer')} />
        </section>
        <section id="tap">
          <div className="label">2014 · chim vỗ cánh</div>
          <TapGame goal={5} onEnd={(n) => setLog(`chim: ${n} ống`)} />
        </section>
      </div>
    </main>
  );
}
