// Latest UI behavior layered over the Supabase data adapter in app.js
window.addEventListener('load',()=>{
  const cover=document.getElementById('memoryCover');
  if(cover && window.__MEMORY_PHOTO) cover.src=window.__MEMORY_PHOTO;

  // iPad / Safari 日本語IME対策
  document.querySelectorAll('input[type="text"],textarea:not([readonly])').forEach(field=>{
    field.setAttribute('lang','ja'); field.setAttribute('inputmode','text'); field.setAttribute('autocapitalize','off'); field.spellcheck=false;
    let composing=false;
    field.addEventListener('compositionstart',()=>{composing=true;field.dataset.imeComposing='true'});
    field.addEventListener('compositionend',()=>{composing=false;field.dataset.imeComposing='false'});
    field.addEventListener('keydown',e=>{
      if(composing||e.isComposing||e.keyCode===229||field.dataset.imeComposing==='true'||e.key!=='Enter')return;
      if(field.id==='quickItemInput'){e.preventDefault();window.addQuickItem?.()}else if(field.id==='itemInput'){e.preventDefault();window.addItem?.()}
    });
  });
  document.documentElement.dataset.appLoaded='true';
});