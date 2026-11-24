/* suara-aplikasi.js — umpan balik suara & getar untuk seluruh aplikasi.
   - Setiap tombol ditekan: bunyi "tik" pendek (tombol tambah: "ting-ting", tombol hapus: "tok" rendah).
   - Proses berhasil (data tersimpan/terhapus, pesan hijau): bunyi naik "ting-ting-ting".
   - Gagal / tidak bisa (stok tidak cukup, isian salah, ditolak, tombol nonaktif ditekan): dengung rendah + getar.
   Semua suara dibuat langsung oleh browser (Web Audio), tanpa file audio, jadi tetap jalan saat offline.
   Tombol 🔊/🔇 di bagian atas untuk mematikan/menyalakan (tersimpan di perangkat). */
(function(){
  var KEY='sidangjayaSuara',on=true,ctx=null;
  try{on=localStorage.getItem(KEY)!=='0';}catch(e){}

  function ac(){
    try{
      var AC=window.AudioContext||window.webkitAudioContext;if(!AC)return null;
      if(!ctx)ctx=new AC();
      if(ctx.state==='suspended')ctx.resume();
      return ctx;
    }catch(e){return null;}
  }
  function nada(c,freq,mulai,dur,tipe,vol,freqAkhir){
    var o=c.createOscillator(),g=c.createGain(),t=c.currentTime+mulai;
    o.type=tipe||'sine';o.frequency.setValueAtTime(freq,t);
    if(freqAkhir)o.frequency.exponentialRampToValueAtTime(freqAkhir,t+dur);
    g.gain.setValueAtTime(0.0001,t);
    g.gain.exponentialRampToValueAtTime(vol,t+0.012);
    g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    o.connect(g);g.connect(c.destination);o.start(t);o.stop(t+dur+0.03);
  }
  var SUARA={
    tik:function(c){nada(c,1100,0,0.035,'sine',0.05);},
    tambah:function(c){nada(c,880,0,0.12,'sine',0.16);nada(c,1320,0.07,0.12,'sine',0.16);},
    hapus:function(c){nada(c,240,0,0.14,'triangle',0.2,130);},
    ok:function(c){nada(c,659,0,0.09,'sine',0.14);nada(c,830,0.07,0.09,'sine',0.14);nada(c,988,0.14,0.16,'sine',0.14);},
    gagal:function(c){nada(c,190,0,0.13,'square',0.07);nada(c,150,0.17,0.2,'square',0.07);}
  };
  function putar(nama){if(!on)return;var c=ac();if(!c)return;try{SUARA[nama](c);}catch(e){}}
  function getar(pola){try{if(on&&navigator.vibrate)navigator.vibrate(pola);}catch(e){}}

  /* Bunyi tombol ditunda sebentar: kalau hasilnya langsung gagal/berhasil, bunyi hasil yang dipakai (tidak tumpang tindih). */
  var tunda=null;
  function klik(nama){clearTimeout(tunda);tunda=setTimeout(function(){tunda=null;putar(nama);},70);}
  function batalKlik(){if(tunda){clearTimeout(tunda);tunda=null;}}

  var lastOk=0,lastErr=0;
  function hasil(tipe){
    var n=Date.now();
    if(tipe==='err'){
      if(n-lastErr<700)return;
      lastErr=n;batalKlik();putar('gagal');getar([120,70,160]);
    }else{
      if(n-lastOk<700||n-lastErr<700)return;
      lastOk=n;batalKlik();putar('ok');
    }
  }

  function jenis(el){
    var teks=((el.textContent||'')+' '+(el.getAttribute('onclick')||'')+' '+(el.getAttribute('aria-label')||'')+' '+(el.title||'')).toLowerCase();
    if(el.closest('#uxSheet')){
      var judul=(document.querySelector('#uxSheet h3')||{}).textContent||'';
      return(el.classList.contains('yes')&&/hapus/i.test(judul))?'hapus':'tik';
    }
    if(el.id==='salesButton')return 'tambah';
    if(/hapus|delete|🗑/.test(teks))return 'hapus';
    if(/^\s*[+＋]?\s*tambah/.test((el.textContent||'').toLowerCase()))return 'tambah';
    return 'tik';
  }

  document.addEventListener('click',function(e){
    var el=e.target.closest&&e.target.closest('button,[role="button"],.btn');
    if(!el||el.id==='bdSuaraBtn')return;
    if(el.disabled){hasil('err');return;}
    klik(jenis(el));
  },true);
  /* Tombol nonaktif (mis. stok habis, sedang memproses) ditekan paksa -> bunyi & getar "tidak bisa". */
  document.addEventListener('pointerdown',function(e){
    var el=e.target.closest&&e.target.closest('button');
    if(el&&el.disabled&&el.id!=='bdSuaraBtn')hasil('err');
  },true);

  /* Pesan hijau/merah dari aplikasi: toast (pengganti alert) dan kotak hasil di bawah formulir. */
  function pasangPengamat(n){
    var t=document.getElementById('uxToasts');
    if(!t){if(n<20)setTimeout(function(){pasangPengamat(n+1);},500);return;}
    new MutationObserver(function(ms){
      ms.forEach(function(m){m.addedNodes.forEach(function(x){
        if(x.classList&&x.classList.contains('uxToast'))hasil(x.classList.contains('err')?'err':'ok');
      });});
    }).observe(t,{childList:true});
  }
  function pasangHasil(){
    new MutationObserver(function(ms){
      ms.forEach(function(m){
        var e=m.target;
        if(!e.classList||!e.classList.contains('result'))return;
        if(!(e.textContent||'').trim())return;
        if(e.classList.contains('error'))hasil('err');
        else if(e.classList.contains('success'))hasil('ok');
      });
    }).observe(document.body,{attributes:true,attributeFilter:['class'],subtree:true});
  }

  function tombolSuara(){
    var host=document.getElementById('connectionStatus');
    if(!host||!host.parentNode||document.getElementById('bdSuaraBtn'))return;
    var b=document.createElement('button');b.type='button';b.id='bdSuaraBtn';
    b.style.cssText='margin-left:8px;border:1px solid #c9d6dc;background:#fff;border-radius:999px;padding:6px 10px;font-size:15px;cursor:pointer;line-height:1';
    function label(){
      b.textContent=on?'🔊':'🔇';
      b.title=on?'Suara & getar aktif (ketuk untuk mematikan)':'Suara & getar mati (ketuk untuk menyalakan)';
      b.setAttribute('aria-label',b.title);
    }
    label();
    b.onclick=function(){on=!on;try{localStorage.setItem(KEY,on?'1':'0');}catch(e){}label();if(on)putar('ok');};
    host.parentNode.insertBefore(b,host.nextSibling);
  }

  function mulai(){pasangPengamat(0);pasangHasil();tombolSuara();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mulai);else mulai();
})();
