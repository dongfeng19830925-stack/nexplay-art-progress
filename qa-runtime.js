const topic=new URLSearchParams(location.search).get('topic')||'D01';
const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));let snap,editing=null,old=null,replyTo=null;
const authorName = $('name');
authorName.closest('label').firstChild.textContent = '本人真实姓名（仅限汉字）';
authorName.autocomplete = 'name';
authorName.addEventListener('input', () => authorName.setCustomValidity(''));
const recipientLabel=document.createElement('label');recipientLabel.id='recipient-label';recipientLabel.textContent='指定答复人（选填）';const recipientInput=document.createElement('input');recipientInput.id='recipient';recipientInput.maxLength=80;recipientInput.placeholder='填写姓名，留空表示任何人均可回答';recipientLabel.appendChild(recipientInput);$('text').closest('label').before(recipientLabel);
async function api(body){const r=await fetch('/api/pages/'+window.QA_ID,{cache:'no-store',method:body?'PUT':'GET',headers:{Authorization:'Bearer '+window.QA_KEY,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});const d=await r.json();if(!r.ok)throw Error(r.status===409?'其他人刚更新了内容，请刷新后重试。':d.message||'保存失败');return d.page;}
async function load(){snap=await api();const t=snap.content.topics.find(t=>t[0]===topic);$('title').textContent=t?t[2]:'共同问答';$('intro').textContent=t?t[3]:'';render();}
const RECENT_MS=72*60*60*1000;
function entryColor(x,all,now=Date.now()){const fresh=t=>Number.isFinite(Date.parse(t))&&now-Date.parse(t)<RECENT_MS;if(x.parent_id)return fresh(x.updated_at)?'#1859ac':'#171c19';return !all.some(r=>r.parent_id===x.id)||fresh(x.created_at||x.updated_at)?'#b72d2d':'#171c19';}
const REPLY_EDIT_MS = 15 * 60 * 1000;
function canEditEntry(entry, now = Date.now()) {
 if (!entry) return false;
 if (!entry.parent_id) return true;
 const age = now - Date.parse(entry.created_at || entry.updated_at);
 return age >= 0 && age < REPLY_EDIT_MS;
}
function render(){if($('form-home')&&$('form'))$('form-home').appendChild($('form'));const all=(snap.content.entries||[]).filter(x=>x.topic===topic);const time=x=>new Date(x.updated_at).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false});const row=x=>`<article data-entry="${esc(x.id)}" style="color:${entryColor(x,all)}"><small>${esc(x.name)} · ${esc(time(x))}（北京时间）</small><p style="white-space:pre-wrap;overflow-wrap:anywhere">${x.parent_id?'回答：':'问题：'}${esc(x.text)}</p>${!x.parent_id?`<p style="font-size:14px;color:#59665f">指定答复人：${esc(x.assignee_name||'任何人')}</p>`:''}${canEditEntry(x)?`<button data-edit="${esc(x.id)}">修改</button>`:''}${!x.parent_id?`<button data-reply="${esc(x.id)}">回答此问题</button>`:''}</article>`;const recent=q=>all.filter(x=>x.id===q.id||x.parent_id===q.id).map(x=>x.updated_at).sort().at(-1);$('rows').innerHTML=all.filter(x=>!x.parent_id).sort((a,b)=>recent(b).localeCompare(recent(a))).map(q=>`<section>${row(q)}<div style="margin-left:28px;border-left:2px solid #d0d9e4;padding-left:20px">${all.filter(x=>x.parent_id===q.id).sort((a,b)=>b.updated_at.localeCompare(a.updated_at)).map(row).join('')}</div><div id="reply-${esc(q.id)}"></div></section>`).join('')||'<p>暂无讨论，请添加问题。</p>';document.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>{const entry=all.find(x=>x.id===b.dataset.edit);if(!canEditEntry(entry)){b.remove();$('status').textContent='回复已超过15分钟，请另发一条回复。';return;}old=entry;editing=old.id;replyTo=old.parent_id||null;placeForm(replyTo);$('text').value=old.text;$('text').focus();});document.querySelectorAll('[data-reply]').forEach(b=>b.onclick=()=>{editing=null;old=null;replyTo=b.dataset.reply;placeForm(replyTo);$('text').value='';$('text').focus();});}
function placeForm(id){(id?$('reply-'+id):$('form-home')).appendChild($('form'));$('kind').value=id?'回答':'问题';$('kind').disabled=true;$('recipient-label').hidden=!!id;$('recipient').value=editing?(old?.assignee_name||''):'';}
$('form').onsubmit=async e=>{e.preventDefault();const name=authorName.value,text=$('text').value.trim();if(!/^\p{Unified_Ideograph}+$/u.test(name)){authorName.setCustomValidity('请填写本人真实姓名，只能使用汉字。');authorName.reportValidity();return;}if(!text)return;$('save').disabled=true;try{const latest=await api(),entries=latest.content.entries||[];if(!latest.content.topics.some(row=>row[0]===topic))throw Error('找不到该议题，请返回列表选择有效议题。');if(editing&&entries.find(x=>x.id===editing)?.updated_at!==old.updated_at)throw Error('该条内容已被其他人修改，请重新载入后编辑。输入内容已保留。');if(editing&&!canEditEntry(entries.find(x=>x.id===editing)))throw Error('回复已超过15分钟。输入已保留，请复制后另发一条回复。');const record={id:editing||crypto.randomUUID(),topic,kind:replyTo?'回答':'问题',parent_id:replyTo,name,text,assignee_name:replyTo?'':$('recipient').value.trim(),assignee_id:replyTo?null:(old?.assignee_name===$('recipient').value.trim()?old?.assignee_id||null:null),created_at:old?.created_at||old?.updated_at||new Date().toISOString(),updated_at:new Date().toISOString()};const history=[...(latest.content.history||[])];if(editing)history.push(old);snap=await api({content:{...latest.content,entries:[...entries.filter(x=>x.id!==record.id),record],history},expected_content_revision:latest.content_revision,version_message:'共同问答：'+topic+' / '+name});editing=null;old=null;replyTo=null;placeForm(null);$('text').value='';render();$('status').textContent='已保存，最新更新显示在最前。';}catch(e){$('status').textContent=e.message;}finally{$('save').disabled=false;}};
$('cancel').onclick=()=>{editing=null;old=null;replyTo=null;placeForm(null);$('text').value='';$('status').textContent='已取消修改';};$('refresh').onclick=()=>{if($('text').value.trim()){$('status').textContent='请先保存或取消当前输入。';return;}load().then(()=>placeForm(null)).catch(e=>$('status').textContent=e.message);};load().then(()=>placeForm(null)).catch(e=>$('status').textContent=e.message);

