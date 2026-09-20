// Keep one landscape coordinate system even when the host WebView stays portrait.
// No orientation lock or sensor permission is needed: CSS rotates the whole app.
export function createLandscapeLayout(shell) {
 const listeners=[];
 let state=null;
 document.documentElement.style.overflow='hidden';
 document.body.style.overflow='hidden';
 document.body.style.margin='0';
 shell.style.position='fixed';
 shell.style.transformOrigin='0 0';

 function snapshot(){return Object.assign({},state);}
 function resize(){
  const viewportWidth=Math.max(1,window.innerWidth||document.documentElement.clientWidth||1);
  const viewportHeight=Math.max(1,window.innerHeight||document.documentElement.clientHeight||1);
  const rotated=viewportHeight>viewportWidth;
  const width=rotated?viewportHeight:viewportWidth;
  const height=rotated?viewportWidth:viewportHeight;
  const changed=!state||state.viewportWidth!==viewportWidth||state.viewportHeight!==viewportHeight;
  state={width:width,height:height,logicalWidth:width,logicalHeight:height,viewportWidth:viewportWidth,viewportHeight:viewportHeight,rotated:rotated};
  shell.style.width=width+'px';
  shell.style.height=height+'px';
  shell.style.left=rotated?viewportWidth+'px':'0px';
  shell.style.top='0px';
  shell.style.transform=rotated?'rotate(90deg)':'none';
  shell.setAttribute('data-rotated',rotated?'true':'false');
  if(changed){
   listeners.slice().forEach(function(fn){fn(snapshot());});
   const event=document.createEvent('Event');event.initEvent('manor:layout',false,false);window.dispatchEvent(event);
  }
 }

 function bounds(element){
  const node=element||shell;
  const rect=node.getBoundingClientRect();
  return {rect:rect,width:node.clientWidth||(state.rotated?rect.height:rect.width)||1,height:node.clientHeight||(state.rotated?rect.width:rect.height)||1};
 }
 function toLocal(clientX,clientY,element){
  const b=bounds(element),rect=b.rect;
  if(state.rotated)return {x:(clientY-rect.top)*b.width/(rect.height||1),y:(rect.right-clientX)*b.height/(rect.width||1)};
  return {x:(clientX-rect.left)*b.width/(rect.width||1),y:(clientY-rect.top)*b.height/(rect.height||1)};
 }
 function toClient(localX,localY,element){
  const b=bounds(element),rect=b.rect;
  if(state.rotated)return {x:rect.right-localY*(rect.width||1)/b.height,y:rect.top+localX*(rect.height||1)/b.width};
  return {x:rect.left+localX*(rect.width||1)/b.width,y:rect.top+localY*(rect.height||1)/b.height};
 }
 function onResize(fn){
  listeners.push(fn);
  return function(){const i=listeners.indexOf(fn);if(i>=0)listeners.splice(i,1);};
 }
 resize();
 window.addEventListener('resize',resize);
 // visualViewport is optional; innerWidth/innerHeight stay the layout authority.
 if(window.visualViewport&&window.visualViewport.addEventListener)window.visualViewport.addEventListener('resize',resize);
 return {getState:snapshot,toLocal:toLocal,toClient:toClient,onResize:onResize};
}
