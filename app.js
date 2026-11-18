const data=window.PROJECT;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const put=(id,html)=>document.getElementById(id).innerHTML=html;
put('milestones',data.milestones.map((m,i)=>`<article class="milestone"><span class="tag ${i===1?'current':i>1?'pending':''}">${esc(m[0])}</span><b>${esc(m[1])}</b><p>${esc(m[2])}</p></article>`).join(''));
put('floors',data.floors.map(f=>`<article class="floor"><strong>${esc(f[0])}</strong><div><h3>${esc(f[1])}</h3><p>${esc(f[2])}</p></div><p class="constraint">${esc(f[3])}</p></article>`).join(''));
put('games',`<table><thead><tr><th>区域</th><th>小游戏</th><th>当前人数</th></tr></thead><tbody>${data.games.map(g=>`<tr>${g.map(x=>`<td>${esc(x)}</td>`).join('')}</tr>`).join('')}</tbody></table>`);
put('factions',data.factions.map(f=>`<article class="faction"><div class="swatch" aria-hidden="true">${f[2].map(c=>`<i style="background:${c}"></i>`).join('')}</div><small>${esc(f[0])}</small><h3>${esc(f[1])}</h3><b>${esc(f[3])}</b><p>${esc(f[4])}</p></article>`).join(''));
function renderDecisions(filter='全部'){const items=data.decisions.filter(d=>filter==='全部'||d[1]===filter);put('decision-list',items.map(d=>`<article class="decision"><span class="id">${esc(d[0])}</span><h3>${esc(d[2])}</h3><p>${esc(d[3])}</p><span class="category">${esc(d[1])}</span></article>`).join(''));document.getElementById('result-count').textContent=`显示 ${items.length} 项 / 共 ${data.decisions.length} 项`;}
renderDecisions();document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('[data-filter]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b));});renderDecisions(b.dataset.filter);}));
put('sources-list',data.sources.map(s=>`<article class="source-row"><b>${esc(s[0])}</b><p>${esc(s[1])}</p><span class="tag">${esc(s[2])}</span></article>`).join(''));
put('boards',data.boards.map(b=>`<article class="board"><b>${esc(b[0])}</b><p>${esc(b[1])}</p></article>`).join(''));
