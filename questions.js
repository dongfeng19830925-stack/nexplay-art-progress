let topics=window.PROJECT.decisions; let shared=false;const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));const put=(id,html)=>document.getElementById(id).innerHTML=html;
function renderDecisions(filter='全部'){const items=topics.filter(d=>filter==='全部'||d[1]===filter);put('decision-list',items.map(d=>`<article class="decision"><span class="id">${esc(d[0])}</span><h3><a href="https://www.nexplay.world/p/6d0b15dd31ac4f09bf4c965b9373ce84?topic=${encodeURIComponent(d[0])}">${esc(d[2])} ↗</a></h3><p>${esc(d[3])}</p><span class="category">${esc(d[1])}${shared?` · <a href="https://www.nexplay.world/p/6d0b15dd31ac4f09bf4c965b9373ce84?mode=manage&amp;topic=${encodeURIComponent(d[0])}">编辑</a>`:''}</span></article>`).join(''));document.getElementById('result-count').textContent=`显示 ${items.length} 项 / 共 ${topics.length} 项`;}
const filters = document.querySelector('.filters');
renderDecisions();
filters.addEventListener('click', event => {
 const button = event.target.closest('[data-filter]');
 if (!button) return;
 filters.querySelectorAll('[data-filter]').forEach(item => {
  item.classList.toggle('active', item === button);
  item.setAttribute('aria-pressed', String(item === button));
 });
 renderDecisions(button.dataset.filter);
});
window.updateDecisionTopics = rows => {
 if (!Array.isArray(rows)) return;
 topics = rows;
 const current = filters.querySelector('.active').dataset.filter;
 const categories = ['全部', ...new Set(['策划','空间','制作', ...rows.map(row => row[1])])];
 filters.replaceChildren(...categories.map(category => {
  const button = document.createElement('button');
  button.textContent = category;
  button.dataset.filter = category;
  const selected = category === (categories.includes(current) ? current : '全部');
  button.classList.toggle('active', selected);
  button.setAttribute('aria-pressed', String(selected));
  return button;
 }));
 const saved = new URLSearchParams(location.search).get('saved');
 const row = rows.find(item => item[0] === saved);
 if (row) document.getElementById('topic-save-status').textContent = '已保存议题 '+row[0]+' · '+row[2];
 shared = true;
 document.getElementById('new-topic').hidden = false;
 renderDecisions(document.querySelector('[data-filter].active').dataset.filter);
};
