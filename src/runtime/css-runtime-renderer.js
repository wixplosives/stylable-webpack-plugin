const { keyedListRenderer } = require("./keyed-list-renderer");
class RuntimeRenderer {
  constructor() {
    this.listeners = [];
    this.styles = [];
    this.stylesMap = {};
    this.renderer = null;
    this.window = null;
    this.id = null;
    this.update = this.update.bind(this);
  }
  init(_window) {
    if (this.window || !_window) {
      return;
    }

    _window.__stylable_renderer_global_counter =
      _window.__stylable_renderer_global_counter || 0;
    this.id = _window.__stylable_renderer_global_counter++;

    this.window = _window;
    this.renderer = keyedListRenderer(
      createCacheStyleNodeRenderer({
        attrKey: "st-id" + (this.id ? "-" + this.id : ""),
        createElement: _window.document.createElement.bind(_window.document)
      })
    );
    this.update();
  }
  update() {
    if (this.renderer) {
      this.renderer.render(this.window.document.head, this.styles);
    }
  }
  onRegister() {
    if (this.window) {
      this.window.requestAnimationFrame(this.update);
    }
  }
  register(stylesheet) {
    const registered = this.stylesMap[stylesheet.$id];

    if (registered) {
      this.removeStyle(registered);
    }

    const i = this.findDepthIndex(stylesheet.$depth);
    this.styles.splice(i + 1, 0, stylesheet);
    this.stylesMap[stylesheet.$id] = stylesheet;
    this.onRegister();
  }
  removeStyle(stylesheet) {
    const i = this.styles.indexOf(stylesheet);
    if (~i) {
      this.styles.splice(i, 1);
    }
    delete this.stylesMap[stylesheet.$id];
  }
  findDepthIndex(depth) {
    let index = this.styles.length;
    while (index--) {
      const stylesheet = this.styles[index];
      if (stylesheet.$depth <= depth) {
        return index;
      }
    }
    return index;
  }
  getStyles(ids, sortIndexes) {
    return this.sortStyles(ids.map(id => this.stylesMap[id]), sortIndexes);
  }
  sortStyles(styles, sortIndexes = false) {
    const s = styles.slice();

    sortIndexes &&
      s.sort((a, b) => {
        return this.styles.indexOf(a) - this.styles.indexOf(b);
      });
    s.sort((a, b) => {
      return a.$depth - b.$depth;
    });
    return s;
  }
}

function createCacheStyleNodeRenderer(options) {
  const { createElement, attrKey = "stylable-key" } = options;

  const create = (stylesheet, key) => {
    const node = createElement("style");
    node.textContent = stylesheet.$css;
    stylesheet.$theme && node.setAttribute("st-theme", true);
    node.setAttribute(attrKey, key);
    node.setAttribute("st-depth", stylesheet.$depth);
    return node;
  };

  const update = (stylesheet, node) => {
    if (node.textContent !== stylesheet.$css) {
      node.textContent = stylesheet.$css;
    }
    return node;
  };

  const renderKey = stylesheet => stylesheet.$id;

  const hasKey = node => node.hasAttribute(attrKey);

  return {
    update,
    create,
    renderKey,
    hasKey
  };
}

module.exports = new RuntimeRenderer();
module.exports.RuntimeRenderer = RuntimeRenderer;
