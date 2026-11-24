/* pasang-aplikasi.js — bantuan memasang aplikasi ke layar utama (iPhone/iPad Safari & Android Chrome).
   - iPhone/iPad: tidak ada tombol "Pasang" otomatis dari browser, jadi ditampilkan petunjuk Bagikan -> Tambah ke Layar Utama.
   - Android/Chrome: memakai tombol pasang bawaan browser (beforeinstallprompt).
   - Tombol "📲" di bagian atas selalu ada selama aplikasi belum dipasang. Kotak petunjuk muncul sekali, bisa ditutup. */
(function(){
  var KEY='sjPasangDitunda',HARI=14*24*3600*1000;
  var ua=navigator.userAgent||'';
  var iOS=/iPhone|iPad|iPod/.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  if(iOS)document.documentElement.classList.add('is-ios');
  function terpasang(){return window.navigator.standalone===true||(window.matchMedia&&matchMedia('(display-mode: standalone)').matches);}
  if(terpasang())return;
  var evt=null;
  window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();evt=e;tombol();});
  window.addEventListener('appinstalled',function(){tutup();var b=document.getElementById('sjPasangBtn');if(b)b.remove();});

  var css=document.createElement('style');
  css.textContent='.is-ios input,.is-ios select,.is-ios textarea{font-size:16px!important}'+
  '#sjPasangBtn{margin-left:8px;border:1px solid #c9d6dc;background:#fff;border-radius:999px;padding:6px 10px;font-size:15px;cursor:pointer;line-height:1}'+
  '#sjPasang{position:fixed;inset:0;z-index:2000003;display:flex;align-items:flex-end;justify-content:center;background:rgba(16,36,50,.45)}'+
  '#sjPasang .kotak{width:100%;max-width:460px;background:#fff;border-radius:18px 18px 0 0;padding:20px 20px calc(20px + env(safe-area-inset-bottom,0px));font-family:system-ui,-apple-system,"Segoe UI",sans-serif;color:#102432}'+
  '#sjPasang h3{margin:0 0 6px;font-size:18px}#sjPasang p{margin:0 0 12px;color:#475b66;font-size:14px;line-height:1.5}'+
  '#sjPasang ol{margin:0 0 14px;padding-left:20px;font-size:14px;line-height:1.7}'+
  '#sjPasang .ikon{display:inline-block;vertical-align:-4px;margin:0 2px}'+
  '#sjPasang .aksi{display:flex;gap:10px}#sjPasang button{flex:1;padding:12px;border-radius:12px;border:0;font-size:15px;font-weight:600;cursor:pointer}'+
  '#sjPasang .utama{background:#155875;color:#fff}#sjPasang .nanti{background:#eef3f5;color:#102432}';
  document.head.appendChild(css);

  var SHARE='<svg class="ikon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#155875" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M8 7l4-4 4 4M5 11v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8"/></svg>';
  function tutup(){var k=document.getElementById('sjPasang');if(k)k.remove();}
  function tunda(){try{localStorage.setItem(KEY,String(Date.now()));}catch(e){}tutup();}
  function ditunda(){try{var t=Number(localStorage.getItem(KEY)||0);return t&&Date.now()-t<HARI;}catch(e){return false;}}

  function buka(){
    if(document.getElementById('sjPasang'))return;
    var d=document.createElement('div');d.id='sjPasang';
    var isi;
    if(evt){
      isi='<h3>Pasang aplikasi BUMDes</h3><p>Pasang ke layar utama agar lebih cepat dibuka, layar penuh, dan bisa dipakai saat internet putus.</p>'+
          '<div class="aksi"><button class="nanti" data-n>Nanti</button><button class="utama" data-p>Pasang</button></div>';
    }else if(iOS){
      isi='<h3>Pasang di iPhone / iPad</h3><p>Buka lewat <b>Safari</b>, lalu:</p><ol>'+
          '<li>Ketuk tombol <b>Bagikan</b> '+SHARE+' (di bawah/atas layar Safari).</li>'+
          '<li>Gulir, pilih <b>Tambah ke Layar Utama</b>.</li><li>Ketuk <b>Tambah</b>. Buka aplikasi dari ikon di layar utama.</li></ol>'+
          '<p>Disarankan dipasang agar data offline tidak terhapus otomatis oleh iPhone.</p>'+
          '<div class="aksi"><button class="nanti" data-n>Nanti</button><button class="utama" data-n2>Mengerti</button></div>';
    }else{
      isi='<h3>Pasang aplikasi BUMDes</h3><p>Buka menu browser (⋮), lalu pilih <b>Instal aplikasi</b> atau <b>Tambahkan ke layar utama</b>.</p>'+
          '<div class="aksi"><button class="utama" data-n2>Mengerti</button></div>';
    }
    d.innerHTML='<div class="kotak" role="dialog" aria-modal="true">'+isi+'</div>';
    document.body.appendChild(d);
    d.addEventListener('click',function(e){if(e.target===d)tunda();});
    var n=d.querySelector('[data-n]'),n2=d.querySelector('[data-n2]'),p=d.querySelector('[data-p]');
    if(n)n.onclick=tunda;if(n2)n2.onclick=tunda;
    if(p)p.onclick=function(){var e=evt;tutup();if(!e)return;e.prompt();e.userChoice.finally(function(){evt=null;});};
  }

  function tombol(){
    var host=document.getElementById('bdSuaraBtn')||document.getElementById('connectionStatus');
    if(!host||!host.parentNode||document.getElementById('sjPasangBtn'))return;
    var b=document.createElement('button');b.type='button';b.id='sjPasangBtn';b.textContent='📲';
    b.title='Pasang aplikasi ke layar utama';b.setAttribute('aria-label',b.title);b.onclick=buka;
    host.parentNode.insertBefore(b,host.nextSibling);
  }
  function mulai(){
    tombol();
    setTimeout(tombol,1500);
    setTimeout(function(){if(!ditunda()&&(iOS||evt))buka();},7000);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mulai);else mulai();
})();
