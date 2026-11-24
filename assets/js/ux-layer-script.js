(function(){
  var ux=window.__ux,$=function(h){var d=document.createElement('div');d.innerHTML=h;return d.firstChild;};
  var bar=$('<div id="uxBar"></div>'),busy=$('<div id="uxBusy"><div class="box"><div class="spin"></div><div class="txt">Memproses…</div></div></div>'),
      toasts=$('<div id="uxToasts"></div>'),sheet=$('<div id="uxSheet"><div class="sh"><h3></h3><p></p><div class="row"><button class="no">Batal</button><button class="yes">Ya</button></div></div></div>');
  document.body.append(bar,busy,toasts,sheet);

  /* ---- Toast: pengganti alert (tanpa tombol OK) ---- */
  function toast(msg,type){
    msg=String(msg==null?'':msg).replace(/^[✅❌⚠️\s]+/,'');
    if(!type)type=/gagal|ditolak|error|tidak dapat|belum|harus|wajib|tidak boleh|hanya/i.test(msg)?'err':'ok';
    var t=$('<div class="uxToast '+type+'"><i>'+(type==='err'?'✕':'✓')+'</i><span></span></div>');
    t.lastChild.textContent=msg;toasts.append(t);ux.lastToast=Date.now();
    var life=Math.min(7000,2500+msg.length*40);
    setTimeout(function(){t.classList.add('out');setTimeout(function(){t.remove();},260);},life);
    t.onclick=function(){t.remove();};
  }
  window.alert=function(m){toast(m);};window.uxToast=toast;

  /* ---- Animasi loading otomatis untuk semua simpan/hapus ---- */
  var showT,idleT,burst=0,op=false,kind='',clicked=null;
  document.addEventListener('click',function(e){clicked=e.target.closest?e.target.closest('.btn'):null;},true);
  document.addEventListener('ux:busy',function(){
    if(ux.pending>0){
      clearTimeout(idleT);
      if(!burst){burst=Date.now();bar.className='';void bar.offsetWidth;bar.className='on';}
      if(ux.write>0){op=true;kind=ux.kind;busy.querySelector('.txt').textContent=kind;if(clicked)clicked.classList.add('ux-busy');
        if(!showT&&!busy.classList.contains('on'))showT=setTimeout(function(){busy.classList.add('on');},120);}
    }else{
      idleT=setTimeout(finish,450);
    }
  });
  function finish(){
    clearTimeout(showT);showT=null;busy.classList.remove('on');bar.className='end';
    document.querySelectorAll('.ux-busy').forEach(function(b){b.classList.remove('ux-busy');});clicked=null;
    if(op&&ux.lastToast<burst){
      if(ux.err)toast('Gagal memproses data. Periksa koneksi lalu coba lagi.','err');
      else toast(/Menghapus/.test(kind)?'Data berhasil dihapus':'Data berhasil disimpan','ok');
    }
    burst=0;op=false;ux.err=false;
  }

  /* ---- Konfirmasi hapus: bottom sheet (bukan kotak bawaan browser) ---- */
  var nativeConfirm=window.confirm.bind(window),pass=false,capture=null;
  window.confirm=function(m){if(pass)return true;if(capture){capture.msg=m;return false;}return nativeConfirm(m);};
  function ask(msg,yesCb){
    var del=/hapus/i.test(msg);
    sheet.querySelector('h3').textContent=del?'Hapus data?':'Konfirmasi';
    sheet.querySelector('p').textContent=String(msg).replace(/\\+n/g,'\n');
    var y=sheet.querySelector('.yes');y.textContent=del?'Ya, hapus':'Ya, lanjut';y.style.background=del?'#c0392b':'#155875';
    sheet.classList.add('on');
    function close(){sheet.classList.remove('on');}
    sheet.querySelector('.no').onclick=close;sheet.onclick=function(e){if(e.target===sheet)close();};
    y.onclick=function(){close();yesCb();};
  }
  ['deleteTransaction','toggleMasterBarang','deleteSelectedSales'].forEach(function(n){
    var orig=window[n];if(typeof orig!=='function')return;
    window[n]=function(){
      var self=this,args=arguments;capture={msg:null};
      try{orig.apply(self,args);}catch(e){}
      var c=capture;capture=null;if(!c.msg)return;
      ask(c.msg,function(){pass=true;try{orig.apply(self,args);}finally{pass=false;}});
    };
  });

  /* ---- Bottom navigation ala aplikasi HP ---- */
  var I={dashboard:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    penjualan:'<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M3 4h2l2.2 10.5a2 2 0 0 0 2 1.5h7.6a2 2 0 0 0 2-1.5L20 8H6"/>',
    pembelian:'<path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5z"/><path d="M12 21v-9"/><path d="m3.5 7.5 8.5 4.5 8.5-4.5"/>',
    stok:'<path d="M5 4h14v16H5z"/><path d="M8 8h8M8 12h8M8 16h5"/>',
    menu:'<path d="M4 7h16M4 12h16M4 17h16"/>'};
  var items=[['dashboard','Beranda'],['penjualan','Jual'],['pembelian','Masuk'],['stok','Stok'],['menu','Menu']];
  var nav=$('<nav id="uxNav">'+items.map(function(x){return '<button data-p="'+x[0]+'"><svg viewBox="0 0 24 24">'+I[x[0]]+'</svg>'+x[1]+'</button>';}).join('')+'</nav>');
  document.body.append(nav);
  nav.addEventListener('click',function(e){
    var b=e.target.closest('button');if(!b)return;var p=b.dataset.p;
    if(p==='menu'){var s=document.getElementById('sidebar');s&&s.classList.add('open');return;}
    var src=document.querySelector('.nav button[onclick*="\''+p+'\'"]');src&&src.click();
  });
  function mark(p){nav.querySelectorAll('button').forEach(function(b){b.classList.toggle('on',b.dataset.p===p);});}
  var os=window.showPage;
  if(typeof os==='function')window.showPage=function(p){var r=os.apply(this,arguments);mark(p);window.scrollTo({top:0});return r;};
  mark('dashboard');
  var gate=document.getElementById('bumdesLoginGate');
  function vis(){if(gate&&!gate.hidden)nav.style.setProperty('display','none','important');else nav.style.removeProperty('display');}
  if(gate){new MutationObserver(vis).observe(gate,{attributes:true,attributeFilter:['hidden']});}vis();
})();
