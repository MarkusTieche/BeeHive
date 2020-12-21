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
    progress:0,
    level:1,
}

var progressBar = document.getElementById("progressMask");
    progressBar.current = 0;
    progressBar.target = 0;
    progressBar.max = 335;

var tutorialFinger = document.getElementById("Finger");
    tutorialFinger.position = {x:0,y:0};

var player = document.getElementById("Player");
    player.body = document.getElementById("playerBody");
    player.body.position = {x:0,y:0};
    player.body.velocity = {x:0,y:0};
    player.alive = true;
    player.position = {x:viewBox.width/2,y:viewBox.height-400};
    player.velocity = {x:0,y:0};
    player.rotation = 0;
    player.speed = 0;
    player.wings = [document.getElementById("wingL"),document.getElementById("wingR")];

var hive = document.getElementById("Hive");
    hive.body = document.getElementById("hiveBody")
    hive.body.setAttribute("transform","translate("+60 +","+60+")");
    hive.position = {x:0,y:0};
    hive.tweenable = new Tweenable({
        from: {scale:1},
        to: {scale:1.2},
        ease:"easeOutQuad",
        duration: 100,
        onUpdate: ({scale}) => {
            hive.body.setAttribute("transform","translate("+60 +","+60 +") scale("+scale+")");
        }
    });

var camera = document.getElementById("Level");
    camera.velocity = {x:0,y:0};
    camera.position = {x:0,y:0};
    camera.targetOffset = {x:viewBox.width/2,y:1280-400};
    camera.target = player;

var bgLoop = document.getElementById("bgLoop");

var collider = document.getElementById("Collider");
    collider.lastPos = {x:0,y:0};
    collider.stepSize = 400;
    collider.current = null;
    collider.tweenable  =  new Tweenable({
        from: {scale:1},
        to: {scale:1.1},
        ease:"easeOutQuad",
        duration: 100,
        onUpdate: ({scale}) => {
            collider.current.children[2].setAttribute("transform","scale("+scale+")");
            collider.current.children[3].setAttribute("transform","scale("+scale+")");
        }
    });
var trees =  document.getElementById("trees");

var collectables =  document.getElementById("Collectables");
var flower = document.getElementById("flower");

var transition = document.getElementById("Transition");
    transition.style.display = "none";
    transition.mask = document.getElementById("transitionMask");
    transition.tweenable = new Tweenable({
        from: {scale:80},
        to: {scale:1.5},
        ease:"easeOutQuad",
        duration: 1000,
        onUpdate: ({scale}) => {
          transition.mask.setAttribute("transform","translate("+768*0.5 +","+1280*0.5 +") scale("+scale+")");
        }
    });

var particles;
var particlePath;

init(); 
function init()
{
    // var scale=.5;

    //ADD TREES
    for (let i = 0; i < 5; i++) {

        var clone = trees.children[0].cloneNode(true);

            clone.flower = flower.cloneNode(true);
            collectables.appendChild(clone.flower);
            collider.appendChild(clone);
    }

    var particle = document.createElementNS("http://www.w3.org/2000/svg", 'circle');
        particle.setAttributeNS(null, 'cx', 0);
        particle.setAttributeNS(null, 'cy', 0);
        particle.setAttributeNS(null, 'r', 10);
        particle.setAttributeNS(null, 'fill', "#ede024");
        particle.setAttribute('visibility', 'hidden');

    particles = new particleSystem(document.getElementById("Particle"),particle,20);
    particle.setAttributeNS(null, 'fill', "#fff");
    particlePath = new particleSystem(document.getElementById("ParticlePath"),particle,20);
    particlePath.lastPos = {x:0,y:0}
    //SET GUI
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
        transition.mask.setAttribute("transform","translate("+768*0.5 +","+1280*0.5 +") scale("+1.5+")");
        transition.tweenable.tween({to:{scale:80},duration:1000}).then(()=>{ transition.style.display = "none";});
        transition.mask.style.display = "block";
    }   
}

