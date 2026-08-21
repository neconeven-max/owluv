/* OwlUV - prepoznavanje AI manipulacije po SIGNALIMA.

   ZASTO: popis gotovih fraza (js/detect.js) hvata lijene napade, a promasuje
   svakoga tko istu stvar napise svojim rijecima. Nije vazno koje tocno rijeci
   stoje, nego da se recenica obraca STROJU, a ne citatelju. Kao kad se u pismu
   upucenom tebi odjednom pojavi recenica upucena postaru.

   NACELO: alat je radar. SVAKI pogodak se prikazuje. Nema praga, nema zbrajanja
   bodova i nema odbacivanja nalaza zato sto je slabiji. Recenica s jednim
   signalom ide u popis jednako kao i recenica s cetiri. Uz svaki nalaz pise
   koji su signali pronadeni, da korisnik moze provjeriti alat, a ne samo
   vjerovati mu.

   Popis fraza iz detect.js OSTAJE i nije diran. Ovo je dodatak, ne zamjena. */
(function(){
  const OwlUV = window.OwlUV = window.OwlUV || {};

  // ============ LEKSIKONI SIGNALA, SVIH 6 JEZIKA ============
  // Svaki signal je popis izraza. Trazi se pojava bilo kojeg izraza u recenici.

  // 1. OBRACANJE STROJU
  //
  // Signal NE okida na samu pojavu rijeci. Rijec "sustav" u "prometni sustav"
  // nije obracanje stroju nego obicna hrvatska rijec, a "Umjetna inteligencija
  // mijenja nacin ucenja" govori O stroju, ne STROJU. Zato se trazi OKVIR
  // OBRACANJA: da je rijec upotrijebljena kao netko kome se govori.
  //
  // Rijeci se dijele na dvije skupine:
  //  - NEDVOSMISLENE (ai, umjetna inteligencija, jezicni model, asistent):
  //    okidaju uz bilo koji okvir obracanja, ukljucujuci naredbu odmah iza
  //    ("sustav TREBA", "assistant OUGHT TO")
  //  - SVAKODNEVNE (sustav, program, model, software): okidaju SAMO uz jaki
  //    okvir, dakle uvjet s glagolom citanja ili obrade ("ako ovo CITA...")
  //    ili napomenu upucenu nekome ("napomena ZA...")
  //
  // Rijeci "upute" i "naredba" izbacene su iz ovog signala: one nisu stroj.
  // Injekcije koje ih koriste hvata popis fraza i signal zapovjednog tona.
  const M_JAKE=[
    /\b(ai|a\.i\.|llm|gpt|chat ?gpt|chatbot|copilot|claude|gemini)\b/i,
    /\bartificial intelligence\b|\blanguage model\b|\bsystem prompt\b/i,
    /\bassistant\b|\breviewer\b/i,
    /umjetn\w+\s+inteligencij\w+|jezi[čc]n\w+\s+model\w*|asistent\w*/i,
    /k[üu]nstlich\w+\s+intelligenz|sprachmodell\w*|assistent\w*/i,
    /intelligence\s+artificielle|mod[èe]le\s+de\s+langage|assistant\w*/i,
    /inteligencia\s+artificial|modelo\s+de\s+lenguaje|asistente\w*/i,
    /intelligenza\s+artificiale|modello\s+linguistico|assistente\w*/i
  ];
  const M_SLABE=[
    /\b(system|program|programme|software|bot|model)\b/i,
    /\bsustav\w*|\bprogram\w*|\bmodel\w*/i,
    /\bsystem\w*|\bprogramm\w*/i,
    /\bsyst[èe]me\w*|\bprogramme\w*|\bmod[èe]le\w*/i,
    /\bsistema\w*|\bprograma\w*|\bmodelo\w*/i,
    /\bsistema\w*|\bprogramma\w*|\bmodello\w*/i
  ];
  // jaki okvir: uvjet s citanjem ili obradom, ili napomena upucena nekome
  const OKVIR_JAKI=[
    /\b(ako|kad|kada)\b[^.!?]{0,60}\b(čita\w*|cita\w*|obrađuj\w*|obraduj\w*|procesir\w*|pregleda\w*|obrad\w+)/i,
    /\b(if|when|should|in case)\b[^.!?]{0,60}\b(read|reads|reading|process|processes|processed|processing|review\w*|parse\w*)\b/i,
    /\b(falls|wenn|sollte)\b[^.!?]{0,60}\b(gelesen|liest|verarbeit\w*|gepr[üu]ft|bewertet)\b/i,
    /\b(si|lorsque|au cas)\b[^.!?]{0,60}\b(lu|lit|lue|trait[ée]\w*|traite|analys[ée]\w*)\b/i,
    /\b(si|cuando|en caso)\b[^.!?]{0,60}\b(lee|le[íi]do|procesa\w*|analiza\w*|revisa\w*)\b/i,
    /\b(se|quando|nel caso)\b[^.!?]{0,60}\b(letto|legge|elabora\w*|analizza\w*|esamina\w*)\b/i,
    /\b(napomena|uputa|poruka)\s+(za|tehni[čc]koj)\b/i,
    /\bnote\s+(for|to)\b|\bmessage\s+(for|to)\b|\bfor\s+any\s+\w+\s+(reviewer|reader|system)\b/i,
    /\bhinweis\s+(f[üu]r|an)\b|\bnachricht\s+(f[üu]r|an)\b/i,
    /\bnote\s+(pour|à l['’]attention)\b|\bmessage\s+pour\b/i,
    /\bnota\s+para\b|\bmensaje\s+para\b/i,
    /\bnota\s+per\b|\bmessaggio\s+per\b/i,
    // izravno obracanje u drugom licu
    /\bako\s+si\b|\bif\s+you\s+are\b|\bwenn\s+du\b|\bsi\s+(tu|vous)\s+[êe]tes?\b|\bsi\s+eres\b|\bse\s+sei\b/i
  ];
  // slabi okvir: naredba ili duznost odmah iza rijeci
  const OKVIR_NAREDBA=/^[^.!?]{0,45}?\b(treba\w*|mora\w*|neka\b|dužan\w*|duzan\w*|zada[ćc]a\s+je|zadatak\s+je|should|must|ought\s+to|shall|is\s+to\b|are\s+to\b|has\s+to\b|soll\w*|muss|m[üu]ssen|ist\s+zu\b|doit|devrait|deve|deber[íi]a|debe|dovrebbe|va\s+\w+t[oa]\b)/i;
  // strojna obrada dokumenta: sama po sebi znaci da dokument obraduje stroj
  const M_OBRADA=[
    /\b(automated|automatic|machine)\s+(review\w*|process\w*|grading|grader|reading|evaluation|assessment|screening|selection)\b/i,
    /(strojn\w+|automatsk\w+)\s+(obrad\w+|provjer\w+|ocjen\w+|čitanj\w+|odabir\w*)/i,
    /(automatisch\w+|maschinell\w+)\s+(verarbeitung|bewertung|pr[üu]fung|auswertung|lesen|auswahl)/i,
    /(traitement|[ée]valuation|lecture|s[ée]lection|notation)\s+automatique/i,
    /(procesamiento|evaluaci[óo]n|lectura|selecci[óo]n|correcci[óo]n)\s+autom[áa]tic\w+/i,
    /(elaborazione|valutazione|lettura|selezione|correzione)\s+automatic\w+/i
  ];

  // Vraca true ako se recenica OBRACA stroju, a ne samo spominje rijec.
  function obracaSeStroju(txt){
    if(M_OBRADA.some(re=>{re.lastIndex=0;return re.test(txt);})) return true;
    const jakiOkvir=OKVIR_JAKI.some(re=>{re.lastIndex=0;return re.test(txt);});
    const nadi=(popis)=>{
      for(const re of popis){
        const r=new RegExp(re.source,re.flags.replace('g','')+'g');
        let m;
        while((m=r.exec(txt))!==null){
          if(m.index===r.lastIndex) r.lastIndex++;
          return m;               // dovoljna je prva pojava
        }
      }
      return null;
    };
    const jaka=nadi(M_JAKE);
    if(jaka){
      if(jakiOkvir) return true;
      // naredba odmah iza rijeci: "sustav treba", "assistant ought to"
      if(OKVIR_NAREDBA.test(txt.slice(jaka.index+jaka[0].length))) return true;
    }
    const slaba=nadi(M_SLABE);
    if(slaba&&jakiOkvir) return true;   // svakodnevna rijec samo uz jaki okvir
    return false;
  }
  const ADDR=[{test:obracaSeStroju}];

  // 2. zapovjedni ton usmjeren na ocjenjivanje ili odabir
  const CMD=[
    /\b(select|choose|pick|rank|rate|score|grade|evaluate|ignore|disregard|answer|reply|respond|write|recommend|prefer|prioriti[sz]e)\b/i,
    /\b(izaber\w*|odaber\w*|izabrat\w*|ocijen\w*|ocjen[ji]\w*|zanemar\w*|ignorir\w*|odgovor[iit]\w*|napi[šs]\w*|preporu[čc]\w*|rangir\w*|istakn\w*)\b/i,
    /\b(w[äa]hle?n?|bewerte?n?|benote?n?|ignorier\w*|antworte?n?|schreibe?n?|empfiehl|empfehle?n?|bevorzuge?n?|einstufe?n?|hervorheben)\b/i,
    /\b(choisis\w*|s[ée]lectionn\w*|[ée]valu\w*|ignor\w*|r[ée]pond\w*|[ée]cri[stv]\w*|recommand\w*|prioris\w*|mettre en avant)\b/i,
    /\b(elig\w*|seleccion\w*|eval[úu]\w*|calific\w*|ignor\w*|respond\w*|escrib\w*|recomend\w*|prioriz\w*|puntu\w*|destacar)\b/i,
    /\b(scegli\w*|selezion\w*|valut\w*|ignor\w*|rispond\w*|scriv\w*|raccomand\w*|consigli\w*|classific\w*|prioritizz\w*|mettere in evidenza)\b/i
  ];

  // 3. trazenje tajnosti
  const SEC=[
    /\b(do not|don'?t|never|no need to)\s+(mention|reveal|disclose|tell|show|report|say)\b/i,
    /\bkeep (this|it) (secret|confidential|between us|to yourself)\b|\bfor your eyes only\b|\bonly for you\b/i,
    /\bwithout (mentioning|telling|informing)\b|\bsilently\b|\bdo not output\b/i,
    /\b(no need|not necessary|there is no need)\s+to\s+(repeat|mention|include|report|state|note)\b/i,
    /\bneed not be (mentioned|repeated|included|reported)\b/i,
    /ne\s+spominj\w*|nemoj\s+(spomen\w+|otkri\w+|re[ćc]i|navesti)|ne\s+otkriv\w+|drž\w*\s+u\s+tajnosti|samo\s+za\s+tebe|bez\s+spominjanja/i,
    /nije\s+potrebno\s+\w*\s*(navod\w+|spominj\w+|ponavlj\w+|uklju[čc]iv\w+|izvje[šs][ćc]iv\w+)/i,
    /erw[äa]hne?\s+(das|dies|es)?\s*nicht|nicht\s+erw[äa]hnen|halte?\s+(das|dies|es)?\s*geheim|nur\s+f[üu]r\s+dich|ohne\s+es\s+zu\s+erw[äa]hnen/i,
    /nicht\s+(erw[äa]hnt|wiederholt|angegeben|aufgef[üu]hrt)\s+werden|braucht\s+nicht\s+\w*\s*(erw[äa]hnt|genannt)/i,
    /ne\s+(mentionne|r[ée]v[èe]le|dis)\w*\s*pas|sans\s+le\s+mentionner|garde[zr]?\s+(cela|ceci|ça)?\s*secret|uniquement\s+pour\s+(toi|vous)/i,
    /n['’]est\s+pas\s+n[ée]cessaire\s+de\s+(mentionner|r[ée]p[ée]ter|indiquer|signaler)/i,
    /no\s+(menciones|reveles|digas|indiques)|sin\s+mencionar\w*|mant[ée]n\w*\s+.{0,12}secreto|solo\s+para\s+ti/i,
    /no\s+(hace\s+falta|es\s+necesario)\s+(repetir|mencionar|indicar|incluir|se[ñn]alar)/i,
    /non\s+(menzionare|rivelare|dire)|senza\s+menzionar\w+|mantieni\w*\s+.{0,12}segreto|solo\s+per\s+te/i,
    /non\s+[èe]\s+necessario\s+(riportare|menzionare|ripetere|indicare|includere)/i
  ];

  // 4. podmetanje ishoda
  const PLANT=[
    /\b(best|top|ideal|perfect|strongest|most qualified)\s+(candidate|applicant|choice|answer|option|cv|resume)\b/i,
    /\b(highest|maximum|full|top)\s+(grade|score|mark|rating|marks)\b/i,
    /\bthe (correct|right) answer is\b|\bshould be (selected|chosen|hired|recommended)\b/i,
    /najbolj\w+\s+(kandidat\w*|izbor\w*|životopis\w*|odgovor\w*)|najvi[šs]\w+\s+(ocjen\w*|bod\w*)|to[čc]an\s+odgovor\s+je|treba\s+(izabrati|odabrati|preporu[čc]iti)/i,
    /najprikladnij\w+|najpogodnij\w+|u\s+prvih\s+\w+|među\s+prve\s+\w+|na\s+vrh\s+(liste|popisa)/i,
    /\b(most suitable|best suited|near the top|at the top of the (list|shortlist)|among the (first|top))\b/i,
    /\b(geeignetste|am besten geeignet|unter die ersten|ganz oben)\b/i,
    /\b(le plus appropri[ée]|en t[êe]te|parmi les premiers|le mieux plac[ée])\b/i,
    /\b(m[áa]s adecuad\w+|entre l[ao]s primer\w+|en los primeros puestos)\b/i,
    /\b(pi[uù] adatt\w+|ai primi posti|tra i primi)\b/i,
    /beste[rn]?\s+(kandidat\w*|bewerber\w*|wahl|antwort)|h[öo]chste\s+(note|punktzahl|bewertung)|die\s+richtige\s+antwort\s+ist/i,
    /meilleur\w*\s+(candidat\w*|choix|r[ée]ponse)|(note|score)\s+(maximale?|la plus [ée]lev[ée]e)|la\s+bonne\s+r[ée]ponse\s+est/i,
    /mejor\s+(candidat\w*|opci[óo]n|respuesta)|(nota|puntuaci[óo]n)\s+m[áa]xima|la\s+respuesta\s+correcta\s+es/i,
    /miglior\w*\s+(candidat\w*|scelta|risposta)|(voto|punteggio)\s+massim\w+|la\s+risposta\s+(corretta\s+)?[èe]/i
  ];

  const SETS={addr:ADDR,cmd:CMD,sec:SEC,plant:PLANT};

  // ============ PREPOZNAVANJE JEZIKA RECENICE ============
  // Cilj nije savrsen prepoznavatelj jezika nego gruba ocjena: pise li ova
  // recenica ocito drugim jezikom nego ostatak dokumenta. Zato se gleda samo
  // pojava cestih rijeci, i to tek kad ih ima dovoljno da ocjena nesto vrijedi.
  const STOP={
    hr:['i','je','se','na','za','u','od','da','su','koji','kao','sve','ovo','ili','ne','bi','te','s','iz','po','pa','li','sa','ako','samo'],
    en:['the','and','is','of','to','in','that','it','for','with','as','this','are','be','on','you','not','at','by','or','from','which','all','can'],
    de:['der','die','das','und','ist','von','zu','den','mit','sich','auf','für','nicht','ein','eine','dem','als','auch','wird','sie','im','bei','oder','wenn'],
    fr:['le','la','les','et','est','de','des','un','une','dans','pour','que','qui','pas','sur','avec','au','ce','par','plus','ne','vous','ou','son'],
    es:['el','la','los','las','y','es','de','un','una','en','para','que','con','por','no','se','del','al','como','más','su','este','o','pero'],
    it:['il','la','le','e','è','di','un','una','in','per','che','con','da','non','si','del','al','come','più','suo','questo','o','ma','anche']
  };
  function langScore(txt){
    const rijeci=txt.toLowerCase().match(/[\p{L}]+/gu)||[];
    if(rijeci.length<5) return null;         // prekratko da bi ocjena vrijedila
    const bod={};
    let najbolji=null,najvise=0,drugi=0;
    for(const L of Object.keys(STOP)){
      const skup=STOP[L];
      let n=0;
      rijeci.forEach(w=>{ if(skup.indexOf(w)>=0) n++; });
      bod[L]=n;
      if(n>najvise){ drugi=najvise; najvise=n; najbolji=L; }
      else if(n>drugi) drugi=n;
    }
    if(najvise<2||najvise===drugi) return null;   // nema uvjerljivog pobjednika
    return {lang:najbolji,score:najvise,words:rijeci.length};
  }

  // ============ DIJELJENJE NA RECENICE ============
  // Vraca [{txt, start}] s pomakom u izvornom tekstu, jer se po tom pomaku
  // kasnije brise tocno ta pojava iz kopije.
  function sentences(text){
    const out=[];
    const re=/[^.!?\n…]+[.!?…]*\s*|\n+/g;
    let m;
    while((m=re.exec(text))!==null){
      const cijela=m[0];
      const lijevo=cijela.length-cijela.replace(/^\s+/,'').length;
      const txt=cijela.trim();
      if(txt.length>=8) out.push({txt,start:m.index+lijevo});
      if(m.index===re.lastIndex) re.lastIndex++;
    }
    return out;
  }

  /* Nalazi signale u tekstu.
     opts.zones - [{start,end,kind}] podrucja iz aneksa (zaglavlje, fusnota,
                  komentar, svojstva), da se moze prijaviti i signal mjesta
     Vraca [{txt,start,len,signals:[...],lang}] za svaku recenicu s bar jednim
     signalom. NISTA se ne odbacuje. */
  function scan(text,opts){
    const zones=(opts&&opts.zones)||[];
    const docLang=langScore(text);
    const out=[];
    sentences(text).forEach(r=>{
      const sig=[];
      for(const key of Object.keys(SETS)){
        if(SETS[key].some(re=>{ if(re.lastIndex!==undefined) re.lastIndex=0; return re.test(r.txt); })) sig.push(key);
      }
      // recenica na drugom jeziku od ostatka dokumenta
      let lang=null;
      const ls=langScore(r.txt);
      if(ls&&docLang&&ls.lang!==docLang.lang){ sig.push('lang'); lang=ls.lang; }
      // mjesto: zaglavlje, podnozje, fusnota, komentar ili svojstva dokumenta
      const kraj=r.start+r.txt.length;
      const zona=zones.find(z=>r.start<z.end&&kraj>z.start);
      if(zona) sig.push('place:'+zona.kind);
      if(sig.length) out.push({txt:r.txt,start:r.start,len:r.txt.length,signals:sig,lang});
    });
    return out;
  }

  OwlUV.signals={scan,sentences,langScore,SETS,STOP,obracaSeStroju};
})();
