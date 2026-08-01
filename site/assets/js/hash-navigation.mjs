export class HashNavigation {
  constructor() {
    this.frame = 0;
    this.sync = this.sync.bind(this);
  }

  start() {
    window.addEventListener('hashchange', this.sync);
    window.addEventListener('pageshow', this.sync);
    if (window.location.hash) this.sync();
  }

  sync() {
    if (this.frame) window.cancelAnimationFrame(this.frame);
    this.frame = window.requestAnimationFrame(() => {
      this.frame = 0;
      const raw = window.location.hash.slice(1);
      // "#%" や "#%zz" のような不正なパーセントエンコードだと decodeURIComponent が URIError を投げる。
      // ここは requestAnimationFrame のコールバック内なので、投げると誰も拾えずスクロール同期が止まる。
      let id = raw;
      try {
        id = decodeURIComponent(raw);
      } catch {
        // デコードできないものは、生の文字列をそのままIDとして扱う
      }
      const target = id ? document.getElementById(id) : null;
      if (!target) return;
      document.documentElement.classList.add('is-hash-syncing');
      target.scrollIntoView({ block: 'start' });
      window.requestAnimationFrame(() => {
        document.documentElement.classList.remove('is-hash-syncing');
      });
    });
  }

  destroy() {
    if (this.frame) window.cancelAnimationFrame(this.frame);
    window.removeEventListener('hashchange', this.sync);
    window.removeEventListener('pageshow', this.sync);
  }
}
