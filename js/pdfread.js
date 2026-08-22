/* OwlUV - citac PDF datoteka.

   NACELO KOJE ODREDUJE CIJELI MODUL: ne lovimo pojedine trikove, nego samu
   NEVIDLJIVOST. Popis poznatih trikova uvijek kasni za napadacem; provjera
   vidljivosti ne kasni, jer mjeri ono sto se stvarno vidi.

   Postupak: stranica se nacrta DVAPUT, jednom sa svim sadrzajem i jednom bez
   teksta. Ako se na mjestu nekog teksta nista ne razlikuje, taj tekst nije
   vidljiv - bez obzira kojim je trikom to postignuto. Iz iste provjere ispadaju
   bijelo na bijelom, boja jednaka podlozi koja nije bijela, tekst ispod
   neprozirnog pravokutnika, nevidljiv nacin crtanja, prozirnost blizu nule i
   svaki buduci trik koji nitko jos nije smislio.

   Uz to se cita ono cega na nacrtanoj stranici UOPCE NEMA, pa ga provjera
   vidljivosti ne moze vidjeti: iskljuceni slojevi, tekst izvan stranice, polja
   obrasca, komentari, svojstva dokumenta i ugradeni JavaScript.

   UGRADENI JAVASCRIPT SE NIKAD NE IZVRSAVA. Cita se kao tekst i prijavljuje.
   Zato je enableScripting iskljucen i sandbox se nikad ne stvara.

   Crtanje ide s intent:'print'. Razlog nije ispis nego raspored posla: pri
   'display' pdf.js nastavlja crtanje kroz requestAnimationFrame, sto na
   skrivenom platnu i u pregledniku bez sucelja zna stati. Pri 'print' koristi
   mikrozadatke i crtanje je pouzdano. Vidljivost slojeva se svejedno uzima iz
   zaslonske postavke, pa se mjeri ono sto covjek vidi. */
