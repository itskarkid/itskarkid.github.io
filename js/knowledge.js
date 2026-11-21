'use strict';
// Browser-only private reader. OAuth Drive read-only scope is broader than the folder UI.
window.KnowledgeIntegration = (() => {
  const CLIENT_ID = '499890040996-rh25v1c0m51tgashvduaid9rbp63v9fh.apps.googleusercontent.com';
  const ROOT = '1tkByjLQQw05u2AqKKcOYPANNJhrLfOXp';
  const SCOPE = 'https://www.googleapis.com/auth/drive.readonly';
  const FOLDER_MIME = 'application/vnd.google-apps.folder';
  const MAX_ITEMS = 3000, MAX_FOLDER_DEPTH = 12, MAX_BYTES = 512 * 1024;
  const $ = id => document.getElementById(id);
  const tab = $('tab-knowledge'), status = $('krIntegrationStatus');
  const tree = $('krRecentNotes'), filter = $('krNoteSearch'), refresh = $('krRefresh');
  const noteBody = $('krNoteBody'), noteTitle = $('krNoteTitle');
  const noteWrap = $('krNoteWrap'), empty = $('krEmpty');
  const outline = $('krOutline'), related = $('krRelated'), backlinks = $('krBacklinks'), crumb = $('krBreadcrumb');
  const localGraph = $('krLocalGraph'), globalGraph = $('krGlobalGraph'), overlay = $('krGraphOverlay');
  const propsBox = $('krNoteProperties');
  let token = '', expiry = 0, client = null, generation = 0, activeId = null, indexing = false;
  // Short-lived access token survives a refresh in this tab only (sessionStorage); never note content.
  const AUTH_KEY = 'garden.kr.auth';
  function saveAuth() { try { sessionStorage.setItem(AUTH_KEY, JSON.stringify({ token, expiry })); } catch (_) {} }
  function clearAuth() { try { sessionStorage.removeItem(AUTH_KEY); } catch (_) {} }
  function restoreAuth() {
    try {
      const saved = JSON.parse(sessionStorage.getItem(AUTH_KEY) || 'null');
      if (saved && saved.token && Date.now() < saved.expiry) { token = saved.token; expiry = saved.expiry; return true; }
    } catch (_) {}
    clearAuth(); return false;
  }
  let files = new Map(), folders = new Map(), expanded = new Set([ROOT]);
  let currentRaw = '', currentName = '';
  let edges = new Map(), indexed = new Set(), graphBusy = false, graphReady = false;
  const isConnected = () => Boolean(token && Date.now() < expiry);
  function message(s, error=false) { status.textContent=s; status.dataset.kind=error?'error':'info'; }
  function blank(container, text) { container.replaceChildren(); const p=document.createElement('p');p.textContent=text;container.append(p); }
  function clearNote() {
    activeId=null;currentRaw='';currentName='';noteBody.replaceChildren();noteTitle.textContent='';
    crumb.textContent='Knowledge';noteWrap.hidden=true;empty.hidden=false;propsBox.replaceChildren();propsBox.hidden=true;
    blank(outline,'Open a note to see its headings.');blank(related,'Outgoing links appear here.');blank(backlinks,'Backlinks appear after indexing.');localGraph.replaceChildren();
  }
  function resetUI() { overlay.hidden=true;globalGraph.replaceChildren();edges.clear();indexed.clear();graphReady=false;files.clear();folders.clear();expanded=new Set([ROOT]);filter.value='';clearNote();blank(tree,'Connect through Barnaby to browse Knowledge.');tab.hidden=true; }
  function signOut() {
    generation++;const previous=token;token='';expiry=0;clearAuth();resetUI();
    if(previous&&window.google?.accounts?.oauth2)google.accounts.oauth2.revoke(previous,()=>{});
    if($('view-knowledge').classList.contains('active'))switchView('home');
    message('Disconnected. This browser session no longer holds private notes or a folder index.');
  }
  function updateStatus() {if(!isConnected()){if(token)signOut();return;} tab.hidden=false;if(!folders.size&&!indexing)indexLibrary();}
  async function driveGet(url,gen) {
    if(!isConnected()||gen!==generation)throw Error('Session expired or changed. Sign in again.');
    const response=await fetch(url,{headers:{Authorization:`Bearer ${token}`},cache:'no-store',credentials:'omit',redirect:'error',referrerPolicy:'no-referrer'});
    if(!response.ok)throw Error(`Google Drive returned HTTP ${response.status}. Check Drive API, OAuth permissions and access to Knowledge.`);
    if(gen!==generation||!isConnected())throw Error('Session changed.');
    return response;
  }
  const isNote = file => /\.(md|markdown|txt)$/i.test(file.name||'') && ['text/plain','text/markdown','application/octet-stream'].includes(file.mimeType);
  const valid = id => /^[A-Za-z0-9_-]{6,}$/.test(id||'');
  function parentName(id) {let chunks=[],seen=new Set();while(id&&id!==ROOT&&!seen.has(id)){seen.add(id);const f=files.get(id);if(!f)break;chunks.unshift(f.name);id=f.parents?.[0];}return ['Knowledge',...chunks].join(' / ');}
  async function indexLibrary() {
    if(!isConnected())return;
    const gen=++generation;indexing=true;clearNote();files.clear();folders.clear();blank(tree,'Loading your Knowledge folders…');message('Reading folder names and note titles from Google Drive…');
    try {
      const root=await(await driveGet(`https://www.googleapis.com/drive/v3/files/${ROOT}?fields=id,name,mimeType,trashed`,gen)).json();
      if(root.trashed||root.mimeType!==FOLDER_MIME)throw Error('The configured Knowledge folder is not accessible to this Google account.');
      files.set(ROOT,{id:ROOT,name:'Knowledge',mimeType:FOLDER_MIME,parents:[]});
      const queue=[{id:ROOT,depth:0}];let count=0;
      while(queue.length){
        const {id,depth}=queue.shift();let pageToken='';let children=[];
        do{
          const query=`'${id}' in parents and trashed = false`;
          const params=new URLSearchParams({q:query,fields:'nextPageToken,files(id,name,mimeType,parents,size,trashed)',pageSize:'500',orderBy:'folder,name',spaces:'drive'});
          if(pageToken)params.set('pageToken',pageToken);
          const result=await(await driveGet(`https://www.googleapis.com/drive/v3/files?${params.toString()}`,gen)).json();
          for(const f of result.files||[]){
            if(!valid(f.id)||!f.name||f.name.startsWith('.')||f.trashed)continue;
            if(f.mimeType!==FOLDER_MIME&&!isNote(f))continue;
            if(++count>MAX_ITEMS)throw Error('Knowledge folder has too many entries for this browser preview. Reduce the allowed set or use a server reader.');
            files.set(f.id,f);children.push(f.id);
            if(f.mimeType===FOLDER_MIME){if(depth>=MAX_FOLDER_DEPTH)throw Error('Knowledge folder nesting exceeds the safe browser limit.');queue.push({id:f.id,depth:depth+1});}
          }
          pageToken=result.nextPageToken||'';
        }while(pageToken);
        folders.set(id,children);
      }
      if(gen!==generation)return;
      renderTree();message(`Knowledge ready: ${[...files.values()].filter(isNote).length} notes available. Indexing links in this session…`);
      const firstNote = [...files.values()].filter(isNote).sort((a,b)=>a.name.localeCompare(b.name))[0];
      if(firstNote) void readFile(firstNote.id);
      void indexRelationships(gen);
    }catch(err){if(gen===generation){files.clear();folders.clear();clearNote();blank(tree,'Could not load Knowledge folder.');message(err.message||'Unable to browse Knowledge.',true);}}finally{indexing=false;}
  }
  function renderTree(){
    tree.replaceChildren();const query=filter.value.trim().toLocaleLowerCase();
    let rendered=0;
    function draw(id,level){
      const f=files.get(id);if(!f)return false;
      const folder=f.mimeType===FOLDER_MIME, kids=folders.get(id)||[];
      const matching=f.name.toLocaleLowerCase().includes(query);
      const matchingDesc=kids.some(k=>containsMatch(k));
      if(query&&!matching&&!matchingDesc)return false;
      const button=gardenExplorerRow({label:id===ROOT?'Knowledge':f.name.replace(/\.(md|markdown|txt)$/i,''),depth:level,folder,open:expanded.has(id)||Boolean(query),selected:id===activeId,
        onClick:()=>{if(folder){if(expanded.has(id))expanded.delete(id);else expanded.add(id);renderTree();}else readFile(id);}});
      tree.append(button);rendered++;
      if(folder&&(query||expanded.has(id)))for(const kid of kids)draw(kid,level+1);
      return true;
    }
    function containsMatch(id){const f=files.get(id);if(!f)return false;return f.name.toLocaleLowerCase().includes(query)||(folders.get(id)||[]).some(containsMatch);}
    draw(ROOT,0);if(!rendered)blank(tree,'No matching notes.');
  }
  function resolveWikilink(target){
    const needle=target.split('|')[0].split('#')[0].trim().replace(/\\/g,'/').toLocaleLowerCase();if(!needle)return null;
    const matches=[...files.values()].filter(f=>isNote(f)&&(f.name.replace(/\.(md|markdown|txt)$/i,'').toLocaleLowerCase()===needle.split('/').at(-1)));
    return matches.length===1?matches[0]:null;
  }
  function linkTargets(raw){
    const out=[...raw.matchAll(/\[\[([^\]\n]+)\]\]/g)].map(m=>m[1]);
    for(const m of raw.matchAll(/\[[^\]\n]+\]\(([^)]+\.(?:md|markdown)(?:#[^)]*)?)\)/gi))out.push(decodeURIComponent(m[1]));
    return [...new Set(out)];
  }
  function makeContextLink(container,f,prefix=''){
    const b=document.createElement('button');b.type='button';b.className='kr-context-link';b.textContent=prefix+f.name.replace(/\.(md|markdown|txt)$/i,'');
    b.addEventListener('click',()=>readFile(f.id));container.append(b);
  }
  function renderContext(raw){
    outline.replaceChildren();related.replaceChildren();backlinks.replaceChildren();let n=0;
    for(const h of noteBody.querySelectorAll('h1,h2,h3')){
      const item=document.createElement('button');item.type='button';item.className='kr-context-link';
      item.style.paddingLeft=`${(Number(h.tagName[1])-1)*10}px`;item.textContent=h.textContent||'Heading';
      item.addEventListener('click',()=>h.scrollIntoView({behavior:'smooth',block:'start'}));outline.append(item);n++;
    }
    if(!n)blank(outline,'No headings found.');
    const targets=edges.get(activeId)||new Set(linkTargets(raw).map(t=>resolveWikilink(t)?.id).filter(Boolean));
    if(!targets.size)blank(related,'No resolved outgoing links.');
    for(const id of targets){const f=files.get(id);if(f)makeContextLink(related,f,'→ ');}
    let incoming=0;
    for(const [id,ids] of edges){if(ids.has(activeId)&&id!==activeId){const f=files.get(id);if(f){makeContextLink(backlinks,f,'← ');incoming++;}}}
    if(!incoming)blank(backlinks,graphReady?'No backlinks found.':'Indexing backlinks…');
    renderLocalGraph();
  }
  async function indexRelationships(gen){
    if(graphBusy)return;graphBusy=true;graphReady=false;edges.clear();indexed.clear();
    const notes=[...files.values()].filter(isNote).filter(f=>Number(f.size||0)<=MAX_BYTES);
    const limit=Math.min(notes.length,250);let next=0;
    async function worker(){while(next<limit&&gen===generation&&isConnected()){
      const f=notes[next++];
      try{const res=await driveGet(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(f.id)}?alt=media`,gen);
        const raw=await res.text();if(new Blob([raw]).size>MAX_BYTES)continue;
        edges.set(f.id,new Set(linkTargets(raw).map(t=>resolveWikilink(t)?.id).filter(Boolean)));indexed.add(f.id);
      }catch(e){if(gen!==generation)return;}
    }}
    try{await Promise.all(Array.from({length:Math.min(4,limit)},worker));}finally{
      graphBusy=false;
      if(gen===generation&&isConnected()){
        graphReady=limit===notes.length;
        message(`Knowledge ready · ${notes.length} notes · ${indexed.size} linked-note scans${graphReady?'':' (partial)'}.`);
        if(activeId)renderContext(currentRaw); else renderLocalGraph();
        if(!overlay.hidden)renderGlobalGraph();
      }
    }
  }
  function topFolder(id){let cur=id,last=id,seen=new Set();while(cur&&cur!==ROOT&&!seen.has(cur)){seen.add(cur);last=cur;cur=files.get(cur)?.parents?.[0];}return cur===ROOT&&last!==id?last:ROOT;}
  function folderHue(id){const key=topFolder(id);let h=0;for(const c of key)h=(h*31+c.charCodeAt(0))%360;return key===ROOT?150:h;}
  // Deterministic force-directed layout so connected notes cluster instead of sitting on a spiral.
  const GW=1350,GH=840;
  function layoutGraph(nodes,links,w,h){
    const n=nodes.length,idx=new Map(nodes.map((id,i)=>[id,i]));
    const px=new Float64Array(n),py=new Float64Array(n);
    nodes.forEach((id,i)=>{const a=i*2.399963229728653,r=Math.sqrt((i+.5)/n)*Math.min(w,h)*.4;px[i]=w/2+Math.cos(a)*r;py[i]=h/2+Math.sin(a)*r;});
    const pairs=links.map(([a,b])=>[idx.get(a),idx.get(b)]).filter(([a,b])=>a!==undefined&&b!==undefined&&a!==b);
    const k=Math.sqrt(w*h/Math.max(n,1))*(n>12?1.5:.6);
    for(let it=0;it<220;it++){
      const t=1-it/220,fx=new Float64Array(n),fy=new Float64Array(n);
      for(let i=0;i<n;i++)for(let j=i+1;j<n;j++){let dx=px[i]-px[j],dy=py[i]-py[j],d2=dx*dx+dy*dy+.01,d=Math.sqrt(d2),f=k*k/d2;fx[i]+=dx/d*f;fy[i]+=dy/d*f;fx[j]-=dx/d*f;fy[j]-=dy/d*f;}
      for(const [a,b] of pairs){const dx=px[b]-px[a],dy=py[b]-py[a],d=Math.sqrt(dx*dx+dy*dy)+.01,f=(d-k)*.05;fx[a]+=dx/d*f*k;fy[a]+=dy/d*f*k;fx[b]-=dx/d*f*k;fy[b]-=dy/d*f*k;}
      for(let i=0;i<n;i++){fx[i]+=(w/2-px[i])*.006;fy[i]+=(h/2-py[i])*.006;const m=Math.hypot(fx[i],fy[i])||1,s=Math.min(m,k*.5*t+1)/m;px[i]=Math.max(20,Math.min(w-20,px[i]+fx[i]*s));py[i]=Math.max(20,Math.min(h-20,py[i]+fy[i]*s));}
    }
    if(n>12){const x0=Math.min(...px),x1=Math.max(...px),y0=Math.min(...py),y1=Math.max(...py),m=60;
      const s=Math.min((w-2*m)/Math.max(x1-x0,1),(h-2*m)/Math.max(y1-y0,1));
      for(let i=0;i<n;i++){px[i]=w/2+(px[i]-(x0+x1)/2)*s;py[i]=h/2+(py[i]-(y0+y1)/2)*s;}}
    return new Map(nodes.map((id,i)=>[id,[px[i],py[i]]]));
  }
  function graphSvg(nodes,links,global=false){
    const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');
    const w=global?GW:320,h=global?GH:170;
    svg.setAttribute('viewBox',`0 0 ${w} ${h}`);svg.setAttribute('role','img');svg.setAttribute('aria-label','Graph of note links');svg.setAttribute('class','kr-graph');
    const pos=layoutGraph(nodes,links,w,h),degree=new Map(),adj=new Map();
    for(const id of nodes){degree.set(id,0);adj.set(id,new Set([id]));}
    const seen=new Set(),edgeEls=[];
    for(const [a,b] of links){if(!pos.has(a)||!pos.has(b)||a===b||seen.has(a+'>'+b))continue;seen.add(a+'>'+b);
      degree.set(a,degree.get(a)+1);degree.set(b,degree.get(b)+1);adj.get(a).add(b);adj.get(b).add(a);}
    seen.clear();
    for(const [a,b] of links){if(!pos.has(a)||!pos.has(b)||a===b||seen.has(a+'>'+b))continue;seen.add(a+'>'+b);
      const line=document.createElementNS(ns,'line'),p=pos.get(a),q=pos.get(b);
      [['x1',p[0]],['y1',p[1]],['x2',q[0]],['y2',q[1]]].forEach(([key,v])=>line.setAttribute(key,v));
      line.setAttribute('class','kr-edge');line.dataset.a=a;line.dataset.b=b;svg.append(line);edgeEls.push(line);}
    const ends=new Map();for(const e of edgeEls){for(const [id,s] of [[e.dataset.a,'1'],[e.dataset.b,'2']]){if(!ends.has(id))ends.set(id,[]);ends.get(id).push([e,s]);}}
    const groups=new Map();
    const setFocus=id=>{svg.classList.toggle('kr-has-focus',Boolean(id));
      for(const [nid,g] of groups)g.classList.toggle('kr-on',Boolean(id)&&adj.get(id).has(nid));
      for(const e of edgeEls)e.classList.toggle('kr-on',Boolean(id)&&(e.dataset.a===id||e.dataset.b===id));};
    const maxDeg=Math.max(1,...degree.values());
    nodes.forEach(id=>{const point=pos.get(id),f=files.get(id),g=document.createElementNS(ns,'g'),deg=degree.get(id);
      g.setAttribute('tabindex','0');g.setAttribute('role','button');g.setAttribute('aria-label',f?.name||'Note');g.setAttribute('class','kr-node'+(id===activeId?' kr-active':''));
      const radius=(global?7:4.5)+Math.sqrt(deg/maxDeg)*(global?12:5)+(id===activeId?4:0);
      const circle=document.createElementNS(ns,'circle');circle.setAttribute('cx',point[0]);circle.setAttribute('cy',point[1]);circle.setAttribute('r',radius.toFixed(1));
      circle.style.fill=id===activeId?'var(--accent)':`hsl(${folderHue(id)} 38% 55%)`;g.append(circle);
      const title=document.createElementNS(ns,'title');title.textContent=`${f?.name||'Note'} · ${deg} link${deg===1?'':'s'}`;g.append(title);
      const go=()=>{if(!isConnected())return;if(global)overlay.hidden=true;readFile(id);};
      let drag=null;
      const toSvg=e=>{const m=svg.getScreenCTM();if(!m)return null;const pt=svg.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;return pt.matrixTransform(m.inverse());};
      g.addEventListener('pointerdown',e=>{const s=toSvg(e);if(!s)return;e.stopPropagation();drag={moved:false,sx:e.clientX,sy:e.clientY,dx:point[0]-s.x,dy:point[1]-s.y};g.setPointerCapture(e.pointerId);});
      g.addEventListener('pointermove',e=>{if(!drag)return;if(!drag.moved&&Math.hypot(e.clientX-drag.sx,e.clientY-drag.sy)<4)return;drag.moved=true;const s=toSvg(e);if(!s)return;
        point[0]=Math.max(10,Math.min(w-10,s.x+drag.dx));point[1]=Math.max(10,Math.min(h-10,s.y+drag.dy));
        circle.setAttribute('cx',point[0]);circle.setAttribute('cy',point[1]);label.setAttribute('x',point[0]+radius+3);label.setAttribute('y',point[1]+3);
        for(const [el,s2] of ends.get(id)||[]){el.setAttribute('x'+s2,point[0]);el.setAttribute('y'+s2,point[1]);}});
      g.addEventListener('pointerup',e=>{const moved=drag&&drag.moved;drag=null;if(g.hasPointerCapture(e.pointerId))g.releasePointerCapture(e.pointerId);g.dataset.dragged=moved?'1':'';});
      g.addEventListener('click',()=>{if(g.dataset.dragged){g.dataset.dragged='';return;}go();});g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go();}});
      g.addEventListener('mouseenter',()=>setFocus(id));g.addEventListener('mouseleave',()=>setFocus(null));g.addEventListener('focus',()=>setFocus(id));g.addEventListener('blur',()=>setFocus(null));
      const showLabel=id===activeId||(!global&&nodes.length<=6)||(global&&deg>=Math.max(4,maxDeg*.6));
      const label=document.createElementNS(ns,'text');label.setAttribute('x',point[0]+radius+3);label.setAttribute('y',point[1]+3);label.setAttribute('font-size',global?'15':'9');
      label.setAttribute('class','kr-label'+(showLabel?' kr-always':''));label.textContent=(f?.name||'').replace(/\.(md|markdown|txt)$/i,'').slice(0,26);g.append(label);
      groups.set(id,g);svg.append(g);
    });
    return svg;
  }  function renderLocalGraph(){localGraph.replaceChildren();if(!activeId){const nodes=[...indexed].slice(0,25);const links=[];for(const id of nodes)for(const target of edges.get(id)||[])if(nodes.includes(target))links.push([id,target]);if(nodes.length)localGraph.append(graphSvg(nodes,links));return;}const neighbors=new Set([activeId]);const links=[];
    for(const [id,ids] of edges){for(const target of ids){if(id===activeId||target===activeId){neighbors.add(id);neighbors.add(target);links.push([id,target]);}}}
    const nodes=[activeId,...[...neighbors].filter(id=>id!==activeId).slice(0,18)];
    localGraph.append(graphSvg(nodes,links));if(nodes.length===1){const p=document.createElement('p');p.textContent=graphReady?'No linked notes found.':'Indexing relationships…';localGraph.append(p);}
  }
  let graphZoom=1, graphPanX=0, graphPanY=0, graphPointer=null;
  function updatePrivateCamera(){
    const svg=globalGraph.querySelector('svg');if(!svg)return;
    svg.setAttribute('viewBox',`${(GW-GW/graphZoom)/2-graphPanX} ${(GH-GH/graphZoom)/2-graphPanY} ${GW/graphZoom} ${GH/graphZoom}`);
    $('krGraphZoomLabel').textContent=Math.round(graphZoom*100)+'%';
  }
  function zoomPrivate(mult){graphZoom=Math.max(.35,Math.min(5,graphZoom*mult));updatePrivateCamera();}
  function fitPrivate(){graphZoom=1;graphPanX=0;graphPanY=0;updatePrivateCamera();}
  globalGraph.addEventListener('wheel',e=>{if(overlay.hidden)return;e.preventDefault();zoomPrivate(e.deltaY<0?1.15:1/1.15);},{passive:false});
  globalGraph.addEventListener('pointerdown',e=>{if(e.target.closest('g[role="button"]'))return;graphPointer={x:e.clientX,y:e.clientY};globalGraph.setPointerCapture(e.pointerId);});
  globalGraph.addEventListener('pointermove',e=>{if(!graphPointer)return;const r=globalGraph.getBoundingClientRect();graphPanX+=(e.clientX-graphPointer.x)*GW/(Math.max(r.width,1)*graphZoom);graphPanY+=(e.clientY-graphPointer.y)*GH/(Math.max(r.height,1)*graphZoom);graphPointer={x:e.clientX,y:e.clientY};updatePrivateCamera();});
  globalGraph.addEventListener('pointerup',()=>graphPointer=null);
  globalGraph.addEventListener('pointercancel',()=>graphPointer=null);
  $('krGraphZoomIn').addEventListener('click',()=>zoomPrivate(1.25));
  $('krGraphZoomOut').addEventListener('click',()=>zoomPrivate(1/1.25));
  $('krGraphFit').addEventListener('click',fitPrivate);
  $('krGraphReset').addEventListener('click',fitPrivate);
  function renderGlobalGraph(){globalGraph.replaceChildren();const rank=id=>(edges.get(id)?.size||0);const nodes=[...indexed].sort((a,b)=>rank(b)-rank(a)).slice(0,150),links=[];
    for(const id of nodes)for(const target of edges.get(id)||[])if(nodes.includes(target))links.push([id,target]);
    globalGraph.append(graphSvg(nodes,links,true));updatePrivateCamera();
    const nav=$('krGraphNavigation');nav.replaceChildren();
    for(const id of nodes){const f=files.get(id);if(!f)continue;const b=document.createElement('button');b.type='button';b.className='graph-note-link';b.textContent=f.name.replace(/\.(md|markdown|txt)$/i,'');if(id===activeId)b.setAttribute('aria-current','true');b.addEventListener('click',()=>{overlay.hidden=true;readFile(id);});nav.append(b);}

    if(indexed.size>150){const p=document.createElement('p');p.textContent='Showing the 150 most-linked notes for readability.';globalGraph.append(p);}
  }
  function openGraph(){if(!isConnected())return;overlay.hidden=false;fitPrivate();renderGlobalGraph();$('krGraphZoomIn').focus();}
  $('krExpandGraph').addEventListener('click',openGraph);
  $('krFocusReading').addEventListener('click',()=>{const view=$('view-knowledge');const focused=view.classList.toggle('reading-focus');$('krFocusReading').textContent=focused?'Show panels':'Focus reading';$('krFocusReading').setAttribute('aria-pressed',String(focused));});

  $('krCloseGraph').addEventListener('click',()=>overlay.hidden=true);
  overlay.addEventListener('click',e=>{if(e.target===overlay)overlay.hidden=true;});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')overlay.hidden=true;});
  function neutraliseLinks(container){
    container.querySelectorAll('a').forEach(a=>{const href=a.getAttribute('href')||'';if(href.startsWith('#')&&/^#[A-Za-z0-9_-]+$/.test(href))return;
      const span=document.createElement('span');span.textContent=a.textContent;span.title='External and attachment links are disabled for privacy';a.replaceWith(span);});
    container.querySelectorAll('img,iframe,video,audio,object,embed').forEach(e=>e.remove());
  }
  async function readFile(id){
    if(!isConnected()){signOut();return;}const f=files.get(id);if(!f||!isNote(f))return;
    const gen=generation;clearNote();message('Loading note from Google Drive…');
    try{
      if(Number(f.size||0)>MAX_BYTES)throw Error('Note exceeds the 512 KB limit.');
      const res=await driveGet(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(id)}?alt=media`,gen);
      const raw=await res.text();if(new Blob([raw]).size>MAX_BYTES)throw Error('Note is too large.');
      if(!window.marked||!window.DOMPurify)throw Error('Markdown renderer is unavailable.');
      // Remove Obsidian YAML frontmatter before Markdown rendering; show only meaningful properties.
      let bodyText=raw, metadata={};
      const front=raw.match(/^\uFEFF?---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/);
      if(front){
        bodyText=raw.slice(front[0].length);
        try{const value=window.jsyaml?.load(front[1]);if(value&&typeof value==='object'&&!Array.isArray(value))metadata=value;}catch(_e){}
      }
      const escapedWikilinks=bodyText.replace(/\[\[([^\]]+)\]\]/g,(_m,t)=>{const label=t.split('|').at(-1);return '`[['+label.replace(/`/g,'')+']]`';});
      // Same Markdown parser, math extension, and table/callout transforms as the public Garden.
      // KaTeX uses inline geometry styles to position fractions; stripping those styles collapses equations.
      const html=window.gardenRenderMarkdown(escapedWikilinks,{privateMode:true});
      if(gen!==generation||!isConnected())return;
      noteBody.innerHTML=html;neutraliseLinks(noteBody);
      // The article has the same title header as the Garden; remove only a matching first H1.
      const displayTitle = f.name.replace(/\.(md|markdown|txt)$/i,'');
      // Obsidian notes sometimes begin with a separator or a blank paragraph before the H1.
      const openingElements = [...noteBody.children].slice(0, 8);
      const repeatedHeading = openingElements.find(el => /^H[12]$/.test(el.tagName) && el.textContent.trim().toLocaleLowerCase() === displayTitle.toLocaleLowerCase());
      if(repeatedHeading) {
        const preceding = repeatedHeading.previousElementSibling;
        repeatedHeading.remove();
        if(preceding?.tagName === 'HR' && !preceding.previousElementSibling) preceding.remove();
      }
      noteBody.querySelectorAll('code').forEach(code=>{const m=code.textContent.match(/^\[\[([^\]]+)\]\]$/);if(!m)return;
        const target=resolveWikilink(m[1]);if(!target)return;
        const link=document.createElement('button');link.type='button';link.className='kr-wikilink-button';
        link.textContent=m[1].split('|').at(-1);link.addEventListener('click',()=>readFile(target.id));code.replaceWith(link);
      });
      noteTitle.textContent=f.name.replace(/\.(md|markdown|txt)$/i,'');crumb.textContent=parentName(id);
      propsBox.replaceChildren();
      for(const key of ['type','status','confidence','tags']){
        const value=metadata[key];if(value==null||value===''||(Array.isArray(value)&&!value.length))continue;
        const chip=document.createElement('span');chip.className='kr-property-chip';
        chip.textContent=key==='tags'?(Array.isArray(value)?value.join(' · '):String(value)):key+' · '+String(value);
        propsBox.append(chip);
      }
      propsBox.hidden=!propsBox.childElementCount;
      activeId=id;currentRaw=raw;currentName=f.name;noteWrap.hidden=false;empty.hidden=true;renderTree();renderContext(raw);
      message('Note opened. Click any other note in the folder tree to switch.');
    }catch(err){if(gen===generation){clearNote();message(err.message||'Unable to read note.',true);}}
  }
  function login(){
    if(isConnected()){tab.hidden=false;switchView('knowledge');return;}
    if(!window.google?.accounts?.oauth2){barnabyBubble('companion','Google sign-in has not loaded. Check your internet connection and retry.');return;}
    if(!client)client=google.accounts.oauth2.initTokenClient({client_id:CLIENT_ID,scope:SCOPE,include_granted_scopes:false,
      callback:result=>{
        if(result.error||!result.access_token){barnabyBubble('companion','Google authorisation was not completed.');return;}
        token=result.access_token;expiry=Date.now()+Math.max(30,Number(result.expires_in||3000)-60)*1000;tab.hidden=false;saveAuth();
        if($('teddyChatDrawer')?.classList.contains('open'))toggleTeddyChat();switchView('knowledge');
      }
    });
    client.requestAccessToken({prompt:'select_account'});
  }
  refresh.addEventListener('click',indexLibrary);$('krSignOut').addEventListener('click',signOut);$('krClearNote').addEventListener('click',clearNote);
  filter.addEventListener('input',renderTree);
  window.addEventListener('focus',()=>{if(token&&!isConnected())signOut();});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&token&&!isConnected())signOut();});
  if(restoreAuth())tab.hidden=false;
  return {login,signOut,isConnected,updateStatus};
})();
