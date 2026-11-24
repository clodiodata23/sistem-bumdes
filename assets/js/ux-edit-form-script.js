(function(){
  var orig=window.editTransaction;if(typeof orig!=='function')return;
  var box=document.createElement('div');box.id='uxForm';document.body.append(box);
  var rp=function(n){try{return formatRupiah(n);}catch(e){return 'Rp '+Number(n||0).toLocaleString('id-ID');}};
  var esc=function(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});};
  function opts(list,cur){cur=cur||list[0];if(list.indexOf(cur)<0)list=list.concat(cur);return list.map(function(o){return '<option'+(o===cur?' selected':'')+'>'+esc(o)+'</option>';}).join('');}
  function fld(id,label,html,err){return '<div class="fg" data-f="'+id+'"><label>'+label+'</label>'+html+(err?'<div class="em">'+err+'</div>':'')+'</div>';}
  var inp=function(id,type,val,extra){return '<input id="uxf_'+id+'" type="'+type+'" value="'+esc(val)+'" '+(extra||'')+'>';};
  var today=function(){try{return tanggalInputHariIni();}catch(e){return new Date().toISOString().slice(0,10);}};
  function spec(kind,row){
    var tgl=String(row.tanggal||'').slice(0,10)||today();
    if(kind==='sales')return {title:'Edit Penjualan',sub:row.nama_barang+' · '+(row.id_penjualan||''),unit:Number(row.harga_jual)||0,tot:'qty',order:['qty','tanggal','pembayaran','keterangan'],
      html:fld('qty','Jumlah terjual',inp('qty','number',row.qty,'inputmode="numeric" min="1"'),'Jumlah harus lebih dari 0')+
        '<div class="two">'+fld('tanggal','Tanggal',inp('tanggal','date',tgl),'Pilih tanggal')+fld('pembayaran','Pembayaran','<select id="uxf_pembayaran">'+opts(['Tunai','Transfer','Piutang'],row.pembayaran)+'</select>')+'</div>'+
        fld('keterangan','Keterangan',inp('keterangan','text',row.keterangan||'','placeholder="Opsional"'))};
    if(kind==='purchase')return {title:'Edit Barang Masuk',sub:row.nama_barang+' · '+(row.id_pembelian||''),tot:'qty*harga',order:['qty','tanggal','harga','supplier','pembayaran','nomor','keterangan'],
      html:'<div class="two">'+fld('qty','Jumlah masuk',inp('qty','number',row.qty,'inputmode="numeric" min="1"'),'Harus lebih dari 0')+fld('harga','Harga beli / unit',inp('harga','number',row.harga_beli,'inputmode="numeric" min="1"'),'Harus lebih dari 0')+'</div>'+
        '<div class="two">'+fld('tanggal','Tanggal',inp('tanggal','date',tgl),'Pilih tanggal')+fld('pembayaran','Pembayaran','<select id="uxf_pembayaran">'+opts(['Tunai','Transfer','Hutang'],row.pembayaran)+'</select>')+'</div>'+
        fld('supplier','Supplier',inp('supplier','text',row.supplier||''))+fld('nomor','Nomor nota',inp('nomor','text',row.nomor_nota||''))+fld('keterangan','Keterangan',inp('keterangan','text',row.keterangan||''))};
    return {title:'Edit Pengeluaran',sub:(row.id_pengeluaran||''),tot:'jumlah',order:['tanggal','kategori','keterangan','jumlah','pembayaran'],
      html:'<div class="two">'+fld('tanggal','Tanggal',inp('tanggal','date',tgl),'Pilih tanggal')+fld('pembayaran','Pembayaran','<select id="uxf_pembayaran">'+opts(['Tunai','Transfer'],row.pembayaran)+'</select>')+'</div>'+
        fld('kategori','Kategori',inp('kategori','text',row.kategori||'Operasional'))+fld('keterangan','Keterangan',inp('keterangan','text',row.keterangan||''))+fld('jumlah','Jumlah (Rp)',inp('jumlah','number',row.jumlah,'inputmode="numeric" min="1"'),'Harus lebih dari 0')};
  }
  var must={qty:1,harga:1,jumlah:1,tanggal:'d'};
  window.editTransaction=function(kind,encodedId){
    var self=this,id=decodeURIComponent(encodedId||''),row;
    try{
      row=kind==='sales'?salesHistoryData.find(function(x){return String(x.id_penjualan)===String(id);}):
          kind==='purchase'?purchaseHistoryData.find(function(x){return String(x.id_pembelian)===String(id);}):
          expenseHistoryData.find(function(x){return String(x.id_pengeluaran)===String(id);});
    }catch(e){}
    if(!row)return orig.apply(self,arguments);   /* cadangan: cara lama */
    var s=spec(kind,row),args=arguments;
    box.innerHTML='<div class="sh"><div class="grip"></div><h3>'+s.title+'</h3><div class="sub">'+esc(s.sub)+'</div>'+s.html+
      (s.tot?'<div class="tot"><span>Total</span><b id="uxf_total">-</b></div>':'')+
      '<div class="row"><button class="no" type="button">Batal</button><button class="ok" type="button">Simpan perubahan</button></div></div>';
    box.classList.add('on');
    var q=function(i){return box.querySelector('#uxf_'+i);},val=function(i){return q(i)?q(i).value.trim():'';};
    function total(){var t=document.getElementById('uxf_total');if(!t)return;var n=Number(val('qty'))||0,v=s.tot==='qty'?n*s.unit:s.tot==='qty*harga'?n*(Number(val('harga'))||0):Number(val('jumlah'))||0;t.textContent=rp(v);}
    box.oninput=total;total();
    function close(){box.classList.remove('on');}
    box.querySelector('.no').onclick=close;box.onclick=function(e){if(e.target===box)close();};
    box.querySelector('.ok').onclick=function(){
      var bad=false;
      s.order.forEach(function(k){var g=box.querySelector('[data-f="'+k+'"]');if(!g)return;
        var v=val(k),isBad=must[k]===1?!(Number(v)>0):must[k]==='d'?!v:false;g.classList.toggle('bad',isBad);if(isBad)bad=true;});
      if(bad)return;
      var answers=s.order.map(function(k){var v=val(k);return (k==='qty'||k==='harga'||k==='jumlah')?String(Math.floor(Number(v))):v;});
      close();
      var np=window.prompt;window.prompt=function(){return answers.length?answers.shift():null;};
      try{orig.apply(self,args);}finally{window.prompt=np;}
    };
  };
})();
