/* dashboard-plus.js — tambahan dashboard: perbandingan dengan periode lalu, grafik penjualan harian, daftar stok perlu dibeli.
   Berjalan setelah loadDashboard() asli selesai; kegagalan di sini tidak mengganggu dashboard utama. */
(function(){
  var orig=window.loadDashboard;if(typeof orig!=='function')return;
  var $=function(i){return document.getElementById(i);};
  var rp=function(n){try{return formatRupiah(n);}catch(e){return 'Rp'+Math.round(n).toLocaleString('id-ID');}};
  var esc=function(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});};
  var addDays=function(iso,n){var d=new Date(iso+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);};
  var diff=function(a,b){return Math.round((new Date(b+'T12:00:00Z')-new Date(a+'T12:00:00Z'))/864e5);};
  var short=function(n){return n>=1e6?(n/1e6).toFixed(1).replace('.0','')+' jt':n>=1e3?Math.round(n/1e3)+' rb':String(Math.round(n));};
  var sum=function(rows,k){return (rows||[]).reduce(function(s,r){return s+(Number(r[k])||0);},0);};
  var token=0;

  function get(table,cols,start,end){
    var mod=function(q){return q.gte('tanggal',start).lt('tanggal',addDays(end,1)).order('tanggal',{ascending:true});};
    if(typeof fetchAllRows==='function')return fetchAllRows(table,cols,mod,1000,3);
    return mod(supabaseClient.from(table).select(cols)).then(function(r){if(r.error)throw r.error;return r.data||[];});
  }
  function host(){
    var h=$('dashPlus');if(h)return h;
    var anchor=$('dashboardInventorySummary');anchor=anchor&&anchor.closest('.grid-2');if(!anchor)return null;
    h=document.createElement('div');h.id='dashPlus';h.className='grid-2';
    h.innerHTML='<div class="panel"><h3 class="section-title">Penjualan harian</h3><div id="dashChart"></div></div>'+
      '<div class="panel"><h3 class="section-title">Stok perlu dibeli</h3><div id="dashRestock"></div></div>';
    anchor.parentNode.insertBefore(h,anchor);return h;
  }
  function delta(valId,cur,prev,kind){
    var v=$(valId);if(!v||!v.parentNode)return;
    var old=v.parentNode.querySelector('.delta');if(old)old.remove();
    var cls,ic,txt;
    if(!prev&&!cur){cls='d-flat';ic='flat';txt='Sama dengan periode lalu';}
    else if(!prev){cls='d-flat';ic='up';txt='Periode lalu Rp0';}
    else{var pct=(cur-prev)/Math.abs(prev)*100;
      if(Math.abs(pct)<0.5){cls='d-flat';ic='flat';txt='Sama dengan periode lalu';}
      else{ic=pct>0?'up':'dn';cls=kind==='neutral'?'d-flat':(pct>0?'d-up':'d-down');txt=Math.abs(pct).toFixed(pct>=100||pct<=-100?0:1).replace('.',',')+'% vs periode lalu';}}
    var d=document.createElement('div');d.className='delta '+cls;d.innerHTML=uiIcon(ic)+'<span>'+txt+'</span>';v.after(d);
  }
  function chart(rows,start,end){
    var el=$('dashChart');if(!el)return;
    var len=diff(start,end)+1,step=len<=31?1:Math.ceil(len/31),n=Math.ceil(len/step),b=[],i;
    for(i=0;i<n;i++)b.push({s:addDays(start,i*step),v:0});
    rows.forEach(function(r){var k=Math.floor(diff(start,String(r.tanggal).slice(0,10))/step);if(k>=0&&k<n)b[k].v+=Number(r.total_penjualan)||0;});
    var max=Math.max.apply(null,b.map(function(x){return x.v;}));
    if(!max){el.innerHTML='<div class="es"><svg viewBox="0 0 24 24"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg><div class="es-t">Belum ada penjualan</div><div class="es-h">Grafik tampil setelah ada transaksi pada periode ini.</div></div>';return;}
    var W=600,H=220,L=44,T=12,B=26,pw=W-L-8,ph=H-T-B,bw=pw/n,g='',bars='';
    [0,.5,1].forEach(function(f){var y=T+ph-ph*f;g+='<line class="dc-grid" x1="'+L+'" x2="'+(W-8)+'" y1="'+y+'" y2="'+y+'"/><text class="dc-lab" x="'+(L-6)+'" y="'+(y+4)+'" text-anchor="end">'+short(max*f)+'</text>';});
    b.forEach(function(x,k){var h=ph*x.v/max,xx=L+k*bw+bw*.15;
      bars+='<rect class="dc-bar" x="'+xx+'" y="'+(T+ph-h)+'" width="'+(bw*.7)+'" height="'+Math.max(h,x.v?2:0)+'" rx="3"><title>'+x.s.split('-').reverse().join('/')+': '+esc(rp(x.v))+'</title></rect>';});
    var fmt=function(s){var p=s.split('-');return p[2]+'/'+p[1];};
    el.innerHTML='<svg class="dc" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Grafik penjualan harian">'+g+bars+
      '<text class="dc-lab" x="'+L+'" y="'+(H-6)+'">'+fmt(start)+'</text><text class="dc-lab" x="'+(W-8)+'" y="'+(H-6)+'" text-anchor="end">'+fmt(end)+'</text></svg>';
  }
  function restock(){
    var el=$('dashRestock');if(!el)return Promise.resolve();
    return Promise.all([supabaseClient.from('stok').select('id_barang,stok_akhir'),
      supabaseClient.from('master_barang').select('id_barang,nama_barang,satuan,stok_minimum,status,aktif')]).then(function(r){
      if(r[0].error||r[1].error)throw (r[0].error||r[1].error);
      var st={};(r[0].data||[]).forEach(function(x){st[x.id_barang]=Number(x.stok_akhir)||0;});
      var list=(r[1].data||[]).filter(function(m){
        if(m.aktif===false||/^(false|0|tidak|nonaktif)/i.test(String(m.aktif))||/nonaktif/i.test(String(m.status)))return false;
        var s=st[m.id_barang]||0,min=Number(m.stok_minimum)||0;return s<=0||(min>0&&s<=min);
      }).map(function(m){var s=st[m.id_barang]||0,min=Number(m.stok_minimum)||0;return {m:m,s:s,min:min,r:s<=0?-1:s/(min||1)};})
        .sort(function(a,b){return a.r-b.r;});
      if(!list.length){el.innerHTML='<div class="es"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="m8 12.5 2.8 2.8L16 9.5"/></svg><div class="es-t">Semua stok aman</div><div class="es-h">Tidak ada barang di bawah stok minimum.</div></div>';return;}
      el.innerHTML=list.slice(0,8).map(function(x){return '<button type="button" class="rs-row" data-name="'+esc(x.m.nama_barang)+'"><span class="rs-n">'+esc(x.m.nama_barang)+
        '<small>Sisa '+x.s+' '+esc(x.m.satuan||'')+' · minimum '+x.min+'</small></span><span class="badge '+(x.s<=0?'badge-danger">Habis':'badge-warning">Menipis')+'</span></button>';}).join('')+
        (list.length>8?'<div class="es-h rs-more">+'+(list.length-8)+' barang lainnya</div>':'');
    });
  }
  document.addEventListener('click',function(e){
    var b=e.target.closest&&e.target.closest('.rs-row');if(!b)return;
    var nav=document.querySelector('.nav button[onclick*="\'pembelian\'"]');
    if(nav)nav.click();else if(typeof showPage==='function')showPage('pembelian');
    var s=$('purchaseSearch');if(s){s.value=b.dataset.name;s.dispatch&&0;s.dispatchEvent(new Event('input',{bubbles:true}));s.dispatchEvent(new Event('change',{bubbles:true}));}
  });
  async function plus(){
    var p=getDashboardPeriod();if(!p||p.error||!host())return;
    var me=++token,today=new Date().toISOString().slice(0,10);
    var end=p.all?today:p.selesai,start=p.all?addDays(today,-29):p.mulai;
    $('dashChart').innerHTML='<span class="sk"><i></i><i></i><i></i></span>';
    if(!$('dashRestock').firstChild)$('dashRestock').innerHTML='<span class="sk"><i></i><i></i><i></i></span>';
    var jobs=[get('penjualan','tanggal,total_penjualan,laba_kotor',start,end).then(function(r){if(me!==token)return;chart(r,start,end);return r;}),
      restock().catch(function(){$('dashRestock').innerHTML='<div class="es-h">Daftar stok belum dapat dimuat.</div>';})];
    if(!p.all){
      var len=diff(start,end)+1,ps=addDays(start,-len),pe=addDays(start,-1);
      var all=await Promise.all([jobs[0],get('penjualan','tanggal,total_penjualan,laba_kotor',ps,pe),get('pengeluaran','tanggal,jumlah',start,end),get('pengeluaran','tanggal,jumlah',ps,pe),get('barang_masuk','tanggal,total_pembelian',start,end),get('barang_masuk','tanggal,total_pembelian',ps,pe)]);
      if(me!==token)return;
      delta('dashPenjualan',sum(all[0],'total_penjualan'),sum(all[1],'total_penjualan'));
      delta('dashLabaKotor',sum(all[0],'laba_kotor'),sum(all[1],'laba_kotor'));
      delta('dashPengeluaran',sum(all[2],'jumlah'),sum(all[3],'jumlah'),'neutral');
      delta('dashPembelian',sum(all[4],'total_pembelian'),sum(all[5],'total_pembelian'),'neutral');
    }
    await Promise.all(jobs);
  }
  window.loadDashboard=async function(){var r=await orig.apply(this,arguments);try{await plus();}catch(e){console.warn('dashboard-plus:',e);var c=$('dashChart');if(c)c.innerHTML='<div class="es-h">Grafik belum dapat dimuat.</div>';}return r;};
})();
