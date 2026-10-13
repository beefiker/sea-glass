'use strict';
// One cancellable animation per element/channel. Semantic state changes immediately;
// only the current animation may finish a deferred visual dismissal.
const SeaMotion = (() => {
  const root = document.documentElement;
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const channels = new WeakMap();
  const active = new Set();
  const reduced = () => preference.matches || root.dataset.motion === 'reduce';
  function token(name, fallback) {
    return getComputedStyle(root).getPropertyValue(name).trim() || fallback;
  }
  function cancel(element, channel = 'surface') {
    const record = channels.get(element)?.get(channel);
    if (!record) return;
    channels.get(element).delete(channel);
    active.delete(record);
    record.animation.cancel();
  }
  function run(element, frames, options = {}) {
    const {channel = 'surface', duration = 'change', easing = 'settle', done = () => {}} = options;
    cancel(element, channel);
    if (reduced() || !element.animate) { done(); return; }
    const ms = parseFloat(token(`--motion-${duration}`, '260ms'));
    const curve = token(`--ease-${easing}`, 'cubic-bezier(.22,1,.36,1)');
    const animation = element.animate(frames, {duration: ms, easing: curve, fill: 'both'});
    const record = {animation, finish() {
      if (channels.get(element)?.get(channel) !== record) return;
      channels.get(element).delete(channel);
      active.delete(record);
      animation.cancel();
      done();
    }};
    if (!channels.has(element)) channels.set(element, new Map());
    channels.get(element).set(channel, record);
    active.add(record);
    animation.finished.then(record.finish, () => {});
  }
  function enter(element, {lift = 8, scale = 1, duration = 'change'} = {}) {
    run(element, [{opacity: 0, transform: `translateY(${lift}px) scale(${scale})`},
      {opacity: 1, transform: 'translateY(0) scale(1)'}], {duration});
  }
  function visibility(element, visible, {lift = 8, scale = .98} = {}) {
    const wasHidden = element.hidden;
    const current = getComputedStyle(element);
    const first = {opacity: wasHidden ? 0 : current.opacity,
      transform: wasHidden ? `translateY(${lift}px) scale(${scale})` : current.transform};
    element.inert = !visible;
    if (visible) element.removeAttribute('aria-hidden');
    else element.setAttribute('aria-hidden', 'true');
    if (wasHidden && !visible) { cancel(element); return; }
    element.hidden = false;
    run(element, [first, {opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0) scale(1)' : `translateY(${lift}px) scale(${scale})`}],
    {duration: visible ? 'change' : 'quick', done: () => {element.hidden = !visible;}});
  }
  function expand(element, open, {wasClosed = element.hidden, done = () => {}} = {}) {
    const current = getComputedStyle(element);
    const first = {height: wasClosed ? '0px' : `${element.getBoundingClientRect().height}px`,
      opacity: wasClosed ? 0 : current.opacity,
      paddingTop: wasClosed ? '0px' : current.paddingTop,
      paddingBottom: wasClosed ? '0px' : current.paddingBottom,
      borderBottomWidth: wasClosed ? '0px' : current.borderBottomWidth};
    cancel(element);
    element.hidden = false;
    element.inert = !open;
    if (open) element.removeAttribute('aria-hidden');
    else element.setAttribute('aria-hidden', 'true');
    const natural = getComputedStyle(element);
    const last = {height: open ? `${element.getBoundingClientRect().height}px` : '0px',
      opacity: open ? 1 : 0, paddingTop: open ? natural.paddingTop : '0px',
      paddingBottom: open ? natural.paddingBottom : '0px',
      borderBottomWidth: open ? natural.borderBottomWidth : '0px'};
    element.classList.add('expanding');
    run(element, [first, last], {duration: 'expand', done: () => {
      element.classList.remove('expanding');
      element.hidden = !open;
      done();
    }});
  }
  function feedback(element, direction = 1) {
    run(element, [{opacity: .3, transform: `translateY(${direction * 5}px) scale(.94)`},
      {opacity: 1, transform: 'translateY(0) scale(1)'}], {channel: 'feedback'});
  }
  function positions(container) {
    return new Map([...container.children].map(el => [el, el.getBoundingClientRect()]));
  }
  function reflow(container, before) {
    for (const el of container.children) {
      const from = before.get(el);
      if (!from) { enter(el, {lift: 4}); continue; }
      const to = el.getBoundingClientRect();
      if (from.left === to.left && from.top === to.top) continue;
      run(el, [{transform: `translate(${from.left - to.left}px,${from.top - to.top}px)`},
        {transform: 'translate(0,0)'}], {duration: 'expand', channel: 'layout'});
    }
  }
  function remove(element, container) {
    const before = positions(container);
    if (!reduced()) {
      const rect = element.getBoundingClientRect();
      const ghost = element.cloneNode(true);
      ghost.inert = true;
      ghost.setAttribute('aria-hidden', 'true');
      ghost.style.cssText += `;position:fixed;left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;height:${rect.height}px;margin:0;pointer-events:none;z-index:30`;
      document.body.append(ghost);
      run(ghost, [{opacity: 1, transform: 'scale(1)'}, {opacity: 0, transform: 'scale(.9)'}],
        {duration: 'quick', done: () => ghost.remove()});
    }
    cancel(element);
    element.remove();
    reflow(container, before);
  }
  function settle() {
    if (reduced()) [...active].forEach(record => record.finish());
  }
  preference.addEventListener('change', () => {
    root.dataset.osMotion = preference.matches ? 'reduce' : 'full';
    settle();
  });
  root.dataset.osMotion = preference.matches ? 'reduce' : 'full';
  return {run, cancel, enter, visibility, expand, feedback, positions, reflow, remove, reduced, settle};
})();
