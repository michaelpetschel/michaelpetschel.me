const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let camera = { x:0, y:0, zoom:1 };
let dragging = false;
let lastX, lastY;

let selected = null;
let player = "Blue";
let ai = "Red";

let resources = 100;

const territories = [
  {id:1,x:200,y:200,owner:"Blue",troops:50,morale:1,supply:1},
  {id:2,x:500,y:250,owner:"Red",troops:60,morale:1,supply:1},
  {id:3,x:350,y:450,owner:"Neutral",troops:30,morale:1,supply:1},
];

function worldToScreen(x,y){
  return {
    x:(x-camera.x)*camera.zoom,
    y:(y-camera.y)*camera.zoom
  }
}

function screenToWorld(x,y){
  return {
    x:x/camera.zoom+camera.x,
    y:y/camera.zoom+camera.y
  }
}

canvas.addEventListener("mousedown",e=>{
  dragging=true;
  lastX=e.clientX;
  lastY=e.clientY;
});

canvas.addEventListener("mousemove",e=>{
  if(dragging){
    camera.x -= (e.clientX-lastX)/camera.zoom;
    camera.y -= (e.clientY-lastY)/camera.zoom;
    lastX=e.clientX;
    lastY=e.clientY;
  }
});

canvas.addEventListener("mouseup",()=>dragging=false);

canvas.addEventListener("wheel",e=>{
  camera.zoom *= e.deltaY>0 ? 0.9 : 1.1;
});

canvas.addEventListener("click",e=>{
  const pos = screenToWorld(e.clientX,e.clientY);
  territories.forEach(t=>{
    const dx=pos.x-t.x;
    const dy=pos.y-t.y;
    if(Math.sqrt(dx*dx+dy*dy)<30){
      selected=t;
      updateUI();
    }
  });
});

function updateUI(){
  const info=document.getElementById("territoryInfo");
  if(selected){
    info.innerHTML=`
      Owner: ${selected.owner}<br>
      Troops: ${selected.troops}<br>
      Morale: ${selected.morale.toFixed(2)}<br>
      Supply: ${selected.supply.toFixed(2)}
    `;
  }
  document.getElementById("resources").innerText="Resources: "+resources;
  document.getElementById("info").innerText="You: "+player;
}

function recruit(){
  if(selected && selected.owner===player && resources>=20){
    selected.troops+=10;
    resources-=20;
  }
}

function attack(){
  if(!selected || selected.owner!==player) return;
  const target = territories.find(t=>t.owner!==player && t!==selected);
  if(!target) return;

  resolveBattle(selected,target);
}

function resolveBattle(attacker,defender){
  const atkPower = attacker.troops * attacker.morale * attacker.supply * (0.8+Math.random()*0.4);
  const defPower = defender.troops * defender.morale * defender.supply * (0.8+Math.random()*0.4);

  if(atkPower>defPower){
    defender.owner=player;
    defender.troops=Math.floor(attacker.troops*0.5);
    attacker.troops=Math.floor(attacker.troops*0.3);
  }else{
    attacker.troops=Math.floor(attacker.troops*0.3);
  }
}

function aiTurn(){
  const aiTerr = territories.filter(t=>t.owner===ai);
  const target = territories.find(t=>t.owner===player);
  if(aiTerr.length && target){
    resolveBattle(aiTerr[0],target);
  }
}

function economyTick(){
  territories.forEach(t=>{
    if(t.owner===player) resources+=1;
    if(t.owner!=="Neutral"){
      t.morale += 0.01;
      t.supply += 0.01;
    }
  });
}

function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  territories.forEach(t=>{
    const pos = worldToScreen(t.x,t.y);
    ctx.beginPath();
    ctx.arc(pos.x,pos.y,30*camera.zoom,0,Math.PI*2);
    ctx.fillStyle=t.owner==="Blue"?"#00c6ff":
                   t.owner==="Red"?"#ff4d4d":"#888";
    ctx.fill();

    ctx.fillStyle="white";
    ctx.fillText(t.troops,pos.x-10,pos.y+4);
  });
}

function loop(){
  draw();
  requestAnimationFrame(loop);
}

setInterval(economyTick,1000);
setInterval(aiTurn,3000);

updateUI();
loop();

function resetGame(){
  location.reload();
}
