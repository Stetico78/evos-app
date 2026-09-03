(() => {
  const script = document.currentScript;
  if (!script) return;
  const logoUrl = new URL('assets/evos-brand.jpg', script.src).href;

  const css = `
    .evos-brand-link{display:inline-flex!important;align-items:center!important;justify-content:flex-start!important;flex:0 0 auto!important;text-decoration:none!important;background:transparent!important;border:0!important;padding:0!important;margin:0!important;box-shadow:none!important}
    .evos-brand-image{display:block!important;width:auto!important;height:64px!important;max-width:92px!important;object-fit:contain!important;object-position:center!important;border:0!important;border-radius:0!important;box-shadow:none!important;background:#000!important}
    .evos-brand-fallback{display:flex;align-items:center;min-height:72px;padding:4px 14px;position:relative;z-index:5;background:transparent}
    @media(max-width:640px){.evos-brand-image{height:58px!important;max-width:84px!important}.evos-brand-fallback{min-height:66px;padding:4px 10px}}
  `;

  const style = document.createElement('style');
  style.setAttribute('data-evos-brand-style','');
  style.textContent = css;
  document.head.appendChild(style);

  function installBrand(){
    if (document.querySelector('.evos-brand-image')) return;
    const existingImage = [...document.images].find(img => /\bevos\b/i.test(img.alt || '') && (img.currentSrc || img.src));
    if (existingImage) {
      existingImage.classList.add('evos-brand-image');
      return;
    }

    const candidates = [
      document.querySelector('header .evos'),
      document.querySelector('nav .evos'),
      ...document.querySelectorAll('header a, nav a, header .brand, header .logo')
    ].filter(Boolean);

    let target = candidates.find(el => {
      const t = (el.textContent || '').replace(/\s+/g,' ').trim().toUpperCase();
      return t === 'EVOS' || (t.startsWith('EVOS ') && t.length <= 26);
    });

    const img = document.createElement('img');
    img.src = logoUrl;
    img.alt = 'EVOS';
    img.className = 'evos-brand-image';
    img.decoding = 'async';
    img.fetchPriority = 'high';

    if (target) {
      target.textContent = '';
      target.classList.add('evos-brand-link');
      target.setAttribute('aria-label','EVOS');
      if (!target.getAttribute('href') && target.tagName === 'A') target.setAttribute('href','#');
      target.appendChild(img);
      const parent = target.parentElement;
      if (parent) {
        [...parent.children].forEach(el => {
          if (el !== target && (el.classList.contains('sub') || el.classList.contains('collab'))) el.style.display='none';
        });
      }
      return;
    }

    const link = document.createElement('a');
    link.href = '#';
    link.className = 'evos-brand-link';
    link.setAttribute('aria-label','EVOS');
    link.appendChild(img);

    const header = document.querySelector('header');
    if (header) {
      header.prepend(link);
    } else {
      const wrap = document.createElement('div');
      wrap.className = 'evos-brand-fallback';
      wrap.appendChild(link);
      document.body.prepend(wrap);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installBrand, {once:true});
  else installBrand();
})();
