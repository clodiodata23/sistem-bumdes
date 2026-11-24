/* tutup-kas.js — Tutup Kas Harian: cocokkan uang tunai di laci dengan catatan transaksi.
   Uang seharusnya = modal awal + penjualan tunai − pembelian tunai − pengeluaran tunai (hanya pembayaran "Tunai").
   Hasil penutupan disimpan di perangkat ini (localStorage); data transaksi tetap dari Supabase. */
(function(){
  var $=function(i){return document.getElementById(i);};
  var LS='sidangjaya.tutupkas.v1';
  var rp=function(n){try{return formatRupiah(n);}catch(e){return 'Rp'+Math.round(n).toLocaleString('id-ID');}};
  var esc=function(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});};
  var today=function(){try{return tanggalInputHariIni();}catch(e){var d=new Date();return new Date(d-d.getTimezoneOffset()*6e4).toISOString().slice(0,10);}};
  var nextDay=function(iso){var d=new Date(iso+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+1);return d.toISOString().slice(0,10);};
  var num=function(id){return Math.max(0,Math.floor(Number(($(id)||{}).value)||0));};
  var load=function(){try{return JSON.parse(localStorage.getItem(LS))||{};}catch(e){return {};}};
  var save=function(o){try{localStorage.setItem(LS,JSON.stringify(o));}catch(e){}};
  var D={jual:0,beli:0,keluar:0,transfer:0,piutang:0,hutang:0};

  /* --- halaman & menu --- */
  var sec=document.createElement('section');sec.id='page-tutup-kas';sec.className='page';
  sec.innerHTML='<div class="panel"><div class="table-toolbar"><div><h2 class="section-title" style="margin-bottom:5px">Tutup Kas Harian</h2>'+
    '<div class="help">Cocokkan uang tunai di laci dengan catatan transaksi pada tanggal yang dipilih.</div></div>'+
    '<div class="report-actions"><div><label for="tkTanggal">Tanggal</label><input id="tkTanggal" type="date"></div><button class="btn btn-secondary" type="button" id="tkLoad">Muat data</button></div></div>'+
    '<div id="tkNote" class="help"></div>'+
    '<div class="cards" style="grid-template-columns:repeat(3,minmax(0,1fr));margin:14px 0">'+
    '<div class="card"><div class="metric-label">Penjualan tunai</div><div class="metric-value" id="tkJual">Rp0</div></div>'+
    '<div class="card"><div class="metric-label">Pembelian tunai</div><div class="metric-value" id="tkBeli">Rp0</div></div>'+
    '<div class="card"><div class="metric-label">Pengeluaran tunai</div><div class="metric-value" id="tkKeluar">Rp0</div></div></div>'+
    '<div class="tk-sheet">'+
    '<label class="tk-row" for="tkModal"><span>Modal awal di laci</span><input id="tkModal" type="number" min="0" inputmode="numeric" placeholder="0"></label>'+
    '<div class="tk-row"><span>+ Penjualan tunai</span><b id="tkJual2">Rp0</b></div>'+
    '<div class="tk-row"><span>− Pembelian tunai</span><b id="tkBeli2">Rp0</b></div>'+
    '<div class="tk-row"><span>− Pengeluaran tunai</span><b id="tkKeluar2">Rp0</b></div>'+
    '<div class="tk-row tk-total"><span>Uang seharusnya di laci</span><b id="tkSeharusnya">Rp0</b></div>'+
    '<label class="tk-row" for="tkHitung"><span>Uang yang dihitung</span><input id="tkHitung" type="number" min="0" inputmode="numeric" placeholder="Isi hasil hitung"></label>'+
    '<div class="tk-row"><span>Selisih</span><span id="tkSelisih"></span></div>'+
    '<label class="tk-row" for="tkCatatan"><span>Catatan</span><input id="tkCatatan" type="text" placeholder="Opsional"></label></div>'+
    '<div class="help" id="tkNon" style="margin-top:10px"></div>'+
    '<div class="report-actions" style="margin-top:14px"><button class="btn btn-primary" type="button" id="tkSave">Simpan tutup kas</button>'+
    '<button class="btn btn-secondary" type="button" id="tkPrint">Cetak</button><button class="btn btn-wa" type="button" id="tkWa">Kirim ringkasan WhatsApp</button></div></div>'+
    '<div class="panel" style="margin-top:18px"><h3 class="section-title">Riwayat tutup kas (perangkat ini)</h3><div id="tkHist"></div></div>';
  var pg=$('page-kas');if(!pg)return;pg.after(sec);
  var st=document.createElement('style');
  st.textContent='.tk-hrow{display:flex;gap:8px;align-items:stretch;margin:0 0 8px}.tk-hrow .rs-row{margin:0;flex:1;width:auto}'+
    '.tk-del{flex:0 0 auto;border:1px solid #f0c9c4;background:#fff5f4;color:#b42318;border-radius:10px;padding:0 14px;font-size:16px;cursor:pointer}'+
    '.tk-ask{align-items:center;padding:10px 12px;border:1px solid #f0c9c4;background:#fff5f4;border-radius:10px;justify-content:space-between}.tk-ask span{flex:1;font-weight:600}'+
    '.tk-yes{background:#c0392b;border-color:#c0392b;color:#fff}';
  document.head.appendChild(st);

  var kasBtn=document.querySelector('.nav button[onclick*="\'kas\'"]');
  if(kasBtn){var b=document.createElement('button');b.setAttribute('onclick',"showPage('tutup-kas', this)");
    b.innerHTML='<span class="nav-icon"><svg viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h4"/><path d="m14.5 16.5 1.5 1.5 3-3"/></svg></span><span class="nav-label">Tutup Kas</span>';
    kasBtn.after(b);}

  /* --- data --- */
  function get(table,cols,date){
    var mod=function(q){return q.gte('tanggal',date).lt('tanggal',nextDay(date)).order('tanggal',{ascending:true});};
    if(typeof fetchAllRows==='function')return fetchAllRows(table,cols,mod,1000,3);
    return mod(supabaseClient.from(table).select(cols)).then(function(r){if(r.error)throw r.error;return r.data||[];});
  }
  var by=function(rows,k,pay){return rows.filter(function(r){return String(r.pembayaran||'').toLowerCase()===pay;}).reduce(function(s,r){return s+(Number(r[k])||0);},0);};
  async function fetchDay(){
    var d=$('tkTanggal').value||today();$('tkNote').textContent='Memuat data…';
    try{
      var r=await Promise.all([get('penjualan','tanggal,total_penjualan,pembayaran',d),get('barang_masuk','tanggal,total_pembelian,pembayaran',d),get('pengeluaran','tanggal,jumlah,pembayaran',d)]);
      D={jual:by(r[0],'total_penjualan','tunai'),beli:by(r[1],'total_pembelian','tunai'),keluar:by(r[2],'jumlah','tunai'),
         transfer:by(r[0],'total_penjualan','transfer'),piutang:by(r[0],'total_penjualan','piutang'),hutang:by(r[1],'total_pembelian','hutang')};
      var q=0;try{q=await window.__offline.count();}catch(e){}
      $('tkNote').textContent=(navigator.onLine?'':'Mode offline: data dari salinan terakhir. ')+(q?q+' transaksi offline belum terkirim dan belum dihitung di sini.':'');
    }catch(e){$('tkNote').textContent='Data belum dapat dimuat: '+(e&&e.message||e);D={jual:0,beli:0,keluar:0,transfer:0,piutang:0,hutang:0};}
    var h=load(),rec=h[d];
    if(rec){$('tkModal').value=rec.modal;$('tkHitung').value=rec.dihitung;$('tkCatatan').value=rec.catatan||'';}
    else{var prev=Object.keys(h).filter(function(k){return k<d;}).sort().pop();$('tkModal').value=prev?h[prev].dihitung:'';$('tkHitung').value='';$('tkCatatan').value='';}
    calc();
  }
  function calc(){
    var modal=num('tkModal'),seh=modal+D.jual-D.beli-D.keluar,hit=$('tkHitung').value===''?null:num('tkHitung');
    ['Jual','Beli','Keluar'].forEach(function(k){var v=D[k.toLowerCase()];$('tk'+k).textContent=rp(v);$('tk'+k+'2').textContent=rp(v);});
    $('tkSeharusnya').textContent=rp(seh);
    var el=$('tkSelisih');
    if(hit===null)el.innerHTML='<span class="badge badge-empty">Belum dihitung</span>';
    else{var s=hit-seh;el.innerHTML=s===0?'<span class="badge badge-safe">Pas</span>':'<span class="badge '+(s>0?'badge-info">Lebih ':'badge-danger">Kurang ')+rp(Math.abs(s))+'</span>';}
    $('tkNon').textContent='Tidak masuk laci — Transfer: '+rp(D.transfer)+' · Piutang: '+rp(D.piutang)+' · Hutang pembelian: '+rp(D.hutang);
    return {seh:seh,hit:hit};
  }
  function record(){var c=calc();if(c.hit===null)return null;
    return {tanggal:$('tkTanggal').value,modal:num('tkModal'),jual:D.jual,beli:D.beli,keluar:D.keluar,seharusnya:c.seh,dihitung:c.hit,selisih:c.hit-c.seh,
      catatan:$('tkCatatan').value.trim(),oleh:window.bumdesCurrentName||'',ts:Date.now()};}
  var askDel=null; /* tanggal yang menunggu konfirmasi hapus; '*' = semua riwayat */
  var tgl=function(k){return k.split('-').reverse().join('/');};
  function hist(){
    var h=load(),all=Object.keys(h).sort().reverse(),ks=all.slice(0,10),out='';
    if(!ks.length){
      $('tkHist').innerHTML='<div class="es"><svg viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h4"/></svg><div class="es-t">Belum ada tutup kas</div><div class="es-h">Isi uang yang dihitung lalu simpan.</div></div>';
      return;
    }
    ks.forEach(function(k){var r=h[k];
      if(askDel===k){
        out+='<div class="tk-hrow tk-ask"><span>Hapus tutup kas '+tgl(k)+'?</span><button type="button" class="btn btn-secondary" data-no="1">Batal</button><button type="button" class="btn tk-yes" data-yes="'+k+'">Hapus</button></div>';
        return;
      }
      var main='<button type="button" class="rs-row" data-d="'+k+'"><span class="rs-n">'+k.split('-').reverse().join('/')+'<small>Seharusnya '+esc(rp(r.seharusnya))+' · dihitung '+esc(rp(r.dihitung))+(r.oleh?' · '+esc(r.oleh):'')+'</small></span><span class="badge '+(r.selisih===0?'badge-safe">Pas':r.selisih>0?'badge-info">Lebih':'badge-danger">Kurang')+'</span></button>';
      out+='<div class="tk-hrow">'+main+'<button type="button" class="tk-del" data-del="'+k+'" aria-label="Hapus tutup kas tanggal '+tgl(k)+'" title="Hapus riwayat ini">🗑</button></div>';
    });
    if(all.length>10)out+='<div class="help" style="margin:6px 0">Menampilkan 10 terbaru dari '+all.length+' riwayat.</div>';
    out+=askDel==='*'
      ?'<div class="tk-hrow tk-ask"><span>Hapus semua '+all.length+' riwayat?</span><button type="button" class="btn btn-secondary" data-no="1">Batal</button><button type="button" class="btn tk-yes" data-yes="*">Hapus semua</button></div>'
      :'<div style="margin-top:6px"><button type="button" class="btn btn-secondary" data-all="1">Hapus semua riwayat ('+all.length+')</button></div>';
    $('tkHist').innerHTML=out;
  }
  function hapusRiwayat(k){
    var h=load(),n=1;
    if(k==='*'){n=Object.keys(h).length;h={};}
    else{if(!h[k]){askDel=null;hist();return;}delete h[k];}
    save(h);askDel=null;
    if(k==='*'||$('tkTanggal').value===k){$('tkHitung').value='';$('tkCatatan').value='';calc();}
    hist();
    toast(k==='*'?n+' riwayat tutup kas dihapus.':'Riwayat tutup kas tanggal '+tgl(k)+' dihapus.','ok');
  }
  function text(r){var f=function(n){return rp(n).replace(/\u00a0/g,' ');};
    return ['*Tutup Kas BUMDes Sidang Jaya*','Tanggal: '+r.tanggal.split('-').reverse().join('/'),'--------------------','Modal awal: '+f(r.modal),'Penjualan tunai: '+f(r.jual),'Pembelian tunai: '+f(r.beli),'Pengeluaran tunai: '+f(r.keluar),
      'Seharusnya di laci: '+f(r.seharusnya),'Dihitung: '+f(r.dihitung),'*Selisih: '+(r.selisih===0?'Pas':(r.selisih>0?'Lebih ':'Kurang ')+f(Math.abs(r.selisih)))+'*'].concat(r.catatan?['Catatan: '+r.catatan]:[]).concat(r.oleh?['Petugas: '+r.oleh]:[]).join('\n');}
  var toast=function(m,t){window.uxToast?window.uxToast(m,t):alert(m);};

  $('tkLoad').onclick=fetchDay;$('tkTanggal').onchange=fetchDay;
  ['tkModal','tkHitung'].forEach(function(i){$(i).oninput=calc;});
  $('tkSave').onclick=function(){var r=record();if(!r){toast('Isi uang yang dihitung terlebih dahulu.','err');return;}
    var h=load();h[r.tanggal]=r;save(h);hist();toast('Tutup kas tanggal '+r.tanggal.split('-').reverse().join('/')+' disimpan.','ok');};
  $('tkWa').onclick=function(){var r=record();if(!r){toast('Isi uang yang dihitung terlebih dahulu.','err');return;}
    window.open('https://wa.me/?text='+encodeURIComponent(text(r)),'_blank','noopener');};
  $('tkPrint').onclick=function(){var r=record();if(!r){toast('Isi uang yang dihitung terlebih dahulu.','err');return;}
    var w=window.open('','_blank');if(!w){toast('Pop-up diblokir browser. Izinkan pop-up lalu coba lagi.','err');return;}
    var row=function(a,b,c){return '<tr class="'+(c||'')+'"><td>'+a+'</td><td style="text-align:right">'+esc(rp(b))+'</td></tr>';};
    w.document.write('<!doctype html><meta charset="utf-8"><title>Tutup Kas '+r.tanggal+'</title><style>body{font:14px Arial,sans-serif;max-width:560px;margin:24px auto;color:#111}h2{margin:0 0 4px}table{width:100%;border-collapse:collapse;margin:14px 0}td{padding:7px 4px;border-bottom:1px solid #ddd}.t td{font-weight:700;border-top:2px solid #111}.sig{display:flex;justify-content:space-between;margin-top:56px}.sig div{width:40%;text-align:center;border-top:1px solid #111;padding-top:6px}</style>'+
      '<h2>BUMDes Sidang Jaya</h2><div>Tutup Kas Harian — '+r.tanggal.split('-').reverse().join('/')+'</div><table>'+row('Modal awal di laci',r.modal)+row('Penjualan tunai',r.jual)+row('Pembelian tunai',r.beli)+row('Pengeluaran tunai',r.keluar)+row('Uang seharusnya',r.seharusnya,'t')+row('Uang dihitung',r.dihitung,'t')+
      '<tr class="t"><td>Selisih</td><td style="text-align:right">'+(r.selisih===0?'Pas':(r.selisih>0?'Lebih ':'Kurang ')+esc(rp(Math.abs(r.selisih))))+'</td></tr></table>'+(r.catatan?'<div>Catatan: '+esc(r.catatan)+'</div>':'')+
      '<div class="sig"><div>Petugas'+(r.oleh?'<br>'+esc(r.oleh):'')+'</div><div>Mengetahui</div></div>');
    w.document.close();w.focus();w.print();};
  $('tkHist').onclick=function(e){
    var t=e.target,b;
    if((b=t.closest('[data-del]'))){askDel=b.dataset.del;hist();return;}
    if(t.closest('[data-all]')){askDel='*';hist();return;}
    if(t.closest('[data-no]')){askDel=null;hist();return;}
    if((b=t.closest('[data-yes]'))){hapusRiwayat(b.dataset.yes);return;}
    if((b=t.closest('[data-d]'))){$('tkTanggal').value=b.dataset.d;fetchDay();}
  };

  var os=window.showPage;
  if(typeof os==='function')window.showPage=function(p){var r=os.apply(this,arguments);if(p==='tutup-kas'){if(!$('tkTanggal').value)$('tkTanggal').value=today();fetchDay();askDel=null;hist();}return r;};
})();
