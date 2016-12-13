if (!Function.prototype.bind) {
  Function.prototype.bind = function(obj) {
    var slice = [].slice,
        args  = slice.call(arguments, 1),
        self  = this,
        nop   = function () {},
        bound = function () {
          return self.apply(this instanceof nop ? this : (obj || {}), args.concat(slice.call(arguments)));   
        };
    nop.prototype   = self.prototype;
    bound.prototype = new nop();
    return bound;
  };
}

if (!Object.create) {
  Object.create = function(base) {
    function F() {};
    F.prototype = base;
    return new F();
  }
}

if (!Object.construct) {
  Object.construct = function(base) {
    var instance = Object.create(base);
    if (instance.initialize)
      instance.initialize.apply(instance, [].slice.call(arguments, 1));
    return instance;
  }
}

if (!Object.extend) {
  Object.extend = function(destination, source) {
    for (var property in source) {
      if (source.hasOwnProperty(property))
        destination[property] = source[property];
    }
    return destination;
  };
}



Element = function() {

  var instance = {

    _extended: true,

    showIf: function(on)      { if (on) this.show(); else this.hide(); },
    show:   function()        { this.style.display = '';      },
    hide:   function()        { this.style.display = 'none';  },
    update: function(content) { this.innerHTML     = content; },

    hasClassName:    function(name)     { return (new RegExp("(^|\s*)" + name + "(\s*|$)")).test(this.className) },
    addClassName:    function(name)     { this.toggleClassName(name, true);  },
    removeClassName: function(name)     { this.toggleClassName(name, false); },
    toggleClassName: function(name, on) {
      var classes = this.className.split(' ');
      var n = classes.indexOf(name);
      on = (typeof on == 'undefined') ? (n < 0) : on;
      if (on && (n < 0))
        classes.push(name);
      else if (!on && (n >= 0))
        classes.splice(n, 1);
      this.className = classes.join(' ');
    }
  };

  var get = function(ele) {
    if (typeof ele == 'string')
      ele = document.getElementById(ele);
    if (!ele._extended)
      Object.extend(ele, instance);
    return ele;
  };

  return get;

}();

$ = Element;

//=============================================================================
// State Machine
//=============================================================================

StateMachine = {

  //---------------------------------------------------------------------------

  create: function(cfg) {

    var target  = cfg.target  || {};
    var events  = cfg.events;

    var n, event, name, can = {};
    for(n = 0 ; n < events.length ; n++) {
      event = events[n];
      name  = event.name;
      can[name] = (can[name] || []).concat(event.from);
      target[name] = this.buildEvent(name, event.from, event.to, target);
    }

    target.current = 'none';
    target.is      = function(state) { return this.current == state; };
    target.can     = function(event) { return can[event].indexOf(this.current) >= 0; };
    target.cannot  = function(event) { return !this.can(event); };

    if (cfg.initial) { // see "initial" qunit tests for examples
      var initial = (typeof cfg.initial == 'string') ? { state: cfg.initial } : cfg.initial; // allow single string to represent initial state, or complex object to configure { state: 'first', event: 'init', defer: true|false }
      name = initial.event || 'startup';
      can[name] = ['none'];
      event = this.buildEvent(name, 'none', initial.state, target);
      if (initial.defer)
        target[name] = event; // allow caller to trigger initial transition event
      else
        event.call(target);
    }

    return target;
  },

  //---------------------------------------------------------------------------

  buildEvent: function(name, from, to, target) {

    return function() {

      if (this.cannot(name))
        throw "event " + name + " innapropriate in current state " + this.current;

      var beforeEvent = this['onbefore' + name];
      if (beforeEvent && (false === beforeEvent.apply(this, arguments)))
        return;

      if (this.current != to) {

        var exitState = this['onleave'  + this.current];
        if (exitState)
          exitState.apply(this, arguments);

        this.current = to;

        var enterState = this['onenter' + to] || this['on' + to];
        if (enterState)
          enterState.apply(this, arguments);
      }

      var afterEvent = this['onafter'  + name] || this['on' + name];
      if (afterEvent)
        afterEvent.apply(this, arguments);
    }

  }

  //---------------------------------------------------------------------------

};

