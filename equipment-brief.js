/* Shared equipment description UI. Storage requests run on Nexplay's origin. */
(()=>{
const origin='https://www.nexplay.world',page='5073efe36816492e83ea9381b0ddf4bd';
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safe=s=>{try{return new URL(s).protocol==='https:'?s:'';}catch{return '';}};
let current;
window.mountEquipmentBrief=(key,original)=>{
 const panel=document.getElementById('panel');
 panel.innerHTML=`<h3>道具清单说明</h3><p id="equipment-description" style="white-space:pre-wrap;overflow-wrap:anywhere"></p><div id="equipment-download"></div><button type="button" class="button" id="equipment-edit" disabled>修改说明与附件</button><section id="equipment-editor" hidden><label for="equipment-text">道具清单文字说明</label><textarea id="equipment-text" maxlength="12000" style="min-height:220px"></textarea><label for="equipment-file">Excel附件（可选，最多30MB）</label><input id="equipment-file" type="file" accept=".xlsx,.xls"><p id="equipment-file-name"></p><button type="button" id="equipment-remove">取消附件关联</button><div><button type="button" class="button" id="equipment-save">保存说明与附件</button><button type="button" class="button" id="equipment-cancel">取消修改</button></div></section><p id="equipment-status" role="status">正在连接共享数据…</p><iframe id="equipment-bridge" title="道具清单数据连接" src="${origin}/p/${page}?target=${encodeURIComponent(key)}&mode=brief" hidden></iframe>`;
 const get=id=>document.getElementById(id);
 const state={key,original,get,frame:get('equipment-bridge'),record:null,attachment:null,ready:false,busy:false};current=state;
 const send=data=>state.frame.contentWindow.postMessage({...data,target:key},origin);
 const status=t=>get('equipment-status').textContent=t;
 const showFile=()=>{get('equipment-file-name').textContent=state.attachment?.original_name||'未添加附件';};
 state.render=()=>{get('equipment-description').textContent=state.record?.text??original;const a=state.record?.attachment;get('equipment-download').innerHTML=a&&safe(a.url)?`<p><a href="${escape(a.url)}" download="${escape(a.original_name)}" target="_blank" rel="noopener">下载道具清单 · ${escape(a.original_name)} ↗</a></p>`:'<p class="note">暂无Excel附件。</p>';};
 state.lock=b=>{state.busy=b;['equipment-save','equipment-cancel','equipment-file','equipment-remove'].forEach(id=>get(id).disabled=b);};
 state.render();
 get('equipment-edit').onclick=()=>{get('equipment-text').value=state.record?.text??original;state.attachment=state.record?.attachment||null;showFile();get('equipment-editor').hidden=false;get('equipment-edit').hidden=true;get('equipment-text').focus();};
 get('equipment-cancel').onclick=()=>{get('equipment-editor').hidden=true;get('equipment-edit').hidden=false;get('equipment-file').value='';status('已取消修改。');};
 get('equipment-remove').onclick=()=>{state.attachment=null;showFile();};
 get('equipment-file').onchange=e=>{const file=e.target.files[0];e.target.value='';if(!file)return;if(!/\.(xlsx|xls)$/i.test(file.name)||file.size>30*1024*1024){status('请选择30MB以内的.xlsx或.xls文件。');return;}state.lock(true);status('正在上传Excel附件，请等待服务端确认…');send({type:'nexplay-equipment-upload',file});};
 get('equipment-save').onclick=()=>{state.lock(true);status('正在保存…');send({type:'nexplay-equipment-save',text:get('equipment-text').value,attachment:state.attachment,base:state.record});};
 state.showFile=showFile;state.status=status;
 state.timer=setTimeout(()=>{if(current===state&&!state.ready)status('共享数据连接较慢，请稍后重新打开此标签。当前显示原始设备需求。');},15000);
};
window.addEventListener('message',e=>{
 const s=current;if(!s||!s.frame.isConnected||e.origin!==origin||e.source!==s.frame.contentWindow||e.data?.target!==s.key)return;
 const d=e.data;if(!['nexplay-equipment-state','nexplay-equipment-uploaded','nexplay-equipment-saved','nexplay-equipment-error'].includes(d.type))return;
 if(d.type==='nexplay-equipment-state'){clearTimeout(s.timer);s.ready=true;s.record=d.record||null;s.render();s.get('equipment-edit').disabled=false;s.status('');}
 if(d.type==='nexplay-equipment-uploaded'){s.attachment=d.asset;s.showFile();s.lock(false);s.status('附件已上传。点击“保存说明与附件”后公开关联。');}
 if(d.type==='nexplay-equipment-saved'){s.record=d.record;s.render();s.lock(false);s.get('equipment-editor').hidden=true;s.get('equipment-edit').hidden=false;s.status('已保存，其他参与者重新打开即可查看。');}
 if(d.type==='nexplay-equipment-error'){s.lock(false);s.status(d.message||'保存失败，请重试。');}
});
})();
