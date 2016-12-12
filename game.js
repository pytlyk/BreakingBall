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

