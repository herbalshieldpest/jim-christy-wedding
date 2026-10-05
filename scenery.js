/* ===== Hagen scenery =====
   The living background: drifting sky, swaying reeds, the lens flare, falling leaves and dust, the animals and birds, and the nature sounds.
   One copy is kept in the "Hagen Scenery" artifact; the family board and the wedding site each pull it in from there.
   A page can tune it before loading this file:  window.SceneryHost = { photo, fade, sun, dim, shown, key, sounds }  (all optional). */
(function(){ if(document.getElementById("scenery-css")) return; const st=document.createElement("style"); st.id="scenery-css";
  st.textContent="#ambient{position:fixed;inset:0;width:100vw;height:100vh;z-index:0;pointer-events:none}"; document.head.append(st); })();
var SceneryHost=window.SceneryHost||{};
const SC={
  photo:()=>{ try{ return SceneryHost.photo? SceneryHost.photo() : "scene.jpg"; }catch(e){ return null; } },          /* the photo the scene is painted over */
  fade:()=>{ try{ return SceneryHost.fade? SceneryHost.fade() : 0; }catch(e){ return 0; } },                        /* how much the page tints the photo, 0-100 */
  sun:()=>{ try{ return SceneryHost.sun? SceneryHost.sun() : {x:.711,y:.344,iw:1364,ih:1024,strength:.33}; }catch(e){ return null; } },
  dim:()=>{ try{ return SceneryHost.dim? !!SceneryHost.dim() : false; }catch(e){ return false; } },                 /* a darker "welcome" look */
  shown:()=>{ try{ return SceneryHost.shown? !!SceneryHost.shown() : true; }catch(e){ return true; } },
  key:SceneryHost.key||"scene", sounds:SceneryHost.sounds||"" };
var natureSfx=(function(){
  let ctx=null, master=null, noiseBuf=null, breezeG=null, breezeF=null, on=true, armed=false, birdT=null, gustT=null, live=false, faded=false;
  on=true;   /* sound is on by default every visit; browsers only let it start on the first tap, click or key press */
  const R=(a,b)=>a+Math.random()*(b-a);
  const wanted=()=>on && !document.hidden && (typeof ambient==="undefined"||ambient.on);
  function init(){
    if(ctx) return true; const AC=window.AudioContext||window.webkitAudioContext; if(!AC) return false;
    try{ ctx=new AC(); }catch(e){ return false; }
    master=ctx.createGain(); master.gain.value=0; master.connect(ctx.destination);
    const n=ctx.sampleRate*3; noiseBuf=ctx.createBuffer(1,n,ctx.sampleRate); const d=noiseBuf.getChannelData(0); let b0=0,b1=0,b2=0;
    for(let i=0;i<n;i++){ const w=Math.random()*2-1; b0=.997*b0+w*.029; b1=.985*b1+w*.032; b2=.95*b2+w*.048; d[i]=(b0+b1+b2+w*.02)*.9; }   /* soft, pinkish noise */
    /* the breeze: noise through a slowly wandering low-pass, swelling in gusts and falling away */
    const src=ctx.createBufferSource(); src.buffer=noiseBuf; src.loop=true;
    breezeF=ctx.createBiquadFilter(); breezeF.type="lowpass"; breezeF.frequency.value=500; breezeF.Q.value=.4;
    breezeG=ctx.createGain(); breezeG.gain.value=.0;
    src.connect(breezeF); breezeF.connect(breezeG); breezeG.connect(master); src.start();
    return true;
  }
  function gust(){
    if(!ctx) return; const now=ctx.currentTime, up=R(1.5,3.5), hold=R(.5,2.5), down=R(2,4.5), peak=R(.04,.11);
    breezeG.gain.cancelScheduledValues(now); breezeG.gain.setTargetAtTime(peak,now,up/3); breezeG.gain.setTargetAtTime(R(.008,.025),now+up+hold,down/3);
    breezeF.frequency.cancelScheduledValues(now); breezeF.frequency.setTargetAtTime(R(700,1300),now,up/3); breezeF.frequency.setTargetAtTime(R(320,520),now+up+hold,down/3);
    gustT=setTimeout(gust,(up+hold+down+R(1,6))*1000);
  }
  function voice(dest,pan){ const p=ctx.createStereoPanner?ctx.createStereoPanner():null, g=ctx.createGain(); if(p){ p.pan.value=Math.max(-1,Math.min(1,pan)); g.connect(p); p.connect(dest); } else g.connect(dest); return g; }
  function tone(at,f0,f1,dur,vol,out,type){
    const o=ctx.createOscillator(), g=ctx.createGain(); o.type=type||"sine"; o.frequency.setValueAtTime(f0,at); o.frequency.exponentialRampToValueAtTime(f1,at+dur);
    g.gain.setValueAtTime(0,at); g.gain.linearRampToValueAtTime(vol,at+Math.min(.015,dur*.3)); g.gain.exponentialRampToValueAtTime(.0001,at+dur);
    o.connect(g); g.connect(out); o.start(at); o.stop(at+dur+.02);
  }
  /* a few songbirds of the field edge, near and far */
  function bird(){
    if(!ctx||!live){ return; }
    const now=ctx.currentTime+.05, far=Math.random(), lp=ctx.createBiquadFilter(); lp.type="lowpass"; lp.frequency.value=9000-far*5000; lp.connect(master);
    const out=voice(lp,R(-.9,.9)), v=.085*(1-far*.55), kind=Math.random();
    if(kind<.25){ tone(now,4100,3900,.32,v,out); tone(now+.38,3500,3350,.36,v*.9,out); }                                   /* fee-bee */
    else if(kind<.45){ let at=now; const base=R(2600,3400); for(let i=0;i<3;i++){ tone(at,base*1.3,base*.75,.2,v,out); at+=.24; } for(let i=0;i<4;i++){ tone(at,base*1.1,base*.9,.08,v*.8,out); at+=.1; } }   /* cheer cheer cheer, chew chew */
    else if(kind<.7){ const n=Math.floor(R(8,16)), base=R(4200,5600); let at=now; for(let i=0;i<n;i++){ tone(at,base*R(1,1.08),base*R(.86,.95),.045,v*.7,out); at+=R(.055,.075); } }   /* a dry trill */
    else if(kind<.85){ tone(now,R(5200,6400),R(3600,4400),.09,v*.8,out); tone(now+.18,R(5200,6400),R(3600,4400),.09,v*.7,out); }   /* chip chip */
    else { let at=now; for(let i=0;i<3;i++){ tone(at,2500,3600,.12,v*.8,out); tone(at+.13,3600,2900,.1,v*.7,out); at+=.32; } }    /* a rising whistle */
    out.disconnect && setTimeout(()=>{ try{ lp.disconnect(); }catch(e){} },6000);
  }
  function birds(){ if(live&&ctx&&ctx.state!=="running") ctx.resume().catch(()=>{}); bird(); birdT=setTimeout(birds,R(.9,4)*1000); }
  /* a woodpecker drumming on a dead limb: a fast run of hollow knocks that trails off */
  function drum(xf){ if(!ctx||!live) return; const out=voice(master,(xf||.2)*2-1), bp=ctx.createBiquadFilter(); bp.type="bandpass"; bp.frequency.value=R(700,950); bp.Q.value=3; bp.connect(out);
    let at=ctx.currentTime+.05; const n=Math.floor(R(14,20));
    for(let i=0;i<n;i++){ const s=ctx.createBufferSource(); s.buffer=noiseBuf; const g=ctx.createGain(), v=.55*(i<n-5?1:(n-i)/5);
      g.gain.setValueAtTime(0,at); g.gain.linearRampToValueAtTime(v,at+.002); g.gain.exponentialRampToValueAtTime(.001,at+.035); s.connect(g); g.connect(bp); s.start(at,R(0,2.5),.05);
      at+=.062-i*.0012; } }
  /* ---- the evening chorus: crickets and katydids swelling as the light goes, spring peepers from the wet ground,
     and now and then a whip-poor-will or a barred owl back in the woods ---- */
  let dusk=0, chorT=null, katT=null, peepT=null, wpwT=null, bowlT=null;
  function cricket(){ if(ctx&&live){ const v=.012+.03*dusk; for(let k=0;k<3;k++){ const out=voice(master,R(-.9,.9)), f=R(4300,4900); let at=ctx.currentTime+R(0,.4);
        for(let c=0;c<3;c++){ for(let p=0;p<3;p++){ tone(at,f,f*.99,.022,v*R(.6,1),out); at+=.032; } at+=R(.18,.32); } } }
    chorT=setTimeout(cricket,R(900,1300)); }
  function katydid(){ if(ctx&&live&&dusk>.15){ const out=voice(master,R(-.8,.8)), bp=ctx.createBiquadFilter(); bp.type="bandpass"; bp.frequency.value=R(2600,3400); bp.Q.value=5; bp.connect(out);
      let at=ctx.currentTime+.05; const n=Math.random()<.5?3:2;
      for(let i=0;i<n;i++){ const s=ctx.createBufferSource(); s.buffer=noiseBuf; const g=ctx.createGain(), v=.05*dusk; g.gain.setValueAtTime(0,at); g.gain.linearRampToValueAtTime(v,at+.01); g.gain.setValueAtTime(v,at+.06); g.gain.exponentialRampToValueAtTime(.001,at+.11); s.connect(g); g.connect(bp); s.start(at,R(0,2.5),.13); at+=.16; } }
    katT=setTimeout(katydid,R(1200,3200)); }
  function peeper(){ if(ctx&&live){ const out=voice(master,R(-1,1)), f=R(2700,3100), v=.018+.022*dusk; tone(ctx.currentTime+.02,f*.88,f,.13,v,out); }
    peepT=setTimeout(peeper,R(250,1400)/(.5+dusk)); }
  function whippoorwill(){ if(ctx&&live&&dusk>.35){ const lp=ctx.createBiquadFilter(); lp.type="lowpass"; lp.frequency.value=4000; lp.connect(master); const out=voice(lp,R(-.8,.8)), v=.05;
      let at=ctx.currentTime+.1; const n=3+Math.floor(Math.random()*5);
      for(let i=0;i<n;i++){ tone(at,1500,2100,.09,v,out); tone(at+.12,1300,1200,.12,v*.8,out); tone(at+.29,1400,2500,.22,v,out); at+=.85; } }   /* whip-poor-WILL */
    wpwT=setTimeout(whippoorwill,R(40,90)*1000); }
  function barredOwl(){ if(ctx&&live&&dusk>.2){ const lp=ctx.createBiquadFilter(); lp.type="lowpass"; lp.frequency.value=900; lp.connect(master); const out=voice(lp,R(-.9,.9)), v=.12;
      let at=ctx.currentTime+.1; const notes=[[420,400,.18],[440,420,.16],[460,400,.3],[0,0,.25],[420,400,.18],[440,420,.16],[480,360,.55]];   /* who-cooks-for-you, who-cooks-for-you-all */
      for(const [a,b,d] of notes){ if(a) hoot(at,d,a,v,out); at+=d+.08; } }
    bowlT=setTimeout(barredOwl,R(60,150)*1000); }
  function startChorus(){ clearTimeout(chorT); clearTimeout(katT); clearTimeout(peepT); clearTimeout(wpwT); clearTimeout(bowlT);
    chorT=setTimeout(cricket,600); katT=setTimeout(katydid,2000); peepT=setTimeout(peeper,1500); wpwT=setTimeout(whippoorwill,R(25,50)*1000); bowlT=setTimeout(barredOwl,R(40,80)*1000); }
  /* paws on the turf: a soft low thump with a brush of grass, panned to where the dog is; and the quick scratch of a hind foot on fur */
  function paw(pan,v){ if(!ctx||!live) return; const at=ctx.currentTime+.01, out=voice(master,pan*.8);           /* a soft, rounded thump: no sharp edges, so nothing clicks */
    const lp=ctx.createBiquadFilter(); lp.type="lowpass"; lp.frequency.value=R(180,260); lp.Q.value=.5; lp.connect(out);
    const s=ctx.createBufferSource(); s.buffer=noiseBuf; const g=ctx.createGain(); g.gain.setValueAtTime(0,at); g.gain.linearRampToValueAtTime(v,at+.018); g.gain.linearRampToValueAtTime(0,at+.11); s.connect(g); g.connect(lp); s.start(at,R(0,2.5),.13);
    const o=ctx.createOscillator(), og=ctx.createGain(); o.type="sine"; o.frequency.setValueAtTime(R(70,90),at); o.frequency.linearRampToValueAtTime(48,at+.09);
    og.gain.setValueAtTime(0,at); og.gain.linearRampToValueAtTime(v*.45,at+.015); og.gain.linearRampToValueAtTime(0,at+.1); o.connect(og); og.connect(out); o.start(at); o.stop(at+.12); }
  function scratch(pan,v){ if(!ctx||!live) return; const at=ctx.currentTime+.01, out=voice(master,pan*.8), bp=ctx.createBiquadFilter(); bp.type="bandpass"; bp.frequency.value=R(1400,2200); bp.Q.value=1; bp.connect(out);
    const s=ctx.createBufferSource(); s.buffer=noiseBuf; const g=ctx.createGain(); g.gain.setValueAtTime(0,at); g.gain.linearRampToValueAtTime(v,at+.015); g.gain.linearRampToValueAtTime(0,at+.07); s.connect(g); g.connect(bp); s.start(at,R(0,2.5),.09); }
  /* a hummingbird's wings: a soft, fast-throbbing hum, panned and swelling with how close it is, and a few high chips */
  let humN=null;
  function humSet(pan,vol){ if(!ctx||!live){ return; }
    if(!humN&&vol>0){                                                                                             /* a buzzy whir: a low sawtooth throb plus breathy wing noise, high enough to hear on small speakers */
      const g=ctx.createGain(); g.gain.value=0; const p=ctx.createStereoPanner? ctx.createStereoPanner() : null; if(p){ g.connect(p); p.connect(master); } else g.connect(master);
      const bp=ctx.createBiquadFilter(); bp.type="bandpass"; bp.frequency.value=420; bp.Q.value=.7; bp.connect(g);
      const o1=ctx.createOscillator(); o1.type="sawtooth"; o1.frequency.value=52; const g1=ctx.createGain(); g1.gain.value=.55; o1.connect(g1); g1.connect(bp);
      const o2=ctx.createOscillator(); o2.type="sawtooth"; o2.frequency.value=104.6; const g2=ctx.createGain(); g2.gain.value=.3; o2.connect(g2); g2.connect(bp);
      const src=ctx.createBufferSource(); src.buffer=noiseBuf; src.loop=true; const nb=ctx.createBiquadFilter(); nb.type="bandpass"; nb.frequency.value=900; nb.Q.value=.9; const ng=ctx.createGain(); ng.gain.value=1.4;
      const am=ctx.createGain(); am.gain.value=.6; const lfo=ctx.createOscillator(); lfo.frequency.value=52; const lg=ctx.createGain(); lg.gain.value=.4; lfo.connect(lg); lg.connect(am.gain);
      src.connect(nb); nb.connect(am); am.connect(ng); ng.connect(g);
      src.start(); o1.start(); o2.start(); lfo.start(); humN={src,o1,o2,lfo,g,p,bp}; }
    if(!humN) return; const now=ctx.currentTime; humN.g.gain.setTargetAtTime(vol,now,.08); if(humN.p) humN.p.pan.setTargetAtTime(Math.max(-1,Math.min(1,pan)),now,.06);
    humN.bp.frequency.setTargetAtTime(320+vol*900,now,.1); humN.o1.frequency.setTargetAtTime(50+vol*12,now,.2); humN.o2.frequency.setTargetAtTime(101+vol*24,now,.2);
    if(vol<=0){ const n=humN; humN=null; n.g.gain.setTargetAtTime(0,now,.06); setTimeout(()=>{ try{ n.src.stop(); n.o1.stop(); n.o2.stop(); n.lfo.stop(); }catch(e){} },500); } }
  function humChip(pan){ if(!ctx||!live) return; const out=voice(master,pan), at=ctx.currentTime+.02; for(let i=0;i<2+Math.floor(Math.random()*2);i++) tone(at+i*.09,R(5200,6000),R(4200,4800),.05,.06,out); }
  /* a single peck at the bark: a dry, hollow knock with a little woody thump under it */
  function peck(xf){ if(!ctx||!live) return; const at=ctx.currentTime+.01, out=voice(master,(xf||.2)*2-1), bp=ctx.createBiquadFilter(); bp.type="bandpass"; bp.frequency.value=R(1000,1500); bp.Q.value=4; bp.connect(out);
    const s=ctx.createBufferSource(); s.buffer=noiseBuf; const g=ctx.createGain(), v=R(.35,.5); g.gain.setValueAtTime(0,at); g.gain.linearRampToValueAtTime(v,at+.002); g.gain.exponentialRampToValueAtTime(.001,at+.05); s.connect(g); g.connect(bp); s.start(at,R(0,2.5),.07);
    tone(at,R(380,460),R(240,280),.05,.12,out,"triangle"); }
  /* eastern bluebirds: a soft, low, burbling tu-a-wee as the flock goes over */
  function bluebird(){ if(!ctx||!live) return; let at=ctx.currentTime+.3; const lp=ctx.createBiquadFilter(); lp.type="lowpass"; lp.frequency.value=5000; lp.connect(master);
    for(let k=0;k<3;k++){ const out=voice(lp,R(-.5,.5)), v=.06; tone(at,2100,2500,.16,v,out); tone(at+.18,2600,2200,.14,v*.9,out); tone(at+.34,2300,2900,.22,v*.8,out); at+=R(.9,1.6); } }
  /* a red-tailed hawk circling high: a hoarse, falling keee-arrr */
  let hawkT=null, coyT=null;
  function hawk(){
    if(ctx&&live){ const at=ctx.currentTime+.05, pan=R(-.8,.8), n=Math.random()<.4?2:1;
      for(let j=0;j<n;j++){ const t0=at+j*R(2.2,3.2), d=R(1.6,2.2);
        const o=ctx.createOscillator(), o2=ctx.createOscillator(), g=ctx.createGain(), bp=ctx.createBiquadFilter(), out=voice(master,pan);
        o.type="sawtooth"; o2.type="square"; const f0=R(3000,3400);
        o.frequency.setValueAtTime(f0*.9,t0); o.frequency.linearRampToValueAtTime(f0,t0+.18); o.frequency.exponentialRampToValueAtTime(f0*.52,t0+d);
        o2.frequency.setValueAtTime(f0*.9*1.01,t0); o2.frequency.linearRampToValueAtTime(f0*1.01,t0+.18); o2.frequency.exponentialRampToValueAtTime(f0*.53,t0+d);
        bp.type="bandpass"; bp.frequency.value=2600; bp.Q.value=1.1;
        const s2=ctx.createBufferSource(); s2.buffer=noiseBuf; const nb=ctx.createBiquadFilter(); nb.type="bandpass"; nb.frequency.value=3000; nb.Q.value=.8; const ng=ctx.createGain(); ng.gain.value=.5;   /* the rasp */
        s2.connect(nb); nb.connect(ng); ng.connect(g);
        const v=R(.02,.035); g.gain.setValueAtTime(0,t0); g.gain.linearRampToValueAtTime(v,t0+.12); g.gain.setValueAtTime(v,t0+d*.45); g.gain.exponentialRampToValueAtTime(.0001,t0+d);
        o.connect(bp); o2.connect(bp); bp.connect(g); g.connect(out);
        o.start(t0); o2.start(t0); s2.start(t0,R(0,2)); o.stop(t0+d+.05); o2.stop(t0+d+.05); s2.stop(t0+d+.05); } }
    hawkT=setTimeout(hawk,R(70,170)*1000);
  }
  /* coyotes far across the valley: the opening of a real recording (Yellowstone, National Park Service), softened by distance and faded out */
  let coyBuf=null, coyLoading=false;
  function loadCoyote(){ if(coyBuf||coyLoading||!ctx) return; coyLoading=true;
    fetch(SC.sounds+"coyote.mp3").then(r=>r.ok?r.arrayBuffer():Promise.reject()).then(ab=>new Promise((ok,no)=>ctx.decodeAudioData(ab,ok,no))).then(b=>{ coyBuf=b; }).catch(()=>{ coyLoading=false; }); }
  function coyotes(){
    if(ctx&&live){ loadCoyote();
      if(coyBuf){ const src=ctx.createBufferSource(); src.buffer=coyBuf; src.playbackRate.value=R(.94,1.02);
        const lp=ctx.createBiquadFilter(); lp.type="lowpass"; lp.frequency.value=R(2600,3800); const g=ctx.createGain(), out=voice(master,R(-.7,.7)), at=ctx.currentTime+.05, v=R(.45,.7), len=coyBuf.duration/src.playbackRate.value;
        g.gain.setValueAtTime(0,at); g.gain.linearRampToValueAtTime(v,at+.4); g.gain.setValueAtTime(v,at+len*.55); g.gain.linearRampToValueAtTime(0,at+len);
        src.connect(lp); lp.connect(g); g.connect(out); src.start(at); } }
    coyT=setTimeout(coyotes,R(120,260)*1000);
  }
  /* a great horned owl far off in the woods: hoo, h'hoo — hoo — hoo */
  let owlT=null;
  function hoot(at,dur,f,v,out){ const o=ctx.createOscillator(), g=ctx.createGain(), vib=ctx.createOscillator(), vg=ctx.createGain();
    o.type="sine"; o.frequency.setValueAtTime(f*1.03,at); o.frequency.exponentialRampToValueAtTime(f*.94,at+dur);
    vib.frequency.value=5.5; vg.gain.value=f*.012; vib.connect(vg); vg.connect(o.frequency);
    g.gain.setValueAtTime(0,at); g.gain.linearRampToValueAtTime(v,at+Math.min(.08,dur*.35)); g.gain.setValueAtTime(v,at+dur*.6); g.gain.exponentialRampToValueAtTime(.0001,at+dur+.08);
    o.connect(g); g.connect(out); o.start(at); vib.start(at); o.stop(at+dur+.12); vib.stop(at+dur+.12); }
  function owl(){
    if(ctx&&live){ const lp=ctx.createBiquadFilter(); lp.type="lowpass"; lp.frequency.value=700; lp.connect(master);
      const out=voice(lp,R(-.8,.8)), f=R(270,310), v=R(.07,.11); let at=ctx.currentTime+.05;
      const calls=Math.random()<.5? [[.42,.5],[.14,.12],[.32,.42],[.5,.5],[.5,0]] : [[.5,.55],[.45,.5],[.55,0]];
      for(const [d,gap] of calls){ hoot(at,d,f,v,out); at+=d+gap; }
      if(Math.random()<.35){ const f2=f*R(1.12,1.2); at+=R(1.2,2.5); for(const [d,gap] of [[.4,.45],[.4,.45],[.5,0]]){ hoot(at,d,f2,v*.6,out); at+=d+gap; } }   /* its mate answers */
      setTimeout(()=>{ try{ lp.disconnect(); }catch(e){} },12000); }
    owlT=setTimeout(owl,R(45,130)*1000);
  }
  /* a burst of wings: noise chopped by fast wingbeats, slowing as the bird gets away; a pheasant cackles too */
  /* a bald eagle: not a scream at all but a thin, high, piping chatter — kleek, kleek, kik-ik-ik-ik-ik */
  function eagle(pan,v){ if(!ctx||!live) return; v=v??1; const out=voice(master,pan); let at=ctx.currentTime+.05; const f=R(3300,3700);
    for(let i=0;i<2;i++){ tone(at,f*.9,f,.15,.045*v,out,"triangle"); tone(at,f*1.8,f*2,.12,.008*v,out); at+=R(.24,.3); }
    const n=5+Math.floor(Math.random()*3); for(let i=0;i<n;i++){ const fi=f*(1-i*.045); tone(at,fi*.9,fi,.06,.04*v*(1-i*.07),out,"triangle"); at+=R(.07,.085); } }
  /* the deep, soft whump of a big wing on the downstroke */
  function eagleBeat(pan,v){ if(!ctx||!live) return; const at=ctx.currentTime+.01, out=voice(master,pan), lp=ctx.createBiquadFilter(); lp.type="lowpass"; lp.frequency.value=420; lp.Q.value=.7; lp.connect(out);
    const s=ctx.createBufferSource(); s.buffer=noiseBuf; const g=ctx.createGain(), vv=.14*(v??1); g.gain.setValueAtTime(0,at); g.gain.linearRampToValueAtTime(vv,at+.08); g.gain.exponentialRampToValueAtTime(.001,at+.34); s.connect(g); g.connect(lp); s.start(at,R(0,2.5),.4); }
  function jay(pan){ if(!ctx||!live) return; const out=voice(master,pan); let at=ctx.currentTime+.03; const n=2+Math.floor(Math.random()*2);   /* the harsh, descending "jeer! jeer!" */
    for(let i=0;i<n;i++){ const o=ctx.createOscillator(); o.type="sawtooth"; o.frequency.setValueAtTime(R(2300,2650),at); o.frequency.exponentialRampToValueAtTime(R(1450,1700),at+.28);
      const lfo=ctx.createOscillator(); lfo.frequency.value=R(55,80); const lg=ctx.createGain(); lg.gain.value=R(120,220); lfo.connect(lg); lg.connect(o.frequency);
      const bp=ctx.createBiquadFilter(); bp.type="bandpass"; bp.frequency.value=2100; bp.Q.value=1.3; const g=ctx.createGain();
      g.gain.setValueAtTime(0,at); g.gain.linearRampToValueAtTime(.11,at+.03); g.gain.setValueAtTime(.1,at+.2); g.gain.exponentialRampToValueAtTime(.0001,at+.33);
      o.connect(bp); bp.connect(g); g.connect(out); o.start(at); lfo.start(at); o.stop(at+.36); lfo.stop(at+.36); at+=R(.38,.52); } }
  function crow(pan){ if(!ctx||!live) return; const out=voice(master,pan); let at=ctx.currentTime+.05;                                  /* the rooster pheasant's raspy "kok-kok" as it bursts up */
    for(let i=0;i<2;i++){ const o=ctx.createOscillator(); o.type="sawtooth"; o.frequency.setValueAtTime(R(1150,1300),at); o.frequency.exponentialRampToValueAtTime(R(820,900),at+.16);
      const bp=ctx.createBiquadFilter(); bp.type="bandpass"; bp.frequency.value=1250; bp.Q.value=1.6; const g=ctx.createGain(); g.gain.setValueAtTime(0,at); g.gain.linearRampToValueAtTime(.16,at+.02); g.gain.exponentialRampToValueAtTime(.0001,at+.2);
      o.connect(bp); bp.connect(g); g.connect(out); o.start(at); o.stop(at+.22); at+=R(.2,.26); } }
  function flush(kind,xFrac){
    if(!ctx||!live) return; const now=ctx.currentTime+.02, pan=(xFrac||.5)*2-1;
    const s=ctx.createBufferSource(); s.buffer=noiseBuf; const bp=ctx.createBiquadFilter(); bp.type="bandpass"; bp.frequency.value=kind==="pheas"?900:650; bp.Q.value=.9;
    const am=ctx.createGain(), env=voice(master,pan); am.gain.value=0;
    const lfo=ctx.createOscillator(); lfo.type="square"; lfo.frequency.setValueAtTime(kind==="pheas"?18:22,now); lfo.frequency.exponentialRampToValueAtTime(9,now+1.6);
    const lg=ctx.createGain(); lg.gain.value=.5; lfo.connect(lg); lg.connect(am.gain);
    const dc=ctx.createConstantSource?ctx.createConstantSource():null; if(dc){ dc.offset.value=.5; dc.connect(am.gain); dc.start(now); dc.stop(now+2.6); }
    env.gain.setValueAtTime(0,now); env.gain.linearRampToValueAtTime(kind==="pheas"?.55:.45,now+.03); env.gain.setTargetAtTime(.0001,now+.25,.55);
    s.connect(bp); bp.connect(am); am.connect(env); s.start(now,R(0,2)); s.stop(now+2.6); lfo.start(now); lfo.stop(now+2.6);
    if(kind==="pheas"){ const o=voice(master,pan); let at=now+.15; for(let i=0;i<2;i++){ tone(at,820,610,.13,.06,o,"sawtooth"); tone(at+.15,760,560,.12,.05,o,"sawtooth"); at+=.42; } }
  }
  /* a tom turkey's gobble: a fast, gurgling, falling rattle, gobble-obble-obble */
  function gobble(pan,v){ if(!ctx||!live) return; v=v??1; const at=ctx.currentTime+.03, out=voice(master,pan), d=R(.85,1.1);
    const o=ctx.createOscillator(); o.type="sawtooth"; o.frequency.setValueAtTime(R(980,1120),at); o.frequency.linearRampToValueAtTime(R(760,860),at+d*.35); o.frequency.exponentialRampToValueAtTime(R(430,520),at+d);
    const lfo=ctx.createOscillator(); lfo.frequency.setValueAtTime(R(24,28),at); lfo.frequency.linearRampToValueAtTime(R(15,18),at+d); const lg=ctx.createGain(); lg.gain.value=.5; lfo.connect(lg);
    const am=ctx.createGain(); am.gain.value=.5; lg.connect(am.gain);
    const fm=ctx.createGain(); fm.gain.value=R(70,110); lfo.connect(fm); fm.connect(o.frequency);
    const bp=ctx.createBiquadFilter(); bp.type="bandpass"; bp.frequency.value=1150; bp.Q.value=1.3; const bp2=ctx.createBiquadFilter(); bp2.type="bandpass"; bp2.frequency.value=2300; bp2.Q.value=2; const g2=ctx.createGain(); g2.gain.value=.35;
    const g=ctx.createGain(); g.gain.setValueAtTime(0,at); g.gain.linearRampToValueAtTime(.09*v,at+.05); g.gain.setValueAtTime(.085*v,at+d*.6); g.gain.exponentialRampToValueAtTime(.0001,at+d);
    o.connect(am); am.connect(bp); am.connect(bp2); bp.connect(g); bp2.connect(g2); g2.connect(g); g.connect(out); o.start(at); lfo.start(at); o.stop(at+d+.05); lfo.stop(at+d+.05); }
  /* someone calling the dogs: a bright two-note finger whistle, wheet, whee-oo, with a little breath in it */
  /* a person whistling the dogs in, lips pursed. What makes it human rather than a bird: it's slow, the pitch scoops up into each note and wavers
     a little as the breath does, there's a rush of air before and around the tone, and the long note climbs smoothly and keeps going up to the very end */
  function whistle(pan){ if(!ctx||!live) return; const at=ctx.currentTime+.08, out=voice(master,pan||0), SR=200;
    const lp=ctx.createBiquadFilter(); lp.type="lowpass"; lp.frequency.value=6000; lp.connect(out);
    const curve=(dur,fn)=>{ const n=Math.max(2,Math.round(dur*SR)), a=new Float32Array(n); for(let i=0;i<n;i++) a[i]=fn(i/(n-1)*dur); return a; };
    const sm=x=>x<=0?0:x>=1?1:x*x*(3-2*x);
    const note=(t0,dur,pitch,vol)=>{ const ph1=R(0,6), ph2=R(0,6), drift=R(-.01,.01);
      const f=curve(dur,t=>pitch(t)*(1+.006*Math.sin(t*2*Math.PI*6.3+ph1)+.004*Math.sin(t*2*Math.PI*10.7+ph2)+drift*t));
      const g=curve(dur,t=>vol*sm(t/.06)*(1-sm((t-(dur-.07))/.07))*(.9+.1*Math.sin(t*2*Math.PI*3+ph1)));
      for(const [mul,v] of [[1,1],[2,.06]]){ const o=ctx.createOscillator(), gg=ctx.createGain(); o.type="sine";
        o.frequency.setValueCurveAtTime(mul===1? f : f.map(x=>x*2),t0,dur); gg.gain.setValueAtTime(0,t0); gg.gain.setValueCurveAtTime(v===1? g : g.map(x=>x*v),t0,dur);
        o.connect(gg); gg.connect(lp); o.start(t0); o.stop(t0+dur+.02); }
      const n=ctx.createBufferSource(); n.buffer=noiseBuf; const bp=ctx.createBiquadFilter(); bp.type="bandpass"; bp.Q.value=5; bp.frequency.setValueCurveAtTime(f,t0,dur);
      const ng=ctx.createGain(); ng.gain.setValueAtTime(0,t0-.04); ng.gain.linearRampToValueAtTime(vol*.7,t0+.01); ng.gain.setValueCurveAtTime(curve(dur,t=>vol*(.3+.4*(1-sm(t/.12)))*(1-sm((t-(dur-.06))/.06))),t0+.012,dur-.012);   /* air first, then air around the tone */
      const hiss=ctx.createBiquadFilter(); hiss.type="highpass"; hiss.frequency.value=2500; const hg=ctx.createGain(); hg.gain.setValueAtTime(0,t0-.05); hg.gain.linearRampToValueAtTime(vol*.12,t0); hg.gain.exponentialRampToValueAtTime(.0001,t0+.09);
      n.connect(bp); bp.connect(ng); ng.connect(lp); n.connect(hiss); hiss.connect(hg); hg.connect(lp); n.start(t0-.05,R(0,2),dur+.1); };
    const k=R(.93,1.07), f1=1350*k, f2=1250*k;
    note(at,.34,t=>f1*(.84+.16*sm(t/.07))*(1+.03*sm((t-.1)/.2))*(1-.04*sm((t-.28)/.06)),.055);                         /* whee: scoops up, settles, drops off */
    note(at+.48,.95,t=>f2*(.84+.16*sm(t/.08))*(1+.04*sm((t-.1)/.3))*(1+1.8*Math.pow(sm((t-.42)/.5),1.3)),.065); }   /* wheeeeEEEET: holds, then climbs well over an octave right to the end */
  /* peregrine: a harsh, rapid, scolding "kak-kak-kak-kak" */
  function falcon(pan){ if(!ctx||!live) return; const out=voice(master,pan||0); let at=ctx.currentTime+.03; const n=6+Math.floor(Math.random()*5), f0=R(1900,2200);
    for(let i=0;i<n;i++){ const o=ctx.createOscillator(); o.type="sawtooth"; o.frequency.setValueAtTime(f0*1.05,at); o.frequency.exponentialRampToValueAtTime(f0*.82,at+.09);
      const bp=ctx.createBiquadFilter(); bp.type="bandpass"; bp.frequency.value=2300; bp.Q.value=2.2; const g=ctx.createGain(); g.gain.setValueAtTime(0,at); g.gain.linearRampToValueAtTime(.06,at+.012); g.gain.exponentialRampToValueAtTime(.0008,at+.11);
      o.connect(bp); bp.connect(g); g.connect(out); o.start(at); o.stop(at+.13); at+=R(.14,.17); } }
  /* the rush of air as it stoops */
  function stoop(pan){ if(!ctx||!live) return; const at=ctx.currentTime+.02, out=voice(master,pan||0), s=ctx.createBufferSource(); s.buffer=noiseBuf; const bp=ctx.createBiquadFilter(); bp.type="bandpass"; bp.Q.value=1.4; bp.frequency.setValueAtTime(500,at); bp.frequency.exponentialRampToValueAtTime(2600,at+1.6);
    const g=ctx.createGain(); g.gain.setValueAtTime(0,at); g.gain.linearRampToValueAtTime(.05,at+1.2); g.gain.exponentialRampToValueAtTime(.0005,at+2.1); s.connect(bp); bp.connect(g); g.connect(out); s.start(at,R(0,2),2.2); }
  /* great blue heron: a deep, hoarse, prehistoric croak, "fraaahnk" */
  function heron(pan){ if(!ctx||!live) return; const out=voice(master,pan||0), at=ctx.currentTime+.03, d=R(.5,.75), o=ctx.createOscillator(); o.type="sawtooth"; const f0=R(210,260);
    o.frequency.setValueAtTime(f0*1.15,at); o.frequency.linearRampToValueAtTime(f0,at+d*.3); o.frequency.exponentialRampToValueAtTime(f0*.78,at+d);
    const lfo=ctx.createOscillator(); lfo.frequency.value=R(38,52); const lg=ctx.createGain(); lg.gain.value=f0*.25; lfo.connect(lg); lg.connect(o.frequency);   /* the rasp */
    const am=ctx.createGain(); am.gain.value=.6; const al=ctx.createOscillator(); al.frequency.value=R(22,30); const ag=ctx.createGain(); ag.gain.value=.4; al.connect(ag); ag.connect(am.gain);
    const bp=ctx.createBiquadFilter(); bp.type="bandpass"; bp.frequency.value=650; bp.Q.value=1.1; const bp2=ctx.createBiquadFilter(); bp2.type="bandpass"; bp2.frequency.value=1500; bp2.Q.value=2.4; const g2=ctx.createGain(); g2.gain.value=.35;
    const g=ctx.createGain(); g.gain.setValueAtTime(0,at); g.gain.linearRampToValueAtTime(.12,at+.06); g.gain.setValueAtTime(.1,at+d*.65); g.gain.exponentialRampToValueAtTime(.0001,at+d);
    o.connect(am); am.connect(bp); am.connect(bp2); bp2.connect(g2); g2.connect(g); bp.connect(g); g.connect(out); o.start(at); lfo.start(at); al.start(at); o.stop(at+d+.05); lfo.stop(at+d+.05); al.stop(at+d+.05); }
  function raven(pan,kind){ if(!ctx||!live) return; const out=voice(master,pan||0); let at=ctx.currentTime+.03;
    if(kind==="knock"){ const n=3+Math.floor(Math.random()*3); for(let i=0;i<n;i++){ tone(at,R(900,1000),R(700,780),.05,.05,out,"triangle"); const s=ctx.createBufferSource(); s.buffer=noiseBuf; const bp=ctx.createBiquadFilter(); bp.type="bandpass"; bp.frequency.value=1100; bp.Q.value=6; const g=ctx.createGain(); g.gain.setValueAtTime(.06,at); g.gain.exponentialRampToValueAtTime(.001,at+.05); s.connect(bp); bp.connect(g); g.connect(out); s.start(at,R(0,2),.06); at+=R(.09,.12); } return; }
    const n=1+Math.floor(Math.random()*2); for(let j=0;j<n;j++){ const d=R(.28,.4), o=ctx.createOscillator(); o.type="sawtooth"; const f0=R(330,400); o.frequency.setValueAtTime(f0*.85,at); o.frequency.linearRampToValueAtTime(f0,at+d*.3); o.frequency.exponentialRampToValueAtTime(f0*.7,at+d);
      const lfo=ctx.createOscillator(); lfo.frequency.value=R(28,38); const lg=ctx.createGain(); lg.gain.value=R(40,70); lfo.connect(lg); lg.connect(o.frequency);     /* the rattle in its throat */
      const bp=ctx.createBiquadFilter(); bp.type="bandpass"; bp.frequency.value=R(700,900); bp.Q.value=1.4; const bp2=ctx.createBiquadFilter(); bp2.type="bandpass"; bp2.frequency.value=1700; bp2.Q.value=3; const g2=ctx.createGain(); g2.gain.value=.4;
      const g=ctx.createGain(); g.gain.setValueAtTime(0,at); g.gain.linearRampToValueAtTime(.09,at+.04); g.gain.setValueAtTime(.08,at+d*.6); g.gain.exponentialRampToValueAtTime(.0001,at+d);
      o.connect(bp); o.connect(bp2); bp2.connect(g2); g2.connect(g); bp.connect(g); g.connect(out); o.start(at); lfo.start(at); o.stop(at+d+.05); lfo.stop(at+d+.05); at+=d+R(.15,.3); } }
  /* a flock of Canada geese going over. Each goose's call is the real two-part "ah-HONK": a short low grunt that breaks up into a loud, nasal,
     brassy honk a good fifth higher, sliding down at the end. The nasal colour comes from a buzzy source pushed through a few resonances,
     with a little rasp in it. Each goose honks from its own place in the stereo field. */
  function gooseCall(at,pan,vol,near){ const out=voice(master,pan), f1=R(330,380), f2=f1*R(1.3,1.42), d1=R(.05,.08), d2=R(.17,.26), end=at+d1+d2+.05;
    const o=ctx.createOscillator(); o.type="sawtooth";
    o.frequency.setValueAtTime(f1*.92,at); o.frequency.linearRampToValueAtTime(f1,at+d1*.7); o.frequency.linearRampToValueAtTime(f2*1.03,at+d1+.025); o.frequency.linearRampToValueAtTime(f2,at+d1+d2*.45); o.frequency.exponentialRampToValueAtTime(f2*.86,at+d1+d2);   /* ah — HONK, the pitch snapping up then sagging */
    const sub=ctx.createOscillator(); sub.type="sine"; sub.frequency.setValueAtTime(f1/2,at); sub.frequency.linearRampToValueAtTime(f2/2,at+d1+.025); sub.frequency.exponentialRampToValueAtTime(f2*.43,at+d1+d2);
    const am=ctx.createGain(); am.gain.value=.65; const sg=ctx.createGain(); sg.gain.value=.35; sub.connect(sg); sg.connect(am.gain);   /* period-doubling: the rough, doubled buzz of a goose's syrinx */
    const ws=ctx.createWaveShaper(); { const n=1024, c=new Float32Array(n); for(let i=0;i<n;i++){ const x=i/(n-1)*2-1; c[i]=Math.tanh(x*3.2); } ws.curve=c; }   /* hard, brassy edge */
    const pre=ctx.createGain(); pre.gain.value=1.4; o.connect(am); am.connect(pre); pre.connect(ws);
    const sum=ctx.createGain();
    for(const [fq,q,gn] of [[620,4,.7],[1150,5,1],[2350,6,.75],[3500,7,.35]]){ const bp=ctx.createBiquadFilter(); bp.type="bandpass"; bp.frequency.value=fq*R(.95,1.05); bp.Q.value=q; const gg=ctx.createGain(); gg.gain.value=gn; ws.connect(bp); bp.connect(gg); gg.connect(sum); }   /* the nasal resonances */
    const n=ctx.createBufferSource(); n.buffer=noiseBuf; const nb=ctx.createBiquadFilter(); nb.type="bandpass"; nb.frequency.value=2200; nb.Q.value=.9; const ng=ctx.createGain(); ng.gain.value=.07; n.connect(nb); nb.connect(ng); ng.connect(sum);   /* breath and rasp */
    const env=ctx.createGain(); env.gain.setValueAtTime(0,at); env.gain.linearRampToValueAtTime(vol*.4,at+.012); env.gain.setValueAtTime(vol*.35,at+d1-.008); env.gain.linearRampToValueAtTime(vol,at+d1+.015); env.gain.setValueAtTime(vol*.92,at+d1+d2*.55); env.gain.exponentialRampToValueAtTime(.0001,at+d1+d2+.03);
    const lp=ctx.createBiquadFilter(); lp.type="lowpass"; lp.frequency.value=1700+Math.min(1,near)*4800;   /* far off: softer and duller */
    sum.connect(env); env.connect(lp); lp.connect(out);
    if(near<.6){ const dl=ctx.createDelay(.5); dl.delayTime.value=R(.12,.2); const dg=ctx.createGain(); dg.gain.value=.22; lp.connect(dl); dl.connect(dg); dg.connect(out); }   /* the call coming back off the hills */
    o.start(at); sub.start(at); n.start(at,R(0,2),end-at); o.stop(end); sub.stop(end); }
  /* the side-by-side: a small engine's lumpy putter (the firing pulses chopping a low buzz), a whine from the drive belt that rises with speed, and grass and gravel under the tyres */
  let utvN=null;
  function utv(vol,pan,load){ if(!ctx||!live){ return; }
    if(vol>0&&!utvN){ const g=ctx.createGain(); g.gain.value=0; const p=ctx.createStereoPanner? ctx.createStereoPanner() : null; if(p){ g.connect(p); p.connect(master); } else g.connect(master);
      const o=ctx.createOscillator(); o.type="sawtooth"; o.frequency.value=42; const o2=ctx.createOscillator(); o2.type="square"; o2.frequency.value=84; const og2=ctx.createGain(); og2.gain.value=.3;
      const lp=ctx.createBiquadFilter(); lp.type="lowpass"; lp.frequency.value=520; lp.Q.value=2;
      const am=ctx.createGain(); am.gain.value=.55; const fire=ctx.createOscillator(); fire.type="square"; fire.frequency.value=21; const fg=ctx.createGain(); fg.gain.value=.45; fire.connect(fg); fg.connect(am.gain);   /* the firing pulses */
      o.connect(lp); o2.connect(og2); og2.connect(lp); lp.connect(am); am.connect(g);
      const n=ctx.createBufferSource(); n.buffer=noiseBuf; n.loop=true; const nb=ctx.createBiquadFilter(); nb.type="bandpass"; nb.frequency.value=180; nb.Q.value=.8; const ng=ctx.createGain(); ng.gain.value=.9; n.connect(nb); nb.connect(ng); ng.connect(am);   /* the exhaust's rumble */
      const wh=ctx.createOscillator(); wh.type="triangle"; wh.frequency.value=600; const whg=ctx.createGain(); whg.gain.value=.03; wh.connect(whg); whg.connect(g);   /* the belt whine */
      const cr=ctx.createBufferSource(); cr.buffer=noiseBuf; cr.loop=true; const cb=ctx.createBiquadFilter(); cb.type="highpass"; cb.frequency.value=2500; const cg=ctx.createGain(); cg.gain.value=.12; cr.connect(cb); cb.connect(cg); cg.connect(g);   /* tyres on the grass */
      o.start(); o2.start(); fire.start(); n.start(0,R(0,2)); wh.start(); cr.start(0,R(0,2)); utvN={g,p,o,o2,fire,n,wh,cr,lp,cg}; }
    if(!utvN) return; const N=utvN, now=ctx.currentTime, rpm=.4+.6*Math.max(0,Math.min(1,load));
    N.g.gain.setTargetAtTime(Math.max(0,vol)*.5,now,.25); if(N.p) N.p.pan.setTargetAtTime(Math.max(-1,Math.min(1,pan)),now,.15);
    N.o.frequency.setTargetAtTime(32+34*rpm,now,.4); N.o2.frequency.setTargetAtTime((32+34*rpm)*2,now,.4); N.fire.frequency.setTargetAtTime(16+17*rpm,now,.4); N.lp.frequency.setTargetAtTime(380+520*rpm+400*vol,now,.3);
    N.wh.frequency.setTargetAtTime(420+900*rpm,now,.5); N.cg.gain.setTargetAtTime(.04+.12*rpm,now,.3);
    if(vol<=0){ utvN=null; N.g.gain.setTargetAtTime(0,now,.3); setTimeout(()=>{ try{ N.o.stop(); N.o2.stop(); N.fire.stop(); N.n.stop(); N.wh.stop(); N.cr.stop(); }catch(e){} },1500); } }
  /* bobwhite: a clear, rising whistle of its own name, "bob-WHITE!" */
  function bobwhite(pan,v){ if(!ctx||!live) return; const out=voice(master,pan||0), at=ctx.currentTime+.03, vv=.05*(v??1);
    tone(at,1500,1550,.13,vv*.7,out); tone(at+.3,1650,3300,.28,vv,out); tone(at+.3,3300,6600,.24,vv*.08,out); }
  function honk(xFrac,near,spread){
    if(!ctx||!live) return; const now=ctx.currentTime+.02, base=Math.max(-1,Math.min(1,(xFrac*2-1)*1.4)), sp=Math.max(.35,spread||.5);
    const v=.03+.15*near; let at=now; const n=2+Math.floor(Math.random()*4);
    for(let i=0;i<n;i++){ const pan=Math.max(-1,Math.min(1,base+R(-sp,sp))); gooseCall(at,pan,v*R(.6,1),near); if(Math.random()<.35) gooseCall(at+R(.28,.36),pan,v*R(.5,.8),near); at+=R(.18,.45); }   /* overlapping voices, some geese honking twice */
  }
  function apply(){
    const want=wanted();
    if(want && ctx){ if(ctx.state==="suspended") ctx.resume().catch(()=>{}); if(!faded){ faded=true; master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setValueAtTime(0,ctx.currentTime); master.gain.linearRampToValueAtTime(.9,ctx.currentTime+1.2); } else master.gain.setTargetAtTime(.9,ctx.currentTime,.8);
      if(!live){ live=true; clearTimeout(birdT); clearTimeout(gustT); clearTimeout(owlT); clearTimeout(hawkT); clearTimeout(coyT); birdT=setTimeout(birds,800); startChorus(); owlT=setTimeout(owl,R(12,40)*1000); hawkT=setTimeout(hawk,R(25,60)*1000); coyT=setTimeout(coyotes,R(45,100)*1000); loadCoyote(); gust(); } }
    else if(ctx){ if(want) return; master.gain.setTargetAtTime(0,ctx.currentTime,.3); live=false; clearTimeout(birdT); clearTimeout(gustT); clearTimeout(owlT); clearTimeout(hawkT); clearTimeout(coyT); clearTimeout(chorT); clearTimeout(katT); clearTimeout(peepT); clearTimeout(wpwT); clearTimeout(bowlT); }
  }
  /* browsers only allow sound after a tap or key press */
  /* a press on the page's own sound button is left to that button, so it can't start the sound and then have the same press turn it off */
  const GEST=["pointerdown","pointerup","click","keydown","touchstart","touchend"];   /* phones (iPhones especially) only unlock sound on the end of a tap */
  const skip=e=>!!(e&&e.target&&e.target.closest&&e.target.closest("[data-sound-toggle]"));
  function arm(){ if(armed) return; armed=true; const go=e=>{ if(skip(e)) return; GEST.forEach(ev=>document.removeEventListener(ev,go,true)); if(wanted()&&init()) apply(); else armed=false; };
    GEST.forEach(ev=>document.addEventListener(ev,go,true)); }
  document.addEventListener("visibilitychange",()=>{ if(ctx) apply(); });
  GEST.forEach(ev=>document.addEventListener(ev,e=>{ if(skip(e)) return; if(ctx&&wanted()&&ctx.state!=="running") ctx.resume().then(apply).catch(()=>{}); },true));
  setTimeout(()=>{ arm(); if(wanted()&&init()){ if(ctx.state==='running') apply(); else ctx.resume().then(()=>{ if(ctx.state==='running') apply(); }).catch(()=>{}); } },0);
  return { get on(){ return on; }, get blocked(){ return !!(on&&(!ctx||ctx.state!=="running")); }, get playing(){ return !!(on&&live&&ctx&&ctx.state==="running"); }, set(v){ on=!!v; if(on){ if(init()) apply(); else arm(); } else apply(); }, refresh(){ if(ctx) apply(); else if(wanted()) arm(); }, flush, honk, hawk(){ if(ctx&&live){ clearTimeout(hawkT); hawk(); } }, yip(){ if(ctx&&live){ clearTimeout(coyT); coyotes(); } }, drum, peck, paw, scratch, gobble, whistle, raven, falcon, stoop, heron, utv, bobwhite, humSet, humChip, bluebird, jay, crow, eagle, eagleBeat, setDusk(d){ dusk=d; } };
})();
const ambient=(function(){
  const cv=document.createElement("canvas"); cv.id="ambient"; cv.setAttribute("aria-hidden","true"); document.body.prepend(cv);
  const ctx=cv.getContext("2d"); let camX=0, camY=0, camZ=1; let W=0,H=0, leaves=[], motes=[], last=0, raf=0, t=0;
  const reduce=window.matchMedia("(prefers-reduced-motion: reduce)"), darkQ=window.matchMedia("(prefers-color-scheme: dark)");
  let on=true; try{ on=localStorage.getItem(SC.key+"-ambient")!=="off"; }catch(e){}
  const LEAF=["#b5532a","#c9772b","#d89a3a","#a33b25","#8c5a2b","#c4882f","#9e6b2e"];
  const MAPLE=["#c0392b","#d2542a","#e07b28","#b8321f","#d9a32e","#a8281e"];
  const OAK=["#8a5a2b","#9c6a32","#7a4e24","#a9783a","#6f4a22"];
  const rnd=(a,b)=>a+Math.random()*(b-a), pick=a=>a[Math.floor(Math.random()*a.length)];
  function size(){ const dpr=1; W=innerWidth; H=innerHeight; cv.width=Math.round(W*dpr); cv.height=Math.round(H*dpr); ctx.setTransform(dpr,0,0,dpr,0,0); }
  const bokeh=(()=>{ const c=document.createElement("canvas"); c.width=c.height=64; const x=c.getContext("2d"); const g=x.createRadialGradient(32,32,0,32,32,32); g.addColorStop(0,"rgba(255,240,205,1)"); g.addColorStop(.6,"rgba(255,232,190,.55)"); g.addColorStop(1,"rgba(255,230,180,0)"); x.fillStyle=g; x.fillRect(0,0,64,64); return c; })();
  /* unit-size leaf outlines (pointing up, about 2 units tall) */
  const SH=(()=>{
    const birch=new Path2D(); birch.moveTo(0,-1); birch.bezierCurveTo(.78,-.45,.62,.6,0,1); birch.bezierCurveTo(-.62,.6,-.78,-.45,0,-1); birch.closePath();
    const maple=new Path2D(); const N=160;
    for(let i=0;i<=N;i++){ const th=i/N*Math.PI*2, a=th-Math.PI/2;
      const tip=Math.pow(1-Math.abs(Math.sin(2.5*th)),.75), serr=.06*Math.pow(1-Math.abs(Math.sin(12.5*th)),2);
      let r=(.48+.52*tip+serr)*(.78+.22*Math.cos(th)); if(Math.abs(Math.sin(th/2))>.97) r*=.35;   /* pointed lobes, smaller toward the stem */
      const x=r*Math.cos(a), y=r*Math.sin(a)*1.02; i? maple.lineTo(x,y) : maple.moveTo(x,y); }
    maple.closePath();
    /* a red oak leaf: deep rounded sinuses cutting nearly to the midrib, and pointed lobes that end in two or three bristle-tipped teeth */
    const oak=new Path2D();
    const half=(sd,dy)=>{ const P=[];
      P.push([.05,-.97],[.15,-.84],[.09,-.8],[.2,-.7]);                                                 /* the terminal lobe's teeth */
      const lobes=[[-.42+dy,.56],[.04+dy,.62],[.46+dy,.42]];
      let yPrev=-.68;
      for(const [y0,Lw] of lobes){ const ys=(yPrev+y0)/2+.02;
        P.push([.15,ys-.05],[.11,ys],[.15,ys+.05]);                                                       /* the rounded sinus, cut deep toward the midrib */
        P.push([Lw*.55,y0-.2],[Lw*.72,y0-.27],[Lw*.68,y0-.19],[Lw*1.0,y0-.17],[Lw*.86,y0-.08],[Lw*.94,y0+.02],[Lw*.7,y0+.04],[Lw*.4,y0+.1]);   /* the lobe and its bristle-tipped teeth, swept forward */
        yPrev=y0; }
      P.push([.14,.66],[.2,.74],[.12,.86],[.03,.93],[.02,1]);                                            /* the wedge-shaped base and the stem */
      return P.map(([w,y])=>[w*sd,y]); };
    const R=half(1,0), Lf=half(-1,.05).reverse();
    oak.moveTo(0,-1); for(const [x,y] of R) oak.lineTo(x,y); for(const [x,y] of Lf) oak.lineTo(x,y); oak.closePath();
    return {birch,maple,oak};
  })();
  function newLeaf(top){
    const r=Math.random(), kind= r<.36?"maple" : r<.66?"oak" : r<.74?"milkweed" : "birch";
    const z=rnd(.45,1.15);                                   /* depth: small and slow far away, larger and quicker up close */
    const base={kind, z, x:rnd(-.1*W,W*1.02), y:top? rnd(-80,-20) : rnd(-40,H), ph:rnd(0,6.28), rot:rnd(0,6.28), flip:rnd(0,6.28)};
    if(kind==="milkweed") return Object.assign(base,{s:rnd(11,18)*z, vy:rnd(5,11)*z, sw:rnd(18,40)*z, fr:rnd(.25,.5), vr:rnd(-.25,.25), vf:0, wind:rnd(8,20)*z, a:rnd(.55,.85)});
    return Object.assign(base,{s:(kind==="maple"?rnd(10,18):kind==="oak"?rnd(10,16):rnd(8,14))*z, vy:rnd(16,32)*z, sw:rnd(14,38)*z, fr:rnd(.4,.9), vr:rnd(-.8,.8), vf:rnd(1,2.4), wind:rnd(5,16)*z,
      c: kind==="maple"?pick(MAPLE) : kind==="oak"?pick(OAK) : pick(LEAF), a:rnd(.5,.8)*(.55+.45*z)});
  }
  /* leaves live in a real 3D space in front of the hills: some ride the wind away into the distance, some toward you and past you */
  const FOC=()=>H*.9;
  function vanish(){ try{ if(photo) return scr(.5,.45); }catch(e){} return [W*.5,H*.44]; }
  function place3D(l,fresh){
    const f=FOC(), vp=vanish(), mw=l.kind==="milkweed";
    l.dir=Math.random()<.72?1:-1;
    l.D= fresh? 1+Math.pow(Math.random(),1.5)*9 : (l.dir<0? rnd(4,9) : rnd(.5,1.6));
    l.X=rnd(-1.1,1.1)*(W/2/f)*l.D;
    l.Y= fresh? ((rnd(-.05,.75)*H-vp[1])/f)*l.D : ((rnd(-90,-30)-vp[1])/f)*l.D;
    l.vY= mw? rnd(.018,.035) : rnd(.06,.12);
    l.vD= l.dir*(mw? rnd(.2,.45) : l.dir>0? rnd(.55,1.4) : rnd(.35,1.05));
    l.vX= rnd(-.08,.22); l.sw3=rnd(.03,.1);
    l.base= mw? rnd(.03,.046) : (l.kind==="maple"? rnd(.034,.05) : rnd(.028,.042));
    return l;
  }
  function step3D(l,dt){
    const f=FOC(), vp=vanish(), hg=(H-vp[1])/f;
    l.ph+=dt*l.fr*1.6;
    l.D+=l.vD*dt; l.X+=(l.vX+Math.cos(l.ph)*l.sw3)*dt;
    l.Y+=(l.kind==="milkweed"? l.vY*(.5+.9*Math.sin(l.ph*.7)**2)-.012*Math.sin(l.ph*1.3) : l.vY*(.75+.5*Math.sin(l.ph)**2))*dt;
    l.rot+= l.kind==="milkweed"? Math.sin(l.ph)*.35*dt : l.vr*dt; l.flip+=l.vf*dt;
    const sx=vp[0]+l.X*f/l.D, sy=vp[1]+l.Y*f/l.D;
    if(l.D<.35||l.D>14||l.Y>hg||sx<-140||sx>W+140||sy>H+80){ Object.assign(l,newLeaf(true)); place3D(l,false); return step3D(l,0); }
    l.x=sx; l.y=sy; l.s=l.base*f/l.D;
    l.mi3=Math.max(0,Math.min(.5,(l.D-2)/10));                    /* the air washes far leaves out */
    l.in3=(l.D>9? Math.max(0,1-(l.D-9)/5) : 1)*(l.D<.7? .78 : 1)*Math.min(1,(sy+90)/60);
    l.near3=Math.max(0,Math.min(1,1.6-l.D*.12));
  }
  /* ---- ground plane under the photo: things farther away sit higher (closer to the horizon) and smaller, and move slower on screen ---- */
  const GF=4000;                                                       /* depth scale: the field edge comes out ~20 m away */
  const gnd=()=>{ const v=vanish(); return {vx:v[0],vy:v[1]}; };
  function toScreen(Xw,Dw){ const G=gnd(), g=GF/Dw; return {x:G.vx+Xw*g, y:G.vy+g, g}; }
  function toGround(sx,sy){ const G=gnd(), g=Math.max(1,sy-G.vy); return {Xw:(sx-G.vx)/g, Dw:GF/g}; }
  /* dust in three depths: a far haze of fine specks, a middle layer, and a few soft out-of-focus motes up close */
  function newMote(layer){
    const L=layer??(Math.random()<.55?0:Math.random()<.75?1:2);
    const z=[.35,.75,1.6][L];
    return {L, z, x:rnd(0,W), y:rnd(0,H), r:[rnd(.35,.8),rnd(.8,1.7),rnd(5,13)][L], vx:rnd(-4,4)*z, vy:rnd(-3,2)*z, ph:rnd(0,6.28), tw:rnd(.4,1.3)};
  }
  function seed(){
    const k=Math.max(.45,Math.min(1.5,W*H/(1440*900)));
    leaves=Array.from({length:Math.round(12*k)},()=>place3D(newLeaf(false),true));
    motes=[...Array.from({length:Math.round(70*k)},()=>newMote(0)),...Array.from({length:Math.round(34*k)},()=>newMote(1)),...Array.from({length:Math.round(7*k)},()=>newMote(2))];
  }
  function sun(){
    try{ const hot=SC.sun(); if(hot && SC.shown() && hot.strength>=.08){ const s=Math.max(W/hot.iw,H/hot.ih), dw=hot.iw*s, dh=hot.ih*s; return {x:(W-dw)/2+hot.x*dw, y:(H-dh)/2+hot.y*dh}; } }catch(e){}
    return {x:W*.2,y:-H*.05};
  }
  function leaf(l,dim){
    const pk=1, inten=l.in3??1, mist=l.mi3??0, d=l.near3??1;
    ctx.save(); ctx.translate(l.x,l.y); ctx.rotate(l.rot);
    if(l.kind==="milkweed"){
      /* seed with a fan of silky filaments */
      const s=l.s*pk; ctx.globalAlpha=l.a*dim*inten;
      ctx.strokeStyle="rgba(255,252,244,.9)"; ctx.lineWidth=.55*Math.max(1,s/20);
      for(let i=0;i<22;i++){ const a=-Math.PI/2+(i/21-.5)*2.3, len=s*(1.15+.25*Math.sin(i*1.7)); const bx=Math.cos(a)*len, by=Math.sin(a)*len;
        ctx.beginPath(); ctx.moveTo(0,-s*.1); ctx.quadraticCurveTo(bx*.5,by*.5-s*.15,bx,by); ctx.stroke(); }
      ctx.globalAlpha=l.a*dim*inten*.1; ctx.fillStyle="#fffaf0"; ctx.beginPath(); ctx.arc(0,-s*.7,s*.85,0,6.283); ctx.fill();
      ctx.globalAlpha=l.a*dim*inten; ctx.fillStyle="#7a5530"; ctx.beginPath(); ctx.ellipse(0,s*.12,s*.13,s*.24,0,0,6.283); ctx.fill();
      ctx.restore(); return;
    }
    const sx=Math.cos(l.flip), back=sx<0;
    const ls=l.s*pk;
    ctx.scale(Math.max(.12,Math.abs(sx))*ls,ls);
    ctx.globalAlpha=Math.min(1,l.a*(.55+.6*d))*dim*inten*(back?.82:1);
    const p=SH[l.kind]||SH.birch;
    ctx.fillStyle=l.c; ctx.fill(p);
    if(back){ ctx.fillStyle="rgba(40,20,0,.2)"; ctx.fill(p); }
    if(mist>.03){ ctx.fillStyle=`rgba(236,214,172,${mist.toFixed(2)})`; ctx.fill(p); }   /* far off, the air washes the color out */
    ctx.strokeStyle=`rgba(60,30,10,${(.35*(.4+.6*d)).toFixed(2)})`; ctx.lineWidth=.7/ls;
    ctx.save(); ctx.clip(p);                                                                   /* veins stay inside the leaf */
    ctx.beginPath(); ctx.moveTo(0,-.8); ctx.lineTo(0,1.35);
    if(l.kind==="maple"){ ctx.moveTo(0,.2); ctx.lineTo(-.62,-.45); ctx.moveTo(0,.2); ctx.lineTo(.62,-.45); ctx.moveTo(0,.25); ctx.lineTo(-.7,.35); ctx.moveTo(0,.25); ctx.lineTo(.7,.35); }
    ctx.stroke(); ctx.restore();
    { const b0=l.kind==="maple"? .3 : .92; ctx.beginPath(); ctx.moveTo(0,b0); ctx.lineTo(0,b0+.28); ctx.stroke(); }   /* just a short stem */
    ctx.restore();
  }
  /* ---- now and then one big leaf of each kind in turn: tumbling right up past the lens, or blown out from behind you into the scene ---- */
  let bigL=null, nextBig=rnd(8,16), bigKind=Math.floor(Math.random()*4);
  const BIGK=["maple","oak","birch","milkweed"];
  function startBig(){ const kind=BIGK[bigKind++%4], l=newLeaf(false); Object.assign(l,{kind}); if(kind!=="milkweed") l.c= kind==="maple"?pick(MAPLE) : kind==="oak"?pick(OAK) : pick(LEAF);
    const f=FOC(), vp=vanish(), toward=Math.random()<.55; l.toward=toward; l.a=1;
    l.D= toward? rnd(2.2,2.8) : .2; l.vD= toward? -rnd(.55,.75) : rnd(.45,.65);
    const Dr=toward? .28 : l.D, sxT=toward? rnd(W*.15,W*.85) : (Math.random()<.5? rnd(-.05,.25) : rnd(.75,1.05))*W, syT=toward? rnd(H*.2,H*.75) : rnd(0,.5)*H;   /* aimed at where it'll be as it reaches the lens */
    l.X=(sxT-vp[0])/f*Dr; l.Y=(syT-vp[1])/f*Dr; l.vX=rnd(-.03,.03); l.vY=rnd(.005,.02);
    l.base= kind==="milkweed"? .07 : rnd(.075,.095); l.ph=rnd(0,6.28); l.rot=rnd(0,6.28); l.flip=rnd(0,6.28); l.tilt=rnd(0,6.28);
    l.vr=rnd(-1.1,1.1); l.vf=kind==="milkweed"?0:rnd(1.4,2.6); l.vt=rnd(.6,1.4); l.age=0; bigL=l; }
  function drawBig(dt,dark){
    if(!bigL){ nextBig-=dt; if(nextBig<=0) startBig(); return; }
    const l=bigL, f=FOC(), vp=vanish(); l.age+=dt; l.ph+=dt*1.3;
    l.D+=l.vD*dt; const wk=Math.min(1,l.D); l.X+=(l.vX+Math.cos(l.ph)*.03)*wk*dt; l.Y+=(l.vY+Math.sin(l.ph*.8)*.02)*wk*dt; l.rot+=l.vr*dt*(l.kind==="milkweed"?.3:1); l.flip+=l.vf*dt; l.tilt+=l.vt*dt;
    const D=Math.max(.04,l.D), x=vp[0]+l.X*f/D, y=vp[1]+l.Y*f/D, S=l.base*f/D;
    l.sx=x; l.sy=y; l.sS=S; if(l.D<.06||l.D>7||x<-S*3||x>W+S*3||y>H+S*3){ bigL=null; nextBig=rnd(16,34); return; }
    const fadeIn=Math.min(1,l.age/.6), fadeFar=l.toward? 1 : Math.max(0,Math.min(1,(5.5-l.D)/2)), A=fadeIn*fadeFar*(dark?.8:1);
    const blur= l.D<.5? (.5-l.D)*26 : l.D>2.2? Math.min(2,(l.D-2.2)*.7) : 0;                         /* too close for the lens to focus, or soft with distance */
    const mist=Math.max(0,Math.min(.45,(l.D-1.2)/8)), sp=sun(), toSun=Math.atan2(sp.y-y,sp.x-x);
    ctx.save(); ctx.globalAlpha=A*.94; if(blur>.3) ctx.filter=`blur(${blur.toFixed(1)}px)`;
    if(l.kind==="milkweed"){ const m={kind:"milkweed",x,y,s:S*.9,rot:Math.sin(l.ph)*.4,a:.9,in3:1,mi3:mist,near3:1}; leaf(m,1); ctx.restore(); ctx.filter="none"; return; }
    ctx.translate(x,y); ctx.rotate(l.rot);
    const fx=Math.cos(l.flip), fy=.35+.65*Math.abs(Math.cos(l.tilt)), back=fx<0;            /* tumbling on two axes */
    ctx.scale(Math.max(.1,Math.abs(fx))*S,fy*S);
    const p=SH[l.kind]||SH.birch, lit=Math.cos(toSun-l.rot-Math.PI/2);
    ctx.fillStyle=l.c; ctx.fill(p);
    const g=ctx.createLinearGradient(-1,-1,1,1); g.addColorStop(0,`rgba(255,226,160,${(.32+.16*lit).toFixed(2)})`); g.addColorStop(.45,"rgba(255,220,150,0)"); g.addColorStop(1,"rgba(30,14,4,.5)"); ctx.fillStyle=g; ctx.fill(p);   /* curled: light on one side, shade on the other */
    if(back){ ctx.fillStyle="rgba(60,34,12,.25)"; ctx.fill(p); }
    const lc=(c=>{ const h=c.replace("#",""); return [0,2,4].map(i=>parseInt(h.substr(i,2),16)); })(l.c||"#9c6a32");
    const vein= back? rgb(mulv(lc,.62),.55) : rgb(mixv(lc,[255,226,170],.28),.42);                                               /* veins: a shade lighter than the leaf on its face, darker on its back */
    ctx.save(); ctx.clip(p);
    if(!l.mot) l.mot=Array.from({length:7},()=>[rnd(-.4,.4),rnd(-.8,.8),rnd(.12,.3),Math.random()<.5]);                       /* weathering: darker and lighter patches */
    for(const [mx,my,mr,dk] of l.mot){ const g2=ctx.createRadialGradient(mx,my,0,mx,my,mr); g2.addColorStop(0,dk? "rgba(50,24,8,.22)" : "rgba(255,210,140,.14)"); g2.addColorStop(1,"rgba(0,0,0,0)"); ctx.fillStyle=g2; ctx.fillRect(mx-mr,my-mr,mr*2,mr*2); }
    ctx.strokeStyle=vein; ctx.lineWidth=1.1/S; ctx.lineCap="round"; ctx.beginPath(); ctx.moveTo(0,-.85); ctx.lineTo(0,1.4);
    if(l.kind==="maple"){ for(const [a,b] of [[-.62,-.45],[.62,-.45],[-.7,.35],[.7,.35]]){ ctx.moveTo(0,.22); ctx.lineTo(a,b); } }
    else if(l.kind==="oak"){ for(const [y0,Lw,dy] of [[-.42,.56,0],[.04,.62,0],[.46,.42,0]]) for(const sd of [-1,1]){ const yy=y0+(sd<0?.05:0); ctx.moveTo(0,yy+.12); ctx.quadraticCurveTo(sd*Lw*.45,yy-.02,sd*Lw*.95,yy-.16); } ctx.moveTo(0,-.6); ctx.lineTo(.12,-.82); ctx.moveTo(0,-.6); ctx.lineTo(-.12,-.82); }   /* a vein out to each lobe tip */
    else { for(let i=0;i<6;i++){ const yy=-.65+i*.28, w=(l.kind==="oak"?.36:.5)*Math.sqrt(Math.max(0,1-yy*yy)); ctx.moveTo(0,yy+.08); ctx.quadraticCurveTo(w*.5,yy-.02,w,yy-.14); ctx.moveTo(0,yy+.08); ctx.quadraticCurveTo(-w*.5,yy-.02,-w,yy-.14); } }
    ctx.stroke(); ctx.restore();
    { const b0=l.kind==="maple"? .3 : .92; ctx.strokeStyle=rgb(mulv(lc,.7)); ctx.lineWidth=1.6/S; ctx.beginPath(); ctx.moveTo(0,b0); ctx.lineTo(0,b0+.3); ctx.stroke(); }   /* a short stem */
    ctx.strokeStyle="rgba(60,28,8,.5)"; ctx.lineWidth=1.2/S; ctx.stroke(p);                                                   /* the curled, darker rim */
    if(lit>.2&&!back){ ctx.save(); ctx.clip(p); ctx.globalCompositeOperation="screen"; const g3=ctx.createLinearGradient(Math.cos(toSun-l.rot)*-1,Math.sin(toSun-l.rot)*-1,Math.cos(toSun-l.rot),Math.sin(toSun-l.rot)); g3.addColorStop(.55,"rgba(255,170,70,0)"); g3.addColorStop(1,`rgba(255,180,80,${(.3*lit).toFixed(2)})`); ctx.fillStyle=g3; ctx.fillRect(-1.5,-1.5,3,3); ctx.restore(); }   /* the sun glowing through its edge */
    { const am=.06+mist; ctx.save(); ctx.clip(p); ctx.fillStyle=`rgba(214,188,150,${am.toFixed(2)})`; ctx.fillRect(-1.5,-1.5,3,3); ctx.restore(); }                    /* the evening air between us and it */
    ctx.globalCompositeOperation="source-atop";
    if(mist>.02){ ctx.fillStyle=`rgba(236,206,160,${mist.toFixed(2)})`; ctx.fill(p); }
    const tn=tint(); if(tn.a>0){ ctx.globalAlpha=A*tn.a; ctx.fillStyle=tn.c; ctx.fill(p); }
    ctx.restore(); ctx.filter="none";
  }
  /* ---- geese: V's flown level in 3D at different distances and heights, so the formation foreshortens as it crosses ---- */
  let flocks=[], nextFlock=3, lastTier=-1;
  const TIERS=[{Z:[42,70],Y:[5,8]},{Z:[18,30],Y:[3.6,6]},{Z:[8,13],Y:[4.2,6.8]}];
  function newFlock(){
    let ti; do{ ti=Math.floor(Math.random()*3); }while(ti===lastTier || flocks.some(f=>f.tier===ti)); lastTier=ti;
    const T=TIERS[ti], dir=Math.random()<.5?1:-1, rr=Math.random(), n= rr<.55? Math.round(rnd(4,12)) : rr<.82? Math.round(rnd(13,24)) : Math.round(rnd(28,40)), Z=rnd(T.Z[0],T.Z[1]), Y=rnd(T.Y[0],T.Y[1]);
    const hd=(dir>0?0:Math.PI)+dir*rnd(-.75,.75);                       /* crossing, angled toward you or away */
    const hx=Math.cos(hd), hz=Math.sin(hd), px=-hz, pz=hx, sp=rnd(2.6,3.4), gap=rnd(.75,.95), lop=Math.random()<.4;
    const birds=[]; for(let i=0;i<n;i++){ const k=Math.ceil(i/2), side=i%2?1:-1, kk=lop&&side>0? k*1.3 : k;
      const wob=n>20? rnd(-.35,.35)*Math.sqrt(k) : 0; birds.push({b:-kk*gap*rnd(.92,1.08)+wob*.4, s:side*kk*gap*.62*rnd(.9,1.1)+wob*.25, y:rnd(-.06,.06)+(n>20?Math.sin(k*.4)*.08:0), ph:rnd(0,6.28), f:rnd(4.4,5.4)}); }
    const v=vanish(), edge=dir>0? -80 : W+80, X0=(edge-v[0])*Z/FOC()-dir*(n*gap*.6);
    return {tier:ti, X:X0, Y, Z, hx, hz, px, pz, sp, birds, bob:rnd(0,6.28), honk:rnd(1,4)};
  }
  function drawGeese(dt,dark){
    nextFlock-=dt; if(nextFlock<=0 && flocks.length<2){ flocks.push(newFlock()); nextFlock=rnd(14,40); }
    const sun0=sun();
    for(const f of flocks){
      f.X+=f.hx*f.sp*dt; f.Z+=f.hz*f.sp*dt; f.bob+=dt*.5;
      if(f.Z<4) f.done=true;
      const haze=Math.max(0,Math.min(.85,(f.Z-8)/50)); let any=false;
      f.honk-=dt; if(f.honk<=0){ f.honk=rnd(.7,2.4); const c=w2s(f.X,f.Y,f.Z); if(c.x>0&&c.x<W&&typeof natureSfx!=="undefined") natureSfx.honk(c.x/W,Math.min(1.8,Math.pow(10/f.Z,1.4)),Math.min(.9,Math.max(.35,40/f.Z)));   /* louder the closer and bigger they are */ }
      ctx.save(); ctx.lineCap="round"; ctx.lineJoin="round";
      for(const bd of f.birds){ bd.ph+=dt*bd.f;
        const X=f.X+f.hx*bd.b+f.px*bd.s, Z=f.Z+f.hz*bd.b+f.pz*bd.s, Y=f.Y+bd.y+Math.sin(f.bob+bd.b)*.04;
        const c=w2s(X,Y,Z); if(c.x<-60||c.x>W+60) continue; any=true;
        const glow=Math.max(0,1-Math.hypot(c.x-sun0.x,c.y-sun0.y)/(W*.35));
        const r=Math.round(26+haze*80+glow*70), g=Math.round(23+haze*66+glow*48), b=Math.round(28+haze*58+glow*14);
        ctx.globalAlpha=(dark?.85:.82)*(1-haze*.45)*(1-glow*.3); ctx.strokeStyle=ctx.fillStyle=`rgb(${r},${g},${b})`;
        /* points of the bird in the world: body along the heading, wings out along the side, rising and falling */
        const span=.56, len=.24, flap=Math.sin(bd.ph), up=flap*.14, P=(a,s2,h)=>w2s(X+f.hx*a+f.px*s2,Y+h,Z+f.hz*a+f.pz*s2);
        const tail=P(-len*.45,0,0), neck=P(len*.2,0,.01), head=P(len*.75,0,.015), L=P(-.02,-span/2,up), Rr=P(-.02,span/2,up), Lm=P(.03,-span*.22,up*.25+.02), Rm=P(.03,span*.22,up*.25+.02);
        /* wings as real surfaces: broad at the body, swept and tapering to the tip, bending as they beat */
        const bend=flap*.05;
        for(const sd of [-1,1]){
          const lead=[P(.03,sd*.025,0),P(.03,sd*span*.2,up*.3+bend*.4),P(0,sd*span*.38,up*.75+bend),P(-.04,sd*span*.5,up)], trail=[P(-.04,sd*.025,0),P(-.045,sd*span*.2,up*.3+bend*.4),P(-.04,sd*span*.38,up*.75+bend)];
          ctx.beginPath(); ctx.moveTo(lead[0].x,lead[0].y); ctx.quadraticCurveTo(lead[1].x,lead[1].y,lead[2].x,lead[2].y); ctx.lineTo(lead[3].x,lead[3].y);
          ctx.quadraticCurveTo(trail[2].x,trail[2].y,trail[1].x,trail[1].y); ctx.lineTo(trail[0].x,trail[0].y); ctx.closePath(); ctx.fill();
          ctx.lineWidth=Math.max(.5,.008*c.k); ctx.stroke(); }
        if(c.k>30){
          /* a slim, tapered body seen in perspective, the long thin neck, the small head */
          for(const [ax,ay] of [[1,0],[0,1]]){ const Q=[[-.15,0],[-.06,.03],[.05,.03],[.1,0],[.05,-.03],[-.06,-.03]].map(([a,w])=>P(a,w*ax,w*ay*.8+.003));
            ctx.beginPath(); ctx.moveTo(Q[0].x,Q[0].y); for(let i=1;i<Q.length;i++){ const m=Q[i], n2=Q[(i+1)%Q.length]; ctx.quadraticCurveTo(m.x,m.y,(m.x+n2.x)/2,(m.y+n2.y)/2); } ctx.closePath(); ctx.fill(); }
          const nk0=P(.08,0,.006), nk1=P(.24,0,.016), hd0=P(.27,0,.017), bk=P(.31,0,.014);
          ctx.lineWidth=Math.max(.6,.014*c.k); ctx.beginPath(); ctx.moveTo(nk0.x,nk0.y); ctx.lineTo(nk1.x,nk1.y); ctx.stroke();
          ctx.beginPath(); ctx.arc(hd0.x,hd0.y,Math.max(.5,.011*c.k),0,6.283); ctx.fill();
          ctx.lineWidth=Math.max(.4,.007*c.k); ctx.beginPath(); ctx.moveTo(hd0.x,hd0.y); ctx.lineTo(bk.x,bk.y); ctx.stroke(); }
        else { ctx.lineWidth=Math.max(.7,.032*c.k); ctx.beginPath(); ctx.moveTo(tail.x,tail.y); ctx.lineTo(head.x,head.y); ctx.stroke(); }
      }
      ctx.restore();
      if(!any && f.seen) f.done=true; if(any) f.seen=true;
      if(!f.seen && Math.abs(f.X)>200) f.done=true;
    }
    flocks=flocks.filter(f=>!f.done);
  }
  /* ---- three rabbits at different distances in the grass ---- */
  const buns=[.81,.865,.915].map((dy,i)=>({dy, i, x:0,y:0,face:Math.random()<.5?1:-1,state:"eat",t:rnd(1,4),hop:0,hops:0,hx:0,tx:0,ear:0,chew:rnd(0,9),init:false,
    blades:Array.from({length:6},()=>({ox:rnd(-15,15),h:rnd(3,7),lean:rnd(-.5,.5),c:Math.random()*.7}))}));
  function rabbitStep(bun,dt,k){
    if(!bun.init){ bun.x=W*(.18+.3*bun.i+rnd(-.06,.12)); bun.y=H*bun.dy; bun.init=true; }
    bun.t-=dt; bun.ear=Math.max(0,bun.ear-dt*3); bun.chew+=dt;
    const lo=W*.06, hi=W*.94, step=()=>rnd(12,24)*k;
    if(bun.state==="hop"){
      bun.hop+=dt/.38; bun.x=bun.hx+(bun.tx-bun.hx)*Math.min(1,bun.hop);
      if(bun.hop>=1){ bun.hops--; if(bun.hops>0){ bun.hx=bun.x; bun.tx=Math.max(lo,Math.min(hi,bun.x+bun.face*step())); bun.hop=0; } else { bun.state=Math.random()<.6?"eat":"look"; bun.t=bun.state==="eat"?rnd(2.5,7):rnd(1,2.4); } }
      return;
    }
    if(bun.state==="look" && Math.random()<dt*.9) bun.ear=1;
    if(bun.t<=0){
      const r=Math.random();
      if(r<.42){ bun.state="hop"; bun.hops=1+Math.floor(Math.random()*3); if(Math.random()<.35||bun.x<W*.12||bun.x>W*.88) bun.face=bun.x<W*.12?1:bun.x>W*.88?-1:-bun.face; bun.hx=bun.x; bun.tx=Math.max(lo,Math.min(hi,bun.x+bun.face*step())); bun.hop=0; }
      else if(r<.75){ bun.state="eat"; bun.t=rnd(2.5,7); }
      else { bun.state="look"; bun.t=rnd(1,2.4); bun.ear=1; }
    }
  }
  /* ---- the photo itself: clouds that drift and a field that sways ---- */
  let photo=null, photoId=null, skyTile=null, fieldTile=null, tileKey="";
  function getPhoto(){
    const id=SC.photo();
    if(id!==photoId){ photoId=id; photo=null; tileKey=""; if(id){ const im=new Image(); im.onload=()=>{ if(photoId===id){ photo=im; tileKey=""; } }; im.src=id; } }
    return photo;
  }
  function cover(){ const iw=photo.naturalWidth, ih=photo.naturalHeight, s=Math.max(W/iw,H/ih); return {s,iw,ih,ox:(W-iw*s)/2,oy:(H-ih*s)/2}; }
  let tintCache={k:"",t:0};
  function tint(){
    const now=performance.now(); if(now-tintCache.t<1000) return tintCache; tintCache.t=now;
    const cs=getComputedStyle(document.body); tintCache.c=cs.getPropertyValue("--pgtint").trim()||cs.backgroundColor; tintCache.a=SC.fade()/100;
    tintCache.k=tintCache.c+"|"+tintCache.a+"|"+SC.dim(); return tintCache;
  }
  /* copy part of the photo exactly as the page shows it (same crop, same tint), with a soft alpha mask */
  function makeTile(y0,y1,x0,x1,mask,mirror,welcome){
    const m=cover(), sy=Math.max(0,m.oy+y0*m.ih*m.s), ey=Math.min(H,m.oy+y1*m.ih*m.s), sx=Math.max(0,m.ox+x0*m.iw*m.s), ex=Math.min(W,m.ox+x1*m.iw*m.s);
    const w=Math.ceil(ex-sx), h=Math.ceil(ey-sy); if(w<4||h<4) return null;
    const c=document.createElement("canvas"); c.width=mirror? w*2 : w; c.height=h; const x=c.getContext("2d");
    const src=(px,py)=>[(px-m.ox)/m.s,(py-m.oy)/m.s];
    const [ix,iy]=src(sx,sy), iwid=w/m.s, ihgt=h/m.s;
    const ins=mirror? 3 : 0;   /* skip the photo's outermost pixels so the mirrored seam stays clean */
    x.drawImage(photo,ix+ins,iy,iwid-ins*2,ihgt,0,0,w,h);
    if(mirror){ x.save(); x.translate(w*2,0); x.scale(-1,1); x.drawImage(photo,ix+ins,iy,iwid-ins*2,ihgt,0,0,w,h); x.restore(); }
    const tn=tint(); if(!welcome && tn.a>0){ x.globalAlpha=tn.a; x.fillStyle=tn.c; x.fillRect(0,0,c.width,h); x.globalAlpha=1; }
    x.globalCompositeOperation="destination-in"; mask(x,c.width,h,sx); x.globalCompositeOperation="source-over";
    return {c,x:sx,y:sy,w,h};
  }
  /* a waxing gibbous moon up in the clouds to the upper left: pale and soft in the evening light, slipping behind thin cloud now and then */
  const moonSpr=(()=>{ const c=document.createElement("canvas"), R=64; c.width=c.height=R*2+8; const x=c.getContext("2d"), o=R+4;
    const g=x.createRadialGradient(o-R*.25,o-R*.25,R*.1,o,o,R); g.addColorStop(0,"#fbf6e8"); g.addColorStop(1,"#e6dcc6"); x.fillStyle=g; x.beginPath(); x.arc(o,o,R,0,6.283); x.fill();
    x.fillStyle="rgba(150,146,140,.28)"; for(const [a,b,r] of [[-.3,-.35,.22],[.1,-.1,.28],[.35,.25,.18],[-.2,.3,.16],[.42,-.36,.12],[-.48,.05,.1]]){ x.beginPath(); x.ellipse(o+a*R,o+b*R,r*R,r*R*.85,a,0,6.283); x.fill(); }   /* the maria */
    x.globalCompositeOperation="destination-out"; const sh=x.createRadialGradient(o-R*1.55,o,R*.4,o-R*1.55,o,R*1.25); sh.addColorStop(0,"rgba(0,0,0,.9)"); sh.addColorStop(.75,"rgba(0,0,0,.75)"); sh.addColorStop(1,"rgba(0,0,0,0)");   /* the unlit sliver on the side away from the sun */
    x.fillStyle=sh; x.fillRect(0,0,c.width,c.height); return c; })();
  const moonCv=document.createElement("canvas"), moonBl=document.createElement("canvas"); const moonImg=new Image(); moonImg.src=SC.sounds+"moon.png";   /* a real photograph of the moon */
  /* the moon lives behind the drifting clouds. Two versions are prepared once: the moon in clear sky (tinted to the evening, contrast eased to the photo's),
     and the moon seen through cloud (just its light brightening the cloud in front of it, soft and diffuse). Several times a second we look at the clouds drifting
     over it right now and cross-fade, pixel by pixel, between the two: clear patches show the crisp moon, thin cloud a soft glow, thick cloud hides it */
  let moonKey="", MN=null;
  function moonPrep(p,R,S2){
    MN=null; moonCv.width=moonCv.height=S2;
    const mk=bl=>{ const c=document.createElement("canvas"); c.width=c.height=S2; const x=c.getContext("2d"); x.filter=bl? `blur(${bl}px)` : "none"; x.translate(S2/2,S2/2); x.rotate(110*Math.PI/180); x.drawImage(moonImg,-S2/2,-S2/2,S2,S2); return x; };
    const xa=mk(0), xb=mk(Math.max(1.5,R*.05));
    let A,Bd; try{ A=xa.getImageData(0,0,S2,S2).data; Bd=xb.getImageData(0,0,S2,S2).data; }catch(e){ return; }
    let clear=170, ar=200, ag=180, ab=160;                                                                              /* what open sky looks like up here, from a wide patch of the photo around the moon */
    try{ const W4=Math.ceil(R*6), c=document.createElement("canvas"); c.width=c.height=W4; const x=c.getContext("2d"), m=cover();
      x.drawImage(photo,(p[0]-R*3-m.ox)/m.s,(p[1]-R*3-m.oy)/m.s,(6*R)/m.s,(6*R)/m.s,0,0,W4,W4); const d=x.getImageData(0,0,W4,W4).data, lm=[]; let n=0; ar=ag=ab=0;
      for(let k=0;k<d.length;k+=32){ lm.push((d[k]+d[k+1]+d[k+2])/3); ar+=d[k]; ag+=d[k+1]; ab+=d[k+2]; n++; } lm.sort((u,v)=>u-v); clear=lm[Math.floor(lm.length*.85)]; ar/=n; ag/=n; ab/=n; }catch(e){ return; }
    const N=S2*S2, CA=new Float32Array(N*3), AA=new Float32Array(N), BL=new Float32Array(N), BA=new Float32Array(N);
    const wc=[255*.78+ar*.22,246*.78+ag*.22,226*.78+ab*.22];                                                             /* moonlight: warm white, seen through the same evening air as the sky */
    for(let i=0,k=0;i<N;i++,k+=4){ const L=Math.max(0,Math.min(1,((A[k]+A[k+1]+A[k+2])/3-128)*.82/255+.5)), gr=(Math.random()-.5)*8, f=.74+.34*L;
      CA[i*3]=Math.min(255,wc[0]*f+gr); CA[i*3+1]=Math.min(255,wc[1]*f+gr); CA[i*3+2]=Math.min(255,wc[2]*f+gr); AA[i]=A[k+3]/255;   /* clear-sky moon: brighter than the sky, its seas a softer grey */
      BL[i]=(Bd[k]+Bd[k+1]+Bd[k+2])/765; BA[i]=Bd[k+3]/255; }                                                          /* the soft light that gets through cloud */
    const skyC=document.createElement("canvas"); skyC.width=skyC.height=S2;
    MN={p,R,S2,clear,CA,AA,BL,BA,cl:new Float32Array(N).fill(-1),skyC,sx:skyC.getContext("2d",{willReadFrequently:true}),out:moonCv.getContext("2d").createImageData(S2,S2),next:0,cov:0};
  }
  function moonUpdate(){
    const M=MN, S2=M.S2, R=M.R, p=M.p, x=M.sx, m=cover(); x.globalCompositeOperation="source-over"; x.clearRect(0,0,S2,S2);
    x.drawImage(photo,(p[0]-R-m.ox)/m.s,(p[1]-R-m.oy)/m.s,(2*R)/m.s,(2*R)/m.s,0,0,S2,S2);                                 /* the sky behind it, exactly as it's drawn this moment: */
    if(skyTile){ const T=skyTile, span=T.w*2, off=(t*3.2)%span, x0=T.x-off, y0=Math.round(T.y); x.drawImage(T.c,x0-(p[0]-R),y0-(p[1]-R)); x.drawImage(T.c,x0+span-2-(p[0]-R),y0-(p[1]-R)); }   /* the photo plus the drifting clouds */
    let b; try{ b=x.getImageData(0,0,S2,S2).data; }catch(e){ MN=null; return; }
    const o=M.out.data, N=S2*S2, CA=M.CA, AA=M.AA, BL=M.BL, BA=M.BA, cl=M.cl, clear=M.clear; let cs=0, cn=0;
    for(let i=0,k=0;i<N;i++,k+=4){ const r=b[k], g=b[k+1], bl=b[k+2], lum=(r+g+bl)/3;
      let c=Math.max(0,Math.min(1,(clear*.95-lum)/45))*Math.max(.35,Math.min(1,(r-bl+30)/50)); c=cl[i]<0? c : cl[i]+(c-cl[i])*.45; cl[i]=c;   /* how much cloud is in front of this bit of moon, eased so edges glide */
      if(AA[i]>.01||BA[i]>.01){ cs+=c; cn++; }
      const thick=Math.max(0,(c-.55)/.45), glow=BL[i]*BA[i]*(.55-.4*thick);                                         /* through cloud: the cloud itself lit from behind */
      const br=r+(255-r)*glow, bg=g+(250-g)*glow, bb=bl+(236-bl)*glow*.9;
      const ac=AA[i]*(1-c);                                                                                          /* the crisp moon only where the sky is open */
      o[k]=CA[i*3]*ac+br*(1-ac); o[k+1]=CA[i*3+1]*ac+bg*(1-ac); o[k+2]=CA[i*3+2]*ac+bb*(1-ac);
      o[k+3]=255*Math.min(1,Math.max(ac,BA[i]*c*.98, glow>0? Math.min(1,BA[i]*1.4)*c : 0)); }
    M.cov=cn? cs/cn : 0; moonCv.getContext("2d").putImageData(M.out,0,0);
    if(moonBl.width!==S2){ moonBl.width=moonBl.height=S2; } const bx=moonBl.getContext("2d"); bx.clearRect(0,0,S2,S2); bx.filter="blur(.6px)"; bx.drawImage(moonCv,0,0); bx.filter="none";
  }
  let moonAt=null;
  function drawMoon(){
    const p=[W*.15,Math.max(H*.15,scr(.15,.16)[1])], R=Math.min(W,H)*.08; moonAt=[p[0],p[1],R]; const d=Math.min(1,duskV/.62), a=.55+.4*d;
    if(!(moonImg.complete&&moonImg.naturalWidth)){ ctx.save(); ctx.globalAlpha=a*.8; ctx.drawImage(moonSpr,p[0]-R-R*4/64,p[1]-R-R*4/64,R*2+R*8/64,R*2+R*8/64); ctx.restore(); return; }
    const S2=Math.ceil(R*2), key=[W,H,S2,Math.round(p[0]),Math.round(p[1]),tileKey].join("|");
    if(moonKey!==key){ moonKey=key; moonPrep(p,R,S2); }
    if(!MN){ ctx.save(); ctx.globalAlpha=a*.85; ctx.translate(p[0],p[1]); ctx.rotate(110*Math.PI/180); ctx.drawImage(moonImg,-R,-R,R*2,R*2); ctx.restore(); return; }   /* the photo can't be read here: just the moon */
    if(t>=MN.next){ MN.next=t+.25; moonUpdate(); if(!MN) return; }
    const cov=MN.cov;
    ctx.save(); const lx=p[0]+.94*R*.42, ly=p[1]+.34*R*.42, gl=ctx.createRadialGradient(lx,ly,R*.35,lx,ly,R*(2.3+cov*1.2));   /* the glow comes off the lit half only */ gl.addColorStop(0,`rgba(255,246,226,${(.12*a*(1+cov*.6)).toFixed(3)})`); gl.addColorStop(1,"rgba(255,246,226,0)"); ctx.fillStyle=gl; ctx.fillRect(lx-R*4,ly-R*4,R*8,R*8);   /* its glow spreads wider in cloud */
    ctx.globalAlpha=Math.min(1,.8+.2*d); ctx.drawImage(moonBl,p[0]-R,p[1]-R,R*2,R*2); ctx.restore();
  }
  function welcomeShade(){ /* the welcome screen darkens the middle of the photo a little; match it */
    ctx.save(); ctx.translate(W*.5,H*.48); ctx.scale(W*.65,H*.6);
    const g=ctx.createRadialGradient(0,0,0,0,0,1); g.addColorStop(0,"rgba(20,14,6,.32)"); g.addColorStop(.6,"rgba(20,14,6,.12)"); g.addColorStop(1,"rgba(20,14,6,.05)");
    ctx.fillStyle=g; ctx.globalCompositeOperation="source-atop"; ctx.fillRect(-2,-2,4,4); ctx.restore();
  }
  let leftTile=null, flarePatch=null, sunPatch=null;
  const FLARE=[.2987,.6], FLR=.017;                              /* the green lens flare baked into the photo */
  function buildTiles(){
    const welcome=SC.dim();
    /* a patch of the reeds just beside the flare, to paint the still flare out so a living one can take its place */
    { const sx=FLARE[0]-.045, ar=photo.naturalWidth/photo.naturalHeight;
      flarePatch=makeTile(FLARE[1]-FLR*ar*1.15,FLARE[1]+FLR*ar*1.15,sx-FLR*1.15,sx+FLR*1.15,(x,w,h)=>{ const g=x.createRadialGradient(w/2,h/2,0,w/2,h/2,Math.min(w,h)/2); g.addColorStop(0,"#000"); g.addColorStop(.62,"#000"); g.addColorStop(1,"rgba(0,0,0,0)"); x.fillStyle=g; x.fillRect(0,0,w,h); },false,welcome);
      if(flarePatch) flarePatch.dx=scr(FLARE[0],0)[0]-scr(sx,0)[0]; }
    leftTile=makeTile(.585,.705,0,.56,(x,w,h)=>{ const g=x.createLinearGradient(0,0,w,0); g.addColorStop(0,"#000"); g.addColorStop(.8,"#000"); g.addColorStop(1,"rgba(0,0,0,0)"); x.fillStyle=g; x.fillRect(0,0,w,h);
      const v=x.createLinearGradient(0,0,0,h); v.addColorStop(0,"rgba(0,0,0,0)"); v.addColorStop(.12,"#000"); v.addColorStop(1,"#000"); x.globalCompositeOperation="destination-in"; x.fillStyle=v; x.fillRect(0,0,w,h); },false,welcome);
    const sp0=sun(), R0=Math.max(W,H)*.16;
    skyTile=makeTile(0,.37,0,1,(x,w,h,sx)=>{ const g=x.createLinearGradient(0,0,0,h); g.addColorStop(0,"#000"); g.addColorStop(.78,"#000"); g.addColorStop(1,"rgba(0,0,0,0)"); x.fillStyle=g; x.fillRect(0,0,w,h);
      /* cut the sun out of the drifting sky, so its glow doesn't sail off with the clouds */
      const sy0=Math.max(0,cover().oy), lx=sp0.x-sx, ly=sp0.y-sy0; x.globalCompositeOperation="destination-out";
      for(const cx of [lx,w-lx]){ const hg=x.createRadialGradient(cx,ly,0,cx,ly,R0); hg.addColorStop(0,"rgba(0,0,0,1)"); hg.addColorStop(.55,"rgba(0,0,0,.85)"); hg.addColorStop(1,"rgba(0,0,0,0)"); x.fillStyle=hg; x.fillRect(cx-R0,ly-R0,R0*2,R0*2); } },true,welcome);
    { const ip=toImg(sp0.x,sp0.y)||[.73,.33], rx=R0*1.05/(cover().iw*cover().s), ry=R0*1.05/(cover().ih*cover().s);
      sunPatch=makeTile(Math.max(0,ip[1]-ry),ip[1]+ry,Math.max(0,ip[0]-rx),Math.min(1,ip[0]+rx),(x,w,h)=>{ const cx=(sp0.x-(cover().ox+Math.max(0,ip[0]-rx)*cover().iw*cover().s)), cy=sp0.y-Math.max(0,cover().oy+Math.max(0,ip[1]-ry)*cover().ih*cover().s);
        const g=x.createRadialGradient(cx,cy,0,cx,cy,R0); g.addColorStop(0,"#000"); g.addColorStop(.6,"rgba(0,0,0,.9)"); g.addColorStop(1,"rgba(0,0,0,0)"); x.fillStyle=g; x.fillRect(0,0,w,h); },false,welcome); }
    fieldTile=makeTile(.555,.8,.5,1,(x,w,h,sx)=>{ const g=x.createLinearGradient(0,0,w,0); g.addColorStop(0,"rgba(0,0,0,0)"); g.addColorStop(.16,"#000"); g.addColorStop(1,"#000"); x.fillStyle=g; x.fillRect(0,0,w,h);
      const v=x.createLinearGradient(0,0,0,h); v.addColorStop(0,"rgba(0,0,0,.0)"); v.addColorStop(.08,"#000"); v.addColorStop(1,"#000"); x.globalCompositeOperation="destination-in"; x.fillStyle=v; x.fillRect(0,0,w,h); },false,welcome);
  }
  function drawScene(dark){
    if(!getPhoto()) return;
    const key=W+"x"+H+"|"+tint().k; if(key!==tileKey){ tileKey=key; buildTiles(); }
    const welcome=SC.dim();
    { const m=cover(); ctx.drawImage(photo,m.ox,m.oy,m.iw*m.s,m.ih*m.s); const tn=tint(); if(!welcome&&tn.a>0){ ctx.globalAlpha=tn.a; ctx.fillStyle=tn.c; ctx.fillRect(m.ox,m.oy,m.iw*m.s,m.ih*m.s); ctx.globalAlpha=1; } }   /* the photo itself, so it sways with the camera */
    /* clouds: the whole sky drifts slowly, fading out above the hills so the sun and horizon stay put */
    if(skyTile){ const T=skyTile, span=T.w*2, off=(t*3.2)%span;
      ctx.save(); ctx.globalAlpha=1;
      const x0=T.x-off, y0=Math.round(T.y); ctx.drawImage(T.c,x0,y0); ctx.drawImage(T.c,x0+span-2,y0);   /* smooth sub-pixel drift; the two copies overlap a little so the seam never opens */
      ctx.restore(); }
    if(sunPatch) ctx.drawImage(sunPatch.c,sunPatch.x,sunPatch.y);
    drawMoon();
    if(typeof drawDeer==="function") drawDeer(0,dark,"behind");
    /* the far field on the left sways too, more gently: it's farther off, and the gust reaches it first */
    if(leftTile){ const F=leftTile, rows=3, cols=8, cw=Math.ceil(F.w/cols); ctx.drawImage(F.c,F.x,F.y);
      for(let yy=0; yy<F.h; yy+=rows){ const lean=Math.pow(1-yy/F.h,1.7);
        for(let c=0;c<cols;c++){ const ph=t*1.05+1.1-c*.3, gust=.55*Math.sin(ph)+.3*Math.sin(ph*2.3+1)+.15*Math.sin(ph*5.1+2), base=.6+.4*Math.sin(t*.23);
          const dx=((gust*base+.35)*2.6+Math.sin(t*2.4+c*1.9+yy*.06)*.45)*lean;
          ctx.drawImage(F.c,c*cw,yy,cw,rows,F.x+c*cw+dx,F.y+yy,cw,rows); } } }
    /* the tall field on the right sways in gusts, a wave rolling through from left to right */
    if(fieldTile){ const F=fieldTile, rows=3, cols=9, cw=Math.ceil(F.w/cols); ctx.drawImage(F.c,F.x,F.y);
      for(let yy=0; yy<F.h; yy+=rows){
        const hgt=1-yy/F.h, lean=Math.pow(hgt,1.7);
        for(let c=0;c<cols;c++){
          const ph=t*1.05-c*.32, gust=.55*Math.sin(ph)+.3*Math.sin(ph*2.3+1)+.15*Math.sin(ph*5.1+2), base=.6+.4*Math.sin(t*.23);
          const dx=((gust*base+.35)*6+Math.sin(t*2.6+c*1.7+yy*.05)*.9)*lean;
          ctx.drawImage(F.c,c*cw,yy,cw,rows,F.x+c*cw+dx,F.y+yy,cw,rows);
        }
      }
    }
    drawFlare(welcome);
    if(welcome) welcomeShade();
  }
  /* the lens flare: a chain of ghosts strung along the line from the sun through the frame, sliding as the "camera" sways and fading in and out as the light shifts */
  const GHOSTS=[ /* k along sun→flare (1 = the flare in the photo), size, rgb, kind, strength */
    [.2,1.1,[255,190,120],"glow",.3],[.36,.5,[190,140,255],"hex",.36],[.5,.8,[255,170,90],"disc",.3],
    [.74,.32,[200,255,230],"disc",.6],[.85,1.05,[255,120,200],"disc",.24],[.93,.6,[255,200,120],"hex",.3],[1,1,[170,240,120],"main",1]];
  function drawFlare(welcome){
    if(!flarePatch) return;
    const F=flarePatch; ctx.drawImage(F.c,F.x+F.dx,F.y);
    const base=scr(FLARE[0],FLARE[1]), s0=sun(), Tx=v=>v*camZ+(1-camZ)*W/2+camX, Ty=v=>v*camZ+(1-camZ)*H/2+camY;
    /* the camera sways: the sun moves with the photo, and the chain of ghosts pivots the other way through the lens */
    const sx=Tx(s0.x), sy=Ty(s0.y), cx=Tx(base[0])-camX*2.8, cy=Ty(base[1])-camY*2.8, vx=cx-sx, vy=cy-sy;
    ctx.save(); ctx.setTransform(1,0,0,1,0,0);
    /* comes and goes: long slow swells, now and then fading almost away */
    const I=Math.max(0,Math.min(1,.55+.35*Math.sin(t*.16)+.25*Math.sin(t*.07+2)+.08*Math.sin(t*1.3)))*(welcome?.8:1);
    const r0=F.w*.3;
    ctx.save(); ctx.globalCompositeOperation="lighter";
    for(const [k,sz,c,kind,st] of GHOSTS){
      const x=sx+vx*k, y=sy+vy*k, r=r0*sz*(kind==="main"?(.9+.1*I):1), a=st*I*(kind==="main"?1:(.75+.25*Math.sin(t*.9+k*7)));
      if(a<.004) continue; const col=(al)=>`rgba(${c[0]},${c[1]},${c[2]},${Math.max(0,al).toFixed(3)})`;
      if(kind==="main"){
        let g=ctx.createRadialGradient(x,y,0,x,y,r*2.6); g.addColorStop(0,col(.3*a)); g.addColorStop(1,col(0)); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,r*2.6,0,6.283); ctx.fill();
        ctx.save(); ctx.translate(x,y); ctx.scale(1.12,.92); g=ctx.createRadialGradient(0,0,0,0,0,r); g.addColorStop(0,`rgba(225,255,190,${(.95*a).toFixed(3)})`); g.addColorStop(.55,col(.75*a)); g.addColorStop(.85,col(.3*a)); g.addColorStop(1,col(0));
        ctx.fillStyle=g; ctx.beginPath(); ctx.arc(0,0,r,0,6.283); ctx.fill(); ctx.restore();
        ctx.lineWidth=Math.max(1,r*.12); ctx.strokeStyle=`rgba(255,170,120,${(.06*a).toFixed(3)})`; ctx.beginPath(); ctx.arc(x,y,r*1.35,0,6.283); ctx.stroke();
      } else if(kind==="ring"){
        ctx.lineWidth=Math.max(1.2,r*.16); const g=ctx.createRadialGradient(x,y,r*.75,x,y,r*1.1); g.addColorStop(0,col(0)); g.addColorStop(.5,col(a)); g.addColorStop(1,col(0)); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,r*1.1,0,6.283); ctx.fill();
      } else if(kind==="hex"){
        ctx.beginPath(); for(let i=0;i<6;i++){ const q=i*Math.PI/3+.35; ctx[i?"lineTo":"moveTo"](x+Math.cos(q)*r,y+Math.sin(q)*r); } ctx.closePath();
        ctx.fillStyle=col(a*.8); ctx.fill(); ctx.lineWidth=Math.max(1,r*.08); ctx.strokeStyle=col(a); ctx.stroke();
      } else { const g=ctx.createRadialGradient(x,y,0,x,y,r); g.addColorStop(0,col(kind==="glow"?a:a*.85)); g.addColorStop(kind==="glow"?.2:.7,col(a*.6)); g.addColorStop(1,col(0)); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,r,0,6.283); ctx.fill(); }
    }
    ctx.restore(); ctx.restore();
  }

  /* ---- a ruffed grouse bursting out of the field on the right and flying off toward the far hills ---- */
  let grouse=null, nextGrouse=12, bits=[];
  function scr(ix,iy){ if(photo){ const m=cover(); return [m.ox+ix*m.iw*m.s, m.oy+iy*m.ih*m.s]; } return [ix*W,iy*H]; }
  /* places in the photo where a bird can burst from cover, and the far hills it heads for */
  const COVER=[[.86,.95,.6,.66],[.66,.8,.58,.63],[.45,.6,.59,.63],[.3,.4,.62,.66],[.08,.22,.6,.64],[.0,.08,.6,.66]];
  let lastCover=-1;
  function flushPath(){
    let i; do{ i=Math.floor(Math.random()*COVER.length); }while(i===lastCover && COVER.length>1); lastCover=i;
    const [x0,x1,y0,y1]=COVER[i], sx=rnd(x0,x1), sy=rnd(y0,y1);
    let tx; do{ tx=rnd(.2,.85); }while(Math.abs(tx-sx)<.18);
    const ty=rnd(.43,.47), mx=sx+(tx-sx)*rnd(.25,.4), my=Math.min(sy,ty)-rnd(.05,.11);
    return [scr(sx,sy),scr(mx,my),scr(tx,ty)];
  }
  /* ---- flushed birds, flown in 3D: they burst from cover and climb away from you toward the far hills, shrinking into the distance ---- */
  /* world: X sideways, Y height (camera at 1), Z depth; on screen x = vx + X*f/Z, y = vy + (1-Y)*f/Z */
  function w2s(X,Y,Z){ const v=vanish(), k=FOC()/Z; return {x:v[0]+X*k, y:v[1]+(1-Y)*k, k}; }
  function flyStart(kind,at){
    const p0=at||flushPath()[0], gp=at? {Xw:at.Xw,Dw:at.Dw} : toGround(p0[0],p0[1]);
    const away=Math.PI/2+rnd(-.75,.75)*(Math.random()<.5?1:-1)*.9;
    return {kind, X:gp.Xw, Y:.04, Z:trueZ(gp.Dw), yaw:away, yawT:away+rnd(-.35,.35), v:0, vmax:kind==="pheas"?rnd(1.9,2.4):rnd(2.2,2.8), alt:rnd(.55,1.05), age:0, ph:rnd(0,6), dur:kind==="pheas"?rnd(7,9):rnd(6.5,8), p0};
  }
  function flierParts(b,C){
    const P=[], ph=b; const pheas=b.kind==="pheas";
    /* flapping: wings sweep through a big arc; gliding: held out, bowed slightly down */
    const burst=b.age<(pheas?1.4:1.1), cyc=(b.age-(pheas?1.4:1.1))%(pheas?2.2:1.6), flap=burst||cyc<(pheas?.6:.75);
    const a= flap? .25+.95*Math.sin(b.ph) : -.12+Math.sin(b.age*3)*.03;
    const climb=Math.max(-.1,Math.min(.6,b.climb||0)), cc=Math.cos(climb), sc=Math.sin(climb);
    const R=(x,y,z,r)=>[x*cc-y*sc, x*sc+y*cc, z, r];
    const span=pheas?30:28, root=3;
    const wingPts=sd=>{ const o=[[3.5,1,root],[3.2,1.2,12],[1.5,1,22],[-1.5,.6,span],[-4.5,.6,span-3],[-6,.8,18],[-5.5,.8,8],[-4,1,root]];
      return o.map(([x,y,z])=>{ const d=z-root; return R(x,y+d*Math.sin(a),sd*(root+d*Math.cos(a)),0); }); };
    for(const sd of [-1,1]) P.push({poly:true,p:wingPts(sd),c:C.wing,bias:0,st:b.st});
    P.push({p:[R(-6,0,0,3.6),R(-1,.4,0,4.6),R(4,.8,0,4.0),R(7,1.4,0,2.8)],c:C.body});
    P.push({p:[R(9,2,0,2.4),R(10.8,1.8,0,1.4)],c:C.head});
    P.push({p:[R(11.8,1.6,0,.55)],c:C.dark,bias:-.1});
    if(pheas){ const tl=[]; for(let i=0;i<7;i++) tl.push(R(-7-i*3.4,-.2-i*.25,0,[2.4,2.1,1.8,1.5,1.2,.9,.5][i])); P.push({p:tl,c:C.tail});
      P.push({p:[R(7.8,1.8,0,2.5)],c:C.ring,bias:.05}); }
    else { const fan=[]; for(let i=0;i<=8;i++){ const q=-1.1+2.2*i/8; fan.push(R(-7-9*Math.cos(q),-.3,9*Math.sin(q),0)); } fan.push(R(-6,0,0,0));
      P.push({poly:true,p:fan,c:C.tail,bias:.02,st:b.st}); P.push({poly:true,p:fan.map(([x,y,z])=>[-6+(x+6)*.82,y,z*.82,0]),c:C.body,bias:.01}); }
    return P;
  }
  function drawFlier(b,dt,dark){
    b.age+=dt;
    /* explode up out of cover, then a steady climb away */
    b.v=Math.min(b.vmax,b.v+dt*(b.age<1?7:2));
    b.yaw=angTo(b.yaw,b.yawT,dt*.6); if(Math.random()<dt*.3) b.yawT+=rnd(-.3,.3);
    const dY=(b.alt-b.Y)*Math.min(1,dt*(b.age<1.2?2.4:.8));
    b.X+=Math.cos(b.yaw)*b.v*dt; b.Z+=Math.sin(b.yaw)*b.v*dt; b.Y+=dY;
    b.climb=lerp(b.climb||1.1,Math.atan2(dY/dt||0,b.v||1),Math.min(1,dt*3));
    const pheas=b.kind==="pheas", burst=b.age<(pheas?1.4:1.1), cyc=(b.age-(pheas?1.4:1.1))%(pheas?2.2:1.6), flap=burst||cyc<(pheas?.6:.75);
    b.ph+=dt*(burst?(pheas?24:28):flap?(pheas?15:17):0);
    const s=w2s(b.X,b.Y,b.Z), worldSpan=b.kind==="pheas"?.26:b.kind==="quail"?.19:.22, u=worldSpan*s.k/60; b.sx=s.x; b.sy=s.y; b.sr=Math.max(26,worldSpan*s.k*.7); b.st=Math.max(1,Math.min(2.2,u*1.6));
    const haze=Math.max(0,Math.min(.8,(b.Z-4)/22)), hz=dark?[60,52,44]:[200,176,134];
    const lit=dark?.5:.72, M=c=>rgb(mixv(mulv(c,lit),hz,haze));
    const C= pheas? {wing:M([128,94,58]),body:M([150,76,34]),head:M([22,58,50]),tail:M([124,88,52]),ring:M([214,206,192]),dark:M([40,30,20])}
                  : b.kind==="quail"? {wing:M([132,100,66]),body:M([150,104,62]),head:M([92,60,38]),tail:M([110,84,58]),dark:M([36,26,18])}
                  : {wing:M([118,92,62]),body:M([104,78,50]),head:M([96,72,46]),tail:M([112,86,56]),dark:M([40,30,20])};
    const pitch=Math.atan2(1-b.Y,b.Z);
    const fade=Math.max(0,Math.min(1,(b.dur-b.age)/1.2));
    ctx.save(); ctx.globalAlpha=fade*(1-haze*.2); ctx.translate(s.x,s.y);
    rigDraw(ctx,flierParts(b,C),rigView(b.yaw,pitch),u);
    ctx.restore();
    return b.age<b.dur && s.y>-40 && s.x>-80 && s.x<W+80;
  }
  function flushBits(p0,n,cols,big){ for(let i=0;i<n;i++) bits.push({x:p0[0]+rnd(-16,16)*big,y:p0[1]+rnd(-6,8),vx:rnd(-70,60)*big,vy:-rnd(40,140),r:rnd(1,2.6)*big,rot:rnd(0,6),vr:rnd(-7,7),c:pick(cols),life:rnd(1.2,2.4)}); }
  function flushGrouse(){
    if(pheas){ nextGrouse=8; return; }
    grouse=flyStart("grouse"); flushBits(grouse.p0,16,["#7a5a2e","#9c7a3c","#5e4a26","#b08a48","#c9a24e"],1);
    if(typeof natureSfx!=="undefined") natureSfx.flush("grouse",grouse.p0[0]/W);
  }
  const lerp=(a,b,u)=>a+(b-a)*u, mixc=(a,b,u)=>`rgb(${a.map((v,i)=>Math.round(lerp(v,b[i],u))).join(",")})`;
  function drawGrouse(dt,dark){
    if(!grouse){ nextGrouse-=dt; if(nextGrouse<=0) flushGrouse(); }
    for(const b of bits){ b.vy+=150*dt; b.vx*=.985; b.x+=b.vx*dt; b.y+=b.vy*dt; b.rot+=b.vr*dt; b.life-=dt;
      ctx.save(); ctx.globalAlpha=Math.max(0,Math.min(1,b.life))*.85; ctx.translate(b.x,b.y); ctx.rotate(b.rot); ctx.fillStyle=b.c; ctx.fillRect(-b.r,-b.r*.45,b.r*2,b.r*.9); ctx.restore(); }
    bits=bits.filter(b=>b.life>0);
    if(!grouse) return;
    if(!drawFlier(grouse,dt,dark)){ grouse=null; nextGrouse=rnd(45,120); }
  }
  /* sample the photo so the rabbits take their colors and light from the scene around them */
  let samp=null, sampFor=null;
  function sampleAt(ix,iy){
    if(!photo) return null;
    if(sampFor!==photo){ sampFor=photo; const c=document.createElement("canvas"); c.width=160; c.height=Math.round(160*photo.naturalHeight/photo.naturalWidth); const x=c.getContext("2d",{willReadFrequently:true}); x.drawImage(photo,0,0,c.width,c.height); try{ samp={d:x.getImageData(0,0,c.width,c.height).data,w:c.width,h:c.height}; }catch(e){ samp=null; } }
    if(!samp) return null;
    let r=0,g=0,b=0,n=0; const cx=Math.round(ix*samp.w), cy=Math.round(iy*samp.h);
    for(let dy=-2;dy<=2;dy++) for(let dx=-3;dx<=3;dx++){ const x=Math.min(samp.w-1,Math.max(0,cx+dx)), y=Math.min(samp.h-1,Math.max(0,cy+dy)), i=(y*samp.w+x)*4; r+=samp.d[i]; g+=samp.d[i+1]; b+=samp.d[i+2]; n++; }
    return [r/n,g/n,b/n];
  }
  function toImg(px,py){ if(!photo) return null; const m=cover(); return [(px-m.ox)/(m.iw*m.s),(py-m.oy)/(m.ih*m.s)]; }
  const RES=.7, SPW=110, SPH=80, AX=55, AY=66;
  const rgb=(c,a)=>a==null?`rgb(${c.map(v=>Math.round(Math.max(0,Math.min(255,v)))).join(",")})`:`rgba(${c.map(v=>Math.round(Math.max(0,Math.min(255,v)))).join(",")},${a})`;
  const mixv=(a,b,u)=>a.map((v,i)=>v+(b[i]-v)*u), mulv=(a,k)=>a.map(v=>v*k);
  function drawRabbit(bun,dt,dark){
    const near=(bun.dy-.79)/.13, k=.62+.5*near, haze=1-near;
    rabbitStep(bun,dt,k);
    /* colors from the grass under the rabbit and from the hazy field beyond, refreshed every couple of seconds */
    bun.ct=(bun.ct||0)-dt;
    if(bun.ct<=0||!bun.pal){ bun.ct=2; const ip=toImg(bun.x,bun.y), g=ip&&sampleAt(ip[0],ip[1]+.01), far=sampleAt(.62,.6);
      const ground=g||[120,110,60], hz=far||[190,160,110];
      let fur=mixv([122,98,72],mulv(ground,.78),.42); fur=mulv(fur,.7);                 /* cottontail brown, backlit so mostly in shade */
      fur=mixv(fur,hz,haze*.32);
      bun.pal={fur, belly:mulv(fur,.78), shadow:mulv(ground,.42), tail:mixv(mulv([200,190,172],.62),ground,.3), grassA:mulv(ground,.85), grassB:mixv(ground,[230,200,120],.25), rim:[255,204,140]};
    }
    const P=bun.pal;
    const sc=Math.max(.7,Math.min(1.4,H/900))*k, lift= bun.state==="hop"? Math.sin(Math.PI*Math.min(1,bun.hop))*9*sc : 0;
    const eat=bun.state==="eat", stretch=bun.state==="hop"? 1+Math.sin(Math.PI*Math.min(1,bun.hop))*.18 : 1;
    /* draw small and scale up: the soft edges match the photo's own softness */
    if(!bun.sp){ bun.sp=document.createElement("canvas"); bun.sp.width=SPW; bun.sp.height=SPH; bun.sx=bun.sp.getContext("2d"); }
    const x=bun.sx; x.setTransform(1,0,0,1,0,0); x.clearRect(0,0,SPW,SPH); x.translate(AX,AY); x.scale(RES,RES);
    /* contact shadow, tinted by the grass */
    x.save(); x.globalAlpha=.5*(1-lift/(12*sc)); const sg=x.createRadialGradient(0,1,0,0,1,14*sc); sg.addColorStop(0,rgb(P.shadow,.9)); sg.addColorStop(1,rgb(P.shadow,0)); x.fillStyle=sg; x.scale(1,.22); x.beginPath(); x.arc(0,4,14*sc,0,6.283); x.fill(); x.restore();
    x.save(); x.translate(0,-lift);
    { if(bun.yo==null){ bun.yo=0; bun.yoT=0; } if(bun.ys!==bun.state){ bun.ys=bun.state; if(bun.state==="hop") bun.yoT=(Math.random()<.5?-1:1)*rnd(.2,1.2); }      /* rabbits only change direction with a hop, never by spinning in place */
      bun.yo+=(bun.yoT-bun.yo)*Math.min(1,dt*(bun.state==="hop"?8:1.8));
      const yaw=(bun.face>0?0:Math.PI)+bun.yo, far=z=>z*Math.cos(yaw)>0, st=stretch;
      const fur=rgb(P.fur), furFar=rgb(mulv(P.fur,.8)), belly=rgb(P.belly), dk="rgba(15,10,6,.9)";
      const Bx=(px,py,pz,r)=>[px*st,py,pz,r], parts=[];
      for(const sd of [-1,1]){ const c=far(sd)?furFar:fur;
        parts.push({p:[Bx(-6,5,2.6*sd,4.4),Bx(-3.2,1.4,2.9*sd,1.6),Bx(1.6,.9,2.7*sd,1.05)],c});
        parts.push({p:[Bx(3,5,1.5*sd,1.5),Bx(3.7+(st-1)*8,.9,1.5*sd,.95)],c}); }
      parts.push({p:[Bx(-8.4,6.2,0,5.4),Bx(-4.2,8.4,0,6.2),Bx(.8,7.6,0,5.0),Bx(3.8,8.6,0,3.6)],c:fur});
      parts.push({p:[Bx(-3,3.6,0,3.4),Bx(2,3.4,0,2.6)],c:belly,bias:2});
      const hc=eat? [Bx(8.6,3.6,0,0)[0],3.6+Math.sin(bun.chew*9)*.3,0] : [Bx(7.4,12,0,0)[0],12,0], hp=eat? .75 : -.05;
      const nk=Bx(4.2,9,0,3.6); parts.push({p:[nk,[(nk[0]+hc[0])/2,(nk[1]+hc[1])/2,0,3.0]],c:fur});
      const Hh=(u,v,w,r)=>{ const t=headPt(hc,hp,0,u,v,w); return [t[0],t[1],t[2],r]; };
      parts.push({p:[Hh(-.3,0,0,3.4),Hh(1.6,-.5,0,2.7),Hh(3.0,-1.1,0,1.6)],c:fur});
      parts.push({p:[Hh(3.4,-1.0,0,.5)],c:dk,bias:-.4});
      const er=eat?-.5+Math.sin(bun.chew*1.3)*.08:(-.15-bun.ear*.3*Math.sin(bun.chew*18));
      for(const sd of [-1,1]){
        parts.push({p:[Hh(1.6,.6,2.1*sd,.62)],c:dk,bias:-.5});
        parts.push({p:[Hh(-.6,2.6,1.1*sd,1.15),Hh(-1.6+er*2,6.2,1.45*sd,1.45),Hh(-2.6+er*4,9.8,1.6*sd,.85)],c:far(sd)?furFar:rgb(mulv(P.fur,1.06))});
      }
      parts.push({p:[Bx(-13.4,7.6,0,2.0)],c:rgb(P.tail),bias:-.2});
      rigDraw(x,parts,rigView(yaw,.32),sc);
    }
    x.restore();
    x.setTransform(1,0,0,1,0,0); rigLight(x,AX,AY-16*sc*RES,AY,22*sc*RES,sun().x-bun.x,haze); x.translate(AX,AY); x.scale(RES,RES);
    /* grass in front of the feet, in the grass's own colors */
    x.lineCap="round";
    for(const b of bun.blades){
      const sway=Math.sin(t*1.4+b.ox)*.08, bx=b.ox*sc, h=b.h*sc*1.15;
      x.strokeStyle=rgb(b.c<.35?P.grassA:P.grassB,.75); x.lineWidth=Math.max(.6,.9*sc);
      x.beginPath(); x.moveTo(bx,2.5*sc); x.quadraticCurveTo(bx+(b.lean+sway)*h*.5,-h*.5+2,bx+(b.lean+sway)*h,-h+2.5*sc); x.stroke();
    }
    /* sit it under the same light as the page: the page's soft tint, or the welcome screen's shade */
    x.setTransform(1,0,0,1,0,0); x.globalCompositeOperation="source-atop";
    if(SC.dim()){ x.fillStyle="rgba(20,14,6,.14)"; x.fillRect(0,0,SPW,SPH); }
    else { const tn=tint(); if(tn.a>0){ x.globalAlpha=tn.a; x.fillStyle=tn.c; x.fillRect(0,0,SPW,SPH); x.globalAlpha=1; } }
    x.globalCompositeOperation="source-over";
    ctx.save(); ctx.globalAlpha=1-haze*.12; ctx.imageSmoothingQuality="high";
    ctx.drawImage(bun.sp,bun.x-AX/RES,bun.y-AY/RES,SPW/RES,SPH/RES); ctx.restore();
  }
  /* ---- a ring-necked pheasant bursting up out of the brush on the left now and then ---- */
  let pheas=null, nextPheas=32;
  function flushPheasant(){
    if(grouse){ nextPheas=8; return; }                                   /* never at the same moment as the grouse */
    pheas=flyStart("pheas"); flushBits(pheas.p0,22,["#7a5a2e","#9c7a3c","#5e4a26","#b08a48","#c9a24e","#a33b25"],1.2);
    if(typeof natureSfx!=="undefined") natureSfx.flush("pheas",pheas.p0[0]/W);
  }
  /* a covey of bobwhite quail exploding out of the grass in front of the dog: a whirr of small birds scattering every which way */
  let covey=[];
  function flushQuail(at){ const n=5+Math.floor(Math.random()*5);
    for(let i=0;i<n;i++){ const q=flyStart("quail",{Xw:at.Xw+rnd(-.05,.05),Dw:at.Dw+rnd(-.04,.04),0:at[0],1:at[1]}); q.vmax=rnd(1.5,2); q.alt=rnd(.25,.5); q.dur=rnd(4,5.5); q.yaw+=rnd(-1,1); q.yawT=q.yaw+rnd(-.4,.4); q.age=-rnd(0,.25); covey.push(q); }
    flushBits(at,26,["#7a5a2e","#9c7a3c","#5e4a26","#b08a48","#c9a24e"],.9);
    if(typeof natureSfx!=="undefined"){ natureSfx.flush("grouse",at[0]/W); setTimeout(()=>natureSfx.flush&&natureSfx.flush("grouse",at[0]/W+.05),120); } }
  function drawCovey(dt,dark){ for(let i=covey.length-1;i>=0;i--){ const q=covey[i]; if(q.age<0){ q.age+=dt; continue; } if(!drawFlier(q,dt,dark)) covey.splice(i,1); } }
  function drawPheasant(dt,dark){
    if(!pheas){ nextPheas-=dt; if(nextPheas<=0) flushPheasant(); return; }
    if(!drawFlier(pheas,dt,dark)){ pheas=null; nextPheas=rnd(70,150); }
  }
  /* ---- a tiny 3D rig: the animals are built from tapered limbs (spheres swept along bones), turned to face where they're going and seen from the camera's height ---- */
  const trueZ=Dw=>Dw*FOC()/GF;                                    /* ground depth in the same units as sideways distance */
  const viewPitch=(Dw,mx)=>Math.max(.05,Math.min(mx||.3,Math.atan2(.45,trueZ(Dw))));
  function rigView(yaw,pitch){ const cy=Math.cos(yaw), sy=Math.sin(yaw), cp=Math.cos(pitch), sp=Math.sin(pitch);
    return (x,y,z)=>{ const X=x*cy-z*sy, Z=x*sy+z*cy; return [X,-(y*cp+Z*sp),Z*cp-y*sp]; }; }
  const angTo=(a,b,k)=>a+Math.atan2(Math.sin(b-a),Math.cos(b-a))*Math.min(1,k);
  const camYaw=yaw=>{ const a=Math.atan2(-Math.cos(yaw),-Math.sin(yaw)); return Math.max(-1.25,Math.min(1.25,a)); };   /* head turn that looks at you */
  /* a point on the head: head-local (forward, up, side), nodded by hp, turned by hy, then set at c */
  function headPt(c,hp,hy,u,v,w){ const ca=Math.cos(hp), sa=Math.sin(hp), u1=u*ca+v*sa, v1=-u*sa+v*ca, cb=Math.cos(hy), sb=Math.sin(hy);
    return [c[0]+u1*cb-w*sb, c[1]+v1, c[2]+u1*sb+w*cb]; }
  function tubePath(x,P){
    for(let i=0;i<P.length;i++){ const p=P[i]; x.moveTo(p[0]+p[3],p[1]); x.arc(p[0],p[1],p[3],0,6.283);
      if(!i) continue; const q=P[i-1], dx=p[0]-q[0], dy=p[1]-q[1], L=Math.hypot(dx,dy); if(L<=Math.abs(p[3]-q[3])+.01) continue;
      const ux=dx/L, uy=dy/L, s=(q[3]-p[3])/L, c=Math.sqrt(Math.max(0,1-s*s));
      const a=[q[0]+(s*ux-c*uy)*q[3],q[1]+(s*uy+c*ux)*q[3]], b=[p[0]+(s*ux-c*uy)*p[3],p[1]+(s*uy+c*ux)*p[3]], d=[p[0]+(s*ux+c*uy)*p[3],p[1]+(s*uy-c*ux)*p[3]], e=[q[0]+(s*ux+c*uy)*q[3],q[1]+(s*uy-c*ux)*q[3]];
      let Q=[a,b,d,e]; const ar=Q.reduce((S,P1,j)=>{ const P2=Q[(j+1)%4]; return S+P1[0]*P2[1]-P2[0]*P1[1]; },0); if(ar<0) Q=Q.reverse();
      x.moveTo(Q[0][0],Q[0][1]); for(let j=1;j<4;j++) x.lineTo(Q[j][0],Q[j][1]); x.closePath(); }
  }
  /* parts: {p:[[x,y,z,r],...], c:color, poly?:true, bias?}; drawn far to near */
  function rigDraw(x,parts,V,u){
    const sc=Math.hypot(x.getTransform().a,x.getTransform().b)*u, shadeOK=sc>1.4;
    const L=parts.map(pt=>{ const pr=pt.p.map(q=>{ const v=V(q[0],q[1],q[2]); return [v[0]*u,v[1]*u,v[2],(q[3]||0)*u]; });
      return {pr,c:pt.c,sh:pt.sh,st:pt.st,poly:pt.poly,d:pr.reduce((s,q)=>s+q[2],0)/pr.length+(pt.bias||0)}; });
    L.sort((a,b)=>b.d-a.d);
    for(const p of L){ x.fillStyle=p.c; x.beginPath();
      if(p.poly){ const P=p.pr, n=P.length, mid=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2]; let m=mid(P[n-1],P[0]); x.moveTo(m[0],m[1]);
        for(let i=0;i<n;i++){ const a=P[i], b=P[(i+1)%n]; if(a[3]===-1) x.lineTo(a[0],a[1]); else { m=mid(a,b); x.quadraticCurveTo(a[0],a[1],m[0],m[1]); } } x.closePath(); }
      else tubePath(x,p.pr);
      x.fill("nonzero"); if(p.st){ x.lineWidth=p.st; x.strokeStyle=p.c; x.lineJoin="round"; x.stroke(); }
      if(p.sh&&!p.poly&&shadeOK){ x.save();
        /* soft steps of shade toward the belly and light along the top, each nested inside the limb */
        x.fillStyle=p.sh[0]; for(const k of [.12,.24,.36]){ x.globalAlpha=.2; x.beginPath(); tubePath(x,p.pr.map(q=>[q[0],q[1]+q[3]*k,q[2],q[3]*(1-k)])); x.fill(); }
        x.fillStyle=p.sh[1]; for(const k of [.3,.45,.58]){ x.globalAlpha=.16; x.beginPath(); tubePath(x,p.pr.map(q=>[q[0],q[1]-q[3]*k,q[2],q[3]*(1-k)])); x.fill(); }
        x.restore(); } }
  }
  /* soft form light on a finished sprite: warm along the top and toward the sun, cool under the belly */
  function rigLight(x,cx,top,bot,w,sunDx,haze){
    x.save(); x.globalCompositeOperation="source-atop";
    const g=x.createLinearGradient(0,top,0,bot); g.addColorStop(0,`rgba(255,214,150,${(.2*(1-(haze||0)*.8)).toFixed(3)})`); g.addColorStop(.3,"rgba(255,214,150,0)"); g.addColorStop(.7,"rgba(20,12,4,0)"); g.addColorStop(1,"rgba(20,12,4,.32)");
    x.fillStyle=g; x.fillRect(0,0,x.canvas.width,x.canvas.height);
    const s=Math.sign(sunDx)||1, h=x.createLinearGradient(cx-s*w*.5,0,cx+s*w*.5,0); h.addColorStop(0,"rgba(20,12,4,.18)"); h.addColorStop(.6,"rgba(255,200,130,0)"); h.addColorStop(1,`rgba(255,200,130,${(.32*(1-(haze||0))).toFixed(2)})`);
    x.fillStyle=h; x.fillRect(0,0,x.canvas.width,x.canvas.height); x.restore();
  }
  /* a leg as a chain of bones hanging from (hx,hy): segs = [[length, angle from straight down (+ = forward), end radius], ...] */
  function earPts(Hh,sd,base,dir,face,len,wid,prof){
    const nz=v=>{ const l=Math.hypot(...v)||1; return v.map(c=>c/l); }, a=nz([dir[0],dir[1],dir[2]*sd]), n=nz([face[0],face[1],face[2]*sd]);
    const wd=nz([a[1]*n[2]-a[2]*n[1],a[2]*n[0]-a[0]*n[2],a[0]*n[1]-a[1]*n[0]]), b=[base[0],base[1],base[2]*sd], P=(s,o)=>Hh(b[0]+a[0]*len*s+wd[0]*o,b[1]+a[1]*len*s+wd[1]*o,b[2]+a[2]*len*s+wd[2]*o,0);
    const L=prof.map(([s,w])=>P(s,w*wid)), R=prof.slice().reverse().map(([s,w])=>P(s,-w*wid)), tip=P(1,0); tip[3]=-1;
    return [...L,tip,...R];
  }
  function legChain(hx,hy,z,r0,segs){ let px=hx, py=hy; const out=[[px,py,z,r0]]; for(const [len,a,r] of segs){ px+=Math.sin(a)*len; py-=Math.cos(a)*len; out.push([px,py,z,r]); } return out; }
  /* ---- a whitetail bolting away from the viewer and bounding into the tall field on the right ---- */
  /* ---- a buck: lifts his head out of the reeds, browses and wanders the field, and now and then steps out onto the lawn, closer and bigger ---- */
  let buck=null, nextBuck=40;
  const fromPhoto=(ix,iy)=>{ const a=scr(ix,iy), g=toGround(a[0],a[1]); return {X:g.Xw,Z:trueZ(g.Dw)}; };
  const fieldPt=()=>fromPhoto(rnd(.6,.95),rnd(.586,.625));
  function lawnPt(){ const ix=rnd(.55,.88); let i=0; while(i<LAWN.length-2&&ix>LAWN[i+1][0]) i++; const a=LAWN[i], b=LAWN[i+1], iy=a[1]+(b[1]-a[1])*(ix-a[0])/(b[0]-a[0]); return fromPhoto(ix,iy+rnd(.035,.09)); }
  function startBuck(){
    const s=fromPhoto(rnd(.64,.94),rnd(.588,.605)), plan=[{k:"head",to:0,dur:1.8},{k:"look",dur:rnd(3,5)}];
    const n=2+Math.floor(Math.random()*3), visit=Math.random()<.45, at=visit? 1+Math.floor(Math.random()*(n-1)) : -1;
    for(let i=0;i<n;i++){
      if(i===at){ const L=lawnPt(); plan.push({k:"walk",...L},{k:"look",dur:rnd(3,6)},{k:"head",to:.95,dur:1.2},{k:"look",dur:rnd(2,4)},{k:"head",to:0,dur:1},{k:"look",dur:rnd(2,3)},{k:"walk",...fieldPt()}); }
      else { plan.push({k:"walk",...fieldPt()},{k:"look",dur:rnd(2,4)}); if(Math.random()<.5) plan.push({k:"head",to:1,dur:1.4},{k:"look",dur:rnd(2,4)},{k:"head",to:0,dur:1.4}); }
    }
    plan.push({k:"head",to:1,dur:1.6},{k:"fade"});
    buck={X:s.X,Z:s.Z,yaw:rnd(0,6.28),hd:1,hy:0,hyT:0,q:0,plan,cur:null,t:0,alpha:1,walking:false};
  }
  function stepBuck(dt){
    if(!buck){ nextBuck-=dt; if(nextBuck<=0){ if(herd.length||buck2) nextBuck=12; else startBuck(); } return; }   /* only one buck out at a time */
    const b=buck; if(!b.cur){ b.cur=b.plan.shift(); b.t=0; b.h0=b.hd; if(!b.cur){ buck=null; nextBuck=rnd(70,160); return; } }
    const c=b.cur; b.t+=dt; b.walking=false;
    if(c.k==="head"){ const u=Math.min(1,b.t/c.dur), e=u*u*(3-2*u); b.hd=lerp(b.h0,c.to,e); if(u>=1) b.cur=null; }
    else if(c.k==="look"){ b.jt=(b.jt||0)-dt; if(b.jt<=0){ b.jt=rnd(.9,2.4); b.hyT=Math.random()<.4? camYaw(b.yaw)*.8 : rnd(-1,1); }
      if(b.t>=c.dur) b.cur=null; }
    else if(c.k==="walk"){
      /* walks the way a deer does: turns in an arc as it goes, eases off to turn hard, steps match the ground covered, the head nods */
      const dX=c.X-b.X, dZ=c.Z-b.Z, d=Math.hypot(dX,dZ), want=Math.atan2(dZ,dX), off=Math.abs(Math.atan2(Math.sin(want-b.yaw),Math.cos(want-b.yaw)));
      b.yaw=angTo(b.yaw,want,dt*1.1); b.hyT=Math.sin(b.q*.5)*.15; b.hd=lerp(b.hd,.1+.06*Math.sin(b.q*2),Math.min(1,dt*3));
      b.v=lerp(b.v||0,(d<.25? .1 : .2)*Math.max(.25,Math.cos(Math.min(off,1.4))),Math.min(1,dt*2));
      if(d<.04){ b.cur=null; b.v=0; } else { const st=Math.min(d,b.v*dt); b.X+=Math.cos(b.yaw)*st; b.Z+=Math.sin(b.yaw)*st; b.q+=st/.21*Math.PI*2; b.walking=b.v>.03; } }
    else if(c.k==="fade"){ b.alpha=Math.max(0,b.alpha-dt/1.2); if(b.alpha<=0){ buck=null; nextBuck=rnd(70,160); return; } }
    b.hy+=(b.hyT-b.hy)*Math.min(1,dt*7);
    const s=toScreen(b.X,b.Z*GF/FOC()), into=lawnMinG(s.x)-s.g; b.fa=Math.max(0,Math.min(1,1-(into+6)/46)); b.onLawn=b.fa>0;
  }
  function buckPose(){ const b=buck, Dw=b.Z*GF/FOC(), s=toScreen(b.X,Dw); return {x:s.x,y:s.y,g:s.g,Xw:b.X,Dw,lift:0,leapU:null,stand:!b.walking,walk:b.walking,antlers:true,hd:b.hd,hy:b.hy,q:b.q}; }
  /* ---- a second buck, far off behind the brush on the left: only his back, neck and rack show over the cover as he browses and wanders ---- */
  let buck2=null, nextBuck2=30;
  const leftPt=()=>fromPhoto(rnd(.03,.25),rnd(.624,.633));
  function startBuck2(){
    const s=leftPt(), plan=[{k:"head",to:0,dur:1.8},{k:"look",dur:rnd(3,5)}], n=3+Math.floor(Math.random()*3);
    for(let i=0;i<n;i++){ plan.push({k:"walk",...leftPt()},{k:"look",dur:rnd(2,5)}); if(Math.random()<.6) plan.push({k:"head",to:1,dur:1.4},{k:"look",dur:rnd(3,6)},{k:"head",to:0,dur:1.4}); }
    plan.push({k:"head",to:1,dur:1.6},{k:"fade"});
    buck2={X:s.X,Z:s.Z,yaw:rnd(0,6.28),hd:1,hy:0,hyT:0,q:0,plan,cur:null,t:0,alpha:0,walking:false,fin:true};
  }
  function stepBuck2(dt){
    if(!buck2){ nextBuck2-=dt; if(nextBuck2<=0){ if(buck) nextBuck2=12; else startBuck2(); } return; }
    const b=buck2; if(b.fin){ b.alpha=Math.min(1,b.alpha+dt/1.5); if(b.alpha>=1) b.fin=false; }   /* eases into view as he lifts out of the cover */
    if(!b.cur){ b.cur=b.plan.shift(); b.t=0; b.h0=b.hd; if(!b.cur){ buck2=null; nextBuck2=rnd(90,200); return; } }
    const c=b.cur; b.t+=dt; b.walking=false;
    if(c.k==="head"){ const u=Math.min(1,b.t/c.dur), e=u*u*(3-2*u); b.hd=lerp(b.h0,c.to,e); if(u>=1) b.cur=null; }
    else if(c.k==="look"){ b.jt=(b.jt||0)-dt; if(b.jt<=0){ b.jt=rnd(.9,2.4); b.hyT=Math.random()<.4? camYaw(b.yaw)*.8 : rnd(-1,1); } if(b.t>=c.dur) b.cur=null; }
    else if(c.k==="walk"){ const dX=c.X-b.X, dZ=c.Z-b.Z, d=Math.hypot(dX,dZ), want=Math.atan2(dZ,dX), off=Math.abs(Math.atan2(Math.sin(want-b.yaw),Math.cos(want-b.yaw)));
      b.yaw=angTo(b.yaw,want,dt*1.1); b.hyT=Math.sin(b.q*.5)*.15; b.hd=lerp(b.hd,.1+.06*Math.sin(b.q*2),Math.min(1,dt*3));
      b.v=lerp(b.v||0,(d<.25? .1 : .2)*Math.max(.25,Math.cos(Math.min(off,1.4))),Math.min(1,dt*2));
      if(d<.04){ b.cur=null; b.v=0; } else { const st=Math.min(d,b.v*dt); b.X+=Math.cos(b.yaw)*st; b.Z+=Math.sin(b.yaw)*st; b.q+=st/.21*Math.PI*2; b.walking=b.v>.03; } }
    else if(c.k==="fade"){ b.alpha=Math.max(0,b.alpha-dt/1.2); if(b.alpha<=0){ buck2=null; nextBuck2=rnd(90,200); return; } }
    b.hy+=(b.hyT-b.hy)*Math.min(1,dt*7);
  }
  function buck2Pose(){ const b=buck2, Dw=b.Z*GF/FOC(), s=toScreen(b.X,Dw), g=s.g*.62; return {x:s.x,y:s.y-15*.42*g/44,g,Xw:b.X,Dw,lift:0,leapU:null,stand:!b.walking,walk:b.walking,antlers:true,hd:b.hd,hy:b.hy,q:b.q}; }
  /* ---- whitetails spooked off the lawn: two to four bound into the field and away from you, flags up, rising and falling over the reeds ---- */
  let herd=[], nextDeer=20;
  let deer=null;                                                   /* kept for older checks: the lead deer, if any */
  const dsp=document.createElement("canvas"), dsx=dsp.getContext("2d");
  function lawnEdgeY(ix){ let i=0; while(i<LAWN.length-2&&ix>LAWN[i+1][0]) i++; const a=LAWN[i], b=LAWN[i+1]; return a[1]+(b[1]-a[1])*(ix-a[0])/(b[0]-a[0]); }
  function startDeer(){
    if(buck&&buck.onLawn){ nextDeer=15; return; }
    const r=Math.random(), n= r<.2?1 : r<.55?2 : r<.85?3 : 4, base=rnd(.68,.86), drift=(Math.random()<.5?-1:1)*rnd(.06,.16);
    herd=[];
    for(let i=0;i<n;i++){
      const ix=Math.max(.64,Math.min(.92,base+rnd(-.06,.06))), a=fromPhoto(ix,lawnEdgeY(ix)+rnd(.07,.14)), ex=Math.max(.64,Math.min(.97,ix+drift+rnd(-.04,.04))), e=fromPhoto(ex,rnd(.586,.6)), mx=Math.max(.64,(ix+ex)/2+rnd(-.05,.05)), m=fromPhoto(mx,lerp(lawnEdgeY(ix),.6,.55));
      const L=Math.hypot(e.X-a.X,e.Z-a.Z)+Math.hypot(m.X-a.X,m.Z-a.Z)*.3;
      herd.push({a,m,e,L,s:0,u:rnd(.1,.3),cyc:rnd(.95,1.15),v:rnd(1.0,1.25),delay:i*rnd(.25,.55),alpha:0,yaw:Math.atan2(e.Z-a.Z,e.X-a.X),fa:1});
    }
    deer=herd[0];
  }
  function deerPose(d){
    const s=d.s, w=1-s, X=w*w*d.a.X+2*w*s*d.m.X+s*s*d.e.X, Z=w*w*d.a.Z+2*w*s*d.m.Z+s*s*d.e.Z, Dw=Z*GF/FOC(), sc=toScreen(X,Dw);
    return {x:sc.x,y:sc.y,g:sc.g,Xw:X,Dw,lift:boundLift(d.u)*.62,leapU:d.u,q:0,ph:0};
  }
  function stepHerd(dt){
    if(!herd.length){ nextDeer-=dt; if(nextDeer<=0) startDeer(); deer=null; return; }
    for(const d of herd){
      if(d.delay>0){ d.delay-=dt; continue; }
      const flying=d.u>=.28&&d.u<=.95; d.u+=dt/d.cyc; if(d.u>=1){ d.u-=1; d.cyc=rnd(.88,1.15); }
      const sp=d.v*(flying?1.25:.45)*(1-.35*d.s);                    /* each bound covers ground in the air, less on the ground; slows a touch as it tires */
      const s0=d.s; d.s=Math.min(1,d.s+sp*dt/d.L);
      const P0=deerPose(Object.assign({},d,{s:s0})), P1=deerPose(d), dX=P1.Xw-P0.Xw, dZ=trueZ(P1.Dw)-trueZ(P0.Dw);
      if(Math.hypot(dX,dZ)>1e-6) d.yaw=angTo(d.yaw,Math.atan2(dZ,dX),dt*5);
      d.alpha= d.s>.8? Math.max(0,(1-d.s)/.2) : Math.min(1,(d.alpha||0)+dt*3);
      d.p=P1; const into=lawnMinG(P1.x)-P1.g; d.fa=Math.max(0,Math.min(1,1-(into+6)/46));
      if(d.s>=1) d.done=true;
    }
    herd=herd.filter(d=>!d.done); deer=herd[0]||null; if(!herd.length) nextDeer=rnd(90,180);
  }

  /* a whitetail's bound, keyframed: land on the forelegs, gather, drive off the hind legs, sail with the forelegs tucked, reach for the ground */
  const BOUND=[[0,-.18,[.55,.45,.4],[.9,.1,.5]],[.15,-.05,[-.25,-.35,-.3],[.75,-.3,.25]],[.3,.25,[.3,-1.4,-1.9],[-.45,-1.0,-1.2]],[.6,.02,[.9,-1.6,-2.2],[-.3,-.9,-.6]],[.85,-.15,[.9,.3,.4],[.5,-.6,.1]],[1,-.18,[.55,.45,.4],[.9,.1,.5]]];
  function boundKey(u){ u=((u%1)+1)%1; let i=0; while(i<BOUND.length-2&&u>BOUND[i+1][0]) i++; const a=BOUND[i], b=BOUND[i+1], e0=(u-a[0])/(b[0]-a[0]), e=e0*e0*(3-2*e0), L=(x,y)=>x+(y-x)*e;
    return {pitch:L(a[1],b[1]), f:a[2].map((v,j)=>L(v,b[2][j])), h:a[3].map((v,j)=>L(v,b[3][j]))}; }
  const boundLift=u=>u>=.28&&u<=.95? Math.sin(Math.PI*(u-.28)/.67) : 0;
  function deerParts(p,yaw,C){
    const leap=p.leapU!=null, walk=!!p.walk, stand=!!p.stand||walk, q=p.q||0, parts=[], far=z=>z*Math.cos(yaw)>0;
    const K=leap? boundKey(p.leapU) : null;
    const bounce=leap||stand? (walk?Math.abs(Math.sin(q*2))*.35:0) : Math.max(0,Math.sin(q))*2.4, pitchB=stand? 0 : leap? K.pitch : Math.sin(q+.6)*.07;
    const T=(x,y)=>{ const c=Math.cos(pitchB), s=Math.sin(pitchB), dy=y-25; return [x*c-dy*s, 25+bounce+x*s+dy*c]; };
    const B=(x,y,z,r)=>{ const t=T(x,y); return [t[0],t[1],z,r]; };
    /* legs: slim, knobbed at the joints, lighter toward the hooves */
    const legs=walk? [[9,23.5,-2.6,Math.PI/2,0],[9,23.5,2.6,Math.PI*1.5,0],[-11.5,25,-3.1,0,1],[-11.5,25,3.1,Math.PI,1]] : [[9,23.5,-2.6,0,0],[9,23.5,2.6,.35,0],[-11.5,25,-3.1,Math.PI,1],[-11.5,25,3.1,Math.PI+.35,1]];
    for(const [lx,ly,z,ph,hind] of legs){
      const sw=walk? Math.sin(q+ph)*.42 : leap||stand?0:Math.sin(q+ph), lift=walk? Math.max(0,-Math.cos(q+ph))*.55 : leap||stand?0:Math.max(0,-Math.cos(q+ph)), top=T(lx,ly), fz=far(z);
      let segs;
      if(leap){ const k=boundKey((p.leapU+(z<0?.035:0))%1), A=hind?k.h:k.f, pb=pitchB; segs=hind? [[8.5,A[0]-pb,2.6],[8.5,A[1]-pb,1.45],[9,A[2]-pb,.95]] : [[8,A[0]-pb,2.1],[8,A[1]-pb,1.35],[8,A[2]-pb,.95]]; }
      else if(hind){ const a=.65*sw; segs=[[8.5,.35+a,2.6],[8.5,-.6+a-lift*.5,1.45],[9,.05+a+lift*.6,.95]]; }
      else { const a=.7*sw; segs=[[8,-.15+a,2.1],[8,.05+a-lift*1.6,1.35],[8,a-lift*1.9,.95]]; }
      const ch=legChain(top[0],top[1],z,hind?5.6:3.9,segs);
      parts.push({p:ch.slice(0,2),c:fz?C.coatFar:C.coat,sh:fz?null:C.sh},{p:ch.slice(1,3),c:fz?C.legFar:C.leg},{p:ch.slice(2),c:fz?C.legFar:C.legLow});
      const e=ch[3], b2=ch[2], dx=e[0]-b2[0], dy=e[1]-b2[1], L=Math.hypot(dx,dy)||1;
      parts.push({p:[[e[0]-dx/L*1.4,e[1]-dy/L*1.4,z,1.0],[e[0]+.5,e[1]-.2,z,.85]],c:C.hoof,bias:-.01});
    }
    /* body: deep chest, the belly tucked up toward the flank, a straight back */
    const tor=[[-14,26.6,6.0],[-10,26,7.0],[-4,26.2,6.5],[2,25.2,7.5],[7.5,24.8,8.0],[10.5,27.4,6.4]];
    parts.push({p:[B(-6,21.4,0,3.1),B(5,20.2,0,3.5)],c:C.white,bias:4});
    parts.push({p:tor.map(([a,b,r])=>B(a,b,0,r)),c:C.coat,sh:C.sh});
    parts.push({p:[B(-15.9,27.6,0,2.0),B(-17.1,24.6,0,2.9),B(-16.5,21.2,0,2.1)],c:C.white});
    /* neck thick at the shoulders, head high and alert, nodding with the bounds */
    const hd=p.hd||0, hc0=T(lerp(16.4,19,hd),lerp(39+(leap?1:stand?0:Math.sin(q)*.6),13,hd)), hc=[hc0[0],hc0[1],0];
    const n0=B(10.6,28.4,0,5.6), n1=[lerp(n0[0],hc[0],.38)-.3,lerp(n0[1],hc[1],.38),0,4.3], n2=[lerp(n0[0],hc[0],.72)-.2,lerp(n0[1],hc[1],.72),0,3.3];
    parts.push({p:[n0,n1,n2,[hc[0]-.5,hc[1]-.5,0,2.9]],c:C.coat,sh:C.sh});
    parts.push({p:[[n2[0]+1.9,n2[1]-1.2,0,1.05],[n2[0]+1.5,n2[1]+.6,0,.95]],c:C.white,bias:-.5});
    const hp=.15+pitchB*.5+hd*1.2, hy=p.hy||0, H_=(u,v,w,r)=>{ const t=headPt(hc,hp,hy,u,v,w); return [t[0],t[1],t[2],r]; };
    parts.push({p:[H_(-.2,.1,0,3.1),H_(1.7,-.3,0,2.95),H_(4.2,-1.35,0,2.15),H_(6.4,-2.15,0,1.55),H_(7.8,-2.55,0,1.2)],c:C.coat,sh:C.sh});
    parts.push({p:[H_(6.6,-2.45,0,1.25)],c:C.muzzle,bias:-.3},{p:[H_(6.0,-3.2,0,.85)],c:C.muzzle,bias:-.3},{p:[H_(8.25,-2.5,0,.8)],c:C.nose,bias:-.4});
    for(const sd of [-1,1]){
      parts.push({p:[H_(2.0,.6,2.1*sd,.62)],c:C.flank,bias:-.45},{p:[H_(2.1,.6,2.25*sd,.42)],c:C.nose,bias:-.5});
      parts.push({poly:true,p:earPts(H_,sd,[-.4,2.3,1.6],[-.35,.75,.55],[.75,.1,.55],7.2,2.3,[[0,.45],[.3,1],[.65,.8]]),c:far(sd)?C.coatFar:C.ear});
      parts.push({poly:true,p:earPts(H_,sd,[-.1,2.6,1.75],[-.35,.75,.55],[.75,.1,.55],5.6,1.4,[[0,.3],[.35,1],[.7,.6]]),c:far(sd)?C.coatFar:C.earIn,bias:-.02*sd*Math.cos(yaw)});
    }
    if(p.antlers) for(const sd of [-1,1]){ const A=C.antler, T2=(pts)=>parts.push({p:pts.map(([u,v,w,r])=>H_(u,v,w*sd,r)),c:A,bias:-.25});
      T2([[0,2.6,1.2,.62],[-1.2,5.2,4.2,.56],[-.4,8.2,7.4,.5],[2.4,10.0,8.2,.42],[5.2,10.0,6.6,.34],[6.8,9.4,4.6,.24]]);
      T2([[-.6,4.0,2.8,.34],[.4,6.8,3.3,.17]]); T2([[-.6,8.0,7.1,.4],[-.9,12.8,7.5,.2]]); T2([[1.8,9.8,8.1,.36],[2.1,14.3,8.5,.18]]); T2([[4.4,10.1,7.1,.3],[4.8,13.3,7.2,.16]]); }
    if(p.spots) for(const sd of [-1,1]) for(const [sx2,sy2] of [[-11,30.4],[-8,31.4],[-5,31],[-2,31.6],[1,31],[4,31.6],[-9.5,28.6],[-6.5,29.2],[-3.5,28.8],[-.5,29.4],[2.5,29]]) parts.push({p:[B(sx2,sy2,sd*3.6,.85)],c:C.white,bias:-.4});   /* a fawn's white spots */
    if(stand && !p.flag){ parts.push({p:[T(-15.2,28.4).concat([0,1.4]),T(-17,25.5).concat([0,1.6]),T(-17.6,23).concat([0,1.1])].map(v=>[v[0],v[1],0,v[3]]),c:C.coatFar}); return parts; }
    /* the white flag: up and flared, flicking side to side, brown along its top */
    const tb=T(-15.2,28.4); let tp=[tb[0],tb[1],0]; const tw=[[...tp,1.6]], tbk=[[tp[0]+1.1,tp[1],0,1.1]];
    for(let i=0;i<4;i++){ const va=(leap?1.2:1.05)+i*.14+Math.sin(t*7-i*.6)*.06, la=Math.sin(t*6.3-i*.5)*.22;
      tp=[tp[0]-Math.cos(va)*1.9*Math.cos(la), tp[1]+Math.sin(va)*1.9, tp[2]+Math.cos(va)*1.9*Math.sin(la)+Math.sin(la)*.4];
      tw.push([...tp,[2.0,2.5,2.3,1.4][i]]); tbk.push([tp[0]+1.5,tp[1]-.2,tp[2],[1.0,1.2,1.0,.55][i]]); }
    parts.push({p:tbk,c:C.coatFar,bias:.6*Math.abs(Math.sin(yaw))-.4},{p:tw,c:C.white});
    return parts;
  }
  const drim=document.createElement("canvas"), drx=drim.getContext("2d");
  /* a thin rim of low sun along the edges that face it: the animal minus itself shifted toward the light */
  function rimLight(x,w,h,vx,vy,col){
    if(drim.width<w||drim.height<h){ drim.width=Math.max(w,drim.width); drim.height=Math.max(h,drim.height); }
    drx.setTransform(1,0,0,1,0,0); drx.globalCompositeOperation="source-over"; drx.clearRect(0,0,drim.width,drim.height);
    drx.drawImage(x.canvas,0,0,w,h,0,0,w,h); drx.globalCompositeOperation="source-in"; drx.fillStyle=col; drx.fillRect(0,0,w,h);
    drx.globalCompositeOperation="destination-out"; drx.drawImage(x.canvas,0,0,w,h,-vx,-vy,w,h);
    x.save(); x.setTransform(1,0,0,1,0,0); x.globalCompositeOperation="source-atop"; x.drawImage(drim,0,0,w,h,0,0,w,h); x.restore();
  }
  function paintDeer(p,dark,who){
    const u=.42*p.g/44, R=.7, w=Math.ceil(110*u*R), h=Math.ceil(90*u*R);
    if(dsp.width<w||dsp.height<h){ dsp.width=Math.max(w,dsp.width); dsp.height=Math.max(h,dsp.height); }
    const x=dsx; x.setTransform(1,0,0,1,0,0); x.clearRect(0,0,dsp.width,dsp.height);
    const ax=w*.5, ay=h*.86; x.translate(ax,ay);
    const lit=dark?.32:.42, C1=c=>rgb(mulv(c,lit));
    const C={antler:C1([196,178,146]), muzzle:rgb(mulv([226,216,198],lit*1.15)), coat:C1(p.antlers?[116,92,70]:[132,96,64]), coatFar:C1([96,76,58]), dorsal:C1([98,76,57]), flank:C1([146,118,90]), ear:C1([132,106,82]), earIn:C1([168,146,124]),
      sh:[C1([70,50,34]),rgb(mixv(mulv([132,96,64],lit),[255,196,120],.18))], leg:C1([138,110,82]), legLow:C1([152,124,94]), legFar:C1([104,84,64]), hoof:C1([34,26,20]), nose:C1([22,18,15]), white:rgb(mulv([244,238,226],dark?.45:.64))};
    /* contact shadow, fading as it leaves the ground */
    x.save(); x.globalAlpha=.4*(1-p.lift); x.fillStyle="rgba(30,22,12,.6)"; x.scale(1,.22); x.beginPath(); x.arc(0,0,20*u*R,0,6.283); x.fill(); x.restore();
    x.translate(0,-p.lift*.42*p.g*.5*R);
    rigDraw(x,deerParts(p,who.yaw,C),rigView(who.yaw,viewPitch(p.Dw,.2)),u*R);
    x.setTransform(1,0,0,1,0,0);
    rigLight(x,ax,ay-46*u*R,ay,40*u*R,sun().x-p.x,0);
    { const sp=sun(), dx=sp.x-p.x, dy=sp.y-p.y, L=Math.hypot(dx,dy)||1, k=Math.max(1,u*R*1.1); rimLight(x,w,h,dx/L*k,dy/L*k,`rgba(255,214,150,${(.6*Math.min(1,u*R/4)).toFixed(2)})`); }
    x.globalCompositeOperation="source-atop";
    if(SC.dim()){ x.fillStyle="rgba(20,14,6,.14)"; x.fillRect(0,0,w,h); }
    else { const tn=tint(); if(tn.a>0){ x.globalAlpha=tn.a; x.fillStyle=tn.c; x.fillRect(0,0,w,h); x.globalAlpha=1; } }
    x.globalCompositeOperation="source-over";
    ctx.save(); ctx.globalAlpha=who.alpha; ctx.drawImage(dsp,0,0,w,h,p.x-ax/R,p.y-ay/R,w/R,h/R); ctx.restore();
  }
  /* when the buck comes out close on the lawn, any dog nearby bolts off the other way */
  function dogsFlee(){
    if(!buck||!buck.onLawn) return; const bp=buckPose();
    for(const d of [dog,lab]){ if(!d||d.gone||d.flee||d.hidden||d.state==="greet"||d.toViewer) continue;
      const s=toScreen(d.Xw,d.Dw); if(Math.hypot(s.x-bp.x,(s.y-bp.y)*1.5)>W*.4) continue;
      d.flee=true; d.romp=0; d.it=false; d.state="leave"; d.scratching=false; d.ang=null;
      const p=toGround(s.x<bp.x? -160 : W+160,gnd().vy+s.g); d.tX=p.Xw; d.tD=p.Dw; }
  }
  function drawDeer(dt,dark,layer){
    if(layer==="front"){ stepBuck(dt); stepBuck2(dt); stepHerd(dt); dogsFlee(); }
    if(layer==="behind"&&buck2) paintDeer(buck2Pose(),dark,buck2);   /* painted before the left brush, so the brush hides his legs */
    const L=[];
    if(buck) L.push({who:buck,p:buckPose()});
    for(const d of herd) if(d.p&&d.delay<=0) L.push({who:d,p:d.p});
    L.sort((a,b)=>a.p.y-b.p.y);
    for(const {who,p} of L){
      const fa=who.fa==null?1:who.fa;
      if(layer==="front"){ if(fa>0) paintDeer(p,dark,{yaw:who.yaw,alpha:who.alpha*fa}); }
      else if(fa<1) paintDeer(p,dark,who);
    }
  }

  /* ---- a red fox: darts in, stops, sniffs, snaps its head around, darts off another way, toward you and away, then leaves ---- */
  let fox=null, nextFox=45;
  const fsp=document.createElement("canvas"), fsx=fsp.getContext("2d");
  const FOX_G=[255,560];
  function foxBounds(){ return {gmin:FOX_G[0],gmax:Math.min(FOX_G[1],H-gnd().vy-8)}; }
  /* where the lawn meets the tall reeds, traced from the photo (x, y as fractions of the picture) */
  const LAWN=[[0,.676],[.285,.663],[.45,.684],[.65,.71],[.85,.752],[1,.797]];
  function lawnMinG(sx){ const ip=toImg(sx,0); const ix=ip?Math.max(0,Math.min(1,ip[0])):sx/W; let i=0; while(i<LAWN.length-2&&ix>LAWN[i+1][0]) i++;
    const a=LAWN[i], b=LAWN[i+1], iy=a[1]+(b[1]-a[1])*(ix-a[0])/(b[0]-a[0]), y=scr(ix,iy)[1]; return Math.min(y-gnd().vy+14, foxBounds().gmax-45); }
  function keepOnLawn(o){ const s=toScreen(o.Xw,o.Dw), m=lawnMinG(s.x), M=foxBounds().gmax; if(s.g<m){ const p=toGround(s.x,gnd().vy+m); o.Xw=p.Xw; o.Dw=p.Dw; } else if(s.g>M){ const p=toGround(s.x,gnd().vy+M); o.Xw=p.Xw; o.Dw=p.Dw; } }
  function idleYawFor(y){ const r=Math.random(); return r<.38? -Math.PI/2+rnd(-.7,.7) : r<.66? Math.PI/2+rnd(-.7,.7) : y+rnd(-1.3,1.3); }
  function idleTurn(f,dt,moving){ f.turning=false;
    if(!moving&&f.idleYaw!=null){ const dlt=Math.atan2(Math.sin(f.idleYaw-f.yaw),Math.cos(f.idleYaw-f.yaw));
      if(Math.abs(dlt)>.06){ f.yaw=angTo(f.yaw,f.idleYaw,dt*1.1); f.turning=true; f.ph+=dt*3.2*(f.cad||1); f.head+=(0-f.head)*Math.min(1,dt*6); } } }
  function foxTarget(f){
    const b=foxBounds(); let tries=0, Xw, Dw, ang;
    const cur=toScreen(f.Xw,f.Dw), mid=(b.gmin+b.gmax)/2, nearNow=cur.g>mid;
    do{ const sx=Math.max(W*.08,Math.min(W*.92,cur.x+W*rnd(-.16,.16))), lo=Math.max(b.gmin,lawnMinG(sx)), md=Math.max(lo+20,mid), g=nearNow? rnd(lo,lerp(lo,md,.7)) : rnd(lerp(md,b.gmax,.3),b.gmax), p=toGround(sx,gnd().vy+g); Xw=p.Xw; Dw=p.Dw;
        ang=Math.atan2(Dw-f.Dw,Xw-f.Xw); tries++; }
    while(tries<12 && (Math.hypot(Xw-f.Xw,(Dw-f.Dw)*.25)<.35 || (f.ang!=null && Math.abs(Math.atan2(Math.sin(ang-f.ang),Math.cos(ang-f.ang)))<.8)));
    f.tX=Xw; f.tD=Dw; f.ang=ang;
  }
  function startFox(){
    const b=foxBounds(), g=rnd(b.gmin+30,b.gmax-20), p=toGround(-60,gnd().vy+g);
    fox={Xw:p.Xw,Dw:p.Dw,state:"run",t:rnd(.8,1.4),cycles:3+Math.floor(Math.random()*3),head:0,headT:0,turn:0,turnT:0,jerk:0,ph:0,sniff:0,face:1,fore:1,alpha:1};
    const q=toGround(W*rnd(.2,.4),gnd().vy+g); fox.tX=q.Xw; fox.tD=q.Dw; fox.ang=0; arrive(-60,fox);
  }
  function foxStep(f,dt){
    if(f.state==="run"||f.state==="leave"){
      const sp=(f.state==="leave"?1.0:.85)*(f.spd||1), dX=f.tX-f.Xw, dD=f.tD-f.Dw, dist=Math.hypot(dX,dD*.25)||1e-6;
      const stepX=dX/dist*sp*dt, stepD=dD/dist*sp*dt*4;                 /* depth runs a little quicker so it really comes toward you or heads off */
      const pr=f.lp? Math.hypot(f.Xw-f.lp[0],(f.Dw-f.lp[1])*.25) : 1; f.lp=[f.Xw,f.Dw]; f.stl= pr<sp*dt*.2? (f.stl||0)+dt : 0;
      if(f.stl>.8){ f.stl=0; if(f.state==="leave") f.fade=true; else { f.tX=f.Xw; f.tD=f.Dw; } }
      if(f.fade){ f.alpha-=dt*2.5; if(f.alpha<=0) f.gone=true; }
      const before=toScreen(f.Xw,f.Dw);
      if(Math.hypot(dX,dD*.25)<=sp*dt){ f.Xw=f.tX; f.Dw=f.tD; } else { f.Xw+=stepX; f.Dw+=Math.sign(stepD)*Math.min(Math.abs(stepD),Math.abs(dD)); }
      const after=toScreen(f.Xw,f.Dw), vx=after.x-before.x, vy=after.y-before.y, v=Math.hypot(vx,vy)||1e-6;
      if(Math.abs(vx)>.05) f.face=vx>0?1:-1;
      f.fore=Math.max(.4,Math.min(1,Math.abs(vx)/v*1.1));                /* coming toward or going away: the body shortens */
      f.ph+=dt*6.2*(f.cad||1); f.head+=(-.1-f.head)*Math.min(1,dt*10); f.turn+=(0-f.turn)*Math.min(1,dt*10);
      f.t-=dt;
      const arrived=f.Xw===f.tX&&f.Dw===f.tD;
      if(f.state==="leave"){ const s=toScreen(f.Xw,f.Dw); if(arrived||s.x<-80||s.x>W+80){ f.alpha-=dt*3; if(f.alpha<=0) f.gone=true; } return; }
      if(arrived||f.t<=0){ f.state="sniff"; f.t=rnd(1.2,2.6); f.sniff=0; f.idleYaw=idleYawFor(f.yaw||0); }
      return;
    }
    if(f.state==="sniff"){ f.head+=(1-f.head)*Math.min(1,dt*9); f.turn+=(0-f.turn)*Math.min(1,dt*8); f.sniff+=dt; f.t-=dt;
      if(f.t<=0){ f.state="look"; f.t=rnd(1.2,2.4); f.jerk=0; if(Math.random()<.6) f.idleYaw=idleYawFor(f.idleYaw??f.yaw??0); } return; }
    if(f.state==="look"){
      /* quick snaps between glances, holding still in between */
      f.jerk-=dt; if(f.jerk<=0){ f.jerk=rnd(.22,.6); f.headT=pick([-.45,-.3,-.15,-.5]); { const cy=camYaw(f.yaw||0); f.turnT=pick([0,-.7,.7,cy,cy,cy*.5]); } }
      f.head+=(f.headT-f.head)*Math.min(1,dt*28); f.turn+=(f.turnT-f.turn)*Math.min(1,dt*28); f.t-=dt;
      if(f.t<=0){ f.cycles--;
        if(f.cycles<=0){ f.state="leave"; const g=toScreen(f.Xw,f.Dw).g; const side=Math.random(); const p= side<.5? toGround(-120,gnd().vy+g) : toGround(W+120,gnd().vy+g); f.tX=p.Xw; f.tD=p.Dw; f.ang=null; }
        else { f.state="run"; f.t=rnd(.7,1.5); foxTarget(f); } }
    }
  }
  function foxParts(f,P,running){
    const q=f.ph*Math.PI*1.3, yaw=f.yaw, far=z=>z*Math.cos(yaw)>0, parts=[];
    const sh=[rgb(mulv(P.coat,.7)),rgb(mixv(P.coat,[255,200,130],.3))], coat=rgb(P.coat), coatFar=rgb(mulv(P.coat,.78)), dk=rgb(P.dark), dkFar=rgb(mulv(P.dark,.8)), wh=rgb(P.white);
    const bob=running? Math.max(0,Math.sin(q))*1.4 : 0, pitchB=running? Math.sin(q+.5)*.06 : (f.state==="sniff"? .1 : 0);
    const LG=f.cy?1.28:1, UP=(LG-1)*12;                                                                              /* the coyote stands taller on longer legs */
    const T=(x,y)=>{ const c=Math.cos(pitchB), s=Math.sin(pitchB), dy=y-12; return [x*c-dy*s, 12+UP+bob+x*s+dy*c]; };
    const B=(x,y,z,r)=>{ const t=T(x,y); return [t[0],t[1],z,r]; };
    /* legs: a bounding gallop, black stockings below the knee */
    for(const [lx,ly,z,ph,hind] of [[7.5,11.5,-2.1,0,0],[7.5,11.5,2.1,.4,0],[-8.5,12,-2.4,Math.PI,1],[-8.5,12,2.4,Math.PI+.4,1]]){
      const sw=running?Math.sin(q+ph):0, lift=running?Math.max(0,-Math.cos(q+ph)):0, top=T(lx,ly);
      const segs= hind? [[4.2,.35+.6*sw,1.5],[4.6,-.55+.6*sw-lift*.6,1.0],[3.6,.1+.6*sw+lift*.4,.75]] : [[4.4,-.1+.65*sw,1.4],[5.0,.65*sw-lift*1.4,.95],[1.5,.3+.65*sw-lift*1.7,.75]];
      if(LG!==1) for(const sg of segs) sg[0]*=LG;
      const ch=legChain(top[0],top[1],z,hind?3.0:2.2,segs);
      parts.push({p:ch.slice(0,2),c:far(z)?coatFar:coat},{p:ch.slice(1),c:far(z)?dkFar:dk});
    }
    parts.push({p:[B(-10,12.6,0,3.8),B(-5.5,12.3,0,4.4),B(0,12.2,0,4.5),B(5,12.8,0,4.6),B(8.5,13.6,0,4.0)],c:coat,sh});
    /* neck and head: down to the grass to sniff, up and snapping around when it looks */
    const hd=f.head, hc0=T(lerp(13.6,15.2,Math.max(0,hd))-Math.min(0,hd)*-.5, lerp(18.6,5.2,Math.max(0,hd))-Math.min(0,hd)*3), hc=[hc0[0],hc0[1],0];
    const nb=B(8.6,14.4,0,3.4), nm=[(nb[0]+hc[0])/2-.4,(nb[1]+hc[1])/2+.3,0,2.8];
    parts.push({p:[nb,nm,[hc[0]-.6,hc[1]-.3,0,2.4]],c:coat});
    parts.push({p:[B(9.6,11.4,0,2.1),[nm[0]+.9,nm[1]-1.6,0,1.7]],c:wh,bias:-.6});
    const sn=f.state==="sniff"? Math.sin(f.sniff*14)*.25 : 0, hp=hd*.9+.12+sn*.2, hy=f.turn;
    const Hh=(u,v,w,r)=>{ if(f.cy&&u>1.5) u=1.5+(u-1.5)*1.22; const t=headPt(hc,hp,hy,u,v,w); return [t[0],t[1],t[2],r]; };   /* a longer, narrower muzzle on the coyote */
    parts.push({p:[Hh(-.2,0,0,3.0),Hh(1.2,.1,0,2.8),Hh(2.7,-.5,0,1.9),Hh(4.7,-.9,0,1.15),Hh(5.8+sn,-1.05,0,.62)],c:coat});
    parts.push({p:[Hh(.5,-1.6,0,1.9),Hh(2.4,-1.5,0,1.35),Hh(4.4,-1.35,0,.75)],c:wh,bias:-.2});
    parts.push({p:[Hh(6.0+sn,-1.0,0,.55)],c:dk,bias:-.5});
    for(const sd of [-1,1]){
      parts.push({p:[Hh(2.1,.85,1.55*sd,.42)],c:dk,bias:-.6});
      parts.push({poly:true,p:earPts(Hh,sd,[-.3,1.9,1.5],[-.15,.9,.35],[.8,.05,.5],f.cy?5.6:4.8,f.cy?2.0:1.7,[[0,1],[.45,.62],[.8,.25]]),c:P.ear?rgb(far(sd)?mulv(P.ear,.8):P.ear):(far(sd)?dkFar:dk)});
    }
    /* the brush: a wave runs down it, streaming out behind at a run, swaying low when it stands */
    const tb=B(-10.6,13.2,0,1.4); let tp=[tb[0],tb[1],0]; const tail=[[...tp,1.4]];
    const om=running?9:1.7, Av=running?.12:.07, Al=running?.14:.2, base=(running?.3:(f.state==="sniff"?.75:.62))+(f.cy?.55:f.coy?.18:0);
    for(let i=0;i<10;i++){
      const va=base+i*(running?.015:.07)+Av*Math.sin(t*om-i*.55)-(running?bob*.03*i:0), la=Al*Math.sin(t*om*.8-i*.5+1);
      tp=[tp[0]-Math.cos(va)*Math.cos(la)*1.65, tp[1]-Math.sin(va)*1.65, tp[2]+Math.cos(va)*Math.sin(la)*1.65];
      tail.push([...tp,[2.3,3.0,3.4,3.6,3.6,3.3,2.9,2.3,1.6,.7][i]]);
    }
    parts.push({p:tail.slice(0,9),c:coat,sh},{p:tail.slice(8),c:P.tip?rgb(P.tip):wh,bias:-.05});
    return parts;
  }
  function drawFox(dt,dark){
    if(!fox){ nextFox-=dt; if(nextFox<=0){ if(groundBusy()) nextFox=10; else startFox(); } return; }
    foxStep(fox,dt); if(fox.gone){ fox=null; nextFox=rnd(120,240); return; }
    const f=fox, s=toScreen(f.Xw,f.Dw), k=.16*s.g/26, running=f.state==="run"||f.state==="leave";
    if(f.yaw==null) f.yaw=0; if(f.pw){ const dX=f.Xw-f.pw[0], dZ=trueZ(f.Dw)-f.pw[1]; if(running&&Math.hypot(dX,dZ)>1e-5) f.yaw=angTo(f.yaw,Math.atan2(dZ,dX),dt*9); } idleTurn(f,dt,running); keepOnLawn(f); f.pw=[f.Xw,trueZ(f.Dw)];
    f.ct=(f.ct||0)-dt;
    if(f.ct<=0||!f.pal){ f.ct=1.5; const ip=toImg(s.x,s.y), g=(ip&&sampleAt(Math.max(0,Math.min(1,ip[0])),ip[1]+.01))||[120,110,60];
      const lit=dark?.45:.6; f.pal={coat:mixv(mulv([186,92,42],lit),mulv(g,.55),.25), dark:mulv([46,32,22],lit), white:mixv(mulv([226,218,202],lit),mulv(g,.6),.2), shadow:mulv(g,.42), grassA:mulv(g,.85), grassB:mixv(g,[230,200,120],.25)}; }
    const P=f.pal, R=.6, w=Math.ceil(100*k*R), h=Math.ceil(50*k*R);
    if(fsp.width<w||fsp.height<h){ fsp.width=Math.max(fsp.width,w); fsp.height=Math.max(fsp.height,h); }
    const x=fsx; x.setTransform(1,0,0,1,0,0); x.clearRect(0,0,fsp.width,fsp.height);
    const ax=w*.5, ay=h*.9; x.translate(ax,ay); x.scale(k*R,k*R);
    x.save(); const sg=x.createRadialGradient(0,0,0,0,0,22); sg.addColorStop(0,rgb(P.shadow,.5)); sg.addColorStop(1,rgb(P.shadow,0)); x.fillStyle=sg; x.scale(1,.16); x.beginPath(); x.arc(0,4,22,0,6.283); x.fill(); x.restore();
    rigDraw(x,foxParts(f,P,running||f.turning),rigView(f.yaw,viewPitch(f.Dw)),1);
    x.setTransform(1,0,0,1,0,0); rigLight(x,ax,ay-26*k*R,ay,30*k*R,sun().x-s.x,0);
    x.setTransform(1,0,0,1,0,0); x.translate(ax,ay); x.scale(k*R,k*R); x.lineCap="round";
    if(!f.blades) f.blades=Array.from({length:10},()=>({ox:rnd(-22,22),h:rnd(3,7),lean:rnd(-.5,.5),c:Math.random()}));
    for(const b of f.blades){ const s2=Math.sin(t*1.4+b.ox)*.08; x.strokeStyle=rgb(b.c<.4?P.grassA:P.grassB,.75); x.lineWidth=.9; x.beginPath(); x.moveTo(b.ox,2.5); x.quadraticCurveTo(b.ox+(b.lean+s2)*b.h*.5,-b.h*.5+2,b.ox+(b.lean+s2)*b.h,-b.h+2.5); x.stroke(); }
    x.setTransform(1,0,0,1,0,0); x.globalCompositeOperation="source-atop";
    if(SC.dim()){ x.fillStyle="rgba(20,14,6,.14)"; x.fillRect(0,0,w,h); }
    else { const tn2=tint(); if(tn2.a>0){ x.globalAlpha=tn2.a; x.fillStyle=tn2.c; x.fillRect(0,0,w,h); x.globalAlpha=1; } }
    x.globalCompositeOperation="source-over";
    ctx.save(); ctx.globalAlpha=f.alpha; ctx.drawImage(fsp,0,0,w,h,s.x-ax/R,s.y-ay/R,w/R,h/R); ctx.restore();
  }
  /* ---- a gray fox: grizzled silver back, rusty sides and neck, white throat, black-tipped tail; trots in, sniffs and stares, then slips off ---- */
  let coyote=null, nextCoyote=200;
  function startCoyote(){
    const b=foxBounds(), side=Math.random()<.5, x0=side? W+70 : -70, g=rnd(Math.max(b.gmin,lawnMinG(side?W*.9:W*.1))+20,b.gmax-25), p=toGround(x0,gnd().vy+g);
    coyote={Xw:p.Xw,Dw:p.Dw,state:"run",t:rnd(2.5,4),cycles:3+Math.floor(Math.random()*3),head:0,headT:0,turn:0,turnT:0,jerk:0,ph:0,sniff:0,alpha:1,spd:.62,cad:.7,yaw:side?Math.PI:0,coy:true};
    const q=toGround(W*(side?rnd(.55,.75):rnd(.25,.45)),gnd().vy+g); coyote.tX=q.Xw; coyote.tD=q.Dw; coyote.ang=null; arrive(x0,coyote);
  }
  function drawCoyote(dt,dark){
    if(!coyote){ nextCoyote-=dt; if(nextCoyote<=0){ if(groundBusy()) nextCoyote=12; else startCoyote(); } return; }
    const was=coyote.state; foxStep(coyote,dt); if(coyote.gone){ coyote=null; nextCoyote=rnd(220,380); return; }
    const f=coyote, s=toScreen(f.Xw,f.Dw), k=.16*s.g/26*1.02, running=f.state==="run"||f.state==="leave";
    if(f.pw){ const dX=f.Xw-f.pw[0], dZ=trueZ(f.Dw)-f.pw[1]; if(running&&Math.hypot(dX,dZ)>1e-5) f.yaw=angTo(f.yaw,Math.atan2(dZ,dX),dt*6); } idleTurn(f,dt,running); keepOnLawn(f); f.pw=[f.Xw,trueZ(f.Dw)];
    f.ct=(f.ct||0)-dt;
    if(f.ct<=0||!f.pal){ f.ct=1.5; const G=groundPal(s,dark), g=G.g, lit=dark?.45:.6;
      f.pal={...G, coat:mixv(mulv([128,126,122],lit),mulv(g,.55),.15), dark:mulv([150,92,52],lit), white:mixv(mulv([222,216,204],lit),mulv(g,.6),.15), ear:mulv([160,100,58],lit), tip:mulv([26,22,20],lit)}; }
    if(!f.blades) f.blades=Array.from({length:10},()=>({ox:rnd(-24,24),h:rnd(3,7),lean:rnd(-.5,.5),c:Math.random()}));
    critterBlit(null,null,f,s,k,f.pal,()=>foxParts(f,f.pal,running||f.turning),f.yaw,52,104,22,f.blades,f.alpha);
  }
  /* ---- a coyote: rangy and long-legged, tawny grey with a long narrow muzzle and big ears, tail hung low; lopes in, stops to stare, then trots off ---- */
  let coy2=null, nextCoy2=140;
  function startCoy2(){
    const b=foxBounds(), side=Math.random()<.5, x0=side? W+80 : -80, g=rnd(Math.max(b.gmin,lawnMinG(side?W*.9:W*.1))+20,b.gmax-30), p=toGround(x0,gnd().vy+g);
    coy2={Xw:p.Xw,Dw:p.Dw,state:"run",t:rnd(2.5,4),cycles:3+Math.floor(Math.random()*3),head:0,headT:0,turn:0,turnT:0,jerk:0,ph:0,sniff:0,alpha:1,spd:.7,cad:.66,yaw:side?Math.PI:0,coy:true,cy:true};
    const q=toGround(W*(side?rnd(.5,.72):rnd(.28,.5)),gnd().vy+g); coy2.tX=q.Xw; coy2.tD=q.Dw; coy2.ang=null; arrive(x0,coy2);
  }
  function drawCoy2(dt,dark){
    if(!coy2){ nextCoy2-=dt; if(nextCoy2<=0){ if(groundBusy()) nextCoy2=12; else startCoy2(); } return; }
    const was=coy2.state; foxStep(coy2,dt); if(coy2.gone){ coy2=null; nextCoy2=rnd(240,400); return; }
    const f=coy2, s=toScreen(f.Xw,f.Dw), k=.16*s.g/26*1.3, running=f.state==="run"||f.state==="leave";
    if(was!=="leave"&&f.state==="leave"&&Math.random()<.6) setTimeout(()=>natureSfx.yip(),rnd(2,5)*1000);   /* the pack answers from the woods as it goes */
    if(f.pw){ const dX=f.Xw-f.pw[0], dZ=trueZ(f.Dw)-f.pw[1]; if(running&&Math.hypot(dX,dZ)>1e-5) f.yaw=angTo(f.yaw,Math.atan2(dZ,dX),dt*6); } idleTurn(f,dt,running); keepOnLawn(f); f.pw=[f.Xw,trueZ(f.Dw)];
    f.ct=(f.ct||0)-dt;
    if(f.ct<=0||!f.pal){ f.ct=1.5; const G=groundPal(s,dark), g=G.g, lit=dark?.45:.6;
      f.pal={...G, coat:mixv(mulv([156,134,104],lit),mulv(g,.55),.18), dark:mulv([128,104,78],lit), white:mixv(mulv([216,204,182],lit),mulv(g,.6),.18), ear:mulv([170,128,88],lit), tip:mulv([40,32,26],lit)}; }
    if(!f.blades) f.blades=Array.from({length:10},()=>({ox:rnd(-26,26),h:rnd(3,7),lean:rnd(-.5,.5),c:Math.random()}));
    critterBlit(null,null,f,s,k,f.pal,()=>foxParts(f,f.pal,running||f.turning),f.yaw,62,110,24,f.blades,f.alpha);
  }
  /* ---- shared: paint a rigged ground animal into a small sprite and set it in the photo's light ---- */
  function critterBlit(cv,cx,f,s,k,P,parts,yaw,hgt,wid,shadowR,blades,alpha,haze){
    const R=.6, w=Math.ceil(wid*k*R), h=Math.ceil(hgt*k*R), now=performance.now();
    if(!f.cv){ f.cv=document.createElement("canvas"); f.cx=f.cv.getContext("2d"); }
    if(f.rt && now-f.rt<64 && f.rw===w){ const ax0=w*.5, ay0=h*.88; ctx.save(); ctx.globalAlpha=alpha; if(f.air&&f.air.blur) ctx.filter=`blur(${f.air.blur}px)`; ctx.drawImage(f.cv,0,0,w,h,s.x-ax0/R,s.y-ay0/R,w/R,h/R); ctx.restore(); return; }
    f.rt=now; f.rw=w; cv=f.cv; cx=f.cx; if(typeof parts==="function") parts=parts();
    if(cv.width<w||cv.height<h){ cv.width=Math.max(cv.width,w); cv.height=Math.max(cv.height,h); }
    const x=cx; x.setTransform(1,0,0,1,0,0); x.clearRect(0,0,cv.width,cv.height);
    const ax=w*.5, ay=h*.88; x.translate(ax,ay); x.scale(k*R,k*R);
    x.save(); const sg=x.createRadialGradient(0,0,0,0,0,shadowR); sg.addColorStop(0,rgb(P.shadow,.5)); sg.addColorStop(1,rgb(P.shadow,0)); x.fillStyle=sg; x.scale(1,.18); x.beginPath(); x.arc(0,3,shadowR,0,6.283); x.fill(); x.restore();
    rigDraw(x,parts,rigView(yaw,viewPitch(f.Dw)),1);
    x.setTransform(1,0,0,1,0,0); rigLight(x,ax,ay-hgt*.8*k*R,ay,wid*.4*k*R,sun().x-s.x,haze||0);
    if(blades){ x.translate(ax,ay); x.scale(k*R,k*R); x.lineCap="round";
      for(const b of blades){ const s2=Math.sin(t*1.4+b.ox)*.08; x.strokeStyle=rgb(b.c<.4?P.grassA:P.grassB,.75); x.lineWidth=.9; x.beginPath(); x.moveTo(b.ox,2.5); x.quadraticCurveTo(b.ox+(b.lean+s2)*b.h*.5,-b.h*.5+2,b.ox+(b.lean+s2)*b.h,-b.h+2.5); x.stroke(); }
      x.setTransform(1,0,0,1,0,0); }
    x.globalCompositeOperation="source-atop";
    if(SC.dim()){ x.fillStyle="rgba(20,14,6,.14)"; x.fillRect(0,0,w,h); }
    else { const tn2=tint(); if(tn2.a>0){ x.globalAlpha=tn2.a; x.fillStyle=tn2.c; x.fillRect(0,0,w,h); x.globalAlpha=1; } }
    if(f.air){ x.fillStyle=rgb(f.air.c,f.air.a); x.fillRect(0,0,w,h); }                                             /* far away: washed toward the air between it and you */
    x.globalCompositeOperation="source-over";
    ctx.save(); ctx.globalAlpha=alpha; if(f.air&&f.air.blur) ctx.filter=`blur(${f.air.blur}px)`; ctx.drawImage(cv,0,0,w,h,s.x-ax/R,s.y-ay/R,w/R,h/R); ctx.restore(); ctx.filter="none";
  }
  function groundPal(s,dark){ const ip=toImg(s.x,s.y), g=(ip&&sampleAt(Math.max(0,Math.min(1,ip[0])),Math.max(0,Math.min(1,ip[1]+.01))))||[120,110,60]; return {g, shadow:mulv(g,.42), grassA:mulv(g,.85), grassB:mixv(g,[230,200,120],.25)}; }

  /* ---- a striped skunk: waddles in, noses around in the grass, tail up, then ambles off — slower and lower than the fox ---- */
  let skunk=null, nextSkunk=70;
  const ksp=document.createElement("canvas"), ksx=ksp.getContext("2d");
  function startSkunk(){
    const b=foxBounds(), g=rnd(b.gmin+40,b.gmax-10), side=Math.random()<.5, p=toGround(side? W+50 : -50, gnd().vy+g);
    skunk={Xw:p.Xw,Dw:p.Dw,state:"run",t:rnd(2,3.5),cycles:2+Math.floor(Math.random()*3),head:0,headT:0,turn:0,turnT:0,jerk:0,ph:0,sniff:0,alpha:1,spd:.36,cad:.62,yaw:side?Math.PI:0};
    const q=toGround(W*(side?rnd(.6,.8):rnd(.2,.4)),gnd().vy+g); skunk.tX=q.Xw; skunk.tD=q.Dw; skunk.ang=null; arrive(side?W+50:-50,skunk);
  }
  function skunkParts(f,P,walking){
    const q=f.ph*Math.PI*1.3, yaw=f.yaw, far=z=>z*Math.cos(yaw)>0, parts=[];
    const blk=rgb(P.black), blkFar=rgb(mulv(P.black,.72)), wh=rgb(P.white), whD=rgb(mixv(P.white,P.black,.45)), sh=[rgb(mulv(P.black,.55)),rgb(mixv(P.black,[255,200,130],.18))];
    const roll=walking? Math.sin(q)*.45 : 0, bob=walking? Math.abs(Math.sin(q))*.35 : 0;
    const B=(x,y,z,r)=>[x,y+bob,z+roll*(y/9),r];
    /* short, thick legs mostly lost in the fur, the long front claws pale at the toes */
    for(const [lx,ly,z,ph,hind] of [[3.4,5.2,-1.7,0,0],[3.4,5.2,1.7,Math.PI,0],[-5.4,6.4,-2.3,Math.PI,1],[-5.4,6.4,2.3,0,1]]){
      const sw=walking?Math.sin(q+ph):0, lift=walking?Math.max(0,-Math.cos(q+ph)):0, top=B(lx,ly,z,0);
      const segs=hind? [[3.0,.25+.35*sw,1.25],[2.7,-.3+.35*sw-lift*.4,.85]] : [[2.6,-.05+.4*sw,1.05],[2.3,.4*sw-lift*.8,.8]];
      const ch=legChain(top[0],top[1],z,hind?2.6:1.9,segs); parts.push({p:ch,c:far(z)?blkFar:blk});
      const e=ch[ch.length-1]; parts.push({p:[[e[0]-.3,e[1]+.2,z,.9],[e[0]+1.1,e[1]-.1,z,.6]],c:far(z)?blkFar:blk,bias:-.01});
    }
    /* pear-shaped body: narrow at the shoulders, broad, high hips, the back arched */
    const tor=[[-7,8.0,4.4],[-4.2,8.6,4.9],[-.6,7.9,4.3],[2.6,6.9,3.4],[4.6,6.3,2.7]];
    parts.push({p:tor.map(([a,b,r])=>B(a,b,0,r)),c:blk,sh});
    /* the white: a cap over the head and nape that splits into two stripes down the back */
    parts.push({p:[B(5.6,8.2,0,1.25),B(3.6,9.6,0,1.75),B(1.6,10.8,0,1.6)],c:wh,bias:-.04});
    for(const sd of [-1,1]) parts.push({p:[B(1.6,10.8,.8*sd,1.0),B(-1.4,11.8,2.0*sd,.8),B(-4.4,12.4,2.4*sd,.75),B(-7.2,11.8,2.0*sd,.65),B(-9.2,10.6,1.0*sd,.5)],c:wh,bias:-.05});
    /* small head on a short neck, a long pointed snout, the narrow white blaze up the face */
    const hd=f.head, hc0=B(lerp(7.4,8.2,Math.max(0,hd)),lerp(6.4,2.4,Math.max(0,hd))+Math.max(0,-hd)*1.3,0,0), hc=[hc0[0],hc0[1],hc0[2]];
    parts.push({p:[B(4.8,7.0,0,2.5),[hc[0]-.6,hc[1],hc[2],1.95]],c:blk,sh});
    const sn=f.state==="sniff"? Math.sin(f.sniff*12)*.2 : 0, hp=hd*.9+.18, hy=f.turn;
    const Hh=(u,v,w,r)=>{ const t2=headPt(hc,hp,hy,u,v,w); return [t2[0],t2[1],t2[2],r]; };
    parts.push({p:[Hh(-.3,.1,0,1.9),Hh(1.3,-.35,0,1.35),Hh(2.7,-.75,0,.8),Hh(3.6+sn,-1.0,0,.45)],c:blk,sh});
    parts.push({p:[Hh(-.8,1.55,0,.55),Hh(.9,1.05,0,.32),Hh(2.1,.25,0,.2)],c:wh,bias:-.2});
    parts.push({p:[Hh(3.8+sn,-1.0,0,.36)],c:rgb(mulv(P.black,.45)),bias:-.3});
    for(const sd of [-1,1]){ parts.push({p:[Hh(-.7,1.4,1.15*sd,.5)],c:far(sd)?blkFar:blk,bias:.05}); parts.push({p:[Hh(1.1,.35,1.05*sd,.22)],c:"rgba(10,8,8,.9)",bias:-.3}); }
    /* the plume: long and bushy, carried up and out behind, swaying as it walks; raised high when it's alert */
    const tb=B(-10,10.6,0,0); let tp=[tb[0],tb[1],tb[2]]; const tail=[[...tp,1.5]], streak=[];
    const alert=f.state==="look"? .45 : 0;
    for(let i=0;i<8;i++){ const va=.75+alert+i*(.05+alert*.12)+Math.sin(t*1.6-i*.5)*.07-(walking?Math.sin(q)*.04:0), la=Math.sin(t*1.1-i*.45)*.18+(walking?Math.sin(q)*.08:0);
      tp=[tp[0]-Math.cos(va)*1.7*Math.cos(la), tp[1]+Math.sin(va)*1.7, tp[2]+Math.sin(la)*1.1];
      const r=[2.0,2.6,3.0,3.2,3.2,2.9,2.4,1.6][i]; tail.push([...tp,r]); if(i>1&&i<7) streak.push([tp[0]+.15,tp[1]+r*.6,tp[2],r*.26]); }
    parts.push({p:tail,c:blk,sh,bias:.3},{p:streak,c:whD,bias:.29});
    return parts;
  }
  function drawSkunk(dt,dark){
    if(!skunk){ nextSkunk-=dt; if(nextSkunk<=0){ if(groundBusy()) nextSkunk=10; else startSkunk(); } return; }
    foxStep(skunk,dt); if(skunk.gone){ skunk=null; nextSkunk=rnd(140,260); return; }
    const f=skunk, s=toScreen(f.Xw,f.Dw), k=.16*s.g/26, walking=f.state==="run"||f.state==="leave";
    if(f.pw){ const dX=f.Xw-f.pw[0], dZ=trueZ(f.Dw)-f.pw[1]; if(walking&&Math.hypot(dX,dZ)>1e-5) f.yaw=angTo(f.yaw,Math.atan2(dZ,dX),dt*5); } idleTurn(f,dt,walking); keepOnLawn(f); f.pw=[f.Xw,trueZ(f.Dw)];
    f.ct=(f.ct||0)-dt;
    if(f.ct<=0||!f.pal){ f.ct=1.5; const G=groundPal(s,dark), lit=dark?.5:.68; f.pal={...G, black:mixv(mulv([34,30,30],lit/.68),mulv(G.g,.3),.12), white:mixv(mulv([232,228,218],lit),mulv(G.g,.5),.15)}; }
    if(!f.blades) f.blades=Array.from({length:9},()=>({ox:rnd(-16,16),h:rnd(3,6),lean:rnd(-.5,.5),c:Math.random()}));
    critterBlit(ksp,ksx,f,s,k,f.pal,()=>skunkParts(f,f.pal,walking||f.turning),f.yaw,34,60,14,f.blades,f.alpha);
  }

  /* ---- wild turkeys: a flock drifts across the lawn now and then, pecking, milling, a tom fanning out, then they hustle off ---- */
  let turks=null, nextTurks=55;
  const tsp=document.createElement("canvas"), tsx=tsp.getContext("2d");
  function startTurks(){
    const b=foxBounds(), side=Math.random()<.5, lo=Math.max(b.gmin,lawnMinG(side?W*.85:W*.15))+30, g=rnd(lo,Math.max(lo+10,b.gmax-60)), c=toGround(side? W+90 : -90, gnd().vy+g);
    const n=5+Math.floor(Math.random()*5), birds=[];
    for(let i=0;i<n;i++){ const ox=rnd(-.5,.5)+(side?1:-1)*i*.12, oD=rnd(-1.4,1.4); const tom=i===0&&Math.random()<.7;
      birds.push({ox,oD,Xw:c.Xw+ox,Dw:c.Dw+oD,yaw:side?Math.PI:0,ph:rnd(0,6),state:"walk",t:rnd(0,3.5),head:0,fan:0,tom,spd:rnd(.9,1.15),bob:rnd(0,6),pw:null}); }
    turks={birds,cX:c.Xw,cD:c.Dw,mode:"walk",t:0,stops:2+Math.floor(Math.random()*2),dir:side?-1:1,alpha:1};
    { const p=toGround(W*(side? rnd(.45,.7) : rnd(.3,.55)),gnd().vy+g); turks.gX=p.Xw; turks.gD=p.Dw; } arrive(side? W+90 : -90,turks);
  }
  function turkGoal(T){ const b=foxBounds(), cs=toScreen(T.cX,T.cD), sx=Math.max(W*.12,Math.min(W*.8,cs.x+T.dir*W*rnd(.08,.22))), lo=lawnMinG(sx)+35, g=Math.max(lo,Math.min(b.gmax-30,cs.g+rnd(-110,110))), p=toGround(sx,gnd().vy+g); T.gX=p.Xw; T.gD=p.Dw; }
  function stepTurks(dt){
    const T=turks; T.t-=dt; T.age=(T.age||0)+dt;
    T.gob=(T.gob??rnd(1.5,4))-dt; if(T.gob<=0){ T.gob=rnd(5,13); const cs=toScreen(T.cX,T.cD); if(cs.x>-40&&cs.x<W+40&&typeof natureSfx!=="undefined"&&natureSfx.gobble) natureSfx.gobble((cs.x/W*2-1)*.85,Math.min(1,.55+cs.g/260)); }   /* the toms gobble now and then as they feed */
    if(T.age>80 && T.mode!=="leave"){ T.mode="leave"; const s=toScreen(T.cX,T.cD), p=toGround(T.dir>0? W+160 : -160, gnd().vy+s.g); T.gX=p.Xw; T.gD=p.Dw; }
    const spd= T.mode==="run"||T.mode==="leave"? .9 : T.mode==="walk"? .3 : 0;
    if(spd){ const cg={Xw:T.gX,Dw:T.gD}; if(T.mode!=="leave"){ keepOnLawn(cg); T.gX=cg.Xw; T.gD=cg.Dw; } const dX=T.gX-T.cX, dD=T.gD-T.cD, d=Math.hypot(dX,dD*.25)||1e-6; const fr=Math.min(1,spd*dt/d); T.cX+=dX*fr; T.cD+=dD*fr;
      if(d<.05 && T.mode!=="leave"){ T.mode="feed"; T.t=rnd(5,9); } }
    if(T.t<=0){
      if(T.mode==="feed"){ T.stops--; if(T.stops<=0){ T.mode="leave"; const sideX=T.dir>0? W+160 : -160, g=toScreen(T.cX,T.cD).g, p=toGround(sideX,gnd().vy+g); T.gX=p.Xw; T.gD=p.Dw; }
        else { T.mode=Math.random()<.35?"run":"walk"; T.t=0; if(Math.random()<.25) T.dir*=-1; turkGoal(T); } }
      else if(T.mode!=="leave" && T.t<-10){ T.mode="feed"; T.t=rnd(4,8); }
    }
    let allOut=true;
    for(const b of T.birds){
      b.t-=dt; const tg={Xw:T.cX+b.ox,Dw:T.cD+b.oD}; keepOnLawn(tg); const tx=tg.Xw, tD=tg.Dw, dX=tx-b.Xw, dD=tD-b.Dw, d=Math.hypot(dX,dD*.25);
      b.stuck=(b.ld!=null&&Math.abs(b.ld-d)<1e-4&&d>(T.mode==="feed"?.18:.04))? (b.stuck||0)+dt : 0; b.ld=d; if(b.stuck>.8){ b.ox*=.3; b.oD*=.3; b.stuck=0; }
      const moving= T.mode==="feed"? (b.mv? d>.05 : d>.24) : (b.mv? d>.015 : d>.07);
      if(T.mode==="feed" && b.t<=0){ b.t=rnd(1.2,3.5); const r=Math.random(); b.state= r<.45? "peck" : r<.75? "look" : "shuffle"; if(b.state==="shuffle"){ b.ox+=rnd(-.25,.25); b.oD+=rnd(-.6,.6); } if(b.tom&&Math.random()<.35) b.fanT=b.fanT? 0 : 1; if(Math.random()<.7) b.idleYaw=idleYawFor(b.yaw); }
      const sp=(T.mode==="run"||T.mode==="leave"? 1.05 : .38)*b.spd;
      if(moving||b.state==="shuffle"){ if(d>1e-4){ const fr=Math.min(1,sp*dt/d); b.Xw+=dX*fr; b.Dw+=dD*fr; } b.ph+=dt*(sp>.6?7.5:3.6); if(d<.03&&b.state==="shuffle") b.state="peck"; }
      const run=sp>.6 && moving;
      b.mv=moving; b.run=run;
      b.head+=((!moving&&b.state==="peck"? 1 : b.state==="look"&&!moving? -.3 : 0)-b.head)*Math.min(1,dt*(b.state==="peck"?6:8));
      b.fan+=(((b.fanT&&!moving)?1:0)-b.fan)*Math.min(1,dt*2.5);
      if(b.pw){ const mX=dX, mZ=trueZ(tD)-trueZ(b.Dw); if(moving&&Math.hypot(mX,mZ)>1e-5) b.yaw=angTo(b.yaw,Math.atan2(mZ,mX),dt*5); else if(!moving&&b.idleYaw!=null){ const dl=Math.atan2(Math.sin(b.idleYaw-b.yaw),Math.cos(b.idleYaw-b.yaw)); if(Math.abs(dl)>.06){ b.yaw=angTo(b.yaw,b.idleYaw,dt*1.2); b.mv=true; b.ph+=dt*3; b.head+=(0-b.head)*Math.min(1,dt*6); } } } keepOnLawn(b); b.pw=[b.Xw,trueZ(b.Dw)];
      if(T.mode==="leave"){ const mv2=b.lx==null? 1 : Math.abs(b.Xw-b.lx)+Math.abs(b.Dw-b.lD)*.25; b.lx=b.Xw; b.lD=b.Dw; b.still= mv2<1e-4? (b.still||0)+dt : 0; if(b.still>1.5) b.gone=true; }
      if(b.gone){ b.ga=Math.max(0,(b.ga??1)-dt*2); continue; }
      const sx=toScreen(b.Xw,b.Dw).x; if(sx>-80&&sx<W+80) allOut=false;
    }
    if(T.mode==="leave" && allOut){ T.alpha-=dt*2; if(T.alpha<=0){ turks=null; nextTurks=rnd(160,300); } }
  }
  function turkeyParts(b,P){
    const q=b.ph*Math.PI*2*.5, yaw=b.yaw, far=z=>z*Math.cos(yaw)>0, parts=[], mv=b.mv, run=b.run;
    const body=rgb(P.body), bodyFar=rgb(mulv(P.body,.78)), sh=[rgb(mulv(P.body,.55)),rgb(mixv(P.body,[200,150,90],.22))];
    const lean=run? .22 : b.head>.5? .14 : 0, bob=mv? Math.abs(Math.sin(q))*.8 : 0;
    const T=(x,y)=>{ const c=Math.cos(lean), s=Math.sin(lean), dy=y-24; return [x*c-dy*s, 24+bob+x*s+dy*c]; };
    const B=(x,y,z,r)=>{ const p=T(x,y); return [p[0],p[1],z,r]; };
    for(const [z,ph] of [[-2.6,0],[2.6,Math.PI]]){
      const sw=mv? Math.sin(q+ph)*(run?.75:.45) : 0, lift=mv? Math.max(0,-Math.cos(q+ph)) : 0, top=T(0,18);
      const top2=T(1.5,20), ch=legChain(top2[0],top2[1],z,3.2,[[8,-.42+sw*.5-lift*.25,1.6],[12.4,.12+sw+lift*.55,.55]]);
      parts.push({p:ch.slice(0,2),c:far(z)?bodyFar:body},{p:ch.slice(1),c:far(z)?rgb(mulv(P.leg,.8)):rgb(P.leg)});
      const ft=ch[2], tl=lift*1.2; parts.push({p:[[ft[0]-1.6,ft[1]+tl*.3,z,.38],[ft[0],ft[1],z,.45],[ft[0]+3.2,ft[1]+tl,z+.3,.32]],c:rgb(P.leg),bias:-.01},{p:[[ft[0],ft[1],z,.4],[ft[0]+2.8,ft[1]+tl,z+(z>0?1.6:-1.6),.28]],c:rgb(P.leg),bias:-.01});
    }
    /* tail: closed and trailing, or a tom's fan opening up behind him */
    if(b.fan>.05){ const F=[], R1=19*b.fan+4, cx=-8.5, cy=26;
      const fanPts=sc=>{ const A=[]; for(let i=0;i<=12;i++){ const a=-1.7+3.4*i/12, ca=Math.cos(a); A.push(B(cx-7*ca*ca*sc,cy+ca*R1*.95*sc,Math.sin(a)*R1*sc,0)); } A.push(B(cx+1,cy-3,0,0)); return A; };
      parts.push({poly:true,p:fanPts(1),c:rgb(P.band),bias:1.6});
      parts.push({poly:true,p:fanPts(.88),c:rgb(mulv(P.body,.95)),bias:-1.4});
    } else parts.push({p:[B(-17.2,19.2,0,2.5),B(-18.2,18.4,0,1.9)],c:rgb(mixv(P.body,P.band,.55)),bias:.25},{p:[B(-9,24,0,4.8),B(-13.5,21.6,0,4.0),B(-16.8,19.4,0,2.8)],c:body,sh,bias:.2});
    parts.push({p:[B(-10,24.2,0,6),B(-4,25,0,8.2),B(2.5,25.8,0,8.4),B(7,27.5,0,6.4)],c:body,sh});
    for(const sd of [-1,1]) parts.push({p:[B(4,27.5,7.2*sd,2.2),B(-1.5,26.4,7.9*sd,3.0),B(-8,24.4,6.8*sd,1.8)],c:far(sd)?bodyFar:rgb(P.wing),bias:-.02});
    /* neck and bare head, bobbing at a walk, down to the grass to peck */
    const hd=b.head, nod=mv? Math.sin(q*2)*1.2 : 0;
    const hc0=T(lerp(13.6+nod,15.5,Math.max(0,hd)),lerp(44,5,Math.max(0,hd))+Math.max(0,-hd)*2), hc=[hc0[0],hc0[1],0];
    const n0=B(8.4,29.5,0,4.0), n1=[lerp(n0[0],hc[0],.5)+.5+hd*1.5,lerp(n0[1],hc[1],.5)+hd*2,0,2.3], n2=[lerp(n0[0],hc[0],.84),lerp(n0[1],hc[1],.84),0,1.5];
    parts.push({p:[n0,n1,n2],c:body,sh},{p:[n2,[hc[0]-.4,hc[1]-.4,0,1.3]],c:rgb(mixv(P.head,P.body,.35)),bias:-.01});
    const hp=hd*1.3+.1, Hh=(u,v,w,r)=>{ const t2=headPt(hc,hp,0,u,v,w); return [t2[0],t2[1],t2[2],r]; };
    parts.push({p:[Hh(0,0,0,1.6),Hh(1.6,-.3,0,1.1)],c:rgb(P.head)});
    parts.push({p:[Hh(2.0,-.4,0,.6),Hh(3.0,-.8,0,.3)],c:rgb(P.beak),bias:-.1});
    parts.push({p:[Hh(.9,-1.4,0,.9),Hh(.6,-3.4,0,.75)],c:rgb(P.wattle),bias:-.05});
    if(b.tom) parts.push({p:[Hh(1.6,.9,0,.4),Hh(2.6,-.6,0,.35),Hh(2.9,-2.6,0,.3)],c:rgb(P.wattle),bias:-.12});
    if(b.tom) parts.push({p:[B(9.6,26.5,0,.5),B(10.6,21.5,0,.35)],c:rgb(mulv(P.body,.55)),bias:-.4});
    for(const sd of [-1,1]) parts.push({p:[Hh(.8,.35,1.1*sd,.28)],c:"rgba(12,10,10,.9)",bias:-.3});
    return parts;
  }
  function turkeyQueue(dt,dark,list){
    if(!turks){ nextTurks-=dt; if(nextTurks<=0){ if(groundBusy()) nextTurks=15; else startTurks(); } return; }
    stepTurks(dt); if(!turks) return;
    const T=turks;
    T.ct=(T.ct||0)-dt;
    if(T.ct<=0||!T.pal){ T.ct=2; const s=toScreen(T.cX,T.cD), G=groundPal(s,dark), lit=dark?.42:.55;
      T.pal={...G, body:mixv(mulv([38,30,25],lit/.55),mulv(G.g,.3),.06), wing:mulv([43,35,28],lit/.55), band:mulv([140,108,72],lit/.55), leg:mulv([72,60,56],lit/.55), head:mulv([104,108,134],lit/.55), wattle:mulv([160,44,38],lit/.55), beak:mulv([160,140,100],lit/.55)}; }
    T.birds.forEach((b,bi)=>{ const s=toScreen(b.Xw,b.Dw); if(s.x<-160||s.x>W+160||(b.gone&&b.ga<=0)) return;
      if(b.zy==null||Math.abs(s.y-b.zy)>4) b.zy=s.y;                /* steady draw order, so neighbours don't swap in front of each other every frame */
      list.push({y:b.zy+bi*.01, fn:()=>{ const k=.16*s.g/26; critterBlit(tsp,tsx,b,s,k,T.pal,()=>turkeyParts(b,T.pal),b.yaw,62,72,16,null,T.alpha*(b.gone?b.ga:1),.6); }}); });
  }
  /* ---- a black bear cub: ambles out of the field, noses about, plops down, wanders, then heads back ---- */
  let cub=null, nextCub=110;
  function startCub(){
    const b=foxBounds(), g=rnd(b.gmin+10,b.gmin+(b.gmax-b.gmin)*.6), side=Math.random()<.5, p=toGround(side? W+60 : -60, gnd().vy+g);
    cub={Xw:p.Xw,Dw:p.Dw,state:"run",t:rnd(3,5),cycles:3+Math.floor(Math.random()*3),head:0,headT:0,turn:0,turnT:0,jerk:0,ph:0,sniff:0,alpha:1,spd:.3,cad:.42,yaw:side?Math.PI:0};
    const q=toGround(W*(side?rnd(.55,.75):rnd(.25,.45)),gnd().vy+g); cub.tX=q.Xw; cub.tD=q.Dw; cub.ang=null; arrive(side?W+60:-60,cub);
  }
  function cubParts(f,P,walking){
    const q=f.ph*Math.PI*1.3, yaw=f.yaw, far=z=>z*Math.cos(yaw)>0, parts=[];
    const fur=rgb(P.fur), furFar=rgb(mulv(P.fur,.75)), sh=[rgb(mulv(P.fur,.55)),rgb(mixv(P.fur,[255,190,120],.25))];
    const roll=walking? Math.sin(q)*.6 : 0, bob=walking? Math.abs(Math.cos(q))*.5 : 0;
    const B=(x,y,z,r)=>[x,y+bob,z+roll*(y/14),r];
    /* a pacing walk: both legs on one side swing together, the body rolls */
    for(const [lx,ly,z,ph,hind] of [[5.4,10.5,-3,0,0],[5.4,10.5,3,Math.PI,0],[-6.6,11,-3.2,0,1],[-6.6,11,3.2,Math.PI,1]]){
      const sw=walking?Math.sin(q+ph):0, lift=walking?Math.max(0,-Math.cos(q+ph)):0, top=B(lx,ly,z,0);
      const segs=hind? [[5.4,.25+.35*sw,2.8],[5.0,-.3+.35*sw-lift*.4,2.2]] : [[5.0,.0+.4*sw,2.5],[5.2,.4*sw-lift*.7,2.2]];
      const ch=legChain(top[0],top[1],z,hind?4.0:3.3,segs);
      parts.push({p:ch,c:far(z)?furFar:fur,sh:far(z)?null:sh});
      const e=ch[2]; parts.push({p:[[e[0]-.6,e[1]+.4,z,2.3],[e[0]+1.4,e[1]-.2,z,1.9]],c:far(z)?furFar:fur,bias:-.01});
      if(!hind) for(const cz of [-.9,0,.9]) parts.push({p:[[e[0]+2.6,e[1]-.4,z+cz,.32],[e[0]+3.4,e[1]-.9,z+cz*1.1,.15]],c:rgb(P.claw),bias:-.05});   /* curved pale claws */
    }
    parts.push({p:[B(-8.6,13.4,0,6.0),B(-3.4,14.8,0,6.8),B(2,14.6,0,6.6),B(6,13.6,0,5.4)],c:fur,sh});
    parts.push({p:[B(-11.6,14.4,0,1.4)],c:fur,bias:.1});
    parts.push({p:[B(-6,9.6,0,4.2),B(2,9.2,0,4.4)],c:rgb(mulv(P.fur,.72)),bias:.4});                                        /* the darker, heavier belly fur */
    if(f.adult) parts.push({p:[B(1.5,15.6,0,6.2),B(4.2,16.2,0,5.4)],c:fur,sh});   /* a grown bear's shoulder hump */
    const hd=f.head, hc0=B(lerp(13.2,13.4,Math.max(0,hd)),lerp(16.6,6.2,Math.max(0,hd))+Math.max(0,-hd)*2.6,0,0), hc=[hc0[0],hc0[1],hc0[2]];
    const nb=B(7.6,14.2,0,4.8); parts.push({p:[nb,[hc[0]-1,hc[1],hc[2],3.8]],c:fur,sh});
    const sn=f.state==="sniff"? Math.sin(f.sniff*11)*.2 : 0, hp=hd*.85+.08, hy=f.turn;
    const Hh=(u,v,w,r)=>{ const t2=headPt(hc,hp,hy,u,v,w); return [t2[0],t2[1],t2[2],r]; };
    parts.push({p:[Hh(-.4,.2,0,4.6),Hh(1.6,-.2,0,3.9)],c:fur,sh});
    const sl=f.adult?.9:0; parts.push({p:[Hh(2.6,-.6,0,2.7),Hh(5.6+sl+sn,-1.7,0,1.6)],c:rgb(P.muzzle),sh:[rgb(mulv(P.muzzle,.7)),rgb(mixv(P.muzzle,[255,220,170],.2))],bias:-.1});   /* the tan muzzle */
    parts.push({p:[Hh(1.2,1.4,0,2.2),Hh(2.6,1,0,1.6)],c:rgb(mulv(P.fur,.85)),bias:-.06});                                  /* the brow over the eyes */
    parts.push({p:[Hh(6.6+sl+sn,-1.5,0,.95)],c:rgb(mulv(P.fur,.38)),bias:-.3}); parts.push({p:[Hh(6.9+sl+sn,-1.1,.25,.28)],c:"rgba(210,200,190,.55)",bias:-.4});   /* wet nose, with a glint */
    parts.push({p:[Hh(4.4+sl,-2.6,0,.7),Hh(5.6+sl,-2.5,0,.5)],c:rgb(mulv(P.muzzle,.75)),bias:-.12});                        /* the lower lip and chin */
    for(const sd of [-1,1]){ parts.push({p:[Hh(-1.3,f.adult?3.9:4.3,(f.adult?2.8:3.0)*sd,f.adult?1.3:1.85)],c:far(sd)?furFar:fur,bias:.05}); parts.push({p:[Hh(-.9,f.adult?3.9:4.3,(f.adult?2.8:3.0)*sd,f.adult?.75:1.1)],c:rgb(mixv(P.fur,[120,90,70],.35)),bias:.02});   /* round ears with lighter insides */
      parts.push({p:[Hh(2.2,1.1,2.4*sd,.5)],c:"rgba(30,18,12,.95)",bias:-.3}); parts.push({p:[Hh(2.45,1.25,2.45*sd,.14)],c:"rgba(230,220,200,.6)",bias:-.35}); }   /* small dark-brown eyes, catching the light */
    return parts;
  }
  function drawCub(dt,dark){
    if(!cub){ nextCub-=dt; if(nextCub<=0){ if(groundBusy()) nextCub=12; else startCub(); } return; }
    if(cub.follow!=null){ cub.follow-=dt; if(cub.follow<=0){ cub.follow=null; cub.state="leave"; cub.tX=cub.exX; cub.tD=cub.exD; cub.ang=null; cub.spd=.3; cub.cad=.5; } }
    foxStep(cub,dt); if(cub.gone){ cub=null; nextCub=rnd(180,320); return; }
    cub.age=(cub.age||0)+dt; if(!mom&&!cub.momDone&&cub.state!=="leave"&&cub.age>(cub.momAt??(cub.momAt=rnd(9,15)))) startMom();
    const f=cub, s=toScreen(f.Xw,f.Dw), k=.16*s.g/26, walking=f.state==="run"||f.state==="leave";
    if(f.pw){ const dX=f.Xw-f.pw[0], dZ=trueZ(f.Dw)-f.pw[1]; if(walking&&Math.hypot(dX,dZ)>1e-5) f.yaw=angTo(f.yaw,Math.atan2(dZ,dX),dt*4); } idleTurn(f,dt,walking); keepOnLawn(f); f.pw=[f.Xw,trueZ(f.Dw)];
    f.ct=(f.ct||0)-dt;
    if(f.ct<=0||!f.pal){ f.ct=1.5; const G=groundPal(s,dark), lit=dark?.5:.68; f.pal={...G, fur:mixv(mulv([42,30,22],lit/.68),mulv(G.g,.3),.06), muzzle:mulv([168,128,88],lit), claw:mulv([190,176,150],lit)}; }
    if(!f.blades) f.blades=Array.from({length:10},()=>({ox:rnd(-20,20),h:rnd(3,6),lean:rnd(-.5,.5),c:Math.random()}));
    critterBlit(null,null,f,s,k,f.pal,()=>cubParts(f,f.pal,walking||f.turning),f.yaw,40,64,18,f.blades,f.alpha,.75);   /* a black coat barely takes the warm rim light */
  }
  /* ---- the cub's mother: a little while after the cub wanders out she comes out of the tall field looking for it, walks over, noses it, and leads it away ---- */
  let mom=null;
  function startMom(){
    const cs=toScreen(cub.Xw,cub.Dw), sd=cs.x<W*.25?1:cs.x>W*.75?-1:(Math.random()<.5?-1:1), sx=Math.max(W*.06,Math.min(W*.94,cs.x+sd*W*rnd(.16,.26))), p=toGround(sx,gnd().vy+lawnMinG(sx));
    mom={Xw:p.Xw,Dw:p.Dw,state:"run",t:999,cycles:1,head:0,headT:0,turn:0,turnT:0,jerk:0,ph:0,sniff:0,alpha:0,fadeIn:true,spd:.3,cad:.34,adult:true};
    mom.yaw=Math.atan2(trueZ(cub.Dw)-trueZ(mom.Dw),cub.Xw-mom.Xw); mom.tX=cub.Xw; mom.tD=cub.Dw; mom.ang=null;
    cub.momDone=true; cub.cycles=99; lastArrive=t;                       /* nobody else barges in while the family is out */
  }
  function drawMom(dt,dark){
    if(!mom) return;
    if(!cub&&mom.state!=="leave"){ const s0=toScreen(mom.Xw,mom.Dw), p=toGround(s0.x<W/2?-160:W+160,gnd().vy+s0.g); mom.state="leave"; mom.tX=p.Xw; mom.tD=p.Dw; mom.ang=null; }
    if(cub&&!mom.met&&mom.state==="run"){
      const cs=toScreen(cub.Xw,cub.Dw), ms=toScreen(mom.Xw,mom.Dw), dir=ms.x>=cs.x?1:-1, gap=.36*cs.g;
      const a=toGround(cs.x+dir*gap,gnd().vy+cs.g); mom.tX=a.Xw; mom.tD=a.Dw; mom.t=999;
      if(mom.alpha>.6&&cub.state!=="leave"){ const b=toGround(ms.x-dir*gap,gnd().vy+ms.g); cub.state="run"; cub.t=999; cub.tX=b.Xw; cub.tD=b.Dw; cub.ang=null; }   /* the cub hears her and trots to meet her */
      if(Math.hypot(ms.x-cs.x,(ms.y-cs.y)*3)<.52*cs.g){ mom.met=true; mom.dir=dir;
        mom.state="sniff"; mom.t=rnd(2.4,3.4); mom.sniff=0; mom.idleYaw=Math.atan2(trueZ(cub.Dw)-trueZ(mom.Dw),cub.Xw-mom.Xw);
        cub.state="sniff"; cub.t=999; cub.sniff=0; cub.idleYaw=Math.atan2(trueZ(mom.Dw)-trueZ(cub.Dw),mom.Xw-cub.Xw); }
    }
    const was=mom.state; foxStep(mom,dt); if(mom.gone){ mom=null; return; }
    if(mom.met&&was!=="leave"&&mom.state==="leave"){                     /* off together: she leads, the cub falls in behind */
      const s0=toScreen(mom.Xw,mom.Dw), p=toGround(mom.dir>0?W+180:-180,gnd().vy+s0.g); mom.tX=p.Xw; mom.tD=p.Dw; mom.ang=null; mom.spd=.32;
      if(cub&&cub.state!=="leave"){ const cs=toScreen(cub.Xw,cub.Dw), q=toGround(mom.dir>0?W+180:-180,gnd().vy+cs.g); cub.exX=q.Xw; cub.exD=q.Dw; cub.follow=.9; cub.state="look"; cub.t=999; }
    }
    if(mom.fadeIn){ mom.alpha=Math.min(1,mom.alpha+dt*.6); if(mom.alpha>=1) mom.fadeIn=false; }   /* stepping out of the tall grass */
    const f=mom, s=toScreen(f.Xw,f.Dw), k=.16*s.g/26*2.1, walking=f.state==="run"||f.state==="leave";
    if(f.pw){ const dX=f.Xw-f.pw[0], dZ=trueZ(f.Dw)-f.pw[1]; if(walking&&Math.hypot(dX,dZ)>1e-5) f.yaw=angTo(f.yaw,Math.atan2(dZ,dX),dt*3); } idleTurn(f,dt,walking); keepOnLawn(f); f.pw=[f.Xw,trueZ(f.Dw)];
    f.ct=(f.ct||0)-dt;
    if(f.ct<=0||!f.pal){ f.ct=1.5; const G=groundPal(s,dark), lit=dark?.5:.68; f.pal={...G, fur:mixv(mulv([34,25,19],lit/.68),mulv(G.g,.3),.06), muzzle:mulv([150,112,78],lit), claw:mulv([190,176,150],lit)}; }
    if(!f.blades) f.blades=Array.from({length:12},()=>({ox:rnd(-11,11),h:rnd(1.4,2.8),lean:rnd(-.5,.5),c:Math.random()}));
    critterBlit(null,null,f,s,k,f.pal,()=>cubParts(f,f.pal,walking||f.turning),f.yaw,40,64,18,f.blades,f.alpha,.75);   /* a black coat barely takes the warm rim light */
  }
  /* only one of the ground hunters and wanderers is out at a time */
  /* a newcomer scares off whoever is already out: they bolt away from it, off the far side */
  let lastArrive=-99;
  const dogOut=d=>d&&!d.gone&&d.state!=="leave";
  const groundBusy=()=>t-lastArrive<25||dogOut(dog)||dogOut(lab);
  function arrive(x,self){ lastArrive=t; const away=sx=>sx<x? -150 : W+150;
    for(const f of [fox,skunk,cub,mom,bobcat,pheasW,coyote,coy2]) if(f&&f!==self&&!f.gone){ const s=toScreen(f.Xw,f.Dw), p=toGround(away(s.x),gnd().vy+s.g); f.state="leave"; f.tX=p.Xw; f.tD=p.Dw; f.ang=null; f.spd=Math.max(f.spd||1,1.3); f.cad=Math.max(f.cad||1,1); f.head=0; }
    for(const dd of [lab]) if(dd&&dd!==self){ const s=toScreen(dd.Xw,dd.Dw), p=toGround(away(s.x),gnd().vy+s.g); dd.state="leave"; dd.tX=p.Xw; dd.tD=p.Dw; }
    if(dog&&dog!==self&&dog.state!=="greet"&&!dog.toViewer){ const s=toScreen(dog.Xw,dog.Dw), p=toGround(away(s.x),gnd().vy+s.g); dog.state="leave"; dog.tX=p.Xw; dog.tD=p.Dw; }
    if(turks&&turks!==self&&turks.mode!=="leave"){ const s=toScreen(turks.cX,turks.cD), p=toGround(away(s.x),gnd().vy+s.g); turks.mode="leave"; turks.gX=p.Xw; turks.gD=p.Dw; turks.dir=s.x<x?-1:1; turks.birds.forEach(b=>{ b.state="walk"; b.fanT=0; }); }
    for(const bn of buns) if(bn.init){ bn.state="hop"; bn.hops=3+Math.floor(Math.random()*3); bn.face=bn.x<x?-1:1; bn.hx=bn.x; bn.tx=Math.max(W*.06,Math.min(W*.94,bn.x+bn.face*rnd(14,26))); bn.hop=0; }
    if(buck&&buck.onLawn){ buck.plan=[{k:"walk",...fieldPt()},{k:"look",dur:2},{k:"head",to:1,dur:1.2},{k:"fade"}]; buck.cur=null; }
  }
  /* ---- a bobcat: slinks in low, freezes, stares, trots a few quick steps, sits a moment, then melts away ---- */
  let bobcat=null, nextBobcat=150;
  function startBobcat(){
    const b=foxBounds(), side=Math.random()<.5, x0=side? W+60 : -60, g=rnd(Math.max(b.gmin,lawnMinG(side?W*.9:W*.1))+20,b.gmax-30), p=toGround(x0,gnd().vy+g);
    bobcat={Xw:p.Xw,Dw:p.Dw,state:"run",t:rnd(2.5,4),cycles:3+Math.floor(Math.random()*3),head:0,headT:0,turn:0,turnT:0,jerk:0,ph:0,sniff:0,alpha:1,spd:.5,cad:.55,yaw:side?Math.PI:0};
    const q=toGround(W*(side?rnd(.55,.75):rnd(.25,.45)),gnd().vy+g); bobcat.tX=q.Xw; bobcat.tD=q.Dw; bobcat.ang=null; arrive(x0,bobcat);
  }
  function bobcatParts(f,P,moving){
    const q=f.ph*Math.PI*1.3, yaw=f.yaw, far=z=>z*Math.cos(yaw)>0, parts=[];
    const coat=rgb(P.coat), coatFar=rgb(mulv(P.coat,.74)), pale=rgb(P.pale), paleF=rgb(mulv(P.pale,.8)), dk=rgb(P.dark), spot=rgb(mixv(P.coat,P.dark,.6)), sh=[rgb(mulv(P.coat,.58)),rgb(mixv(P.coat,[255,205,140],.22))];
    const crouch=f.state==="sniff"? 1.8 : 0, bob=moving? Math.abs(Math.sin(q))*.45 : 0;
    const B=(x,y,z,r)=>[x,y+bob-crouch*(x>0?1:.35),z,r];
    /* legs: stout, the hind ones longer so the rump rides high; big round paws; dark bars on the forelegs */
    for(const [lx,ly,z,ph,hind] of [[5.2,10.6,-2.3,0,0],[5.2,10.6,2.3,Math.PI,0],[-6.8,12.4,-2.6,Math.PI*.5,1],[-6.8,12.4,2.6,Math.PI*1.5,1]]){
      const sw=moving?Math.sin(q+ph)*.55:0, lift=moving?Math.max(0,-Math.cos(q+ph)):0, top=B(lx,ly,z,0);
      const segs=hind? [[5.4,.45+sw-crouch*.25,2.0],[5.0,-.62+sw-lift*.5,1.35],[3.8,.06+sw+lift*.4,1.1]] : [[4.8,-.08+sw,1.75],[5.2,sw-lift*1.1,1.3],[1.1,.3+sw-lift*1.3,1.2]];
      const ch=legChain(top[0],top[1],z,hind?3.4:2.7,segs), fz=far(z); parts.push({p:ch,c:fz?coatFar:coat,sh:fz?null:sh});
      const e=ch[ch.length-1]; parts.push({p:[[e[0]-.4,e[1]+.4,z,1.35],[e[0]+.9,e[1]+.1,z,1.2]],c:fz?paleF:pale,bias:-.01});
      if(!hind&&!fz){ const a=ch[1], b=ch[2]; for(const w of [.3,.55,.8]) parts.push({p:[[lerp(a[0],b[0],w)-.4,lerp(a[1],b[1],w),z-(z<0?.9:-.9),.38],[lerp(a[0],b[0],w)+.6,lerp(a[1],b[1],w)-.1,z-(z<0?.9:-.9),.3]],c:dk,bias:-.03}); }
    }
    /* compact, muscular body, higher at the hips */
    const tor=[[-7.8,14.2,4.3],[-4.2,13.8,4.7],[-.4,13.2,4.8],[3.6,13.0,4.6],[5.6,13.4,3.9]];
    parts.push({p:tor.map(([a,b,r])=>B(a,b,0,r)),c:coat,sh});
    parts.push({p:[B(-4.6,10.4,0,2.6),B(2.6,10.2,0,2.9)],c:pale,bias:3});
    parts.push({p:tor.slice(0,4).map(([a,b,r])=>B(a,b+3.2,0,r-3.5)),c:rgb(mixv(P.coat,P.dark,.15)),bias:-.015});    /* darker along the spine */
    /* small dark spots scattered over the flanks and down the legs */
    if(!f.spots) f.spots=Array.from({length:22},()=>[rnd(-8,5),rnd(10.4,16.2),rnd(.22,.42),rnd(-.4,.4)]);
    for(const sd of [-1,1]) for(const [sx,sy,r,j] of f.spots){ const rr=sy>14.8? 3.2 : 4.4; parts.push({p:[B(sx,sy,rr*sd,r),B(sx+.45,sy+j*.4,rr*sd,r*.7)],c:spot,bias:-.02}); }
    /* the bobbed tail: short, black-tipped on top, white beneath */
    const tl=[B(-11.4,15.2,0,1.6),B(-13.4,15.5,0,1.4),B(-14.6,15.4,0,1.1)];
    parts.push({p:tl,c:coat,bias:.1},{p:[[tl[2][0]-.1,tl[2][1]+.5,0,.85]],c:dk,bias:.05},{p:[[tl[1][0],tl[1][1]-.7,0,.9],[tl[2][0],tl[2][1]-.6,0,.7]],c:pale,bias:.08});
    /* broad head, short muzzle, the flared ruff of cheek fur, pointed ears with black tufts */
    const hd=f.head, hc0=B(lerp(9.8,11.2,Math.max(0,hd)),lerp(16.0,6.6,Math.max(0,hd))+Math.max(0,-hd)*1.5,0,0), hc=[hc0[0],hc0[1],hc0[2]];
    parts.push({p:[B(6.6,14.6,0,3.6),[hc[0]-.9,hc[1]-.4,hc[2],2.9]],c:coat,sh});
    const hp=hd*.9+.04, hy=f.turn, Hh=(u,v,w,r)=>{ const t2=headPt(hc,hp,hy,u,v,w); return [t2[0],t2[1],t2[2],r]; };
    parts.push({p:[Hh(-.3,.1,0,3.2),Hh(1.0,-.1,0,2.9)],c:coat,sh});
    for(const sd of [-1,1]){ parts.push({p:[Hh(.2,-1.3,2.3*sd,1.6),Hh(-.4,-2.4,3.0*sd,1.15),Hh(-1.1,-2.9,3.1*sd,.6)],c:pale,bias:-.04});
      parts.push({p:[Hh(-.5,-1.9,2.9*sd,.32),Hh(-.9,-2.7,3.1*sd,.25)],c:dk,bias:-.06}); }                                        /* barred ruff */
    parts.push({p:[Hh(2.4,-.8,0,1.6),Hh(3.3,-1.1,0,1.0)],c:pale,bias:-.1},{p:[Hh(3.9,-.85,0,.42)],c:rgb(mixv(P.dark,[150,90,80],.3)),bias:-.3});
    parts.push({p:[Hh(.6,1.9,0,.45),Hh(-1.4,2.6,0,.4)],c:dk,bias:-.08});                                                         /* forehead stripes */
    for(const sd of [-1,1]){ parts.push({p:[Hh(1.9,.75,1.55*sd,.5)],c:rgb(mulv([196,170,90],.62)),bias:-.4},{p:[Hh(2.05,.75,1.7*sd,.22)],c:"rgba(8,6,4,.95)",bias:-.5});
      parts.push({poly:true,p:earPts(Hh,sd,[-.6,2.3,1.6],[-.12,.95,.3],[.8,.05,.5],3.3,1.6,[[0,1],[.5,.6],[.85,.22]]),c:far(sd)?dk:rgb(mixv(P.coat,P.dark,.45))});
      parts.push({p:[Hh(-.95,5.4,2.25*sd,.26),Hh(-1.0,7.0,2.45*sd,.12)],c:dk,bias:-.1}); }
    return parts;
  }
  function drawBobcat(dt,dark){
    if(!bobcat){ nextBobcat-=dt; if(nextBobcat<=0){ if(groundBusy()) nextBobcat=12; else startBobcat(); } return; }
    foxStep(bobcat,dt); if(bobcat.gone){ bobcat=null; nextBobcat=rnd(200,360); return; }
    const f=bobcat, s=toScreen(f.Xw,f.Dw), k=.16*s.g/26, moving=f.state==="run"||f.state==="leave";
    if(f.pw){ const dX=f.Xw-f.pw[0], dZ=trueZ(f.Dw)-f.pw[1]; if(moving&&Math.hypot(dX,dZ)>1e-5) f.yaw=angTo(f.yaw,Math.atan2(dZ,dX),dt*6); } idleTurn(f,dt,moving); keepOnLawn(f); f.pw=[f.Xw,trueZ(f.Dw)];
    f.ct=(f.ct||0)-dt;
    if(f.ct<=0||!f.pal){ f.ct=1.5; const G=groundPal(s,dark), lit=dark?.48:.62; f.pal={...G, coat:mixv(mulv([156,122,88],lit),mulv(G.g,.5),.12), pale:mulv([222,210,188],lit), dark:mulv([34,26,20],lit)}; }
    if(!f.blades) f.blades=Array.from({length:10},()=>({ox:rnd(-20,20),h:rnd(3,6),lean:rnd(-.5,.5),c:Math.random()}));
    critterBlit(null,null,f,s,k,f.pal,()=>bobcatParts(f,f.pal,moving||f.turning),f.yaw,40,64,18,f.blades,f.alpha);
  }

  /* ---- a Brittany: tears in at a gallop, quarters back and forth with its nose down, locks up on point, a bird flushes, and off it goes ---- */
  let dog=null, nextDog=95;
  function startDog(){
    const b=foxBounds(), side=Math.random()<.5, g=rnd(Math.max(b.gmin,lawnMinG(side?W*.9:W*.1))+25,b.gmax-20), p=toGround(side? W+70 : -70, gnd().vy+g);
    dog={Xw:p.Xw,Dw:p.Dw,yaw:side?Math.PI:0,ph:0,state:"run",t:0,legs:7+Math.floor(Math.random()*4),dir:side?-1:1,alpha:1,head:0,turn:0,pointed:false};
    dogTarget(dog,true); arrive(side? W+70 : -70,dog);
  }
  /* ---- when the page opens, the Brittany and the Lab tear in together and chase each other around the lawn, taking turns being "it" ---- */
  let rompAt=1.2;
  let cur=null, callDist=0, lastCall=-99, lastWhistle=-1e9; const trail=[], puffs=[];
  document.addEventListener("pointermove",e=>{ if(!on) return; const x=(e.clientX-(1-camZ)*W/2-camX)/camZ, y=(e.clientY-(1-camZ)*H/2-camY)/camZ;
    const prev=cur; const fresh=!cur||t-cur.t>1.5; cur={x,y,t,sess:fresh?((cur&&cur.sess)||0)+1:cur.sess};
    if(fresh){ const now=performance.now(); if(now-lastWhistle>=10000){ lastWhistle=now; if(typeof natureSfx!=="undefined"&&natureSfx.whistle) natureSfx.whistle((e.clientX/W*2-1)*.6); } }   /* starting to move the cursor whistles for the dogs, at most once every ten seconds */ if(!trail.length||Math.hypot(x-trail[trail.length-1].x,y-trail[trail.length-1].y)>6) { const dz=Math.random()**1.4; trail.push(Object.assign({x,y,t,dz,r:rnd(4.5,7)*(.55+.75*dz),rot:rnd(0,6.28),spin:rnd(-3,3)*(.5+.6*dz),vx:rnd(-12,12),ph:rnd(0,6)},pick(WILD)())); } if(trail.length>50) trail.shift();
    if(false){ if(prev) callDist+=Math.hypot(x-prev.x,y-prev.y); if(callDist>W*1.2&&t-lastCall>6){ callDist=0; lastCall=t; startRomp(); } } else callDist=0; },{passive:true});   /* wave the cursor around a bit and the dogs come running back */
  const chasing=()=>cur&&t-cur.t<2.6;
  /* each dog has a mind of its own: it notices the cursor late (or not at all this time), and follows a lagging, smoothed idea of where it is */
  function dogWantsChase(d,dt){
    if(!chasing()) { d.csess=null; d.led=false; return false; }
    /* a dog only takes up the lead when the cursor comes close to it, and lets it go if the cursor wanders well off, so the rest of the scene can be explored in peace */
    { const s0=toScreen(d.Xw,d.Dw), dist=Math.hypot(cur.x-s0.x,(cur.y-s0.y)*1.3);
      if(!d.led){ const o=d===dog?lab:dog, tag=o&&o.led&&o.chase&&!o.gone&&!o.hidden;   /* once one dog is following, the other tags along a beat behind */
        if(dist>Math.max(110,W*.09)&&!tag) return false; d.led=true; d.late=tag&&dist>Math.max(110,W*.09); d.csess=null; d.fx=s0.x; d.fy=s0.y; }
      else if(dist>Math.max(320,W*.3)){ d.led=false; return false; } }
    if(d.csess!==cur.sess){ d.csess=cur.sess; d.react=rnd(.25,1.8)*(d.lab?1.3:1)+(d.late?rnd(.6,1.6):0); d.ignore=Math.random()<.08; d.lagK=rnd(.6,2.2); d.fx=d.fx??cur.x; d.fy=d.fy??cur.y; }
    if(d.ignore) return false; d.react-=dt; if(d.react>0) return false;
    if(!d.chase&&d.fx==null){ d.fx=cur.x; d.fy=cur.y; }
    const k=Math.min(1,dt*d.lagK); d.fx+=(cur.x-d.fx)*k; d.fy+=(cur.y-d.fy)*k; return true; }
  function chaseTarget(d){ const x=d.fx, lo=lawnMinG(x)+10, hi=foxBounds().gmax-6, g=Math.max(lo,Math.min(hi-16,d.fy-gnd().vy+(d.lab?14:-10))), p=toGround(Math.max(20,Math.min(W-20,x+(d.lab?-50:50))),gnd().vy+g); d.tX=p.Xw; d.tD=p.Dw; }
  let scareT=0;
  /* straight away from the dog: off the side of the lawn opposite it, angling nearer or farther the way the dog's approach pushes it */
  function awayFrom(s,d){ let ux=s.x-d.x, uy=(s.y-d.y)*1.6; const L=Math.hypot(ux,uy)||1; ux/=L; uy/=L; if(Math.abs(ux)<.6) ux=(ux>=0?1:-1)*.6;
    const tx=ux>0? W+160 : -160, b=foxBounds(), lo=gnd().vy+Math.max(b.gmin,lawnMinG(Math.max(0,Math.min(W,tx)))), hi=gnd().vy+b.gmax, ty=Math.max(lo,Math.min(hi,s.y+uy*Math.abs(tx-s.x)*.3));
    return toGround(tx,ty); }
  function dogScare(dt){                                                                          /* some animals bolt the moment a dog comes near, some let it get close, a few hardly care */
    scareT-=dt; if(scareT>0) return; scareT=.3;
    const dogs=[dog,lab].filter(d=>d&&!d.gone&&!d.hidden&&(d.state==="run"||d.chase)); if(!dogs.length) return;
    const nerve=o=>o.bird? 2.6 : o.nerve??(o.nerve=Math.random()<.15? 0 : rnd(.4,1.6));   /* birds are always terrified of the dogs */
    const near=(sx,sy,o)=>{ for(const d of dogs){ const s=toScreen(d.Xw,d.Dw); if(Math.hypot(s.x-sx,(s.y-sy)*1.6)<W*.2*nerve(o)) return s; } return null; };
    for(const f of [fox,skunk,cub,mom,bobcat,coyote,coy2,pheasW]){ if(!f||f.gone||f.state==="leave") continue; if(f===pheasW) f.bird=true; const s=toScreen(f.Xw,f.Dw), d=near(s.x,s.y,f); if(!d) continue;
      const p=awayFrom(s,d); f.state="leave"; f.tX=p.Xw; f.tD=p.Dw; f.ang=null; f.spd=Math.max(f.spd||1,1.3); f.cad=Math.max(f.cad||1,1); f.head=0; }
    for(const q of sqs){ if(q.leaving) continue; const s=toScreen(q.Xw,q.Dw), d=near(s.x,s.y,q); if(d){ q.leaving=true; q.state="run"; q.yawT=null; const p=toGround(s.x+(s.x<d.x?-200:200),gnd().vy+lawnMinG(s.x)+4); q.tX=p.Xw; q.tD=p.Dw; q.lastD=1e9; } }
    for(const w of wcs){ w.bird=true; if(w.leaving) continue; const s=toScreen(w.Xw,w.Dw), d=near(s.x,s.y,w); if(d){ w.leaving=true; w.state="run"; const p=awayFrom(s,d); w.tX=p.Xw; w.tD=p.Dw; } }
    for(const bn of buns) if(bn.init&&bn.state!=="hop"&&near(bn.x,bn.y,bn)){ const d=near(bn.x,bn.y,bn); bn.state="hop"; bn.hops=3+Math.floor(Math.random()*3); bn.face=bn.x<d.x?-1:1; bn.hx=bn.x; bn.tx=Math.max(W*.06,Math.min(W*.94,bn.x+bn.face*rnd(14,26))); bn.hop=0; }
    if(doe&&!doe.leaving){ const s=toScreen(doe.Xw,doe.Dw), d=near(s.x,s.y,doe); if(d){ doe.leaving=true; const p=awayFrom(s,d); doe.tX=p.Xw; doe.tD=p.Dw; doe.state="walk"; } }
    if(hen&&!hen.fled){ hen.bird=true; const s=toScreen(hen.Xw,hen.Dw), d=near(s.x,s.y,hen); if(d){ hen.fled=true; hen.stop=0; const p=awayFrom(s,d); hen.tX=p.Xw; hen.tD=p.Dw; hen.spdK=6; } }   /* the hen hurries her poults off at a run */
    if(pheasW&&!pheasW.gone&&pheasW.state!=="leave"){ pheasW.bird=true; }
    /* a dog running hard through the cover sometimes puts up a bird: a pheasant or grouse bursts out ahead of it */
    if(dogs.some(d=>d.chase||d.romp>0)&&!grouse&&!pheas&&Math.random()<.04){ if(Math.random()<.55) flushPheasant(); else flushGrouse(); }
    if(turks&&turks.mode!=="leave"){ turks.bird=true; const s=toScreen(turks.cX,turks.cD), d=near(s.x,s.y,turks); if(d){ const p=awayFrom(s,d); turks.mode="leave"; turks.gX=p.Xw; turks.gD=p.Dw; turks.dir=s.x<d.x?-1:1; turks.birds.forEach(b=>{ b.state="walk"; b.fanT=0; }); } }
  }
  /* what the trail scatters: petals and little blossoms of Appalachian wildflowers, plus the odd leaf and seed */
  const WF=(f,cols,extra)=>()=>Object.assign({f,c:pick(cols)},extra||{});
  const WILD=[
    WF("petal",[[250,248,240],[244,240,232],[255,252,246]]),                   /* white: trillium, dogwood, bloodroot, ox-eye daisy */
    WF("long",[[250,250,244],[240,238,230]]),                                  /* daisy and fleabane ray petals */
    WF("notch",[[250,246,238]]),                                                /* white phlox */
    WF("petal",[[250,248,240],[236,232,226]]),
    WF("petal",[[244,190,40],[236,170,30]],{eye:[70,40,20]}),                 /* black-eyed Susan */
    WF("long",[[250,220,70],[244,200,50]]),                                    /* tickseed, goldenaster */
    WF("petal",[[255,236,150],[250,226,120]]),                                  /* evening primrose */
    WF("petal",[[252,214,64],[246,196,40]]),                                    /* sneezeweed */
    WF("petal",[[244,130,40],[250,160,50]]),                                    /* flame azalea */
    WF("petal",[[236,92,40],[244,120,50]]),                                     /* butterfly weed */
    WF("petal",[[200,40,52],[214,36,40]]),                                      /* cardinal flower */
    WF("notch",[[222,50,72],[236,70,90]]),                                      /* fire pink */
    WF("petal",[[250,170,196],[248,206,220],[236,140,180]]),                   /* mountain laurel, rhododendron */
    WF("notch",[[250,140,170],[244,120,160]]),                                  /* wild phlox */
    WF("long",[[206,110,170],[220,130,186]]),                                  /* purple coneflower */
    WF("long",[[130,160,232],[150,176,240]]),                                  /* chicory */
    WF("bell",[[110,140,224],[140,160,236]]),                                   /* a Virginia bluebell */
    WF("dots",[[236,196,50],[226,180,40]]),                                     /* a bit of goldenrod */
    WF("seed",[[248,246,240]]),                                                 /* a drifting dandelion seed */
    WF("leaf",[[198,72,40],[220,128,40],[180,52,44],[214,170,60]]),             /* a little maple or sumac leaf */
  ];
  const WILDN=["Flowering dogwood petal","Ox-eye daisy petal","White phlox petal","Bloodroot petal","Black-eyed Susan petal","Tickseed petal","Evening primrose petal","Sneezeweed petal","Flame azalea petal","Butterfly weed blossom","Cardinal flower petal","Fire pink petal","Mountain laurel blossom","Wild phlox petal","Purple coneflower petal","Chicory petal","Virginia bluebell","Goldenrod","Dandelion seed","Staghorn sumac leaf"];
  WILD.forEach((fn,i)=>{ WILD[i]=()=>Object.assign(fn(),{n:WILDN[i]}); });
  function drawWild(p,lt,flip){ const r=p.r, c=rgb(mulv(flip>0?p.c:mulv(p.c,.84),lt)), shade=rgb(mulv(p.c,.62*lt),.5);
    const petal=(len,wid)=>{ ctx.beginPath(); ctx.moveTo(0,-len); ctx.bezierCurveTo(wid,-len*.7,wid*.9,len*.6,0,len*.85); ctx.bezierCurveTo(-wid*.9,len*.6,-wid,-len*.7,0,-len); ctx.fill(); };
    ctx.fillStyle=c;
    if(p.f==="petal"){ petal(r*1.3,r); ctx.fillStyle=shade; ctx.beginPath(); ctx.ellipse(0,r*.7,r*.25,r*.35,0,0,6.283); ctx.fill(); }
    else if(p.f==="long"){ petal(r*1.7,r*.55); ctx.strokeStyle=shade; ctx.lineWidth=r*.12; ctx.beginPath(); ctx.moveTo(0,-r*1.2); ctx.lineTo(0,r*1.1); ctx.stroke(); }
    else if(p.f==="notch"){ ctx.beginPath(); ctx.moveTo(0,r*1.2); ctx.bezierCurveTo(r*.9,r*.4,r*1.1,-r*.6,r*.55,-r*1.25); ctx.lineTo(r*.15,-r*.75); ctx.lineTo(0,-r*1.2); ctx.lineTo(-r*.15,-r*.75); ctx.lineTo(-r*.55,-r*1.25); ctx.bezierCurveTo(-r*1.1,-r*.6,-r*.9,r*.4,0,r*1.2); ctx.fill(); }   /* the fringed tip of fire pink */
    else if(p.f==="flower"){ const n=p.n, L=r*(p.pl||1); for(let i=0;i<n;i++){ ctx.save(); ctx.rotate(i/n*6.283); ctx.translate(0,-L*.75); ctx.scale(1,1); petal(L*.62,L*(n>8?.17:.42)); ctx.restore(); }
      ctx.fillStyle=rgb(mulv(p.eye,lt)); ctx.beginPath(); ctx.arc(0,0,L*(n>8?.36:.3),0,6.283); ctx.fill(); }
    else if(p.f==="bell"){ ctx.beginPath(); ctx.moveTo(-r*.35,-r*1.2); ctx.quadraticCurveTo(-r*.5,r*.2,-r*.95,r*1); ctx.quadraticCurveTo(0,r*1.35,r*.95,r*1); ctx.quadraticCurveTo(r*.5,r*.2,r*.35,-r*1.2); ctx.closePath(); ctx.fill();
      ctx.fillStyle=p.tip? rgb(mulv(p.tip,lt)) : shade; ctx.beginPath(); ctx.ellipse(0,r*1.02,r*.7,r*.2,0,0,6.283); ctx.fill(); }
    else if(p.f==="dots"){ ctx.strokeStyle=rgb(mulv([120,120,50],lt)); ctx.lineWidth=r*.12; ctx.beginPath(); ctx.moveTo(0,r*1.3); ctx.lineTo(0,-r*1.3); ctx.stroke();
      for(let i=0;i<9;i++){ const yy=-r*1.2+i*r*.3, sd=i%2?1:-1; ctx.beginPath(); ctx.arc(sd*r*(.25+.1*(i%3)),yy,r*.22,0,6.283); ctx.fill(); } }
    else if(p.f==="seed"){ ctx.strokeStyle=c; ctx.lineWidth=r*.08; ctx.beginPath(); ctx.moveTo(0,r*1.3); ctx.lineTo(0,-r*.2); for(let i=0;i<9;i++){ const a=-Math.PI/2+(i/8-.5)*2.4; ctx.moveTo(0,-r*.2); ctx.lineTo(Math.cos(a)*r*1.1,-r*.2+Math.sin(a)*r*1.1); } ctx.stroke(); ctx.fillStyle=rgb(mulv([140,110,70],lt)); ctx.beginPath(); ctx.ellipse(0,r*1.35,r*.12,r*.25,0,0,6.283); ctx.fill(); }
    else if(p.f==="leaf"){ ctx.beginPath(); for(let i=0;i<=5;i++){ const a=-Math.PI/2+(i-2.5)*.55, rr=i%2? r*.7 : r*1.3; i? ctx.lineTo(Math.cos(a)*rr,Math.sin(a)*rr) : ctx.moveTo(Math.cos(a)*rr,Math.sin(a)*rr); } ctx.lineTo(r*.2,r*.5); ctx.lineTo(0,r*1.1); ctx.lineTo(-r*.2,r*.5); ctx.closePath(); ctx.fill();
      ctx.strokeStyle=shade; ctx.lineWidth=r*.1; ctx.beginPath(); ctx.moveTo(0,r*1.1); ctx.lineTo(0,-r*.9); ctx.stroke(); }
    if(p.eye&&p.f==="petal"){ ctx.fillStyle=rgb(mulv(p.eye,lt),.55); ctx.beginPath(); ctx.ellipse(0,r*.95,r*.18,r*.22,0,0,6.283); ctx.fill(); }
  }
  function drawTrail(dt,dark){                                                                    /* the cursor's trail: little motes of light that drift and fade */
    for(let i=trail.length-1;i>=0;i--){ const p=trail[i], age=t-p.t, a=Math.min(1,(2.6-age)/1.1); if(a<=0){ trail.splice(i,1); continue; }   /* petals shaken loose: they flutter up off the air toward you, growing, going soft and fading as they pass */
      const dz=p.dz??.6, k=1+age*age*(.25+1.1*dz), ex=dt*(.15+.65*dz)*age; p.x+=(p.x-W/2)*ex+dt*(p.vx+Math.sin(t*3+p.ph)*16); p.y+=(p.y-H*.45)*ex+dt*(6+Math.sin(t*2.2+p.ph)*10); p.rot+=dt*p.spin; const flip=Math.cos(t*4+p.ph);
      const lt=dark?.8:.95; if(!p.c) Object.assign(p,pick(WILD)());
      ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot); ctx.scale(k,k*Math.max(.15,Math.abs(flip))); ctx.globalAlpha=a*(.35+.6*dz)/Math.max(1,k*.5);
      if(!p.air){ const ip=toImg(p.x,p.y); p.air=mixv((ip&&ip[0]>=0&&ip[0]<=1&&ip[1]>=0&&ip[1]<=1&&sampleAt(ip[0],ip[1]))||[220,190,150],[255,214,170],.3); p.c0=p.c; }
      const hz=Math.max(0,.8-dz)*.7; p.c=hz>0? mixv(p.c0,p.air,hz) : p.c0;                                                      /* the farther ones take on the color of the air behind them */
      drawWild(p,lt,flip); ctx.restore(); }
    for(let i=puffs.length-1;i>=0;i--){ const p=puffs[i], a=1-(t-p.t)/.7; if(a<=0){ puffs.splice(i,1); continue; } p.r+=dt*14*p.k; p.y-=dt*5*p.k;      /* dust and bits of grass kicked up behind the running dogs */
      ctx.fillStyle=rgb(dark?[90,80,60]:[196,176,130],.22*a); ctx.beginPath(); ctx.ellipse(p.x,p.y,p.r,p.r*.55,0,0,6.283); ctx.fill(); }
  }
  function startRomp(){
    const b=foxBounds(), side=Math.random()<.5, x0=side? W+70 : -70, g=rnd(Math.max(b.gmin,lawnMinG(side?W*.9:W*.1))+40,b.gmax-30);
    const p=toGround(x0,gnd().vy+g), q=toGround(side? W+170 : -170,gnd().vy+g+rnd(-25,25)), len=rnd(26,34);
    dog={Xw:p.Xw,Dw:p.Dw,yaw:side?Math.PI:0,ph:0,state:"run",t:0,legs:4+Math.floor(Math.random()*3),dir:side?-1:1,alpha:1,head:0,turn:0,pointed:false,romp:len,it:false,lane:-1};
    lab={lab:true,Xw:q.Xw,Dw:q.Dw,yaw:side?Math.PI:0,ph:1.3,state:"run",t:0,legs:3+Math.floor(Math.random()*3),dir:side?-1:1,alpha:1,head:0,turn:0,pointed:true,romp:len,it:true,chase:rnd(2,3),lag:.9,lane:1};
    dog.mate=lab; lab.mate=dog; rompTarget(dog,true); lastArrive=t; nextLab=rnd(220,400);
  }
  function rompTarget(d,first){
    const b=foxBounds(), cur=toScreen(d.Xw,d.Dw), sx=first? W*(d.dir>0?rnd(.3,.45):rnd(.55,.7)) : Math.max(W*.1,Math.min(W*.9,cur.x+(Math.random()<.5?-1:1)*W*rnd(.15,.32))), lo=Math.max(b.gmin,lawnMinG(sx))+12;
    const mid=(lo+b.gmax)/2, g=d.lane<0? rnd(lo,mid-14) : rnd(mid+14,b.gmax-6), p=toGround(sx,gnd().vy+g); d.tX=p.Xw; d.tD=p.Dw;
  }
  function stepRomp(d,dt){
    const m=d.mate&&!d.mate.gone&&d.mate.romp>0? d.mate : null; d.romp-=dt;
    const a=toScreen(d.Xw,d.Dw); (d.hist||(d.hist=[])).push([t,a.x,a.g]); while(d.hist.length&&d.hist[0][0]<t-2) d.hist.shift();   /* where this dog has been, so the other can follow a beat late */
    if(!m||d.romp<=0){ d.romp=0; d.it=false; if(!d.lab) d.legs=Math.min(d.legs,3); dogTarget(d); return false; }
    if(d.it){ d.chase-=dt;
      if(d.chase<=0){ d.it=false; rompTarget(d); return true; }
      /* chasing: head for where the other dog was a moment ago, in its own lane, so it reacts late and turns on its own beat */
      const h=m.hist&&m.hist.find(e=>e[0]>=t-d.lag)||[t,toScreen(m.Xw,m.Dw).x,toScreen(m.Xw,m.Dw).g], b=foxBounds(), lo=Math.max(b.gmin,lawnMinG(h[1]))+12, mid=(lo+b.gmax)/2;
      const gx=h[1]+(a.x<h[1]?-1:1)*.25*h[2], gg=d.lane<0? Math.max(lo,Math.min(mid-14,h[2]-.32*h[2])) : Math.min(b.gmax-6,Math.max(mid+14,h[2]+.32*h[2])), p=toGround(gx,gnd().vy+gg); d.tX=p.Xw; d.tD=p.Dw; }
    return true;
  }
  /* at the end of a dash: a quick stop, a dash somewhere new, or a turn at chasing the other one, each dog deciding for itself */
  function rompArrive(d){
    const m=d.mate, r=Math.random(); d.sm=rnd(.8,1.2);
    if(r<.22){ d.state="pause"; d.t=0; d.st=rnd(.3,1.1); return; }
    if(r<.36){ dogSit(d,true); return; }
    if(r<.62&&m&&!m.it&&m.romp>0){ d.it=true; d.chase=rnd(1.8,3.6); d.lag=rnd(.6,1.2); return; }
    rompTarget(d);
  }
  function dogTarget(d,first){
    const b=foxBounds(), cur=toScreen(d.Xw,d.Dw), sx=first? W*(d.dir>0?rnd(.3,.5):rnd(.5,.7)) : Math.max(W*.08,Math.min(W*.92,cur.x+d.dir*W*rnd(.18,.36))), lo=Math.max(b.gmin,lawnMinG(sx))+10;
    const g= cur.g>(lo+b.gmax)/2? rnd(lo,lerp(lo,b.gmax,.45)) : rnd(lerp(lo,b.gmax,.55),b.gmax), p=toGround(sx,gnd().vy+g); d.tX=p.Xw; d.tD=p.Dw; d.dir*=-1;
  }
  /* sit down for a while, sometimes to have a good scratch */
  function dogSit(d,short){ d.state="sit"; d.t=0; d.st=short? rnd(2,3.6) : rnd(3.5,7); d.lookH=-.15;
    if(Math.random()<.5){ const a=rnd(.7,1.4); d.scr=[a,a+rnd(1.4,2.6)]; } else d.scr=null; }
  function stepDog(d,dt){
    d.t+=dt; d.sitA=(d.sitA||0)+((d.state==="sit"?1:0)-(d.sitA||0))*Math.min(1,dt*5);
    const wasChase=d.chase; d.chase=!d.flee&&d.state!=="leave"&&d.state!=="greet"&&!d.toViewer&&dogWantsChase(d,dt);
    if(d.chase){ chaseTarget(d); if(d.state!=="run") { d.state="run"; d.scratching=false; } }
    else if(wasChase&&d.state==="run"){ if(d.romp>0) rompTarget(d); else dogTarget(d); }
    const romping=!d.chase&&d.state==="run"&&d.romp>0&&stepRomp(d,dt);
    if(d.state==="run"||d.state==="leave"){
      const dX=d.tX-d.Xw, dD=d.tD-d.Dw, dist=Math.hypot(dX,dD*.25)||1e-6, sp=d.flee? 1.6 : d.chase? (d.lab?1.25:1.5) : romping? (d.it?1.3:1.12)*(d.sm||1) : d.toViewer? 1.05 : (d.lab? (d.state==="leave"?1.1:.75) : (d.state==="leave"?.95:.62));
      const pr=d.lp? Math.hypot(d.Xw-d.lp[0],(d.Dw-d.lp[1])*.25) : 1; d.lp=[d.Xw,d.Dw]; d.stl= pr<sp*dt*.2? (d.stl||0)+dt : 0;
      if(d.stl>.8){ d.stl=0; if(d.state==="leave") d.fade=true; else { d.tX=d.Xw; d.tD=d.Dw; } }
      if(d.fade){ d.alpha-=dt*2.5; if(d.alpha<=0){ d.gone=true; return; } }
      if(d.fadeIn){ d.alpha=Math.min(1,d.alpha+dt*3); if(d.alpha>=1) d.fadeIn=false; }
      if(dist<=sp*dt){ d.Xw=d.tX; d.Dw=d.tD; } else { d.Xw+=dX/dist*sp*dt; const sD=dD/dist*sp*dt*4; d.Dw+=Math.sign(sD)*Math.min(Math.abs(sD),Math.abs(dD)); }
      d.ph+=dt*(d.lab?4.6:4.2)*(romping?1.45:1); d.head+=((d.state==="run"&&!romping&&!d.toViewer? (d.lab?.25:.45) : 0)-d.head)*Math.min(1,dt*6);               /* nose down, working the scent */
      if(d.state==="leave"){ const s=toScreen(d.Xw,d.Dw); if(s.x<-90||s.x>W+90||dist<.02){ d.alpha-=dt*3; if(d.alpha<=0) d.gone=true; } return; }
      if(d.chase){ if(dist<.03) d.ph-=dt*(d.lab?4.6:4.2)*.9; else { d.puffT=(d.puffT||0)-dt; if(d.puffT<=0){ d.puffT=.07; const s2=toScreen(d.Xw,d.Dw), k=s2.g/400; puffs.push({x:s2.x+rnd(-6,6)*k,y:s2.y+rnd(-2,2),r:3*k,k,t}); } } return; }   /* at the cursor they stand and wait; running, they kick up dust */
      if(romping){ if(dist<.02&&!d.it) rompArrive(d); return; }
      if(d.toViewer){ if(dist<.02){ d.toViewer=false; d.state="greet"; d.t=0; startGreet(d); } return; }
      if(dist<.02){ d.legs--;
        if(d.toBrush){ d.toBrush=false; d.state="point"; d.t=0; d.pt=rnd(2.6,4.2); d.points=(d.points||0)+1; d.lastPoint=t; d.pointed=true; d.flushed=false; d.yaw=Math.PI/2+(Math.random()<.5?-1:1)*rnd(.55,.9); d.idleYaw=d.yaw; }   /* at the edge of the brush, nose into the cover */
        else if(!d.lab && (d.points||0)<2 && d.legs<=5 && t-(d.lastPoint??-99)>12 && Math.random()<.55){ const sx=Math.max(W*.08,Math.min(W*.92,toScreen(d.Xw,d.Dw).x+rnd(-W*.15,W*.15))), q=toGround(sx,gnd().vy+lawnMinG(sx)+rnd(4,10)); d.tX=q.Xw; d.tD=q.Dw; d.toBrush=true; d.state="run"; }   /* catches a scent and works up to the brush line */
        else if(d.legs<=0){ d.state="leave"; const s=toScreen(d.Xw,d.Dw), p=toGround(d.dir>0? W+140 : -140, gnd().vy+s.g); d.tX=p.Xw; d.tD=p.Dw; }
        else if(Math.random()<.28) dogSit(d,false);
        else if(Math.random()<(d.lab?.5:.3)){ d.state="sniff"; d.t=0; d.st=d.lab?rnd(1.4,3):rnd(.8,1.6); }
        else dogTarget(d); }
      return;
    }
    if(d.state==="sniff"){ d.head+=(1-d.head)*Math.min(1,dt*8); if(d.t>d.st){ d.state="run"; dogTarget(d); } return; }
    if(d.state==="sit"){ d.scratching=!!(d.scr&&d.t>d.scr[0]&&d.t<d.scr[1]);
      d.head+=((d.scratching? .45 : d.lookH??-.15)-d.head)*Math.min(1,dt*6); if(!d.scratching&&Math.random()<dt*.5) d.lookH=rnd(-.35,.1);   /* now and then glances about */
      if(d.t>d.st){ d.state="run"; d.scratching=false; if(d.romp>0) rompTarget(d); else dogTarget(d); } return; }
    if(d.state==="greet"){ d.alpha=Math.max(0,d.alpha-dt*4); if(d.alpha<=0) d.hidden=true; return; }   /* drops out of sight below the view as the close-up takes over */
    if(d.state==="pause"){ d.head+=(-.15-d.head)*Math.min(1,dt*8); if(d.t>d.st){ d.state="run"; rompTarget(d); } return; }   /* a quick stop mid-romp, head up */
    if(d.state==="point"){ d.head+=(-.05-d.head)*Math.min(1,dt*10);                                          /* frozen: head level, tail up, a forepaw lifted */
      if(d.t>d.pt){                                                                                   /* staunch on point, holding... then she pounces into the cover */
        const fx=Math.cos(d.yaw), sx0=toScreen(d.Xw,d.Dw), g0=sx0.g, Xw=d.Xw+fx*40/g0, fs=toGround(sx0.x+fx*40, gnd().vy+lawnMinG(sx0.x)-rnd(6,16)), Dw=fs.Dw;   /* the bird is in the brush just beyond the edge */
        d.state="pounce"; d.t=0; d.pz={X0:d.Xw,D0:d.Dw,X1:d.Xw+(Xw-d.Xw)*.75,D1:d.Dw+(Dw-d.Dw)*.75,fX:Xw,fD:Dw}; } }
    if(d.state==="pounce"){ const P=d.pz, u=Math.min(1,d.t/.55), e=u<.5? 2*u*u : 1-2*(1-u)*(1-u);
      d.Xw=lerp(P.X0,P.X1,e); d.Dw=lerp(P.D0,P.D1,e); d.hop=Math.sin(u*Math.PI); d.ph+=dt*16; d.head+=(.35*Math.sin(u*Math.PI)-d.head)*Math.min(1,dt*12);   /* up and over, front feet first, nose down into the grass */
      if(!d.flushed && u>.7){ d.flushed=true; const sc=toScreen(P.fX,P.fD), at=Object.assign([sc.x,sc.y],{Xw:P.fX,Dw:P.fD});   /* and the bird goes up right in front of her */
        if(Math.random()<.5){ if(!pheas&&!grouse){ pheas=flyStart("pheas",at); flushBits(at,22,["#7a5a2e","#9c7a3c","#5e4a26","#b08a48","#c9a24e","#a33b25"],1.2); if(typeof natureSfx!=="undefined") natureSfx.flush("pheas",at[0]/W); } else flushQuail(at); }
        else flushQuail(at);
        d.afterFlush=rnd(.7,1.2); }
      if(u>=1){ d.hop=0; d.afterFlush-=dt; if(d.afterFlush<=0){ d.state="run"; dogTarget(d); } } return; }
  }
  function dogParts(d,P,moving){
    const q=d.ph*Math.PI*.9, yaw=d.yaw, far=z=>z*Math.cos(yaw)>0, parts=[], point=d.state==="point";
    const wh=rgb(P.white), whF=rgb(mulv(P.white,.8)), or=rgb(P.orange), orF=rgb(mulv(P.orange,.8)), sh=[rgb(mulv(P.white,.7)),rgb(mixv(P.white,[255,215,160],.2))];
    const bounce=moving? Math.max(0,Math.sin(q))*1.6 : 0, pitchB=moving? Math.sin(q+.6)*.06 : 0, sA=d.sitA||0, sa=.62*sA, sc=Math.cos(sa), ss=Math.sin(sa);
    /* sitting: the whole body tips up about the shoulders, so the rump drops to the grass and the head rises */
    const T=(x,y)=>{ const c=Math.cos(pitchB), s=Math.sin(pitchB), dy=y-15; let X=x*c-dy*s, Y=15+bounce+x*s+dy*c; if(sa){ const rx=X-6.6, ry=Y-13.4; X=6.6+rx*sc-ry*ss; Y=13.4+rx*ss+ry*sc; } return [X,Y]; }, B=(x,y,z,r)=>{ const t2=T(x,y); return [t2[0],t2[1],z,r]; };
    for(const [lx,ly,z,ph,hind] of [[6.6,13.4,-2.3,0,0],[6.6,13.4,2.3,.4,0],[-8,14.2,-2.5,Math.PI,1],[-8,14.2,2.5,Math.PI+.4,1]]){
      const sw=moving?Math.sin(q+ph):0, lift=moving?Math.max(0,-Math.cos(q+ph)):0, top=T(lx,ly), up=point&&!hind&&z*Math.cos(yaw)<0;
      let segs=hind? [[5.8,.35+.75*sw,1.7],[5.6,-.6+.75*sw-lift*.5,1.15],[4.2,.08+.75*sw+lift*.5,.95]] : up? [[5.8,.5,1.5],[5.4,-1.6,1.05],[1.4,-2.2,.95]] : [[5.8,-.12+.8*sw,1.5],[6.2,.05+.8*sw-lift*1.5,1.05],[1.4,.3+.8*sw-lift*1.8,.95]];
      if(hind&&sA>0){ const near=z*Math.cos(yaw)<0; let fold=[[5.0,1.35,1.7],[4.4,-1.3,1.15],[3.4,1.5,.95]];          /* haunches folded under, hind paws flat out front */
        if(d.scratching&&near&&sA>.8){                                       /* the near hind foot up behind the ear, going like mad */
          const hd0=Math.max(0,d.head), hcS=T(lerp(12.6,14.2,hd0),lerp(22.6,9,hd0)), o=Math.sin(t*32), zz=z*1.5;
          const F=[hcS[0]-2.4+o*.9,hcS[1]-1.6+o*.7], K=[top[0]+6.4,top[1]-1.4], A=[F[0]+.6,F[1]-6.2+o*.5];
          parts.push({p:[[top[0],top[1],zz,2.7],[K[0],K[1],zz,1.4],[A[0],A[1],zz,.9],[F[0],F[1],zz,.85]],c:rgb(mulv(P.white,.72)),bias:-.2}); continue; }
        segs=segs.map((g,i)=>[lerp(g[0],fold[i][0],sA),lerp(g[1],fold[i][1],sA),g[2]]); }
      const ch=legChain(top[0],top[1],z,hind?2.9:2.4,segs); parts.push({p:ch,c:far(z)?whF:wh,sh:far(z)?null:sh});
    }
    const tor=d.lab? [[-8.8,15.4,4.8],[-4,15.6,5.3],[1,15.7,5.6],[5.6,16.4,5.3]] : [[-8.6,15.6,4.2],[-4,15.8,4.6],[1,15.9,5.0],[5.6,16.6,4.8]];
    parts.push({p:tor.map(([a,b,r])=>B(a,b,0,r)),c:wh,sh});
    if(d.lab){ /* a long, full tail: out from the rump, sweeping up in a curve, feathered and bushy, wagging hardest at the tip */
      const wag=Math.sin(t*(moving?9:6))*.55; let px=-11.2, py=17.2, pz=0; const tl=[B(px,py,pz,1.9)], R=[2.3,2.6,2.6,2.5,2.3,2.0,1.6,1.1];
      for(let i=0;i<8;i++){ const a=-.15+i*.2, step=1.75; px-=Math.cos(a)*step; py+=Math.sin(a)*step; pz=wag*(i+1)*.55; tl.push(B(px,py,pz,R[i])); }
      parts.push({p:tl,c:wh,sh,bias:.1}); }
    else { parts.push({p:[[-6.4,17.6,2.6],[-2,18.4,2.8],[2.6,18.6,2.6]].map(([a,b,r])=>B(a,b,0,r)),c:or,bias:-.02});      /* orange saddle */
    parts.push({p:[B(-9,16.6,0,2.4)],c:or,bias:-.02});
    parts.push({p:[B(-12.4,17.4,0,1.2),B(-14.2,point?20.4:18.8,0,.95)],c:or,bias:.1}); }                          /* short docked tail, straight up on point */
    const hd=d.head, hc0=T(lerp(12.6,14.2,Math.max(0,hd)),lerp(22.6,9,Math.max(0,hd))-(point?1.2:0)), hc=[hc0[0],hc0[1],0];
    parts.push({p:[B(8.2,17.4,0,3.4),[hc[0]-1,hc[1]-.6,0,2.4]],c:wh,sh});
    const hp=hd*1.0+.08+sa*.9, Hh=(u,v,w,r)=>{ const t2=headPt(hc,hp,0,u,v,w); return [t2[0],t2[1],t2[2],r]; };
    parts.push({p:[Hh(-.2,.1,0,d.lab?3.2:2.9),Hh(1.6,-.3,0,d.lab?2.8:2.5)],c:d.lab?wh:or,sh:null});
    parts.push({p:[Hh(3.4,-.9,0,d.lab?2.0:1.75),Hh(5.2,-1.2,0,d.lab?1.6:1.35)],c:wh,bias:-.05}); if(!d.lab) parts.push({p:[Hh(-.4,1.6,0,.7),Hh(2.6,.5,0,.55)],c:wh,bias:-.1});   /* muzzle; the Brittany's white blaze */
    parts.push({p:[Hh(5.9,-1.05,0,.65)],c:rgb(P.nose),bias:-.3});
    for(const sd of [-1,1]){ const flap=moving? Math.sin(q*2)*.6 : 0;
      parts.push({p:[Hh(-.3,1.3,2.4*sd,1.15),Hh(-.6+flap*.4,-1.4,2.9*sd,1.45),Hh(-.3+flap,-3.0,2.7*sd,1.0)],c:far(sd)?orF:or,bias:-.06});
      parts.push({p:[Hh(1.9,.55,1.9*sd,.42)],c:"rgba(30,16,8,.95)",bias:-.4}); }
    return parts;
  }
  /* ---- before it leaves, the Brittany runs right up to you: its front paws hook over the bottom of the view, it pulls itself up, and gives you a few good licks ---- */
  let greet=null; const smears=[]; const gcv=document.createElement("canvas"), gx=gcv.getContext("2d"); const GREET_LEN=8.2, GR=.62;
  function startGreet(d){ const s=toScreen(d.Xw,d.Dw), sp=(n,f)=>Array.from({length:n},f);
    greet={t:0,x:Math.max(W*.3,Math.min(W*.7,s.x)),dog:d,seed:rnd(0,6),lastLick:-1,
      chest:sp(80,()=>[rnd(-76,76),rnd(30,260),rnd(.6,1.3)]), muz:sp(26,()=>{ const a=rnd(0,6.28), r=Math.sqrt(Math.random()); return [Math.cos(a)*r*30,16+Math.sin(a)*r*18,rnd(.7,1.3)]; }),
      leg:sp(16,()=>[rnd(-12,12),rnd(14,150),rnd(.8,1.6)]), fur:sp(40,()=>[rnd(0,1),rnd(.6,1.2)])}; }
  const ease=x=>x<=0?0:x>=1?1:x*x*(3-2*x);
  function drawGreet(dt,dark){
    for(const m of smears) m.a-=dt*.11;
    while(smears.length&&smears[0].a<=0) smears.shift();
    for(const m of smears){ ctx.save(); ctx.globalAlpha=Math.min(1,m.a); ctx.translate(m.x,m.y); ctx.rotate(m.r); ctx.scale(1,.32); const g=ctx.createRadialGradient(0,0,0,0,0,m.w); g.addColorStop(0,"rgba(255,248,236,.3)"); g.addColorStop(.6,"rgba(255,248,236,.12)"); g.addColorStop(1,"rgba(255,248,236,0)"); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(0,0,m.w,0,6.283); ctx.fill(); ctx.restore(); }   /* a faint wet streak where it licked the glass */
    if(!greet) return;
    const g=greet; g.t+=dt; const T=g.t;
    if(T>=GREET_LEN){ greet=null; const d=g.dog; if(d&&!d.gone){ d.hidden=false; d.alpha=0; d.fadeIn=true; d.state="leave"; d.ang=null; const s=toScreen(d.Xw,d.Dw), side=g.x<W/2? -1 : 1, p=toGround(side>0? W+160 : -160, gnd().vy+Math.max(foxBounds().gmin+30,s.g-120)); d.tX=p.Xw; d.tD=p.Dw; } return; }
    const cw=Math.ceil(W*GR), ch=Math.ceil(H*GR); if(gcv.width!==cw||gcv.height!==ch){ gcv.width=cw; gcv.height=ch; }
    const x=gx; x.setTransform(1,0,0,1,0,0); x.clearRect(0,0,cw,ch); x.setTransform(GR,0,0,GR,0,0); x.lineCap="round";
    const S=Math.min(W*1.3,H*1.05)/300, out=ease((T-(GREET_LEN-1.2))/1.05);
    const pawR=ease(T/.6)*(1-ease((T-(GREET_LEN-.75))/.7)), rise=ease((T-.35)/1.1)*(1-out);
    const L0=1.6, L1=GREET_LEN-1.5, lickOn=T>L0&&T<L1, lk=lickOn? Math.pow(Math.max(0,Math.sin((T-L0)*Math.PI*2*1.7)),1.5) : 0, pant=lickOn?0:Math.max(0,Math.sin(T*13))*.6;
    const lt=dark?.6:.8, C=(c,m=1,a=1)=>rgb(mulv(c,lt*m),a);
    const WH=[226,216,200], OR=[184,96,44], ORd=[146,70,32];
    const hy=lerp(H+180*S,H-122*S,rise)+(lickOn? Math.sin(T*8.2)*3*S : 0), tilt=Math.sin(T*1.5+g.seed)*.1+(lickOn? Math.sin(T*4.9)*.035 : 0);
    const furEdge=(pts,col,len,w)=>{ x.strokeStyle=col; x.lineWidth=w; for(const [px,py,nx,ny] of pts){ x.beginPath(); x.moveTo(px,py); x.lineTo(px+nx*len,py+ny*len); x.stroke(); } };
    /* chest and neck, rising behind the head: soft white fur with fine orange ticking */
    x.save(); x.translate(g.x,hy); x.scale(S,S);
    const cg=x.createLinearGradient(-90,0,90,0); cg.addColorStop(0,C(WH,.72)); cg.addColorStop(.55,C(WH,.98)); cg.addColorStop(1,C(WH,.86)); x.fillStyle=cg;
    x.beginPath(); x.moveTo(-42,0); x.quadraticCurveTo(-80,100,-94,430); x.lineTo(94,430); x.quadraticCurveTo(80,100,42,0); x.closePath(); x.fill();
    furEdge(Array.from({length:22},(_,i)=>{ const u=i/21, yy=20+u*200, xx=-(42+38*Math.min(1,u*1.6)); return [xx,yy,-.7,.7]; }),C(WH,.78),5,1.6);
    furEdge(Array.from({length:22},(_,i)=>{ const u=i/21, yy=20+u*200, xx=(42+38*Math.min(1,u*1.6)); return [xx,yy,.7,.7]; }),C(WH,.86),5,1.6);
    x.fillStyle=C(OR,.95,.75); for(const [a,b,r] of g.chest){ x.beginPath(); x.ellipse(a,b,r,r*1.5,0,0,6.283); x.fill(); }
    x.restore();
    /* the head */
    x.save(); x.translate(g.x,hy); x.rotate(tilt); x.scale(S,S);
    const sw=Math.sin(T*8.2)*.07*(lickOn?1:.4);
    for(const sd of [-1,1]){ x.save(); x.translate(sd*33,-42); x.rotate(sd*(.1+sw));                                      /* long, feathered ears hanging at the sides */
      const eg=x.createLinearGradient(0,0,sd*30,0); eg.addColorStop(0,C(ORd)); eg.addColorStop(1,C(OR,1.05)); x.fillStyle=eg;
      x.beginPath(); x.moveTo(0,0); x.bezierCurveTo(sd*26,2,sd*34,40,sd*27,80); x.bezierCurveTo(sd*22,94,sd*2,94,-sd*3,74); x.bezierCurveTo(-sd*7,40,-sd*8,10,0,0); x.fill();
      x.restore(); }
    const hg=x.createRadialGradient(10,-30,6,0,-10,62); hg.addColorStop(0,C(OR,1.12)); hg.addColorStop(1,C(ORd,.9)); x.fillStyle=hg;
    x.beginPath(); x.moveTo(0,-62); x.bezierCurveTo(34,-62,48,-36,46,-12); x.bezierCurveTo(44,6,36,20,30,30); x.lineTo(-30,30); x.bezierCurveTo(-36,20,-44,6,-46,-12); x.bezierCurveTo(-48,-36,-34,-62,0,-62); x.fill();   /* skull and cheeks */
    x.fillStyle=C(WH); x.beginPath(); x.moveTo(-5,-62); x.quadraticCurveTo(0,-64,5,-62); x.quadraticCurveTo(9,-30,15,-6); x.lineTo(-15,-6); x.quadraticCurveTo(-9,-30,-5,-62); x.fill();   /* white blaze up the forehead */
    const mg=x.createRadialGradient(6,10,4,0,18,40); mg.addColorStop(0,C(WH,1.04)); mg.addColorStop(1,C(WH,.8)); x.fillStyle=mg;
    x.beginPath(); x.moveTo(-16,-8); x.bezierCurveTo(-30,-2,-38,14,-34,30); x.bezierCurveTo(-28,46,28,46,34,30); x.bezierCurveTo(38,14,30,-2,16,-8); x.closePath(); x.fill();   /* muzzle */
    x.fillStyle=C(OR,.95,.85); for(const [a,b,r] of g.muz){ x.beginPath(); x.arc(a,b,r,0,6.283); x.fill(); }                 /* freckles */
    for(const sd of [-1,1]){ const ex=sd*20, ey=-20;                                                                     /* amber eyes under heavy lids */
      x.fillStyle=C([34,18,12]); x.beginPath(); x.ellipse(ex,ey,7.6,6.2,sd*.2,0,6.283); x.fill();
      x.fillStyle=C([158,96,40],1.05); x.beginPath(); x.arc(ex,ey+.6,5,0,6.283); x.fill();
      x.fillStyle="rgba(10,5,3,.95)"; x.beginPath(); x.arc(ex,ey+.8,2.7,0,6.283); x.fill();
      x.fillStyle=C(ORd,.95); x.beginPath(); x.ellipse(ex,ey-4.4,8.4,3.6,sd*.2,Math.PI,0); x.fill();
      x.fillStyle="rgba(255,248,236,.85)"; x.beginPath(); x.arc(ex+1.6,ey-.6,1.2,0,6.283); x.fill(); }
    const open=Math.max(lk,pant), mh=5+open*10;
    x.fillStyle=C([46,16,18]); x.beginPath(); x.moveTo(-18,28); x.quadraticCurveTo(0,30+mh*1.7,18,28); x.quadraticCurveTo(0,33,-18,28); x.fill();   /* open mouth */
    const tl=lickOn? 10+lk*52 : 6+pant*14, tx=lickOn? Math.sin(T*10.7)*5*lk : 0, tw=12+lk*6;
    if(tl>2){ const tg=x.createLinearGradient(-tw,0,tw,0); tg.addColorStop(0,C([186,86,100])); tg.addColorStop(.5,C([226,120,130],1.05)); tg.addColorStop(1,C([196,94,108])); x.fillStyle=tg;
      x.beginPath(); x.moveTo(-tw*.8,31); x.bezierCurveTo(-tw,31+tl*.6,-tw*.7+tx,31+tl,tx,31+tl+2); x.bezierCurveTo(tw*.7+tx,31+tl,tw,31+tl*.6,tw*.8,31); x.closePath(); x.fill();
      x.strokeStyle=C([150,62,76]); x.lineWidth=1.1; x.beginPath(); x.moveTo(0,34); x.lineTo(tx*.8,31+tl*.72); x.stroke(); }   /* the tongue, with its centre groove */
    x.strokeStyle=C([70,34,30]); x.lineWidth=1.4; x.beginPath(); x.moveTo(0,15); x.lineTo(0,25); x.stroke();
    const ng=x.createRadialGradient(3,5,1,0,9,14); ng.addColorStop(0,C([150,82,70])); ng.addColorStop(1,C([92,44,38])); x.fillStyle=ng;
    x.beginPath(); x.moveTo(-12,7); x.bezierCurveTo(-12,1,12,1,12,7); x.bezierCurveTo(12,14,4,17,0,17); x.bezierCurveTo(-4,17,-12,14,-12,7); x.fill();   /* liver nose */
    x.fillStyle="rgba(20,8,6,.8)"; for(const sd of [-1,1]){ x.beginPath(); x.ellipse(sd*4.6,10.5,2.3,1.5,sd*.5,0,6.283); x.fill(); }
    x.fillStyle="rgba(255,232,220,.3)"; x.beginPath(); x.ellipse(2,5,4.2,1.9,0,0,6.283); x.fill();
    if(lk>.95&&T-g.lastLick>.4){ g.lastLick=T; const m=x.getTransform(), q=m.transformPoint(new DOMPoint(tx,31+tl)); if(smears.length<8) smears.push({x:q.x/GR,y:q.y/GR,w:rnd(14,22)*S,r:rnd(-.6,.6),a:.9}); }
    x.restore();
    /* front legs and paws hooked over the bottom edge: they grab first, kneading a little, and pull as it climbs */
    for(const sd of [-1,1]){
      const kn=lickOn? Math.sin(T*6+sd*1.4)*3.5*S : 0, px=g.x+sd*60*S+(lickOn? Math.sin(T*2.9+sd)*3*S : 0), py=lerp(H+80*S,H-32*S,pawR)+kn+(1-rise)*pawR*-8*S;
      x.save(); x.translate(px,py); x.scale(S,S); x.rotate(sd*-.07);
      const lg2=x.createLinearGradient(-17,0,17,0); lg2.addColorStop(0,C(WH,.76)); lg2.addColorStop(.6,C(WH,.98)); lg2.addColorStop(1,C(WH,.84)); x.fillStyle=lg2;
      x.beginPath(); x.moveTo(-14,0); x.lineTo(-17,210); x.lineTo(17,210); x.lineTo(14,0); x.closePath(); x.fill();       /* the leg, running down out of view */
      x.fillStyle=C(OR,.95,.75); for(const [a,b,r] of g.leg){ x.beginPath(); x.ellipse(a,b,r,r*1.5,0,0,6.283); x.fill(); }
      const pg=x.createRadialGradient(4,-8,2,0,-4,24); pg.addColorStop(0,C(WH,1.04)); pg.addColorStop(1,C(WH,.8)); x.fillStyle=pg;
      x.beginPath(); x.moveTo(-20,4); x.bezierCurveTo(-24,-10,-14,-20,0,-20); x.bezierCurveTo(14,-20,24,-10,20,4); x.closePath(); x.fill();   /* the paw, toes curled over */
      x.strokeStyle=C(WH,.66); x.lineWidth=1.3; for(const t2 of [-8,0,8]){ x.beginPath(); x.moveTo(t2,-19); x.quadraticCurveTo(t2*1.1,-12,t2*1.05,-6); x.stroke(); }
      x.fillStyle=C([52,42,36]); for(const t2 of [-13,-4.5,4.5,13]){ x.beginPath(); x.ellipse(t2,-19.5,1.7,2.6,0,0,6.283); x.fill(); }   /* nails */
      x.restore(); }
    /* the same evening light as the rest of the scene: warm on the sun side, shadowed on the other, darker low down */
    x.setTransform(1,0,0,1,0,0); x.globalCompositeOperation="source-atop";
    const sp=sun(), s0=Math.sign(sp.x-g.x)||1, gl=x.createLinearGradient((g.x-s0*150*S)*GR,0,(g.x+s0*150*S)*GR,0); gl.addColorStop(0,"rgba(26,14,6,.32)"); gl.addColorStop(.55,"rgba(255,200,130,0)"); gl.addColorStop(1,"rgba(255,192,116,.24)");
    x.fillStyle=gl; x.fillRect(0,0,cw,ch);
    const vg=x.createLinearGradient(0,(H-300*S)*GR,0,ch); vg.addColorStop(0,"rgba(20,12,4,0)"); vg.addColorStop(1,"rgba(20,12,4,.38)"); x.fillStyle=vg; x.fillRect(0,0,cw,ch);
    if(SC.dim()){ x.fillStyle="rgba(20,14,6,.14)"; x.fillRect(0,0,cw,ch); } else { const tn=tint(); if(tn.a>0){ x.globalAlpha=tn.a; x.fillStyle=tn.c; x.fillRect(0,0,cw,ch); x.globalAlpha=1; } }
    x.globalCompositeOperation="source-over";
    ctx.save(); ctx.globalAlpha=1; ctx.imageSmoothingQuality="high"; ctx.drawImage(gcv,0,0,cw,ch,0,0,W,H); ctx.restore();
  }
  /* ---- moths at dusk: a few small ones fluttering over the field toward the last light, and now and then a big one that comes in right past you and flies off into the evening ---- */
  let lunaDir="in", forceDir=null; const motes2=[], mcv=document.createElement("canvas"), mcx=mcv.getContext("2d"); let nextMothSmall=2, hero=null, nextHero=22, forceMoth=null;
  const MOTH={
    luna:{fw:[186,214,164],fw2:[160,196,146],edge:[156,112,132],hw:[178,208,158],tail:true,spot:[[12,-1,1.7,[226,206,140],[120,96,96]],[9,11,1.6,[226,206,140],[120,96,96]]],veins:true,body:[230,228,214]},
    rosy:{fw:[228,122,158],fw2:[244,214,104],edge:[214,96,140],hw:[246,226,150],band:true,body:[248,226,120]},
    io:{fw:[226,186,62],fw2:[200,150,52],edge:[170,110,40],hw:[238,206,80],eye:true,body:[214,170,60]}};
  /* a luna moth, drawn from life: broad pale-lime forewings with a maroon leading edge that runs right across the shoulders, small comma eyespots,
     long twisting hindwing tails, round yellow-ringed eyespots with a dark crescent and a pink centre, a white furry body and feathery tan antennae */
  function lunaWings(x,flap,only){
    const wf=only? 1 : Math.max(.12,Math.abs(Math.cos(flap))), G=[194,216,162], G2=[176,204,148], RIM=[226,224,176], COSTA=[104,70,92];
    for(const sd of (only?[1]:[-1,1])){ x.save(); x.scale(sd*wf,1);
      /* hindwing with its long tail */
      const hg=x.createLinearGradient(0,0,6,38); hg.addColorStop(0,rgb(G2)); hg.addColorStop(.6,rgb(G)); hg.addColorStop(1,rgb(mixv(G,RIM,.5))); x.fillStyle=hg;
      x.beginPath(); x.moveTo(1.5,-1); x.bezierCurveTo(9,-1,18,2,19,7); x.bezierCurveTo(20,12,15,16,12,19);
      x.bezierCurveTo(9,23,8.5,29,9.5,34); x.bezierCurveTo(10.5,38,10,41,8.6,42); x.bezierCurveTo(7,41,6,37,5.4,33);
      x.bezierCurveTo(4.6,27,3.4,22,2.2,16); x.bezierCurveTo(1.6,10,1.2,4,1.5,-1); x.closePath(); x.fill();
      x.strokeStyle=rgb(RIM); x.lineWidth=.7; x.stroke();
      x.strokeStyle="rgba(96,120,78,.28)"; x.lineWidth=.35; for(const [ex,ey] of [[17,8],[13,16],[8,30]]){ x.beginPath(); x.moveTo(2,2); x.quadraticCurveTo(ex*.5,ey*.45,ex,ey); x.stroke(); }
      /* the hindwing eyespot */
      x.fillStyle=rgb([214,186,86]); x.beginPath(); x.ellipse(9.4,11,2.1,2.0,0,0,6.283); x.fill();
      x.fillStyle=rgb([214,152,170]); x.beginPath(); x.arc(9.4,11.3,1.15,0,6.283); x.fill();
      x.strokeStyle=rgb([28,22,24]); x.lineWidth=.8; x.beginPath(); x.arc(9.4,11,2.05,Math.PI*1.1,Math.PI*1.95); x.stroke();
      /* forewing */
      const fg=x.createLinearGradient(0,-6,26,0); fg.addColorStop(0,rgb(G2)); fg.addColorStop(.5,rgb(G)); fg.addColorStop(1,rgb(mixv(G,RIM,.3))); x.fillStyle=fg;
      x.beginPath(); x.moveTo(1.5,-5); x.bezierCurveTo(10,-7.5,20,-10,25.5,-9.6); x.bezierCurveTo(28,-9,28.4,-6,27,-3.4);
      x.bezierCurveTo(25,1,22,5,18.5,6.8); x.bezierCurveTo(12,8.4,6,6.6,1.8,3.4); x.closePath(); x.fill();
      x.strokeStyle=rgb(RIM); x.lineWidth=.7; x.beginPath(); x.moveTo(27,-3.4); x.bezierCurveTo(25,1,22,5,18.5,6.8); x.bezierCurveTo(12,8.4,6,6.6,1.8,3.4); x.stroke();
      x.strokeStyle="rgba(96,120,78,.28)"; x.lineWidth=.35; for(const [ex,ey] of [[25,-6],[23,-1],[19,5],[13,7]]){ x.beginPath(); x.moveTo(2,-2); x.quadraticCurveTo(ex*.5,ey*.5-1.5,ex,ey); x.stroke(); }
      /* the comma eyespot near the leading edge */
      x.strokeStyle=rgb([60,40,50]); x.lineWidth=1; x.beginPath(); x.arc(11.6,-6.3,1.15,-.4,Math.PI*1.25); x.stroke();
      x.fillStyle=rgb([214,156,170]); x.beginPath(); x.ellipse(11.6,-6.0,.7,.85,0,0,6.283); x.fill();
      /* the maroon leading edge */
      x.strokeStyle=rgb(COSTA); x.lineWidth=1.8; x.beginPath(); x.moveTo(0,-5.4); x.bezierCurveTo(10,-7.8,20,-10.2,25.6,-9.7); x.stroke();
      x.restore(); }
    if(only) return;
    x.strokeStyle=rgb([104,70,92]); x.lineWidth=2.2; x.beginPath(); x.moveTo(-2.5,-5.2); x.lineTo(2.5,-5.2); x.stroke();   /* the band carries across the shoulders */
    const bg=x.createRadialGradient(0,-2,.5,0,0,5); bg.addColorStop(0,rgb([246,244,232])); bg.addColorStop(1,rgb([214,214,196])); x.fillStyle=bg;
    x.beginPath(); x.ellipse(0,-1.6,2.8,4,0,0,6.283); x.fill(); x.beginPath(); x.ellipse(0,5,2.1,6,0,0,6.283); x.fill();        /* white, furry thorax and abdomen */
    x.fillStyle=rgb([196,160,104]); for(const sd of [-1,1]){ x.save(); x.translate(sd*.8,-6.6); x.rotate(sd*.42); x.beginPath(); x.ellipse(0,-3.4,1.25,3.6,0,0,6.283); x.fill(); x.restore(); }   /* feathery antennae */
  }
  /* the luna moth in true 3D: each wing is a flat painted sheet hinged at the body, beating up and down about the body's axis,
     the body pitched up as moths fly, heading the way it's moving, all projected with perspective */
  let lunaSpr=null; const LR=6, LX0=0, LY0=-16;
  function lunaSprite(){ if(lunaSpr) return lunaSpr; const c=document.createElement("canvas"); c.width=31*LR; c.height=60*LR; const x=c.getContext("2d");
    x.setTransform(LR,0,0,LR,-LX0*LR,-LY0*LR); lunaWings(x,0,true); return lunaSpr=mipChain(c); }
  function luna3D(x,P,V,flap,proj){
    const nrm=v=>{ const l=Math.hypot(v[0],v[1],v[2])||1; return [v[0]/l,v[1]/l,v[2]/l]; }, crs=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
    const v=nrm(V), f=nrm([v[0],v[1]-.55,v[2]]), r=nrm(crs(f,[0,-1,0])), u=crs(r,f), K=.0068;               /* nose pitched up into the climb */
    const W3=(a,b,c)=>[P[0]+(f[0]*a+r[0]*b+u[0]*c)*K, P[1]+(f[1]*a+r[1]*b+u[1]*c)*K, P[2]+(f[2]*a+r[2]*b+u[2]*c)*K], S=p=>proj(p[0],p[1],p[2]);
    const ang=.25+Math.sin(flap)*1.05, spr=lunaSprite();                                                     /* the wing beat, about a slight resting V */
    const wingAt=sd=>{ /* local wing (x outward, y toward the tail) -> 3D: outward along r and up along u by the beat angle, back along -f */
      const L=(lx,ly)=>W3(-ly,sd*lx*Math.cos(ang),lx*Math.sin(ang));
      const O=S(L(0,0)), A=S(L(1,0)), B=S(L(0,1)), X=[A[0]-O[0],A[1]-O[1]], Y=[B[0]-O[0],B[1]-O[1]];
      const n=mipPick(spr,Math.max(Math.hypot(X[0],X[1]),Math.hypot(Y[0],Y[1]))/LR), R=LR/Math.pow(2,n), im=spr[n];
      x.save(); x.setTransform(X[0]/R,X[1]/R,Y[0]/R,Y[1]/R,O[0]+X[0]*LX0+Y[0]*LY0,O[1]+X[1]*LX0+Y[1]*LY0); x.imageSmoothingEnabled=true; x.imageSmoothingQuality="high"; x.drawImage(im,0,0,im.width,im.height,0,0,spr[0].width/Math.pow(2,n),spr[0].height/Math.pow(2,n)); x.restore(); };
    const dist=sd=>{ const p=W3(0,sd*10,0); return p[0]*p[0]+p[1]*p[1]+p[2]*p[2]; };
    const far=dist(-1)>dist(1)? -1 : 1;
    wingAt(far);
    /* white furry body, maroon band at the shoulders, feathery antennae */
    const hd=S(W3(9,0,0)), th=S(W3(2,0,0)), ab=S(W3(-8,0,0)), wd=Math.max(1,Math.hypot(...[0,1].map(i=>S(W3(2,2.6,0))[i]-th[i])));
    x.lineCap="round"; x.strokeStyle=rgb([222,220,204]); x.lineWidth=wd*1.5; x.beginPath(); x.moveTo(ab[0],ab[1]); x.lineTo(th[0],th[1]); x.stroke();
    x.strokeStyle=rgb([244,242,230]); x.lineWidth=wd*2; x.beginPath(); x.moveTo(th[0],th[1]); x.lineTo(hd[0]*.4+th[0]*.6,hd[1]*.4+th[1]*.6); x.stroke();
    x.strokeStyle=rgb([196,160,104]); x.lineWidth=Math.max(.6,wd*.5); for(const sd of [-1,1]){ const a0=S(W3(6,sd*.8,0)), a1=S(W3(13,sd*4,2.5)); x.beginPath(); x.moveTo(a0[0],a0[1]); x.lineTo(a1[0],a1[1]); x.stroke(); }
    wingAt(-far);
  }
  function mothWings(x,sp,flap){
    if(sp==="luna") return lunaWings(x,flap);
    const M=MOTH[sp], wf=Math.max(.12,Math.abs(Math.cos(flap)));
    for(const sd of [-1,1]){ x.save(); x.scale(sd*wf,1);
      /* hindwing */
      const hg=x.createLinearGradient(0,0,14,28); hg.addColorStop(0,rgb(mulv(M.hw,.82))); hg.addColorStop(1,rgb(mixv(M.hw,[236,232,170],.35))); x.fillStyle=hg; x.beginPath(); x.moveTo(1,2);
      if(M.tail){ x.bezierCurveTo(14,2,20,10,15,16); x.bezierCurveTo(13,22,12,30,9,36); x.bezierCurveTo(7,30,5,20,1,12); }
      else { x.bezierCurveTo(14,1,21,9,17,16); x.bezierCurveTo(13,22,5,20,1,12); }
      x.closePath(); x.fill();
      if(M.eye){ x.fillStyle="rgba(150,40,40,.9)"; x.beginPath(); x.arc(10,11,6.4,0,6.283); x.fill(); x.fillStyle="rgba(26,28,50,.95)"; x.beginPath(); x.arc(10,11,4.4,0,6.283); x.fill(); x.fillStyle="rgba(120,150,210,.9)"; x.beginPath(); x.arc(10,11,2.2,0,6.283); x.fill(); x.fillStyle="rgba(255,255,255,.8)"; x.beginPath(); x.arc(10.6,10.3,.8,0,6.283); x.fill(); }
      /* forewing */
      const fg=x.createLinearGradient(0,0,24,0); fg.addColorStop(0,rgb(M.fw2)); fg.addColorStop(.45,rgb(M.fw)); fg.addColorStop(1,rgb(M.fw)); x.fillStyle=fg;
      x.beginPath(); x.moveTo(1,-3); x.bezierCurveTo(10,-9,20,-12,25,-10); x.bezierCurveTo(24,-4,21,3,17,6); x.bezierCurveTo(11,7,5,6,1,4); x.closePath(); x.fill();
      if(M.band){ x.fillStyle=rgb(M.fw2); x.beginPath(); x.moveTo(6,-4); x.bezierCurveTo(11,-7,16,-7,19,-6); x.bezierCurveTo(18,-1,15,3,11,4); x.bezierCurveTo(8,3,6,0,6,-4); x.fill(); }
      x.strokeStyle=rgb(M.edge); x.lineWidth=1.3; x.beginPath(); x.moveTo(1,-3); x.bezierCurveTo(10,-9,20,-12,25,-10); x.stroke();
      if(M.veins){ x.strokeStyle="rgba(70,96,60,.35)"; x.lineWidth=.45; for(const [ex,ey] of [[24,-9],[22,-3],[18,4],[14,6]]){ x.beginPath(); x.moveTo(1,0); x.quadraticCurveTo(ex*.5,ey*.5-1,ex,ey); x.stroke(); } for(const [ex,ey] of [[16,12],[12,22],[9,32]]){ x.beginPath(); x.moveTo(1,4); x.quadraticCurveTo(ex*.45,ey*.5,ex,ey); x.stroke(); } }
      if(M.spot) for(const [a,b,r,c1,c2] of M.spot){ x.fillStyle=rgb(c2); x.beginPath(); x.ellipse(a,b,r*1.2,r,0,0,6.283); x.fill(); x.fillStyle=rgb(c1); x.beginPath(); x.ellipse(a,b,r*.7,r*.6,0,0,6.283); x.fill(); }
      if(!M.spot&&!M.eye){ x.fillStyle="rgba(120,40,70,.55)"; x.beginPath(); x.arc(13,-2,1.2,0,6.283); x.fill(); }
      x.restore(); }
    const M2=MOTH[sp]; x.fillStyle=rgb(M2.body); x.beginPath(); x.ellipse(0,1,2.6,7.5,0,0,6.283); x.fill();   /* fuzzy body */
    x.strokeStyle=rgb(mulv(M2.body,.75)); x.lineWidth=.9; for(const sd of [-1,1]){ x.beginPath(); x.moveTo(sd*.8,-6); x.quadraticCurveTo(sd*4,-12,sd*6,-14); x.stroke(); }   /* feathery antennae */
  }
  function drawMoths(dt,dark,layer){
    const sp=sun();
    if(layer==="field"){
      /* the small ones: pale flickers drifting over the field toward the light */
      nextMothSmall-=dt; if(nextMothSmall<=0&&motes2.length<4){ nextMothSmall=rnd(4,9); const b=gnd(); motes2.push({x:rnd(W*.1,W*.9),y:b.vy+rnd(20,140),ph:rnd(0,6),f:rnd(9,13),a:0,life:rnd(16,30),t:0,vx:0,vy:0,s:rnd(.8,1.3)}); }
      for(const m of motes2){ m.t+=dt; const tx=sp.x+Math.sin(m.ph+m.t*.3)*W*.18, ty=sp.y+H*.18+Math.cos(m.ph*1.7+m.t*.4)*40;
        m.vx+=((tx-m.x)*.02+Math.sin(m.t*3.1+m.ph)*34+Math.sin(m.t*7.3)*20)*dt; m.vy+=((ty-m.y)*.02+Math.cos(m.t*2.7+m.ph)*30)*dt; m.vx*=.96; m.vy*=.96; m.x+=m.vx*dt; m.y+=m.vy*dt;
        m.a= m.t<1.5? m.t/1.5 : m.t>m.life-1.5? Math.max(0,(m.life-m.t)/1.5) : 1;
        const fl=Math.abs(Math.sin(m.t*m.f)), r=1.6*m.s; ctx.globalAlpha=m.a*.85; ctx.fillStyle=dark?"rgba(220,210,190,.8)":"rgba(255,246,226,.9)";
        ctx.beginPath(); ctx.ellipse(m.x-r*fl,m.y,r*fl+.3,r*.7,.3,0,6.283); ctx.ellipse(m.x+r*fl,m.y,r*fl+.3,r*.7,-.3,0,6.283); ctx.fill(); }
      for(let i=motes2.length-1;i>=0;i--) if(motes2[i].t>motes2[i].life) motes2.splice(i,1);
      ctx.globalAlpha=1; return;
    }
    /* the big one: comes in from right beside you, huge and soft, wings flashing, and flutters off into the evening toward the light */
    nextHero-=dt; if(!hero&&nextHero<=0&&stageBusy()) nextHero=rnd(12,25); if(!hero&&nextHero<=0){ const sd=Math.random()<.5?-1:1; lunaDir=lunaDir==="out"?"in":"out"; hero={t:0,sp:"luna",dir:forceDir||lunaDir,X0:sd*rnd(.18,.3),Y0:rnd(.06,.16),ph:rnd(0,6),fl:0}; forceDir=null; }
    if(!hero) return; const h=hero; h.t+=dt; h.fl+=dt*Math.PI*2*(6.5+Math.sin(h.t*1.3)*1.5);
    const z=h.dir==="in"? 11*Math.exp(-h.t*.42) : .32*Math.exp(h.t*.42), F=H*.5, cx=W/2, cy=H*.52, pull=ease((z-.32)/2.4);   /* out: from beside you toward the sun; in: out of the sunset straight at you */
    const tX=(sp.x-cx)*z/F, tY=(sp.y+H*.08-cy)*z/F;
    const X=lerp(h.X0+Math.sin(h.t*1.9+h.ph)*.06*Math.min(1,z),tX,pull)+Math.sin(h.t*3.3)*.025*z, Y=lerp(h.Y0+Math.cos(h.t*2.3+h.ph)*.05*Math.min(1,z),tY,pull)+Math.cos(h.t*2.9)*.02*z;
    h.sx=cx+X*F/z; h.sy=cy+Y*F/z; const sx=h.sx, sy=h.sy, s=.0068*F/z; h.tr=Math.max(40,Math.min(220,s*70)); const a=z<.5? ease((z-.32)/.18) : z>9? Math.max(0,1-(z-9)/3) : 1;
    if(z>12.5||(h.dir==="in"&&z<.3)||a<=0&&h.t>2){ hero=null; nextHero=rnd(90,180); return; }
    const head=Math.atan2(Math.cos(h.t*1.4+h.ph)*.4,1)*.5+Math.sin(h.t*2.1)*.15;
    /* paint it into its own sprite, then set it in the evening light: backlit by the low sun, glowing through the thin wings, hazing into the distance */
    const sz=Math.ceil(84*s), hx=mcx; if(mcv.width<sz||mcv.height<sz){ mcv.width=Math.max(mcv.width,sz); mcv.height=Math.max(mcv.height,sz); }
    hx.setTransform(1,0,0,1,0,0); hx.clearRect(0,0,mcv.width,mcv.height);
    const Pn=[X,Y,z], Vn=h.pp? [X-h.pp[0],Y-h.pp[1],z-h.pp[2]] : [0,0,1]; h.pp=Pn; if(Math.hypot(...Vn)>1e-7) h.V=h.V? h.V.map((v,i)=>lerp(v,Vn[i],.15)) : Vn;
    luna3D(hx,Pn,h.V||Vn,h.fl,(X3,Y3,Z3)=>{ const zz=Math.max(.05,Z3); return [cx+X3*F/zz-sx+sz/2, cy+Y3*F/zz-sy+sz/2]; });
    hx.setTransform(1,0,0,1,0,0); hx.globalCompositeOperation="source-atop";
    const dx=sp.x-sx, dy=sp.y-sy, dl=Math.hypot(dx,dy)||1, near=Math.max(0,1-dl/(W*.45));
    hx.fillStyle=`rgba(40,28,18,${(.44-near*.18).toFixed(2)})`; hx.fillRect(0,0,sz,sz);                     /* we see the shaded side: the sun is behind it */
    const rl=hx.createLinearGradient(sz/2-dx/dl*sz*.5,sz/2-dy/dl*sz*.5,sz/2+dx/dl*sz*.5,sz/2+dy/dl*sz*.5);
    rl.addColorStop(0,"rgba(20,12,8,.25)"); rl.addColorStop(.55,"rgba(255,190,110,0)"); rl.addColorStop(1,`rgba(255,196,112,${(.38+near*.3).toFixed(2)})`); hx.fillStyle=rl; hx.fillRect(0,0,sz,sz);   /* warm light catching the sun-side edges */
    const gw=hx.createRadialGradient(sz/2,sz/2,0,sz/2,sz/2,sz*.42); gw.addColorStop(0,`rgba(255,214,150,${(.12+near*.22).toFixed(2)})`); gw.addColorStop(1,"rgba(255,214,150,0)"); hx.fillStyle=gw; hx.fillRect(0,0,sz,sz);   /* light glowing through the wings */
    if(!h.skyC||(h.skyT=(h.skyT||0)-1)<=0){ h.skyT=6; const ip=toImg(sx,sy); h.skyC=(ip&&ip[0]>=0&&ip[0]<=1&&ip[1]>=0&&ip[1]<=1&&sampleAt(ip[0],ip[1]))||[200,170,130]; }
    hx.fillStyle="rgba(255,168,84,.13)"; hx.fillRect(0,0,sz,sz);   /* bathed in the orange evening light */
    const haze=Math.min(.78,Math.max(0,(z-.8)/6)); if(haze>0){ hx.fillStyle=rgb(h.skyC,haze); hx.fillRect(0,0,sz,sz); }   /* the farther it flies, the more it melts into the evening air */
    if(SC.dim()){ hx.fillStyle="rgba(20,14,6,.18)"; hx.fillRect(0,0,sz,sz); } else { const tn=tint(); if(tn.a>0){ hx.globalAlpha=tn.a; hx.fillStyle=tn.c; hx.fillRect(0,0,sz,sz); hx.globalAlpha=1; } }
    if(dark){ hx.fillStyle="rgba(10,8,14,.3)"; hx.fillRect(0,0,sz,sz); }
    hx.globalCompositeOperation="source-over";
    ctx.save(); ctx.globalAlpha=a*.82; ctx.filter=`blur(${(z<.9? (.9-z)*9+.5 : .5+haze*.6).toFixed(1)}px)`; ctx.drawImage(mcv,0,0,sz,sz,sx-sz/2,sy-sz/2,sz,sz); ctx.restore(); ctx.filter="none";
    if(near>.05){ ctx.save(); ctx.globalCompositeOperation="lighter"; ctx.globalAlpha=a*near*.35; const gl=ctx.createRadialGradient(sx,sy,0,sx,sy,sz*.45); gl.addColorStop(0,"rgba(255,200,130,.5)"); gl.addColorStop(1,"rgba(255,200,130,0)"); ctx.fillStyle=gl; ctx.fillRect(sx-sz/2,sy-sz/2,sz,sz); ctx.restore(); }   /* a soft halo when it passes in front of the light */
  }
  /* ---- once in a while a little bbFlock of eastern bluebirds comes over your shoulder from behind and flies off over the field ---- */
  let bbFlock=null, nextBB=38; const fcv=document.createElement("canvas"), fcx=fcv.getContext("2d");
  function startFlock(){ const n=5+Math.floor(Math.random()*4), sd=Math.random()<.5?-1:1;
    bbFlock={t:0,X0:sd*rnd(.02,.1),Y0:-rnd(.1,.16),wx:rnd(-1.6,1.6),wy:-rnd(.25,.6),birds:Array.from({length:n},(_,i)=>({ox:rnd(-.22,.22),oy:rnd(-.1,.1),oz:rnd(-.1,.35)+i*.04,ph:rnd(0,6),f:rnd(10,13),glide:rnd(0,6)}))};
    natureSfx.bluebird&&natureSfx.bluebird(); }
  function bluebird(x,flap,glide){
    /* seen from behind and above as it flies away: swept, pointed wings beating up and down, blue back, rusty flanks */
    const BL=[52,104,204], BL2=[112,164,232], RU=[200,116,60], DK=[34,54,112];
    const up=glide? -.15 : Math.sin(flap), sp=glide? 1 : .82+.18*Math.abs(Math.cos(flap));
    for(const sd of [-1,1]){
      const sh=[sd*2,-1.5], wr=[sd*9*sp,-2.5-up*5], tp=[sd*18*sp,-.5-up*10], tr=[sd*11*sp,3.2-up*4.5], rt=[sd*2,3.5];
      const wg=x.createLinearGradient(0,0,sd*18,0); wg.addColorStop(0,rgb(up>0?BL2:BL)); wg.addColorStop(.7,rgb(BL)); wg.addColorStop(1,rgb(DK)); x.fillStyle=wg;
      x.beginPath(); x.moveTo(sh[0],sh[1]); x.quadraticCurveTo((sh[0]+wr[0])/2,wr[1]-1.5,wr[0],wr[1]); x.quadraticCurveTo((wr[0]+tp[0])/2,tp[1]-1,tp[0],tp[1]);
      x.quadraticCurveTo((tp[0]+tr[0])/2+sd*.5,(tp[1]+tr[1])/2+1.5,tr[0],tr[1]); x.quadraticCurveTo((tr[0]+rt[0])/2,tr[1]+1.2,rt[0],rt[1]); x.closePath(); x.fill(); }
    x.fillStyle=rgb(RU); x.beginPath(); x.ellipse(0,1.2,3.3,5.4,0,0,6.283); x.fill();                       /* rusty breast showing at the sides */
    const bg=x.createLinearGradient(-3,0,3,0); bg.addColorStop(0,rgb(BL)); bg.addColorStop(.5,rgb(BL2)); bg.addColorStop(1,rgb(BL)); x.fillStyle=bg;
    x.beginPath(); x.ellipse(0,-.4,2.6,5.6,0,0,6.283); x.fill(); x.beginPath(); x.arc(0,-5.8,2.3,0,6.283); x.fill();   /* blue back and crown */
    x.fillStyle=rgb(BL); x.beginPath(); x.moveTo(-1.6,4.4); x.quadraticCurveTo(0,9.5,1.6,4.4); x.closePath(); x.fill();   /* short notched tail */
  }
  /* a bluebird in true perspective: built in 3D around its own heading, so as the flock flies away from you, you see them from behind and below,
     rusty breasts and pale undersides showing while they're above you, blue backs as they drop toward the horizon */
  function bluebird3D(x,P,V,flap,glide,proj){
    const nrm=v=>{ const l=Math.hypot(v[0],v[1],v[2])||1; return [v[0]/l,v[1]/l,v[2]/l]; }, crs=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
    const f=nrm(V), r=nrm(crs(f,[0,-1,0])), u=crs(r,f);                                                     /* forward, right, up (screen y points down) */
    const pt=(a,b,c)=>proj(P[0]+f[0]*a+r[0]*b+u[0]*c, P[1]+f[1]*a+r[1]*b+u[1]*c, P[2]+f[2]*a+r[2]*b+u[2]*c);
    const under=-(P[0]*u[0]+P[1]*u[1]+P[2]*u[2])<0;                                                         /* is the camera below the wing plane? then we see the underside */
    const BL=[52,104,206], BL2=[110,160,230], DK=[34,54,112], UND=[150,166,192], RU=[204,118,60], WH=[232,226,214];
    const fl=glide? .22 : Math.sin(flap)*.95+.12, S=.14;
    const wing=sd=>{ const sh=pt(.02,sd*.012,0), wr=pt(.016,sd*S*.5,S*.32*fl), tp=pt(-.03,sd*S*.95,S*.62*fl), tr=pt(-.07,sd*S*.6,S*.28*fl), rt=pt(-.04,sd*.012,0);
      x.beginPath(); x.moveTo(sh[0],sh[1]); x.quadraticCurveTo(wr[0],wr[1],tp[0],tp[1]); x.quadraticCurveTo(tr[0],tr[1],rt[0],rt[1]); x.closePath();
      x.fillStyle=rgb(under? UND : (fl>0? BL2 : BL)); x.fill();
      const tq=pt(-.042,sd*S*.82,S*.5*fl); x.beginPath(); x.moveTo(tp[0],tp[1]); x.lineTo(tq[0],tq[1]); x.lineTo(wr[0]*.15+tp[0]*.85,wr[1]*.15+tp[1]*.85); x.closePath(); x.fillStyle=rgb(under? mulv(UND,.75) : DK); x.fill(); };
    /* the farther wing first */
    const wl=pt(0,-S*.6,0), wr2=pt(0,S*.6,0), lFar=Math.hypot(...[0,1].map(i=>0))||0;
    const dl=(P[0]-r[0]*.07)**2+(P[1]-r[1]*.07)**2+(P[2]-r[2]*.07)**2, dr=(P[0]+r[0]*.07)**2+(P[1]+r[1]*.07)**2+(P[2]+r[2]*.07)**2;
    wing(dl>dr? -1 : 1);
    /* the body: head first (it's the far end), then one rounded body with the blue back on top and the rusty breast below, then the short tail toward you */
    const tail=pt(-.085,0,-.004), mid=pt(-.01,0,0), head=pt(.05,0,.006), up2=pt(-.01,0,.02), w0=Math.max(.8,Math.abs(proj(P[0]+r[0]*.022,P[1]+r[1]*.022,P[2]+r[2]*.022)[0]-mid[0]));
    const ang=Math.atan2(head[1]-tail[1],head[0]-tail[0]), len=Math.hypot(head[0]-tail[0],head[1]-tail[1]), ux=up2[0]-mid[0], uy=up2[1]-mid[1];
    x.fillStyle=rgb(BL); x.beginPath(); x.arc(head[0],head[1],w0*.8,0,6.283); x.fill();
    x.fillStyle=rgb(under? RU : BL); x.beginPath(); x.ellipse(mid[0],mid[1],Math.max(w0,len*.42),w0,ang,0,6.283); x.fill();
    if(under){ x.fillStyle=rgb(WH); x.beginPath(); x.ellipse((mid[0]+tail[0])/2-ux*.3,(mid[1]+tail[1])/2-uy*.3,Math.max(w0*.6,len*.18),w0*.6,ang,0,6.283); x.fill(); }
    x.fillStyle=rgb(BL2); x.beginPath(); x.ellipse(mid[0]+ux*.5,mid[1]+uy*.5,Math.max(w0*.8,len*.36),w0*.62,ang,0,6.283); x.fill();      /* the blue back, catching the light above */
    const t1=pt(-.06,-.012,0), t2=pt(-.06,.012,0), tt=pt(-.1,0,-.003); x.fillStyle=rgb(DK); x.beginPath(); x.moveTo(t1[0],t1[1]); x.lineTo(tt[0],tt[1]); x.lineTo(t2[0],t2[1]); x.closePath(); x.fill();
    wing(dl>dr? 1 : -1);
  }
  /* ---- a pair of eastern bluebirds carrying a silk ribbon between them with the countdown on it (only when the host page asks for it with SceneryHost.banner) ---- */
  let ban=null, nextBan=rnd(3,5), banFirst=true; const bncv=document.createElement("canvas"), bncx=bncv.getContext("2d"), btex=document.createElement("canvas");
  /* a bluebird in true 3D: lofted body, blue back and wings, rusty breast and white belly, the wings feathered at the tips. Returns where its bill is, in the world. */
  function blueBird3D(x,P,f,flap,glide,proj,Kw,sunL){
    const crs=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]], nrm=v=>{ const l=Math.hypot(v[0],v[1],v[2])||1; return [v[0]/l,v[1]/l,v[2]/l]; }, dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
    const r=nrm(crs(f,[0,-1,0])), u=crs(r,f);
    const W3=(a,b,c)=>[P[0]+(f[0]*a+r[0]*b+u[0]*c)*Kw, P[1]+(f[1]*a+r[1]*b+u[1]*c)*Kw, P[2]+(f[2]*a+r[2]*b+u[2]*c)*Kw];
    const pt=(a,b,c)=>{ const w=W3(a,b,c); return proj(w[0],w[1],w[2]); };
    const sc=a=>{ const p0=pt(a,0,0), p1=pt(a+1,0,0), p2=pt(a,1,0); return Math.max(Math.hypot(p1[0]-p0[0],p1[1]-p0[1]),Math.hypot(p2[0]-p0[0],p2[1]-p0[1])); };
    const toEye=nrm([-P[0],-P[1],-P[2]]), glow=Math.max(0,Math.min(1,(dot(nrm(P),sunL)-.45)/.45));
    const litOf=n=>Math.max(0,Math.min(1,dot(n,sunL)*1.4+.25));
    const L=(c,l)=>[c[0]*(.62+.55*l)+6*(1-l), c[1]*(.64+.5*l)+8*(1-l), c[2]*(.72+.42*l)+18*(1-l)];        /* lit warm, shaded toward the cool sky, keeping their colour in shade */
    const smooth=(pts,col)=>{ x.fillStyle=col; x.beginPath(); const n=pts.length, m=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2]; let q=m(pts[n-1],pts[0]); x.moveTo(q[0],q[1]); for(let i=0;i<n;i++){ const a=pts[i], b=pts[(i+1)%n], mm=m(a,b); x.quadraticCurveTo(a[0],a[1],mm[0],mm[1]); } x.closePath(); x.fill(); };
    const line=(a,b,col,w)=>{ x.strokeStyle=col; x.lineWidth=w; x.beginPath(); x.moveTo(a[0],a[1]); x.lineTo(b[0],b[1]); x.stroke(); };
    const px=sc(0); x.lineCap="round"; x.lineJoin="round";
    /* an eastern bluebird: sky-blue back, wings and tail with dusky flight feathers, a warm rust throat and breast, white belly and vent;
       underneath, the wings are pale silver-grey with darker grey flight feathers */
    const BLU=[30,104,246], BLU2=[96,176,255], DEEP=[22,58,170], TIPS=[18,30,74], RUST=[204,106,46], RUST2=[226,140,74], BELLY=[240,236,228], ULIN=[196,208,236], UFLT=[120,136,178];   /* that vivid, almost electric eastern-bluebird blue */
    const wing=(sd,fl,ghost)=>{ const h=k=>fl*k, bend=Math.abs(fl)*.3;
      const wa=Math.atan2(fl*9.4,15), sw=[0,1,2].map(i=>r[i]*sd*Math.cos(wa)+u[i]*Math.sin(wa)), tn=crs(sw,f).map(c=>c*sd), under=dot(tn,toEye)<0, lit=litOf(under? tn.map(c=>-c) : tn);
      const P_=(a,s)=>pt(a,sd*s,h(s*.62)+bend*Math.min(1,s/8));   /* a point on the wing, by distance back from the leading edge (a) and out along the span (s) */
      /* the planform: rounded arm, a short pointed hand made of separate primaries, a scalloped trailing edge */
      const lead=[[2.4,1.6],[2,5],[1.4,8],[.4,10.6],[-1,12.6]], trail=[[-6,8.4],[-6.4,6],[-6.2,3.6],[-4.4,1.6]];
      const base=lead.map(([a,s])=>P_(a,s)).concat([P_(-2.2,13.2)],trail.map(([a,s])=>P_(a,s)));
      const g=x.createLinearGradient(...P_(1.8,4),...P_(-6,5));
      if(under){ g.addColorStop(0,rgb(L(ULIN,lit))); g.addColorStop(.45,rgb(L(ULIN,lit*.9))); g.addColorStop(.55,rgb(L(UFLT,lit))); g.addColorStop(1,rgb(mixv(L(UFLT,lit*.9),[250,200,140],glow*.25))); }
      else { g.addColorStop(0,rgb(L(BLU2,lit))); g.addColorStop(.45,rgb(L(BLU,lit))); g.addColorStop(.6,rgb(L(DEEP,lit))); g.addColorStop(1,rgb(L(DEEP,lit*.85))); }
      smooth(base,g);
      /* the primaries: six long feathers fanning out to the wingtip, each its own shape */
      for(let i=0;i<6;i++){ const t=i/5, a0=lerp(.2,-5.4,t), s0=lerp(10.2,8.4,t), ang=lerp(.12,-.55,t), len=lerp(5.6,4,t)+(i===1||i===2? .6 : 0), ta=a0+Math.sin(ang)*len, ts=s0+Math.cos(ang)*len, wd=.85;
        const q=[P_(a0+wd,s0),P_(a0+wd*.7+(ta-a0)*.55,s0+(ts-s0)*.55),P_(ta,ts),P_(a0-wd*.7+(ta-a0)*.55,s0+(ts-s0)*.55),P_(a0-wd,s0)];
        smooth(q,rgb(under? mixv(L(UFLT,lit*(i%2? .9 : 1)),[250,200,140],glow*.3) : L(i%2? TIPS : mixv(TIPS,DEEP,.4),lit)));
        if(!ghost&&px>.5) line(P_(a0,s0),P_(ta,ts),rgb(under? [228,228,232] : [70,90,140],.35),Math.max(.3,px*.12)); }   /* the pale feather shafts */
      if(ghost) return;
      /* the secondaries' rounded tips along the trailing edge */
      for(let i=0;i<7;i++){ const t=(i+.5)/7, q=P_(lerp(-4.6,-6.2,t)-.3,lerp(1.8,8.6,t)); x.fillStyle=rgb(under? L(UFLT,lit*.9) : L(DEEP,lit*.8)); x.beginPath(); x.arc(q[0],q[1],Math.max(.5,px*.8),0,6.283); x.fill(); }
      if(!under){ for(let row=0;row<2;row++) for(let i=0;i<5;i++){ const t=(i+.5)/5, q=P_(lerp(1.4,-.6,row)-t*.8,lerp(2.4,8,t)); x.fillStyle=rgb(L(BLU2,lit*1.15),.45); x.beginPath(); x.ellipse(q[0],q[1],Math.max(.4,px*.75),Math.max(.3,px*.5),0,0,6.283); x.fill(); } }   /* the bright coverts, laid like scales */
      if(glow>.08){ const e0=P_(-2.2,13.2), e1=P_(-6,8.4), e2=P_(-6.2,3.6); x.strokeStyle=rgb([255,206,140],glow*.55); x.lineWidth=Math.max(.4,px*.3); x.beginPath(); x.moveTo(e0[0],e0[1]); x.quadraticCurveTo(e1[0],e1[1],e2[0],e2[1]); x.stroke(); }   /* sun shining through the feather edges */
    };
    const wings=sd=>{ if(glide){ wing(sd,.1); return; } const a0=x.globalAlpha, fl=k=>Math.sin(flap+k)*.95+.08;                /* the quick beat of the wings, with the blur of the stroke either side */
      x.globalAlpha=a0*.12; wing(sd,fl(-.45),true); wing(sd,fl(.45),true); x.globalAlpha=a0; wing(sd,fl(0)); };
    const near=sd=>{ const w=W3(0,sd*6,0); return w[0]*w[0]+w[1]*w[1]+w[2]*w[2]; }, farS=near(-1)>near(1)? -1 : 1;
    const upN=u, under=dot(upN,toEye)<0, bodyLit=litOf(under? upN.map(c=>-c) : upN);
    wings(farS);
    /* the tail: short, square-ended, blue above and dusky grey beneath */
    { const t0=pt(-4.4,-1.2,.2), t1=pt(-4.4,1.2,.2), t2=pt(-10,1.9,-.2), t3=pt(-10.3,.5,-.25), t4=pt(-10.3,-.5,-.25), t5=pt(-10,-1.9,-.2);
      const g=x.createLinearGradient(t0[0],t0[1],t3[0],t3[1]); g.addColorStop(0,rgb(under? L([110,116,138],bodyLit) : L(BLU,bodyLit))); g.addColorStop(1,rgb(under? L([80,86,104],bodyLit) : L(TIPS,bodyLit)));
      smooth([t0,t5,t4,t3,t2,t1],g); }
    /* the body: plump and round-chested, tapering to the tail */
    const SECT=[[-5.2,1.1,1.0,.5],[-4,1.9,1.9,.3],[-2.4,2.6,2.7,0],[-.6,3.0,3.1,-.25],[1.2,3.0,3.1,-.3],[2.8,2.6,2.7,-.1],[4,2.2,2.3,.3]];
    const body=new Path2D(); for(let i=0;i<SECT.length-1;i++){ const A=SECT[i], B=SECT[i+1]; for(let k=0;k<3;k++){ const t=k/3, a=lerp(A[0],B[0],t), w=lerp(A[1],B[1],t), hh=lerp(A[2],B[2],t), zc=lerp(A[3],B[3],t);
        for(let j=0;j<16;j++){ const th=j/16*6.283, q=pt(a,w*Math.cos(th),zc+hh*Math.sin(th)); j? body.lineTo(q[0],q[1]) : body.moveTo(q[0],q[1]); } body.closePath(); } }
    x.fillStyle=rgb(L(RUST,bodyLit)); x.fill(body);
    x.save(); x.clip(body);
    { const tp=pt(3,0,3.6), bt=pt(3,0,-3.1), g=x.createLinearGradient(tp[0],tp[1],bt[0],bt[1]);                   /* blue across the back, the rust breast below it, softly meeting */
      g.addColorStop(0,rgb(L(BLU2,Math.min(1,bodyLit*1.2)))); g.addColorStop(.42,rgb(L(BLU,bodyLit))); g.addColorStop(.54,rgb(L(mixv(BLU,RUST,.55),bodyLit))); g.addColorStop(.64,rgb(L(RUST2,bodyLit))); g.addColorStop(1,rgb(L(RUST,bodyLit*.75)));
      x.fillStyle=g; x.fillRect(0,0,x.canvas.width/.6,x.canvas.height/.6); }
    { const bl=pt(-3.4,0,-1.7), rr=Math.max(1,sc(-3)*3), g=x.createRadialGradient(bl[0],bl[1],0,bl[0],bl[1],rr); g.addColorStop(0,rgb(L(BELLY,bodyLit),.95)); g.addColorStop(.6,rgb(L(BELLY,bodyLit),.5)); g.addColorStop(1,rgb(L(BELLY,bodyLit),0)); x.fillStyle=g; x.fillRect(bl[0]-rr,bl[1]-rr,rr*2,rr*2); }   /* the white belly and vent */
    { const s0=proj(P[0]+sunL[0]*.03,P[1]+sunL[1]*.03,P[2]+sunL[2]*.03), c0=pt(0,0,0), dx=s0[0]-c0[0], dy=s0[1]-c0[1], dd=Math.hypot(dx,dy)||1, R=sc(0)*3.6;   /* the rim of gold on the side toward the sun */
      const g=x.createLinearGradient(c0[0]-dx/dd*R,c0[1]-dy/dd*R,c0[0]+dx/dd*R,c0[1]+dy/dd*R); g.addColorStop(0,"rgba(10,14,30,.25)"); g.addColorStop(.6,"rgba(255,200,130,0)"); g.addColorStop(1,`rgba(255,206,140,${(.25+glow*.35).toFixed(2)})`); x.fillStyle=g; x.fillRect(0,0,x.canvas.width/.6,x.canvas.height/.6); }
    x.restore();
    /* the head: big and round, the blue cap, a rusty throat, a dark eye with a pale ring, the small black bill */
    /* the head, lofted like the body so it grows out of the shoulders: a short thick neck, a rounded crown, the forehead sloping down to the bill */
    const HEAD=[[1.6,2.8,2.9,-.2],[3,2.55,2.65,.15],[4.2,2.3,2.45,.55],[5.2,2.2,2.35,.95],[6.1,2.0,2.1,1.1],[6.9,1.6,1.65,1.05],[7.5,1.0,1.05,.9],[7.8,.55,.6,.85]];
    const head=new Path2D(); for(let i=0;i<HEAD.length-1;i++){ const A=HEAD[i], B=HEAD[i+1]; for(let k=0;k<3;k++){ const t=k/3, a=lerp(A[0],B[0],t), w=lerp(A[1],B[1],t), hh=lerp(A[2],B[2],t), zc=lerp(A[3],B[3],t);
        for(let j=0;j<16;j++){ const th=j/16*6.283, q=pt(a,w*Math.cos(th),zc+hh*Math.sin(th)*(Math.sin(th)>0? .92 : 1)); j? head.lineTo(q[0],q[1]) : head.moveTo(q[0],q[1]); } head.closePath(); } }
    x.fillStyle=rgb(L(BLU,bodyLit)); x.fill(head);
    x.save(); x.clip(head);
    { const tp=pt(3,0,3.6), bt=pt(3,0,-3.1), g=x.createLinearGradient(tp[0],tp[1],bt[0],bt[1]);                       /* the same colour bands as the body, so head and body are one bird */
      g.addColorStop(0,rgb(L(BLU2,Math.min(1,bodyLit*1.2)))); g.addColorStop(.42,rgb(L(BLU,bodyLit))); g.addColorStop(.54,rgb(L(mixv(BLU,RUST,.55),bodyLit))); g.addColorStop(.64,rgb(L(RUST2,bodyLit))); g.addColorStop(1,rgb(L(RUST,bodyLit*.75))); x.fillStyle=g; x.fillRect(0,0,x.canvas.width/.6,x.canvas.height/.6); }
    { const s0=proj(P[0]+sunL[0]*.03,P[1]+sunL[1]*.03,P[2]+sunL[2]*.03), c0=pt(5.5,0,1), dx=s0[0]-c0[0], dy=s0[1]-c0[1], dd=Math.hypot(dx,dy)||1, R=sc(5)*2.6;
      const g=x.createLinearGradient(c0[0]-dx/dd*R,c0[1]-dy/dd*R,c0[0]+dx/dd*R,c0[1]+dy/dd*R); g.addColorStop(0,"rgba(10,14,30,.22)"); g.addColorStop(.6,"rgba(255,200,130,0)"); g.addColorStop(1,`rgba(255,210,150,${(.22+glow*.3).toFixed(2)})`); x.fillStyle=g; x.fillRect(0,0,x.canvas.width/.6,x.canvas.height/.6); }
    x.restore();
    for(const sd of [-1,1]){ const side=[r[0]*sd,r[1]*sd,r[2]*sd], fc=dot(side,toEye); if(fc<-.15) continue; const ey=pt(6.1,sd*1.72,1.55), er=Math.max(.4,sc(6.1)*.45)*Math.min(1,.5+fc);
      x.fillStyle="rgba(232,226,214,.55)"; x.beginPath(); x.arc(ey[0],ey[1],er*1.35,0,6.283); x.fill();
      x.fillStyle="rgba(8,8,12,.96)"; x.beginPath(); x.arc(ey[0],ey[1],er,0,6.283); x.fill(); x.fillStyle="rgba(255,250,240,.8)"; x.beginPath(); x.arc(ey[0]-er*.3,ey[1]-er*.35,er*.28,0,6.283); x.fill(); }
    { const b0=pt(7.6,.5,1.1), b1=pt(7.6,-.5,1.1), bt=pt(9.2,0,.8), bb=pt(7.7,0,.55); x.fillStyle="rgb(26,24,28)"; x.beginPath(); x.moveTo(b0[0],b0[1]); x.lineTo(bt[0],bt[1]); x.lineTo(b1[0],b1[1]); x.lineTo(bb[0],bb[1]); x.closePath(); x.fill(); }
    wings(-farS);
    return W3(8.4,0,.8);
  }
  function startBanner(){ const dir=Math.random()<.5?1:-1; ban={t:0,dir,dur:rnd(19,23),ph:[rnd(0,6),rnd(0,6)],fy:rnd(.12,.17),z0:rnd(1.75,2.05)}; }
  function drawBanner(dt,dark){
    const host=window.SceneryHost; if(!host||typeof host.banner!=="function") return;
    nextBan-=dt; if(!ban&&nextBan<=0){ if(stageBusy()&&!banFirst) nextBan=rnd(15,30); else { banFirst=false; startBanner(); } } if(!ban) return;
    const B=ban; B.t+=dt; const u=B.t/B.dur; if(u>=1){ ban=null; nextBan=rnd(200,360); return; }
    let text=""; try{ text=String(host.banner()||""); }catch(e){} if(!text){ ban=null; nextBan=rnd(200,360); return; }
    const F=H*.5, cx=W/2, cy=H*.52, proj=(X,Y,Z)=>[cx+X*F/Math.max(.05,Z),cy+Y*F/Math.max(.05,Z)];
    const z=B.z0+Math.sin(u*Math.PI)*-.15, span=Math.min(.62,Math.max(.3,560/W))*W*z/F, Kw=.012*Math.max(.8,Math.min(1.25,W/1200));   /* the ribbon spans about a third of a wide screen, more of a narrow one */
    const mg=Math.max(160,W*.12), xL=(-cx-mg)*z/F-(B.dir>0? 0 : span), xR=(W-cx+mg)*z/F+(B.dir>0? span : 0);   /* starts and ends fully off the screen, tails and wings and all */
    const lead=B.dir>0? lerp(xL,xR,u) : lerp(xR,xL,u), Y0=(B.fy*H-cy)*z/F;
    const birds=[0,1].map(i=>{ const bob=Math.sin(B.t*2.2+B.ph[i])*.035+Math.sin(B.t*.7+i)*.02;
      return {P:[lead-B.dir*span*i, Y0+bob, z+(i? .05 : 0)], V:[B.dir,Math.cos(B.t*2.2+B.ph[i])*.08,0], flap:B.t*(7.2+i*.6)+B.ph[i], glide:Math.sin(B.t*1.3+i*2.1)>.72}; });
    const cw=Math.ceil(W*.6), ch=Math.ceil(H*.6); if(bncv.width!==cw||bncv.height!==ch){ bncv.width=cw; bncv.height=ch; }
    const x=bncx; x.setTransform(1,0,0,1,0,0); x.clearRect(0,0,cw,ch); x.setTransform(.6,0,0,.6,0,0);
    const sp=sun(), sunL=(()=>{ const v=[(sp.x-cx)/F,(sp.y-cy)/F-.05,1], l=Math.hypot(...v); return v.map(c=>c/l); })();
    /* bills first (the birds are drawn after the ribbon so they hold it), from a dry pass of the bird geometry */
    const beak=b=>{ const l=Math.hypot(...b.V)||1, f=b.V.map(c=>c/l), r=[-f[2],0,f[0]]; const rl=Math.hypot(...r)||1; const rr=r.map(c=>c/rl), uu=[f[1]*rr[2]-f[2]*rr[1],f[2]*rr[0]-f[0]*rr[2],f[0]*rr[1]-f[1]*rr[0]];
      return [0,1,2].map(i=>b.P[i]+(f[i]*8.4+uu[i]*.8)*Kw); };
    const A=beak(birds[1]), Bk=beak(birds[0]);   /* the trailing bird's bill to the leader's */
    /* the ribbon: hangs between the two bills, sags in the middle, ripples in the wind of their flight */
    const N=64, E=.13, hgt=span*.12, sag=span*.1, pts=[];
    for(let i=0;i<=N;i++){ const s=-E+(1+2*E)*i/N, sc=Math.max(0,Math.min(1,s)), out=s<0? -s/E : s>1? (s-1)/E : 0, inn=Math.sin(sc*Math.PI);
      const w=Math.sin(s*Math.PI*2.2-B.t*4.6)*span*.025*inn, tw=Math.sin(s*Math.PI*1.6-B.t*2.4)*.42*inn+out*(.34*Math.sin(B.t*3.6-out*3.2+(s<0?0:2))+.14*Math.sin(B.t*6.1-out*5));   /* the free ends twist and flutter */
      const c=[lerp(A[0],Bk[0],s), lerp(A[1],Bk[1],sc)+sag*4*sc*(1-sc)+w+out*out*hgt*.55+Math.sin(B.t*3.1-out*3.6+(s<0?1:3))*hgt*.4*out+Math.sin(B.t*5.3-out*6)*hgt*.1*out, lerp(A[2],Bk[2],sc)+Math.sin(s*Math.PI*1.7-B.t*3.6)*span*.05*inn+out*hgt*.3+Math.sin(B.t*2.6-out*3+(s<0?2:0))*hgt*.6*out];   /* the loose ends hang and stream, a wave running out along each one */
      const dn=[Math.sin(tw)*.0,Math.cos(tw),Math.sin(tw)];   /* the cloth's width hangs down, twisting a little toward and away from you */
      const sm=x=>x<=0?0:x>=1?1:x*x*(3-2*x), gath=out>0? .5+.35*sm(out) : .5+.5*sm(Math.min(sc,1-sc)/.2), belly=1+.08*inn;   /* gathered and bunched where each bill grips it, opening out to full width as it droops between them */
      const hw=hgt*gath*belly;
      pts.push({top:proj(c[0],c[1],c[2]), bot:proj(c[0]+dn[0]*hw,c[1]+dn[1]*hw,c[2]+dn[2]*hw), shade:.9+.2*Math.cos(tw*2.2)-(1-gath)*.35+Math.sin(s*Math.PI*2.2-B.t*4.6)*.07+.5*Math.pow(Math.max(0,Math.sin(s*Math.PI*2.6-B.t*1.7+Math.sin(tw)*2)),12)}   /* a band of sheen slides along the silk as it turns to the sun */); }
    /* the lettering, set once per text and size into a strip that's wrapped onto the cloth */
    const texW=1400, texH=Math.round(texW*.85*hgt/span);   /* a fixed size, set once: the lettering belongs to the cloth and moves only with it */
    const key=text+"|"+texW+"|"+texH; if(btex._k!==key){ btex._k=key; btex.width=texW; btex.height=texH; const tx=btex.getContext("2d");
      { const g=tx.createLinearGradient(0,0,0,texH); g.addColorStop(0,"#fbf4e4"); g.addColorStop(.18,"#fffaf0"); g.addColorStop(.55,"#f1e6d0"); g.addColorStop(.86,"#e2d3b6"); g.addColorStop(1,"#cdbb98"); tx.fillStyle=g; tx.fillRect(0,0,texW,texH); }   /* the cloth cups a little: bright along the top, shaded underneath */
      tx.globalAlpha=.028; for(let yy=0;yy<texH;yy+=2){ tx.fillStyle=yy%4? "#7a6648" : "#ffffff"; tx.fillRect(0,yy,texW,1); } tx.globalAlpha=1;   /* a fine weave along the cloth */
      tx.strokeStyle="rgba(122,35,24,.6)"; tx.lineWidth=Math.max(1,texH*.025); for(const yy of [texH*.13,texH*.87]){ tx.beginPath(); tx.moveTo(texW*.03,yy); tx.lineTo(texW*.97,yy); tx.stroke(); }   /* a fine woven border */
      tx.setLineDash([Math.max(2,texH*.05),Math.max(2,texH*.04)]); tx.strokeStyle="rgba(150,120,80,.45)"; tx.lineWidth=Math.max(.6,texH*.012); for(const yy of [texH*.05,texH*.95]){ tx.beginPath(); tx.moveTo(0,yy); tx.lineTo(texW,yy); tx.stroke(); } tx.setLineDash([]);   /* the stitched hem */
      const caps=(getComputedStyle(document.documentElement).getPropertyValue("--caps")||"").trim()||'"Cormorant Garamond",Georgia,serif';
      let fs=texH*.5; tx.font=`600 ${fs}px ${caps}`; const sp2=.22, wid=()=>tx.measureText(text.toUpperCase()).width+text.length*fs*sp2; while(wid()>texW*.84&&fs>8){ fs*=.94; tx.font=`600 ${fs}px ${caps}`; }
      tx.textBaseline="alphabetic"; const capM=tx.measureText("H"), capH=capM.actualBoundingBoxAscent, mid=texH*.5;
      const capsFont=tx.font, digFont=`500 ${fs}px "Times New Roman","Noto Serif","Liberation Serif",serif`;   /* this face only has old-style figures (some sit below the line), so the numbers come from a classic serif with lining figures, matched to the capitals' height */
      tx.font=digFont; const dH=tx.measureText("0").actualBoundingBoxAscent||capH, dk=capH/dH; tx.font=capsFont;
      const glyphs=[]; { let xx=(texW-wid())/2+fs*sp2/2; for(const ch of text.toUpperCase()){ const dig=/[0-9]/.test(ch); tx.font=dig? digFont : capsFont; const m=tx.measureText(ch), ww=m.width*(dig? dk : 1);
          glyphs.push({ch,x:xx,dig,y:mid+capH/2}); xx+=ww+fs*sp2; } tx.font=capsFont; }
      const put=(col,dy)=>{ tx.fillStyle=col; for(const g of glyphs){ if(!g.dig) tx.fillText(g.ch,g.x,g.y+dy); else { tx.save(); tx.font=digFont; tx.translate(g.x,g.y+dy); tx.scale(dk,dk); tx.fillText(g.ch,0,0); tx.restore(); } } };   /* figures sit on the line with the capitals, everything centred top to bottom */
      put("rgba(255,255,255,.55)",Math.max(.6,fs*.03)); put("#6a1f14",0); tx.globalAlpha=.25; put("#2a0a04",-Math.max(.4,fs*.015)); tx.globalAlpha=1; }   /* the lettering, pressed into the silk */
    { const th=Math.max(1.2,hgt*F/z*.05); x.fillStyle="#a8916c"; x.beginPath(); for(let i=0;i<=N;i++) i? x.lineTo(pts[i].bot[0],pts[i].bot[1]+th) : x.moveTo(pts[i].bot[0],pts[i].bot[1]+th); for(let i=N;i>=0;i--) x.lineTo(pts[i].bot[0],pts[i].bot[1]-.5); x.closePath(); x.fill(); }   /* the cloth has a thickness: its rolled lower hem */
    const lr=pts[0].top[0]<=pts[N].top[0];   /* read left to right whichever way they fly */
    for(let i=0;i<N;i++){ const p0=pts[i], p1=pts[i+1], s0=lr? i/N : 1-i/N, s1=lr? (i+1)/N : 1-(i+1)/N;
      const ss0=-E+(1+2*E)*s0, ss1=-E+(1+2*E)*s1, u0=(.075+.85*ss0)*texW, u1=(.075+.85*ss1)*texW;
      const exb=i>0? 2 : 0, ext=(P,Q,d)=>{ const l=Math.max(1,Math.hypot(P[0]-Q[0],P[1]-Q[1])); return [P[0]+(P[0]-Q[0])/l*d,P[1]+(P[1]-Q[1])/l*d]; }, q0t=ext(p0.top,p1.top,exb), q0b=ext(p0.bot,p1.bot,exb);
      const ex=i<N-1? 3 : 0, q1t=[p1.top[0]+(p1.top[0]-p0.top[0])/Math.max(1,Math.hypot(p1.top[0]-p0.top[0],p1.top[1]-p0.top[1]))*ex,p1.top[1]+(p1.top[1]-p0.top[1])/Math.max(1,Math.hypot(p1.top[0]-p0.top[0],p1.top[1]-p0.top[1]))*ex], q1b=[p1.bot[0]+(p1.bot[0]-p0.bot[0])/Math.max(1,Math.hypot(p1.bot[0]-p0.bot[0],p1.bot[1]-p0.bot[1]))*ex,p1.bot[1]+(p1.bot[1]-p0.bot[1])/Math.max(1,Math.hypot(p1.bot[0]-p0.bot[0],p1.bot[1]-p0.bot[1]))*ex];   /* each slice reaches a hair into the next, so no seams */
      x.save(); x.beginPath(); x.moveTo(q0t[0],q0t[1]); x.lineTo(q1t[0],q1t[1]); x.lineTo(q1b[0],q1b[1]); x.lineTo(q0b[0],q0b[1]); x.closePath(); x.clip();
      const du=u1-u0||1e-3, a=(p1.top[0]-p0.top[0])/du, b=(p1.top[1]-p0.top[1])/du, c=(p0.bot[0]-p0.top[0])/texH, d=(p0.bot[1]-p0.top[1])/texH;
      x.transform(a,b,c,d,p0.top[0]-a*u0,p0.top[1]-b*u0); { const su=Math.max(0,Math.floor(Math.min(u0,u1))-8), sw=Math.min(texW-su,Math.ceil(Math.abs(du))+16); if(sw>0) x.drawImage(btex,su,0,sw,texH,su,0,sw,texH); }
      x.restore();
    }
    { const xa=pts[0].top[0], xb=pts[N].top[0]; if(Math.abs(xb-xa)>2){ const g=x.createLinearGradient(xa,0,xb,0);   /* the folds catch the light and fall into shadow along its length */
        for(let i=0;i<=N;i+=2){ const sh=pts[i].shade; g.addColorStop(i/N, sh<1? `rgba(70,44,20,${Math.min(.28,(1-sh)*.7).toFixed(3)})` : `rgba(255,236,204,${Math.min(.4,(sh-1)*1.6).toFixed(3)})`); }
        x.save(); x.globalCompositeOperation="source-atop"; x.fillStyle=g; x.beginPath(); for(let i=0;i<=N;i++) i? x.lineTo(pts[i].top[0],pts[i].top[1]) : x.moveTo(pts[i].top[0],pts[i].top[1]); for(let i=N;i>=0;i--) x.lineTo(pts[i].bot[0],pts[i].bot[1]); x.closePath(); x.fill();
        { const rr=Math.max(W,H)*.45, gl=x.createRadialGradient(sp.x,sp.y,0,sp.x,sp.y,rr); gl.addColorStop(0,"rgba(255,206,120,.6)"); gl.addColorStop(.5,"rgba(255,190,110,.24)"); gl.addColorStop(1,"rgba(255,170,90,0)"); x.fillStyle=gl; x.fill(); }   /* where the sun is behind it, the silk glows */
        x.restore(); } }
    { x.save(); x.lineJoin="round"; x.lineCap="round"; const ht0=Math.hypot(pts[N>>1].bot[0]-pts[N>>1].top[0],pts[N>>1].bot[1]-pts[N>>1].top[1]);
      const g=x.createLinearGradient(pts[0].top[0],0,pts[N].top[0],0); for(let i=0;i<=N;i+=4){ const d=Math.hypot(pts[i].top[0]-sp.x,pts[i].top[1]-sp.y)/Math.max(W,H); g.addColorStop(i/N,`rgba(255,236,190,${Math.max(.18,.75-d*1.1).toFixed(2)})`); }
      x.strokeStyle=g; x.lineWidth=Math.max(1,ht0*.05); x.beginPath(); for(let i=0;i<=N;i++) i? x.lineTo(pts[i].top[0],pts[i].top[1]+ht0*.02) : x.moveTo(pts[i].top[0],pts[i].top[1]+ht0*.02); x.stroke(); x.restore(); }   /* the sun catching the top edge */
    /* pinch wrinkles fanning out from where each bill grips the cloth */
    for(const [i0,dirn] of [[Math.round(N*E/(1+2*E)),1],[N-Math.round(N*E/(1+2*E)),-1]]){ const P0=pts[i0], ht=Math.hypot(P0.bot[0]-P0.top[0],P0.bot[1]-P0.top[1]);
      for(let k=0;k<3;k++){ const j=Math.min(N,Math.max(0,i0+dirn*(2+k))), Q=pts[j], fy=.3+k*.2, tx0=P0.top[0]+(P0.bot[0]-P0.top[0])*.15, ty0=P0.top[1]+(P0.bot[1]-P0.top[1])*.15, tx1=Q.top[0]+(Q.bot[0]-Q.top[0])*fy, ty1=Q.top[1]+(Q.bot[1]-Q.top[1])*fy;
        x.strokeStyle="rgba(90,62,30,.22)"; x.lineWidth=Math.max(.6,ht*.035); x.beginPath(); x.moveTo(tx0,ty0); x.quadraticCurveTo((tx0+tx1)/2,(ty0+ty1)/2-ht*.08,tx1,ty1); x.stroke();
        x.strokeStyle="rgba(255,250,236,.35)"; x.lineWidth=Math.max(.4,ht*.02); x.beginPath(); x.moveTo(tx0,ty0+ht*.04); x.quadraticCurveTo((tx0+tx1)/2,(ty0+ty1)/2-ht*.04,tx1,ty1+ht*.04); x.stroke(); } }
    /* swallow-tailed ends: a V cut into each end of the cloth */
    x.save(); x.globalCompositeOperation="destination-out";
    for(const [i,q] of [[0,2],[N,N-2]]){ const p=pts[i], o=pts[q], m=[(p.top[0]+p.bot[0])/2,(p.top[1]+p.bot[1])/2], mo=[(o.top[0]+o.bot[0])/2,(o.top[1]+o.bot[1])/2], ap=[m[0]+(mo[0]-m[0])*.75,m[1]+(mo[1]-m[1])*.75];
      const dx=m[0]-mo[0], dy=m[1]-mo[1], l=Math.hypot(dx,dy)||1, ux=dx/l*6, uy=dy/l*6;
      x.beginPath(); x.moveTo(p.top[0]+ux,p.top[1]+uy+(p.bot[1]-p.top[1])*.08); x.lineTo(ap[0],ap[1]); x.lineTo(p.bot[0]+ux,p.bot[1]+uy-(p.bot[1]-p.top[1])*.08); x.lineTo(p.bot[0]+ux*3,p.bot[1]+uy*3); x.lineTo(p.top[0]+ux*3,p.top[1]+uy*3); x.closePath(); x.fill(); }
    x.restore();
    /* little brass weights hanging on short cords from the lower edge, swinging as the birds fly and the cloth ripples */
    const wts=[]; for(const [k,sw,cl] of [[.04,0,.55],[.27,1,.95],[.5,2,.4],[.73,3,.75],[.96,4,.5]]){ const i=Math.round((k+E)/(1+2*E)*N), P=pts[i], ht=Math.hypot(P.bot[0]-P.top[0],P.bot[1]-P.top[1]);
      const th=-B.dir*.16+Math.sin(B.t*(3.4-cl*1.2)+sw*1.9)*.22+Math.sin(B.t*4.6+sw)*.06, L=ht*cl, r=Math.max(1.4,ht*.085), ex=P.bot[0]+Math.sin(th)*L, ey=P.bot[1]+Math.cos(th)*L;
      x.strokeStyle="rgba(70,52,30,.85)"; x.lineWidth=Math.max(.35,ht*.011); x.beginPath(); x.moveTo(P.bot[0],P.bot[1]-ht*.02); x.quadraticCurveTo(P.bot[0]+Math.sin(th)*L*.45,P.bot[1]+Math.cos(th)*L*.55,ex,ey); x.stroke();   /* the cord */
      x.fillStyle="#7a5a24"; x.beginPath(); x.ellipse(ex,ey+r*.15,r*.42,r*.3,th,0,6.283); x.fill();                                                      /* the cap */
      const cxw=ex+Math.sin(th)*r*1.1, cyw=ey+Math.cos(th)*r*1.1, g=x.createRadialGradient(cxw-r*.4,cyw-r*.45,r*.1,cxw,cyw,r*1.15);
      g.addColorStop(0,"#ffe6a6"); g.addColorStop(.35,"#d6a44c"); g.addColorStop(.8,"#8a5f22"); g.addColorStop(1,"#4a3210"); x.fillStyle=g;
      x.save(); x.translate(cxw,cyw); x.rotate(-th); x.beginPath(); x.moveTo(0,-r*1.05); x.bezierCurveTo(r*.75,-r*.7,r*.95,r*.35,0,r*1.05); x.bezierCurveTo(-r*.95,r*.35,-r*.75,-r*.7,0,-r*1.05); x.fill(); x.restore();   /* a teardrop of brass */
      wts.push([cxw,cyw,r]); }
    B.bp=birds.map(b=>proj(...b.P));
    for(const b of birds) blueBird3D(x,b.P,(()=>{ const l=Math.hypot(b.V[0],b.V[1]*.5,b.V[2])||1; return [b.V[0]/l,b.V[1]*.5/l,b.V[2]/l]; })(),b.flap,b.glide,proj,Kw,sunL);
    /* light and air, over the whole group */
    let xs=[], ys=[]; for(const p of pts){ xs.push(p.top[0],p.bot[0]); ys.push(p.top[1],p.bot[1]); } for(const b of birds){ const q=proj(...b.P), rr=Kw*20*F/b.P[2]+20; xs.push(q[0]-rr,q[0]+rr); ys.push(q[1]-rr,q[1]+rr); } for(const [a,b2,r] of wts){ xs.push(a-r*2,a+r*2); ys.push(b2+r*2); }
    const X0=Math.max(0,Math.min(...xs)), X1=Math.min(W,Math.max(...xs)), Y0b=Math.max(0,Math.min(...ys)), Y1=Math.min(H,Math.max(...ys)); if(X1<=X0||Y1<=Y0b) return;
    const RX=X0*.6, RY=Y0b*.6, RW=(X1-X0)*.6, RH=(Y1-Y0b)*.6, mx=(X0+X1)/2, my=(Y0b+Y1)/2;
    x.setTransform(1,0,0,1,0,0); x.globalCompositeOperation="source-atop";
    x.fillStyle="rgba(255,206,140,.14)"; x.fillRect(RX,RY,RW,RH);                                                                   /* caught in the low golden light */
    { const rl=x.createLinearGradient(RX,0,RX+RW,0), k=sp.x>mx?1:0; rl.addColorStop(k,"rgba(255,220,160,.26)"); rl.addColorStop(1-k,"rgba(255,200,140,.04)"); x.fillStyle=rl; x.fillRect(RX,RY,RW,RH); }   /* brightest on the side toward the sun */
    if(!B.skyC||(B.skyT=(B.skyT||0)-1)<=0){ B.skyT=8; const ip=toImg(mx,my); B.skyC=(ip&&ip[0]>=0&&ip[0]<=1&&ip[1]>=0&&ip[1]<=1&&sampleAt(ip[0],ip[1]))||[200,170,130]; }
    x.fillStyle=rgb(B.skyC,.08); x.fillRect(RX,RY,RW,RH);                                                                         /* a little of the sky's air between us */
    if(SC.dim()){ x.fillStyle="rgba(20,14,6,.18)"; x.fillRect(RX,RY,RW,RH); } else { const tn=tint(); if(tn.a>0){ x.globalAlpha=tn.a; x.fillStyle=tn.c; x.fillRect(RX,RY,RW,RH); x.globalAlpha=1; } }
    if(dark){ x.fillStyle="rgba(10,8,14,.3)"; x.fillRect(RX,RY,RW,RH); }
    x.globalCompositeOperation="source-over";
    ctx.save(); ctx.globalAlpha=1; ctx.filter="blur(.55px)"; ctx.drawImage(bncv,RX,RY,RW,RH,X0,Y0b,X1-X0,Y1-Y0b); ctx.restore(); ctx.filter="none";
    B.sx=mx; B.sy=my;
  }
  function drawFlock(dt,dark){
    nextBB-=dt; if(!bbFlock&&nextBB<=0){ if(stageBusy()) nextBB=rnd(12,25); else startFlock(); } if(!bbFlock) return;
    const f=bbFlock; f.t+=dt; const T=f.t, sp=sun(), F=H*.5, cx=W/2, cy=H*.52;
    const cw=Math.ceil(W*.6), ch=Math.ceil(H*.6); if(fcv.width!==cw||fcv.height!==ch){ fcv.width=cw; fcv.height=ch; }
    const x=fcx; x.setTransform(1,0,0,1,0,0); x.clearRect(0,0,cw,ch); x.setTransform(.6,0,0,.6,0,0);
    let zc=0, n=0, any=false, sxC=0, syC=0;
    for(const b of f.birds){
      const z=Math.max(.06,(.09+b.oz*.25)*Math.exp(T*.55)), pull=ease(T/3.5), tX=f.wx, tY=f.wy;   /* they hold their height above you and level off toward the horizon */
      const X=lerp(f.X0+b.ox,tX+b.ox*1.5,pull), Y=lerp(f.Y0+b.oy,tY+b.oy*1.2,pull)+Math.sin(T*2.6+b.ph)*.03;   /* the bluebird's gentle bounding flight */
      const sx=cx+X*F/z, sy=cy+Y*F/z; b.sx=sx; b.sy=sy; if(z>14) continue; any=true;
      const glide=Math.sin(T*1.7+b.glide)>.55, flap=T*b.f+b.ph, Pn=[X,Y,z], V=b.pp? [Pn[0]-b.pp[0],Pn[1]-b.pp[1],Pn[2]-b.pp[2]] : [0,.1,1]; b.pp=Pn;
      if(Math.hypot(...V)>1e-6) b.V=b.V? b.V.map((v,i)=>lerp(v,V[i],.25)) : V;
      bluebird3D(x,Pn,b.V||V,flap,glide,(X3,Y3,Z3)=>[cx+X3*F/Math.max(.05,Z3),cy+Y3*F/Math.max(.05,Z3)]);
      zc+=z; n++; sxC+=sx; syC+=sy; }
    if(!any&&T>3){ bbFlock=null; nextBB=rnd(120,240); return; }
    if(!n) return; zc/=n; sxC/=n; syC/=n;
    x.setTransform(1,0,0,1,0,0); x.globalCompositeOperation="source-atop";
    x.fillStyle="rgba(40,26,18,.32)"; x.fillRect(0,0,cw,ch); x.fillStyle="rgba(255,168,84,.2)"; x.fillRect(0,0,cw,ch);        /* backlit, in the orange evening light */
    if(!f.skyC||(f.skyT=(f.skyT||0)-1)<=0){ f.skyT=6; const ip=toImg(sxC,syC); f.skyC=(ip&&ip[0]>=0&&ip[0]<=1&&ip[1]>=0&&ip[1]<=1&&sampleAt(ip[0],ip[1]))||[200,170,130]; }
    const haze=Math.min(.8,Math.max(0,(zc-1)/7)); if(haze>0){ x.fillStyle=rgb(f.skyC,haze); x.fillRect(0,0,cw,ch); }
    if(SC.dim()){ x.fillStyle="rgba(20,14,6,.18)"; x.fillRect(0,0,cw,ch); } else { const tn=tint(); if(tn.a>0){ x.globalAlpha=tn.a; x.fillStyle=tn.c; x.fillRect(0,0,cw,ch); x.globalAlpha=1; } }
    if(dark){ x.fillStyle="rgba(10,8,14,.3)"; x.fillRect(0,0,cw,ch); }
    x.globalCompositeOperation="source-over";
    const a=zc>9? Math.max(0,1-(zc-9)/4) : 1;   /* no fade in: they sweep in over your head from behind, huge at first */
    ctx.save(); ctx.globalAlpha=a; ctx.filter=zc<.6? `blur(${((.6-zc)*22+.4).toFixed(1)}px)` : "none"; ctx.drawImage(fcv,0,0,cw,ch,0,0,W,H); ctx.restore(); ctx.filter="none";
  }
  /* ---- a pileated woodpecker: bounds in from the woods on the left, lands on the lone tree, hitches up the trunk, drums, and flies off ---- */
  let pecker=null, nextPecker=20; const pcv=document.createElement("canvas"), pcx=pcv.getContext("2d"); const TRUNK=[[.187,.666],[.188,.612]];
  /* it comes in over your shoulder from behind, big and close, and flies off across the lawn to the tree, shrinking into the distance, then swings up onto the trunk */
  function startPecker(){ pecker={t:0,x:-99,y:-99,state:"approach",X0:(Math.random()<.5?-1:1)*rnd(.03,.08),Y0:-rnd(.07,.11),dur:rnd(3.2,3.8),hops:2+Math.floor(Math.random()*2),drums:0,st:0,fl:0,face:1,tgt:0,m:1}; }
  /* the pileated woodpecker in true 3D for its flights: built around its own heading, wings beating about the body, seen from whatever angle it happens to be at */
  function pileated3D(x,P,V,flap,glide,proj,Kw,C){
    const nrm=v=>{ const l=Math.hypot(v[0],v[1],v[2])||1; return [v[0]/l,v[1]/l,v[2]/l]; }, crs=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
    const f=nrm(V), r=nrm(crs(f,[0,-1,0])), u=crs(r,f);
    const pt=(a,b,c)=>proj(P[0]+(f[0]*a+r[0]*b+u[0]*c)*Kw, P[1]+(f[1]*a+r[1]*b+u[1]*c)*Kw, P[2]+(f[2]*a+r[2]*b+u[2]*c)*Kw);
    const under=-(P[0]*u[0]+P[1]*u[1]+P[2]*u[2])<0, fl=glide? -.15 : Math.sin(flap)*1.05+.1;
    const BK=rgb([12,10,10]), WH=rgb([176,170,156]), RD=rgb([190,44,34]);
    const wing=sd=>{ const sh=pt(2,sd*1.4,0), wr=pt(1,sd*9,fl*4), tp=pt(-3,sd*17,fl*8), tr=pt(-6.5,sd*10,fl*4.2), rt=pt(-4.5,sd*1.4,0);
      x.fillStyle=BK; x.beginPath(); x.moveTo(sh[0],sh[1]); x.quadraticCurveTo(wr[0],wr[1],tp[0],tp[1]); x.quadraticCurveTo(tr[0],tr[1],rt[0],rt[1]); x.closePath(); x.fill();
      const a=pt(under?-.5:-1,sd*(under?4:9.5),fl*(under?2:4.3)), b=pt(under?-3.5:-2.2,sd*(under?11:13),fl*(under?5:5.8)), c=pt(under?-4.5:-3.6,sd*(under?6:11),fl*(under?3:4.8));
      x.fillStyle=WH; x.beginPath(); x.moveTo(a[0],a[1]); x.lineTo(b[0],b[1]); x.lineTo(c[0],c[1]); x.closePath(); x.fill(); };   /* the big white flashes in the wings */
    const dl=pt(0,-10,0), dr=pt(0,10,0), farS=(()=>{ const q=sd=>{ const w=[P[0]+r[0]*sd*10*Kw,P[1]+r[1]*sd*10*Kw,P[2]+r[2]*sd*10*Kw]; return w[0]*w[0]+w[1]*w[1]+w[2]*w[2]; }; return q(-1)>q(1)? -1 : 1; })();
    wing(farS);
    const tail=pt(-10,0,0), mid=pt(-1,0,0), head=pt(6,0,.6), w0=Math.max(.8,Math.hypot(...[0,1].map(i=>pt(0,1.8,0)[i]-pt(0,0,0)[i])));
    x.lineCap="round"; x.strokeStyle=BK; x.lineWidth=w0*1.6; x.beginPath(); x.moveTo(tail[0],tail[1]); x.lineTo(mid[0],mid[1]); x.stroke();
    x.lineWidth=w0*2.2; x.beginPath(); x.moveTo(mid[0],mid[1]); x.lineTo(head[0],head[1]); x.stroke();
    const hd=pt(7,0,.9), bk=pt(10.5,0,.4), cr0=pt(4.6,0,1.9), cr1=pt(7.6,0,2.2); x.fillStyle=BK; x.beginPath(); x.arc(hd[0],hd[1],w0*.85,0,6.283); x.fill();
    x.strokeStyle=C([60,56,52]); x.lineWidth=Math.max(.6,w0*.45); x.beginPath(); x.moveTo(hd[0],hd[1]); x.lineTo(bk[0],bk[1]); x.stroke();
    x.strokeStyle=RD; x.lineWidth=Math.max(.6,w0*.55); x.beginPath(); x.moveTo(cr0[0],cr0[1]); x.lineTo(cr1[0],cr1[1]); x.stroke();      /* the red crest, a slim swept-back ridge */
    wing(-farS);
  }
  function drawPecker(dt,dark){
    nextPecker-=dt; if(!pecker&&nextPecker<=0){ if(stageBusy()) nextPecker=rnd(12,25); else startPecker(); } if(!pecker) return;
    const p=pecker; p.t+=dt; p.st+=dt; const A=scr(TRUNK[0][0],TRUNK[0][1]), B=scr(TRUNK[1][0],TRUNK[1][1]), L=Math.hypot(B[0]-A[0],B[1]-A[1]), sc=Math.max(.6,L/60);
    const at=u=>[lerp(A[0],B[0],u)-3*sc,lerp(A[1],B[1],u)];
    let peck=0; p.m=1; p.back=false;
    if(p.state==="approach"){
      const F=H*.5, cx=W/2, cy=H*.52, zT=6, z0=.35, u=Math.min(1,p.st/p.dur), e=1-(1-u)*(1-u)*(1-u), z=z0*Math.pow(zT/z0,e), tg=at(p.tgt);
      const ev=(1/z0-1/z)/(1/z0-1/zT);                                                                         /* how far it has closed on the tree, measured in perspective */
      const nx=lerp(cx+p.X0*F/z,tg[0],ev), ny=lerp(cy+p.Y0*F/z,tg[1],ev)+Math.sin(ev*Math.PI*4)*10*sc*(1-ev*.5);   /* the bounding flight, rising and dipping */
      p.P3=[(nx-cx)*z/F,(ny-cy)*z/F,z]; p.three=u<.97; if(p.x>-90) p.face=nx>=p.x?1:-1; p.x=nx; p.y=ny; p.m=zT/z;
      p.fl+=dt; const burst=(p.fl%1.0)<.6; p.wing=burst? Math.sin(p.t*24) : -.25; p.back=u<.82;
      if(u>=1){ p.state="cling"; p.st=0; p.x=tg[0]; p.y=tg[1]; p.wing=null; } }
    else if(p.state==="fly"||p.state==="leave"){
      const tg= p.state==="fly"? at(p.tgt) : [p.lx,p.ly], dx=tg[0]-p.x, dy=tg[1]-p.y, d=Math.hypot(dx,dy), v=170*sc*(p.state==="leave"?1.1:1)*Math.min(1,.3+d/(60*sc));
      p.fl+=dt; const burst=(p.fl%1.1)<.55;                                                                    /* flaps hard, then folds and swoops: the woodpecker's bounding flight */
      p.x+=dx/d*Math.min(d,v*dt); p.y+=dy/d*Math.min(d,v*dt)+(burst? -14 : 18)*sc*dt*(d>20*sc?1:0); p.face=dx>=0?1:-1; p.wing=burst? Math.sin(p.t*30) : -.2;
      if(p.state==="fly"&&d<2){ p.state="cling"; p.st=0; p.x=tg[0]; p.y=tg[1]; }
      if(p.state==="leave"&&(p.x<-40||p.x>W+40||p.y<-40)){ pecker=null; nextPecker=rnd(80,140); return; } }
    else if(p.state==="leave3"){                                                                              /* off into the woods, away from you, in perspective */
      const F=H*.5, cx=W/2, cy=H*.52, u=Math.min(1,p.st/3.2), z=6*Math.pow(16/6,u*u), e=u*(2-u);
      const nx=lerp(p.lx0,p.ltx,e), ny=lerp(p.ly0,p.lty,e)+Math.sin(u*Math.PI*5)*6*sc; p.x=nx; p.y=ny; p.m=6/z;
      p.P3=[(nx-cx)*z/F,(ny-cy)*z/F,z]; p.three=true; p.fl+=dt; p.wing=(p.fl%1)<.6? 1 : 0; p.fade=u>.7? (1-u)/.3 : 1;
      if(u>=1){ pecker=null; nextPecker=rnd(80,140); return; } }
    else if(p.state==="cling"){ p.face=1; p.wing=null; p.three=false;
      if(p.st<dt*1.5){ p.drumMode=Math.random()<.35; p.taps=[]; let tt=rnd(.3,.6); const n=4+Math.floor(Math.random()*4); for(let i=0;i<n;i++){ p.taps.push(tt); tt+=rnd(.16,.42); } p.lastTap=-9; }
      if(p.drumMode){ if(p.st>.6&&p.st<.6+1.4){ peck=Math.max(0,Math.sin((p.st-.6)*Math.PI*10)); if(!p.drummed){ p.drummed=true; natureSfx.drum&&natureSfx.drum(A[0]/W); } } }   /* rat-a-tat-tat */
      else { while(p.taps.length&&p.taps[0]<=p.st){ p.taps.shift(); p.lastTap=p.st; natureSfx.peck&&natureSfx.peck(A[0]/W); }   /* foraging: a peck, a pause, another, each one knocking */
        const since=p.st-p.lastTap; peck= since<.14? Math.sin(Math.min(1,since/.14)*Math.PI) : 0; }
      if(p.st>2.6){ if(p.hops<=0){ p.state="leave3"; p.st=0; p.lx0=p.x; p.ly0=p.y; p.ltx=rnd(W*.02,W*.14); p.lty=gnd().vy-rnd(30,90); p.fl=0; } else if(p.hops>0){ p.hops--; p.state="hop"; p.st=0; p.h0=p.tgt; p.tgt=Math.min(.95,p.tgt+rnd(.12,.22)); p.drummed=false; } else { p.state="leave"; p.lx=-60; p.ly=p.y-rnd(80,160); p.fl=0; } } }
    else if(p.state==="hop"){ const u=Math.min(1,p.st/.35); const q=at(lerp(p.h0,p.tgt,u)); p.x=q[0]; p.y=q[1]-Math.sin(u*Math.PI)*2*sc; p.wing=null; if(u>=1){ p.state="cling"; p.st=0; } }
    /* paint: a big black crow-sized bird, flaming red crest, white stripe down the neck */
    const k=sc*1.9*p.m, lt=dark?.5:.74, C=c=>rgb(mulv(c,lt)), R2=Math.min(2,900/(40*k)), sz=Math.ceil(40*k*R2);
    if(pcv.width<sz||pcv.height<sz){ pcv.width=pcv.height=sz; } const x=pcx; x.setTransform(1,0,0,1,0,0); x.clearRect(0,0,pcv.width,pcv.height);
    if(p.three&&p.P3){ const F=H*.5, cx=W/2, cy=H*.52, P=p.P3, V=p.pp3? [P[0]-p.pp3[0],P[1]-p.pp3[1],P[2]-p.pp3[2]] : [0,0,1]; p.pp3=P;
      if(Math.hypot(...V)>1e-7) p.V3=p.V3? p.V3.map((v,i)=>lerp(v,V[i],.2)) : V;
      x.save(); x.setTransform(R2,0,0,R2,0,0); pileated3D(x,P,p.V3||V,p.t*24,(p.fl%1)>=.6,(X3,Y3,Z3)=>{ const zz=Math.max(.05,Z3); return [cx+X3*F/zz-p.x+sz/R2/2, cy+Y3*F/zz-p.y+sz/R2/2]; },sc*1.9*6/F,C); x.restore();
      x.save(); }
    else { x.save(); x.translate(sz/2,sz/2); x.scale(k*p.face*R2,k*R2); }
    if(p.three&&p.P3){}
    else if(p.wing==null){ x.rotate(-.12);                                                                         /* clinging upright against the bark, braced on its tail */
      x.fillStyle=rgb([12,10,10]); x.beginPath(); x.ellipse(0,0,2.6,6.5,0,0,6.283); x.fill(); x.beginPath(); x.moveTo(-1,5); x.lineTo(-2.4,11); x.lineTo(.6,11); x.closePath(); x.fill();   /* deep, near-true black */
      x.fillStyle=rgb([172,166,152]); x.beginPath(); x.ellipse(.9,-1.4,.8,2.2,.2,0,6.283); x.fill();
      x.save(); x.translate(peck*1.4,-7); x.fillStyle=rgb([14,12,12]); x.beginPath(); x.arc(0,0,2.3,0,6.283); x.fill();
      x.fillStyle=rgb([196,44,34]); x.beginPath(); x.moveTo(-2.6,-.6); x.quadraticCurveTo(-1.6,-6.4,3,-2.4); x.lineTo(1.2,.2); x.closePath(); x.fill();   /* a big, bright red crest */
      x.strokeStyle=rgb([176,170,156]); x.lineWidth=1.3; x.beginPath(); x.moveTo(2,.2); x.lineTo(-.4,3.2); x.lineTo(-1.4,6.4); x.stroke();          /* the bold white stripe down the neck */
      x.beginPath(); x.moveTo(-1.6,-.8); x.lineTo(1.6,-.9); x.stroke();
      x.strokeStyle=C([60,56,52]); x.lineWidth=1; x.beginPath(); x.moveTo(1.8,-.4); x.lineTo(4.6,-.2); x.stroke(); x.restore(); }
    else if(p.back){ const w=p.wing; x.scale(p.face,1);                                                        /* seen from behind as it flies away from you */
      for(const s2 of [-1,1]){ x.fillStyle=C([24,20,20]); x.beginPath(); x.moveTo(s2*2,-2); x.quadraticCurveTo(s2*7,-4-w*5,s2*13,-1-w*9); x.lineTo(s2*12,2-w*6); x.quadraticCurveTo(s2*6,3,s2*2,3); x.closePath(); x.fill();
        x.fillStyle=C([226,222,210]); x.beginPath(); x.ellipse(s2*8.5,-1.2-w*5.4,1.6,.9,s2*-.3,0,6.283); x.fill(); }      /* the white flash in each wing */
      x.fillStyle=C([26,22,22]); x.beginPath(); x.ellipse(0,1,2.8,5.6,0,0,6.283); x.fill(); x.beginPath(); x.moveTo(-1.4,5); x.lineTo(0,9.5); x.lineTo(1.4,5); x.closePath(); x.fill();
      x.beginPath(); x.arc(0,-4.6,2.2,0,6.283); x.fill(); x.fillStyle=C([214,40,32]); x.beginPath(); x.moveTo(-1.6,-5.6); x.quadraticCurveTo(0,-9.4,1.6,-5.6); x.closePath(); x.fill(); }   /* the red crest */
    else { const w=p.wing;                                                                                    /* in flight: black wings with white flashes */
      x.fillStyle=C([26,22,22]); x.beginPath(); x.ellipse(0,0,6.5,2.2,0,0,6.283); x.fill();
      x.beginPath(); x.moveTo(-6,0); x.lineTo(-10,-1); x.lineTo(-10,1.4); x.closePath(); x.fill();
      x.fillStyle=C([214,40,32]); x.beginPath(); x.arc(6.6,-1.6,1.5,0,6.283); x.fill();
      for(const s2 of [-1,1]){ x.fillStyle=C([24,20,20]); x.beginPath(); x.moveTo(-2,0); x.quadraticCurveTo(0,s2*(4+w*5),3,s2*(2+w*8)); x.lineTo(4,0); x.closePath(); x.fill();
        x.fillStyle=C([222,218,206]); x.beginPath(); x.ellipse(1.6,s2*(1.6+w*3.4),1.2,.9,0,0,6.283); x.fill(); } }
    x.restore();
    /* set it in the evening: backlit, warm on the sun side, hazed by the distance to the tree, toned like the rest of the scene */
    x.globalCompositeOperation="source-atop"; const sp=sun(), sdx=Math.sign(sp.x-p.x)||1;
    x.fillStyle="rgba(255,168,84,.16)"; x.fillRect(0,0,sz,sz);
    const rl=x.createLinearGradient(sz/2-sdx*sz*.25,0,sz/2+sdx*sz*.25,0); rl.addColorStop(0,"rgba(20,12,6,.2)"); rl.addColorStop(.6,"rgba(255,196,120,0)"); rl.addColorStop(1,"rgba(255,196,120,.35)"); x.fillStyle=rl; x.fillRect(0,0,sz,sz);
    if(!p.bg||(p.bgT=(p.bgT||0)-1)<=0){ p.bgT=15; const ip=toImg(p.x,p.y); p.bg=(ip&&ip[0]>=0&&ip[0]<=1&&ip[1]>=0&&ip[1]<=1&&sampleAt(ip[0],ip[1]))||[120,100,70]; }
    x.fillStyle=rgb(mixv(p.bg,[214,176,130],.4),(p.wing==null?.16:.2)*Math.min(1,1.4/p.m)); x.fillRect(0,0,sz,sz);                     /* the haze of the air between you and the tree */
    if(SC.dim()){ x.fillStyle="rgba(20,14,6,.14)"; x.fillRect(0,0,sz,sz); } else { const tn=tint(); if(tn.a>0){ x.globalAlpha=tn.a; x.fillStyle=tn.c; x.fillRect(0,0,sz,sz); x.globalAlpha=1; } }
    x.globalCompositeOperation="source-over";
    ctx.save(); ctx.globalAlpha=p.state==="leave3"? Math.max(0,p.fade) : 1; { const bl=Math.max(0,p.m-3)*.32+(p.state==="cling"||p.state==="hop"? .5 : 0); ctx.filter=bl>.3? `blur(${bl.toFixed(1)}px)` : "none"; } ctx.drawImage(pcv,0,0,sz,sz,p.x-sz/R2/2,p.y-sz/R2/2,sz/R2,sz/R2); ctx.restore(); ctx.filter="none";
  }
  /* ---- fireflies blinking low over the lawn and along the edge of the field ---- */
  const flies=[], flyGlow=(()=>{ const c=document.createElement("canvas"); c.width=c.height=48; const x=c.getContext("2d"), g=x.createRadialGradient(24,24,0,24,24,24); g.addColorStop(0,"rgba(244,255,160,1)"); g.addColorStop(.3,"rgba(190,250,90,.5)"); g.addColorStop(1,"rgba(160,230,60,0)"); x.fillStyle=g; x.fillRect(0,0,48,48); return c; })();
  function edgeY(x){ return gnd().vy+lawnMinG(x)-rnd(-4,22); }
  function drawFireflies(dt,dark){
    if(!flies.length) for(let i=0;i<(JUNE19?44:MOBILE()?9:16);i++){ const x=rnd(0,W); flies.push({ax:x,ay:edgeY(x),x,y:0,per:rnd(3,6.5),ph:rnd(0,6),wan:rnd(0,6),r:rnd(1.1,1.9)}); }
    ctx.save(); ctx.globalCompositeOperation="lighter";
    for(const f of flies){ f.wan+=dt*.5;
      f.x=f.ax+Math.sin(f.wan*1.3+f.ph)*18; f.y=f.ay+Math.cos(f.wan*.9)*6;                                          /* drifting along the edge of the brush */
      if(Math.random()<dt*.02){ f.ax=rnd(0,W); f.ay=edgeY(f.ax); }
      const c=((t+f.ph*f.per/6.283)%f.per), on=c<.55? Math.sin(c/.55*Math.PI) : 0; if(on<=.01) continue;
      const r=f.r*(dark?1.2:1), yy=f.y-c*5;                                                                    /* a small rising flash, the eastern firefly's J */
      ctx.globalAlpha=Math.min(1,on*1.1); ctx.drawImage(flyGlow,f.x-r*3,yy-r*3,r*6,r*6); }
    ctx.globalAlpha=1;
    ctx.restore();
  }
  /* ---- monarch butterflies: a few drifting over the field and the lawn in 3D, flapping and then sailing on wings held in a shallow V ---- */
  function mipChain(c){ const out=[c]; let cur=c; for(let i=0;i<5&&cur.width>8;i++){ const n=document.createElement("canvas"); n.width=Math.max(1,Math.round(cur.width/2)); n.height=Math.max(1,Math.round(cur.height/2)); const x=n.getContext("2d"); x.imageSmoothingEnabled=true; x.imageSmoothingQuality="high"; x.drawImage(cur,0,0,n.width,n.height); out.push(n); cur=n; } return out; }
  function mipPick(chain,pxPerSprPx){ let n=0; while(n<chain.length-1&&pxPerSprPx*Math.pow(2,n)<.75) n++; return n; }
  let monSpr=null; const MR=10, MX0=0, MY0=-14; const mons=[]; let nextMon=6; const mncv=document.createElement("canvas"), mncx=mncv.getContext("2d");
  function monarchSprite(){ if(monSpr) return monSpr; const c=document.createElement("canvas"); c.width=26*MR; c.height=34*MR; const x=c.getContext("2d");
    x.setTransform(MR,0,0,MR,-MX0*MR,-MY0*MR); const OR=[232,124,28], OR2=[244,156,52], BK=[24,18,16], WD=[246,240,226];
    /* hindwing: rounded, orange with a thick black border and black veins */
    x.fillStyle=rgb(BK); x.beginPath(); x.moveTo(1,0); x.bezierCurveTo(9,-1,17,2,17,8); x.bezierCurveTo(17,14,11,18,6,17); x.bezierCurveTo(3,16,1.4,10,1,0); x.fill();
    const hg=x.createRadialGradient(4,4,1,6,6,13); hg.addColorStop(0,rgb(OR2)); hg.addColorStop(1,rgb(OR)); x.fillStyle=hg;
    x.beginPath(); x.moveTo(2,1.2); x.bezierCurveTo(9,.4,15,3,15,8); x.bezierCurveTo(15,12.6,10,15.6,6.4,15); x.bezierCurveTo(4,14.4,2.6,9,2,1.2); x.fill();
    x.strokeStyle=rgb(BK); x.lineWidth=.55; for(const [ex,ey] of [[15,5],[15,9],[12,13.5],[8,15],[5,14]]){ x.beginPath(); x.moveTo(2,2); x.quadraticCurveTo(ex*.55,ey*.5,ex,ey); x.stroke(); }
    x.fillStyle=rgb(WD); for(let i=0;i<7;i++){ const a=-.2+i*.32, rr=.45; x.beginPath(); x.arc(9+Math.cos(a)*7.4,7.5+Math.sin(a)*8.2,rr,0,6.283); x.fill(); }
    /* forewing: long, with the black tip and its rows of white spots */
    x.fillStyle=rgb(BK); x.beginPath(); x.moveTo(1,-3); x.bezierCurveTo(9,-8,18,-12,23,-11); x.bezierCurveTo(24,-8,22,-2,18,2); x.bezierCurveTo(12,4,6,3,1,1); x.fill();
    const fg=x.createLinearGradient(2,0,18,-6); fg.addColorStop(0,rgb(OR2)); fg.addColorStop(1,rgb(OR)); x.fillStyle=fg;
    x.beginPath(); x.moveTo(2,-2.4); x.bezierCurveTo(8,-6,13,-8,16,-8.4); x.bezierCurveTo(18,-6,18.4,-2.4,16.4,.4); x.bezierCurveTo(11,2,6,1.8,2,.4); x.fill();
    x.strokeStyle=rgb(BK); x.lineWidth=.55; for(const [ex,ey] of [[17,-6],[17.5,-2.5],[15,0.6],[10,1.6]]){ x.beginPath(); x.moveTo(2,-1); x.quadraticCurveTo(ex*.55,ey*.5-.6,ex,ey); x.stroke(); }
    x.fillStyle=rgb(WD); for(const [a,b,r] of [[19.5,-9.4,.6],[21.2,-8.2,.5],[20.6,-5.6,.55],[19,-3,.5],[17.6,-.6,.45],[13,2.4,.4],[9,2.8,.4],[18.4,-7.2,.45]]){ x.beginPath(); x.arc(a,b,r,0,6.283); x.fill(); }
    x.fillStyle=rgb([246,170,70]); for(const [a,b] of [[18.6,-8.2],[20,-7]]){ x.beginPath(); x.arc(a,b,.5,0,6.283); x.fill(); }   /* the little orange spots near the tip */
    x.setTransform(1,0,0,1,0,0); x.globalCompositeOperation="source-atop"; x.fillStyle="rgba(255,150,40,.1)"; x.fillRect(0,0,c.width,c.height); x.globalCompositeOperation="source-over";
    return monSpr=mipChain(c); }
  function monarch3D(x,P,V,ang,proj){
    const nrm=v=>{ const l=Math.hypot(v[0],v[1],v[2])||1; return [v[0]/l,v[1]/l,v[2]/l]; }, crs=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
    const v=nrm(V), f=nrm([v[0],v[1]-.3,v[2]]), r=nrm(crs(f,[0,-1,0])), u=crs(r,f), K=.0074;
    const W3=(a,b,c)=>[P[0]+(f[0]*a+r[0]*b+u[0]*c)*K, P[1]+(f[1]*a+r[1]*b+u[1]*c)*K, P[2]+(f[2]*a+r[2]*b+u[2]*c)*K], S=p=>proj(p[0],p[1],p[2]), spr=monarchSprite();
    const wingAt=sd=>{ const L=(lx,ly)=>W3(-ly,sd*lx*Math.cos(ang),lx*Math.sin(ang)); const O=S(L(0,0)), A=S(L(1,0)), B=S(L(0,1)), X=[A[0]-O[0],A[1]-O[1]], Y=[B[0]-O[0],B[1]-O[1]];
      const n=mipPick(spr,Math.max(Math.hypot(X[0],X[1]),Math.hypot(Y[0],Y[1]))/MR), R=MR/Math.pow(2,n), im=spr[n];
      x.save(); x.transform(X[0]/R,X[1]/R,Y[0]/R,Y[1]/R,O[0]+X[0]*MX0+Y[0]*MY0,O[1]+X[1]*MX0+Y[1]*MY0); x.imageSmoothingEnabled=true; x.imageSmoothingQuality="high"; x.drawImage(im,0,0,im.width,im.height,0,0,spr[0].width/Math.pow(2,n),spr[0].height/Math.pow(2,n)); x.restore(); };
    const d2=sd=>{ const p=W3(0,sd*10,0); return p[0]*p[0]+p[1]*p[1]+p[2]*p[2]; }, far=d2(-1)>d2(1)? -1 : 1;
    wingAt(far);
    const hd=S(W3(5,0,0)), tl=S(W3(-10,0,0)), wd=Math.max(.6,Math.hypot(...[0,1].map(i=>S(W3(0,1.2,0))[i]-S(W3(0,0,0))[i])));
    x.lineCap="round"; x.strokeStyle="rgb(22,16,14)"; x.lineWidth=wd*1.5; x.beginPath(); x.moveTo(tl[0],tl[1]); x.lineTo(hd[0],hd[1]); x.stroke();
    x.lineWidth=Math.max(.4,wd*.35); for(const sd of [-1,1]){ const a1=S(W3(12,sd*3.5,1.5)); x.beginPath(); x.moveTo(hd[0],hd[1]); x.lineTo(a1[0],a1[1]); x.stroke(); }
    wingAt(-far);
  }
  let cmon=null, nextCmon=rnd(40,80); const cmcv=document.createElement("canvas"), cmcx=cmcv.getContext("2d");
  function startCmon(){ const inn=Math.random()<.5, side=Math.random()<.5?-1:1, far={x:W*rnd(.3,.7),y:H*rnd(.32,.55)}, near={x:W/2+side*W*rnd(.22,.4),y:H*rnd(.4,.7)};
    cmon={t:0,dur:rnd(7,9.5),inn,a:inn? far : near,b:inn? near : far,ph:rnd(0,6),flapT:0,glide:0,ang:.4,wx:rnd(0,6),wy:rnd(0,6)}; }
  function drawCmon(dt,dark){
    nextCmon-=dt; if(!cmon&&nextCmon<=0){ if(stageBusy()) nextCmon=rnd(12,25); else startCmon(); } if(!cmon) return;
    const m=cmon, F=H*.5, cx=W/2, cy=H*.52; m.t+=dt; const u=m.t/m.dur; if(u>=1){ cmon=null; nextCmon=rnd(90,180); return; }
    const zf=7, zn=.24, ue=m.inn? u : 1-u, z=zf*Math.pow(zn/zf,ease(ue)), k=ease(u);                      /* distance shrinks (or grows) at an even pace to the eye */
    const wob=Math.min(1,1.4/z)*W*.02;
    m.sx=lerp(m.a.x,m.b.x,k)+Math.sin(m.t*2.3+m.wx)*wob+Math.sin(m.t*5.1)*wob*.4; m.sy=lerp(m.a.y,m.b.y,k)+Math.sin(m.t*1.7+m.wy)*wob*1.2+Math.sin(m.t*6.3)*wob*.35;   /* that loose, bobbing butterfly line */
    m.flapT-=dt; if(m.flapT<=0){ m.glide=m.glide? 0 : 1; m.flapT=m.glide? rnd(.3,.8) : rnd(.7,1.6); }
    m.ang= m.glide? lerp(m.ang,.55,Math.min(1,dt*6)) : .35+Math.sin(m.t*Math.PI*2*5.2+m.ph)*1.05;
    const X=(m.sx-cx)*z/F, Y=(m.sy-cy)*z/F, Pn=[X,Y,z], Vn=m.pp? [X-m.pp[0],Y-m.pp[1],z-m.pp[2]] : [0,0,m.inn?-1:1]; m.pp=Pn;
    if(Math.hypot(...Vn)>1e-7) m.V=m.V? m.V.map((v,j)=>lerp(v,Vn[j],.12)) : Vn;
    const sz=Math.ceil(Math.min(Math.max(W,H)*1.1,64*.0074*F/z+16)); if(cmcv.width<sz||cmcv.height<sz){ cmcv.width=cmcv.height=Math.max(sz,cmcv.width); }
    const mx=cmcx; mx.setTransform(1,0,0,1,0,0); mx.clearRect(0,0,cmcv.width,cmcv.height); mx.globalCompositeOperation="source-over"; mx.imageSmoothingEnabled=true; mx.imageSmoothingQuality="high";
    monarch3D(mx,Pn,m.V||Vn,m.ang,(X3,Y3,Z3)=>{ const zz=Math.max(.05,Z3); return [cx+X3*F/zz-m.sx+sz/2,cy+Y3*F/zz-m.sy+sz/2]; });
    mx.globalCompositeOperation="source-atop"; mx.fillStyle="rgba(40,24,12,.1)"; mx.fillRect(0,0,sz,sz); mx.fillStyle="rgba(255,140,40,.1)"; mx.fillRect(0,0,sz,sz);
    { const sp=sun(), rl=mx.createLinearGradient(0,0,sz,0), k2=sp.x>m.sx?1:0; rl.addColorStop(k2,"rgba(255,190,110,.18)"); rl.addColorStop(1-k2,"rgba(20,12,8,.1)"); mx.fillStyle=rl; mx.fillRect(0,0,sz,sz); }   /* lit from the sun's side */
    if(!m.bg||(m.bgT=(m.bgT||0)-1)<=0){ m.bgT=8; const ip=toImg(m.sx,m.sy); m.bg=(ip&&ip[0]>=0&&ip[0]<=1&&ip[1]>=0&&ip[1]<=1&&sampleAt(ip[0],ip[1]))||[150,130,90]; }
    mx.fillStyle=rgb(m.bg,Math.min(.4,Math.max(0,(z-1.4)*.06))); mx.fillRect(0,0,sz,sz);                                           /* far off it melts into the air */
    if(SC.dim()){ mx.fillStyle="rgba(20,14,6,.14)"; mx.fillRect(0,0,sz,sz); } else { const tn=tint(); if(tn.a>0){ mx.globalAlpha=tn.a; mx.fillStyle=tn.c; mx.fillRect(0,0,sz,sz); mx.globalAlpha=1; } }
    if(dark){ mx.fillStyle="rgba(10,8,14,.28)"; mx.fillRect(0,0,sz,sz); }
    mx.globalCompositeOperation="source-over";
    const bl=z<.75? (.75-z)*22 : z>4? Math.min(1.2,(z-4)*.3) : 0;                                                                 /* too close for the lens to hold focus */
    const a=Math.min(1,(m.inn? u : 1-u)*6+(m.inn? 0 : 0), z>5.5? (zf-z)/1.5 : 1);
    ctx.save(); ctx.globalAlpha=Math.max(0,Math.min(1,a)); if(bl>.3) ctx.filter=`blur(${bl.toFixed(1)}px)`; ctx.drawImage(cmcv,0,0,sz,sz,m.sx-sz/2,m.sy-sz/2,sz,sz); ctx.restore(); ctx.filter="none";
    m.tr=Math.max(30,Math.min(300,sz*.35));
  }
  /* ---- a covey of northern bobwhite quail working along the edge of the brush: little round birds trotting in short bursts, pecking,
     a cock now and then stretching up to whistle "bob-WHITE!", until something spooks them and they scurry back into cover ---- */
  let quails=[], nextQuail=rnd(40,80);
  function startQuail(){ const n=5+Math.floor(Math.random()*5), x0=W*rnd(.3,.8), dir=Math.random()<.5?-1:1;
    for(let i=0;i<n;i++){ const sx=x0+rnd(-W*.05,W*.05), g=lawnMinG(sx)+rnd(2,16), p=toGround(sx,gnd().vy+g); quails.push({Xw:p.Xw,Dw:p.Dw,dir,male:i%2===0,st:"peck",t:rnd(0,1.5),dur:rnd(.6,1.6),ph:rnd(0,6),a:0,life:rnd(28,42),age:0,call:rnd(4,12),head:0}); } }
  function drawQuail(q,dt,dark){
    q.age+=dt; q.t+=dt;
    if(q.age>q.life&&q.st!=="flee"){ q.st="flee"; q.t=0; }
    if(q.st==="flee"){ const s0=toScreen(q.Xw,q.Dw), p=toGround(s0.x+q.dir*dt*30,s0.y-dt*28); q.Xw=p.Xw; q.Dw=p.Dw; q.ph+=dt*30; q.a-=dt*.9; if(q.a<=0){ q.gone=true; return; } }   /* scurrying up into the brush */
    else { q.a=Math.min(1,q.a+dt*.8);
      if(q.st==="run"){ const s0=toScreen(q.Xw,q.Dw), p=toGround(s0.x+q.dir*dt*22*(s0.g/300),s0.y+Math.sin(q.ph*.3)*dt*3); q.Xw=p.Xw; q.Dw=p.Dw; keepOnLawn(q); q.ph+=dt*26; q.head=0; }   /* quick little steps */
      else if(q.st==="peck"){ q.head=Math.max(0,Math.sin(q.t*9))*.9; }
      else if(q.st==="call"){ q.head=-.6; }
      if(q.t>q.dur){ q.t=0; const r=Math.random(); if(q.male&&q.age>q.call&&q.st!=="call"){ q.st="call"; q.dur=1.3; q.call=q.age+rnd(10,22); const s=toScreen(q.Xw,q.Dw); if(typeof natureSfx!=="undefined"&&natureSfx.bobwhite) natureSfx.bobwhite((s.x/W*2-1)*.8,Math.min(1,s.g/400)); }
        else if(r<.45){ q.st="run"; q.dur=rnd(.3,.9); if(Math.random()<.2) q.dir*=-1; } else { q.st="peck"; q.dur=rnd(.8,2); } } }
    const s=toScreen(q.Xw,q.Dw), k=s.g/300; if(k<.05) return;
    q.ct=(q.ct||0)-dt; if(q.ct<=0||!q.pal){ q.ct=1.5; const G=groundPal(s,dark), lit=dark?.5:.7; q.pal={G, body:mixv(mulv([150,98,58],lit),G.g,.12), dk:mulv([70,44,26],lit), light:mixv(mulv([210,170,120],lit),[255,210,150],.15), face:q.male? mulv([236,232,220],lit) : mulv([206,172,110],lit), stripe:mulv([34,24,18],lit)}; }
    const P=q.pal, x=ctx, bob=q.st==="run"? Math.abs(Math.sin(q.ph))*1.4*k : 0, d=q.dir, by=s.y-6*k-bob;
    x.save(); x.globalAlpha=Math.max(0,q.a);
    x.fillStyle=rgb(P.G.shadow,.5); x.beginPath(); x.ellipse(s.x,s.y,9*k,2.2*k,0,0,6.283); x.fill();                                 /* its shadow */
    if(q.st==="run"){ x.strokeStyle=rgb(P.dk); x.lineWidth=Math.max(.6,.9*k); for(const o of [0,Math.PI]){ const a=Math.sin(q.ph+o)*3*k; x.beginPath(); x.moveTo(s.x+a*.3,s.y-3*k); x.lineTo(s.x+a,s.y); x.stroke(); } }   /* scampering legs */
    { const g=x.createRadialGradient(s.x-d*2*k,by-3*k,k,s.x,by,9*k); g.addColorStop(0,rgb(P.light)); g.addColorStop(.5,rgb(P.body)); g.addColorStop(1,rgb(P.dk)); x.fillStyle=g;
      x.beginPath(); x.ellipse(s.x,by,8.5*k,5.6*k,d*-.08,0,6.283); x.fill(); }                                                     /* the round, chestnut-and-buff body */
    x.fillStyle=rgb(P.dk,.55); for(let i=0;i<5;i++){ const ox=(i-2)*2.6*k*d, oy=-1.5*k+((i*7)%3)*1.2*k; x.beginPath(); x.ellipse(s.x+ox-d*1.5*k,by+oy,1.4*k,.6*k,0,0,6.283); x.fill(); }   /* the scaled and streaked back */
    x.strokeStyle=rgb(mixv(P.light,[255,250,240],.3),.6); x.lineWidth=Math.max(.5,.6*k); for(let i=0;i<3;i++){ x.beginPath(); x.ellipse(s.x+d*2*k,by+2.2*k,4*k-i*.8*k,1.2*k,0,.2,2.9); x.stroke(); }   /* the barring on the breast */
    x.fillStyle=rgb(P.dk); x.beginPath(); x.moveTo(s.x-d*7.5*k,by-1*k); x.lineTo(s.x-d*11*k,by-2.5*k+bob*.3); x.lineTo(s.x-d*10*k,by+.8*k); x.closePath(); x.fill();   /* the short tail */
    const hx=s.x+d*(7.5+(q.st==="call"?1:0))*k, hy=by-(q.st==="call"? 7.5 : 3.5)*k+q.head*5*k;                                  /* the head: down to peck, stretched high to call */
    if(q.st==="call"){ x.strokeStyle=rgb(P.body); x.lineWidth=3.6*k; x.beginPath(); x.moveTo(s.x+d*5*k,by-2*k); x.lineTo(hx,hy+1.5*k); x.stroke(); }
    x.fillStyle=rgb(P.body); x.beginPath(); x.arc(hx,hy,3.3*k,0,6.283); x.fill();
    x.fillStyle=rgb(P.face); x.beginPath(); x.ellipse(hx+d*1*k,hy+1.4*k,1.8*k,1.1*k,0,0,6.283); x.fill();                           /* the white (or buff) throat */
    x.strokeStyle=rgb(P.face); x.lineWidth=Math.max(.5,.9*k); x.beginPath(); x.moveTo(hx+d*2.6*k,hy-.8*k); x.lineTo(hx-d*2*k,hy-.2*k); x.stroke();   /* the eye stripe */
    x.strokeStyle=rgb(P.stripe); x.lineWidth=Math.max(.4,.6*k); x.beginPath(); x.moveTo(hx+d*2.6*k,hy+.2*k); x.lineTo(hx-d*1.8*k,hy+.6*k); x.stroke();
    x.fillStyle=rgb(P.stripe); x.beginPath(); x.moveTo(hx+d*3*k,hy-.2*k); x.lineTo(hx+d*4.6*k,hy+.4*k); x.lineTo(hx+d*3*k,hy+1*k); x.fill();   /* the stubby bill */
    x.restore(); q.sx=s.x; q.sy=by; q.sr=Math.max(14,10*k);
  }
  /* ---- now and then a bluebird sallies out after a monarch: darting, twisting after it, the butterfly jinking away, until it gives up ---- */
  let bbChase=null, nextChase=rnd(35,70); const bccv=document.createElement("canvas"), bccx=bccv.getContext("2d");
  function drawChase(dt,dark){
    const F=H*.5, cx=W/2, cy=H*.52;
    nextChase-=dt; if(!bbChase&&nextChase<=0){ nextChase=rnd(60,130); const m=mons.find(m=>m.t>1.5&&m.t<m.life-8&&m.sx>W*.04&&m.sx<W*.96);
      if(m){ const z=m.z+.5, sx0=Math.max(-40,Math.min(W+40,m.sx-m.dir*W*.3)); bbChase={m,t:0,dur:rnd(6,9),P:[(sx0-cx)*z/F,(-50-cy)*z/F,z],V:[m.dir*.6,1.2,0],ph:0,lunge:0}; } }   /* drops in from above, on the butterfly's tail */
    if(!bbChase) return; const B=bbChase, m=B.m; B.t+=dt;
    const gone=!mons.includes(m), leave=B.t>B.dur||gone;
    const T= leave? [B.P[0]+(B.P[0]>0?1:-1)*3, B.P[1]-2, B.P[2]+3] : [m.pp? m.pp[0] : 0, m.pp? m.pp[1] : 0, m.pp? m.pp[2] : 3];
    const D=[T[0]-B.P[0],T[1]-B.P[1],T[2]-B.P[2]], dl=Math.hypot(...D)||1, spd=leave? 2.4 : 1.5+B.lunge*1.6;
    B.lunge=Math.max(0,B.lunge-dt*1.5); if(!leave&&dl<.5&&B.lunge<=0&&Math.random()<dt*2) B.lunge=1;                                     /* a quick lunge when it's close */
    for(let i=0;i<3;i++) B.V[i]+=(D[i]/dl*spd-B.V[i])*Math.min(1,dt*(leave?2:4.5));
    B.P=B.P.map((v,i)=>v+B.V[i]*dt);
    if(!leave&&dl<.22){ m.flee=1.2; m.sy+=rnd(-1,1)*60; m.tz=Math.max(1.6,m.z+rnd(-1.2,1.2)); B.V=B.V.map(v=>v*-.4+rnd(-.5,.5)); B.lunge=0; }   /* just misses: the monarch jinks away, the bird overshoots and has to turn */
    if(leave&&(B.P[2]>14||Math.abs(cx+B.P[0]*F/B.P[2]-W/2)>W*.8)){ bbChase=null; return; }
    B.ph+=dt*Math.PI*2*(B.lunge>0? 16 : 11);
    const cw=Math.ceil(W*.6), ch=Math.ceil(H*.6); if(bccv.width!==cw||bccv.height!==ch){ bccv.width=cw; bccv.height=ch; }
    const x=bccx; x.setTransform(1,0,0,1,0,0); x.clearRect(0,0,cw,ch); x.setTransform(.6,0,0,.6,0,0);
    const sp=sun(), sunL=(()=>{ const v=[(sp.x-cx)/F,(sp.y-cy)/F-.05,1], l=Math.hypot(...v); return v.map(c=>c/l); })();
    const vl=Math.hypot(B.V[0],B.V[1]*.5,B.V[2])||1, f=[B.V[0]/vl,B.V[1]*.5/vl,B.V[2]/vl];
    blueBird3D(x,B.P,f,B.ph,B.lunge<=0&&Math.sin(B.t*3)>.7,(X3,Y3,Z3)=>[cx+X3*F/Math.max(.05,Z3),cy+Y3*F/Math.max(.05,Z3)],.0105,sunL);
    const sx=cx+B.P[0]*F/B.P[2], sy=cy+B.P[1]*F/B.P[2], rad=.0105*30*F/B.P[2]+24, RX=Math.max(0,(sx-rad)*.6), RY=Math.max(0,(sy-rad)*.6), RW=rad*1.2;
    x.setTransform(1,0,0,1,0,0); x.globalCompositeOperation="source-atop";
    { const rl=x.createLinearGradient(RX,0,RX+RW,0), kk=sp.x>sx?1:0; rl.addColorStop(kk,"rgba(255,196,120,.22)"); rl.addColorStop(1-kk,"rgba(20,12,8,.1)"); x.fillStyle=rl; x.fillRect(RX,RY,RW,RW); }
    if(!B.skyC||(B.skyT=(B.skyT||0)-1)<=0){ B.skyT=8; const ip=toImg(sx,sy); B.skyC=(ip&&ip[0]>=0&&ip[0]<=1&&ip[1]>=0&&ip[1]<=1&&sampleAt(ip[0],ip[1]))||[170,150,110]; }
    x.fillStyle=rgb(B.skyC,Math.min(.4,Math.max(.03,(B.P[2]-2)*.05))); x.fillRect(RX,RY,RW,RW);
    if(dark){ x.fillStyle="rgba(10,8,14,.3)"; x.fillRect(RX,RY,RW,RW); }
    x.globalCompositeOperation="source-over";
    blitRegion(bccv,sx,sy,rad,.4,Math.min(1,B.t/.4));
    B.sx=sx; B.sy=sy;
  }
  function drawMonarchs(dt,dark){
    const F=H*.5, cx=W/2, cy=H*.52, g=gnd();
    nextMon-=dt; if(nextMon<=0&&mons.length<(MOBILE()?2:3)){ nextMon=rnd(12,28); const side=Math.random()<.5?-1:1;
      mons.push({t:0,life:rnd(22,40),sx:side<0? -30 : W+30,sy:g.vy+rnd(-30,90),z:rnd(2.2,6.5),dir:-side,ph:rnd(0,6),flapT:0,glide:0,ang:.4,tz:rnd(2,6),wy:rnd(0,6)}); }
    if(!mons.length) return;
    const x=ctx; x.save(); x.imageSmoothingEnabled=true; x.imageSmoothingQuality="high";                 /* straight onto the scene: no full-screen pass every frame */
    let zs=0;
    for(let i=mons.length-1;i>=0;i--){ const m=mons[i]; m.t+=dt;
      /* a lazy, wandering course: drifting across, rising and dipping, coming nearer and farther */
      const fl=(m.flee=Math.max(0,(m.flee||0)-dt))>0? 1+2.2*m.flee : 1; if(fl>1){ m.sy+=Math.sin(m.t*13)*90*dt*m.flee; m.ang=.35+Math.sin(m.t*Math.PI*2*8)*1.1; }   /* fleeing: faster, jinking */
      m.sx+=m.dir*(26+Math.sin(m.t*.7+m.ph)*14)*dt*(4/m.z)*fl; m.sy+=(Math.sin(m.t*1.1+m.wy)*22+Math.sin(m.t*2.9)*10)*dt; m.sy=Math.max(g.vy-70,Math.min(H*.92,m.sy));
      if(Math.random()<dt*.15) m.tz=rnd(1.6,6.5); m.z+=(m.tz-m.z)*dt*.25;
      if(m.t>m.life||m.sx<-60||m.sx>W+60){ mons.splice(i,1); continue; }
      /* flap a few beats, then sail with the wings held up in a shallow V */
      m.flapT-=dt; if(m.flapT<=0){ m.glide=m.glide? 0 : 1; m.flapT=m.glide? rnd(.5,1.4) : rnd(.6,1.5); }
      m.ang= m.glide? lerp(m.ang,.55,Math.min(1,dt*6)) : .35+Math.sin(m.t*Math.PI*2*5.2+m.ph)*1.05;
      const X=(m.sx-cx)*m.z/F, Y=(m.sy-cy)*m.z/F, Pn=[X,Y,m.z], Vn=m.pp? [X-m.pp[0],Y-m.pp[1],m.z-m.pp[2]] : [m.dir,0,0]; m.pp=Pn;
      if(Math.hypot(...Vn)>1e-7) m.V=m.V? m.V.map((v,j)=>lerp(v,Vn[j],.08)) : Vn;
      const a=Math.min(1,m.t/1)*Math.min(1,(m.life-m.t)/1.2); x.globalAlpha=Math.max(0,a);
      const sz=Math.ceil(Math.min(600,60*.0074*F/m.z+10)), mx=mncx; if(mncv.width<sz||mncv.height<sz){ mncv.width=mncv.height=Math.max(sz,mncv.width); }
      mx.setTransform(1,0,0,1,0,0); mx.clearRect(0,0,sz,sz); mx.globalCompositeOperation="source-over"; mx.imageSmoothingEnabled=true; mx.imageSmoothingQuality="high";
      monarch3D(mx,Pn,m.V||Vn,m.ang,(X3,Y3,Z3)=>{ const zz=Math.max(.05,Z3); return [cx+X3*F/zz-m.sx+sz/2,cy+Y3*F/zz-m.sy+sz/2]; });
      /* in the evening air: backlit and warm, hazing toward whatever is behind it the farther off it is */
      mx.globalCompositeOperation="source-atop"; mx.fillStyle="rgba(40,24,12,.1)"; mx.fillRect(0,0,sz,sz); mx.fillStyle="rgba(255,140,40,.1)"; mx.fillRect(0,0,sz,sz);
      if(!m.bg||(m.bgT=(m.bgT||0)-1)<=0){ m.bgT=8; const ip=toImg(m.sx,m.sy); m.bg=(ip&&ip[0]>=0&&ip[0]<=1&&ip[1]>=0&&ip[1]<=1&&sampleAt(ip[0],ip[1]))||[150,130,90]; }
      mx.fillStyle=rgb(m.bg,Math.min(.25,.03+(m.z-1.6)*.035)); mx.fillRect(0,0,sz,sz);
      if(SC.dim()){ mx.fillStyle="rgba(20,14,6,.14)"; mx.fillRect(0,0,sz,sz); } else { const tn=tint(); if(tn.a>0){ mx.globalAlpha=tn.a; mx.fillStyle=tn.c; mx.fillRect(0,0,sz,sz); mx.globalAlpha=1; } }
      if(dark){ mx.fillStyle="rgba(10,8,14,.28)"; mx.fillRect(0,0,sz,sz); }
      x.filter=m.z>4.5? "blur(.5px)" : "none"; x.drawImage(mncv,0,0,sz,sz,m.sx-sz/2,m.sy-sz/2,sz,sz); x.filter="none";
      zs+=m.z; }
    x.globalAlpha=1; x.restore();
  }
  /* ---- american woodcocks: plump, long-billed little birds that come out of the brush onto the lawn edge at dusk,
     doing their funny rocking walk, probing the ground with their bills, then scuttling off in a quick run ---- */
  const wcs=[]; let nextWc=25;
  function startWoodcocks(){ const n=2+Math.floor(Math.random()*2), sx0=rnd(W*.2,W*.85);
    for(let i=0;i<n;i++){ const sx=Math.max(W*.05,Math.min(W*.95,sx0+rnd(-80,80))), p=toGround(sx,gnd().vy+lawnMinG(sx)+rnd(2,10));
      wcs.push({Xw:p.Xw,Dw:p.Dw,yaw:rnd(0,6.28),ph:rnd(0,6),state:"wait",t:-i*rnd(.6,1.8),life:rnd(30,50),alpha:0,head:0,probe:0,turn:0}); } }
  function wcTarget(w,far){ const s=toScreen(w.Xw,w.Dw), sx=Math.max(W*.04,Math.min(W*.96,s.x+rnd(-1,1)*(far?110:50))), g=lawnMinG(sx)+rnd(4,far?60:30), p=toGround(sx,gnd().vy+g); w.tX=p.Xw; w.tD=p.Dw; }
  function woodcockParts(w,P){
    const yaw=w.yaw, far=z=>z*Math.cos(yaw)>0, parts=[], run=w.state==="run", walk=w.state==="walk"||run;
    const q=w.ph, rock=w.state==="walk"? Math.sin(q*.5)*.9 : 0, bob=run? Math.abs(Math.sin(q))*.3 : 0;   /* the woodcock's slow back-and-forth rocking as it walks */
    const B=(x,y,z,r)=>[x+rock,y+bob,z,r];
    const back=rgb(P.back), body=rgb(P.body), buff=rgb(P.buff), dk=rgb(P.dark), leg=rgb(P.leg);
    for(const [z,ph] of [[-.9,0],[.9,Math.PI]]){ const sw=walk?Math.sin(q+ph)*(run?.6:.35):0, lift=walk?Math.max(0,-Math.cos(q+ph))*.6:0;
      const ch=legChain(.2+rock,2.4+bob,z,.45,[[1.3,.2+sw,.35],[1.2,-.3+sw-lift,.3]]); parts.push({p:ch,c:far(z)?rgb(mulv(P.leg,.75)):leg,bias:.02}); }
    parts.push({p:[B(-4.4,4.2,0,1.6),B(-2,4.4,0,2.8),B(.8,4.4,0,3.1),B(2.6,4.6,0,2.5)],c:body,sh:[rgb(mulv(P.body,.6)),rgb(mixv(P.body,[255,200,140],.25))]});   /* plump round body */
    parts.push({p:[B(-3.6,5.8,0,1.5),B(-.6,6.4,0,2.1),B(1.8,6,0,1.6)],c:back,bias:-.05});                       /* mottled dark back */
    parts.push({p:[B(-.4,2.6,0,1.9),B(2,3.4,0,1.8)],c:buff,bias:-.03});                                          /* buffy breast */
    parts.push({p:[B(-5.4,4.4,0,1.1),B(-6.6,4.1,0,.7)],c:back});                                                  /* stubby tail */
    for(const sd of [-1,1]) for(const [x0,y0] of [[-2.6,6.6],[-.6,7],[1.2,6.6]]) parts.push({p:[B(x0,y0,sd*1.2,.42)],c:rgb(mulv(P.buff,.95)),bias:-.12});   /* pale back stripes */
    const hp=w.head, hy=lerp(6.2,4.4,hp), hx=lerp(3.9,4.5,hp);
    parts.push({p:[B(hx,hy,0,1.85)],c:body,sh:null});                                                             /* the big round head */
    for(const [dx,dy] of [[-.9,1.5],[-.2,1.7],[.5,1.5]]) parts.push({p:[B(hx+dx,hy+dy,0,.5)],c:dk,bias:-.15});    /* dark crown bars */
    for(const sd of [-1,1]) parts.push({p:[B(hx-.1,hy+.5,sd*1.25,.42)],c:"rgba(10,6,4,.95)",bias:-.3});           /* eyes set high and far back */
    const bl=4.6, ba=lerp(-.35,-1.15,hp)-w.probe*.25, bx=hx+1.5, by=hy-.3;
    parts.push({p:[B(bx,by,0,.42),B(bx+Math.cos(ba)*bl,by+Math.sin(ba)*bl,0,.16)],c:rgb(P.bill),bias:-.05});        /* the long straight bill */
    return parts;
  }
  function stepWoodcock(w,dt){
    w.t+=dt; if(w.t<0) return;
    if(w.state==="wait"){ w.state="walk"; w.t=0; wcTarget(w); }
    w.alpha= w.leaving? Math.max(0,w.alpha-dt*1.2) : Math.min(1,w.alpha+dt*1.2);
    if(w.leaving&&w.alpha<=0){ w.gone=true; return; }
    if(w.t>w.life&&!w.leaving&&w.state!=="run"){ w.leaving=true; w.state="walk"; const s=toScreen(w.Xw,w.Dw), p=toGround(s.x+rnd(-20,20),gnd().vy+lawnMinG(s.x)-4); w.tX=p.Xw; w.tD=p.Dw; }   /* back into the cover */
    if(w.state==="walk"||w.state==="run"){
      const sp=w.state==="run"? .5 : .1, dX=w.tX-w.Xw, dD=w.tD-w.Dw, dist=Math.hypot(dX,dD*.25)||1e-6;
      if(dist<=sp*dt){ w.Xw=w.tX; w.Dw=w.tD; } else { w.Xw+=dX/dist*sp*dt; w.Dw+=dD/dist*sp*dt*4*(Math.abs(dD)>1e-6?1:0); }
      const want=Math.atan2(trueZ(w.tD)-trueZ(w.Dw),w.tX-w.Xw); if(dist>.01) w.yaw=angTo(w.yaw,want,dt*(w.state==="run"?8:3));
      w.ph+=dt*(w.state==="run"? 22 : 6.5); w.head+=((w.state==="run"?.1:.2)-w.head)*Math.min(1,dt*6); w.probe=0;
      if(dist<.01&&!w.leaving){ const r=Math.random(); if(r<.55){ w.state="probe"; w.st=rnd(2,4.5); w.t2=0; } else if(r<.75){ w.state="pause"; w.st=rnd(.8,2); w.t2=0; } else if(r<.88){ w.state="run"; wcTarget(w,true); } else wcTarget(w); }
      if(dist<.01&&w.state==="run"){ w.state="pause"; w.st=rnd(.6,1.4); w.t2=0; }
    } else { w.t2+=dt;
      if(w.state==="probe"){ w.head+=(.95-w.head)*Math.min(1,dt*5); w.probe=Math.max(0,Math.sin(w.t2*7))*(Math.sin(w.t2*1.3)>-.2?1:0); }   /* bill down, jabbing into the soft ground for worms */
      else { w.head+=(0-w.head)*Math.min(1,dt*5); w.probe=0; w.ph+=dt*2; }
      if(w.t2>w.st){ w.state="walk"; wcTarget(w); } }
    keepOnLawn(w);
  }
  function drawWoodcock(w,dt,dark){
    stepWoodcock(w,dt); if(w.gone||w.t<0) return;
    const s=toScreen(w.Xw,w.Dw), k=.16*s.g/26*1.35;
    w.ct=(w.ct||0)-dt; if(w.ct<=0||!w.pal){ w.ct=1.5; const G=groundPal(s,dark), lit=dark?.42:.6;
      w.pal={...G, body:mulv([156,116,74],lit), back:mulv([92,66,44],lit), buff:mulv([200,164,114],lit), dark:mulv([40,28,20],lit), leg:mulv([186,140,120],lit), bill:mulv([150,120,96],lit)}; }
    if(!w.blades) w.blades=Array.from({length:7},()=>({ox:rnd(-12,12),h:rnd(2,4),lean:rnd(-.5,.5),c:Math.random()}));
    critterBlit(null,null,w,s,k,w.pal,()=>woodcockParts(w,w.pal),w.yaw,22,36,9,w.blades,w.alpha);
  }
  /* ---- an eastern box turtle plods across the grass close to you: high domed shell, dark with yellow-orange blotches; it stops now and then, and pulls in when a dog comes near ---- */
  let turtle=null, nextTurtle=75;
  function startTurtle(){ const dir=Math.random()<.5?1:-1, b=foxBounds(), g=rnd(Math.max(b.gmin+30,b.gmax-80),b.gmax-12);
    turtle={dir,g,sx:dir>0? W*.04 : W*.96,ph:0,state:"walk",st:0,dur:rnd(5,9),alpha:0,hide:0,hd:0,yaw:dir>0?0:Math.PI,spots:Array.from({length:14},()=>[rnd(-.95,.95),rnd(.15,.95),rnd(.35,.6)])}; const p=toGround(turtle.sx,gnd().vy+g); turtle.Xw=p.Xw; turtle.Dw=p.Dw; }
  function turtleParts(tu,P){
    const parts=[], yaw=tu.yaw, far=z=>z*Math.cos(yaw)>0, q=tu.ph, out=1-tu.hide, sw=k=>tu.state==="walk"? Math.sin(q+k)*.9 : 0;
    for(const [lx,lz,k,hind] of [[3.6,1,0,0],[3.6,-1,Math.PI,0],[-3.4,1,Math.PI,1],[-3.4,-1,0,1]]){ const s2=sw(k), lift=tu.state==="walk"? Math.max(0,Math.cos(q+k))*.5 : 0;   /* stubby legs, diagonal pairs together */
      parts.push({p:[[lx*.9,1.6,lz*2.9,1.15],[lx+s2*out+(hind?-.6:.8)*out,.45+lift,lz*(2.9+1.1*out),.95*out+.3]],c:rgb(far(lz)?mulv(P.skin,.8):P.skin)}); }
    parts.push({p:[[-5.6,1.3,0,.55],[-6.6,1.0,0,.3]],c:rgb(P.skin)});                                                  /* a stub of tail */
    const hx=4.8+2.4*out, hy=1.9+.5*out+tu.hd*.4;
    parts.push({p:[[4.2,1.9,0,1.15],[hx,hy,0,1.15]],c:rgb(P.skin)},{p:[[hx+.2,hy+.1,0,1.3],[hx+1.2,hy-.1,0,.95]],c:rgb(P.head),bias:-.05});   /* neck and head, out or tucked */
    for(const sd of [-1,1]) parts.push({p:[[hx+.7,hy+.4,sd*.85,.3]],c:"rgba(170,48,24,.95)",bias:-.3});              /* the red eyes */
    parts.push({p:[[-5.4,1.4,0,1],[-2.8,1.3,0,1.05],[0,1.3,0,1.05],[2.8,1.3,0,1.05],[5.2,1.4,0,1]],c:rgb(P.rim),bias:.6});          /* the shell's lower rim */
    for(const sd of [-1,1]) parts.push({p:[[-4.4,1.3,sd*2.6,1.1],[0,1.25,sd*3.4,1.15],[4.2,1.3,sd*2.6,1.1]],c:rgb(far(sd)?mulv(P.rim,.8):P.rim),bias:.5});
    parts.push({p:[[-3.0,2.9,0,3.3],[0,3.4,0,3.6],[3.0,2.9,0,3.2]],c:rgb(P.shell),sh:[rgb(mulv(P.shell,.6)),rgb(mixv(P.shell,[255,210,150],.25))]});   /* the high dome */
    for(const [u,v,r] of tu.spots){ const a=u*1.4, e=v*1.15, R0=3.5; parts.push({p:[[Math.cos(a)*Math.cos(e)*R0*1.05,3.1+Math.sin(e)*R0*.98,Math.sin(a)*Math.cos(e)*R0*.95,r]],c:rgb(P.spot),bias:-.9}); }   /* yellow-orange blotches */
    return parts;
  }
  function drawTurtle(dt,dark){
    if(!turtle){ nextTurtle-=dt; if(nextTurtle<=0) startTurtle(); return; }
    const tu=turtle; tu.st+=dt;
    const dogs=[dog,lab].filter(d=>d&&!d.gone&&!d.hidden); for(const d of dogs){ const s0=toScreen(d.Xw,d.Dw); if(Math.hypot(s0.x-tu.sx,(s0.y-toScreen(tu.Xw,tu.Dw).y)*1.6)<W*.16){ tu.scared=3; } }
    tu.scared=Math.max(0,(tu.scared||0)-dt); const wantHide=tu.scared>0? 1 : tu.state==="rest"? .35 : 0; tu.hide+=(wantHide-tu.hide)*Math.min(1,dt*(wantHide>tu.hide?7:1.2));   /* snaps in fast, eases back out */
    if(tu.scared>0){ tu.state="rest"; tu.st=0; tu.dur=rnd(2,4); }
    if(tu.state==="walk"){ tu.ph+=dt*2.6; tu.sx+=tu.dir*dt*W*.016; tu.hd=Math.sin(tu.ph*.5)*.3; if(tu.st>tu.dur){ tu.state="rest"; tu.st=0; tu.dur=rnd(2,5); } }
    else if(tu.st>tu.dur&&tu.scared<=0){ tu.state="walk"; tu.st=0; tu.dur=rnd(5,9); }
    const p=toGround(tu.sx,gnd().vy+tu.g); tu.Xw=p.Xw; tu.Dw=p.Dw;
    const edge=Math.min(tu.sx-W*.02,W*.98-tu.sx); tu.alpha=Math.max(0,Math.min(1,edge/(W*.04)));
    if((tu.dir>0&&tu.sx>W*.98)||(tu.dir<0&&tu.sx<W*.02)){ turtle=null; nextTurtle=rnd(160,300); return; }
    const s=toScreen(tu.Xw,tu.Dw), k=.16*s.g/26*1.9;
    tu.ct=(tu.ct||0)-dt; if(tu.ct<=0||!tu.pal){ tu.ct=1.5; const G=groundPal(s,dark), lit=dark?.42:.6;
      tu.pal={...G, shell:mulv([86,58,32],lit), spot:mulv([214,150,52],lit), rim:mulv([66,46,28],lit), skin:mulv([96,70,46],lit), head:mulv([112,80,44],lit)}; }
    if(!tu.blades) tu.blades=Array.from({length:12},()=>({ox:rnd(-12,12),h:rnd(2,4.5),lean:rnd(-.5,.5),c:Math.random()}));
    critterBlit(null,null,tu,s,k,tu.pal,()=>turtleParts(tu,tu.pal),tu.yaw,18,32,10,tu.blades,tu.alpha,.4);
  }
  /* ---- a pair of blue jays: one chasing the other in tight loops across the field, calling "jeer! jeer!", crests up ---- */
  let jays=null, nextJays=55; const jcv=document.createElement("canvas"), jcx=jcv.getContext("2d");
  function startJays(){ const dir=Math.random()<.5?1:-1; jays={t:0,dir,dur:rnd(8,10),z0:rnd(1.25,1.5),y0:rnd(.28,.45),call:rnd(.3,1)}; }
  function jay3D(x,P,V,flap,glide,proj){
    const nrm=v=>{ const l=Math.hypot(v[0],v[1],v[2])||1; return [v[0]/l,v[1]/l,v[2]/l]; }, crs=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
    const f=nrm([V[0],V[1]*.5,V[2]*.6]), r=nrm(crs(f,[0,-1,0])), u=crs(r,f), K=1.25;
    const pt=(a,b,c)=>proj(P[0]+(f[0]*a+r[0]*b+u[0]*c)*K, P[1]+(f[1]*a+r[1]*b+u[1]*c)*K, P[2]+(f[2]*a+r[2]*b+u[2]*c)*K);
    const under=P[1]<-.05&&-(P[0]*u[0]+P[1]*u[1]+P[2]*u[2])<0;                                                                 /* low over the field: you see their blue backs */
    const BL=[38,92,198], BL2=[86,146,232], DK=[24,30,46], UND=[150,170,204], WH=[236,234,228], GR=[120,148,196];
    const fl=glide? .2 : Math.sin(flap)*.9+.1, S=.15;
    const poly=(pts,col)=>{ x.fillStyle=rgb(col); x.beginPath(); x.moveTo(pts[0][0],pts[0][1]); for(const q of pts) x.lineTo(q[0],q[1]); x.closePath(); x.fill(); };
    const wing=sd=>{ const h=c=>c*fl, sh=pt(.022,sd*.014,0), wr=pt(.02,sd*S*.5,S*.3*fl), tp=pt(-.02,sd*S*.95,S*.6*fl), tr=pt(-.06,sd*S*.72,S*.34*fl), rt=pt(-.045,sd*.014,0);
      x.beginPath(); x.moveTo(sh[0],sh[1]); x.quadraticCurveTo(wr[0],wr[1],tp[0],tp[1]); x.quadraticCurveTo(tr[0],tr[1],rt[0],rt[1]); x.closePath(); { const g=x.createLinearGradient(sh[0],sh[1],tp[0],tp[1]); g.addColorStop(0,rgb(under? UND : (fl>0? BL2 : BL))); g.addColorStop(1,rgb(under? mulv(UND,.8) : mulv(BL,.7))); x.fillStyle=g; } x.fill();
      if(!under){ for(const k of [.4,.56,.72]){ const a=pt(-.008-k*.035,sd*S*k*.9,S*k*.55*fl), b=pt(-.034-k*.03,sd*S*k*.82,S*k*.5*fl); x.strokeStyle=rgb(DK); x.lineWidth=.8; x.beginPath(); x.moveTo(a[0],a[1]); x.lineTo(b[0],b[1]); x.stroke(); }   /* black barring */
        poly([pt(-.05,sd*S*.25,S*.15*fl),pt(-.058,sd*S*.62,S*.32*fl),pt(-.046,sd*S*.62,S*.32*fl),pt(-.04,sd*S*.25,S*.15*fl)],WH); }   /* the white wing bar */
      poly([tp,pt(-.035,sd*S*.84,S*.5*fl),pt(-.012,sd*S*.82,S*.5*fl)],under? GR : DK); };
    const dl=(P[0]-r[0]*.07)**2+(P[1]-r[1]*.07)**2+(P[2]-r[2]*.07)**2, dr=(P[0]+r[0]*.07)**2+(P[1]+r[1]*.07)**2+(P[2]+r[2]*.07)**2;
    wing(dl>dr? -1 : 1);
    const t1=pt(-.06,-.016,0), t2=pt(-.06,.016,0), t3=pt(-.13,.02,-.002), t4=pt(-.13,-.02,-.002);                                   /* the long, rounded tail, barred, with white corners */
    poly([t1,t2,t3,t4],under? GR : BL); const c1=pt(-.12,-.02,-.002), c2=pt(-.13,-.006,-.002), c3=pt(-.12,.02,-.002), c4=pt(-.13,.006,-.002); x.strokeStyle=rgb(WH); x.lineWidth=1.2; x.beginPath(); x.moveTo(c1[0],c1[1]); x.lineTo(c2[0],c2[1]); x.moveTo(c3[0],c3[1]); x.lineTo(c4[0],c4[1]); x.stroke();
    const tail=pt(-.06,0,0), mid=pt(-.01,0,0), head=pt(.05,0,.008), w0=Math.max(.8,Math.hypot(...[0,1].map(i=>pt(-.01,.022,0)[i]-mid[i])),Math.hypot(...[0,1].map(i=>pt(-.01,0,.02)[i]-mid[i])));
    const ang=Math.atan2(head[1]-tail[1],head[0]-tail[0]), len=Math.hypot(head[0]-tail[0],head[1]-tail[1]);
    x.fillStyle=rgb(under? WH : BL); x.beginPath(); x.ellipse(mid[0],mid[1],Math.max(w0,len*.45),w0,ang,0,6.283); x.fill();
    if(!under){ x.fillStyle=rgb(BL2); x.beginPath(); x.ellipse(mid[0],mid[1],Math.max(w0*.8,len*.34),w0*.6,ang,0,6.283); x.fill(); }
    x.fillStyle=rgb(under? WH : BL); x.beginPath(); x.arc(head[0],head[1],w0*.85,0,6.283); x.fill();
    const nk=pt(.032,0,.0), n1=pt(.035,-.02,0), n2=pt(.035,.02,0); x.strokeStyle=rgb(DK); x.lineWidth=Math.max(.8,w0*.35); x.beginPath(); x.moveTo(n1[0],n1[1]); x.quadraticCurveTo(nk[0],nk[1],n2[0],n2[1]); x.stroke();   /* the black necklace */
    const cr=pt(.03,0,.04), c0=pt(.06,0,.014), cb=pt(.04,0,.012); poly([c0,cr,cb],BL);                                         /* the crest, raised */
    const bk=pt(.075,0,.004); x.strokeStyle=rgb(DK); x.lineWidth=Math.max(.7,w0*.3); x.beginPath(); x.moveTo(head[0],head[1]); x.lineTo(bk[0],bk[1]); x.stroke();
    wing(dl>dr? 1 : -1);
  }
  /* a blue jay built like the pheasant: a solid shaded body, real wing and tail feathering, white face and the black necklace, crest raised */
  function jayBird(x,P,f,flap,glide,proj,Kw){
    const crs=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]], nrm=v=>{ const l=Math.hypot(v[0],v[1],v[2])||1; return [v[0]/l,v[1]/l,v[2]/l]; };
    const r=nrm(crs(f,[0,-1,0])), u=crs(r,f);
    const W3=(a,b,c)=>[P[0]+(f[0]*a+r[0]*b+u[0]*c)*Kw, P[1]+(f[1]*a+r[1]*b+u[1]*c)*Kw, P[2]+(f[2]*a+r[2]*b+u[2]*c)*Kw];
    const pt=(a,b,c)=>{ const w=W3(a,b,c); return proj(w[0],w[1],w[2]); };
    const sc=a=>{ const w=W3(a,0,0), p0=proj(w[0],w[1],w[2]), p1=proj(w[0]+Kw,w[1],w[2]); return Math.hypot(p1[0]-p0[0],p1[1]-p0[1]); };
    const under=P[1]<0&&-(P[0]*u[0]+P[1]*u[1]+P[2]*u[2])<0;                                              /* low over the field you look down on their blue backs */
    const smooth=(pts,col)=>{ x.fillStyle=col; x.beginPath(); const n=pts.length, m=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2]; let q=m(pts[n-1],pts[0]); x.moveTo(q[0],q[1]); for(let i=0;i<n;i++){ const a=pts[i], b=pts[(i+1)%n], mm=m(a,b); x.quadraticCurveTo(a[0],a[1],mm[0],mm[1]); } x.closePath(); x.fill(); };
    const line=(a,b,col,w)=>{ x.strokeStyle=col; x.lineWidth=w; x.beginPath(); x.moveTo(a[0],a[1]); x.lineTo(b[0],b[1]); x.stroke(); };
    const BLU=[44,96,204], BLU2=[84,146,236], DEEP=[26,54,140], BACK=[84,108,184], BLK=[18,20,30], WH=[238,238,236], UGRY=[206,210,218], BELLY=[226,226,228], CHEST=[200,200,208];
    const lw=k=>Math.max(.5,sc(0)*k);
    x.lineCap="round"; x.lineJoin="round";
    const wing=(sd,fl)=>{ const h=k=>fl*k, bend=Math.abs(fl)*.4;
      const S=pt(2.6,sd*1.8,.6), Wr=pt(1.6,sd*7.6,h(5)+bend), Tp=pt(-2.8,sd*16,h(10)), T2=pt(-6,sd*13.5,h(8.4)), Tr=pt(-6.6,sd*7.5,h(4.6)), R0=pt(-4.4,sd*1.8,.4);
      if(under){ const g=x.createLinearGradient(S[0],S[1],Tp[0],Tp[1]); g.addColorStop(0,rgb(UGRY)); g.addColorStop(1,rgb(mulv(UGRY,.82))); smooth([S,Wr,pt(-.4,sd*12.5,h(7.8)),Tp,T2,Tr,R0],g);
        const e0=pt(-6.4,sd*7.5,h(4.6)), e1=pt(-5.8,sd*13.6,h(8.4)); line(e0,e1,rgb([120,126,140],.6),lw(.7)); return; }   /* pale grey underwing with a darker trailing edge */
      const g=x.createLinearGradient(S[0],S[1],Tp[0],Tp[1]); g.addColorStop(0,rgb(BLU2)); g.addColorStop(.5,rgb(BLU)); g.addColorStop(1,rgb(DEEP)); smooth([S,Wr,pt(-.4,sd*12.5,h(7.8)),Tp,T2,Tr,R0],g);
      for(let i=0;i<6;i++){ const a0=pt(-1-i*.6,sd*(8+i*.9),h(5.6+i*.6)), a1=pt(-3-i*.45,sd*(11.8+i*.75),h(7.6+i*.4)); line(a0,a1,rgb(BLK,.55),lw(.32)); }   /* black barring across the blue */
      const wb0=pt(-5.6,sd*3,h(1.6)), wb1=pt(-6.2,sd*7.4,h(4.4)), wb2=pt(-5.2,sd*7.6,h(4.5)), wb3=pt(-4.6,sd*3,h(1.6)); smooth([wb0,wb1,wb2,wb3],rgb(WH,.9));   /* the white wing bar along the trailing edge */
      line(pt(-2.6,sd*14.8,h(9.4)),pt(-5.4,sd*13.4,h(8.4)),rgb(BLK,.7),lw(.5)); };   /* dark primary tips */
    const dl=(P[0]-r[0]*.05)**2+(P[1]-r[1]*.05)**2+(P[2]-r[2]*.05)**2, dr=(P[0]+r[0]*.05)**2+(P[1]+r[1]*.05)**2+(P[2]+r[2]*.05)**2, farS=dl>dr? -1 : 1;
    const fl=glide? .14 : Math.sin(flap)*.95+.06;
    wing(farS,fl);
    /* the long, rounded tail: blue barred with black, white corners */
    const t0=pt(-4.4,-1.8,0), t1=pt(-4.4,1.8,0), t2=pt(-14,3.3,-.4), t3=pt(-15,0,-.5), t4=pt(-14,-3.3,-.4);
    { const tm=pt(-4.4,0,.3), te=pt(-14.6,0,-.5); x.strokeStyle=rgb(under? [150,166,196] : BLU); x.lineWidth=Math.max(1,Math.hypot(...[0,1].map(i=>pt(-4.4,0,1.5)[i]-tm[i]))); x.beginPath(); x.moveTo(tm[0],tm[1]); x.lineTo(te[0],te[1]); x.stroke(); }   /* the tail has some depth edge-on */
    smooth([t0,t4,t3,t2,t1],rgb(under? [150,166,196] : BLU));
    for(let a=-6.6;a>-14;a-=1.5){ const w=1.8+(a+4.4)/-10*1.4; line(pt(a,-w,-.2),pt(a,w,-.2),rgb(BLK,under?.3:.5),lw(.28)); }
    for(const sd of [-1,1]){ const c=pt(-14,sd*2.8,-.4); x.fillStyle=rgb(WH); x.beginPath(); x.arc(c[0],c[1],Math.max(.6,sc(-15)*.75),0,6.283); x.fill(); }
    /* body: one smooth silhouette, shaded */
    const body=new Path2D(); for(let a=-4.8;a<=4.4;a+=.5){ const rr=2.7*Math.sqrt(Math.max(.2,1-((a+.2)/5)**2)), q=pt(a,0,.3); body.moveTo(q[0]+Math.max(.6,sc(a)*rr),q[1]); body.arc(q[0],q[1],Math.max(.6,sc(a)*rr),0,6.283); }
    x.fillStyle=rgb(under? BELLY : BACK); x.fill(body);
    x.save(); x.clip(body);
    { const tp=pt(0,0,3.2), bt=pt(0,0,-2.6), g=x.createLinearGradient(tp[0],tp[1],bt[0],bt[1]); g.addColorStop(0,"rgba(255,232,200,.3)"); g.addColorStop(.5,"rgba(255,220,180,0)"); g.addColorStop(1,"rgba(30,30,50,.35)"); x.fillStyle=g; x.fillRect(0,0,x.canvas.width/.6,x.canvas.height/.6); }
    if(under){ const c=pt(3,0,-.6), rr=Math.max(1,sc(3)*2.4), g=x.createRadialGradient(c[0],c[1],0,c[0],c[1],rr); g.addColorStop(0,rgb(CHEST,.7)); g.addColorStop(1,rgb(CHEST,0)); x.fillStyle=g; x.fillRect(c[0]-rr,c[1]-rr,rr*2,rr*2); }
    x.restore();
    /* head: blue crown and crest, white face, black necklace and eye line */
    const hd=pt(5.6,0,1.2), rH=Math.max(.8,sc(5.6)*2.1);
    { const g=x.createRadialGradient(hd[0]-rH*.3,hd[1]-rH*.3,0,hd[0],hd[1],rH); g.addColorStop(0,rgb(under? WH : BLU2)); g.addColorStop(1,rgb(under? mulv(WH,.86) : BLU)); x.fillStyle=g; x.beginPath(); x.arc(hd[0],hd[1],rH,0,6.283); x.fill(); }
    const crest=[pt(6.4,0,2.8),pt(3.2,0,5.2),pt(4.4,0,2.4)]; smooth([...crest,pt(5.8,0,2)],rgb(BLU));
    for(const sd of [-1,1]){ const fc=pt(6.6,sd*1.4,.6); x.fillStyle=rgb(WH); x.beginPath(); x.ellipse(fc[0],fc[1],Math.max(.6,sc(6)*1.1),Math.max(.6,sc(6)*.85),0,0,6.283); x.fill(); }   /* white cheeks */
    { const n0=pt(4,-2,0), n1=pt(4,2,0), nm=pt(4.3,0,-1.8); x.strokeStyle=rgb(BLK); x.lineWidth=lw(.55); x.beginPath(); x.moveTo(n0[0],n0[1]); x.quadraticCurveTo(nm[0],nm[1],n1[0],n1[1]); x.stroke(); }   /* the black necklace */
    for(const sd of [-1,1]) line(pt(7.6,sd*1.1,1.6),pt(5.2,sd*1.9,.6),rgb(BLK,.85),lw(.35));
    line(hd,pt(9,0,.9),rgb([30,30,34]),lw(.55));                                                                               /* the stout black bill */
    wing(-farS,fl);
  }
  function drawJays(dt,dark){
    nextJays-=dt; if(!jays&&nextJays<=0){ if(stageBusy()) nextJays=rnd(12,25); else startJays(); } if(!jays) return;
    const J=jays; J.t+=dt; const T=J.t, u=T/J.dur, F=H*.5, cx=W/2, cy=H*.52;
    if(u>=1){ jays=null; nextJays=rnd(150,280); return; }
    const cw=Math.ceil(W*.6), ch=Math.ceil(H*.6); if(jcv.width!==cw||jcv.height!==ch){ jcv.width=cw; jcv.height=ch; }
    const x=jcx; x.setTransform(1,0,0,1,0,0); x.clearRect(0,0,cw,ch); x.setTransform(.6,0,0,.6,0,0);
    const z=J.z0-Math.sin(u*Math.PI)*.5, sxC=lerp(J.dir>0? -W*.12 : W*1.12, J.dir>0? W*1.12 : -W*.12, u), syC=gnd().vy+(H-gnd().vy)*J.y0-Math.sin(u*Math.PI*2)*H*.04;   /* the pair crosses, swinging nearer in the middle */
    const Xc=(sxC-cx)*z/F, Yc=(syC-cy)*z/F; let zs=0, n=0, ax=0, ay=0;
    for(let i=0;i<2;i++){ const th=T*2.4-i*1.1, rad=.32+.08*Math.sin(T*.9+i);                                              /* loops: the second bird a beat behind the first, chasing */
      const Pn=[Xc+Math.cos(th)*rad, Yc+Math.sin(th)*rad*.55-Math.abs(Math.sin(T*3+i))*.04, Math.max(.8,z+Math.sin(th)*.14)], b=J["b"+i]||(J["b"+i]={});
      const V=b.pp? [Pn[0]-b.pp[0],Pn[1]-b.pp[1],Pn[2]-b.pp[2]] : [J.dir,0,0]; b.pp=Pn; if(Math.hypot(...V)>1e-6) b.V=b.V? b.V.map((v,k)=>lerp(v,V[k],.3)) : V;
      const glide=Math.sin(T*2.1+i*2)>.6, flap=T*(13+i)+i;
      { const v0=b.V||V, ln=Math.hypot(v0[0],v0[1]*.5,v0[2]*.6)||1; jayBird(x,Pn,[v0[0]/ln,v0[1]*.5/ln,v0[2]*.6/ln],flap,glide,(X3,Y3,Z3)=>[cx+X3*F/Math.max(.05,Z3),cy+Y3*F/Math.max(.05,Z3)],.011); }
      zs+=Pn[2]; n++; ax+=cx+Pn[0]*F/Pn[2]; ay+=cy+Pn[1]*F/Pn[2]; }
    zs/=n; ax/=n; ay/=n;
    J.call-=dt; if(J.call<=0){ J.call=rnd(1.1,2.4); natureSfx.jay&&natureSfx.jay((ax/W*2-1)*.9); }
    const RR=((.5+.4)*F/Math.max(.6,zs)+40)*.6, RX=Math.max(0,ax*.6-RR), RY=Math.max(0,ay*.6-RR), RW=RR*2, RH=RR*2;   /* the light and air only where the bird is */
    x.setTransform(1,0,0,1,0,0); x.globalCompositeOperation="source-atop";
    x.fillStyle="rgba(40,26,18,.26)"; x.fillRect(RX,RY,RW,RH); x.fillStyle="rgba(255,168,84,.14)"; x.fillRect(RX,RY,RW,RH);            /* in the warm evening light */
    { const sp=sun(), rl=x.createLinearGradient(ax*.6-60,0,ax*.6+60,0), k=sp.x>ax?1:0; rl.addColorStop(k,"rgba(255,196,120,.3)"); rl.addColorStop(1-k,"rgba(20,12,6,.15)"); x.fillStyle=rl; x.fillRect(RX,RY,RW,RH); }   /* rim light from the sun's side */
    if(!J.skyC||(J.skyT=(J.skyT||0)-1)<=0){ J.skyT=6; const ip=toImg(ax,ay); J.skyC=(ip&&ip[0]>=0&&ip[0]<=1&&ip[1]>=0&&ip[1]<=1&&sampleAt(ip[0],ip[1]))||[200,170,130]; }
    x.fillStyle=rgb(J.skyC,Math.min(.45,.04+(zs-1.2)/10)); x.fillRect(RX,RY,RW,RH);                                                   /* and the air between */
    if(SC.dim()){ x.fillStyle="rgba(20,14,6,.18)"; x.fillRect(RX,RY,RW,RH); } else { const tn=tint(); if(tn.a>0){ x.globalAlpha=tn.a; x.fillStyle=tn.c; x.fillRect(RX,RY,RW,RH); x.globalAlpha=1; } }
    if(dark){ x.fillStyle="rgba(10,8,14,.3)"; x.fillRect(RX,RY,RW,RH); }
    x.globalCompositeOperation="source-over";
    blitRegion(jcv,ax,ay,(.5+.4)*F/Math.max(.6,zs)+40,.5+Math.max(0,.95-zs)*3,Math.min(1,T/.4,(J.dur-T)/.4));
  }
  /* ---- a rooster pheasant explodes out of the grass right in front of you: wings whirring, copper and green and a long barred tail, crowing, then sailing away low over the field ---- */
  function blitRegion(cv,cxp,cyp,rad,blur,alpha){                       /* only the patch around the bird, so the blur doesn't run over the whole frame */
    const k=.6, x0=Math.max(0,Math.floor((cxp-rad)*k)), y0=Math.max(0,Math.floor((cyp-rad)*k)), x1=Math.min(cv.width,Math.ceil((cxp+rad)*k)), y1=Math.min(cv.height,Math.ceil((cyp+rad)*k));
    if(x1<=x0||y1<=y0) return; ctx.save(); ctx.globalAlpha=alpha; if(blur>.3) ctx.filter=`blur(${blur.toFixed(1)}px)`; ctx.drawImage(cv,x0,y0,x1-x0,y1-y0,x0/k,y0/k,(x1-x0)/k,(y1-y0)/k); ctx.restore(); ctx.filter="none"; }
  let pf=null, nextPF=80, pfBits=[]; const pfcv=document.createElement("canvas"), pfcx=pfcv.getContext("2d");
  /* how a flushed rooster really goes: an explosive near-vertical climb on whirring wings, a moment hanging and flailing as it swings round to pick its line,
     then off low and fast, a burst of beats and a long glide on bowed wings, another burst, another glide */
  function startPF(){ const sd=Math.random()<.5?-1:1;
    pf={t:0,sd,P:[sd*rnd(.05,.16),.36,.78],h0:sd>0? Math.PI-.75 : .75,h1:sd>0? .5 : Math.PI-.5,fl:0,beatAmp:1,turned:false,cyc:0};
    const sx=W/2+pf.P[0]*H*.5/pf.P[2];
    for(let i=0;i<40;i++) pfBits.push({x:sx+rnd(-80,80),y:H+rnd(-10,30),vx:rnd(-180,180),vy:-rnd(280,620),r:rnd(3,10),rot:rnd(0,6),vr:rnd(-9,9),c:pick(["#7a5a2e","#9c7a3c","#5e4a26","#b08a48","#c9a24e","#6b7a34","#8a9a46","#a8884a"]),life:rnd(1,1.9)});   /* grass and seed heads thrown up at the lens */
    natureSfx.flush&&natureSfx.flush("pheas",sx/W); setTimeout(()=>natureSfx.crow&&natureSfx.crow((sx/W*2-1)*.8),150); }
  function pheas3D(x,P,f,flap,amp,glide,proj,Kw,sunL){
    const crs=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]], nrm=v=>{ const l=Math.hypot(v[0],v[1],v[2])||1; return [v[0]/l,v[1]/l,v[2]/l]; }, dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
    const r=nrm(crs(f,[0,-1,0])), u=crs(r,f);
    const W3=(a,b,c)=>[P[0]+(f[0]*a+r[0]*b+u[0]*c)*Kw, P[1]+(f[1]*a+r[1]*b+u[1]*c)*Kw, P[2]+(f[2]*a+r[2]*b+u[2]*c)*Kw];
    const pt=(a,b,c)=>{ const w=W3(a,b,c); return proj(w[0],w[1],w[2]); };
    const toEye=nrm([-P[0],-P[1],-P[2]]), under=dot(u,toEye)<0;
    sunL=sunL||[0,-.1,1];
    const sTop=dot(u,sunL), lit=Math.max(0,Math.min(1,(under? -sTop : sTop)*1.5+.12));                         /* how much of the low sun the side we see catches */
    const glow=Math.max(0,Math.min(1,(dot(nrm(P),sunL)-.45)/.45))*(1-lit*.6);                                      /* backlit: the sun shining through the feather edges */
    const L=(c,k)=>{ const l=lit*(k??1); return [c[0]*(.5+.85*l)+9*(1-l), c[1]*(.48+.62*l)+10*(1-l), c[2]*(.48+.42*l)+15*(1-l)]; };
    const sc=a=>{ const w=W3(a,0,0), p0=proj(w[0],w[1],w[2]), p1=proj(w[0]+Kw,w[1],w[2]); return Math.hypot(p1[0]-p0[0],p1[1]-p0[1]); };   /* pixels per body unit here */
    const poly=(pts,col)=>{ x.fillStyle=col; x.beginPath(); x.moveTo(pts[0][0],pts[0][1]); for(let i=1;i<pts.length;i++) x.lineTo(pts[i][0],pts[i][1]); x.closePath(); x.fill(); };
    const smooth=(pts,col)=>{ x.fillStyle=col; x.beginPath(); const n=pts.length, m=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2]; let q=m(pts[n-1],pts[0]); x.moveTo(q[0],q[1]); for(let i=0;i<n;i++){ const a=pts[i], b=pts[(i+1)%n], mm=m(a,b); x.quadraticCurveTo(a[0],a[1],mm[0],mm[1]); } x.closePath(); x.fill(); };
    const line=(a,b,col,w)=>{ x.strokeStyle=col; x.lineWidth=w; x.beginPath(); x.moveTo(a[0],a[1]); x.lineTo(b[0],b[1]); x.stroke(); };
    const px=sc(0); x.lineCap="round"; x.lineJoin="round";
    /* a real ring-necked cock's colours: mottled tan-and-grey wing coverts, barred brown flight feathers, a buff underwing, coppery body scaled in black,
       golden flanks spotted black, a blue-grey rump, a long olive-buff tail barred in black, the dark green-purple head with its scarlet face */
    const COV=[150,128,96], COVD=[78,62,44], SEC=[124,100,70], PRI=[104,82,58], BAR=[202,176,128], UND=[200,186,160], UNDG=[150,140,126],
      CU=[176,92,40], CU2=[212,140,64], CHE=[120,46,24], BELLY=[52,30,20], FLANK=[206,150,74], RUMP=[118,130,122], BLK=[24,16,12],
      GRN=[18,62,48], GRN2=[52,124,96], PUR=[64,40,84], RED=[196,34,26], WH=[238,234,224], TL=[160,136,92], TLD=[50,38,26], HORN=[214,200,160];
    /* the wing: short, broad and rounded, fanned primaries along the hand, barred */
    const wing=(sd,fl,ghost)=>{ const h=k=>fl*k, bend=Math.abs(fl)*.25;
      const S=pt(3.6,sd*2.4,.6), Wr=pt(2.4,sd*8.2,h(5.2)+bend), Tp=pt(-1.4,sd*14.2,h(9)), T2=pt(-5.4,sd*12.4,h(8)), Tr=pt(-8.2,sd*8.6,h(5)), R0=pt(-6,sd*2.4,.4);
      const g=x.createLinearGradient(S[0],S[1],Tp[0],Tp[1]);
      if(under){ g.addColorStop(0,rgb(L(UND,.8))); g.addColorStop(.55,rgb(L(UND,.75))); g.addColorStop(1,rgb(mixv(L(UNDG,.7),[246,190,120],glow*.3))); }
      else { g.addColorStop(0,rgb(L(COV))); g.addColorStop(.45,rgb(L(SEC))); g.addColorStop(1,rgb(L(PRI))); }
      smooth([S,Wr,pt(.6,sd*11.5,h(7.4)),Tp,T2,Tr,R0],g);
      if(ghost) return;
      /* each primary along the hand: a long rounded feather, its tip a shade darker */
      for(let i=0;i<7;i++){ const t=i/6, a0=lerp(1.8,-5,t), s0=lerp(10.6,10.4,t), ang=lerp(.55,-.75,t), len=lerp(3.6,4.4,Math.sin(t*Math.PI)), tipA=a0+Math.sin(ang)*len, tipS=s0+Math.cos(ang)*len+2.2;
        const q=k=>k*k*.6; const f0=pt(a0+.5,sd*s0,h(lerp(6.4,7.4,t))), f1=pt(tipA+.55,sd*(tipS-.3),h(lerp(8.4,8.6,t))+q(1)), f2=pt(tipA,sd*(tipS+.35),h(lerp(8.6,8.8,t))+q(1)), f3=pt(tipA-.55,sd*(tipS-.3),h(lerp(8.4,8.6,t))+q(1)), f4=pt(a0-.5,sd*s0,h(lerp(6.4,7.4,t)));
        smooth([f0,f1,f2,f3,f4],rgb(under? mixv(L(UNDG,.8),[244,186,116],glow*.35) : L(i%2? PRI : mulv(PRI,.92))));
        if(px>.45&&!under){ for(const k of [.35,.6,.85]){ const c0=pt(lerp(a0,tipA,k)+.45,sd*lerp(s0,tipS,k),h(lerp(7,8.6,k))), c1=pt(lerp(a0,tipA,k)-.45,sd*lerp(s0,tipS,k),h(lerp(7,8.6,k))); line(c0,c1,rgb(L(BAR),.55),Math.max(.4,px*.3)); } } }   /* buff bars across the primaries */
      if(!under){
        /* rows of coverts: each feather dark-centred with a pale fringe, laid like scales */
        for(let row=0;row<3;row++) for(let i=0;i<6;i++){ const t=(i+.5+(row%2)*.5)/6.5, a=lerp(2.6,-1.6,row/2.4)-t*1.2, s=lerp(3.2,9.6,t), c=h(lerp(1.2,6,t)*.95);
          const q=pt(a,sd*s,c), rr=Math.max(.6,px*(.95-row*.12)); x.fillStyle=rgb(L(COVD),.45); x.beginPath(); x.ellipse(q[0],q[1],rr,rr*.7,0,0,6.283); x.fill();
          x.strokeStyle=rgb(L([226,206,164]),.4); x.lineWidth=Math.max(.35,px*.18); x.beginPath(); x.ellipse(q[0],q[1],rr*1.05,rr*.75,0,.2,2.9); x.stroke(); }
        /* the secondaries' buff bars */
        for(const k of [.3,.5,.7,.9]){ const a0=pt(-5.4+k*1.4,sd*(3+k*8.2),h(k*6.4)), a1=pt(-7.6+k*1.6,sd*(3+k*7.6),h(k*5.6)); line(a0,a1,rgb(L(BAR),.5),Math.max(.5,px*.36)); } }
      else { for(let i=0;i<8;i++){ const t=(i+.5)/8, a0=pt(lerp(-2.4,-1.8,t),sd*lerp(3,11,t),h(lerp(1.6,7,t))), a1=pt(lerp(-6.2,-4.6,t),sd*lerp(3,12,t),h(lerp(1.6,7.6,t))); line(a0,a1,rgb(L(UNDG,.6),.4),Math.max(.35,px*.16)); } }   /* the flight feathers showing through underneath */
      if(glow>.08){ x.strokeStyle=rgb([255,198,128],glow*.5); x.lineWidth=Math.max(.5,px*.35); x.beginPath(); x.moveTo(Tp[0],Tp[1]); x.quadraticCurveTo(T2[0],T2[1],Tr[0],Tr[1]); x.stroke(); }   /* the trailing edge lit through */
    };
    const dl=(P[0]-r[0]*.05)**2+(P[1]-r[1]*.05)**2+(P[2]-r[2]*.05)**2, dr=(P[0]+r[0]*.05)**2+(P[1]+r[1]*.05)**2+(P[2]+r[2]*.05)**2, farS=dl>dr? -1 : 1;
    const wings=sd=>{ if(glide){ wing(sd,-.16); return; } const a0=x.globalAlpha;                                        /* whirring: the wing itself, and a faint smear of the stroke either side of it */
      for(const d of [-.5,.5]){ x.globalAlpha=a0*.22; wing(sd,(Math.sin(flap+d)*.9+.08)*amp,true); } x.globalAlpha=a0; wing(sd,(Math.sin(flap)*.9+.08)*amp); };
    wings(farS);
    /* the long barred tail: a fan of pointed feathers, the middle pair longest, each with its black bars and a chestnut fringe */
    for(const [len,off] of [[-20,-2.6],[-20,2.6],[-24,-1.6],[-24,1.6],[-28.5,-.5],[-28.5,.5]]){
      const b0=pt(-5.5,off*.35-.6,0), b1=pt(-5.5,off*.35+.6,0), tip=pt(len,off,-1.2-(len+20)*.04), m0=pt((len-5.5)/2,off*.7-.9,-.6), m1=pt((len-5.5)/2,off*.7+.9,-.6);
      const tg=x.createLinearGradient(b0[0],b0[1],tip[0],tip[1]); tg.addColorStop(0,rgb(L(mixv(TL,CU,.25)))); tg.addColorStop(1,rgb(mixv(L(TL),[250,200,140],glow*.25))); poly([b0,m0,tip,m1,b1],tg);
      x.strokeStyle=rgb(L(CHE),.35); x.lineWidth=Math.max(.4,sc(-10)*.22); x.beginPath(); x.moveTo(m0[0],m0[1]); x.lineTo(tip[0],tip[1]); x.lineTo(m1[0],m1[1]); x.stroke();
      x.strokeStyle=rgb(TLD,.55); x.lineWidth=Math.max(.5,sc(-10)*.34);
      for(let a=-7.6;a>len+2;a-=2.2){ const k=(a+5.5)/(len+5.5), q0=pt(a,off*(.35+.65*k)-.9*(1-k*.6),-.6*k), q1=pt(a,off*(.35+.65*k)+.9*(1-k*.6),-.6*k); x.beginPath(); x.moveTo(q0[0],q0[1]); x.lineTo(q1[0],q1[1]); x.stroke(); } }
    /* the body: lofted from real proportions, then feathered over: scaled copper on the back and breast, golden flanks spotted black, dark belly */
    const SECT=[[-6.6,1.0,.9,.7],[-5.2,1.9,1.8,.8],[-3.6,2.6,2.5,.6],[-2,3.0,3.0,.3],[-.4,3.2,3.3,0],[1.1,3.1,3.5,-.35],[2.5,2.7,3.3,-.5],[3.7,2.1,2.5,-.1],[4.5,1.6,1.8,.5]];
    const NECK=[[4.5,1.6,1.8,.5],[5.4,1.35,1.5,1.0],[6.4,1.2,1.3,1.4],[7.4,1.15,1.25,1.6]];
    const secAt=a=>{ for(let i=0;i<SECT.length-1;i++){ const A=SECT[i], B=SECT[i+1]; if(a<=B[0]){ const t=Math.max(0,(a-A[0])/(B[0]-A[0])); return [A[1]+(B[1]-A[1])*t,A[2]+(B[2]-A[2])*t,A[3]+(B[3]-A[3])*t]; } } const Z=SECT[SECT.length-1]; return [Z[1],Z[2],Z[3]]; };
    const loft=(S,path)=>{ for(let i=0;i<S.length-1;i++){ const A=S[i], B=S[i+1]; for(let k=0;k<3;k++){ const t=k/3, a=A[0]+(B[0]-A[0])*t, w=A[1]+(B[1]-A[1])*t, hh=A[2]+(B[2]-A[2])*t, zc=A[3]+(B[3]-A[3])*t;
        for(let j=0;j<16;j++){ const th=j/16*6.283, q=pt(a,w*Math.cos(th),zc+hh*Math.sin(th)); j? path.lineTo(q[0],q[1]) : path.moveTo(q[0],q[1]); } path.closePath(); } }
      const Z=S[S.length-1]; for(let j=0;j<16;j++){ const th=j/16*6.283, q=pt(Z[0],Z[1]*Math.cos(th),Z[3]+Z[2]*Math.sin(th)); j? path.lineTo(q[0],q[1]) : path.moveTo(q[0],q[1]); } path.closePath(); };
    const body=new Path2D(); loft(SECT,body);
    x.fillStyle=rgb(L(under? CHE : CU)); x.fill(body);
    x.save(); x.clip(body);
    { const tp=pt(0,0,4.4), bt=pt(0,0,-3.4), g=x.createLinearGradient(tp[0],tp[1],bt[0],bt[1]); g.addColorStop(0,rgb(L(CU2),.55)); g.addColorStop(.42,rgb(L(CU),0)); g.addColorStop(.75,rgb(L(CHE),.5)); g.addColorStop(1,rgb(L(BELLY),.9)); x.fillStyle=g; x.fillRect(0,0,x.canvas.width/.6,x.canvas.height/.6); }
    if(!under){ const rp=pt(-4.8,0,2.6), rr=Math.max(1,sc(-4.8)*2.6); const g=x.createRadialGradient(rp[0],rp[1],0,rp[0],rp[1],rr); g.addColorStop(0,rgb(L(RUMP),.8)); g.addColorStop(1,rgb(L(RUMP),0)); x.fillStyle=g; x.fillRect(rp[0]-rr,rp[1]-rr,rr*2,rr*2); }   /* the blue-grey rump */
    { const br=pt(3.6,0,-.6), rr=Math.max(1,sc(3.6)*3); const g=x.createRadialGradient(br[0],br[1],0,br[0],br[1],rr); g.addColorStop(0,rgb(L(mixv(CHE,PUR,.18)),.75)); g.addColorStop(1,rgb(L(CHE),0)); x.fillStyle=g; x.fillRect(br[0]-rr,br[1]-rr,rr*2,rr*2); }   /* the deep coppery breast with its purple sheen */
    /* the feathering: every visible feather a dark crescent, pale-tipped on the mantle, black spots on the golden flanks */
    if(px>.3){ for(let a=-5.4;a<=4.2;a+=.62){ const [w,hh,zc]=secAt(a);
      for(let j=0;j<22;j++){ const th=(j+(Math.round(a/.62)%2)*.5)/22*6.283, ct=Math.cos(th), st=Math.sin(th), nl=nrm([0,ct/w,st/hh]), nw=[r[0]*nl[1]+u[0]*nl[2],r[1]*nl[1]+u[1]*nl[2],r[2]*nl[1]+u[2]*nl[2]], face=dot(nw,toEye);
        if(face<.12) continue; const q=pt(a,w*ct*.98,zc+hh*st*.98), rr=Math.max(.4,sc(a)*.42)*Math.min(1,face*1.6);
        if(st<-.55) continue;                                                                                              /* the belly stays plain and dark */
        if(Math.abs(ct)>.62&&st<.4&&a<2){ x.fillStyle=rgb(L(FLANK),.4); x.beginPath(); x.arc(q[0],q[1],rr*1.1,0,6.283); x.fill(); x.fillStyle=rgb(BLK,.6); x.beginPath(); x.arc(q[0],q[1]+rr*.2,rr*.45,0,6.283); x.fill(); continue; }   /* flank: gold, a black spot */
        x.strokeStyle=rgb(BLK,.5); x.lineWidth=Math.max(.35,rr*.38); x.beginPath(); x.arc(q[0],q[1]-rr*.3,rr,.35,2.8); x.stroke();          /* a scale-like black fringe */
        if(st>.5&&a<0){ x.fillStyle=rgb(L(WH),.55); x.beginPath(); x.arc(q[0],q[1]-rr*.2,rr*.32,0,6.283); x.fill(); } } } }   /* the pale-centred mantle feathers */
    { const s0=proj(P[0]+sunL[0]*.02,P[1]+sunL[1]*.02,P[2]+sunL[2]*.02), c0=pt(0,0,0), dx=s0[0]-c0[0], dy=s0[1]-c0[1], dd=Math.hypot(dx,dy)||1, R=sc(0)*4.2;   /* the rim of gold on the edge toward the sun */
      const g=x.createLinearGradient(c0[0]-dx/dd*R,c0[1]-dy/dd*R,c0[0]+dx/dd*R,c0[1]+dy/dd*R); g.addColorStop(0,"rgba(0,0,0,0)"); g.addColorStop(.72,"rgba(255,190,110,0)"); g.addColorStop(1,`rgba(255,196,120,${(.2+glow*.4).toFixed(2)})`); x.fillStyle=g; x.fillRect(0,0,x.canvas.width/.6,x.canvas.height/.6); }
    x.restore();
    /* the neck: iridescent purple to green, the narrow white collar, then the head */
    const hd=pt(8.8,0,1.6), rH=Math.max(.8,sc(8.8)*1.45);
    { const c0=pt(5.6,-1.75,.9), c1=pt(5.6,1.75,.9), cm=pt(5.8,0,2.5), cb=pt(5.5,0,-.8); x.strokeStyle=rgb(L(WH,1.1)); x.lineWidth=Math.max(.8,sc(5.6)*.7); x.beginPath(); x.moveTo(c0[0],c0[1]); x.quadraticCurveTo(cm[0],cm[1],c1[0],c1[1]); x.stroke();
      x.globalAlpha*=.7; x.beginPath(); x.moveTo(c0[0],c0[1]); x.quadraticCurveTo(cb[0],cb[1],c1[0],c1[1]); x.stroke(); x.globalAlpha/=.7; }
    { const neck=new Path2D(); loft(NECK,neck); const n0=pt(5.8,0,1), g=x.createLinearGradient(n0[0],n0[1],hd[0],hd[1]); g.addColorStop(0,rgb(L(PUR))); g.addColorStop(.6,rgb(L(mixv(PUR,GRN,.6)))); g.addColorStop(1,rgb(L(GRN))); x.fillStyle=g; x.fill(neck);
      x.save(); x.clip(neck); const hl=pt(6.6,0,2.4), rr=Math.max(1,sc(6.6)*1.6), gh=x.createRadialGradient(hl[0],hl[1],0,hl[0],hl[1],rr); gh.addColorStop(0,rgb(mixv(L(GRN2,1.3),[120,90,160],.25),.55)); gh.addColorStop(1,"rgba(0,0,0,0)"); x.fillStyle=gh; x.fillRect(hl[0]-rr,hl[1]-rr,rr*2,rr*2); x.restore(); }   /* the sheen */
    { const g=x.createRadialGradient(hd[0]-rH*.35,hd[1]-rH*.4,0,hd[0],hd[1],rH); g.addColorStop(0,rgb(L(GRN2,1.2))); g.addColorStop(.55,rgb(L(GRN))); g.addColorStop(1,rgb(L(mixv(GRN,PUR,.4),.8))); x.fillStyle=g; x.beginPath(); x.arc(hd[0],hd[1],rH,0,6.283); x.fill(); }
    for(const sd of [-1,1]){ const side=[r[0]*sd,r[1]*sd,r[2]*sd], face=dot(side,toEye);
      const e0=pt(8.4,sd*.8,2.5), e1=pt(7.1,sd*1.0,3.5), e2=pt(7.7,sd*.7,2.4); poly([e0,e1,e2],rgb(L(GRN)));                         /* ear tufts */
      if(face<-.2) continue;
      const fc=pt(9.3,sd*1.08,1.55), rx=Math.max(.6,sc(9)*.95), ry=Math.max(.6,sc(9)*.62), fg=x.createRadialGradient(fc[0],fc[1]-ry*.3,0,fc[0],fc[1],rx);
      fg.addColorStop(0,rgb(L([226,58,40],1.15))); fg.addColorStop(1,rgb(L([150,22,18]))); x.fillStyle=fg; x.beginPath(); x.ellipse(fc[0],fc[1],rx,ry,0,0,6.283); x.fill();   /* the scarlet face wattle */
      const ey=pt(9.4,sd*1.2,1.75); x.fillStyle=rgb(L([200,160,70])); x.beginPath(); x.arc(ey[0],ey[1],Math.max(.4,sc(9)*.22),0,6.283); x.fill(); x.fillStyle="rgba(10,6,4,.95)"; x.beginPath(); x.arc(ey[0],ey[1],Math.max(.25,sc(9)*.11),0,6.283); x.fill(); }
    { const b0=pt(10.1,.45,1.6), b1=pt(10.1,-.45,1.6), bt=pt(11.4,0,1.15), bb=pt(10.2,0,1.05); poly([b0,bt,b1,bb],rgb(L(HORN,1.1))); }   /* the short pale bill */
    wings(-farS);
  }
  function drawPheasFront(dt,dark){
    for(let i=pfBits.length-1;i>=0;i--){ const b=pfBits[i]; b.vy+=430*dt; b.vx*=.99; b.x+=b.vx*dt; b.y+=b.vy*dt; b.rot+=b.vr*dt; b.life-=dt; if(b.life<=0){ pfBits.splice(i,1); continue; }
      ctx.save(); ctx.globalAlpha=Math.min(1,b.life*2)*.8; ctx.translate(b.x,b.y); ctx.rotate(b.rot); ctx.fillStyle=b.c; ctx.fillRect(-b.r,-b.r*.3,b.r*2,b.r*.6); ctx.restore(); }
    nextPF-=dt; if(!pf&&nextPF<=0){ if(stageBusy()) nextPF=rnd(12,25); else startPF(); } if(!pf) return;
    const p=pf; p.t+=dt; const T=p.t, F=H*.5, cx=W/2, cy=H*.52;
    let h, pitch, spd, amp, glide=false, hz;
    if(T<.8){ h=p.h0; pitch=1.05; spd=.85; amp=1; hz=17; }                                                              /* the explosive climb */
    else if(T<1.95){ const u=ease((T-.8)/1.15); h=lerp(p.h0,p.h1,u); pitch=lerp(.95,.42,u); spd=.28+.1*Math.sin(u*Math.PI); amp=1.25; hz=12;   /* hanging there, flailing, swinging round */
      if(!p.turned&&u>.3){ p.turned=true; natureSfx.flush&&natureSfx.flush("pheas",(cx+p.P[0]*F/p.P[2])/W); } }
    else { const u=Math.min(1,(T-1.95)/1.2); h=p.h1+Math.sin(T*.7)*.05; pitch=lerp(.42,-.04,u); spd=lerp(.6,1.75,u); amp=.85; hz=13;          /* away low and fast: whirr, glide, whirr */
      const c=(T-1.95)%1.6; glide=T>2.6&&c>.65; if(glide) pitch-=.04; }
    const fwd=[Math.cos(pitch)*Math.cos(h),-Math.sin(pitch),Math.cos(pitch)*Math.sin(h)];
    p.P=[p.P[0]+fwd[0]*spd*dt, p.P[1]+fwd[1]*spd*dt+(T>.8&&T<1.95? Math.sin(T*9)*.03*dt : 0), p.P[2]+fwd[2]*spd*dt];
    p.fl+=dt*(glide?0:hz)*Math.PI*2;
    const P=p.P; if(P[2]>11||T>9||P[2]<.25){ pf=null; nextPF=rnd(110,220); return; }
    const cw=Math.ceil(W*.6), ch=Math.ceil(H*.6); if(pfcv.width!==cw||pfcv.height!==ch){ pfcv.width=cw; pfcv.height=ch; }
    const x=pfcx; x.setTransform(1,0,0,1,0,0); x.clearRect(0,0,cw,ch); x.setTransform(.6,0,0,.6,0,0);
    const look=[Math.cos(pitch*.85)*Math.cos(h),-Math.sin(pitch*.85),Math.cos(pitch*.85)*Math.sin(h)];                      /* the body rides a little flatter than its climb */
    { const sp0=sun(), v=[(sp0.x-cx)/F,(sp0.y-cy)/F-.05,1], l=Math.hypot(...v); pheas3D(x,P,look,p.fl,amp,glide,(X3,Y3,Z3)=>[cx+X3*F/Math.max(.05,Z3),cy+Y3*F/Math.max(.05,Z3)],.016,v.map(c=>c/l)); }
    const sx=cx+P[0]*F/P[2], sy=cy+P[1]*F/P[2];
    const RR=(.016*32*F/Math.max(.3,P[2])+30)*.6, RX=Math.max(0,sx*.6-RR), RY=Math.max(0,sy*.6-RR), RW=RR*2, RH=RR*2;   /* the light and air only where the bird is */
    x.setTransform(1,0,0,1,0,0); x.globalCompositeOperation="source-atop";
    x.fillStyle="rgba(40,24,12,.2)"; x.fillRect(RX,RY,RW,RH); const sp=sun(), rl=x.createLinearGradient(sx*.6-90,0,sx*.6+90,0), sd2=sp.x>sx?1:-1; rl.addColorStop(sd2>0?0:1,"rgba(20,12,6,.2)"); rl.addColorStop(sd2>0?1:0,"rgba(255,190,110,.28)"); x.fillStyle=rl; x.fillRect(RX,RY,RW,RH);   /* rim-lit from the sun's side */
    if(!p.skyC||(p.skyT=(p.skyT||0)-1)<=0){ p.skyT=5; const ip=toImg(sx,sy); p.skyC=(ip&&ip[0]>=0&&ip[0]<=1&&ip[1]>=0&&ip[1]<=1&&sampleAt(ip[0],ip[1]))||[170,150,110]; }
    x.fillStyle=rgb(p.skyC,Math.min(.65,Math.max(0,(P[2]-1.4)/12))); x.fillRect(RX,RY,RW,RH);
    if(SC.dim()){ x.fillStyle="rgba(20,14,6,.18)"; x.fillRect(RX,RY,RW,RH); } else { const tn=tint(); if(tn.a>0){ x.globalAlpha=tn.a; x.fillStyle=tn.c; x.fillRect(RX,RY,RW,RH); x.globalAlpha=1; } }
    if(dark){ x.fillStyle="rgba(10,8,14,.3)"; x.fillRect(RX,RY,RW,RH); }
    x.globalCompositeOperation="source-over";
    const bl=P[2]<.95? (.95-P[2])*9+.6 : .6+Math.max(0,P[2]-6)*.12;                                                      /* too near for the lens at first, then soft with distance */
    blitRegion(pfcv,sx,sy,.016*32*F/Math.max(.3,P[2])+30,bl,Math.min(1,T/.12,(11-P[2])/1.5));
  }
  /* ---- a red-tailed hawk (a "chicken hawk"), in true 3D like the other birds: it comes over your shoulder from behind, sails out over the lawn on broad wings,
     flares and drops into the grass, sits up tall turning its head, then beats off away from you into the distance ---- */
  let hawkG=null, nextHawkG=70; const hkcv=document.createElement("canvas"), hkcx=hkcv.getContext("2d");
  function startHawkG(){ const sx=rnd(W*.22,W*.55), gy=gnd().vy+lawnMinG(sx)+rnd(2,14), p=toGround(sx,gy), side=Math.random()<.5?-1:1;
    hawkG={t:0,st:0,state:"approach",X0:(Math.random()<.5?-1:1)*rnd(.2,.5),Y0:-rnd(1.5,1.8),tx:sx,ty:gy,Xw:p.Xw,Dw:p.Dw,dur:rnd(6,8),x:-99,y:-99,m:1,yaw:Math.PI/2,look:0,lookT:0,fl:0,sx0:side<0? -40 : W+40,sy0:gnd().vy-rnd(50,110)}; }
  function hawk3D(x,P,V,flap,glide,flare,proj,Kw){
    const nrm=v=>{ const l=Math.hypot(v[0],v[1],v[2])||1; return [v[0]/l,v[1]/l,v[2]/l]; }, crs=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
    const v=nrm(V), f=nrm([v[0],v[1]-flare*.9,v[2]]), r=nrm(crs(f,[0,-1,0])), u=crs(r,f);                     /* flaring: the body pitches up to brake */
    const pt=(a,b,c)=>proj(P[0]+(f[0]*a+r[0]*b+u[0]*c)*Kw, P[1]+(f[1]*a+r[1]*b+u[1]*c)*Kw, P[2]+(f[2]*a+r[2]*b+u[2]*c)*Kw);
    const under=-(P[0]*u[0]+P[1]*u[1]+P[2]*u[2])<0, fl=glide? .32+flare*.8 : Math.sin(flap)*.75+.3+flare*.5;
    const UP=[92,62,40], UP2=[132,98,66], UN=[132,108,82], BAR=[60,40,26], TIP=[40,30,24], RU=[184,88,44], RU2=[214,170,140];
    const poly=(pts,col)=>{ x.fillStyle=rgb(col); x.beginPath(); x.moveTo(pts[0][0],pts[0][1]); for(const q of pts) x.lineTo(q[0],q[1]); x.closePath(); x.fill(); };
    const wing=sd=>{ const h=c=>c*fl, sh=pt(3,sd*2,0), wr=pt(2.6,sd*13,h(6)), tr=pt(-9,sd*14,h(6)), rt=pt(-6,sd*2,0);
      const fingers=[]; for(let i=0;i<5;i++){ const a=-1+i*-1.2, b=sd*(23+i*.6-i*i*.25); fingers.push([pt(a+1.4,sd*(18+i*.2),h(9)),pt(a-.6,b+sd*3,h(10.5+i*.2)),pt(a-1.6,sd*(18+i*.2),h(9))]); }
      poly([sh,wr,pt(1,sd*18,h(9)),pt(-7,sd*18,h(8.6)),tr,rt],under? UN : UP);
      for(const fg of fingers) poly(fg,under? TIP : mulv(UP,.85));                                                     /* the fingered wingtips */
      if(under) poly([pt(2.8,sd*3,0),pt(2.6,sd*12,h(5.6)),pt(.6,sd*11,h(5.2)),pt(.8,sd*3,0)],BAR);                        /* the dark bar along the leading edge underneath */
      else poly([pt(2,sd*3,0),pt(1.6,sd*11,h(5)),pt(-3,sd*10,h(4.6)),pt(-3,sd*3,0)],UP2); };                             /* paler coverts on top */
    const q=sd=>{ const w=[P[0]+r[0]*sd*10*Kw,P[1]+r[1]*sd*10*Kw,P[2]+r[2]*sd*10*Kw]; return w[0]*w[0]+w[1]*w[1]+w[2]*w[2]; }, far=q(-1)>q(1)? -1 : 1;
    wing(far);
    poly([pt(-8,-2.2,0),pt(-17,-6.4,-.4),pt(-18.4,0,-.6),pt(-17,6.4,-.4),pt(-8,2.2,0)],under? RU2 : RU);                 /* the fanned red tail */
    const tl=pt(-8,0,0), md=pt(0,0,0), hd=pt(8.6,0,.6), w0=Math.max(1,Math.hypot(...[0,1].map(i=>pt(0,3,0)[i]-md[i])));
    x.lineCap="round"; x.strokeStyle=rgb(under? UN : UP); x.lineWidth=w0*1.9; x.beginPath(); x.moveTo(tl[0],tl[1]); x.lineTo(md[0],md[1]); x.lineTo(hd[0],hd[1]); x.stroke();
    if(under){ const b0=pt(-2.4,-2,-.4), b1=pt(-2.4,2,-.4); x.strokeStyle=rgb(BAR); x.lineWidth=w0*.5; x.beginPath(); x.moveTo(b0[0],b0[1]); x.lineTo(b1[0],b1[1]); x.stroke(); }   /* the belly band */
    x.fillStyle=rgb([82,54,34]); x.beginPath(); x.arc(hd[0],hd[1],w0*.85,0,6.283); x.fill();
    wing(-far);
  }
  function hawkSitParts(h,P){                                                                    /* sitting up in the grass: a proper 3D body like the other animals */
    const parts=[], yaw=h.yaw, far=z=>z*Math.cos(yaw)>0, fold=h.fold==null?1:h.fold;
    for(const sd of [-1,1]) parts.push({p:[[1,3.2,sd*1.4,.55],[1.4,0,sd*1.4,.5]],c:rgb(P.leg)});
    parts.push({p:[[-1.6,4.6,0,1.6],[-5.4,1.4,0,1.2],[-6.4,.6,0,.9]],c:rgb(P.tail),bias:.05});                       /* the red tail, angled down to the grass */
    parts.push({p:[[-.6,5.4,0,3.6],[.2,9.8,0,3.8],[1,13.4,0,3.1]],c:rgb(P.back),sh:[rgb(mulv(P.back,.6)),rgb(mixv(P.back,[255,200,140],.25))]});
    parts.push({p:[[1.6,6.4,0,2.8],[2.2,10.6,0,2.9],[2.2,13,0,2.2]],c:rgb(P.breast),bias:-.06});                       /* pale breast */
    for(const [a,b,zz] of [[2.8,7.4,-1.2],[3.2,7.2,0],[2.8,7.4,1.2],[3,8.2,-.6],[3,8.2,.6]]) parts.push({p:[[a,b,zz,.6]],c:rgb(P.band),bias:-.12});   /* the dark belly band */
    for(const sd of [-1,1]){ const op=1-fold; parts.push({p:[[0,13,sd*2.8,1.6],[-3.6+op*2,7+op*8,sd*(3+op*10),1.3],[-5.6+op*1,3+op*10,sd*(2.6+op*14),.9]],c:far(sd)?rgb(mulv(P.wing,.8)):rgb(P.wing),bias:.02}); }   /* folded wings (still settling as it lands) */
    const hy=16.2; parts.push({p:[[1.4,hy,0,2.5]],c:rgb(P.head)});
    const lk=h.look||0, bx=1.4+Math.cos(lk)*2.6, bz=Math.sin(lk)*2.6;
    parts.push({p:[[1.4+Math.cos(lk)*1.6,hy-.2,Math.sin(lk)*1.6,1.3],[bx,hy-.7,bz,.6]],c:rgb(P.beak),bias:-.08});        /* hooked beak, turning with the head */
    for(const sd of [-1,1]) parts.push({p:[[1.4+Math.cos(lk+sd*.9)*1.9,hy+.5,Math.sin(lk+sd*.9)*1.9,.45]],c:"rgba(14,8,4,.95)",bias:-.3});
    return parts;
  }
  function drawHawkG(dt,dark,layer){
    if(layer==="near"){ nextHawkG-=dt; if(!hawkG&&nextHawkG<=0){ if(stageBusy()) nextHawkG=rnd(12,25); else startHawkG(); } }
    if(!hawkG) return; const h=hawkG, inAir=h.state==="approach"||h.state==="leave";
    if(layer==="near"&&!inAir) return;
    const F=H*.5, cx=W/2, cy=H*.52, sk=Math.max(.5,(h.ty-gnd().vy)/150), zT=6, kL=.16*toScreen(h.Xw,h.Dw).g/26*.85, Kw=kL*zT/F;
    const sitBlit=a=>{ const s=toScreen(h.Xw,h.Dw); h.ct=(h.ct||0)-dt; if(h.ct<=0||!h.pal){ h.ct=1.5; const G=groundPal(s,dark), lit=dark?.45:.62;
        h.pal={...G, back:mulv([100,68,44],lit), breast:mulv([224,212,190],lit), band:mulv([70,46,30],lit), wing:mulv([86,58,38],lit), head:mulv([92,62,40],lit), beak:mulv([70,66,64],lit), leg:mulv([210,178,70],lit), tail:mulv([184,88,44],lit)}; }
      if(!h.blades) h.blades=Array.from({length:10},()=>({ox:rnd(-14,14),h:rnd(3,6),lean:rnd(-.5,.5),c:Math.random()}));
      if(!h.airC||(h.airT=(h.airT||0)-dt)<=0){ h.airT=.6; const ip=toImg(s.x,s.y-30*kL), ip2=toImg(s.x,s.y-90*kL); const c1=(ip&&sampleAt(Math.max(0,Math.min(1,ip[0])),Math.max(0,Math.min(1,ip[1]))))||[150,130,90], c2=(ip2&&sampleAt(Math.max(0,Math.min(1,ip2[0])),Math.max(0,Math.min(1,ip2[1]))))||c1;
        h.airC=mixv(mixv(c1,c2,.5),[236,184,126],.35); }                                                              /* the warm, dusty evening air between you and the far edge of the lawn */
      h.air={c:h.airC,a:dark?.32:.4,blur:.6};
      h.rt=0; critterBlit(null,null,h,s,kL,h.pal,()=>hawkSitParts(h,h.pal),h.yaw,40,40,10,h.blades,a,.7); return s; };
    if(layer==="ground"&&inAir){ if(h.state==="leave"&&h.st<.5) sitBlit(1-h.st/.5); return; }                       /* lifting off: the sitting bird fades as the flying one takes over */
    h.t+=dt; h.st+=dt;
    let P=null, flare=0, glide=false;
    if(h.state==="approach"){
      const u=Math.min(1,h.st/h.dur), e=u*(2-u), z=zT;                                                          /* far off: a long glide in from the side, dropping toward the far edge of the lawn */
      h.x=lerp(h.sx0,h.tx,e); h.y=lerp(h.sy0,h.ty-9*kL,e*e)+Math.sin(u*Math.PI)*-14; h.m=1; P=[(h.x-cx)*z/F,(h.y-cy)*z/F,z];
      flare=Math.max(0,(u-.82)/.18); glide=Math.sin(h.t*1.6)>-.3&&flare===0;                                       /* mostly sailing, a few deep beats, then flaring up to land */
      if(u>=1){ h.state="land"; h.st=0; h.fold=0; h.fx=h.x; h.fy=h.y; arrive(h.tx,h); h.yaw=h.V&&h.V[0]<0? Math.PI-.35 : .35; } }   /* everything small on the lawn scatters */
    else if(h.state==="land"||h.state==="sit"){
      if(h.state==="land"){ const u=Math.min(1,h.st/1.1); h.fold=u*u*(3-2*u); if(h.st>1.1){ h.state="sit"; h.st=0; h.dur=rnd(7,11); } }   /* wings fold smoothly as it settles */
      h.lookT-=dt; if(h.lookT<=0){ h.lookT=rnd(.6,1.8); h.lookTo=rnd(-1.4,1.4); } h.look+=((h.lookTo||0)-h.look)*Math.min(1,dt*8);
      if(h.state==="sit"&&h.st>h.dur){ const s0=toScreen(h.Xw,h.Dw); h.state="leave"; h.st=0; h.pp=null; h.lx0=s0.x; h.ly0=s0.y-9*kL; h.ltx=h.tx<W/2? -W*.05 : W*1.05; h.lty=gnd().vy-rnd(60,140); }
      const XF=.6, s=sitBlit(h.state==="land"? Math.min(1,h.st/XF) : 1);
      if(h.state==="land"&&h.st<XF){ const e=h.st/XF, ee=e*e*(3-2*e); h.x=lerp(h.fx,s.x,ee); h.y=lerp(h.fy,s.y-9*kL,ee); h.m=1; P=[(h.x-cx)*zT/F,(h.y-cy)*zT/F,zT]; flare=1-ee*.4; glide=true; h.drawA=1-ee; }   /* the flying bird settles and dissolves into the sitting one */
      else { h.x=s.x; h.y=s.y-14*kL; h.m=1; return; } }
    else { const u=Math.min(1,h.st/5), z=zT*Math.pow(10/zT,u), e=u*(2-u);                                      /* lifting off and beating away from you into the distance */
      h.x=lerp(h.lx0,h.ltx,e); h.y=lerp(h.ly0,h.lty,e)-Math.sin(u*Math.PI)*20*sk; h.m=zT/z; P=[(h.x-cx)*z/F,(h.y-cy)*z/F,z]; glide=(h.st%1.4)>.9;
      if(u>=1){ hawkG=null; nextHawkG=rnd(150,260); return; } }
    if(!isFinite(h.x)) { hawkG=null; return; }
    const V=h.pp? [P[0]-h.pp[0],P[1]-h.pp[1],P[2]-h.pp[2]] : [0,0,1]; h.pp=P; if(Math.hypot(...V)>1e-7) h.V=h.V? h.V.map((v,i)=>lerp(v,V[i],.15)) : V;
    h.fl+=dt*(glide?0:5.2)*Math.PI*2*.5;
    /* paint into a sprite, then the evening light and the air of the photo */
    const sz=Math.ceil(Math.min(1400,70*kL*h.m)); if(hkcv.width<sz||hkcv.height<sz){ hkcv.width=hkcv.height=sz; }
    const x=hkcx; x.setTransform(1,0,0,1,0,0); x.clearRect(0,0,hkcv.width,hkcv.height);
    hawk3D(x,P,h.V||V,h.fl,glide,flare,(X3,Y3,Z3)=>{ const zz=Math.max(.05,Z3); return [cx+X3*F/zz-h.x+sz/2, cy+Y3*F/zz-h.y+sz/2]; },Kw);
    x.globalCompositeOperation="source-atop"; const sp=sun(), sdx=Math.sign(sp.x-h.x)||1, lt=dark?.5:.74;
    x.fillStyle=`rgba(20,14,8,${(1-lt).toFixed(2)})`; x.fillRect(0,0,sz,sz); x.fillStyle="rgba(255,164,80,.16)"; x.fillRect(0,0,sz,sz);
    const rl=x.createLinearGradient(sz/2-sdx*sz*.25,0,sz/2+sdx*sz*.25,0); rl.addColorStop(0,"rgba(20,12,6,.2)"); rl.addColorStop(.6,"rgba(255,196,120,0)"); rl.addColorStop(1,"rgba(255,196,120,.28)"); x.fillStyle=rl; x.fillRect(0,0,sz,sz);
    if(!h.bg||(h.bgT=(h.bgT||0)-1)<=0){ h.bgT=8; const ip=toImg(h.x,h.y); h.bg=(ip&&ip[0]>=0&&ip[0]<=1&&ip[1]>=0&&ip[1]<=1&&sampleAt(ip[0],ip[1]))||[150,130,90]; }
    const haze=Math.min(.78,Math.max(0,(zT/h.m-2)/12)+.18); x.fillStyle=rgb(mixv(h.bg,[236,184,126],.25),haze); x.fillRect(0,0,sz,sz);
    if(SC.dim()){ x.fillStyle="rgba(20,14,6,.14)"; x.fillRect(0,0,sz,sz); } else { const tn=tint(); if(tn.a>0){ x.globalAlpha=tn.a; x.fillStyle=tn.c; x.fillRect(0,0,sz,sz); x.globalAlpha=1; } }
    x.globalCompositeOperation="source-over";
    const bl=.6+Math.max(0,h.m-3)*.4; ctx.save(); ctx.globalAlpha=h.state==="leave"? Math.min(1,(1-h.st/5)*3,h.st/.5) : h.state==="land"? h.drawA : Math.min(1,h.st*2); ctx.filter=`blur(${bl.toFixed(1)}px)`; ctx.drawImage(hkcv,0,0,sz,sz,h.x-sz/2,h.y-sz/2,sz,sz); ctx.restore(); ctx.filter="none";
  }
  /* ---- little brown bats in 3D: membrane wings on finger bones, beating deep and fast, jinking after insects over the lawn ---- */
  function bat3D(x,P,V,ph,proj,K){
    const nrm=v=>{ const l=Math.hypot(v[0],v[1],v[2])||1; return [v[0]/l,v[1]/l,v[2]/l]; }, crs=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
    const f=nrm(V), r=nrm(crs(f,[0,-1,0])), u=crs(r,f), fl=Math.sin(ph)*1.1;
    const pt=(a,b,c)=>proj(P[0]+(f[0]*a+r[0]*b+u[0]*c)*K, P[1]+(f[1]*a+r[1]*b+u[1]*c)*K, P[2]+(f[2]*a+r[2]*b+u[2]*c)*K);
    for(const sd of [-1,1]){ const h=c=>c*fl, sh=pt(1,sd*.8,0), el=pt(1.6,sd*4,h(2.4)), wr=pt(.6,sd*7,h(4.4)), t1=pt(-1,sd*10.5,h(6)), t2=pt(-3.4,sd*9,h(5.2)), t3=pt(-4.6,sd*6,h(3.6)), ft=pt(-4,sd*1.6,-.2);
      x.beginPath(); x.moveTo(sh[0],sh[1]); x.lineTo(el[0],el[1]); x.lineTo(wr[0],wr[1]); x.lineTo(t1[0],t1[1]);
      const m1=pt(-2.6,sd*8.6,h(4.4)), m2=pt(-4.2,sd*5.4,h(2.6)), m3=pt(-3.6,sd*2.6,h(.6));                         /* the scalloped trailing edge between the finger bones */
      x.quadraticCurveTo(m1[0],m1[1],t2[0],t2[1]); x.quadraticCurveTo(m2[0],m2[1],t3[0],t3[1]); x.quadraticCurveTo(m3[0],m3[1],ft[0],ft[1]); x.closePath(); x.fill(); }
    const tl=pt(-4.2,0,0), hd=pt(2.4,0,.2), w0=Math.max(.8,Math.hypot(...[0,1].map(i=>pt(0,1,0)[i]-pt(0,0,0)[i])));
    x.lineCap="round"; x.lineWidth=w0*1.6; x.beginPath(); x.moveTo(tl[0],tl[1]); x.lineTo(hd[0],hd[1]); x.stroke();
    for(const sd of [-1,1]){ const e=pt(2.8,sd*.6,1.1); x.beginPath(); x.arc(e[0],e[1],w0*.45,0,6.283); x.fill(); }   /* ears */
  }
  /* ---- squirrels and chipmunks: grey squirrels, little red squirrels and chipmunks scamper out along the edge of the brush and around the lone tree,
     bounding in quick bursts, freezing, sitting up to nibble with their paws to their mouths, tails flicking, then dashing off ---- */
  const sqs=[]; let nextSq=15;
  const SQK={gray:{s:1,fur:[132,128,122],belly:[224,216,202],tail:[150,146,140],tail2:[214,208,198]},
             red:{s:.8,fur:[178,92,46],belly:[234,226,212],tail:[168,82,42],tail2:[210,140,90]},
             chip:{s:.6,fur:[170,112,64],belly:[228,206,170],tail:[140,92,56],tail2:[170,120,80],stripes:true}};
  function startSquirrels(){ const n=1+Math.floor(Math.random()*3), nearTree=Math.random()<.45, A=scr(TRUNK[0][0],TRUNK[0][1]);
    for(let i=0;i<n;i++){ const kind=pick(["gray","gray","red","chip","chip"]), sx=nearTree? A[0]+rnd(-50,50) : rnd(W*.1,W*.9), sy=nearTree? A[1]+rnd(2,24) : gnd().vy+lawnMinG(sx)+rnd(2,16), p=toGround(sx,sy);
      sqs.push({kind,Xw:p.Xw,Dw:p.Dw,yaw:rnd(0,6.28),ph:rnd(0,6),state:"pause",st:0,dur:rnd(.3,1.2),t:-i*rnd(.5,2),life:rnd(25,45),alpha:0,sitA:0,flick:0,home:[sx,sy]}); } }
  function sqTarget(q,far){                                                                     /* a spot a short, decisive dash away, always on the lawn near the brush */
    const s=toScreen(q.Xw,q.Dw), dir=Math.random()<.5?-1:1, sx=Math.max(W*.03,Math.min(W*.97,s.x+dir*rnd(far?120:45,far?220:110))), lo=lawnMinG(sx);
    const gy=Math.max(lo+3,Math.min(Math.min(lo+90,foxBounds().gmax-10),(s.y-gnd().vy)+rnd(-20,30))), p=toGround(sx,gnd().vy+gy); q.tX=p.Xw; q.tD=p.Dw; q.lastD=1e9; }
  function squirrelParts(q,P){
    const K=SQK[q.kind], yaw=q.yaw, far=z=>z*Math.cos(yaw)>0, parts=[], run=q.state==="run", sA=q.sitA, ph=q.ph;
    const arc=run? Math.sin(ph)*1.4 : 0, hop=run? Math.max(0,Math.sin(ph))*1.6 : 0;               /* bounding: the back arches and stretches with each leap */
    const L=(a,b)=>[lerp(a[0],b[0],sA),lerp(a[1],b[1],sA),lerp(a[2],b[2],sA),lerp(a[3],b[3],sA)];
    const H=(x,y,z,r)=>[x,y+hop,z,r];
    const fur=rgb(P.fur), furF=rgb(mulv(P.fur,.78)), bel=rgb(P.belly), tl=rgb(P.tail), tl2=rgb(P.tail2), sh=[rgb(mulv(P.fur,.6)),rgb(mixv(P.fur,[255,210,150],.25))];
    /* hind legs: big haunches, long feet flat on the ground */
    for(const sd of [-1,1]){ const hz=sd*1.3, fwd=run? Math.cos(ph)*1.6 : 0;
      parts.push({p:[L(H(-2.6,2.4,hz,1.5),[-1.4,1.6,hz,1.6]),L(H(-1.4+fwd,.4,hz,.6),[.2,.3,hz,.6]),L(H(.4+fwd,.25,hz,.45),[1.8,.25,hz,.45])],c:far(hz)?furF:fur});
      const fz=sd*.9, ff=run? -Math.cos(ph)*1.8 : 0;                                                      /* front legs, or paws up at the mouth when sitting */
      parts.push({p:[L(H(2.6,2.6,fz,.7),[1.2,6.4,fz,.6]),L(H(3+ff,.3,fz,.45),[2.4,7.6,fz*.5,.45])],c:far(fz)?furF:fur,bias:-.02}); }
    /* body */
    parts.push({p:[L(H(-3.2,3+arc*.2,0,2.1),[-.8,2.2,0,2.3]),L(H(-.2,3.6+arc*.5,0,2.2),[.1,4.6,0,2.1]),L(H(2.4,3.6+arc*.2,0,1.8),[.6,6.6,0,1.7])],c:fur,sh});
    parts.push({p:[L(H(-1.6,2.2,0,1.5),[.8,3.2,0,1.6]),L(H(1.6,2.4,0,1.3),[1.2,5.6,0,1.3])],c:bel,bias:-.04});
    if(K.stripes) for(const [zz,cc] of [[0,P.dk],[.7,P.wh],[-.7,P.wh],[1.2,P.dk],[-1.2,P.dk]]) parts.push({p:[L(H(-2.8,4.9,zz,.35),[-.9,4,zz,.32]),L(H(1.6,5.2,zz,.33),[.1,7,zz,.3])],c:rgb(cc),bias:-.14});
    /* head */
    const hp=L(H(4.4,4.6,0,1.55),[1.6,8.5,0,1.5]), sn=L(H(5.9,4.2,0,.75),[3,8.2,0,.75]);
    parts.push({p:[hp,sn],c:fur,sh});
    for(const sd of [-1,1]) parts.push({p:[[hp[0]-.5,hp[1]+1.4,sd*.8,.45]],c:far(sd)?furF:fur,bias:.02});      /* ears */
    for(const sd of [-1,1]) parts.push({p:[[hp[0]+.6,hp[1]+.4,sd*1.05,.32]],c:"rgba(10,6,4,.95)",bias:-.3});  /* eyes */
    if(q.kind==="red") for(const sd of [-1,1]) parts.push({p:[[hp[0]+.6,hp[1]+.4,sd*1.0,.5]],c:rgb(P.belly),bias:-.2});   /* the red squirrel's white eye-ring */
    /* tail: a big plume curled up over the back for squirrels, held up straight for a chipmunk, flicking */
    const fk=Math.sin(q.flick*20)*q.flick*.8, tp=K.stripes? [[-3.4,3.4,.9],[-4.6,5,.85],[-5.2,6.8,.8],[-5.4,8.4,.7]] : [[-3.6,3.6,1.1],[-5,5.4,1.6],[-5.8,7.8,1.9],[-5.2,10,2],[-3.8,11.2,1.8],[-2.6,11.4,1.3]];
    const tps=tp.map(([x,y,r],i)=>{ const a=[x+(run? -i*.5 : 0),y-(run? i*.9 : 0)+hop,0,r], b=[x+1.6,y-1.6,0,r]; const v=L(a,b); return [v[0]+fk*i*.4,v[1],v[2],v[3]]; });
    parts.push({p:tps,c:tl,bias:.05}); parts.push({p:tps.map(v=>[v[0]-.3,v[1]+.2,v[2],v[3]*1.12]),c:tl2,bias:.08});   /* a frosted halo round the tail */
    return parts;
  }
  function stepSquirrel(q,dt){
    q.t+=dt; if(q.t<0) return;
    q.alpha= q.leaving? Math.max(0,q.alpha-dt*2) : Math.min(1,q.alpha+dt*2); if(q.leaving&&q.alpha<=0){ q.gone=true; return; }
    q.flick=Math.max(0,q.flick-dt*1.5); if(Math.random()<dt*.5) q.flick=1;
    q.sitA+=((q.state==="sit"?1:0)-q.sitA)*Math.min(1,dt*8);
    if(q.t>q.life&&!q.leaving&&q.state!=="run"){ q.leaving=true; q.state="run"; q.yawT=null; sqTarget(q,true); }
    if(q.state==="run"){ const sp=SQK[q.kind].s*.4+.2, dX=q.tX-q.Xw, dD=q.tD-q.Dw, dist=Math.hypot(dX,dD*.25)||1e-6;
      if(q.yawT==null) q.yawT=Math.atan2(trueZ(q.tD)-trueZ(q.Dw),q.tX-q.Xw);                              /* face the way it's going once, at the start of the dash, so it never jitters round */
      q.yaw=angTo(q.yaw,q.yawT,dt*14);
      const fr=Math.min(1,sp*dt/dist); q.Xw+=dX*fr; q.Dw+=dD*fr;                                            /* a fraction of the remaining way: it can never overshoot and bounce back */
      q.ph+=dt*(q.kind==="chip"?22:17);
      const stuck=dist>=q.lastD-1e-6; q.lastD=dist;
      if(fr>=1||dist<.004||stuck){ q.yawT=null; const r=Math.random(); q.state= r<.4? "sit" : "pause"; q.st=0; q.dur= q.state==="sit"? rnd(1.6,4) : rnd(.3,1.4); } }
    else { q.st+=dt; if(q.state==="sit") q.ph+=dt*2;
      if(q.st>q.dur){ q.state="run"; q.yawT=null; sqTarget(q,Math.random()<.3); } }
    if(q.state!=="run") keepOnLawn(q);
  }
  function drawSquirrel(q,dt,dark){
    stepSquirrel(q,dt); if(q.gone||q.t<0) return;
    const s=toScreen(q.Xw,q.Dw), K=SQK[q.kind], k=.16*s.g/26*K.s*1.35;
    q.ct=(q.ct||0)-dt; if(q.ct<=0||!q.pal){ q.ct=1.5; const G=groundPal(s,dark), lit=dark?.45:.64;
      q.pal={...G, fur:mulv(K.fur,lit), belly:mulv(K.belly,lit), tail:mulv(K.tail,lit), tail2:mulv(K.tail2,lit*.95), dk:mulv([46,30,20],lit), wh:mulv([236,228,212],lit)}; }
    if(!q.blades) q.blades=Array.from({length:6},()=>({ox:rnd(-10,10),h:rnd(2,3.5),lean:rnd(-.5,.5),c:Math.random()}));
    critterBlit(null,null,q,s,k,q.pal,()=>squirrelParts(q,q.pal),q.yaw,26,30,7,q.blades,q.alpha);
  }
  /* ================= dusk, mist, bats, doe and fawn, hummingbird, hen turkey with poults, June 19th, tap-to-identify ================= */
  const MOBILE=()=>W<700, JUNE19=(()=>{ const d=new Date(); return d.getMonth()===5&&d.getDate()===19; })();
  /* ---- a slow dusk: over the first several minutes the sky deepens, Venus comes out, then a few stars ---- */
  let duskV=0; const stars=[]; let starNext=0, venNext=12, venB=null;
  function starBurst(x,y,e,L){ if(e<=.01) return; const l=L*(.5+.5*e);                                                   /* a "+" of light: four fine spikes and a soft glow, like a lens catching a star */
    const g=ctx.createRadialGradient(x,y,0,x,y,l*.45); g.addColorStop(0,`rgba(255,252,240,${(.75*e).toFixed(3)})`); g.addColorStop(1,"rgba(240,236,255,0)"); ctx.fillStyle=g; ctx.fillRect(x-l*.5,y-l*.5,l,l);
    for(const [dx,dy,k] of [[1,0,1],[-1,0,1],[0,1,1],[0,-1,1],[.7,.7,.38],[-.7,.7,.38],[.7,-.7,.38],[-.7,-.7,.38]]){ const ll=l*k, sg=ctx.createLinearGradient(x,y,x+dx*ll,y+dy*ll);
      sg.addColorStop(0,`rgba(255,250,236,${(.9*e*(k<1?.5:1)).toFixed(3)})`); sg.addColorStop(1,"rgba(240,236,255,0)"); ctx.strokeStyle=sg; ctx.lineWidth=k<1?.7:1.2; ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x+dx*ll,y+dy*ll); ctx.stroke(); } }
  function stepDusk(dt){ duskV=Math.min(.62,duskV+dt/420); natureSfx.setDusk&&natureSfx.setDusk(Math.min(1,duskV/.62)); }
  function drawDusk(dark){
    const d=duskV; if(d<=.01) return; const hz=gnd().vy;
    const g=ctx.createLinearGradient(0,0,0,hz+20); g.addColorStop(0,`rgba(16,20,48,${(.5*d).toFixed(3)})`); g.addColorStop(.7,`rgba(40,30,60,${(.22*d).toFixed(3)})`); g.addColorStop(1,"rgba(40,30,60,0)");
    ctx.fillStyle=g; ctx.fillRect(0,0,W,hz+20);
    { const lg=ctx.createLinearGradient(0,hz-50,0,hz+70); lg.addColorStop(0,"rgba(12,10,20,0)"); lg.addColorStop(1,`rgba(12,10,20,${(.16*d).toFixed(3)})`); ctx.fillStyle=lg; ctx.fillRect(0,hz-50,W,H-hz+50+Math.abs(camY)+40); }   /* the land dims a little too, eased in so there's no seam at the horizon */
    if(!stars.length) for(let i=0;i<(MOBILE()?26:46);i++) stars.push({x:Math.random(),y:Math.random()*.42,r:rnd(.4,1.1),ph:rnd(0,6),on:rnd(.25,.6)});
    const sp=sun(), ve=[sp.x-W*.16,sp.y-H*.17];                                                            /* Venus, the evening star, first to show */
    if(d>.18){ const a=Math.min(1,(d-.18)/.15); ctx.save(); ctx.globalCompositeOperation="lighter"; const gl=ctx.createRadialGradient(ve[0],ve[1],0,ve[0],ve[1],9); gl.addColorStop(0,`rgba(255,250,236,${(.95*a).toFixed(2)})`); gl.addColorStop(.25,`rgba(255,240,210,${(.35*a).toFixed(2)})`); gl.addColorStop(1,"rgba(255,240,210,0)"); ctx.fillStyle=gl; ctx.fillRect(ve[0]-9,ve[1]-9,18,18); ctx.restore(); }
    ctx.save(); ctx.globalCompositeOperation="lighter";
    if(t>starNext){ starNext=t+rnd(.5,2.2); const vis=stars.filter(s=>(d/.62-s.on)>.1); if(vis.length) pick(vis).burst=t; }       /* every so often one star flares */
    for(const s of stars){ const b0=Math.max(0,Math.min(1,(d/.62-s.on)/.25)); if(b0<=.02) continue;
      const tw=.62+.22*Math.sin(t*1.7+s.ph)+.16*Math.sin(t*(6.3+s.r*4)+s.ph*3)+(Math.random()-.5)*.14, a=b0*Math.max(0,tw), x=s.x*W, y=s.y*hz;   /* the air makes them scintillate */
      if(Math.hypot(x-sp.x,y-sp.y)<W*.18) continue; if(moonAt&&Math.hypot(x-moonAt[0],y-moonAt[1])<moonAt[2]*1.08) continue;   /* the dark side of the moon still hides the stars behind it */ ctx.fillStyle=`rgba(240,238,255,${(a*.8).toFixed(2)})`; ctx.beginPath(); ctx.arc(x,y,s.r,0,6.283); ctx.fill();
      if(s.burst!=null){ const u=(t-s.burst)/1.1; if(u>=1) s.burst=null; else starBurst(x,y,b0*Math.sin(Math.PI*u)**1.5,12+s.r*14); } }
    if(d>.18&&t>venNext){ venNext=t+rnd(9,20); venB=t; }
    if(venB!=null){ const u=(t-venB)/1.4; if(u>=1) venB=null; else starBurst(ve[0],ve[1],Math.min(1,(d-.18)/.15)*Math.sin(Math.PI*u)**1.5,16); }
    ctx.restore();
  }
  /* ---- ground mist gathering in the low field, catching the last light ---- */
  const mistSpr=(()=>{ const c=document.createElement("canvas"); c.width=256; c.height=64; const x=c.getContext("2d"); const g=x.createRadialGradient(128,32,0,128,32,128); g.addColorStop(0,"rgba(255,255,255,.55)"); g.addColorStop(.5,"rgba(255,255,255,.22)"); g.addColorStop(1,"rgba(255,255,255,0)"); x.setTransform(1,0,0,.25,0,24); x.fillStyle=g; x.fillRect(0,-96,256,256); return c; })();
  const mists=[];
  function drawMist(dark){
    if(!mists.length) for(let i=0;i<(MOBILE()?7:12);i++) mists.push({x:Math.random(),y:Math.random(),w:rnd(.25,.5),sp:rnd(.004,.012)*(Math.random()<.5?-1:1),ph:rnd(0,6)});
    const hz=gnd().vy, a0=.1+.32*Math.min(1,duskV/.62), sp=sun();
    for(const m of mists){ m.x+=m.sp*.016; if(m.x<-.3) m.x=1.3; if(m.x>1.3) m.x=-.3;
      const x=m.x*W, y=hz+lawnMinG(x)*(.45+m.y*.5), w=m.w*W, h=w*.13, warm=Math.max(0,1-Math.abs(x-sp.x)/(W*.5));
      ctx.globalAlpha=a0*(.6+.4*Math.sin(t*.2+m.ph)); ctx.drawImage(mistSpr,x-w/2,y-h/2,w,h);
      if(warm>.05){ ctx.globalAlpha=a0*warm*.35; ctx.globalCompositeOperation="lighter"; ctx.drawImage(mistSpr,x-w/2,y-h/2,w,h); ctx.globalCompositeOperation="source-over"; } }
    ctx.globalAlpha=1;
  }
  /* ---- little brown bats, out as the light fades, flitting erratically over the lawn and along the tree line ---- */
  const bats=[];
  function drawBats(dt,dark){
    const want=duskV>.22? (MOBILE()?1:2) : 0, F=H*.5, cx=W/2, cy=H*.52;
    while(bats.length<want) bats.push({x:rnd(W*.1,W*.9),y:rnd(H*.08,gnd().vy*.6),z:rnd(2.5,6),vx:rnd(-60,60),vy:0,vz:0,ph:rnd(0,6),f:rnd(52,64),tw:0});
    if(bats.length>want) bats.length=want;
    const a=Math.min(1,(duskV-.22)/.15); if(a<=0) return;
    ctx.save();
    for(const b of bats){ b.tw-=dt; if(b.tw<=0){ b.tw=rnd(.15,.6); b.ax=rnd(-260,260); b.ay=rnd(-200,200); b.az=rnd(-3,3); }             /* sudden jinks after insects, in every direction */
      b.vx+=(b.ax||0)*dt; b.vy+=(b.ay||0)*dt; b.vz+=(b.az||0)*dt; b.vx*=.94; b.vy*=.94; b.vz*=.92; b.x+=b.vx*dt*(4/b.z); b.y+=b.vy*dt*(4/b.z); b.z=Math.max(1.6,Math.min(8,b.z+b.vz*dt));
      const top=H*.05, bot=gnd().vy*.7; if(b.y<top) b.vy+=200*dt; if(b.y>bot) b.vy-=200*dt; if(b.x<-20) b.x=W+20; if(b.x>W+20) b.x=-20;
      b.ph+=dt*b.f; const P=[(b.x-cx)*b.z/F,(b.y-cy)*b.z/F,b.z], V=b.pp? [P[0]-b.pp[0],P[1]-b.pp[1],P[2]-b.pp[2]] : [1,0,0]; b.pp=P;
      if(Math.hypot(...V)>1e-7) b.V=b.V? b.V.map((v,i)=>lerp(v,V[i],.25)) : V;
      if(!b.sky||(b.skyT=(b.skyT||0)-1)<=0){ b.skyT=10; const ip=toImg(b.x,b.y); b.sky=(ip&&ip[0]>=0&&ip[0]<=1&&ip[1]>=0&&ip[1]<=1&&sampleAt(ip[0],ip[1]))||[150,120,100]; }
      const hz=Math.min(.7,.12+(b.z-1.6)/9), sp=sun(), glow=Math.max(0,1-Math.hypot(b.x-sp.x,b.y-sp.y)/(W*.35));         /* hazed toward the sky behind it, more with distance and near the sun */
      ctx.fillStyle=ctx.strokeStyle=rgb(mixv([22,16,14],b.sky,Math.min(.85,hz+glow*.25)),.88*a); 
      bat3D(ctx,P,b.V||V,b.ph,(X3,Y3,Z3)=>{ const zz=Math.max(.05,Z3); return [cx+X3*F/zz,cy+Y3*F/zz]; },.0105); }
    ctx.restore();
  }
  /* ---- a doe steps out with her spotted fawn: she grazes and keeps watch, the fawn sticks close and copies her ---- */
  let doe=null, nextDoe=50;
  function startDoe(){ const sx=rnd(W*.55,W*.92), p=toGround(sx,gnd().vy+lawnMinG(sx)-4);
    doe={Xw:p.Xw,Dw:p.Dw,yaw:Math.PI*rnd(.4,.6),q:0,hd:.2,hy:0,state:"walk",st:0,alpha:0,legs:3+Math.floor(Math.random()*3),
      fawn:{Xw:p.Xw,Dw:p.Dw,yaw:Math.PI*.5,q:0,hd:0,hy:0,lag:[]}}; doeTarget(); }
  function doeTarget(){ const s=toScreen(doe.Xw,doe.Dw), sx=Math.max(W*.3,Math.min(W*.95,s.x+rnd(-1,1)*rnd(60,150))), lo=lawnMinG(sx), p=toGround(sx,gnd().vy+lo+rnd(14,70)); doe.tX=p.Xw; doe.tD=p.Dw; }
  function stepDoe(dt){
    if(!doe){ nextDoe-=dt; if(nextDoe<=0&&!(buck&&buck.onLawn)){ startDoe(); } return; }
    const d=doe; d.st+=dt; d.alpha=d.leaving? Math.max(0,d.alpha-dt*.8) : Math.min(1,d.alpha+dt*.8);
    if(d.leaving&&d.alpha<=0){ doe=null; nextDoe=rnd(120,220); return; }
    if(d.state==="walk"){ const dX=d.tX-d.Xw, dD=d.tD-d.Dw, dist=Math.hypot(dX,dD*.25)||1e-6, sp=d.leaving? .42 : .11, fr=Math.min(1,sp*dt/dist);
      d.Xw+=dX*fr; d.Dw+=dD*fr; const want=Math.atan2(trueZ(d.tD)-trueZ(d.Dw),d.tX-d.Xw); d.yaw=angTo(d.yaw,want,dt*1.4); d.q+=dt*4.2;
      d.hd+=(.15-d.hd)*Math.min(1,dt*3); d.walking=true;
      if(fr>=1){ d.walking=false; d.legs--; if(d.legs<0&&!d.leaving){ d.leaving=true; const sx=toScreen(d.Xw,d.Dw).x, p=toGround(sx,gnd().vy+lawnMinG(sx)-6); d.tX=p.Xw; d.tD=p.Dw; d.state="walk"; } else { d.state=Math.random()<.65?"graze":"watch"; d.st=0; d.dur=d.state==="graze"? rnd(4,8) : rnd(2,4); } } }
    else { d.walking=false; d.hd+=((d.state==="graze"? 1 : -.05)-d.hd)*Math.min(1,dt*2); if(d.state==="watch"){ d.jt=(d.jt||0)-dt; if(d.jt<=0){ d.jt=rnd(.8,2); d.hyT=rnd(-.9,.9); } d.hy+=((d.hyT||0)-d.hy)*Math.min(1,dt*5); } else d.hy*=.9;
      if(d.st>d.dur){ d.state="walk"; d.st=0; doeTarget(); } }
    /* the fawn: follows a little behind and to one side, and does what she did a moment ago */
    const f=d.fawn; f.lag.push([d.hd,d.walking]); if(f.lag.length>25) f.lag.shift();
    const ds=toScreen(d.Xw,d.Dw), side=d.side||(d.side=Math.random()<.5?-1:1), off=toGround(ds.x+side*ds.g*.16-Math.cos(d.yaw)*ds.g*.08, ds.y-ds.g*.02), dX=off.Xw-f.Xw, dD=off.Dw-f.Dw, dist=Math.hypot(dX,dD*.25);
    if(dist>.02){ const fr=Math.min(1,.16*dt/dist); f.Xw+=dX*fr; f.Dw+=dD*fr; f.walking=true; f.yaw=angTo(f.yaw,Math.atan2(trueZ(off.Dw)-trueZ(f.Dw),dX),dt*3); f.q+=dt*7; }
    else { f.walking=false; f.yaw=angTo(f.yaw,d.yaw,dt*1.5); }
    f.hd+=((f.lag[0]?f.lag[0][0]:0)*(f.walking?.4:1)-f.hd)*Math.min(1,dt*3); f.hy=Math.sin(t*.7)*.3;
  }
  function deerPose(o,scale,spots){ const s=toScreen(o.Xw,o.Dw); return {x:s.x,y:s.y,g:s.g*scale,Xw:o.Xw,Dw:o.Dw,lift:0,leapU:null,stand:!o.walking,walk:!!o.walking,antlers:false,hd:o.hd,hy:o.hy,q:o.q,spots}; }
  /* ---- a ruby-throated hummingbird, in true 3D: it shoots in out of the evening toward you, stops dead and hovers an arm's length away,
     body tilted up, wings a blur, turning to look you over, then darts off back into the distance ---- */
  /* the close-up visitors take turns: only one at a time comes past the camera */
  function stageBusy(){ return !!(cmon||ban||eag||hero||bbFlock||(pecker&&pecker.state==="approach")||jays||pf||hum||(hawkG&&hawkG.state==="approach")); }
  let hum=null, nextHum=45; const hcv=document.createElement("canvas"), hcx=hcv.getContext("2d");
  function hum3D(x,P,f0,beat,proj,C){
    const nrm=v=>{ const l=Math.hypot(v[0],v[1],v[2])||1; return [v[0]/l,v[1]/l,v[2]/l]; }, crs=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
    const fh=nrm([f0[0],0,f0[2]]), tilt=f0[3]||0, f=nrm([fh[0],-tilt,fh[2]]), r=nrm(crs(f,[0,-1,0])), u=crs(r,f), K=.02;
    const W3=(a,b,c)=>[P[0]+(f[0]*a+r[0]*b+u[0]*c)*K, P[1]+(f[1]*a+r[1]*b+u[1]*c)*K, P[2]+(f[2]*a+r[2]*b+u[2]*c)*K], S=(a,b,c)=>{ const w=W3(a,b,c); return proj(w[0],w[1],w[2]); };
    const front=(f[2]<0);                                                                                 /* facing you: you see its white front and ruby throat */
    const wingFan=sd=>{ const sh=S(.8,sd*1.2,.6), pts=[sh]; for(let i=0;i<=8;i++){ const th=-1.15+i/8*2.3; pts.push(S(.8+Math.sin(th)*4.6,sd*(1.2+Math.cos(th)*5.6),.6+Math.cos(th)*.8)); }
      x.fillStyle="rgba(214,222,208,.2)"; x.beginPath(); x.moveTo(pts[0][0],pts[0][1]); for(const q of pts) x.lineTo(q[0],q[1]); x.closePath(); x.fill();           /* the blur of the wingbeat */
      const th=Math.sin(beat)*1.15, tp=S(.8+Math.sin(th)*4.6,sd*(1.2+Math.cos(th)*5.6),.6+Math.cos(th)*.8);
      x.strokeStyle="rgba(170,180,170,.45)"; x.lineWidth=Math.max(.8,Math.hypot(tp[0]-sh[0],tp[1]-sh[1])*.12); x.beginPath(); x.moveTo(sh[0],sh[1]); x.lineTo(tp[0],tp[1]); x.stroke(); };
    const q=sd=>{ const w=W3(.8,sd*3,0); return w[0]*w[0]+w[1]*w[1]+w[2]*w[2]; }, far=q(-1)>q(1)? -1 : 1;
    wingFan(far);
    const HP=W3(3.4,0,.5), hd=proj(HP[0],HP[1],HP[2]), btW=[HP[0]+fh[0]*5*K,HP[1]+fh[1]*5*K,HP[2]+fh[2]*5*K], bt=proj(btW[0],btW[1],btW[2]);   /* the bill points straight ahead, level */
    const tl=S(-5.2,0,-.2), tl2=S(-6.6,0,-.4), bc=S(0,0,0), wR=Math.max(1,Math.hypot(...[0,1].map(i=>S(0,1.6,0)[i]-bc[i])));
    x.lineCap="round"; x.strokeStyle=C([34,58,40]); x.lineWidth=wR*1.1; x.beginPath(); x.moveTo(tl[0],tl[1]); x.lineTo(tl2[0],tl2[1]); x.stroke();     /* tail */
    x.strokeStyle=C(front? [214,212,198] : [70,136,78]); x.lineWidth=wR*2.1; x.beginPath(); x.moveTo(tl[0],tl[1]); x.lineTo(bc[0],bc[1]); x.stroke();   /* body: pale front, green back */
    if(front){ const g1=S(2,0,-.6); x.strokeStyle=C([70,136,78]); x.lineWidth=wR*1.2; x.beginPath(); x.moveTo(S(-3,1.4,.4)[0],S(-3,1.4,.4)[1]); x.lineTo(S(1.6,1.3,.6)[0],S(1.6,1.3,.6)[1]); x.moveTo(S(-3,-1.4,.4)[0],S(-3,-1.4,.4)[1]); x.lineTo(S(1.6,-1.3,.6)[0],S(1.6,-1.3,.6)[1]); x.stroke();   /* green flanks */
      x.fillStyle=rgb([238,24,40]); x.beginPath(); x.arc(g1[0],g1[1],wR*1.05,0,6.283); x.fill(); x.fillStyle="rgba(255,120,110,.6)"; x.beginPath(); x.arc(g1[0]-wR*.25,g1[1]-wR*.25,wR*.4,0,6.283); x.fill(); }                    /* the ruby gorget */
    x.fillStyle=C([62,124,72]); x.beginPath(); x.arc(hd[0],hd[1],wR*.95,0,6.283); x.fill();
    for(const sd of [-1,1]){ const e=S(3.9,sd*.9,.9); x.fillStyle="rgba(8,6,6,.95)"; x.beginPath(); x.arc(e[0],e[1],Math.max(.6,wR*.22),0,6.283); x.fill(); }
    x.strokeStyle=C([26,22,20]); x.lineWidth=Math.max(.6,wR*.18); x.beginPath(); x.moveTo(hd[0],hd[1]); x.lineTo(bt[0],bt[1]); x.stroke();     /* the long needle bill */
    wingFan(-far);
  }
  /* a ruby-throated hummingbird built like the other animals: shaded 3D forms for the body, an iridescent green back, a pale front,
     the ruby gorget catching the light, a small round head with its white eye-spot, the long level needle bill, a forked dark tail,
     and long swept wings that show only as a figure-eight blur with a ghost of the wing at the end of each stroke */
  function humParts(th,beat,lt){
    const C=c=>rgb(mulv(c,lt)), parts=[], ct=Math.cos(th), st=Math.sin(th), S=(s,o=0,z=0,r=1)=>[s*ct+o*st, s*st-o*ct, z, r];   /* o: offset toward the belly */
    const G=[64,110,70], G2=[96,140,88], WH=[222,220,206], RU=[176,18,44];
    const sh=[C(mulv(G,.55)),C(mixv(G,[255,230,170],.3))];
    parts.push({p:[S(-3.2,0,0,.85),S(-5.6,.2,-.5,.3)],c:C([34,46,38])},{p:[S(-3.2,0,0,.85),S(-5.6,.2,.5,.3)],c:C([34,46,38])});   /* the forked tail */
    parts.push({p:[S(-3.2,0,0,1.1),S(-1.2,0,0,1.85),S(.7,0,0,1.85),S(1.9,0,0,1.3)],c:C(G),sh});                                      /* body: green back and flanks */
    parts.push({p:[S(-2.4,.75,0,.7),S(-1,.85,0,1.1),S(.3,.8,0,1.15)],c:C([168,170,156]),sh:[C([120,124,112]),C([186,186,172])],bias:-.05});                  /* pale front */
    parts.push({p:[S(1.1,.85,0,.75)],c:C([226,224,212]),bias:-.07});                                                                 /* white collar under the gorget */
    parts.push({p:[S(1.5,.98,0,1.05),S(2.55,.78,0,.95)],c:rgb([236,22,40]),sh:[rgb([168,8,26]),rgb([255,86,90])],bias:-.08});   /* the ruby gorget, blazing red */                                                   /* the ruby gorget, mostly dark until it catches the light */
    parts.push({p:[S(2.2,1.45,.45,.22),S(2.5,1.3,.4,.16)],c:rgb([255,70,72]),bias:-.12});   /* its glint */
    const hc=[3.0*ct-.2,3.0*st+.6,0];                                                                                                  /* the head sits nearly level whatever the body does */
    parts.push({p:[[hc[0],hc[1],0,1.42]],c:C(G),sh});
    for(const sd of [-1,1]){ parts.push({p:[[hc[0]+.45,hc[1]+.25,sd*1.05,.26]],c:"rgba(8,6,6,.96)",bias:-.2}); parts.push({p:[[hc[0]-.25,hc[1]+.2,sd*1.12,.14]],c:C(WH),bias:-.18}); }
    parts.push({p:[S(-2.2,-.9,0,.9),S(.2,-1.1,0,1.05)],c:C([92,150,96]),bias:-.03});                                                     /* the bright iridescent back */
    parts.push({p:[[hc[0]+1.2,hc[1]-.15,0,.22],[hc[0]+6.2,hc[1]-.35,0,.07]],c:C([24,20,20]),bias:-.1});                                  /* the needle bill, held level */
    /* wings: a figure-eight stroke, mostly forward and back, seen as a blur */
    const R=S(.3,-.4,0,0), wingAt=(sd,ph)=>{ const d=[Math.sin(ph)*.9,.18,sd*Math.cos(ph)], pp=[-Math.cos(ph)*.9,0,sd*Math.sin(ph)], P=(a,b,r)=>[R[0]+d[0]*a+pp[0]*b,R[1]+d[1]*a+pp[1]*b,R[2]+d[2]*a+pp[2]*b,r];
      return [P(.4,.5),P(2.4,1.25),P(5.2,1.1),[...P(7.6,.15).slice(0,3),-1],P(4.9,-.3),P(1.8,-.4)]; };
    for(const sd of [-1,1]){ const fan=[[R[0],R[1],R[2],0]]; for(let i=0;i<=8;i++){ const ph=-1.15+i/8*2.3; fan.push(wingAt(sd,ph)[3].slice(0,3).concat([0])); }
      parts.push({poly:true,p:fan,c:"rgba(150,160,150,.3)",bias:6}); parts.push({poly:true,p:wingAt(sd,Math.sin(beat)*1.15),c:"rgba(56,64,58,.55)",bias:5.5}); }
    return parts;
  }
  function drawHum(dt,dark){
    nextHum-=dt; if(!hum&&nextHum<=0&&stageBusy()) nextHum=rnd(12,25); if(!hum&&nextHum<=0){ const sp=sun(); hum={t:0,fx:sp.x+rnd(-W*.25,W*.15),fy:sp.y+H*rnd(.1,.25),hx:W*rnd(.3,.7),hy:H*rnd(.32,.55),ex:Math.random()<.5? -.2*W : 1.2*W,ey:H*rnd(.15,.4),beat:0}; }
    if(!hum) return; const h=hum; h.t+=dt; h.beat+=dt*Math.PI*2*28; const T=h.t, F=H*.5, cx=W/2, cy=H*.52, zH=.5;
    let z, sx, sy, look=0;
    if(T<1.3){ const u=T/1.3, e=u*u*(3-2*u); z=9*Math.pow(zH/9,e); const ev=(1/9-1/z)/(1/9-1/zH); sx=lerp(h.fx,h.hx,ev); sy=lerp(h.fy,h.hy,ev)-Math.sin(ev*Math.PI)*30; }   /* shooting in toward you */
    else if(T<4.6){ z=zH+Math.sin(T*1.7)*.05; sx=h.hx+Math.sin(T*2.6)*16+Math.sin(T*9)*3; sy=h.hy+Math.sin(T*2.1)*9+Math.cos(T*11)*2; look=Math.sin(T*1.9)*.7; }   /* hovering, darting a little, turning its head to you */
    else { const u=Math.min(1,(T-4.6)/.8), e=u*u; z=zH*Math.pow(10/zH,e); const ev=(1/zH-1/z)/(1/zH-1/10); sx=lerp(h.hx,h.ex,ev); sy=lerp(h.hy,h.ey,ev); if(u>=1){ hum=null; nextHum=rnd(90,170); natureSfx.humSet&&natureSfx.humSet(0,0); return; } }
    { const pan=(sx/W*2-1)*.95, vol=Math.min(.38,.15/z); natureSfx.humSet&&natureSfx.humSet(pan,vol); h.chT=(h.chT||rnd(.8,2))-dt; if(h.chT<=0){ h.chT=rnd(1.2,2.6); natureSfx.humChip&&natureSfx.humChip(pan); } }   /* heard where it is, louder up close */
    const P=[(sx-cx)*z/F,(sy-cy)*z/F,z], V=h.pp? [P[0]-h.pp[0],P[1]-h.pp[1],P[2]-h.pp[2]] : [0,0,-1]; h.pp=P; h.sx=sx; h.sy=sy;
    if(Math.hypot(...V)>1e-7) h.V=h.V? h.V.map((v,i)=>lerp(v,V[i],.2)) : V;
    let fdir=h.V||V; const hov=T>=1.3&&T<4.6; if(hov) fdir=[Math.sin(look)*.6,0,-1];                           /* hovering: it faces you */
    if(Math.hypot(fdir[0],fdir[2])<1e-6) fdir=[0,0,-1]; fdir=[fdir[0],fdir[1],fdir[2],hov? 1.1 : .45];                 /* body tilted up, steeply when hovering */
    const u=.02*F/z, sz=Math.ceil(Math.min(1600,30*u)); if(hcv.width<sz||hcv.height<sz){ hcv.width=hcv.height=sz; }
    const x=hcx; x.setTransform(1,0,0,1,0,0); x.clearRect(0,0,hcv.width,hcv.height); x.translate(sz/2,sz/2);
    const yaw=hov? -Math.PI/2+look*.8 : Math.atan2(fdir[2],fdir[0]), pitch=Math.atan2(P[1],P[2])*.9;                       /* we see it from where we really are: from below when it's above us */
    rigDraw(x,humParts(hov?1.0:.35,h.beat,dark?.55:.78),rigView(yaw,pitch),u);
    x.setTransform(1,0,0,1,0,0); rigLight(x,sz/2,sz*.3,sz*.7,sz*.4,sun().x-sx,0);
    if(u>3){ x.save(); x.globalCompositeOperation="source-atop";                                                       /* feathers: rows of overlapping scalloped contour feathers, each with a dark base and an iridescent edge that shimmers as it moves */
      x.beginPath(); x.ellipse(sz/2,sz/2+u*.2,u*2.4,u*5.2,0,0,6.283); x.clip();                                    /* only on the body, not the wing blur */
      const fs=u*.44, J=(i,j)=>{ const v=Math.sin(i*127.1+j*311.7)*43758.5453; return v-Math.floor(v); }, rows=Math.ceil(u*11/(fs*.62)), cols=Math.ceil(u*5.4/fs)+1, x0=sz/2-u*2.7, y0=sz/2-u*5.4;
      for(let r=0;r<rows;r++){ const yy=y0+r*fs*.62, off=(r%2)*fs*.5;
        for(let c=0;c<cols;c++){ const jx=J(r,c), jy=J(c,r+7), xx=x0+c*fs+off+(jx-.5)*fs*.5, yy2=yy+(jy-.5)*fs*.35, sh=.5+.5*Math.sin(T*3+c*.7+r*.45+jx*4), fr=fs*(.42+jx*.2);
          x.lineWidth=Math.max(.5,fs*.11); x.strokeStyle=`rgba(12,22,14,${(.16+.14*jy).toFixed(3)})`; x.beginPath(); x.arc(xx,yy2,fr,(.15+jy*.1)*Math.PI,(.85-jx*.1)*Math.PI); x.stroke();          /* the shadowed edge of the feather above */
          x.lineWidth=Math.max(.5,fs*.09); x.strokeStyle=`rgba(${r<rows*.45?"190,240,170":"255,236,220"},${(.08+.16*sh).toFixed(3)})`; x.beginPath(); x.arc(xx,yy2-fs*.12,fr*.92,.2*Math.PI,.8*Math.PI); x.stroke(); } }   /* its lit, iridescent tip */
      const gx=sz/2+Math.sin(T*2.2)*u*1.4, gy=sz/2-u*1.6, gl=x.createRadialGradient(gx,gy,0,gx,gy,u*2.6); gl.addColorStop(0,"rgba(200,255,190,.26)"); gl.addColorStop(1,"rgba(200,255,190,0)"); x.fillStyle=gl; x.fillRect(0,0,sz,sz);
      x.restore(); }
    /* the evening light on it: warm on the sun side, hazing into the sky with distance, toned like the photo */
    x.globalCompositeOperation="source-atop"; const sp=sun(), sdx=Math.sign(sp.x-sx)||1;
    x.fillStyle="rgba(255,160,76,.2)"; x.fillRect(0,0,sz,sz);
    const rl=x.createLinearGradient(sz/2-sdx*sz*.2,0,sz/2+sdx*sz*.2,0); rl.addColorStop(0,"rgba(20,12,6,.22)"); rl.addColorStop(.6,"rgba(255,196,120,0)"); rl.addColorStop(1,"rgba(255,196,120,.3)"); x.fillStyle=rl; x.fillRect(0,0,sz,sz);
    if(!h.bg||(h.bgT=(h.bgT||0)-1)<=0){ h.bgT=6; const ip=toImg(sx,sy); h.bg=(ip&&ip[0]>=0&&ip[0]<=1&&ip[1]>=0&&ip[1]<=1&&sampleAt(ip[0],ip[1]))||[200,170,130]; }
    const haze=Math.min(.75,Math.max(0,(z-1)/7)); if(haze>0){ x.fillStyle=rgb(h.bg,haze); x.fillRect(0,0,sz,sz); }
    if(SC.dim()){ x.fillStyle="rgba(20,14,6,.14)"; x.fillRect(0,0,sz,sz); } else { const tn=tint(); if(tn.a>0){ x.globalAlpha=tn.a; x.fillStyle=tn.c; x.fillRect(0,0,sz,sz); x.globalAlpha=1; } }
    x.globalCompositeOperation="source-over";
    ctx.save(); ctx.globalAlpha=Math.min(1,T/.25); ctx.filter="blur(.7px)"; ctx.drawImage(hcv,0,0,sz,sz,sx-sz/2,sy-sz/2,sz,sz); ctx.restore(); ctx.filter="none";
  }
  /* ---- a hen turkey leads a string of little poults across the lawn edge, pecking as they go ---- */
  let hen=null, nextHen=95;
  function startHen(){ const ltr=Math.random()<.5, sx=ltr? -30 : W+30, gy=lawnMinG(ltr? W*.1 : W*.9)+rnd(10,40), p=toGround(sx,gnd().vy+gy), q=toGround(ltr? W+40 : -40,gnd().vy+gy+rnd(-10,20));
    hen={Xw:p.Xw,Dw:p.Dw,tX:q.Xw,tD:q.Dw,yaw:ltr?0:Math.PI,ph:0,peck:0,pt:0,alpha:1,trail:[],chicks:Array.from({length:4+Math.floor(Math.random()*4)},(_,i)=>({i,Xw:p.Xw,Dw:p.Dw,yaw:ltr?0:Math.PI,ph:rnd(0,6),peck:0,pt:rnd(0,2),jit:rnd(-1,1)}))}; }
  function stepHen(dt){
    if(!hen){ nextHen-=dt; if(nextHen<=0) startHen(); return; }
    const h=hen; h.pt-=dt; if(h.pt<=0){ h.pt=rnd(1.5,4); h.stop=Math.random()<.5? rnd(.8,1.8) : 0; }
    if(h.stop>0){ h.stop-=dt; h.peck=Math.max(0,Math.sin(t*9)); } else { h.peck=0; const dX=h.tX-h.Xw, dD=h.tD-h.Dw, dist=Math.hypot(dX,dD*.25)||1e-6, fr=Math.min(1,.06*dt/dist); h.Xw+=dX*fr*(h.spdK||1); h.Dw+=dD*fr*(h.spdK||1); h.ph+=dt*6*(h.spdK?2:1); if(fr>=1){ hen=null; nextHen=rnd(140,240); return; } }
    h.trail.unshift([h.Xw,h.Dw]); if(h.trail.length>260) h.trail.pop();
    for(const c of h.chicks){ const tr=h.trail[Math.min(h.trail.length-1,14+c.i*11)]; if(!tr) continue; const s=toScreen(tr[0],tr[1]), p=toGround(s.x,s.y+c.jit*6), dX=p.Xw-c.Xw, dD=p.Dw-c.Dw, dist=Math.hypot(dX,dD*.25);
      if(dist>.003){ const fr=Math.min(1,.1*dt/dist); c.Xw+=dX*fr; c.Dw+=dD*fr; c.ph+=dt*11; c.yaw=angTo(c.yaw,Math.atan2(trueZ(p.Dw)-trueZ(c.Dw),dX),dt*6); }
      c.pt-=dt; if(c.pt<=0){ c.pt=rnd(.5,2); } c.peck=c.pt<.35? Math.max(0,Math.sin(t*12+c.i)) : 0; }
  }
  function henParts(o,P,chick){
    const yaw=o.yaw, far=z=>z*Math.cos(yaw)>0, parts=[], q=o.ph, pk=o.peck;
    if(chick){ for(const sd of [-1,1]) parts.push({p:[[0,1.6,sd*.6,.3],[Math.sin(q+sd)*.4,0,sd*.6,.25]],c:rgb(P.leg)});
      parts.push({p:[[-1.6,2.6,0,1.5],[.6,2.8,0,1.7]],c:rgb(P.chick),sh:[rgb(mulv(P.chick,.7)),rgb(mixv(P.chick,[255,220,170],.3))]});
      parts.push({p:[[1.9-pk*.3,4.2-pk*2.2,0,1.05]],c:rgb(P.chick)}); parts.push({p:[[2.9-pk*.2,4-pk*2.3,0,.3]],c:rgb(P.leg),bias:-.1});
      for(const sd of [-1,1]) parts.push({p:[[2.2-pk*.3,4.5-pk*2.2,sd*.6,.22]],c:"rgba(10,6,4,.9)",bias:-.3}); return parts; }
    for(const sd of [-1,1]){ const sw=o.peck? 0 : Math.sin(q+(sd>0?Math.PI:0))*.5; parts.push({p:legChain(.6,6.4,sd*1.4,.7,[[3.4,sw,.45],[3.1,-.2+sw,.4]]),c:far(sd)?rgb(mulv(P.leg,.8)):rgb(P.leg)}); }
    parts.push({p:[[-6.4,8.4,0,2.4],[-2.6,9.4,0,4.4],[1.8,9.6,0,4.2],[4.2,10.6,0,2.8]],c:rgb(P.body),sh:[rgb(mulv(P.body,.6)),rgb(mixv(P.body,[255,210,150],.22))]});
    parts.push({p:[[-7.6,8.6,0,1.8],[-9.2,7.4,0,1.4]],c:rgb(P.band)});
    const nx=lerp(6,7.4,pk), ny=lerp(14.4,7,pk); parts.push({p:[[4.6,11.4,0,1.6],[nx-.5,ny-.6,0,.9]],c:rgb(P.head)});
    parts.push({p:[[nx,ny,0,1.15]],c:rgb(P.head)}); parts.push({p:[[nx+1.2,ny-.4,0,.42]],c:rgb(P.beak),bias:-.1});
    for(const sd of [-1,1]) parts.push({p:[[nx+.3,ny+.3,sd*.85,.26]],c:"rgba(10,6,4,.9)",bias:-.3});
    return parts;
  }
  function drawHenAll(dt,dark,L){
    stepHen(dt); if(!hen) return; const h=hen;
    const pal=o=>{ const s=toScreen(o.Xw,o.Dw); if(!o.pal||(o.ct=(o.ct||0)-dt)<=0){ o.ct=1.5; const G=groundPal(s,dark), lit=dark?.42:.6; o.pal={...G, body:mulv([74,58,44],lit), band:mulv([150,110,70],lit), head:mulv([110,120,150],lit), beak:mulv([170,150,110],lit), leg:mulv([160,120,110],lit), chick:mulv([176,146,96],lit)}; } return s; };
    { const s=pal(h); L.push({y:s.y,fn:()=>critterBlit(null,null,h,toScreen(h.Xw,h.Dw),.16*s.g/26*1.1,h.pal,()=>henParts(h,h.pal,false),h.yaw,24,30,8,null,h.alpha)}); }
    for(const c of h.chicks){ const s=pal(c); L.push({y:s.y,fn:()=>critterBlit(null,null,c,toScreen(c.Xw,c.Dw),.16*s.g/26*1.1,c.pal,()=>henParts(c,c.pal,true),c.yaw,10,12,3,null,1)}); }
  }
  /* ---- June 19th only: a pair of cardinals on the brush edge, and the fireflies come out in force ---- */
  const cards=[];
  function drawCardinals(dt,dark){
    if(!JUNE19) return; if(!cards.length){ const sx=W*rnd(.3,.45); for(let i=0;i<2;i++) cards.push({male:i===0,x:sx+i*26,hop:0,ht:rnd(1,3),face:i?-1:1}); }
    for(const c of cards){ c.ht-=dt; if(c.ht<=0){ c.ht=rnd(1.2,3.5); c.hop=1; c.face=Math.random()<.5?-1:1; c.x=Math.max(W*.2,Math.min(W*.6,c.x+c.face*rnd(6,18))); } c.hop=Math.max(0,c.hop-dt*3);
      const y=gnd().vy+lawnMinG(c.x)-16-Math.sin(c.hop*Math.PI)*6, lt=dark?.55:.8, C=v=>rgb(mulv(v,lt)), k=1.3;
      ctx.save(); ctx.translate(c.x,y); ctx.scale(k*c.face,k);
      ctx.fillStyle=C(c.male?[200,30,30]:[176,140,110]); ctx.beginPath(); ctx.ellipse(0,0,4,2.8,-.3,0,6.283); ctx.fill(); ctx.beginPath(); ctx.arc(3.4,-2.4,2,0,6.283); ctx.fill();
      ctx.beginPath(); ctx.moveTo(2.4,-3.6); ctx.lineTo(3,-6.2); ctx.lineTo(4.4,-3.8); ctx.closePath(); ctx.fill();                         /* crest */
      ctx.fillStyle=C(c.male?[180,24,24]:[200,80,60]); ctx.beginPath(); ctx.moveTo(-3.4,.6); ctx.lineTo(-8,2.6); ctx.lineTo(-7.4,.2); ctx.closePath(); ctx.fill();   /* tail */
      ctx.fillStyle=C([236,140,60]); ctx.beginPath(); ctx.moveTo(5.2,-2.6); ctx.lineTo(6.8,-2); ctx.lineTo(5.2,-1.4); ctx.closePath(); ctx.fill();   /* the thick orange bill */
      if(c.male){ ctx.fillStyle=C([20,10,10]); ctx.beginPath(); ctx.arc(4.6,-2,1,0,6.283); ctx.fill(); }
      ctx.restore(); }
  }
  /* ---- tap an animal to see what it is ---- */
  let tags=[]; const tagEl=document.createElement("div"); tagEl.className="scn-tag";   /* a host page can restyle the name labels with .scn-tag */
  tagEl.style.cssText="position:fixed;z-index:6;pointer-events:none;padding:6px 11px;border-radius:99px;background:rgba(24,18,12,.62);border:1px solid rgba(246,239,226,.22);color:#f6efe2;font:500 13px/1.3 system-ui,sans-serif;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);opacity:0;transition:opacity .25s;white-space:nowrap;transform:translate(-50%,-130%)";
  let tagTimer=null; document.addEventListener("DOMContentLoaded",()=>document.body.append(tagEl)); if(document.body) document.body.append(tagEl);
  function tag(x,y,r,name,minor){ if(x>-50&&x<W+50&&y>-50&&y<H+50&&isFinite(x)&&isFinite(y)) tags.push([x,y,r,name,!!minor]); }
  function collectTags(){
    tags=[]; const T=(o,n,r)=>{ if(o&&!o.gone){ const s=toScreen(o.Xw,o.Dw); tag(s.x,s.y-r*.6,r,n); } }, g=v=>Math.max(14,v);
    T(fox,"Red fox",30); T(skunk,"Striped skunk",24); T(cub,"Black bear cub",34); T(mom,"Black bear",60); T(bobcat,"Bobcat",30); T(coyote,"Gray fox",30); T(coy2,"Coyote",40); T(turtle,"Box turtle",16);
    T(dog,"Willow",34); T(lab,"Tulip",36); if(doe){ T(doe,"White-tailed doe",60); T(doe.fawn,"Fawn",34); }
    if(buck){ const p=buckPose(); tag(p.x,p.y-40,60,"White-tailed buck"); } if(buck2){ const p=buck2Pose(); tag(p.x,p.y-14,24,"White-tailed buck"); }
    for(const w of wcs) T(w,"American woodcock",18); for(const q of sqs) T(q,q.kind==="gray"?"Eastern gray squirrel":q.kind==="red"?"Red squirrel":"Eastern chipmunk",18);
    if(hen){ T(hen,"Wild turkey hen",26); for(const c of hen.chicks) T(c,"Turkey poult",14); }
    if(turks) for(const b of turks.birds) T(b,"Wild turkey",26);
    for(const bn of buns) tag(bn.x,bn.y-8,16,"Eastern cottontail");
    if(hawkG) tag(hawkG.x,hawkG.y-10,g(30*hawkG.m),"Red-tailed hawk"); if(eag){ const Pe=eagleAt(eag,eag.t/eag.dur); tag(W/2+Pe[0]*H*.5/Pe[2],H*.52+Pe[1]*H*.5/Pe[2],30,"Bald eagle"); } if(pecker) tag(pecker.x,pecker.y,g(16*pecker.m),"Pileated woodpecker");
    if(hero&&hero.sx!=null) tag(hero.sx,hero.sy,hero.tr||40,"Luna moth"); if(cmon&&cmon.sx!=null) tag(cmon.sx,cmon.sy,cmon.tr||40,"Monarch butterfly"); for(const m of mons) tag(m.sx,m.sy,Math.max(24,70/Math.max(1,m.z||3)),"Monarch butterfly");
    if(bbFlock) for(const b of bbFlock.birds) if(b.sx!=null) tag(b.sx,b.sy,24,"Eastern bluebird");
    if(hum&&hum.sx!=null) tag(hum.sx,hum.sy,40,"Ruby-throated hummingbird"); for(const b of bats) tag(b.x,b.y,16,"Little brown bat");
    for(const c of cards) tag(c.x,gnd().vy+lawnMinG(c.x)-16,14,c.male?"Northern cardinal":"Northern cardinal (female)");
    { const LEAFN={maple:"Sugar maple leaf",oak:"Red oak leaf",birch:"Yellow birch leaf",milkweed:"Milkweed seed"};
      for(const l of leaves) if(l.x!=null) tag(l.x,l.y,Math.max(10,(l.s||12)*1.2),LEAFN[l.kind]||"Leaf",true);
      if(bigL&&bigL.sx!=null) tag(bigL.sx,bigL.sy,Math.min(220,bigL.sS*1.2),LEAFN[bigL.kind]||"Leaf"); }
    for(const f of flies) tag(f.x,f.y,10,"Firefly",true);
    for(const m of motes2) tag(m.x,m.y,18,"Miller moth");
    for(const f of flocks){ const c=w2s(f.X,f.Y,f.Z); tag(c.x,c.y,Math.max(30,40*9/Math.max(4,f.Z)),"Canada geese"); }
    for(const q of covey) if(q.sx!=null) tag(q.sx,q.sy,q.sr,"Northern bobwhite"); if(grouse&&grouse.sx!=null) tag(grouse.sx,grouse.sy,grouse.sr,"Ruffed grouse"); if(pheas&&pheas.sx!=null) tag(pheas.sx,pheas.sy,pheas.sr,"Ring-necked pheasant");
    if(pheasW) T(pheasW,"Ring-necked pheasant",26);
    if(pf){ const F=H*.5; tag(W/2+pf.P[0]*F/pf.P[2],H*.52+pf.P[1]*F/pf.P[2],Math.min(260,.016*20*F/Math.max(.3,pf.P[2])),"Ring-necked pheasant"); }
    if(jays) for(const k of ["b0","b1"]){ const b=jays[k]; if(b&&b.pp){ const F=H*.5; tag(W/2+b.pp[0]*F/b.pp[2],H*.52+b.pp[1]*F/b.pp[2],Math.min(160,.011*18*F/Math.max(.3,b.pp[2])),"Blue jay"); } }
    if(ban&&ban.sx!=null) tag(ban.sx,ban.sy,90,"Eastern bluebirds"); for(const q of quails) if(q.sx!=null) tag(q.sx,q.sy,q.sr,"Northern bobwhite"); if(bbChase&&bbChase.sx!=null) tag(bbChase.sx,bbChase.sy,30,"Eastern bluebird"); if(utv&&utv.sx!=null) tag(utv.sx,utv.sy,utv.sr,"Side-by-side"); if(moonAt) tag(moonAt[0],moonAt[1],moonAt[2],"Crescent moon");
    for(const b of soarers){ const c=w2s(b.X,b.Y,b.Z); tag(c.x,c.y,b.kind==="heron"?40:28,b.kind==="heron"?"Great blue heron":b.kind==="falcon"?"Peregrine falcon":b.kind==="raven"?"Common raven":b.kind==="vult"?"Turkey vulture":b.kind==="hawk"?"Red-tailed hawk":"Barred owl"); }
  }
  document.addEventListener("click",e=>{
    if(SC.identify===false||!on) return; collectTags();
    if(e.target.closest&&e.target.closest("a,button,input,textarea,select,label,summary,[role=button],[role=dialog],[contenteditable],.card,.panel,.lightbox,[data-no-scenery]")) return;
    const qx=(e.clientX-(1-camZ)*W/2-camX)/camZ, qy=(e.clientY-(1-camZ)*H/2-camY)/camZ; let best=null, bd=1e9; for(const [x,y,r,n,mn] of tags){ const d=Math.hypot(qx-x,qy-y), zone=mn? r+40 : r*1.5+Math.max(56,Math.min(W,H)*.06), sc=mn? d*1.3+12 : d; if(d<zone&&sc<bd){ bd=sc; best=[x,y,n]; } }   /* the animals win over a leaf or petal drifting nearby */
    if(!best) return; tagEl.textContent=best[2]; tagEl.style.transform="none"; tagEl.style.left="0px"; tagEl.style.top="0px";
    { const r=tagEl.getBoundingClientRect(), vw=innerWidth, vh=innerHeight, m=10, w=r.width, h=r.height;      /* above the tap, centred, but always kept inside the window */
      let lx=e.clientX-w/2, ly=e.clientY-h-18; if(ly<m) ly=e.clientY+22; lx=Math.max(m,Math.min(vw-w-m,lx)); ly=Math.max(m,Math.min(vh-h-m,ly));
      tagEl.style.left=lx+"px"; tagEl.style.top=ly+"px"; }
    tagEl.style.opacity="1";
    clearTimeout(tagTimer); tagTimer=setTimeout(()=>{ tagEl.style.opacity="0"; },2600);
  });
  /* ---- a black Lab: trots in, nose to the ground, tail going, wanders the lawn and sniffs a long while, then heads off ---- */
  let lab=null, nextLab=130;
  function startLab(){
    const b=foxBounds(), side=Math.random()<.5, g=rnd(Math.max(b.gmin,lawnMinG(side?W*.9:W*.1))+25,b.gmax-20), p=toGround(side? W+70 : -70, gnd().vy+g);
    lab={lab:true,Xw:p.Xw,Dw:p.Dw,yaw:side?Math.PI:0,ph:0,state:"run",t:0,legs:5+Math.floor(Math.random()*4),dir:side?-1:1,alpha:1,head:0,turn:0,pointed:true};
    dogTarget(lab,true); arrive(side? W+70 : -70,lab);
  }
  function drawLab(dt,dark){
    if(!lab){ nextLab-=dt; if(nextLab<=0){ if(groundBusy()) nextLab=15; else startLab(); } return; }
    stepDog(lab,dt); if(lab.gone){ lab=null; nextLab=rnd(220,400); return; }
    paintDog(lab,dt,dark);
  }
  /* ---- a side-by-side (a farm UTV) coming out of the gap in the brush, down the mown trail toward us, then swinging off across the field to the left.
     Built in 3D from its panels, roll cage, seats, two riders and four turning wheels, lit by the low sun, kicking up golden dust, with haze by distance ---- */
  let utv=null, utvFirst=false, nextUtv=rnd(70,130); const utcv=document.createElement("canvas"), utcx=utcv.getContext("2d");
  const UTV_PATH=[[.305,.637],[.292,.64],[.281,.644],[.273,.651],[.262,.659],[.24,.665],[.207,.668],[.177,.67],[.13,.674],[.08,.677],[.02,.68],[-.08,.683],[-.25,.686]];   /* out from behind the brush at the trail's mouth, swinging toward us down the mown path, then left along the foot of the brush behind the tree */   /* out of the gap and along the foot of the brush, behind the apple tree */
  /* the other way round: in from the right along the front of the brush, then up the trail into the gap and away from us behind the brush */
  const UTV_PATH2=[[1.25,.835],[1.05,.81],[.88,.764],[.7,.722],[.52,.697],[.4,.68],[.32,.664],[.292,.654],[.278,.647],[.285,.642],[.297,.639],[.312,.636]];
  let utvRoute=Math.random()<.5? 0 : 1;
  function startUtv(){ utvRoute=1;
    const v=gnd(), f=FOC();
    /* the brush line on the right is a hillside sloping down toward the camera, so the path is placed at a believable, steady distance along it,
       with the ground's height falling away; then it turns smoothly into the trail's mouth and away up the trail into the shade */
    const route=[[1.25,.84,3.0],[1.05,.815,3.15],[.88,.772,3.3],[.72,.735,3.45],[.56,.709,3.6],[.44,.692,3.72],[.37,.683,3.8],[.33,.676,3.88],[.302,.67,3.94],[.284,.664,4.02],[.275,.658,4.22],[.277,.652,4.5],[.287,.647,4.85],[.3,.642,5.25],[.316,.638,5.7]];
    const pts=route.map(([ix,iy,Z])=>{ const s0=scr(ix,iy), X=(s0[0]-v.vx)*Z/f, Y=1-(s0[1]-v.vy)*Z/f; return [X,Z,Y]; });
    const cr=(a,b,c,d,t)=>{ const t2=t*t, t3=t2*t; return .5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t2+(-a+3*b-3*c+d)*t3); }, P=[];
    for(let i=0;i<pts.length-1;i++){ const a=pts[Math.max(0,i-1)], b=pts[i], c=pts[i+1], d=pts[Math.min(pts.length-1,i+2)]; for(let k=0;k<20;k++){ const t=k/20; P.push([0,1,2].map(j=>cr(a[j],b[j],c[j],d[j],t))); } }
    P.push(pts[pts.length-1]); const cum=[0]; for(let i=1;i<P.length;i++) cum.push(cum[i-1]+Math.hypot(P[i][0]-P[i-1][0],P[i][1]-P[i-1][1],P[i][2]-P[i-1][2]));
    utv={P,cum,len:cum[cum.length-1],d:0,v:.3,t:2,away:true,yaw:null,roll:0,pitch:0,wr:0,dust:[],col:pick([[52,72,50],[52,72,50],[96,34,28],[66,70,64]])};
  }
  function utvAt(u,d){ const c=u.cum; let lo=0, hi=c.length-1; d=Math.max(0,Math.min(u.len,d)); while(hi-lo>1){ const m=(lo+hi)>>1; if(c[m]<d) lo=m; else hi=m; }
    const k=(d-c[lo])/Math.max(1e-6,c[hi]-c[lo]); return [0,1,2].map(j=>lerp(u.P[lo][j],u.P[hi][j],k)); }
  const umcv=document.createElement("canvas"), umcx=umcv.getContext("2d"); let umR=null;
  function utvMaskGrab(){ const a0=scr(.2,.57), a1=scr(.37,.665), T=ctx.getTransform(), X0=Math.floor(T.a*a0[0]+T.e), Y0=Math.floor(T.d*a0[1]+T.f), X1=Math.ceil(T.a*a1[0]+T.e), Y1=Math.ceil(T.d*a1[1]+T.f), w=Math.max(1,X1-X0), h=Math.max(1,Y1-Y0);
    if(umcv.width!==w||umcv.height!==h){ umcv.width=w; umcv.height=h; } umcx.globalCompositeOperation="source-over"; umcx.clearRect(0,0,w,h); umcx.drawImage(ctx.canvas,X0,Y0,w,h,0,0,w,h);   /* the scene exactly as drawn this frame */
    const px=ix=>(ix-.2)/.17*w, py=iy=>(iy-.57)/.095*h;
    umcx.globalCompositeOperation="destination-out"; umcx.filter=`blur(${Math.max(2,w*.012).toFixed(1)}px)`;                         /* cut a soft-edged opening where the trail goes in */
    umcx.fillStyle="#000"; umcx.beginPath(); umcx.moveTo(px(.19),py(.69)); umcx.lineTo(px(.19),py(.55)); umcx.lineTo(px(.279),py(.55)); umcx.lineTo(px(.2815),py(.69)); umcx.closePath(); umcx.fill();
    umcx.filter="none"; const g=umcx.createLinearGradient(0,py(.645),0,h); g.addColorStop(0,"rgba(0,0,0,0)"); g.addColorStop(1,"rgba(0,0,0,1)"); umcx.fillStyle=g; umcx.fillRect(0,py(.645),w,h-py(.645));   /* and fade out at the foot of the brush */
    umcx.globalCompositeOperation="source-over"; umR=[X0,Y0,w,h]; }
  function utvMaskPaint(){ if(!umR) return; ctx.save(); ctx.setTransform(1,0,0,1,0,0); ctx.drawImage(umcv,umR[0],umR[1]); ctx.restore(); }
  function drawUtv(dt,dark){
    if(!utv){ nextUtv-=dt; if(nextUtv<=0){ if(((groundBusy&&groundBusy())||stageBusy())&&!utvFirst) nextUtv=20; else { utvFirst=false; startUtv(); } } if(typeof natureSfx!=="undefined"&&natureSfx.utv) natureSfx.utv(0,0,0); return; }
    const u=utv; u.t+=dt;
    /* speed: idles out of the gap, rolls down the trail, slows for the turn, then accelerates away across the field */
    const frac=u.d/u.len, V0=u.len/21, target= u.away? (()=>{ const h=d=>{ const a=utvAt(u,d), b=utvAt(u,d+.2); return Math.atan2(b[0]-a[0],b[1]-a[1]); }; let dh=h(u.d+.5)-h(u.d); dh=Math.abs(Math.atan2(Math.sin(dh),Math.cos(dh))); return V0*1.15/(1+dh*2.2); })() : frac<.2? V0*.45 : frac<.45? V0 : frac<.62? V0*.7 : V0*1.7;   /* sized to the scene: the whole run takes ten or twelve seconds */ u.v+=(target-u.v)*Math.min(1,dt*(target>u.v?.7:1.4)); u.d+=u.v*dt;
    const S=.47, p=utvAt(u,u.d), q=utvAt(u,u.d+.25), hd=Math.atan2(q[0]-p[0],q[1]-p[1]), slope=(q[2]-p[2])/Math.max(1e-4,Math.hypot(q[0]-p[0],q[1]-p[1]));
    if(u.yaw==null) u.yaw=hd; let dy=hd-u.yaw; while(dy>Math.PI) dy-=6.283; while(dy<-Math.PI) dy+=6.283; u.yaw+=dy*Math.min(1,dt*1.6);
    u.roll+=((-dy*1.2*Math.min(1,u.v/V0))-u.roll)*Math.min(1,dt*3);                                                            /* leans out in the turn */
    u.ps=(u.ps??slope)+(slope-(u.ps??slope))*Math.min(1,dt*2); u.pitch=u.ps+Math.sin(u.t*5.3)*.006*u.v/V0+Math.sin(u.t*2.1)*.004;   /* follows the lie of the ground, with small bumps */                                                                /* bumps in the field */
    u.wr+=u.v*dt/(.17*S);
    const sp=sun(), G=gnd(), f=FOC(), proj=(X,Y,Z)=>{ const g=f/Math.max(.2,Z); return [G.vx+X*g, G.vy+(1-Y)*g]; };
    const scrP=proj(p[0],p[2],p[1]); if(u.d>=u.len||scrP[0]<-W*.25){ utv=null; nextUtv=rnd(240,480); if(natureSfx.utv) natureSfx.utv(0,0,0); return; }
    /* sound: the engine's putter, louder and brighter as it comes near, panned with it, revving as it pulls away */
    if(typeof natureSfx!=="undefined"&&natureSfx.utv){ const near=Math.min(1,Math.pow(2.2/Math.max(1,p[1]),1.5)); natureSfx.utv(Math.min(1,u.t/1.5)*(.25+.75*near),Math.max(-1,Math.min(1,scrP[0]/W*2-1)),Math.min(1,u.v/(V0*1.7))); }
    /* dust thrown up behind the back wheels, glowing in the low sun */
    const ca=Math.cos(u.yaw), sa=Math.sin(u.yaw);
    if(u.v>V0*.3){ u.dT=(u.dT||0)-dt; if(u.dT<=0){ u.dT=.11; for(const sd of [-1,1]) u.dust.push({X:p[0]+(sd*.42*ca-.8*sa)*S+rnd(-.02,.02),Z:p[1]+(-sd*.42*sa-.8*ca)*S+rnd(-.02,.02),Y:p[2]+.02,vX:-sa*u.v*.2+rnd(-.04,.04),vZ:-ca*u.v*.2+rnd(-.04,.04),vY:rnd(.03,.06),r:rnd(.015,.028),t:0,life:rnd(1.6,2.6)}); } }
    for(let i=u.dust.length-1;i>=0;i--){ const d=u.dust[i]; d.t+=dt; if(d.t>d.life){ u.dust.splice(i,1); continue; } d.X+=d.vX*dt; d.Z+=d.vZ*dt; d.Y+=d.vY*dt; d.vY*=.97; d.r+=dt*.028; }
    /* the model, in its own frame: x right, y up, z forward (units: the camera height, about 1.8 m) */
    const L2W=(x,y,z)=>{ x*=S; y*=S; z*=S; const y2=p[2]+y+x*u.roll+z*u.pitch; return [p[0]+x*ca+z*sa, y2, p[1]-x*sa+z*ca]; };
    const cam=[0,1,0], faces=[];
    const sunV=(()=>{ const v=[(sp.x-G.vx)/f,(G.vy-sp.y)/f+.08,1], l=Math.hypot(...v); return v.map(c=>c/l); })();
    const nrmW=n=>[n[0]*ca+n[2]*sa, n[1], -n[0]*sa+n[2]*ca];
    const face=(pts,col,n,opt)=>{ const w=pts.map(q=>L2W(...q)), nw=nrmW(n), c=w.reduce((a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]],[0,0,0]).map(v=>v/w.length);
      if(!(opt&&opt.both)&&(nw[0]*(cam[0]-c[0])+nw[1]*(cam[1]-c[1])+nw[2]*(cam[2]-c[2]))<=0) return;
      const lit=Math.max(0,nw[0]*sunV[0]+nw[1]*sunV[1]+nw[2]*sunV[2]), sky=Math.max(0,nw[1])*.35, back=Math.max(0,-(nw[0]*sunV[0]+nw[2]*sunV[2]))*.08;
      const k=.32+.75*lit+sky, cc=[col[0]*k+40*lit*(opt&&opt.gloss?1:.3), col[1]*k+28*lit*(opt&&opt.gloss?1:.3), col[2]*k+14*lit*(opt&&opt.gloss?1:.3)+18*sky];
      faces.push({s:w.map(q=>proj(...q)),d:Math.hypot(c[0],c[1]-1,c[2]),col:cc,rim:opt&&opt.rim}); };
    const box=(x0,x1,y0,y1,z0,z1,col,opt)=>{ face([[x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1]],col,[0,1,0],opt); face([[x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1]],col,[0,-1,0],opt);
      face([[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]],col,[0,0,1],opt); face([[x0,y0,z0],[x1,y0,z0],[x1,y1,z0],[x0,y1,z0]],col,[0,0,-1],opt);
      face([[x1,y0,z0],[x1,y0,z1],[x1,y1,z1],[x1,y1,z0]],col,[1,0,0],opt); face([[x0,y0,z0],[x0,y0,z1],[x0,y1,z1],[x0,y1,z0]],col,[-1,0,0],opt); };
    const C=u.col, BLK=[24,24,26], TIRE=[30,29,27], SEAT=[28,28,30], SKIN=[184,138,108], SKIN2=[200,152,124];
    const poly=(pts,col,n,opt)=>face(pts,col,n,opt);
    const both={both:1};
    /* big knobby tyres on black wheels */
    for(const [wx,wz] of [[-.44,.58],[.44,.58],[-.44,-.56],[.44,-.56]]){ const R=.215, w2=.075, N=16, sd=Math.sign(wx);
      const ring=(x,r)=>Array.from({length:N},(_,i)=>{ const a=i/N*6.283+u.wr; return [x,R+Math.sin(a)*r,wz+Math.cos(a)*r]; });
      const outer=ring(wx+sd*w2,R), inner=ring(wx-sd*w2,R), lug=ring(wx+sd*w2,R*.97);
      for(let i=0;i<N;i++){ const j=(i+1)%N, a=(i+.5)/N*6.283+u.wr; poly([outer[i],outer[j],inner[j],inner[i]],i%2?[26,25,23]:[44,42,38],[0,Math.sin(a),Math.cos(a)]); }   /* the tread blocks */
      poly(outer,TIRE,[sd,0,0]);
      const rim=ring(wx+sd*(w2+.004),R*.62); poly(rim,[34,34,36],[sd,0,0],{gloss:1});                                          /* the black wheel */
      for(let k=0;k<5;k++){ const a=k/5*6.283+u.wr, b=a+.25, c=[wx+sd*(w2+.008),R,wz]; poly([c,[c[0],R+Math.sin(a)*R*.56,wz+Math.cos(a)*R*.56],[c[0],R+Math.sin(b)*R*.56,wz+Math.cos(b)*R*.56]],[70,70,72],[sd,0,0],{gloss:1}); }   /* its spokes */
      /* the black fender flare arching over it */
      const fl=[]; for(let i=0;i<=8;i++){ const a=lerp(.15,Math.PI-.15,i/8); fl.push([wx+sd*.02,R+Math.sin(a)*.3,wz+Math.cos(a)*.3]); } for(let i=8;i>=0;i--){ const a=lerp(.15,Math.PI-.15,i/8); fl.push([wx+sd*.02,R+Math.sin(a)*.25,wz+Math.cos(a)*.25]); }
      poly(fl,BLK,[sd,0,0],both); }
    poly([[-.34,.22,-.8],[.34,.22,-.8],[.34,.22,.8],[-.34,.22,.8]],BLK,[0,-1,0]);                                               /* the skid plate */
    /* the nose: a sloping hood narrowing to a sharp front, angled headlights, a black grille and bumper */
    const H0=[[-.37,.62,.36],[.37,.62,.36],[.36,.58,.66],[.3,.52,.86],[-.3,.52,.86],[-.36,.58,.66]];
    poly(H0,C,[0,.92,.38],{gloss:1});
    poly([[-.3,.52,.86],[.3,.52,.86],[.26,.34,.95],[-.26,.34,.95]],C,[0,.45,.9],{gloss:1});                                       /* the front fascia */
    poly([[-.18,.44,.9],[.18,.44,.9],[.16,.33,.955],[-.16,.33,.955]],[20,20,22],[0,.45,.9]);                                      /* the grille */
    for(const sd of [-1,1]){
      poly([[sd*.37,.62,.36],[sd*.36,.58,.66],[sd*.3,.52,.86],[sd*.26,.34,.95],[sd*.36,.3,.82],[sd*.4,.36,.4]],C,[sd,.25,.2],{gloss:1});   /* the flank of the nose */
      poly([[sd*.3,.5,.875],[sd*.2,.49,.9],[sd*.21,.45,.91],[sd*.31,.47,.885]],[220,224,226],[0,.45,.9],{gloss:1}); }              /* the angled headlights */
    const bump=[[[-.3,.26,1],[.3,.26,1]],[[-.3,.26,1],[-.3,.4,.98]],[[.3,.26,1],[.3,.4,.98]],[[-.3,.4,.98],[.3,.4,.98]],[[-.3,.26,1],[-.3,.24,.85]],[[.3,.26,1],[.3,.24,.85]]];
    for(const [a,b] of bump){ const A=L2W(...a), B=L2W(...b); faces.push({tube:true,a:A,b:B,w:.028,d:Math.hypot((A[0]+B[0])/2,(A[1]+B[1])/2-1,(A[2]+B[2])/2)-.01}); }   /* the brush-guard bumper */
    /* the cab sides between the wheels, the low door panels with their cut-down tops */
    for(const sd of [-1,1]){ poly([[sd*.4,.3,-.3],[sd*.4,.3,.34],[sd*.41,.6,.34],[sd*.41,.58,.06],[sd*.4,.46,-.12],[sd*.4,.46,-.3]],C,[sd,0,0],{gloss:1});
      poly([[sd*.4,.22,-.3],[sd*.4,.22,.34],[sd*.4,.3,.34],[sd*.4,.3,-.3]],BLK,[sd,0,0]); }                                       /* the black rocker below */
    poly([[-.38,.62,.36],[.38,.62,.36],[.36,.7,.28],[-.36,.7,.28]],BLK,[0,.6,.8]);                                                /* the dash top */
    /* the cargo bed */
    const bz0=-.92, bz1=-.32, by0=.5, by1=.72;
    poly([[-.42,by1,bz0],[.42,by1,bz0],[.42,by0,bz0],[-.42,by0,bz0]],C,[0,0,-1],{gloss:1});
    for(const sd of [-1,1]) poly([[sd*.42,by0,bz0],[sd*.42,by0,bz1],[sd*.42,by1,bz1],[sd*.42,by1,bz0]],C,[sd,0,0],{gloss:1});
    poly([[-.4,by0+.02,bz0],[.4,by0+.02,bz0],[.4,by0+.02,bz1],[-.4,by0+.02,bz1]],[40,40,40],[0,1,0]);                              /* its floor */
    poly([[-.42,by1,bz1],[.42,by1,bz1],[.42,by0,bz1],[-.42,by0,bz1]],[36,36,38],[0,0,1]);                                         /* the bulkhead behind the seats */
    poly([[-.42,by0,bz0],[.42,by0,bz0],[.42,.3,-.75],[-.42,.3,-.75]],BLK,[0,-.4,-.9]);
    /* bucket seats with tall backs and headrests */
    for(const sx of [-.2,.2]){ poly([[sx-.15,.52,-.22],[sx+.15,.52,-.22],[sx+.15,.52,.12],[sx-.15,.52,.12]],SEAT,[0,1,0]);
      poly([[sx-.15,.52,-.24],[sx+.15,.52,-.24],[sx+.14,.92,-.32],[sx-.14,.92,-.32]],SEAT,[0,.2,1],both); poly([[sx-.08,.94,-.33],[sx+.08,.94,-.33],[sx+.08,1.03,-.35],[sx-.08,1.03,-.35]],SEAT,[0,.2,1],both); }
    /* the roll cage: curved bent tubes, as in the photo */
    const cage=[]; const bend=(a,m,b,n=4)=>{ for(let i=0;i<n;i++){ const t0=i/n, t1=(i+1)/n, q=t=>[0,1,2].map(k=>(1-t)*(1-t)*a[k]+2*(1-t)*t*m[k]+t*t*b[k]); cage.push([q(t0),q(t1)]); } };
    for(const sd of [-1,1]){ bend([sd*.39,.62,.34],[sd*.39,1.06,.24],[sd*.37,1.12,-.02]); bend([sd*.37,1.12,-.02],[sd*.37,1.14,-.3],[sd*.39,1.06,-.36]); cage.push([[sd*.39,1.06,-.36],[sd*.41,.66,-.34]]); cage.push([[sd*.41,.86,-.34],[sd*.4,.6,.0]]); }
    cage.push([[-.37,1.12,-.02],[.37,1.12,-.02]]); cage.push([[-.39,1.06,-.36],[.39,1.06,-.36]]); cage.push([[-.39,.8,.3],[.39,.8,.3]]);
    for(const [a,b] of cage){ const A=L2W(...a), B=L2W(...b); faces.push({tube:true,a:A,b:B,w:.032,d:Math.hypot((A[0]+B[0])/2,(A[1]+B[1])/2-1,(A[2]+B[2])/2)-.03}); }
    poly([[-.36,1.13,.0],[.36,1.13,.0],[.36,1.13,-.34],[-.36,1.13,-.34]],[30,30,32],[0,1,0],both);                                 /* the roof panel */
    /* the steering wheel */
    { const c=[-.2,.74,.2]; const r=Array.from({length:10},(_,i)=>{ const a=i/10*6.283; return [c[0]+Math.cos(a)*.08,c[1]+Math.sin(a)*.06,c[2]-Math.sin(a)*.03]; }); for(let i=0;i<10;i++){ const A=L2W(...r[i]), B=L2W(...r[(i+1)%10]); faces.push({tube:true,a:A,b:B,w:.014,d:Math.hypot(A[0],A[1]-1,A[2])-.05}); } }
    /* the people. A limb is a tapered stroke; a body is a few panels; a head is a shaded oval with its hair or cap */
    const limb=(a,b,col,w)=>{ const A=L2W(...a), B=L2W(...b); faces.push({limb:true,a:A,b:B,col,w,d:Math.hypot((A[0]+B[0])/2,(A[1]+B[1])/2-1,(A[2]+B[2])/2)-.045}); };
    const torso=(sx,sw,cw,col)=>{ const zb=-.2, zf=-.06;                                                                         /* waist narrower than the shoulders, a little lean back */
      const pts=[[sx-cw,.54,zf],[sx+cw,.54,zf],[sx+sw,.84,zf-.04],[sx-sw,.84,zf-.04]]; poly(pts,col,[0,.15,1],both);
      for(const sd of [-1,1]) poly([[sx+sd*cw,.54,zb],[sx+sd*cw,.54,zf],[sx+sd*sw,.84,zf-.04],[sx+sd*sw,.84,zb-.02]],mulv(col,.85),[sd,0,0]);
      poly([[sx-sw,.84,zb-.02],[sx+sw,.84,zb-.02],[sx+sw*.6,.88,zb+.02],[sx-sw*.6,.88,zb+.02]],mulv(col,.9),[0,1,0]); };
    /* he drives: broad-shouldered in a flannel shirt and a ball cap, hands on the wheel */
    { const sx=-.2, sh=[118,52,36]; torso(sx,.135,.11,sh);
      limb([sx,.86,-.12],[sx,.92,-.12],SKIN,.05);                                                                                  /* neck */
      for(const sd of [-1,1]){ const s0=[sx+sd*.13,.83,-.1], e0=[sx+sd*.15,.66,.03], h0=[sx+sd*.07,.74,.19]; limb(s0,e0,sh,.055); limb(e0,h0,sh,.045); faces.push({hand:true,c:L2W(...h0),r:.024,col:SKIN,d:Math.hypot(...L2W(...h0).map((v,i)=>i===1?v-1:v))-.06}); }
      for(const sd of [-1,1]){ limb([sx+sd*.07,.56,-.08],[sx+sd*.08,.56,.14],[52,58,72],.07); limb([sx+sd*.08,.56,.14],[sx+sd*.08,.32,.2],[52,58,72],.06); }   /* jeans */
      faces.push({head:true,man:true,c:L2W(sx,.99,-.1),f:L2W(sx,.99,.0),r:.075,col:SKIN,hat:[64,74,58],d:Math.hypot(...L2W(sx,.99,-.1).map((v,i)=>i===1?v-1:v))-.02}); }
    /* she rides shotgun, quite literally: slimmer, long hair down her back, the gun held upright beside her, muzzle to the sky */
    { const sx=.2, sh=[72,96,82]; torso(sx,.115,.09,sh);
      limb([sx,.85,-.12],[sx,.9,-.12],SKIN2,.042);
      for(const sd of [-1,1]){ limb([sx+sd*.07,.56,-.08],[sx+sd*.07,.56,.14],[58,52,48],.06); limb([sx+sd*.07,.56,.14],[sx+sd*.07,.32,.2],[58,52,48],.055); }
      const butt=[sx+.13,.52,.08], grip=[sx+.14,.64,.12], fore=[sx+.15,.82,.17], muzzle=[sx+.17,1.1,.25];                          /* stock on the seat by her knee, barrel up */
      limb(butt,grip,[150,88,44],.04); limb(grip,[sx+.145,.7,.135],[30,30,32],.024); limb([sx+.145,.7,.135],muzzle,[58,60,66],.02); limb([sx+.147,.74,.15],fore,[112,66,34],.024);   /* walnut stock and fore-end, blued barrel */
      const s1=[sx+.12,.82,-.1], e1=[sx+.17,.68,.02], s2=[sx-.12,.82,-.1], e2=[sx-.02,.66,.06];
      limb(s1,e1,sh,.045); limb(e1,grip,sh,.038); limb(s2,e2,sh,.045); limb(e2,fore,sh,.038);
      for(const hh of [grip,fore]) faces.push({hand:true,c:L2W(...hh),r:.02,col:SKIN2,d:Math.hypot(...L2W(...hh).map((v,i)=>i===1?v-1:v))-.07});
      faces.push({hair:true,a:L2W(sx,.99,-.14),b:L2W(sx,.7,-.19),col:[176,66,28],w:.1,d:Math.hypot(...L2W(sx,.9,-.16).map((v,i)=>i===1?v-1:v))+.01});   /* her hair down her back */
      faces.push({head:true,c:L2W(sx,.985,-.1),f:L2W(sx,.985,0),r:.068,col:SKIN2,hairC:[176,66,28],d:Math.hypot(...L2W(sx,.985,-.1).map((v,i)=>i===1?v-1:v))-.02}); }
    faces.sort((a,b)=>b.d-a.d);
    /* draw everything into its own layer, then light it and put it in the air */
    const cw=Math.ceil(W*.6), ch=Math.ceil(H*.6); if(utcv.width!==cw||utcv.height!==ch){ utcv.width=cw; utcv.height=ch; }
    const x=utcx; x.setTransform(1,0,0,1,0,0); x.clearRect(0,0,cw,ch); x.setTransform(.6,0,0,.6,0,0); x.lineJoin="round"; x.lineCap="round";
    const gS=f/p[1]*S;
    { const sh=[0,1,2,3].map(i=>{ const a=i/4*6.283+.785; return proj(p[0]+(Math.cos(a)*.62*ca+Math.sin(a)*.95*sa+.12)*S,p[2],p[1]+(-Math.cos(a)*.62*sa+Math.sin(a)*.95*ca-.25)*S); });   /* its shadow, thrown toward us by the low sun */
      const c0=proj(p[0]+.06*S,p[2],p[1]-.15*S), g=x.createRadialGradient(c0[0],c0[1],0,c0[0],c0[1],gS*1.1); g.addColorStop(0,"rgba(16,12,6,.55)"); g.addColorStop(1,"rgba(16,12,6,0)"); x.fillStyle=g; x.beginPath(); sh.forEach((q,i)=>i? x.lineTo(q[0],q[1]) : x.moveTo(q[0],q[1])); x.closePath(); x.fill(); }
    for(const F of faces){
      const pw=(P,w)=>Math.max(.8,w*S*f/Math.max(.2,P[2]));
      if(F.tube){ const a=proj(...F.a), b=proj(...F.b), w=pw(F.a,F.w||.035); x.strokeStyle=rgb([26,26,28]); x.lineWidth=w; x.beginPath(); x.moveTo(a[0],a[1]); x.lineTo(b[0],b[1]); x.stroke(); x.strokeStyle="rgba(255,206,150,.3)"; x.lineWidth=Math.max(.4,w*.3); x.stroke(); continue; }
      if(F.limb||F.hair){ const a=proj(...F.a), b=proj(...F.b), w=pw(F.a,F.w); x.strokeStyle=rgb(mulv(F.col,.72)); x.lineWidth=w; x.beginPath(); x.moveTo(a[0],a[1]); x.lineTo(b[0],b[1]); x.stroke();
        x.strokeStyle=rgb(mulv(F.col,.95),.55); x.lineWidth=w*.45; x.beginPath(); x.moveTo(a[0]-w*.12,a[1]-w*.12); x.lineTo(b[0]-w*.12,b[1]-w*.12); x.stroke(); continue; }   /* a little light down one side */
      if(F.hand){ const c=proj(...F.c), r=pw(F.c,F.r); x.fillStyle=rgb(mulv(F.col,.75)); x.beginPath(); x.arc(c[0],c[1],r,0,6.283); x.fill(); continue; }
      if(F.head){ const c=proj(...F.c), fc=proj(...F.f), r=pw(F.c,F.r), dx=fc[0]-c[0], dy=fc[1]-c[1], fl=Math.hypot(dx,dy), fx=fl>.01? dx/fl : 0, fy=fl>.01? dy/fl : 0, side=Math.min(1,fl/r);   /* which way it faces on screen */
        if(F.hairC){ x.fillStyle=rgb(mulv(F.hairC,.75)); x.beginPath(); x.ellipse(c[0]-fx*r*.15,c[1]-r*.05,r*1.08,r*1.12,0,0,6.283); x.fill(); }
        { const fxp=c[0]+fx*r*.3, fyp=c[1]+fy*r*.3+r*.05, g=x.createRadialGradient(fxp-r*.2,fyp-r*.3,r*.1,c[0],c[1],r*1.05); g.addColorStop(0,rgb(mulv(F.col,.82))); g.addColorStop(1,rgb(mulv(F.col,.45))); x.fillStyle=g;
          x.beginPath(); x.ellipse(c[0]+fx*r*.12,c[1]+r*.06,r*.86,r*1.04,0,0,6.283); x.fill(); }                                   /* the face, a little longer than wide */
        if(F.hairC){ x.fillStyle=rgb(mulv(F.hairC,.85)); x.beginPath(); x.ellipse(c[0]-fx*r*.2,c[1]-r*.45,r*.95,r*.6,0,Math.PI,0); x.fill(); x.beginPath(); x.ellipse(c[0]-fx*r*.55,c[1]-r*.05,r*.42*(1-.4*side)+r*.2,r*.9,0,0,6.283); x.fill(); }   /* parted over the crown, falling past the ears */
        if(F.man){ x.fillStyle=rgb(mulv([70,52,40],.8)); x.beginPath(); x.ellipse(c[0]+fx*r*.25,c[1]+r*.55,r*.62,r*.36,0,0,Math.PI); x.fill();   /* a close beard along the jaw */
          x.fillStyle=rgb(mulv(F.hat,.75)); x.beginPath(); x.ellipse(c[0],c[1]-r*.42,r*.98,r*.62,0,Math.PI,0); x.fill();                          /* the cap's crown */
          x.fillStyle=rgb(mulv(F.hat,.55)); x.beginPath(); x.ellipse(c[0]+fx*r*.85,c[1]-r*.44+fy*r*.2,r*(.35+.55*side),r*.16,Math.atan2(fy,fx)*.15,0,6.283); x.fill(); }   /* and its bill, pointing the way he faces */
        continue; }
      x.fillStyle=rgb(F.col); x.strokeStyle=rgb(F.col); x.lineWidth=.6; x.beginPath(); F.s.forEach((q,i)=>i? x.lineTo(q[0],q[1]) : x.moveTo(q[0],q[1])); x.closePath(); x.fill(); x.stroke(); }
    { const fc=-(sa*p[0]+ca*p[1])/Math.hypot(p[0],p[1]), hl=fc>.05? [-.25,.25].map(sx=>proj(...L2W(sx,.49,.89))) : []; x.save(); x.globalCompositeOperation="lighter"; x.globalAlpha=Math.min(1,fc*2.5); for(const h of hl){ const r=gS*.07, g=x.createRadialGradient(h[0],h[1],0,h[0],h[1],r*3); g.addColorStop(0,"rgba(255,244,214,.95)"); g.addColorStop(.2,"rgba(255,230,180,.45)"); g.addColorStop(1,"rgba(255,220,160,0)"); x.fillStyle=g; x.fillRect(h[0]-r*3,h[1]-r*3,r*6,r*6); } x.restore(); }   /* headlights on in the dusk */
    /* light and air over the whole machine */
    const c0=proj(p[0],p[2]+.5*S,p[1]), rad=gS*1.6+30, RX=Math.max(0,(c0[0]-rad)*.6), RY=Math.max(0,(c0[1]-rad)*.6), RW=rad*1.2, RH=rad*1.2;
    x.setTransform(1,0,0,1,0,0); x.globalCompositeOperation="source-atop";
    { const rl=x.createLinearGradient(RX,0,RX+RW,0), kk=sp.x>c0[0]?1:0; rl.addColorStop(kk,"rgba(255,190,110,.2)"); rl.addColorStop(1-kk,"rgba(20,12,8,.1)"); x.fillStyle=rl; x.fillRect(RX,RY,RW,RH); }   /* warm rim light from the sun's side */
    if(!u.skyC||(u.skyT=(u.skyT||0)-1)<=0){ u.skyT=10; const ip=toImg(c0[0],c0[1]-gS*.6); u.skyC=(ip&&ip[0]>=0&&ip[0]<=1&&ip[1]>=0&&ip[1]<=1&&sampleAt(ip[0],ip[1]))||[150,130,90]; }
    x.fillStyle=rgb(u.skyC,Math.min(.4,Math.max(.1,(p[1]-3.2)/14))); x.fillRect(RX,RY,RW,RH);                                    /* far off it melts into the field's haze */
    { if(!u.locC||(u.locT=(u.locT||0)-1)<=0){ u.locT=10; const ip=toImg(c0[0],c0[1]); u.locC=(ip&&ip[0]>=0&&ip[0]<=1&&ip[1]>=0&&ip[1]<=1&&sampleAt(ip[0],ip[1]))||[90,70,40]; }
      x.fillStyle=rgb(mulv(u.locC,.8),.18); x.fillRect(RX,RY,RW,RH); }
    { const sm=v=>v<=0?0:v>=1?1:v*v*(3-2*v), sh=u.away? sm((u.d/u.len-.82)/.16) : 1-sm(u.d/(u.len*.2)); if(sh>.01){ x.fillStyle=`rgba(14,10,6,${(.6*sh).toFixed(3)})`; x.fillRect(RX,RY,RW,RH); } }   /* in the deep shade of the trail's mouth, coming out into the light */   /* in the shade at the foot of the brush, taking its colour */
    if(SC.dim()){ x.fillStyle="rgba(20,14,6,.18)"; x.fillRect(RX,RY,RW,RH); } else { const tn=tint(); if(tn.a>0){ x.globalAlpha=tn.a; x.fillStyle=tn.c; x.fillRect(RX,RY,RW,RH); x.globalAlpha=1; } }
    if(dark){ x.fillStyle="rgba(10,8,14,.3)"; x.fillRect(RX,RY,RW,RH); }
    x.globalCompositeOperation="source-over";
    /* dust behind, then the machine, then any dust drifting in front */
    const dustDraw=front=>{ if(!u.ip||(u.ipT=(u.ipT||0)-1)<=0){ u.ipT=10; const ip=toImg(c0[0],proj(p[0],p[2],p[1])[1]); u.dC=(ip&&sampleAt(Math.max(0,Math.min(1,ip[0])),Math.max(0,Math.min(1,ip[1]))))||[150,120,70]; u.ip=1; }
      for(const d of u.dust){ if((d.Z<p[1])!==front) continue; const c=proj(d.X,d.Y,d.Z), r=d.r*f/d.Z, a=Math.sin(Math.PI*d.t/d.life)*.09*(dark?.5:1); if(r<.5) continue;
        const g=ctx.createRadialGradient(c[0],c[1],0,c[0],c[1],r); const dc=mixv(u.dC,[255,206,140],.45); g.addColorStop(0,rgb(dc,a)); g.addColorStop(1,rgb(dc,0)); ctx.fillStyle=g; ctx.fillRect(c[0]-r,c[1]-r,r*2,r*2); } };
    const behind=p[1]>4.45; if(behind) utvMaskGrab();
    ctx.save(); dustDraw(false); ctx.restore();
    blitRegion(utcv,c0[0],c0[1],rad,.75+Math.max(0,p[1]-10)*.04,Math.min(1,(u.len-u.d)/(u.len*.14)));
    if(behind) utvMaskPaint(); /* still up the trail behind the brush: the brush stays in front of it, softly, and it shows only through the gap */
    { const tb=scr(.188,.692), gy=proj(p[0],p[2],p[1])[1]; if(gy<tb[1]&&Math.abs(c0[0]-tb[0])<rad){ const m=cover(), a0=scr(.183,.6), a1=scr(.195,.692);   /* passing behind the apple tree: its trunk stays in front */
        ctx.drawImage(photo,.183*m.iw,.6*m.ih,.012*m.iw,.092*m.ih,a0[0],a0[1],a1[0]-a0[0],a1[1]-a0[1]); } }
    ctx.save(); dustDraw(true); ctx.restore();
    u.sx=c0[0]; u.sy=c0[1]; u.sr=gS*.9;
  }
  function drawDog(dt,dark){
    if(!dog&&rompAt!=null){ rompAt-=dt; if(rompAt<=0){ rompAt=null; startRomp(); } return; }
    if(!dog){ nextDog-=dt; if(nextDog<=0){ if(groundBusy()) nextDog=15; else startDog(); } return; }
    stepDog(dog,dt); if(dog.gone){ dog=null; nextDog=rnd(220,400); return; }
    paintDog(dog,dt,dark);
  }
  function paintDog(d,dt,dark){
    if(d.hidden) return;
    const s0=toScreen(d.Xw,d.Dw), k=.16*s0.g/26, moving=d.state==="run"||d.state==="leave"||(d.state==="pounce"&&d.hop>.02), s=d.hop>0? {x:s0.x,y:s0.y-d.hop*16*k,g:s0.g} : s0;
    { const pan=Math.max(-1,Math.min(1,s.x/W*2-1))*.9, near=Math.min(1,Math.max(.15,(s.g-180)/260)), a=d.alpha==null?1:d.alpha;   /* footfalls and scratching, placed in stereo where the dog is */
      if(moving){ const step=Math.floor(d.ph*Math.PI*.9/Math.PI); if(d.lastStep!=null&&step!==d.lastStep) natureSfx.paw&&natureSfx.paw(pan,(.05+.1*near)*a*(d.lab?1.1:1)*(step%2===0?1.15:.85)); d.lastStep=step; } else d.lastStep=null;
      if(d.scratching){ d.scrT=(d.scrT||0)-dt; if(d.scrT<=0){ d.scrT=.11; natureSfx.scratch&&natureSfx.scratch(pan,(.03+.06*near)*a); } } }
    if(d.pw){ const dX=d.Xw-d.pw[0], dZ=trueZ(d.Dw)-d.pw[1]; if(moving&&Math.hypot(dX,dZ)>1e-5) d.yaw=angTo(d.yaw,Math.atan2(dZ,dX),dt*8); } keepOnLawn(d); d.pw=[d.Xw,trueZ(d.Dw)];
    d.ct=(d.ct||0)-dt;
    if(d.ct<=0||!d.pal){ d.ct=1.5; const G=groundPal(s,dark), lit=dark?.5:.66;
      d.pal= d.lab? {...G, white:mixv(mulv([18,16,15],lit/.66),mulv(G.g,.3),.05), orange:mulv([15,13,12],lit/.66), nose:mulv([14,12,12],lit/.66)}
                  : {...G, white:mixv(mulv([232,226,212],lit),mulv(G.g,.5),.12), orange:mulv([196,106,48],lit), nose:mulv([110,64,46],lit)}; }
    if(!d.blades) d.blades=Array.from({length:10},()=>({ox:rnd(-20,20),h:rnd(3,6),lean:rnd(-.5,.5),c:Math.random()}));
    critterBlit(null,null,d,s,k,d.pal,()=>dogParts(d,d.pal,moving),d.yaw,44,70,18,d.blades,d.alpha,d.lab?.7:0);   /* a black coat takes much less of the warm rim light */
  }
  /* ---- a bald eagle, in true 3D like the jays and the pheasant. It comes in high and far on flat plank wings, banks into a long sweeping turn that
     brings it close over the field, turns its white head to look down at you, then a few slow heavy beats and it glides off into the haze ---- */
  let eag=null, nextEagle=rnd(80,140); const ecv=document.createElement("canvas"), ecx=ecv.getContext("2d");
  const EPATH=[[-.2,.19,12],[.14,.24,9],[.46,.3,6.2],[.66,.24,4.1],[.48,.15,3.3],[.2,.19,4.2],[.08,.27,7.5],[.3,.33,15],[.56,.33,30],[.7,.34,46]];
  function startEagle(){
    const dir=Math.random()<.5?1:-1, F=H*.5, cx=W/2, cy=H*.52, wp=EPATH.map(([fx,fy,z])=>{ const x=dir>0? fx : 1-fx; return [(x*W-cx)*z/F,(fy*H-cy)*z/F,z]; });
    const cr=(a,b,c,d,t)=>{ const t2=t*t, t3=t2*t; return .5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t2+(-a+3*b-3*c+d)*t3); };
    const pts=[]; for(let i=0;i<wp.length-1;i++){ const a=wp[Math.max(0,i-1)], b=wp[i], c=wp[i+1], d=wp[Math.min(wp.length-1,i+2)];
      for(let k=0;k<24;k++){ const t=k/24; pts.push([0,1,2].map(j=>cr(a[j],b[j],c[j],d[j],t))); } } pts.push(wp[wp.length-1]);
    const cum=[0]; for(let i=1;i<pts.length;i++) cum.push(cum[i-1]+Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1],pts[i][2]-pts[i-1][2])/Math.pow((pts[i][2]+pts[i-1][2])/2,.85));   /* time weighted toward the near part of the pass */
    eag={t:0,dir,pts,cum,len:cum[cum.length-1],dur:rnd(30,34),ph:Math.PI*.5,amp:0,bank:0,hy:0,hp:0,called:0,lastS:0,curl:.6};
  }
  function eagleAt(e,u){ u=Math.max(0,Math.min(1,u)); const L=u*e.len, c=e.cum; let lo=0, hi=c.length-1; while(hi-lo>1){ const m=(lo+hi)>>1; if(c[m]<L) lo=m; else hi=m; }
    const k=(L-c[lo])/Math.max(1e-6,c[hi]-c[lo]), A=e.pts[lo], B=e.pts[hi]; return [A[0]+(B[0]-A[0])*k, A[1]+(B[1]-A[1])*k, A[2]+(B[2]-A[2])*k]; }
  function eagle3D(x,e,P,f,proj,Kw,sunL){
    const crs=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]], nrm=v=>{ const l=Math.hypot(v[0],v[1],v[2])||1; return [v[0]/l,v[1]/l,v[2]/l]; }, dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
    const r0=nrm(crs(f,[0,-1,0])), u0=crs(r0,f), cb=Math.cos(e.bank), sb=Math.sin(e.bank);
    const r=[0,1,2].map(i=>r0[i]*cb+u0[i]*sb), u=[0,1,2].map(i=>u0[i]*cb-r0[i]*sb);                                     /* banked about its own long axis */
    const W3=(a,b,c)=>[P[0]+(f[0]*a+r[0]*b+u[0]*c)*Kw, P[1]+(f[1]*a+r[1]*b+u[1]*c)*Kw, P[2]+(f[2]*a+r[2]*b+u[2]*c)*Kw];
    const pt=(a,b,c)=>{ const w=W3(a,b,c); return proj(w[0],w[1],w[2]); };
    const sc=a=>{ const p0=pt(a,0,0), p1=pt(a+1,0,0), p2=pt(a,1,0), p3=pt(a,0,1); return Math.max(Math.hypot(p1[0]-p0[0],p1[1]-p0[1]),Math.hypot(p2[0]-p0[0],p2[1]-p0[1]),Math.hypot(p3[0]-p0[0],p3[1]-p0[1])); };
    const toEye=nrm([-P[0],-P[1],-P[2]]), under=dot(u,toEye)<=0;                                                    /* mostly we look up at its underside */
    const sTop=dot(u,sunL), lit=Math.max(0,Math.min(1,(under? -sTop : sTop)*1.6+.08));                               /* how much of the low sun the side we see is catching */
    const glow=Math.max(0,Math.min(1,(dot(nrm(P),sunL)-.55)/.4))*(1-lit*.7);                                         /* the sun behind the feathers: they glow at the edges */
    const L=(c,k)=>{ k=k??1; const l=lit*k; return [c[0]*(.6+.95*l)+7*(1-l), c[1]*(.6+.66*l)+8*(1-l), c[2]*(.6+.38*l)+13*(1-l)]; };
    const smooth=(pts,col)=>{ x.fillStyle=col; x.beginPath(); const n=pts.length, m=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2]; let q=m(pts[n-1],pts[0]); x.moveTo(q[0],q[1]); for(let i=0;i<n;i++){ const a=pts[i], b=pts[(i+1)%n], mm=m(a,b); x.quadraticCurveTo(a[0],a[1],mm[0],mm[1]); } x.closePath(); x.fill(); };
    const poly=(pts,col)=>{ x.fillStyle=col; x.beginPath(); x.moveTo(pts[0][0],pts[0][1]); for(let i=1;i<pts.length;i++) x.lineTo(pts[i][0],pts[i][1]); x.closePath(); x.fill(); };
    const line=(a,b,col,w)=>{ x.strokeStyle=col; x.lineWidth=w; x.beginPath(); x.moveTo(a[0],a[1]); x.lineTo(b[0],b[1]); x.stroke(); };
    const px=sc(0); x.lineCap="round"; x.lineJoin="round";
    const BR=[60,40,26], BRD=[36,24,16], COV=[74,50,32], TAWNY=[140,102,62], REMU=[72,60,52], REMT=[34,25,18], FING=[26,20,16], WH=[246,242,232], BILL=[240,192,58], FEET=[236,198,72];
    /* the wing: a broad plank of an arm out to the wrist, then the hand, its primaries splayed into seven long slotted fingers, tips curling up under load */
    const A0=.07+Math.sin(e.t*1.7)*.012, A1=A0+e.amp*Math.cos(e.ph), A2=A1+e.amp*.5*Math.cos(e.ph-.75), up=Math.max(0,-Math.sin(e.ph))*Math.min(1,e.amp/.5);   /* the hand lags the arm and tucks a little on the upstroke */
    const WR=18;
    const wp=(sd,a,s,c)=>{ let ss=s, aa=a; if(s>WR){ const h=s-WR; ss=WR+h*(1-.22*up); aa=a-h*.3*up; }
      const ang=ss<=WR? A1 : A2, y=ss<=WR? ss*Math.cos(A1) : WR*Math.cos(A1)+(ss-WR)*Math.cos(A2), z=ss<=WR? ss*Math.sin(A1) : WR*Math.sin(A1)+(ss-WR)*Math.sin(A2);
      return pt(aa, sd*(y-c*Math.sin(ang)), z+c*Math.cos(ang)); };
    const LE=[[3.6,2.6],[5.4,8],[6.1,13],[5.9,18],[4.6,22],[2.4,26]], TE=[[-7.2,2.6],[-10.6,7],[-11.4,12],[-11,17],[-9.9,21],[-7.8,24.6]];
    const FINGERS=[[.46,8.4],[.3,10.4],[.16,11.6],[.02,11.8],[-.13,10.9],[-.28,9.6],[-.42,8.1]];
    const wing=sd=>{
      const curl=e.curl*(1-up*.6);
      const fingerPts=FINGERS.map(([ang,len],i)=>{ const t=(i+.5)/7, ba=lerp(2.2,-7.3,t), bs=lerp(26.2,24.9,t), fw=.72;
        const P0=[ba+fw*Math.cos(ang)*.9, bs-fw*Math.sin(ang)*.9], P1=[ba-fw*Math.cos(ang)*.9, bs+fw*Math.sin(ang)*.9];
        const at=(k,off)=>{ const da=Math.sin(ang)*len*k, ds=Math.cos(ang)*len*k, w=off*(1-k*.62); return wp(sd, ba+da+w*Math.cos(ang), bs+ds-w*Math.sin(ang), curl*(k*k)*2.6*(1+i*.05)); };
        return {i, pts:[wp(sd,P0[0],P0[1],0),at(.45,fw*1.35),at(.8,fw*1.05),at(1,fw*.35),at(1.03,0),at(1,-fw*.35),at(.8,-fw*1.05),at(.45,-fw*1.35),wp(sd,P1[0],P1[1],0)], tip:at(1.03,0), mid:at(.5,0), base:wp(sd,ba,bs,0)}; });
      /* each finger, the dark primaries — drawn first so the hand covers their roots */
      for(const F of fingerPts){ const c=under? mixv(L(FING,.8),[240,160,90],glow*.16) : L(FING,1.2); smooth(F.pts,rgb(c)); if(px>.5) line(F.base,F.mid,rgb(under? [150,128,110] : [80,64,50],.35),Math.max(.4,px*.18)); }
      /* the wing itself, with the scalloped trailing edge of its secondaries */
      const out=[]; for(const [a,s] of LE) out.push(wp(sd,a,s,0));
      const te=[]; for(let i=TE.length-1;i>0;i--){ const [a0,s0]=TE[i], [a1,s1]=TE[i-1]; const n=Math.max(1,Math.round(Math.abs(s1-s0)/1.7)); for(let k=0;k<n;k++){ const t=k/n, a=lerp(a0,a1,t)-(k%2? .0 : .42), s=lerp(s0,s1,t); te.push(wp(sd,a,s,0)); } } te.push(wp(sd,TE[0][0],TE[0][1],0));
      const base=under? L(BRD,1) : L(COV,1.15); { const r0=wp(sd,0,3,0), r1=wp(sd,0,34,0), g=x.createLinearGradient(r0[0],r0[1],r1[0],r1[1]); g.addColorStop(0,rgb(mixv(base,[255,214,170],lit*.12))); g.addColorStop(1,rgb(mulv(base,.82))); poly(out.concat(te),g); }
      /* the flight feathers: the back half of the wing, paler underneath and glowing where the sun shines through */
      const remCol=under? mixv(L(REMU,.6),[236,160,96],glow*.14) : L(REMT,1.1);
      const band=[]; for(let i=0;i<TE.length;i++){ const [a,s]=TE[i]; band.push(wp(sd,lerp(LE[i][0],a,.48),lerp(LE[i][1],s,.48),0)); }
      { const g=x.createLinearGradient(band[0][0],band[0][1],te[0][0],te[0][1]); g.addColorStop(0,rgb(remCol)); g.addColorStop(1,rgb(mixv(remCol,under?[250,180,112]:remCol,glow*.16))); poly(band.concat(te),g); }
      /* the feather shafts and separations across the secondaries */
      if(px>.35){ x.globalAlpha*=.55; for(let i=0;i<14;i++){ const t=(i+.5)/14, s=lerp(3.4,24,t), k=Math.min(TE.length-2,Math.floor(t*(TE.length-1))), kk=t*(TE.length-1)-k;
          const a0=lerp(lerp(LE[k][0],TE[k][0],.5),lerp(LE[k+1][0],TE[k+1][0],.5),kk), a1=lerp(TE[k][0],TE[k+1][0],kk)+.25; line(wp(sd,a0,s,0),wp(sd,a1,s,0),rgb(under? mulv(remCol,.72) : [20,14,10]),Math.max(.35,px*.16)); }
        x.globalAlpha/=.55; }
      /* coverts: on top the paler tawny shoulders, underneath the darker lining with a pale mottled band (axillaries) */
      if(!under){ const cv=[wp(sd,3.6,3,0),wp(sd,4.3,10,0),wp(sd,4.2,16,0),wp(sd,1.2,15.5,0),wp(sd,-.6,9,0),wp(sd,-1.4,3,0)]; smooth(cv,rgb(L(TAWNY,1.1),.28)); }
      else { const cv=[wp(sd,1.2,3,0),wp(sd,1.6,10,0),wp(sd,1,16,0),wp(sd,-.6,15,0),wp(sd,-1,9,0),wp(sd,-1.4,3,0)]; smooth(cv,rgb(mixv(L(BRD,1),[150,130,112],.18),.8)); }
      /* the leading edge catches the light */
      { const le=LE.map(([a,s])=>wp(sd,a+.2,s,.1)); x.strokeStyle=rgb(mixv(L(COV,1.6),[255,200,140],lit*.4),.55); x.lineWidth=Math.max(.5,px*.5); x.beginPath(); x.moveTo(le[0][0],le[0][1]); for(const q of le) x.lineTo(q[0],q[1]); x.stroke(); }
      /* backlit: the trailing edge and the finger tips rim with gold */
      if(glow>.05){ x.strokeStyle=rgb([255,196,124],glow*.55); x.lineWidth=Math.max(.5,px*.35); x.beginPath(); x.moveTo(te[0][0],te[0][1]); for(const q of te) x.lineTo(q[0],q[1]); x.stroke();
        for(const F of fingerPts){ x.beginPath(); x.moveTo(F.mid[0],F.mid[1]); x.lineTo(F.tip[0],F.tip[1]); x.stroke(); } }
    };
    /* the white tail: a short broad wedge of twelve feathers, fanned wider in the turns, twisting a little to steer */
    const tail=()=>{ const sp=1+Math.min(.45,Math.abs(e.bank)*.55), tw=-e.bank*.22, fe=[];
      for(let j=0;j<12;j++){ const th=lerp(-.36,.36,j/11)*sp, len=11.2-Math.abs(th)*3.2; fe.push({th,len}); }
      const rootL=pt(-7.2,-1.8,-.2), rootR=pt(-7.2,1.8,-.2), tipAt=(th,len)=>{ const a=-7.2-Math.cos(th)*len, b=Math.sin(th)*len*1.15; return pt(a,b,-.5-len*.03+b*tw); };
      const edge=[rootL]; for(const F of fe) edge.push(tipAt(F.th,F.len)); edge.push(rootR);
      const tc=under? mixv(L(WH,.9),[255,196,130],glow*.25) : L(WH,1); smooth(edge,rgb(tc));
      if(px>.35){ for(let j=1;j<12;j++){ const th=(fe[j-1].th+fe[j].th)/2, len=(fe[j-1].len+fe[j].len)/2; const a=pt(-7.2-Math.cos(th)*2,Math.sin(th)*2,-.25), b=tipAt(th,len*.98); line(a,b,rgb(mulv(tc,.78),.5),Math.max(.3,px*.12)); } }
      const g=x.createLinearGradient(...pt(-7.2,0,0),...pt(-18.5,0,-.6)); g.addColorStop(0,rgb(mulv(tc,.72),.6)); g.addColorStop(.5,rgb(tc,0)); x.fillStyle=g; x.beginPath(); x.moveTo(edge[0][0],edge[0][1]); edge.forEach(q=>x.lineTo(q[0],q[1])); x.fill(); };   /* shadowed where it meets the body */
    /* the body: lofted from real sections, heavy through the chest */
    const SECT=[[-8.6,1.8,1.3,.2],[-6.6,3.0,2.5,.1],[-4,3.9,3.4,-.1],[-1,4.3,4.0,-.3],[2,4.0,4.0,-.3],[4.6,3.2,3.3,0],[6.4,2.5,2.7,.4]];
    const hPt=(a,b,c)=>{ const da=a-6.2, ch=Math.cos(e.hy), sh=Math.sin(e.hy), x1=da*ch-b*sh, y1=da*sh+b*ch, cp=Math.cos(e.hp), sp=Math.sin(e.hp), cz=c-.5;   /* the head turns on its neck */
      return pt(6.2+x1*cp+cz*sp, y1, .5+cz*cp-x1*sp); };
    const HEAD=[[6.2,2.6,2.8,.5],[7.8,2.65,2.75,.85],[9.6,2.5,2.55,1.05],[11.2,1.95,2.1,.95],[12.2,1.2,1.45,.75]];
    const BILLS=[[11.7,1.15,1.45,.55],[13.1,.9,1.2,.45],[14.5,.62,.9,.2],[15.4,.36,.58,-.25],[15.8,.16,.3,-.75]];
    const loft=(S,path,map)=>{ map=map||pt; const ring=(a,w,h,zc)=>{ for(let j=0;j<18;j++){ const th=j/18*6.283, q=map(a,w*Math.cos(th),zc+h*Math.sin(th)); j? path.lineTo(q[0],q[1]) : path.moveTo(q[0],q[1]); } path.closePath(); };
      for(let i=0;i<S.length-1;i++){ const A=S[i], B=S[i+1]; for(let k=0;k<3;k++){ const t=k/3; ring(A[0]+(B[0]-A[0])*t, A[1]+(B[1]-A[1])*t, A[2]+(B[2]-A[2])*t, A[3]+(B[3]-A[3])*t); } } const Z=S[S.length-1]; ring(Z[0],Z[1],Z[2],Z[3]); };
    const shadeIn=(path,topC,botC,a0,a1)=>{ x.save(); x.clip(path); const tp=pt(0,0,5), bt=pt(0,0,-5), g=x.createLinearGradient(tp[0],tp[1],bt[0],bt[1]); g.addColorStop(0,topC); g.addColorStop(.5,"rgba(0,0,0,0)"); g.addColorStop(1,botC); x.fillStyle=g; x.fillRect(0,0,x.canvas.width/.6,x.canvas.height/.6); x.restore(); };
    const body=()=>{ const b=new Path2D(); loft(SECT,b); x.fillStyle=rgb(L(BR,1)); x.fill(b);
      shadeIn(b,rgb([255,200,140],.16+lit*.2),"rgba(14,8,6,.38)");
      if(under){ for(const sd of [-1,1]){ const k0=pt(-4.6,sd*1.5,-2.9), k1=pt(-6.4,sd*1.3,-2.6); line(k0,k1,rgb(L(BRD,1)),Math.max(.8,px*1.6));   /* feathered legs drawn up, the yellow feet tucked back under the tail */
          const ft=pt(-6.9,sd*1.25,-2.4); x.fillStyle=rgb(L(FEET,1.1)); x.beginPath(); x.ellipse(ft[0],ft[1],Math.max(.6,px*.95),Math.max(.5,px*.6),0,0,6.283); x.fill();
          const tl=pt(-7.6,sd*1.1,-2.2); x.fillStyle="rgba(20,16,12,.85)"; x.beginPath(); x.arc(tl[0],tl[1],Math.max(.35,px*.28),0,6.283); x.fill(); } } };
    const head=()=>{ const hd=new Path2D(); loft(HEAD,hd,hPt); const hc=L(WH,.95); x.fillStyle=rgb(hc); x.fill(hd);
      { x.save(); x.clip(hd); const c=hPt(9,0,2.2), rr=Math.max(1,px*4.2), g=x.createRadialGradient(c[0],c[1],rr*.15,c[0],c[1],rr); g.addColorStop(0,"rgba(255,250,240,.22)"); g.addColorStop(1,"rgba(120,128,150,.42)"); x.fillStyle=g; x.fillRect(c[0]-rr*1.5,c[1]-rr*1.5,rr*3,rr*3);
        const n0=pt(6.4,0,0), g2=x.createRadialGradient(n0[0],n0[1],0,n0[0],n0[1],Math.max(1,px*2.6)); g2.addColorStop(0,rgb(L(BR,1),.55)); g2.addColorStop(1,rgb(L(BR,1),0)); x.fillStyle=g2; x.fillRect(n0[0]-px*3,n0[1]-px*3,px*6,px*6); x.restore(); }   /* the white hood shades into the dark body at the neck */
      const bl=new Path2D(); loft(BILLS,bl,hPt); x.fillStyle=rgb(L(BILL,1.15)); x.fill(bl);                                  /* the heavy yellow hooked bill */
      { const t0=hPt(15.2,0,-.2), t1=hPt(15.9,0,-1.05); line(t0,t1,rgb(L([214,160,40],1)),Math.max(.5,px*.5)); }
      const gp0=hPt(11.8,0,.05), gp1=hPt(14.6,0,-.05); line(gp0,gp1,rgb([120,84,30],.45),Math.max(.3,px*.16));               /* the gape line */
      for(const sd of [-1,1]){ const side=[0,1,2].map(i=>r[i]*sd), facing=dot(side,toEye); if(facing<-.15) continue;   /* the pale yellow eye under its heavy brow, on the side that faces us */
        const ey=hPt(10.4,sd*2.0,1.45), er=Math.max(.45,px*.52)*Math.min(1,.4+facing); x.fillStyle=rgb(L([228,206,96],1.1)); x.beginPath(); x.arc(ey[0],ey[1],er,0,6.283); x.fill();
        x.fillStyle="rgba(12,8,6,.95)"; x.beginPath(); x.arc(ey[0],ey[1],er*.48,0,6.283); x.fill();
        const b0=hPt(9.6,sd*2.15,2.1), b1=hPt(11.2,sd*1.8,1.95); line(b0,b1,rgb(mulv(hc,.72),.7),Math.max(.4,px*.32)); } };
    const near=sd=>{ const w=W3(0,sd*12,0); return w[0]*w[0]+w[1]*w[1]+w[2]*w[2]; }, farS=near(-1)>near(1)? -1 : 1;
    if(under){ wing(farS); wing(-farS); tail(); body(); head(); }
    else { wing(farS); tail(); body(); wing(-farS); head(); }
  }
  function redtail3D(x,e,P,f,proj,Kw,sunL){
    const crs=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]], nrm=v=>{ const l=Math.hypot(v[0],v[1],v[2])||1; return [v[0]/l,v[1]/l,v[2]/l]; }, dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
    const r0=nrm(crs(f,[0,-1,0])), u0=crs(r0,f), cb=Math.cos(e.bank), sb=Math.sin(e.bank);
    const r=[0,1,2].map(i=>r0[i]*cb+u0[i]*sb), u=[0,1,2].map(i=>u0[i]*cb-r0[i]*sb);                                     /* banked about its own long axis */
    const W3=(a,b,c)=>[P[0]+(f[0]*a+r[0]*b+u[0]*c)*Kw, P[1]+(f[1]*a+r[1]*b+u[1]*c)*Kw, P[2]+(f[2]*a+r[2]*b+u[2]*c)*Kw];
    const pt=(a,b,c)=>{ const w=W3(a,b,c); return proj(w[0],w[1],w[2]); };
    const sc=a=>{ const p0=pt(a,0,0), p1=pt(a+1,0,0), p2=pt(a,1,0), p3=pt(a,0,1); return Math.max(Math.hypot(p1[0]-p0[0],p1[1]-p0[1]),Math.hypot(p2[0]-p0[0],p2[1]-p0[1]),Math.hypot(p3[0]-p0[0],p3[1]-p0[1])); };
    const toEye=nrm([-P[0],-P[1],-P[2]]), under=dot(u,toEye)<=0;                                                    /* mostly we look up at its underside */
    const sTop=dot(u,sunL), lit=Math.max(0,Math.min(1,(under? -sTop : sTop)*1.6+.08));                               /* how much of the low sun the side we see is catching */
    const glow=Math.max(0,Math.min(1,(dot(nrm(P),sunL)-.55)/.4))*(1-lit*.7);                                         /* the sun behind the feathers: they glow at the edges */
    const L=(c,k)=>{ k=k??1; const l=lit*k; return [c[0]*(.6+.95*l)+7*(1-l), c[1]*(.6+.66*l)+8*(1-l), c[2]*(.6+.38*l)+13*(1-l)]; };
    const smooth=(pts,col)=>{ x.fillStyle=col; x.beginPath(); const n=pts.length, m=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2]; let q=m(pts[n-1],pts[0]); x.moveTo(q[0],q[1]); for(let i=0;i<n;i++){ const a=pts[i], b=pts[(i+1)%n], mm=m(a,b); x.quadraticCurveTo(a[0],a[1],mm[0],mm[1]); } x.closePath(); x.fill(); };
    const poly=(pts,col)=>{ x.fillStyle=col; x.beginPath(); x.moveTo(pts[0][0],pts[0][1]); for(let i=1;i<pts.length;i++) x.lineTo(pts[i][0],pts[i][1]); x.closePath(); x.fill(); };
    const line=(a,b,col,w)=>{ x.strokeStyle=col; x.lineWidth=w; x.beginPath(); x.moveTo(a[0],a[1]); x.lineTo(b[0],b[1]); x.stroke(); };
    const px=sc(0); x.lineCap="round"; x.lineJoin="round";
    const BR=[112,74,46], BRD=[214,200,176], COV=[104,70,44], TAWNY=[176,134,90], REMU=[206,196,180], REMT=[70,48,32], FING=[54,38,28], WH=[118,82,54], TAILC=[196,94,48], BILL=[60,58,60], FEET=[226,190,80];   /* brown back, the pale underside with its dark wingtips, the brick-red tail */
    /* the wing: a broad plank of an arm out to the wrist, then the hand, its primaries splayed into seven long slotted fingers, tips curling up under load */
    const A0=.07+Math.sin(e.t*1.7)*.012, A1=A0+e.amp*Math.cos(e.ph), A2=A1+e.amp*.5*Math.cos(e.ph-.75), up=Math.max(0,-Math.sin(e.ph))*Math.min(1,e.amp/.5);   /* the hand lags the arm and tucks a little on the upstroke */
    const WR=18;
    const wp=(sd,a,s,c)=>{ let ss=s, aa=a; if(s>WR){ const h=s-WR; ss=WR+h*(1-.22*up); aa=a-h*.3*up; }
      const ang=ss<=WR? A1 : A2, y=ss<=WR? ss*Math.cos(A1) : WR*Math.cos(A1)+(ss-WR)*Math.cos(A2), z=ss<=WR? ss*Math.sin(A1) : WR*Math.sin(A1)+(ss-WR)*Math.sin(A2);
      return pt(aa, sd*(y-c*Math.sin(ang)), z+c*Math.cos(ang)); };
    const LE=[[3.6,2.6],[5.6,8],[6.4,13],[6,18],[4.6,22],[2.4,25.4]], TE=[[-7.6,2.6],[-11.4,7],[-12.2,12],[-11.6,17],[-10.2,21],[-7.8,24.4]];   /* broad, rounded buteo wings */
    const FINGERS=[[.36,5.6],[.22,6.8],[.1,7.4],[-.02,7.4],[-.14,6.8],[-.26,6],[-.38,5.2]];
    const wing=sd=>{
      const curl=e.curl*(1-up*.6);
      const fingerPts=FINGERS.map(([ang,len],i)=>{ const t=(i+.5)/7, ba=lerp(2.2,-7.3,t), bs=lerp(26.2,24.9,t), fw=.72;
        const P0=[ba+fw*Math.cos(ang)*.9, bs-fw*Math.sin(ang)*.9], P1=[ba-fw*Math.cos(ang)*.9, bs+fw*Math.sin(ang)*.9];
        const at=(k,off)=>{ const da=Math.sin(ang)*len*k, ds=Math.cos(ang)*len*k, w=off*(1-k*.62); return wp(sd, ba+da+w*Math.cos(ang), bs+ds-w*Math.sin(ang), curl*(k*k)*2.6*(1+i*.05)); };
        return {i, pts:[wp(sd,P0[0],P0[1],0),at(.45,fw*1.35),at(.8,fw*1.05),at(1,fw*.35),at(1.03,0),at(1,-fw*.35),at(.8,-fw*1.05),at(.45,-fw*1.35),wp(sd,P1[0],P1[1],0)], tip:at(1.03,0), mid:at(.5,0), base:wp(sd,ba,bs,0)}; });
      /* each finger, the dark primaries — drawn first so the hand covers their roots */
      for(const F of fingerPts){ const c=under? mixv(L(FING,.8),[240,160,90],glow*.16) : L(FING,1.2); smooth(F.pts,rgb(c)); if(px>.5) line(F.base,F.mid,rgb(under? [150,128,110] : [80,64,50],.35),Math.max(.4,px*.18)); }
      /* the wing itself, with the scalloped trailing edge of its secondaries */
      const out=[]; for(const [a,s] of LE) out.push(wp(sd,a,s,0));
      const te=[]; for(let i=TE.length-1;i>0;i--){ const [a0,s0]=TE[i], [a1,s1]=TE[i-1]; const n=Math.max(1,Math.round(Math.abs(s1-s0)/1.7)); for(let k=0;k<n;k++){ const t=k/n, a=lerp(a0,a1,t)-(k%2? .0 : .42), s=lerp(s0,s1,t); te.push(wp(sd,a,s,0)); } } te.push(wp(sd,TE[0][0],TE[0][1],0));
      const base=under? L(BRD,1) : L(COV,1.15); { const r0=wp(sd,0,3,0), r1=wp(sd,0,34,0), g=x.createLinearGradient(r0[0],r0[1],r1[0],r1[1]); g.addColorStop(0,rgb(mixv(base,[255,214,170],lit*.12))); g.addColorStop(1,rgb(mulv(base,.82))); poly(out.concat(te),g); }
      /* the flight feathers: the back half of the wing, paler underneath and glowing where the sun shines through */
      const remCol=under? mixv(L(REMU,.6),[236,160,96],glow*.14) : L(REMT,1.1);
      const band=[]; for(let i=0;i<TE.length;i++){ const [a,s]=TE[i]; band.push(wp(sd,lerp(LE[i][0],a,.48),lerp(LE[i][1],s,.48),0)); }
      { const g=x.createLinearGradient(band[0][0],band[0][1],te[0][0],te[0][1]); g.addColorStop(0,rgb(remCol)); g.addColorStop(1,rgb(mixv(remCol,under?[250,180,112]:remCol,glow*.16))); poly(band.concat(te),g); }
      /* the feather shafts and separations across the secondaries */
      if(px>.35){ x.globalAlpha*=.55; for(let i=0;i<14;i++){ const t=(i+.5)/14, s=lerp(3.4,24,t), k=Math.min(TE.length-2,Math.floor(t*(TE.length-1))), kk=t*(TE.length-1)-k;
          const a0=lerp(lerp(LE[k][0],TE[k][0],.5),lerp(LE[k+1][0],TE[k+1][0],.5),kk), a1=lerp(TE[k][0],TE[k+1][0],kk)+.25; line(wp(sd,a0,s,0),wp(sd,a1,s,0),rgb(under? mulv(remCol,.72) : [20,14,10]),Math.max(.35,px*.16)); }
        x.globalAlpha/=.55; }
      /* coverts: on top the paler tawny shoulders, underneath the darker lining with a pale mottled band (axillaries) */
      if(under){ const pb=[wp(sd,4.2,3,0),wp(sd,5.4,9,0),wp(sd,5.6,15,0),wp(sd,4.4,15.6,0),wp(sd,4.2,9,0),wp(sd,3,3,0)]; smooth(pb,rgb(L([60,40,28],1),.85)); }   /* the dark patagial bar of a red-tail */
      if(!under){ const cv=[wp(sd,3.6,3,0),wp(sd,4.3,10,0),wp(sd,4.2,16,0),wp(sd,1.2,15.5,0),wp(sd,-.6,9,0),wp(sd,-1.4,3,0)]; smooth(cv,rgb(L(TAWNY,1.1),.28)); }
      else { const cv=[wp(sd,1.2,3,0),wp(sd,1.6,10,0),wp(sd,1,16,0),wp(sd,-.6,15,0),wp(sd,-1,9,0),wp(sd,-1.4,3,0)]; smooth(cv,rgb(mixv(L(BRD,1),[150,130,112],.18),.8)); }
      /* the leading edge catches the light */
      { const le=LE.map(([a,s])=>wp(sd,a+.2,s,.1)); x.strokeStyle=rgb(mixv(L(COV,1.6),[255,200,140],lit*.4),.55); x.lineWidth=Math.max(.5,px*.5); x.beginPath(); x.moveTo(le[0][0],le[0][1]); for(const q of le) x.lineTo(q[0],q[1]); x.stroke(); }
      /* backlit: the trailing edge and the finger tips rim with gold */
      if(glow>.05){ x.strokeStyle=rgb([255,196,124],glow*.55); x.lineWidth=Math.max(.5,px*.35); x.beginPath(); x.moveTo(te[0][0],te[0][1]); for(const q of te) x.lineTo(q[0],q[1]); x.stroke();
        for(const F of fingerPts){ x.beginPath(); x.moveTo(F.mid[0],F.mid[1]); x.lineTo(F.tip[0],F.tip[1]); x.stroke(); } }
    };
    /* the white tail: a short broad wedge of twelve feathers, fanned wider in the turns, twisting a little to steer */
    const tail=()=>{ const sp=1+Math.min(.45,Math.abs(e.bank)*.55), tw=-e.bank*.22, fe=[];
      for(let j=0;j<12;j++){ const th=lerp(-.36,.36,j/11)*sp, len=10.4-Math.abs(th)*2.4; fe.push({th,len}); }
      const rootL=pt(-7.2,-1.8,-.2), rootR=pt(-7.2,1.8,-.2), tipAt=(th,len)=>{ const a=-7.2-Math.cos(th)*len, b=Math.sin(th)*len*1.15; return pt(a,b,-.5-len*.03+b*tw); };
      const edge=[rootL]; for(const F of fe) edge.push(tipAt(F.th,F.len)); edge.push(rootR);
      const tc=under? mixv(L(TAILC,.9),[255,196,130],glow*.25) : L(TAILC,1); smooth(edge,rgb(tc));
      if(px>.35){ for(let j=1;j<12;j++){ const th=(fe[j-1].th+fe[j].th)/2, len=(fe[j-1].len+fe[j].len)/2; const a=pt(-7.2-Math.cos(th)*2,Math.sin(th)*2,-.25), b=tipAt(th,len*.98); line(a,b,rgb(mulv(tc,.78),.5),Math.max(.3,px*.12)); } }
      const g=x.createLinearGradient(...pt(-7.2,0,0),...pt(-18.5,0,-.6)); g.addColorStop(0,rgb(mulv(tc,.72),.6)); g.addColorStop(.5,rgb(tc,0)); x.fillStyle=g; x.beginPath(); x.moveTo(edge[0][0],edge[0][1]); edge.forEach(q=>x.lineTo(q[0],q[1])); x.fill(); };   /* shadowed where it meets the body */
    /* the body: lofted from real sections, heavy through the chest */
    const SECT=[[-8.6,1.8,1.3,.2],[-6.6,3.0,2.5,.1],[-4,3.9,3.4,-.1],[-1,4.3,4.0,-.3],[2,4.0,4.0,-.3],[4.6,3.2,3.3,0],[6.4,2.5,2.7,.4]];
    const hPt=(a,b,c)=>{ const da=a-6.2, ch=Math.cos(e.hy), sh=Math.sin(e.hy), x1=da*ch-b*sh, y1=da*sh+b*ch, cp=Math.cos(e.hp), sp=Math.sin(e.hp), cz=c-.5;   /* the head turns on its neck */
      return pt(6.2+x1*cp+cz*sp, y1, .5+cz*cp-x1*sp); };
    const HEAD=[[6.2,2.6,2.8,.5],[7.8,2.65,2.75,.85],[9.6,2.5,2.55,1.05],[11.2,1.95,2.1,.95],[12.2,1.2,1.45,.75]];
    const BILLS=[[11.7,1.15,1.45,.55],[13.1,.9,1.2,.45],[14.5,.62,.9,.2],[15.4,.36,.58,-.25],[15.8,.16,.3,-.75]];
    const loft=(S,path,map)=>{ map=map||pt; const ring=(a,w,h,zc)=>{ for(let j=0;j<18;j++){ const th=j/18*6.283, q=map(a,w*Math.cos(th),zc+h*Math.sin(th)); j? path.lineTo(q[0],q[1]) : path.moveTo(q[0],q[1]); } path.closePath(); };
      for(let i=0;i<S.length-1;i++){ const A=S[i], B=S[i+1]; for(let k=0;k<3;k++){ const t=k/3; ring(A[0]+(B[0]-A[0])*t, A[1]+(B[1]-A[1])*t, A[2]+(B[2]-A[2])*t, A[3]+(B[3]-A[3])*t); } } const Z=S[S.length-1]; ring(Z[0],Z[1],Z[2],Z[3]); };
    const shadeIn=(path,topC,botC,a0,a1)=>{ x.save(); x.clip(path); const tp=pt(0,0,5), bt=pt(0,0,-5), g=x.createLinearGradient(tp[0],tp[1],bt[0],bt[1]); g.addColorStop(0,topC); g.addColorStop(.5,"rgba(0,0,0,0)"); g.addColorStop(1,botC); x.fillStyle=g; x.fillRect(0,0,x.canvas.width/.6,x.canvas.height/.6); x.restore(); };
    const body=()=>{ const b=new Path2D(); loft(SECT,b); x.fillStyle=rgb(L(BR,1)); x.fill(b);
      if(under){ x.save(); x.clip(b); for(let i=0;i<9;i++){ const q=pt(-1.2+((i*37)%7)*.25,((i%3)-1)*1.6,-3.2); x.fillStyle=rgb(L([70,46,30],1),.6); x.beginPath(); x.ellipse(q[0],q[1],Math.max(.5,px*.8),Math.max(.4,px*.45),0,0,6.283); x.fill(); } x.restore(); }   /* the belly band */
      shadeIn(b,rgb([255,200,140],.16+lit*.2),"rgba(14,8,6,.38)");
      if(under){ for(const sd of [-1,1]){ const k0=pt(-4.6,sd*1.5,-2.9), k1=pt(-6.4,sd*1.3,-2.6); line(k0,k1,rgb(L(BRD,1)),Math.max(.8,px*1.6));   /* feathered legs drawn up, the yellow feet tucked back under the tail */
          const ft=pt(-6.9,sd*1.25,-2.4); x.fillStyle=rgb(L(FEET,1.1)); x.beginPath(); x.ellipse(ft[0],ft[1],Math.max(.6,px*.95),Math.max(.5,px*.6),0,0,6.283); x.fill();
          const tl=pt(-7.6,sd*1.1,-2.2); x.fillStyle="rgba(20,16,12,.85)"; x.beginPath(); x.arc(tl[0],tl[1],Math.max(.35,px*.28),0,6.283); x.fill(); } } };
    const head=()=>{ const hd=new Path2D(); loft(HEAD,hd,hPt); const hc=L(WH,.95); x.fillStyle=rgb(hc); x.fill(hd);
      { x.save(); x.clip(hd); const c=hPt(9,0,2.2), rr=Math.max(1,px*4.2), g=x.createRadialGradient(c[0],c[1],rr*.15,c[0],c[1],rr); g.addColorStop(0,"rgba(255,250,240,.22)"); g.addColorStop(1,"rgba(120,128,150,.42)"); x.fillStyle=g; x.fillRect(c[0]-rr*1.5,c[1]-rr*1.5,rr*3,rr*3);
        const n0=pt(6.4,0,0), g2=x.createRadialGradient(n0[0],n0[1],0,n0[0],n0[1],Math.max(1,px*2.6)); g2.addColorStop(0,rgb(L(BR,1),.55)); g2.addColorStop(1,rgb(L(BR,1),0)); x.fillStyle=g2; x.fillRect(n0[0]-px*3,n0[1]-px*3,px*6,px*6); x.restore(); }   /* the white hood shades into the dark body at the neck */
      const bl=new Path2D(); loft(BILLS,bl,hPt); x.fillStyle=rgb(L(BILL,1.15)); x.fill(bl);                                  /* the heavy yellow hooked bill */
      { const t0=hPt(15.2,0,-.2), t1=hPt(15.9,0,-1.05); line(t0,t1,rgb(L([214,160,40],1)),Math.max(.5,px*.5)); }
      const gp0=hPt(11.8,0,.05), gp1=hPt(14.6,0,-.05); line(gp0,gp1,rgb([120,84,30],.45),Math.max(.3,px*.16));               /* the gape line */
      for(const sd of [-1,1]){ const side=[0,1,2].map(i=>r[i]*sd), facing=dot(side,toEye); if(facing<-.15) continue;   /* the pale yellow eye under its heavy brow, on the side that faces us */
        const ey=hPt(10.4,sd*2.0,1.45), er=Math.max(.45,px*.52)*Math.min(1,.4+facing); x.fillStyle=rgb(L([150,90,40],1.1)); x.beginPath(); x.arc(ey[0],ey[1],er,0,6.283); x.fill();
        x.fillStyle="rgba(12,8,6,.95)"; x.beginPath(); x.arc(ey[0],ey[1],er*.48,0,6.283); x.fill();
        const b0=hPt(9.6,sd*2.15,2.1), b1=hPt(11.2,sd*1.8,1.95); line(b0,b1,rgb(mulv(hc,.72),.7),Math.max(.4,px*.32)); } };
    const near=sd=>{ const w=W3(0,sd*12,0); return w[0]*w[0]+w[1]*w[1]+w[2]*w[2]; }, farS=near(-1)>near(1)? -1 : 1;
    if(under){ wing(farS); wing(-farS); tail(); body(); head(); }
    else { wing(farS); tail(); body(); wing(-farS); head(); }
  }
  function falcon3D(x,e,P,f,proj,Kw,sunL){
    const crs=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]], nrm=v=>{ const l=Math.hypot(v[0],v[1],v[2])||1; return [v[0]/l,v[1]/l,v[2]/l]; }, dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
    const r0=nrm(crs(f,[0,-1,0])), u0=crs(r0,f), cb=Math.cos(e.bank), sb=Math.sin(e.bank);
    const r=[0,1,2].map(i=>r0[i]*cb+u0[i]*sb), u=[0,1,2].map(i=>u0[i]*cb-r0[i]*sb);                                     /* banked about its own long axis */
    const W3=(a,b,c)=>[P[0]+(f[0]*a+r[0]*b+u[0]*c)*Kw, P[1]+(f[1]*a+r[1]*b+u[1]*c)*Kw, P[2]+(f[2]*a+r[2]*b+u[2]*c)*Kw];
    const pt=(a,b,c)=>{ const w=W3(a,b,c); return proj(w[0],w[1],w[2]); };
    const sc=a=>{ const p0=pt(a,0,0), p1=pt(a+1,0,0), p2=pt(a,1,0), p3=pt(a,0,1); return Math.max(Math.hypot(p1[0]-p0[0],p1[1]-p0[1]),Math.hypot(p2[0]-p0[0],p2[1]-p0[1]),Math.hypot(p3[0]-p0[0],p3[1]-p0[1])); };
    const toEye=nrm([-P[0],-P[1],-P[2]]), under=dot(u,toEye)<=0;                                                    /* mostly we look up at its underside */
    const sTop=dot(u,sunL), lit=Math.max(0,Math.min(1,(under? -sTop : sTop)*1.6+.08));                               /* how much of the low sun the side we see is catching */
    const glow=Math.max(0,Math.min(1,(dot(nrm(P),sunL)-.55)/.4))*(1-lit*.7);                                         /* the sun behind the feathers: they glow at the edges */
    const L=(c,k)=>{ k=k??1; const l=lit*k; return [c[0]*(.6+.95*l)+7*(1-l), c[1]*(.6+.66*l)+8*(1-l), c[2]*(.6+.38*l)+13*(1-l)]; };
    const smooth=(pts,col)=>{ x.fillStyle=col; x.beginPath(); const n=pts.length, m=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2]; let q=m(pts[n-1],pts[0]); x.moveTo(q[0],q[1]); for(let i=0;i<n;i++){ const a=pts[i], b=pts[(i+1)%n], mm=m(a,b); x.quadraticCurveTo(a[0],a[1],mm[0],mm[1]); } x.closePath(); x.fill(); };
    const poly=(pts,col)=>{ x.fillStyle=col; x.beginPath(); x.moveTo(pts[0][0],pts[0][1]); for(let i=1;i<pts.length;i++) x.lineTo(pts[i][0],pts[i][1]); x.closePath(); x.fill(); };
    const line=(a,b,col,w)=>{ x.strokeStyle=col; x.lineWidth=w; x.beginPath(); x.moveTo(a[0],a[1]); x.lineTo(b[0],b[1]); x.stroke(); };
    const px=sc(0); x.lineCap="round"; x.lineJoin="round";
    const BR=[84,94,112], BRD=[206,200,190], COV=[78,90,112], TAWNY=[122,138,166], REMU=[172,168,162], REMT=[50,56,72], FING=[44,48,60], WH=[44,48,60], TAILC=[74,82,98], BILL=[70,70,76], FEET=[230,196,70];   /* slate-blue above, pale and finely barred below, the black hood and moustache */
    /* the wing: a broad plank of an arm out to the wrist, then the hand, its primaries splayed into seven long slotted fingers, tips curling up under load */
    const A0=.07+Math.sin(e.t*1.7)*.012, A1=A0+e.amp*Math.cos(e.ph), A2=A1+e.amp*.5*Math.cos(e.ph-.75), up=Math.max(0,-Math.sin(e.ph))*Math.min(1,e.amp/.5);   /* the hand lags the arm and tucks a little on the upstroke */
    const WR=18;
    const wp=(sd,a,s,c)=>{ let ss=s, aa=a; if(s>WR){ const h=s-WR; ss=WR+h*(1-.22*up); aa=a-h*.3*up; }
      const ang=ss<=WR? A1 : A2, y=ss<=WR? ss*Math.cos(A1) : WR*Math.cos(A1)+(ss-WR)*Math.cos(A2), z=ss<=WR? ss*Math.sin(A1) : WR*Math.sin(A1)+(ss-WR)*Math.sin(A2);
      return pt(aa, sd*(y-c*Math.sin(ang)), z+c*Math.cos(ang)); };
    const LE=[[3.4,2.6],[4.8,7],[5.2,11],[4.4,15],[2.4,19],[-.8,23.4]], TE=[[-6,2.6],[-7.8,6],[-7.6,10],[-6.6,14],[-5.2,18],[-3.6,21.6]];   /* long, narrow, sharply pointed falcon wings */
    const FINGERS=[[.22,4.4],[.12,5.4],[.04,6],[-.04,6.2],[-.12,5.6],[-.2,4.6],[-.28,3.6]];
    const wing=sd=>{
      const curl=e.curl*(1-up*.6);
      const fingerPts=FINGERS.map(([ang,len],i)=>{ const t=(i+.5)/7, ba=lerp(-.6,-3.8,t), bs=lerp(23.2,21.4,t), fw=.46;
        const P0=[ba+fw*Math.cos(ang)*.9, bs-fw*Math.sin(ang)*.9], P1=[ba-fw*Math.cos(ang)*.9, bs+fw*Math.sin(ang)*.9];
        const at=(k,off)=>{ const da=Math.sin(ang)*len*k, ds=Math.cos(ang)*len*k, w=off*(1-k*.62); return wp(sd, ba+da+w*Math.cos(ang), bs+ds-w*Math.sin(ang), curl*(k*k)*2.6*(1+i*.05)); };
        return {i, pts:[wp(sd,P0[0],P0[1],0),at(.45,fw*1.35),at(.8,fw*1.05),at(1,fw*.35),at(1.03,0),at(1,-fw*.35),at(.8,-fw*1.05),at(.45,-fw*1.35),wp(sd,P1[0],P1[1],0)], tip:at(1.03,0), mid:at(.5,0), base:wp(sd,ba,bs,0)}; });
      /* each finger, the dark primaries — drawn first so the hand covers their roots */
      for(const F of fingerPts){ const c=under? mixv(L(FING,.8),[240,160,90],glow*.16) : L(FING,1.2); smooth(F.pts,rgb(c)); if(px>.5) line(F.base,F.mid,rgb(under? [150,128,110] : [80,64,50],.35),Math.max(.4,px*.18)); }
      /* the wing itself, with the scalloped trailing edge of its secondaries */
      const out=[]; for(const [a,s] of LE) out.push(wp(sd,a,s,0));
      const te=[]; for(let i=TE.length-1;i>0;i--){ const [a0,s0]=TE[i], [a1,s1]=TE[i-1]; const n=Math.max(1,Math.round(Math.abs(s1-s0)/1.7)); for(let k=0;k<n;k++){ const t=k/n, a=lerp(a0,a1,t)-(k%2? .0 : .42), s=lerp(s0,s1,t); te.push(wp(sd,a,s,0)); } } te.push(wp(sd,TE[0][0],TE[0][1],0));
      const base=under? L(BRD,1) : L(COV,1.15); { const r0=wp(sd,0,3,0), r1=wp(sd,0,34,0), g=x.createLinearGradient(r0[0],r0[1],r1[0],r1[1]); g.addColorStop(0,rgb(mixv(base,[255,214,170],lit*.12))); g.addColorStop(1,rgb(mulv(base,.82))); poly(out.concat(te),g); }
      /* the flight feathers: the back half of the wing, paler underneath and glowing where the sun shines through */
      const remCol=under? mixv(L(REMU,.6),[236,160,96],glow*.14) : L(REMT,1.1);
      const band=[]; for(let i=0;i<TE.length;i++){ const [a,s]=TE[i]; band.push(wp(sd,lerp(LE[i][0],a,.48),lerp(LE[i][1],s,.48),0)); }
      { const g=x.createLinearGradient(band[0][0],band[0][1],te[0][0],te[0][1]); g.addColorStop(0,rgb(remCol)); g.addColorStop(1,rgb(mixv(remCol,under?[250,180,112]:remCol,glow*.16))); poly(band.concat(te),g); }
      /* the feather shafts and separations across the secondaries */
      if(px>.35){ x.globalAlpha*=.55; for(let i=0;i<14;i++){ const t=(i+.5)/14, s=lerp(3.4,24,t), k=Math.min(TE.length-2,Math.floor(t*(TE.length-1))), kk=t*(TE.length-1)-k;
          const a0=lerp(lerp(LE[k][0],TE[k][0],.5),lerp(LE[k+1][0],TE[k+1][0],.5),kk), a1=lerp(TE[k][0],TE[k+1][0],kk)+.25; line(wp(sd,a0,s,0),wp(sd,a1,s,0),rgb(under? mulv(remCol,.72) : [20,14,10]),Math.max(.35,px*.16)); }
        x.globalAlpha/=.55; }
      /* coverts: on top the paler tawny shoulders, underneath the darker lining with a pale mottled band (axillaries) */
      if(!under){ const cv=[wp(sd,3.6,3,0),wp(sd,4.3,10,0),wp(sd,4.2,16,0),wp(sd,1.2,15.5,0),wp(sd,-.6,9,0),wp(sd,-1.4,3,0)]; smooth(cv,rgb(L(TAWNY,1.1),.28)); }
      else { const cv=[wp(sd,1.2,3,0),wp(sd,1.6,10,0),wp(sd,1,16,0),wp(sd,-.6,15,0),wp(sd,-1,9,0),wp(sd,-1.4,3,0)]; smooth(cv,rgb(mixv(L(BRD,1),[150,130,112],.18),.8)); }
      /* the leading edge catches the light */
      { const le=LE.map(([a,s])=>wp(sd,a+.2,s,.1)); x.strokeStyle=rgb(mixv(L(COV,1.6),[255,200,140],lit*.4),.55); x.lineWidth=Math.max(.5,px*.5); x.beginPath(); x.moveTo(le[0][0],le[0][1]); for(const q of le) x.lineTo(q[0],q[1]); x.stroke(); }
      /* backlit: the trailing edge and the finger tips rim with gold */
      if(glow>.05){ x.strokeStyle=rgb([255,196,124],glow*.55); x.lineWidth=Math.max(.5,px*.35); x.beginPath(); x.moveTo(te[0][0],te[0][1]); for(const q of te) x.lineTo(q[0],q[1]); x.stroke();
        for(const F of fingerPts){ x.beginPath(); x.moveTo(F.mid[0],F.mid[1]); x.lineTo(F.tip[0],F.tip[1]); x.stroke(); } }
    };
    /* the white tail: a short broad wedge of twelve feathers, fanned wider in the turns, twisting a little to steer */
    const tail=()=>{ const sp=1+Math.min(.45,Math.abs(e.bank)*.55), tw=-e.bank*.22, fe=[];
      for(let j=0;j<12;j++){ const th=lerp(-.2,.2,j/11)*sp, len=11-Math.abs(th)*2; fe.push({th,len}); }   /* a long, narrow, square-ended tail */
      const rootL=pt(-7.2,-1.8,-.2), rootR=pt(-7.2,1.8,-.2), tipAt=(th,len)=>{ const a=-7.2-Math.cos(th)*len, b=Math.sin(th)*len*1.15; return pt(a,b,-.5-len*.03+b*tw); };
      const edge=[rootL]; for(const F of fe) edge.push(tipAt(F.th,F.len)); edge.push(rootR);
      const tc=under? mixv(L(TAILC,.9),[255,196,130],glow*.25) : L(TAILC,1); smooth(edge,rgb(tc));
      if(px>.35){ for(let j=1;j<12;j++){ const th=(fe[j-1].th+fe[j].th)/2, len=(fe[j-1].len+fe[j].len)/2; const a=pt(-7.2-Math.cos(th)*2,Math.sin(th)*2,-.25), b=tipAt(th,len*.98); line(a,b,rgb(mulv(tc,.78),.5),Math.max(.3,px*.12)); } }
      const g=x.createLinearGradient(...pt(-7.2,0,0),...pt(-18.5,0,-.6)); g.addColorStop(0,rgb(mulv(tc,.72),.6)); g.addColorStop(.5,rgb(tc,0)); x.fillStyle=g; x.beginPath(); x.moveTo(edge[0][0],edge[0][1]); edge.forEach(q=>x.lineTo(q[0],q[1])); x.fill(); };   /* shadowed where it meets the body */
    /* the body: lofted from real sections, heavy through the chest */
    const SECT=[[-8.6,1.8,1.3,.2],[-6.6,3.0,2.5,.1],[-4,3.9,3.4,-.1],[-1,4.3,4.0,-.3],[2,4.0,4.0,-.3],[4.6,3.2,3.3,0],[6.4,2.5,2.7,.4]];
    const hPt=(a,b,c)=>{ const da=a-6.2, ch=Math.cos(e.hy), sh=Math.sin(e.hy), x1=da*ch-b*sh, y1=da*sh+b*ch, cp=Math.cos(e.hp), sp=Math.sin(e.hp), cz=c-.5;   /* the head turns on its neck */
      return pt(6.2+x1*cp+cz*sp, y1, .5+cz*cp-x1*sp); };
    const HEAD=[[6.2,2.6,2.8,.5],[7.8,2.65,2.75,.85],[9.6,2.5,2.55,1.05],[11.2,1.95,2.1,.95],[12.2,1.2,1.45,.75]];
    const BILLS=[[11.7,1.15,1.45,.55],[13.1,.9,1.2,.45],[14.5,.62,.9,.2],[15.4,.36,.58,-.25],[15.8,.16,.3,-.75]];
    const loft=(S,path,map)=>{ map=map||pt; const ring=(a,w,h,zc)=>{ for(let j=0;j<18;j++){ const th=j/18*6.283, q=map(a,w*Math.cos(th),zc+h*Math.sin(th)); j? path.lineTo(q[0],q[1]) : path.moveTo(q[0],q[1]); } path.closePath(); };
      for(let i=0;i<S.length-1;i++){ const A=S[i], B=S[i+1]; for(let k=0;k<3;k++){ const t=k/3; ring(A[0]+(B[0]-A[0])*t, A[1]+(B[1]-A[1])*t, A[2]+(B[2]-A[2])*t, A[3]+(B[3]-A[3])*t); } } const Z=S[S.length-1]; ring(Z[0],Z[1],Z[2],Z[3]); };
    const shadeIn=(path,topC,botC,a0,a1)=>{ x.save(); x.clip(path); const tp=pt(0,0,5), bt=pt(0,0,-5), g=x.createLinearGradient(tp[0],tp[1],bt[0],bt[1]); g.addColorStop(0,topC); g.addColorStop(.5,"rgba(0,0,0,0)"); g.addColorStop(1,botC); x.fillStyle=g; x.fillRect(0,0,x.canvas.width/.6,x.canvas.height/.6); x.restore(); };
    const body=()=>{ const b=new Path2D(); loft(SECT,b); x.fillStyle=rgb(L(BR,1)); x.fill(b);
      if(under){ x.save(); x.clip(b); x.strokeStyle=rgb(L([90,84,80],1),.45); x.lineWidth=Math.max(.4,px*.35); for(let i=0;i<10;i++){ const a=-6+i*1.15, q0=pt(a,-3,-3), q1=pt(a+.3,3,-3); x.beginPath(); x.moveTo(q0[0],q0[1]); x.lineTo(q1[0],q1[1]); x.stroke(); } x.restore(); }   /* the fine barring across its breast and belly */
      shadeIn(b,rgb([255,200,140],.16+lit*.2),"rgba(14,8,6,.38)");
      if(under){ for(const sd of [-1,1]){ const k0=pt(-4.6,sd*1.5,-2.9), k1=pt(-6.4,sd*1.3,-2.6); line(k0,k1,rgb(L(BRD,1)),Math.max(.8,px*1.6));   /* feathered legs drawn up, the yellow feet tucked back under the tail */
          const ft=pt(-6.9,sd*1.25,-2.4); x.fillStyle=rgb(L(FEET,1.1)); x.beginPath(); x.ellipse(ft[0],ft[1],Math.max(.6,px*.95),Math.max(.5,px*.6),0,0,6.283); x.fill();
          const tl=pt(-7.6,sd*1.1,-2.2); x.fillStyle="rgba(20,16,12,.85)"; x.beginPath(); x.arc(tl[0],tl[1],Math.max(.35,px*.28),0,6.283); x.fill(); } } };
    const head=()=>{ const hd=new Path2D(); loft(HEAD,hd,hPt); const hc=L(WH,.95); x.fillStyle=rgb(hc); x.fill(hd);
      { x.save(); x.clip(hd); const c=hPt(9,0,2.2), rr=Math.max(1,px*4.2), g=x.createRadialGradient(c[0],c[1],rr*.15,c[0],c[1],rr); g.addColorStop(0,"rgba(255,250,240,.22)"); g.addColorStop(1,"rgba(120,128,150,.42)"); x.fillStyle=g; x.fillRect(c[0]-rr*1.5,c[1]-rr*1.5,rr*3,rr*3);
        const n0=pt(6.4,0,0), g2=x.createRadialGradient(n0[0],n0[1],0,n0[0],n0[1],Math.max(1,px*2.6)); g2.addColorStop(0,rgb(L(BR,1),.55)); g2.addColorStop(1,rgb(L(BR,1),0)); x.fillStyle=g2; x.fillRect(n0[0]-px*3,n0[1]-px*3,px*6,px*6); x.restore(); }   /* the white hood shades into the dark body at the neck */
      const bl=new Path2D(); loft(BILLS,bl,hPt); x.fillStyle=rgb(L(BILL,1.15)); x.fill(bl);                                  /* the heavy yellow hooked bill */
      { const t0=hPt(15.2,0,-.2), t1=hPt(15.9,0,-1.05); line(t0,t1,rgb(L([214,160,40],1)),Math.max(.5,px*.5)); }
      const gp0=hPt(11.8,0,.05), gp1=hPt(14.6,0,-.05); line(gp0,gp1,rgb([120,84,30],.45),Math.max(.3,px*.16));               /* the gape line */
      for(const sd of [-1,1]){ const side=[0,1,2].map(i=>r[i]*sd), facing=dot(side,toEye); if(facing<-.15) continue;   /* the pale yellow eye under its heavy brow, on the side that faces us */
        const ey=hPt(10.4,sd*2.0,1.45), er=Math.max(.45,px*.52)*Math.min(1,.4+facing); x.fillStyle=rgb([28,22,20]); x.beginPath(); x.arc(ey[0],ey[1],er,0,6.283); x.fill();
        x.fillStyle="rgba(12,8,6,.95)"; x.beginPath(); x.arc(ey[0],ey[1],er*.48,0,6.283); x.fill();
        const b0=hPt(9.6,sd*2.15,2.1), b1=hPt(11.2,sd*1.8,1.95); line(b0,b1,rgb(mulv(hc,.72),.7),Math.max(.4,px*.32)); } };
    const near=sd=>{ const w=W3(0,sd*12,0); return w[0]*w[0]+w[1]*w[1]+w[2]*w[2]; }, farS=near(-1)>near(1)? -1 : 1;
    if(under){ wing(farS); wing(-farS); tail(); body(); head(); }
    else { wing(farS); tail(); body(); wing(-farS); head(); }
  }
  function heron3D(x,e,P,f,proj,Kw,sunL){
    const crs=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]], nrm=v=>{ const l=Math.hypot(v[0],v[1],v[2])||1; return [v[0]/l,v[1]/l,v[2]/l]; }, dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
    const r0=nrm(crs(f,[0,-1,0])), u0=crs(r0,f), cb=Math.cos(e.bank), sb=Math.sin(e.bank);
    const r=[0,1,2].map(i=>r0[i]*cb+u0[i]*sb), u=[0,1,2].map(i=>u0[i]*cb-r0[i]*sb);                                     /* banked about its own long axis */
    const W3=(a,b,c)=>[P[0]+(f[0]*a+r[0]*b+u[0]*c)*Kw, P[1]+(f[1]*a+r[1]*b+u[1]*c)*Kw, P[2]+(f[2]*a+r[2]*b+u[2]*c)*Kw];
    const pt=(a,b,c)=>{ const w=W3(a,b,c); return proj(w[0],w[1],w[2]); };
    const sc=a=>{ const p0=pt(a,0,0), p1=pt(a+1,0,0), p2=pt(a,1,0), p3=pt(a,0,1); return Math.max(Math.hypot(p1[0]-p0[0],p1[1]-p0[1]),Math.hypot(p2[0]-p0[0],p2[1]-p0[1]),Math.hypot(p3[0]-p0[0],p3[1]-p0[1])); };
    const toEye=nrm([-P[0],-P[1],-P[2]]), under=dot(u,toEye)<=0;                                                    /* mostly we look up at its underside */
    const sTop=dot(u,sunL), lit=Math.max(0,Math.min(1,(under? -sTop : sTop)*1.6+.08));                               /* how much of the low sun the side we see is catching */
    const glow=Math.max(0,Math.min(1,(dot(nrm(P),sunL)-.55)/.4))*(1-lit*.7);                                         /* the sun behind the feathers: they glow at the edges */
    const L=(c,k)=>{ k=k??1; const l=lit*k; return [c[0]*(.6+.95*l)+7*(1-l), c[1]*(.6+.66*l)+8*(1-l), c[2]*(.6+.38*l)+13*(1-l)]; };
    const smooth=(pts,col)=>{ x.fillStyle=col; x.beginPath(); const n=pts.length, m=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2]; let q=m(pts[n-1],pts[0]); x.moveTo(q[0],q[1]); for(let i=0;i<n;i++){ const a=pts[i], b=pts[(i+1)%n], mm=m(a,b); x.quadraticCurveTo(a[0],a[1],mm[0],mm[1]); } x.closePath(); x.fill(); };
    const poly=(pts,col)=>{ x.fillStyle=col; x.beginPath(); x.moveTo(pts[0][0],pts[0][1]); for(let i=1;i<pts.length;i++) x.lineTo(pts[i][0],pts[i][1]); x.closePath(); x.fill(); };
    const line=(a,b,col,w)=>{ x.strokeStyle=col; x.lineWidth=w; x.beginPath(); x.moveTo(a[0],a[1]); x.lineTo(b[0],b[1]); x.stroke(); };
    const px=sc(0); x.lineCap="round"; x.lineJoin="round";
    const BR=[124,134,148], BRD=[108,116,132], COV=[128,138,154], TAWNY=[170,176,188], REMU=[66,70,84], REMT=[40,44,56], FING=[30,32,40], WH=[226,224,216], TAILC=[112,120,136], BILL=[214,170,70], FEET=[60,58,56];   /* blue-grey, with near-black flight feathers and a white face */
    /* the wing: a broad plank of an arm out to the wrist, then the hand, its primaries splayed into seven long slotted fingers, tips curling up under load */
    const A0=.07+Math.sin(e.t*1.7)*.012, A1=A0+e.amp*Math.cos(e.ph), A2=A1+e.amp*.5*Math.cos(e.ph-.75), up=Math.max(0,-Math.sin(e.ph))*Math.min(1,e.amp/.5);   /* the hand lags the arm and tucks a little on the upstroke */
    const WR=18;
    const wp=(sd,a,s,c)=>{ let ss=s, aa=a; if(s>WR){ const h=s-WR; ss=WR+h*(1-.22*up); aa=a-h*.3*up; }
      const ang=ss<=WR? A1 : A2, y=ss<=WR? ss*Math.cos(A1) : WR*Math.cos(A1)+(ss-WR)*Math.cos(A2), z=ss<=WR? ss*Math.sin(A1) : WR*Math.sin(A1)+(ss-WR)*Math.sin(A2);
      return pt(aa, sd*(y-c*Math.sin(ang)), z+c*Math.cos(ang)); };
    const LE=[[4,2.6],[5.8,8],[6.6,13],[6.4,18],[5.4,22],[3.4,26.4]], TE=[[-8,2.6],[-11.6,7],[-12.4,12],[-12,17],[-10.8,21],[-8.4,25]];   /* huge, broad, rounded wings, held bowed */
    const FINGERS=[[.34,5.8],[.22,6.8],[.1,7.4],[-.02,7.4],[-.14,6.8],[-.26,6.2],[-.38,5.4]];
    const wing=sd=>{
      const curl=e.curl*(1-up*.6);
      const fingerPts=FINGERS.map(([ang,len],i)=>{ const t=(i+.5)/7, ba=lerp(2.2,-7.3,t), bs=lerp(26.2,24.9,t), fw=.72;
        const P0=[ba+fw*Math.cos(ang)*.9, bs-fw*Math.sin(ang)*.9], P1=[ba-fw*Math.cos(ang)*.9, bs+fw*Math.sin(ang)*.9];
        const at=(k,off)=>{ const da=Math.sin(ang)*len*k, ds=Math.cos(ang)*len*k, w=off*(1-k*.62); return wp(sd, ba+da+w*Math.cos(ang), bs+ds-w*Math.sin(ang), curl*(k*k)*2.6*(1+i*.05)); };
        return {i, pts:[wp(sd,P0[0],P0[1],0),at(.45,fw*1.35),at(.8,fw*1.05),at(1,fw*.35),at(1.03,0),at(1,-fw*.35),at(.8,-fw*1.05),at(.45,-fw*1.35),wp(sd,P1[0],P1[1],0)], tip:at(1.03,0), mid:at(.5,0), base:wp(sd,ba,bs,0)}; });
      /* each finger, the dark primaries — drawn first so the hand covers their roots */
      for(const F of fingerPts){ const c=under? mixv(L(FING,.8),[240,160,90],glow*.16) : L(FING,1.2); smooth(F.pts,rgb(c)); if(px>.5) line(F.base,F.mid,rgb(under? [150,128,110] : [80,64,50],.35),Math.max(.4,px*.18)); }
      /* the wing itself, with the scalloped trailing edge of its secondaries */
      const out=[]; for(const [a,s] of LE) out.push(wp(sd,a,s,0));
      const te=[]; for(let i=TE.length-1;i>0;i--){ const [a0,s0]=TE[i], [a1,s1]=TE[i-1]; const n=Math.max(1,Math.round(Math.abs(s1-s0)/1.7)); for(let k=0;k<n;k++){ const t=k/n, a=lerp(a0,a1,t)-(k%2? .0 : .42), s=lerp(s0,s1,t); te.push(wp(sd,a,s,0)); } } te.push(wp(sd,TE[0][0],TE[0][1],0));
      const base=under? L(BRD,1) : L(COV,1.15); { const r0=wp(sd,0,3,0), r1=wp(sd,0,34,0), g=x.createLinearGradient(r0[0],r0[1],r1[0],r1[1]); g.addColorStop(0,rgb(mixv(base,[255,214,170],lit*.12))); g.addColorStop(1,rgb(mulv(base,.82))); poly(out.concat(te),g); }
      /* the flight feathers: the back half of the wing, paler underneath and glowing where the sun shines through */
      const remCol=under? mixv(L(REMU,.6),[236,160,96],glow*.14) : L(REMT,1.1);
      const band=[]; for(let i=0;i<TE.length;i++){ const [a,s]=TE[i]; band.push(wp(sd,lerp(LE[i][0],a,.48),lerp(LE[i][1],s,.48),0)); }
      { const g=x.createLinearGradient(band[0][0],band[0][1],te[0][0],te[0][1]); g.addColorStop(0,rgb(remCol)); g.addColorStop(1,rgb(mixv(remCol,under?[250,180,112]:remCol,glow*.16))); poly(band.concat(te),g); }
      /* the feather shafts and separations across the secondaries */
      if(px>.35){ x.globalAlpha*=.55; for(let i=0;i<14;i++){ const t=(i+.5)/14, s=lerp(3.4,24,t), k=Math.min(TE.length-2,Math.floor(t*(TE.length-1))), kk=t*(TE.length-1)-k;
          const a0=lerp(lerp(LE[k][0],TE[k][0],.5),lerp(LE[k+1][0],TE[k+1][0],.5),kk), a1=lerp(TE[k][0],TE[k+1][0],kk)+.25; line(wp(sd,a0,s,0),wp(sd,a1,s,0),rgb(under? mulv(remCol,.72) : [20,14,10]),Math.max(.35,px*.16)); }
        x.globalAlpha/=.55; }
      /* coverts: on top the paler tawny shoulders, underneath the darker lining with a pale mottled band (axillaries) */
      if(!under){ const cv=[wp(sd,3.6,3,0),wp(sd,4.3,10,0),wp(sd,4.2,16,0),wp(sd,1.2,15.5,0),wp(sd,-.6,9,0),wp(sd,-1.4,3,0)]; smooth(cv,rgb(L(TAWNY,1.1),.28)); }
      else { const cv=[wp(sd,1.2,3,0),wp(sd,1.6,10,0),wp(sd,1,16,0),wp(sd,-.6,15,0),wp(sd,-1,9,0),wp(sd,-1.4,3,0)]; smooth(cv,rgb(mixv(L(BRD,1),[150,130,112],.18),.8)); }
      /* the leading edge catches the light */
      { const le=LE.map(([a,s])=>wp(sd,a+.2,s,.1)); x.strokeStyle=rgb(mixv(L(COV,1.6),[255,200,140],lit*.4),.55); x.lineWidth=Math.max(.5,px*.5); x.beginPath(); x.moveTo(le[0][0],le[0][1]); for(const q of le) x.lineTo(q[0],q[1]); x.stroke(); }
      /* backlit: the trailing edge and the finger tips rim with gold */
      if(glow>.05){ x.strokeStyle=rgb([255,196,124],glow*.55); x.lineWidth=Math.max(.5,px*.35); x.beginPath(); x.moveTo(te[0][0],te[0][1]); for(const q of te) x.lineTo(q[0],q[1]); x.stroke();
        for(const F of fingerPts){ x.beginPath(); x.moveTo(F.mid[0],F.mid[1]); x.lineTo(F.tip[0],F.tip[1]); x.stroke(); } }
    };
    /* the white tail: a short broad wedge of twelve feathers, fanned wider in the turns, twisting a little to steer */
    const tail=()=>{ const sp=1+Math.min(.45,Math.abs(e.bank)*.55), tw=-e.bank*.22, fe=[];
      for(let j=0;j<12;j++){ const th=lerp(-.3,.3,j/11)*sp, len=5.2-Math.abs(th)*2; fe.push({th,len}); }   /* a short, rounded tail */
      const rootL=pt(-7.2,-1.8,-.2), rootR=pt(-7.2,1.8,-.2), tipAt=(th,len)=>{ const a=-7.2-Math.cos(th)*len, b=Math.sin(th)*len*1.15; return pt(a,b,-.5-len*.03+b*tw); };
      const edge=[rootL]; for(const F of fe) edge.push(tipAt(F.th,F.len)); edge.push(rootR);
      const tc=under? mixv(L(TAILC,.9),[255,196,130],glow*.25) : L(TAILC,1); smooth(edge,rgb(tc));
      if(px>.35){ for(let j=1;j<12;j++){ const th=(fe[j-1].th+fe[j].th)/2, len=(fe[j-1].len+fe[j].len)/2; const a=pt(-7.2-Math.cos(th)*2,Math.sin(th)*2,-.25), b=tipAt(th,len*.98); line(a,b,rgb(mulv(tc,.78),.5),Math.max(.3,px*.12)); } }
      const g=x.createLinearGradient(...pt(-7.2,0,0),...pt(-18.5,0,-.6)); g.addColorStop(0,rgb(mulv(tc,.72),.6)); g.addColorStop(.5,rgb(tc,0)); x.fillStyle=g; x.beginPath(); x.moveTo(edge[0][0],edge[0][1]); edge.forEach(q=>x.lineTo(q[0],q[1])); x.fill(); };   /* shadowed where it meets the body */
    /* the body: lofted from real sections, heavy through the chest */
    const SECT=[[-8.6,1.6,1.3,.2],[-6.6,2.6,2.4,.1],[-4,3.4,3.2,-.3],[-1,3.6,3.8,-.8],[2,3.4,4.4,-1.4],[4.6,2.6,3.6,-1.4],[6.4,1.9,2.2,-.4]];   /* a slim body with the folded neck bulging low under the chest */
    const hPt=(a,b,c)=>{ const da=a-6.2, ch=Math.cos(e.hy), sh=Math.sin(e.hy), x1=da*ch-b*sh, y1=da*sh+b*ch, cp=Math.cos(e.hp), sp=Math.sin(e.hp), cz=c-.5;   /* the head turns on its neck */
      return pt(6.2+x1*cp+cz*sp, y1, .5+cz*cp-x1*sp); };
    const HEAD=[[5.8,1.7,2,.1],[7.2,1.6,1.8,.6],[8.4,1.5,1.6,.9],[9.4,1.1,1.2,.9],[10,.7,.8,.8]];
    const BILLS=[[9.6,.7,.8,.75],[12,.55,.62,.65],[14.6,.4,.42,.5],[17,.24,.24,.35],[18.6,.06,.08,.25]];   /* the long yellow dagger of a bill */
    const loft=(S,path,map)=>{ map=map||pt; const ring=(a,w,h,zc)=>{ for(let j=0;j<18;j++){ const th=j/18*6.283, q=map(a,w*Math.cos(th),zc+h*Math.sin(th)); j? path.lineTo(q[0],q[1]) : path.moveTo(q[0],q[1]); } path.closePath(); };
      for(let i=0;i<S.length-1;i++){ const A=S[i], B=S[i+1]; for(let k=0;k<3;k++){ const t=k/3; ring(A[0]+(B[0]-A[0])*t, A[1]+(B[1]-A[1])*t, A[2]+(B[2]-A[2])*t, A[3]+(B[3]-A[3])*t); } } const Z=S[S.length-1]; ring(Z[0],Z[1],Z[2],Z[3]); };
    const shadeIn=(path,topC,botC,a0,a1)=>{ x.save(); x.clip(path); const tp=pt(0,0,5), bt=pt(0,0,-5), g=x.createLinearGradient(tp[0],tp[1],bt[0],bt[1]); g.addColorStop(0,topC); g.addColorStop(.5,"rgba(0,0,0,0)"); g.addColorStop(1,botC); x.fillStyle=g; x.fillRect(0,0,x.canvas.width/.6,x.canvas.height/.6); x.restore(); };
    const legs=()=>{ for(const sd of [-1,1]){ const k0=pt(-6,sd*.8,-1.4), k1=pt(-15,sd*.9,-1.8), k2=pt(-23,sd*1,-2.1); x.strokeStyle=rgb(L([54,52,52],.9)); x.lineCap="round"; x.lineWidth=Math.max(.6,px*.8); x.beginPath(); x.moveTo(k0[0],k0[1]); x.lineTo(k1[0],k1[1]); x.lineTo(k2[0],k2[1]); x.stroke();
        const t0=k2, t1=pt(-25,sd*1.3,-2.2); x.lineWidth=Math.max(.5,px*.5); x.beginPath(); x.moveTo(t0[0],t0[1]); x.lineTo(t1[0],t1[1]); x.stroke(); } };   /* the long legs trailing out well behind the tail */
    const plume=()=>{ const p0=hPt(7.4,0,1.9), p1=hPt(3.6,0,2.2), p2=hPt(2.4,0,1.6); x.strokeStyle=rgb(L([30,30,36],1)); x.lineWidth=Math.max(.5,px*.55); x.beginPath(); x.moveTo(p0[0],p0[1]); x.quadraticCurveTo(p1[0],p1[1],p2[0],p2[1]); x.stroke(); };   /* the black stripe over the eye running back into a plume */
    const body=()=>{ legs(); const b=new Path2D(); loft(SECT,b); x.fillStyle=rgb(L(BR,1)); x.fill(b);
      shadeIn(b,rgb([255,200,140],.16+lit*.2),"rgba(14,8,6,.38)");
      if(under){ for(const sd of [-1,1]){ const k0=pt(-4.6,sd*1.5,-2.9), k1=pt(-6.4,sd*1.3,-2.6); line(k0,k1,rgb(L(BRD,1)),Math.max(.8,px*1.6));   /* feathered legs drawn up, the yellow feet tucked back under the tail */
          const ft=pt(-6.9,sd*1.25,-2.4); x.fillStyle=rgb(L(FEET,1.1)); x.beginPath(); x.ellipse(ft[0],ft[1],Math.max(.6,px*.95),Math.max(.5,px*.6),0,0,6.283); x.fill();
          const tl=pt(-7.6,sd*1.1,-2.2); x.fillStyle="rgba(20,16,12,.85)"; x.beginPath(); x.arc(tl[0],tl[1],Math.max(.35,px*.28),0,6.283); x.fill(); } } };
    const head=()=>{ const hd=new Path2D(); loft(HEAD,hd,hPt); const hc=L(WH,.95); x.fillStyle=rgb(hc); x.fill(hd);
      { x.save(); x.clip(hd); const c=hPt(9,0,2.2), rr=Math.max(1,px*4.2), g=x.createRadialGradient(c[0],c[1],rr*.15,c[0],c[1],rr); g.addColorStop(0,"rgba(255,250,240,.22)"); g.addColorStop(1,"rgba(120,128,150,.42)"); x.fillStyle=g; x.fillRect(c[0]-rr*1.5,c[1]-rr*1.5,rr*3,rr*3);
        const n0=pt(6.4,0,0), g2=x.createRadialGradient(n0[0],n0[1],0,n0[0],n0[1],Math.max(1,px*2.6)); g2.addColorStop(0,rgb(L(BR,1),.55)); g2.addColorStop(1,rgb(L(BR,1),0)); x.fillStyle=g2; x.fillRect(n0[0]-px*3,n0[1]-px*3,px*6,px*6); x.restore(); }   /* the white hood shades into the dark body at the neck */
      plume(); const bl=new Path2D(); loft(BILLS,bl,hPt); x.fillStyle=rgb(L(BILL,1.15)); x.fill(bl);                                  /* the heavy yellow hooked bill */
      { const t0=hPt(15.2,0,-.2), t1=hPt(15.9,0,-1.05); line(t0,t1,rgb(L([214,160,40],1)),Math.max(.5,px*.5)); }
      const gp0=hPt(11.8,0,.05), gp1=hPt(14.6,0,-.05); line(gp0,gp1,rgb([120,84,30],.45),Math.max(.3,px*.16));               /* the gape line */
      for(const sd of [-1,1]){ const side=[0,1,2].map(i=>r[i]*sd), facing=dot(side,toEye); if(facing<-.15) continue;   /* the pale yellow eye under its heavy brow, on the side that faces us */
        const ey=hPt(10.4,sd*2.0,1.45), er=Math.max(.45,px*.52)*Math.min(1,.4+facing); x.fillStyle=rgb(L([236,206,80],1.1)); x.beginPath(); x.arc(ey[0],ey[1],er,0,6.283); x.fill();
        x.fillStyle="rgba(12,8,6,.95)"; x.beginPath(); x.arc(ey[0],ey[1],er*.48,0,6.283); x.fill();
        const b0=hPt(9.6,sd*2.15,2.1), b1=hPt(11.2,sd*1.8,1.95); line(b0,b1,rgb(mulv(hc,.72),.7),Math.max(.4,px*.32)); } };
    const near=sd=>{ const w=W3(0,sd*12,0); return w[0]*w[0]+w[1]*w[1]+w[2]*w[2]; }, farS=near(-1)>near(1)? -1 : 1;
    if(under){ wing(farS); wing(-farS); tail(); body(); head(); }
    else { wing(farS); tail(); body(); wing(-farS); head(); }
  }
  function raven3D(x,e,P,f,proj,Kw,sunL){
    const crs=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]], nrm=v=>{ const l=Math.hypot(v[0],v[1],v[2])||1; return [v[0]/l,v[1]/l,v[2]/l]; }, dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
    const r0=nrm(crs(f,[0,-1,0])), u0=crs(r0,f), cb=Math.cos(e.bank), sb=Math.sin(e.bank);
    const r=[0,1,2].map(i=>r0[i]*cb+u0[i]*sb), u=[0,1,2].map(i=>u0[i]*cb-r0[i]*sb);                                     /* banked about its own long axis */
    const W3=(a,b,c)=>[P[0]+(f[0]*a+r[0]*b+u[0]*c)*Kw, P[1]+(f[1]*a+r[1]*b+u[1]*c)*Kw, P[2]+(f[2]*a+r[2]*b+u[2]*c)*Kw];
    const pt=(a,b,c)=>{ const w=W3(a,b,c); return proj(w[0],w[1],w[2]); };
    const sc=a=>{ const p0=pt(a,0,0), p1=pt(a+1,0,0), p2=pt(a,1,0), p3=pt(a,0,1); return Math.max(Math.hypot(p1[0]-p0[0],p1[1]-p0[1]),Math.hypot(p2[0]-p0[0],p2[1]-p0[1]),Math.hypot(p3[0]-p0[0],p3[1]-p0[1])); };
    const toEye=nrm([-P[0],-P[1],-P[2]]), under=dot(u,toEye)<=0;                                                    /* mostly we look up at its underside */
    const sTop=dot(u,sunL), lit=Math.max(0,Math.min(1,(under? -sTop : sTop)*1.6+.08));                               /* how much of the low sun the side we see is catching */
    const glow=Math.max(0,Math.min(1,(dot(nrm(P),sunL)-.55)/.4))*(1-lit*.7);                                         /* the sun behind the feathers: they glow at the edges */
    const L=(c,k)=>{ k=k??1; const l=lit*k; return [c[0]*(.6+.95*l)+7*(1-l), c[1]*(.6+.66*l)+8*(1-l), c[2]*(.6+.38*l)+13*(1-l)]; };
    const smooth=(pts,col)=>{ x.fillStyle=col; x.beginPath(); const n=pts.length, m=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2]; let q=m(pts[n-1],pts[0]); x.moveTo(q[0],q[1]); for(let i=0;i<n;i++){ const a=pts[i], b=pts[(i+1)%n], mm=m(a,b); x.quadraticCurveTo(a[0],a[1],mm[0],mm[1]); } x.closePath(); x.fill(); };
    const poly=(pts,col)=>{ x.fillStyle=col; x.beginPath(); x.moveTo(pts[0][0],pts[0][1]); for(let i=1;i<pts.length;i++) x.lineTo(pts[i][0],pts[i][1]); x.closePath(); x.fill(); };
    const line=(a,b,col,w)=>{ x.strokeStyle=col; x.lineWidth=w; x.beginPath(); x.moveTo(a[0],a[1]); x.lineTo(b[0],b[1]); x.stroke(); };
    const px=sc(0); x.lineCap="round"; x.lineJoin="round";
    const BR=[24,24,31], BRD=[16,16,22], COV=[30,31,42], TAWNY=[74,86,150], REMU=[46,47,56], REMT=[20,20,27], FING=[16,16,21], WH=[26,26,34], BILL=[22,22,27], FEET=[30,30,34];   /* glossy black all over, the wings and back shot with blue and violet */
    /* the wing: a broad plank of an arm out to the wrist, then the hand, its primaries splayed into seven long slotted fingers, tips curling up under load */
    const A0=.07+Math.sin(e.t*1.7)*.012, A1=A0+e.amp*Math.cos(e.ph), A2=A1+e.amp*.5*Math.cos(e.ph-.75), up=Math.max(0,-Math.sin(e.ph))*Math.min(1,e.amp/.5);   /* the hand lags the arm and tucks a little on the upstroke */
    const WR=18;
    const wp=(sd,a,s,c)=>{ let ss=s, aa=a; if(s>WR){ const h=s-WR; ss=WR+h*(1-.22*up); aa=a-h*.3*up; }
      const ang=ss<=WR? A1 : A2, y=ss<=WR? ss*Math.cos(A1) : WR*Math.cos(A1)+(ss-WR)*Math.cos(A2), z=ss<=WR? ss*Math.sin(A1) : WR*Math.sin(A1)+(ss-WR)*Math.sin(A2);
      return pt(aa, sd*(y-c*Math.sin(ang)), z+c*Math.cos(ang)); };
    const LE=[[3.6,2.6],[5.4,8],[6.1,13],[5.9,18],[4.6,22],[2.4,26]], TE=[[-7.2,2.6],[-10.6,7],[-11.4,12],[-11,17],[-9.9,21],[-7.8,24.6]];
    const FINGERS=[[.46,8.4],[.3,10.4],[.16,11.6],[.02,11.8],[-.13,10.9],[-.28,9.6],[-.42,8.1]];
    const wing=sd=>{
      const curl=e.curl*(1-up*.6);
      const fingerPts=FINGERS.map(([ang,len],i)=>{ const t=(i+.5)/7, ba=lerp(2.2,-7.3,t), bs=lerp(26.2,24.9,t), fw=.72;
        const P0=[ba+fw*Math.cos(ang)*.9, bs-fw*Math.sin(ang)*.9], P1=[ba-fw*Math.cos(ang)*.9, bs+fw*Math.sin(ang)*.9];
        const at=(k,off)=>{ const da=Math.sin(ang)*len*k, ds=Math.cos(ang)*len*k, w=off*(1-k*.62); return wp(sd, ba+da+w*Math.cos(ang), bs+ds-w*Math.sin(ang), curl*(k*k)*2.6*(1+i*.05)); };
        return {i, pts:[wp(sd,P0[0],P0[1],0),at(.45,fw*1.35),at(.8,fw*1.05),at(1,fw*.35),at(1.03,0),at(1,-fw*.35),at(.8,-fw*1.05),at(.45,-fw*1.35),wp(sd,P1[0],P1[1],0)], tip:at(1.03,0), mid:at(.5,0), base:wp(sd,ba,bs,0)}; });
      /* each finger, the dark primaries — drawn first so the hand covers their roots */
      for(const F of fingerPts){ const c=under? mixv(L(FING,.8),[240,160,90],glow*.16) : L(FING,1.2); smooth(F.pts,rgb(c)); if(px>.5) line(F.base,F.mid,rgb(under? [150,128,110] : [80,64,50],.35),Math.max(.4,px*.18)); }
      /* the wing itself, with the scalloped trailing edge of its secondaries */
      const out=[]; for(const [a,s] of LE) out.push(wp(sd,a,s,0));
      const te=[]; for(let i=TE.length-1;i>0;i--){ const [a0,s0]=TE[i], [a1,s1]=TE[i-1]; const n=Math.max(1,Math.round(Math.abs(s1-s0)/1.7)); for(let k=0;k<n;k++){ const t=k/n, a=lerp(a0,a1,t)-(k%2? .0 : .42), s=lerp(s0,s1,t); te.push(wp(sd,a,s,0)); } } te.push(wp(sd,TE[0][0],TE[0][1],0));
      const base=under? L(BRD,1) : L(COV,1.15); { const r0=wp(sd,0,3,0), r1=wp(sd,0,34,0), g=x.createLinearGradient(r0[0],r0[1],r1[0],r1[1]); g.addColorStop(0,rgb(mixv(base,[255,214,170],lit*.12))); g.addColorStop(1,rgb(mulv(base,.82))); poly(out.concat(te),g); }
      /* the flight feathers: the back half of the wing, paler underneath and glowing where the sun shines through */
      const remCol=under? mixv(L(REMU,.6),[236,160,96],glow*.14) : L(REMT,1.1);
      const band=[]; for(let i=0;i<TE.length;i++){ const [a,s]=TE[i]; band.push(wp(sd,lerp(LE[i][0],a,.48),lerp(LE[i][1],s,.48),0)); }
      { const g=x.createLinearGradient(band[0][0],band[0][1],te[0][0],te[0][1]); g.addColorStop(0,rgb(remCol)); g.addColorStop(1,rgb(mixv(remCol,under?[250,180,112]:remCol,glow*.16))); poly(band.concat(te),g); }
      /* the feather shafts and separations across the secondaries */
      if(px>.35){ x.globalAlpha*=.55; for(let i=0;i<14;i++){ const t=(i+.5)/14, s=lerp(3.4,24,t), k=Math.min(TE.length-2,Math.floor(t*(TE.length-1))), kk=t*(TE.length-1)-k;
          const a0=lerp(lerp(LE[k][0],TE[k][0],.5),lerp(LE[k+1][0],TE[k+1][0],.5),kk), a1=lerp(TE[k][0],TE[k+1][0],kk)+.25; line(wp(sd,a0,s,0),wp(sd,a1,s,0),rgb(under? mulv(remCol,.72) : [20,14,10]),Math.max(.35,px*.16)); }
        x.globalAlpha/=.55; }
      /* coverts: on top the paler tawny shoulders, underneath the darker lining with a pale mottled band (axillaries) */
      if(!under){ const cv=[wp(sd,3.6,3,0),wp(sd,4.3,10,0),wp(sd,4.2,16,0),wp(sd,1.2,15.5,0),wp(sd,-.6,9,0),wp(sd,-1.4,3,0)]; smooth(cv,rgb(L(TAWNY,1.3),.22+.25*lit)); }   /* the iridescent sheen across the coverts */
      else { const cv=[wp(sd,1.2,3,0),wp(sd,1.6,10,0),wp(sd,1,16,0),wp(sd,-.6,15,0),wp(sd,-1,9,0),wp(sd,-1.4,3,0)]; smooth(cv,rgb(mixv(L(BRD,1),[70,76,104],.18),.8)); }
      /* the leading edge catches the light */
      { const le=LE.map(([a,s])=>wp(sd,a+.2,s,.1)); x.strokeStyle=rgb(mixv(L(COV,1.6),[255,200,140],lit*.4),.55); x.lineWidth=Math.max(.5,px*.5); x.beginPath(); x.moveTo(le[0][0],le[0][1]); for(const q of le) x.lineTo(q[0],q[1]); x.stroke(); }
      /* backlit: the trailing edge and the finger tips rim with gold */
      if(glow>.05){ x.strokeStyle=rgb([255,196,124],glow*.55); x.lineWidth=Math.max(.5,px*.35); x.beginPath(); x.moveTo(te[0][0],te[0][1]); for(const q of te) x.lineTo(q[0],q[1]); x.stroke();
        for(const F of fingerPts){ x.beginPath(); x.moveTo(F.mid[0],F.mid[1]); x.lineTo(F.tip[0],F.tip[1]); x.stroke(); } }
    };
    /* the white tail: a short broad wedge of twelve feathers, fanned wider in the turns, twisting a little to steer */
    const tail=()=>{ const sp=1+Math.min(.45,Math.abs(e.bank)*.55), tw=-e.bank*.22, fe=[];
      for(let j=0;j<12;j++){ const th=lerp(-.3,.3,j/11)*sp, len=13.6-Math.abs(th)*14; fe.push({th,len}); }   /* the raven's long wedge-shaped tail */
      const rootL=pt(-7.2,-1.8,-.2), rootR=pt(-7.2,1.8,-.2), tipAt=(th,len)=>{ const a=-7.2-Math.cos(th)*len, b=Math.sin(th)*len*1.15; return pt(a,b,-.5-len*.03+b*tw); };
      const edge=[rootL]; for(const F of fe) edge.push(tipAt(F.th,F.len)); edge.push(rootR);
      const tc=under? mixv(L(WH,.9),[255,196,130],glow*.25) : L(WH,1); smooth(edge,rgb(tc));
      if(px>.35){ for(let j=1;j<12;j++){ const th=(fe[j-1].th+fe[j].th)/2, len=(fe[j-1].len+fe[j].len)/2; const a=pt(-7.2-Math.cos(th)*2,Math.sin(th)*2,-.25), b=tipAt(th,len*.98); line(a,b,rgb(mulv(tc,.78),.5),Math.max(.3,px*.12)); } }
      const g=x.createLinearGradient(...pt(-7.2,0,0),...pt(-18.5,0,-.6)); g.addColorStop(0,rgb(mulv(tc,.72),.6)); g.addColorStop(.5,rgb(tc,0)); x.fillStyle=g; x.beginPath(); x.moveTo(edge[0][0],edge[0][1]); edge.forEach(q=>x.lineTo(q[0],q[1])); x.fill(); };   /* shadowed where it meets the body */
    /* the body: lofted from real sections, heavy through the chest */
    const SECT=[[-8.6,1.8,1.3,.2],[-6.6,3.0,2.5,.1],[-4,3.9,3.4,-.1],[-1,4.3,4.0,-.3],[2,4.0,4.0,-.3],[4.6,3.2,3.3,0],[6.4,2.5,2.7,.4]];
    const hPt=(a,b,c)=>{ const da=a-6.2, ch=Math.cos(e.hy), sh=Math.sin(e.hy), x1=da*ch-b*sh, y1=da*sh+b*ch, cp=Math.cos(e.hp), sp=Math.sin(e.hp), cz=c-.5;   /* the head turns on its neck */
      return pt(6.2+x1*cp+cz*sp, y1, .5+cz*cp-x1*sp); };
    const HEAD=[[6.2,2.9,3.2,.2],[7.6,2.8,3.05,.6],[9.4,2.5,2.6,.95],[11,1.9,2.1,.95],[12,1.3,1.6,.75]];   /* the shaggy throat makes the head look heavy */
    const BILLS=[[11.4,1.25,1.55,.55],[13,1.0,1.3,.45],[14.6,.7,.95,.3],[15.8,.4,.6,0],[16.4,.18,.3,-.45]];   /* the huge, deep, arched raven bill */
    const loft=(S,path,map)=>{ map=map||pt; const ring=(a,w,h,zc)=>{ for(let j=0;j<18;j++){ const th=j/18*6.283, q=map(a,w*Math.cos(th),zc+h*Math.sin(th)); j? path.lineTo(q[0],q[1]) : path.moveTo(q[0],q[1]); } path.closePath(); };
      for(let i=0;i<S.length-1;i++){ const A=S[i], B=S[i+1]; for(let k=0;k<3;k++){ const t=k/3; ring(A[0]+(B[0]-A[0])*t, A[1]+(B[1]-A[1])*t, A[2]+(B[2]-A[2])*t, A[3]+(B[3]-A[3])*t); } } const Z=S[S.length-1]; ring(Z[0],Z[1],Z[2],Z[3]); };
    const shadeIn=(path,topC,botC,a0,a1)=>{ x.save(); x.clip(path); const tp=pt(0,0,5), bt=pt(0,0,-5), g=x.createLinearGradient(tp[0],tp[1],bt[0],bt[1]); g.addColorStop(0,topC); g.addColorStop(.5,"rgba(0,0,0,0)"); g.addColorStop(1,botC); x.fillStyle=g; x.fillRect(0,0,x.canvas.width/.6,x.canvas.height/.6); x.restore(); };
    const body=()=>{ const b=new Path2D(); loft(SECT,b); x.fillStyle=rgb(L(BR,1)); x.fill(b);
      shadeIn(b,rgb([255,200,140],.16+lit*.2),"rgba(14,8,6,.38)");
      if(under){ for(const sd of [-1,1]){ const k0=pt(-4.6,sd*1.5,-2.9), k1=pt(-6.4,sd*1.3,-2.6); line(k0,k1,rgb(L(BRD,1)),Math.max(.8,px*1.6));   /* feathered legs drawn up, the yellow feet tucked back under the tail */
          const ft=pt(-6.9,sd*1.25,-2.4); x.fillStyle=rgb(L(FEET,1.1)); x.beginPath(); x.ellipse(ft[0],ft[1],Math.max(.6,px*.95),Math.max(.5,px*.6),0,0,6.283); x.fill();
          const tl=pt(-7.6,sd*1.1,-2.2); x.fillStyle="rgba(20,16,12,.85)"; x.beginPath(); x.arc(tl[0],tl[1],Math.max(.35,px*.28),0,6.283); x.fill(); } } };
    const head=()=>{ const hd=new Path2D(); loft(HEAD,hd,hPt); const hc=L(WH,.95); x.fillStyle=rgb(hc); x.fill(hd);
      { x.save(); x.clip(hd); const c=hPt(9,0,2.2), rr=Math.max(1,px*4.2), g=x.createRadialGradient(c[0],c[1],rr*.15,c[0],c[1],rr); g.addColorStop(0,`rgba(120,140,210,${(.12+.25*lit).toFixed(2)})`); g.addColorStop(1,"rgba(6,6,10,.35)"); x.fillStyle=g; x.fillRect(c[0]-rr*1.5,c[1]-rr*1.5,rr*3,rr*3);
        const n0=pt(6.4,0,0), g2=x.createRadialGradient(n0[0],n0[1],0,n0[0],n0[1],Math.max(1,px*2.6)); g2.addColorStop(0,rgb(L(BR,1),.55)); g2.addColorStop(1,rgb(L(BR,1),0)); x.fillStyle=g2; x.fillRect(n0[0]-px*3,n0[1]-px*3,px*6,px*6); x.restore(); }   /* the white hood shades into the dark body at the neck */
      const bl=new Path2D(); loft(BILLS,bl,hPt); x.fillStyle=rgb(L(BILL,1.15)); x.fill(bl);                                  /* the heavy yellow hooked bill */
      { const t0=hPt(15.2,0,-.2), t1=hPt(15.9,0,-1.05); line(t0,t1,rgb(L([214,160,40],1)),Math.max(.5,px*.5)); }
      const gp0=hPt(11.8,0,.05), gp1=hPt(14.6,0,-.05); line(gp0,gp1,rgb([120,84,30],.45),Math.max(.3,px*.16));               /* the gape line */
      for(const sd of [-1,1]){ const side=[0,1,2].map(i=>r[i]*sd), facing=dot(side,toEye); if(facing<-.15) continue;   /* the pale yellow eye under its heavy brow, on the side that faces us */
        const ey=hPt(10.4,sd*2.0,1.45), er=Math.max(.45,px*.52)*Math.min(1,.4+facing); x.fillStyle=rgb([44,36,32]); x.beginPath(); x.arc(ey[0],ey[1],er,0,6.283); x.fill();
        x.fillStyle="rgba(4,4,6,.95)"; x.beginPath(); x.arc(ey[0],ey[1],er*.55,0,6.283); x.fill(); x.fillStyle="rgba(255,248,236,.7)"; x.beginPath(); x.arc(ey[0]-er*.3,ey[1]-er*.3,er*.22,0,6.283); x.fill();
        const b0=hPt(9.6,sd*2.15,2.1), b1=hPt(11.2,sd*1.8,1.95); line(b0,b1,rgb(mulv(hc,.72),.7),Math.max(.4,px*.32)); } };
    const near=sd=>{ const w=W3(0,sd*12,0); return w[0]*w[0]+w[1]*w[1]+w[2]*w[2]; }, farS=near(-1)>near(1)? -1 : 1;
    if(under){ wing(farS); wing(-farS); tail(); body(); head(); }
    else { wing(farS); tail(); body(); wing(-farS); head(); }
  }
  function drawEagle(dt,dark){
    nextEagle-=dt; if(!eag&&nextEagle<=0){ if(stageBusy()) nextEagle=rnd(15,30); else startEagle(); } if(!eag) return;
    const e=eag; e.t+=dt; const u=e.t/e.dur; if(u>=1){ eag=null; nextEagle=rnd(260,440); return; }
    const F=H*.5, cx=W/2, cy=H*.52, P=eagleAt(e,u), P0=eagleAt(e,u-.004), P1=eagleAt(e,u+.004);
    const V=[P1[0]-P0[0],P1[1]-P0[1],P1[2]-P0[2]], vh=Math.hypot(V[0],V[2])||1e-6;
    { const Pm=eagleAt(e,u-.02), Pp=eagleAt(e,u+.02), h0=Math.atan2(P[2]-Pm[2],P[0]-Pm[0]), h1=Math.atan2(Pp[2]-P[2],Pp[0]-P[0]); let dh=h1-h0; while(dh>Math.PI) dh-=6.283; while(dh<-Math.PI) dh+=6.283;
      let tb=Math.max(-.85,Math.min(.85,-dh*9));
      { const fl0=Math.hypot(V[0],V[2])||1, r0=[-V[2]/fl0,0,V[0]/fl0], re=-(r0[0]*P[0]+r0[2]*P[2])/Math.hypot(...P), near=Math.max(0,Math.min(1,(9-P[2])/4));   /* and tipped so we see the spread of its wings as it comes over */
        tb=Math.max(-1,Math.min(1,tb+Math.sign(re||1)*.42*near)); }
      e.bank+=(tb-e.bank)*Math.min(1,dt*1.4); }                                   /* banked into its turns */
    const f=(()=>{ const l=Math.hypot(V[0],V[1]*.4,V[2])||1; return [V[0]/l,V[1]*.4/l,V[2]/l]; })();
    /* the beats: a few slow, deep strokes coming in, a powerful run of them climbing out of the turn, then long glides */
    const beating=(u<.07)||(u>.6&&u<.69)||(u>.83&&u<.87);
    e.amp+=((beating? .62 : 0)-e.amp)*Math.min(1,dt*(beating? 3 : 1.6)); const prev=e.ph;
    if(e.amp>.015||Math.cos(e.ph)<.98) e.ph+=dt*Math.PI*2*(beating? 2.1 : 1.4); else e.ph=0;
    e.curl+=((beating? .25 : .7)-e.curl)*Math.min(1,dt*2);
    if(typeof natureSfx!=="undefined"){ const pan=((cx+P[0]*F/P[2])/W*2-1)*.85;
      if(Math.floor((prev+Math.PI*.5)/6.283)!==Math.floor((e.ph+Math.PI*.5)/6.283)&&e.amp>.3&&P[2]<7) natureSfx.eagleBeat&&natureSfx.eagleBeat(pan,Math.min(1,3.5/P[2]));
      if(e.called===0&&u>.06){ e.called=1; natureSfx.eagle&&natureSfx.eagle(pan,.5); }
      if(e.called===1&&u>.44){ e.called=2; natureSfx.eagle&&natureSfx.eagle(pan,1); } }
    /* the head: scanning the ground as it comes, then turned to look straight down at you as it passes close */
    const toEye=[-P[0],-P[1],-P[2]], fl=Math.hypot(f[0],f[2])||1, rgt=[-f[2]/fl,0,f[0]/fl];
    const ey=Math.atan2(toEye[0]*rgt[0]+toEye[2]*rgt[2], toEye[0]*f[0]+toEye[1]*f[1]+toEye[2]*f[2]), look=Math.max(0,Math.min(1,(6-P[2])/2.2))*(u<.7?1:0);
    const thy=look? Math.max(-1,Math.min(1,ey))*look : Math.sin(e.t*.55)*.35+Math.sin(e.t*1.3)*.12, thp=.18+look*.42;
    e.hy+=(thy-e.hy)*Math.min(1,dt*(look? 2.2 : 1.2)); e.hp+=(thp-e.hp)*Math.min(1,dt*1.5);
    const sp=sun(), sunL=(()=>{ const v=[(sp.x-cx)/F,(sp.y-cy)/F-.05,1], l=Math.hypot(...v); return v.map(c=>c/l); })();
    const sizeK=Math.max(.64,Math.min(1,(W/H)/1.2)), Kw=.026*sizeK;
    const cw=Math.ceil(W*.6), ch=Math.ceil(H*.6); if(ecv.width!==cw||ecv.height!==ch){ ecv.width=cw; ecv.height=ch; }
    const x=ecx; x.setTransform(1,0,0,1,0,0); x.clearRect(0,0,cw,ch); x.setTransform(.6,0,0,.6,0,0); x.globalAlpha=1;
    eagle3D(x,e,P,f,(X3,Y3,Z3)=>[cx+X3*F/Math.max(.05,Z3),cy+Y3*F/Math.max(.05,Z3)],Kw,sunL);
    const sx=cx+P[0]*F/P[2], sy=cy+P[1]*F/P[2], rad=56*Kw*F/P[2]+30, RR=rad*.6, RX=Math.max(0,sx*.6-RR), RY=Math.max(0,sy*.6-RR), RW=RR*2, RH=RR*2;
    x.setTransform(1,0,0,1,0,0); x.globalCompositeOperation="source-atop";
    x.fillStyle="rgba(255,160,80,.08)"; x.fillRect(RX,RY,RW,RH);                                                                          /* the warm evening air */
    { const rl=x.createLinearGradient(sx*.6-RR,0,sx*.6+RR,0), k=sp.x>sx?1:0; rl.addColorStop(k,"rgba(255,190,110,.2)"); rl.addColorStop(1-k,"rgba(20,12,8,.12)"); x.fillStyle=rl; x.fillRect(RX,RY,RW,RH); }   /* rim light from the sun's side */
    if(!e.skyC||(e.skyT=(e.skyT||0)-1)<=0){ e.skyT=6; const ip=toImg(sx,sy); e.skyC=(ip&&ip[0]>=0&&ip[0]<=1&&ip[1]>=0&&ip[1]<=1&&sampleAt(ip[0],ip[1]))||[200,170,130]; }
    const haze=Math.min(.82,Math.max(0,(P[2]-3.2)/26)); x.fillStyle=rgb(e.skyC,haze); x.fillRect(RX,RY,RW,RH);                         /* and the air between: it melts into the sky with distance */
    if(SC.dim()){ x.fillStyle="rgba(20,14,6,.18)"; x.fillRect(RX,RY,RW,RH); } else { const tn=tint(); if(tn.a>0){ x.globalAlpha=tn.a; x.fillStyle=tn.c; x.fillRect(RX,RY,RW,RH); x.globalAlpha=1; } }
    if(dark){ x.fillStyle="rgba(10,8,14,.3)"; x.fillRect(RX,RY,RW,RH); }
    x.globalCompositeOperation="source-over";
    blitRegion(ecv,sx,sy,rad,.45+Math.max(0,P[2]-7)*.07,Math.min(1,e.t/1.2,(e.dur-e.t)/2.5));
  }
  /* ---- big birds aloft: a kettle of turkey vultures circling on a thermal, a red-tailed hawk wheeling, an owl gliding low across the field ---- */
  const SOAR={
    vult:{half:.24, s:[.05,.3,.55,.8,.95,1], lead:[.12,.13,.12,.09,.04,-.01], trail:[-.15,-.17,-.16,-.13,-.09,-.05], tail:[[-.18,.05],[-.36,.07],[-.38,0],[-.36,-.07],[-.18,-.05]], head:.26, band:.42},
    hawk:{half:.16, s:[.05,.3,.55,.8,.95,1], lead:[.14,.15,.13,.09,.03,-.03], trail:[-.16,-.2,-.19,-.15,-.09,-.05], tail:[[-.16,.07],[-.4,.15],[-.44,0],[-.4,-.15],[-.16,-.07]], head:.24, band:0},
    raven:{half:.17, s:[.05,.3,.55,.78,.92,1], lead:[.13,.15,.14,.11,.06,0], trail:[-.17,-.21,-.21,-.17,-.1,-.05], tail:[[-.16,.05],[-.36,.13],[-.48,0],[-.36,-.13],[-.16,-.05]], head:.3, band:0},
    owl: {half:.18, s:[.05,.3,.55,.8,.95,1], lead:[.14,.15,.13,.09,.02,-.04], trail:[-.18,-.22,-.22,-.18,-.1,-.05], tail:[[-.16,.06],[-.3,.08],[-.32,0],[-.3,-.08],[-.16,-.06]], head:.2, band:0}};
  let soarers=[], nextVult=90, nextHawkV=45, nextOwlV=120;
  function soarBird(kind,o){ return Object.assign({kind,t:0,ph:rnd(0,6),bank:0,alpha:0,flap:0},o); }
  function startVultures(){
    const n=2+Math.floor(Math.random()*4), cz=rnd(14,26), cy=rnd(4.2,7), dir=Math.random()<.5?1:-1, v=vanish(), cx=(W*(dir>0?rnd(.1,.35):rnd(.65,.9))-v[0])*cz/FOC();
    const kettle={cx,cz,drift:dir*rnd(.12,.25),life:rnd(55,85)};
    for(let i=0;i<n;i++) soarers.push(soarBird("vult",{kettle,r:rnd(1.2,2.6),w:rnd(.18,.28)*(Math.random()<.5?1:-1),a0:rnd(0,6.28),Y:cy+rnd(-.6,.9),life:kettle.life}));
  }
  function startHawk(){ const cz=rnd(5,7.5), dir=Math.random()<.5?1:-1, v=vanish(), cx=(W*(dir>0?rnd(.2,.4):rnd(.6,.8))-v[0])*cz/FOC();
    soarers.push(soarBird("hawk",{kettle:{cx,cz,drift:dir*rnd(.1,.2)},r:rnd(.9,1.4),w:rnd(.3,.4)*(Math.random()<.5?1:-1),a0:rnd(0,6.28),Y:rnd(2.4,3.2),life:rnd(30,45),called:false})); }
  function startOwl(){ const ltr=Math.random()<.5, Z=rnd(4.5,7), v=vanish(), X0=((ltr?-60:W+60)-v[0])*Z/FOC();
    soarers.push(soarBird("owl",{X:X0,Z,Y:rnd(1.5,2.1),hd:(ltr?0:Math.PI)+(ltr?1:-1)*rnd(.15,.4),sp:rnd(1.1,1.5),life:30})); }
  function drawSoarer(b,dark){
    const S=SOAR[b.kind], F=[Math.cos(b.hd),Math.sin(b.hd)], Rt=[-Math.sin(b.hd),Math.cos(b.hd)];
    const cb=Math.cos(b.bank), sb=Math.sin(b.bank);
    /* local (forward, side, up) → world, with the bird banked about its own axis */
    const P=(f,sd,u)=>{ const sY=sd*sb+u*cb, sS=sd*cb-u*sb; return w2s(b.X+F[0]*f*S.half*2+Rt[0]*sS*S.half, b.Y+sY*S.half, b.Z+F[1]*f*S.half*2+Rt[1]*sS*S.half); };
    const c0=w2s(b.X,b.Y,b.Z); if(c0.x<-120||c0.x>W+120||c0.y<-80) return false;
    const haze=b.kind==='vult'? Math.max(.06,Math.min(.42,(b.Z-3)/34)) : Math.max(.15,Math.min(.82,(b.Z-3)/20)), sp=sun(), glow=Math.max(0,1-Math.hypot(c0.x-sp.x,c0.y-sp.y)/(W*.3));
    if(!b.skyC||(b.skyT=(b.skyT||0)-1)<=0){ b.skyT=20; const ip=toImg(c0.x,c0.y); b.skyC=(ip&&ip[1]>0&&ip[1]<1&&sampleAt(Math.max(0,Math.min(1,ip[0])),ip[1]))||[206,180,140]; }
    const M=c=>{ const hz=dark? mulv(b.skyC,.45) : b.skyC; return rgb(mixv(c.map(v=>v*(dark?.7:1)),hz,Math.min(.88,haze+glow*.2))); };
    const pal= b.kind==="vult"? {w:M([30,24,21]),band:M([78,72,68]),body:M([26,21,18]),head:M([150,58,48]),tail:M([32,26,23])}
             : b.kind==="raven"? {w:M([16,16,22]),band:M([46,52,74]),body:M([14,14,20]),head:M([18,18,24]),tail:M([16,16,22])}
             : b.kind==="hawk"? {w:M([196,178,150]),band:M([70,48,32]),body:M([206,190,166]),head:M([110,76,52]),tail:M([170,92,52])}
             : {w:M([150,120,86]),band:M([96,72,50]),body:M([160,128,92]),head:M([150,120,88]),tail:M([130,102,72])};
    const dih=b.kind==="vult"? .32 : b.kind==="hawk"? .08 : b.kind==="raven"? .06 : .04, fl=b.flap;
    ctx.save(); ctx.globalAlpha=b.alpha*(1-glow*.25)*(1-haze*(b.kind==="vult"?.15:.3)); ctx.lineJoin="round";
    const wing=(sd,lead,trail,col)=>{ const pts=[]; S.s.forEach((s,i)=>{ const up=s*Math.sin(dih+fl*(.4+.6*s)); pts.push(P(lead[i],sd*s,up)); });
      for(let i=S.s.length-1;i>=0;i--){ const s=S.s[i], up=s*Math.sin(dih+fl*(.4+.6*s)); pts.push(P(trail[i],sd*s,up)); }
      ctx.beginPath(); ctx.moveTo(pts[0].x,pts[0].y); for(let i=1;i<pts.length;i++) ctx.lineTo(pts[i].x,pts[i].y); ctx.closePath(); ctx.fillStyle=col; ctx.fill(); ctx.strokeStyle=col; ctx.lineWidth=Math.max(1.1,c0.k*.006); ctx.stroke(); };
    const tl=S.tail.map(([f,sd])=>P(f,sd,0)); ctx.beginPath(); ctx.moveTo(tl[0].x,tl[0].y); tl.slice(1).forEach(q=>ctx.lineTo(q.x,q.y)); ctx.closePath(); ctx.fillStyle=pal.tail; ctx.fill();
    for(const sd of [-1,1]){ wing(sd,S.lead,S.trail,pal.w);
      if(S.band) wing(sd,S.lead.map((v,i)=>lerp(v,S.trail[i],S.band)),S.trail,pal.band);                 /* the vulture's silvery flight feathers */
      if(b.kind==="hawk") wing(sd,S.lead,S.lead.map((v,i)=>lerp(v,S.trail[i],.18)),pal.band);              /* the dark leading-edge bar of a red-tail */
      if(b.kind==="raven"){ const up=s=>s*Math.sin(dih+fl*(.4+.6*s)); for(let i=0;i<5;i++){ const t=i/4, a0=lerp(.04,-.07,t), s0=.94, a1=a0+.035-t*.02, s1=1.13-Math.abs(t-.35)*.12;   /* the long, separated "fingers" of a raven's wingtip */
          const A=P(a0+.015,sd*s0,up(s0)), B=P(a1,sd*s1,up(s1)), C=P(a0-.015,sd*s0,up(s0)); ctx.beginPath(); ctx.moveTo(A.x,A.y); ctx.lineTo(B.x,B.y); ctx.lineTo(C.x,C.y); ctx.closePath(); ctx.fillStyle=pal.w; ctx.fill(); }
        wing(sd,S.lead,S.lead.map((v,i)=>lerp(v,S.trail[i],.3)),rgb([0,0,0],0)); }
    }
    if(b.kind==="raven"){ const sh=Math.max(0,Math.sin(b.bank+.6))*.5; ctx.globalAlpha*=.35*sh; for(const sd of [-1,1]) wing(sd,S.lead,S.lead.map((v,i)=>lerp(v,S.trail[i],.5)),pal.band); ctx.globalAlpha/=Math.max(.001,.35*sh); }   /* the glossy blue-purple sheen as it rolls toward the light */
    const bA=P(S.head,0,0), bB=P(-.2,0,0); ctx.strokeStyle=pal.body; ctx.lineWidth=Math.max(1,c0.k*S.half*.22); ctx.lineCap="round"; ctx.beginPath(); ctx.moveTo(bA.x,bA.y); ctx.lineTo(bB.x,bB.y); ctx.stroke();
    ctx.fillStyle=pal.head; ctx.beginPath(); ctx.arc(bA.x,bA.y,Math.max(.8,c0.k*S.half*(b.kind==="owl"?.2:b.kind==="raven"?.13:.1)),0,6.283); ctx.fill();
    if(b.kind==="raven"){ const bk=P(S.head+.09,0,-.01); ctx.strokeStyle=pal.head; ctx.lineWidth=Math.max(1,c0.k*S.half*.12); ctx.beginPath(); ctx.moveTo(bA.x,bA.y); ctx.lineTo(bk.x,bk.y); ctx.stroke(); }   /* the heavy bill */
    ctx.restore(); return true;
  }
  /* a pair of common ravens: they fly close together in step, rowing slowly then gliding, croaking back and forth;
     now and then one flips right over onto its back and rolls out again, and sometimes they tumble together, just for the fun of it */
  let nextRaven=rnd(50,100);
  const rvcv=document.createElement("canvas"), rvcx=rvcv.getContext("2d");
  const R3={raven:[()=>raven3D,.0082],hawk:[()=>redtail3D,.0084],falcon:[()=>falcon3D,.0115],heron:[()=>heron3D,.0125]};
  function drawRavens3D(list,dark){
    if(!list.length) return; const v=vanish(), k0=FOC(), sp=sun();
    const proj=(X,Yd,Z)=>{ const c=w2s(X,1-Yd,Z); return [c.x,c.y]; };
    const sunL=(()=>{ const q=[(sp.x-v[0])/k0,(sp.y-v[1])/k0,1], l=Math.hypot(...q); return q.map(c=>c/l); })();
    const cw=Math.ceil(W*.6), ch=Math.ceil(H*.6); if(rvcv.width!==cw||rvcv.height!==ch){ rvcv.width=cw; rvcv.height=ch; }
    for(const b of list){ const c0=w2s(b.X,b.Y,b.Z); if(c0.x<-150||c0.x>W+150) continue;
      const x=rvcx; x.setTransform(1,0,0,1,0,0); x.clearRect(0,0,cw,ch); x.setTransform(.6,0,0,.6,0,0); x.globalAlpha=1;
      const vy=Math.max(-.3,Math.min(.3,(b.vy||0))), f=(()=>{ const q=[Math.cos(b.hd),-vy*.4,Math.sin(b.hd)], l=Math.hypot(...q); return q.map(c=>c/l); })();
      const e={t:b.t,bank:-b.bank,amp:b.amp||0,ph:b.wph||0,curl:b.curl??.55,hy:b.hy||0,hp:b.hp??.12};
      const rr=R3[b.kind]||R3.raven, kw=rr[1]; rr[0]()(x,e,[b.X,1-b.Y,b.Z],f,proj,kw,sunL);
      const sx=c0.x, sy=c0.y, rad=40*kw*k0/b.Z+30, RR=rad*.6, RX=Math.max(0,sx*.6-RR), RY=Math.max(0,sy*.6-RR);
      x.setTransform(1,0,0,1,0,0); x.globalCompositeOperation="source-atop";
      x.fillStyle="rgba(255,160,80,.06)"; x.fillRect(RX,RY,RR*2,RR*2);
      { const rl=x.createLinearGradient(RX,0,RX+RR*2,0), kk=sp.x>sx?1:0; rl.addColorStop(kk,"rgba(255,190,120,.22)"); rl.addColorStop(1-kk,"rgba(0,0,0,0)"); x.fillStyle=rl; x.fillRect(RX,RY,RR*2,RR*2); }   /* a warm rim on the sun side of the black plumage */
      if(!b.skyC||(b.skyT=(b.skyT||0)-1)<=0){ b.skyT=8; const ip=toImg(sx,sy); b.skyC=(ip&&ip[0]>=0&&ip[0]<=1&&ip[1]>=0&&ip[1]<=1&&sampleAt(ip[0],ip[1]))||[190,170,140]; }
      x.fillStyle=rgb(b.skyC,Math.min(.45,Math.max(.05,(b.Z-3.5)/18))); x.fillRect(RX,RY,RR*2,RR*2);                       /* the air between: black softens to the sky's colour with distance */
      if(SC.dim()){ x.fillStyle="rgba(20,14,6,.18)"; x.fillRect(RX,RY,RR*2,RR*2); } else { const tn=tint(); if(tn.a>0){ x.globalAlpha=tn.a; x.fillStyle=tn.c; x.fillRect(RX,RY,RR*2,RR*2); x.globalAlpha=1; } }
      if(dark){ x.fillStyle="rgba(10,8,14,.3)"; x.fillRect(RX,RY,RR*2,RR*2); }
      x.globalCompositeOperation="source-over";
      blitRegion(rvcv,sx,sy,rad,.45+Math.max(0,b.Z-6)*.08,b.alpha); }
  }
  function startRavens(){ { const c=diagCourse(rnd(2.4,3),rnd(14,20),H*rnd(.18,.28),gnd().vy-H*rnd(.06,.14),180), dv=[c.B[0]-c.A[0],c.B[1]-c.A[1],c.B[2]-c.A[2]], len=Math.hypot(...dv), hd=Math.atan2(dv[2],dv[0]);
      const pair={rollAt:rnd(4,8),tumbleAt:rnd(10,16),callAt:rnd(1,3)};
      for(let i=0;i<2;i++){ const o=[-.5*i*dv[0]/len, .1*i, -.5*i*dv[2]/len+.25*i]; soarers.push(soarBird("raven",{X:c.A[0]+o[0],Y:c.A[1]+o[1],Z:c.A[2]+o[2],off:o,course:c,dur:len/.75,hd,sp:0,life:60,pair,lead:i===0,roll:null,ph:i*1.3})); } return; }
    const ltr=Math.random()<.5, Z=rnd(4.2,5.4), v=vanish(), X0=((ltr?-80:W+80)-v[0])*Z/FOC(), hd=ltr? -rnd(.02,.12) : Math.PI+rnd(.02,.12), Y=rnd(2.1,2.6);
    const pair={rollAt:rnd(4,8),tumbleAt:rnd(10,16),callAt:rnd(1,3)};
    for(let i=0;i<2;i++) soarers.push(soarBird("raven",{X:X0-Math.cos(hd)*i*.55,Z:Z+i*.25,Y:Y+i*.12,hd,sp:rnd(.55,.7),life:40,pair,lead:i===0,roll:null,ph:i*1.3})); }
  function stepRaven(b,dt){ const p=b.pair;
    if(b.course){ const C=b.course, e=Math.min(1,b.t/b.dur); b.X=lerp(C.A[0],C.B[0],e)+b.off[0]; b.Z=lerp(C.A[2],C.B[2],e)+b.off[2]; b.Y=lerp(C.A[1],C.B[1],e)+b.off[1]+Math.sin(b.t*.5+b.ph)*.05+(b.dropY||0); if(e>=1) b.done=true; }
    else { b.X+=Math.cos(b.hd)*b.sp*dt; b.Z+=Math.sin(b.hd)*b.sp*dt; b.Y+=Math.sin(b.t*.5+b.ph)*.03*dt; }
    const cyc=(b.t+b.ph*.4)%5.5, row=cyc<2.2; b.wph=(b.wph||0)+dt*(row||Math.cos(b.wph||0)<.97? Math.PI*2*1.5 : 0); b.amp=(b.amp||0)+((row? .6 : 0)-(b.amp||0))*Math.min(1,dt*(row?4:2)); b.curl=row? .3 : .6;   /* slow, deep rowing beats, then a glide on flat wings */
    const y0=b.Y; b.hy=Math.sin(b.t*.7+b.ph)*.4;
    let bank=Math.sin(b.t*.45+b.ph)*.12;
    if(b.lead&&b.t>p.rollAt){ p.rollAt=b.t+rnd(6,11); b.roll={t:0,dur:rnd(.9,1.3),turns:Math.random()<.3?2:1,dir:Math.random()<.5?1:-1}; if(typeof natureSfx!=="undefined"&&natureSfx.raven) natureSfx.raven(b._pan||0,"knock"); }
    if(!b.lead&&b.t>p.tumbleAt){ p.tumbleAt=b.t+rnd(12,20); b.roll={t:0,dur:1.6,turns:1,dir:-1,drop:.5}; }     /* the follower tumbles and drops, then catches up */
    if(b.roll){ const r=b.roll; r.t+=dt; const u=Math.min(1,r.t/r.dur), e=u<.5? 2*u*u : 1-2*(1-u)*(1-u); bank+=r.dir*e*Math.PI*2*r.turns; b.amp*=.85; b.curl=.9; if(r.drop) b.dropY=-Math.sin(u*Math.PI)*r.drop*.6; if(u>=1) b.roll=null; }   /* flipped right over onto its back, wings folding, and out again */
    b.bank=bank; b.vy=(b.Y-y0)/Math.max(dt,1e-3);
    if(b.lead&&b.t>p.callAt){ p.callAt=b.t+rnd(2.5,6); if(typeof natureSfx!=="undefined"&&natureSfx.raven) natureSfx.raven(b._pan||0,Math.random()<.75?"croak":"knock"); }
  }
  /* a peregrine falcon: high and fast on stiff, shallow, quick beats, a short circle, then it folds its wings and stoops,
     dropping almost straight down at terrific speed before throwing out its wings, swinging up and racing away low */
  let nextFalcon=rnd(90,160), nextHeron=rnd(40,90);
  function startFalcon(){ const ltr=Math.random()<.5, Z=rnd(5,6.2), v=vanish(), X0=((ltr?-80:W+80)-v[0])*Z/FOC();
    soarers.push(soarBird("falcon",{X:X0,Z,Y:rnd(2.5,2.8),hd:ltr? -rnd(.05,.2) : Math.PI+rnd(.05,.2),sp:1.9,life:40,st:"cruise",stoopAt:rnd(2.6,4),wph:0,amp:.35,curl:.3,called:0})); }
  function stepFalcon(b,dt){
    if(b.st==="cruise"){ const burst=(b.t%2.2)<1.4; b.wph+=dt*Math.PI*2*(burst?4.6:0); b.amp+=((burst?.32:0)-b.amp)*Math.min(1,dt*6); b.curl=burst?.2:.45; b.bank=Math.sin(b.t*.8)*.25; b.vy=0;
      b.hd+=Math.sin(b.t*.6)*.25*dt; if(b.t>.8&&!b.called){ b.called=1; natureSfx.falcon&&natureSfx.falcon(b._pan||0); }
      if(b.t>b.stoopAt){ b.st="stoop"; b.st0=b.t; natureSfx.stoop&&natureSfx.stoop(b._pan||0); } }
    else if(b.st==="stoop"){ const u=(b.t-b.st0)/2; b.sp=lerp(1.9,4.4,Math.min(1,u*2)); b.vy=-lerp(.5,5.2,Math.min(1,u*1.6)); b.amp+=(-.95-b.amp)*Math.min(1,dt*5); b.wph=0; b.curl=1; b.bank=Math.sin(b.t*9)*.06;   /* wings folded right in, a falling teardrop */
      if(b.Y<1.2||u>1.5){ b.st="pull"; b.st0=b.t; } }
    else { const u=(b.t-b.st0); b.vy=lerp(2.4,.2,Math.min(1,u/1.4)); b.sp=lerp(3.6,2.4,Math.min(1,u/2)); const burst=u<.4||(u%1.4)<.8; b.wph+=dt*Math.PI*2*(burst?5:0); b.amp+=((burst?.5:-.1)-b.amp)*Math.min(1,dt*8); b.curl=.3; b.bank=Math.sin(u*2)*.4;
      if(u>.3&&b.called<2){ b.called=2; natureSfx.falcon&&natureSfx.falcon(b._pan||0); } }
    b.X+=Math.cos(b.hd)*b.sp*dt; b.Z+=Math.sin(b.hd)*b.sp*dt; b.Y+=b.vy*dt; b.hp=b.st==="stoop"? .5 : .12; }
  /* a great blue heron: slow, deep, deliberate beats on huge bowed wings, neck folded back, legs trailing, flying low and steady across the field;
     it lets out its deep, harsh croak as it goes */
  function diagCourse(nearZ,farZ,nearSY,farSY,pad){ const v=vanish(), f=FOC(), left=Math.random()<.5, inbound=Math.random()<.5;   /* a point on screen at a depth, back into the world */
    const W3=(sx,sy,Z)=>[(sx-v[0])*Z/f, 1-(sy-v[1])*Z/f, Z];
    const near=W3(left? -pad : W+pad, nearSY, nearZ), far=W3(left? W*rnd(.72,.9) : W*rnd(.1,.28), farSY, farZ);
    return inbound? {A:far,B:near,inbound} : {A:near,B:far,inbound}; }
  function startHeron(){ const c=diagCourse(rnd(2,2.6),rnd(16,22),H*rnd(.2,.32),gnd().vy-H*rnd(.04,.1),220), len=Math.hypot(c.B[0]-c.A[0],c.B[1]-c.A[1],c.B[2]-c.A[2]);
    soarers.push(soarBird("heron",{X:c.A[0],Y:c.A[1],Z:c.A[2],course:c,cu:0,dur:len/1.15,hd:Math.atan2(c.B[2]-c.A[2],c.B[0]-c.A[0]),sp:0,life:60,wph:0,amp:.55,curl:.15,callAt:rnd(1.5,4)})); return;
    const ltr=Math.random()<.5, Z=rnd(5.5,7.5), v=vanish(), X0=((ltr?-120:W+120)-v[0])*Z/FOC();
    soarers.push(soarBird("heron",{X:X0,Z,Y:rnd(1.5,1.9),hd:ltr? -rnd(.02,.1) : Math.PI+rnd(.02,.1),sp:rnd(.95,1.15),life:45,wph:0,amp:.55,curl:.15,callAt:rnd(1.5,4)})); }
  function stepHeron(b,dt){ const glide=(b.t%9)>7.2; b.wph+=dt*Math.PI*2*(glide&&Math.cos(b.wph)>.95? 0 : 1.9); b.amp+=((glide?.02:.58)-b.amp)*Math.min(1,dt*3); b.curl=.1;
    b.bank=Math.sin(b.t*.4)*.06; b.hy=Math.sin(b.t*.3)*.15; b.hp=-.05;
    if(b.course){ const C=b.course; b.cu=Math.min(1,b.t/b.dur); const e=b.cu, bob=Math.sin(b.wph)*.03; const y0=b.Y;          /* steady along its line; the beats lift it a touch each stroke */
      b.X=lerp(C.A[0],C.B[0],e); b.Z=lerp(C.A[2],C.B[2],e); b.Y=lerp(C.A[1],C.B[1],e)+bob; b.vy=(b.Y-y0)/Math.max(dt,1e-3)*.3; b.hd=Math.atan2(C.B[2]-C.A[2],C.B[0]-C.A[0]); if(b.cu>=1) b.done=true; }
    else { b.vy=Math.sin(b.wph)*.08; b.Y+=b.vy*dt*.6; b.X+=Math.cos(b.hd)*b.sp*dt; b.Z+=Math.sin(b.hd)*b.sp*dt; }
    if(b.t>b.callAt){ b.callAt=b.t+rnd(5,10); natureSfx.heron&&natureSfx.heron(b._pan||0); } }
  function drawRaptors(dt,dark){
    nextFalcon-=dt; if(nextFalcon<=0){ nextFalcon=rnd(200,380); if(!soarers.some(b=>b.kind==="falcon")) startFalcon(); }
    nextHeron-=dt; if(nextHeron<=0){ nextHeron=rnd(170,320); if(!soarers.some(b=>b.kind==="heron")) startHeron(); }
    nextRaven-=dt; if(nextRaven<=0){ nextRaven=rnd(150,300); if(!soarers.some(b=>b.kind==="raven")) startRavens(); }
    nextVult-=dt; nextHawkV-=dt; nextOwlV-=dt;
    /* turkey vultures retired */
    if(nextHawkV<=0){ nextHawkV=rnd(120,260); if(!soarers.some(b=>b.kind==="hawk")) startHawk(); }
    if(nextOwlV<=0){ nextOwlV=rnd(160,340); if(!soarers.some(b=>b.kind==="owl")) startOwl(); }
    for(const b of soarers){
      b.t+=dt;
      if(b.kettle){ const K=b.kettle; if(b.kind==="vult"||b.kind==="hawk"){ K.cx+=K.drift*dt*(b===soarers.find(o=>o.kettle===K)?1:0); }
        const a=b.a0+b.w*b.t, X=K.cx+Math.cos(a)*b.r, Z=K.cz+Math.sin(a)*b.r*.8; b.hd=a+(b.w>0?Math.PI/2:-Math.PI/2); b.X=X; b.Z=Z;
        b.bank=(b.w>0?-1:1)*(b.kind==="vult"? .28+Math.sin(b.t*1.3+b.a0)*.16 : .35);              /* vultures rock and teeter as they circle */
        if(b.kind==="hawk"){ const burst=(b.t%9)<1.1; b.ph+=dt*(burst?9:0); b.flap=burst? Math.sin(b.ph)*.5 : 0; b.wph=b.ph; b.amp=burst? .45 : 0; b.curl=burst? .3 : .65; b.vy=0;
          if(!b.called && b.t>3 && typeof natureSfx!=="undefined"){ b.called=true; natureSfx.hawk(); } }
        else b.flap=0;
        if(b.t>b.life){ K.cz+=dt*.8; b.Y+=dt*.15; } }
      else if(b.kind==="raven"||b.kind==="falcon"||b.kind==="heron"){ (b.kind==="raven"? stepRaven : b.kind==="falcon"? stepFalcon : stepHeron)(b,dt); const c=w2s(b.X,b.Y,b.Z); b._pan=Math.max(-1,Math.min(1,c.x/W*2-1)); }
      else { b.X+=Math.cos(b.hd)*b.sp*dt; b.Z+=Math.sin(b.hd)*b.sp*dt; b.ph+=dt*2.3*Math.PI*2/2.3; b.flap=Math.sin(b.ph)*.55; b.Y+=Math.sin(b.t*.6)*.02*dt; b.bank=Math.sin(b.t*.5)*.08; }
      b.alpha= b.t>b.life? Math.max(0,b.alpha-dt*.25) : Math.min(1,b.alpha+dt*.5);
      const on=(b.kind==="raven"||b.kind==="hawk"||b.kind==="falcon"||b.kind==="heron")? (()=>{ const c=w2s(b.X,b.Y,b.Z); return c.x>-150&&c.x<W+150; })() : drawSoarer(b,dark); if((b.t>b.life&&b.alpha<=0) || (!b.kettle && !on && b.t>3)) b.done=true;
    }
    soarers=soarers.filter(b=>!b.done);
    drawRavens3D(soarers.filter(b=>R3[b.kind]),dark);
  }
  /* ---- a cock pheasant strutting through the grass: walks with a bob, stops to peck, stretches up to look, then slips away ---- */
  let pheasW=null, nextPheasW=75;
  function startPheasW(){
    const b=foxBounds(), side=Math.random()<.5, g=rnd(Math.max(b.gmin,lawnMinG(side?W*.9:W*.1))+20,b.gmax-40), p=toGround(side? W+40 : -40, gnd().vy+g);
    pheasW={Xw:p.Xw,Dw:p.Dw,state:"run",t:rnd(3,5),cycles:3+Math.floor(Math.random()*3),head:0,headT:0,turn:0,turnT:0,jerk:0,ph:0,sniff:0,alpha:1,spd:.32,cad:.9,yaw:side?Math.PI:0};
    const q=toGround(W*(side?rnd(.55,.75):rnd(.25,.45)),gnd().vy+g); pheasW.tX=q.Xw; pheasW.tD=q.Dw; pheasW.ang=null; arrive(side?W+40:-40,pheasW);
  }
  function pheasWParts(f,P,moving){
    const q=f.ph*Math.PI*1.3, yaw=f.yaw, far=z=>z*Math.cos(yaw)>0, parts=[], run=moving&&(f.spd||0)>.8;
    const cop=rgb(P.copper), copF=rgb(mulv(P.copper,.75)), sh=[rgb(mulv(P.copper,.6)),rgb(mixv(P.copper,[255,210,140],.25))];
    const lean=run? .25 : 0, bob=moving? Math.abs(Math.sin(q))*.3 : 0;
    const T=(x,y)=>{ const c=Math.cos(lean), s=Math.sin(lean), dy=y-9; return [x*c-dy*s, 9+bob+x*s+dy*c]; }, B=(x,y,z,r)=>{ const t2=T(x,y); return [t2[0],t2[1],z,r]; };
    for(const [z,ph] of [[-1.3,0],[1.3,Math.PI]]){ const sw=moving? Math.sin(q+ph)*(run?.7:.45) : 0, lift=moving? Math.max(0,-Math.cos(q+ph)) : 0, top=T(.6,8.4);
      const ch=legChain(top[0],top[1],z,1.6,[[3.4,-.42+sw*.5-lift*.25,.8],[4.8,.12+sw+lift*.5,.32]]);
      parts.push({p:ch.slice(0,2),c:far(z)?copF:cop},{p:ch.slice(1),c:rgb(P.leg)});
      const ft=ch[2]; parts.push({p:[[ft[0]-.7,ft[1],z,.22],[ft[0]+1.5,ft[1]+lift*.6,z,.2]],c:rgb(P.leg),bias:-.01}); }
    /* the long barred tail, carried low and back, swaying as it walks */
    let tp=T(-4.6,9.8); const tail=[[tp[0],tp[1],0,1.4]];
    for(let i=0;i<7;i++){ const a=.12-i*.02+Math.sin(t*1.4-i*.4)*.03, la=Math.sin(t*1.1-i*.5)*.08+(moving?Math.sin(q)*.04:0); tp=[tp[0]-Math.cos(a)*2.4,tp[1]+Math.sin(a)*2.4]; tail.push([tp[0],tp[1],Math.sin(la)*i*.6,[1.3,1.1,.95,.8,.65,.5,.3][i]]); }
    parts.push({p:tail,c:rgb(P.tail),bias:.15});
    for(let i=1;i<6;i++){ const a=tail[i]; parts.push({p:[[a[0],a[1]+a[3]*.9,a[2],a[3]*.35],[a[0],a[1]-a[3]*.9,a[2],a[3]*.35]],c:rgb(mulv(P.tail,.5)),bias:.14}); }
    parts.push({p:[B(-4,9.6,0,3.0),B(-.4,10.0,0,3.5),B(3,10.6,0,3.0)],c:cop,sh});
    for(const sd of [-1,1]) parts.push({p:[B(-3.2,10.6,2.6*sd,1.4),B(.6,11.2,2.9*sd,1.6)],c:far(sd)?copF:rgb(P.wing),bias:-.02});
    /* neck, white ring, iridescent green head, red face wattle */
    const hd=f.head, hc0=T(lerp(6.2,7.6,Math.max(0,hd)),lerp(15,3.6,Math.max(0,hd))+Math.max(0,-hd)*1.6), hc=[hc0[0],hc0[1],0];
    const n0=B(3.6,11.6,0,2.2), nm=[lerp(n0[0],hc[0],.45),lerp(n0[1],hc[1],.45),0,1.4];
    parts.push({p:[n0,nm],c:cop},{p:[nm,[hc[0]-.3,hc[1]-.3,0,1.05]],c:rgb(P.head)},{p:[[lerp(nm[0],n0[0],.25),lerp(nm[1],n0[1],.25),0,1.55]],c:rgb(P.ring),bias:-.05});
    const hp=hd*1.2+.05, hy=f.turn, Hh=(u,v,w,r)=>{ const t2=headPt(hc,hp,hy,u,v,w); return [t2[0],t2[1],t2[2],r]; };
    parts.push({p:[Hh(0,0,0,1.2),Hh(.9,-.2,0,.9)],c:rgb(P.head)},{p:[Hh(1.8,-.35,0,.35),Hh(2.4,-.5,0,.2)],c:rgb(P.beak),bias:-.1});
    for(const sd of [-1,1]) parts.push({p:[Hh(.6,.05,.75*sd,.62),Hh(.5,-.6,.7*sd,.45)],c:rgb(P.wattle),bias:-.06},{p:[Hh(-.6,.9,.5*sd,.32),Hh(-1.2,1.4,.55*sd,.18)],c:rgb(P.head),bias:-.03});
    return parts;
  }
  function drawPheasW(dt,dark){
    if(!pheasW){ nextPheasW-=dt; if(nextPheasW<=0){ if(groundBusy()) nextPheasW=12; else startPheasW(); } return; }
    foxStep(pheasW,dt); if(pheasW.gone){ pheasW=null; nextPheasW=rnd(150,300); return; }
    const f=pheasW, s=toScreen(f.Xw,f.Dw), k=.16*s.g/26, moving=f.state==="run"||f.state==="leave";
    if(f.pw){ const dX=f.Xw-f.pw[0], dZ=trueZ(f.Dw)-f.pw[1]; if(moving&&Math.hypot(dX,dZ)>1e-5) f.yaw=angTo(f.yaw,Math.atan2(dZ,dX),dt*6); } idleTurn(f,dt,moving); keepOnLawn(f); f.pw=[f.Xw,trueZ(f.Dw)];
    f.ct=(f.ct||0)-dt;
    if(f.ct<=0||!f.pal){ f.ct=1.5; const G=groundPal(s,dark), lit=dark?.5:.66; f.pal={...G, copper:mulv([168,86,40],lit), wing:mulv([150,112,70],lit), tail:mulv([150,112,70],lit), head:mulv([30,72,62],lit), ring:mulv([230,226,214],lit), wattle:mulv([180,40,32],lit), beak:mulv([200,180,120],lit), leg:mulv([110,100,90],lit)}; }
    if(!f.blades) f.blades=Array.from({length:9},()=>({ox:rnd(-16,16),h:rnd(3,6),lean:rnd(-.5,.5),c:Math.random()}));
    critterBlit(null,null,f,s,k,f.pal,()=>pheasWParts(f,f.pal,moving||f.turning),f.yaw,30,64,12,f.blades,f.alpha);
  }
  /* the film pass: a whisper of 16mm grain that dances frame to frame, and the edges of the lens falling gently darker */
  const grainT=[0,1,2,3].map(()=>{ const c=document.createElement("canvas"), N=160; c.width=c.height=N; const x=c.getContext("2d"), D=x.createImageData(N,N), a=D.data;
    for(let k=0;k<a.length;k+=4){ const v=(Math.random()+Math.random()+Math.random()-1.5)*2; const w=v>0?255:0; a[k]=a[k+1]=a[k+2]=w; a[k+3]=Math.min(255,Math.abs(v)*70); }
    x.putImageData(D,0,0); return c; });
  let vigC=null, vigK=""; const scratches=[];
  /* ---- sun beams: soft shafts of light fanning out from the sun through the gaps in the clouds, each slowly brightening and fading on its own ---- */
  let rayC=null, rayT=0, rayN=0, glints=[], nextGlint=.5; const RAYS=Array.from({length:13},(_,i)=>({a:(i+Math.random()*.6)/13*6.283,w:.04+Math.random()*.065,ph:Math.random()*6.283,sp:.06+Math.random()*.1,pk:.5+Math.random()*.5,dr:(Math.random()-.5)*.01}));
  /* glints: a few fine, bright shafts that flare up for a moment and fade, so the light glistens */
  function drawGlints(dt,st,dk){
    nextGlint-=dt; if(nextGlint<=0&&glints.length<4){ nextGlint=rnd(.6,1.8); glints.push({a:rnd(0,6.283),w:rnd(.004,.01),t:0,life:rnd(1.6,3.4),dr:rnd(-.02,.02),pk:rnd(.5,1)}); }
    if(!glints.length) return; const sp=sun(), L=Math.hypot(W,H)*.9, vy=gnd().vy;
    ctx.save(); ctx.globalCompositeOperation="screen";
    for(let i=glints.length-1;i>=0;i--){ const g=glints[i]; g.t+=dt; const u=g.t/g.life; if(u>=1){ glints.splice(i,1); continue; }
      const k=Math.sin(u*Math.PI)**2*g.pk*(.8+.2*Math.sin(g.t*9))*Math.min(1,.5+st*1.5)*dk, a=g.a+g.dr*g.t, ex=sp.x+Math.cos(a)*L, ey=sp.y+Math.sin(a)*L;
      if(ey>vy+H*.3&&Math.sin(a)>.2) { /* mostly up in the sky */ }
      const gr=ctx.createLinearGradient(sp.x,sp.y,ex,ey); gr.addColorStop(0,"rgba(255,236,200,0)"); gr.addColorStop(.04,`rgba(255,236,196,${(.34*k).toFixed(3)})`); gr.addColorStop(.3,`rgba(255,214,160,${(.15*k).toFixed(3)})`); gr.addColorStop(.7,"rgba(255,200,140,0)");
      ctx.fillStyle=gr; ctx.beginPath(); ctx.moveTo(sp.x,sp.y); ctx.lineTo(sp.x+Math.cos(a-g.w)*L,sp.y+Math.sin(a-g.w)*L); ctx.lineTo(sp.x+Math.cos(a+g.w)*L,sp.y+Math.sin(a+g.w)*L); ctx.closePath(); ctx.fill(); }
    ctx.restore();
  }
  function drawRays(dt,dark){
    let st=0; try{ const h=SC.sun(); st=h&&SC.shown()? h.strength : 0; }catch(e){} if(!(st>=.04)) return;   /* (they used to be skipped when the device was in dark mode, which is why some browsers never showed them) */
    const dk=dark? .7 : 1;
    rayT+=dt; rayN=(rayN+1)%2; drawGlints(dt,st,dk); const vyG=gnd().vy, bandH=Math.min(H,Math.ceil(vyG+H*.42)), cw=Math.max(1,Math.ceil(W/4)), ch=Math.max(1,Math.ceil(H/4));
    if(rayN&&rayC&&rayC.width===cw&&rayC.height===ch){ ctx.save(); ctx.globalCompositeOperation="screen"; ctx.globalAlpha=dk; ctx.drawImage(rayC,0,0,cw,Math.ceil(bandH/4),0,0,cw*4,Math.ceil(bandH/4)*4); ctx.restore(); return; }   /* they change slowly: redrawn every other frame */
    const sp=sun();
    if(!rayC) rayC=document.createElement("canvas"); if(rayC.width!==cw||rayC.height!==ch){ rayC.width=cw; rayC.height=ch; }
    const x=rayC.getContext("2d"); x.setTransform(1,0,0,1,0,0); x.globalCompositeOperation="source-over"; x.clearRect(0,0,cw,ch); x.setTransform(.25,0,0,.25,0,0); x.globalCompositeOperation="lighter";
    const L=Math.hypot(W,H)*1.15;
    RAYS.forEach((r,i)=>{ let k=Math.pow(.5+.5*Math.sin(rayT*r.sp*1.6+r.ph),1.6); if(k<.02) return;                        /* each beam swells and fades on its own */
      k*=.72+.28*Math.sin(rayT*(1.1+i*.13)+r.ph*3)*Math.sin(rayT*(.53+i*.07)+r.ph);                                            /* and shimmers as the cloud edges move across the sun */
      const a=r.a+Math.sin(rayT*.11+r.ph)*.09+Math.sin(rayT*.37+r.ph*2)*.015+rayT*r.dr, amt=.4*r.pk*k*Math.min(1,.55+st*1.4);
      for(const [wm,am] of [[2.2,.25],[1.4,.35],[.8,.4]]){ const w=r.w*wm, g=x.createRadialGradient(sp.x,sp.y,0,sp.x,sp.y,L);
        g.addColorStop(0,"rgba(255,214,150,0)"); g.addColorStop(.05,`rgba(255,212,148,${(amt*am).toFixed(3)})`); g.addColorStop(.35,`rgba(255,200,130,${(amt*am*.55).toFixed(3)})`); g.addColorStop(1,"rgba(255,190,120,0)");
        x.fillStyle=g; x.beginPath(); x.moveTo(sp.x,sp.y); x.lineTo(sp.x+Math.cos(a-w)*L,sp.y+Math.sin(a-w)*L); x.lineTo(sp.x+Math.cos(a+w)*L,sp.y+Math.sin(a+w)*L); x.closePath(); x.fill(); } });
    { const vy=gnd().vy, g=x.createLinearGradient(0,0,0,H); g.addColorStop(0,"rgba(0,0,0,1)"); g.addColorStop(Math.min(.95,vy/H),"rgba(0,0,0,.85)"); g.addColorStop(Math.min(.98,vy/H+.25),"rgba(0,0,0,.22)"); g.addColorStop(Math.min(.99,vy/H+.4),"rgba(0,0,0,0)"); g.addColorStop(1,"rgba(0,0,0,0)");
      x.globalCompositeOperation="destination-in"; x.fillStyle=g; x.fillRect(0,0,W,H); x.globalCompositeOperation="source-over"; }   /* strongest in the sky, softening down over the fields */
    ctx.save(); ctx.globalCompositeOperation="screen"; ctx.globalAlpha=dk; ctx.imageSmoothingEnabled=true; ctx.drawImage(rayC,0,0,cw,Math.ceil(bandH/4),0,0,cw*4,Math.ceil(bandH/4)*4); ctx.restore();   /* only the band where they show */
  }
  let filmC=[], filmLast=-1;
  function filmPass(){
    ctx.save(); ctx.setTransform(1,0,0,1,0,0); ctx.globalCompositeOperation="source-over";
    const k=W+"|"+H; if(vigK!==k){ vigK=k; vigC=document.createElement("canvas"); vigC.width=Math.max(1,Math.round(W/4)); vigC.height=Math.max(1,Math.round(H/4)); const vx=vigC.getContext("2d"), w=vigC.width, h=vigC.height;
      vx.translate(w/2,h/2); vx.scale(w/2,h/2); const g=vx.createRadialGradient(0,0,.55,0,0,1.42); g.addColorStop(0,"rgba(14,9,4,0)"); g.addColorStop(.45,"rgba(14,9,4,.16)"); g.addColorStop(1,"rgba(14,9,4,.58)"); vx.fillStyle=g; vx.fillRect(-1,-1,2,2);
      /* the vignette and the grain are both laid straight over the picture, so they can be baked together: a handful of half-size plates, each with the grain at a different offset */
      filmC=[]; const pw=Math.max(1,Math.ceil(W/2)), ph=Math.max(1,Math.ceil(H/2));
      for(let i=0;i<6;i++){ const c=document.createElement("canvas"); c.width=pw; c.height=ph; const fx=c.getContext("2d"); fx.drawImage(vigC,0,0,pw,ph);
        const T=grainT[i%4], step=T.width*2.2/2, ox=-Math.random()*step, oy=-Math.random()*step; fx.globalAlpha=.04; fx.imageSmoothingEnabled=true;
        for(let y=oy;y<ph;y+=step) for(let x=ox;x<pw;x+=step) fx.drawImage(T,x,y,step,step); filmC.push(c); } }
    ctx.globalAlpha=1; ctx.imageSmoothingEnabled=true; { let i=Math.floor(Math.random()*filmC.length); if(i===filmLast) i=(i+1)%filmC.length; filmLast=i; ctx.drawImage(filmC[i],0,0,W,H); }   /* darkened edges and a fresh pattern of coarse, soft grain every frame */
    if(false) scratches.push({x:Math.random()*W, life:rnd(.08,.7), w:rnd(.5,1.4), a:rnd(.04,.1), lt:Math.random()<.6, y0:Math.random()<.5?0:rnd(0,H*.6), y1:Math.random()<.5?H:rnd(H*.4,H)});
    ctx.globalAlpha=1;
    for(let i=scratches.length-1;i>=0;i--){ const q=scratches[i]; q.life-=1/30; if(q.life<=0||q.y1-q.y0<20){ scratches.splice(i,1); continue; } q.x+=rnd(-1.2,1.2);     /* a thin scratch running down the film, wandering a little as it goes */
      const g=ctx.createLinearGradient(0,q.y0,0,q.y1), c=q.lt?"255,246,226":"20,12,6", a=q.a*(.6+.4*Math.random()); g.addColorStop(0,`rgba(${c},0)`); g.addColorStop(.15,`rgba(${c},${a.toFixed(3)})`); g.addColorStop(.85,`rgba(${c},${(a*.7).toFixed(3)})`); g.addColorStop(1,`rgba(${c},0)`);
      ctx.fillStyle=g; ctx.fillRect(q.x,q.y0,q.w,q.y1-q.y0); }
    ctx.restore(); }
  let frameErr=0;
  function frame(ts){
    raf=0; if(!running()) { ctx.clearRect(0,0,W,H); return; }
    raf=requestAnimationFrame(frame);
    if(last && ts-last<28) return;                                         /* ~30 frames a second is plenty for drifting things */
    try{ frameBody(ts); }
    catch(e){ if(frameErr++<3) console.warn("scenery:",e); for(let i=0;i<24;i++) ctx.restore(); ctx.setTransform(1,0,0,1,0,0); ctx.globalAlpha=1; ctx.globalCompositeOperation="source-over"; ctx.filter="none"; }   /* one bad frame never stops the whole scene */
  }
  function frameBody(ts){
    const dt=Math.min(.07,(ts-(last||ts))/1000); last=ts; t+=dt;
    ctx.setTransform(1,0,0,1,0,0); ctx.clearRect(0,0,W,H);
    camX=(Math.sin(t*.23)*9+Math.sin(t*.61+1)*4)*.9; camY=(Math.cos(t*.19+.5)*6+Math.sin(t*.47)*3)*.9; camZ=1+30/Math.min(W,H)+.035*(.5-.5*Math.cos(t*2*Math.PI/48));   /* and slowly breathes in and out, about once every 48 seconds */   /* the hand-held drift: the whole view sways together */
    if(SC.shown()) ctx.setTransform(camZ,0,0,camZ,(1-camZ)*W/2+camX,(1-camZ)*H/2+camY);
    const dark=document.documentElement.dataset.theme==="dark"||(document.documentElement.dataset.theme!=="light"&&darkQ.matches);
    const sp=sun(), R=Math.max(W,H)*.6, img=SC.shown();
    const drawMote=m=>{
      m.x+=(m.vx+Math.sin(t*.35+m.ph)*5*m.z)*dt; m.y+=(m.vy+Math.cos(t*.27+m.ph)*4*m.z)*dt;
      const pad=m.r*3+10; if(m.x<-pad) m.x=W+pad; else if(m.x>W+pad) m.x=-pad; if(m.y<-pad) m.y=H+pad; else if(m.y>H+pad) m.y=-pad;
      const k=Math.max(0,1-Math.hypot(m.x-sp.x,m.y-sp.y)/R), tw=.55+.45*Math.sin(t*m.tw*2+m.ph);
      if(m.L===2){
        /* close, out of focus: a soft warm disc */
        const a=((img?.07:.03)+(img?.32:.1)*k)*(.7+.3*tw);
        ctx.globalAlpha=Math.min(1,a); ctx.drawImage(bokeh,m.x-m.r,m.y-m.r,m.r*2,m.r*2); return;
      }
      const a=((img?.08:.035)+(img?.85:.38)*k*tw)*(m.L===0?.6:1);
      if(m.L===1){ ctx.globalAlpha=Math.min(1,a*.28); ctx.fillStyle=dark?"#ffe7b0":"#fff1c8"; ctx.beginPath(); ctx.arc(m.x,m.y,m.r*(2.4+2.2*k),0,6.283); ctx.fill(); }
      ctx.globalAlpha=Math.min(1,a); ctx.fillStyle=k>.35?"#fff6dc":"#fffaf0"; ctx.beginPath(); ctx.arc(m.x,m.y,m.r,0,6.283); ctx.fill();
    };
    if(img){ drawScene(dark); stepDusk(dt); drawDusk(dark); drawMist(dark); drawRays(dt,dark); }
    for(const l of leaves) step3D(l,dt);
    leaves.sort((a,b)=>b.D-a.D);
    for(const l of leaves) if(l.D>=5) leaf(l, dark?.7:1);         /* far ones drift among the hills, behind the animals */
    for(const m of motes) if(m.L===0) drawMote(m);
    if(img){ ctx.globalAlpha=1; drawGeese(dt,dark); drawRaptors(dt,dark); drawEagle(dt,dark); ctx.globalAlpha=1;
      drawDeer(dt,dark,"front"); ctx.globalAlpha=1; drawPecker(dt,dark); ctx.globalAlpha=1; drawCardinals(dt,dark); ctx.globalAlpha=1;   /* the woodpecker on its tree sits behind the animals on the lawn too */                  /* the deer stay behind every other animal on the lawn */
      const L=[]; if(fox) L.push({y:toScreen(fox.Xw,fox.Dw).y,fn:()=>drawFox(dt,dark)}); else drawFox(dt,dark);
      if(skunk) L.push({y:toScreen(skunk.Xw,skunk.Dw).y,fn:()=>drawSkunk(dt,dark)}); else drawSkunk(dt,dark);
      if(cub) L.push({y:toScreen(cub.Xw,cub.Dw).y,fn:()=>drawCub(dt,dark)}); else drawCub(dt,dark);
      if(mom) L.push({y:toScreen(mom.Xw,mom.Dw).y,fn:()=>drawMom(dt,dark)});
      if(coyote) L.push({y:toScreen(coyote.Xw,coyote.Dw).y,fn:()=>drawCoyote(dt,dark)}); else drawCoyote(dt,dark);
      if(coy2) L.push({y:toScreen(coy2.Xw,coy2.Dw).y,fn:()=>drawCoy2(dt,dark)}); else drawCoy2(dt,dark);
      if(turtle) L.push({y:toScreen(turtle.Xw,turtle.Dw).y,fn:()=>drawTurtle(dt,dark)}); else drawTurtle(dt,dark);
      if(bobcat) L.push({y:toScreen(bobcat.Xw,bobcat.Dw).y,fn:()=>drawBobcat(dt,dark)}); else drawBobcat(dt,dark);
      if(pheasW) L.push({y:toScreen(pheasW.Xw,pheasW.Dw).y,fn:()=>drawPheasW(dt,dark)}); else drawPheasW(dt,dark);
      nextQuail-=dt; if(nextQuail<=0&&!quails.length){ nextQuail=rnd(110,220); startQuail(); } quails=quails.filter(q=>!q.gone);
      for(const q of quails) L.push({y:toScreen(q.Xw,q.Dw).y,fn:()=>drawQuail(q,dt,dark)});
      if(dog) L.push({y:toScreen(dog.Xw,dog.Dw).y,fn:()=>drawDog(dt,dark)}); else drawDog(dt,dark);
      if(utv){ const q=utvAt(utv,utv.d); L.push({y:gnd().vy+FOC()/Math.max(.2,q[1]),fn:()=>drawUtv(dt,dark)}); } else drawUtv(dt,dark);
      if(lab) L.push({y:toScreen(lab.Xw,lab.Dw).y,fn:()=>drawLab(dt,dark)}); else drawLab(dt,dark);
      for(const bn of buns) L.push({y:bn.y||0,fn:()=>drawRabbit(bn,dt,dark)});
      nextWc-=dt; if(nextWc<=0&&!wcs.length){ startWoodcocks(); nextWc=rnd(70,140); }
      for(let i=wcs.length-1;i>=0;i--) if(wcs[i].gone) wcs.splice(i,1);
      for(const w of wcs) L.push({y:toScreen(w.Xw,w.Dw).y,fn:()=>drawWoodcock(w,dt,dark)});
      nextSq-=dt; if(nextSq<=0){ nextSq=rnd(30,60); if(sqs.length<(MOBILE()?2:4)) startSquirrels(); }
      for(let i=sqs.length-1;i>=0;i--) if(sqs[i].gone) sqs.splice(i,1);
      for(const q of sqs) L.push({y:toScreen(q.Xw,q.Dw).y,fn:()=>drawSquirrel(q,dt,dark)});
      stepDoe(dt); if(doe){ const d=doe; L.push({y:toScreen(d.Xw,d.Dw).y,fn:()=>paintDeer(deerPose(d,1,false),dark,{yaw:d.yaw,alpha:d.alpha})}); L.push({y:toScreen(d.fawn.Xw,d.fawn.Dw).y,fn:()=>paintDeer(deerPose(d.fawn,.62,true),dark,{yaw:d.fawn.yaw,alpha:d.alpha})}); }
      drawHenAll(dt,dark,L);
      if(hawkG&&(hawkG.state==="land"||hawkG.state==="sit"||(hawkG.state==="leave"&&hawkG.st<.5))) L.push({y:hawkG.ty,fn:()=>drawHawkG(dt,dark,"ground")});
      turkeyQueue(dt,dark,L);
      L.sort((a,b)=>a.y-b.y); for(const it of L){ ctx.globalAlpha=1; it.fn(); } ctx.globalAlpha=1; drawGrouse(dt,dark); ctx.globalAlpha=1; drawPheasant(dt,dark); drawCovey(dt,dark); ctx.globalAlpha=1; drawMoths(dt,dark,"field"); drawFireflies(dt,dark); drawMonarchs(dt,dark); drawChase(dt,dark); }
    for(const m of motes) if(m.L===1) drawMote(m);
    for(const l of leaves) if(l.D<5) leaf(l, dark?.7:1);           /* the near ones, in front of everything in the field */
    for(const m of motes) if(m.L===2) drawMote(m);
    if(img) drawBig(dt,dark);
    ctx.globalAlpha=1; if(img){ dogScare(dt); drawGreet(dt,dark); drawTrail(dt,dark); drawMoths(dt,dark,"near"); drawFlock(dt,dark); drawJays(dt,dark); drawCmon(dt,dark); drawBanner(dt,dark); drawHawkG(dt,dark,"near"); drawPheasFront(dt,dark); drawHum(dt,dark); } ctx.globalAlpha=1;
    ctx.setTransform(1,0,0,1,0,0); if(img) filmPass();
  }
  const running=()=>on && !document.hidden;
  function start(){ cv.hidden=!on; if(running() && !raf){ last=0; raf=requestAnimationFrame(frame); } }
  size(); seed();
  window.addEventListener("resize",()=>{ size(); seed(); buns.forEach(b=>b.init=false); });
  document.addEventListener("visibilitychange",start);
  reduce.addEventListener?.("change",start);
  start();
  return { dogDbg(){ return [dog,lab].map(d=>d&&{...(({x,y})=>({x:Math.round(x),y:Math.round(y)}))(toScreen(d.Xw,d.Dw)),st:d.state,ch:!!d.chase,led:!!d.led}); }, scrDbg(x,y){ return scr(x,y).map(Math.round); }, chDbg(){ return {mons:mons.map(m=>[Math.round(m.sx),Math.round(m.sy),+m.t.toFixed(1)]),ch:bbChase&&[Math.round(bbChase.sx||0),Math.round(bbChase.sy||0),+bbChase.t.toFixed(1)],nc:+nextChase.toFixed(1),life:mons.map(m=>+m.life.toFixed(1))}; }, utvPts(){ return UTV_PATH.map(([ix,iy])=>{ const s0=scr(ix,iy), g=toGround(s0[0],s0[1]); return [Math.round(s0[0]),Math.round(s0[1]),+g.Xw.toFixed(2),+trueZ(g.Dw).toFixed(2)]; }).concat([[gnd().vy,FOC(),GF]]); }, utvDbg(){ if(!utv) return null; const q=utvAt(utv,utv.d); return {d:+utv.d.toFixed(2),len:+utv.len.toFixed(1),X:+q[0].toFixed(2),Z:+q[1].toFixed(2),sx:Math.round(utv.sx||0),sy:Math.round(utv.sy||0),r:Math.round(utv.sr||0)}; }, soarDbg(k){ return soarers.filter(b=>b.kind===k).map(b=>{ const c=w2s(b.X,b.Y,b.Z); return [c.x,c.y,b.st||'',+b.Y.toFixed(2),+b.Z.toFixed(1)]; }); }, ravDbg(){ return soarers.filter(b=>b.kind==="raven").map(b=>{ const c=w2s(b.X,b.Y,b.Z); return [c.x,c.y,!!b.roll]; }); }, bigDbg(){ return bigL&&{x:bigL.sx,y:bigL.sy,S:bigL.sS,k:bigL.kind,D:bigL.D}; }, ptDbg(){ return {st:dog&&dog.state,t:dog&&+dog.t.toFixed(1),covey:covey.length,pheas:!!pheas,q:covey[0]&&[Math.round(covey[0].sx),Math.round(covey[0].sy)],d:dog&&toScreen(dog.Xw,dog.Dw)}; }, banDbg(){ return ban&&ban.bp; }, pfDbg(){ if(!pf) return null; const F=H*.5; return {t:+pf.t.toFixed(2),sx:Math.round(W/2+pf.P[0]*F/pf.P[2]),sy:Math.round(H*.52+pf.P[1]*F/pf.P[2]),z:+pf.P[2].toFixed(2),r:Math.round(.016*32*F/Math.max(.3,pf.P[2])+30)}; }, eagleDbg(){ if(!eag) return null; const P=eagleAt(eag,eag.t/eag.dur); return {t:+eag.t.toFixed(1),P:P.map(v=>+v.toFixed(2)),sx:Math.round(W/2+P[0]*H*.5/P[2]),sy:Math.round(H*.52+P[1]*H*.5/P[2]),amp:+eag.amp.toFixed(2),bank:+eag.bank.toFixed(2),hy:+eag.hy.toFixed(2)}; }, where(){ return [dog,lab].map(d=>d&&Object.assign(toScreen(d.Xw,d.Dw),{flee:!!d.flee,st:d.state})).concat([buck&&Object.assign(buckPose(),{on:buck.onLawn})]).concat(wcs.map(w=>Object.assign(toScreen(w.Xw,w.Dw),{st:w.state}))).concat(mons.map(m=>({x:m.sx,y:m.sy,st:"mon",z:m.z}))).concat(sqs.map(q=>Object.assign(toScreen(q.Xw,q.Dw),{st:"sq:"+q.kind+":"+q.state}))).concat([cub,mom].filter(Boolean).map(b=>Object.assign(toScreen(b.Xw,b.Dw),{st:"bear"}))).concat(hawkG?[{x:hawkG.x,y:hawkG.y,st:"hk:"+hawkG.state+":"+hawkG.st.toFixed(2)}]:[]).concat(hum&&hum.sx!=null?[{x:hum.sx,y:hum.sy,st:"hum"}]:[]).concat(pecker?[{x:pecker.x,y:pecker.y,st:"pk:"+pecker.state,z:pecker.m}]:[]); }, spawn(n){ lastArrive=-99; if(n==="cub"){ nextCub=0; dog=lab=null; rompAt=null; } else if(n==="grayfox") nextCoyote=0; else if(n==="coyote"){ coy2=null; nextCoy2=0; } else if(n==="turtle"){ turtle=null; nextTurtle=0; } else if(n==="jays"){ jays=null; nextJays=0; } else if(n==="pheasfront"){ pf=null; nextPF=0; } else if(n==="lab") nextLab=0;  else if(n==="point"&&dog){ const sx=toScreen(dog.Xw,dog.Dw).x, q=toGround(sx,gnd().vy+lawnMinG(sx)+6); dog.tX=q.Xw; dog.tD=q.Dw; dog.toBrush=true; dog.state="run"; dog.romp=0; dog.chase=false; dog.toViewer=false; dog.legs=Math.max(dog.legs,2); } else if(n==="quail"){ quails=[]; startQuail(); } else if(n==="chase"){ bbChase=null; nextChase=0; } else if(n==="utv"){ utv=null; startUtv(); } else if(n==="utv2"){ utv=null; utvRoute=1; startUtv(); } else if(n==="utv1"){ utv=null; utvRoute=0; startUtv(); } else if(n==="falcon"){ soarers=soarers.filter(b=>b.kind!=="falcon"); startFalcon(); } else if(n==="heron"){ soarers=soarers.filter(b=>b.kind!=="heron"); startHeron(); } else if(n==="hawkv"){ soarers=soarers.filter(b=>b.kind!=="hawk"); startHawk(); } else if(n==="ravens"){ soarers=soarers.filter(b=>b.kind!=="raven"); startRavens(); } else if(n==="cmon"){ cmon=null; startCmon(); } else if(n==="banner"){ ban=null; startBanner(); } else if(n==="eagle"){ eag=null; startEagle(); } else if(n==="greet"&&dog){ dog.legs=0; dog.romp=0; dog.state="run"; dog.tX=dog.Xw; dog.tD=dog.Dw; dog.pointed=true; } else if(n==="buckLawn"){ buck2=null; startBuck(); buck.plan=[{k:"walk",...lawnPt()},{k:"look",dur:8}]; } else if(n==="flock"){ bbFlock=null; nextBB=0; } else if(n==="woodcock"){ wcs.length=0; nextWc=0; } else if(n==="monarch"){ nextMon=0; } else if(n==="doe"){ doe=null; nextDoe=0; } else if(n==="hum"){ hum=null; nextHum=0; } else if(n==="hen"){ hen=null; nextHen=0; } else if(n==="dusk"){ duskV=.62; } else if(n==="squirrels"){ nextSq=0; } else if(n==="bigleaf"){ bigL=null; nextBig=0; } else if(n==="hawkg"){ hawkG=null; nextHawkG=0; } else if(n==="pecker"){ pecker=null; nextPecker=0; } else if(n.startsWith("moth")){ hero=null; nextHero=0; forceDir=n.split(":")[1]==="in"?"in":n.split(":")[1]==="out"?"out":null; forceMoth=n.split(":")[1]||null; } else if(n==="buck2"){ buck2=null; nextBuck2=0; } else if(n==="sit"&&dog){ dogSit(dog,false); dog.st=7; dog.scr=[1.6,4.4]; if(lab){ dogSit(lab,false); lab.st=7; lab.scr=null; } } else if(n==="romp"){ dog=lab=null; rompAt=0; } else if(n==="mom"&&cub) cub.momAt=0; }, get on(){ return on; }, set(v){ on=!!v; try{ localStorage.setItem(SC.key+"-ambient",on?"on":"off"); }catch(e){} start(); natureSfx.refresh(); } };
})();
