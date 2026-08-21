/* OwlUV - ulaz za datoteke: povuci-i-pusti, klasican odabir, prepoznavanje formata.
   Ovo je samo NOVI ULAZ u postojeci mehanizam iz detect.js. Sve sto se ucita
   zavrsi kao HTML u lijevom panelu i prolazi kroz istu provjeru kao zalijepljeni
   tekst. Nista se nikamo ne salje - FileReader cita s diska u memoriju preglednika. */
(function(){
  const OwlUV = window.OwlUV = window.OwlUV || {};
  // Gornja granica velicine datoteke. 15 MB je odabrano tako da uobicajeni
  // zivotopisi (desetci KB) i zavrsni radovi sa slikama (nekoliko MB) prolaze s
  // velikom rezervom, a da se preglednik ne pokusa nositi s necim sto ce ga
  // zaustaviti bez ijedne poruke. Vidi README, odjeljak o granicama.
  const MAX = 15*1024*1024;
  // Gornja granica kolicine teksta. Vrijedi i za zalijepljeni tekst, gdje
  // granica velicine datoteke ne pomaze jer datoteke nema. 1.000.000 znakova je
  // vise nego sto ima ijedan zavrsni rad.
  const MAX_TEXT = 1000000;

  // Word zasticen lozinkom nije ZIP nego stari OLE spremnik. Ako se to ne
  // prepozna, raspakiravanje padne i dokument izgleda kao neispravan ili, jos
  // gore, kao prazan - a prazan dokument bi dobio presudu "nema sto provjeriti"
  // na dokument koji mozda ima zamku. Zato se potpis provjerava izricito.
  const OLE_SIG = [0xD0,0xCF,0x11,0xE0,0xA1,0xB1,0x1A,0xE1];
  function isOle(bytes){
    if(!bytes||bytes.length<8) return false;
    for(let i=0;i<8;i++) if(bytes[i]!==OLE_SIG[i]) return false;
    return true;
  }
  // ispravan .docx je ZIP, dakle pocinje s PK
  function isZip(bytes){
    return !!bytes&&bytes.length>=4&&bytes[0]===0x50&&bytes[1]===0x4B;
  }

  function fmtSize(b){
    if(b<1024) return b+' B';
    if(b<1024*1024) return (b/1024).toFixed(b<10240?1:0)+' KB';
    return (b/1048576).toFixed(1)+' MB';
  }

  function kindOf(file){
    const n=(file.name||'').toLowerCase();
    const m=(file.type||'').toLowerCase();
    if(/\.docx$/.test(n)||m==='application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'docx';
    if(/\.doc$/.test(n)||m==='application/msword') return 'doc';
    if(/\.pdf$/.test(n)||m==='application/pdf') return 'pdf';
    if(/\.(html?|xhtml)$/.test(n)||/^text\/html/.test(m)) return 'html';
    if(/\.(txt|md|markdown|csv|tsv|log|json|xml|srt|vtt|rtf)$/.test(n)||/^text\//.test(m)) return 'text';
    if(/\.(docm|dotx)$/.test(n)) return 'docx';
    if(/\.(odt|pages|rtf)$/.test(n)) return 'other';
    if(!n.includes('.')&&!m) return 'text';
    return 'other';
  }

  const readAs = (file,how) => new Promise((res,rej)=>{
    const fr=new FileReader();
    fr.onload=()=>res(fr.result);
    fr.onerror=()=>rej(new Error('READ'));
    how==='buf'?fr.readAsArrayBuffer(file):fr.readAsText(file);
  });

  /* Vraca:
       {ok:true, html, source:'text'|'html'|'docx', docx?:parsedResult}
       {ok:false, msgKey:'errDoc'|'errPdf'|'errType'|'errTooBig'|'errTooLong'|'errRead'
                        |'errDocx'|'errDocxLocked'|'errUnreadable'} */
  async function load(file,t){
    if(!file) return {ok:false,msgKey:'errRead'};
    if(file.size>MAX) return {ok:false,msgKey:'errTooBig'};
    const kind=kindOf(file);
    if(kind==='doc')   return {ok:false,msgKey:'errDoc'};
    if(kind==='pdf')   return {ok:false,msgKey:'errPdf'};
    if(kind==='other') return {ok:false,msgKey:'errType'};
    try{
      if(kind==='docx'){
        const buf=await readAs(file,'buf');
        const bytes=new Uint8Array(buf);
        // zasticen lozinkom: izricita poruka, nikad tiho prazan dokument
        if(isOle(bytes))  return {ok:false,msgKey:'errDocxLocked'};
        // krivi nastavak (npr. slika preimenovana u .docx)
        if(!isZip(bytes)) return {ok:false,msgKey:'errUnreadable'};
        let parsed;
        try{ parsed=OwlUV.docx.parse(bytes); }
        catch(e){ return {ok:false,msgKey:'errDocx'}; }
        const html=OwlUV.docx.toHtml(parsed,t);
        if(html.length>MAX_TEXT) return {ok:false,msgKey:'errTooLong'};
        return {ok:true,source:'docx',docx:parsed,html};
      }
      const str=await readAs(file,'text');
      if(str.length>MAX_TEXT) return {ok:false,msgKey:'errTooLong'};
      if(kind==='html') return {ok:true,source:'html',html:OwlUV.detect.sanitize(str)};
      return {ok:true,source:'text',html:OwlUV.detect.plainToHtml(str)};
    }catch(e){
      return {ok:false,msgKey:'errRead'};
    }
  }

  // ---------- povuci i pusti ----------
  // onMany se zove kad je odjednom baceno vise datoteka. Uzima se prva, ali se
  // to korisniku mora reci: presucivanje bi ostavilo dojam da su sve provjerene.
  function wireDropzone(zone,onFile,onState,onMany){
    let depth=0;
    const stop=e=>{e.preventDefault();e.stopPropagation();};
    ['dragenter','dragover','dragleave','drop'].forEach(ev=>zone.addEventListener(ev,stop));
    zone.addEventListener('dragenter',()=>{ depth++; onState(true); });
    zone.addEventListener('dragleave',()=>{ if(--depth<=0){depth=0;onState(false);} });
    zone.addEventListener('drop',e=>{
      depth=0; onState(false);
      const dt=e.dataTransfer; if(!dt) return;
      const n=(dt.files&&dt.files.length)||0;
      if(n>1&&typeof onMany==='function') onMany(n);
      const f=dt.files&&dt.files[0];
      if(f) onFile(f);                       // jedna datoteka odjednom
    });
  }

  OwlUV.files={load,kindOf,fmtSize,wireDropzone,isOle,isZip,MAX,MAX_TEXT};
})();