Game = {

  compatible: function() {
    return Object.create &&
           Object.extend &&
           Function.bind &&
           document.addEventListener && // HTML5 standard, all modern browsers that support canvas should also support add/removeEventListener
           Game.ua.hasCanvas
  },

  start: function(id, game, cfg) {
    if (Game.compatible())
      return Game.current = Object.construct(Game.Runner, id, game, cfg).game; // return the game instance, not the runner (caller can always get at the runner via game.runner)
  },

  ua: function() { // should avoid user agent sniffing... but sometimes you just gotta do what you gotta do
    var ua  = navigator.userAgent.toLowerCase();
    var key =        ((ua.indexOf("opera")   > -1) ? "opera"   : null);
        key = key || ((ua.indexOf("firefox") > -1) ? "firefox" : null);
        key = key || ((ua.indexOf("chrome")  > -1) ? "chrome"  : null);
        key = key || ((ua.indexOf("safari")  > -1) ? "safari"  : null);
        key = key || ((ua.indexOf("msie")    > -1) ? "ie"      : null);

    try {
      var re      = (key == "ie") ? "msie (\\d)" : key + "\\/(\\d\\.\\d)"
      var matches = ua.match(new RegExp(re, "i"));
      var version = matches ? parseFloat(matches[1]) : null;
    } catch (e) {}

    return {
      full:      ua, 
      name:      key + (version ? " " + version.toString() : ""),
      version:   version,
      isFirefox: (key == "firefox"),
      isChrome:  (key == "chrome"),
      isSafari:  (key == "safari"),
      isOpera:   (key == "opera"),
      isIE:      (key == "ie"),
      hasCanvas: (document.createElement('canvas').getContext),
      hasAudio:  (typeof(Audio) != 'undefined'),
      hasTouch:  ('ontouchstart' in window)
    }
  }(),

  addEvent:    function(obj, type, fn) { $(obj).addEventListener(type, fn, false);    },
  removeEvent: function(obj, type, fn) { $(obj).removeEventListener(type, fn, false); },

  windowWidth:  function() { return window.innerWidth  || /* ie */ document.documentElement.offsetWidth;  },
  windowHeight: function() { return window.innerHeight || /* ie */ document.documentElement.offsetHeight; },

  ready: function(fn) {
    if (Game.compatible())
      Game.addEvent(document, 'DOMContentLoaded', fn);
  },

  renderToCanvas: function(width, height, render, canvas) { // http://kaioa.com/node/103
    canvas = canvas || document.createElement('canvas');
    canvas.width  = width;
    canvas.height = height;
    render(canvas.getContext('2d'));
    return canvas;
  },

  loadScript: function(src, cb) {
    var head = document.getElementsByTagName('head')[0];
    var s = document.createElement('script');
    head.appendChild(s);
    if (Game.ua.isIE) {
      s.onreadystatechange = function(e) {
        if (e.currentTarget.readyState == 'loaded')
          cb(e.currentTarget);
      }
    }
    else {
      s.onload = function(e) { cb(e.currentTarget); }
    }
    s.type = 'text/javascript';
    s.src = src;
  },

  loadImages: function(sources, callback) { /* load multiple images and callback when ALL have finished loading */
    var images = {};
    var count = sources ? sources.length : 0;
    if (count == 0) {
      callback(images);
    }
    else {
      for(var n = 0 ; n < sources.length ; n++) {
        var source = sources[n];
        var image = document.createElement('img');
        images[source] = image;
        Game.addEvent(image, 'load', function() { if (--count == 0) callback(images); });
        image.src = source;
      }
    }
  },

  loadSounds: function(cfg) {
    cfg = cfg || {};
    if (typeof soundManager == 'undefined') {
      var path = cfg.path || 'sound/soundmanager2-nodebug-jsmin.js';
      var swf  = cfg.swf  || 'sound/swf';
      window.SM2_DEFER = true;
      Game.loadScript(path, function() {
        window.soundManager = new SoundManager();
        soundManager.useHighPerformance = true;
        soundManager.useFastPolling = true;
        soundManager.url = swf;
        soundManager.defaultOptions.volume = 50; // shhh!
        soundManager.onready(function() {
          Game.loadSounds(cfg);
        });
        soundManager.beginDelayedInit();
      });
    }
    else {
      var sounds = [];
      for(var id in cfg.sounds) {
        sounds.push(soundManager.createSound({id: id, url: cfg.sounds[id]}));
      }
      if (cfg.onload)
        cfg.onload(sounds);
    }
  },

  random: function(min, max) {
    return (min + (Math.random() * (max - min)));
  },

  randomChoice: function(choices) {
    return choices[Math.round(Game.random(0, choices.length-1))];
  },

  randomBool: function() {
    return Game.randomChoice([true, false]);
  },

  timestamp: function() { 
    return new Date().getTime();
  },

  THREESIXTY: Math.PI * 2,

  KEY: {
    BACKSPACE: 8,
    TAB:       9,
    RETURN:   13,
    ESC:      27,
    SPACE:    32,
    LEFT:     37,
    UP:       38,
    RIGHT:    39,
    DOWN:     40,
    DELETE:   46,
    HOME:     36,
    END:      35,
    PAGEUP:   33,
    PAGEDOWN: 34,
    INSERT:   45,
    ZERO:     48,
    ONE:      49,
    TWO:      50,
    A:        65,
    D:        68,
    L:        76,
    P:        80,
    Q:        81,
    TILDA:    192
  },

  //-----------------------------------------------------------------------------






