/* offline-layer.js (Sidang Jaya) — mode offline. Disesuaikan dengan tabel stok Sidang Jaya (kolom barang_masuk / terjual / status). HARUS dimuat di <head> SEBELUM ux-fetch-hook dan Supabase (membungkus window.fetch).
   - Baca (GET)   : jika jaringan gagal, dilayani dari salinan terakhir yang pernah dimuat saat online.
   - Tulis        : penjualan, barang_masuk, pengeluaran, stok, kas diantrekan di IndexedDB lalu dikirim berurutan saat online.
   - Sesi         : saat offline, pembaruan token dijawab dari sesi yang tersimpan agar aplikasi tidak memaksa login ulang. */
(function(){
  var raw=window.fetch.bind(window);
  var pcw=Promise.resolve(); /* antrean penulisan salinan lokal (stok) */
  var QTABLES=/\/rest\/v1\/(penjualan|barang_masuk|pengeluaran|stok|kas)(\?|$)/;
  var dbp=new Promise(function(res,rej){
    if(!window.indexedDB){rej(new Error('no idb'));return;}
    var r=indexedDB.open('sidangjaya-offline',1);
    r.onupgradeneeded=function(){var d=r.result;d.createObjectStore('get',{keyPath:'k'});d.createObjectStore('q',{keyPath:'id'});d.createObjectStore('fail',{keyPath:'id'});};
    r.onsuccess=function(){res(r.result);};r.onerror=function(){rej(r.error);};
  });
  function tx(store,mode,fn){return dbp.then(function(d){return new Promise(function(res,rej){
    var t=d.transaction(store,mode),req=fn(t.objectStore(store));
    t.oncomplete=function(){res(req&&req.result);};t.onerror=function(){rej(t.error);};});});}
  var all=function(s){return tx(s,'readonly',function(o){return o.getAll();});};
  var count=function(s){return tx(s,'readonly',function(o){return o.count();});};

  function hdrs(init){var o={},h=init&&init.headers;if(!h)return o;
    if(typeof h.forEach==='function'&&!Array.isArray(h))h.forEach(function(v,k){o[String(k).toLowerCase()]=v;});
    else if(Array.isArray(h))h.forEach(function(p){o[String(p[0]).toLowerCase()]=p[1];});
    else Object.keys(h).forEach(function(k){o[k.toLowerCase()]=h[k];});return o;}
  function mk(c){var h={'content-type':c.ct||'application/json','x-offline-cache':'1'};if(c.cr)h['content-range']=c.cr;return new Response(c.b,{status:c.s,headers:h});}
  var isNet=function(e){return e instanceof TypeError;};

  /* ---- BACA ---- */
  function readFetch(url,method,input,init){
    var go=navigator.onLine?raw(input,init):Promise.reject(new TypeError('offline'));
    return go.then(function(r){
      if(r.ok&&method==='GET')r.clone().text().then(function(t){
        if(t.length<5e6)tx('get','readwrite',function(o){return o.put({k:url,t:Date.now(),s:r.status,b:t,ct:r.headers.get('content-type'),cr:r.headers.get('content-range')});}).catch(function(){});});
      return r;
    },function(e){
      if(!isNet(e))throw e;
      return tx('get','readonly',function(o){return o.get(url);}).then(function(c){if(c)return mk(c);
        return derive(url,init).then(function(r){if(r)return r;throw e;});},function(){throw e;});
    });
  }
  /* Turunkan hasil dari salinan lokal yang lebih luas (mis. daftar stok lengkap) bila URL persis belum pernah dimuat.
     Mendukung filter id_barang (eq / in) dan pemilihan kolom sederhana. Dipakai saat Simpan Transaksi offline. */
  function derive(url,init){
    return pcw.then(function(){
      var u;try{u=new URL(url);}catch(_){return null;}
      var sel=u.searchParams.get('select')||'*',cols=sel==='*'?null:sel.split(',').map(function(x){return x.trim();});
      if(cols&&cols.some(function(x){return !/^[A-Za-z0-9_]+$/.test(x);}))return null;
      var ids=null,bad=false;
      u.searchParams.forEach(function(v,k){
        if(k==='select'||k==='order'||k==='limit'||k==='offset')return;
        if(k==='id_barang'){
          if(v.indexOf('eq.')===0)ids=[v.slice(3)];
          else if(v.indexOf('in.(')===0&&v.charAt(v.length-1)===')')
            ids=v.slice(4,-1).split(',').map(function(x){return x.replace(/^"|"$/g,'');});
          else bad=true;
        }else bad=true;
      });
      if(bad)return null;
      return all('get').then(function(rows){
        var base=u.origin+u.pathname,found=null;
        for(var i=0;i<rows.length&&!found;i++){
          var c=rows[i];if(c.k.indexOf(base+'?')!==0&&c.k!==base)continue;
          var a;try{a=JSON.parse(c.b);}catch(_){continue;}
          if(!Array.isArray(a))continue;
          if(cols&&a.length&&!cols.every(function(k){return k in a[0];}))continue;
          var out=a;
          if(ids){out=a.filter(function(x){return ids.indexOf(String(x.id_barang))>=0;});
            var have=out.map(function(x){return String(x.id_barang);});
            if(!ids.every(function(id){return have.indexOf(id)>=0;}))continue;}
          if(cols)out=out.map(function(x){var o={};cols.forEach(function(k){o[k]=x[k];});return o;});
          found=out;
        }
        if(!found&&ids){   /* gabungkan beberapa salinan lokal bila tak ada satu pun yang memuat semua kolom */
          var map={};
          rows.forEach(function(c){
            if(c.k.indexOf(base+'?')!==0&&c.k!==base)return;var a;try{a=JSON.parse(c.b);}catch(_){return;}
            if(!Array.isArray(a))return;
            a.forEach(function(x){if(x&&x.id_barang!==undefined&&ids.indexOf(String(x.id_barang))>=0)map[String(x.id_barang)]=Object.assign(map[String(x.id_barang)]||{},x);});
          });
          if(ids.every(function(id){return map[id];})){
            found=ids.map(function(id){var x=map[id];if(!cols)return x;var o={};cols.forEach(function(k){o[k]=x[k]===undefined?null:x[k];});return o;});
          }
        }
        if(!found)return null;
        var acc=hdrs(init).accept||'';
        if(acc.indexOf('vnd.pgrst.object')>=0){
          if(found.length!==1)return new Response(JSON.stringify({message:'JSON object requested, multiple (or no) rows returned'}),{status:406,headers:{'content-type':'application/json','x-offline-cache':'1'}});
          return new Response(JSON.stringify(found[0]),{status:200,headers:{'content-type':'application/json','x-offline-cache':'1'}});
        }
        return new Response(JSON.stringify(found),{status:200,headers:{'content-type':'application/json','x-offline-cache':'1'}});
      });
    }).catch(function(){return null;});
  }
  /* ---- TULIS ---- */
  function fake(method,h,body){
    var rep=/return=representation/.test(h.prefer||''),j=null;try{j=body?JSON.parse(body):null;}catch(_){}
    var hd={'content-type':'application/json','x-offline-queued':'1'};
    if(method==='POST')return new Response(rep?JSON.stringify(Array.isArray(j)?j:[j||{}]):null,{status:201,headers:hd});
    if(method==='PATCH')return rep?new Response(JSON.stringify([j||{}]),{status:200,headers:hd}):new Response(null,{status:204});
    return new Response(null,{status:204});
  }
  function patchCache(url,body){   /* perubahan offline ikut tercermin di salinan lokal, agar transaksi offline berikutnya memakai nilai terbaru */
    var m=/\/rest\/v1\/(stok|master_barang)\?/.exec(url);if(!m||!body)return;var tbl=m[1];
    var id=new URL(url).searchParams.get('id_barang');if(!id||id.indexOf('eq.')!==0)return;id=id.slice(3);
    var j;try{j=JSON.parse(body);}catch(_){return;}
    pcw=pcw.then(function(){return all('get');}).then(function(rows){return Promise.all(rows.map(function(c){
      if(c.k.indexOf('/rest/v1/'+tbl)<0)return null;var a;try{a=JSON.parse(c.b);}catch(_){return null;}
      if(!Array.isArray(a))return null;var hit=false;a.forEach(function(x){if(String(x.id_barang)===id){Object.assign(x,j);hit=true;}});
      if(hit){c.b=JSON.stringify(a);return tx('get','readwrite',function(o){return o.put(c);});}}));}).catch(function(){});
  }
  function bodyKeys(body){try{return Object.keys(JSON.parse(body)).sort().join(',');}catch(_){return '';}}
  /* Pola update stok Sidang Jaya: penjualan = terjual+stok_akhir+status, barang masuk = barang_masuk+stok_akhir+status. */
  var KEY_JUAL=['terjual','stok_akhir','status'].sort().join(','),KEY_MASUK=['barang_masuk','stok_akhir','status'].sort().join(',');
  var isStokKeys=function(k){return k===KEY_JUAL||k===KEY_MASUK;};
  /* Yang boleh diantrekan saat offline: tambah data baru (POST) dan efek sampingnya (stok, harga beli/HPP).
     Edit / hapus data lama TIDAK diantrekan karena butuh hitung ulang stok dari server. */
  function queueable(url,method,body){
    if(method==='POST')return QTABLES.test(url);
    if(method!=='PATCH')return false;
    if(/\/rest\/v1\/stok\?/.test(url))return isStokKeys(bodyKeys(body));
    return /\/rest\/v1\/master_barang\?/.test(url)&&bodyKeys(body)==='harga_beli_terakhir,hpp_rata_rata';
  }
  /* Update stok tanpa syarat (Barang Masuk) akan menimpa angka mentah saat dikirim nanti. Ubah jadi bersyarat
     (stok_akhir harus sama dengan nilai yang dilihat HP) agar jika stok server sudah berubah, dihitung ulang berdasarkan selisih. */
  function stokBefore(url,method,body){
    if(method!=='PATCH'||!/\/rest\/v1\/stok\?/.test(url)||url.indexOf('stok_akhir=')>=0)return Promise.resolve(null);
    if(!isStokKeys(bodyKeys(body)))return Promise.resolve(null);
    var id=new URL(url).searchParams.get('id_barang');if(!id||id.indexOf('eq.')!==0)return Promise.resolve(null);id=id.slice(3);
    return pcw.then(function(){return all('get');}).then(function(rows){
      for(var i=0;i<rows.length;i++){var c=rows[i];if(c.k.indexOf('/rest/v1/stok')<0)continue;var a;try{a=JSON.parse(c.b);}catch(_){continue;}
        if(!Array.isArray(a))continue;
        for(var n=0;n<a.length;n++)if(String(a[n].id_barang)===id&&a[n].stok_akhir!==undefined&&a[n].stok_akhir!==null)return Number(a[n].stok_akhir);}
      return null;}).catch(function(){return null;});
  }
  function writeFetch(url,method,input,init){
    var h=hdrs(init),body=(init&&init.body)||null;
    if(!queueable(url,method,typeof body==='string'?body:null)){
      if(!navigator.onLine&&window.uxToast)window.uxToast('Mode offline: mengubah atau menghapus data lama membutuhkan internet.','err');
      return raw(input,init);
    }
    var go=navigator.onLine?raw(input,init):Promise.reject(new TypeError('offline'));
    return go.catch(function(e){
      if(!isNet(e))throw e;
      var id=String(Date.now()).padStart(15,'0')+Math.random().toString(36).slice(2,7);
      var b=typeof body==='string'?body:null;
      return stokBefore(url,method,b).then(function(before){
        var qurl=url,qh=h;
        if(before!==null&&isFinite(before)){qurl=url+'&stok_akhir=eq.'+before+'&select=id_barang';qh=Object.assign({},h,{prefer:'return=representation'});}
        return tx('q','readwrite',function(o){return o.put({id:id,ts:Date.now(),method:method,url:qurl,h:qh,body:b});});
      }).then(function(){patchCache(url,body);notify();return fake(method,h,body);});
    });
  }
  /* ---- SESI ---- */
  function stored(){try{for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);
    if(/^sb-.*-auth-token$/.test(k)){var s=JSON.parse(localStorage.getItem(k));s=s&&s.currentSession||s;if(s&&s.refresh_token)return s;}}}catch(_){}return null;}
  function authFetch(url,input,init){
    var go=navigator.onLine?raw(input,init):Promise.reject(new TypeError('offline'));
    return go.catch(function(e){
      if(!isNet(e)||url.indexOf('grant_type=refresh_token')<0)throw e;
      var s=stored();if(!s)throw e;window.__fakeAuth=true;
      return new Response(JSON.stringify({access_token:s.access_token,token_type:'bearer',expires_in:3600,expires_at:Math.floor(Date.now()/1000)+3600,refresh_token:s.refresh_token,user:s.user}),{status:200,headers:{'content-type':'application/json'}});
    });
  }
  window.fetch=function(input,init){
    var url=typeof input==='string'?input:(input&&input.url)||String(input);
    if(url.indexOf('.supabase.co/')<0)return raw(input,init);
    if(url.indexOf('/auth/v1/')>=0)return authFetch(url,input,init);
    if(url.indexOf('/rest/v1/')<0)return raw(input,init);
    var m=((init&&init.method)||(input&&input.method)||'GET').toUpperCase();
    return (m==='GET'||m==='HEAD')?readFetch(url,m,input,init):writeFetch(url,m,input,init);
  };

  /* ---- SINKRONISASI ---- */
  /* "Transaksi" = entri utama (mis. satu nota penjualan). Pembaruan stok yang menyertainya hanyalah efek samping,
     jadi tidak dihitung terpisah di indikator/notifikasi. */
  var isStokPatch=function(it){return it.method==='PATCH'&&/\/rest\/v1\/stok\?/.test(it.url);};
  var isSide=function(it){return it.method==='PATCH'&&/\/rest\/v1\/(stok|master_barang)\?/.test(it.url);};
  var isMain=function(it){return !isSide(it);};
  var mainCount=function(){return all('q').then(function(a){return a.filter(isMain).length;});};
  var enc=encodeURIComponent;

  async function token(){try{var c=window.supabaseClient;if(c){var r=await c.auth.refreshSession();return r&&r.data&&r.data.session&&r.data.session.access_token;}}catch(_){}return null;}

  /* Update stok yang ditolak karena stok di server sudah berubah (kasir lain / data lama di HP):
     hitung ulang dari stok server saat ini dengan selisih yang sama, bukan menolak. Hasil: true | false | 'net'. */
  async function resolveStok(it,tok){
    try{
      var u=new URL(it.url),id=u.searchParams.get('id_barang'),be=u.searchParams.get('stok_akhir');
      var b=JSON.parse(it.body||'{}');
      if(!id||id.indexOf('eq.')!==0||!be||be.indexOf('eq.')!==0)return false;
      id=id.slice(3);var before=Number(be.slice(3)),after=Number(b.stok_akhir);
      var keys=Object.keys(b).sort().join(','),kJual=keys===KEY_JUAL,kMasuk=keys===KEY_MASUK;
      if(!(kJual||kMasuk)||!isFinite(before)||!isFinite(after))return false;
      var delta=after-before,base=u.origin+u.pathname;
      var h=Object.assign({},it.h);if(tok)h.authorization='Bearer '+tok;
      var hg={apikey:h.apikey,authorization:h.authorization,accept:'application/json'};
      for(var n=0;n<4;n++){
        var g=await raw(base+'?id_barang=eq.'+enc(id)+'&select=barang_masuk,terjual,stok_akhir,stok_minimum',{headers:hg});
        if(!g.ok)return false;var rows=await g.json();if(!rows.length)return false;var cur=rows[0];
        var akhir=Number(cur.stok_akhir)+delta,min=Number(cur.stok_minimum||0);
        var nb={stok_akhir:akhir,status:akhir<=0?'HABIS':(akhir<=min?'MENIPIS':'AMAN')};
        if(kJual)nb.terjual=Number(cur.terjual||0)-delta;else nb.barang_masuk=Number(cur.barang_masuk||0)+delta;
        var hp=Object.assign({},h,{'content-type':'application/json',prefer:'return=representation'});
        var r=await raw(base+'?id_barang=eq.'+enc(id)+'&stok_akhir=eq.'+cur.stok_akhir+'&select=id_barang',{method:'PATCH',headers:hp,body:JSON.stringify(nb)});
        if(!r.ok)return false;var t=await r.json();if(t.length)return true;
      }
      return false;
    }catch(e){return e instanceof TypeError?'net':false;}
  }

  /* Setelah data terkirim: kosongkan cache data aplikasi lalu muat ulang halaman yang sedang dibuka, otomatis. */
  function refreshUI(){
    try{if(typeof window.invalidateDataCache==='function')window.invalidateDataCache();}catch(_){}
    try{if(typeof salesProductsLoaded!=='undefined'){salesProductsLoaded=false;salesProducts=[];}}catch(_){}
    try{if(typeof purchaseProductsLoaded!=='undefined'){purchaseProductsLoaded=false;purchaseProducts=[];}}catch(_){}
    var act=function(id){var e=document.getElementById(id);return !!(e&&e.classList.contains('active'));};
    var jobs=[],run=function(n){if(typeof window[n]==='function'){try{jobs.push(Promise.resolve(window[n]()));}catch(_){}}};
    if(act('page-penjualan'))run('loadSalesHistory');
    if(act('page-pembelian')){run('loadPurchaseHistory');run('loadRiwayatStokMasuk');}
    if(act('page-pengeluaran'))run('loadExpenseHistory');
    run('refreshCrudViews');   /* stok, dashboard, kas, daftar produk jual/beli yang sedang terlihat */
    return Promise.allSettled(jobs);
  }

  var syncing=false;
  async function sync(){
    if(syncing||!navigator.onLine)return;
    syncing=true;                                   /* dikunci SEGERA, agar dua pemicu tidak mengirim antrean yang sama dua kali */
    var ok=0,bad=0,touched=false,dupMain=false;
    try{
      var items;try{items=await all('q');}catch(_){return;}
      if(!items.length)return;
      notify();
      var tok=await token();window.__fakeAuth=false;
      for(var i=0;i<items.length;i++){
        var it=items[i],h=Object.assign({},it.h);if(tok)h.authorization='Bearer '+tok;
        var r,txt;
        try{r=await raw(it.url,{method:it.method,headers:h,body:it.body});txt=await r.text();}catch(e){break;}
        var done=false,conflict=false;
        if(r.ok){done=true;if(it.method==='PATCH'&&/return=representation/.test(it.h.prefer||'')){try{conflict=JSON.parse(txt).length===0;}catch(_){}}}
        else if(r.status===409)done=true;
        else if(r.status===401)break;
        else{done=true;conflict=true;}
        if(isMain(it))dupMain=(r.status===409);   /* 409 = nota ini sudah pernah masuk server, stoknya pun sudah diterapkan */
        if(conflict&&r.ok&&isStokPatch(it)){
          if(dupMain)conflict=false;
          else{
            var rs=await resolveStok(it,tok);
            if(rs==='net')break;
            if(rs===true)conflict=false;
          }
        }
        if(conflict){bad++;await tx('fail','readwrite',function(o){return o.put({id:it.id,item:it,status:r.status,msg:String(txt).slice(0,300),ts:Date.now()});});}
        else if(done&&isMain(it))ok++;
        if(done){touched=true;await tx('q','readwrite',function(o){return o.delete(it.id);});}
      }
    }finally{syncing=false;}
    if(ok&&window.uxToast)window.uxToast(ok+' transaksi offline berhasil dikirim.','ok');
    if(bad&&window.uxToast)window.uxToast(bad+' perubahan offline ditolak (data tidak valid atau tidak bisa diterapkan). Periksa Riwayat dan stok.','err');
    if(touched)await refreshUI();
    notify();
  }
  /* ---- INDIKATOR ---- */
  var pill=null;
  async function notify(){
    if(!pill)return;var q=0,f=0;try{q=await mainCount();f=await count('fail');}catch(_){}
    var off=!navigator.onLine,txt='';
    if(off)txt='Offline'+(q?' · '+q+' menunggu':'');
    else if(syncing)txt='Mengirim '+q+' transaksi…';
    else if(q)txt=q+' transaksi menunggu dikirim';
    else if(f)txt=f+' perubahan ditolak';
    pill.hidden=!txt;pill.textContent=txt;pill.className='off-pill'+(off?' off':q?' wait':f?' bad':'');
  }
  document.addEventListener('DOMContentLoaded',function(){
    pill=document.createElement('button');pill.type='button';pill.id='offPill';pill.hidden=true;document.body.appendChild(pill);
    pill.onclick=function(){
      all('q').then(function(items){
        if(navigator.onLine&&items.length){sync();return;}
        return all('fail').then(function(f){
          if(!f.length)return;
          return tx('fail','readwrite',function(o){return o.clear();}).then(function(){
            if(window.uxToast)window.uxToast(f.length+' catatan perubahan ditolak sudah dibersihkan. Periksa Riwayat dan stok bila perlu.','ok');notify();});
        });
      }).catch(function(){});
    };
    notify();
  });
  window.addEventListener('online',function(){token().then(function(){return sync();});notify();setTimeout(sync,4000);});
  window.addEventListener('offline',notify);
  document.addEventListener('visibilitychange',function(){if(!document.hidden)sync();});
  setInterval(sync,20000);setTimeout(sync,4000);
  window.__offline={sync:sync,queue:function(){return all('q');},failed:function(){return all('fail');},count:function(){return mainCount().catch(function(){return 0;});}};
  if('serviceWorker' in navigator&&/^https?:/.test(location.protocol)){
    /* Pembaruan aplikasi: bila sudah pernah dibuka sebelumnya, versi baru yang selesai dipasang diumumkan dengan
       tombol "muat ulang" (tidak memuat ulang sendiri, supaya isian yang sedang diketik tidak hilang). */
    var sudahDikontrol=!!navigator.serviceWorker.controller,bannerBaru=null;
    navigator.serviceWorker.addEventListener('controllerchange',function(){
      if(!sudahDikontrol||bannerBaru)return;
      bannerBaru=document.createElement('button');bannerBaru.type='button';bannerBaru.id='updBaru';
      bannerBaru.textContent='Versi baru siap — ketuk untuk memuat ulang';
      bannerBaru.style.cssText='position:fixed;left:50%;transform:translateX(-50%);top:calc(10px + env(safe-area-inset-top,0px));z-index:2000002;padding:10px 16px;border:0;border-radius:999px;background:#155875;color:#fff;font:600 13px sans-serif;box-shadow:0 4px 14px rgba(0,0,0,.25);cursor:pointer';
      bannerBaru.onclick=function(){location.reload();};
      document.body.appendChild(bannerBaru);
    });
    window.addEventListener('load',function(){
      navigator.serviceWorker.register('./sw.js').then(function(reg){
        /* Cek versi baru setiap aplikasi dibuka kembali (aplikasi terpasang di layar utama tidak selalu memuat ulang halaman). */
        var cek=function(){try{reg.update();}catch(_){}};
        document.addEventListener('visibilitychange',function(){if(!document.hidden)cek();});
        cek();
      }).catch(function(){});
    });
  }
})();
