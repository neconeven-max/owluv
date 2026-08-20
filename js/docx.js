/* OwlUV - citac .docx datoteka.
   ZASTO OVAKO: knjiznice koje .docx pretvaraju u HTML (mammoth i slicne) rade
   suprotno od onoga sto nama treba - njihov cilj je prikazati dokument kakav
   IZGLEDA, pa tiho izbace tekst oznacen kao skriven, komentare, obrisani tekst
   iz pracenja izmjena i zaglavlja. Zato ovdje citamo XML iz .docx paketa
   izravno, a pretvorbu u prikaz radimo zasebno i namjerno: sve sto je Word
   sakrio ostaje u rekonstrukciji, samo oznaceno da ga detektor prepozna.
   Jedina vanjska knjiznica je fflate (raspakiravanje ZIP-a), vendorirana u repo. */
(function(){
  const OwlUV = window.OwlUV = window.OwlUV || {};
  const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

  // ---------- XML pomocnici, neovisni o prefiksu (w:, v:, wps: ...) ----------
  const ln  = n => n.localName || String(n.nodeName).replace(/^.*:/,'');
  const els = n => n?Array.from(n.childNodes).filter(c=>c.nodeType===1):[];
  const kid = (n,name) => els(n).find(c=>ln(c)===name) || null;
  const kids= (n,name) => els(n).filter(c=>ln(c)===name);
  function attr(n,name){
    if(!n||!n.attributes) return null;
    for(const a of Array.from(n.attributes)){
      const l=a.localName||a.name.replace(/^.*:/,'');
      if(l===name) return a.value;
    }
    return null;
  }
  // OOXML prekidac: <w:vanish/> = ukljuceno, <w:vanish w:val="0"/> = iskljuceno
  const onOff = n => { const v=attr(n,'val'); return !(v==='0'||v==='false'||v==='off'); };
  const deep  = (n,name) => { const out=[]; if(!n) return out; (function w(x){ if(x.nodeType===1){ if(ln(x)===name) out.push(x); els(x).forEach(w);} })(n); return out; };

  function parseXml(str){
    const d=new DOMParser().parseFromString(str,'application/xml');
    if(d.getElementsByTagName('parsererror').length) return null;
    return d;
  }

  // ---------- svojstva teksta (run properties) ----------
  function readRPr(rPr){
    const p={};
    if(!rPr) return p;
    els(rPr).forEach(c=>{
      switch(ln(c)){
        case 'vanish':    p.vanish    = onOff(c); break;
        case 'webHidden': p.webHidden = onOff(c); break;
        case 'color':     { const v=attr(c,'val'); if(v&&v!=='auto') p.color=v; break; }
        case 'sz':        { const v=parseFloat(attr(c,'val')); if(v>0) p.sz=v; break; }
        case 'b':         p.b=onOff(c); break;
        case 'i':         p.i=onOff(c); break;
        case 'u':         { const v=attr(c,'val'); p.u=(v!=='none'); break; }
        case 'strike':    p.strike=onOff(c); break;
        case 'highlight': { const v=attr(c,'val'); if(v&&v!=='none') p.hl=v; break; }
        case 'rStyle':    p.rStyle=attr(c,'val'); break;
      }
    });
    return p;
  }
  const merge=(...a)=>Object.assign({},...a.filter(Boolean));

  // ---------- stilovi: skrivanje se moze sakriti i u definiciju stila ----------
  function readStyles(doc){
    const map={}, defaults={};
    if(!doc) return {map,defaults};
    const root=doc.documentElement;
    const dd=kid(root,'docDefaults');
    if(dd){ const rd=kid(dd,'rPrDefault'); if(rd) Object.assign(defaults,readRPr(kid(rd,'rPr'))); }
    kids(root,'style').forEach(st=>{
      const id=attr(st,'styleId'); if(!id) return;
      map[id]={ type:attr(st,'type'), basedOn:attr(kid(st,'basedOn'),'val'),
                name:attr(kid(st,'name'),'val')||id, rPr:readRPr(kid(st,'rPr')) };
    });
    return {map,defaults};
  }
  function resolveStyle(styles,id,seen){
    if(!id||!styles.map[id]) return {};
    seen=seen||new Set();
    if(seen.has(id)) return {};
    seen.add(id);
    const s=styles.map[id];
    return merge(resolveStyle(styles,s.basedOn,seen), s.rPr);
  }

  // ---------- svojstva u CSS + razloge skrivenosti ----------
  function propsToCss(p){
    let css='', reasons=[];
    if(p.vanish)    { reasons.push('wvanish');    css+='display:none;'; }
    if(p.webHidden) { reasons.push('wwebhidden'); css+='display:none;'; }
    if(p.color && /^[0-9a-fA-F]{6}$/.test(p.color)) css+='color:#'+p.color+';';
    if(p.sz)        css+='font-size:'+(p.sz/2)+'pt;';
    if(p.b)         css+='font-weight:700;';
    if(p.i)         css+='font-style:italic;';
    if(p.u)         css+='text-decoration:underline;';
    if(p.strike)    css+='text-decoration:line-through;';
    if(p.hl && p.hl!=='white') css+='background:'+p.hl+';';
    return {css,reasons};
  }

  // ---------- geometrija: je li okvir izguran izvan stranice ----------
  const EMU_IN=914400;
  function vmlOffscreen(style){
    if(!style) return false;
    if(/visibility\s*:\s*hidden|display\s*:\s*none/i.test(style)) return true;
    let off=false;
    style.replace(/(margin-left|margin-top|left|top)\s*:\s*(-?[\d.]+)(pt|in|mm|cm|px)?/gi,(m,k,v,u)=>{
      let pt=parseFloat(v);
      if(u==='in') pt*=72; else if(u==='mm') pt*=2.8346; else if(u==='cm') pt*=28.346; else if(u==='px') pt*=0.75;
      if(pt < -30 || pt > 900) off=true;
      return m;
    });
    return off;
  }
  function drawingOffscreen(anchor){
    let off=false;
    ['positionH','positionV'].forEach(ax=>{
      kids(anchor,ax).forEach(pos=>{
        const po=kid(pos,'posOffset');
        if(po){
          const emu=parseFloat(po.textContent||'0');
          if(emu < -0.4*EMU_IN || emu > 12*EMU_IN) off=true;
        }
      });
    });
    return off;
  }

  // ================= citanje jednog dijela dokumenta =================
  // vraca {html, deleted:[], boxes:[]}
  function readPart(root, styles, ctx){
    const out={html:'',deleted:[],boxes:[]};
    if(!root) return out;
    out.html = blocks(els(root));

    function blocks(list){
      let h='';
      list.forEach(n=>{
        const t=ln(n);
        if(t==='p')   h+=para(n);
        else if(t==='tbl') h+=table(n);
        else if(t==='sdt'){ const c=kid(n,'sdtContent'); if(c) h+=blocks(els(c)); }
        else if(t==='sectPr'){ /* postavke stranice, nema teksta */ }
      });
      return h;
    }
    function table(tbl){
      let h='<table>';
      kids(tbl,'tr').forEach(tr=>{
        h+='<tr>';
        kids(tr,'tc').forEach(tc=>{ h+='<td>'+blocks(els(tc))+'</td>'; });
        h+='</tr>';
      });
      return h+'</table>';
    }
    function para(p){
      const pPr=kid(p,'pPr');
      const pStyleId=attr(kid(pPr,'pStyle'),'val');
      const paraRPr=readRPr(kid(pPr,'rPr'));
      const paraStyle=merge(styles.defaults, resolveStyle(styles,pStyleId));
      let tag='p';
      const nm=(styles.map[pStyleId]&&styles.map[pStyleId].name)||pStyleId||'';
      const hm=/^(heading|naslov|überschrift|titre|título|titolo)\s*([1-6])/i.exec(nm)||/^Heading([1-6])$/i.exec(pStyleId||'');
      if(hm) tag='h'+Math.min(3,parseInt(hm[2]||hm[1],10));
      const inner=runsOf(els(p), merge(paraStyle,paraRPr));
      return '<'+tag+'>'+(inner||'<br>')+'</'+tag+'>';
    }
    function runsOf(list, inherited){
      let h='';
      list.forEach(n=>{
        const t=ln(n);
        if(t==='r')            h+=run(n,inherited,false);
        else if(t==='hyperlink'||t==='smartTag'||t==='bookmarkStart'||t==='bookmarkEnd') h+=runsOf(els(n),inherited);
        else if(t==='ins'||t==='moveTo') h+=runsOf(els(n),inherited);
        else if(t==='del'||t==='moveFrom'){
          const txt=els(n).map(r=>ln(r)==='r'?runText(r):'').join('').trim();
          if(txt) out.deleted.push(txt);
        }
        else if(t==='sdt'){ const c=kid(n,'sdtContent'); if(c) h+=runsOf(els(c),inherited); }
        else if(t==='commentRangeStart'||t==='commentRangeEnd'||t==='proofErr'||t==='pPr'){ /* nema teksta */ }
      });
      return h;
    }
    function runText(r){
      let s='';
      els(r).forEach(c=>{
        const t=ln(c);
        if(t==='t'||t==='delText'||t==='instrText') s+=c.textContent||'';
        else if(t==='tab') s+='\t';
        else if(t==='br'||t==='cr') s+='\n';
        else if(t==='noBreakHyphen') s+='-';
      });
      return s;
    }
    function run(r, inherited){
      const direct=readRPr(kid(r,'rPr'));
      const eff=merge(inherited, resolveStyle(styles,direct.rStyle), direct);
      const {css,reasons}=propsToCss(eff);
      let inner='';
      els(r).forEach(c=>{
        const t=ln(c);
        if(t==='t')            inner+=esc(c.textContent||'');
        else if(t==='tab')     inner+=' &nbsp; ';
        else if(t==='br'||t==='cr') inner+='<br>';
        else if(t==='noBreakHyphen') inner+='-';
        else if(t==='instrText'){ /* kod polja, ne prikazujemo */ }
        else if(t==='drawing')  inner+=drawing(c);
        else if(t==='pict')     inner+=pict(c);
        else if(t==='AlternateContent'){
          // Word isti okvir zapise dvaput (Choice + Fallback); uzimamo samo prvi
          const ch=kid(c,'Choice')||kid(c,'Fallback');
          if(ch) inner+=runsOf(els(ch),inherited);
        }
      });
      if(!inner) return '';
      if(!css && !reasons.length) return inner;
      return '<span'+(css?' style="'+esc(css)+'"':'')+
             (reasons.length?' data-uv-reason="'+esc(reasons.join('|'))+'"':'')+'>'+inner+'</span>';
    }
    // ---- tekstualni okviri ----
    function boxContent(tx){
      const c=kid(tx,'txbxContent')||deep(tx,'txbxContent')[0];
      return c?blocks(els(c)):'';
    }
    function drawing(d){
      let h='';
      els(d).forEach(a=>{
        const isAnchor = ln(a)==='anchor';
        const off = isAnchor ? drawingOffscreen(a) : false;
        deep(a,'txbx').forEach(tx=>{
          const body=boxContent(tx);
          if(!body) return;
          if(off) out.boxes.push(body); else h+='<div class="uv-box">'+body+'</div>';
        });
        if(deep(a,'blip').length) ctx.hasImages=true;
      });
      return h;
    }
    function pict(p){
      let h='';
      deep(p,'shape').forEach(sh=>{
        const off=vmlOffscreen(attr(sh,'style'));
        deep(sh,'textbox').forEach(tb=>{
          const body=boxContent(tb);
          if(!body) return;
          if(off) out.boxes.push(body); else h+='<div class="uv-box">'+body+'</div>';
        });
      });
      if(deep(p,'imagedata').length) ctx.hasImages=true;
      return h;
    }
    return out;
  }

  // ================= glavni ulaz =================
  function parse(u8){
    let files;
    try{ files=fflate.unzipSync(u8); }
    catch(e){ throw new Error('ZIP'); }
    if(!files['word/document.xml']) throw new Error('NOTDOCX');
    const txt=p=>files[p]?fflate.strFromU8(files[p]):null;
    const xml=p=>{ const s=txt(p); return s?parseXml(s):null; };

    const ctx={hasImages:Object.keys(files).some(k=>/^word\/media\//.test(k))};
    const styles=readStyles(xml('word/styles.xml'));

    const docXml=xml('word/document.xml');
    if(!docXml) throw new Error('NOTDOCX');
    const bodyEl=kid(docXml.documentElement,'body');
    const body=readPart(bodyEl,styles,ctx);

    // zaglavlja i podnozja
    const headers=[];
    Object.keys(files).filter(k=>/^word\/(header|footer)\d*\.xml$/.test(k)).sort().forEach(k=>{
      const d=xml(k); if(!d) return;
      const part=readPart(d.documentElement,styles,ctx);
      body.deleted.push.apply(body.deleted,part.deleted);
      body.boxes.push.apply(body.boxes,part.boxes);
      const name=/header/.test(k)?'header':'footer';
      if(part.html.replace(/<[^>]*>/g,'').trim()) headers.push({file:k.replace('word/',''),kind:name,html:part.html});
    });

    // komentari
    const comments=[];
    const cx=xml('word/comments.xml');
    if(cx) kids(cx.documentElement,'comment').forEach(c=>{
      const part=readPart(c,styles,ctx);
      if(!part.html.replace(/<[^>]*>/g,'').trim()) return;
      comments.push({author:attr(c,'author')||'', date:(attr(c,'date')||'').slice(0,10), html:part.html});
    });

    // fusnote i biljeske na kraju
    const notes=[];
    ['word/footnotes.xml','word/endnotes.xml'].forEach(k=>{
      const d=xml(k); if(!d) return;
      els(d.documentElement).forEach(n=>{
        const ty=attr(n,'type');
        if(ty&&ty!=='normal') return;         // razdjelnici, ne sadrzaj
        const part=readPart(n,styles,ctx);
        if(!part.html.replace(/<[^>]*>/g,'').trim()) return;
        notes.push({kind:/footnotes/.test(k)?'foot':'end',html:part.html});
      });
    });

    // svojstva dokumenta
    const props=[];
    const CORE={title:'title',subject:'subject',creator:'creator',description:'description',keywords:'keywords',lastModifiedBy:'lastMod',category:'category'};
    const core=xml('docProps/core.xml');
    if(core) els(core.documentElement).forEach(n=>{
      const k=CORE[ln(n)], v=(n.textContent||'').trim();
      if(k&&v) props.push({k,v});
    });
    const app=xml('docProps/app.xml');
    if(app) els(app.documentElement).forEach(n=>{
      const t=ln(n), v=(n.textContent||'').trim();
      if(!v) return;
      if(t==='Company') props.push({k:'company',v});
      if(t==='Manager') props.push({k:'manager',v});
    });

    return {bodyHtml:body.html, deleted:body.deleted, boxes:body.boxes,
            headers, comments, notes, props, hasImages:ctx.hasImages};
  }

  // ---------- sastavljanje prikaza za lijevi panel ----------
  // Aneks je vidljiv namjerno: sve sto Word ne prikazuje ili sto misem ne mozes
  // oznaciti ovdje postaje tekst, pa prolazi kroz iste provjere fraza i
  // nevidljivih znakova kao i glavni tekst.
  function toHtml(r,t){
    let h=r.bodyHtml||'';
    const sec=(key,label,items)=>{
      if(!items.length) return '';
      return '<div class="uv-annex" data-uv-annex="'+key+'"><div class="uv-annex-h">'+esc(label)+'</div>'+
             items.map(x=>'<div class="uv-annex-i">'+x+'</div>').join('')+'</div>';
    };
    h+=sec('comments',t.ax.comments,r.comments.map(c=>
        '<span class="uv-tag">'+esc(c.author||'?')+(c.date?' · '+esc(c.date):'')+'</span>'+c.html));
    h+=sec('deleted',t.ax.deleted,r.deleted.map(d=>'<p>'+esc(d)+'</p>'));
    h+=sec('headers',t.ax.headers,r.headers.map(x=>'<span class="uv-tag">'+esc(x.file)+'</span>'+x.html));
    h+=sec('notes',t.ax.notes,r.notes.map(x=>x.html));
    h+=sec('textbox',t.ax.textbox,r.boxes.map(b=>'<div data-uv-reason="wtextbox">'+b+'</div>'));
    h+=sec('props',t.ax.props,r.props.map(p=>
        '<p><span class="uv-tag">'+esc(t.prop[p.k]||p.k)+'</span>'+esc(p.v)+'</p>'));
    return h;
  }

  // ---------- nalazi specificni za Word ----------
  // anchor je mjesto u desnom panelu na koje klik na nalaz skace. Svojstva
  // dokumenta ga namjerno nemaju: to su podaci o datoteci, a ne mjesto u tekstu,
  // pa taj nalaz ostaje nekliknabilan i to se u sucelju vidi.
  const ax = key => '[data-uv-annex="'+key+'"]';
  function findings(r,t){
    const f=[];
    if(r.comments.length) f.push({sev:'warn',title:t.fCommTitle(r.comments.length),why:t.fCommWhy,
      anchor:ax('comments'),
      items:r.comments.map(c=>({q:strip(c.html),n:c.author||'?'}))});
    if(r.deleted.length) f.push({sev:'warn',title:t.fDelTitle(r.deleted.length),why:t.fDelWhy,
      anchor:ax('deleted'),
      items:r.deleted.map(d=>({q:d.slice(0,300)}))});
    if(r.boxes.length) f.push({sev:'danger',title:t.fBoxTitle(r.boxes.length),why:t.fBoxWhy,
      anchor:ax('textbox'),
      items:r.boxes.map(b=>({q:strip(b).slice(0,300)}))});
    if(r.headers.length) f.push({sev:'info',title:t.fHeadTitle(r.headers.length),why:t.fHeadWhy,
      anchor:ax('headers'),
      items:r.headers.map(x=>({q:strip(x.html),n:x.file}))});
    if(r.notes.length) f.push({sev:'info',title:t.fNoteTitle(r.notes.length),why:t.fNoteWhy,
      anchor:ax('notes'),
      items:r.notes.map(x=>({q:strip(x.html)}))});
    if(r.props.length) f.push({sev:'info',title:t.fPropTitle(r.props.length),why:t.fPropWhy,
      items:r.props.map(p=>({q:p.v,n:t.prop[p.k]||p.k}))});
    return f;
  }
  function strip(html){
    const d=document.createElement('div'); d.innerHTML=html;
    return (d.textContent||'').replace(/\s+/g,' ').trim();
  }

  OwlUV.docx={parse,toHtml,findings};
})();