function initLevel()
{
    player.style.visibility = "visible";
    player.body.position = {x:0,y:-30};
    player.body.setAttribute("transform","translate("+  player.body.position.x+","+  player.body.position.y +")");

    collider.lastPos = {x:0,y:700};
    inputDiv.onmousedown = inputDiv.ontouchstart  = startGame;
    
    //SET OBSTACLES
    for (let i = 0; i < collider.children.length; i++) 
    {
        // collider.children[i].position = {x:Math.random()*768,y:collider.lastPos.y-(100+Math.random()*500)};
        collider.children[i].position = {x:Math.random()*768,y:collider.lastPos.y-(collider.children.length*collider.stepSize)+i*collider.stepSize};
        collider.children[i].setAttribute("transform","translate("+ collider.children[i].position.x+","+ collider.children[i].position.y +") scale("+Math.sign(Math.random()-0.5)+",1)");
        placeFlower(collider.children[i]);
    }
    collider.lastPos.y = collider.children[0].position.y;

    //SET BG
    for (let i = 0; i < bgLoop.children.length; i++) 
    {
        bgLoop.children[i].position = {x:0,y:0};
        bgLoop.children[i].setAttribute("transform","translate("+ bgLoop.children[i].position.x+","+ bgLoop.children[i].position.y +")");
        // bgLoop.children[i].setAttribute('y',Number(500*i));
    }

    //SET HIVE
    Game.progress = 0;
    progressBar.current = 0;
    progressBar.target = 0;
    hive.position = {x:-10000,y:-Infinity};
    hive.setAttribute("transform","translate("+ hive.position.x+","+ 0 +")");

    document.getElementById("levelText").innerHTML = Game.level;
}

function resetLevel()
{

    player.position = {x:viewBox.width/2,y:viewBox.height-400};

    input.position.x = player.position.x;
    camera.position = {x:0,y:0};
    Game.running = false;
    player.alive = true;

    tutorialFinger.style.visibility = "visible";
    player.speed = 0;


    initLevel();
    sceneTransition();
}

function finishLevel()
{
    // console.log("finish")
    hive.tweenable.tween().then(() => hive.tweenable.tween({to:{scale:1},duration:100}));
    var pos = {x:hive.position.x+60,y:hive.position.y+60}
    for (let i = 0; i <20; i++) {
        particles.spawn({position:pos,velocity:{x:Math.random()*8-4,y:Math.random()*8-4},life:50,opacity:{start:1,end:0},scale:{start:10+Math.random()*5,end:1}})
    }

    player.style.visibility = "hidden";

    player.speed = 0;
    player.alive = false;

    inputDiv.onmousedown = inputDiv.ontouchstart = null;
    inputDiv.onmousemove = inputDiv.ontouchmove = null;
    inputDiv.onmouseup = inputDiv.ontouchend = null;

    Game.level +=1;
    setTimeout(sceneTransition,500);
    setTimeout(resetLevel,2000);
}

function startGame(e)
{
    tutorialFinger.style.visibility = "hidden";
    Game.running = true;

    player.speed = 8;
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

        input.position.x -= input.delta.x *1.5;
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
    console.log("crash")
    player.speed = 0;
    player.alive = false;

    Game.progress = 0;
    progressBar.target = 0;

    player.velocity.y = player.velocity.y*Math.sign(collider.position.y-player.position.y);
    input.position.x = player.position.x+player.velocity.x*-10;

    inputDiv.onmousedown = inputDiv.ontouchstart = null;
    inputDiv.onmousemove = inputDiv.ontouchmove = null;
    inputDiv.onmouseup = inputDiv.ontouchend = null;

    setTimeout(sceneTransition,1000);
    setTimeout(resetLevel,2500);
}

