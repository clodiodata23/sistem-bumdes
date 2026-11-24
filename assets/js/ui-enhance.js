/* ui-enhance.js — lapisan tampilan: ikon SVG pengganti emoji, lencana status, tampilan kosong, skeleton.
   Hanya mengubah tampilan; tidak menyentuh data atau logika transaksi. Aman dilepas kapan saja. */
(function(){
  var MAP={aman:'badge-safe',lunas:'badge-safe',menipis:'badge-warning',piutang:'badge-warning',
           hutang:'badge-danger',habis:'badge-danger',tunai:'badge-empty',transfer:'badge-info'};
  var P={
    box:'<path d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5z"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9"/>',
    ok:'<circle cx="12" cy="12" r="9"/><path d="m8 12.5 2.8 2.8L16 9.5"/>',
    no:'<circle cx="12" cy="12" r="9"/><path d="m9 9 6 6M15 9l-6 6"/>',
    warn:'<path d="M12 4 3 20h18z"/><path d="M12 10v4.5M12 17.5v.1"/>',
    clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    search:'<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',
    trash:'<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/>',
    file:'<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4M9.5 12h5M9.5 16h5"/>',
    down:'<path d="M12 4v11m0 0-4-4m4 4 4-4M5 20h14"/>',
    edit:'<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
    ban:'<circle cx="12" cy="12" r="9"/><path d="m6 6 12 12"/>',
    refresh:'<path d="M20 11a8 8 0 0 0-14-4L4 9M4 4v5h5M4 13a8 8 0 0 0 14 4l2-2M20 20v-5h-5"/>',
    up:'<path d="M12 19V5m0 0-5 5m5-5 5 5"/>',dn:'<path d="M12 5v14m0 0-5-5m5 5 5-5"/>',flat:'<path d="M5 12h14"/>'
  };
  var E={'✅':['ok','ico-ok'],'❌':['no','ico-bad'],'⚠️':['warn','ico-warn'],'⚠':['warn','ico-warn'],'⏳':['clock',''],
    '🔍':['search',''],'🗑️':['trash',''],'🗑':['trash',''],'📄':['file',''],'⬇️':['down',''],'⬇':['down',''],
    '✏️':['edit',''],'✏':['edit',''],'📦':['box',''],'🚫':['ban','ico-bad'],'↻':['refresh',''],'↺':['refresh','']};
  var RE=/(✅|❌|⚠️?|⏳|🔍|🗑️?|📄|⬇️?|✏️?|📦|🚫|↻|↺)/;
  var SKIP={SCRIPT:1,STYLE:1,TEXTAREA:1,OPTION:1,TITLE:1,INPUT:1,SVG:1};
  window.uiIcon=function(n,c){return '<svg class="ico '+(c||'')+'" viewBox="0 0 24 24" aria-hidden="true">'+P[n]+'</svg>';};

  function icons(root){
    var w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,null),n,list=[];
    while((n=w.nextNode())){
      if(!RE.test(n.nodeValue))continue;
      var p=n.parentNode;if(!p||SKIP[(p.nodeName||'').toUpperCase()]||p.closest&&p.closest('svg,option,textarea'))continue;
      if(/⏳\s*memuat/i.test(n.nodeValue))continue;      /* ditangani skeleton */
      list.push(n);
    }
    list.forEach(function(t){
      var parts=t.nodeValue.split(RE),f=document.createDocumentFragment();
      parts.forEach(function(s){
        if(E[s]){var sp=document.createElement('span');sp.className='ico-w';sp.innerHTML=window.uiIcon(E[s][0],E[s][1]);f.appendChild(sp);}
        else if(s)f.appendChild(document.createTextNode(s));
      });
      t.parentNode.replaceChild(f,t);
    });
  }
  function badges(root){
    root.querySelectorAll('td').forEach(function(td){
      if(td.childElementCount)return;
      var c=MAP[td.textContent.trim().toLowerCase()];
      if(c)td.innerHTML='<span class="badge '+c+'">'+td.textContent.trim()+'</span>';
    });
  }
  function empties(root){
    root.querySelectorAll('td.empty-state,td.history-empty').forEach(function(td){
      if(td.querySelector('.es,.sk'))return;
      var t=td.textContent.trim();
      if(!/^(belum ada|tidak ada)/i.test(t))return;
      var h=/periode|filter|rentang|pilihan/i.test(t)?'Coba ubah rentang tanggal atau filter.':'Data akan tampil di sini setelah ada transaksi.';
      td.innerHTML='<div class="es"><svg viewBox="0 0 24 24" aria-hidden="true">'+P.box+'</svg><div class="es-t">'+t.replace(/</g,'&lt;')+'</div><div class="es-h">'+h+'</div></div>';
    });
  }
  function skeletons(root){
    root.querySelectorAll('td.empty-state,td.history-empty,.status-box,.help').forEach(function(el){
      if(el.querySelector('.sk'))return;
      if(el.childElementCount||!/^\s*(⏳\s*)?memuat/i.test(el.textContent))return;
      el.setAttribute('aria-busy','true');
      el.innerHTML='<span class="sk"><i></i>'+(el.tagName==='TD'?'<i></i><i></i>':'')+'</span><span class="sr">Memuat…</span>';
    });
  }
  var q=0,roots=new Set();
  function run(){
    q=0;var r=Array.from(roots);roots.clear();
    r.forEach(function(el){if(!el.isConnected)return;skeletons(el);empties(el);badges(el);icons(el);});
  }
  new MutationObserver(function(ms){
    ms.forEach(function(m){
      if(m.type==='characterData'){if(m.target.parentElement)roots.add(m.target.parentElement);}
      else m.addedNodes.forEach(function(n){if(n.nodeType===1)roots.add(n);else if(n.nodeType===3&&n.parentElement)roots.add(n.parentElement);});
    });
    if(roots.size&&!q)q=requestAnimationFrame(run);
  }).observe(document.body,{childList:true,subtree:true,characterData:true});
  roots.add(document.body);run();
})();
