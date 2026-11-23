/* sw.js — service worker BUMDes Sidang Jaya: aplikasi bisa dibuka tanpa internet (setelah pernah dibuka online).
   Naikkan VERSION setiap kali file aplikasi diperbarui agar pengguna mendapat versi baru. */
const VERSION='sidangjaya-v1';
const SHELL=["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png", "./elegant-theme.css", "./assets/js/offline-layer.js"];
const CDN=["https://unpkg.com/@supabase/supabase-js@2.57.0/dist/umd/supabase.js", "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js", "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.4/jspdf.plugin.autotable.min.js"];
const CDN_HOSTS=['unpkg.com','cdnjs.cloudflare.com','cdn.jsdelivr.net','fonts.googleapis.com','fonts.gstatic.com'];
/* Chrome menolak respons ber-flag "redirected" untuk navigasi; salin tanpa flag itu. */
async function clean(r){
  if(!r||!r.redirected)return r;
  return new Response(await r.blob(),{status:r.status,statusText:r.statusText,headers:r.headers});
}
self.addEventListener('install',e=>{
  e.waitUntil((async()=>{
    const c=await caches.open(VERSION);
    await Promise.allSettled(SHELL.map(async u=>{const r=await fetch(u,{cache:'reload',redirect:'follow'});if(r.ok)await c.put(u,await clean(r));}));
    await Promise.allSettled(CDN.map(async u=>{const r=await fetch(new Request(u,{mode:'no-cors'}));await c.put(u,r);}));
    self.skipWaiting();
  })());
});
self.addEventListener('activate',e=>{
  e.waitUntil((async()=>{for(const k of await caches.keys())if(k!==VERSION)await caches.delete(k);await self.clients.claim();})());
});
self.addEventListener('fetch',e=>{
  const req=e.request,url=new URL(req.url);
  if(req.method!=='GET'||url.hostname.endsWith('.supabase.co'))return;
  if(req.mode==='navigate'){
    e.respondWith((async()=>{
      try{
        const r=await fetch(req);
        if(r.ok&&!r.redirected){const cp=r.clone();caches.open(VERSION).then(c=>c.put(req,cp));}
        return r;
      }catch(_){
        const c=await caches.open(VERSION);
        for(const k of [req,'./','./index.html']){
          const hit=await c.match(k,{ignoreSearch:true});
          if(hit)return clean(hit);
        }
        return new Response('<meta charset="utf-8"><meta name="viewport" content="width=device-width"><body style="font-family:sans-serif;padding:24px"><h3>Belum tersimpan untuk mode offline</h3><p>Buka aplikasi sekali dengan internet, lalu muat ulang satu kali.</p>',{status:503,headers:{'content-type':'text/html; charset=utf-8'}});
      }
    })());
    return;
  }
  if(url.origin===location.origin||CDN_HOSTS.includes(url.hostname)){
    e.respondWith((async()=>{
      const c=await caches.open(VERSION),hit=await c.match(req);
      const net=fetch(req).then(r=>{if(r&&(r.ok||r.type==='opaque'))c.put(req,r.clone());return r;}).catch(()=>null);
      return hit||(await net)||Response.error();
    })());
  }
});
