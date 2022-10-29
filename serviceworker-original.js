/*eslint-disable*/
const cacheName = "oinkedit", cacheFiles = [
    //没有被引用但很可能需要的文件
];
self.addEventListener("install", ()=>{self.skipWaiting();});
self.addEventListener("activate", e=>{e.waitUntil(clients.claim());});
self.addEventListener("fetch", e=>{
    e.respondWith(
        fetch(e.request).catch(()=>caches.match(e.request)).then(fRes=>{
            const fResC = fRes.clone();
            if(fResC && (fResC.status === 200 || fResC.status === 304 || fResC.type === "opaque") && e.request.method !== "POST") caches.open(cacheName).then(c=>{c.put(e.request, fResC);})
            return fRes;
        })
    );
});
self.addEventListener("message", e=>{//接收客户端信息
    console.log("sw received message " + e.data);
    if(e.data === "clearcache"){
        navigator.storage.estimate().then(r=>{
            caches.has(cacheName).then(h=>{
                if(h){
                    const usage = r.usage;
                    caches.delete(cacheName);
                    sendMessageTo(e.source, `deleted${usage}`);
                }
                else sendMessageTo(e.source, "deleted0");
            });
        });
    }
    else if(typeof e.data == "function"){
        const result = e.data();
        sendMessageTo(e.source, result); //发送回复
    }
    //sendMessageTo(e.source,"");//发送回复
});
function sendMessageTo(l,m){
    return new Promise((y,n)=>{
        const c = new MessageChannel();
        c.port1.onmessage = e=>{
            if(e.data.error) n(e.data.error);
            else y(e.data);
        };
        l.postMessage(m, [c.port2]);
    });
}
//function sendMessageToAll(m){clients.matchAll().then(c=>{c.forEach(c=>{sendMessageTo(c,m).then(m=>console.log("sw received reply "+m));})})}