function collect(flower)
{
    if(flower.style.visibility == "hidden"){return};
    flower.style.visibility = "hidden";


    if( Game.progress >= 335)
    {
        //PLACE HIVE
        Game.progress = 0;
        hive.position = {x:768/2,y:player.position.y-2000};
        hive.setAttribute("transform","translate("+ hive.position.x+","+ hive.position.y +")");
    }
    else
    {
        //TODO: IMPLEMENT LEVEL HERE
        Game.progress = Math.max(10,Game.progress+(40-Game.level));
        progressBar.target =  Math.max(10,progressBar.target+(40-Game.level));
    }

    
    for (let i = 0; i <6; i++) {
        particles.spawn({position:flower.position,velocity:{x:Math.random()*8-4,y:Math.random()*8-4},life:50,opacity:{start:1,end:0},scale:{start:10+Math.random()*5,end:1}})
    }
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

function checkCollision()
{
    //COLLISION
    for (let i = 0; i < collider.children.length; i++) 
    {
        if(collisionCheck(collider.children[i],150))
        {
            collider.current = collider.children[i];
            collider.tweenable.tween().then(() => collider.tweenable.tween({to:{scale:1},duration:100}));

            crash(collider.children[i]);
        }

        if(collisionCheck(collider.children[i].flower,80))
        {
            collect(collider.children[i].flower);
        }

        if( camera.position.y > hive.position.y+collider.stepSize*3){

            if( collider.children[i].position.y-1600 > camera.position.y)
                {
                    collider.lastPos.y = collider.lastPos.y-collider.stepSize;
                    collider.children[i].position.y = collider.lastPos.y-Math.random()*200
                    collider.children[i].position.x =  Math.random()*768;
                    collider.children[i].setAttribute("transform","translate("+ collider.children[i].position.x+","+ collider.children[i].position.y +") scale("+Math.sign(Math.random()-0.5)+",1)");

                    placeFlower(collider.children[i]);
                }
        }

        //UPDATE FLOWER (SIN)
        // collider.children[i].flower.position.y += Math.sin((i+1)*runningTime*.03);
        // collider.children[i].flower.setAttribute("transform","translate("+ collider.children[i].flower.position.x+","+ collider.children[i].flower.position.y +")");
    }

    if(collisionCheck(hive,150))
    {
        finishLevel(hive);
    }
}

function render(time)
{
    //BASIC
    dt = (time-lastTick)*.06;
    lastTick = time;
    runningTime += dt;
    
    debugFPS.innerHTML = Math.ceil(60/dt);

    if(player.alive)
    {

        //UPDATE WINGS
        for (let i = 0; i <  player.wings.length; i++) {
            player.wings[i].setAttribute("transform","rotate("+Math.abs(Math.sin(runningTime*.2)*300/6)*Math.sign(0.5-i)+")");
        }

        //OUT OF BOUNDS
        if(player.position.y < camera.position.y-300)
        {
           crash(player)
        };

        player.velocity.y = Math.sin((player.rotation-90)*(Math.PI/180))*player.speed;
        checkCollision();
    }
    else
    {
        player.velocity.y *= 0.93;
        player.body.velocity.y += 0.2;
        player.body.position.y += player.body.velocity.y;
        particlePath.lastPos.x = player.position.x;
        particlePath.lastPos.y = player.position.y;
       
        if(player.body.position.y > 0)
        {
            if(player.body.velocity.y > 1)
            {
                player.body.velocity.y *= -0.7;
            }
            else
            {
                player.body.velocity.y = 0;
                player.body.position.y = 0;
            }
        }

        player.body.setAttribute("transform","translate("+  player.body.position.x+","+  player.body.position.y +")");
    }

    if(!Game.running)
    {
        particlePath.lastPos.x = player.position.x
        particlePath.lastPos.y = player.position.y
        //GAME NOT RUNNING SHOW TUTORIAL
        tutorialFinger.position.x = Math.sin(runningTime*.03)*300/2;
        tutorialFinger.setAttribute("transform","translate("+ tutorialFinger.position.x +",0)");
        input.position.x = tutorialFinger.position.x+viewBox.width/2
    }

    
    player.velocity.x = (input.position.x-player.position.x)/30;
    player.rotation = Math.atan(player.velocity.x/10,player.velocity.y/10)*(180/Math.PI);
    
    //UPDATE PLAYER
    player.position.x += player.velocity.x;
    player.position.y += player.velocity.y;
    player.setAttribute("transform","translate("+player.position.x+","+player.position.y+") rotate("+player.rotation+")");

    //UPDATE CAMERA
    camera.velocity.y = ((camera.target.position.y-camera.position.y-camera.targetOffset.y))/20;
    camera.velocity.x = ((camera.target.position.x-camera.position.x-camera.targetOffset.x))/2;
    camera.position.y =  Math.max(camera.position.y + camera.velocity.y,hive.position.y-400);
    camera.position.x =   camera.velocity.x;
    camera.setAttribute("transform","translate("+(-camera.position.x)+","+(-camera.position.y)+")");


    //BG LOOP
    for (let i = 0; i < bgLoop.children.length; i++) 
    {
       if( bgLoop.children[i].getBBox().y+bgLoop.children[i].position.y-1500 > camera.position.y)
       {
            bgLoop.children[i].position.y -= 2000;
            bgLoop.children[i].setAttribute("transform","translate("+ bgLoop.children[i].position.x+","+ bgLoop.children[i].position.y +")");
            // bgLoop.children[i].setAttribute('y',Number(bgLoop.children[i].getAttribute('y'))-1500);
       }
    }

    // Game.progress = Math.abs(camera.position.y/hive.position.y)*360;
    // progressBar.setAttribute("width",Game.progress);

    //UPDATE PROGRESSBAR
    progressBar.current += Number((( progressBar.target-progressBar.current)/10).toFixed())
    progressBar.setAttribute("width", progressBar.current);

    //PARTICLE PATH
    if(Math.hypot(particlePath.lastPos.x-player.position.x,particlePath.lastPos.y-player.position.y)>80)
    {
        particlePath.spawn({position:player.position,scale:{start:10,end:5},opacity:{start:0.8,end:0.8},velocity:{x:0,y:0},life:50});
        particlePath.lastPos.x = player.position.x;
        particlePath.lastPos.y = player.position.y;
    }

    particles.update(dt);
    particlePath.update(dt);
}
// Animation loop
function animate(){
    requestAnimationFrame(animate);
    // Render scene
    render(Date.now());
}

