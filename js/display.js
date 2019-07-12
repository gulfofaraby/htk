(function() {

  "use strict";

  let dbRoot = firebase.firestore();
  let db = dbRoot.collection('toolkit');
  let dbVisuals = db.doc('visuals');
  // let dbAudio = db.doc('audio');
  let dbAudioDiscrete = db.doc('audioDiscrete');
  let div1 = document.querySelector('.div1');
  let div2 = document.querySelector('.div2');
  let div3 = document.querySelector('.div3');
  let body = document.querySelector('body');
  let mStick;
  let mContainer;
  let chaser;
  let splotches;
  let colorsZ = 0;
  let pendingMetroSpeedChange = 0;
  let metroClick = [
    new Audio('audio/metro.wav'),
    new Audio('audio/metro.wav')
  ];
  let pointsSound = [
    new Audio('audio/points.wav'),
    new Audio('audio/points.wav')
  ];
  pointsSound.forEach(function(sound) {
    sound.volume = 0.5;
  });
  let snap = [
    new Audio('audio/snap.wav'),
    new Audio('audio/snap.wav')
  ];

  let noiseEnv = new Tone.AmplitudeEnvelope(.1,.2,1,.8).toMaster();
  let noiseTrem = new Tone.Tremolo(.25, 1).connect(noiseEnv);
  noiseTrem.wet.value = 1;
  noiseTrem.spread = 180;
  let noise = new Tone.Noise('brown').connect(noiseTrem);
  // musicBox = new Tone.Player('audio/musicbox.mp3'),
  // noise.fadeIn = 2;
  // noise.fadeOut = 2;
  let tone2Env = new Tone.AmplitudeEnvelope(.1,.2,1,.8).toMaster();
  let tone2Trem = new Tone.Tremolo(4, 1).connect(tone2Env);
  tone2Trem.wet.value = 1;
  let tone2 = new Tone.Oscillator(440, 'sine').connect(tone2Trem);

  // let tone1Trem = new Tone.Tremolo(4, 1).toMaster();
  // tone1Trem.wet.value = 1;
  // let tone1 = new Tone.Oscillator(440, 'sine').connect(tone1Trem);


  // let tone1Trem = new Tone.Tremolo(4, 1).toMaster();
  // tone1Trem.wet.value = 1;
  // let tone1Env = new Tone.AmplitudeEnvelope(.2,.2,1,.8).connect(tone1Trem);
  // let tone1 = new Tone.Oscillator(440, 'sine').connect(tone1Env);

  let tone1Env = new Tone.AmplitudeEnvelope(.1,.2,1,.8).toMaster();
  let tone1Trem = new Tone.Tremolo(4, 1).connect(tone1Env);
  tone1Trem.wet.value = 1;
  let tone1 = new Tone.Oscillator(440, 'sine').connect(tone1Trem);



    // let tone1 = new Tone.Synth().connect(tone1Trem);
  // tone1.oscillator.type = 'sine';
  //fadeIn / fadeOut didn't work
  // tone1.fadeIn = 2;
  // tone1.fadeOut = 2;

      // musicBox.loop = true;
  let visuals = {
      stim: 'none',
      speed: 0,
      delta: 0,
      colors: ['white']
  };
  // let audios = {
  //     noise: false,
  //     oscillator: false,
  //     musicBox: false
  // }
  let gifDisplay;
  let volSlider = document.getElementById('volSlider');

  volSlider.oninput = changeVol;

  changeVol();

  function changeVol() {
    Tone.Master.volume.value = volSlider.valueAsNumber;
    console.log(`slider: ${volSlider.valueAsNumber}, tone.master: ${Tone.Master.volume.value}`);
  }


  dbVisuals.onSnapshot(visUpdate);
  // dbAudio.onSnapshot(audUpdate);
  dbAudioDiscrete.onSnapshot(audDiscreteUpdate);
  db.doc('noise').onSnapshot(noiseUpdate);
  // db.doc('musicBox').onSnapshot(musicBoxUpdate);
  db.doc('tone1').onSnapshot(tone1Update);
  db.doc('tone2').onSnapshot(tone2Update);


  
  function audDiscreteUpdate(snapshot) {
    let sound = {};
    Object.assign(sound, snapshot.data());
    if (sound.snap) {
      snap[0].play();
      snap.push(snap.shift());
      dbAudioDiscrete.update({snap: false});
    } else if (sound.points) {
      pointsSound[0].play();
      pointsSound.push(pointsSound.shift());
      dbAudioDiscrete.update({points: false});
    }
  }


  function visUpdate(snapshot) {
    let prevVis = {};
    let newVis = {};
    Object.assign(prevVis, visuals);
    Object.assign(newVis, snapshot.data());
    if (newVis.speed != visuals.speed) {
      if (visuals.delta > 0) {
      //do something about previous delta
         //one solution might be to make them both global variables, such that when values change
         //the delta function suddenly reaches its goal
         //in which case this if statement prob wouldn't be necessary / the best way of doing this
      }
      if (newVis.delta > 0) {
        let multiplier = (newVis.speed - visuals.speed)/newVis.delta;
        //await that newVis.speed = visuals.speed has executed, then run visDelta(newVis.speed);
        setTimeout(visDelta, 10, multiplier, newVis.speed);
        newVis.speed = visuals.speed;
        // function() {
        //   mStick.style.animation = 'metronome ' + newVis.speed/1000 + 's ease-in-out infinite alternate-reverse';
        // }
      }
    }
    Object.assign(visuals, newVis);
    if (visuals.stim != 'metronome' && prevVis.stim == 'metronome') { metroOff(); }
    else if (visuals.stim != 'colorsLights' && prevVis.stim == 'colorsLights') { colorsLights(false); }
    else if (visuals.stim != 'chaser' && prevVis.stim == 'chaser') { chaser.remove() }
    else if (prevVis.stim.substring(0,3) == 'gif' && prevVis.stim != visuals.stim) { gifDisplay.remove(); }
    if (visuals.stim == 'flasher' && prevVis.stim != 'flasher') { flash(); }
    else if (visuals.stim == 'metronome') {
      if (prevVis.stim != 'metronome') { metroOn(); }
      else if (visuals.speed != prevVis.speed) { metroSetSpeed(); }
    }
    else if (visuals.stim == 'chaser') {
      if (prevVis.stim != 'chaser') { chaserOn(); }
      else if (visuals.speed != prevVis.speed) { chaserSetSpeed(); }
    }
    else if (visuals.stim.substring(0,3) == 'gif' && prevVis.stim != visuals.stim) {
      gifDisplay = new Image();
      gifDisplay.src = 'images/' + visuals.stim + '.gif';
      gifDisplay.id = visuals.stim;
      div1.appendChild(gifDisplay);
      gifDisplay = document.getElementById(visuals.stim);
    }
    else if (visuals.stim == 'colorsLights' && prevVis.stim != 'colorsLights') {
      colorsLights(true, visuals.speed);
    }
  }

  function visDelta(multiplier, targetSpeed) {
    visuals.speed *= 1 + multiplier;
    if ((targetSpeed - visuals.speed)*multiplier <= 0) {
      visuals.speed = targetSpeed;
      visuals.delta = 0;
      if (visuals.stim == 'metronome') { metroSetSpeed(); }
      if (visuals.stim == 'chaser') { chaserSetSpeed(); }
    } else {
      if (visuals.stim == 'metronome') { metroSetSpeed(); }
      if (visuals.stim == 'chaser') { chaserSetSpeed(); }
      setTimeout(visDelta, visuals.speed, multiplier, targetSpeed);
    }
  }

/*   function noiseUpdate(snapshot) {
    if (snapshot.data().on) {
      if (noise.state != 'started') { noise.start().connect(Tone.Master); }
      if (snapshot.data().volume != noise.volume.value) { noise.volume.value = snapshot.data().volume; } 
      // if (snapshot.data().pan && noiseTrem.state != 'started') {
      //   noiseTrem.start();
      // } else if (!snapshot.data().pan && noiseTrem.state == 'started') {
      //   noiseTrem.stop();
      // }

    } else if (noise.state == 'started') {
      noise.stop();
     }
  }
 */

  
  function noiseUpdate(snapshot) {
    if (snapshot.data().on) {
      if (noise.state != 'started')  {
        noise.start();
        noiseEnv.triggerAttack();
      }
      if (snapshot.data().trem.on) {
        noiseTrem.start();
        noiseTrem.type = snapshot.data().trem.type;
        noiseTrem.frequency.value = snapshot.data().trem.freq;
        noiseTrem.spread = snapshot.data().trem.spread;
      } else {
        noiseTrem.stop();
      }
    noise.volume.value = snapshot.data().volume;
    } else if (noise.state == 'started') {
      noiseEnv.triggerRelease();
      setTimeout(noiseStop, 500);
    }
  }

  function noiseStop() {
    noise.stop();
  }  
  
  function tone1Update(snapshot) {
    if (snapshot.data().on) {
      console.log(tone1Trem.state);
      if (tone1.state != 'started')  {
        tone1.start();
        tone1Env.triggerAttack();
      }
      if (snapshot.data().trem.on) {
        tone1Trem.start();
        tone1Trem.type = snapshot.data().trem.type;
        tone1Trem.frequency.value = snapshot.data().trem.freq;
        tone1Trem.spread = snapshot.data().trem.spread;
      } else {
        tone1Trem.stop();
      }
    tone1.volume.value = snapshot.data().volume;
    tone1.frequency.value = snapshot.data().freq;
    } else if (tone1.state == 'started') {
      tone1Env.triggerRelease();
      setTimeout(tone1Stop, 500);
    }
  }

  function tone1Stop() {
    tone1.stop();
  }

  function tone2Update(snapshot) {
    if (snapshot.data().on) {
      console.log(tone2Trem.state);
      if (tone2.state != 'started')  {
        tone2.start();
        tone2Env.triggerAttack();
      }
      if (snapshot.data().trem.on) {
        tone2Trem.start();
        tone2Trem.type = snapshot.data().trem.type;
        tone2Trem.frequency.value = snapshot.data().trem.freq;
        tone2Trem.spread = snapshot.data().trem.spread;
      } else {
        tone2Trem.stop();
      }
    tone2.volume.value = snapshot.data().volume;
    tone2.frequency.value = snapshot.data().freq;
    } else if (tone2.state == 'started') {
      tone2Env.triggerRelease();
      setTimeout(tone2Stop, 500);
    }
  }

  function tone2Stop() {
    tone2.stop();
  }

  // function tone2Update(snapshot) {
  //   if (snapshot.data().on) {
  //     if (tone2.state != 'started') { tone2.start().connect(Tone.Master); }
  //     if (snapshot.data().volume != tone2.volume.value) { tone2.volume.value = snapshot.data().volume; } 
  //     if (snapshot.data().freq != tone2.frequency.value) { tone2.frequency.value = snapshot.data().freq; } 
  //   } else if (tone2.state == 'started') {
  //     tone2.stop();
  //    }
  // }

  // function tone1Update(snapshot) {
  //   if (snapshot.data().on) {
  //     if (tone1.state != 'started')  {
  //       tone1.start();
  //     }
  //     if (snapshot.data().pan && tone1Trem.state != 'started') {
  //       tone1Trem.start();
  //     } else if (!snapshot.data().pan && tone1Trem.state == 'started') {
  //       tone1Trem.stop();
  //     }
  //     if (snapshot.data().volume != tone1.volume.value) { tone1.volume.value = snapshot.data().volume; } 
  //     if (snapshot.data().freq != tone1.frequency.value) { tone1.frequency.value = snapshot.data().freq; } 
  //   } else if (tone1.state == 'started') {
  //     tone1.stop();
  //    }
  // }




/*   function musicBoxUpdate(snapshot) {
    if (snapshot.data().on) {
      if (musicBox.state != 'started') { 
       musicBox.start().connect(Tone.Master); }
      if (snapshot.data().volume != musicBox.volume.value) { musicBox.volume.value = snapshot.data().volume; } 
    } else if (musicBox.state == 'started') {
      musicBox.stop();
     }
  }
 */

  // function audUpdate(snapshot) {
  //   let prevAud = {};
  //   Object.assign(prevAud, audios);
  //   Object.assign(audios, snapshot.data());
  //   if (audios.oscillator && !prevAud.oscillator) { oscillator.play();
  //   } else if (!audios.oscillator && prevAud.oscillator) { oscillator.pause(); }
  //   if (audios.musicBox && !prevAud.musicBox) { musicBox.play();
  //   } else if (!audios.musicBox && prevAud.musicBox) { musicBox.pause(); }
  // }
  
  // function spiral1On() {
  //   spiral1 = document.createElement('canvas');
  //   spiral1.setAttribute('id', 'canvas');
  //   spiral1.setAttribute('width', '1920');
  //   spiral1.setAttribute('height', '937');
  //   div1.appendChild(spiral1);
  //   spiral1Start();
  // }

  // function spiral1Off() {
  //   spiral1.remove();
  // }
 
  //possible params for blinking light
// blink([{dur: 500, params: {background: 'radial-gradient(circle,white,rgb(10, 35, 60) 30%,transparent 50%)',transform:'scale(.05'}}, {params: {background: 'black'}}]);


  function flash() {
    blink([{dur: 50, params: {background: 'radial-gradient(circle,white,10%,rgb(10, 35, 60),transparent)'}}, {params: {background: 'black'}}]);
    if (visuals.stim == 'flasher') {
      setTimeout(flash, visuals.speed);
    }
  }

  function metroOn() {
    div1.style.background = 'radial-gradient(#777, #000 50%)';
    div1.style.display = 'block';
    //div1.style.justifyContent = div1.style.alignItems = null;

    mContainer = document.createElement('div');
    mStick = document.createElement('div');
    let mBody = document.createElement('div'),
        mBase = document.createElement('div'),
        mTempo = document.createElement('div');

    mContainer.className = 'm-container';
    mBody.className = 'm-body';
    mBase.className = 'm-base';
    mTempo.className = 'm-tempo';
    mStick.className = 'm-stick';

    mBase.appendChild(mTempo);
    mBody.appendChild(mBase);
    mContainer.appendChild(mBody);
    mContainer.appendChild(mStick);
   
    div1.appendChild(mContainer);

    metroForthAnim = mStick.animate([
      {transform: 'rotate(-35deg)'},
      {transform: 'rotate(35deg)'}
      ],{
      duration: 1000,
      easing:'ease-in-out'
      // fill: 'forwards'
    });
    metroForthAnim.pause();

    metroBackAnim = mStick.animate([
      {transform: 'rotate(35deg)'},
      {transform: 'rotate(-35deg)'}
      ],{
      duration: 1000,
      easing:'ease-in-out'
      // fill: 'forwards'
    });

    metroSetSpeed();

    metroBackAnim.onfinish = metroForth;
    metroForthAnim.onfinish = metroBack;
  }

  let metroForthAnim;
  let metroBackAnim;

    // metroSetSpeed();

    // mStick.style.animationDuration = visuals.speed/1000 + 's';
    // mStick.style.animationPlayState = 'running';
    // metroSetSpeed(visuals.speed);
    // mStick.addEventListener('animationiteration', metroIterate);

    // metroAnimation.onfinish = metroIterate;


  // let metroForthFrames = [
  //   {transform: 'rotate(-35deg)'},
  //   {transform: 'rotate(35deg)'}
  // ];
  // let metroBackFrames = [
  //   {transform: 'rotate(35deg)'},
  //   {transform: 'rotate(-35deg)'}
  // ];


  function metroBack() {
    metroBackAnim.play();
    metroClick[0].play();
    metroClick.push(metroClick.shift());
  }

  function metroForth() {
    metroForthAnim.play();
    metroClick[0].play();
    metroClick.push(metroClick.shift());
  }
  

  function metroSetSpeed() {
    metroBackAnim.playbackRate = 1000/visuals.speed;
    metroForthAnim.playbackRate = 1000/visuals.speed;

    // mStick.addEventListener('onanimationiteration', function() {
      // mStick.style.animationDuration = visuals.speed/1000 + 's';
      // pendingMetroSpeedChange = 1;
    // }, {once:true});
  }

  function metroOff() {
    metroBackAnim.cancel();
    metroForthAnim.cancel();
    // mStick.style.animationPlayState = 'paused';
    mContainer.remove(); 
    div1.style.background = null;
    div1.style.display = 'flex';
  }

  
function colorsLights(start, time) {
  let n = 30,
    minSize = 500,
    maxSize = 1200;
  let t = time;
  let z = 0;
  let maxDiff = maxSize - minSize + 1;

  if (start) {
    div1.style.background = 'white';
    div1.style.minWidth = div1.style.maxWidth = div1.style.width = '750px';
    div1.style.height = '500px';
    changeScale();
    window.addEventListener('resize', changeScale);
    splotches = [];
    for (let i = 0; i < n; i++) {
      splotches[i] = new Splotch('s' + i);
      splotches[i].init((t/n)*i*-1);
    }
  } else {
    colorsZ = 0;
    splotches.forEach(function(thisSplotch) {
      thisSplotch.element.remove();
    });
    splotches = [];
    window.removeEventListener('resize', changeScale);
    div1.style.background = null;
    div1.style.width = div1.style.height = '100%';
    div1.style.maxWidth = div1.style.minWidth = null;
    div1.style.transform = null;
  }
  
  function Splotch(id) {
    this.id = id;
    this.first = true;
    this.element;
    this.init = function(delay) {
      let newDiv = document.createElement('div');
      newDiv.className = 'splotch';
      newDiv.id = this.id;
      newDiv.style.animationDuration = t + 's';
      newDiv.style.animationDelay = delay + 's';
      div1.appendChild(newDiv);
      this.element = document.getElementById(this.id);
      // this.onanimationiteration = function() {
      //   this.update();
      // }
      addListener(this);
      this.update();
    }
    this.update = function() {
      if (!this.first) {
        this.element.style.animationDelay = 0;
      }
      let r = Math.floor(Math.random()*256),
        g = Math.floor(Math.random()*256),
        b = Math.floor(Math.random()*256);
      while (Math.max(r,g,b) < 200 || Math.min(r,g,b) > 160 || Math.max(r,g,b) - Math.min(r,g,b) < 30) {
        r = Math.floor(Math.random()*256);
        g = Math.floor(Math.random()*256);
        b = Math.floor(Math.random()*256);
      }
      let randLeft = Math.floor(Math.random()*131 - 15) + '%',
          randTop = Math.floor(Math.random()*131 - 15) + '%',
          randSize = (Math.floor(Math.random()*maxDiff) + minSize) + 'px',
          randColor = 'rgba(' + r +',' + g + ',' + b + ',.8)';  
      this.element.style.zIndex = z;
      this.element.style.width = this.element.style.height = randSize;
      this.element.style.left = randLeft;
      this.element.style.top = randTop;
      this.element.style.background = 'radial-gradient(' + randColor + ',30%,transparent 50%)';
      this.first = false;
      z--;
    }
  }
  
  function addListener(obj) {
    obj.element.addEventListener('animationiteration', function() {
      obj.update();
    });
  }

  function changeScale() {
    div1.style.transform = 'scale(' + Math.min(window.innerWidth/750,2) + ')';
  }

}

let chaserAnim;

function chaserOn() {
  chaser = document.createElement('div');
  chaser.className = 'chaser';
  div1.appendChild(chaser);
  chaserAnim = chaser.animate([
    {transform: 'translate(-48vw)'},
    // {transform: 'translate(0,1vh)'},
    {transform: 'translate(48vw)'},
  ],{
    duration:1000,
    iterations:Infinity,
    direction:'alternate',
    easing:'ease-in-out'
  });
  chaserSetSpeed();
  // chaserColorShift = chaser.animate([
  //   {background:'radial-gradient(circle,rgba(111, 111, 255, 1),15%,transparent 60%)'},
  //   {background:'radial-gradient(circle,rgba(183, 111, 183, 1),20%,transparent 70%)'},
  //   {background:'radial-gradient(circle,rgba(255, 111, 111, 1),15%,transparent 60%)'},
  //   {background:'radial-gradient(circle,rgba(183, 183, 111, 1),20%,transparent 70%)'},
  //   {background:'radial-gradient(circle,rgba(111, 255, 111, 1),15%,transparent 60%)'},
  //   {background:'radial-gradient(circle,rgba(111, 183, 183, 1),20%,transparent 70%)'},
  //   {background:'radial-gradient(circle,rgba(111, 111, 255, 1),15%,transparent 60%)'}
  // ],{
  //   duration:500, iterations:Infinity
  // });
  }



function chaserSetSpeed() {
  chaserAnim.playbackRate = 1000/visuals.speed;
  console.log(chaserAnim.playbackRate);
}

  function blink(textArray) {
    let cur = textArray.shift();
  //  window.requestAnimationFrame(function() {
  //    show(cur.text, cur.params, cur.div);
  //  });
    show(cur.text, cur.params, cur.div);
//      blinkTimeout += cur.dur;
    if (textArray[0] != undefined) setTimeout(blink, cur.dur, textArray);
//    } else {
//      container1.innerHTML = '';
//      return(blinkTimeout);
  }

  function show(text, params, container) {
    if (container == undefined) container = div1;
    if (params != undefined) Object.assign(container.style, params);
    if (text != undefined) container.innerHTML = text;
  }

  })();