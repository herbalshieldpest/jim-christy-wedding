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
  try{ on=localStorage.getItem(SC.key+"-nature")!=="off"; }catch(e){}
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
      if(!live){ live=true; clearTimeout(birdT); clearTimeout(gustT); clearTimeout(owlT); clearTimeout(hawkT); clearTimeout(coyT); birdT=setTimeout(birds,800); owlT=setTimeout(owl,R(12,40)*1000); hawkT=setTimeout(hawk,R(25,60)*1000); coyT=setTimeout(coyotes,R(45,100)*1000); loadCoyote(); gust(); } }
    else if(ctx){ if(want) return; master.gain.setTargetAtTime(0,ctx.currentTime,.3); live=false; clearTimeout(birdT); clearTimeout(gustT); clearTimeout(owlT); clearTimeout(hawkT); clearTimeout(coyT); }
  }
  /* browsers only allow sound after a tap or key press */
  /* a press on the page's own sound button is left to that button, so it can't start the sound and then have the same press turn it off */
  const skip=e=>!!(e&&e.target&&e.target.closest&&e.target.closest("[data-sound-toggle]"));
  function arm(){ if(armed) return; armed=true; const go=e=>{ if(skip(e)) return; ["pointerdown","keydown","touchstart"].forEach(ev=>document.removeEventListener(ev,go,true)); if(wanted()&&init()) apply(); else armed=false; };
    ["pointerdown","keydown","touchstart"].forEach(ev=>document.addEventListener(ev,go,true)); }
  document.addEventListener("visibilitychange",()=>{ if(ctx) apply(); });
  ["pointerdown","keydown","touchstart"].forEach(ev=>document.addEventListener(ev,e=>{ if(skip(e)) return; if(ctx&&wanted()&&ctx.state!=="running") ctx.resume().then(apply).catch(()=>{}); },true));
  setTimeout(()=>{ arm(); if(wanted()&&init()){ if(ctx.state==='running') apply(); else ctx.resume().then(()=>{ if(ctx.state==='running') apply(); }).catch(()=>{}); } },0);
  return { get on(){ return on; }, get playing(){ return !!(on&&live&&ctx&&ctx.state==="running"); }, set(v){ on=!!v; try{ localStorage.setItem(SC.key+"-nature",on?"on":"off"); }catch(e){} if(on){ if(init()) apply(); else arm(); } else apply(); }, refresh(){ if(ctx) apply(); else if(wanted()) arm(); }, flush, honk, hawk(){ if(ctx&&live){ clearTimeout(hawkT); hawk(); } }, yip(){ if(ctx&&live){ clearTimeout(coyT); coyotes(); } } };
})();
const ambient=(function(){
  const cv=document.createElement("canvas"); cv.id="ambient"; cv.setAttribute("aria-hidden","true"); document.body.prepend(cv);
  const ctx=cv.getContext("2d"); let W=0,H=0, leaves=[], motes=[], last=0, raf=0, t=0;
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
      ctx.strokeStyle="rgba(255,252,244,.9)"; ctx.lineWidth=.55;
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
    /* clouds: the whole sky drifts slowly, fading out above the hills so the sun and horizon stay put */
    if(skyTile){ const T=skyTile, span=T.w*2, off=(t*3.2)%span;
      ctx.save(); ctx.globalAlpha=1;
      const x0=T.x-off, y0=Math.round(T.y); ctx.drawImage(T.c,x0,y0); ctx.drawImage(T.c,x0+span-2,y0);   /* smooth sub-pixel drift; the two copies overlap a little so the seam never opens */
      ctx.restore(); }
    if(sunPatch) ctx.drawImage(sunPatch.c,sunPatch.x,sunPatch.y);
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
    const base=scr(FLARE[0],FLARE[1]), s0=sun();
    /* hand-held drift: the sun's apparent spot wanders a few pixels, and the whole chain pivots with it */
    const wx=Math.sin(t*.23)*9+Math.sin(t*.61+1)*4, wy=Math.cos(t*.19+.5)*6+Math.sin(t*.47)*3;
    const sx=s0.x+wx, sy=s0.y+wy, cx=base[0]-wx*1.8, cy=base[1]-wy*1.8, vx=cx-sx, vy=cy-sy;
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
    ctx.restore();
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
    const g=x.createLinearGradient(0,top,0,bot); g.addColorStop(0,"rgba(255,214,150,.2)"); g.addColorStop(.3,"rgba(255,214,150,0)"); g.addColorStop(.7,"rgba(20,12,4,0)"); g.addColorStop(1,"rgba(20,12,4,.32)");
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
    if(!buck){ nextBuck-=dt; if(nextBuck<=0){ if(herd.length) nextBuck=12; else startBuck(); } return; }
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
  function drawDeer(dt,dark,layer){
    if(layer==="front"){ stepBuck(dt); stepHerd(dt); }
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
    if(f.rt && now-f.rt<64 && f.rw===w){ const ax0=w*.5, ay0=h*.88; ctx.save(); ctx.globalAlpha=alpha; ctx.drawImage(f.cv,0,0,w,h,s.x-ax0/R,s.y-ay0/R,w/R,h/R); ctx.restore(); return; }
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
    x.globalCompositeOperation="source-over";
    ctx.save(); ctx.globalAlpha=alpha; ctx.drawImage(cv,0,0,w,h,s.x-ax/R,s.y-ay/R,w/R,h/R); ctx.restore();
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
    }
    parts.push({p:[B(-8.6,13.4,0,6.0),B(-3.4,14.8,0,6.8),B(2,14.6,0,6.6),B(6,13.6,0,5.4)],c:fur,sh});
    parts.push({p:[B(-11.6,14.4,0,1.4)],c:fur,bias:.1});
    if(f.adult) parts.push({p:[B(1.5,15.6,0,6.2),B(4.2,16.2,0,5.4)],c:fur,sh});   /* a grown bear's shoulder hump */
    const hd=f.head, hc0=B(lerp(13.2,13.4,Math.max(0,hd)),lerp(16.6,6.2,Math.max(0,hd))+Math.max(0,-hd)*2.6,0,0), hc=[hc0[0],hc0[1],hc0[2]];
    const nb=B(7.6,14.2,0,4.8); parts.push({p:[nb,[hc[0]-1,hc[1],hc[2],3.8]],c:fur,sh});
    const sn=f.state==="sniff"? Math.sin(f.sniff*11)*.2 : 0, hp=hd*.85+.08, hy=f.turn;
    const Hh=(u,v,w,r)=>{ const t2=headPt(hc,hp,hy,u,v,w); return [t2[0],t2[1],t2[2],r]; };
    parts.push({p:[Hh(-.4,.2,0,4.6),Hh(1.6,-.2,0,3.9)],c:fur,sh});
    const sl=f.adult?.9:0; parts.push({p:[Hh(3.2,-1.1,0,2.5),Hh(5.6+sl+sn,-1.7,0,1.6)],c:rgb(P.muzzle),bias:-.1});
    parts.push({p:[Hh(6.6+sl+sn,-1.5,0,.95)],c:rgb(mulv(P.fur,.5)),bias:-.3});
    for(const sd of [-1,1]){ parts.push({p:[Hh(-1.3,f.adult?3.9:4.3,(f.adult?2.8:3.0)*sd,f.adult?1.3:1.85)],c:far(sd)?furFar:fur,bias:.05}); parts.push({p:[Hh(2.2,1.1,2.4*sd,.48)],c:"rgba(8,6,6,.95)",bias:-.3}); }
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
    if(f.ct<=0||!f.pal){ f.ct=1.5; const G=groundPal(s,dark), lit=dark?.5:.68; f.pal={...G, fur:mixv(mulv([42,30,22],lit/.68),mulv(G.g,.3),.06), muzzle:mulv([168,128,88],lit)}; }
    if(!f.blades) f.blades=Array.from({length:10},()=>({ox:rnd(-20,20),h:rnd(3,6),lean:rnd(-.5,.5),c:Math.random()}));
    critterBlit(null,null,f,s,k,f.pal,()=>cubParts(f,f.pal,walking||f.turning),f.yaw,40,64,18,f.blades,f.alpha);
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
    if(f.ct<=0||!f.pal){ f.ct=1.5; const G=groundPal(s,dark), lit=dark?.5:.68; f.pal={...G, fur:mixv(mulv([34,25,19],lit/.68),mulv(G.g,.3),.06), muzzle:mulv([150,112,78],lit)}; }
    if(!f.blades) f.blades=Array.from({length:12},()=>({ox:rnd(-11,11),h:rnd(1.4,2.8),lean:rnd(-.5,.5),c:Math.random()}));
    critterBlit(null,null,f,s,k,f.pal,()=>cubParts(f,f.pal,walking||f.turning),f.yaw,40,64,18,f.blades,f.alpha);
  }
  /* only one of the ground hunters and wanderers is out at a time */
  /* a newcomer scares off whoever is already out: they bolt away from it, off the far side */
  let lastArrive=-99;
  const groundBusy=()=>t-lastArrive<25;
  function arrive(x,self){ lastArrive=t; const away=sx=>sx<x? -150 : W+150;
    for(const f of [fox,skunk,cub,mom,bobcat,pheasW,coyote]) if(f&&f!==self&&!f.gone){ const s=toScreen(f.Xw,f.Dw), p=toGround(away(s.x),gnd().vy+s.g); f.state="leave"; f.tX=p.Xw; f.tD=p.Dw; f.ang=null; f.spd=Math.max(f.spd||1,1.3); f.cad=Math.max(f.cad||1,1); f.head=0; }
    for(const dd of [lab]) if(dd&&dd!==self){ const s=toScreen(dd.Xw,dd.Dw), p=toGround(away(s.x),gnd().vy+s.g); dd.state="leave"; dd.tX=p.Xw; dd.tD=p.Dw; }
    if(dog&&dog!==self){ const s=toScreen(dog.Xw,dog.Dw), p=toGround(away(s.x),gnd().vy+s.g); dog.state="leave"; dog.tX=p.Xw; dog.tD=p.Dw; }
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
  function startRomp(){
    const b=foxBounds(), side=Math.random()<.5, x0=side? W+70 : -70, g=rnd(Math.max(b.gmin,lawnMinG(side?W*.9:W*.1))+40,b.gmax-30);
    const p=toGround(x0,gnd().vy+g), q=toGround(side? W+170 : -170,gnd().vy+g+rnd(-25,25)), len=rnd(26,34);
    dog={Xw:p.Xw,Dw:p.Dw,yaw:side?Math.PI:0,ph:0,state:"run",t:0,legs:4+Math.floor(Math.random()*3),dir:side?-1:1,alpha:1,head:0,turn:0,pointed:false,romp:len,it:false,lane:-1};
    lab={lab:true,Xw:q.Xw,Dw:q.Dw,yaw:side?Math.PI:0,ph:1.3,state:"run",t:0,legs:3+Math.floor(Math.random()*3),dir:side?-1:1,alpha:1,head:0,turn:0,pointed:true,romp:len,it:true,lane:1};
    dog.mate=lab; lab.mate=dog; rompTarget(dog,true); lastArrive=t; nextLab=rnd(220,400);
  }
  function rompTarget(d,first){
    const b=foxBounds(), cur=toScreen(d.Xw,d.Dw), sx=first? W*(d.dir>0?rnd(.3,.45):rnd(.55,.7)) : Math.max(W*.1,Math.min(W*.9,cur.x+(Math.random()<.5?-1:1)*W*rnd(.15,.32))), lo=Math.max(b.gmin,lawnMinG(sx))+12;
    const mid=(lo+b.gmax)/2, g=d.lane<0? rnd(lo,mid-14) : rnd(mid+14,b.gmax-6), p=toGround(sx,gnd().vy+g); d.tX=p.Xw; d.tD=p.Dw;
  }
  function stepRomp(d,dt){
    const m=d.mate&&!d.mate.gone&&d.mate.romp>0? d.mate : null; d.romp-=dt; d.swap=(d.swap||0)-dt;
    if(!m||d.romp<=0){ d.romp=0; d.it=false; dogTarget(d); return false; }
    if(d.it){ const a=toScreen(d.Xw,d.Dw), c=toScreen(m.Xw,m.Dw), b=foxBounds(), lo=Math.max(b.gmin,lawnMinG(c.x))+12, mid=(lo+b.gmax)/2;
      /* chasing: run alongside and a little behind, in its own lane, so the two never pile on top of each other */
      const gx=c.x+(a.x<c.x?-1:1)*.22*c.g, gg=d.lane<0? Math.max(lo,Math.min(mid-14,c.g-.32*c.g)) : Math.min(b.gmax-6,Math.max(mid+14,c.g+.32*c.g)), p=toGround(gx,gnd().vy+gg); d.tX=p.Xw; d.tD=p.Dw;
      if(d.swap<=0&&Math.abs(a.x-c.x)<.3*a.g){ d.it=false; m.it=true; d.swap=m.swap=2.2; rompTarget(d); } }   /* drew level: now it's the other one's turn to chase */
    return true;
  }
  function dogTarget(d,first){
    const b=foxBounds(), cur=toScreen(d.Xw,d.Dw), sx=first? W*(d.dir>0?rnd(.3,.5):rnd(.5,.7)) : Math.max(W*.08,Math.min(W*.92,cur.x+d.dir*W*rnd(.18,.36))), lo=Math.max(b.gmin,lawnMinG(sx))+10;
    const g= cur.g>(lo+b.gmax)/2? rnd(lo,lerp(lo,b.gmax,.45)) : rnd(lerp(lo,b.gmax,.55),b.gmax), p=toGround(sx,gnd().vy+g); d.tX=p.Xw; d.tD=p.Dw; d.dir*=-1;
  }
  function stepDog(d,dt){
    d.t+=dt;
    const romping=d.state==="run"&&d.romp>0&&stepRomp(d,dt);
    if(d.state==="run"||d.state==="leave"){
      const dX=d.tX-d.Xw, dD=d.tD-d.Dw, dist=Math.hypot(dX,dD*.25)||1e-6, sp=romping? (d.it?1.32:1.18) : (d.lab? (d.state==="leave"?1.1:.75) : (d.state==="leave"?.95:.62));
      const pr=d.lp? Math.hypot(d.Xw-d.lp[0],(d.Dw-d.lp[1])*.25) : 1; d.lp=[d.Xw,d.Dw]; d.stl= pr<sp*dt*.2? (d.stl||0)+dt : 0;
      if(d.stl>.8){ d.stl=0; if(d.state==="leave") d.fade=true; else { d.tX=d.Xw; d.tD=d.Dw; } }
      if(d.fade){ d.alpha-=dt*2.5; if(d.alpha<=0){ d.gone=true; return; } }
      if(dist<=sp*dt){ d.Xw=d.tX; d.Dw=d.tD; } else { d.Xw+=dX/dist*sp*dt; const sD=dD/dist*sp*dt*4; d.Dw+=Math.sign(sD)*Math.min(Math.abs(sD),Math.abs(dD)); }
      d.ph+=dt*(d.lab?4.6:4.2)*(romping?1.45:1); d.head+=((d.state==="run"&&!romping? (d.lab?.25:.45) : 0)-d.head)*Math.min(1,dt*6);               /* nose down, working the scent */
      if(d.state==="leave"){ const s=toScreen(d.Xw,d.Dw); if(s.x<-90||s.x>W+90||dist<.02){ d.alpha-=dt*3; if(d.alpha<=0) d.gone=true; } return; }
      if(romping){ if(dist<.02&&!d.it) rompTarget(d); return; }
      if(dist<.02){ d.legs--;
        if(!d.lab && !d.pointed && d.legs<=4 && Math.random()<.85){ d.state="point"; d.t=0; d.pt=rnd(2.2,3.4); d.pointed=true; d.idleYaw=d.yaw; }
        else if(d.legs<=0){ d.state="leave"; const s=toScreen(d.Xw,d.Dw), p=toGround(d.dir>0? W+140 : -140, gnd().vy+s.g); d.tX=p.Xw; d.tD=p.Dw; }
        else if(Math.random()<(d.lab?.5:.3)){ d.state="sniff"; d.t=0; d.st=d.lab?rnd(1.4,3):rnd(.8,1.6); }
        else dogTarget(d); }
      return;
    }
    if(d.state==="sniff"){ d.head+=(1-d.head)*Math.min(1,dt*8); if(d.t>d.st){ d.state="run"; dogTarget(d); } return; }
    if(d.state==="point"){ d.head+=(-.05-d.head)*Math.min(1,dt*10);                                          /* frozen: head level, tail up, a forepaw lifted */
      if(!d.flushed && d.t>d.pt*.7){ d.flushed=true; if(!grouse&&!pheas){ if(Math.random()<.6) flushPheasant(); else flushGrouse(); } }
      if(d.t>d.pt){ d.state="run"; dogTarget(d); } }
  }
  function dogParts(d,P,moving){
    const q=d.ph*Math.PI*.9, yaw=d.yaw, far=z=>z*Math.cos(yaw)>0, parts=[], point=d.state==="point";
    const wh=rgb(P.white), whF=rgb(mulv(P.white,.8)), or=rgb(P.orange), orF=rgb(mulv(P.orange,.8)), sh=[rgb(mulv(P.white,.7)),rgb(mixv(P.white,[255,215,160],.2))];
    const bounce=moving? Math.max(0,Math.sin(q))*1.6 : 0, pitchB=moving? Math.sin(q+.6)*.06 : 0;
    const T=(x,y)=>{ const c=Math.cos(pitchB), s=Math.sin(pitchB), dy=y-15; return [x*c-dy*s, 15+bounce+x*s+dy*c]; }, B=(x,y,z,r)=>{ const t2=T(x,y); return [t2[0],t2[1],z,r]; };
    for(const [lx,ly,z,ph,hind] of [[6.6,13.4,-2.3,0,0],[6.6,13.4,2.3,.4,0],[-8,14.2,-2.5,Math.PI,1],[-8,14.2,2.5,Math.PI+.4,1]]){
      const sw=moving?Math.sin(q+ph):0, lift=moving?Math.max(0,-Math.cos(q+ph)):0, top=T(lx,ly), up=point&&!hind&&z*Math.cos(yaw)<0;
      const segs=hind? [[5.8,.35+.75*sw,1.7],[5.6,-.6+.75*sw-lift*.5,1.15],[4.2,.08+.75*sw+lift*.5,.95]] : up? [[5.8,.5,1.5],[5.4,-1.6,1.05],[1.4,-2.2,.95]] : [[5.8,-.12+.8*sw,1.5],[6.2,.05+.8*sw-lift*1.5,1.05],[1.4,.3+.8*sw-lift*1.8,.95]];
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
    const hp=hd*1.0+.08, Hh=(u,v,w,r)=>{ const t2=headPt(hc,hp,0,u,v,w); return [t2[0],t2[1],t2[2],r]; };
    parts.push({p:[Hh(-.2,.1,0,d.lab?3.2:2.9),Hh(1.6,-.3,0,d.lab?2.8:2.5)],c:d.lab?wh:or,sh:null});
    parts.push({p:[Hh(3.4,-.9,0,d.lab?2.0:1.75),Hh(5.2,-1.2,0,d.lab?1.6:1.35)],c:wh,bias:-.05}); if(!d.lab) parts.push({p:[Hh(-.4,1.6,0,.7),Hh(2.6,.5,0,.55)],c:wh,bias:-.1});   /* muzzle; the Brittany's white blaze */
    parts.push({p:[Hh(5.9,-1.05,0,.65)],c:rgb(P.nose),bias:-.3});
    for(const sd of [-1,1]){ const flap=moving? Math.sin(q*2)*.6 : 0;
      parts.push({p:[Hh(-.3,1.3,2.4*sd,1.15),Hh(-.6+flap*.4,-1.4,2.9*sd,1.45),Hh(-.3+flap,-3.0,2.7*sd,1.0)],c:far(sd)?orF:or,bias:-.06});
      parts.push({p:[Hh(1.9,.55,1.9*sd,.42)],c:"rgba(30,16,8,.95)",bias:-.4}); }
    return parts;
  }
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
    const s=toScreen(d.Xw,d.Dw), k=.16*s.g/26, moving=d.state==="run"||d.state==="leave";
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
    const haze=Math.max(.15,Math.min(.82,(b.Z-3)/20)), sp=sun(), glow=Math.max(0,1-Math.hypot(c0.x-sp.x,c0.y-sp.y)/(W*.3));
    if(!b.skyC||(b.skyT=(b.skyT||0)-1)<=0){ b.skyT=20; const ip=toImg(c0.x,c0.y); b.skyC=(ip&&ip[1]>0&&ip[1]<1&&sampleAt(Math.max(0,Math.min(1,ip[0])),ip[1]))||[206,180,140]; }
    const M=c=>{ const hz=dark? mulv(b.skyC,.45) : b.skyC; return rgb(mixv(c.map(v=>v*(dark?.7:1)),hz,Math.min(.88,haze+glow*.2))); };
    const pal= b.kind==="vult"? {w:M([34,28,26]),band:M([120,116,112]),body:M([30,25,22]),head:M([140,60,52]),tail:M([36,30,27])}
             : b.kind==="hawk"? {w:M([196,178,150]),band:M([70,48,32]),body:M([206,190,166]),head:M([110,76,52]),tail:M([170,92,52])}
             : {w:M([150,120,86]),band:M([96,72,50]),body:M([160,128,92]),head:M([150,120,88]),tail:M([130,102,72])};
    const dih=b.kind==="vult"? .32 : b.kind==="hawk"? .08 : .04, fl=b.flap;
    ctx.save(); ctx.globalAlpha=b.alpha*(1-glow*.25)*(1-haze*.3); ctx.lineJoin="round";
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
  function frame(ts){
    raf=0; if(!running()) { ctx.clearRect(0,0,W,H); return; }
    if(last && ts-last<30){ raf=requestAnimationFrame(frame); return; }   /* ~30 frames a second is plenty for drifting things */
    const dt=Math.min(.07,(ts-(last||ts))/1000); last=ts; t+=dt;
    ctx.clearRect(0,0,W,H);
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
    if(img) drawScene(dark);
    for(const l of leaves) step3D(l,dt);
    leaves.sort((a,b)=>b.D-a.D);
    for(const l of leaves) if(l.D>=5) leaf(l, dark?.7:1);         /* far ones drift among the hills, behind the animals */
    for(const m of motes) if(m.L===0) drawMote(m);
    if(img){ ctx.globalAlpha=1; drawGeese(dt,dark); drawRaptors(dt,dark); ctx.globalAlpha=1;
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
      turkeyQueue(dt,dark,L);
      L.sort((a,b)=>a.y-b.y); for(const it of L){ ctx.globalAlpha=1; it.fn(); } ctx.globalAlpha=1; drawGrouse(dt,dark); ctx.globalAlpha=1; drawPheasant(dt,dark); ctx.globalAlpha=1; drawDeer(dt,dark,"front"); ctx.globalAlpha=1; }
    for(const m of motes) if(m.L===1) drawMote(m);
    for(const l of leaves) if(l.D<5) leaf(l, dark?.7:1);           /* the near ones, in front of everything in the field */
    for(const m of motes) if(m.L===2) drawMote(m);
    ctx.globalAlpha=1;
    raf=requestAnimationFrame(frame);
  }
  const running=()=>on && !reduce.matches && !document.hidden;
  function start(){ cv.hidden=!on||reduce.matches; if(running() && !raf){ last=0; raf=requestAnimationFrame(frame); } }
  size(); seed();
  window.addEventListener("resize",()=>{ size(); seed(); buns.forEach(b=>b.init=false); });
  document.addEventListener("visibilitychange",start);
  reduce.addEventListener?.("change",start);
  start();
  return { spawn(n){ lastArrive=-99; if(n==="cub") nextCub=0; else if(n==="coyote") nextCoyote=0; else if(n==="lab") nextLab=0; else if(n==="romp"){ dog=lab=null; rompAt=0; } else if(n==="mom"&&cub) cub.momAt=0; }, get on(){ return on; }, set(v){ on=!!v; try{ localStorage.setItem(SC.key+"-ambient",on?"on":"off"); }catch(e){} start(); natureSfx.refresh(); } };
})();
