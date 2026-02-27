const wars = {
  civil: {
    name: "American Civil War",
    nations: ["Union", "Confederacy"]
  },
  ww1: {
    name: "World War I",
    nations: ["Germany","France","UK","Austria-Hungary"]
  },
  ww2: {
    name: "World War II",
    nations: ["USA","Germany","UK","USSR","Japan"]
  }
};

let selectedWar=null;
let selectedNation=null;

const warList=document.getElementById("warList");
const nationList=document.getElementById("nationList");

Object.keys(wars).forEach(key=>{
  const card=document.createElement("div");
  card.className="card";
  card.innerText=wars[key].name;
  card.onclick=()=>{
    selectedWar=wars[key];
    loadNations();
  };
  warList.appendChild(card);
});

function loadNations(){
  nationList.innerHTML="";
  selectedWar.nations.forEach(n=>{
    const card=document.createElement("div");
    card.className="card";
    card.innerText=n;
    card.onclick=()=>selectedNation=n;
    nationList.appendChild(card);
  });
}

function startGame(){
  if(!selectedWar||!selectedNation) return;
  document.getElementById("menuScreen").classList.remove("active");
  document.getElementById("gameScreen").classList.add("active");
  initEngine();
}

function returnToMenu(){
  location.reload();
}

/* ================= ENGINE ================= */

const canvas=document.getElementById("gameCanvas");
const ctx=canvas.getContext("2d");
canvas.width=window.innerWidth;
canvas.height=window.innerHeight;

let camera={x:0,y:0,zoom:1};
let dragging=false,lastX,lastY;

canvas.onmousedown=e=>{dragging=true;lastX=e.clientX;lastY=e.clientY};
canvas.onmousemove=e=>{
  if(dragging){
    camera.x-=(e.clientX-lastX)/camera.zoom;
    camera.y-=(e.clientY-lastY)/camera.zoom;
    lastX=e.clientX;lastY=e.clientY;
  }
};
canvas.onmouseup=()=>dragging=false;
canvas.onwheel=e=>camera.zoom*=e.deltaY>0?0.9:1.1;

function worldToScreen(x,y){
  return {x:(x-camera.x)*camera.zoom,y:(y-camera.y)*camera.zoom};
}
function screenToWorld(x,y){
  return {x:x/camera.zoom+camera.x,y:y/camera.zoom+camera.y};
}

/* TERRITORY GRAPH */

let territories=[];
let armies=[];
let resources=200;
let techLevel=1;

function initEngine(){

  territories=[
    {id:1,x:200,y:200,owner:selectedNation,troops:50,adj:[2,3]},
    {id:2,x:450,y:220,owner:"AI",troops:60,adj:[1,3]},
    {id:3,x:350,y:450,owner:"Neutral",troops:40,adj:[1,2]}
  ];

  updateUI();
  gameLoop();
  setInterval(economyTick,1000);
  setInterval(aiLogic,3000);
}

function updateUI(){
  document.getElementById("info").innerText=
    selectedWar.name+" | "+selectedNation;
  document.getElementById("resources").innerText=
    "Resources: "+resources;
  document.getElementById("techStatus").innerText=
    "Tech Level: "+techLevel;
}

/* ECONOMY */

function economyTick(){
  territories.forEach(t=>{
    if(t.owner===selectedNation)
      resources+=2*techLevel;
  });
  updateUI();
}

/* RESEARCH */

function research(){
  if(resources>=100){
    resources-=100;
    techLevel++;
    updateUI();
  }
}

/* RECRUIT */

let selected=null;

canvas.onclick=e=>{
  const pos=screenToWorld(e.clientX,e.clientY);
  territories.forEach(t=>{
    if(Math.hypot(pos.x-t.x,pos.y-t.y)<30)
      selected=t;
  });
  updateTerritoryUI();
};

function updateTerritoryUI(){
  const el=document.getElementById("territoryInfo");
  if(!selected) return;
  el.innerHTML=
    "Owner: "+selected.owner+
    "<br>Troops: "+selected.troops;
}

function recruit(){
  if(selected && selected.owner===selectedNation && resources>=20){
    selected.troops+=10;
    resources-=20;
    updateUI();
    updateTerritoryUI();
  }
}

/* ARMY MOVEMENT */

function moveArmy(){
  if(!selected||selected.owner!==selectedNation) return;
  const target=territories.find(t=>
    selected.adj.includes(t.id));
  if(!target) return;

  armies.push({
    from:selected,
    to:target,
    progress:0,
    troops:Math.floor(selected.troops/2)
  });

  selected.troops=Math.floor(selected.troops/2);
}

/* COMBAT */

function resolveBattle(att,def,troops){
  const atkPower=troops*(1+techLevel*0.2)*(0.8+Math.random()*0.4);
  const defPower=def.troops*(0.8+Math.random()*0.4);

  if(atkPower>defPower){
    def.owner=selectedNation;
    def.troops=Math.floor(troops*0.5);
  }else{
    def.troops=Math.floor(def.troops*0.7);
  }
}

/* AI */

function aiLogic(){
  const aiTerr=territories.find(t=>t.owner==="AI");
  const playerTerr=territories.find(t=>t.owner===selectedNation);
  if(aiTerr && playerTerr){
    resolveBattle(aiTerr,playerTerr,Math.floor(aiTerr.troops*0.5));
  }
}

/* DRAW */

function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  territories.forEach(t=>{
    const pos=worldToScreen(t.x,t.y);
    ctx.beginPath();
    ctx.arc(pos.x,pos.y,30*camera.zoom,0,Math.PI*2);
    ctx.fillStyle=
      t.owner===selectedNation?"#00c6ff":
      t.owner==="AI"?"#ff4d4d":"#888";
    ctx.fill();

    ctx.fillStyle="white";
    ctx.fillText(t.troops,pos.x-10,pos.y+4);
  });

  armies.forEach(a=>{
    a.progress+=0.01;
    const x=a.from.x+(a.to.x-a.from.x)*a.progress;
    const y=a.from.y+(a.to.y-a.from.y)*a.progress;
    const pos=worldToScreen(x,y);
    ctx.fillStyle="yellow";
    ctx.fillRect(pos.x,pos.y,8,8);

    if(a.progress>=1){
      resolveBattle(a.from,a.to,a.troops);
      armies.splice(armies.indexOf(a),1);
    }
  });
}

function gameLoop(){
  draw();
  requestAnimationFrame(gameLoop);
}
