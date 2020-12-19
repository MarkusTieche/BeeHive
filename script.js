//BASE
var lastTick = Date.now();
var dt = 0;
var debugFPS = document.getElementById("debug_FPS");
var runningTime = 0;
let svg = document.querySelector('svg');
var viewBox = svg.viewBox.baseVal;

//GAME
var inputDiv = document.getElementById("inputDiv");
var input = 
{
    point:svg.createSVGPoint(),
    down:false,
    start:{x:0,y:0},
    position:{x:768/2,y:0},
    delta:{x:0,y:0}
}
var Game = 
{
    running:false,
    tutorial:true,
    progress:0,
}

var progressBar = document.getElementById("progressMask");

var tutorialFinger = document.getElementById("Finger");
    tutorialFinger.position = {x:0,y:0};

var player = document.getElementById("Player");
    player.position = {x:viewBox.width/2,y:viewBox.height-400};
    player.velocity = {x:0,y:0};
    player.rotation = 0;
    player.speed = 8;
    // player.shadow =  document.getElementById("Player");

var hive = document.getElementById("Hive");
    hive.position = {x:768/2,y:-10000};

var camera = document.getElementById("Level");
    camera.velocity = {x:0,y:0};
    camera.position = {x:0,y:0};
    camera.targetOffset = {x:viewBox.width/2,y:1280-400};
    camera.target = player;

var bgLoop = document.getElementById("bgLoop");

var collider = document.getElementById("Collider");
    collider.lastPos = {x:0,y:0};
var trees =  document.getElementById("trees");

var collectables =  document.getElementById("Collectables");
var flower = document.getElementById("flower");

var transition = document.getElementById("Transition");
    transition.mask = document.getElementById("transitionMask");
    transition.tweenable = new Tweenable({
        from: {scale:80},
        to: {scale:1},
        ease:"easeOutQuad",
        duration: 1000,
        onUpdate: ({scale}) => {
          transition.mask.setAttribute("transform","translate("+768*0.5 +","+1280*0.5 +") scale("+scale+")");
        }
    });



init(); 
function init()
{
    transition.style.display = "none";
    // var scale=.5;
    initLevel();
    animate();  

}

function sceneTransition()
{
    if(transition.style.display == "none")
    {   
        //FADE IN
        transition.style.display = "block";
        transition.mask.setAttribute("transform","translate("+768*0.5 +","+1280*0.5 +") scale("+80+")");
        transition.tweenable.tween().then(()=>{ transition.mask.style.display = "none";});
    }
    else
    {
        //FADE OUT
        transition.mask.style.display = "block";
        transition.mask.setAttribute("transform","translate("+768*0.5 +","+1280*0.5 +") scale("+1+")");
        transition.tweenable.tween({to:{scale:80},duration:1000}).then(()=>{ transition.style.display = "none";});
    }   
}

function initLevel()
{

    inputDiv.onmousedown = inputDiv.ontouchstart  = startGame;


    //ADD TREES
    var y = -1000;
    for (let i = 0; i < 4; i++) {

        var clone = trees.children[0].cloneNode(true);
            clone.position = {x:Math.random()*768,y:y-(100+Math.random()*500)};
            clone.setAttribute("transform","translate("+ clone.position.x+","+ clone.position.y +") scale("+Math.sign(Math.random()-0.5)+",1)");

            clone.flower = flower.cloneNode(true);
            collectables.appendChild(clone.flower);

            placeFlower(clone)

            collider.appendChild(clone);

            y += 500;
    }


    hive.setAttribute("transform","translate("+ hive.position.x+","+ hive.position.y +")");
}

function resetLevel()
{
    inputDiv.onmousedown = inputDiv.ontouchstart  = startGame;

    hive.setAttribute("transform","translate("+ hive.position.x+","+ hive.position.y +")");
    player.position = {x:viewBox.width/2,y:viewBox.height-400};
    camera.position = {x:0,y:0};
    Game.tutorial = true;
    Game.running = false;
    tutorialFinger.style.visibility = "visible";
    player.speed = 8;

    for (let i = 0; i < bgLoop.children.length; i++) 
    {
        bgLoop.children[i].setAttribute('y',Number(500*i));
    }

    sceneTransition();
}

function startGame(e)
{
    tutorialFinger.style.visibility = "hidden";
    Game.running = true;
    Game.tutorial = false;
    inputDown(e)
    //ENABLE INPU
    inputDiv.onmousedown = inputDiv.ontouchstart = inputDown;
    inputDiv.onmousemove = inputDiv.ontouchmove = inputMove;
    inputDiv.onmouseup = inputDiv.ontouchend = inputUp;
}

function absorbEvent_(event) {
// console.log(event)
var e = event || window.event;
e.preventDefault && e.preventDefault();
e.stopPropagation && e.stopPropagation();
e.cancelBubble = true;
e.returnValue = false;
return false;
}

function inputDown(e)
{
    // input.start.x = e.layerX;
    // input.start.y = e.layerY;
    input.point.x = e.layerX; input.point.y = e.layerY;
    input.start  = input.point.matrixTransform(svg.getScreenCTM().inverse());

    input.down = true;
    absorbEvent_(e);
}

