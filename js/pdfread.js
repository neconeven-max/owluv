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

   Kad su dva teksta nacrtana jedan preko drugoga, iz jednog zajednickog crtanja
   se ne moze zakljuciti cija su slova ostavila trag. Takav se tekst crta
   CILJANO: stranica jos jednom, bez bas tog teksta i sa svime ostalim. Preskace
   se po rednom broju slova, ne po okviru, jer okviri susjednih tekstova ulaze
   jedan u drugi.

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

  // PDF daje tekst iz DVA izvora, a oni ne pisu isto:
  //  - citac teksta (getTextContent) zna polozaj, ali IZBACUJE nevidljive
  //    Unicode znakove i ne vraca tekst nacrtan izvan stranice
  //  - popis naredbi (getOperatorList) ima sve znakove i sav tekst, ali bez
  //    upotrebljivog polozaja
  // Ta se dva popisa NE SMIJU usporedivati neobradena. Ako se usporeduju, naslov
  // koji u sebi nosi nevidljivi znak ne pronade se u citacu teksta, pa ispadne
  // da je "izvan stranice" iako je na sredini stranice i vidi se golim okom.
  // Zato se uparuju po SADRZAJU, na zajednickom nazivniku bez nevidljivih
  // znakova i razmaka. Tako se sadrzaj i polozaj ne mogu raziti, a nevidljivi
  // znakovi se vracaju u tekst iz popisa naredbi, gdje su sacuvani.
  const NEVIDLJIVI=/[\u00AD\u061C\u180E\u200B-\u200F\u2060\uFEFF]/g;
  const nazivnik = s => String(s||'').replace(NEVIDLJIVI,'').replace(/\s+/g,'');

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
          }catch(e){ glifovi.push({px:-1e9,py:-1e9}); }
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

      // ---- uparivanje dvaju izvora teksta ----
      // Svaka naredba se svrsta po zajednickom nazivniku. Kad citac teksta javi
      // istu recenicu, uzima se zapis iz popisa naredbi, jer je u njemu sacuvan
      // svaki znak, i nevidljivi. Naredbe koje nitko ne preuzme nisu na
      // stranici uopce, dakle gurnute su izvan nje.
      const karta=new Map();
      opTekst.forEach(niz=>{
        const k=nazivnik(niz);
        if(!k) return;
        if(!karta.has(k)) karta.set(k,[]);
        karta.get(k).push(niz);
      });
      tc.items.forEach(it=>{
        if(typeof it.str!=='string'||!it.str.trim()) return;
        const lista=karta.get(nazivnik(it.str));
        if(lista&&lista.length){
          const izvorni=lista.shift();
          if(izvorni&&izvorni!==it.str) it.str=izvorni;   // vrati nevidljive znakove
        }
      });
      karta.forEach(ostatak=>ostatak.forEach(niz=>{
        if(nazivnik(niz).length>3) rez.offPage.push(niz);
      }));

      // je li na mjestu ovog teksta uopce naslikano ijedno slovo
      const naslikanoTu=(ax,ay,bx,by)=>glifovi.some(g=>
        g.px>=ax-2&&g.px<=bx+2&&g.py>=ay-2&&g.py<=by+2);

      // Okviri svih tekstova na stranici, radi prepoznavanja preklapanja.
      const okvirOd=it=>{
        const t2=it.transform||[1,0,0,1,0,0];
        const q1=vpMjera.convertToViewportPoint(t2[4],t2[5]);
        const q2=vpMjera.convertToViewportPoint(t2[4]+Math.max(it.width||1,1),
                                                t2[5]+Math.max(it.height||Math.abs(t2[3])||10,1));
        return {ax:Math.min(q1[0],q2[0])-RUB, ay:Math.min(q1[1],q2[1])-RUB,
                bx:Math.max(q1[0],q2[0])+RUB, by:Math.max(q1[1],q2[1])+RUB};
      };
      const okviri=tc.items.filter(it=>it.str&&it.str.trim()).map(okvirOd);
      const preklapaSe=(o,k)=>okviri.some((d,j)=>j!==k&&
        d.ax<o.bx&&d.bx>o.ax&&d.ay<o.by&&d.by>o.ay);

      // Koja su slova od KOJEG teksta. Kad se dva teksta crtaju na istom mjestu,
      // okvir ih ne razlikuje, ali redoslijed crtanja da: slova jednog teksta
      // idu jedno za drugim. Zato se uzimaju slova unutar okvira, razdvoje se u
      // neprekinute nizove po redoslijedu crtanja, i uzme se onaj niz koji je
      // duljinom najblizi broju slova tog teksta.
      const slovaOd=(o,brojSlova)=>{
        const unutra=[];
        glifovi.forEach((g,i)=>{
          if(g.px>=o.ax&&g.px<=o.bx&&g.py>=o.ay&&g.py<=o.by) unutra.push(i);
        });
        if(!unutra.length) return null;
        // Novi niz pocinje kad se preskoci koje slovo, ali i kad se polozaj
        // vrati unatrag ili skoci u drugi redak. Bez toga se dva teksta crtana
        // na istom mjestu ne razdvoje, jer crtanje pravokutnika izmedu njih ne
        // prekida brojanje slova.
        const nizovi=[]; let n=[unutra[0]];
        for(let k=1;k<unutra.length;k++){
          const a=glifovi[unutra[k-1]], b=glifovi[unutra[k]];
          const nastavak = unutra[k]===unutra[k-1]+1 &&
                           b.px>=a.px-1 && Math.abs(b.py-a.py)<=2;
          if(nastavak) n.push(unutra[k]);
          else { nizovi.push(n); n=[unutra[k]]; }
        }
        nizovi.push(n);
        let naj=nizovi[0];
        nizovi.forEach(x=>{
          if(Math.abs(x.length-brojSlova)<Math.abs(naj.length-brojSlova)) naj=x;
        });
        return {od:naj[0], do:naj[naj.length-1]};
      };

      // ---- prolaz kroz tekst ----
      let sloj=null;               // oznaka sloja u kojem smo trenutno
      const stog=[];
      let red=[], zadnjiY=null;
      const zavrsiRed=()=>{ if(red.length){ rez.lines.push(red); red=[]; } };

      const zaCiljano=[];
      let redniBroj=-1;
      tc.items.forEach(it=>{
        if(it.type==='beginMarkedContentProps'){ stog.push(sloj); sloj=it.id||null; return; }
        if(it.type==='beginMarkedContent'){ stog.push(sloj); return; }
        if(it.type==='endMarkedContent'){ sloj=stog.length?stog.pop():null; return; }
        if(typeof it.str!=='string') return;
        if(!it.str) { if(it.hasEOL) zavrsiRed(); return; }

        if(it.str.trim()) redniBroj++;
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
        // Kad se okvir ovog teksta preklapa s okvirom nekog drugog, iz jednog
        // zajednickog crtanja se ne moze zakljuciti cija su slova ostavila trag.
        // Takav se tekst odlaze za CILJANO crtanje: stranica se nacrta jos jednom,
        // bez bas tog teksta i sa svim ostalim.
        if(mjerljivo&&!nenaslikano&&it.str.trim()){
          if(preklapaSe({ax,ay,bx,by},redniBroj)){
            const brojSlova=it.str.replace(/\s/g,'').replace(NEVIDLJIVI,'').length;
            zaCiljano.push({okvir:{ax,ay,bx,by},razlozi,tekst:it.str,
                            raspon:slovaOd({ax,ay,bx,by},brojSlova)});
          } else {
            let raz=0;
            for(let yy=ay;yy<by&&raz<PRAG_PIKSELA;yy++) for(let xx=ax;xx<bx&&raz<PRAG_PIKSELA;xx++){
              const i=(yy*sirina+xx)*4;
              const d=Math.max(Math.abs(dA[i]-dB[i]),Math.abs(dA[i+1]-dB[i+1]),Math.abs(dA[i+2]-dB[i+2]));
              if(d>=PRAG_BOJE) raz++;
            }
            if(raz<PRAG_PIKSELA) razlozi.push('pinvis');
          }
        }

        if(nenaslikano&&imaIskljucenih) rez.hiddenLayers.push(it.str);

        // novi red kad se okomiti polozaj osjetno promijeni
        if(zadnjiY!==null&&Math.abs(y-zadnjiY)>Math.max(2,velicina*0.6)) zavrsiRed();
        zadnjiY=y;
        red.push({txt:it.str,razlozi,page:br});
        if(it.hasEOL) zavrsiRed();
      });
      zavrsiRed();

      // ---- ciljano crtanje za tekstove koji se preklapaju ----
      // Ovo je doslovno ono sto provjera vidljivosti znaci: stranica bez BAS TOG
      // teksta, pa usporedba. Radi se samo za preklopljene tekstove, jer su
      // rijetki; da ih na nekoj stranici bude jako mnogo, mjerenje bi trajalo
      // predugo, pa se tada posteno kaze da vidljivost nije izmjerena.
      const NAJVISE_CILJANIH=60;
      if(zaCiljano.length>NAJVISE_CILJANIH) rez.mjereno=false;
      else for(const stavka of zaCiljano){
        const o=stavka.okvir, r=stavka.raspon;
        if(!r) continue;                      // nema mu se sto preskociti
        const C=platno(vpMjera);
        // Slova se broje isto kao pri crtanju bez teksta, dakle i ispunjena i
        // obrubljena, inace bi se brojevi razisli i preskocila bi kriva slova.
        const izvIspuna=C.x.fillText, izvObrub=C.x.strokeText;
        let brojac=-1;
        const preskace=()=>{ brojac++; return brojac>=r.od&&brojac<=r.do; };
        C.x.fillText=function(){
          if(preskace()) return;                   // bas slova ovog teksta preskacemo
          return izvIspuna.apply(this,arguments);
        };
        C.x.strokeText=function(){
          if(preskace()) return;
          return izvObrub.apply(this,arguments);
        };
        await page.render(Object.assign({canvasContext:C.x},
          (function(){ const q={viewport:vpMjera,intent:'print'};
            if(occ) q.optionalContentConfigPromise=Promise.resolve(occ); return q; })())).promise;
        const dC=C.x.getImageData(0,0,C.c.width,C.c.height).data;
        let raz=0;
        for(let yy=Math.max(0,Math.floor(o.ay));yy<Math.min(visina,Math.ceil(o.by))&&raz<PRAG_PIKSELA;yy++)
        for(let xx=Math.max(0,Math.floor(o.ax));xx<Math.min(sirina,Math.ceil(o.bx))&&raz<PRAG_PIKSELA;xx++){
          const i=(yy*sirina+xx)*4;
          const d=Math.max(Math.abs(dA[i]-dC[i]),Math.abs(dA[i+1]-dC[i+1]),Math.abs(dA[i+2]-dC[i+2]));
          if(d>=PRAG_BOJE) raz++;
        }
        if(raz<PRAG_PIKSELA) stavka.razlozi.push('pinvis');
      }

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
