(()=>{
const $=id=>document.getElementById(id);
const presets={orange:["#ff8c22","#b82028","#ffd83d"],red:["#f42d38","#171717","#858585"],blue:["#168dff","#27e0ff","#8c42ff"],green:["#56ef50","#101b16","#e5ff4f"],purple:["#873bff","#ed4ca5","#171329"]};
const v=id=>$(id).value.trim();
const hex=id=>$(id).value.toUpperCase();
const colorIds=["c1","c2","c3","tc","oc","sc"];
const DEFAULT_EXTRA="Yüz kimliğimi ve saç stilimi koru. Filigran ekleme. Metni mobil ekranda kolay okunabilir tut.";
let statusTimer,pal="orange",loading=false;

function say(msg){const s=$("statusmsg");s.textContent=msg;clearTimeout(statusTimer);statusTimer=setTimeout(()=>{s.textContent="";},3500);}
function markPreset(name){pal=name;document.querySelectorAll("[data-preset]").forEach(b=>{const on=b.dataset.preset===name;b.classList.toggle("active",on);b.setAttribute("aria-pressed",on);});}
function usePreset(name){if(presets[name])presets[name].forEach((c,i)=>$("c"+(i+1)).value=c);markPreset(name);render();}

function prompts(){return v("lang")==="en"?promptsEN():promptsTR();}
const ENV={style:["cinematic lighting, dramatic contrast and realistic detail","vivid colors, an energetic atmosphere and polished game visuals","realistic textures, natural light and sharp detail","a dark horror atmosphere, deep shadows and intense red light"],textstyle:["large, bold and easy to read on mobile screens","voluminous, 3D-looking and bold","clean, modern and easy to read"],frame:["head only, with a clean crop","head and shoulders","waist up","full body, head to toe",""],position:["on the left side","on the right side","in the center","wherever balances the composition best"],background:["a scene from the game's world that fits the game title and video topic","a dynamic action scene that fits the game's world and gameplay","a scene reflecting the game's own characters and environments","a cinematic landscape that fits the game's world","a simple background inspired by the game's atmosphere"],resolution:["4K, 3840 × 2160","high-resolution"],expr:["excited and energetic","surprised","serious and confident","happy","natural"],tone:["friendly and natural","energetic and fun","short and direct","search-friendly but natural"]};
function promptsEN(){
const o=id=>ENV[id][$(id).selectedIndex];
const game=v("game")||"the specified game",topic=v("topic")||"the specified video topic",ctx=v("context"),thumb=v("thumb")||"no text on the image",N=v("titleN")||10,H=v("hashN")||"a few";
const col=`primary color ${hex("c1")}, secondary color ${hex("c2")} and accent color ${hex("c3")}`;
const frame=v("frame")==="none"?"Do not use a personal photo; focus entirely on the game world.":`Use the photo I upload as the main subject; framing: ${o("frame")}, facial expression: ${o("expr")}, positioned ${o("position")}. Keep my face identity and hairstyle.`;
const p1=`Create a professional, high-click-potential 16:9 ${o("resolution")} YouTube gaming thumbnail about the game “${game}”. Video topic: ${topic}.${ctx?" Extra context: "+ctx+".":""} Use ${o("background")} as the background; do not add unrelated objects or environments from other games. Apply the color palette with ${col}. Visual style: ${o("style")}. Use exactly this text on the image: “${thumb}”. The text should be ${o("textstyle")}; text color ${hex("tc")}, outline color ${hex("oc")}, shadow color ${hex("sc")}. ${frame} Keep the composition balanced, make the main subject stand out, keep the text readable on mobile and avoid clutter.${v("extra")?" Extra instructions: "+v("extra"):""}`;
const p2=`You are an experienced YouTube gaming content strategist. Write engaging English YouTube titles for a video about “${game}”.\n\nVideo topic: ${topic}\nText on the thumbnail: ${thumb}${v("keywords")?"\nKeywords to emphasize: "+v("keywords"):""}${ctx?"\nExtra context: "+ctx:""}\n\nGive ${N} different title ideas. Titles should match the real content, spark curiosity, and be natural and easy to read. Instead of repeating the thumbnail text word for word, write titles that complement it. Avoid misleading claims and unrelated keywords. Pick the best 3 and explain in one sentence why each could work.`;
const links=[];if(v("youtube"))links.push("YouTube: "+v("youtube"));if(v("tiktok"))links.push("TikTok: "+v("tiktok"));if(v("instagram"))links.push("Instagram: "+v("instagram"));if(v("other"))links.push("Other links: "+v("other"));
const p3=`You are a content writer who prepares YouTube descriptions for gaming channels. Write a natural, well-organized, ${o("tone")} English description for a video about “${game}”.\n\nVideo topic: ${topic}${ctx?"\nExtra context: "+ctx:""}${v("descinfo")?"\nInformation to include: "+v("descinfo"):""}${links.length?"\nSocial accounts and links to include:\n- "+links.join("\n- "):"\nNo social links were provided; do not invent any."}${v("cta")?"\nCall to action: "+v("cta"):""}\n\nIntroduce the video in the first two sentences. Format paragraphs and social links so they are easy to read. Do not invent links, usernames, episode details or game content that was not provided. Add ${H} relevant hashtags naturally without spamming keywords. Give only the ready-to-use description.`;
return [p1,p2,p3];
}
function promptsTR(){
const game=v("game")||"belirtilen oyun",topic=v("topic")||"belirtilen video konusu",ctx=v("context"),thumb=v("thumb")||"görselde metin kullanma";
const colors=`ana renk ${hex("c1")}, ikinci renk ${hex("c2")} ve vurgu rengi ${hex("c3")}`;
const frame=v("frame")==="none"?"Kişisel fotoğraf kullanma; odağı tamamen oyun dünyasına ver.":`Yüklediğim fotoğrafı ana özne olarak kullan; kadraj ${v("frame")}, yüz ifadesi ${v("expr")} olsun ve fotoğraf ${v("position")} yer alsın. Yüz kimliğimi ve saç stilimi koru.`;
const p1=`“${game}” oyunu hakkında, 16:9 oranında, ${v("resolution")} profesyonel ve yüksek tıklanma potansiyeline sahip bir YouTube oyun thumbnail’i oluştur. Video konusu: ${topic}.${ctx?" Ek bağlam: "+ctx+".":""} Arka planda ${v("background")} kullan; oyuna ait olmayan alakasız nesneler veya başka oyunlardan ortamlar ekleme. Renk paletini ${colors} olacak şekilde uygula. Görsel tarzı ${v("style")}. Görselde tam olarak şu metni kullan: “${thumb}”. Yazı ${v("textstyle")} olsun; yazı rengi ${hex("tc")}, kenarlık rengi ${hex("oc")}, gölge rengi ${hex("sc")} olsun. ${frame} Kompozisyonu dengeli tut, ana konuyu belirginleştir, metni mobil ekranda okunabilir yap ve gereksiz kalabalıktan kaçın.${v("extra")?" Ek talimatlar: "+v("extra"):""}`;
const p2=`Sen deneyimli bir YouTube oyun içerik stratejistisin. “${game}” oyunu için aşağıdaki videoya uygun, Türkçe ve ilgi çekici YouTube başlıkları üret.\n\nVideo konusu: ${topic}\nThumbnail üzerinde yazan metin: ${thumb}${v("keywords")?"\nÖzellikle vurgulanacak kelimeler: "+v("keywords"):""}${ctx?"\nEk bağlam: "+ctx:""}\n\n${v("titleN")||10} farklı başlık önerisi sun. Başlıklar gerçek içerikle uyumlu, merak uyandırıcı, doğal ve kolay okunur olsun. Thumbnail metnini kelimesi kelimesine tekrar etmek yerine onunla birbirini tamamlayan başlıklar üret. Yanıltıcı iddialardan ve alakasız anahtar kelimelerden kaçın. En iyi 3 öneriyi seç ve her birinin neden işe yarayabileceğini bir cümleyle açıkla.`;
const links=[];
if(v("youtube"))links.push("YouTube: "+v("youtube"));
if(v("tiktok"))links.push("TikTok: "+v("tiktok"));
if(v("instagram"))links.push("Instagram: "+v("instagram"));
if(v("other"))links.push("Diğer bağlantılar: "+v("other"));
const p3=`Sen Türkçe oyun kanalları için YouTube açıklamaları hazırlayan bir içerik yazarısın. “${game}” oyunu videosu için doğal, düzenli ve ${v("tone")} bir açıklama yaz.\n\nVideo konusu: ${topic}${ctx?"\nEk bağlam: "+ctx:""}${v("descinfo")?"\nAçıklamada anlatılacak bilgiler: "+v("descinfo"):""}${links.length?"\nAçıklamaya eklenecek sosyal hesaplar ve bağlantılar:\n- "+links.join("\n- "):"\nSosyal medya bağlantısı verilmedi; bağlantı uydurma."}${v("cta")?"\nİzleyiciye çağrı: "+v("cta"):""}\n\nİlk iki cümlede videoyu tanıt. Paragrafları ve sosyal bağlantıları okunaklı düzenle. Verilmeyen bağlantıları, kullanıcı adlarını, bölüm bilgilerini veya oyun içeriğini uydurma. Doğal ${v("hashN")?v("hashN")+" adet":"birkaç"} ilgili hashtag ekle; anahtar kelimeleri spam gibi tekrarlama. Yalnızca kullanıma hazır açıklamayı ver.`;
return [p1,p2,p3];
}

function render(){
const ps=prompts();
ps.forEach((p,i)=>{$("p"+(i+1)).textContent=p;$("n"+(i+1)).textContent=p.length+" karakter";});
colorIds.forEach(id=>{$(id+"v").textContent=hex(id);});
["sw1","sw2","sw3"].forEach((id,i)=>{$(id).style.background=$("c"+(i+1)).value;});
const noPhoto=v("frame")==="none";
$("exprwrap").classList.toggle("hidden",noPhoto);
$("poswrap").classList.toggle("hidden",noPhoto);
}

async function copy(text){
try{await navigator.clipboard.writeText(text);say("Panoya kopyalandı.");}
catch(e){
const a=document.createElement("textarea");a.value=text;a.style.cssText="position:fixed;opacity:0";document.body.appendChild(a);a.select();
let ok=false;try{ok=document.execCommand("copy");}catch(_){}
a.remove();say(ok?"Panoya kopyalandı.":"Kopyalama başarısız; metni elle seçip kopyalayabilirsin.");
}
}
function bundle(){return "=== THUMBNAIL PROMPTU ===\n"+$("p1").textContent+"\n\n=== BAŞLIK PROMPTU ===\n"+$("p2").textContent+"\n\n=== AÇIKLAMA PROMPTU ===\n"+$("p3").textContent;}

document.querySelectorAll("[data-preset]").forEach(b=>b.addEventListener("click",()=>usePreset(b.dataset.preset)));
["c1","c2","c3"].forEach(id=>$(id).addEventListener("input",()=>markPreset("custom")));
$("form").addEventListener("input",render);
$("form").addEventListener("change",render);
document.querySelectorAll("[data-copy]").forEach(b=>b.addEventListener("click",()=>copy($(b.dataset.copy).textContent)));
$("copyall").addEventListener("click",()=>copy(bundle()));
$("download").addEventListener("click",()=>saveFile("prompt-lab-youtube-prompts.txt",bundle(),"Üç prompt .txt dosyasına kaydedildi."));
$("reset").addEventListener("click",()=>{
["game","topic","context","thumb","keywords","descinfo","youtube","tiktok","instagram","other","cta"].forEach(id=>{$(id).value="";});
["style","textstyle","expr","position","background","resolution","tone"].forEach(id=>{$(id).selectedIndex=0;});
$("frame").value="kafa ve omuzlar";
$("extra").value=DEFAULT_EXTRA;
$("tc").value="#ffe33d";$("oc").value="#111111";$("sc").value="#000000";
usePreset("orange");
say("Ayarlar sıfırlandı.");
});

/* ---- Projeler ---- */
const KEY="promptlab.projects.v1";
const FIELD_IDS=["game","topic","context","thumb","keywords","descinfo","youtube","tiktok","instagram","other","cta","extra","style","textstyle","frame","expr","position","background","resolution","tone","lang","titleN","hashN","status","pubdate","tags","notes",...colorIds];
const DEFAULTS={};FIELD_IDS.forEach(id=>{DEFAULTS[id]=$(id).value;});
let projects=[],currentId=null,folders=[],tab="all",openFolder=null,popId=null,toastTimer,onSettings=false;
const FKEY="promptlab.folders.v1";
const cur=()=>projects.find(p=>p.id===currentId);
const fmt=t=>new Date(t).toLocaleDateString("tr-TR",{day:"numeric",month:"short",year:"numeric"});
function el(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;}
function loadAll(){try{const d=JSON.parse(localStorage.getItem(KEY));if(Array.isArray(d))projects=d.filter(p=>p&&p.id&&p.values).map(p=>({...p,touched:true}));}catch(e){}try{const f=JSON.parse(localStorage.getItem(FKEY));if(Array.isArray(f))folders=f.filter(x=>x&&x.id&&x.name);}catch(e){}}
function saveFLocal(){try{localStorage.setItem(FKEY,JSON.stringify(folders));}catch(e){}}
function saveFolders(){saveFLocal();syncSoon();}
function saveLocal(){try{localStorage.setItem(KEY,JSON.stringify(projects.filter(p=>p.touched)));}catch(e){}}
function saveAll(){saveLocal();syncSoon();}
let dirty=false,pending=null;
function syncSave(){const on=dirty&&!!cur();$("saveBtn").classList.toggle("primary",on);$("saveBtn").classList.toggle("secondary",!on);$("saveFab").hidden=!on||$("viewEditor").hidden;$("dirtyTag").hidden=!on;}
function saveProject(){
const p=cur();if(!p)return;
p.values={};FIELD_IDS.forEach(id=>{p.values[id]=$(id).value;});
p.preset=pal;p.name=v("game")||"Adsız proje";p.touched=true;p.updated=Date.now();
dirty=false;saveAll();$("projName").textContent=p.name;renderNav();syncSave();toast("Kaydedildi: "+p.name);
}
function persist(e){if(loading||!cur()||(e&&e.target&&e.target.id==="tplName"))return;dirty=true;syncSave();$("projName").textContent=v("game")||"Adsız proje";}
function show(view){onSettings=view==="settings";document.documentElement.dataset.view=view;selMode=false;sel.clear();const VIEWS={home:"viewHome",editor:"viewEditor",settings:"viewSettings",ai:"viewAI"};Object.entries(VIEWS).forEach(([v,id])=>{const n=$(id);if(n)n.hidden=v!==view;});selUpdate();window.scrollTo(0,0);document.dispatchEvent(new CustomEvent("pl:view",{detail:view}));}
function leave(){const p=cur();if(p&&!p.touched)projects=projects.filter(x=>x!==p);currentId=null;dirty=false;syncSave();}
function showHome(){leave();show("home");renderTabs();renderHome();renderNav();closeDrawer();}
function openProject(id){
if(id===currentId){closeDrawer();return;}
const p=projects.find(x=>x.id===id);if(!p)return;
leave();currentId=id;loading=true;
FIELD_IDS.forEach(k=>{$(k).value=p.values[k]!==undefined?p.values[k]:DEFAULTS[k];});
markPreset(p.preset||"orange");render();loading=false;
$("projName").textContent=p.name;syncTools();show("editor");syncSave();renderNav();closeDrawer();
}
function newProject(fid){
leave();$("q").value="";$("searchbar").hidden=true;
const p={id:"p"+Date.now().toString(36)+Math.random().toString(36).slice(2,6),name:"Adsız proje",values:{...DEFAULTS,...chVals()},preset:"orange",updated:Date.now(),touched:false,fav:false,locked:false,trashed:null,folderId:fid||null};
projects.push(p);openProject(p.id);
}
const live=()=>projects.filter(p=>p.touched&&!p.trashed);
const trashed=()=>projects.filter(p=>p.touched&&p.trashed);
const ST=["Fikir","Çekildi","Kurgu","Yayında"];let sortMode="upd",statusF="";
const sk=p=>ST.indexOf(p.values.status||"Fikir");
const sortP=a=>a.sort((x,y)=>(y.fav?1:0)-(x.fav?1:0)||(sortMode==="name"?x.name.localeCompare(y.name,"tr"):sortMode==="date"?(y.values.pubdate||"").localeCompare(x.values.pubdate||""):sortMode==="status"?sk(x)-sk(y):y.updated-x.updated));
function commit(anim){saveAll();renderHome(anim);renderNav();renderTabs();}
function arm(b,label,fn){b.onclick=()=>{if(b.dataset.arm){fn();return;}b.dataset.arm="1";b.textContent="Emin misin?";setTimeout(()=>{if(b.isConnected){delete b.dataset.arm;b.textContent=label;}},3000);};}
function toast(msg,undo){const t=$("toast");t.textContent="";t.append(el("span",null,msg));if(undo){const b=el("button","tundo","Geri al");b.type="button";b.onclick=()=>{undo();t.hidden=true;};t.append(b);}t.hidden=false;t.style.animation="none";void t.offsetWidth;t.style.animation="";clearTimeout(toastTimer);toastTimer=setTimeout(()=>{t.hidden=true;},5000);}
function syncTools(){const p=cur();if(!p)return;const f=$("favBtn"),l=$("lockBtn"),d=$("delBtn");f.textContent=p.fav?"★ Favori":"☆ Favori";f.setAttribute("aria-pressed",!!p.fav);l.textContent=p.locked?"🔒 Kilitli":"🔓 Kilitle";l.setAttribute("aria-pressed",!!p.locked);d.disabled=!!p.locked;d.title=p.locked?"Kilitli proje silinemez":"";}
function toggleFav(p){p.fav=!p.fav;p.mod=Date.now();popId=p.fav?p.id:null;commit(false);syncTools();}
function toggleLock(p){p.locked=!p.locked;p.mod=Date.now();commit(false);syncTools();toast(p.locked?"Proje kilitlendi, silinemez.":"Kilit açıldı.");}
function moveTo(p,fid){p.folderId=fid;p.mod=Date.now();commit(false);toast(fid?"Kitaplığa taşındı: "+folders.find(f=>f.id===fid).name:"Kitaplıktan çıkarıldı.");}
function trash(p,card){
if(p.locked){toast("Kilitli proje silinemez. Önce kilidi aç.");return;}
const done=()=>{p.trashed=Date.now();p.mod=Date.now();if(currentId===p.id){currentId=null;dirty=false;syncSave();}saveAll();if($("viewHome").hidden)showHome();else commit(false);toast("“"+p.name+"” çöp kutusuna taşındı.",()=>{p.trashed=null;p.mod=Date.now();commit(false);});};
if(card){card.classList.add("out");setTimeout(done,240);}else done();
}
function closeMenu(){$("menu").hidden=true;}
function openMenu(anchor,p){
const m=$("menu");
const it=(label,fn,dis)=>{const b=el("button","mi",label);b.type="button";b.disabled=!!dis;b.onclick=fn;m.append(b);};
const sub=()=>{m.textContent="";it("← Geri",root);
if(!folders.length)m.append(el("p","mnote","Henüz kitaplık yok. Kitaplıklar sekmesinden oluştur."));
folders.forEach(f=>it((p.folderId===f.id?"✓ ":"")+"📁 "+f.name,()=>{closeMenu();moveTo(p,f.id);}));
if(p.folderId)it("Kitaplıktan çıkar",()=>{closeMenu();moveTo(p,null);});};
const root=()=>{m.textContent="";
it(p.fav?"☆ Favoriden çıkar":"★ Favoriye ekle",()=>{closeMenu();toggleFav(p);});
it(p.locked?"🔓 Kilidi aç":"🔒 Kilitle (silinemesin)",()=>{closeMenu();toggleLock(p);});
it("⧉ Kopyala (yeni bölüm)",()=>{closeMenu();dupe(p);});
it("📁 Kitaplığa taşı",sub);
it(p.locked?"🗑 Çöp kutusu (kilitli)":"🗑 Çöp kutusuna taşı",()=>{closeMenu();trash(p,anchor.closest(".card"));},p.locked);};
root();m.hidden=false;
const r=anchor.getBoundingClientRect(),w=Math.min(250,innerWidth-16);
m.style.width=w+"px";m.style.left=Math.max(8,Math.min(r.right-w,innerWidth-w-8))+"px";
const h=m.offsetHeight;m.style.top=(r.bottom+6+h>innerHeight?Math.max(8,r.top-h-6):r.bottom+6)+"px";
}
function projCard(p,i){lastIds.push(p.id);
const c=el("div","card"),m=el("button","cardmain"),sw=el("div","swatches"),t=el("div","cardtools");
c.style.setProperty("--i",Math.min(i,10));m.type="button";
["c1","c2","c3"].forEach(k=>{const x=document.createElement("i");x.style.background=p.values[k]||DEFAULTS[k];sw.append(x);});
const f=folders.find(x=>x.id===p.folderId);
const row=el("div","meta"),tg=(p.values.tags||"").split(",").map(x=>x.trim()).filter(Boolean),cx=p.values.context;
row.append(el("span","badge b"+Math.max(0,sk(p)),p.values.status||"Fikir"));if(p.values.pubdate)row.append(el("span",null,"📅 "+fmt(p.values.pubdate)));
m.append(el("strong",null,(p.locked?"🔒 ":"")+p.name),row,el("span","snip",(p.values.topic||"").slice(0,80)||"Konu henüz yazılmadı."));
if(tg.length){const tr=el("small","tags");tg.forEach(t=>{const c=el("span","tagchip","# "+t);c.setAttribute("role","button");c.tabIndex=0;c.title="Bu etikete göre filtrele";c.onclick=e=>{e.stopPropagation();if(selMode)return;tagF=t.toLowerCase();if(tab!=="all"&&tab!=="fav"&&!(tab==="lib"&&openFolder))tab="all";renderTabs();renderHome(false);renderNav();};tr.append(c);});m.append(tr);}
m.append(sw,el("small",null,(cx?cx+" · ":"")+fmt(p.updated)+(f?" · 📁 "+f.name:"")));
const st=el("button","tool star"+(p.fav?" on":"")+(popId===p.id?" pop":""),p.fav?"★":"☆");st.type="button";st.setAttribute("aria-label",p.fav?"Favoriden çıkar":"Favoriye ekle");st.onclick=()=>toggleFav(p);
const mo=el("button","tool more","⋯");mo.type="button";mo.setAttribute("aria-label","Proje işlemleri");mo.onclick=e=>{e.stopPropagation();openMenu(mo,p);};
t.append(st,mo);c.append(m,t);c.draggable=true;c.ondragstart=e=>{e.dataTransfer.setData("text/plain",p.id);e.dataTransfer.effectAllowed="move";};c.append(el("span","chk","✓"));if(sel.has(p.id))c.classList.add("sel");
m.onclick=()=>{if(selMode){if(sel.has(p.id))sel.delete(p.id);else sel.add(p.id);c.classList.toggle("sel",sel.has(p.id));selUpdate();return;}openProject(p.id);};
c.oncontextmenu=e=>{e.preventDefault();if(!selMode)openMenu(mo,p);};
return c;
}
function folderCard(f,i){
const c=el("div","card"),m=el("button","cardmain"),n=live().filter(p=>p.folderId===f.id).length;
c.style.setProperty("--i",Math.min(i,10));m.type="button";
m.append(el("span","fico","📁"),el("strong",null,f.name),el("small",null,n+" proje"));
m.onclick=()=>{openFolder=f.id;renderHome(true);};c.append(m);return c;
}
function trashCard(p,i){
const c=el("div","card trashed"),m=el("div","cardmain"),r=el("div","trow"),b1=el("button","btn secondary","Geri yükle"),b2=el("button","btn secondary","Kalıcı sil");
c.style.setProperty("--i",Math.min(i,10));b1.type=b2.type="button";
b1.onclick=()=>{p.trashed=null;p.mod=Date.now();commit(false);toast("Geri yüklendi: "+p.name);};
arm(b2,"Kalıcı sil",()=>{projects=projects.filter(x=>x!==p);commit(false);});
r.append(b1,b2);m.append(el("strong",null,p.name),el("small",null,"Silinme: "+fmt(p.trashed)),r);c.append(m);return c;
}
function renderTabs(){
document.querySelectorAll("#bnav [data-bn]").forEach(b=>b.classList.toggle("on",b.dataset.bn===tab));
{const hs=$("heroSub");if(hs){const L=live();hs.textContent=document.documentElement.classList.contains("phone")?(L.length?L.length+" proje · "+L.filter(p=>(p.values.status||"Fikir")==="Yayında").length+" yayında · "+L.filter(p=>p.fav).length+" favori":"İlk projeni oluşturmak için + düğmesine bas."):hs.dataset.o;}}
const n={all:live().length,fav:live().filter(p=>p.fav).length,cal:live().filter(p=>p.values.pubdate).length,stats:"",lib:folders.length,trash:trashed().length};
document.querySelectorAll("#tabs .tab").forEach(b=>{const t=b.dataset.tab;b.classList.toggle("on",t===tab);b.setAttribute("aria-selected",t===tab);b.querySelector("i").textContent=n[t];});
}
function renderHome(anim=true){
const box=$("cards"),head=$("homehead");box.textContent="";head.textContent="";if(anim){selMode=false;sel.clear();}lastIds.length=0;box.classList.toggle("still",!anim);box.classList.toggle("list",S.view==="list");box.classList.toggle("selmode",selMode);
const term=$("q").value.trim().toLocaleLowerCase("tr");
$("tabs").hidden=!!term;$("libbar").hidden=!(tab==="lib"&&!openFolder&&!term);
$("toolbar").hidden=!(!term&&(tab==="all"||tab==="fav"||(tab==="lib"&&openFolder)));
$("tagChip").hidden=!tagF;$("tagChip").textContent="# "+tagF+"  ✕";$("viewBtn").textContent=S.view==="list"?"▦ Izgara":"☰ Liste";$("selBtn").textContent=selMode?"✓ Bitti":"☑ Seç";selUpdate();
let msg="";
if(term){const l=sortP(live().filter(p=>(p.name+" "+(p.values.topic||"")+" "+(p.values.tags||"")+" "+(p.values.notes||"")+" "+(p.values.context||"")).toLocaleLowerCase("tr").includes(term)));l.forEach((p,i)=>box.append(projCard(p,i)));msg="Bu aramayla eşleşen proje yok.";}
else if(tab==="stats"){renderStats(box);}
else if(tab==="cal"){renderCal(box);}
else if(tab==="trash"){const t=trashed().sort((a,b)=>b.trashed-a.trashed);
if(t.length){const b=el("button","btn secondary","Çöp kutusunu boşalt");b.type="button";arm(b,"Çöp kutusunu boşalt",()=>{projects=projects.filter(p=>!(p.touched&&p.trashed));commit(false);toast("Çöp kutusu boşaltıldı.");});head.append(el("span","pname","Çöp kutusu · "+t.length+" proje"),b);}
t.forEach((p,i)=>box.append(trashCard(p,i)));msg="Çöp kutusu boş.";}
else if(tab==="lib"&&!openFolder){folders.forEach((f,i)=>box.append(folderCard(f,i)));msg="Henüz kitaplık yok. Yukarıdan bir kitaplık oluştur (örn. Dönerci).";}
else{
const f=tab==="lib"?folders.find(x=>x.id===openFolder):null;
if(tab==="lib"&&!f)openFolder=null;
if(f){const back=el("button","btn secondary","← Kitaplıklar"),del=el("button","btn secondary","Kitaplığı sil");back.type=del.type="button";
back.onclick=()=>{openFolder=null;renderHome(true);};
arm(del,"Kitaplığı sil",()=>{projects.forEach(p=>{if(p.folderId===f.id){p.folderId=null;p.mod=Date.now();}});folders=folders.filter(x=>x!==f);openFolder=null;saveFolders();commit(true);toast("Kitaplık silindi. İçindeki projeler Tümü sekmesine döndü.");});
head.append(back,el("span","pname","📁 "+f.name),del);}
let src=live().filter(p=>(!statusF||(p.values.status||"Fikir")===statusF)&&(!tagF||ptags(p).includes(tagF)));if(tab==="fav")src=src.filter(p=>p.fav);if(f)src=src.filter(p=>p.folderId===f.id);
if(tab==="all"||f){const add=el("button","card add");add.type="button";add.append(el("span","plus","+"),el("strong",null,"Yeni proje"));add.onclick=()=>newProject(f&&f.id);box.append(add);}
sortP(src).forEach((p,i)=>box.append(projCard(p,i+1)));
msg=tab==="fav"?"Henüz favori proje yok. Bir projenin yıldızına dokun.":"";
}
head.hidden=!head.childNodes.length;
$("empty").textContent=msg;$("empty").hidden=!(msg&&!box.childNodes.length);
popId=null;renderDrop();
}
function renderNav(){
const ul=$("navlist");ul.textContent="";
const item=(label,on,fn)=>{const li=el("li"),b=el("button","navitem"+(on?" on":""),label);b.type="button";b.onclick=fn;li.append(b);ul.append(li);};
const go=t=>()=>{tab=t;openFolder=null;tagF="";showHome();};
[["Ana menü","all"],["★ Favoriler","fav"],["📁 Kitaplıklar","lib"],["🗑 Çöp kutusu","trash"],["📊 İstatistik","stats"]].forEach(([l,t])=>item(l,!currentId&&!onSettings&&tab===t,go(t)));
item("✦ AI Studio",document.documentElement.dataset.view==="ai",showAI);
item("⚙ Ayarlar",onSettings,showSettings);
item("❓ Eğitimi başlat",false,startTour);
document.querySelectorAll(".tnav [data-goto]").forEach(b=>{const g=b.dataset.goto,vw=document.documentElement.dataset.view;b.classList.toggle("on",(g==="home"&&vw==="home")||(g==="ai"&&vw==="ai")||(g==="settings"&&vw==="settings"));});
ul.append(el("li","navsep","Projeler"));
sortP(projects.filter(p=>(p.touched&&!p.trashed)||p.id===currentId)).forEach(p=>item((p.fav?"★ ":"")+(p.locked?"🔒 ":"")+p.name,p.id===currentId,()=>openProject(p.id)));
}
function openDrawer(){renderNav();$("drawer").classList.add("open");$("scrim").hidden=false;$("menuBtn").setAttribute("aria-expanded","true");}
function closeDrawer(){$("drawer").classList.remove("open");$("scrim").hidden=true;$("menuBtn").setAttribute("aria-expanded","false");}

$("menuBtn").onclick=()=>$("drawer").classList.contains("open")?closeDrawer():openDrawer();
$("scrim").onclick=closeDrawer;
$("addBtn").onclick=()=>newProject();$("navNew").onclick=()=>{closeDrawer();newProject();};
$("backBtn").onclick=showHome;
$("searchBtn").onclick=()=>{
const bar=$("searchbar");
if(!bar.hidden&&!$("viewHome").hidden){bar.hidden=true;$("q").value="";renderHome();}
else{bar.hidden=false;if(!$("viewHome").hidden)renderHome();else showHome();$("q").focus();}
};
$("q").addEventListener("input",()=>{if($("viewHome").hidden)showHome();else renderHome(false);});
document.addEventListener("keydown",e=>{if(e.key==="Escape"){closeDrawer();closeMenu();}});
$("delBtn").onclick=()=>{const p=cur();if(p)trash(p);};
$("favBtn").onclick=()=>{const p=cur();if(p)toggleFav(p);};
$("lockBtn").onclick=()=>{const p=cur();if(p)toggleLock(p);};
document.querySelectorAll("#tabs .tab").forEach(b=>b.onclick=()=>{tab=b.dataset.tab;openFolder=null;tagF="";renderTabs();renderHome(true);renderNav();});
function addFolder(){const n=$("fname").value.trim();if(!n)return;folders.push({id:"f"+Date.now().toString(36)+Math.random().toString(36).slice(2,5),name:n,mod:Date.now()});$("fname").value="";saveFolders();renderTabs();renderHome(true);toast("Kitaplık oluşturuldu: "+n);}
$("fadd").onclick=addFolder;$("fname").addEventListener("keydown",e=>{if(e.key==="Enter")addFolder();});
document.addEventListener("click",e=>{if(!e.composedPath().includes($("menu")))closeMenu();});
window.addEventListener("scroll",closeMenu,true);window.addEventListener("resize",closeMenu);
$("form").addEventListener("input",persist);
$("form").addEventListener("change",persist);
$("form").addEventListener("click",e=>{if(e.target.closest("[data-preset]"))persist();});
$("reset").addEventListener("click",persist);

/* ---- Ayarlar ---- */
const SKEY="promptlab.settings.v1";
const SDEF={mode:"system",accent:"",radius:14,size:1,motion:true,theme:"",view:"grid"};
const ACC=[["Varsayılan",""],["Mavi","#2f7bff"],["Turkuaz","#14b8a6"],["Yeşil","#22a55b"],["Turuncu","#f97316"],["Kırmızı","#e5384a"],["Pembe","#e0479e"],["Altın","#d99a06"]];
const THEMES=[{id:"",n:"Varsayılan"},{id:"gece",n:"Gece mavisi",dark:1,c:["#0a1020","#111a30","#0c1426","#25324f","#eaf0ff","#93a3c7"]},{id:"orman",n:"Orman yeşili",dark:1,c:["#0b1410","#12201a","#0e1a14","#25392f","#e9f5ee","#94b1a1"]},{id:"bordo",n:"Bordo",dark:1,c:["#170b10","#231218","#1c0e13","#43222c","#fbeef1","#c49aa6"]},{id:"amoled",n:"Siyah (AMOLED)",dark:1,c:["#000000","#0b0b0b","#050505","#262626","#f5f5f5","#9a9a9a"]},{id:"krem",n:"Krem",dark:0,c:["#f7f1e5","#fffaf0","#f1e9d8","#e0d4bb","#2a2418","#7a6e55"]},{id:"buz",n:"Buz mavisi",dark:0,c:["#eef5fb","#ffffff","#e6eff8","#cfdeed","#12233a","#5a7090"]}];
let S={...SDEF};
function loadS(){try{const d=JSON.parse(localStorage.getItem(SKEY));if(d&&typeof d==="object")S={...SDEF,...d};}catch(e){}}
function saveS(){try{localStorage.setItem(SKEY,JSON.stringify(S));}catch(e){}}
function ink(h){const n=parseInt(h.slice(1),16),r=n>>16,g=(n>>8)&255,b=n&255;return(0.299*r+0.587*g+0.114*b)>150?"#14102a":"#ffffff";}
function applyS(){
const r=document.documentElement,st=r.style;
const th=THEMES.find(t=>t.c&&t.id===S.theme);
if(th)r.setAttribute("data-theme",th.dark?"dark":"light");else if(S.mode==="system")r.removeAttribute("data-theme");else r.setAttribute("data-theme",S.mode);
["--bg","--p","--p2","--line","--text","--muted"].forEach((k,i)=>{if(th)st.setProperty(k,th.c[i]);else st.removeProperty(k);});
if(/^#[0-9a-f]{6}$/i.test(S.accent)){st.setProperty("--accent",S.accent);st.setProperty("--accent-ink",ink(S.accent));st.setProperty("--soft","color-mix(in srgb,var(--accent) 18%,var(--p))");st.setProperty("--ring","color-mix(in srgb,var(--accent) 40%,transparent)");}
else["--accent","--accent-ink","--soft","--ring"].forEach(k=>st.removeProperty(k));
st.setProperty("--r",S.radius+"px");st.setProperty("--ts",S.size);
r.setAttribute("data-motion",S.motion?"on":"off");
[["segMode","mode"],["segRadius","radius"],["segSize","size"],["segMotion","motion"]].forEach(([id,k])=>$(id).querySelectorAll("button").forEach(b=>b.setAttribute("aria-pressed",b.dataset.v===String(S[k]))));
document.querySelectorAll("#accents .sw").forEach(b=>b.setAttribute("aria-pressed",b.dataset.c===S.accent));
const custom=S.accent&&!ACC.some(a=>a[1]===S.accent);
$("accCustomWrap").classList.toggle("on",!!custom);if(S.accent)$("accCustom").value=S.accent;
document.querySelectorAll("#themes .sw").forEach(b=>b.setAttribute("aria-pressed",b.dataset.t===S.theme));
syncBars();
}
function showSettings(){leave();show("settings");renderNav();closeDrawer();}
ACC.forEach(([n,c])=>{const b=el("button","sw");b.type="button";b.dataset.c=c;b.title=n;b.setAttribute("aria-label",n);b.style.background=c||"linear-gradient(135deg,#6a45f5,#a78bfa)";b.onclick=()=>{S.accent=c;saveS();applyS();};$("accents").insertBefore(b,$("accCustomWrap"));});
THEMES.forEach(t=>{const b=el("button","sw");b.type="button";b.dataset.t=t.id;b.title=t.n;b.setAttribute("aria-label",t.n);b.style.background=t.c?"linear-gradient(135deg,"+t.c[0]+" 50%,"+t.c[1]+" 50%)":"linear-gradient(135deg,#f4f5fa 50%,#141720 50%)";b.onclick=()=>{S.theme=t.id;saveS();applyS();};$("themes").append(b);});
$("accCustom").addEventListener("input",e=>{S.accent=e.target.value.toLowerCase();saveS();applyS();});
[["segMode","mode"],["segRadius","radius"],["segSize","size"],["segMotion","motion"]].forEach(([id,k])=>$(id).querySelectorAll("button").forEach(b=>b.onclick=()=>{S[k]=k==="motion"?b.dataset.v==="true":k==="mode"?b.dataset.v:+b.dataset.v;saveS();applyS();}));
$("setReset").onclick=()=>{S={...SDEF};saveS();applyS();toast("Ayarlar varsayılana döndü.");};
$("setBtn").onclick=showSettings;$("setBack").onclick=showHome;

/* ---- Yeni ozellikler ---- */
const CKEY="promptlab.channel.v1",CH_MAP={chYoutube:"youtube",chTiktok:"tiktok",chInstagram:"instagram",chOther:"other",chCta:"cta"};
let channel={},dlCap,cal={y:new Date().getFullYear(),m:new Date().getMonth()};
const chVals=()=>Object.fromEntries(Object.entries(channel).filter(([k,x])=>x&&k!=="_mod"));
const newId=()=>"p"+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const ymd=(y,m,d)=>y+"-"+String(m+1).padStart(2,"0")+"-"+String(d).padStart(2,"0");
function loadCh(){try{const d=JSON.parse(localStorage.getItem(CKEY));if(d&&typeof d==="object")channel=d;}catch(e){}Object.entries(CH_MAP).forEach(([id,k])=>{$(id).value=channel[k]||"";});}
function saveCh(){Object.entries(CH_MAP).forEach(([id,k])=>{channel[k]=$(id).value.trim();});channel._mod=Date.now();syncSoon();try{localStorage.setItem(CKEY,JSON.stringify(channel));}catch(e){}}
Object.keys(CH_MAP).forEach(id=>$(id).addEventListener("input",saveCh));
$("chFill").onclick=()=>{Object.entries(channel).forEach(([k,x])=>{if(x&&k!=="_mod")$(k).value=x;});render();persist();say(Object.keys(chVals()).length?"Kanal bilgilerin eklendi.":"Önce Ayarlar sayfasında kanal bilgilerini doldur.");};

async function nativeSave(name,text,ok){
const C=window.Capacitor,P=C&&C.Plugins;
if(!(C&&C.isNativePlatform&&C.isNativePlatform()&&P&&P.Filesystem&&P.Share))return false;
try{
const r=await P.Filesystem.writeFile({path:name,data:text,directory:"CACHE",encoding:"utf8"});
await P.Share.share({title:name,url:r.uri,dialogTitle:"Kaydet veya paylaş"});say(ok);return true;
}catch(e){
if(/cancel/i.test(String((e&&e.message)||e)))return true;
try{await P.Share.share({title:name,text});return true;}catch(_){return false;}
}
}
async function saveFile(name,text,ok){
if(await nativeSave(name,text,ok))return;
try{dlCap=dlCap||(window.claude?await window.claude.use("downloads"):null);}catch(e){dlCap=null;}
if(dlCap){try{await dlCap.save({filename:name,data:text});say(ok);}catch(e){if(!e||e.code!=="declined")say("Dosya kaydedilemedi.");}return;}
const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([text],{type:"text/plain;charset=utf-8"}));a.download=name;document.body.appendChild(a);a.click();a.remove();say(ok);
}
const backupData=()=>JSON.stringify({app:"prompt-olustur",v:1,exported:Date.now(),projects:projects.filter(p=>p.touched),folders,tpls,settings:S,channel},null,1);
$("bkSave").onclick=()=>saveFile("prompt-olustur-yedek-"+ymd(new Date().getFullYear(),new Date().getMonth(),new Date().getDate())+".json",backupData(),"Yedek dosyası kaydedildi.");
$("bkCopy").onclick=()=>copy(backupData());
function restore(txt){
try{const d=JSON.parse(txt);if(!d||d.app!=="prompt-olustur")throw 0;let add=0;
(d.projects||[]).forEach(p=>{if(!p||!p.id||!p.values)return;const i=projects.findIndex(x=>x.id===p.id);if(i<0){projects.push({...p,touched:true});add++;}else if((p.updated||0)>(projects[i].updated||0))projects[i]={...p,touched:true};});
(d.folders||[]).forEach(f=>{if(f&&f.id&&f.name&&!folders.some(x=>x.id===f.id))folders.push(f);});
(d.tpls||[]).forEach(t=>{if(t&&t.id&&t.name&&t.v&&!tpls.some(x=>x.id===t.id))tpls.push(t);});
if(d.settings&&typeof d.settings==="object"){S={...SDEF,...d.settings};saveS();applyS();}
if(d.channel&&typeof d.channel==="object"){channel=d.channel;try{localStorage.setItem(CKEY,JSON.stringify(channel));}catch(e){}loadCh();}
saveAll();saveFolders();saveTpls();renderTpls();renderTabs();renderNav();toast("Yedek geri yüklendi: "+add+" yeni proje eklendi.");
}catch(e){toast("Bu dosya geçerli bir Prompt Olustur yedeği değil.");}
}
$("bkFile").onchange=async e=>{const f=e.target.files[0];if(f)restore(await f.text());e.target.value="";};
$("bkPaste").onclick=()=>{const t=$("bkText").value.trim();if(t){restore(t);$("bkText").value="";}};

function dupe(p){
const v2={...p.values};["topic","descinfo","thumb","chapters","notes","pubdate"].forEach(k=>{v2[k]="";});v2.status="Fikir";
let c=v2.context||"";
if(/(\d+)(\.\s*bölüm)/i.test(c))c=c.replace(/(\d+)(\.\s*bölüm)/i,(m,n,t)=>(+n+1)+t);
else if(/bölüm\s*\d+/i.test(c))c=c.replace(/(bölüm\s*)(\d+)/i,(m,t,n)=>t+(+n+1));
else c=(c?c+", ":"")+"2. bölüm";
v2.context=c;leave();
const n={id:newId(),name:p.name,values:v2,preset:p.preset,updated:Date.now(),touched:true,fav:false,locked:false,trashed:null,folderId:p.folderId||null};
projects.push(n);saveAll();openProject(n.id);toast("Yeni bölüm hazır. Konuyu yaz.");
}
$("dupBtn").onclick=()=>{const p=cur();if(p)dupe(p);};

function renderDrop(){
const d=$("dropbar");d.textContent="";
const show=!$("q").value.trim()&&(tab==="all"||tab==="fav")&&folders.length>0;d.hidden=!show;if(!show)return;
d.append(el("small",null,"Kartı sürükleyip bırak:"));
folders.forEach(f=>{const b=el("span","dropchip","📁 "+f.name);
b.ondragover=e=>{e.preventDefault();b.classList.add("over");};b.ondragleave=()=>b.classList.remove("over");
b.ondrop=e=>{e.preventDefault();b.classList.remove("over");const p=projects.find(x=>x.id===e.dataTransfer.getData("text/plain"));if(p)moveTo(p,f.id);};d.append(b);});
}
function renderCal(box){
const w=el("div","cal"),hd=el("div","calhead"),pv=el("button","btn secondary","‹"),nx=el("button","btn secondary","›"),g=el("div","calgrid");
pv.type=nx.type="button";pv.setAttribute("aria-label","Önceki ay");nx.setAttribute("aria-label","Sonraki ay");
const shift=d=>()=>{cal.m+=d;if(cal.m<0){cal.m=11;cal.y--;}if(cal.m>11){cal.m=0;cal.y++;}renderHome(false);};
pv.onclick=shift(-1);nx.onclick=shift(1);
hd.append(pv,el("strong",null,new Date(cal.y,cal.m,1).toLocaleDateString("tr-TR",{month:"long",year:"numeric"})),nx);w.append(hd);
["Pzt","Sal","Çar","Per","Cum","Cmt","Paz"].forEach(d=>g.append(el("small","dow",d)));
const first=(new Date(cal.y,cal.m,1).getDay()+6)%7,days=new Date(cal.y,cal.m+1,0).getDate(),t=new Date(),today=ymd(t.getFullYear(),t.getMonth(),t.getDate());
for(let i=0;i<first;i++)g.append(el("div","day dim"));
for(let d=1;d<=days;d++){const key=ymd(cal.y,cal.m,d),c=el("div","day"+(key===today?" today":""));c.append(el("span","dn",d));
live().filter(p=>p.values.pubdate===key).forEach(p=>{const b=el("button","chip b"+Math.max(0,sk(p)),p.name);b.type="button";b.title=p.name+" · "+(p.values.status||"Fikir");b.onclick=()=>openProject(p.id);c.append(b);});g.append(c);}
w.append(g);box.append(w);
if(!live().some(p=>p.values.pubdate))box.append(el("p","hint","Henüz yayın tarihi girilmiş proje yok. Bir projenin “Takip ve notlar” bölümünden tarih seçebilirsin."));
}
$("sortSel").onchange=e=>{sortMode=e.target.value;renderHome(false);};
$("statSel").onchange=e=>{statusF=e.target.value;renderHome(false);};

const TPL={korku:{c:["#c1121f","#0d0d0d","#9ca3af"],st:3,ts:0,ex:1,t:["#ff2a2a","#000000","#000000"]},sim:{c:["#ff8c22","#b82028","#ffd83d"],st:1,ts:1,ex:0,t:["#ffe33d","#111111","#000000"]},yaris:{c:["#168dff","#27e0ff","#8c42ff"],st:0,ts:0,ex:0,t:["#ffffff","#0b1a33","#000000"]},aksiyon:{c:["#f42d38","#171717","#858585"],st:0,ts:0,ex:2,t:["#ffffff","#111111","#000000"]},komedi:{c:["#56ef50","#101b16","#e5ff4f"],st:1,ts:1,ex:0,t:["#e5ff4f","#101b16","#000000"]}};
document.querySelectorAll("[data-tpl]").forEach(b=>b.onclick=()=>{const t=TPL[b.dataset.tpl];
["c1","c2","c3"].forEach((id,i)=>{$(id).value=t.c[i];});["tc","oc","sc"].forEach((id,i)=>{$(id).value=t.t[i];});
$("style").selectedIndex=t.st;$("textstyle").selectedIndex=t.ts;$("expr").selectedIndex=t.ex;markPreset("custom");render();persist();say("Şablon uygulandı: "+b.textContent.trim());});

function openExt(url){const C=window.Capacitor,B=C&&C.Plugins&&C.Plugins.Browser;if(B&&C.isNativePlatform&&C.isNativePlatform())B.open({url});else window.open(url,"_blank","noopener");}
function openApps(btn,id){
const text=$(id).textContent,m=$("menu"),q=encodeURIComponent(text);m.textContent="";
const go=(label,url)=>{const b=el("button","mi",label);b.type="button";b.onclick=()=>{closeMenu();openExt(url);copy(text);};m.append(b);};
go("Claude’da aç","https://claude.ai/new?q="+q);go("ChatGPT’de aç","https://chatgpt.com/?q="+q);go("Gemini’de aç (panoya kopyalanır)","https://gemini.google.com/app");
m.hidden=false;const r=btn.getBoundingClientRect(),w=Math.min(260,innerWidth-16);
m.style.width=w+"px";m.style.left=Math.max(8,Math.min(r.right-w,innerWidth-w-8))+"px";const h=m.offsetHeight;m.style.top=(r.bottom+6+h>innerHeight?Math.max(8,r.top-h-6):r.bottom+6)+"px";
}
document.querySelectorAll("[data-open]").forEach(b=>b.onclick=e=>{e.stopPropagation();openApps(b,b.dataset.open);});

/* ---- Kaydetme korumasi ---- */
function guarded(fn,skip){return function(...a){if(dirty&&cur()&&!(skip&&skip(...a))){pending=()=>fn(...a);openDlg();return;}return fn(...a);};}
function openDlg(){$("dlg").hidden=false;$("dlgSave").focus();}
function closeDlg(){$("dlg").hidden=true;}
const runPending=()=>{const f=pending;pending=null;if(f)f();};
$("dlgSave").onclick=()=>{saveProject();closeDlg();runPending();};
$("dlgDiscard").onclick=()=>{dirty=false;syncSave();closeDlg();runPending();};
$("dlgCancel").onclick=()=>{closeDlg();pending=null;};
$("saveBtn").onclick=saveProject;$("saveFab").onclick=saveProject;
document.addEventListener("keydown",e=>{
if(e.key==="Escape"){if(!$("dlg").hidden){closeDlg();pending=null;}else if(!$("tour").hidden)endTour();}
if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="s"&&cur()&&!$("viewEditor").hidden){e.preventDefault();saveProject();}
});
window.addEventListener("beforeunload",e=>{if(dirty&&cur()){e.preventDefault();e.returnValue="";}});

/* ---- Egitim (tutorial) ---- */
let ti=0,tourPid=null;
const TOUR=[
{t:"Prompt Olustur’a hoş geldin 👋",x:"Bu kısa turda uygulamayı baştan sona öğreneceksin: önce ayarlar, sonra proje oluşturma ve kaydetme, en sonda da projelerini düzenleme. İstediğin an Atla diyebilirsin. Turu Ayarlar sayfasından tekrar başlatabilirsin."},
{v:"settings",s:"#segMode",t:"Ayarlar: Tema",x:"Açık, koyu ya da cihazının ayarını izleyen temayı seçersin. Altındaki arka plan temalarıyla (gece mavisi, orman yeşili, bordo…) tüm renkleri değiştirebilirsin. Ayarlar anında uygulanır."},
{s:"#accents",t:"Vurgu rengi",x:"Uygulamanın ana rengini hazır renklerden seç ya da sağdaki renk çarkından istediğin rengi bul."},
{s:"#segRadius",t:"Köşeler, yazı ve animasyon",x:"Köşe yuvarlaklığı ve yazı boyutu burada. Animasyonlar da bu sayfadan açılıp kapanır."},
{s:"#chYoutube",t:"Kanal bilgilerim",x:"YouTube, TikTok, Instagram bağlantılarını ve izleyiciye çağrını bir kez yaz. Her yeni proje bu bilgilerle başlar."},
{s:"#bkSave",t:"Yedekle ve geri yükle",x:"Tüm projelerini tek dosyaya yedekle, başka cihazda geri yükle. Veriler tarayıcıda durduğu için arada bir yedek almanı öneririm."},
{v:"home",s:"#menuBtn",t:"Menü",x:"Projelerine, favorilere, kitaplıklara, çöp kutusuna, ayarlara ve bu eğitime buradan geçersin."},
{s:"#searchBtn",t:"Arama",x:"Projelerini oyun adına, konuya, etikete ve notlara göre ararsın."},
{s:"#tabs",ps:"#bnav",t:"Sekmeler",x:"Tümü, Favoriler, Takvim (yayın tarihine göre), Kitaplıklar (klasörler), İstatistik ve Çöp kutusu burada."},
{s:"#addBtn",ps:'[data-bn="add"]',t:"Şimdi bir proje oluşturalım",x:"Her oyun veya video için ayrı bir proje açarsın. Eğitim için örnek bilgilerle bir proje açıyorum. Kendi projelerinde bunları kendi bilgilerinle değiştirirsin.",a:{l:"Projeyi oluştur",f:"mk"}},
{v:"editor",s:"#game",t:"Oyunun adı",x:"Projenin adı burada yazdığın oyun adı olur. Arka plan da bu oyuna göre tarif edilir."},
{s:"#topic",t:"Video konusu",x:"Videoda ne olduğunu ve önemli anları yaz. Üç prompt da bunu kullanır."},
{s:'.seg[aria-label="Hazır şablonlar"]',t:"Hazır şablonlar",x:"Korku, simülasyon, yarış gibi türlere göre renk, görsel tarz ve yazı stilini tek dokunuşla ayarlar. Altta kendi ayarlarını “şablon olarak kaydedip” tekrar kullanabilirsin."},
{s:"#presets",t:"Renk paleti",x:"Thumbnail renklerini hazır paletlerden seç ya da altındaki renk kutularıyla kendin belirle."},
{s:"#thumb",t:"Thumbnail yazısı",x:"Görselde yazacak metin. Yazı, kenarlık ve gölge renklerini hemen altında ayarlarsın."},
{s:"#frame",t:"Fotoğraf ve kompozisyon",x:"Fotoğrafını yapay zekâ aracına sen yüklersin. Burada kadrajı, yüz ifadesini ve konumunu seçersin."},
{s:"#chFill",t:"Kanal bilgilerimi getir",x:"Ayarlarda kaydettiğin bağlantıları ve çağrıyı bu projeye tek dokunuşla yazar."},
{s:"#lang",t:"Prompt ayarları",x:"Prompt dilini (Türkçe ya da İngilizce), başlık sayısını ve hashtag sayısını buradan seçersin."},
{s:"#status",t:"Takip ve notlar",x:"Videonun durumunu (Fikir, Çekildi, Kurgu, Yayında), yayın tarihini, etiketleri ve notları gir. Yayın tarihi Takvim sekmesinde görünür."},
{s:".out .prompt",t:"Hazır promptlar",x:"Üç prompt sen yazdıkça kendiliğinden güncellenir. Kopyala’ya bas ya da Aç ↗ ile Claude, ChatGPT veya Gemini’de aç. Hepsini .txt olarak da kaydedebilirsin."},
{s:"#saveBtn",t:"Kaydet",x:"Projeler kendiliğinden kaydolmaz, Kaydet’e basman gerekir. Kaydetmeden çıkmaya çalışırsan Kaydet / Kaydetme diye sorarım.",a:{l:"Şimdi kaydet",f:"sv"}},
{v:"home",s:"#cards .card:not(.add)",t:"Projen burada",x:"Kaydettiğin proje ana menüde kart olarak görünür. Karta basınca açılır."},
{s:".cardtools",t:"Kart işlemleri",x:"☆ favoriye ekler. ⋯ menüsünde Kilitle (silinemez), Kitaplığa taşı, Kopyala (yeni bölüm) ve Çöp kutusuna taşı var."},
{s:"#selBtn",t:"Toplu işlem",x:"Seç’e basıp kartlara dokunarak birden fazla proje seç. Hepsini birden favoriye ekleyebilir, kitaplığa taşıyabilir ya da çöpe atabilirsin."},
{s:"#viewBtn",t:"Liste ve ızgara",x:"Kartları büyük kartlar ya da kompakt liste olarak göster. Karttaki etiketlere dokunursan o etikete göre filtrelenir."},
{s:'[data-tab="lib"]',ps:'[data-bn="lib"]',t:"Kitaplıklar",x:"Örneğin “Dönerci” adında bir klasör açıp ilgili projeleri içine koyarsın. Kartları sürükleyerek de taşıyabilirsin."},
{s:'[data-tab="cal"]',ps:'[data-bn="cal"]',t:"Takvim",x:"Yayın tarihi girdiğin projeleri ay görünümünde ve durum renkleriyle gösterir."},
{s:'[data-tab="stats"]',ps:"#menuBtn",t:"İstatistik",x:"Kaç videon var, hangi durumda, bu ay kaç yayın planlı ve en çok kullandığın etiketler burada."},
{s:'[data-tab="trash"]',ps:"#menuBtn",t:"Çöp kutusu",x:"Silinen projeler burada bekler. Geri yükleyebilir ya da kalıcı silebilirsin. Kilitli projeler silinemez."},
{t:"Hazırsın! 🎉",x:"Eğitim projesini silebilir ya da kendi projene çevirebilirsin. Turu istediğin zaman Ayarlar sayfasından yeniden başlatabilirsin."}
];
const ACT={
mk:()=>{newProject();tourPid=currentId;$("game").value="Örnek Oyun";$("topic").value="Dükkânımı geliştiriyorum, yeni ekipmanlar ve içecekler satın alıyorum.";$("thumb").value="DÜKKÂNI GELİŞTİRDİM!";$("tags").value="eğitim";render();persist();},
sv:()=>saveProject()
};
const viewOf=i=>{for(let j=i;j>=0;j--)if(TOUR[j].v)return TOUR[j].v;return null;};
function placeTour(){
const st=TOUR[ti],sel=(document.documentElement.classList.contains("phone")&&st.ps)||st.s,t=sel&&document.querySelector(sel),h=$("thole"),c=$("tcard"),vis=!!t&&t.getClientRects().length>0;
if(vis)t.scrollIntoView({block:"center"});
const r=vis?t.getBoundingClientRect():null;
h.hidden=!r;$("tmask").hidden=!!r;
if(r)Object.assign(h.style,{left:r.left-6+"px",top:r.top-6+"px",width:r.width+12+"px",height:r.height+12+"px"});
const w=Math.min(340,innerWidth-24);c.style.width=w+"px";
const ch=c.offsetHeight;let left,top;
if(r){left=Math.max(12,Math.min(r.left+r.width/2-w/2,innerWidth-w-12));top=r.bottom+14+ch<=innerHeight?r.bottom+14:(r.top-14-ch>=8?r.top-14-ch:Math.max(8,innerHeight-ch-12));}
else{left=(innerWidth-w)/2;top=Math.max(12,(innerHeight-ch)/2);}
c.style.left=left+"px";c.style.top=top+"px";
}
function showStep(){
const st=TOUR[ti],vw=viewOf(ti);
if(vw==="home"&&$("viewHome").hidden)showHome();
if(vw==="settings"&&$("viewSettings").hidden)showSettings();
if(vw==="editor"&&$("viewEditor").hidden&&tourPid)openProject(tourPid);
$("tstep").textContent=(ti+1)+" / "+TOUR.length;$("tT").textContent=st.t||"";$("tX").textContent=st.x;
$("tBack").hidden=ti===0;$("tNext").textContent=st.a?st.a.l:(ti===TOUR.length-1?"Bitir":"İleri");
$("tour").hidden=false;document.documentElement.style.overflow="hidden";setTimeout(placeTour,60);
}
function endTour(){$("tour").hidden=true;document.documentElement.style.overflow="";try{localStorage.setItem("promptlab.tour.v1","1");}catch(e){}}
function startTour(){closeDrawer();ti=0;tourPid=null;try{localStorage.setItem("promptlab.tour.v1","1");}catch(e){}showStep();}
$("tNext").onclick=()=>{const st=TOUR[ti];if(st.a)ACT[st.a.f]();if(ti>=TOUR.length-1){endTour();return;}ti++;showStep();};
$("tBack").onclick=()=>{if(ti>0){ti--;showStep();}};
$("tSkip").onclick=endTour;
window.addEventListener("resize",()=>{if(!$("tour").hidden)placeTour();});
$("tourBtn").onclick=()=>startTour();

/* ---- Bulut senkron (Firebase, REST) ---- */
const YKEY="promptlab.sync.v1";
let Y={cfg:null,room:"",known:{},meta:"",rt:"",last:0},yBusy=false,yAgain=false,yTimer,yTok={t:"",exp:0};
function yLoad(){try{const d=JSON.parse(localStorage.getItem(YKEY));if(d&&typeof d==="object")Y={...Y,...d};}catch(e){}}
function ySave(){try{localStorage.setItem(YKEY,JSON.stringify(Y));}catch(e){}}
const yOn=()=>!!(Y.cfg&&Y.cfg.k&&Y.cfg.p&&Y.room);
const pv=p=>Math.max(p.updated||0,p.mod||0);
const ySt=m=>{$("ySt").textContent=m;};
const yDoc=id=>"projects/"+Y.cfg.p+"/databases/(default)/documents/rooms/"+Y.room+"/items/"+id;
const yBase=()=>"https://firestore.googleapis.com/v1/projects/"+Y.cfg.p+"/databases/(default)/documents";
async function yToken(){
if(yTok.t&&Date.now()<yTok.exp)return yTok.t;
let r;
if(Y.rt){r=await fetch("https://securetoken.googleapis.com/v1/token?key="+Y.cfg.k,{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:"grant_type=refresh_token&refresh_token="+encodeURIComponent(Y.rt)});
if(r.ok){const j=await r.json();yTok={t:j.id_token,exp:Date.now()+(+j.expires_in-120)*1000};Y.rt=j.refresh_token||Y.rt;ySave();return yTok.t;}}
r=await fetch("https://identitytoolkit.googleapis.com/v1/accounts:signUp?key="+Y.cfg.k,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({returnSecureToken:true})});
if(!r.ok)throw new Error("Giriş yapılamadı ("+r.status+"). Firebase’de Anonymous girişi açık mı?");
const j=await r.json();yTok={t:j.idToken,exp:Date.now()+(+j.expiresIn-120)*1000};Y.rt=j.refreshToken;ySave();return yTok.t;
}
async function yFetch(path,opt={}){
const tk=await yToken();
const r=await fetch(path.startsWith("http")?path:yBase()+path,{...opt,headers:{Authorization:"Bearer "+tk,"Content-Type":"application/json"}});
if(r.status===404)return null;
if(!r.ok){const t=await r.text();throw new Error(r.status===403?"İzin yok (403). Firestore kurallarını yayınladın mı?":"Sunucu hatası "+r.status+" "+t.slice(0,80));}
return r.json();
}
async function yList(){const out=[];let tok="";do{const j=await yFetch("/rooms/"+Y.room+"/items?pageSize=200"+(tok?"&pageToken="+encodeURIComponent(tok):""));if(!j)break;(j.documents||[]).forEach(d=>out.push(d));tok=j.nextPageToken||"";}while(tok);return out;}
function yReload(){const p=cur();if(!p)return;loading=true;FIELD_IDS.forEach(k=>{$(k).value=p.values[k]!==undefined?p.values[k]:DEFAULTS[k];});markPreset(p.preset||"orange");render();loading=false;$("projName").textContent=p.name;syncTools();}
function yMerge(docs){
let chg=false;
docs.forEach(d=>{
const id=d.name.split("/").pop();if(id==="meta")return;
const f=d.fields||{},ver=+((f.ver||{}).integerValue||0),del=!!(f.del&&f.del.booleanValue);let o=null;
try{o=JSON.parse((f.json||{}).stringValue||"null");}catch(e){}
if(id==="channel"){if(o&&ver>(channel._mod||0)){channel=o;try{localStorage.setItem(CKEY,JSON.stringify(channel));}catch(e){}loadCh();Y.known.channel=ver;chg=true;}return;}
if(id[0]==="t"){const i=tpls.findIndex(x=>x.id===id);if(i<0&&typeof Y.known[id]==="number"&&!del)return;
if(del){if(i>=0&&ver>=(tpls[i].mod||0)){tpls.splice(i,1);chg=true;}Y.known[id]="d";}
else if(o&&(i<0||ver>(tpls[i].mod||0))){if(i<0)tpls.push(o);else tpls[i]=o;Y.known[id]=ver;chg=true;}
return;}
if(id[0]==="f"){const i=folders.findIndex(x=>x.id===id);if(i<0&&typeof Y.known[id]==="number"&&!del)return;
if(del){if(i>=0&&ver>=(folders[i].mod||0)){folders.splice(i,1);chg=true;}Y.known[id]="d";}
else if(o&&(i<0||ver>(folders[i].mod||0))){if(i<0)folders.push(o);else folders[i]=o;Y.known[id]=ver;chg=true;}
return;}
if(id[0]==="p"){const i=projects.findIndex(x=>x.id===id);if(i<0&&typeof Y.known[id]==="number"&&!del)return;
if(del){if(i>=0&&ver>=pv(projects[i])&&id!==currentId){projects.splice(i,1);chg=true;}Y.known[id]="d";}
else if(o&&(i<0||ver>pv(projects[i]))&&!(id===currentId&&dirty)){o.touched=true;if(i<0)projects.push(o);else projects[i]=o;Y.known[id]=ver;chg=true;if(id===currentId)yReload();}
}});
return chg;
}
async function yPush(){
const ups=[],mine=projects.filter(p=>p.touched);
mine.forEach(p=>{const v=pv(p);if(Y.known[p.id]!==v)ups.push([p.id,v,JSON.stringify(p),false]);});
folders.forEach(f=>{if(Y.known[f.id]!==(f.mod||0))ups.push([f.id,f.mod||0,JSON.stringify(f),false]);});
tpls.forEach(t=>{if(Y.known[t.id]!==(t.mod||0))ups.push([t.id,t.mod||0,JSON.stringify(t),false]);});
if(channel._mod&&Y.known.channel!==channel._mod)ups.push(["channel",channel._mod,JSON.stringify(channel),false]);
const have=new Set([...mine.map(p=>p.id),...folders.map(f=>f.id),...tpls.map(t=>t.id)]);
Object.keys(Y.known).forEach(id=>{if(id!=="channel"&&Y.known[id]!=="d"&&!have.has(id))ups.push([id,Date.now(),"",true]);});
if(!ups.length)return false;
for(let i=0;i<ups.length;i+=400){
const writes=ups.slice(i,i+400).map(([id,v,j,d])=>({update:{name:yDoc(id),fields:{json:{stringValue:j},ver:{integerValue:String(v)},del:{booleanValue:d}}}}));
if(i+400>=ups.length)writes.push({update:{name:yDoc("meta"),fields:{ver:{integerValue:String(Date.now())}}}});
await yFetch(yBase()+":commit",{method:"POST",body:JSON.stringify({writes})});
}
ups.forEach(([id,v,j,d])=>{Y.known[id]=d?"d":v;});Y.meta="";ySave();return true;
}
async function syncNow(force){
if(!yOn())return;
if(yBusy){yAgain=true;return;}
yBusy=true;ySt("Eşitleniyor…");
try{
const m=await yFetch("/rooms/"+Y.room+"/items/meta"),rm=m&&m.fields&&m.fields.ver?m.fields.ver.integerValue:"";
if(force||rm!==Y.meta){if(yMerge(await yList())){saveLocal();saveFLocal();saveTLocal();renderTpls();renderTabs();renderHome(false);renderNav();}Y.meta=rm;}
const pushed=await yPush();
Y.last=Date.now();ySave();
ySt("Bağlı · son eşitleme "+new Date().toLocaleTimeString("tr-TR",{hour:"2-digit",minute:"2-digit"}));
if(pushed)setTimeout(()=>syncNow(true),3000);
}catch(e){ySt("Eşitlenemedi: "+(/Failed to fetch|NetworkError|Load failed/i.test(String(e.message))?"internet yok ya da bu sayfada dış bağlantılar engelli.":e.message));}
yBusy=false;if(yAgain){yAgain=false;syncSoon();}
}
function syncSoon(){if(!yOn())return;clearTimeout(yTimer);yTimer=setTimeout(()=>syncNow(false),1500);}
function renderY(){$("ySetup").hidden=yOn();$("yOnBox").hidden=!yOn();if(yOn())ySt(Y.last?"Bağlı":"Bağlanıyor…");}
const b64u=t=>btoa(t).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
const unb64u=t=>atob(t.replace(/-/g,"+").replace(/_/g,"/")+"===".slice((t.length+3)%4));
function yStart(cfg,room){Y={cfg,room,known:{},meta:"",rt:"",last:0};yTok={t:"",exp:0};ySave();renderY();syncNow(true);}
$("yCreate").onclick=()=>{
const t=$("yCfg").value,k=(/apiKey["']?\s*[:=]\s*["']([^"']+)["']/i.exec(t)||[])[1],pr=(/projectId["']?\s*[:=]\s*["']([^"']+)["']/i.exec(t)||[])[1];
if(!k||!pr){toast("Firebase bilgilerinde apiKey ve projectId bulunamadı.");return;}
const A="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
yStart({k,p:pr},Array.from(crypto.getRandomValues(new Uint8Array(16)),b=>A[b%32]).join(""));toast("Senkron oluşturuldu. Şimdi davet kodunu kopyalayabilirsin.");
};
$("yJoin").onclick=()=>{
try{const c=$("yJoinCode").value.trim();if(!c.startsWith("PL1."))throw 0;const o=JSON.parse(unb64u(c.slice(4)));
if(!o||typeof o.k!=="string"||typeof o.p!=="string"||!/^[A-Z0-9]{8,32}$/.test(o.r))throw 0;
$("yJoinCode").value="";yStart({k:o.k,p:o.p},o.r);toast("Katıldın. Veriler birleştiriliyor…");
}catch(e){toast("Bu davet kodu geçerli değil.");}
};
$("yInv").onclick=()=>{if(yOn())copy("PL1."+b64u(JSON.stringify({k:Y.cfg.k,p:Y.cfg.p,r:Y.room})));};
$("yNow").onclick=()=>syncNow(true);
$("yOff").onclick=()=>{Y={cfg:null,room:"",known:{},meta:"",rt:"",last:0};yTok={t:"",exp:0};ySave();renderY();toast("Senkron kapatıldı. Verilerin bu cihazda duruyor.");};
setInterval(()=>{if(!document.hidden)syncNow(false);},60000);
document.addEventListener("visibilitychange",()=>{if(!document.hidden)syncNow(false);});
window.addEventListener("online",()=>syncNow(true));

/* ---- Sablonlar, toplu islem, gorunum, istatistik ---- */
const TKEY="promptlab.tpls.v1",TPL_FIELDS=["c1","c2","c3","tc","oc","sc","style","textstyle","frame","expr","position","background","resolution","extra","tone","lang","titleN","hashN"];
let tpls=[],selMode=false,sel=new Set(),tagF="";const lastIds=[];
const ptags=p=>(p.values.tags||"").split(",").map(x=>x.trim().toLowerCase()).filter(Boolean);
function loadT(){try{const d=JSON.parse(localStorage.getItem(TKEY));if(Array.isArray(d))tpls=d.filter(x=>x&&x.id&&x.name&&x.v);}catch(e){}}
function saveTLocal(){try{localStorage.setItem(TKEY,JSON.stringify(tpls));}catch(e){}}
function saveTpls(){saveTLocal();syncSoon();}
function renderTpls(){
const b=$("myTpls");b.textContent="";
if(!tpls.length){b.append(el("span","hint","Henüz kendi şablonun yok."));return;}
tpls.forEach(t=>{const w=el("span","tplitem"),a=el("button",null,t.name),x=el("button","tplx","✕");a.type=x.type="button";x.setAttribute("aria-label","Şablonu sil");
a.onclick=()=>{TPL_FIELDS.forEach(k=>{if(t.v[k]!==undefined)$(k).value=t.v[k];});markPreset("custom");render();persist();say("Şablon uygulandı: "+t.name);};
arm(x,"✕",()=>{tpls=tpls.filter(z=>z!==t);saveTpls();renderTpls();toast("Şablon silindi: "+t.name);});
w.append(a,x);b.append(w);});
}
$("tplSave").onclick=()=>{const n=$("tplName").value.trim();if(!n){toast("Şablona bir ad yaz.");return;}const v={};TPL_FIELDS.forEach(k=>{v[k]=$(k).value;});tpls.push({id:"t"+newId().slice(1),name:n,v,mod:Date.now()});$("tplName").value="";saveTpls();renderTpls();toast("Şablon kaydedildi: "+n);};

const selItems=()=>projects.filter(p=>sel.has(p.id)&&p.touched&&!p.trashed);
function selUpdate(){$("selbar").hidden=!(selMode&&!$("viewHome").hidden);$("selN").textContent=sel.size+" seçili";}
$("selBtn").onclick=()=>{selMode=!selMode;sel.clear();renderHome(false);};
$("selDone").onclick=()=>{selMode=false;sel.clear();renderHome(false);};
$("selAll").onclick=()=>{if(sel.size>=lastIds.length)sel.clear();else lastIds.forEach(id=>sel.add(id));renderHome(false);};
$("selFav").onclick=()=>{const it=selItems();if(!it.length){toast("Önce proje seç.");return;}const all=it.every(p=>p.fav);it.forEach(p=>{p.fav=!all;p.mod=Date.now();});commit(false);toast(all?"Favoriden çıkarıldı.":"Favorilere eklendi.");};
$("selTrash").onclick=()=>{
const it=selItems();if(!it.length){toast("Önce proje seç.");return;}
const ok=it.filter(p=>!p.locked);ok.forEach(p=>{p.trashed=Date.now();p.mod=Date.now();});sel.clear();commit(false);
toast(ok.length+" proje çöp kutusuna taşındı"+(it.length>ok.length?" ("+(it.length-ok.length)+" kilitli atlandı)":"")+".",ok.length?()=>{ok.forEach(p=>{p.trashed=null;p.mod=Date.now();});commit(false);}:null);
};
$("selMove").onclick=e=>{
const it=selItems();if(!it.length){toast("Önce proje seç.");return;}
const m=$("menu");m.textContent="";e.stopPropagation();
const go=(label,fid)=>{const b=el("button","mi",label);b.type="button";b.onclick=()=>{closeMenu();it.forEach(p=>{p.folderId=fid;p.mod=Date.now();});sel.clear();commit(false);toast(it.length+" proje taşındı.");};m.append(b);};
if(!folders.length)m.append(el("p","mnote","Henüz kitaplık yok. Kitaplıklar sekmesinden oluştur."));
folders.forEach(f=>go("📁 "+f.name,f.id));go("Kitaplıktan çıkar",null);
m.hidden=false;const r=e.currentTarget.getBoundingClientRect(),w=Math.min(250,innerWidth-16);
m.style.width=w+"px";m.style.left=Math.max(8,Math.min(r.right-w,innerWidth-w-8))+"px";m.style.top=Math.max(8,r.top-m.offsetHeight-8)+"px";
};
$("viewBtn").onclick=()=>{S.view=S.view==="list"?"grid":"list";saveS();renderHome(false);};
$("tagChip").onclick=()=>{tagF="";renderHome(false);};

function renderStats(box){
const L=live(),w=el("div","stats"),g=el("div","statgrid"),now=new Date(),mk=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0");
const stat=(v,l)=>{const c=el("div","stat");c.append(el("b",null,String(v)),el("small",null,l));return c;};
const inM=L.filter(p=>(p.values.pubdate||"").startsWith(mk(now))),stOf=p=>p.values.status||"Fikir";
g.append(stat(L.length,"Toplam video"),stat(L.filter(p=>stOf(p)==="Yayında").length,"Yayında"),stat(inM.length,"Bu ay planlı yayın"),stat(inM.filter(p=>stOf(p)==="Yayında").length,"Bu ay yayınlanan"),stat(L.filter(p=>p.fav).length,"Favori"),stat(folders.length,"Kitaplık"));
w.append(g);
if(!L.length){w.append(el("p","hint","Henüz kayıtlı proje yok. İstatistikler projelerini kaydettikçe dolacak."));box.append(w);return;}
const b1=el("div","statbox");b1.append(el("h3",null,"Durum dağılımı"));
ST.forEach((s,i)=>{const c=L.filter(p=>stOf(p)===s).length,r=el("div","barrow"),bar=el("div","bar b"+i);bar.style.width=(c?Math.max(4,c/L.length*100):0)+"%";r.append(el("span",null,s),bar,el("em",null,String(c)));b1.append(r);});
w.append(b1);
const mo=[];for(let i=5;i>=0;i--){const d=new Date(now.getFullYear(),now.getMonth()-i,1),k=mk(d);mo.push([d.toLocaleDateString("tr-TR",{month:"short",year:"2-digit"}),L.filter(p=>(p.values.pubdate||"").startsWith(k)).length]);}
const mx=Math.max(1,...mo.map(x=>x[1])),b2=el("div","statbox");b2.append(el("h3",null,"Son 6 ayda yayın tarihi olan videolar"));
mo.forEach(([n,c])=>{const r=el("div","barrow"),bar=el("div","bar bm");bar.style.width=(c?Math.max(4,c/mx*100):0)+"%";r.append(el("span",null,n),bar,el("em",null,String(c)));b2.append(r);});
w.append(b2);
const tc={};L.forEach(p=>ptags(p).forEach(t=>{tc[t]=(tc[t]||0)+1;}));const top=Object.entries(tc).sort((a,b)=>b[1]-a[1]).slice(0,10);
if(top.length){const b3=el("div","statbox"),row=el("div","tagrow");b3.append(el("h3",null,"En çok kullanılan etiketler"));
top.forEach(([t,c])=>{const b=el("button","btn secondary","# "+t+" · "+c);b.type="button";b.onclick=()=>{tagF=t;tab="all";renderTabs();renderHome(true);renderNav();};row.append(b);});b3.append(row);w.append(b3);}
box.append(w);
}

/* ---- Ikonlar, telefon gorunumu, Android cubuklari ---- */
const IC={
star:'<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z"/>',
starf:'<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z"/>',
folder:'<path d="M3.5 7.5a2 2 0 012-2h3.6l2 2.2h7.4a2 2 0 012 2v7.3a2 2 0 01-2 2h-13a2 2 0 01-2-2z"/>',
trash:'<path d="M4.5 7h15M9.5 7V5h5v2M6.5 7l.8 12a1.5 1.5 0 001.5 1.4h6.4a1.5 1.5 0 001.5-1.4L17.5 7M10 11v6M14 11v6"/>',
calendar:'<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3.5v3M16 3.5v3"/>',
chart:'<path d="M5 20V11M12 20V4M19 20v-6"/>',
lock:'<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 018 0v2.5"/>',
unlock:'<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 017.5-1.9"/>',
save:'<path d="M5 4.5h11l3.5 3.5v11a1.5 1.5 0 01-1.5 1.5H5A1.5 1.5 0 013.5 19V6A1.5 1.5 0 015 4.5z"/><path d="M8 4.5v5h7v-5M8 20v-6h8v6"/>',
copy:'<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5.5 15A1.5 1.5 0 014 13.5v-8A1.5 1.5 0 015.5 4h8A1.5 1.5 0 0115 5.5"/>',
more:'<circle cx="5.5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="18.5" cy="12" r="1.5"/>',
checksq:'<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8.5 12.2l2.5 2.5 4.5-5"/>',
check:'<path d="M5 12.5l4.5 4.5L19 7.5"/>',
x:'<path d="M6 6l12 12M18 6L6 18"/>',
list:'<path d="M8.5 7H20M8.5 12H20M8.5 17H20"/><circle cx="4.5" cy="7" r=".9"/><circle cx="4.5" cy="12" r=".9"/><circle cx="4.5" cy="17" r=".9"/>',
grid:'<rect x="4" y="4" width="6.5" height="6.5" rx="1.6"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.6"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.6"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.6"/>',
ghost:'<path d="M6 20V11a6 6 0 0112 0v9l-2.2-1.8L13.5 20 12 18.6 10.5 20 8.2 18.2z"/><circle cx="9.7" cy="11" r=".9"/><circle cx="14.3" cy="11" r=".9"/>',
store:'<path d="M4 9l1.5-4.5h13L20 9M4 9v10.5h16V9M4 9a2.7 2.7 0 005.3 0 2.7 2.7 0 005.4 0A2.7 2.7 0 0020 9M10 19.5v-5h4v5"/>',
flag:'<path d="M5.5 21V4M5.5 5h12l-2.2 3.5 2.2 3.5h-12"/>',
zap:'<path d="M13 3L5.5 13.5H12L11 21l7.5-10.5H12z"/>',
smile:'<circle cx="12" cy="12" r="8.5"/><path d="M8.5 14a4 4 0 007 0M9.3 9.6h.01M14.7 9.6h.01"/>',
palette:'<path d="M12 3.5a8.5 8.5 0 000 17c1.4 0 2-1 1.4-2.1-.5-1 .2-2.2 1.4-2.2H17a3.5 3.5 0 003.5-3.5C20.5 7 16.7 3.5 12 3.5z"/><circle cx="8" cy="11" r=".9"/><circle cx="11" cy="7.8" r=".9"/><circle cx="15.2" cy="8.5" r=".9"/>',
tv:'<rect x="3.5" y="6" width="17" height="12" rx="2.5"/><path d="M10.2 9.5v5l4.3-2.5z"/>',
cloud:'<path d="M7.5 18.5a4 4 0 01-.4-8 5.5 5.5 0 0110.6 1.2 3.4 3.4 0 01-.7 6.8z"/>',
cap:'<path d="M2.5 9.5L12 5l9.5 4.5L12 14zM6.5 11.7V16c0 1.2 2.5 2.5 5.5 2.5s5.5-1.3 5.5-2.5v-4.3"/>',
sparkf:'<path d="M12 3l2.1 6.1L20.5 12l-6.4 2.9L12 21l-2.1-6.1L3.5 12l6.4-2.9z"/>',
sliders:'<path d="M4 7h9M19 7h1M4 17h1M11 17h9"/><circle cx="16" cy="7" r="2.5"/><circle cx="8" cy="17" r="2.5"/>',
help:'<circle cx="12" cy="12" r="8.5"/><path d="M9.7 9.5a2.4 2.4 0 114 1.7c-.8.7-1.7 1.1-1.7 2.3M12 16.8h.01"/>',
arrowur:'<path d="M7 17L17 7M9 7h8v8"/>',
arrowl:'<path d="M19 12H5M11 6l-6 6 6 6"/>',
chevl:'<path d="M14.5 6l-6 6 6 6"/>',chevr:'<path d="M9.5 6l6 6-6 6"/>',
chat:'<path d="M4.5 4.5h15A1.5 1.5 0 0121 6v9a1.5 1.5 0 01-1.5 1.5H10l-4.5 4v-4h-1A1.5 1.5 0 013 15V6a1.5 1.5 0 011.5-1.5z"/>',bulb:'<path d="M9 18h6M10 21h4M8.2 14.2a6 6 0 1111.6 0c-.7 1.3-1.8 2-2.3 3.3H10.5c-.5-1.3-1.6-2-2.3-3.3z"/>',book:'<path d="M4 5.5A2.5 2.5 0 016.5 3H20v15H6.5A2.5 2.5 0 004 20.5z"/><path d="M4 18.5A2.5 2.5 0 016.5 16H20"/>',plug:'<path d="M9 3v5M15 3v5M6.5 8h11v3a5.5 5.5 0 01-11 0zM12 16.5V21"/>',key:'<circle cx="8" cy="8" r="4"/><path d="M10.8 10.8L20 20M17 17l2-2M14.5 14.5l2-2"/>',refresh:'<path d="M20 11a8 8 0 10-2.3 6.3M20 5v6h-6"/>',edit:'<path d="M4 20l4-1 11-11-3-3L5 16zM14 5l3 3"/>',download:'<path d="M12 4v11M7.5 11l4.5 4.5L16.5 11M5 20h14"/>',plus:'<path d="M12 5v14M5 12h14"/>'
};
const EMO={"★":"starf","☆":"star","📁":"folder","🗑":"trash","📅":"calendar","📊":"chart","🔒":"lock","🔓":"unlock","💾":"save","⧉":"copy","⋯":"more","☑":"checksq","✓":"check","✕":"x","☰":"list","▦":"grid","😱":"ghost","🏪":"store","🏎":"flag","💥":"zap","😂":"smile","🎨":"palette","📺":"tv","☁":"cloud","🎓":"cap","✦":"sparkf","👋":"sparkf","✨":"sparkf","🎉":"sparkf","⚙":"sliders","❓":"help","↗":"arrowur","←":"arrowl","‹":"chevl","›":"chevr","＋":"plus","💬":"chat","💡":"bulb","📚":"book","🔌":"plug","🔑":"key","↻":"refresh","✏":"edit","↧":"download"};
const EMO_RE=new RegExp("("+Object.keys(EMO).join("|")+")\uFE0F?","g");
const FILLED=["starf","sparkf","more"];
function icon(name){const t=document.createElement("template");t.innerHTML='<svg class="ic'+(FILLED.includes(name)?" fill":"")+'" viewBox="0 0 24 24" aria-hidden="true">'+IC[name]+'</svg>';return t.content.firstChild;}
function decorate(root){
const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:n=>{EMO_RE.lastIndex=0;return EMO_RE.test(n.nodeValue)&&!(n.parentElement&&n.parentElement.closest("textarea,input,select,option,script,style,.promptbody,#projName,.ai-markdown,.no-deco"))?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT;}});
const nodes=[];while(w.nextNode())nodes.push(w.currentNode);
nodes.forEach(n=>{const t=n.nodeValue,f=document.createDocumentFragment();let last=0,m;EMO_RE.lastIndex=0;
while((m=EMO_RE.exec(t))){if(m.index>last)f.append(t.slice(last,m.index));f.append(icon(EMO[m[1]]));last=m.index+m[0].length;}
if(last<t.length)f.append(t.slice(last));n.replaceWith(f);});
}
new MutationObserver(ms=>{ms.forEach(m=>{m.addedNodes.forEach(n=>{if(n.nodeType===1)decorate(n);else if(n.nodeType===3&&n.parentElement)decorate(n.parentElement);});if(m.type==="characterData"&&m.target.parentElement)decorate(m.target.parentElement);});}).observe(document.body,{childList:true,subtree:true,characterData:true});
decorate(document.body);

