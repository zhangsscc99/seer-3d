let saving=false;
function nativeFailure(error){
 const text=error&&(error.errMsg||error.message)||'';
 if(/cancel|取消/i.test(text))return '已取消保存，照片仍在这里。';
 if(/auth|permission|denied|权限|拒绝/i.test(text))return '还没有相册权限，请允许后再试。';
 return '暂时没有保存成功，请稍后再试。';
}
// The documented save API accepts this local Canvas data URI directly.
// No temporary path, browser download, or external bridge is required.
export function savePostcard(dataUrl,toast){
 if(saving)return;
 const miniTool=window.xhs&&window.xhs.miniTool;
 if(!miniTool||typeof miniTool.saveImageToPhotosAlbum!=='function'){
  toast('照片已生成，请在小红书 App 内保存到相册。');return;
 }
 if(typeof dataUrl!=='string'||!/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(dataUrl)){
  toast('请先拍一张照片。');return;
 }
 saving=true;let settled=false;toast('正在保存到相册…');
 function finish(error){if(settled)return;settled=true;saving=false;toast(error?nativeFailure(error):'照片已保存到相册。');}
 try{
  const result=miniTool.saveImageToPhotosAlbum({filePath:dataUrl,success:result=>finish(result&&/:fail/.test(result.errMsg||'')?result:null),fail:finish});
  if(result&&typeof result.then==='function')result.then(result=>finish(result&&/:fail/.test(result.errMsg||'')?result:null),finish);
 }catch(error){finish(error);}
}
