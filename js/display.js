(function() {

  "use strict";

  let dbRoot = firebase.firestore();
  let db = dbRoot.collection('toolkit');
  let dbVisuals = db.doc('visuals');
  // let dbAudio = db.doc('audio');
  let dbAudioDiscrete = db.doc('audioDiscrete');
  let dbWords = db.doc('words');
  let div1 = document.querySelector('.div1');
  let div2 = document.querySelector('.div2');
  let div3 = document.querySelector('.div3');
  let div4 = document.querySelector('.div4');
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
  let noiseTrem = new Tone.Tremolo(2, .5).toMaster();
  noiseTrem.wet.value = 1;
  noiseTrem.type = 'sine';
  noiseTrem.spread = 0;
  let noise = new Tone.Noise('brown').connect(noiseTrem);
  // musicBox = new Tone.Player('audio/musicbox.mp3'),
  // noise.fadeIn = 2;
  // noise.fadeOut = 2;
  let tone2 = new Tone.Oscillator(440, 'sine');

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
  let words = {};
  words.on = false;

  let picsB = [];
  for (let step = 0; step < 6; step++) 
    picsB.push('img/b' + step + '.jpg');
  let picsL = [];
  for (let step = 0; step < 20; step++) 
    picsL.push('img/l' + step + '.jpg');
  let picsP = [];
  for (let step = 0; step < 24; step++) 
    picsP.push('img/p' + step + '.jpg');
  // let picsS = [];
//  for (let step = 0; step < 8; step++) 
//    picsS.push('s' + step + '.jpg');
  let picsV = [];
  for (let step = 0; step < 12; step++) 
    picsV.push('img/v' + step + '.jpg');
  let picsA = picsB.concat(picsL, picsP, picsV);
  let picsF = picsB.concat(picsP);
  let picsS = picsB.concat(picsL);


  dbVisuals.onSnapshot(visUpdate);
  // dbAudio.onSnapshot(audUpdate);
  dbAudioDiscrete.onSnapshot(audDiscreteUpdate);
  dbWords.onSnapshot(wordsUpdate);
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

  function wordsUpdate(snapshot) {
    if (snapshot.data().on && !words.on) {
      words.on = true;
      breedStart();
    } else if (!snapshot.data().on && words.on) {
      words.on = false;
      breedStmts = [];
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
        //   mStick.style.animation = 'metronome ' + newVis.speed/750 + 's ease-in-out infinite alternate-reverse';
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

  function noiseUpdate(snapshot) {
    if (snapshot.data().on) {
      if (noise.state != 'started') { noise.start().connect(Tone.Master); }
      if (snapshot.data().volume != noise.volume.value) { noise.volume.value = snapshot.data().volume; } 
      if (noiseTrem.state != 'started') {
        noiseTrem.start();
      // } else if (!snapshot.data().pan && noiseTrem.state == 'started') {
      //   noiseTrem.stop();
      }

    } else if (noise.state == 'started') {
      noise.stop();
     }
  }

  // let tone1Trem = new Tone.Tremolo(1, 0.5).toMaster().start();

  
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
      setTimeout(toneStop, 500);
    }
  }

  function toneStop() {
    tone1.stop();
  }

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

  function tone2Update(snapshot) {
    if (snapshot.data().on) {
      if (tone2.state != 'started') { tone2.start().connect(Tone.Master); }
      if (snapshot.data().volume != tone2.volume.value) { tone2.volume.value = snapshot.data().volume; } 
      if (snapshot.data().freq != tone2.frequency.value) { tone2.frequency.value = snapshot.data().freq; } 
    } else if (tone2.state == 'started') {
      tone2.stop();
     }
  }


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
      duration: 750,
      easing:'ease-in-out'
      // fill: 'forwards'
    });
    metroForthAnim.pause();

    metroBackAnim = mStick.animate([
      {transform: 'rotate(35deg)'},
      {transform: 'rotate(-35deg)'}
      ],{
      duration: 750,
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

    // mStick.style.animationDuration = visuals.speed/750 + 's';
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
    metroBackAnim.playbackRate = 750/visuals.speed;
    metroForthAnim.playbackRate = 750/visuals.speed;

    // mStick.addEventListener('onanimationiteration', function() {
      // mStick.style.animationDuration = visuals.speed/750 + 's';
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
    duration:750,
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

let relaxStmts = [
  {text: 'relax', dur: 150},
  {text: 'relax', dur: 150},
  {text: 'relax', dur: 50},
  {text: 'focus', dur: 150},
  {text: 'breathe', dur: 200},
  {text: 'relax', dur: 100},
  {text: '', dur: 2000},
  {text: 'relax', dur: 150},
  {text: 'relax', dur: 150},
  {text: 'relax', dur: 50},
  {text: 'focus', dur: 150},
  {text: 'breathe', dur: 200},
  {text: 'relax', dur: 100},
  {text: '', dur: 2000},
  {text: 'relax', dur: 150},
  {text: 'relax', dur: 150},
  {text: 'relax', dur: 50},
  {text: 'focus', dur: 150},
  {text: 'breathe', dur: 200},
  {text: 'relax', dur: 100},
  {text: '', dur: 2000},
  {text: 'relax', dur: 150},
  {text: 'relax', dur: 150},
  {text: 'relax', dur: 50},
  {text: 'focus', dur: 150},
  {text: 'breathe', dur: 200},
  {text: 'relax', dur: 100},
  {text: '', dur: 2000},
  {text: 'relax', dur: 150},
  {text: 'relax', dur: 150},
  {text: 'relax', dur: 50},
  {text: 'focus', dur: 150},
  {text: 'breathe', dur: 200},
  {text: 'relax', dur: 100},
  {text: '', dur: 2000},
  {text: 'relax', dur: 150},
  {text: 'relax', dur: 150},
  {text: 'relax', dur: 50},
  {text: 'focus', dur: 150},
  {text: 'breathe', dur: 200},
  {text: 'relax', dur: 100},
  {text: '', dur: 2000},
  {text: 'relax', dur: 150},
  {text: 'relax', dur: 150},
  {text: 'relax', dur: 50},
  {text: 'focus', dur: 150},
  {text: 'breathe', dur: 200},
  {text: 'relax', dur: 100},
  {text: '', dur: 2000},
  {text: 'relax', dur: 150},
  {text: 'relax', dur: 150},
  {text: 'relax', dur: 50},
  {text: 'focus', dur: 150},
  {text: 'breathe', dur: 200},
  {text: 'relax', dur: 100},
  {text: '', dur: 2000},
  {text: 'relax', dur: 150},
  {text: 'relax', dur: 150},
  {text: 'relax', dur: 50},
  {text: 'focus', dur: 150},
  {text: 'breathe', dur: 200},
  {text: 'relax', dur: 100},
  {text: '', dur: 2000},
  {text: 'relax', dur: 150},
  {text: 'relax', dur: 150},
  {text: 'relax', dur: 50},
  {text: 'focus', dur: 150},
  {text: 'breathe', dur: 200},
  {text: 'relax', dur: 100},
  {text: '', dur: 2000},
  {text: 'relax', dur: 150},
  {text: 'relax', dur: 150},
  {text: 'relax', dur: 50},
  {text: 'focus', dur: 150},
  {text: 'breathe', dur: 200},
  {text: 'relax', dur: 100},
  {text: '', dur: 2000},
  {text: 'relax', dur: 150},
  {text: 'relax', dur: 150},
  {text: 'relax', dur: 50},
  {text: 'focus', dur: 150},
  {text: 'breathe', dur: 200},
  {text: 'relax', dur: 100},
  {text: '', dur: 2000}
]
relaxStmts.forEach((stmt) => {
  stmt.text = '<div style="margin:80px">' + stmt.text + '</div><div style="margin:80px;">' + stmt.text + '</div>';
  stmt.params = {color:'rgba(240,150,210,.3)',fontSize:'24px'};
});


let breedStmts = [];
let breedFirst = true;
  function breedStart() {
    if (breedFirst) {
      breedStmts = [
        {text: 'an eager empty slut', dur: 750},
        {text: '', dur: 250},
        {text: 'makes a perfect pregnant peach', dur: 750},
        {text: '', dur: 250},
        {text: 'a bouncing breeding slut', dur: 750},
        {text: '', dur: 250},
        {text: 'makes a pleasing pregnant peach', dur: 750},
        {text: '', dur: 250},
        {text: 'a fertile breeding slut', dur: 750},
        {text: '', dur: 250},
        {text: 'makes a perfect pregnant peach', dur: 750},
        {text: '', dur: 500},
        // {text: 'empty head', dur: 750},
        // {text: '', dur: 250},
        // {text: 'full breasts', dur: 750},
        // {text: '', dur: 250},
        // {text: 'fuzzy mind', dur: 750},
        // {text: '', dur: 250},
        // {text: 'fertile body', dur: 750},
        // {text: '', dur: 250},
        // {text: 'empty head', dur: 750},
        // {text: '', dur: 250},
        // {text: 'eager body', dur: 750},
        // {text: '', dur: 250},
        // {text: 'fuzzy mind', dur: 750},
        // {text: '', dur: 250},
        // {text: 'ripe breasts', dur: 750},
        // {text: '', dur: 250},
        // {text: 'empty head', dur: 750},
        // {text: '', dur: 250},
        // {text: 'eager body', dur: 750},
        // {text: '', dur: 4000},
        {text: 'don\'t need to think', dur: 750},
        {text: '', dur: 250},
        {text: 'just need to breed', dur: 750},
        {text: '', dur: 250},
        {text: 'don\'t want to think', dur: 750},
        {text: '', dur: 250},
        {text: 'just need to breed', dur: 750},
        {text: '', dur: 250},
        {text: 'don\'t need to think', dur: 750},
        {text: '', dur: 250},
        {text: 'just hafta breed', dur: 750},
        {text: '', dur: 250},
        {text: 'don\'t wanna think', dur: 750},
        {text: '', dur: 250},
        {text: 'just need to breed', dur: 750},
        {text: '', dur: 500},
        {text: 'restart', fx: () => {breedStart();}}
      ];
      breedStmts.forEach((stmt) => {
        stmt.div = div3;
      });
      breedFirst = false;
    } else {
      breedStmts = [
        {text: 'an eager empty slut', dur: 750,
          img: {set: picsS, dur:250, num:6}
        },
        {text: '', dur: 1000},
        {text: 'makes a perfect pregnant peach', dur: 750,
          img: {set: picsP, dur:250, num:6}
        },
        {text: '', dur: 1000},
        {text: 'a bouncing breeding slut', dur: 750,
          img: {set: picsS, dur:250, num:6}
        },
        {text: '', dur: 1000},
        {text: 'makes a pleasing pregnant peach', dur: 750,
          img: {set: picsP, dur:250, num:6}
        },
        {text: '', dur: 1000},
        {text: 'a fertile breeding slut', dur: 750,
          img: {set: picsS, dur:250, num:6}
        },
        {text: '', dur: 1000},
        {text: 'makes a perfect pregnant peach', dur: 750,
          img: {set: picsP, dur:250, num:6}
        },
        {text: '', dur: 1250},
        {text: 'empty head', dur: 750,
          img: {set: picsV, dur:750, num:1}
        },
        {text: '', dur: 250},
        {text: 'full breasts', dur: 750,
          img: {set: picsB, dur:750, num:1}
        },
        {text: '', dur: 500},
        {text: 'fuzzy mind', dur: 750,
          img: {set: picsV, dur:750, num:1}
        },
        {text: '', dur: 250},
        {text: 'fertile body', dur: 750,
          img: {set: picsP, dur:750, num:1}
        },
        {text: '', dur: 500},
        {text: 'empty head', dur: 750,
          img: {set: picsV, dur:750, num:1}
        },
        {text: '', dur: 250},
        {text: 'eager body', dur: 750,
          img: {set: picsL, dur:750, num:1}
        },
        {text: '', dur: 500},
        {text: 'blank mind', dur: 750,
          img: {set: picsV, dur:750, num:1}
        },
        {text: '', dur: 250},
        {text: 'ripe breasts', dur: 750,
          img: {set: picsB, dur:750, num:1}
        },
        {text: '', dur: 500},
        {text: 'empty head', dur: 750,
          img: {set: picsV, dur:750, num:1}
        },
        {text: '', dur: 250},
        {text: 'eager body', dur: 750,
          img: {set: picsL, dur:750, num:1}  },
        {text: '', dur: 500},
        {text: 'don\'t need to think', dur: 750},
        {text: '', dur: 100,
          img: {set: picsV, dur:100, num:1}
        },
        {text: 'just need to breed', dur: 750},
        {text: '', dur: 250},
        {text: 'don\'t want to think', dur: 750},
        {text: '', dur: 100,
          img: {set: picsV, dur:100, num:1}
        },
        {text: 'just need to breed', dur: 750},
        {text: '', dur: 250},
        {text: 'don\'t need to think', dur: 750},
        {text: '', dur: 100,
          img: {set: picsV, dur:100, num:1}
        },
        {text: 'just hafta breed', dur: 750},
        {text: '', dur: 250},
        {text: 'don\'t wanna think', dur: 750},
        {text: '', dur: 100,
          img: {set: picsV, dur:100, num:1}
        },
        {text: 'just need to breed', dur: 750},
        {text: '', dur: 250},
        {text: 'don\'t hafta think', dur: 750},
        {text: '', dur: 100,
          img: {set: picsV, dur:100, num:1}
        },
        {text: 'just', dur: 500},
        {text: '', dur: 177},
        {text: 'fuck', dur: 333},
        {text: 'and', dur: 333},
        {text: 'breed', dur: 333},
        {text: 'and', dur: 333},
        {text: 'fuck', dur: 333},
        {text: 'and', dur: 333},
        {text: 'breed', dur: 333},
        {text: 'and', dur: 333},
        {text: 'bounce', dur: 333,
          img: {set:picsA, dur: (333/2), num: 34}  
        },
        {text: 'and', dur: 333},
        {text: 'breed', dur: 333},
        {text: 'and', dur: 333},
        {text: 'fuck', dur: 333},
        {text: 'and', dur: 333},
        {text: 'fuck', dur: 333},
        {text: 'and', dur: 333},
        {text: 'fuck', dur: 333},
        {text: 'and', dur: 333},
        {text: 'breed', dur: 333},
        {text: 'and', dur: 333},
        {text: 'bounce', dur: 333},
        {text: 'and', dur: 333},
        {text: 'breed', dur: 333},
        {text: 'and', dur: 333},
        {text: 'breed', dur: 333},
        {text: '', dur: 500},
        {text: 'with your legs spread', dur: 750,
          img: {set: picsL, dur:250, num:20}
        },
        {text: '', dur: 250},
        {text: 'you are ready to receive', dur: 750},
        {text: '', dur: 500},
        {text: 'with your legs spread', dur: 750},
        {text: '', dur: 250},
        {text: 'you are ready to receive', dur: 750},
        {text: '', dur: 500},
        {text: 'with your legs spread', dur: 750,
          img: {delay: 500, set: picsA, dur:250, num:32}
        },
        {text: '', dur: 250},
        {text: 'you are ready to receive', dur: 750},
        {text: '', dur: 500},
        {text: 'you are ready to receive', dur: 750},
        {text: '', dur: 500},
        {text: 'you are ready to receive', dur: 750},
        {text: '', dur: 500},
        {text: 'you are ready to receive', dur: 750},
        {text: '', dur: 500},
        {text: 'you are ready to receive', dur: 750},
        {text: '', dur: 500},
        {text: 'you are ready to receive', dur: 750},
        {text: '', dur: 500},
        {text: 'restart', fx: () => {breedStart();}}
      ];
      breedStmts.forEach((stmt) => {
        stmt.div = div3;
        stmt.params = {transform: 'translate(0,-100px)'}
      });
    }

    wordsBlink(breedStmts);
  }

  
  function wordsBlink(textArray) {
    if (words.on) {
      let cur = textArray.shift();
      if (cur.text != 'restart') {
        show(cur.text, cur.params, cur.div, cur.img);
        if (textArray[0]) setTimeout(wordsBlink, cur.dur, textArray);
      } else {
        cur.fx();
      }
    } else {
      div3.innerHTML = '';
    }
  }
  
function chaserSetSpeed() {
  chaserAnim.playbackRate = 750/visuals.speed;
  console.log(chaserAnim.playbackRate);
}

  function blink(textArray) {
    let cur = textArray.shift();
  //  window.requestAnimationFrame(function() {
  //    show(cur.text, cur.params, cur.div);
  //  });
    // if (words.state == 2) {
    // }
    if (cur.text == 'restart') {
      setTimeout(cur.fx, 500);
    } else {
      show(cur.text, cur.params, cur.div, cur.img);
//      blinkTimeout += cur.dur;
      if (textArray[0]) setTimeout(blink, cur.dur, textArray);
    }
//    } else {
//      container1.innerHTML = '';
//      return(blinkTimeout);
  }

  function show(text, params, container, img) {
    if (!container) container = div1;
    if (params) Object.assign(container.style, params);
    if (text !== undefined) container.innerHTML = text;
    if (img) handleImg(img);
  }

  function handleImg (img) {
    let imgs = [];
    let img0 = '';
    let img1Back = '';
    let img2Back = '';
    for (let i = 0; i < img.num; i++) {
      while (img0 == img1Back || img0 == img2Back) {
        img0 = img.set[Math.floor(Math.random()*img.set.length)];
      }
      imgs[i] = {
        text: `<img src="${img0}">`,
        dur: img.dur,
        div: div4
      };
      img2Back = img1Back;
      img1Back = img0;
    }
    imgs[img.num] = {
      text: '',
      div: div4
    };
    if (!img.delay) img.delay = 10;
    setTimeout(blink, img.delay, imgs);
  }

  })();