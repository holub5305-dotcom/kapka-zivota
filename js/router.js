(function (global) {
  const routes = {};
  let current = null;
  let outlet = null;

  function register(path, renderFn) {
    routes[path] = renderFn;
  }

  function parseHash() {
    let h = (location.hash || '#/').replace(/^#/, '');
    if (!h.startsWith('/')) h = '/' + h;
    const [path, query = ''] = h.split('?');
    const params = {};
    if (query) {
      for (const part of query.split('&')) {
        const [k, v] = part.split('=');
        if (k) params[decodeURIComponent(k)] = decodeURIComponent(v || '');
      }
    }
    return { path: path || '/', params };
  }

  function navigate(path, params) {
    let hash = path.startsWith('#') ? path.slice(1) : path;
    if (!hash.startsWith('/')) hash = '/' + hash;
    if (params && Object.keys(params).length) {
      const q = Object.entries(params)
        .map(([k, v]) => encodeURIComponent(k) + '=' + encodeURIComponent(v))
        .join('&');
      hash += '?' + q;
    }
    location.hash = hash;
  }

  function match(path) {
    if (routes[path]) return { fn: routes[path], params: {} };
    // /diary/edit/:id style
    for (const key of Object.keys(routes)) {
      const parts = key.split('/');
      const pathParts = path.split('/');
      if (parts.length !== pathParts.length) continue;
      const params = {};
      let ok = true;
      for (let i = 0; i < parts.length; i++) {
        if (parts[i].startsWith(':')) params[parts[i].slice(1)] = pathParts[i];
        else if (parts[i] !== pathParts[i]) {
          ok = false;
          break;
        }
      }
      if (ok) return { fn: routes[key], params };
    }
    return null;
  }

  async function render() {
    if (!outlet) return;
    const { path, params: q } = parseHash();
    const state = KapkaStore.getState();
    if (!state.welcomeDone && path !== '/welcome') {
      navigate('/welcome');
      return;
    }
    if (state.welcomeDone && path === '/welcome') {
      navigate('/home');
      return;
    }
    const m = match(path) || match('/home');
    current = path;
    outlet.innerHTML = '';
    outlet.setAttribute('data-route', path);
    const ctx = { path, params: Object.assign({}, (m && m.params) || {}, q), outlet };
    await m.fn(ctx);
    updateNav(path);
    outlet.focus({ preventScroll: true });
  }

  function updateNav(path) {
    document.querySelectorAll('[data-nav]').forEach((el) => {
      const n = el.getAttribute('data-nav');
      const active =
        path === n ||
        path.startsWith(n + '/') ||
        (n === '/home' && (path === '/' || path === '/home'));
      el.classList.toggle('is-active', active);
      if (active) el.setAttribute('aria-current', 'page');
      else el.removeAttribute('aria-current');
    });
    const hideChrome = path === '/welcome';
    document.body.classList.toggle('welcome-mode', hideChrome);
  }

  function start(el) {
    outlet = el;
    window.addEventListener('hashchange', () => render());
    if (!location.hash) location.hash = KapkaStore.getState().welcomeDone ? '#/home' : '#/welcome';
    else render();
  }

  global.KapkaRouter = { register, navigate, start, render, parseHash };
})(typeof window !== 'undefined' ? window : globalThis);
