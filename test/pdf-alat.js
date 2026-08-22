/* OwlUV - pomocni alat za rucnu gradnju PDF-a.
   Koristi ga test/napravi-testne-pdf.js. Ne treba nikakvu knjiznicu: PDF je
   tekstualni format s tablicom pomaka na kraju, pa se pise izravno, isto kao
   sto test/napravi-testne-docx.js rucno pise .docx.

   Sve se pise u latin1, jer PDF broji BAJTOVE, ne znakove. */
'use strict';

// literal string u sadrzaju stranice: ( ) i \ moraju biti zasticeni
function str(s){
  return '(' + String(s).replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)') + ')';
}
// tekstualni niz koji smije nositi bilo koji Unicode znak (npr. nevidljive):
// UTF-16BE s BOM-om, zapisan heksadekadski
function utf16(s){
  let h='FEFF';
  for(const ch of String(s)){
    const cp=ch.codePointAt(0);
    if(cp>0xFFFF){
      const v=cp-0x10000;
      h+=(0xD800+(v>>10)).toString(16).padStart(4,'0').toUpperCase();
      h+=(0xDC00+(v&0x3FF)).toString(16).padStart(4,'0').toUpperCase();
    } else h+=cp.toString(16).padStart(4,'0').toUpperCase();
  }
  return '<'+h+'>';
}

/* Objekt s tokom. dict je sadrzaj rjecnika BEZ /Length, koji se dodaje sam. */
function stream(dict, data){
  const buf=Buffer.from(data,'latin1');
  return {dict, data:buf};
}

/* Gradi cijeli PDF. objs je polje objekata, brojevi su 1-based po indeksu.
   Svaki element je niz (rjecnik) ili rezultat stream(). */
function build(objs, trailerExtra){
  const chunks=[];
  let pos=0;
  const push=(s)=>{
    const b=Buffer.isBuffer(s)?s:Buffer.from(s,'latin1');
    chunks.push(b); pos+=b.length;
  };
  push('%PDF-1.7\n%\xE2\xE3\xCF\xD3\n');
  const offsets=[0];
  objs.forEach((o,i)=>{
    offsets.push(pos);
    push((i+1)+' 0 obj\n');
    if(o&&o.data){
      push(o.dict.replace(/>>\s*$/,'/Length '+o.data.length+' >>')+'\nstream\n');
      push(o.data);
      push('\nendstream\n');
    } else {
      push(o+'\n');
    }
    push('endobj\n');
  });
  const xref=pos;
  let x='xref\n0 '+(objs.length+1)+'\n0000000000 65535 f \n';
  for(let i=1;i<=objs.length;i++) x+=String(offsets[i]).padStart(10,'0')+' 00000 n \n';
  x+='trailer\n<< /Size '+(objs.length+1)+' /Root 1 0 R '+(trailerExtra||'')+' >>\n';
  x+='startxref\n'+xref+'\n%%EOF\n';
  push(x);
  return Buffer.concat(chunks);
}

module.exports={str,utf16,stream,build};
