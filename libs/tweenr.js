/////////
//VERSION:0.1
//https://mattperry.is/writing-code/how-to-write-a-tween -> CONCEPT
//https://github.com/jeremyckahn/shifty -> CODE CONCEPT
//https://raw.githubusercontent.com/chenglou/tween-functions/master/index.js -> EASING FUNCTIONS
//
////////
var isRunning = false;

function Tweenable(tween={
  from = {},
  to = {},
  duration = 300,
  ease = "linear",
  onUpdate
} = {}) {
  
  //ADD ALL POSSIBLE TRANSFORMS
  var latest = Object.assign({}, tween.from);
    isRunning = false;

  this.update = function(callback,currentTween){
    // const delta = tween.to - tween.from;
    const startTime = performance.now();
    requestAnimationFrame(update);

    isRunning = true;
    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / currentTween.duration, 1);

      //UPDATE ONLY VALUES THAT CHANGE
      for (const property in currentTween.to) 
      {
        // const delta = (tween.to[property] - tween.from[property]);
        latest[property] = currentTween.from[property] + easing[currentTween.ease](progress) * (currentTween.to[property] - currentTween.from[property]);
      }
      if (currentTween.onUpdate)
      {
        currentTween.onUpdate(latest)
      };
  
      if (progress < 1) {
        requestAnimationFrame(update);
      }
      else
      {
        isRunning = false;
        //CALL CALLBACK TO FINISH
        callback();
      };
    }
  }

  this.isRunning = function(){return isRunning;}

  this.tween = function(newTween = {from,to,duration,ease,onUpdate} = tween) 
  {
    if(newTween.from)
    {
      //NEW START POSITION
      for (const property in newTween.from) 
      {
        latest[property] = newTween.from[property];
      }
    }
    else
    {
      //APPLY CURRENT POS AS START POSITION
      newTween.from = {};
      for (const property in latest) 
      {
        newTween.from[property] = latest[property];
      }
    }

    for (const property in tween) 
    {
      newTween[property] = newTween[property]||tween[property];
    }

    return new Promise((resolve,reject) => { this.update(() => {resolve();},newTween)})
  }
}

var easing = {
  // no easing, no acceleration
  linear: t => {
   return t;
  },
  // accelerating from zero velocity
  easeInQuad: t => {
   return t * t;
  },
  // decelerating to zero velocity
  easeOutQuad: t => {
   return t * (2 - t);
  },
  // acceleration until halfway, then deceleration
  easeInOutQuad: t => {
   return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  },
  // accelerating from zero velocity
  easeInCubic: t => {
   return t * t * t;
  },
  // decelerating to zero velocity
  easeOutCubic: t => {
   return --t * t * t + 1;
  },
  // acceleration until halfway, then deceleration
  easeInOutCubic: t => {
   return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
  },
  // accelerating from zero velocity
  easeInQuart: t => {
   return t * t * t * t;
  },
  // decelerating to zero velocity
  easeOutQuart: t => {
   return 1 - --t * t * t * t;
  },
  // acceleration until halfway, then deceleration
  easeInOutQuart: t => {
   return t < 0.5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t;
  },
  // accelerating from zero velocity
  easeInQuint: t => {
   return t * t * t * t * t;
  },
  // decelerating to zero velocity
  easeOutQuint: t => {
   return 1 + --t * t * t * t * t;
  },
  // acceleration until halfway, then deceleration
  easeInOutQuint: t => {
   return t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * --t * t * t * t * t;
  }
 };