function inputMove(e)
{
    if(input.down)
    {
        input.point.x = e.layerX; input.point.y = e.layerY;
        var position  = input.point.matrixTransform(svg.getScreenCTM().inverse());

        input.delta.x = input.start.x-position.x;
        
        input.start = position;

        input.position.x -= input.delta.x 
        input.position.x = Math.min(Math.max( input.position.x, 50), 768-50)

    }
}

function inputUp(e)
{
    input.down = false;
}

function collisionCheck(node,radius)
{
    if(Math.hypot(node.position.x-player.position.x,node.position.y-player.position.y)<radius)
    {
       return true;
    }
    return false;
}

function crash(collider)
{
    if(!Game.running){return;}
    player.speed = 0;
    Game.running = false;
    console.log(Math.sign(collider.position.y-player.position.y))
    player.velocity.y = player.velocity.y*Math.sign(collider.position.y-player.position.y);
    input.position.x = player.position.x+player.velocity.x*-10;

    inputDiv.onmousedown = inputDiv.ontouchstart = null;
    inputDiv.onmousemove = inputDiv.ontouchmove = null;
    inputDiv.onmouseup = inputDiv.ontouchend = null;


    setTimeout(sceneTransition,500);
    setTimeout(resetLevel,2000);
}

function collect(flower)
{
    flower.style.visibility = "hidden";
}

function placeFlower(tree)
{
    // var angle = Math.PI/2*Math.sign(tree.position.x-768/2);
    var random = Math.PI/4-Math.random()*Math.PI/2
    var angle =tree.position.x<768/2?0+random:Math.PI+random;
    var distance = 200+Math.random()*200;
    tree.flower.position = {x:tree.position.x+(Math.cos(angle)*distance),y:tree.position.y+(Math.sin(angle)*distance)};
    tree.flower.position.x = Math.min(Math.max( tree.flower.position.x, 100), 768-100)
    tree.flower.setAttribute("transform","translate("+ tree.flower.position.x+","+ tree.flower.position.y +")");
    tree.flower.style.visibility = "visible";
}

function render(time)
{
    //BASIC
    dt = (time-lastTick)*.06;
    lastTick = time;
    runningTime += dt;
    
    debugFPS.innerHTML = Math.ceil(60/dt);

    //GAME
    if(!Game.running)
    {
        if(Game.tutorial)
        {
            tutorialFinger.position.x = Math.sin(runningTime*.03)*300/2;
            tutorialFinger.setAttribute("transform","translate("+ tutorialFinger.position.x +",0)");
            input.position.x = tutorialFinger.position.x+viewBox.width/2
        }
        // player.rotation = (tutorialFinger.position.x)/5;
        player.velocity.y *=0.9;
    }
    else
    {
        if(!Game.tutorial)
        {
            player.velocity.y = Math.sin( (player.rotation-90)*(Math.PI/180))*player.speed;
        }
    }
    
    
    player.velocity.x = (input.position.x-player.position.x)/30;
    // player.velocity.y = Math.sin( (player.rotation-90)*(Math.PI/180))*player.speed;
    player.rotation = Math.atan(player.velocity.x/10,player.velocity.y/10)*(180/Math.PI)
    //UPDATE PLAYER
    player.position.x += player.velocity.x;
    player.position.y += player.velocity.y;
    player.setAttribute("transform","translate("+player.position.x+","+player.position.y+") rotate("+player.rotation+")");

    //UPDATE CAMERA
    camera.velocity.y = ((camera.target.position.y-camera.position.y-camera.targetOffset.y))/20;
    camera.position.y +=  camera.velocity.y;
    camera.setAttribute("transform","translate(0,"+(-camera.position.y)+")");

    //COLLISION
    for (let i = 0; i < collider.children.length; i++) 
    {
        if(collisionCheck(collider.children[i],150))
        {
            crash(collider.children[i]);
        }

        if(collisionCheck(collider.children[i].flower,80))
        {
            collect(collider.children[i].flower);
        }

        if( collider.children[i].position.y-1400 > camera.position.y)
        {
            //TODO:CALCUATE STEP SIZE AND PLACE ACCORDINGLY WITH RANDOM VARIATION
            // collider.children[i].position.y -= (2500+Math.random()*-500)
            collider.children[i].position.y -= 2000;
            collider.children[i].position.x =  Math.random()*768;
            collider.children[i].setAttribute("transform","translate("+ collider.children[i].position.x+","+ collider.children[i].position.y +") scale("+Math.sign(Math.random()-0.5)+",1)");

            placeFlower(collider.children[i]);
        }

        //UPDATE FLOWER (SIN)
        // collider.children[i].flower.position.y += Math.sin((i+1)*runningTime*.03);
        // collider.children[i].flower.setAttribute("transform","translate("+ collider.children[i].flower.position.x+","+ collider.children[i].flower.position.y +")");
    }


    //BG LOOP
    for (let i = 0; i < bgLoop.children.length; i++) 
    {
       if( bgLoop.children[i].getAttribute('y')-1280 > camera.position.y)
       {
            bgLoop.children[i].setAttribute('y',Number(bgLoop.children[i].getAttribute('y'))-1500);
       }
    }

    Game.progress = Math.abs(camera.position.y/hive.position.y)*360;
    progressBar.setAttribute("width",Game.progress)
}
// Animation loop
function animate(){
    requestAnimationFrame(animate);
    // Render scene
    render(Date.now());
}

