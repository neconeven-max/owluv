/* OwlUV - spremanje ociscenog teksta kao .docx datoteke.

   ZASTO OVAKO: za ovo ne treba nova knjiznica. Vec postojeci generator testnih
   dokumenata (test/napravi-testne-docx.js) rucno gradi valjani .docx, a jedina
   potrebna knjiznica - fflate za pakiranje ZIP-a - vec je vendorirana. Gotove
   knjiznice za pisanje Worda teze nekoliko stotina kilobajta i donijele bi
   novi teret u repozitorij bez ijedne mogucnosti koja nam treba.

   VAZNO: ovo gradi NOVU datoteku iz teksta koji alat vidi. Izvorna datoteka
   korisnika se ne dira ni u jednom trenutku. Prijelom stranica, margine i tocan
   font nece biti identicni izvorniku - to je i receno korisniku uz gumb.

   Ulaz je vec ociscena preslika lijevog panela (vidi buildClean u js/app.js):
   iz nje je skriveni sadrzaj vec obrisan, pa se ovdje samo pretvara oblik. */
(function(){
  const OwlUV = window.OwlUV = window.OwlUV || {};

  const NS='xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"';
  const HEAD='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
  const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
                            .replace(/"/g,'&quot;').replace(/'/g,'&apos;');
  // XML 1.0 ne trpi upravljacke znakove; ostatak teksta ostaje netaknut
  const xmlSafe = s => String(s).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g,'');

  // ---------- nepromjenjivi dijelovi paketa ----------
  const CONTENT_TYPES=HEAD+
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'+
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'+
    '<Default Extension="xml" ContentType="application/xml"/>'+
    '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>'+
    '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>'+
    '<Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>'+
    '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>'+
    '</Types>';

  const ROOT_RELS=HEAD+
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>'+
    '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>'+
    '</Relationships>';

  const DOC_RELS=HEAD+
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'+
    '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>'+
    '</Relationships>';

  const STYLES=HEAD+'<w:styles '+NS+'>'+
    '<w:docDefaults><w:rPrDefault><w:rPr><w:sz w:val="22"/></w:rPr></w:rPrDefault></w:docDefaults>'+
    '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>'+
    '<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/>'+
      '<w:pPr><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:b/><w:sz w:val="32"/></w:rPr></w:style>'+
    '<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/>'+
      '<w:pPr><w:outlineLvl w:val="1"/></w:pPr><w:rPr><w:b/><w:sz w:val="28"/></w:rPr></w:style>'+
    '<w:style w:type="paragraph" w:styleId="Heading3"><w:name w:val="heading 3"/><w:basedOn w:val="Normal"/>'+
      '<w:pPr><w:outlineLvl w:val="2"/></w:pPr><w:rPr><w:b/><w:sz w:val="24"/></w:rPr></w:style>'+
    '<w:style w:type="paragraph" w:styleId="ListParagraph"><w:name w:val="List Paragraph"/><w:basedOn w:val="Normal"/></w:style>'+
    '</w:styles>';

  // Popisi se rade pravim Wordovim numeriranjem, a NE dopisivanjem znaka za
  // tocku ili broja u tekst. Dopisivanje bi znacilo dodavanje znakova kojih u
  // dokumentu nema, a pravilo je da se nista ne dodaje.
  const NUMBERING=HEAD+'<w:numbering '+NS+'>'+
    '<w:abstractNum w:abstractNumId="0"><w:multiLevelType w:val="hybridMultilevel"/>'+
      '<w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="•"/>'+
      '<w:lvlJc w:val="left"/><w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr>'+
      '<w:rPr><w:rFonts w:ascii="Symbol" w:hAnsi="Symbol" w:hint="default"/></w:rPr></w:lvl>'+
    '</w:abstractNum>'+
    '<w:abstractNum w:abstractNumId="1"><w:multiLevelType w:val="hybridMultilevel"/>'+
      '<w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%1."/>'+
      '<w:lvlJc w:val="left"/><w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr></w:lvl>'+
    '</w:abstractNum>'+
    '<w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num>'+
    '<w:num w:numId="2"><w:abstractNumId w:val="1"/></w:num>'+
    '</w:numbering>';

  function core(title){
    return HEAD+'<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" '+
      'xmlns:dc="http://purl.org/dc/elements/1.1/">'+
      '<dc:title>'+esc(title||'')+'</dc:title>'+
      '<dc:creator>OwlUV</dc:creator>'+
      '<cp:lastModifiedBy>OwlUV</cp:lastModifiedBy></cp:coreProperties>';
  }

  // ---------- pretvorba preslike u WordprocessingML ----------
  const HEADINGS={h1:'Heading1',h2:'Heading2',h3:'Heading3',h4:'Heading3',h5:'Heading3',h6:'Heading3'};
  const BLOCK=new Set(['p','div','h1','h2','h3','h4','h5','h6','li','blockquote','pre',
                       'section','article','header','footer','figure','figcaption']);

  // Oblik se cita iz oznaka (b, i, u, s) i iz ono malo stila koji je prezivio
  // ciscenje. Boje i velicine fonta u ociscenoj preslici uopce nema.
  function marks(el,inherited){
    const m={b:inherited.b,i:inherited.i,u:inherited.u,s:inherited.s};
    const tag=el.tagName.toLowerCase();
    if(tag==='b'||tag==='strong') m.b=true;
    if(tag==='i'||tag==='em') m.i=true;
    if(tag==='u') m.u=true;
    if(tag==='s'||tag==='strike'||tag==='del') m.s=true;
    if(tag==='sub'||tag==='sup') { /* razina se ne prenosi, tekst ostaje */ }
    const st=(el.getAttribute('style')||'').toLowerCase();
    if(/font-weight\s*:\s*(bold|[6-9]00)/.test(st)) m.b=true;
    if(/font-style\s*:\s*italic/.test(st)) m.i=true;
    if(/text-decoration[^:]*:\s*[^;]*underline/.test(st)) m.u=true;
    if(/text-decoration[^:]*:\s*[^;]*line-through/.test(st)) m.s=true;
    return m;
  }
  function rPr(m){
    let r='';
    if(m.b) r+='<w:b/>';
    if(m.i) r+='<w:i/>';
    if(m.u) r+='<w:u w:val="single"/>';
    if(m.s) r+='<w:strike/>';
    return r?'<w:rPr>'+r+'</w:rPr>':'';
  }
  function run(text,m){
    if(!text) return '';
    return '<w:r>'+rPr(m)+'<w:t xml:space="preserve">'+esc(xmlSafe(text))+'</w:t></w:r>';
  }

  // skuplja sve tekstualne dijelove jednog odlomka, sa svojim oblikom
  function runsOf(node,inherited){
    let out='';
    node.childNodes.forEach(ch=>{
      if(ch.nodeType===3){ out+=run(ch.nodeValue,inherited); return; }
      if(ch.nodeType!==1) return;
      const tag=ch.tagName.toLowerCase();
      if(tag==='br'){ out+='<w:r><w:br/></w:r>'; return; }
      out+=runsOf(ch,marks(ch,inherited));
    });
    return out;
  }
  const EMPTY={b:false,i:false,u:false,s:false};

  function para(node,opts){
    const inner=runsOf(node,EMPTY);
    if(!inner) return '';                      // prazan odlomak se ne prepisuje
    let pPr='';
    if(opts&&opts.style) pPr+='<w:pStyle w:val="'+opts.style+'"/>';
    if(opts&&opts.numId) pPr+='<w:numPr><w:ilvl w:val="0"/><w:numId w:val="'+opts.numId+'"/></w:numPr>';
    return '<w:p>'+(pPr?'<w:pPr>'+pPr+'</w:pPr>':'')+inner+'</w:p>';
  }

  function table(el){
    const rows=Array.from(el.querySelectorAll('tr'));
    if(!rows.length) return '';
    let maxCells=0;
    rows.forEach(r=>{ maxCells=Math.max(maxCells,r.querySelectorAll('td,th').length); });
    if(!maxCells) return '';
    const w=Math.floor(9360/maxCells);
    let out='<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/>'+
      '<w:tblBorders>'+['top','left','bottom','right','insideH','insideV']
        .map(s=>'<w:'+s+' w:val="single" w:sz="4" w:space="0" w:color="auto"/>').join('')+
      '</w:tblBorders></w:tblPr><w:tblGrid>'+
      Array.from({length:maxCells},()=>'<w:gridCol w:w="'+w+'"/>').join('')+'</w:tblGrid>';
    rows.forEach(r=>{
      out+='<w:tr>';
      const cells=Array.from(r.querySelectorAll('td,th'));
      for(let i=0;i<maxCells;i++){
        const c=cells[i];
        const body=c?blocks(c):'';
        out+='<w:tc><w:tcPr><w:tcW w:w="'+w+'" w:type="dxa"/></w:tcPr>'+
             (body||'<w:p/>')+'</w:tc>';
      }
      out+='</w:tr>';
    });
    return out+'</w:tbl>';
  }

  // pretvara sadrzaj jednog elementa u niz Wordovih odlomaka i tablica
  function blocks(root,listNum){
    let out='';
    let slobodni=[];      // tekst koji visi izravno u elementu, bez svog odlomka
    const isprazni=()=>{
      if(!slobodni.length) return;
      const holder=document.createElement('div');
      slobodni.forEach(n=>holder.appendChild(n.cloneNode(true)));
      slobodni=[];
      const p=para(holder,listNum?{style:'ListParagraph',numId:listNum}:null);
      if(p) out+=p;
    };
    root.childNodes.forEach(ch=>{
      if(ch.nodeType===3){ if((ch.nodeValue||'').trim()) slobodni.push(ch); return; }
      if(ch.nodeType!==1) return;
      const tag=ch.tagName.toLowerCase();
      if(tag==='table'){ isprazni(); out+=table(ch); return; }
      if(tag==='ul'||tag==='ol'){
        isprazni();
        out+=blocks(ch,tag==='ol'?2:1);
        return;
      }
      if(tag==='li'){
        isprazni();
        // stavka popisa moze sadrzavati i ugnijezdeni popis
        const vlastiti=document.createElement('div');
        Array.from(ch.childNodes).forEach(n=>{
          const t=n.nodeType===1?n.tagName.toLowerCase():'';
          if(t==='ul'||t==='ol') return;
          vlastiti.appendChild(n.cloneNode(true));
        });
        const p=para(vlastiti,{style:'ListParagraph',numId:listNum||1});
        if(p) out+=p;
        Array.from(ch.children).forEach(n=>{
          const t=n.tagName.toLowerCase();
          if(t==='ul'||t==='ol') out+=blocks(n,t==='ol'?2:1);
        });
        return;
      }
      if(HEADINGS[tag]){ isprazni(); const p=para(ch,{style:HEADINGS[tag]}); if(p) out+=p; return; }
      if(BLOCK.has(tag)){
        isprazni();
        // ako blok sadrzi druge blokove, ide se dublje; inace je to jedan odlomak
        const ugnijezdeni=Array.from(ch.children).some(k=>{
          const t=k.tagName.toLowerCase();
          return BLOCK.has(t)||t==='table'||t==='ul'||t==='ol';
        });
        if(ugnijezdeni) out+=blocks(ch,listNum);
        else { const p=para(ch,listNum?{style:'ListParagraph',numId:listNum}:null); if(p) out+=p; }
        return;
      }
      slobodni.push(ch);
    });
    isprazni();
    return out;
  }

  /* Gradi .docx iz vec ociscene preslike i vraca Uint8Array.
     rootEl - element ciji se sadrzaj pretvara (ociscena preslika)
     title  - naslov koji ide u svojstva nove datoteke */
  function build(rootEl,title){
    if(!window.fflate) throw new Error('fflate nije ucitan');
    let body=blocks(rootEl,null);
    if(!body) body='<w:p/>';
    const document_xml=HEAD+'<w:document '+NS+'><w:body>'+body+
      '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/>'+
      '<w:pgMar w:top="1417" w:right="1417" w:bottom="1417" w:left="1417" w:header="708" w:footer="708" w:gutter="0"/>'+
      '</w:sectPr></w:body></w:document>';
    const map={
      '[Content_Types].xml':CONTENT_TYPES,
      '_rels/.rels':ROOT_RELS,
      'word/document.xml':document_xml,
      'word/_rels/document.xml.rels':DOC_RELS,
      'word/styles.xml':STYLES,
      'word/numbering.xml':NUMBERING,
      'docProps/core.xml':core(title)
    };
    const z={};
    Object.keys(map).forEach(k=>{ z[k]=window.fflate.strToU8(map[k]); });
    return window.fflate.zipSync(z,{level:6});
  }

  /* Ime nove datoteke, izvedeno iz imena izvorne uz jasnu oznaku.
     Diakritike i znakovi koji smetaju u imenima datoteka se maknu. */
  function fileName(izvorno,oznaka){
    let base=String(izvorno||'').replace(/\.[^.]+$/,'').trim();
    if(!base) base='owluv';
    base=base.normalize?base.normalize('NFD').replace(/[\u0300-\u036F]/g,''):base;
    base=base.replace(/[đĐ]/g,'d').replace(/[^A-Za-z0-9 _.-]/g,'').replace(/\s+/g,'-').replace(/-+/g,'-');
    base=base.replace(/^[-.]+|[-.]+$/g,'');
    if(!base) base='owluv';
    if(base.length>60) base=base.slice(0,60);
    return base+'-'+(oznaka||'cleaned')+'.docx';
  }

  OwlUV.docxout={build,fileName};
})();
