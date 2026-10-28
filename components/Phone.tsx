'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

export type PhoneSkin = 'letter' | 'nokia' | 'smart' | 'ai';

export const skinOf = (year: number): PhoneSkin => (year < 2004 ? 'letter' : year < 2012 ? 'nokia' : year <= 2026 ? 'smart' : 'ai');

/**
 * Khung tin nhắn theo thời kỳ: thư tay, điện thoại "cục gạch", smartphone, trợ lý AI.
 * Lựa chọn trả lời nằm ngay trong máy; cảnh có đồng hồ thì hết giờ tính là "Đã xem".
 */
export default function Phone({
  skin,
  me,
  name,
  avatar,
  year,
  msgs,
  opts,
  sent,
  timer,
  timeout,
  onChoose,
}: {
  skin: PhoneSkin;
  /** tên nhân vật chính */
  me: string;
  name: string;
  avatar?: ReactNode;
  year: number;
  msgs: { me: boolean; t: string }[];
  /** câu trả lời để chọn; không có khi đã chọn xong */
  opts?: string[];
  /** câu vừa gửi (hiện sau khi chọn) */
  sent?: string;
  timer?: number;
  timeout?: number;
  onChoose?: (i: number) => void;
}) {
  const [left, setLeft] = useState(timer ?? 0);
  const done = useRef(false);
  const live = !!opts && !!onChoose;
  const pick = (i: number) => {
    if (done.current || !onChoose) return;
    done.current = true;
    onChoose(i);
  };
  useEffect(() => {
    if (!timer || !live) return;
    const t = setInterval(() => setLeft((n) => n - 1), 1000);
    return () => clearInterval(t);
  }, [timer, live]);
  useEffect(() => {
    if (live && timer && left <= 0) pick(timeout ?? (opts?.length ?? 1) - 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left]);

  const silent = sent?.startsWith('(');
  const bar =
    timer && live ? (
      <div className="ph-timer" role="timer" aria-label={`Còn ${Math.max(0, left)} giây để trả lời`}>
        <i style={{ width: `${(Math.max(0, left) / timer) * 100}%` }} />
        <span>{Math.max(0, left)}s</span>
      </div>
    ) : null;

  if (skin === 'letter')
    return (
      <div className="letter2">
        <div className="stamp" aria-hidden="true">
          BƯU ĐIỆN
          <br />
          {year}
        </div>
        <div className="lt-to">Gửi {me},</div>
        {msgs.map((m, i) => (
          <p key={i} className="lt-line" style={{ animationDelay: `${i * 0.5}s` }}>
            {m.t}
          </p>
        ))}
        <div className="lt-sign">- {name}</div>
        {sent && !silent && <p className="lt-reply">Thư hồi âm: {sent.replace(/^"|"$/g, '')}</p>}
        {sent && silent && <p className="lt-reply">(Lá thư nằm im trong ngăn bàn.)</p>}
        {live && (
          <div className="lt-opts">
            <div className="lt-label">Viết thư hồi âm:</div>
            {bar}
            {opts!.map((t, i) => (
              <button key={i} type="button" className="lt-opt" onClick={() => pick(i)}>
                ✎ {t}
              </button>
            ))}
          </div>
        )}
      </div>
    );

  if (skin === 'nokia')
    return (
      <div className="nokia">
        <div className="nk-body">
          <div className="nk-screen">
            <div className="nk-top">
              <span>▮▮▮▯</span>
              <span>✉ 1 TIN MỚI</span>
              <span>▭</span>
            </div>
            <div className="nk-from">Từ: {name}</div>
            {msgs.map((m, i) => (
              <p key={i} className="nk-msg">
                {m.t}
              </p>
            ))}
            {sent && <p className="nk-sent">{silent ? '(Không trả lời)' : `Đã gửi: ${sent.replace(/^"|"$/g, '')}`}</p>}
            {live && (
              <div className="nk-menu">
                <div className="nk-label">Trả lời:</div>
                {opts!.map((t, i) => (
                  <button key={i} type="button" className="nk-opt" onClick={() => pick(i)}>
                    {i + 1}. {t}
                  </button>
                ))}
              </div>
            )}
          </div>
          {bar}
          <div className="nk-keys" aria-hidden="true">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((k) => (
              <i key={k}>{k}</i>
            ))}
          </div>
        </div>
      </div>
    );

  // smartphone và tương lai
  const ai = skin === 'ai';
  return (
    <div className={`smart ${ai ? 'holo' : ''}`}>
      <div className="sm-notch" aria-hidden="true" />
      <div className="sm-status" aria-hidden="true">
        <span>23:{String(year % 60).padStart(2, '0')}</span>
        <span>{ai ? '◉ AI' : '▂▄▆ 4G ▮▮▮'}</span>
      </div>
      <div className="sm-head">
        <span className="sm-av">{avatar}</span>
        <span className="sm-who">
          <b>{name}</b>
          <small>{live || !sent ? 'Đang hoạt động' : silent ? 'Đã xem' : 'Đang soạn tin...'}</small>
        </span>
      </div>
      <div className="sm-msgs">
        {msgs.map((m, i) => (
          <div key={i} className={`sm-b ${m.me ? 'me' : ''}`} style={{ animationDelay: `${0.2 + i * 0.7}s` }}>
            {m.t}
          </div>
        ))}
        {live && (
          <div className="sm-typing" style={{ animationDelay: `${0.2 + msgs.length * 0.7}s` }} aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
        )}
        {sent && !silent && <div className="sm-b me">{sent.replace(/^"|"$/g, '')}</div>}
        {sent && <div className="sm-seen">{silent ? `Bạn đã xem lúc 23:${String(year % 60).padStart(2, '0')}` : 'Đã xem ✓✓'}</div>}
      </div>
      {live && (
        <div className="sm-input">
          {bar}
          <div className="sm-hint">{ai ? '✦ Trợ lý AI đã soạn sẵn câu trả lời:' : 'Chọn câu trả lời:'}</div>
          {opts!.map((t, i) => (
            <button key={i} type="button" className="sm-opt" onClick={() => pick(i)}>
              {t}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