setInterval(()=>{const all=(snap?.content.entries||[]).filter(x=>x.topic===topic);document.querySelectorAll('[data-entry]').forEach(row=>{const entry=all.find(x=>x.id===row.dataset.entry);if(!entry)return;row.style.color=entryColor(entry,all);if(!canEditEntry(entry))row.querySelector('[data-edit]')?.remove();});},1000);

if(new URLSearchParams(location.search).get('mode')==='updates'){
 const sendUpdates=async()=>{try{const page=await api();parent.postMessage({type:'nexplay-qa-updates',topics:page.content.topics,entries:(page.content.entries||[]).map(x=>({topic:x.topic,parent_id:x.parent_id,created_at:x.created_at||x.updated_at,updated_at:x.updated_at})).concat(page.content.topics.filter(t=>t[4]).map(t=>({topic:t[0],created_at:t[4]})))},'https://dongfeng19830925-stack.github.io');}catch(e){}};sendUpdates();setInterval(sendUpdates,60000);
}
async function manageTopic() {
 const params = new URLSearchParams(location.search);
 const id = params.get('topic');
 const back = 'https://dongfeng19830925-stack.github.io/nexplay-art-progress/questions.html';
 const panel = document.createElement('main');
 panel.innerHTML = '<a href="'+back+'">返回重要决策问答</a><h1>'+(id?'编辑议题':'新增议题')+'</h1><form><label>标题 <input name="title" required maxlength="120"></label><label>部门或专业口 <select name="category" required><option value="">请选择</option><option>游戏策划</option><option>美术设计</option><option>落地执行</option></select></label><label>说明 <textarea name="description" maxlength="12000"></textarea></label><button disabled>保存议题</button></form><p role="status"></p>';
 for (const child of document.body.children) if (child.tagName !== 'SCRIPT') child.hidden = true;
 document.body.append(panel);
 const form = panel.querySelector('form');
 const status = panel.querySelector('[role=status]');
 const button = form.querySelector('button');
 try {
  const initial = await api();
  const original = initial.content.topics.find(row => row[0] === id);
  if (id && !original) throw Error('找不到该议题。');
  if (original) ['category','title','description'].forEach((field,index)=> form.elements[field].value = original[index+1]);
  button.disabled = false;
  form.onsubmit = async event => {
   event.preventDefault();
   const values = new FormData(form);
   const title = values.get('title').trim();
   const category = values.get('category').trim();
   if (!title || !category) { status.textContent = '请输入议题标题和部门或专业口。'; return; }
   button.disabled = true;
   try {
    const latest = await api();
    const topics = [...latest.content.topics];
    const index = topics.findIndex(row => row[0] === id);
    if (id && JSON.stringify(topics[index]) !== JSON.stringify(original)) throw Error('议题已被修改。请记录当前输入，重新打开后再编辑。');
    const next = id || 'D'+String(1+Math.max(0,...topics.map(row=>Number(row[0].slice(1))||0))).padStart(2,'0');
    const row = [next,category,title,values.get('description').trim(),original?.[4] || new Date().toISOString()];
    if (id) topics[index] = row;
    else topics.unshift(row);
    await api({content:{...latest.content,topics},expected_content_revision:latest.content_revision,version_message:id?'编辑重要决策议题':'新增重要决策议题'});
    location.assign(back+'?saved='+encodeURIComponent(next));
   } catch(error) { status.textContent = error.message; button.disabled = false; }
  };
 } catch(error) { status.textContent = error.message; }
}
if(new URLSearchParams(location.search).get('mode')==='manage') manageTopic();
