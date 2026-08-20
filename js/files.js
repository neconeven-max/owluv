/* OwlUV - ulaz za datoteke: povuci-i-pusti, klasican odabir, prepoznavanje formata.
   Ovo je samo NOVI ULAZ u postojeci mehanizam iz detect.js. Sve sto se ucita
   zavrsi kao HTML u lijevom panelu i prolazi kroz istu provjeru kao zalijepljeni
   tekst. Nista se nikamo ne salje - FileReader cita s diska u memoriju preglednika. */
(function(){
  const OwlUV = window.OwlUV = window.OwlUV || {};
  const MAX = 25*1024*1024;

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
       {ok:false, msgKey:'errDoc'|'errPdf'|'errType'|'errTooBig'|'errRead'|'errDocx'} */
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
        let parsed;
        try{ parsed=OwlUV.docx.parse(new Uint8Array(buf)); }
        catch(e){ return {ok:false,msgKey:'errDocx'}; }
        return {ok:true,source:'docx',docx:parsed,html:OwlUV.docx.toHtml(parsed,t)};
      }
      const str=await readAs(file,'text');
      if(kind==='html') return {ok:true,source:'html',html:OwlUV.detect.sanitize(str)};
      return {ok:true,source:'text',html:OwlUV.detect.plainToHtml(str)};
    }catch(e){
      return {ok:false,msgKey:'errRead'};
    }
  }

  // ---------- povuci i pusti ----------
  function wireDropzone(zone,onFile,onState){
    let depth=0;
    const stop=e=>{e.preventDefault();e.stopPropagation();};
    ['dragenter','dragover','dragleave','drop'].forEach(ev=>zone.addEventListener(ev,stop));
    zone.addEventListener('dragenter',()=>{ depth++; onState(true); });
    zone.addEventListener('dragleave',()=>{ if(--depth<=0){depth=0;onState(false);} });
    zone.addEventListener('drop',e=>{
      depth=0; onState(false);
      const dt=e.dataTransfer; if(!dt) return;
      const f=dt.files&&dt.files[0];
      if(f) onFile(f);                       // jedna datoteka odjednom
    });
  }

  OwlUV.files={load,kindOf,fmtSize,wireDropzone,MAX};
})();
