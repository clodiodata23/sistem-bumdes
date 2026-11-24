/* wa-nota.js — kirim nota lewat WhatsApp dari jendela nota (nota baru maupun cetak ulang). */
(function(){
  var box=document.querySelector('.sales-receipt-modal-actions');if(!box)return;
  var row=document.createElement('div');row.className='wa-row';
  row.innerHTML='<input id="waNotaPhone" type="tel" inputmode="tel" placeholder="No. WhatsApp pembeli (boleh kosong)" aria-label="Nomor WhatsApp pembeli"><button type="button" class="btn btn-wa" id="waNotaBtn">Kirim lewat WhatsApp</button>';
  box.parentNode.insertBefore(row,box.nextSibling);
  var rp=function(n){try{return formatRupiah(n).replace(/\u00a0/g,' ');}catch(e){return 'Rp'+Math.round(n).toLocaleString('id-ID');}};
  function phone(v){var d=String(v||'').replace(/\D/g,'');if(!d)return '';if(d[0]==='0')d='62'+d.slice(1);else if(d[0]==='8')d='62'+d;return d.length>=10&&d.length<=15?d:null;}
  document.getElementById('waNotaBtn').onclick=function(){
    var r;try{r=lastSalesReceipt;}catch(e){}
    if(!r){window.uxToast&&window.uxToast('Data nota belum tersedia.','err');return;}
    var p=phone(document.getElementById('waNotaPhone').value);
    if(p===null){window.uxToast&&window.uxToast('Nomor WhatsApp tidak valid. Contoh: 081234567890','err');return;}
    var L=['*BUMDes Sidang Jaya*','Nota: '+r.noNota,'Tanggal: '+r.tanggalDisplay,'--------------------'];
    r.items.forEach(function(x,i){L.push((i+1)+'. '+x.namaBarang+'\n    '+x.qty+(x.satuan?' '+x.satuan:'')+' x '+rp(x.hargaJual)+' = '+rp(x.qty*x.hargaJual));});
    L.push('--------------------','*Total: '+rp(r.total)+'*','Pembayaran: '+r.pembayaran);
    if(r.dibayar!=null)L.push('Dibayar: '+rp(r.dibayar),'Kembalian: '+rp(r.kembalian));
    if(r.keterangan)L.push('Ket: '+r.keterangan);
    L.push('','Terima kasih telah berbelanja.');
    window.open('https://wa.me/'+p+'?text='+encodeURIComponent(L.join('\n')),'_blank','noopener');
  };
})();
