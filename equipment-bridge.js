/* Appended to the existing Nexplay runtime; retains all other Page content. */
const briefMode=new URLSearchParams(location.search).get('mode')==='brief';
let briefBusy=false;
const briefStable=v=>JSON.stringify(v,(_,x)=>x&&typeof x==='object'&&!Array.isArray(x)?Object.fromEntries(Object.keys(x).sort().map(k=>[k,x[k]])):x);
function briefReply(type,extra={}){window.parent.postMessage({type,target:picked,...extra},MAP_ORIGIN);}
if(briefMode){document.querySelector('main').hidden=true;jsonRequest(api).then(d=>briefReply('nexplay-equipment-state',{record:d.page.content.equipmentBriefs?.[picked]||null})).catch(e=>briefReply('nexplay-equipment-error',{message:e.message}));}
window.addEventListener('message',async e=>{
 if(!briefMode||e.origin!==MAP_ORIGIN||e.source!==window.parent||e.data?.target!==picked||!['nexplay-equipment-upload','nexplay-equipment-save'].includes(e.data.type))return;
 if(briefBusy){briefReply('nexplay-equipment-error',{message:'上一项操作尚未完成。'});return;}
 briefBusy=true;
 try{
  const d=e.data;
  const latest=(await jsonRequest(api)).page;
  if(!(latest.content.catalog||[]).some(x=>x.id===picked))throw Error('未知场所或游戏。');
  if(d.type==='nexplay-equipment-upload'){
   const file=d.file;if(!(file instanceof Blob)||!file.name||!/\.(xlsx|xls)$/i.test(file.name)||file.size>30*1024*1024)throw Error('请选择30MB以内的Excel文件。');
   const r=await jsonRequest('/api/aliyun-oss/folders/'+FOLDER_ID+'/images/upload',{method:'POST',headers:{'Content-Type':'application/octet-stream','X-File-Name':encodeURIComponent(file.name)},body:file});
   if(!r.asset||r.asset.folder_id!==FOLDER_ID||r.asset.size!==file.size||!safeUrl(r.asset.url))throw Error('附件上传结果校验失败，请核对存储记录后再试。');
   briefReply('nexplay-equipment-uploaded',{asset:r.asset});
  }else{
   if(typeof d.text!=='string'||d.text.length>12000)throw Error('文字说明最多12000字。');
   if(d.attachment&&(!safeUrl(d.attachment.url)||d.attachment.folder_id!==FOLDER_ID||!/\.(xlsx|xls)$/i.test(d.attachment.original_name||'')))throw Error('附件信息无效。');
   let result;
   for(let attempt=0;attempt<2;attempt++){
    const p=attempt?(await jsonRequest(api)).page:latest;
    if(briefStable(p.content.equipmentBriefs?.[picked]||null)!==briefStable(d.base||null))throw Error('此清单已被其他人修改，请重新打开后合并修改。当前输入仍保留。');
    result={text:d.text,attachment:d.attachment||null,updated_at:new Date().toISOString()};
    const content={...p.content,equipmentBriefs:{...(p.content.equipmentBriefs||{}),[picked]:result}};
    try{await jsonRequest(api,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({content,expected_content_revision:p.content_revision,version_message:'更新道具清单说明：'+picked})});break;}catch(err){if(err.status===409&&attempt===0)continue;throw err;}
   }
   briefReply('nexplay-equipment-saved',{record:result});
  }
 }catch(err){briefReply('nexplay-equipment-error',{message:err.message});}
 finally{briefBusy=false;}
});
