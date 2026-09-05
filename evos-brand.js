(() => {
  const script = document.currentScript;
  if (!script) return;
  const logoUrl = new URL('assets/evos-brand-v2.png', script.src).href;

  const css = `
    .evos-brand-link{display:inline-flex!important;align-items:center!important;justify-content:flex-start!important;flex:0 0 auto!important;width:168px!important;height:64px!important;overflow:hidden!important;text-decoration:none!important;background:#000!important;border:0!important;border-radius:4px!important;padding:0!important;margin:0!important;box-shadow:none!important}
    .evos-brand-image{display:block!important;width:168px!important;height:64px!important;max-width:none!important;object-fit:cover!important;object-position:center 50%!important;border:0!important;border-radius:0!important;box-shadow:none!important;background:#000!important}
    .evos-brand-text{display:inline-flex!important;align-items:center!important;height:64px!important;color:#efcb72!important;font-size:34px!important;font-weight:950!important;letter-spacing:7px!important;line-height:1!important;text-shadow:0 0 16px #ff2bd666,0 0 20px #208cff55!important}
    .evos-brand-fallback{display:flex;align-items:center;min-height:72px;padding:4px 14px;position:relative;z-index:5;background:transparent}
    @media(max-width:640px){.evos-brand-link{width:146px!important;height:56px!important}.evos-brand-image{width:146px!important;height:56px!important}.evos-brand-text{height:56px!important;font-size:30px!important;letter-spacing:6px!important}.evos-brand-fallback{min-height:64px;padding:4px 10px}}
  `;

  const style = document.createElement('style');
  style.setAttribute('data-evos-brand-style','');
  style.textContent = css;
  document.head.appendChild(style);

  function ensureHeadAsset(selector, tagName, attributes){
    if (document.head.querySelector(selector)) return;
    const element = document.createElement(tagName);
    Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
    document.head.appendChild(element);
  }

  ensureHeadAsset('link[rel="icon"]', 'link', {rel:'icon', type:'image/png', href:logoUrl});
  ensureHeadAsset('link[rel="apple-touch-icon"]', 'link', {rel:'apple-touch-icon', href:logoUrl});
  ensureHeadAsset('meta[property="og:image"]', 'meta', {property:'og:image', content:logoUrl});
  ensureHeadAsset('meta[name="twitter:image"]', 'meta', {name:'twitter:image', content:logoUrl});

  function makeFallback(){
    const fallback = document.createElement('span');
    fallback.className = 'evos-brand-text';
    fallback.textContent = 'EVOS';
    fallback.setAttribute('aria-hidden','true');
    return fallback;
  }

  function protectImage(img){
    const showFallback = () => {
      if (!img.isConnected) return;
      img.replaceWith(makeFallback());
    };
    img.addEventListener('error', showFallback, {once:true});
    if (img.complete && !img.naturalWidth) queueMicrotask(showFallback);
  }

  function installBrand(){
    if (document.querySelector('.evos-brand-image')) return;
    const existingImage = [...document.images].find(img => {
      const alt = (img.alt || '').trim().toUpperCase();
      const src = img.currentSrc || img.src || '';
      return alt === 'EVOS' || /\/evos-brand(?:-v2)?\.(?:png|jpe?g)(?:\?|$)/i.test(src);
    });
    if (existingImage) {
      existingImage.classList.add('evos-brand-image');
      protectImage(existingImage);
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
    protectImage(img);

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
