/* ===== Campfire night =====
   The wedding page's night. When the day/night switch goes to night, Jim walks out from the cabin with an armful of split wood, kneels at
   the fire ring and gets a fire going with a match. Christy follows with the guitar and the s'mores, hands him the guitar, and the two of them
   sit in the Adirondack chairs behind the fire, Jim playing while Christy toasts marshmallows (and now and then passes him one).
   Real 3D (three.js, fetched the first time night is switched on), standing on the scenery's own ground plane, so everything sits on the lawn
   at the right size for its distance, sways with the hand-held camera and sorts in among the animals.
   Drawn in two passes: the moonlit pass goes into the scene's night layer like everything else out in the field; the firelight pass is added
   on top afterwards, so the fire lights the two of them, the chairs and the grass around it without the night dimming it.
   Needs scenery.js (window.SceneryPlug) loaded first. Page API: window.Campfire = { set(on), toggle(), on } */
(function(){
"use strict";
const SP=window.SceneryPlug; if(!SP) return;
const URL3="https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
const HC=3.2;                                   /* the photo's camera height over the lawn, in metres: the brush at the lawn's edge comes out about 1.5 m tall */
const clamp=(v,a,b)=>v<a?a:v>b?b:v, lerp=(a,b,k)=>a+(b-a)*k, ease=k=>{ k=clamp(k,0,1); return k*k*(3-2*k); }, rnd=(a,b)=>a+Math.random()*(b-a);
const damp=(rate,dt)=>1-Math.exp(-rate*dt);
let T=null, built=false, loading=null, failed=false;

/* ---------------------------------------------------------------- state ---------------------------------------------------------------- */
const S={ on:false, alpha:0, run:false, clock:0, fire:0, fireGoal:0, flick:1, flickV:0, burn:0, music:false, mclock:0, eighth:-1, bar:0, matchLit:0, matchPos:null };
let renderer, cvs, scene, cam, camp, moon, hemi, fireL, fillL, groundA, groundB, coal, logMat, coalMat;
let jim, chr, chairJ, chairC, guitar, stick, mallow, smore, bag, match, logs=[], blobs=[];
let scripts=[], parts=[], sparks=[], smoke=[];
let F_SCREEN={x:0,y:0}, anchorKey="", rect={x:0,y:0,w:1,h:1};

function load(){ if(T||loading||failed) return loading; loading=import(URL3).then(m=>{ T=m; build(); built=true; }).catch(e=>{ failed=true; console.warn("campfire: three.js didn't load",e); }); return loading; }

/* ---------------------------------------------------------------- helpers ---------------------------------------------------------------- */
let _eu,V3,_a,_b,_c,_d,_e,_f,_g,_p,_q1,_q2,_m1,DOWN,UP;
function initTemps(){ V3=T.Vector3; _a=new V3();_b=new V3();_c=new V3();_d=new V3();_e=new V3();_f=new V3();_g=new V3();_p=new V3(); _q1=new T.Quaternion(); _q2=new T.Quaternion(); _m1=new T.Matrix4(); _eu=new T.Euler(); DOWN=new V3(0,-1,0); UP=new V3(0,1,0); }
const mat=(c,r,o)=>new T.MeshStandardMaterial(Object.assign({color:c,roughness:r==null?.85:r,metalness:0},o||{}));
function G(parent,x,y,z){ const g=new T.Group(); g.position.set(x||0,y||0,z||0); if(parent) parent.add(g); return g; }
function M(parent,geo,m,x,y,z,sx,sy,sz,rx,ry,rz){ const o=new T.Mesh(geo,m); o.position.set(x||0,y||0,z||0); o.scale.set(sx||1,sy||sx||1,sz||sx||1); o.rotation.set(rx||0,ry||0,rz||0); o.castShadow=true; o.receiveShadow=true; parent.add(o); return o; }
function lathe(prof,seg){ const P=[new T.Vector2(0,prof[0][0])]; for(const [y,r] of prof) P.push(new T.Vector2(r,y)); P.push(new T.Vector2(0,prof[prof.length-1][0])); return new T.LatheGeometry(P,seg||18); }
function limbGeo(len,r0,r1,seg){ const P=[], n=5;   /* a rounded, tapering limb hanging down from its joint */
  for(let i=0;i<=n;i++){ const a=-Math.PI/2+i/n*Math.PI/2; P.push(new T.Vector2(Math.max(1e-4,Math.cos(a)*r1),-len+Math.sin(a)*r1)); }
  for(let i=0;i<=n;i++){ const a=i/n*Math.PI/2; P.push(new T.Vector2(Math.max(1e-4,Math.cos(a)*r0),Math.sin(a)*r0)); }
  return new T.LatheGeometry(P,seg||12); }
const sph=(n,m)=>new T.SphereGeometry(1,n||16,m||12);
function radialTex(stops,size){ const c=document.createElement("canvas"); c.width=c.height=size||128; const x=c.getContext("2d"), r=c.width/2, g=x.createRadialGradient(r,r,0,r,r,r); for(const [p,col] of stops) g.addColorStop(p,col); x.fillStyle=g; x.fillRect(0,0,c.width,c.width); const t=new T.CanvasTexture(c); t.colorSpace=T.SRGBColorSpace; return t; }
/* camp-local point -> world, and world -> screen (the scenery's ground plane: x = vx + f*X/D, y = vy + f*(HC-Y)/D) */
const cw=(x,y,z,out)=>(out||new V3()).set(x,y,z).applyMatrix4(camp.matrixWorld);
function toScr(w){ const h=SP.horizon(), f=SP.GF()/HC, D=Math.max(.3,-w.z); return {x:h.vx+f*w.x/D, y:h.vy+f*(HC-w.y)/D, k:f/D}; }
function yawQ(yaw,q){ return (q||new T.Quaternion()).setFromAxisAngle(UP,yaw); }

/* ---------------------------------------------------------------- the two of them ----------------------------------------------------------------
   A jointed body: hips > spine > chest > neck > head, chest > shoulders > upper arms > forearms > hands, hips > thighs > shins > ankles.
   The legs and arms are placed by two-bone IK on targets (feet planted on the ground, hands on the guitar, the logs, the stick), so the feet never
   skate and hands land where they belong. Forward is +Z; the left side is +X. */
const L_=0, R_=1;
class Person{
  constructor(kind){ this.kind=kind; this.isPerson=true; const J=kind==="jim"; this.sc=J?1:.93;
    const C=J? {skin:"#cf987b",top:"#8893a4",top2:"#76818f",pants:"#33405a",boot:"#5a3c26",sole:"#241a12",belt:"#3a291b"}
             : {skin:"#e6b199",top:"#5d7a50",top2:"#4f6a44",pants:"#3e4d6c",boot:"#7a5135",sole:"#2c2016",belt:"#3e2c1e"};
    const sk=mat(C.skin,.62), top=mat(C.top,.9), top2=mat(C.top2,.92), pants=mat(C.pants,.88), boot=mat(C.boot,.7), sole=mat(C.sole,.9);
    this.mats={sk,top,pants};
    const root=this.root=G(camp); root.scale.setScalar(this.sc);
    const hips=this.hips=G(root,0,1.02,0);
    M(hips,lathe(J?[[-.11,.12],[-.06,.155],[.02,.158],[.09,.148]]:[[-.11,.13],[-.05,.172],[.02,.168],[.09,.14]]),pants,0,0,0,1,1,J?.72:.74);
    M(hips,new T.CylinderGeometry(J?.152:.143,J?.152:.143,.035,20),mat(C.belt,.6),0,.07,0,1,1,J?.72:.72);
    if(J) M(hips,new T.BoxGeometry(.05,.035,.01),mat("#9a8a6a",.35,{metalness:.7}),0,.07,.108);
    const spine=this.spine=G(hips,0,.09,0);
    M(spine,lathe(J?[[-.02,.148],[.08,.152],[.17,.158]]:[[-.03,.15],[.06,.13],[.17,.145]]),top,0,0,0,1,1,.68);
    if(!J) M(spine,new T.CylinderGeometry(.158,.168,.06,22),top2,0,-.01,0,1,1,.74);              /* the sweater's ribbed hem */
    const chest=this.chest=G(spine,0,.17,0);
    M(chest,lathe(J?[[0,.157],[.07,.172],[.14,.18],[.19,.165],[.22,.12],[.24,.06]]:[[0,.146],[.06,.16],[.12,.162],[.18,.15],[.21,.11],[.23,.055]]),top,0,0,0,1,1,J?.64:.66);
    for(const s of [1,-1]) M(chest,sph(),top,s*(J?.175:.158),.155,0,J?.068:.06,J?.062:.056,J?.07:.062);   /* shoulders */
    if(J){ M(chest,new T.CylinderGeometry(.07,.085,.05,16),top2,0,.215,0,1,1,.95);   /* collar */
      for(const s of [1,-1]) M(chest,new T.BoxGeometry(.085,.075,.012),top2,s*.075,.115,.106,1,1,1,-.12,0,0);   /* the two western pockets */
      for(let i=0;i<4;i++) M(chest,sph(6,4),mat("#e9e4da",.3),0,.03+i*.05,.112,.007);   /* pearl snaps */
      M(chest,new T.BoxGeometry(.03,.012,.006),mat("#3a5a48",.2,{metalness:.5}),.075,.165,.114);   /* sunglasses in the pocket */
    } else { M(chest,sph(24,16),top,0,.1,.074,.118,.058,.05);   /* a soft swell of bust under the sweater */
      M(chest,new T.TorusGeometry(.055,.012,6,16),top2,0,.215,0,1,1,1,Math.PI/2,0,0); M(chest,sph(6,4),mat("#d9b45a",.25,{metalness:.8}),0,.16,.105,.008); }
    const neck=this.neck=G(chest,0,.21,0); M(neck,new T.CylinderGeometry(J?.052:.044,J?.058:.048,.11,12),sk,0,.03,0);
    const head=this.head=G(neck,0,.075,0); this.buildHead(head,J,sk);
    /* arms */
    this.up=[]; this.fo=[]; this.hand=[];
    for(const side of [L_,R_]){ const s=side===L_?1:-1;
      const up=G(chest,s*(J?.19:.17),.155,0), fo=G(up,0,-(J?.3:.28),0), hd=G(fo,0,-(J?.265:.25),0);
      M(up,limbGeo(J?.3:.28,J?.058:.05,J?.048:.04),top);
      M(fo,limbGeo(J?.265:.25,J?.047:.04,J?.036:.031),top);
      M(fo,new T.CylinderGeometry(J?.04:.035,J?.04:.035,.035,12),top2,0,-(J?.24:.225),0);   /* cuff */
      M(hd,sph(),sk,0,-.05,.004,J?.038:.032,J?.058:.052,J?.024:.021);
      M(hd,limbGeo(.04,.012,.011,8),sk,s*-.022,-.02,.018,1,1,1,0,0,s*.6);   /* thumb */
      this.up[side]=up; this.fo[side]=fo; this.hand[side]=hd; }
    /* legs */
    this.th=[]; this.sh=[]; this.ank=[];
    for(const side of [L_,R_]){ const s=side===L_?1:-1;
      const th=G(hips,s*(J?.092:.09),-.05,0), sh=G(th,0,-.455,0), an=G(sh,0,-.45,0);
      M(th,limbGeo(.455,J?.088:.084,J?.062:.056),pants);
      M(sh,limbGeo(.45,J?.06:.054,J?.046:.04),pants);
      M(an,limbGeo(.05,J?.048:.042,J?.048:.042),boot,0,.02,0);
      M(an,sph(),boot,0,-.035,.05,J?.052:.044,.045,J?.13:.118);
      M(an,new T.BoxGeometry(J?.1:.088,.02,J?.27:.245),sole,0,-.072,.05);
      this.th[side]=th; this.sh[side]=sh; this.ank[side]=an; }
    if(!J){ /* a fuller figure: hips, thighs, waist, bust and arms a touch rounder */
      const fill=(g,k,kz)=>g.children.forEach(m=>{ if(m.isMesh){ m.scale.x*=k; m.scale.z*=kz||k; } });
      fill(hips,1.13,1.14); fill(spine,1.12,1.16); fill(chest,1.08,1.14); for(const i of [L_,R_]){ fill(this.th[i],1.14); fill(this.sh[i],1.06); fill(this.up[i],1.12); fill(this.fo[i],1.06); }
      this.th.forEach(t=>t.position.x*=1.08); }
    this.ankleH=.082*this.sc;
    /* where it all is */
    this.pos=new V3(); this.yaw=0; this.yawGoal=0; this.yawV={v:0}; this.mode="stand"; this.hipLocal=new V3(0,1.02,0); this.hipGoal=new V3(0,1.02,0); this.hipVel=new V3(); this.hipRate=6;
    this.bend={f:0,s:0,tw:0}; this.bendGoal={f:0,s:0,tw:0}; this.bendV={}; this.bendRate=5;
    this.feet=[{cur:new V3(),pitch:0,yaw:0,step:null,swing:null},{cur:new V3(),pitch:0,yaw:0,step:null,swing:null}]; this.footLocal=[new V3(.11,0,.02),new V3(-.11,0,.02)];
    this.hands=[{fn:null,cur:new V3(),vel:new V3(),rate:12,init:false},{fn:null,cur:new V3(),vel:new V3(),rate:12,init:false}];
    this.look=null; this.lookCur={y:0,p:0}; this.lookV={}; this.walk=null; this.breath=Math.random()*6; this.drift=Math.random()*20; this.nod=0; this.nodS=0; this.tap=0; this.feetInit=false;
    this.weight=0; this.weightGoal=0; this.idleT=rnd(1,3); this.walkMix=0; this.hairS={x:0,z:0,vx:0,vz:0};
    root.visible=false; }
  buildHead(h,J,sk){
    M(h,sph(20,16),sk,0,.1,.008,J?.093:.086,J?.115:.106,J?.104:.096);
    M(h,sph(),sk,0,.035,.045,J?.068:.056,.05,.058);                                  /* jaw */
    M(h,new T.ConeGeometry(.017,.045,8),sk,0,.098,.105,1,1,1,Math.PI/2,0,0);          /* nose */
    for(const s of [1,-1]){ M(h,sph(),sk,s*(J?.093:.086),.1,0,.012,.028,.02);
      M(h,sph(8,6),mat("#1d1712",.4),s*.033,.122,J?.092:.086,.011);
      M(h,new T.BoxGeometry(.03,.006,.01),mat(J?"#7d6e60":"#8a4a2a",.8),s*.034,.141,J?.094:.088,1,1,1,0,0,s*-.12); }   /* brows */
    if(J){ const bd=mat("#bdb7ad",1), bd2=mat("#a8a196",1);
      /* a short grey-white beard that follows the jaw: under the chin and along the jawline up to the ears, the lips and cheeks left clear */
      M(h,sph(18,12),bd,0,.018,.05,.07,.042,.06);                                      /* the chin and under the jaw */
      for(const s of [1,-1]){ M(h,sph(12,10),bd2,s*.062,.045,.035,.026,.05,.045,0,0,s*.25);   /* along each side of the jaw */
        M(h,sph(10,8),bd2,s*.083,.085,.012,.012,.034,.024); }                              /* sideburns */
      M(h,sph(12,8),bd,0,.074,.1,.03,.009,.013);                                        /* moustache */
      M(h,sph(10,8),mat("#9b5a4c",.55),0,.06,.098,.017,.005,.008);                       /* lips */
      const capF=mat("#6f6355",.85), capB=mat("#3b3833",.95), cap=G(h,0,.13,-.004); cap.rotation.x=-.1;
      M(cap,new T.SphereGeometry(.108,24,12,Math.PI*.5,Math.PI,0,Math.PI/2),capF,0,0,0,1,.95,1.06);   /* front panels */
      M(cap,new T.SphereGeometry(.107,24,12,-Math.PI*.5,Math.PI,0,Math.PI/2),capB,0,0,0,1,.95,1.06);   /* the mesh back */
      M(cap,new T.CylinderGeometry(.112,.112,.012,26,1,false,-Math.PI*.42,Math.PI*.84),mat("#5f5244",.85),0,.003,.075,1,1,1.05,.16,0,0);   /* the bill */
      M(cap,new T.CylinderGeometry(.03,.03,.004,18),mat("#d6ccb4",.7),0,.06,.09,1,1,1,1.15,0,0);   /* the round patch */
      M(cap,sph(6,4),capF,0,.103,0,.012); }
    else { const hr=mat("#b5562d",.5), hr2=mat("#9c4524",.55);
      M(h,sph(20,14),mat("#e8b8a0",.4),0,.06,.098,.022,.009,.008); M(h,sph(),mat("#b6514c",.5),0,.058,.099,.024,.006,.01);   /* smile */
      /* her hair: long, copper and softly wavy, parted on one side. The crown sits on her head; below the ears it is one flowing shape that frames her face,
         rests over her shoulders (some of it lying in front) and falls to the middle of her back, with fine strands drawn through it and a darker layer beneath */
      const strandTex=(()=>{ const c=document.createElement("canvas"); c.width=256; c.height=512; const x=c.getContext("2d"); x.fillStyle="#b4552c"; x.fillRect(0,0,256,512);
        for(let i=0;i<420;i++){ const px=Math.random()*256, w=.5+Math.random()*1.6, li=Math.random(); x.strokeStyle= li<.45? `rgba(92,32,14,${(.25+Math.random()*.4).toFixed(2)})` : li<.85? `rgba(214,112,62,${(.2+Math.random()*.35).toFixed(2)})` : `rgba(246,170,110,${(.25+Math.random()*.3).toFixed(2)})`;
          x.lineWidth=w; x.beginPath(); x.moveTo(px,0); for(let y=0;y<=512;y+=16) x.lineTo(px+Math.sin(y*.03+i)*5+Math.sin(y*.011+i*.7)*7,y); x.stroke(); }
        const t=new T.CanvasTexture(c); t.colorSpace=T.SRGBColorSpace; t.wrapS=t.wrapT=T.RepeatWrapping; t.anisotropy=4; return t; })();
      const hairM=new T.MeshStandardMaterial({color:0xffffff,map:strandTex,roughness:.5,metalness:0,side:T.DoubleSide}), hairIn=new T.MeshStandardMaterial({color:0x8a5a48,map:strandTex,roughness:.7,metalness:0,side:T.BackSide});
      hairM.map.repeat.set(3,1);
      M(h,new T.SphereGeometry(.107,32,18,0,Math.PI*2,0,1.15),hairM,0,.1,-.004,1.03,1.1,1.08);                         /* the crown */
      M(h,sph(16,10),hairM,.04,.205,.03,.065,.024,.055,0,0,-.22);                                                       /* the lift at her side part */
      const hp=this.hairPivot=G(h,0,.16,-.02);
      const hb=this.hairBack=G(this.chest,0,.388,-.004);   /* the long hair hangs from her shoulders, not her head, so tipping her head never swings it into her back */
      { const NU=56, NV=40, pos=[], uv=[], idx=[], S0=Math.random()*6, AX=.108, AY=.115, AZ=.113;
        const sstep=(a,b,x)=>{ const k=clamp((x-a)/(b-a),0,1); return k*k*(3-2*k); };
        for(let j=0;j<=NV;j++){ const v=j/NV;
          for(let i=0;i<=NU;i++){ const u=i/NU, yEnd0=-.55, VU=.26;
            let th, y, r;
            if(v<=VU){ /* over the back and sides of her head: starting up under the crown and following the shape of her head down to its widest point */
              const ph=lerp(.9,Math.PI/2,ease(v/VU)); th=(u-.5)*2*2.15; const a=1/Math.sqrt((Math.sin(th)/AX)**2+(Math.cos(th)/AZ)**2);
              y=AY*Math.cos(ph); r=a*Math.sin(ph)*lerp(.98,1.03,sstep(.9,1.5,ph)); }
            else { /* and from there straight down: close beside her face, gathering behind her shoulders, down her back */
              const w=(v-VU)/(1-VU), yy=lerp(0,yEnd0,w); th=(u-.5)*2*lerp(2.15,1.1,sstep(-.1,-.25,yy));
              const side=Math.abs(Math.sin(th)), a=1/Math.sqrt((Math.sin(th)/AX)**2+(Math.cos(th)/AZ)**2)*1.03;
              y=yy*(1-.08*side)+(.03*Math.sin(th*5+S0)+.018*Math.sin(th*11))*sstep(.8,1,w);   /* a little shorter at the sides; an uneven, wavy hem */
              const rBack=.124+(.172-.124)*sstep(-.04,-.2,y)+.02*sstep(-.3,-.5,y), rSide=.124+.008*sstep(-.02,-.12,y)+.1*sstep(-.15,-.27,y);
              r=lerp(a,lerp(rBack,rSide,side),sstep(0,-.14,y));
              r+=(.007*(.5+.5*Math.sin(th*5+w*9+S0))+.003*(.5+.5*Math.sin(th*9-w*5)))*sstep(.15,.6,w)+.01*sstep(.85,1,w); }   /* soft, long waves that only ever lift it away from her */
            pos.push(Math.sin(th)*r, y, -Math.cos(th)*r); uv.push(u,1-v); } }
        for(let j=0;j<NV;j++) for(let i=0;i<NU;i++){ const a2=j*(NU+1)+i, b2=a2+NU+1; idx.push(a2,b2,a2+1,b2,b2+1,a2+1); }
        const g=new T.BufferGeometry(); g.setAttribute("position",new T.Float32BufferAttribute(pos,3)); g.setAttribute("uv",new T.Float32BufferAttribute(uv,2)); g.setIndex(idx); g.computeVertexNormals();
        const fall=new T.Mesh(g,hairM); fall.castShadow=true; fall.receiveShadow=true; hb.add(fall); this.hairSkin=[g];
        const under=new T.Mesh(g,hairIn); under.scale.set(.965,1,.965); hb.add(under);
        /* a soft lock either side, from beside her face forward over the shoulder, lying on her sweater */
        for(const sd of [1,-1]){ const P=[[.1,-.04,.0],[.112,-.13,.035],[.135,-.22,.08],[.13,-.3,.116],[.118,-.37,.128]].map(([x,y,z])=>new V3(sd*x,y,z)), c=new T.CatmullRomCurve3(P), N=24, M2=6, ps=[], us=[], ix=[];
          for(let k=0;k<=N;k++){ const t=k/N, p=c.getPoint(t), tg=c.getTangent(t), o=new V3(p.x*.4,0,1).normalize(); o.addScaledVector(tg,-o.dot(tg)).normalize(); const sv=new V3().crossVectors(tg,o).normalize(), wv=lerp(.018,.026,ease(Math.min(1,t*1.6)))*(t>.85? (1-t)/.15*.7+.3 : 1);
            for(let m=0;m<=M2;m++){ const a3=m/M2*Math.PI*2, q=p.clone().addScaledVector(sv,Math.cos(a3)*wv).addScaledVector(o,Math.sin(a3)*.009); ps.push(q.x,q.y,q.z); us.push(m/M2*.3,1-t); } }
          for(let k=0;k<N;k++) for(let m=0;m<M2;m++){ const a4=k*(M2+1)+m, b4=a4+M2+1; ix.push(a4,b4,a4+1,b4,b4+1,a4+1); }
          const g2=new T.BufferGeometry(); g2.setAttribute("position",new T.Float32BufferAttribute(ps,3)); g2.setAttribute("uv",new T.Float32BufferAttribute(us,2)); g2.setIndex(ix); g2.computeVertexNormals(); const lk=new T.Mesh(g2,hairM); lk.castShadow=true; hb.add(lk); this.hairSkin.push(g2); }
        for(const gg of this.hairSkin){ const P=gg.attributes.position; gg.userData.p0=Float32Array.from(P.array); const W=new Float32Array(P.count); for(let k=0;k<P.count;k++){ const y=P.getY(k), q=clamp((-.02-y)/.14,0,1); W[k]=1-q*q*(3-2*q); } gg.userData.w=W; } } }
  }
  /* body-local point -> world */
  local(x,y,z,out){ return (out||new V3()).set(x,y,z).applyMatrix4(this.root.matrixWorld); }
  fwd(out){ return (out||new V3()).set(Math.sin(this.worldYaw()),0,Math.cos(this.worldYaw())); }
  worldYaw(){ return this.yaw+camp.rotation.y; }
  place(x,z,yaw){ this.pos.set(x,0,z); if(yaw!=null){ this.yaw=yaw; this.yawGoal=yaw; } }
  setHand(side,fn,rate,pole){ const h=this.hands[side]; h.fn=fn; h.rate=rate==null?12:rate; h.pole=pole||null; }
  /* ---- the body: root, hips, spine, legs, head. Everything eases with critically damped springs: it gathers speed, carries through and settles, never snapping or sliding to a stop ---- */
  updateBody(dt){
    const R=this.root; this.breath+=dt; this._dt=dt;
    if(this.walk) this.stepWalk(dt);
    this.yaw=sdS(this.yaw,this.yaw+wrap(this.yawGoal-this.yaw),this.yawV,"v",this.turnST||(this.walk? .22 : .35),dt);
    R.position.copy(this.pos); R.rotation.set(0,this.yaw,0); R.updateMatrixWorld(true);
    sdV(this.hipLocal,this.hipVel,this.hipGoal,1.5/this.hipRate,dt);
    const st=1.4/this.bendRate; for(const k of ["f","s","tw"]) this.bend[k]=sdS(this.bend[k],this.bendGoal[k],this.bendV,k,st,dt);
    /* the walk: pelvis rides high over each planted foot and dips between steps, shifts over the foot it's standing on, drops a little on the side that's swinging, and turns with the swinging leg while the shoulders turn against it */
    let bob=0, twist=0, sway=0, roll=0, lean=0; const w=this.walk;
    if(w){ const ph=w.phi, spd=clamp(w.vNow/1.2,0,1); bob=.012*Math.cos(4*Math.PI*(ph-.3))*spd; const sw=Math.sin(2*Math.PI*(ph-.05)), J=this.kind==="jim"; sway=(J? .026 : .032)*sw*(.4+.6*spd); roll=(J? .05 : .075)*sw*spd;   /* she carries her weight through her hips more than he does */ twist=(J? .17 : .2)*Math.sin(2*Math.PI*(ph-.05))*spd; lean=.075*spd+.08*clamp(w.acc,-.5,1)+.02*Math.cos(4*Math.PI*(ph-.1))*spd; }   /* the pelvis turns with each stride; a small surge forward with every push */
    /* standing: the weight drifts from one foot to the other every few seconds, and onto the planted foot while the other steps */
    this.idleT-=dt; if(this.idleT<=0){ this.idleT=rnd(3,7); this.weightGoal=(Math.random()<.5?-1:1)*rnd(.3,1); }
    let wgt=this.mode==="stand"&&!w? this.weightGoal : 0; const stp=this.feet.findIndex(f=>f.step); if(stp>=0&&this.mode!=="sit") wgt=stp===L_? -1.2 : 1.2;
    this.weight=sdS(this.weight,wgt,this,"weightV",.45,dt);
    this.walkMix=sdS(this.walkMix,w?1:0,this,"walkMixV",.25,dt);
    const br=Math.sin(this.breath*1.55)*.005;
    const hl=this.hipLocal, B=this.bend;
    this.hips.position.set(hl.x+sway+this.weight*.022,hl.y+bob-Math.abs(this.weight)*.006,hl.z);
    this.hips.rotation.set(B.f*.25,twist,B.s*.3+roll+this.weight*.035);
    const lk=this.lookCur.y*.22;                                  /* the shoulders follow the eyes a little */
    this.spine.rotation.set(B.f*.35+br+lean*.4,-twist*.7+B.tw*.4+lk*.4,B.s*.35-roll*.65-this.weight*.025);
    this.chest.rotation.set(B.f*.4-br*.6+lean*.6,-twist*.75+B.tw*.6+lk*.6,B.s*.35-roll*.55-this.weight*.02);   /* the shoulders turn against the hips, and the head stays steady on top */
    if(w){ this.neck.userData.counter=twist*.35; } else this.neck.userData.counter=0;
    R.updateMatrixWorld(true);
    this.updateLegs(dt); this.updateHead(dt); this.updateHair(dt); }
  /* ---- walking a path: the stride lengthens with speed and shortens as they slow, so feet land where the body will be, not on a fixed grid ---- */
  stepWalk(dt){ const w=this.walk; if(!w.moving) return;
    const rem=w.len-w.s, target=w.v*clamp(Math.min(.3+w.s/.8*.7,.16+rem/1.1*.84),.16,1);
    const vPrev=w.vNow; w.vNow=sdS(w.vNow,target,w,"vV",.25,dt); w.acc=(w.vNow-vPrev)/Math.max(dt,1e-3);
    w.s=Math.min(w.len,w.s+w.vNow*dt); if(w.s>=w.len-1e-3){ w.moving=false; return; }
    const sl=this.stepLen(w.vNow)*(1+.05*Math.sin(w.s*1.7+this.breath*.3)); w.phi=(w.phi+dt*w.vNow/(2*sl))%1;
    const p=w.curve.getPointAt(w.s/w.len), tg=w.curve.getTangentAt(Math.min(.999,w.s/w.len));
    this.pos.set(p.x,0,p.z); this.yawGoal=this.yaw+wrap(Math.atan2(tg.x,tg.z)-this.yaw); }
  stepLen(v){ return clamp(.22+.33*v/1.2,.2,.58)*this.sc*(this.kind==="jim"? 1 : .94); }
  pathAt(s,side,out){ const w=this.walk, u=clamp(s,0,w.len)/w.len, pp=w.curve.getPointAt(u,_e), tg=w.curve.getTangentAt(Math.min(.999,u),_f), o=(side===L_?1:-1)*(this.kind==="jim"? .095 : .07)*this.sc;
    out.set(pp.x+tg.z*o,0,pp.z-tg.x*o); return Math.atan2(tg.x,tg.z); }
  *walkTo(pts,v){ const P=[new V3(this.pos.x,0,this.pos.z),...pts.map(p=>new V3(p[0],0,p[1]))]; const curve=new T.CatmullRomCurve3(P,false,"centripetal",.5);
    this.walk={curve,len:curve.getLength(),s:0,v:v||1.15,moving:true,phi:0,vNow:.05,vV:0,acc:0}; this.mode="walk"; this.hipGoal.set(0,.99,0);
    if(!this.feetInit){ this.root.position.copy(this.pos); this.root.rotation.set(0,this.yaw,0); this.root.updateMatrix(); for(const i of [L_,R_]){ const fl=this.footLocal[i]; this.feet[i].cur.set(fl.x,0,fl.z).applyMatrix4(this.root.matrix); this.feet[i].yaw=this.yaw; } this.feetInit=true; }
    for(const i of [L_,R_]){ const f=this.feet[i]; f.step=null; f.swing=null; }
    while(this.walk.moving) yield;
    for(const i of [L_,R_]){ const f=this.feet[i]; if(f.swing){ f.swing=null; } }
    this.walk=null; this.mode="stand"; this.hipGoal.set(0,1.02,0); }
  updateLegs(dt){
    const w=this.walk;
    if(w){ const sl=this.stepLen(w.vNow);
      for(const i of [L_,R_]){ const f=this.feet[i], fp=(w.phi+(i===L_?0:.5))%1;
        if(fp>=.6){ /* swinging through: up off the toe, forward in an arc, reaching out heel first */
          if(!f.swing){ f.swing={from:f.cur.clone(),to:new V3(),yaw0:f.yaw}; }
          const ahead=(1.0-fp+.3)*2*sl;   /* where the body will be at this foot's next mid-stance */
          const yaw=this.pathAt(w.s+ahead,i,f.swing.to); const k=(fp-.6)/.4, e=k*k*(3-2*k);
          f.cur.lerpVectors(f.swing.from,f.swing.to,e); const d=f.swing.from.distanceTo(f.swing.to); f.cur.y=Math.sin(Math.PI*Math.pow(k,.75))*Math.min(.1,.035+d*.14);
          f.yaw=f.swing.yaw0+wrap(yaw-f.swing.yaw0)*e; f.pitch=lerp(.68,-.26,ease(Math.min(1,k*1.2))); }
        else { /* planted: heel strike rolling flat, then the heel lifting off for the push */
          if(f.swing){ f.cur.copy(f.swing.to); f.cur.y=0; f.swing=null; }
          f.cur.y=0; f.pitch= fp<.12? lerp(-.26,0,ease(fp/.12)) : fp>.38? ease((fp-.38)/.22)*.68 : 0; } } }
    else { /* standing, kneeling or sitting: the feet stay planted, and step (one at a time) only when the body has moved off them */
      const sit=this.mode==="sit"||this.mode==="kneel", thr=sit? .03 : .07;
      const want=[0,1].map(i=>{ const fl=this.footLocal[i]; return {p:new V3(fl.x,fl.y,fl.z).applyMatrix4(this.root.matrix),yaw:this.yaw+(fl.yaw||0),pitch:fl.pitch||0}; });
      if(!this.feetInit) for(const i of [L_,R_]){ const f=this.feet[i]; f.cur.copy(want[i].p); f.yaw=want[i].yaw; f.pitch=want[i].pitch; }
      const busy=this.feet.some(f=>f.step);
      if(!busy){ let best=-1, be=thr; for(const i of [L_,R_]){ const f=this.feet[i], e=f.cur.distanceTo(want[i].p)+Math.abs(wrap(want[i].yaw-f.yaw))*.12+Math.abs(want[i].pitch-f.pitch)*.08+(f.cur.y>.01?1:0); if(e>be){ be=e; best=i; } }
        if(best>=0){ const f=this.feet[best]; f.step={from:f.cur.clone(),yaw0:f.yaw,p0:f.pitch,t:0,dur:clamp((sit?.45:.3)+be*.35,.28,.6),lift:Math.min(.08,.02+be*.25)}; } }
      for(const i of [L_,R_]){ const f=this.feet[i], s=f.step; if(!s) continue; s.t+=dt; const k=Math.min(1,s.t/s.dur), e=k*k*(3-2*k);
        f.cur.lerpVectors(s.from,want[i].p,e); f.cur.y=lerp(s.from.y,want[i].p.y,e)+Math.sin(Math.PI*k)*s.lift; f.yaw=s.yaw0+wrap(want[i].yaw-s.yaw0)*e; f.pitch=lerp(s.p0,want[i].pitch,e)-Math.sin(Math.PI*k)*.15;
        if(k>=1) f.step=null; } }
    this.feetInit=true;
    /* the hips settle as low as the planted feet need, so neither leg is ever stretched straight: the natural dip between steps */
    { let need=0; const tg=[];
      for(const i of [L_,R_]){ const ft=this.feet[i]; const rise= ft.pitch>0? Math.sin(ft.pitch)*.13*this.sc : Math.sin(-ft.pitch)*.035*this.sc; tg[i]=cw(ft.cur.x,ft.cur.y+this.ankleH+rise,ft.cur.z,new V3()); }
      if(!this.legLen){ this.th[0].updateMatrixWorld(true); const a=this.th[0].getWorldPosition(new V3()), b=this.sh[0].getWorldPosition(new V3()), c=this.ank[0].getWorldPosition(new V3()); this.legLen=a.distanceTo(b)+b.distanceTo(c); }
      const reach=this.legLen*(this.walk&&this.walk.moving? .972 : .985);   /* a soft knee as the weight comes on, never locked straight */
      for(const i of [L_,R_]){ const f0=this.feet[i]; if(f0.swing||f0.step||f0.cur.y>.012) continue;   /* only the planted feet hold the hips down; a swinging leg just bends */
        const hp=this.th[i].getWorldPosition(_c), dx=Math.hypot(hp.x-tg[i].x,hp.z-tg[i].z), maxY=tg[i].y+Math.sqrt(Math.max(0,reach*reach-dx*dx)); if(hp.y>maxY) need=Math.max(need,hp.y-maxY); }
      this.dropS=Math.max(need,sdS(this.dropS||0,need,this,"dropV",.12,this._dt||.033));
      if(this.dropS>1e-4){ this.hips.position.y-=this.dropS/this.sc; this.root.updateMatrixWorld(true); } }
    for(const i of [L_,R_]){ const ft=this.feet[i]; let pitch=ft.pitch; if(i===R_&&this.tap) pitch-=this.tap;
      /* lifting the heel raises the ankle; lifting the toe hinges on the heel */
      const rise= pitch>0? Math.sin(pitch)*.13*this.sc : Math.sin(-pitch)*.035*this.sc;
      const tgt=cw(ft.cur.x,ft.cur.y+this.ankleH+rise,ft.cur.z,_b);
      const hip=this.th[i].getWorldPosition(_c), fw=_d.set(Math.sin(ft.yaw+camp.rotation.y),0,Math.cos(ft.yaw+camp.rotation.y)); const pole=_g.copy(hip).addScaledVector(fw,1).add(_p.set(0,this.mode==="kneel"&&i===L_?-.6:.1,0));
      ik(this.th[i],this.sh[i],this.ank[i],tgt,pole);
      const an=this.ank[i]; an.parent.getWorldQuaternion(_q1).invert(); _q2.setFromEuler(_eu.set(pitch,ft.yaw+camp.rotation.y,0,"YXZ")); an.quaternion.copy(_q1.multiply(_q2)); an.updateMatrixWorld(true); } }
  /* the head turns to what they're looking at, easing in and settling, with the small restless drift a living head has */
  updateHead(dt){ let y=0,p=0;
    if(this.look){ const t0=typeof this.look==="function"? this.look() : this.look; if(t0){ const tw=this._lk||(this._lk=new V3()); tw.copy(t0); this.chest.updateMatrixWorld(true); const hp=this.neck.getWorldPosition(_a); _b.subVectors(tw,hp);
        _q1.copy(this.chest.getWorldQuaternion(_q2)).invert(); _b.applyQuaternion(_q1); y=clamp(Math.atan2(_b.x,_b.z),-1.1,1.1); p=clamp(-Math.atan2(_b.y,Math.hypot(_b.x,_b.z)),-.6,.7); } }
    this.drift+=dt; y+=Math.sin(this.drift*.37)*.05+Math.sin(this.drift*1.13)*.02; p+=Math.sin(this.drift*.29+1)*.03;
    this.lookCur.y=sdS(this.lookCur.y,y,this.lookV,"y",.3,dt); this.lookCur.p=sdS(this.lookCur.p,p,this.lookV,"p",.3,dt); this.nodS=sdS(this.nodS,this.nod,this,"nodV",.09,dt);
    this.neck.rotation.set(this.lookCur.p*.4+this.nodS*.5,this.lookCur.y*.4+(this.neck.userData.counter||0),0,"YXZ"); this.head.rotation.set(this.lookCur.p*.6+this.nodS,this.lookCur.y*.6,0,"YXZ"); this.neck.updateMatrixWorld(true); }
  /* her hair lags behind the head and swings back, from walking and from turning */
  updateHair(dt){ const hp=this.hairPivot; if(!hp||dt<=0) return; this.head.updateMatrixWorld(true); const p=this.head.getWorldPosition(_a);
    if(!this._hp){ this._hp=p.clone(); this._hv=new V3(); }
    const v=_b.subVectors(p,this._hp).divideScalar(dt); this._hp.copy(p); const a=_c.subVectors(v,this._hv).divideScalar(dt); this._hv.copy(v);
    this.head.getWorldQuaternion(_q1).invert(); a.applyQuaternion(_q1);
    const yv=(this.lookCur.y-(this._ly??this.lookCur.y))/dt; this._ly=this.lookCur.y;
    const tx=clamp(a.z*.045,-.35,.35), tz=clamp(-a.x*.045+yv*.06,-.35,.35);
    /* a lightly under-damped swing: the hair overshoots a touch and settles */
    this.hairS.vx+=((tx-this.hairS.x)*55-this.hairS.vx*9)*dt; this.hairS.vz+=((tz-this.hairS.z)*55-this.hairS.vz*9)*dt; this.hairS.x+=this.hairS.vx*dt; this.hairS.z+=this.hairS.vz*dt;
    this.head.getWorldQuaternion(_q1); const f=_a.set(0,0,1).applyQuaternion(_q1), yaw=Math.atan2(f.x,f.z); _q2.setFromAxisAngle(UP,yaw);   /* the head turned, but held level */
    const plumb=_q1.invert().multiply(_q2); hp.quaternion.identity().slerp(plumb,.8);   /* the hair hangs from the crown as if the head were upright: it falls straight down when she looks down */
    hp.quaternion.multiply(_q2.setFromEuler(_eu.set(clamp(this.hairS.x,-.18,.18),0,clamp(this.hairS.z,-.18,.18))));
    /* the back of her hair rests on her back: it keeps to the line of her shoulders whichever way she turns or tips her head, swaying a little */
    const hb=this.hairBack; if(hb) hb.quaternion.setFromEuler(_eu.set(clamp(this.hairS.x*.35,-.06,.06),0,clamp(this.hairS.z*.4,-.07,.07)));
    /* the hair over her head moves with her head, its length with her shoulders, blended smoothly between, so it reads as one */
    if(hb&&this.hairSkin){ hb.updateMatrixWorld(true); this.head.updateMatrixWorld(true);
      const A=this._hA||(this._hA=new T.Matrix4()); A.copy(hb.matrixWorld).invert().multiply(this.head.matrixWorld).multiply(_m1.makeTranslation(0,.1,0));
      const e=A.elements;
      for(const g of this.hairSkin){ const P=g.attributes.position, a=P.array, p0=g.userData.p0, W=g.userData.w;
        for(let k=0,n=P.count;k<n;k++){ const w=W[k], i3=k*3, x=p0[i3], y=p0[i3+1], z=p0[i3+2]; if(w<=0){ a[i3]=x; a[i3+1]=y; a[i3+2]=z; continue; }
          const hx=e[0]*x+e[4]*y+e[8]*z+e[12], hy=e[1]*x+e[5]*y+e[9]*z+e[13], hz=e[2]*x+e[6]*y+e[10]*z+e[14];
          a[i3]=x+(hx-x)*w; a[i3+1]=y+(hy-y)*w; a[i3+2]=z+(hz-z)*w; }
        P.needsUpdate=true; g.computeVertexNormals(); } } }
  /* ---- the arms: hands go to their targets (world points) along a gentle arc, or hang and swing ---- */
  restHand(side,out){ const s=side===L_?1:-1, hand=this.hands[side]; if(hand) hand.swingSoft=this.walk&&this.walk.moving;
    if(this.walk&&this.walk.moving){ const w=this.walk, spd=clamp(w.vNow/1.2,0,1), sr=Math.sin(2*Math.PI*(w.phi-.33)+(side===L_?0:Math.PI)), sw=sr>0? sr : sr*.7;   /* each arm swings with the opposite leg */
      const am=this.kind==="jim"? .17 : .13; return this.local(s*(.2-.02*Math.max(0,sw)*spd),.89+.045*Math.max(0,sw)*spd,.04+sw*am*spd,out); }   /* relaxed arms: a little bend at the elbow, more as each swings forward */
    if(this.mode==="sit") return this.local(s*.33,.62,.12,out);
    if(this.mode==="kneel") return this.local(s*.2,.42,.28,out);
    return this.local(s*(.2+(this.weight*s>0?.008:0)),.895+Math.sin(this.breath*1.55)*.004,.05,out); }
  updateArms(dt){ for(const side of [L_,R_]){ const h=this.hands[side]; let tg=h.fn? h.fn(_c) : null; const swing=!tg; if(!tg) tg=this.restHand(side,_c);
      /* eased in the body's own frame, so a hand carried along while walking keeps up with the body instead of trailing behind it */
      const R=this.root; if(!h.curL){ h.curL=new V3(); h.velL=new V3(); h.lastRoot=new V3(); }
      const rootJump=h.lastRoot.distanceTo(R.position)>.2; h.lastRoot.copy(R.position);
      if(!h.init||rootJump){ if(!h.init) h.cur.copy(tg); h.curL.copy(R.worldToLocal(h.cur.clone())); h.velL.set(0,0,0); h.init=true; }
      const tL=R.worldToLocal(tg.clone());
      if(h.rate<=0){ h.curL.copy(tL); h.velL.set(0,0,0); }
      else { const d=h.curL.distanceTo(tL); if(!swing) tL.y+=Math.min(.09,d*.28)/this.sc;   /* reaches travel in an arc, not a straight line */
        sdV(h.curL,h.velL,tL,swing? (h.swingSoft? .16 : .11) : 2.1/h.rate,dt); }
      h.cur.copy(R.localToWorld(h.curL.clone()));
      const s=side===L_?1:-1, shp=this.up[side].getWorldPosition(_a), fw=this.fwd(_d), rt=_e.set(fw.z,0,-fw.x);   /* rt: the body's left */
      const pole=h.pole? h.pole(_g) : _g.copy(shp).addScaledVector(fw,-.5).addScaledVector(rt,s*.35).add(_p.set(0,-.4,0));
      ik(this.up[side],this.fo[side],this.hand[side],h.cur,pole); } }
}
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
/* critically damped smoothing (stable at any frame time): the value accelerates toward its goal and settles without overshoot */
function sdS(cur,tgt,velObj,key,st,dt){ if(st<=1e-4||dt<=0){ velObj[key]=0; return dt<=0? cur : tgt; } const w=2/st, x=w*dt, e=1/(1+x+.48*x*x+.235*x*x*x), ch=cur-tgt, tmp=((velObj[key]||0)+w*ch)*dt; velObj[key]=((velObj[key]||0)-w*tmp)*e; return tgt+(ch+tmp)*e; }
function sdV(p,vel,tgt,st,dt){ for(const k of ["x","y","z"]) p[k]=sdS(p[k],tgt[k],vel,k,st,dt); return p; }
/* two-bone IK: aim the upper bone and the lower bone (each hanging down its own -Y) so the end reaches the target, the middle joint bending toward the pole */
function aimBone(b,dir){ b.parent.getWorldQuaternion(_q1).invert(); const d=_f.copy(dir).normalize().applyQuaternion(_q1); b.quaternion.setFromUnitVectors(DOWN,d); b.updateMatrixWorld(true); }
const _ia=[], _ib=[];
function ik(up,lo,end,tgt,pole){ const S=new V3(), E0=new V3(), H0=new V3(), n=new V3(), pp=new V3(), E=new V3(), Hn=new V3(), dir=new V3();
  up.updateMatrixWorld(true); up.getWorldPosition(S); lo.getWorldPosition(E0); end.getWorldPosition(H0);
  const a=S.distanceTo(E0), b=E0.distanceTo(H0); n.subVectors(tgt,S); let dist=n.length(); if(dist<1e-5) return; n.divideScalar(dist);
  dist=clamp(dist,Math.abs(a-b)+1e-3,a+b-1e-4); const x=(a*a-b*b+dist*dist)/(2*dist), h=Math.sqrt(Math.max(0,a*a-x*x));
  pp.subVectors(pole,S); pp.addScaledVector(n,-pp.dot(n)); if(pp.lengthSq()<1e-8) pp.set(0,0,1); pp.normalize();
  E.copy(S).addScaledVector(n,x).addScaledVector(pp,h); aimBone(up,dir.subVectors(E,S));
  Hn.copy(S).addScaledVector(n,dist); lo.getWorldPosition(E0); aimBone(lo,dir.subVectors(Hn,E0)); }

/* ---------------------------------------------------------------- props ---------------------------------------------------------------- */
let grainTex=null;
function woodGrain(){ if(grainTex) return grainTex; const c=document.createElement("canvas"); c.width=64; c.height=256; const x=c.getContext("2d"); x.fillStyle="#fff"; x.fillRect(0,0,64,256);
  for(let i=0;i<46;i++){ const px=Math.random()*64, w=.6+Math.random()*1.8; x.strokeStyle=`rgba(${70+Math.random()*30|0},${50+Math.random()*20|0},${35+Math.random()*15|0},${(.08+Math.random()*.2).toFixed(2)})`; x.lineWidth=w; x.beginPath(); x.moveTo(px,0);
    for(let y=0;y<=256;y+=16) x.lineTo(px+Math.sin(y*.03+i)*2.5+Math.sin(y*.11+i*3)*.8,y); x.stroke(); }
  for(let i=0;i<3;i++){ const kx=Math.random()*64, ky=Math.random()*256; const g=x.createRadialGradient(kx,ky,0,kx,ky,4); g.addColorStop(0,"rgba(60,40,25,.5)"); g.addColorStop(1,"rgba(60,40,25,0)"); x.fillStyle=g; x.fillRect(kx-5,ky-5,10,10); }   /* a knot or two */
  grainTex=new T.CanvasTexture(c); grainTex.colorSpace=T.SRGBColorSpace; grainTex.wrapS=grainTex.wrapT=T.RepeatWrapping; return grainTex; }
function grassTex(){ const c=document.createElement("canvas"); c.width=c.height=256; const x=c.getContext("2d"); x.fillStyle="#8a8a8a"; x.fillRect(0,0,256,256);
  for(let i=0;i<2600;i++){ const px=Math.random()*256, py=Math.random()*256, L=3+Math.random()*9, a=-Math.PI/2+(Math.random()-.5)*1.1, v=Math.random();
    x.strokeStyle= v<.45? `rgba(20,20,20,${(.25+Math.random()*.35).toFixed(2)})` : `rgba(255,255,255,${(.18+Math.random()*.32).toFixed(2)})`; x.lineWidth=.6+Math.random()*1.1; x.beginPath(); x.moveTo(px,py); x.lineTo(px+Math.cos(a)*L,py+Math.sin(a)*L); x.stroke(); }
  const t=new T.CanvasTexture(c); t.colorSpace=T.SRGBColorSpace; t.wrapS=t.wrapT=T.RepeatWrapping; t.repeat.set(26,26); t.anisotropy=4; return t; }
function makeChair(){ const g=G(camp), tones=["#98765a","#8f6e52","#a07e5f","#8a6a4e","#937154"], w2=mat("#7a5c40",.96,{map:woodGrain()});
  const bd=(m,sx,sy,sz,x,y,z,rx,ry,rz)=>{ const mm=m===w2? w2 : mat(tones[Math.floor(Math.random()*tones.length)],rnd(.88,.97),{map:woodGrain()}); return M(g,new T.BoxGeometry(sx,sy,sz),mm,x+rnd(-.002,.002),y,z+rnd(-.002,.002),1,1,1,(rx||0)+rnd(-.008,.008),(ry||0)+rnd(-.01,.01),(rz||0)+rnd(-.008,.008)); }, w=null;   /* each board its own shade, and not quite square: hand-built and weathered */
  for(const s of [1,-1]){ const L=Math.hypot(.76,.36), a=Math.atan2(.36,.76);
    bd(w2,.035,.085,L,s*.29,.2,-.1,a,0,0);                        /* the stringers, from the front of the seat down to the ground behind */
    bd(w,.035,.56,.085,s*.325,.28,.27);                            /* front legs */
    bd(w,.15,.024,.8,s*.37,.575,-.03,.03,0,0);                     /* the wide flat arms */
    bd(w2,.03,.5,.06,s*.3,.28,-.42,-.1,0,0); }                    /* back legs */
  for(let i=0;i<7;i++){ const z=.27-i*.075; bd(w,.6,.022,.066,0,.37-(.27-z)*.16,z,.16,0,0); }   /* seat slats */
  [.68,.78,.86,.78,.68].forEach((h,i)=>{ const x=(i-2)*.115, a=.36; bd(w,.095,h,.022,x+Math.sin(-x*.4)*h*.0,.3+h/2*Math.cos(a),-.25-h/2*Math.sin(a),-a,0,-x*.32); });   /* the fanned back slats */
  bd(w2,.62,.06,.025,0,.6,-.38,-.36,0,0); bd(w2,.5,.05,.022,0,.36,-.27,-.36,0,0);
  g.traverse(o=>{ if(o.isMesh){ o.castShadow=true; o.receiveShadow=true; } }); return g; }
function makeGuitar(){ const g=new T.Group(); g.matrixAutoUpdate=false;
  const sh=new T.Shape(); sh.moveTo(0,-.29); sh.bezierCurveTo(.12,-.29,.19,-.21,.19,-.1); sh.bezierCurveTo(.19,-.02,.12,-.005,.12,.04); sh.bezierCurveTo(.12,.08,.15,.1,.15,.15);
  sh.bezierCurveTo(.15,.23,.08,.27,0,.27); sh.bezierCurveTo(-.08,.27,-.15,.23,-.15,.15); sh.bezierCurveTo(-.15,.1,-.12,.08,-.12,.04); sh.bezierCurveTo(-.12,-.005,-.19,-.02,-.19,-.1); sh.bezierCurveTo(-.19,-.21,-.12,-.29,0,-.29);
  const geo=new T.ExtrudeGeometry(sh,{depth:.095,bevelEnabled:true,bevelThickness:.005,bevelSize:.005,bevelSegments:2,curveSegments:18}); geo.translate(0,0,-.0475);
  const c=document.createElement("canvas"); c.width=c.height=512; const x=c.getContext("2d"); const U=(px,py)=>[(px*2.5+.5)*512,(1-(py*1.7+.5))*512];
  let gr=x.createRadialGradient(...U(0,-.06),20,...U(0,-.06),300); gr.addColorStop(0,"#e9b66e"); gr.addColorStop(.55,"#c98a3e"); gr.addColorStop(.85,"#6e3a17"); gr.addColorStop(1,"#3a1c0c"); x.fillStyle=gr; x.fillRect(0,0,512,512);   /* a sunburst top */
  let [hx,hy]=U(0,.1); x.fillStyle="#120c08"; x.beginPath(); x.arc(hx,hy,.045*2.5*512,0,6.283); x.fill(); x.strokeStyle="#e8d6b0"; x.lineWidth=3; x.beginPath(); x.arc(hx,hy,.054*2.5*512,0,6.283); x.stroke(); x.lineWidth=1.5; x.beginPath(); x.arc(hx,hy,.06*2.5*512,0,6.283); x.stroke();
  let [bx,by]=U(0,-.13); x.fillStyle="#24140c"; x.fillRect(bx-.08*2.5*512,by-.012*1.7*512,.16*2.5*512,.024*1.7*512);   /* bridge */
  x.fillStyle="rgba(25,12,6,.85)"; x.beginPath(); x.ellipse(...U(.07,.03),.045*2.5*512,.06*1.7*512,.4,0,6.283); x.fill();   /* pickguard */
  const tx=new T.CanvasTexture(c); tx.colorSpace=T.SRGBColorSpace; tx.repeat.set(2.5,1.7); tx.offset.set(.5,.5);
  M(g,geo,[mat("#ffffff",.42,{map:tx}),mat("#5a2f16",.45)],0,0,0);
  M(g,new T.BoxGeometry(.05,.46,.022),mat("#5a3519",.5),0,.5,.025); M(g,new T.BoxGeometry(.048,.45,.007),mat("#22150e",.6),0,.505,.038);
  for(let i=0;i<12;i++) M(g,new T.BoxGeometry(.048,.002,.003),mat("#c9c3b5",.3,{metalness:.8}),0,.29+.44*(1-Math.pow(.94,i))*1.6,.042);
  const hs=M(g,new T.BoxGeometry(.072,.17,.018),mat("#2a170c",.5),0,.81,.02,1,1,1,-.22,0,0);
  for(let i=0;i<6;i++) M(g,new T.CylinderGeometry(.006,.006,.03,6),mat("#d0cabc",.3,{metalness:.8}),(i<3?-1:1)*.048,.76+(i%3)*.045,.012,1,1,1,0,0,Math.PI/2);
  for(let i=0;i<6;i++){ const xb=-.03+i*.012, xn=-.021+i*.0084, s=new T.CylinderGeometry(.0011+.0004*(5-i),.0011+.0004*(5-i),.86,4); const m=M(g,s,mat("#d8d2c4",.25,{metalness:.9}),(xb+xn)/2,.3,.05,1,1,1,0,0,Math.atan2(xb-xn,.86)); m.castShadow=false; }
  scene.add(g); return g; }
function makeStick(){ const g=new T.Group(); g.matrixAutoUpdate=false; M(g,new T.CylinderGeometry(.009,.013,1.0,6),mat("#c9b089",.8),0,0,-.5,1,1,1,Math.PI/2,0,0);
  mallow=M(g,new T.CylinderGeometry(.022,.022,.034,14),mat("#f5f1e8",.55),0,0,-.97,1,1,1,Math.PI/2,0,0); mallow.visible=false; mallow.userData.toast=0; scene.add(g); return g; }
function makeSmore(){ const g=new T.Group(); g.matrixAutoUpdate=false; const gc=mat("#c8935a",.8);
  M(g,new T.BoxGeometry(.06,.008,.06),gc,0,-.018,0); M(g,new T.BoxGeometry(.06,.008,.06),gc,0,.018,0); M(g,new T.CylinderGeometry(.026,.03,.026,14),mat("#e6d2b0",.5),0,0,0); M(g,new T.BoxGeometry(.045,.005,.04),mat("#3d2416",.5),0,.011,0);
  g.visible=false; scene.add(g); return g; }
function makeBag(){ const g=new T.Group(); g.matrixAutoUpdate=false; scene.add(g); const c=mat("#b9a685",.95);
  M(g,new T.BoxGeometry(.24,.2,.13),c,0,.1,0); M(g,new T.TorusGeometry(.07,.008,6,14,Math.PI),mat("#6a5038",.8),0,.2,0);
  M(g,new T.BoxGeometry(.12,.02,.07),mat("#c8935a",.8),0,.21,.0,1,1,1,.3,0,0); M(g,new T.CylinderGeometry(.008,.008,.6,5),mat("#a98a62",.85),-.06,.25,0,1,1,1,0,0,-.5); g.visible=false; return g; }
function makeMatch(){ const g=new T.Group(); g.matrixAutoUpdate=false; M(g,new T.BoxGeometry(.004,.05,.004),mat("#d7c39a",.8),0,.025,0); M(g,sph(6,4),mat("#8a2a1a",.6),0,.052,0,.006,.008,.006); g.visible=false; scene.add(g); return g; }
function makeLog(len,r){ const g=new T.Group(); g.matrixAutoUpdate=false; const geo=new T.CylinderGeometry(r,r*1.06,len,7,1); const pos=geo.attributes.position; for(let i=0;i<pos.count;i++){ const y=pos.getY(i); if(Math.abs(y)<len/2-1e-4) continue; pos.setX(i,pos.getX(i)*rnd(.9,1.08)); pos.setZ(i,pos.getZ(i)*rnd(.9,1.08)); } geo.computeVertexNormals();
  M(g,geo,[logMat,mat("#b38c5e",.9),mat("#b38c5e",.9)],0,0,0,1,1,1,0,0,Math.PI/2); camp.add(g); return g; }
/* place an object with a camp-local position and a rotation */
function setPose(o,pos,q){ _m1.compose(pos,q,_g.set(1,1,1)); o.matrix.copy(_m1); o.matrixWorldNeedsUpdate=true; }
function onBone(o,bone,off,rot){ o.matrix.multiplyMatrices(bone.matrixWorld,_m1.compose(off,rot||_q2.identity(),_g.set(1,1,1))); o.matrixWorldNeedsUpdate=true; }

/* ---------------------------------------------------------------- the build ---------------------------------------------------------------- */
function build(){ initTemps(); sprites();
  cvs=document.createElement("canvas"); renderer=new T.WebGLRenderer({canvas:cvs,alpha:true,antialias:true,premultipliedAlpha:true,powerPreference:"high-performance"});
  renderer.setPixelRatio(1); renderer.outputColorSpace=T.SRGBColorSpace; renderer.toneMapping=T.NoToneMapping; renderer.shadowMap.enabled=true; renderer.shadowMap.type=T.PCFSoftShadowMap;
  scene=new T.Scene(); cam=new T.PerspectiveCamera(); cam.position.set(0,HC,0); cam.matrixAutoUpdate=true; scene.add(cam);
  camp=G(scene);
  /* moonlight from high up behind, over the left: the moon sits up in the top left of the sky */
  hemi=new T.HemisphereLight(0x6b7fae,0x1d1c16,.9); scene.add(hemi);
  moon=new T.DirectionalLight(0x9db1dd,1.6); moon.position.set(-5,9,-7); camp.add(moon); moon.target=new T.Object3D(); camp.add(moon.target);
  moon.castShadow=true; moon.shadow.mapSize.set(1024,1024); Object.assign(moon.shadow.camera,{left:-4,right:4,top:4,bottom:-4,near:1,far:30}); moon.shadow.bias=-.0008; moon.shadow.radius=3;
  /* the fire's light, and a softer, wider bounce of it */
  fireL=new T.PointLight(0xff9a48,0,14,2); fireL.castShadow=true; fireL.shadow.mapSize.set(512,512); fireL.shadow.bias=-.004; fireL.shadow.radius=4; fireL.shadow.camera.near=.05; camp.add(fireL);
  fillL=new T.PointLight(0xff7a30,0,10,2); camp.add(fillL);
  /* the lawn under it all: a catcher for the moon's shadows, and the grass the fire lights */
  groundA=new T.Mesh(new T.CircleGeometry(9,48),new T.ShadowMaterial({opacity:.42,color:0x05060a})); groundA.rotation.x=-Math.PI/2; groundA.receiveShadow=true; camp.add(groundA);
  groundB=new T.Mesh(new T.CircleGeometry(9,48),mat("#6e6a3c",1,{map:grassTex(),alphaMap:radialTex([[0,"#fff"],[.25,"#eee"],[.6,"#666"],[1,"#000"]]),transparent:true}));   /* the lawn the firelight falls on: blades, not a smooth floor */ groundB.rotation.x=-Math.PI/2; groundB.receiveShadow=true; camp.add(groundB);
  const aoT=radialTex([[0,"rgba(0,0,0,.75)"],[.5,"rgba(0,0,0,.35)"],[1,"rgba(0,0,0,0)"]]), aoM=new T.MeshBasicMaterial({map:aoT,transparent:true,depthWrite:false});
  const blob=(x,z,rx,rz,a)=>{ const m=new T.Mesh(new T.PlaneGeometry(1,1),aoM.clone()); m.material.opacity=a||1; m.rotation.x=-Math.PI/2; m.position.set(x,.004,z); m.scale.set(rx*2,rz*2,1); camp.add(m); blobs.push(m); return m; };
  /* the fire ring: a bed of ash, the coals, a ring of field stones */
  const ash=new T.Mesh(new T.CircleGeometry(.5,32),new T.MeshStandardMaterial({color:0x2a2724,roughness:1,transparent:true,alphaMap:radialTex([[0,"#fff"],[.75,"#ddd"],[1,"#000"]])})); ash.rotation.x=-Math.PI/2; ash.position.y=.003; ash.receiveShadow=true; camp.add(ash);
  coalMat=new T.MeshStandardMaterial({color:0x1a1411,roughness:.9,emissive:0xff4a14,emissiveIntensity:0}); coal=new T.Mesh(new T.CircleGeometry(.24,20),coalMat); coal.rotation.x=-Math.PI/2; coal.position.y=.012; camp.add(coal);
  for(let i=0;i<9;i++){ const c=new T.Mesh(new T.DodecahedronGeometry(1,0),coalMat); c.position.set(rnd(-.15,.15),.02,rnd(-.15,.15)); c.scale.set(rnd(.02,.04),rnd(.012,.02),rnd(.02,.04)); c.rotation.set(rnd(0,3),rnd(0,3),0); camp.add(c); }
  const stoneM=[mat("#7d7a73",.95),mat("#6b6862",.95),mat("#8a857b",.95)];
  for(let i=0;i<12;i++){ const a=i/12*6.283+rnd(-.08,.08), g=new T.DodecahedronGeometry(1,1), p=g.attributes.position; for(let j=0;j<p.count;j++){ const k=rnd(.86,1.1); p.setXYZ(j,p.getX(j)*k,p.getY(j)*k,p.getZ(j)*k); } g.computeVertexNormals();
    M(camp,g,stoneM[i%3],Math.cos(a)*.52,.04,Math.sin(a)*.52,rnd(.08,.11),rnd(.05,.07),rnd(.07,.09),rnd(0,1),a,rnd(0,.3)); }
  blob(0,0,.75,.75,.6);
  /* the logs: an armful of split oak and a bit of kindling */
  logMat=mat("#4f3a2a",.95);
  for(let i=0;i<5;i++){ const l=makeLog(rnd(.44,.52),rnd(.035,.05)); l.userData={st:"hidden"}; logs.push(l); l.visible=false; }
  /* the chairs behind the fire, turned in a little toward each other: Christy's on the left, Jim's on the right, like their photo */
  chairC=makeChair(); chairC.position.set(-.56,0,-1.5); chairC.rotation.y=.16;
  chairJ=makeChair(); chairJ.position.set(.56,0,-1.5); chairJ.rotation.y=-.16;
  for(const c of [chairC,chairJ]) blob(c.position.x,c.position.z-.06,.45,.5,.55);
  bag=makeBag();
  guitar=makeGuitar(); stick=makeStick(); smore=makeSmore(); match=makeMatch();
  jim=new Person("jim"); chr=new Person("christy");
  jim.footBlob=[blob(0,0,.09,.16,.55),blob(0,0,.09,.16,.55)]; chr.footBlob=[blob(0,0,.08,.15,.55),blob(0,0,.08,.15,.55)];
  guitar.visible=false; stick.visible=false;
  camp.updateMatrixWorld(true); }

/* ---------------------------------------------------------------- layout on the photo ---------------------------------------------------------------- */
function layout(){ const W=SP.W, H=SP.H, h=SP.horizon(), key=W+"x"+H+"x"+Math.round(h.vy); if(key===anchorKey) return; anchorKey=key;
  const ax=W*(W<700?.42:.365), ay=h.vy+(H-h.vy)*(W<700?.7:.745), g=Math.max(20,ay-h.vy), D=SP.GF()/g;
  camp.position.set((ax-h.vx)/g*HC,0,-D); camp.updateMatrixWorld(true); F_SCREEN={x:ax,y:ay};
  const gc=SP.groundColor(ax,ay+10); if(gc) groundB.material.color.setRGB(...gc.map(v=>Math.pow(v/255,2.2)*.9));   /* the grass right there, as the fire will light it */ }
/* a ground point just off the right-hand edge of the screen, near the bottom: where they come out from the cabin */
function offscreen(yf,xpad){ const W=SP.W,H=SP.H,h=SP.horizon(), y=H*yf, g=Math.max(20,y-h.vy), D=SP.GF()/g, X=(W+xpad-h.vx)/g*HC; return [X-camp.position.x,-D-camp.position.z]; }

/* ---------------------------------------------------------------- the story ---------------------------------------------------------------- */
function* wait(s){ let e=0; while(e<s) e+=(yield)||0; }
function* until(f){ while(!f()) yield; }
/* turn on the spot: the body comes round smoothly and the feet step round under it */
function* turnTo(P,yaw,dur){ P.yawGoal=yaw; P.turnST=dur*.4; let e=0; while(e<dur+.2&&Math.abs(wrap(P.yaw-yaw))>.02) e+=(yield)||0; P.turnST=null; }
function* tween(s,fn){ let e=0; for(;;){ const k=Math.min(1,e/s); fn(k,ease(k)); if(k>=1) return; e+=(yield)||0; } }
const flags={};
const fireTop=()=>cw(0,.42,0);
const teepee=i=>{ const a=i/5*6.283+.4, base=new V3(Math.cos(a)*.21,.03,Math.sin(a)*.21), top=new V3(Math.cos(a)*.03,.36,Math.sin(a)*.03); return {mid:base.clone().add(top).multiplyScalar(.5),dir:top.clone().sub(base).normalize()}; };
function logQ(dir,q){ return (q||new T.Quaternion()).setFromUnitVectors(new V3(1,0,0),dir); }

function* jimStory(){ const J=jim, K=[.12,-.66]; S.stage="walk";
  J.root.visible=true; J.feetInit=false; const st=offscreen(.99,70); J.place(st[0],st[1],-2.4); J.hipLocal.set(0,.995,0);
  for(const l of logs){ l.visible=true; l.userData.st="carry"; }
  /* both arms cradling the wood against his chest */
  J.setHand(L_,o=>J.local(.15,1.08,.3,o).add(_p.set(0,J.walk? .012*Math.cos(4*Math.PI*J.walk.phi) : 0,0)),10); J.setHand(R_,o=>J.local(-.15,1.06,.3,o).add(_p.set(0,J.walk? .012*Math.cos(4*Math.PI*J.walk.phi) : 0,0)),10); J.look=()=>fireTop();
  yield* J.walkTo([[2.3,1.9],[1.45,.35],[.8,-.5],K],1.2);
  yield* turnTo(J,0,.8);   /* turn to face the ring */
  /* down on one knee */
  S.stage="kneel"; J.mode="kneel"; J.footLocal[L_].set(.13,.03,-.32); J.footLocal[L_].pitch=.95; J.footLocal[R_].set(-.13,0,.2); J.footLocal[R_].pitch=0; J.hipGoal.set(0,.56,-.06); J.hipRate=3.2; J.bendGoal.f=.45;
  yield* wait(1.2);
  /* set the armful down on the grass at his left */
  J.setHand(L_,o=>cw(K[0]+.38,.12,K[1]+.12,o),6); J.setHand(R_,o=>cw(K[0]+.3,.14,K[1]+.18,o),6); J.bendGoal.tw=.4; J.bendGoal.f=.65;
  yield* wait(.7); logs.forEach((l,i)=>{ l.userData.st="pile"; l.userData.pile=i; }); yield* wait(.4);
  J.setHand(L_,null); J.bendGoal.tw=0;
  /* build the teepee, one split at a time */
  for(let i=0;i<logs.length;i++){ const l=logs[i], tp=teepee(i);
    J.setHand(R_,o=>pileWorld(i,o),9); J.bendGoal.tw=.35; J.look=()=>pileWorld(i,_a); yield* wait(.55);
    l.userData.st="moving"; l.userData.k=0; l.userData.from=pileLocal(i); l.userData.to={pos:tp.mid,q:logQ(tp.dir)};
    J.setHand(R_,o=>cw(l.userData.cur.x,l.userData.cur.y,l.userData.cur.z,o),0); J.bendGoal.tw=-.05; J.look=()=>fireTop();
    yield* tween(.75,(k,e)=>{ l.userData.k=e; });
    l.userData.st="placed"; yield* wait(.15); }
  J.setHand(R_,null); J.bendGoal.tw=0; J.bendGoal.f=.35; yield* wait(.4);
  S.stage="match";
  J.setHand(L_,o=>J.local(.03,.72,.36,o),8); J.setHand(R_,o=>J.local(-.05,.74,.38,o),8); J.look=()=>J.local(0,.73,.37,_a); yield* wait(.8);
  match.visible=true; J.setHand(R_,o=>J.local(-.16,.8,.42,o),18); yield* wait(.18); S.matchLit=1; snd("strike"); { const w=cw(0,0,0,_a); SP.scatter&&SP.scatter(w.x/HC,-w.z); }   /* the flare sends the animals running */ J.setHand(R_,o=>J.local(-.04,.76,.38,o),10); yield* wait(.9);
  /* cup it, and down to the kindling */
  J.bendGoal.f=.75; J.setHand(L_,o=>cw(.08,.1,-.2,o),3.5); J.setHand(R_,o=>cw(.02,.08,-.18,o),3.5); J.look=()=>cw(0,.1,-.1,_a);
  yield* wait(1.4); S.fireGoal=.12; S.fire=Math.max(S.fire,.04); yield* wait(.8); match.visible=false; S.matchLit=0;
  /* a few long, gentle breaths at the base of it */
  J.setHand(L_,o=>cw(.2,.05,-.32,o),4); J.setHand(R_,o=>cw(-.12,.05,-.34,o),4); J.hipGoal.set(0,.5,-.02); J.bendGoal.f=.95;
  for(let b=0;b<3;b++){ yield* wait(.9); S.blow=1; S.fireGoal=Math.min(.55,S.fireGoal+.14); yield* wait(.7); S.blow=0; }
  S.fireGoal=1;
  /* up again, a step back, warming his hands while the fire takes */
  J.setHand(R_,o=>J.sh[R_].getWorldPosition(o).add(_p.set(0,.04,0)),5); J.setHand(L_,null); yield* wait(.5);   /* a hand on his knee to push up */
  J.hipRate=2.6; J.bendGoal.f=.3; J.hipGoal.set(0,.8,-.05); yield* wait(.7); J.setHand(R_,null);
  J.mode="stand"; J.footLocal[L_].set(.11,0,.02); J.footLocal[R_].set(-.11,0,.02); J.footLocal[L_].pitch=0; J.hipGoal.set(0,1.02,0); J.bendGoal.f=0; yield* wait(.9); J.hipRate=6;
  yield* J.walkTo([[.6,-.88]],.7);
  yield* turnTo(J,.25,.6);
  J.setHand(L_,o=>cw(.32,.68,-.55,o),4); J.setHand(R_,o=>cw(.22,.66,-.6,o),4); J.bendGoal.f=.12; J.look=()=>fireTop();
  flags.jimReady=true;
  yield* until(()=>flags.christyHere); J.setHand(L_,null); J.setHand(R_,null); J.bendGoal.f=0; J.look=()=>chr.head.getWorldPosition(_a);
  yield* turnTo(J,Math.atan2(chr.pos.x-J.pos.x,chr.pos.z-J.pos.z)||1.3,.9);   /* turning to her as she comes up */
  yield* until(()=>flags.offer);
  /* take the guitar from her: one hand at the neck, one under the body */
  J.setHand(L_,o=>gWorld(.0,.55,0,o),8); J.setHand(R_,o=>gWorld(-.05,-.15,.02,o),8); J.look=()=>gWorld(0,.2,0,_a); yield* wait(.8);
  flags.jimHas=true; yield* wait(.9);
  /* back to his chair, and down into it */
  J.setHand(L_,null); J.setHand(R_,o=>J.local(-.215,.88,.03,o),7); J.look=()=>chairJ.localToWorld(_a.set(0,.4,0));
  const sp=chairJ.localToWorld(new V3(0,0,.5)).applyMatrix4(_m1.copy(camp.matrixWorld).invert());
  yield* J.walkTo([[sp.x,sp.z]],.55); yield* turnTo(J,chairJ.rotation.y,1.0);
  J.setHand(R_,null); flags.gState="lap"; yield* sitDown(J,chairJ); flags.jimSeated=true;
  /* settle the guitar on his right thigh and play */
  J.look=()=>gWorld(0,.4,0,_a); yield* wait(.4); flags.jimPlaying=true;
  yield* playLoop(); }
function* sitDown(P,ch){ P.pos.copy(ch.position); P.yaw=P.yawGoal=ch.rotation.y; P.root.position.copy(P.pos); P.root.rotation.y=P.yaw; P.root.updateMatrixWorld(true);
  const c=1/P.sc; P.hipLocal.set(0,.995,.5*c); P.hipGoal.copy(P.hipLocal); P.mode="sit"; P.footLocal[L_].set(.12*c,0,.5*c); P.footLocal[R_].set(-.12*c,0,.5*c);
  if(P===chr){ P.setHand(L_,o=>ch.localToWorld(o.set(.37,.6,.12)),5); P.setHand(R_,o=>ch.localToWorld(o.set(-.37,.6,.12)),5); }   /* a hand on each arm of the chair to let herself down */
  P.hipRate=3.4; P.hipGoal.set(0,.66*c,.25*c); P.bendGoal.f=.55; yield* wait(.7);
  P.hipRate=3; P.hipGoal.set(0,.385*c,-.1*c); P.bendGoal.f=-.25; P.footLocal[L_].set(.15*c,0,.4*c); P.footLocal[R_].set(-.15*c,0,.42*c); P.footLocal[L_].yaw=.15; P.footLocal[R_].yaw=-.15; yield* wait(1.1); if(P===chr){ P.setHand(L_,null); P.setHand(R_,null); } P.hipRate=6; }

function* christyStory(){ const C=chr;
  yield* until(()=>flags.goChristy);
  C.root.visible=true; C.feetInit=false; const st=offscreen(.96,70); C.place(st[0],st[1],-2.3); C.hipLocal.set(0,.995,0);
  guitar.visible=true; flags.gState="carryC"; flags.bagState="carry";
  C.setHand(R_,o=>C.local(-.215,.87,.03,o),8); C.look=()=>fireTop();
  yield* C.walkTo([[2.45,1.6],[1.75,.2],[1.42,-.66]],1.15);
  C.look=()=>jim.head.getWorldPosition(_a); yield* until(()=>flags.jimReady);
  yield* turnTo(C,Math.atan2(jim.pos.x-C.pos.x,jim.pos.z-C.pos.z),.9); flags.christyHere=true; yield* wait(.8);
  /* lift the guitar out to him with both hands */
  flags.gState="offerC"; C.setHand(R_,o=>gWorld(0,.55,0,o),9); C.setHand(L_,o=>gWorld(.05,-.12,.03,o),9); C.look=()=>gWorld(0,.2,0,_a); yield* wait(.9);
  flags.offer=true; yield* until(()=>flags.jimHas); flags.gState="jimLeave"; yield* wait(.3); C.setHand(R_,null); C.setHand(L_,null); C.look=()=>jim.head.getWorldPosition(_a); yield* wait(.6);
  /* round in front of him to her own chair, setting the bag down beside it */
  const sp=chairC.localToWorld(new V3(0,0,.5)).applyMatrix4(_m1.copy(camp.matrixWorld).invert());
  C.look=()=>chairC.localToWorld(_a.set(0,.4,0)); yield* C.walkTo([[.95,-.4],[.2,-.62],[sp.x,sp.z]],.75);
  yield* turnTo(C,chairC.rotation.y,1.1);
  C.setHand(L_,o=>cw(-.98,.32,-1.36,o),5); C.bendGoal.f=.3; C.bendGoal.tw=-.3; yield* wait(.7); flags.bagState="ground"; C.setHand(L_,null); C.bendGoal.tw=0; C.bendGoal.f=0; yield* wait(.3);
  yield* sitDown(C,chairC); flags.chrSeated=true; C.look=()=>fireTop(); yield* wait(1.5);
  for(let n=0;;n++) yield* smoreRound(n); }

/* one s'more: reach into the bag, onto the stick, toast it (it might catch), make the sandwich, then eat it or pass it to Jim */
function* smoreRound(n){ const C=chr; S.round=n; S.rstage='bag';
  C.look=()=>bag.localToWorld(_a.set(0,.2,0)); C.bendGoal.f=.25; C.bendGoal.tw=-.35; C.setHand(R_,o=>bag.localToWorld(o.set(0,.22,0)),6); C.setHand(L_,o=>C.local(.05,.6,.3,o),5); yield* wait(1.1);
  stick.visible=true; flags.stick="hand"; mallow.visible=true; mallow.userData.toast=0; mallow.userData.flame=0; C.bendGoal.tw=0;
  C.setHand(R_,o=>C.local(.02,.7,.42,o),5); C.setHand(L_,o=>C.local(.06,.7,.48,o),5); C.look=()=>mallow.getWorldPosition(_a); yield* wait(1.2);   /* pressing it onto the end */
  /* out over the fire */
  C.setHand(L_,null); flags.stick="toast"; C.bendGoal.f=.32; C.setHand(R_,o=>C.local(.12,.72,.5,o),3); C.look=()=>mallow.getWorldPosition(_a);
  const dur=rnd(9,15), catches=Math.random()<.35; let e=0;
  while(e<dur){ const dt=(yield)||0; e+=dt; const heat=S.fire*(flags.stick==="toast"?1:0); mallow.userData.toast=Math.min(1.25,mallow.userData.toast+dt*heat*(catches&&e>dur*.6?.16:.085));
    if(catches&&e>dur*.7&&!mallow.userData.flame){ mallow.userData.flame=1; e=dur; } }
  if(mallow.userData.flame){ /* it caught: whip it up and blow it out */
    flags.stick="lift"; C.setHand(R_,o=>C.local(.05,.95,.4,o),5); yield* wait(.9); S.blowC=1; yield* wait(.55); mallow.userData.flame=0; S.blowC=0; mallow.userData.toast=Math.max(mallow.userData.toast,1.12); yield* wait(.6); }
  /* bring it in, sandwich it between the crackers */
  flags.stick="in"; C.bendGoal.f=.12; C.setHand(R_,o=>C.local(.08,.72,.24,o),4); C.setHand(L_,o=>mallow.getWorldPosition(o),5); C.look=()=>mallow.getWorldPosition(_a); yield* wait(1.3);
  smore.visible=true; flags.smore="L"; mallow.visible=false; yield* wait(.5);
  flags.stick="rest"; C.setHand(R_,o=>C.local(-.3,.62,.1,o),5); yield* wait(.6); C.setHand(R_,null);
  const toJim=n%2===1&&flags.jimPlaying; S.rstage=toJim?'pass':'eat';
  if(toJim){ /* lean over and pass it to Jim */
    C.bendGoal.tw=.3; C.bendGoal.s=-.2; C.look=()=>jim.head.getWorldPosition(_a); C.setHand(L_,o=>between(o),3.5); flags.pass=true; yield* until(()=>flags.jimTook); flags.smore="J"; C.setHand(L_,null); C.bendGoal.tw=0; C.bendGoal.s=0; yield* wait(1); flags.jimTook=false;
    C.look=()=>jim.head.getWorldPosition(_a); yield* wait(4); }
  else { /* eat it, a bite at a time */
    flags.smore="Lmouth"; C.look=()=>fireTop();
    for(let b=0;b<3;b++){ C.setHand(L_,o=>mouth(C,o),5); yield* wait(.7); C.nod=.1; smore.userData.left=(smore.userData.left??1)-.34; yield* wait(.5); C.nod=0; C.setHand(L_,o=>C.local(.12,.75,.32,o),4); yield* wait(rnd(1.4,2.4)); }
    smore.visible=false; smore.userData.left=1; flags.smore=null; C.setHand(L_,null); }
  /* then just listen a while, swaying with it */
  C.bendGoal.f=-.15; flags.sway=true; C.look=Math.random()<.5? ()=>jim.head.getWorldPosition(_a) : ()=>fireTop(); yield* wait(rnd(5,9)); flags.sway=false; }
const mouth=(P,o)=>{ P.head.updateMatrixWorld(true); return P.head.localToWorld(o.set(0,.0,.2)); };
const between=o=>{ const a=chr.local(0,.75,.3,_d), b=jim.local(0,.75,.3,_e); return o.copy(a).lerp(b,.5); };

/* Jim at the guitar: a strummed folk progression, down-down-up-up-down-up, the left hand moving up the neck at the changes */
/* Jim fingerpicks a folk tune of his own in the old alternating-thumb (Travis) style: the thumb keeps a steady boom-chick on every beat,
   root, fourth string, fifth string, fourth string, with the heel of the hand resting on the bass strings so they thump rather than ring;
   the fingers pinch a melody note with the thumb on the one, and pick the B and high E strings in between on the off-beats.
   Per chord: [thumb notes for beats 1-4], B string, high E string */
const CH={G:{T:[43,50,47,50],b:59,e:67},C:{T:[48,52,43,52],b:60,e:64},D:{T:[50,57,45,57],b:62,e:66},Em:{T:[40,52,47,52],b:59,e:64},Am:{T:[45,52,40,52],b:60,e:64}};
const PROG=["G","C","G","D","G","C","D","G","Em","C","G","D","G","C","D","G"];
/* the tune on top: a note pinched on the one, another picked on the and of three (null: just the open pattern) */
const MEL=[[71,null,74,71],[69,null,67,64],[62,64,67,69],[71,null,69,null],
           [71,null,74,71],[69,null,67,64],[69,null,71,69],[67,null,null,null],
           [71,null,74,76],[76,null,74,71],[74,null,71,69],[69,null,66,null],
           [71,null,74,71],[69,null,67,64],[62,64,66,69],[67,null,null,null]];
const BPM=72, SWING=.5;   /* the hands move at the easy pace of the recording */
const PAT=[1,1,1,1,1,1,1,1];
const FRET={G:.7,C:.66,D:.62,Em:.71,Am:.66};
function* playLoop(){ const J=jim; S.music=true; S.mclock=0; S.eighth=-1;
  const strum=o=>gWorld(-.07+.045*S.strumX,.1,.085+S.strumZ,o), overTop=o=>gWorld(-.45,-.2,.22,o);   /* the elbow out over the top edge of the body, forearm across the front to the soundhole */ J.setHand(L_,o=>gWorld(.012,FRET[PROG[S.bar%PROG.length]]+Math.sin(S.mclock*3)*.004,.05,o),14); J.setHand(R_,strum,5,overTop); yield* wait(.9); J.setHand(R_,strum,0,overTop); J.look=()=>Math.sin(S.mclock*.21)>.4? chr.head.getWorldPosition(_a) : gWorld(0,.45,0,_a);
  for(;;){ yield;
    if(flags.pass){ /* she's handing him a s'more: stop, take it, eat it, back to it */
      S.music=false; J.setHand(R_,o=>between(o),3.5); J.look=()=>chr.head.getWorldPosition(_a); yield* wait(1.4); flags.jimTook=true; flags.pass=false; yield* wait(.4);
      for(let b=0;b<2;b++){ J.setHand(R_,o=>mouth(J,o),5); yield* wait(.8); J.nod=.12; smore.userData.left=(smore.userData.left??1)-.5; yield* wait(.5); J.nod=0; J.setHand(R_,o=>J.local(-.15,.74,.3,o),4); yield* wait(1.3); }
      smore.visible=false; smore.userData.left=1; flags.smore=null;
      J.setHand(R_,o=>gWorld(-.07+.045*S.strumX,.1,.085+S.strumZ,o),6,o=>gWorld(-.45,-.2,.22,o)); J.look=()=>gWorld(0,.45,0,_a); yield* wait(.8); J.setHand(R_,o=>gWorld(-.07+.045*S.strumX,.1,.085+S.strumZ,o),0,o=>gWorld(-.45,-.2,.22,o));
      S.mclock=0; S.eighth=-1; S.music=true; J.look=()=>Math.sin(S.mclock*.21)>.4? chr.head.getWorldPosition(_a) : gWorld(0,.45,0,_a); } } }
function stepMusic(dt){ if(!S.music){ S.strumX=lerp(S.strumX||0,0,damp(4,dt)); jim.tap=0; return; }
  S.mclock+=dt; const bd=60/BPM, bt=S.mclock/bd, beat=Math.floor(bt), fr=bt-beat, e=beat*2+(fr>=SWING?1:0);
  /* the picking hand: the thumb rocking between the bass strings on the beat, the fingers flicking up in between */
  S.strumX=.18*Math.sin(Math.PI*bt)+.06*Math.sin(Math.PI*2*bt); S.strumZ=sdS(S.strumZ||0,fr<.12||(fr>=.5&&fr<.62)? .002 : .007,S,"strumZV",.06,dt);
  if(e!==S.eighth){ S.eighth=e; const bar=Math.floor(e/8)%PROG.length, k=e%8, ch=CH[PROG[bar]], m=MEL[bar]; S.bar=bar;
    let notes=[], vel=.6, thumb=false, mel=false;
    if(k%2===0){ notes.push(ch.T[k/2]); thumb=true; vel=.8*rnd(.92,1.04); const mm=m[k/2];
      if(mm){ notes.push(mm); mel=true; vel=.95; } else if(k===0){ notes.push(ch.e); vel=.9; } }   /* the tune pinched with the thumb, on the beat */
    else if(k===5&&!m[2]&&!m[3]){ notes.push(ch.e); vel=.6; }
    else if(k===3||k===7){ notes.push(ch.b); vel=.5*rnd(.9,1.05); }   /* the B string filling the ands */
    }
  jim.tap=Math.max(0,1-fr*4)*.14; jim.nod=Math.sin(Math.PI*bt)*.03-.025;   /* nodding along, toe tapping the beat */
  if(flags.sway) chr.bendGoal.s=Math.sin(Math.PI*bt/2)*.12; else chr.bendGoal.s=0; }

/* where the props are, frame by frame */
function gWorld(x,y,z,o){ return (o||new V3()).set(x,y,z).applyMatrix4(guitar.matrix); }
const pileLocal=i=>({pos:new V3(.5+(i%2)*.03,.045+(i>=3?.08:0),-.74+(i%3)*.095+(i>=3?.05:0)),q:new T.Quaternion().setFromEuler(new T.Euler(0,.3+i*.06,0))});
function pileWorld(i,o){ const p=pileLocal(i).pos; return cw(p.x,p.y+.03,p.z,o); }
function updateProps(stage){
  const C=chr, J=jim;
  if(stage==="pre"){ /* things that set where the hands go */
    for(let i=0;i<logs.length;i++){ const l=logs[i], u=l.userData;
      if(u.st==="carry"){ J.chest.updateMatrixWorld(true); onBone(l,J.chest,_a.set(0,-.06+(i%3)*.05-.05,.22+Math.floor(i/3)*.06),_q1.setFromEuler(new T.Euler(0,0,(i-2)*.05))); l.matrix.premultiply(_m1.copy(camp.matrixWorld).invert()); }
      else if(u.st==="pile"){ const p=pileLocal(i); setPose(l,p.pos,_q1.copy(p.q)); }
      else if(u.st==="moving"){ const k=u.k, a=u.from, b=u.to; const pos=a.pos.clone().lerp(b.pos,k); pos.y+=Math.sin(Math.PI*k)*.18; u.cur=pos; setPose(l,pos,_q1.copy(a.q).slerp(b.q,k)); }
      else if(u.st==="placed"){ const tp=teepee(i); setPose(l,tp.mid,logQ(tp.dir,_q1)); } }
    const gs=flags.gState;
    if(gs==="offerC"){ /* held out flat in front of her, top up, neck toward Jim */
      const p=C.local(-.02,1.05,.42,_a).applyMatrix4(_m1.copy(camp.matrixWorld).invert()); setPose(guitar,p,_q1.setFromEuler(new T.Euler(-1.2,C.yaw+1.6,0,"YXZ"))); guitar.matrix.premultiply(camp.matrixWorld); }
    else if(false){ J.hips.updateMatrixWorld(true); onBone(guitar,J.hips,_a.set(-.05,.02,.38),_q1.setFromEuler(new T.Euler(-1.25,-1.5,0,"YXZ"))); }
    else if(gs==="lap"){ /* on his right thigh, neck up and to his left, the top tipped toward him a touch */
      J.hips.updateMatrixWorld(true); onBone(guitar,J.hips,_a.set(-.07,.31,.2),_q1.setFromEuler(new T.Euler(.04,-.16,-1.12,"XYZ")));   /* the waist of it resting on top of his right thigh, the back against his belly */ }
    blendGuitar("pre");
    if(flags.bagState==="ground"){ bag.visible=true; setPose(bag,_a.set(-1.0,0,-1.36),_q1.setFromEuler(new T.Euler(0,.4,0))); bag.matrix.premultiply(camp.matrixWorld); bag.updateMatrixWorld(true); }
  } else { /* things carried in a hand */
    if(flags.bagState==="carry"){ bag.visible=true; C.hand[L_].updateMatrixWorld(true); onBone(bag,C.hand[L_],_a.set(0,-.27,0),_q1.setFromEuler(new T.Euler(0,Math.PI/2,0))); bag.updateMatrixWorld(true); }
    if(flags.gState==="jimLeave") carryPose(J);
    if(flags.gState==="carryC") carryPose(C);
    blendGuitar("post");
    if(match.visible){ J.hand[R_].updateMatrixWorld(true); onBone(match,J.hand[R_],_a.set(0,-.07,.02),_q1.setFromEuler(new T.Euler(Math.PI*.9,0,0))); S.matchPos=_g.set(0,.055,0).applyMatrix4(match.matrix).clone(); }
    if(stick.visible){ C.hand[R_].updateMatrixWorld(true); const hp=C.hand[R_].localToWorld(_a.set(0,-.06,0)).clone(); let tgt;
      const fs=flags.stick;
      if(fs==="toast") tgt=cw(-.08+Math.sin(S.clock*.7)*.03,.5,.05+Math.sin(S.clock*.5)*.03,_b);
      else if(fs==="lift") tgt=cw(-.25,1.1,-.1,_b);
      else if(fs==="in"||fs==="hand") tgt=C.local(.3,1.05,.9,_b);
      else tgt=C.local(-.42,1.6,.25,_b);   /* resting against the chair arm */
      if(fs==="rest"){ hp.copy(chairC.localToWorld(_c.set(-.37,.0,.38))); tgt=chairC.localToWorld(_b.set(-.37,1.0,.2)); }
      const want=(fs==="in"||fs==="hand")? .72 : 0; S.slide=lerp(S.slide||0,want,damp(5,S.dtl||.033));
      const dir=_d.subVectors(hp,tgt).normalize(); hp.addScaledVector(dir,fs==="rest"? 0 : S.slide); _q1.setFromUnitVectors(_e.set(0,0,1),dir); const spin=S.clock*1.4; _q2.setFromAxisAngle(_f.set(0,0,1),spin); _q1.multiply(_q2);
      _m1.compose(hp,_q1,_g.set(1,1,1)); stick.matrix.copy(_m1);
      const t=mallow.userData.toast||0, col=t<.5? new T.Color("#f5f1e8").lerp(new T.Color("#e8c48a"),t/.5) : t<1? new T.Color("#e8c48a").lerp(new T.Color("#9a5a24"),(t-.5)/.5) : new T.Color("#9a5a24").lerp(new T.Color("#2a1a12"),Math.min(1,(t-1)/.25));
      mallow.material.color.copy(col); }
    if(flags.stick==="none") stick.visible=false;
    if(smore.visible){ const left=Math.max(.15,smore.userData.left??1); const who=flags.smore==="J"? J.hand[R_] : C.hand[L_]; who.updateMatrixWorld(true); onBone(smore,who,_a.set(0,-.07,.03),_q1.identity()); smore.matrix.multiply(_m1.makeScale(left,1,1)); }
  } }

/* carried by the neck, close up where it joins the body: the neck angled forward and up, the body trailing behind at the hip, its top turned out, clear of the legs */
function carryPose(P){ P.hand[R_].updateMatrixWorld(true); const hp=P.hand[R_].localToWorld(new V3(0,-.045,0)), yaw=P.worldYaw();
  const q=new T.Quaternion().setFromEuler(new T.Euler(0,yaw,0,"YXZ")); q.multiply(_q2.setFromAxisAngle(_a.set(1,0,0),1.12)); q.multiply(_q2.setFromAxisAngle(UP,-Math.PI/2));   /* held by the neck: the headstock pointing forward and a little up, the body hanging back at the hip, its top facing out */
  const pos=hp.add(new V3(0,-.34,0).applyQuaternion(q))   /* gripped just above where the neck meets the body */.add(new V3(-Math.cos(yaw)*.07,0,Math.sin(yaw)*.07)); guitar.matrix.compose(pos,q,_g.set(1,1,1)); guitar.matrixWorldNeedsUpdate=true; }
/* when the guitar changes hands (or goes from carried to lap), it travels there over most of a second rather than jumping */
const gB={key:null,t:1,from:null,P:null,Q:null,S:null};
function blendGuitar(stage){ const key=flags.gState||"none", isPost=key==="carryC"||key==="jimLeave";
  if((stage==="post")!==isPost) return;
  if(!gB.P){ gB.P=new V3(); gB.Q=new T.Quaternion(); gB.S=new V3(); gB.P2=new V3(); gB.Q2=new T.Quaternion(); gB.last=new T.Matrix4(); }
  if(gB.key!==key){ if(gB.key!=null){ gB.from=gB.last.clone(); gB.t=0; } gB.key=key; }
  if(gB.from&&gB.t<1){ gB.t=Math.min(1,gB.t+(S.dtl||.033)/.75); const e=ease(gB.t);
    gB.from.decompose(gB.P,gB.Q,gB.S); guitar.matrix.decompose(gB.P2,gB.Q2,gB.S); gB.P.lerp(gB.P2,e); gB.Q.slerp(gB.Q2,e); guitar.matrix.compose(gB.P,gB.Q,gB.S.set(1,1,1)); }
  gB.last.copy(guitar.matrix); }
/* ---------------------------------------------------------------- the fire ---------------------------------------------------------------- */
let flameSpr=null, glowSpr=null, smokeSpr=null;
function sprites(){ if(flameSpr) return;
  const mk=(r,g,b)=>{ const c=document.createElement("canvas"); c.width=c.height=64; const x=c.getContext("2d"), gr=x.createRadialGradient(32,32,0,32,32,32); gr.addColorStop(0,`rgba(${r},${g},${b},1)`); gr.addColorStop(.35,`rgba(${r},${g},${b},.55)`); gr.addColorStop(1,`rgba(${r},${g},${b},0)`); x.fillStyle=gr; x.fillRect(0,0,64,64); return c; };
  flameSpr=[[255,226,150],[255,196,96],[255,160,58],[246,120,36],[226,86,24],[170,52,16],[110,28,10]].map(c=>mk(...c));
  glowSpr=mk(255,140,60); smokeSpr=(()=>{ const c=document.createElement("canvas"); c.width=c.height=64; const x=c.getContext("2d"), gr=x.createRadialGradient(32,32,0,32,32,32); gr.addColorStop(0,"rgba(118,116,118,.9)"); gr.addColorStop(.6,"rgba(100,98,102,.35)"); gr.addColorStop(1,"rgba(90,90,95,0)"); x.fillStyle=gr; x.fillRect(0,0,64,64); return c; })(); }
function stepFire(dt){
  const goal=S.fireGoal; S.fire=S.fire<goal? Math.min(goal,S.fire+dt*(goal>.9? .045 : .08)) : Math.max(goal,S.fire-dt*.1);
  if(S.blow) S.fire=Math.min(1,S.fire+dt*.05);
  S.flickV+=(rnd(-1,1)*6-S.flickV*3)*dt; S.flick=clamp(.86+.1*Math.sin(S.clock*7.3)+.06*Math.sin(S.clock*13.1+1)+S.flickV*.05,.6,1.15);
  if(S.fire>.02) S.burn=Math.min(1,S.burn+dt*.01*S.fire);
  const lvl=S.fire*S.alpha;
  /* flames: little hot puffs rising out of the wood, cooling from white-yellow to red as they go */
  const rate=lvl>0? 34+70*S.fire : 0; S.acc=(S.acc||0)+rate*dt;
  while(S.acc>=1&&parts.length<160){ S.acc--; const r=.17*Math.sqrt(Math.random())*(.4+.6*S.fire), a=rnd(0,6.283);
    parts.push({x:Math.cos(a)*r,y:.03+rnd(0,.08),z:Math.sin(a)*r,vx:0,vy:rnd(.55,1.05)*(.6+.5*S.fire),vz:0,life:rnd(.4,.85)*(.55+.55*S.fire),age:0,s:rnd(.1,.19)*(.6+.5*S.fire),ph:rnd(0,6),tongue:Math.random()<.35}); }
  if(S.acc>1) S.acc=1;
  const wind=.12;
  for(let i=parts.length-1;i>=0;i--){ const p=parts[i]; p.age+=dt; if(p.age>p.life){ parts.splice(i,1); continue; } const k=p.age/p.life;
    p.vx+=(-p.x*3.2+Math.sin(S.clock*9+p.ph)*.6-wind)*dt; p.vz+=(-p.z*3.2+Math.cos(S.clock*8+p.ph)*.4)*dt; p.x+=p.vx*dt; p.y+=p.vy*dt*(1+k*.6); p.z+=p.vz*dt; }
  /* sparks: now and then a pop sends a few up */
  if(lvl>.15&&Math.random()<dt*(.7+1.6*S.fire)){ const n=Math.random()<.2? 6 : 1+Math.floor(rnd(0,3)); for(let j=0;j<n;j++) sparks.push({x:rnd(-.1,.1),y:rnd(.1,.3),z:rnd(-.1,.1),vx:rnd(-.25,.25),vy:rnd(.9,2.2),vz:rnd(-.25,.25),age:0,life:rnd(1.2,2.8),px:null,py:null}); if(n>2) snd("pop"); }
  for(let i=sparks.length-1;i>=0;i--){ const p=sparks[i]; p.age+=dt; if(p.age>p.life||sparks.length>90){ sparks.splice(i,1); continue; } p.vx+=(Math.sin(S.clock*3+i)*.6-wind*1.5)*dt; p.vy-=.25*dt; p.vy*=1-dt*.4; p.x+=p.vx*dt; p.y+=p.vy*dt; p.z+=p.vz*dt; }
  /* smoke, pale and thin, leaning off with the air */
  if(lvl>.05&&Math.random()<dt*(2.5+3*S.fire)) smoke.push({x:rnd(-.08,.08),y:.5+S.fire*.25,z:rnd(-.08,.08),vx:-.05,vy:rnd(.35,.55),age:0,life:rnd(4,7),s:rnd(.12,.2),ph:rnd(0,6)});
  for(let i=smoke.length-1;i>=0;i--){ const p=smoke[i]; p.age+=dt; if(p.age>p.life||smoke.length>60){ smoke.splice(i,1); continue; } p.vx+=(-wind*.9+Math.sin(S.clock*.6+p.ph)*.08)*dt; p.x+=p.vx*dt; p.y+=p.vy*dt; p.vy*=1-dt*.12; p.s+=dt*.16; }
  /* the light it gives, flickering; a match first, if that's all there is */
  const fl=S.fire*S.flick;
  if(S.matchLit&&S.matchPos&&S.fire<.08){ fireL.position.copy(camp.worldToLocal(_a.copy(S.matchPos))); fireL.intensity=.5*S.flick; fireL.color.set(0xffb060); }
  else { fireL.position.set(Math.sin(S.clock*5.1)*.03,.32+S.fire*.12+Math.sin(S.clock*8.3)*.02,Math.cos(S.clock*4.3)*.03); fireL.intensity=6.5*fl*Math.min(1,S.fire*1.6); fireL.color.set(0xff9a48); }
  fillL.position.set(0,.6,.1); fillL.intensity=2.2*fl;
  if(mallow.userData.flame) { fireL.intensity+=.25; }
  logMat.color.set("#4f3a2a").lerp(new T.Color("#17110d"),S.burn*.8);
}
function drawFlames(c){ const A=1;
  c.save(); c.globalCompositeOperation="lighter";
  /* the glow it throws into the night air */
  if(S.fire>.01){ const p=toScr(cw(0,.4,0,_a)), r=2.2*p.k*(.5+.5*S.fire), a=.22*S.fire*S.flick*A; c.globalAlpha=a; c.drawImage(glowSpr,p.x-r,p.y-r*.8,r*2,r*1.6); c.globalAlpha=a*.8; const r2=.7*p.k; c.drawImage(glowSpr,p.x-r2,p.y-r2*1.2,r2*2,r2*2); }
  for(const q of parts){ const k=q.age/q.life, w=toScr(cw(q.x,q.y,q.z,_a)), sz=q.s*(1-k*.6)*w.k, ci=Math.min(6,Math.floor(k*6.2+(q.y>.5?1:0)));
    const tall=q.tongue? 3.4 : 2.2, wd=q.tongue? .55 : .8;
    c.globalAlpha=A*Math.min(1,(k<.12? k/.12 : 1)*(1-k)*.78); c.drawImage(flameSpr[ci],w.x-sz*wd,w.y-sz*tall*.62,sz*wd*2,sz*tall); }
  /* the bright heart of it, low in the wood */
  if(S.fire>.02){ const p=toScr(cw(0,.1,0,_b)), r=.2*p.k*(.4+.6*S.fire)*S.flick; c.globalAlpha=A*.45*Math.min(1,S.fire*2); c.drawImage(flameSpr[0],p.x-r,p.y-r*1.1,r*2,r*1.5); c.globalAlpha=A*.4*Math.min(1,S.fire*2); c.drawImage(flameSpr[2],p.x-r*1.4,p.y-r*1.2,r*2.8,r*1.9); }
  for(const q of sparks){ const w=toScr(cw(q.x,q.y,q.z,_a)), k=q.age/q.life, a=A*(1-k)*(.7+.3*Math.sin(S.clock*30+q.life*9));
    c.globalAlpha=Math.max(0,a); c.strokeStyle=k<.4?"rgb(255,214,140)":"rgb(255,150,60)"; c.lineWidth=1.2; c.beginPath(); c.moveTo(w.x,w.y); c.lineTo(w.x-q.vx*w.k*.03,w.y+q.vy*w.k*.03); c.stroke(); }
  /* the match, and a marshmallow that's caught */
  if(S.matchLit&&S.matchPos){ const w=toScr(S.matchPos), s=.025*w.k*(1+.2*Math.sin(S.clock*20)); c.globalAlpha=A*.95; c.drawImage(flameSpr[1],w.x-s*.6,w.y-s*1.6,s*1.2,s*2.2); c.globalAlpha=A*.35; c.drawImage(glowSpr,w.x-s*4,w.y-s*4,s*8,s*8); }
  if(mallow.visible&&stick.visible){ mallow.getWorldPosition(_b); const w=toScr(_b);
    if(mallow.userData.flame){ for(let i=0;i<3;i++){ const s=.035*w.k*(1+.3*Math.sin(S.clock*17+i*2)); c.globalAlpha=A*.8; c.drawImage(flameSpr[1+i],w.x-s*.6+i*s*.15,w.y-s*(1.8+i*.5),s*1.2,s*2.4); } c.globalAlpha=A*.3; const s=.15*w.k; c.drawImage(glowSpr,w.x-s,w.y-s,s*2,s*2); }
    else if(flags.stick==="toast"){ const s=.05*w.k; c.globalAlpha=A*.18*S.fire; c.drawImage(glowSpr,w.x-s,w.y-s,s*2,s*2); } }
  c.restore(); }
function drawSmoke(c){ if(!smoke.length) return; c.save(); for(const q of smoke){ const w=toScr(cw(q.x,q.y,q.z,_a)), k=q.age/q.life, s=q.s*w.k; c.globalAlpha=S.alpha*.14*Math.sin(Math.PI*Math.min(1,k*1.4))*(1-k*.5); c.drawImage(smokeSpr,w.x-s,w.y-s,s*2,s*2); } c.restore(); }

/* ---------------------------------------------------------------- rendering ---------------------------------------------------------------- */
function computeRect(){ const W=SP.W,H=SP.H; let top=H;
  const pts=[[0,1.2,0],[-.6,1.4,-1.5],[.6,1.4,-1.5]]; for(const P of [jim,chr]) if(P.root.visible){ _a.copy(P.pos); pts.push([_a.x,2.0,_a.z]); }
  for(const p of pts){ const s=toScr(cw(p[0],p[1],p[2],_a)); top=Math.min(top,s.y); }
  top=clamp(Math.floor((top-60)/32)*32,0,H-32); rect={x:0,y:top,w:Math.ceil(W),h:Math.ceil(H-top)}; }
function setCamera(){ const h=SP.horizon(), f=SP.GF()/HC, n=.1, R=rect; if(renderer.domElement.width!==R.w||renderer.domElement.height!==R.h) renderer.setSize(R.w,R.h,false);
  cam.projectionMatrix.makePerspective((R.x-h.vx)/f*n,(R.x+R.w-h.vx)/f*n,(h.vy-R.y)/f*n,(h.vy-R.y-R.h)/f*n,n,60); cam.projectionMatrixInverse.copy(cam.projectionMatrix).invert(); }
let airFog=null;
function dayLight(){ const d=1-clamp(SP.night,0,1); if(!airFog) airFog=new T.FogExp2(0x000000,.026); airFog.color.setRGB(lerp(.035,.62,d),lerp(.045,.56,d),lerp(.085,.46,d));
  hemi.intensity=.9+d*1.7; hemi.color.setRGB(lerp(.15,1,d),lerp(.18,.95,d),lerp(.42,.85,d)); hemi.groundColor.setRGB(lerp(.012,.25,d),lerp(.012,.22,d),lerp(.008,.12,d));
  moon.intensity=1.6+d*1.8; moon.color.setRGB(lerp(.34,1,d),lerp(.45,.82,d),lerp(.72,.6,d)); moon.position.set(lerp(-5,6,d),lerp(9,5,d),lerp(-7,-9,d)); }
function pass(which){ const A=which==="A"; if(A) dayLight(); scene.fog=A? airFog : null;
  moon.visible=A; hemi.visible=A; groundA.visible=A; fireL.visible=!A; fillL.visible=!A; groundB.visible=!A;
  coalMat.emissiveIntensity=A? 0 : 1.6*S.fire*S.flick; renderer.setClearColor(0x000000,A?0:1); renderer.render(scene,cam); }
/* who's away from the fire, and so gets drawn as their own piece among the animals */
const apart=P=>P.root.visible&&Math.hypot(P.pos.x,P.pos.z)>2.0;
function owned(P){ const J=P===jim, o=[P.root,...P.footBlob], gs=flags.gState;
  if(J){ if(gs==="jimLeave"||gs==="lap") o.push(guitar); if(match.visible) o.push(match); for(const l of logs) if(l.userData.st==="carry") o.push(l); if(flags.smore==="J") o.push(smore); }
  else { if(gs==="carryC"||gs==="offerC") o.push(guitar); if(flags.bagState==="carry") o.push(bag); if(stick.visible&&flags.stick!=="rest") o.push(stick); if(flags.smore&&flags.smore!=="J") o.push(smore); }
  return o; }
function showOnly(keep,hide){ const all=[...camp.children,guitar,stick,smore,bag,match], saved=new Map();
  for(const o of all){ if(o.isLight||o===groundA||o===groundB||(o.isObject3D&&o.type==="Object3D")) continue; saved.set(o,o.visible); if(keep) o.visible=o.visible&&keep.includes(o); else if(hide&&hide.includes(o)) o.visible=false; }
  return ()=>{ for(const [o,v] of saved) o.visible=v; }; }
let rectFrame=-1;
function drawA(who){ const c=SP.ctx(); if(!built) return; const solo=who&&who.isPerson;
  if(!solo&&S.alpha<=.005&&!(jim.root.visible&&!apart(jim))&&!(chr.root.visible&&!apart(chr))) return;
  if(rectFrame!==S.frame){ rectFrame=S.frame; computeRect(); setCamera(); }
  const restore= solo? showOnly(owned(who)) : showOnly(null,[jim,chr].filter(apart).flatMap(owned));
  pass("A"); restore();
  /* set into the photo: a touch of the lens's softness, and the photo's own slightly muted colour */
  drawGrass(c,solo? who : null,"back"); c.save(); c.globalAlpha=1; if("filter" in c) c.filter="blur(.45px) saturate(.88) contrast(.95)"; c.drawImage(cvs,rect.x,rect.y,rect.w,rect.h); c.filter="none"; c.restore();
  drawGrass(c,solo? who : null,"front"); if(!solo) drawSmoke(c); }
/* a few blades of the lawn's own grass in front of their boots and the chair legs, so they stand in it rather than on it */
function drawGrass(c,only,part){ c.save(); c.globalAlpha=only? .9 : S.alpha*.9; c.lineCap="round";
  const pts=[]; if(only) { c.restore(); return; }   /* nothing grows in front of the two of them: you see them walk out clearly, boots and all */
  if(!only){ for(let i=0;i<60;i++){ const a=i/60*6.283+((i*53)%7)*.03, r=.46+((i*37)%11)/11*.3; pts.push([Math.cos(a)*r,Math.sin(a)*r,Math.sin(a)>0? .055 : .07,10]); }   /* tufts all round the ring, growing up between the stones, taller at the front */
    for(let i=0;i<70;i++){ const a=((i*137.5)%360)*Math.PI/180, r=.8+((i*29)%17)/17*1.4; pts.push([Math.cos(a)*r,Math.sin(a)*r*.9+.1,.07,6]); } }   /* and scattered through the grass the fire lights */
  if(!only) for(const ch of [chairC,chairJ]) for(const [x,z] of [[-.33,.27],[.33,.27]]){ const p=ch.localToWorld(_a.set(x,0,z)); camp.worldToLocal(p); pts.push([p.x,p.z,.05,7,true]); }
  pts.sort((a,b)=>a[1]-b[1]);
  for(const [x,z,hm,nb,fore] of pts){ const front=fore||z>.02; if(part&&(part==="front")!==front) continue;   /* the blades behind the fire are drawn before it, so the logs and stones cover them */ const w=toScr(cw(x,0,z+.03,_a)), gc=SP.groundColor(w.x,w.y)||[90,90,60], k=w.k, near=Math.hypot(x,z)<.95, lit=near? Math.min(1,S.fire*.9) : 0;
    const base=gc.map(v=>v*.55), warm=[255,150,70]; c.strokeStyle=`rgb(${base.map((v,j)=>Math.round(v+(warm[j]*.42-v)*lit*.55)).join(",")})`; c.lineWidth=Math.max(.7,.006*k);   /* the blades nearest the fire catch its light */
    for(let i=0;i<(nb||7);i++){ const ox=((i*37+Math.round(x*100))%13-6)/6*.09*k, hh=hm*(.6+((i*53)%7)/10)*k, ln=((i*29)%9-4)*.01*k; c.beginPath(); c.moveTo(w.x+ox,w.y+1); c.quadraticCurveTo(w.x+ox+ln*.4,w.y-hh*.5,w.x+ox+ln,w.y-hh); c.stroke(); } }
  c.restore(); }
function drawB(){ const c=SP.ctx(); if(!built) return; pass("B");
  c.save(); c.globalCompositeOperation="lighter"; c.globalAlpha=1; c.drawImage(cvs,rect.x,rect.y,rect.w,rect.h); c.restore(); drawFlames(c); }

/* ---------------------------------------------------------------- the frame ---------------------------------------------------------------- */
function simulate(dt){
  S.clock+=dt; S.dtl=dt; layout();
  for(let i=scripts.length-1;i>=0;i--){ const r=scripts[i].next(dt); if(r.done) scripts.splice(i,1); }
  if(flags.goChristy==null&&S.matchLit) flags.goChristy=true;
  if(flags.dawnAt!=null&&!flags.dawned&&S.clock>=flags.dawnAt){ flags.dawned=true; SP.dawn&&SP.dawn(10); SP.holdNight(false); }
  stepMusic(dt);
  for(const P of [jim,chr]) if(P.root.visible) P.updateBody(dt);
  updateProps("pre");
  for(const P of [jim,chr]) if(P.root.visible) P.updateArms(dt);
  updateProps("post");
  for(const P of [jim,chr]) if(P.footBlob){ P.footBlob.forEach((b,i)=>{ b.visible=P.root.visible; b.position.set(P.feet[i].cur.x,.004,P.feet[i].cur.z+.04); b.material.opacity=.55*clamp(1-P.feet[i].cur.y*12,0,1); }); }
  stepFire(dt); sndStep(dt); }
function reset(){ scripts=[]; songAt=0; gB.key=null; gB.from=null; for(const k in flags) delete flags[k]; parts=[]; sparks=[]; smoke=[]; Object.assign(S,{fire:0,fireGoal:0,burn:0,music:false,matchLit:0,matchPos:null,blow:0,blowC:0,strumX:0});
  if(!built) return; for(const P of [jim,chr]){ P.root.visible=false; P.walk=null; P.mode="stand"; P.look=null; P.setHand(L_,null); P.setHand(R_,null); P.hands.forEach(h=>h.init=false); P.bendGoal={f:0,s:0,tw:0}; P.bend={f:0,s:0,tw:0}; P.hipGoal.set(0,1.02,0); P.footLocal[L_].set(.11,0,.02); P.footLocal[R_].set(-.11,0,.02); P.footLocal.forEach(f=>{ f.pitch=0; f.yaw=0; }); P.tap=0; P.nod=0; }
  logs.forEach(l=>{ l.visible=false; l.userData={st:"hidden"}; }); guitar.visible=false; stick.visible=false; smore.visible=false; smore.userData.left=1; match.visible=false; bag.visible=false; mallow.visible=false; }
/* fading the two of them (and what they're carrying) out at daybreak */
let propMats=null, propNow=-1;
function setProps(v){ if(!built) return; if(!propMats){ propMats=new Map(); const add=o=>o.traverse(m=>{ if(m.isMesh&&!m.userData.cast) [].concat(m.material).forEach(x=>{ if(!propMats.has(x)) propMats.set(x,x.opacity); }); });
    for(const o of camp.children){ if(o===jim.root||o===chr.root||o===groundA||o===groundB||jim.footBlob.includes(o)||chr.footBlob.includes(o)) continue; add(o); } add(stick); }
  if(Math.abs(v-propNow)<.002) return; propNow=v; const tr=v<.999;
  for(const [m,base] of propMats){ const want=m.transparent&&base<1? true : tr; if(m.isMeshBasicMaterial){ m.opacity=base*v*v; continue; } if(m.alphaMap){ m.opacity=base*v; continue; }   /* the soft shadow under each thing comes in after it, and goes before it */ if(m.transparent!==want){ m.transparent=want; m.needsUpdate=true; } m.opacity=base*v; } }
let castMats=null, castNow=1, leftAt=-1;
function setCast(v){ if(!built) return; if(!castMats){ castMats=new Set(); for(const o of [jim.root,chr.root,guitar,stick,smore,bag,match]) o.traverse(m=>{ if(m.isMesh) [].concat(m.material).forEach(x=>castMats.add(x)); }); }
  if(Math.abs(v-castNow)<.002) return; castNow=v; const tr=v<.999; for(const m of castMats){ if(m.transparent!==tr){ m.transparent=tr; m.needsUpdate=true; } m.opacity=v; } }
/* daybreak: they get up and head back to the cabin, taking the guitar and the bag with them */
function* standUp(P,ch){ const c=1/P.sc; P.footLocal.forEach(f=>{ f.yaw=0; f.pitch=0; });
  P.hipRate=3.4; P.bendGoal.f=.6; P.hipGoal.set(0,.62*c,.3*c); P.footLocal[L_].set(.12*c,0,.46*c); P.footLocal[R_].set(-.12*c,0,.46*c); yield* wait(.75);
  P.hipRate=2.8; P.hipGoal.set(0,.995,.5*c); P.bendGoal.f=.08; yield* wait(.9);
  const sp=ch.localToWorld(new V3(0,0,.5)).applyMatrix4(_m1.copy(camp.matrixWorld).invert());
  P.pos.set(sp.x,0,sp.z); P.hipLocal.z-=.5*c; P.hipGoal.set(0,1.02,0); P.footLocal[L_].set(.11,0,.02); P.footLocal[R_].set(-.11,0,.02); P.mode="stand"; P.bendGoal.f=0; P.hipRate=6; }
function* rise(P){ P.footLocal[L_].set(.11,0,.02); P.footLocal[R_].set(-.11,0,.02); P.footLocal.forEach(f=>{ f.yaw=0; f.pitch=0; }); P.hipRate=2.8; P.hipGoal.set(0,1.02,0); P.bendGoal={f:0,s:0,tw:0}; P.mode="stand"; yield* wait(1.2); P.hipRate=6; }
function freeUp(P){ if(P.walk){ P.walk=null; } if(P.mode==="walk") P.mode="stand"; P.look=null; P.setHand(L_,null); P.setHand(R_,null); P.nod=0; P.tap=0; }
function* leaveJim(){ const J=jim; if(!J.root.visible){ flags.jimGone=true; return; }
  S.music=false; match.visible=false; S.matchLit=0; const had=flags.jimHas, sat=J.mode==="sit", knelt=J.mode==="kneel"; freeUp(J); if(flags.smore==="J"){ smore.visible=false; flags.smore=null; }
  J.look=()=>chr.head.getWorldPosition(_a); yield* wait(.6);
  if(sat) yield* standUp(J,chairJ); else if(knelt) yield* rise(J);
  if(had){ J.setHand(R_,o=>J.local(-.215,.88,.03,o),6); yield* wait(.25); flags.gState="jimLeave"; yield* wait(.3); }
  J.look=null; const off=offscreen(1.02,160); const pts=J.pos.x<1.2? [[1.35,-.35],[2.3,1.1],off] : [[2.3,1.1],off];
  yield* J.walkTo(pts,1.05); J.root.visible=false; flags.jimGone=true; }
function* leaveChr(){ const C=chr; if(!C.root.visible){ flags.chrGone=true; return; }
  const sat=C.mode==="sit"; freeUp(C); C.bendGoal={f:0,s:0,tw:0}; flags.sway=false; flags.pass=false;
  if(stick.visible){ flags.stick="rest"; mallow.visible=false; } if(flags.smore&&flags.smore!=="J"){ smore.visible=false; flags.smore=null; }
  C.look=()=>jim.head.getWorldPosition(_a); yield* wait(1.0);
  if(sat){ yield* standUp(C,chairC);
    if(flags.bagState==="ground"){ C.look=()=>bag.localToWorld(_a.set(0,.2,0)); C.bendGoal.f=.45; C.bendGoal.tw=-.3; C.setHand(L_,o=>bag.localToWorld(o.set(0,.22,0)),5); yield* wait(.9); flags.bagState="carry"; C.bendGoal.f=0; C.bendGoal.tw=0; C.setHand(L_,null); yield* wait(.4); } }
  C.look=null; const off=offscreen(.98,160); const pts=C.pos.x<1.2? [[.25,-.95],[1.55,-.35],[2.55,1.25],off] : [[2.55,1.25],off];
  yield* C.walkTo(pts,1.0); C.root.visible=false; flags.chrGone=true; }
function begin(){ reset(); anchorKey=""; layout(); scripts.push(jimStory()); scripts.push(christyStory()); scripts.forEach(s=>s.next(0)); S.run=true; }
SP.add({
  busy:()=>S.on||S.alpha>.01,
  /* where the animals give way: a wide berth round the fire, the chairs, the bag, and Jim and Christy wherever they are */
  obstacles(){ if(!built||(S.alpha<.05&&!S.run)) return []; const o=[], add=(x,z,r)=>{ const w=cw(x,0,z,_a); o.push({Xw:w.x/HC,Dw:-w.z,r}); };
    add(0,0,S.fire>.05? 1.6 : 1.0); add(chairC.position.x,chairC.position.z,.75); add(chairJ.position.x,chairJ.position.z,.75);
    for(const P of [jim,chr]) if(P.root.visible) add(P.pos.x,P.pos.z,.7);
    if(bag.visible&&flags.bagState==="ground") add(-1.0,-1.36,.35);
    return o; },
  lawn(L,dt,dark){ if(!built) return;
    const lightK=ease(clamp((SP.night-.08)/.7,0,1)); S.alpha=sdS(S.alpha,lightK,S,"alphaV",.35,dt);   /* the chairs and the ring come and go with the light itself, at dusk and at daybreak */
    setProps(S.alpha);
    /* the chairs' shadows on the grass follow the chairs in, a beat behind, and fade out a little ahead of them */
    S.shadowK=sdS(S.shadowK||0,S.alpha*S.alpha,S,"shV",.6,dt); groundA.material.opacity=.42*S.shadowK;
    if(!S.on){ S.fireGoal=0; S.fire=Math.max(0,S.fire-dt*.3); }   /* the fire dies down as the light comes */
    const gone=!S.run||(flags.jimGone&&flags.chrGone); if(!S.on&&gone&&SP.held){ SP.dawn&&SP.dawn(4); SP.holdNight(false); }
    if(!S.on&&S.alpha<=.003&&gone){ if(S.run){ S.run=false; reset(); } return; }
    if(S.on&&!S.run&&SP.night>.85){ let mid=null; try{ mid=typeof ambient!=="undefined"&&ambient.banMid? ambient.banMid() : null; }catch(e){}   /* the bluebirds' banner has the stage: wait till it has reached the middle of the screen */
      if(mid===false) S.waitT=0; else { S.waitT=(S.waitT||0)+dt; if(S.waitT>1.2){ S.waitT=0; begin(); } } }
    if(!S.run){ layout(); S.frame=(S.frame||0)+1; if(S.alpha>.003) L.push({y:F_SCREEN.y,fn:()=>drawA()}); return; }   /* just the empty chairs and the cold ring, waiting */
    simulate(Math.min(dt,.05));
    S.frame=(S.frame||0)+1;
    L.push({y:F_SCREEN.y,fn:()=>drawA()});
    for(const P of [jim,chr]) if(apart(P)){ const q=toScr(cw(P.pos.x,0,P.pos.z,_d)); L.push({y:q.y,fn:()=>drawA(P)}); } },
  light(){ if(built&&S.run) drawB(); } });

/* ---------------------------------------------------------------- sound: the fire, and the guitar ---------------------------------------------------------------- */
let ac=null, out=null, fireG=null, nbuf=null, pickBus=null, verbIn=null; const ksC={};
function sndInit(){ if(ac) return; const AC=window.AudioContext||window.webkitAudioContext; if(!AC) return; try{ ac=new AC(); }catch(e){ return; }
  out=ac.createGain(); out.gain.value=0; const comp=ac.createDynamicsCompressor(); out.connect(comp).connect(ac.destination);
  /* the guitar: a soft top end like a thumb-and-flesh pluck, a little body warmth, and a short tail of night air */
  /* the guitar's body: the low air resonance that gives an acoustic its boom, the wooden top above it, a dip in the boxy middle, a little sparkle */
  pickBus=ac.createBiquadFilter(); pickBus.type="peaking"; pickBus.frequency.value=105; pickBus.Q.value=2.2; pickBus.gain.value=5;
  const top=ac.createBiquadFilter(); top.type="peaking"; top.frequency.value=215; top.Q.value=1.8; top.gain.value=3.5;
  const box=ac.createBiquadFilter(); box.type="peaking"; box.frequency.value=420; box.Q.value=1.4; box.gain.value=-3;
  const air=ac.createBiquadFilter(); air.type="peaking"; air.frequency.value=2600; air.Q.value=1; air.gain.value=1.5;
  /* and then the distance: across the lawn the top end softens, it's quieter, and more of what reaches you is the night air around it */
  const far=ac.createBiquadFilter(); far.type="lowpass"; far.frequency.value=1900; far.Q.value=.4; const farG=ac.createGain(); farG.gain.value=.5;
  const pan=ac.createStereoPanner? ac.createStereoPanner() : null; if(pan) pan.pan.value=-.15;
  pickBus.connect(top).connect(box).connect(air).connect(far).connect(farG); if(pan){ farG.connect(pan).connect(out); } else farG.connect(out);
  const ir=ac.createBuffer(2,Math.round(ac.sampleRate*2.6),ac.sampleRate); for(let c=0;c<2;c++){ const d=ir.getChannelData(c), pre=Math.round(ac.sampleRate*.035); for(let i=pre;i<d.length;i++) d[i]=(Math.random()*2-1)*Math.pow(1-(i-pre)/(d.length-pre),3.6)*.55; }
  const conv=ac.createConvolver(); conv.buffer=ir; verbIn=ac.createBiquadFilter(); verbIn.type="lowpass"; verbIn.frequency.value=1500; const vg=ac.createGain(); vg.gain.value=.34; verbIn.connect(conv).connect(vg).connect(out);
  const n=ac.sampleRate*2; nbuf=ac.createBuffer(1,n,ac.sampleRate); const d=nbuf.getChannelData(0); for(let i=0;i<n;i++) d[i]=Math.random()*2-1;
  const br=ac.createBuffer(1,n,ac.sampleRate), b=br.getChannelData(0); let l=0; for(let i=0;i<n;i++){ l=(l+.02*(Math.random()*2-1))/1.02; b[i]=l*3.5; }
  const src=ac.createBufferSource(); src.buffer=br; src.loop=true; const lp=ac.createBiquadFilter(); lp.type="lowpass"; lp.frequency.value=420; fireG=ac.createGain(); fireG.gain.value=0; src.connect(lp).connect(fireG).connect(out); src.start(); }
function ks(midi){ if(ksC[midi]) return ksC[midi]; const sr=ac.sampleRate, f=440*Math.pow(2,(midi-69)/12), N=Math.max(2,Math.round(sr/f)), dur=midi<52? 4.2 : midi<64? 3.2 : 2.4, len=Math.round(sr*dur), buf=ac.createBuffer(1,len,sr), d=buf.getChannelData(0), ring=new Float32Array(N);
  /* the pluck: a burst shaped like a fingertip leaving the string (soft, rounded) from about a fifth of the way along it, which takes out some overtones */
  for(let i=0;i<N;i++) ring[i]=Math.random()*2-1; for(let pass=0;pass<3;pass++) for(let i=0;i<N;i++) ring[i]=.5*(ring[i]+ring[(i+1)%N]);
  const pp=Math.max(1,Math.round(N*.19)), ex=ring.slice(); for(let i=0;i<N;i++) ring[i]=ex[i]-.85*ex[(i+pp)%N];
  let mx=0; for(let i=0;i<N;i++) mx=Math.max(mx,Math.abs(ring[i])); for(let i=0;i<N;i++) ring[i]/=mx||1;
  /* the string: each trip round loses a little, the highs faster than the lows, longer sustain in the bass */
  const T60=midi<52? 3.6 : midi<64? 2.6 : 1.9, loss=Math.pow(.001,1/(f*T60)), br=midi<52? .42 : .5;
  let idx=0, prev=0; for(let i=0;i<len;i++){ const v=ring[idx], nx=ring[(idx+1)%N], y=loss*(br*v+(1-br)*nx); d[i]=v*.5; ring[idx]=y; idx=(idx+1)%N; }
  for(let i=0;i<Math.min(len,Math.round(sr*.004));i++) d[i]*=i/(sr*.004);   /* no click at the start */
  return ksC[midi]=buf; }
function snd(kind,o){ if(!ac||!window.natureSfx||!natureSfx.playing||S.alpha<.05) return; const t0=ac.currentTime;
  if(kind==="pick"){ o.notes.forEach((m,i)=>{ const s=ac.createBufferSource(); s.buffer=ks(m); const g=ac.createGain(), isThumb=o.thumb&&i===0, top=o.mel&&i===o.notes.length-1, v=(isThumb? .1 : top? .1 : .06)*o.vel; g.gain.setValueAtTime(v,t0+i*.012); g.gain.setTargetAtTime(0,t0+(isThumb? 60/BPM*.35 : 60/BPM*2.6),isThumb? .09 : .5);   /* the thumb muted under the heel of the hand */
      s.connect(g); g.connect(pickBus); g.connect(verbIn); s.start(t0+i*.012+rnd(0,.008)); s.stop(t0+4); }); return; }
  if(kind==="strum"){ const ns=o.down? o.notes : o.notes.slice().reverse(); const body=ac.createBiquadFilter(); body.type="lowpass"; body.frequency.value=o.down?3200:4200; const g=ac.createGain(); g.gain.value=.11*o.vel; body.connect(g).connect(out);
    ns.forEach((m,i)=>{ const s=ac.createBufferSource(); s.buffer=ks(m); const gg=ac.createGain(); gg.gain.setValueAtTime(1,t0); gg.gain.setTargetAtTime(.0,t0+60/BPM*.9,.25); s.connect(gg).connect(body); s.start(t0+i*(o.down?.016:.012)); s.stop(t0+3.2); }); }
  else if(kind==="pop"||kind==="crackle"||kind==="strike"){ const s=ac.createBufferSource(); s.buffer=nbuf; const hp=ac.createBiquadFilter(); hp.type="bandpass"; hp.frequency.value=kind==="strike"?2400:rnd(700,1800); hp.Q.value=kind==="strike"? 1 : .7; const g=ac.createGain(); const dur=kind==="strike"?.22:kind==="pop"?rnd(.03,.07):rnd(.008,.03), v=kind==="strike"?.35:kind==="pop"?rnd(.07,.14):rnd(.012,.045);
    g.gain.setValueAtTime(v,t0); g.gain.exponentialRampToValueAtTime(.001,t0+dur); s.connect(hp).connect(g).connect(out); s.start(t0,rnd(0,1.5),dur+.02); } }
/* the guitar: Jim's own slow blues, recorded, looping seamlessly. Fetched and decoded in the background as soon as night is called, so nothing stalls;
   it plays while he plays, pauses where it is when he stops (for a s'more) and picks up from there */
let songAir=null, songBuf=null, songBytes=null, songFetch=null, songSrc=null, songG=null, songAt=0, songStart=0;
function songLoad(){ if(songFetch) return; songFetch=fetch("campfire-guitar.mp3").then(r=>r.arrayBuffer()).then(b=>{ songBytes=b; songDecode(); }).catch(()=>{}); }
function songDecode(){ if(!ac||!songBytes||songBuf) return; const b=songBytes; songBytes=null; ac.decodeAudioData(b).then(d=>{ songBuf=d; }).catch(()=>{}); }
function songStep(){ if(!ac) return; songDecode(); if(!songBuf) return;
  if(!songG){ /* off across the field: the body of the guitar thins, the top end rolls away, it's quieter, and most of what reaches you is the night air around it */
    songG=ac.createGain(); songG.gain.value=0;
    const thin=ac.createBiquadFilter(); thin.type="highpass"; thin.frequency.value=150; thin.Q.value=.5;
    const far=ac.createBiquadFilter(); far.type="lowpass"; far.frequency.value=2100; far.Q.value=.4;
    const far2=ac.createBiquadFilter(); far2.type="highshelf"; far2.frequency.value=1200; far2.gain.value=-6;
    const air=ac.createGain(); air.gain.value=1; songAir=air;                               /* the air between, drifting slowly as it moves */
    const dry=ac.createGain(); dry.gain.value=.6;
    const ir=ac.createBuffer(2,Math.round(ac.sampleRate*1.6),ac.sampleRate);
    for(let c=0;c<2;c++){ const d=ir.getChannelData(c), pre=Math.round(ac.sampleRate*.06); for(let i=pre;i<d.length;i++){ const u=(i-pre)/(d.length-pre); d[i]=(Math.random()*2-1)*Math.pow(1-u,3.4)*(u<.02? u/.02 : 1)*.5; } }
    const verb=ac.createConvolver(); verb.buffer=ir; const vlp=ac.createBiquadFilter(); vlp.type="lowpass"; vlp.frequency.value=1500; const wet=ac.createGain(); wet.gain.value=.26;
    const pan=ac.createStereoPanner? ac.createStereoPanner() : null; if(pan) pan.pan.value=-.18;
    songG.connect(thin).connect(far).connect(far2).connect(air);
    if(pan){ air.connect(dry).connect(pan).connect(out); } else air.connect(dry).connect(out);
    air.connect(vlp).connect(verb).connect(wet).connect(out); }
  if(songAir){ const k=.88+.08*Math.sin(ac.currentTime*.37)+.05*Math.sin(ac.currentTime*.11+1.3); songAir.gain.setTargetAtTime(k,ac.currentTime,.5); }
  const want=S.music&&S.run;
  if(want&&!songSrc){ songSrc=ac.createBufferSource(); songSrc.buffer=songBuf; songSrc.loop=true; songSrc.connect(songG); songStart=ac.currentTime-songAt; songSrc.start(0,songAt%songBuf.duration); songG.gain.cancelScheduledValues(ac.currentTime); songG.gain.setTargetAtTime(.5,ac.currentTime,.8); }
  else if(!want&&songSrc){ songAt=(ac.currentTime-songStart)%songBuf.duration; const s0=songSrc; songSrc=null; songG.gain.cancelScheduledValues(ac.currentTime); songG.gain.setTargetAtTime(0,ac.currentTime,.12); try{ s0.stop(ac.currentTime+.6); }catch(e){} } }
function sndStep(dt){ songStep(); if(!ac) return; const want=(window.natureSfx&&natureSfx.playing&&S.run? 1 : 0)*S.alpha;
  out.gain.setTargetAtTime(want*.9,ac.currentTime,.3); fireG.gain.setTargetAtTime(.03*S.fire*S.flick,ac.currentTime,.1);
  if(want>.05&&S.fire>.05&&Math.random()<dt*(.5+1.3*S.fire)){ snd("crackle"); if(Math.random()<.2) setTimeout(()=>snd("crackle"),rnd(60,180)); }
  if(want>.05&&S.fire>.3&&Math.random()<dt*.05) snd("pop"); }

/* ---------------------------------------------------------------- the page's switch ---------------------------------------------------------------- */
function set(v,now){ v=!!v; if(v===S.on) return; S.on=v; if(v) songLoad();
  if(v){ SP.holdNight(true,now); if(S.run){ S.run=false; reset(); } }
  else if(S.run){ leftAt=performance.now(); /* they get up while it's still dark; then the dawn comes slowly as they walk off, and they're gone by the time it's light */
    scripts=[leaveJim(),leaveChr()]; scripts.forEach(g=>g.next(0)); flags.dawnAt=S.clock+2.4; }
  else SP.holdNight(false);
  if(v){ load(); sndInit(); try{ ac&&ac.state!=="running"&&ac.resume(); }catch(e){} S.waitT=0; } }
addEventListener("pointerdown",()=>{ if(S.on){ sndInit(); try{ ac&&ac.state!=="running"&&ac.resume(); }catch(e){} } },{passive:true}); addEventListener("keydown",()=>{ if(S.on){ sndInit(); try{ ac&&ac.state!=="running"&&ac.resume(); }catch(e){} } });
window.Campfire={ set, toggle(){ set(!S.on); }, get on(){ return S.on; }, get leaving(){ return !S.on&&S.run; }, get leftAt(){ return leftAt; }, get walkedOff(){ return !S.on&&(!S.run||!!(flags.jimGone&&flags.chrGone)); },
  get fire(){ return built? S.fire*S.alpha : 0; },   /* how brightly the fire is burning, for the scenery to light things by */
  get firePt(){ try{ if(!built) return null; const w=toScr(cw(0,.15,0)); return {x:w.x,y:w.y}; }catch(e){ return null; } } };
})();
