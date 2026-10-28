'use client';

import type { ReactNode } from 'react';
import type { Post } from '@/lib/story';

/** Một bài đăng trên Tường (mạng xã hội trong game) */
export default function Feed({ post, photo }: { post: Post; photo?: ReactNode }) {
  return (
    <article className="feed">
      <div className="fd-app">Tường</div>
      <header className="fd-head">
        <span className="fd-av" aria-hidden="true">
          {post.author.charAt(0)}
        </span>
        <span>
          <b>{post.author}</b>
          <small>{post.time} · 🌐</small>
        </span>
        <span className="fd-more" aria-hidden="true">
          ···
        </span>
      </header>
      <p className="fd-text">{post.text}</p>
      {photo && <div className="fd-photo">{photo}</div>}
      <div className="fd-count">
        <span>♥ {post.likes}</span>
        <span>{post.comments.length * 23 + 3} bình luận</span>
      </div>
      <div className="fd-actions" aria-hidden="true">
        <span>♡ Thích</span>
        <span>✎ Bình luận</span>
        <span>↗ Chia sẻ</span>
      </div>
      <ul className="fd-cmts">
        {post.comments.map((c, i) => (
          <li key={i} style={{ animationDelay: `${0.4 + i * 0.5}s` }}>
            <b>{c.who}</b> {c.t}
          </li>
        ))}
      </ul>
    </article>
  );
}
