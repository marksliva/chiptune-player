$(function() {
  var scale = [147, 149, 151, 154, 156];
  var original_scale = scale.slice();
  var key_shift = [-5, -7, 5, 7];
  var play_sound = true;
  var classic8bit = new sonantx.SoundGenerator(window.classic8bit);
  var bassdrum1 = new sonantx.SoundGenerator(window.bassdrum1);
  var softy = new sonantx.SoundGenerator(window.softy);
  var snare1 = new sonantx.SoundGenerator(window.snare1);
  var hihat2 = new sonantx.SoundGenerator(window.hihat2);
  var smash = new sonantx.SoundGenerator(window.smash);
  var square = new sonantx.SoundGenerator(window.square);
  var audioCtx = new AudioContext();
  var shift_by, pitch, pitch_modifier, probability, beat_counter = 0;
  play_random_pitch = function(instruments) {
    var reference_pitch = scale[Math.round(Math.random(0,1) * (scale.length - 1))];
    instruments.forEach(function(instrument) {
      pitch = reference_pitch;
      pitch_modifier = instrument.pitch_modifier;
      if(pitch_modifier !== undefined) {
        if(pitch_modifier.length > 1) {
          pitch = scale[0] + pitch_modifier[Math.round(Math.random(0, pitch_modifier.length - 1))];
        }
        else {
          pitch = scale[0] + pitch_modifier[0];
        }
      }
      else if(instrument.static_pitch !== undefined) {
        pitch = instrument.static_pitch;
      }
      probability = Math.round(Math.random(0,1) * 99);
      beat = (instrument.on_beat == null) || ((beat_counter % instrument.on_beat) == 0)
      if(beat && (probability < instrument.probability)) {
        instrument.inst.createAudioBuffer(pitch, function(buffer) {
          setTimeout(function() {
            var source = audioCtx.createBufferSource();
            source.buffer = buffer;
            source.connect(audioCtx.destination);
            source.start();
          }, 0);
        });
      }
    });
  };
  var add_instruments = true;
  function modify_instruments() {
    if(add_instruments) {
      instruments.push(all_instruments[instruments.length]);
    }
    else {
      instruments.splice(instruments.length - 1);
    }
    if(instruments.length >= all_instruments.length) {
      add_instruments = false;
    }
    else if(instruments.length <= 2) {
      add_instruments = true;
    }
  };
  function change_key() {
    if(scale[0] < 120) {
      scale = original_scale.slice();
    }
    else if(scale[0] > 180) {
      scale = original_scale.slice();
    }
    else {
      shift_by = key_shift[Math.round(Math.random(0,1) * (key_shift.length - 1))];
      var new_scale = scale.map(function(old_pitch) {
        return old_pitch + shift_by;
      });
      scale = new_scale;
    }
  };
  start = function(instruments) {
    interval = setInterval(function() {
      play_random_pitch(instruments);
      if((beat_counter % 128) == 0) {
        modify_instruments();
      }
      beat_counter += 1;
      if((beat_counter % 256) == 0) {
        change_key();
      }
      if(beat_counter > 100000) { beat_counter = 0; }
      if((beat_counter % 4) == 0) {
        clearInterval(interval);
        start(instruments);
      }
    }, $("#tempo").val());
  };
  var all_instruments = [
    {name: 'bassdrum', inst: bassdrum1, probability: 100, on_beat: 4, static_pitch: 135},
    {name: 'snare', inst: snare1, probability: 80, on_beat: 8, static_pitch: 142},
    {name: '8bit', inst: classic8bit, probability: 20, on_beat: 2},
    {name: 'softy', inst: softy, probability: 50, on_beat: 6, pitch_modifier: [-24]},
    {name: 'hihat2', inst: hihat2, probability: 50, on_beat: 8, static_pitch: 135},
    {name: 'softy', inst: softy, probability: 20, on_beat: 6, pitch_modifier: [-8, -7, -2, 2]},
    {name: 'square', inst: square, probability: 90, on_beat: 24, pitch_modifier: [7]},
    {name: 'smash', inst: smash, probability: 25, on_beat: 12, static_pitch: 135},
    //more than 8 instruments starts to slow down too much
    //{name: 'snare', inst: snare1, probability: 80, on_beat: 6, static_pitch: 142},
    //{name: 'softy', inst: softy, probability: 20, on_beat: 6, pitch_modifier: [-2, 2]},
    //{name: 'bassdrum', inst: bassdrum1, probability: 100, on_beat: 10, static_pitch: 135},
    //{name: 'softy', inst: softy, probability: 20, on_beat: 3, pitch_modifier: [-5]}
  ];
  var instruments = [all_instruments[0]];
  $('#song').keydown(function(event) {
    var old_tempo = parseInt($('#tempo').val());
    var old_volume = parseInt($('#volume').val());
    switch(event.keyCode) {
      case 37:
        event.preventDefault();
        $('#tempo').val(old_tempo - 5);
        break;
      case 39:
        event.preventDefault();
        $('#tempo').val(old_tempo + 5);
        break;
      case 38:
        event.preventDefault();
        $('#volume').val(old_volume + 1);
        increase_instruments_volume();
        break;
      case 40:
        event.preventDefault();
        $('#volume').val(old_volume - 1);
        decrease_instruments_volume();
        break;
      case 83:
        event.preventDefault();
        toggle_sound();
        break;
      default: break;
    }
  });
  function decrease_instruments_volume() {
    var old_volume;
    all_instruments.forEach(function(instrument) {
      var old_volume = parseInt(instrument.inst.instr.env_master);
      instrument.inst.instr.env_master = old_volume - 2;
    });
  };
  function increase_instruments_volume() {
    var old_volume;
    all_instruments.forEach(function(instrument) {
      var old_volume = parseInt(instrument.inst.instr.env_master);
      instrument.inst.instr.env_master = old_volume + 2;
    });
  };
  toggle_sound = function() {
    if(play_sound) {
      clearInterval(interval);
    }
    else {
      start(instruments);
    }
    play_sound = !play_sound;
  };
  $('#toggle_sound').click(function(e) {
    toggle_sound();
  });
  start(instruments);
});
