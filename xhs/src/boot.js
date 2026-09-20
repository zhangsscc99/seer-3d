(function(){
 'use strict';
 function fallback(){
  var pane=document.getElementById('fatal-error');
  if(!pane)return;
  var message=pane.querySelector('[data-error-message]');
  if(message)message.textContent='小路暂时没有铺好，点“重新进入”再试一次。';
  pane.hidden=false;pane.classList.add('active');pane.setAttribute('aria-hidden','false');
  var loading=document.getElementById('stage-loading');if(loading)loading.hidden=true;
 }
 window.addEventListener('error',fallback,true);
 window.addEventListener('unhandledrejection',fallback);
 document.addEventListener('click',function(event){
  var node=event.target;
  if(node&&node.getAttribute('data-retry')==='true')location.reload();
 });
})();
