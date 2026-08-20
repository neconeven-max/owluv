/* OwlUV - detekcijska jezgra.
   Preseljena iz uv-skener v3.3 doslovno. Logika detekcije (koji uvjeti okidaju)
   nije mijenjana. Jedina izmjena je da hiddenReasons() vraca KLJUCEVE razloga
   umjesto gotovih hrvatskih recenica, da bi se razlozi mogli prevesti na svih
   6 jezika. Vidi README, odjeljak "Sto je promijenjeno u jezgri". */
(function(){
  const OwlUV = window.OwlUV = window.OwlUV || {};

  // ============ DETEKCIJA FRAZA - UVIJEK SVI JEZICI ============
  const PHRASES=[
    [/\b(ignore|disregard|forget)\s+(all\s+|any\s+)?(previous|prior|above|earlier)\s+(instructions?|prompts?|rules?)/gi,'inj'],
    [/\b(if|when)\s+you('| a)?re?\s+(an?\s+)?(ai|assistant|language model|llm|chatbot)/gi,'ai'],
    [/\bas an ai\b|\bsystem prompt\b|\bhidden (instruction|prompt|text)\b/gi,'ai'],
    [/\b(the\s+)?(correct\s+)?answer\s+is\b|\breply\s+(only\s+)?with\b|\brespond\s+(only\s+)?with\b/gi,'ans'],
    [/\b(select|choose|pick|rank|rate|hire)\s+(this|the)\s+(cv|resume|candidate|applicant)/gi,'cv'],
    [/\b(best|top|ideal|perfect)\s+(candidate|applicant|choice)\b/gi,'cv'],
    [/\b(do not|don'?t|never)\s+(mention|reveal|tell|disclose)\b|\bkeep this secret\b/gi,'sec'],
    [/zanemari\w*\s+(sve\s+)?(prethodn\w+|gornj\w+|ranij\w+)?\s*(upute|naredbe|pravila)/gi,'inj'],
    [/ignoriraj\w*\s+(sve\s+)?(prethodn\w+|gornj\w+)?\s*(upute|naredbe)/gi,'inj'],
    [/ako\s+(ovo\s+)?čita\w+|ako\s+si\s+(ai|umjetna\s+inteligencija|jezični\s+model|asistent)/gi,'ai'],
    [/napomena\s+za\s+(sustav|ai|model)/gi,'ai'],
    [/\bodgovor\s+(je|glasi)\b|\bto[čc]an\s+odgovor\b|\bodgovori\s+(samo\s+)?s[a]?\b/gi,'ans'],
    [/odaberi\s+(ovog|ovaj|ovu)\s+(kandidata|životopis|cv)|najbolji\s+kandidat/gi,'cv'],
    [/ne\s+spominji|nemoj\s+(spomenuti|otkriti|reći)|drži\s+u\s+tajnosti/gi,'sec'],
    [/ignorier\w*\s+(alle\s+)?(vorherigen|obigen|früheren)\s+(anweisungen|regeln|prompts?)/gi,'inj'],
    [/wenn\s+du\s+(eine?\s+)?(ki|sprachmodell|assistent)\s+bist/gi,'ai'],
    [/die\s+(richtige\s+)?antwort\s+(ist|lautet)|antworte\s+(nur\s+)?mit/gi,'ans'],
    [/wähle?\s+(diesen|dieses)\s+(kandidaten|lebenslauf)|beste[rn]?\s+kandidat/gi,'cv'],
    [/erwähne?\s+(das|dies)\s+nicht|halte?\s+(das|dies)\s+geheim/gi,'sec'],
    [/ignore[zr]?\s+(toutes\s+)?les\s+(instructions|consignes)\s+(précédentes|ci-dessus)/gi,'inj'],
    [/si\s+(tu\s+es|vous\s+êtes)\s+une?\s+(ia|intelligence\s+artificielle|assistant)/gi,'ai'],
    [/la\s+(bonne\s+)?réponse\s+est|réponds?\s+(uniquement\s+)?avec/gi,'ans'],
    [/choisis(sez)?\s+ce\s+(candidat|cv)|meilleur\s+candidat/gi,'cv'],
    [/ne\s+(mentionne[z]?|révèle[z]?)\s+pas|garde[z]?\s+(ce(la)?\s+)?secret/gi,'sec'],
    [/ignora\w*\s+(todas\s+)?las\s+instrucciones\s+(anteriores|previas)/gi,'inj'],
    [/si\s+eres\s+una?\s+(ia|inteligencia\s+artificial|asistente|modelo)/gi,'ai'],
    [/la\s+respuesta\s+(correcta\s+)?es|responde\s+(solo\s+)?con/gi,'ans'],
    [/elige\s+(a\s+)?este\s+(candidato|currículum)|mejor\s+candidato/gi,'cv'],
    [/no\s+(menciones|reveles)|mantén\s+esto\s+en\s+secreto/gi,'sec'],
    [/ignora\w*\s+(tutte\s+)?le\s+istruzioni\s+precedenti/gi,'inj'],
    [/se\s+sei\s+un['’\s]?(ia|intelligenza\s+artificiale|assistente|modello)/gi,'ai'],
    [/la\s+risposta\s+(corretta\s+)?(è|e')|rispondi\s+(solo\s+)?con/gi,'ans'],
    [/scegli\s+questo\s+(candidato|curriculum)|miglior\s+candidato/gi,'cv'],
    [/non\s+(menzionare|rivelare)|mantieni\s+(il\s+)?segreto/gi,'sec']
  ];

  // ============ NEVIDLJIVI ZNAKOVI ============
  const INVISIBLE={
    0x200B:'ZWSP',0x200C:'ZWNJ',0x200D:'ZWJ',0x2060:'Word Joiner',
    0xFEFF:'BOM',0x00AD:'soft hyphen',0x180E:'mongolian sep.',
    0x034F:'CGJ',0x061C:'ALM',0x115F:'Hangul filler',0x1160:'Hangul filler',
    0x17B4:'Khmer inv.',0x17B5:'Khmer inv.',0x3164:'Hangul filler',0xFFA0:'Hangul filler',
    0x200E:'LRM',0x200F:'RLM',
    0x202A:'BIDI embed',0x202B:'BIDI embed',0x202C:'BIDI pop',0x202D:'BIDI override',0x202E:'BIDI override!',
    0x2066:'BIDI isolate',0x2067:'BIDI isolate',0x2068:'BIDI isolate',0x2069:'BIDI isolate'
  };
  const isVariation=cp=>(cp>=0xFE00&&cp<=0xFE0F)||(cp>=0xE0100&&cp<=0xE01EF);
  const isTag=cp=>(cp>=0xE0000&&cp<=0xE007F);
  const isOddSpace=cp=>(cp>=0x2000&&cp<=0x200A)||cp===0x205F||cp===0x3000;
  const DASHES=/[\u2014\u2013\u2015]/g;

  const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

  // ============ TEHNICKE OZNAKE IZ MEDUSPREMNIKA ============
  // Kad se sadrzaj kopira iz Worda (i iz drugih izvora) i zalijepi, sam sustav
  // u medduspremnik ubaci sluzbene oznake pocetka i kraja odabira, kao HTML
  // komentare. One nisu skriveni sadrzaj nego tehnika prijenosa, pa bi ih
  // prijava kao nalaz pretvorila u laznu uzbunu.
  // VAZNO: HTML komentari opcenito OSTAJU nalaz, jer se u njima stvarno kriju
  // poruke. Ovdje se preskacu iskljucivo dolje popisane, poznate oznake.
  const CLIP_MARKERS=[
    /^start\s*fragment$/i,   /^end\s*fragment$/i,      // Windows i macOS CF_HTML
    /^start\s*selection$/i,  /^end\s*selection$/i,     // isti zapis, granice odabira
    /^start\s*html$/i,       /^end\s*html$/i,          // zaglavlje CF_HTML-a
    /^startfragment:\d+$/i,  /^endfragment:\d+$/i      // varijanta s brojem znaka
  ];
  // Wordovi uvjetni komentari: <!--[if gte mso 9]> ... <![endif]-->
  const MSO_COND=/^\[if[\s!][^\]]*\][\s\S]*$/i;
  const MSO_ENDIF=/^<!\[endif\]$|^\[endif\]$/i;
  function isClipMarker(text){
    const c=String(text||'').trim();
    if(!c) return true;
    if(CLIP_MARKERS.some(re=>re.test(c))) return true;
    if(MSO_ENDIF.test(c)) return true;
    // uvjetni komentar se priznaje kao tehnicki samo u punom obliku [if ...] ... [endif]
    if(MSO_COND.test(c)&&/\[endif\]\s*$/i.test(c)) return true;
    return false;
  }

  // ============ CISCENJE ZALIJEPLJENOG HTML-a ============
  const DROP='script,style,link,meta,iframe,object,embed,img,svg,video,audio,form,input,button,noscript';
  const OK_TAGS=new Set(['p','div','span','h1','h2','h3','h4','h5','h6','b','strong','i','em','u','s','br','hr',
    'ul','ol','li','table','thead','tbody','tr','td','th','blockquote','pre','code','font','sub','sup','small','a','section','article','header','footer','main','figure','figcaption','label']);
  // pravila iz <style> bloka pretvaramo u izravne stilove na elementima
  function inlineStyles(doc){
    doc.querySelectorAll('style').forEach(st=>{
      let holder=null;
      try{
        holder=document.createElement('style');
        holder.media='not all';
        holder.textContent=st.textContent||'';
        document.head.appendChild(holder);
        const rules=holder.sheet&&holder.sheet.cssRules?Array.from(holder.sheet.cssRules):[];
        rules.forEach(r=>{
          if(!r.selectorText||!r.style) return;
          let els=[];
          try{ els=Array.from(doc.querySelectorAll(r.selectorText)); }catch(e){ return; }
          els.forEach(el=>{
            const own=el.getAttribute('style')||'';
            el.setAttribute('style',r.style.cssText+';'+own);
          });
        });
      }catch(e){}
      finally{ if(holder&&holder.parentNode) holder.remove(); }
    });
  }
  function sanitize(html){
    const doc=new DOMParser().parseFromString(html,'text/html');
    inlineStyles(doc);
    doc.querySelectorAll(DROP).forEach(el=>el.remove());
    doc.body.querySelectorAll('*').forEach(el=>{
      Array.from(el.attributes).forEach(a=>{
        const n=a.name.toLowerCase();
        if(n==='style'){ el.setAttribute('style',a.value.replace(/url\s*\(/gi,'none(')); return; }
        if(n==='data-uv-reason') return;
        if(el.tagName==='FONT'&&(n==='color'||n==='size'||n==='face')) return;
        el.removeAttribute(a.name);
      });
      if(!OK_TAGS.has(el.tagName.toLowerCase())){
        const sp=doc.createElement('span');
        sp.innerHTML=el.innerHTML;
        el.replaceWith(sp);
      }
    });
    return doc.body.innerHTML;
  }
  function plainToHtml(txt){
    return txt.split(/\n{2,}/).map(par=>'<p>'+esc(par).replace(/\n/g,'<br>')+'</p>').join('');
  }

  // ============ JE LI ELEMENT SKRIVEN OD LJUDSKOG OKA ============
  function nearWhite(rgb){
    const m=rgb.match(/rgba?\(([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s\/]+([\d.]+))?/);
    if(!m) return false;
    if(m[4]!==undefined&&parseFloat(m[4])<0.08) return true;
    return +m[1]>=238&&+m[2]>=238&&+m[3]>=238;
  }
  // Vraca kljuceve razloga. 'tiny:3.2' nosi vrijednost iza dvotocke.
  // data-uv-reason postavlja citac .docx-a za stvari koje CSS ne moze opisati
  // (Wordova oznaka skrivenog teksta, okvir izvan stranice).
  function hiddenReasons(el){
    const cs=getComputedStyle(el), r=[];
    const explicit=(el.getAttribute&&el.getAttribute('data-uv-reason'))||'';
    if(explicit) explicit.split('|').filter(Boolean).forEach(k=>r.push(k));
    if(nearWhite(cs.color)) r.push('white');
    if(parseFloat(cs.fontSize)<=4) r.push('tiny:'+(Math.round(parseFloat(cs.fontSize)*10)/10));
    // kad je razlog vec izricito naveden, display/visibility su samo nacin
    // na koji ga prikazujemo, pa ih ne prijavljujemo dvaput
    if(!explicit){
      if(cs.display==='none') r.push('none');
      if(cs.visibility==='hidden') r.push('vis');
    }
    if(parseFloat(cs.opacity)===0) r.push('op0');
    if((cs.position==='absolute'||cs.position==='fixed')&&(parseFloat(cs.left)<-500||parseFloat(cs.top)<-500)) r.push('off');
    return r;
  }

  // ============ OBRADA JEDNOG TEKSTUALNOG CVORA ============
  function markPhrases(txt){
    const m=new Uint8Array(txt.length);
    for(const [re] of PHRASES){
      re.lastIndex=0; let x;
      while((x=re.exec(txt))!==null){
        for(let i=x.index;i<x.index+x[0].length;i++) m[i]=1;
        if(x.index===re.lastIndex) re.lastIndex++;
      }
    }
    return m;
  }
  // Pomijesana pisma i duge crtice dosad su se prijavljivale u nalazima, ali se
  // u desnom panelu nisu nigdje vidjele, pa nalaz nije imao kamo skociti.
  // Pravilo prepoznavanja je isto kao prije, mijenja se samo prikaz: oznaka je
  // namjerno tanka i siva da se ne natjece s ljubicastim i crvenim oznakama,
  // jer duge crtice znaju biti ceste i u sasvim normalnom tekstu.
  const isMixedWord = w => /[a-zA-Z]/.test(w)&&/[\u0400-\u04FF\u0370-\u03FF]/.test(w);
  const isDashCp = cp => cp===0x2014||cp===0x2013||cp===0x2015;
  function markMixed(txt){
    const m=new Uint8Array(txt.length);
    const re=/\S+/g; let x;
    while((x=re.exec(txt))!==null){
      if(isMixedWord(x[0])) for(let i=x.index;i<x.index+x[0].length;i++) m[i]=1;
    }
    return m;
  }
  function renderText(txt){
    const pm=markPhrases(txt), mm=markMixed(txt);
    let out='',idx=0,inMark=false,inMix=false;
    for(const ch of txt){
      const wantP=pm[idx]===1;
      const wantM=!wantP&&mm[idx]===1;   // crvena oznaka fraze ima prednost
      if(inMix&&!wantM){out+='</span>';inMix=false;}
      if(inMark&&!wantP){out+='</mark>';inMark=false;}
      if(wantP&&!inMark){out+='<mark class="phrase">';inMark=true;}
      if(wantM&&!inMix){out+='<span class="mixmark">';inMix=true;}
      const cp=ch.codePointAt(0);
      if(INVISIBLE[cp]) out+='<span class="chip" data-l="U+'+cp.toString(16).toUpperCase().padStart(4,'0')+'"></span>';
      else if(isTag(cp)){const a=cp-0xE0000;out+='<span class="chip" data-l="TAG'+(a>=0x20&&a<=0x7E?':'+esc(String.fromCharCode(a)):'')+'"></span>';}
      else if(isVariation(cp)) out+='<span class="chip" data-l="VS"></span>';
      else if(isOddSpace(cp)) out+='<span class="chip" data-l="SP"></span>';
      else if(isDashCp(cp)) out+='<span class="dashmark">'+esc(ch)+'</span>';
      else out+=esc(ch);
      idx+=ch.length;
    }
    if(inMix) out+='</span>';
    if(inMark) out+='</mark>';
    return out;
  }

  // ============ GRADNJA DESNOG PANELA ============
  const VOID=new Set(['br','hr']);
  // preRead: neobavezna mapa vec izracunatih razloga skrivenosti (Map ili WeakMap).
  // Sluzi zato da se provjera boja i velicina fonta moze izvrsiti kao zaseban,
  // stvarni korak prije gradnje prikaza (vidi tijek provjere u js/app.js).
  // Bez nje se ponasa tocno kao prije.
  function build(node,insideRevealed,hiddenOut,preRead){
    const reasonsOf = el => (preRead&&preRead.has(el)) ? preRead.get(el) : hiddenReasons(el);
    let out='';
    node.childNodes.forEach(ch=>{
      if(ch.nodeType===3){ out+=renderText(ch.nodeValue); return; }
      if(ch.nodeType===8){
        const c=(ch.nodeValue||'').trim();
        // tehnicke oznake koje sustav sam ubaci pri kopiranju nisu nalaz
        if(c.length>3&&!isClipMarker(c)){
          hiddenOut.push({t:c,reasons:['comment']});
          out+='<span class="revealed"><span class="bugmark"></span>'+renderText(c)+'<span class="bugmark"></span></span>';
        }
        return;
      }
      if(ch.nodeType!==1) return;
      let tag=ch.tagName.toLowerCase();
      if(!OK_TAGS.has(tag)) tag='span';
      if(VOID.has(tag)){ out+='<'+tag+'>'; return; }
      const reasons=insideRevealed?[]:reasonsOf(ch);
      const isHidden=reasons.length>0;
      if(isHidden){
        const t=(ch.textContent||'').trim();
        if(t) hiddenOut.push({t,reasons});
      }
      const inner=build(ch,insideRevealed||isHidden,hiddenOut,preRead);
      // vlastite uv- klase (aneks, okviri) prenosimo da desni panel izgleda isto
      const cls=(ch.getAttribute&&ch.getAttribute('class'))||'';
      const uvCls=cls.split(/\s+/).filter(c=>/^uv-/.test(c)).join(' ');
      // oznaka odjeljka aneksa: po njoj nalaz zna kamo skociti u desnom panelu
      const ax=(ch.getAttribute&&ch.getAttribute('data-uv-annex'))||'';
      const axAttr=ax?' data-uv-annex="'+esc(ax)+'"':'';
      if(isHidden){
        out+='<'+tag+' class="revealed'+(uvCls?' '+esc(uvCls):'')+'"'+axAttr+'><span class="bugmark"></span>'+inner+'<span class="bugmark"></span></'+tag+'>';
      } else if(insideRevealed){
        out+='<'+tag+(uvCls?' class="'+esc(uvCls)+'"':'')+axAttr+'>'+inner+'</'+tag+'>';
      } else {
        const st=ch.getAttribute('style');
        out+='<'+tag+(uvCls?' class="'+esc(uvCls)+'"':'')+axAttr+(st?' style="'+esc(st)+'"':'')+'>'+inner+'</'+tag+'>';
      }
    });
    return out;
  }

  OwlUV.detect={PHRASES,INVISIBLE,isVariation,isTag,isOddSpace,DASHES,esc,
    sanitize,plainToHtml,nearWhite,hiddenReasons,markPhrases,markMixed,renderText,build,OK_TAGS,
    isClipMarker,isMixedWord};
})();
