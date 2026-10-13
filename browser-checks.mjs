// Pure assertions for observations collected through the CUA native browser APIs.
// Keeping UI input in the CUA REPL avoids mixing native input and CDP automation.
export function assertSeaGlassObservations(observed) {
  const conditions = [
    [observed.initialFocus === 'collection-name', 'Dialog initial focus'],
    [observed.forwardFocus === 'collection-name', 'Dialog Tab wraps to the name field'],
    [observed.reverseFocus === 'submit', 'Dialog Shift+Tab wraps to submit'],
    [observed.closedAndReturned === true, 'Dialog Escape returns focus to its opener'],
    [observed.iconBackgrounds.length === 2 && observed.iconBackgrounds.every(value => value !== 'none'), 'Icon actions retain their glass backgrounds'],
    [observed.targets.length === 4 && observed.targets.every(target => target.width >= 44 && target.height >= 44), 'Compact controls retain 44 px targets'],
    [observed.scrollWidth === observed.viewport, 'No horizontal viewport overflow']
  ];
  for (const [passed, message] of conditions) if (!passed) throw new Error(message);
  return {passed: conditions.length, viewport: observed.viewport, scope: 'Dialog focus, icon material, compact targets, overflow'};
}

// The forward wrap once left focus on the document. Keep a negative fixture.
export function checkNegativeFixture() {
  const good = {initialFocus:'collection-name', forwardFocus:'collection-name', reverseFocus:'submit', closedAndReturned:true, iconBackgrounds:['linear-gradient(red, blue)','linear-gradient(red, blue)'], targets:Array.from({length:4},()=>({width:44,height:44})), scrollWidth:320,viewport:320};
  assertSeaGlassObservations(good);
  for (const bad of [{forwardFocus:''}, {iconBackgrounds:['none','none']}, {targets:[{width:34,height:36}]}, {scrollWidth:340}]) {
    let rejected=false;
    try { assertSeaGlassObservations({...good,...bad}); } catch { rejected=true; }
    if (!rejected) throw new Error('Browser assertion accepted a regression fixture');
  }
  return '4 negative fixtures rejected';
}
