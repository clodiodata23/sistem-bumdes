/* reprint-nota.js — cetak ulang nota dari Riwayat Penjualan.
   Baris dengan nomor nota yang sama (INV-...) digabung menjadi satu nota, lalu memakai modal & tombol cetak yang sudah ada. */
window.reprintSalesReceipt=function(encodedId){
  try{
    var id=decodeURIComponent(encodedId||''),row=salesHistoryData.find(function(x){return String(x.id_penjualan)===id;});
    if(!row){alert('Data transaksi tidak ditemukan. Muat ulang riwayat lalu coba lagi.');return;}
    var m=String(row.keterangan||'').match(/Nota\s+(INV-[A-Za-z0-9-]+)/),no=m?m[1]:null;
    var rows=no?salesHistoryData.filter(function(x){return String(x.keterangan||'').indexOf(no)>=0;}):[row];
    rows=rows.slice().sort(function(a,b){return String(a.id_penjualan).localeCompare(String(b.id_penjualan),undefined,{numeric:true});});
    var total=rows.reduce(function(s,x){return s+(Number(x.total_penjualan)||0);},0);
    var ket=String(row.keterangan||'').replace(/^Nota\s+\S+\s*\|?\s*/,'').replace(/\|?\s*Link nota:.*$/,'').trim();
    var receipt={noNota:no||String(row.id_penjualan),tanggalDisplay:formatHistoryDate(row.tanggal),pembayaran:row.pembayaran||'-',
      keterangan:ket,total:total,dibayar:null,kembalian:null,
      items:rows.map(function(x){return {namaBarang:x.nama_barang||x.id_barang||'-',qty:Number(x.qty)||0,hargaJual:Number(x.harga_jual)||0,satuan:''};})};
    lastSalesReceipt=receipt;
    document.getElementById('salesReceiptModalContent').innerHTML=createSalesReceiptHtml(receipt);
    var modal=document.getElementById('salesReceiptModal');
    if(modal.parentElement!==document.body)document.body.appendChild(modal);
    modal.hidden=false;document.body.classList.add('sales-receipt-open');modal.scrollTop=0;
  }catch(e){console.error(e);alert('Nota tidak dapat dibuka: '+(e&&e.message||e));}
};
