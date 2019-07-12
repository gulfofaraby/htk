(function() {

  "use strict";

  let dbRoot = firebase.firestore();
  let db = dbRoot.collection('toolkit');
  let dbVisuals = db.doc('visuals');
  let dbAudio = db.doc('audio');
  let dbAudioDiscrete = db.doc('audioDiscrete');
  // let visualPicker = document.getElementById('visPicker');
  let audioPicker = document.getElementById('audio');
  let visSpeed = new Control('visSpeed');
  let visDelta = new Control('visDelta');
  let visStim = new Control('visStim');
  let noiseVol = new Control('noiseVol');
  let noiseTremType = new Control('noiseTremType');
  noiseTremType.selected = 'sine';
  let noiseTremFreq = new Control('noiseTremFreq');
  let noiseTremSpread = new Control('noiseTremSpread');

  let noiseToggle = {};
  noiseToggle.on = document.getElementById('noiseOn');
  noiseToggle.off = document.getElementById('noiseOff');
  let noiseTremToggle = {};
  noiseTremToggle.on = document.getElementById('noiseTremOn');
  noiseTremToggle.off = document.getElementById('noiseTremOff');
  let visFeedMode = {};
  visFeedMode.monitor = document.getElementById('visMonitor');
  visFeedMode.preview = document.getElementById('visPreview');
  visFeedMode.off = document.getElementById('visFeedOff');
  let audFeedMode = {};
  audFeedMode.monitor = document.getElementById('audMonitor');
  audFeedMode.preview = document.getElementById('audPreview');
  audFeedMode.off = document.getElementById('audFeedOff');
  let visFeed = document.getElementById('visFeed');


/////////////////////
  let noiseEnv = new Tone.AmplitudeEnvelope(.2,.2,1,.8).toMaster();
  let noiseTrem = new Tone.Tremolo(4, 1).connect(noiseEnv);
  noiseTrem.wet.value = 1;
  let noise = new Tone.Noise('brown').connect(noiseTrem);


  /////////////////////
  let master1 = new Control('master1');
  master1.slider.oninput = master1Change;

  // let musicBoxVol = new Control('musicBoxVol');
  // let musicBoxRate = new Control('musicBoxRate');
  
  
  // let visStim.curr = document.getElementById('visStim.curr');
  // let visStim.new = document.getElementById('visStim.new');
  let visExecute = document.getElementById('visExecute');
  let visReset = document.getElementById('visReset');
  let audExecute = document.getElementById('audExecute');
  let audReset = document.getElementById('audReset');
  let snapBtn = document.getElementById('snap');
  let pointsBtn = document.getElementById('points');
  // let wordsToggle = document.getElementById('words');

  // let noiseToggle = document.getElementById("noiseToggle");
      // noise1Pan = document.getElementById("noisePan");
  // let tone1Toggle = document.getElementById("tone1Toggle");
  // let tone1TremToggle = document.getElementById("tone1TremToggle");
      // tone1Pan = document.getElementById("tone1Pan");
  // let tone2Toggle = document.getElementById("tone2"),
  //     tone2VolSlider = document.getElementById('tone2Vol'),
  //     tone2FreqSlider = document.getElementById('tone2Freq');
  let musicBoxToggle = document.getElementById("music-box");
  let gallery = document.getElementById('gallery');

  let visuals = {
    newStim: 'none',
    stim: 'none',
    speed: 1000,
    delta: 0,
    colors: ['white']
  };

  visExecute.onclick = visChange;
  visReset.onclick = visResetExec;
  visSpeed.slider.oninput = visSpeedUpdate;
  visDelta.slider.oninput = visDeltaUpdate;
  snapBtn.onmousedown = audDiscrete;
  pointsBtn.onmousedown = audDiscrete;
  noiseToggle.on.onclick = noiseOn;
  noiseToggle.off.onclick = noiseOff;
  noiseVol.slider.oninput = noiseVolChange;
  

  noiseTremToggle.on.onclick = noiseTremOn;
  noiseTremToggle.off.onclick = noiseTremOff;
  noiseTremFreq.slider.oninput = noiseTremFreqChange;
  noiseTremSpread.slider.oninput = noiseTremSpreadChange;
  // tone2VolSlider.onchange = tone2Change;
  // tone2Toggle.onclick = tone2Change;
  // tone2FreqSlider.onchange = tone2Change;
  // musicBoxToggle.onclick = musicBoxChange;
  // musicBoxVol.slider.onchange = musicBoxChange;
  gallery.onclick = pickVis;
  // wordsToggle.onclick = wordsChange;


  audExecute.onclick = audChange;
  noiseTremType.new.onchange = noiseTremTypeSelect;
  audReset.onclick = audResetExec;
  // visFeedMode.monitor.onclick = visMonitorOn;
  // visFeedMode.preview.onclick = visPreviewOn;
  // visFeedMode.off.onclick = visFeedOff;
  audFeedMode.monitor.onclick = audMonitorOn;
  audFeedMode.preview.onclick = audPreviewOn;
  audFeedMode.off.onclick = audFeedOff;


  
  function visMonitorOn() {
    //
  }

  function visPreviewOn() {
    //
  }

  function visFeedOff() {
    //
  }

  function audMonitorOn() {
    Tone.Master.mute = true;
    visFeed.src = 'display.html';
  }

  function audPreviewOn() {
    Tone.Master.mute = false;
    visFeed.src = 'blank.html';
  }

  function audFeedOff() {
    Tone.Master.mute = true;
    visFeed.src = 'blank.html';
  }



/*   noiseToggle.onclick = noiseTog;
  noiseVol.slider.oninput = noiseChange;
  tone1Toggle.onclick = tone1Tog;
  tone1Vol.slider.oninput = tone1Change;
  tone1Freq.slider.oninput = tone1Change;
  tone2VolSlider.onchange = tone2Change;
  tone1TremType.new.onchange = tremTypeSelect;
 */

  function noiseOn() {
    if (noise.state != 'started') {
      noise.volume.value = noiseVol.slider.valueAsNumber;
      noise.start();
      noiseEnv.triggerAttack();
    }
  }

  function noiseOff() {
    if (noise.state == 'started') {
      noiseEnv.triggerRelease();
      setTimeout(noiseStop, 500);
    }
  }

  function noiseStop() {
    noise.stop();
  }

  function noiseVolChange() {
    noise.volume.value = noiseVol.slider.valueAsNumber;
  }

  function master1Change() {
    master1.value = master1.slider.valueAsNumber;
    controls.forEach((ctl) => {
      if (ctl.yoke1.checked) {
        ctl.slider.value = (master1.value * (ctl.slider.max - ctl.slider.min)) + ctl.slider.min;
      }
    });
  }
  
  function noiseTremOn() {
    noiseTrem.frequency.value = 2 * (10 ** noiseTremFreq.slider.valueAsNumber);
    noiseTrem.spread = noiseTremSpread.slider.valueAsNumber * 1.8;
    noiseTrem.start();
  }

  function noiseTremOff() {
    noiseTrem.stop();
  }

  function noiseTremFreqChange() {
    noiseTrem.frequency.value = 2 * (10 ** noiseTremFreq.slider.valueAsNumber);
  }

  function noiseTremSpreadChange() {
    noiseTrem.spread = noiseTremSpread.slider.valueAsNumber * 1.8;
  }


  function noiseTremTypeSelect(ev) {
    noiseTrem.type = ev.target.value;
    noiseTremType.selected = ev.target.value;
    }


  
  let tone1Vol = new Control('tone1Vol');
  let tone1Freq = new Control('tone1Freq');
  let tone1TremType = new Control('tone1TremType');
  tone1TremType.selected = 'sine';
  let tone1TremFreq = new Control('tone1TremFreq');
  let tone1TremSpread = new Control('tone1TremSpread');
  let tone1Toggle = {};
  tone1Toggle.on = document.getElementById('tone1On');
  tone1Toggle.off = document.getElementById('tone1Off');
  let tone1TremToggle = {};
  tone1TremToggle.on = document.getElementById('tone1TremOn');
  tone1TremToggle.off = document.getElementById('tone1TremOff');
  let tone1Env = new Tone.AmplitudeEnvelope(.2,.2,1,.8).toMaster();
  let tone1Trem = new Tone.Tremolo(4, 1).connect(tone1Env);
  tone1Trem.wet.value = 1;
  let tone1 = new Tone.Oscillator(440, 'sine').connect(tone1Trem);
  tone1Toggle.on.onclick = tone1On;
  tone1Toggle.off.onclick = tone1Off;
  tone1TremToggle.on.onclick = tone1TremOn;
  tone1TremToggle.off.onclick = tone1TremOff;
  tone1Vol.slider.oninput = tone1VolChange;
  // tone1Freq.slider.onchange = tone1FreqChange;
  tone1Freq.slider.oninput = tone1FreqChange;

  tone1TremFreq.slider.oninput = tone1TremFreqChange;
  tone1TremSpread.slider.oninput = tone1TremSpreadChange;
  tone1TremType.new.onchange = tone1TremTypeSelect;


  function tone1On() {
    if (tone1.state != 'started') {
      tone1.volume.value = tone1Vol.slider.valueAsNumber;
      tone1.frequency.value = tone1Freq.slider.valueAsNumber ** freqExp;
      tone1.start();
      tone1Env.triggerAttack();
    }
  }

  function tone1Off() {
    if (tone1.state == 'started') {
      tone1Env.triggerRelease();
      setTimeout(tone1Stop, 500);
    }
  }

  function tone1Stop() {
    tone1.stop();
  }
  
  function tone1TremOn() {
    tone1Trem.frequency.value = 2 * (10 ** tone1TremFreq.slider.valueAsNumber);
    tone1Trem.spread = tone1TremSpread.slider.valueAsNumber * 1.8;
    tone1Trem.start();
  }

  function tone1TremOff() {
    tone1Trem.stop();
  }

  function tone1TremFreqChange() {
    tone1Trem.frequency.value = 2 * (10 ** tone1TremFreq.slider.valueAsNumber);
  }

  function tone1TremSpreadChange() {
    tone1Trem.spread = tone1TremSpread.slider.valueAsNumber * 1.8;
  }

  function tone1VolChange() {
    tone1.volume.value = tone1Vol.slider.valueAsNumber;
  }

  function tone1FreqChange() {
    tone1.frequency.value = tone1Freq.slider.valueAsNumber ** freqExp;
  }
  
  
  function tone1TremTypeSelect(ev) {
    tone1Trem.type = ev.target.value;
    tone1TremType.selected = ev.target.value;
    }


  
    let tone2Vol = new Control('tone2Vol');
    let tone2Freq = new Control('tone2Freq');
    let tone2TremType = new Control('tone2TremType');
    tone2TremType.selected = 'sine';
    let tone2TremFreq = new Control('tone2TremFreq');
    let tone2TremSpread = new Control('tone2TremSpread');
    let tone2Toggle = {};
    tone2Toggle.on = document.getElementById('tone2On');
    tone2Toggle.off = document.getElementById('tone2Off');
    let tone2TremToggle = {};
    tone2TremToggle.on = document.getElementById('tone2TremOn');
    tone2TremToggle.off = document.getElementById('tone2TremOff');
    let tone2Env = new Tone.AmplitudeEnvelope(.2,.2,1,.8).toMaster();
    let tone2Trem = new Tone.Tremolo(4, 1).connect(tone2Env);
    tone2Trem.wet.value = 1;
    let tone2 = new Tone.Oscillator(440, 'sine').connect(tone2Trem);
    tone2Toggle.on.onclick = tone2On;
    tone2Toggle.off.onclick = tone2Off;
    tone2TremToggle.on.onclick = tone2TremOn;
    tone2TremToggle.off.onclick = tone2TremOff;
    tone2Vol.slider.oninput = tone2VolChange;
    tone2Freq.slider.oninput = tone2FreqChange;
    tone2TremFreq.slider.oninput = tone2TremFreqChange;
    tone2TremSpread.slider.oninput = tone2TremSpreadChange;
    tone2TremType.new.onchange = tone2TremTypeSelect;
  
  
    function tone2On() {
      if (tone2.state != 'started') {
        tone2.volume.value = tone2Vol.slider.valueAsNumber;
        tone2.frequency.value = tone2Freq.slider.valueAsNumber ** freqExp;
        tone2.start();
        tone2Env.triggerAttack();
      }
    }
  
    function tone2Off() {
      if (tone2.state == 'started') {
        tone2Env.triggerRelease();
        setTimeout(tone2Stop, 500);
      }
    }
  
    function tone2Stop() {
      tone2.stop();
    }
    
    function tone2TremOn() {
      tone2Trem.frequency.value = 2 * (10 ** tone2TremFreq.slider.valueAsNumber);
      tone2Trem.spread = tone2TremSpread.slider.valueAsNumber * 1.8;
      tone2Trem.start();
    }
  
    function tone2TremOff() {
      tone2Trem.stop();
    }
  
    function tone2TremFreqChange() {
      tone2Trem.frequency.value = 2 * (10 ** tone2TremFreq.slider.valueAsNumber);
    }
  
    function tone2TremSpreadChange() {
      tone2Trem.spread = tone2TremSpread.slider.valueAsNumber * 1.8;
    }
  
    function tone2VolChange() {
      tone2.volume.value = tone2Vol.slider.valueAsNumber;
    }
  
    function tone2FreqChange() {
      tone2.frequency.value = tone2Freq.slider.valueAsNumber ** freqExp;
    }
    
    
    function tone2TremTypeSelect(ev) {
      tone2Trem.type = ev.target.value;
      tone2TremType.selected = ev.target.value;
      }
  
    

/* 

    function audChange() {
      db.doc('noise').update({
        'on': document.getElementById('noiseOn').checked,
        'volume': noiseVol.slider.valueAsNumber,
      });
    
      db.doc('tone1').update({
        'on': document.getElementById('tone1On').checked,
        'volume': tone1Vol.slider.valueAsNumber,
        'freq': tone1Freq.slider.valueAsNumber ** freqExp,
        'trem.on': document.getElementById('tone1TremOn').checked,
        'trem.freq': 2 * (10 ** tone1TremFreq.slider.valueAsNumber),
        'trem.spread': tone1TremSpread.slider.valueAsNumber * 1.8,
        'trem.type': tone1TremType.selected
      });
    }

 */


  function Control(id) {
    this.id = id;
    this.curr = document.getElementById(id + 'Curr');
    this.new = document.getElementById(id + 'New');
    this.slider = document.getElementById(id + 'Slider');
    this.yoke1 = document.getElementById(id + 'Yoke1');
    controls.push(this);
    // this.slider.oninput = this.update();
    // this.update() = {
    // }
    // this.units;
    // this.convert = function(unitless) {
    //   let covereted = Math.round(this.slider.valueAsNumber);
    //   if (unitless) {
    //     return convereted;
    //   } else {
    //     return converted + ' Hz';
    //   }

    // }
    // this.update = function() {
    //   this.new.innerText = this.convert() + ;
    }



  function visResetExec() {
    visuals.newStim = 'none';
    visStim.new.innerHTML = visuals.newStim;
    visChange();
  }
  
  function audResetExec() {
    noiseToggle.off.checked = true;
    noiseTremToggle.off.checked = true;
    tone1Toggle.off.checked = true;
    tone1TremToggle.off.checked = true;
    tone2Toggle.off.checked = true;
    tone2TremToggle.off.checked = true;

    audChange();
  }

  function audDiscrete(ev) {
    dbAudioDiscrete.update({
      [ev.target.id]: true
    });
  }

  // visSelects.forEach(function(visSelect) {
  //   visSelect.addEventListener('click',function(){
  //     pickVis(visSelect.id);
  //   });
  // });


  // visSpeed.slider.setAttribute('disabled',true);
  // visSpeedUpdate();
  // visDelta.slider.setAttribute('disabled',true);
  // visDeltaUpdate();
  // // pickVis('none');
  // visChange();

  function visSpeedUpdate() {
    if (!visSpeed.slider.getAttribute('disabled')) {
      if (visuals.newStim == 'flasher') {
        let speed = (Math.pow(2, visSpeed.slider.valueAsNumber)/4);
        speed = speed.toFixed(1-Math.floor(Math.log10(speed)));
        visSpeed.new.innerHTML = speed + ' Hz';
      } else if (visuals.newStim == 'metronome') {
        let speed = Math.round((Math.pow(2, (visSpeed.slider.valueAsNumber * 2/3))*15));
        visSpeed.new.innerHTML = speed + ' bpm';
      } else if (visuals.newStim == 'colorsLights') {
        let speed = Math.round(16 - ((visSpeed.slider.valueAsNumber * 2) + 2));
        visSpeed.new.innerHTML = speed + 's';
      } else {
        visSpeed.new.innerHTML = Math.round(visSpeed.slider.valueAsNumber);
      }
    } else {
      visSpeed.new.innerHTML = '-';
    }
  }
  
  function visDeltaUpdate() {
    if (!visDelta.slider.getAttribute('disabled')) {
      let delta = visDelta.slider.valueAsNumber;
      if (delta < 1) {
        delta = Math.round(2 * delta)*1000;
      } else {
        delta = 3750*Math.pow(2, delta);
      }
      if (delta < 60500) {
        delta = Math.round(delta/1000) + 's';
      } else {
        delta = Math.floor(delta / 60000) + 'm ' + Math.round((delta % 60000)/1000) + 's';
      }
      visDelta.new.innerHTML = delta;
    } else {
      visDelta.new.innerHTML = '-';
    }
  }


  // visualPicker.onchange = changeVisPicker;

  function pickVis (ev) {
    if (ev.target.id != 'gallery') {
      visuals.newStim = ev.target.id;
      visStim.new.innerHTML = visuals.newStim;
      switch (visuals.newStim) {
        case 'metronome':
        case 'flasher':
        case 'chaser':
          visSpeed.slider.removeAttribute('disabled');
          visDelta.slider.removeAttribute('disabled');
          visSpeedUpdate();
          visDeltaUpdate();
          break;
        case 'colorsLights':
          if (visuals.stim == 'colorsLights') {
            visSpeed.slider.setAttribute('disabled',true);
            visSpeed.new.innerHTML = 'n/a';
          } else {
            visSpeed.slider.removeAttribute('disabled');
            visSpeedUpdate();
          }
          visDelta.slider.setAttribute('disabled',true);
          visDelta.new.innerHTML = 'n/a';
          break;
        default:
          visSpeed.slider.setAttribute('disabled',true);
          visDelta.slider.setAttribute('disabled',true);
          visSpeed.new.innerHTML = 'n/a';
          visDelta.new.innerHTML = 'n/a';
        }  
      }
    }


/*       if (visuals.newStim == 'none') {
        visSpeed.slider.setAttribute('disabled',true);
        visSpeedUpdate();
        visDelta.slider.setAttribute('disabled',true);
        visDeltaUpdate();
      } else {
        visSpeed.slider.removeAttribute('disabled');
        visSpeedUpdate();
        visDelta.slider.removeAttribute('disabled');
        visDeltaUpdate();  
      }
    }
 */

  function visChange() {
      visuals.stim = visuals.newStim;
      // currVisPrev.innerHTML = newVisPrev.innerHTML;
      visStim.curr.innerHTML = visuals.newStim;
      if (!(visuals.stim == 'colorsLights' && visSpeed.slider.disabled)) {
        visSpeed.curr.innerHTML = visSpeed.new.innerHTML;
        if (visuals.stim == 'colorsLights') {
          visuals.speed = 16 - ((visSpeed.slider.valueAsNumber * 2) + 2);
          visSpeed.slider.setAttribute('disabled',true);
          visSpeed.new.innerHTML = 'n/a';
        } else if (visuals.stim == 'flasher') {
          visuals.speed = 4000/Math.pow(2, visSpeed.slider.valueAsNumber);
        } else if (visuals.stim == 'metronome') {
          visuals.speed = 4000/(2 ** (visSpeed.slider.valueAsNumber * 2/3));
        } else if (visuals.stim == 'chaser') {
          visuals.speed = 8000/(2 ** (visSpeed.slider.valueAsNumber));
        }
      }
      visuals.delta = visDelta.slider.valueAsNumber;
      if (visuals.delta < 1) {
        visuals.delta = Math.round(2 * visuals.delta)*1000;
      } else {
        visuals.delta = 3750*Math.pow(2, visuals.delta);
      }
      visDelta.curr.innerHTML = visDelta.new.innerHTML;
    dbVisuals.update({
      'stim': visuals.stim,
      'speed': visuals.speed,
      'delta': visuals.delta,
      'colors': visuals.colors    
    });
  }


  function audChange() {
    db.doc('noise').update({
      'on': noiseToggle.on.checked,
      'volume': noiseVol.slider.valueAsNumber,
      'trem.on': noiseTremToggle.on.checked,
      'trem.freq': 2 * (10 ** noiseTremFreq.slider.valueAsNumber),
      'trem.spread': noiseTremSpread.slider.valueAsNumber * 1.8,
      'trem.type': noiseTremType.selected
    });
  
    db.doc('tone1').update({
      'on': tone1Toggle.on.checked,
      'volume': tone1Vol.slider.valueAsNumber,
      'freq': tone1Freq.slider.valueAsNumber ** freqExp,
      'trem.on': tone1TremToggle.on.checked,
      'trem.freq': 2 * (10 ** tone1TremFreq.slider.valueAsNumber),
      'trem.spread': tone1TremSpread.slider.valueAsNumber * 1.8,
      'trem.type': tone1TremType.selected
    });

      
    db.doc('tone2').update({
      'on': tone2Toggle.on.checked,
      'volume': tone2Vol.slider.valueAsNumber,
      'freq': tone2Freq.slider.valueAsNumber ** freqExp,
      'trem.on': tone2TremToggle.on.checked,
      'trem.freq': 2 * (10 ** tone2TremFreq.slider.valueAsNumber),
      'trem.spread': tone2TremSpread.slider.valueAsNumber * 1.8,
      'trem.type': tone2TremType.selected
    });

  }
/* 
  function wordsChange() {
    db.doc('words').update({
      'on': wordsToggle.checked
    });
  } */



// function tone2Change() {
//   db.doc('tone2').update({
//     'on': tone2Toggle.checked,
//     'volume': tone2VolSlider.valueAsNumber,
//     'freq': tone2FreqSlider.valueAsNumber ** freqExp
//   });
// }

let freqExp = 4;

  // function musicBoxChange() {
  //   db.doc('musicBox').update({
  //     'on': musicBoxToggle.checked,
  //     'volume': musicBoxVolume.slider.valueAsNumber
  //   });
  // }


})();