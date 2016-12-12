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

