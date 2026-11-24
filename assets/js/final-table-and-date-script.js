function tanggalInputHariIni(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;}

function setDefaultTransactionDates(){const today=tanggalInputHariIni();["salesTanggal","purchaseTanggal","expenseTanggal"].forEach(id=>{const e=document.getElementById(id);if(e&&!e.value)e.value=today;});}

(function(){
  const states=new WeakMap();
  const nativeSet=Object.getOwnPropertyDescriptor(Element.prototype,"innerHTML").set;
  const VIRTUAL_MIN=100; // tabel dengan lebih dari 100 baris hanya menggambar baris halaman yang tampil
  function rows(table){const b=table.tBodies[0];return b?Array.from(b.rows).filter(r=>!r.querySelector(".empty-state,.history-empty")):[];}
  function val(row,i){return String(row.cells[i]?.textContent||"").trim();}
  function cmpText(av,bv,dir){const an=Number(av.replace(/[^0-9,-]/g,"").replace(/\./g,"").replace(",",".")),bn=Number(bv.replace(/[^0-9,-]/g,"").replace(/\./g,"").replace(",","."));let r;if(av&&bv&&Number.isFinite(an)&&Number.isFinite(bn))r=an-bn;else r=av.localeCompare(bv,"id",{numeric:true,sensitivity:"base"});return dir==="asc"?r:-r;}
  function cmp(a,b,i,dir){return cmpText(val(a,i),val(b,i),dir);}
  const ENT={"&amp;":"&","&lt;":"<","&gt;":">","&quot;":'"',"&#039;":"'","&#39;":"'","&nbsp;":" "};
  function cellText(html,i){const re=/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/g;let m,k=0;while((m=re.exec(html))){if(k===i)return m[1].replace(/<[^>]*>/g,"").replace(/&(?:amp|lt|gt|quot|#0?39|nbsp);/g,x=>ENT[x]||x).trim();k++;}return "";}
  function setup(table){
    if(table.dataset.finalInteractive==="1")return;const b=table.tBodies[0],h=table.tHead,w=table.closest(".table-wrap,.history-table-wrap");if(!b||!h||!w)return;
    table.dataset.finalInteractive="1";const s={page:1,size:20,sort:null,dir:"asc",busy:false,obs:null,virtual:null,vkey:null,vsorted:null};states.set(table,s);
    const top=document.createElement("div");top.className="table-enhance-toolbar";top.innerHTML='<div class="table-page-size"><span>Tampilkan</span><select><option value="10">10</option><option value="20" selected>20</option><option value="50">50</option><option value="100">100</option></select><span>baris</span></div><div class="table-pagination"></div>';
    w.parentNode.insertBefore(top,w);const bot=document.createElement("div");bot.className="table-enhance-bottom";bot.innerHTML='<div class="table-page-info"></div><div class="table-pagination"></div>';w.parentNode.insertBefore(bot,w.nextSibling);
    top.querySelector("select").onchange=e=>{s.size=Number(e.target.value)||20;s.page=1;render();};
    Array.from(h.rows[0].cells).forEach((th,i)=>{const label=String(th.textContent||"").trim().toLowerCase();if(!label||label==="aksi"||th.colSpan>1)return;th.classList.add("table-sortable");th.onclick=()=>{s.dir=s.sort===i&&s.dir==="asc"?"desc":"asc";s.sort=i;s.page=1;render();};});
    // Mode virtual: isi tbody yang sangat besar disimpan sebagai teks dan hanya satu halaman yang dibuat menjadi elemen.
    Object.defineProperty(b,"innerHTML",{configurable:true,
      get(){return Object.getOwnPropertyDescriptor(Element.prototype,"innerHTML").get.call(b);},
      set(html){
        const str=String(html);let n=0,i=-1;
        while((i=str.indexOf("</tr>",i+1))!==-1){n++;if(n>VIRTUAL_MIN)break;}
        if(n>VIRTUAL_MIN){const parts=str.split("</tr>");parts.pop();s.virtual=parts.map(x=>x+"</tr>");s.vkey=null;s.vsorted=null;s.page=1;render();}
        else{s.virtual=null;nativeSet.call(b,str);}
      }});
    function render(){if(s.busy)return;s.busy=true;s.obs?.disconnect();try{
      let total,start,end,max;
      if(s.virtual){
        const V=s.virtual;total=V.length;max=Math.max(1,Math.ceil(total/s.size));if(s.page>max)s.page=max;
        let arr=V;
        if(s.sort!==null){const key=s.sort+":"+s.dir;if(s.vkey!==key){const keyed=V.map(x=>({x,t:cellText(x,s.sort)}));keyed.sort((p,q)=>cmpText(p.t,q.t,s.dir));s.vsorted=keyed.map(k=>k.x);s.vkey=key;}arr=s.vsorted;}
        start=(s.page-1)*s.size;end=start+s.size;
        nativeSet.call(b,arr.slice(start,end).join(""));
        table.dispatchEvent(new Event("pager:rendered"));
      }else{
        let r=rows(table);
        /* Saat loader/empty-state tampil sementara, jangan menyentuh state halaman atau mengubah tampilan paginasi. */
        if(!r.length && table.querySelector("tbody .empty-state, tbody .history-empty")){return;}
        total=r.length;max=Math.max(1,Math.ceil(total/s.size));if(total>0&&s.page>max)s.page=max;
        if(s.sort!==null){r.sort((a,c)=>cmp(a,c,s.sort,s.dir));const f=document.createDocumentFragment();r.forEach(x=>f.appendChild(x));b.appendChild(f);}
        start=(s.page-1)*s.size;end=start+s.size;
        r.forEach((x,i)=>{const d=i>=start&&i<end?"":"none";if(x.style.display!==d)x.style.display=d;});
      }
      Array.from(h.rows[0].cells).forEach(x=>x.classList.remove("sort-asc","sort-desc"));if(s.sort!==null&&h.rows[0].cells[s.sort])h.rows[0].cells[s.sort].classList.add(s.dir==="asc"?"sort-asc":"sort-desc");
      const nums=[];for(let i=1;i<=max;i++)nums.push(i);const visible=max<=7?nums:(s.page<=4?nums.slice(0,7):s.page>=max-3?nums.slice(max-7):nums.slice(s.page-4,s.page+3));
      const html='<button class="table-page-btn prev" '+(s.page<=1?'disabled':'')+'>‹</button>'+visible.map(p=>`<button class="table-page-btn ${p===s.page?'active':''}" data-page="${p}">${p}</button>`).join('')+'<button class="table-page-btn next" '+(s.page>=max?'disabled':'')+'>›</button>';
      [top,bot].forEach(c=>{c.querySelector('.table-pagination').innerHTML=html;c.querySelector('.prev').onclick=()=>{if(s.page>1){s.page--;render();}};c.querySelector('.next').onclick=()=>{if(s.page<max){s.page++;render();}};c.querySelectorAll('[data-page]').forEach(x=>x.onclick=()=>{s.page=Number(x.dataset.page);render();});});
      bot.querySelector('.table-page-info').textContent=total?`${start+1}–${Math.min(end,total)} dari ${total} data`:'Tidak ada data';
    }finally{s.busy=false;s.obs?.observe(b,{childList:true});}}
    // Setiap kali isi tbody berubah akibat pencarian/refresh (mode biasa), kembali ke halaman 1.
    // Perubahan internal saat render() tidak memicu observer karena observer dilepas sementara.
    s.obs=new MutationObserver(()=>{if(!s.busy){s.page=1;requestAnimationFrame(render);}});s.obs.observe(b,{childList:true});render();
  }
  function init(){document.querySelectorAll("table").forEach(setup);}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>{setDefaultTransactionDates();init();});else{setDefaultTransactionDates();init();}
  [800,1800,3500].forEach(ms=>setTimeout(init,ms));
})();
