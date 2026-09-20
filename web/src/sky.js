import * as THREE from 'three';
const cache=new Map();
// Separate source palettes: the shopping street has a much bluer sky than the coast.
const palettes={home:['#55c4f5','#c8eff4'],castle:['#79b5e6','#c9ebf0'],church:['#8cd3e1','#d7f1ec'],street:['#559ff0','#c4edf3'],beach:['#74c8dc','#b6e6e9'],farm:['#80b5e6','#e5f2e8'],ranch:['#86b7ed','#e4f4f2'],ram:['#43b1e4','#bdece9']};
export function referenceSky(id){
 if(cache.has(id))return cache.get(id);
 const [top,bottom]=palettes[id]||palettes.castle,canvas=document.createElement('canvas');canvas.width=8;canvas.height=512;
 const ctx=canvas.getContext('2d'),gradient=ctx.createLinearGradient(0,0,0,512);gradient.addColorStop(0,top);gradient.addColorStop(.8,bottom);gradient.addColorStop(1,bottom);ctx.fillStyle=gradient;ctx.fillRect(0,0,8,512);
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.name=id+' reference sky';cache.set(id,texture);return texture;
}