function setPhone(){const C=window.Capacitor,nat=!!(C&&C.isNativePlatform&&C.isNativePlatform()),r=document.documentElement;r.classList.toggle("phone",nat||innerWidth<=720);r.classList.toggle("native",nat);}
setPhone();window.addEventListener("resize",()=>{setPhone();renderTabs();});
document.querySelectorAll("#bnav [data-bn]").forEach(b=>b.onclick=()=>{
if(b.dataset.bn==="add"){newProject();return;}
if(b.dataset.bn==="ai"){showAI();return;}
tab=b.dataset.bn;openFolder=null;tagF="";
if($("viewHome").hidden){showHome();}else{renderTabs();renderHome(true);renderNav();}
});
function syncBars(){
const r=document.documentElement,raw=getComputedStyle(r).getPropertyValue("--p").trim();
let h=/^#[0-9a-f]{3}$/i.test(raw)?"#"+raw.slice(1).split("").map(c=>c+c).join(""):raw;
if(!/^#[0-9a-f]{6}$/i.test(h))return;
const n=parseInt(h.slice(1),16),lum=(0.299*(n>>16)+0.587*((n>>8)&255)+0.114*(n&255))/255;
let m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content",h);
const A=window.AndroidBars;if(A&&A.set){try{A.set(h,lum>0.55);}catch(e){}}
}
try{window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change",()=>setTimeout(syncBars,60));}catch(e){}

const AppP=window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.App;
if(AppP&&AppP.addListener)AppP.addListener("backButton",()=>{
if(window.AI&&window.AI.closeTop&&window.AI.closeTop())return;
if(!$("dlg").hidden){closeDlg();pending=null;return;}
if(!$("tour").hidden){endTour();return;}
if($("drawer").classList.contains("open")){closeDrawer();return;}
if(!$("menu").hidden){closeMenu();return;}
if(!$("viewHome").hidden){
if(!$("searchbar").hidden){$("searchbar").hidden=true;$("q").value="";renderHome(false);return;}
if(tab!=="all"||openFolder){tab="all";openFolder=null;renderTabs();renderHome(true);renderNav();return;}
AppP.exitApp();return;}
showHome();
});
function showAI(){leave();show("ai");renderNav();closeDrawer();}
showHome=guarded(showHome);showSettings=guarded(showSettings);showAI=guarded(showAI);newProject=guarded(newProject);dupe=guarded(dupe);startTour=guarded(startTour);openProject=guarded(openProject,id=>id===currentId);
$("setBtn").onclick=showSettings;$("setBack").onclick=showHome;$("backBtn").onclick=showHome;
$("aiBtn").onclick=showAI;$("heroAI").onclick=showAI;$("heroNew").onclick=()=>newProject();
$("aiBack").onclick=showHome;$("aiSettingsBtn").onclick=showSettings;
document.querySelectorAll(".tnav [data-goto]").forEach(b=>b.onclick=()=>{const g=b.dataset.goto;if(g==="home")showHome();else if(g==="ai")showAI();else showSettings();});

window.PL={
$,
el,
toast,
copy,
openExt,
saveFile,
show,
closeDrawer,
renderNav,
live:()=>live(),
projects:()=>projects,
folders:()=>folders,
newProject,
openProject,
render,
persist,
current:()=>cur(),
showHome,
showSettings,
showAI,
get settings(){return S;},
saveSettings:()=>saveS()
};
loadS();applyS();loadCh();loadAll();loadT();renderTpls();yLoad();renderY();showHome();if(yOn())setTimeout(()=>syncNow(true),800);
try{if(!localStorage.getItem("promptlab.tour.v1"))setTimeout(startTour,700);}catch(e){}
})();