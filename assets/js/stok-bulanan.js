/* stok-bulanan.js — di halaman Stok: lihat jumlah terjual tiap barang pada bulan yang dipilih. */
(function(){
  var sec=document.getElementById('page-stok');if(!sec)return;
  var $=function(i){return document.getElementById(i);};
  var esc=function(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});};
  var num=function(n){try{return formatNumber(n);}catch(e){return Number(n||0).toLocaleString('id-ID');}};
  var rp=function(n){try{return formatRupiah(n);}catch(e){return 'Rp'+Math.round(n).toLocaleString('id-ID');}};
  var today=function(){try{return tanggalInputHariIni();}catch(e){var d=new Date();return new Date(d-d.getTimezoneOffset()*6e4).toISOString().slice(0,10);}};
  var NAMA=['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  var label=function(b){var p=b.split('-');return NAMA[+p[1]-1]+' '+p[0];};
  var awalBulan=function(b){return b+'-01';};
  var awalBulanDepan=function(b){var p=b.split('-'),y=+p[0],m=+p[1]+1;if(m>12){m=1;y++;}return y+'-'+String(m).padStart(2,'0')+'-01';};
  var rows=[],sedang=false,sudahBuka=false;

  var box=document.createElement('div');box.className='panel';box.id='sbPanel';box.style.marginTop='18px';
  box.innerHTML='<div class="table-toolbar"><div><h2 class="section-title" style="margin-bottom:5px">Terjual Per Bulan</h2>'+
    '<div class="help">Pilih bulan untuk melihat berapa yang terjual dari tiap barang.</div></div>'+
    '<div class="report-actions"><div><label for="sbBulan">Bulan</label><input id="sbBulan" type="month"></div>'+
    '<button class="btn btn-secondary" type="button" id="sbMuat">Tampilkan</button></div></div>'+
    '<div class="table-toolbar"><input id="sbCari" type="search" placeholder="Cari nama barang..." aria-label="Cari barang terjual"><div class="help" id="sbInfo"></div></div>'+
    '<div class="sb-cards"><div class="card"><div class="metric-label">Jenis barang terjual</div><div class="metric-value" id="sbJenis">0</div></div>'+
    '<div class="card"><div class="metric-label">Total unit terjual</div><div class="metric-value" id="sbUnit">0</div></div>'+
    '<div class="card"><div class="metric-label">Nilai penjualan</div><div class="metric-value" id="sbNilai">Rp0</div></div></div>'+
    '<div class="table-wrap"><table><thead><tr><th>Nama Barang</th><th>Terjual</th><th>Nilai Penjualan</th></tr></thead>'+
    '<tbody id="sbBody"><tr><td colspan="3" class="empty-state">Pilih bulan lalu tekan Tampilkan.</td></tr></tbody></table></div>';
  sec.appendChild(box);
  $('sbBulan').value=today().slice(0,7);

  function gambar(){
    var q=$('sbCari').value.trim().toLowerCase();
    var tampil=rows.filter(function(r){return !q||String(r.nama).toLowerCase().indexOf(q)>=0;});
    var unit=0,nilai=0;rows.forEach(function(r){unit+=r.qty;nilai+=r.nilai;});
    $('sbJenis').textContent=num(rows.length);$('sbUnit').textContent=num(unit);$('sbNilai').textContent=rp(nilai);
    if(!tampil.length){$('sbBody').innerHTML='<tr><td colspan="3" class="empty-state">'+(rows.length?'Tidak ada barang yang cocok.':'Tidak ada penjualan pada bulan ini.')+'</td></tr>';return;}
    $('sbBody').innerHTML=tampil.map(function(r){
      return '<tr><td><strong>'+esc(r.nama)+'</strong></td><td class="stock-number">'+num(r.qty)+'</td><td>'+esc(rp(r.nilai))+'</td></tr>';
    }).join('');
  }

  function ambil(b){
    var cols='id_barang,nama_barang,qty,total_penjualan,tanggal';
    var mod=function(q){return q.gte('tanggal',awalBulan(b)).lt('tanggal',awalBulanDepan(b)).order('tanggal',{ascending:true});};
    if(typeof fetchAllRows==='function')return fetchAllRows('penjualan',cols,mod,1000,3);
    return mod(supabaseClient.from('penjualan').select(cols)).then(function(r){if(r.error)throw r.error;return r.data||[];});
  }

  async function muat(){
    var b=$('sbBulan').value;if(!b){$('sbInfo').textContent='Pilih bulan terlebih dahulu.';return;}
    if(sedang)return;sedang=true;
    var tb=$('sbMuat');tb.disabled=true;tb.textContent='Memuat…';
    $('sbInfo').textContent='Memuat penjualan '+label(b)+'…';
    try{
      var data=await ambil(b),m={};
      data.forEach(function(x){
        var k=String(x.id_barang||x.nama_barang||'');
        var o=m[k]||(m[k]={nama:x.nama_barang||k,qty:0,nilai:0});
        o.qty+=Number(x.qty)||0;o.nilai+=Number(x.total_penjualan)||0;
      });
      rows=Object.keys(m).map(function(k){return m[k];}).sort(function(a,b2){return b2.qty-a.qty||String(a.nama).localeCompare(String(b2.nama));});
      $('sbInfo').textContent='Penjualan '+label(b)+' · '+data.length+' baris transaksi'+(navigator.onLine?'':' · mode offline (salinan terakhir)');
      gambar();
    }catch(e){
      rows=[];gambar();
      $('sbInfo').textContent='Data belum dapat dimuat: '+(e&&e.message||e);
    }finally{sedang=false;tb.disabled=false;tb.textContent='Tampilkan';}
  }

  $('sbMuat').onclick=muat;$('sbBulan').onchange=muat;$('sbCari').oninput=gambar;

  /* Dimuat otomatis saat halaman Stok pertama kali dibuka. */
  var os=window.showPage;
  if(typeof os==='function')window.showPage=function(p){var r=os.apply(this,arguments);if(p==='stok'&&!sudahBuka){sudahBuka=true;muat();}return r;};
})();
