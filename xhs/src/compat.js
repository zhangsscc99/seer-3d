/* Standard ES/DOM compatibility only; no restricted browser capability is shimmed. */
(function () {
  function define(target, name, value) {
    if (!target[name]) Object.defineProperty(target, name, {configurable:true, writable:true, value:value});
  }
  define(Array.prototype, 'at', function (index) {
    if (this == null) throw new TypeError('Array.at called on null');
    var list = Object(this), length = Math.min(Math.max(Number(list.length) || 0, 0), 9007199254740991);
    length = Math.floor(length);
    var n = Number(index) || 0;
    n = n < 0 ? Math.ceil(n) : Math.floor(n);
    if (n < 0) n += length;
    return n < 0 || n >= length ? undefined : list[n];
  });
  define(Array.prototype, 'flat', function (depth) {
    if (this == null) throw new TypeError('Array.flat called on null');
    var result = [], remaining = depth === undefined ? 1 : Number(depth);
    remaining = remaining > 0 ? Math.floor(remaining) : 0;
    function add(list, level) {
      for (var i = 0; i < list.length; i++) {
        if (!(i in list)) continue;
        var item = list[i];
        if (level > 0 && Array.isArray(item)) add(item, level - 1);
        else result.push(item);
      }
    }
    add(Object(this), remaining);
    return result;
  });
  define(Object, 'fromEntries', function (entries) {
    var result = {};
    for (var pair of entries) {
      Object.defineProperty(result, pair[0], {value:pair[1], enumerable:true, writable:true, configurable:true});
    }
    return result;
  });
  function fragmentFor(node, values) {
    var doc = node.ownerDocument || node, fragment = doc.createDocumentFragment();
    for (var i = 0; i < values.length; i++) {
      fragment.appendChild(values[i] instanceof Node ? values[i] : doc.createTextNode(String(values[i])));
    }
    return fragment;
  }
  [Element.prototype, Document.prototype, DocumentFragment.prototype].forEach(function (prototype) {
    define(prototype, 'append', function () { this.appendChild(fragmentFor(this, arguments)); });
    define(prototype, 'replaceChildren', function () {
      var fragment = fragmentFor(this, arguments);
      while (this.firstChild) this.removeChild(this.firstChild);
      this.appendChild(fragment);
    });
  });
  if (typeof CanvasRenderingContext2D !== 'undefined') {
    define(CanvasRenderingContext2D.prototype, 'roundRect', function (x, y, width, height, radii) {
      var values = Array.isArray(radii) ? radii.slice() : [radii === undefined ? 0 : radii];
      if (values.length < 1 || values.length > 4) throw new RangeError('Expected one to four corner radii');
      values = values.map(function (value) {
        var radius = Number(value);
        if (radius < 0) throw new RangeError('Corner radius must not be negative');
        return radius;
      });
      if (![x,y,width,height].concat(values).every(Number.isFinite)) return;
      var corners = values.length === 1 ? [values[0],values[0],values[0],values[0]] :
        values.length === 2 ? [values[0],values[1],values[0],values[1]] :
        values.length === 3 ? [values[0],values[1],values[2],values[1]] : values;
      if (width < 0) { x += width; width = -width; corners = [corners[1],corners[0],corners[3],corners[2]]; }
      if (height < 0) { y += height; height = -height; corners = [corners[3],corners[2],corners[1],corners[0]]; }
      var scale = Math.min(1, width/(corners[0]+corners[1]||1), width/(corners[2]+corners[3]||1),
        height/(corners[0]+corners[3]||1), height/(corners[1]+corners[2]||1));
      corners = corners.map(function (radius) { return radius * scale; });
      var a=corners[0], b=corners[1], c=corners[2], d=corners[3];
      this.moveTo(x+a,y); this.lineTo(x+width-b,y); this.quadraticCurveTo(x+width,y,x+width,y+b);
      this.lineTo(x+width,y+height-c); this.quadraticCurveTo(x+width,y+height,x+width-c,y+height);
      this.lineTo(x+d,y+height); this.quadraticCurveTo(x,y+height,x,y+height-d);
      this.lineTo(x,y+a); this.quadraticCurveTo(x,y,x+a,y); this.closePath();
    });
  }
})();
