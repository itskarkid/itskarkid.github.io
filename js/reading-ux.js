// Reading UX shared by Garden and Knowledge: progress bar, shortcuts, back-to-top.
(function(){
  const readers = [
    {view:'view-garden', reader:'gardenReader', search:'sidebarSearch', focus:'focusReadingBtn'},
    {view:'view-knowledge', reader:'krReading', search:'krNoteSearch', focus:'krFocusReading'}
  ];
  const bar = document.createElement('div');
  bar.className = 'reading-progress'; bar.setAttribute('aria-hidden','true');
  document.body.appendChild(bar);
  const top = document.createElement('button');
  top.type = 'button'; top.className = 'reading-top-btn'; top.hidden = true;
  top.textContent = '↑ Top'; top.setAttribute('aria-label','Back to top of note');
  document.body.appendChild(top);
  const active = () => readers.find(r => document.getElementById(r.view)?.classList.contains('active'));
  const scroller = r => {
    const el = document.getElementById(r.reader);
    return el && el.scrollHeight > el.clientHeight + 4 ? el : (document.scrollingElement || document.documentElement);
  };
  function update(){
    const r = active();
    if (!r) { bar.style.width = '0'; top.hidden = true; return; }
    const s = scroller(r), max = s.scrollHeight - s.clientHeight;
    bar.style.width = max > 0 ? Math.min(100, s.scrollTop / max * 100) + '%' : '0';
    top.hidden = s.scrollTop < 600;
  }
  readers.forEach(r => document.getElementById(r.reader)?.addEventListener('scroll', update, {passive:true}));
  window.addEventListener('scroll', update, {passive:true});
  window.addEventListener('resize', update);
  setInterval(update, 800);
  top.addEventListener('click', () => { const r = active(); if (r) scroller(r).scrollTo({top:0, behavior:'smooth'}); });
  document.addEventListener('keydown', e => {
    const r = active();
    if (!r || e.ctrlKey || e.metaKey || e.altKey) return;
    const t = e.target, typing = t.matches && t.matches('input,textarea,select,[contenteditable]');
    if (e.key === 'Escape') {
      const v = document.getElementById(r.view);
      if (v.classList.contains('reading-focus') && !document.querySelector('.garden-graph-overlay:not([hidden]),#krGraphOverlay:not([hidden])')) document.getElementById(r.focus)?.click();
      else if (typing) t.blur();
      return;
    }
    if (typing) return;
    if (e.key === '/') { e.preventDefault(); document.getElementById(r.search)?.focus(); }
    else if (e.key === 'f') document.getElementById(r.focus)?.click();
  });
})();