(function(){
  const OwlUV = window.OwlUV = window.OwlUV || {};
  const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

  const PUT_FONTOVA='vendor/pdfjs/standard_fonts/';
  const MJERILO=1.5;        // koliko se sitno crta stranica pri mjerenju
  const SITAN_PT=4;         // ispod toliko tocaka tekst se smatra mikroskopskim
  const RUB=2;              // koliko piksela oko okvira teksta jos gledamo
  // Prag zamjetljivosti. Boja #FAFAFA na #FAFAFA daje razliku od jednog stupnja
  // zbog zaokruzivanja pri crtanju, sto oko ne vidi. Zato se ne gleda "je li
  // razlicito" nego "je li razlika zamjetljiva". Ovo NIJE prag za odbacivanje
  // nalaza, nego donja granica mjerenja: ispod nje se ne vidi nista.
  const PRAG_BOJE=12;       // najmanja razlika kanala koja se jos vidi
  const PRAG_PIKSELA=3;     // koliko takvih piksela treba da tekst zovemo vidljivim

  // pdf.js je velik (oko 1,5 MB), pa se ucitava TEK kad stigne prvi PDF.
  // Tko lijepi tekst ili ucitava Word ne placi tu cijenu. Ucitava se s diska,
  // iz repozitorija, nikad s mreze.
  const SKRIPTE=['vendor/pdfjs/pdf.min.js','vendor/pdfjs/pdf.worker.min.js'];
  let ucitavanje=null;
  function ucitajSkriptu(src){
    return new Promise((res,rej)=>{
      const el=document.createElement('script');
      el.src=src;
      el.onload=()=>res();
      el.onerror=()=>rej(new Error('ne mogu ucitati '+src));
      document.head.appendChild(el);
    });
  }
  function ensure(){
    if(window.pdfjsLib&&window.pdfjsWorker) return Promise.resolve();
    if(!ucitavanje) ucitavanje=SKRIPTE.reduce((p,s)=>p.then(()=>ucitajSkriptu(s)),Promise.resolve());
    return ucitavanje;
  }
  function lib(){
    if(!window.pdfjsLib) throw new Error('pdf.js nije ucitan');
    return window.pdfjsLib;
  }

  // ---------- platno za mjerenje ----------
  function platno(vp){
    const c=document.createElement('canvas');
    c.width=Math.max(1,Math.ceil(vp.width));
    c.height=Math.max(1,Math.ceil(vp.height));
    const x=c.getContext('2d',{willReadFrequently:true});
    x.fillStyle='#ffffff';
    x.fillRect(0,0,c.width,c.height);
    return {c,x};
  }

  /* Cita jedan PDF. bytes je Uint8Array.
     onStep se zove s brojem obradenih stranica, radi prikaza tijeka. */
  async function parse(bytes,onStep){
    await ensure();
    const pdfjs=lib();
    pdfjs.GlobalWorkerOptions.workerSrc='';    // radnik ne radi s file://, radi se u glavnoj dretvi
    const t0=Date.now();
    const zadatak=pdfjs.getDocument({
      data:bytes,
      standardFontDataUrl:PUT_FONTOVA,
      isEvalSupported:false,      // nikakvo izvrsavanje koda iz datoteke
      enableXfa:false,
      useSystemFonts:false
    });
    const doc=await zadatak.promise;
    const rez={
      pages:doc.numPages, lines:[], hiddenLayers:[], offPage:[], fields:[],
      notes:[], props:[], js:[], layers:[], hasImages:false, mjereno:true, ms:0
    };

    // ---------- svojstva dokumenta ----------
    try{
      const meta=await doc.getMetadata();
      const info=meta&&meta.info||{};
      const KARTA={Title:'title',Author:'creator',Subject:'subject',Keywords:'keywords',
                   Creator:'company',Producer:'manager'};
      Object.keys(KARTA).forEach(k=>{
        const v=info[k];
        if(v&&String(v).trim()) rez.props.push({k:KARTA[k],v:String(v).trim()});
      });
    }catch(e){}

    // ---------- ugradeni JavaScript: samo se cita, nikad ne izvrsava ----------
    try{
      const akcije=await doc.getJSActions();
      if(akcije) Object.keys(akcije).forEach(k=>{
        [].concat(akcije[k]||[]).forEach(kod=>{
          if(kod&&String(kod).trim()) rez.js.push({name:k,code:String(kod).trim()});
        });
      });
    }catch(e){}

    // ---------- slojevi ----------
    // isVisible trazi isti oblik u kojem pdf.js zapisuje sloj u popisu naredbi,
    // dakle {type:'OCG', id}, a ne golu oznaku
    let occ=null; const slojevi=[];
    try{
      occ=await doc.getOptionalContentConfig();
      if(occ&&occ.getGroups){
        const g=occ.getGroups()||{};
        Object.keys(g).forEach(id=>{
          let vidljiv=true;
          try{ vidljiv=occ.isVisible({type:'OCG',id}); }catch(e){}
          slojevi.push({id,vidljiv,naziv:(g[id]&&g[id].name)||''});
        });
      }
    }catch(e){}
    const imaIskljucenih=slojevi.some(x=>!x.vidljiv);
    rez.layers=slojevi;

    const OPS=pdfjs.OPS||{};
    const SLIKE=[OPS.paintImageXObject,OPS.paintInlineImageXObject,OPS.paintImageMaskXObject,
                 OPS.paintJpegXObject].filter(x=>x!==undefined);

    for(let br=1;br<=doc.numPages;br++){
      const page=await doc.getPage(br);
      const vpMjera=page.getViewport({scale:MJERILO});
      const vb=page.getViewport({scale:1});

      // tekst s polozajem; markirani sadrzaj nosi oznaku sloja
      const tc=await page.getTextContent({includeMarkedContent:true});

      // Popis naredbi je drugi izvor teksta i vazan je: citac teksta izostavlja
      // ono sto je nacrtano izvan stranice, a popis naredbi to ima. Sto je u
      // popisu naredbi, a nije u citacu teksta, gurnuto je izvan stranice.
      const opTekst=[];
      try{
        const ol=await page.getOperatorList();
        if(ol&&ol.fnArray){
          if(ol.fnArray.some(f=>SLIKE.indexOf(f)>=0)) rez.hasImages=true;
          ol.fnArray.forEach((fn,k)=>{
            if(fn!==OPS.showText&&fn!==OPS.showSpacedText) return;
            const a=(ol.argsArray[k]||[])[0]||[];
            const niz=a.map(g=>(g&&typeof g==='object')?(g.unicode||''):' ').join('');
            if(niz.trim()) opTekst.push(niz.trim());
          });
        }
      }catch(e){}

      // ---- dva crtanja: sa svim sadrzajem i bez teksta ----
      let dA=null,dB=null,sirina=0,visina=0,mjerljivo=false;
      let crtanihSlova=0;
      const glifovi=[];
      const imaTeksta=tc.items.some(i=>i.str&&i.str.trim());
      if(imaTeksta){
        const opc={viewport:vpMjera,intent:'print'};
        if(occ) opc.optionalContentConfigPromise=Promise.resolve(occ);
        const A=platno(vpMjera);
        await page.render(Object.assign({canvasContext:A.x},opc)).promise;
        const B=platno(vpMjera);
        // Crtanje slova se ne samo gasi, nego se biljezi GDJE je koje slovo
        // otislo. Sam znak nije pouzdan (uz ugradene standardne fontove pdf.js
        // ga ne prosljeduje), ali polozaj jest, a polozaj je sve sto treba:
        // tekst koji citac prijavi, a na cijem mjestu nije naslikano nijedno
        // slovo, uopce nije nacrtan - dakle stoji u iskljucenom sloju.
        B.x.fillText=function(znak,zx,zy){
          crtanihSlova++;
          try{
            const m=this.getTransform();
            glifovi.push({px:m.a*zx+m.c*zy+m.e, py:m.b*zx+m.d*zy+m.f});
          }catch(e){}
        };
        B.x.strokeText=B.x.fillText;
        await page.render(Object.assign({canvasContext:B.x},opc)).promise;
        // Ako slova uopce nisu prosla kroz fillText, mjerenje nije pouzdano
        // (tekst se crtao drugim putem). Tada se NISTA ne proglasava nevidljivim,
        // jer bi inace ispalo da je skriven cijeli dokument.
        if(crtanihSlova>0){
          dA=A.x.getImageData(0,0,A.c.width,A.c.height).data;
          dB=B.x.getImageData(0,0,B.c.width,B.c.height).data;
          sirina=A.c.width; visina=A.c.height;
          mjerljivo=true;
        } else rez.mjereno=false;
      }

      // ---- tekst gurnut izvan stranice ----
      // Sto je nacrtano, a citac teksta ga ne vraca, nije na stranici.
      const naStranici=tc.items.map(i=>i.str||'').join(' ').replace(/\s+/g,'');
      opTekst.forEach(niz=>{
        const golo=niz.replace(/\s+/g,'');
        if(golo.length>3&&naStranici.indexOf(golo)<0) rez.offPage.push(niz);
      });

      // je li na mjestu ovog teksta uopce naslikano ijedno slovo
      const naslikanoTu=(ax,ay,bx,by)=>glifovi.some(g=>
        g.px>=ax-2&&g.px<=bx+2&&g.py>=ay-2&&g.py<=by+2);

      // Okviri svih tekstova na stranici. Kad se mjeri jedan tekst, pikseli koji
      // pripadaju NEKOM DRUGOM tekstu se preskacu. Bez toga bi vidljiv natpis
      // nacrtan preko zakopanog teksta prikrio da je zakopani tekst nevidljiv.
      const okviri=[];
      tc.items.forEach(it=>{
        if(!it.str||!it.str.trim()) return;
        const t2=it.transform||[1,0,0,1,0,0];
        const q1=vpMjera.convertToViewportPoint(t2[4],t2[5]);
        const q2=vpMjera.convertToViewportPoint(t2[4]+Math.max(it.width||1,1),
                                                t2[5]+Math.max(it.height||Math.abs(t2[3])||10,1));
        okviri.push({txt:it.str,
          ax:Math.min(q1[0],q2[0])-RUB, ay:Math.min(q1[1],q2[1])-RUB,
          bx:Math.max(q1[0],q2[0])+RUB, by:Math.max(q1[1],q2[1])+RUB});
      });
      const tudi=(txt,px,py)=>okviri.some(o=>o.txt!==txt&&
        px>=o.ax&&px<=o.bx&&py>=o.ay&&py<=o.by);

      // ---- prolaz kroz tekst ----
      let sloj=null;               // oznaka sloja u kojem smo trenutno
      const stog=[];
      let red=[], zadnjiY=null;
      const zavrsiRed=()=>{ if(red.length){ rez.lines.push(red); red=[]; } };

      tc.items.forEach(it=>{
        if(it.type==='beginMarkedContentProps'){ stog.push(sloj); sloj=it.id||null; return; }
        if(it.type==='beginMarkedContent'){ stog.push(sloj); return; }
        if(it.type==='endMarkedContent'){ sloj=stog.length?stog.pop():null; return; }
        if(typeof it.str!=='string') return;
        if(!it.str) { if(it.hasEOL) zavrsiRed(); return; }

        const tr=it.transform||[1,0,0,1,0,0];
        const x=tr[4], y=tr[5];
        const velicina=Math.abs(tr[3])||Math.abs(tr[0])||12;
        const sirinaT=it.width||0, visinaT=it.height||velicina;

        const razlozi=[];
        // okvir ovog teksta na nacrtanoj stranici
        const p1=vpMjera.convertToViewportPoint(x,y);
        const p2=vpMjera.convertToViewportPoint(x+Math.max(sirinaT,1),y+Math.max(visinaT,1));
        const ax=Math.max(0,Math.floor(Math.min(p1[0],p2[0]))-RUB);
        const ay=Math.max(0,Math.floor(Math.min(p1[1],p2[1]))-RUB);
        const bx=Math.min(sirina,Math.ceil(Math.max(p1[0],p2[0]))+RUB);
        const by=Math.min(visina,Math.ceil(Math.max(p1[1],p2[1]))+RUB);

        // 1. tekst koji je citac prijavio, a na cijem mjestu nije naslikano
        //    nijedno slovo: nije nacrtan uopce, dakle stoji u iskljucenom sloju
        const nenaslikano = mjerljivo && it.str.trim().length>3 && !naslikanoTu(ax,ay,bx,by);
        if(nenaslikano) razlozi.push(imaIskljucenih?'player':'pinvis');
        // 2. mikroskopski font
        if(velicina<SITAN_PT) razlozi.push('ptiny:'+(Math.round(velicina*10)/10));
        // 3. mjerenje vidljivosti na nacrtanoj stranici
        if(mjerljivo&&!nenaslikano&&it.str.trim()){
          let raz=0, gledanih=0;
          for(let yy=ay;yy<by&&raz<PRAG_PIKSELA;yy++) for(let xx=ax;xx<bx&&raz<PRAG_PIKSELA;xx++){
            if(tudi(it.str,xx,yy)) continue;      // taj piksel pripada drugom tekstu
            gledanih++;
            const i=(yy*sirina+xx)*4;
            const d=Math.max(Math.abs(dA[i]-dB[i]),Math.abs(dA[i+1]-dB[i+1]),Math.abs(dA[i+2]-dB[i+2]));
            if(d>=PRAG_BOJE) raz++;
          }
          // ako od okvira nije ostalo nista za gledati, ne tvrdimo nista
          if(gledanih>=20&&raz<PRAG_PIKSELA) razlozi.push('pinvis');
        }

        if(nenaslikano&&imaIskljucenih) rez.hiddenLayers.push(it.str);

        // novi red kad se okomiti polozaj osjetno promijeni
        if(zadnjiY!==null&&Math.abs(y-zadnjiY)>Math.max(2,velicina*0.6)) zavrsiRed();
        zadnjiY=y;
        red.push({txt:it.str,razlozi,page:br});
        if(it.hasEOL) zavrsiRed();
      });
      zavrsiRed();

      // ---- biljeske i polja obrasca ----
      try{
        const an=await page.getAnnotations({intent:'display'});
        (an||[]).forEach(a=>{
          if(a.subtype==='Widget'){
            const v=a.fieldValue;
            if(v!==undefined&&v!==null&&String(v).trim())
              rez.fields.push({name:a.fieldName||'',value:String(v).trim()});
          } else if(a.contents&&String(a.contents).trim()){
            rez.notes.push({title:a.title||'',txt:String(a.contents).trim()});
          }
        });
      }catch(e){}

      page.cleanup();
      if(typeof onStep==='function') onStep(br,doc.numPages);
    }

    try{ await doc.destroy(); }catch(e){}
    rez.ms=Date.now()-t0;
    return rez;
  }

  // ---------- sastavljanje prikaza za lijevi panel ----------
  function toHtml(r,t){
    let h='';
    r.lines.forEach(red=>{
      const dijelovi=red.map(d=>{
        const txt=esc(d.txt);
        return d.razlozi.length
          ? '<span data-uv-reason="'+esc(d.razlozi.join('|'))+'">'+txt+'</span>'
          : txt;
      }).join('');
      if(dijelovi.trim()) h+='<p>'+dijelovi+'</p>';
    });
    const sec=(key,label,stavke)=>{
      if(!stavke.length) return '';
      return '<div class="uv-annex" data-uv-annex="'+key+'"><div class="uv-annex-h">'+esc(label)+'</div>'+
             stavke.map(x=>'<div class="uv-annex-i">'+x+'</div>').join('')+'</div>';
    };
    h+=sec('comments',t.ax.comments,r.notes.map(n=>
      (n.title?'<span class="uv-tag">'+esc(n.title)+'</span>':'')+esc(n.txt)));
    h+=sec('fields',t.axFields,r.fields.map(f=>
      (f.name?'<span class="uv-tag">'+esc(f.name)+'</span>':'')+esc(f.value)));
    h+=sec('js',t.axJs,r.js.map(j=>
      '<span class="uv-tag">'+esc(j.name)+'</span>'+esc(j.code)));
    h+=sec('props',t.ax.props,r.props.map(p=>
      '<p><span class="uv-tag">'+esc(t.prop[p.k]||p.k)+'</span>'+esc(p.v)+'</p>'));
    return h;
  }

  // ---------- nalazi koje daje samo PDF ----------
  function findings(r,t){
    const f=[];
    if(r.hiddenLayers.length) f.push({sev:'danger',rank:13,
      title:t.fLayerTitle(r.hiddenLayers.length),why:t.fLayerWhy,
      items:r.hiddenLayers.map(x=>({q:x.slice(0,300)}))});
    if(r.offPage.length) f.push({sev:'danger',rank:12,
      title:t.fOffTitle(r.offPage.length),why:t.fOffWhy,
      items:r.offPage.map(x=>({q:x.slice(0,300)}))});
    if(r.js.length) f.push({sev:'danger',rank:14,
      title:t.fJsTitle(r.js.length),why:t.fJsWhy,anchor:'[data-uv-annex="js"]',
      items:r.js.map(j=>({q:j.code.slice(0,400),n:j.name}))});
    if(r.fields.length) f.push({sev:'warn',rank:37,
      title:t.fFieldTitle(r.fields.length),why:t.fFieldWhy,anchor:'[data-uv-annex="fields"]',
      items:r.fields.map(x=>({q:x.value.slice(0,300),n:x.name}))});
    if(r.notes.length) f.push({sev:'warn',rank:38,
      title:t.fCommTitle(r.notes.length),why:t.fCommWhy,anchor:'[data-uv-annex="comments"]',
      items:r.notes.map(x=>({q:x.txt.slice(0,300),n:x.title}))});
    if(r.props.length) f.push({sev:'info',rank:40,
      title:t.fPropTitle(r.props.length),why:t.fPropWhy,
      items:r.props.map(p=>({q:p.v,n:t.prop[p.k]||p.k}))});
    if(!r.mjereno) f.push({sev:'warn',rank:41,
      title:t.fNoMeasureTitle,why:t.fNoMeasureWhy});
    return f;
  }

  OwlUV.pdf={parse,toHtml,findings,ensure,MJERILO,SITAN_PT};
})();
