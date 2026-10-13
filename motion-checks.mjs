// Focused race and accessibility tests for the actual runtime, without a browser dependency.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {test} from 'node:test';

function fixture() {
  const root = {dataset: {}};
  const preference = {matches: false, addEventListener(_, listener) {this.listener = listener;}};
  const values = {'--motion-quick':'160ms', '--motion-change':'260ms', '--motion-expand':'340ms', '--ease-settle':'cubic-bezier(.22,1,.36,1)'};
  const context = vm.createContext({document: {documentElement:root}, matchMedia: () => preference,
    getComputedStyle: el => ({getPropertyValue: key => values[key] || '', opacity:'1', transform:'none', paddingTop:'0px', paddingBottom:'0px', borderBottomWidth:'0px'})});
  const motion = vm.runInContext(readFileSync(new URL('./motion.js', import.meta.url), 'utf8') + '\nSeaMotion;', context);
  const element = {hidden: true, inert: false, attributes: {}, animations: [],
    setAttribute(key, value) {this.attributes[key] = value;}, removeAttribute(key) {delete this.attributes[key];},
    getBoundingClientRect() {return {height:100};}, classList: {add() {}, remove() {}},
    animate(frames, options) {
      let finish, reject;
      const animation = {frames, options, cancelled:false, finished: new Promise((resolve, failure) => {finish = resolve; reject = failure;}),
        complete() {finish();}, cancel() {this.cancelled=true; reject(new Error('cancelled'));}};
      this.animations.push(animation); return animation;
    }};
  return {motion, element, root, preference};
}
const flush = async () => {await Promise.resolve(); await Promise.resolve();};

test('reopening during exit cannot be hidden by the stale completion', async () => {
  const {motion, element} = fixture();
  motion.visibility(element, true);
  motion.visibility(element, false);
  const stale = element.animations.at(-1);
  assert.equal(element.inert, true);
  motion.visibility(element, true);
  stale.complete(); await flush();
  assert.equal(element.hidden, false);
  assert.equal(element.inert, false);
  assert.equal(element.attributes['aria-hidden'], undefined);
  element.animations.at(-1).complete(); await flush();
  assert.equal(element.hidden, false);
});
test('closing during entrance hides only after the current exit', async () => {
  const {motion, element} = fixture();
  motion.visibility(element, true);
  const stale = element.animations[0];
  motion.visibility(element, false);
  stale.complete(); await flush();
  assert.equal(element.hidden, false);
  assert.equal(element.attributes['aria-hidden'], 'true');
  element.animations.at(-1).complete(); await flush();
  assert.equal(element.hidden, true);
});
test('manual reduced motion settles a pending dismissal immediately', () => {
  const {motion, element, root} = fixture();
  motion.visibility(element, true); motion.visibility(element, false);
  root.dataset.motion = 'reduce'; motion.settle();
  assert.equal(element.hidden, true);
  const count = element.animations.length;
  motion.visibility(element, true);
  assert.equal(element.animations.length, count);
  assert.equal(element.hidden, false);
  assert.equal(element.inert, false);
});
test('OS reduced motion finishes a pending disclosure and overrides the studio setting', () => {
  const {motion, element, root, preference} = fixture();
  root.dataset.motion = 'full';
  motion.expand(element, true); motion.expand(element, false);
  preference.matches = true; preference.listener();
  assert.equal(motion.reduced(), true);
  assert.equal(root.dataset.osMotion, 'reduce');
  assert.equal(element.hidden, true);
});
test('disclosure reversal cannot run an outdated close callback', async () => {
  const {motion, element} = fixture(); let open = true;
  motion.expand(element, true);
  motion.expand(element, false, {done:() => {open=false;}});
  const stale = element.animations.at(-1);
  motion.expand(element, true, {done:() => {open=true;}});
  stale.complete(); await flush();
  assert.equal(open, true);
  element.animations.at(-1).complete(); await flush();
  assert.equal(element.hidden, false);
});
test('explicit cancellation never calls the discarded completion', async () => {
  const {motion, element} = fixture(); let completed = 0;
  motion.run(element, [{opacity:0},{opacity:1}], {done:() => {completed++;}});
  motion.cancel(element); element.animations[0].complete(); await flush();
  assert.equal(completed, 0);
});
test('runtime consumes the CSS duration and curve tokens', () => {
  const {motion, element} = fixture();
  motion.run(element, [], {duration:'expand'});
  assert.equal(element.animations[0].options.duration, 340);
  assert.equal(element.animations[0].options.easing, 'cubic-bezier(.22,1,.36,1)');
});
test('browsers without WAAPI reach the same final state without waiting', () => {
  const {motion, element} = fixture(); element.animate = undefined;
  motion.visibility(element, true); assert.equal(element.hidden, false);
  motion.visibility(element, false); assert.equal(element.hidden, true);
});
