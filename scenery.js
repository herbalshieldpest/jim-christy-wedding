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
  function honk(xFrac,near){
    if(!ctx||!live||Math.random()<.35) return; const now=ctx.currentTime+.02, o=voice(master,xFrac*2-1), bp=ctx.createBiquadFilter(); bp.type="bandpass"; bp.frequency.value=900; bp.Q.value=2; bp.connect(o);
    const v=.035*near; let at=now; const n=1+Math.floor(Math.random()*3); for(let i=0;i<n;i++){ tone(at,R(330,380),R(290,320),.16,v,bp,"sawtooth"); at+=R(.22,.4); }
  }
  function apply(){
    const want=wanted();
    if(want && ctx){ if(ctx.state==="suspended") ctx.resume().catch(()=>{}); if(!faded){ faded=true; master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setValueAtTime(0,ctx.currentTime); master.gain.linearRampToValueAtTime(.9,ctx.currentTime+8); } else master.gain.setTargetAtTime(.9,ctx.currentTime,.8);
      if(!live){ live=true; clearTimeout(birdT); clearTimeout(gustT); clearTimeout(owlT); clearTimeout(hawkT); clearTimeout(coyT); birdT=setTimeout(birds,800); startChorus(); owlT=setTimeout(owl,R(12,40)*1000); hawkT=setTimeout(hawk,R(25,60)*1000); coyT=setTimeout(coyotes,R(45,100)*1000); loadCoyote(); gust(); } }
    else if(ctx){ if(want) return; master.gain.setTargetAtTime(0,ctx.currentTime,.3); live=false; clearTimeout(birdT); clearTimeout(gustT); clearTimeout(owlT); clearTimeout(hawkT); clearTimeout(coyT); clearTimeout(chorT); clearTimeout(katT); clearTimeout(peepT); clearTimeout(wpwT); clearTimeout(bowlT); }
  }
  /* browsers only allow sound after a tap or key press */
  /* a press on the page's own sound button is left to that button, so it can't start the sound and then have the same press turn it off */
  const skip=e=>!!(e&&e.target&&e.target.closest&&e.target.closest("[data-sound-toggle]"));
  function arm(){ if(armed) return; armed=true; const go=e=>{ if(skip(e)) return; ["pointerdown","keydown","touchstart"].forEach(ev=>document.removeEventListener(ev,go,true)); if(wanted()&&init()) apply(); else armed=false; };
    ["pointerdown","keydown","touchstart"].forEach(ev=>document.addEventListener(ev,go,true)); }
  document.addEventListener("visibilitychange",()=>{ if(ctx) apply(); });
  ["pointerdown","keydown","touchstart"].forEach(ev=>document.addEventListener(ev,e=>{ if(skip(e)) return; if(ctx&&wanted()&&ctx.state!=="running") ctx.resume().then(apply).catch(()=>{}); },true));
  setTimeout(()=>{ arm(); if(wanted()&&init()){ if(ctx.state==='running') apply(); else ctx.resume().then(()=>{ if(ctx.state==='running') apply(); }).catch(()=>{}); } },0);
  return { get on(){ return on; }, get playing(){ return !!(on&&live&&ctx&&ctx.state==="running"); }, set(v){ on=!!v; if(on){ if(init()) apply(); else arm(); } else apply(); }, refresh(){ if(ctx) apply(); else if(wanted()) arm(); }, flush, honk, hawk(){ if(ctx&&live){ clearTimeout(hawkT); hawk(); } }, yip(){ if(ctx&&live){ clearTimeout(coyT); coyotes(); } }, drum, peck, paw, scratch, humSet, humChip, bluebird, setDusk(d){ dusk=d; } };
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
    const oak=new Path2D(); const M=60, side=[];
    for(let i=0;i<=M;i++){ const y=-1+2*i/M, w=.42*Math.sqrt(Math.max(0,1-y*y))*(1+.28*Math.sin((y+1)*Math.PI*3.2))+.04; side.push([w,y]); }
    oak.moveTo(0,-1); side.forEach(([w,y])=>oak.lineTo(w,y)); side.slice().reverse().forEach(([w,y])=>oak.lineTo(-w,y)); oak.closePath();
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
    ctx.beginPath(); ctx.moveTo(0,-.8); ctx.lineTo(0,1.35);
    if(l.kind==="maple"){ ctx.moveTo(0,.2); ctx.lineTo(-.62,-.45); ctx.moveTo(0,.2); ctx.lineTo(.62,-.45); ctx.moveTo(0,.25); ctx.lineTo(-.7,.35); ctx.moveTo(0,.25); ctx.lineTo(.7,.35); }
    ctx.stroke();
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
    if(l.D<.06||l.D>7||x<-S*3||x>W+S*3||y>H+S*3){ bigL=null; nextBig=rnd(16,34); return; }
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
    const vein=`rgba(${back?"70,40,18":"255,214,150"},${back?.4:.35})`;                                                        /* veins: pale on the face, dark on the back */
    ctx.strokeStyle=vein; ctx.lineWidth=1.6/S; ctx.lineCap="round"; ctx.beginPath(); ctx.moveTo(0,-.85); ctx.lineTo(0,1.4);
    if(l.kind==="maple"){ for(const [a,b] of [[-.62,-.45],[.62,-.45],[-.7,.35],[.7,.35]]){ ctx.moveTo(0,.22); ctx.lineTo(a,b); } }
    else { for(let i=0;i<6;i++){ const yy=-.65+i*.28, w=(l.kind==="oak"?.36:.5)*Math.sqrt(Math.max(0,1-yy*yy)); ctx.moveTo(0,yy+.08); ctx.quadraticCurveTo(w*.5,yy-.02,w,yy-.14); ctx.moveTo(0,yy+.08); ctx.quadraticCurveTo(-w*.5,yy-.02,-w,yy-.14); } }
    ctx.stroke();
    ctx.strokeStyle="rgba(60,28,8,.5)"; ctx.lineWidth=1.2/S; ctx.stroke(p);                                                   /* the curled, darker rim */
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
      f.honk-=dt; if(f.honk<=0){ f.honk=rnd(.8,3.5); const c=w2s(f.X,f.Y,f.Z); if(c.x>0&&c.x<W&&typeof natureSfx!=="undefined") natureSfx.honk(c.x/W,Math.min(1,9/f.Z)); }
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
  const moonCv=document.createElement("canvas"); const moonImg=new Image(); moonImg.src=SC.sounds+"moon.png";   /* a real photograph of the moon */
  /* fold the moon into the photo: tinted toward the sky around it, its contrast eased to the photo's, a little film grain, and tucked behind the clouds where the photo has cloud */
  let moonKey="";
  function moonComp(p,R,S2){
    moonCv.width=moonCv.height=S2; const mx=moonCv.getContext("2d"); mx.clearRect(0,0,S2,S2);
    mx.save(); mx.translate(S2/2,S2/2); mx.rotate(110*Math.PI/180); mx.drawImage(moonImg,-S2/2,-S2/2,S2,S2); mx.restore();
    const sky=document.createElement("canvas"); sky.width=sky.height=S2; const sx=sky.getContext("2d"), m=cover();
    sx.drawImage(photo,(p[0]-R-m.ox)/m.s,(p[1]-R-m.oy)/m.s,(2*R)/m.s,(2*R)/m.s,0,0,S2,S2);
    let A,B; try{ A=mx.getImageData(0,0,S2,S2); B=sx.getImageData(0,0,S2,S2); }catch(e){ mx.globalCompositeOperation="source-atop"; mx.fillStyle="rgba(214,180,140,.3)"; mx.fillRect(0,0,S2,S2); mx.globalCompositeOperation="source-over"; return; }   /* if the browser won't let us read the photo, a plain warm tint */
    const a=A.data, b=B.data;
    let ar=0,ag=0,ab=0,n=0,lm=[]; for(let k=0;k<b.length;k+=16){ ar+=b[k]; ag+=b[k+1]; ab+=b[k+2]; n++; lm.push(b[k]+b[k+1]+b[k+2]); } ar/=n; ag/=n; ab/=n; lm.sort((x,y)=>x-y); const clear=lm[Math.floor(lm.length*.85)]/3;   /* the open sky is the bright part here; the clouds are the darker, browner part */
    for(let k=0;k<a.length;k+=4){ if(!a[k+3]) continue; const r=b[k], g=b[k+1], bl=b[k+2];
      const lum=(r+g+bl)/3, cloud=Math.max(0,Math.min(1,(clear*.94-lum)/40))*Math.max(.3,Math.min(1,(r-bl+30)/50));
      const L=(a[k]-128)*.82+128;                                                                                /* the photo's softer contrast */
      const gr=(Math.random()-.5)*10;
      a[k]=Math.min(255,L*.78+ar*.26+gr); a[k+1]=Math.min(255,L*.76+ag*.24+gr); a[k+2]=Math.min(255,L*.72+ab*.22+gr);   /* tinted toward the evening sky */
      a[k+3]=a[k+3]*(1-.88*cloud); }
    mx.putImageData(A,0,0);
  }
  function drawMoon(){
    const p=[W*.15,Math.max(H*.15,scr(.15,.16)[1])], R=Math.min(W,H)*.08, d=Math.min(1,duskV/.62), a=.55+.4*d;
    const veil=.25+.35*Math.max(0,Math.sin(t*.045+1)*.5+Math.sin(t*.11)*.5);                                           /* thin cloud drifting across it */
    ctx.save(); ctx.globalAlpha=a*(1-veil*.55);
    const gl=ctx.createRadialGradient(p[0],p[1],R*.6,p[0],p[1],R*2.6); gl.addColorStop(0,`rgba(255,246,226,${(.12*a).toFixed(3)})`); gl.addColorStop(1,"rgba(255,246,226,0)"); ctx.fillStyle=gl; ctx.fillRect(p[0]-R*4,p[1]-R*4,R*8,R*8);   /* glow in the haze */
    ctx.globalCompositeOperation="screen"; if(moonImg.complete&&moonImg.naturalWidth){ const S2=Math.ceil(R*2), key=[W,H,S2,Math.round(p[0]),Math.round(p[1])].join("|");
      if(moonKey!==key){ moonKey=key; moonComp(p,R,S2); }                                                                   /* built once: the moon worked into the photo's own sky */
      ctx.globalAlpha=Math.min(1,(.78+.2*d)*(1-veil*.4)); ctx.globalCompositeOperation="source-over"; ctx.filter="blur(.7px)"; ctx.drawImage(moonCv,p[0]-R,p[1]-R,R*2,R*2); ctx.filter="none"; ctx.setTransform(camZ,0,0,camZ,(1-camZ)*W/2+camX,(1-camZ)*H/2+camY); } else ctx.drawImage(moonSpr,p[0]-R-R*4/64,p[1]-R-R*4/64,R*2+R*8/64,R*2+R*8/64);   /* screened, so its dark half melts into the sky and only the lit part shows */
    ctx.restore();
    if(skyTile){ const ip=toImg(p[0],p[1]); const c=(ip&&sampleAt(Math.max(0,Math.min(1,ip[0])),Math.max(0,Math.min(1,ip[1]))))||[120,110,110];
      const v=ctx.createRadialGradient(p[0]+Math.sin(t*.07)*R,p[1],0,p[0],p[1],R*2.2); v.addColorStop(0,rgb(c,.4*veil)); v.addColorStop(1,rgb(c,0)); ctx.fillStyle=v; ctx.fillRect(p[0]-R*2.5,p[1]-R*2.5,R*5,R*5); }   /* the veil itself */
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
    [.2,1.1,[255,190,120],"glow",.3],[.36,.5,[190,140,255],"hex",.36],[.5,.8,[255,170,90],"disc",.3],[.62,1.35,[140,220,170],"ring",.4],
    [.74,.32,[200,255,230],"disc",.6],[.85,1.05,[255,120,200],"disc",.24],[.93,.6,[255,200,120],"hex",.3],[1,1,[170,240,120],"main",1],[1.16,2,[150,190,255],"ring",.18]];
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
  function flyStart(kind){
    const [p0]=flushPath(), gp=toGround(p0[0],p0[1]);
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
    const s=w2s(b.X,b.Y,b.Z), worldSpan=pheas?.26:.22, u=worldSpan*s.k/60; b.st=Math.max(1,Math.min(2.2,u*1.6));
    const haze=Math.max(0,Math.min(.8,(b.Z-4)/22)), hz=dark?[60,52,44]:[200,176,134];
    const lit=dark?.5:.72, M=c=>rgb(mixv(mulv(c,lit),hz,haze));
    const C= pheas? {wing:M([128,94,58]),body:M([150,76,34]),head:M([22,58,50]),tail:M([124,88,52]),ring:M([214,206,192]),dark:M([40,30,20])}
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
    const T=(x,y)=>{ const c=Math.cos(pitchB), s=Math.sin(pitchB), dy=y-12; return [x*c-dy*s, 12+bob+x*s+dy*c]; };
    const B=(x,y,z,r)=>{ const t=T(x,y); return [t[0],t[1],z,r]; };
    /* legs: a bounding gallop, black stockings below the knee */
    for(const [lx,ly,z,ph,hind] of [[7.5,11.5,-2.1,0,0],[7.5,11.5,2.1,.4,0],[-8.5,12,-2.4,Math.PI,1],[-8.5,12,2.4,Math.PI+.4,1]]){
      const sw=running?Math.sin(q+ph):0, lift=running?Math.max(0,-Math.cos(q+ph)):0, top=T(lx,ly);
      const segs= hind? [[4.2,.35+.6*sw,1.5],[4.6,-.55+.6*sw-lift*.6,1.0],[3.6,.1+.6*sw+lift*.4,.75]] : [[4.4,-.1+.65*sw,1.4],[5.0,.65*sw-lift*1.4,.95],[1.5,.3+.65*sw-lift*1.7,.75]];
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
    const Hh=(u,v,w,r)=>{ const t=headPt(hc,hp,hy,u,v,w); return [t[0],t[1],t[2],r]; };
    parts.push({p:[Hh(-.2,0,0,3.0),Hh(1.2,.1,0,2.8),Hh(2.7,-.5,0,1.9),Hh(4.7,-.9,0,1.15),Hh(5.8+sn,-1.05,0,.62)],c:coat});
    parts.push({p:[Hh(.5,-1.6,0,1.9),Hh(2.4,-1.5,0,1.35),Hh(4.4,-1.35,0,.75)],c:wh,bias:-.2});
    parts.push({p:[Hh(6.0+sn,-1.0,0,.55)],c:dk,bias:-.5});
    for(const sd of [-1,1]){
      parts.push({p:[Hh(2.1,.85,1.55*sd,.42)],c:dk,bias:-.6});
      parts.push({poly:true,p:earPts(Hh,sd,[-.3,1.9,1.5],[-.15,.9,.35],[.8,.05,.5],4.8,1.7,[[0,1],[.45,.62],[.8,.25]]),c:P.ear?rgb(far(sd)?mulv(P.ear,.8):P.ear):(far(sd)?dkFar:dk)});
    }
    /* the brush: a wave runs down it, streaming out behind at a run, swaying low when it stands */
    const tb=B(-10.6,13.2,0,1.4); let tp=[tb[0],tb[1],0]; const tail=[[...tp,1.4]];
    const om=running?9:1.7, Av=running?.12:.07, Al=running?.14:.2, base=(running?.3:(f.state==="sniff"?.75:.62))+(f.coy?.5:0);
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
  /* ---- a coyote: trots in low and steady, stops to sniff and stare, then lopes off; bigger and greyer than the fox, tail hung low with a dark tip ---- */
  let coyote=null, nextCoyote=200;
  function startCoyote(){
    const b=foxBounds(), side=Math.random()<.5, x0=side? W+70 : -70, g=rnd(Math.max(b.gmin,lawnMinG(side?W*.9:W*.1))+20,b.gmax-25), p=toGround(x0,gnd().vy+g);
    coyote={Xw:p.Xw,Dw:p.Dw,state:"run",t:rnd(2.5,4),cycles:3+Math.floor(Math.random()*3),head:0,headT:0,turn:0,turnT:0,jerk:0,ph:0,sniff:0,alpha:1,spd:.62,cad:.7,yaw:side?Math.PI:0,coy:true};
    const q=toGround(W*(side?rnd(.55,.75):rnd(.25,.45)),gnd().vy+g); coyote.tX=q.Xw; coyote.tD=q.Dw; coyote.ang=null; arrive(x0,coyote);
  }
  function drawCoyote(dt,dark){
    if(!coyote){ nextCoyote-=dt; if(nextCoyote<=0){ if(groundBusy()) nextCoyote=12; else startCoyote(); } return; }
    const was=coyote.state; foxStep(coyote,dt); if(coyote.gone){ coyote=null; nextCoyote=rnd(220,380); return; }
    const f=coyote, s=toScreen(f.Xw,f.Dw), k=.16*s.g/26*1.22, running=f.state==="run"||f.state==="leave";
    if(was!=="leave"&&f.state==="leave"&&Math.random()<.4) setTimeout(()=>natureSfx.yip(),rnd(2,5)*1000);   /* sometimes the pack answers from the woods as it goes */
    if(f.pw){ const dX=f.Xw-f.pw[0], dZ=trueZ(f.Dw)-f.pw[1]; if(running&&Math.hypot(dX,dZ)>1e-5) f.yaw=angTo(f.yaw,Math.atan2(dZ,dX),dt*6); } idleTurn(f,dt,running); keepOnLawn(f); f.pw=[f.Xw,trueZ(f.Dw)];
    f.ct=(f.ct||0)-dt;
    if(f.ct<=0||!f.pal){ f.ct=1.5; const G=groundPal(s,dark), g=G.g, lit=dark?.45:.6;
      f.pal={...G, coat:mixv(mulv([140,116,88],lit),mulv(g,.55),.2), dark:mulv([104,88,70],lit), white:mixv(mulv([214,204,186],lit),mulv(g,.6),.2), ear:mulv([132,104,76],lit), tip:mulv([38,30,24],lit)}; }
    if(!f.blades) f.blades=Array.from({length:10},()=>({ox:rnd(-24,24),h:rnd(3,7),lean:rnd(-.5,.5),c:Math.random()}));
    critterBlit(null,null,f,s,k,f.pal,()=>foxParts(f,f.pal,running||f.turning),f.yaw,52,104,22,f.blades,f.alpha);
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
    for(const f of [fox,skunk,cub,mom,bobcat,pheasW,coyote]) if(f&&f!==self&&!f.gone){ const s=toScreen(f.Xw,f.Dw), p=toGround(away(s.x),gnd().vy+s.g); f.state="leave"; f.tX=p.Xw; f.tD=p.Dw; f.ang=null; f.spd=Math.max(f.spd||1,1.3); f.cad=Math.max(f.cad||1,1); f.head=0; }
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
  let cur=null, callDist=0, lastCall=-99; const trail=[], puffs=[];
  document.addEventListener("pointermove",e=>{ if(!on) return; const x=(e.clientX-(1-camZ)*W/2-camX)/camZ, y=(e.clientY-(1-camZ)*H/2-camY)/camZ;
    const prev=cur; const fresh=!cur||t-cur.t>1.5; cur={x,y,t,sess:fresh?((cur&&cur.sess)||0)+1:cur.sess}; if(!trail.length||Math.hypot(x-trail[trail.length-1].x,y-trail[trail.length-1].y)>6) trail.push({x,y,t,r:rnd(4.5,7),rot:rnd(0,6.28),spin:rnd(-3,3),vx:rnd(-12,12),hue:Math.random(),ph:rnd(0,6)}); if(trail.length>50) trail.shift();
    if(!dog&&!lab&&rompAt==null){ if(prev) callDist+=Math.hypot(x-prev.x,y-prev.y); if(callDist>W*1.2&&t-lastCall>6){ callDist=0; lastCall=t; startRomp(); } } else callDist=0; },{passive:true});   /* wave the cursor around a bit and the dogs come running back */
  const chasing=()=>cur&&t-cur.t<2.6;
  /* each dog has a mind of its own: it notices the cursor late (or not at all this time), and follows a lagging, smoothed idea of where it is */
  function dogWantsChase(d,dt){
    if(!chasing()) { d.csess=null; return false; }
    if(d.csess!==cur.sess){ d.csess=cur.sess; d.react=rnd(.25,1.8)*(d.lab?1.3:1); d.ignore=Math.random()<.22; d.lagK=rnd(.6,2.2); d.fx=d.fx??cur.x; d.fy=d.fy??cur.y; }
    if(d.ignore) return false; d.react-=dt; if(d.react>0) return false;
    if(!d.chase&&d.fx==null){ d.fx=cur.x; d.fy=cur.y; }
    const k=Math.min(1,dt*d.lagK); d.fx+=(cur.x-d.fx)*k; d.fy+=(cur.y-d.fy)*k; return true; }
  function chaseTarget(d){ const x=d.fx, lo=lawnMinG(x)+10, hi=foxBounds().gmax-6, g=Math.max(lo,Math.min(hi-16,d.fy-gnd().vy+(d.lab?14:-10))), p=toGround(Math.max(20,Math.min(W-20,x+(d.lab?-50:50))),gnd().vy+g); d.tX=p.Xw; d.tD=p.Dw; }
  let scareT=0;
  function dogScare(dt){                                                                          /* some animals bolt the moment a dog comes near, some let it get close, a few hardly care */
    scareT-=dt; if(scareT>0) return; scareT=.3;
    const dogs=[dog,lab].filter(d=>d&&!d.gone&&!d.hidden&&(d.state==="run"||d.chase)); if(!dogs.length) return;
    const nerve=o=>o.bird? 2.6 : o.nerve??(o.nerve=Math.random()<.15? 0 : rnd(.4,1.6));   /* birds are always terrified of the dogs */
    const near=(sx,sy,o)=>{ for(const d of dogs){ const s=toScreen(d.Xw,d.Dw); if(Math.hypot(s.x-sx,(s.y-sy)*1.6)<W*.2*nerve(o)) return s; } return null; };
    for(const f of [fox,skunk,cub,mom,bobcat,coyote,pheasW]){ if(!f||f.gone||f.state==="leave") continue; if(f===pheasW) f.bird=true; const s=toScreen(f.Xw,f.Dw), d=near(s.x,s.y,f); if(!d) continue;
      const p=toGround(d.x<s.x? W+150 : -150,gnd().vy+s.g); f.state="leave"; f.tX=p.Xw; f.tD=p.Dw; f.ang=null; f.spd=Math.max(f.spd||1,1.3); f.cad=Math.max(f.cad||1,1); f.head=0; }
    for(const q of sqs){ if(q.leaving) continue; const s=toScreen(q.Xw,q.Dw), d=near(s.x,s.y,q); if(d){ q.leaving=true; q.state="run"; q.yawT=null; const p=toGround(s.x+(s.x<d.x?-200:200),gnd().vy+lawnMinG(s.x)+4); q.tX=p.Xw; q.tD=p.Dw; q.lastD=1e9; } }
    for(const w of wcs){ w.bird=true; if(w.leaving) continue; const s=toScreen(w.Xw,w.Dw), d=near(s.x,s.y,w); if(d){ w.leaving=true; w.state="run"; const p=toGround(s.x,gnd().vy+lawnMinG(s.x)-4); w.tX=p.Xw; w.tD=p.Dw; } }
    for(const bn of buns) if(bn.init&&bn.state!=="hop"&&near(bn.x,bn.y,bn)){ const d=near(bn.x,bn.y,bn); bn.state="hop"; bn.hops=3+Math.floor(Math.random()*3); bn.face=bn.x<d.x?-1:1; bn.hx=bn.x; bn.tx=Math.max(W*.06,Math.min(W*.94,bn.x+bn.face*rnd(14,26))); bn.hop=0; }
    if(doe&&!doe.leaving){ const s=toScreen(doe.Xw,doe.Dw); if(near(s.x,s.y,doe)){ doe.leaving=true; const p=toGround(s.x,gnd().vy+lawnMinG(s.x)-6); doe.tX=p.Xw; doe.tD=p.Dw; doe.state="walk"; } }
    if(hen&&!hen.fled){ hen.bird=true; const s=toScreen(hen.Xw,hen.Dw), d=near(s.x,s.y,hen); if(d){ hen.fled=true; hen.stop=0; const p=toGround(d.x<s.x? W+200 : -200,gnd().vy+s.g); hen.tX=p.Xw; hen.tD=p.Dw; hen.spdK=6; } }   /* the hen hurries her poults off at a run */
    if(pheasW&&!pheasW.gone&&pheasW.state!=="leave"){ pheasW.bird=true; }
    /* a dog running hard through the cover sometimes puts up a bird: a pheasant or grouse bursts out ahead of it */
    if(dogs.some(d=>d.chase||d.romp>0)&&!grouse&&!pheas&&Math.random()<.04){ if(Math.random()<.55) flushPheasant(); else flushGrouse(); }
    if(turks&&turks.mode!=="leave"){ turks.bird=true; const s=toScreen(turks.cX,turks.cD), d=near(s.x,s.y,turks); if(d){ const p=toGround(d.x<s.x? W+150 : -150,gnd().vy+s.g); turks.mode="leave"; turks.gX=p.Xw; turks.gD=p.Dw; turks.dir=s.x<d.x?-1:1; turks.birds.forEach(b=>{ b.state="walk"; b.fanT=0; }); } }
  }
  function drawTrail(dt,dark){                                                                    /* the cursor's trail: little motes of light that drift and fade */
    for(let i=trail.length-1;i>=0;i--){ const p=trail[i], age=t-p.t, a=Math.min(1,(1.8-age)/.6); if(a<=0){ trail.splice(i,1); continue; }   /* petals shaken loose: they flutter and tumble down, drifting on the air */
      p.y+=dt*(14+age*10); p.x+=dt*(p.vx+Math.sin(t*3+p.ph)*16); p.rot+=dt*p.spin; const flip=Math.cos(t*4+p.ph);
      const col=p.hue<.45? [240,190,204] : p.hue<.8? [248,232,226] : [226,156,182], lt=dark?.6:.92;
      ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot); ctx.scale(1,Math.max(.15,Math.abs(flip))); ctx.globalAlpha=a*.9;
      ctx.fillStyle=rgb(mulv(flip>0?col:mulv(col,.86),lt)); ctx.beginPath(); ctx.moveTo(0,-p.r*1.3); ctx.bezierCurveTo(p.r,-p.r*.9,p.r*.9,p.r*.8,0,p.r*1.1); ctx.bezierCurveTo(-p.r*.9,p.r*.8,-p.r,-p.r*.9,0,-p.r*1.3); ctx.fill();
      ctx.fillStyle=rgb(mulv([226,150,170],lt),.5); ctx.beginPath(); ctx.ellipse(0,p.r*.7,p.r*.25,p.r*.35,0,0,6.283); ctx.fill(); ctx.restore(); }
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
        if(!d.lab && !d.pointed && d.legs<=4 && Math.random()<.85){ d.state="point"; d.t=0; d.pt=rnd(2.2,3.4); d.pointed=true; d.idleYaw=d.yaw; }
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
      if(!d.flushed && d.t>d.pt*.7){ d.flushed=true; if(!grouse&&!pheas){ if(Math.random()<.6) flushPheasant(); else flushGrouse(); } }
      if(d.t>d.pt){ d.state="run"; dogTarget(d); } }
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
    nextHero-=dt; if(!hero&&nextHero<=0){ const sd=Math.random()<.5?-1:1; lunaDir=lunaDir==="out"?"in":"out"; hero={t:0,sp:"luna",dir:forceDir||lunaDir,X0:sd*rnd(.18,.3),Y0:rnd(.06,.16),ph:rnd(0,6),fl:0}; forceDir=null; }
    if(!hero) return; const h=hero; h.t+=dt; h.fl+=dt*Math.PI*2*(6.5+Math.sin(h.t*1.3)*1.5);
    const z=h.dir==="in"? 11*Math.exp(-h.t*.42) : .32*Math.exp(h.t*.42), F=H*.5, cx=W/2, cy=H*.52, pull=ease((z-.32)/2.4);   /* out: from beside you toward the sun; in: out of the sunset straight at you */
    const tX=(sp.x-cx)*z/F, tY=(sp.y+H*.08-cy)*z/F;
    const X=lerp(h.X0+Math.sin(h.t*1.9+h.ph)*.06*Math.min(1,z),tX,pull)+Math.sin(h.t*3.3)*.025*z, Y=lerp(h.Y0+Math.cos(h.t*2.3+h.ph)*.05*Math.min(1,z),tY,pull)+Math.cos(h.t*2.9)*.02*z;
    h.sx=cx+X*F/z; h.sy=cy+Y*F/z; const sx=h.sx, sy=h.sy, s=.0068*F/z, a=z<.5? ease((z-.32)/.18) : z>9? Math.max(0,1-(z-9)/3) : 1;
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
  function drawFlock(dt,dark){
    nextBB-=dt; if(!bbFlock&&nextBB<=0) startFlock(); if(!bbFlock) return;
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
    nextPecker-=dt; if(!pecker&&nextPecker<=0) startPecker(); if(!pecker) return;
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
  function drawMonarchs(dt,dark){
    const F=H*.5, cx=W/2, cy=H*.52, g=gnd();
    nextMon-=dt; if(nextMon<=0&&mons.length<(MOBILE()?2:3)){ nextMon=rnd(12,28); const side=Math.random()<.5?-1:1;
      mons.push({t:0,life:rnd(22,40),sx:side<0? -30 : W+30,sy:g.vy+rnd(-30,90),z:rnd(2.2,6.5),dir:-side,ph:rnd(0,6),flapT:0,glide:0,ang:.4,tz:rnd(2,6),wy:rnd(0,6)}); }
    if(!mons.length) return;
    const x=ctx; x.save(); x.imageSmoothingEnabled=true; x.imageSmoothingQuality="high";                 /* straight onto the scene: no full-screen pass every frame */
    let zs=0;
    for(let i=mons.length-1;i>=0;i--){ const m=mons[i]; m.t+=dt;
      /* a lazy, wandering course: drifting across, rising and dipping, coming nearer and farther */
      m.sx+=m.dir*(26+Math.sin(m.t*.7+m.ph)*14)*dt*(4/m.z); m.sy+=(Math.sin(m.t*1.1+m.wy)*22+Math.sin(m.t*2.9)*10)*dt; m.sy=Math.max(g.vy-70,Math.min(H*.92,m.sy));
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
    if(layer==="near"){ nextHawkG-=dt; if(!hawkG&&nextHawkG<=0) startHawkG(); }
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
  let duskV=0; const stars=[];
  function stepDusk(dt){ duskV=Math.min(.62,duskV+dt/420); natureSfx.setDusk&&natureSfx.setDusk(Math.min(1,duskV/.62)); }
  function drawDusk(dark){
    const d=duskV; if(d<=.01) return; const hz=gnd().vy;
    const g=ctx.createLinearGradient(0,0,0,hz+20); g.addColorStop(0,`rgba(16,20,48,${(.5*d).toFixed(3)})`); g.addColorStop(.7,`rgba(40,30,60,${(.22*d).toFixed(3)})`); g.addColorStop(1,"rgba(40,30,60,0)");
    ctx.fillStyle=g; ctx.fillRect(0,0,W,hz+20);
    ctx.fillStyle=`rgba(12,10,20,${(.16*d).toFixed(3)})`; ctx.fillRect(0,hz,W,H-hz);                       /* the land dims a little too */
    if(!stars.length) for(let i=0;i<(MOBILE()?26:46);i++) stars.push({x:Math.random(),y:Math.random()*.42,r:rnd(.4,1.1),ph:rnd(0,6),on:rnd(.25,.6)});
    const sp=sun(), ve=[sp.x-W*.16,sp.y-H*.17];                                                            /* Venus, the evening star, first to show */
    if(d>.18){ const a=Math.min(1,(d-.18)/.15); ctx.save(); ctx.globalCompositeOperation="lighter"; const gl=ctx.createRadialGradient(ve[0],ve[1],0,ve[0],ve[1],9); gl.addColorStop(0,`rgba(255,250,236,${(.95*a).toFixed(2)})`); gl.addColorStop(.25,`rgba(255,240,210,${(.35*a).toFixed(2)})`); gl.addColorStop(1,"rgba(255,240,210,0)"); ctx.fillStyle=gl; ctx.fillRect(ve[0]-9,ve[1]-9,18,18); ctx.restore(); }
    ctx.save(); ctx.globalCompositeOperation="lighter";
    for(const s of stars){ const a=Math.max(0,Math.min(1,(d/.62-s.on)/.25))*(.6+.4*Math.sin(t*1.7+s.ph)); if(a<=.02) continue; const x=s.x*W, y=s.y*hz;
      if(Math.hypot(x-sp.x,y-sp.y)<W*.18) continue; ctx.fillStyle=`rgba(240,238,255,${(a*.8).toFixed(2)})`; ctx.beginPath(); ctx.arc(x,y,s.r,0,6.283); ctx.fill(); }
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
      ctx.fillStyle=ctx.strokeStyle=rgb(mixv([22,16,14],b.sky,Math.min(.85,hz+glow*.25)),.88*a); ctx.filter=b.z>4.5? "blur(.6px)" : "none";
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
    if(d.state==="walk"){ const dX=d.tX-d.Xw, dD=d.tD-d.Dw, dist=Math.hypot(dX,dD*.25)||1e-6, sp=.11, fr=Math.min(1,sp*dt/dist);
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
      x.fillStyle=C([196,26,44]); x.beginPath(); x.arc(g1[0],g1[1],wR*.95,0,6.283); x.fill(); }                    /* the ruby gorget */
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
    parts.push({p:[S(1.6,.95,0,.95),S(2.5,.75,0,.85)],c:C([96,16,30]),sh:[C([50,10,18]),C([150,26,48])],bias:-.08});                                                   /* the ruby gorget, mostly dark until it catches the light */
    parts.push({p:[S(2.2,1.45,.45,.18),S(2.5,1.3,.4,.12)],c:C([190,40,64]),bias:-.12});
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
    nextHum-=dt; if(!hum&&nextHum<=0){ const sp=sun(); hum={t:0,fx:sp.x+rnd(-W*.25,W*.15),fy:sp.y+H*rnd(.1,.25),hx:W*rnd(.3,.7),hy:H*rnd(.32,.55),ex:Math.random()<.5? -.2*W : 1.2*W,ey:H*rnd(.15,.4),beat:0}; }
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
  let tags=[]; const tagEl=document.createElement("div");
  tagEl.style.cssText="position:fixed;z-index:6;pointer-events:none;padding:6px 11px;border-radius:99px;background:rgba(24,18,12,.62);border:1px solid rgba(246,239,226,.22);color:#f6efe2;font:500 13px/1.3 system-ui,sans-serif;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);opacity:0;transition:opacity .25s;white-space:nowrap;transform:translate(-50%,-130%)";
  let tagTimer=null; document.addEventListener("DOMContentLoaded",()=>document.body.append(tagEl)); if(document.body) document.body.append(tagEl);
  function tag(x,y,r,name){ if(x>-50&&x<W+50&&y>-50&&y<H+50) tags.push([x,y,r,name]); }
  function collectTags(){
    tags=[]; const T=(o,n,r)=>{ if(o&&!o.gone){ const s=toScreen(o.Xw,o.Dw); tag(s.x,s.y-r*.6,r,n); } }, g=v=>Math.max(14,v);
    T(fox,"Red fox",30); T(skunk,"Striped skunk",24); T(cub,"Black bear cub",34); T(mom,"Black bear",60); T(bobcat,"Bobcat",30); T(coyote,"Coyote",36);
    T(dog,"Willow",34); T(lab,"Tulip",36); if(doe){ T(doe,"White-tailed doe",60); T(doe.fawn,"Fawn",34); }
    if(buck){ const p=buckPose(); tag(p.x,p.y-40,60,"White-tailed buck"); } if(buck2){ const p=buck2Pose(); tag(p.x,p.y-14,24,"White-tailed buck"); }
    for(const w of wcs) T(w,"American woodcock",18); for(const q of sqs) T(q,q.kind==="gray"?"Eastern gray squirrel":q.kind==="red"?"Red squirrel":"Eastern chipmunk",18);
    if(hen){ T(hen,"Wild turkey hen",26); for(const c of hen.chicks) T(c,"Turkey poult",14); }
    if(turks) for(const b of turks.birds) T(b,"Wild turkey",26);
    for(const bn of buns) tag(bn.x,bn.y-8,16,"Eastern cottontail");
    if(hawkG) tag(hawkG.x,hawkG.y-10,g(30*hawkG.m),"Red-tailed hawk"); if(pecker) tag(pecker.x,pecker.y,g(16*pecker.m),"Pileated woodpecker");
    if(hero&&hero.sx!=null) tag(hero.sx,hero.sy,40,"Luna moth"); for(const m of mons) tag(m.sx,m.sy,20,"Monarch butterfly");
    if(bbFlock) for(const b of bbFlock.birds) if(b.sx!=null) tag(b.sx,b.sy,24,"Eastern bluebird");
    if(hum&&hum.sx!=null) tag(hum.sx,hum.sy,40,"Ruby-throated hummingbird"); for(const b of bats) tag(b.x,b.y,16,"Little brown bat");
    for(const c of cards) tag(c.x,gnd().vy+lawnMinG(c.x)-16,14,c.male?"Northern cardinal":"Northern cardinal (female)");
    for(const b of soarers){ const c=w2s(b.X,b.Y,b.Z); tag(c.x,c.y,26,b.kind==="vult"?"Turkey vulture":b.kind==="hawk"?"Red-tailed hawk":"Barred owl"); }
  }
  document.addEventListener("click",e=>{
    if(SC.identify===false||!on) return;
    if(e.target.closest&&e.target.closest("a,button,input,textarea,select,label,summary,[role=button],[contenteditable],h1,h2,h3,p,li,.note,.lockup,[data-no-scenery]")) return;
    const qx=(e.clientX-(1-camZ)*W/2-camX)/camZ, qy=(e.clientY-(1-camZ)*H/2-camY)/camZ; let best=null, bd=1e9; for(const [x,y,r,n] of tags){ const d=Math.hypot(qx-x,qy-y); if(d<r+26&&d<bd){ bd=d; best=[x,y,n]; } }
    if(!best) return; tagEl.textContent=best[2]; tagEl.style.left=e.clientX+"px"; tagEl.style.top=e.clientY+"px"; tagEl.style.opacity="1";
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
  function drawDog(dt,dark){
    if(!dog&&rompAt!=null){ rompAt-=dt; if(rompAt<=0){ rompAt=null; startRomp(); } return; }
    if(!dog){ nextDog-=dt; if(nextDog<=0){ if(groundBusy()) nextDog=15; else startDog(); } return; }
    stepDog(dog,dt); if(dog.gone){ dog=null; nextDog=rnd(220,400); return; }
    paintDog(dog,dt,dark);
  }
  function paintDog(d,dt,dark){
    if(d.hidden) return;
    const s=toScreen(d.Xw,d.Dw), k=.16*s.g/26, moving=d.state==="run"||d.state==="leave";
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
  /* ---- big birds aloft: a kettle of turkey vultures circling on a thermal, a red-tailed hawk wheeling, an owl gliding low across the field ---- */
  const SOAR={
    vult:{half:.24, s:[.05,.3,.55,.8,.95,1], lead:[.12,.13,.12,.09,.04,-.01], trail:[-.15,-.17,-.16,-.13,-.09,-.05], tail:[[-.18,.05],[-.36,.07],[-.38,0],[-.36,-.07],[-.18,-.05]], head:.26, band:.42},
    hawk:{half:.16, s:[.05,.3,.55,.8,.95,1], lead:[.14,.15,.13,.09,.03,-.03], trail:[-.16,-.2,-.19,-.15,-.09,-.05], tail:[[-.16,.07],[-.4,.15],[-.44,0],[-.4,-.15],[-.16,-.07]], head:.24, band:0},
    owl: {half:.18, s:[.05,.3,.55,.8,.95,1], lead:[.14,.15,.13,.09,.02,-.04], trail:[-.18,-.22,-.22,-.18,-.1,-.05], tail:[[-.16,.06],[-.3,.08],[-.32,0],[-.3,-.08],[-.16,-.06]], head:.2, band:0}};
  let soarers=[], nextVult=90, nextHawkV=45, nextOwlV=120;
  function soarBird(kind,o){ return Object.assign({kind,t:0,ph:rnd(0,6),bank:0,alpha:0,flap:0},o); }
  function startVultures(){
    const n=2+Math.floor(Math.random()*4), cz=rnd(14,26), cy=rnd(4.2,7), dir=Math.random()<.5?1:-1, v=vanish(), cx=(W*(dir>0?rnd(.1,.35):rnd(.65,.9))-v[0])*cz/FOC();
    const kettle={cx,cz,drift:dir*rnd(.12,.25),life:rnd(55,85)};
    for(let i=0;i<n;i++) soarers.push(soarBird("vult",{kettle,r:rnd(1.2,2.6),w:rnd(.18,.28)*(Math.random()<.5?1:-1),a0:rnd(0,6.28),Y:cy+rnd(-.6,.9),life:kettle.life}));
  }
  function startHawk(){ const cz=rnd(8,14), dir=Math.random()<.5?1:-1, v=vanish(), cx=(W*(dir>0?rnd(.2,.4):rnd(.6,.8))-v[0])*cz/FOC();
    soarers.push(soarBird("hawk",{kettle:{cx,cz,drift:dir*rnd(.1,.2)},r:rnd(1.1,1.8),w:rnd(.3,.4)*(Math.random()<.5?1:-1),a0:rnd(0,6.28),Y:rnd(3,4.6),life:rnd(30,45),called:false})); }
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
             : b.kind==="hawk"? {w:M([196,178,150]),band:M([70,48,32]),body:M([206,190,166]),head:M([110,76,52]),tail:M([170,92,52])}
             : {w:M([150,120,86]),band:M([96,72,50]),body:M([160,128,92]),head:M([150,120,88]),tail:M([130,102,72])};
    const dih=b.kind==="vult"? .32 : b.kind==="hawk"? .08 : .04, fl=b.flap;
    ctx.save(); ctx.globalAlpha=b.alpha*(1-glow*.25)*(1-haze*(b.kind==="vult"?.15:.3)); ctx.lineJoin="round";
    const wing=(sd,lead,trail,col)=>{ const pts=[]; S.s.forEach((s,i)=>{ const up=s*Math.sin(dih+fl*(.4+.6*s)); pts.push(P(lead[i],sd*s,up)); });
      for(let i=S.s.length-1;i>=0;i--){ const s=S.s[i], up=s*Math.sin(dih+fl*(.4+.6*s)); pts.push(P(trail[i],sd*s,up)); }
      ctx.beginPath(); ctx.moveTo(pts[0].x,pts[0].y); for(let i=1;i<pts.length;i++) ctx.lineTo(pts[i].x,pts[i].y); ctx.closePath(); ctx.fillStyle=col; ctx.fill(); ctx.strokeStyle=col; ctx.lineWidth=Math.max(1.1,c0.k*.006); ctx.stroke(); };
    const tl=S.tail.map(([f,sd])=>P(f,sd,0)); ctx.beginPath(); ctx.moveTo(tl[0].x,tl[0].y); tl.slice(1).forEach(q=>ctx.lineTo(q.x,q.y)); ctx.closePath(); ctx.fillStyle=pal.tail; ctx.fill();
    for(const sd of [-1,1]){ wing(sd,S.lead,S.trail,pal.w);
      if(S.band) wing(sd,S.lead.map((v,i)=>lerp(v,S.trail[i],S.band)),S.trail,pal.band);                 /* the vulture's silvery flight feathers */
      if(b.kind==="hawk") wing(sd,S.lead,S.lead.map((v,i)=>lerp(v,S.trail[i],.18)),pal.band);              /* the dark leading-edge bar of a red-tail */
    }
    const bA=P(S.head,0,0), bB=P(-.2,0,0); ctx.strokeStyle=pal.body; ctx.lineWidth=Math.max(1,c0.k*S.half*.22); ctx.lineCap="round"; ctx.beginPath(); ctx.moveTo(bA.x,bA.y); ctx.lineTo(bB.x,bB.y); ctx.stroke();
    ctx.fillStyle=pal.head; ctx.beginPath(); ctx.arc(bA.x,bA.y,Math.max(.8,c0.k*S.half*(b.kind==="owl"?.2:.1)),0,6.283); ctx.fill();
    ctx.restore(); return true;
  }
  function drawRaptors(dt,dark){
    nextVult-=dt; nextHawkV-=dt; nextOwlV-=dt;
    if(nextVult<=0){ nextVult=rnd(170,320); if(!soarers.some(b=>b.kind==="vult")) startVultures(); }
    if(nextHawkV<=0){ nextHawkV=rnd(120,260); if(!soarers.some(b=>b.kind==="hawk")) startHawk(); }
    if(nextOwlV<=0){ nextOwlV=rnd(160,340); if(!soarers.some(b=>b.kind==="owl")) startOwl(); }
    for(const b of soarers){
      b.t+=dt;
      if(b.kettle){ const K=b.kettle; if(b.kind==="vult"||b.kind==="hawk"){ K.cx+=K.drift*dt*(b===soarers.find(o=>o.kettle===K)?1:0); }
        const a=b.a0+b.w*b.t, X=K.cx+Math.cos(a)*b.r, Z=K.cz+Math.sin(a)*b.r*.8; b.hd=a+(b.w>0?Math.PI/2:-Math.PI/2); b.X=X; b.Z=Z;
        b.bank=(b.w>0?-1:1)*(b.kind==="vult"? .28+Math.sin(b.t*1.3+b.a0)*.16 : .35);              /* vultures rock and teeter as they circle */
        if(b.kind==="hawk"){ const burst=(b.t%9)<1.1; b.ph+=dt*(burst?9:0); b.flap=burst? Math.sin(b.ph)*.5 : 0;
          if(!b.called && b.t>3 && typeof natureSfx!=="undefined"){ b.called=true; natureSfx.hawk(); } }
        else b.flap=0;
        if(b.t>b.life){ K.cz+=dt*.8; b.Y+=dt*.15; } }
      else { b.X+=Math.cos(b.hd)*b.sp*dt; b.Z+=Math.sin(b.hd)*b.sp*dt; b.ph+=dt*2.3*Math.PI*2/2.3; b.flap=Math.sin(b.ph)*.55; b.Y+=Math.sin(b.t*.6)*.02*dt; b.bank=Math.sin(b.t*.5)*.08; }
      b.alpha= b.t>b.life? Math.max(0,b.alpha-dt*.25) : Math.min(1,b.alpha+dt*.5);
      const on=drawSoarer(b,dark); if((b.t>b.life&&b.alpha<=0) || (!b.kettle && !on && b.t>3)) b.done=true;
    }
    soarers=soarers.filter(b=>!b.done);
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
  function filmPass(){
    ctx.save(); ctx.setTransform(1,0,0,1,0,0); ctx.globalCompositeOperation="source-over";
    const k=W+"|"+H; if(vigK!==k){ vigK=k; vigC=document.createElement("canvas"); vigC.width=Math.max(1,Math.round(W/4)); vigC.height=Math.max(1,Math.round(H/4)); const vx=vigC.getContext("2d"), w=vigC.width, h=vigC.height;
      vx.translate(w/2,h/2); vx.scale(w/2,h/2); const g=vx.createRadialGradient(0,0,.55,0,0,1.42); g.addColorStop(0,"rgba(14,9,4,0)"); g.addColorStop(.5,"rgba(14,9,4,.1)"); g.addColorStop(1,"rgba(14,9,4,.38)"); vx.fillStyle=g; vx.fillRect(-1,-1,2,2); }
    ctx.globalAlpha=1; ctx.drawImage(vigC,0,0,W,H);                                                            /* the corners and edges darken a little */
    const T=grainT[Math.floor(Math.random()*4)], S=2.2, step=T.width*S, ox=-Math.random()*step, oy=-Math.random()*step;   /* coarse, soft clumps, a fresh pattern every frame */
    ctx.globalAlpha=.075; ctx.imageSmoothingEnabled=true;
    for(let y=oy;y<H;y+=step) for(let x=ox;x<W;x+=step) ctx.drawImage(T,x,y,step,step);
    if(Math.random()<.035) scratches.push({x:Math.random()*W, life:rnd(.08,.7), w:rnd(.5,1.4), a:rnd(.04,.1), lt:Math.random()<.6, y0:Math.random()<.5?0:rnd(0,H*.6), y1:Math.random()<.5?H:rnd(H*.4,H)});
    ctx.globalAlpha=1;
    for(let i=scratches.length-1;i>=0;i--){ const q=scratches[i]; q.life-=1/30; if(q.life<=0||q.y1-q.y0<20){ scratches.splice(i,1); continue; } q.x+=rnd(-1.2,1.2);     /* a thin scratch running down the film, wandering a little as it goes */
      const g=ctx.createLinearGradient(0,q.y0,0,q.y1), c=q.lt?"255,246,226":"20,12,6", a=q.a*(.6+.4*Math.random()); g.addColorStop(0,`rgba(${c},0)`); g.addColorStop(.15,`rgba(${c},${a.toFixed(3)})`); g.addColorStop(.85,`rgba(${c},${(a*.7).toFixed(3)})`); g.addColorStop(1,`rgba(${c},0)`);
      ctx.fillStyle=g; ctx.fillRect(q.x,q.y0,q.w,q.y1-q.y0); }
    ctx.restore(); }
  function frame(ts){
    raf=0; if(!running()) { ctx.clearRect(0,0,W,H); return; }
    if(last && ts-last<30){ raf=requestAnimationFrame(frame); return; }   /* ~30 frames a second is plenty for drifting things */
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
    if(img){ drawScene(dark); stepDusk(dt); drawDusk(dark); drawMist(dark); }
    for(const l of leaves) step3D(l,dt);
    leaves.sort((a,b)=>b.D-a.D);
    for(const l of leaves) if(l.D>=5) leaf(l, dark?.7:1);         /* far ones drift among the hills, behind the animals */
    for(const m of motes) if(m.L===0) drawMote(m);
    if(img){ ctx.globalAlpha=1; drawGeese(dt,dark); drawRaptors(dt,dark); ctx.globalAlpha=1;
      drawDeer(dt,dark,"front"); ctx.globalAlpha=1; drawPecker(dt,dark); ctx.globalAlpha=1; drawCardinals(dt,dark); ctx.globalAlpha=1;   /* the woodpecker on its tree sits behind the animals on the lawn too */                  /* the deer stay behind every other animal on the lawn */
      const L=[]; if(fox) L.push({y:toScreen(fox.Xw,fox.Dw).y,fn:()=>drawFox(dt,dark)}); else drawFox(dt,dark);
      if(skunk) L.push({y:toScreen(skunk.Xw,skunk.Dw).y,fn:()=>drawSkunk(dt,dark)}); else drawSkunk(dt,dark);
      if(cub) L.push({y:toScreen(cub.Xw,cub.Dw).y,fn:()=>drawCub(dt,dark)}); else drawCub(dt,dark);
      if(mom) L.push({y:toScreen(mom.Xw,mom.Dw).y,fn:()=>drawMom(dt,dark)});
      if(coyote) L.push({y:toScreen(coyote.Xw,coyote.Dw).y,fn:()=>drawCoyote(dt,dark)}); else drawCoyote(dt,dark);
      if(bobcat) L.push({y:toScreen(bobcat.Xw,bobcat.Dw).y,fn:()=>drawBobcat(dt,dark)}); else drawBobcat(dt,dark);
      if(pheasW) L.push({y:toScreen(pheasW.Xw,pheasW.Dw).y,fn:()=>drawPheasW(dt,dark)}); else drawPheasW(dt,dark);
      if(dog) L.push({y:toScreen(dog.Xw,dog.Dw).y,fn:()=>drawDog(dt,dark)}); else drawDog(dt,dark);
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
      L.sort((a,b)=>a.y-b.y); for(const it of L){ ctx.globalAlpha=1; it.fn(); } ctx.globalAlpha=1; drawGrouse(dt,dark); ctx.globalAlpha=1; drawPheasant(dt,dark); ctx.globalAlpha=1; drawMoths(dt,dark,"field"); drawFireflies(dt,dark); drawMonarchs(dt,dark); }
    for(const m of motes) if(m.L===1) drawMote(m);
    for(const l of leaves) if(l.D<5) leaf(l, dark?.7:1);           /* the near ones, in front of everything in the field */
    for(const m of motes) if(m.L===2) drawMote(m);
    if(img) drawBig(dt,dark);
    ctx.globalAlpha=1; if(img){ dogScare(dt); drawGreet(dt,dark); drawTrail(dt,dark); drawBats(dt,dark); drawMoths(dt,dark,"near"); drawFlock(dt,dark); drawHawkG(dt,dark,"near"); drawHum(dt,dark); collectTags(); } ctx.globalAlpha=1;
    ctx.setTransform(1,0,0,1,0,0); if(img) filmPass();
    raf=requestAnimationFrame(frame);
  }
  const running=()=>on && !reduce.matches && !document.hidden;
  function start(){ cv.hidden=!on||reduce.matches; if(running() && !raf){ last=0; raf=requestAnimationFrame(frame); } }
  size(); seed();
  window.addEventListener("resize",()=>{ size(); seed(); buns.forEach(b=>b.init=false); });
  document.addEventListener("visibilitychange",start);
  reduce.addEventListener?.("change",start);
  start();
  return { where(){ return [dog,lab].map(d=>d&&Object.assign(toScreen(d.Xw,d.Dw),{flee:!!d.flee,st:d.state})).concat([buck&&Object.assign(buckPose(),{on:buck.onLawn})]).concat(wcs.map(w=>Object.assign(toScreen(w.Xw,w.Dw),{st:w.state}))).concat(mons.map(m=>({x:m.sx,y:m.sy,st:"mon",z:m.z}))).concat(sqs.map(q=>Object.assign(toScreen(q.Xw,q.Dw),{st:"sq:"+q.kind+":"+q.state}))).concat([cub,mom].filter(Boolean).map(b=>Object.assign(toScreen(b.Xw,b.Dw),{st:"bear"}))).concat(hawkG?[{x:hawkG.x,y:hawkG.y,st:"hk:"+hawkG.state+":"+hawkG.st.toFixed(2)}]:[]).concat(hum&&hum.sx!=null?[{x:hum.sx,y:hum.sy,st:"hum"}]:[]).concat(pecker?[{x:pecker.x,y:pecker.y,st:"pk:"+pecker.state,z:pecker.m}]:[]); }, spawn(n){ lastArrive=-99; if(n==="cub"){ nextCub=0; dog=lab=null; rompAt=null; } else if(n==="coyote") nextCoyote=0; else if(n==="lab") nextLab=0; else if(n==="vult") nextVult=0; else if(n==="greet"&&dog){ dog.legs=0; dog.romp=0; dog.state="run"; dog.tX=dog.Xw; dog.tD=dog.Dw; dog.pointed=true; } else if(n==="buckLawn"){ buck2=null; startBuck(); buck.plan=[{k:"walk",...lawnPt()},{k:"look",dur:8}]; } else if(n==="flock"){ bbFlock=null; nextBB=0; } else if(n==="woodcock"){ wcs.length=0; nextWc=0; } else if(n==="monarch"){ nextMon=0; } else if(n==="doe"){ doe=null; nextDoe=0; } else if(n==="hum"){ hum=null; nextHum=0; } else if(n==="hen"){ hen=null; nextHen=0; } else if(n==="dusk"){ duskV=.62; } else if(n==="squirrels"){ nextSq=0; } else if(n==="bigleaf"){ bigL=null; nextBig=0; } else if(n==="hawkg"){ hawkG=null; nextHawkG=0; } else if(n==="pecker"){ pecker=null; nextPecker=0; } else if(n.startsWith("moth")){ hero=null; nextHero=0; forceDir=n.split(":")[1]==="in"?"in":n.split(":")[1]==="out"?"out":null; forceMoth=n.split(":")[1]||null; } else if(n==="buck2"){ buck2=null; nextBuck2=0; } else if(n==="sit"&&dog){ dogSit(dog,false); dog.st=7; dog.scr=[1.6,4.4]; if(lab){ dogSit(lab,false); lab.st=7; lab.scr=null; } } else if(n==="romp"){ dog=lab=null; rompAt=0; } else if(n==="mom"&&cub) cub.momAt=0; }, get on(){ return on; }, set(v){ on=!!v; try{ localStorage.setItem(SC.key+"-ambient",on?"on":"off"); }catch(e){} start(); natureSfx.refresh(); } };
})();
