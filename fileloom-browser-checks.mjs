// Assert real DOM observations collected with the Codex CUA browser. No browser dependency.
export function assertFileloomPreview(o){
 const checks=[
 [o.groups===32,'32 live component groups'],
 [o.duplicateIds.length===0,'No duplicate document IDs'],
 [o.widths.length===2&&o.widths.every(x=>x.viewport===x.scrollWidth),'320 and 390 px have no horizontal overflow'],
 [o.compactTargets.every(x=>x.width>=44&&x.height>=44),'Compact browser targets are at least 44 px'],
 [o.sheetForward==='Close newfolder sheet'&&o.sheetReverse==='Create folder','Sheet focus wraps in both directions'],
 [o.focusReturned===true,'Closing a sheet restores an available opener'],
 [o.repeatSheet===true,'Underlying controls remain interactive after a modal-driven render'],
 [o.trackAfter===o.trackBefore,'Reader track taps do not seek'],
 [o.keyboardPage===o.trackBefore+1,'Reader keyboard input commits one page'],
 [o.errors.length===0,'No browser runtime errors']
 ];
 for(const [ok,message] of checks)if(!ok)throw Error(message);return {passed:checks.length,scope:'Live preview structure, focus, responsive targets and reader input'};
}
export function checkFileloomNegativeFixtures(){const good={groups:32,duplicateIds:[],widths:[{viewport:320,scrollWidth:320},{viewport:390,scrollWidth:390}],compactTargets:[{width:44,height:44}],sheetForward:'Close newfolder sheet',sheetReverse:'Create folder',focusReturned:true,repeatSheet:true,trackBefore:7,trackAfter:7,keyboardPage:8,errors:[]};assertFileloomPreview(good);const bad=[{widths:[{viewport:320,scrollWidth:345}]},{compactTargets:[{width:31,height:44}]},{focusReturned:false},{repeatSheet:false},{trackAfter:20},{errors:['runtime error']}];for(const patch of bad){let rejected=false;try{assertFileloomPreview({...good,...patch});}catch{rejected=true;}if(!rejected)throw Error('Accepted a regression fixture');}return {rejected:bad.length};}
