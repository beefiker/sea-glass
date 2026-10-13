'use strict';
// Local fixtures only. All mutations stay in memory and reset on reload.
const FileloomDemo = (() => {
  const initial = [
    {id:'home',name:'On this device',kind:'root',parent:null},
    {id:'drive',name:'Google Drive',kind:'root',parent:null},
    {id:'nas',name:'Studio NAS',kind:'root',parent:null},
    {id:'books',name:'Books',kind:'folder',parent:'home',tone:'honey',date:'Yesterday'},
    {id:'photos',name:'Photos',kind:'folder',parent:'home',tone:'honey',date:'Oct 10'},
    {id:'projects',name:'Projects',kind:'folder',parent:'home',tone:'honey',date:'Oct 9'},
    {id:'coastal',name:'Coastal notes.epub',kind:'book',parent:'home',tone:'orchid',size:'1.8 MB',bytes:1800000,date:'Yesterday',cover:'coastal'},
    {id:'field',name:'A field guide.pdf',kind:'file',parent:'home',tone:'cornflower',size:'4.2 MB',bytes:4200000,date:'Oct 10',cover:'field'},
    {id:'shore',name:'By the shore.jpg',kind:'image',parent:'home',tone:'seafoam',size:'3.2 MB',bytes:3200000,date:'Oct 10',cover:'shore'},
    {id:'notes',name:'Weekend notes.txt',kind:'file',parent:'home',tone:'rose',size:'12 KB',bytes:12000,date:'Today',cover:'notes'},
    {id:'manifest',name:'Collection.csv',kind:'table',parent:'projects',tone:'seafoam',size:'2 KB',bytes:2000,date:'Today'},
    {id:'layers',name:'Sea glass.ai',kind:'layers',parent:'projects',tone:'orchid',size:'8.4 MB',bytes:8400000,date:'Yesterday'},
    {id:'harbour',name:'The quiet harbour.epub',kind:'book',parent:'books',tone:'cornflower',size:'2.1 MB',bytes:2100000,date:'Yesterday',cover:'harbour'},
    {id:'shore2',name:'Morning light.jpg',kind:'image',parent:'photos',tone:'seafoam',size:'2.4 MB',bytes:2400000,date:'Oct 10',cover:'shore'},
    {id:'drivebook',name:'Reading journal.epub',kind:'book',parent:'drive',tone:'rose',size:'1.2 MB',bytes:1200000,date:'Today',cover:'notes'},
    {id:'nasfolder',name:'Archive',kind:'folder',parent:'nas',tone:'honey',date:'Oct 1'}
  ];
  function create() {
    const state = {items:initial.map(x=>({...x})),folder:'home',history:['home'],historyIndex:0,
      selected:new Set(),transfer:null,query:'',sort:'name',layout:'list',status:'ready',page:'files',
      readerPage:7,readerPreview:7,readerTotal:24,fontSize:18,lineHeight:1.8,speechRate:1,
      collections:[],collection:'all',playback:'stopped',tapPreset:'edges',toolbar:['contents','search','bookmark','speech'],sequence:1};
    const item=id=>state.items.find(x=>x.id===id);
    const children=id=>state.items.filter(x=>x.parent===id);
    function ancestors(id) {const result=[];const seen=new Set();while(id){if(seen.has(id))throw Error('Fixture cycle');seen.add(id);const row=item(id);if(!row)break;result.unshift(row);id=row.parent;}return result;}
    const root=id=>ancestors(id)[0]?.id;
    function visible() {
      const source=state.page==='library'?state.items.filter(x=>x.kind==='book'&&(state.collection==='all'||state.collections.find(c=>c.id===state.collection)?.ids.includes(x.id))):children(state.folder);
      return source.filter(x=>x.name.toLowerCase().includes(state.query.toLowerCase())).sort((a,b)=>{
        if(a.kind==='folder'&&b.kind!=='folder')return -1;if(b.kind==='folder'&&a.kind!=='folder')return 1;
        return state.sort==='size'?(b.bytes||0)-(a.bytes||0):state.sort==='date'?({Today:100,Yesterday:99,'Oct 10':10,'Oct 9':9,'Oct 1':1}[b.date]||0)-({Today:100,Yesterday:99,'Oct 10':10,'Oct 9':9,'Oct 1':1}[a.date]||0):a.name.localeCompare(b.name);
      });
    }
    function navigate(id,{record=true}={}) {
      if(!['root','folder'].includes(item(id)?.kind))return false;
      state.folder=id;state.page='files';state.query='';state.status='ready';state.selected.clear();
      if(record&&state.history[state.historyIndex]!==id){state.history=state.history.slice(0,state.historyIndex+1);state.history.push(id);state.historyIndex++;}
      return true;
    }
    function history(delta){const next=state.historyIndex+delta;if(next<0||next>=state.history.length)return false;state.historyIndex=next;return navigate(state.history[next],{record:false});}
    function select(id,on){if(!visible().some(x=>x.id===id))return false;on?state.selected.add(id):state.selected.delete(id);return true;}
    function beginTransfer(mode){if(!['copy','move'].includes(mode)||!state.selected.size)return false;state.transfer={mode,ids:[...state.selected]};state.selected.clear();return true;}
    function canTransfer(target=state.folder){if(!state.transfer||!['folder','root'].includes(item(target)?.kind))return false;return state.transfer.ids.every(id=>item(id)&&id!==target&&!ancestors(target).some(x=>x.id===id)&&(state.transfer.mode!=='move'||item(id).parent!==target));}
    function uniqueName(name,parent){let result=name,n=2;while(children(parent).some(x=>x.name.toLowerCase()===result.toLowerCase())){const dot=name.lastIndexOf('.');const file=dot>0;result=file?name.slice(0,dot)+' ('+n+')'+name.slice(dot):name+' ('+n+')';n++;}return result;}
    function commitTransfer() {
      if(!canTransfer())return false;
      const {mode,ids}=state.transfer;
      function copy(id,parent){const from=item(id);const nested=children(id).map(x=>x.id);const next={...from,id:'sample-'+state.sequence++,parent,name:uniqueName(from.name,parent)};state.items.push(next);nested.forEach(child=>copy(child,next.id));}
      ids.forEach(id=>{if(mode==='copy')copy(id,state.folder);else{const from=item(id);from.name=uniqueName(from.name,state.folder);from.parent=state.folder;}});
      state.transfer=null;return true;
    }
    function createCollection(raw,ids){const name=raw.trim();if(!name||name.length>48)return {error:'Use 1–48 characters for the collection name.'};if(state.collections.some(c=>c.name.toLowerCase()===name.toLowerCase()))return {error:'A collection already uses that name.'};const members=[...new Set(ids)].filter(id=>item(id)?.kind==='book');if(!members.length)return {error:'Choose at least one sample book.'};const collection={id:'collection-'+state.sequence++,name,ids:members};state.collections.push(collection);state.collection=collection.id;state.selected.clear();return {collection};}
    function createFolder(raw){const name=raw.trim();if(!name||name.length>48||(name.includes('/')||name.includes(String.fromCharCode(92))))return {error:'Use 1–48 characters, without a slash.'};if(children(state.folder).some(x=>x.name.toLowerCase()===name.toLowerCase()))return {error:'A file or folder already uses that name.'};const next={id:'sample-'+state.sequence++,name,kind:'folder',parent:state.folder,tone:'honey',date:'Today'};state.items.push(next);return {item:next};}
    function reorder(id,direction){const from=state.toolbar.indexOf(id),to=from+direction;if(from<0||to<0||to>=state.toolbar.length)return false;[state.toolbar[from],state.toolbar[to]]=[state.toolbar[to],state.toolbar[from]];return true;}
    function moveBefore(id,target){const from=state.toolbar.indexOf(id),to=state.toolbar.indexOf(target);if(from<0||to<0||from===to)return false;state.toolbar.splice(from,1);state.toolbar.splice(state.toolbar.indexOf(target),0,id);return true;}
    function precision(key,value,min,max,step){const next=Math.min(max,Math.max(min,min+Math.round((value-min)/step)*step));state[key]=Number(next.toFixed(3));return state[key];}
    function previewPage(value){state.readerPreview=Math.min(state.readerTotal,Math.max(1,Math.round(value)));return state.readerPreview;}
    function commitPage(value=state.readerPreview){state.readerPage=previewPage(value);return state.readerPage;}
    return {state,item,children,ancestors,root,visible,navigate,history,select,beginTransfer,canTransfer,commitTransfer,createFolder,createCollection,reorder,moveBefore,precision,previewPage,commitPage};
  }
  return {create};
})();
