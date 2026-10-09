
/* ---------- ESTADO / STORAGE ---------- */
const STORAGE_KEY = 'glassfinance_data_v1';
let state = JSON.parse(localStorage.getItem(STORAGE_KEY)) || { accounts: [], moves: [], privacy:false };

function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); render(); }

const COLORS = ['#8B5CF6','#A78BFA','#2563EB','#06B6D4','#00E5A8','#FACC15','#FF5B6E','#F0729C'];
const BANK_PRESETS = [
  { nome:'Banco do Brasil', cor:'#F8D117', icone:'BB' },
  { nome:'Nubank', cor:'#8A05BE', icone:'NU' },
  { nome:'Bradesco', cor:'#CC092F', icone:'BR' },
  { nome:'Itaú', cor:'#EC7000', icone:'IT' },
  { nome:'Caixa', cor:'#005CA9', icone:'CX' },
  { nome:'Santander', cor:'#EC0000', icone:'ST' },
  { nome:'Inter', cor:'#FF7A00', icone:'IN' },
  { nome:'Mercado Pago', cor:'#009EE3', icone:'MP' },
  { nome:'PicPay', cor:'#11C76F', icone:'PP' },
  { nome:'Sicoob', cor:'#00AE9D', icone:'SB' },
  { nome:'Sicredi', cor:'#32A041', icone:'SD' },
  { nome:'C6 Bank', cor:'#242424', icone:'C6' },
  { nome:'Outro', cor:'#6366F1', icone:'' }
];
const CAT_INCOME = ['PIX','Transferência','Dinheiro','Salário','Venda','Outros'];
const CAT_EXPENSE = ['Cartão','Energia','Água','Internet','Combustível','Alimentação','Mercado','Empréstimo','Outros'];

function fmt(v){
  return new Intl.NumberFormat('pt-BR', {style:'currency', currency:'BRL'}).format(v);
}
function fmtDate(d){
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('pt-BR');
}
function todayStr(){ return new Date().toISOString().slice(0,10); }
function initials(name){ return name.trim().slice(0,2).toUpperCase(); }
function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,7); }

/* ---------- TOAST ---------- */
function toast(msg, icon='✓'){
  const wrap = document.getElementById('toastWrap');
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `<span>${icon}</span><span>${msg}</span>`;
  wrap.appendChild(el);
  setTimeout(()=>{ el.style.opacity='0'; setTimeout(()=>el.remove(),200); }, 2600);
}

/* ---------- NAV ---------- */
document.querySelectorAll('.nav-item').forEach(item=>{
  item.addEventListener('click', ()=>{
    document.querySelectorAll('.nav-item').forEach(i=>i.classList.remove('active'));
    item.classList.add('active');
    document.querySelectorAll('.view').forEach(v=>v.style.display='none');
    document.getElementById('view-'+item.dataset.view).style.display='block';
    if(item.dataset.view==='relatorios') renderReports();
    if(item.dataset.view==='movimentacoes') renderMoves();
  });
});

/* ---------- THEME ---------- */
function setTheme(t){
  const meta = document.getElementById('meta-theme-color');
  if(meta) meta.content = t === 'dark' ? '#050505' : '#F9FAFB';
  document.body.setAttribute('data-theme', t);
  state.theme = t; localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  document.querySelectorAll('.theme-btn:not(.privacy-top-btn)').forEach(b=>b.textContent = t==='dark' ? '🌙' : '☀️');
  document.getElementById('segDark').classList.toggle('active', t==='dark');
  document.getElementById('segLight').classList.toggle('active', t==='light');
}
['themeBtn','themeBtn2','themeBtn3','themeBtn4','themeBtn5'].forEach(id=>{
  const el = document.getElementById(id);
  if(el) el.addEventListener('click', ()=> setTheme(document.body.getAttribute('data-theme')==='dark' ? 'light':'dark'));
});
if(state.theme) setTheme(state.theme);

/* ---------- PRIVACY ---------- */
function updatePrivacyUI(){
  const icon = state.privacy ? '🙈':'👁';
  const label = state.privacy ? 'Mostrar valores':'Ocultar valores';
  const pIcon = document.getElementById('privacyIcon');
  if(pIcon) pIcon.textContent = icon;
  const pLabel = document.getElementById('privacyLabel');
  if(pLabel) pLabel.textContent = label;
  document.querySelectorAll('.privacy-top-btn').forEach(b => b.textContent = icon);
}
function togglePrivacy(){
  state.privacy = !state.privacy; save();
  updatePrivacyUI();
}
document.getElementById('privacyToggle').addEventListener('click', togglePrivacy);
updatePrivacyUI();

/* ---------- MODALS ---------- */
function openModal(id){ document.getElementById(id).classList.add('open'); }
function closeModal(id){ document.getElementById(id).classList.remove('open'); }
document.querySelectorAll('.modal-overlay').forEach(ov=>{
  ov.addEventListener('click', e=>{ if(e.target===ov) ov.classList.remove('open'); });
});

/* ---------- FAB ---------- */
const fabBtn = document.getElementById('fabBtn');
const fabMenu = document.getElementById('fabMenu');
fabBtn.addEventListener('click', ()=> {
  fabMenu.classList.toggle('open');
  fabBtn.classList.toggle('rotate');
});
document.addEventListener('click', e=>{
  if(!fabBtn.contains(e.target) && !fabMenu.contains(e.target)) {
    fabMenu.classList.remove('open');
    fabBtn.classList.remove('rotate');
  }
});
function quickAction(type){ fabMenu.classList.remove('open'); fabBtn.classList.remove('rotate'); openMoveModal(type, state.accounts[0]?.id); }

/* ---------- CONTA MODAL ---------- */
function buildColorRow(selected){
  document.getElementById('colorPreview').style.background = selected;
  const row = document.getElementById('colorRow'); row.innerHTML='';
  COLORS.forEach(c=>{
    const d = document.createElement('div');
    d.className='color-dot'+(c===selected?' selected':'');
    d.style.background=c; d.dataset.color=c;
    d.onclick=()=>{
      document.querySelectorAll('.color-dot').forEach(x=>x.classList.remove('selected'));
      d.classList.add('selected');
      document.getElementById('colorPreview').style.background = c;
    };
    row.appendChild(d);
  });
}
function buildBankChips(selectedNome){
  const row = document.getElementById('bankChipRow'); row.innerHTML='';
  BANK_PRESETS.forEach(b=>{
    const chip = document.createElement('div');
    chip.className = 'bank-chip'+(b.nome===selectedNome?' selected':'');
    chip.textContent = b.nome;
    chip.onclick = ()=>{
      document.querySelectorAll('.bank-chip').forEach(x=>x.classList.remove('selected'));
      chip.classList.add('selected');
      if(b.nome!=='Outro'){
        document.getElementById('contaNome').value = b.nome;
        document.getElementById('contaIcone').value = b.icone;
      } else {
        document.getElementById('contaNome').value='';
        document.getElementById('contaIcone').value='';
        document.getElementById('contaNome').focus();
      }
      document.querySelectorAll('.color-dot').forEach(x=>x.classList.remove('selected'));
      const match = document.querySelector(`.color-dot[data-color="${b.cor}"]`);
      if(match) match.classList.add('selected');
      document.getElementById('colorPreview').style.background = b.cor;
    };
    row.appendChild(chip);
  });
}
function openAccountModal(id){
  const acc = id ? state.accounts.find(a=>a.id===id) : null;
  document.getElementById('contaModalTitle').textContent = acc ? 'Editar Conta' : 'Nova Conta';
  document.getElementById('contaEditId').value = id || '';
  document.getElementById('contaNome').value = acc ? acc.nome : '';
  document.getElementById('contaSaldo').value = acc ? acc.saldo : '';
  document.getElementById('contaIcone').value = acc ? (acc.icone || '') : '';
  buildColorRow(acc ? acc.cor : COLORS[state.accounts.length % COLORS.length]);
  buildBankChips(acc ? acc.nome : null);
  openModal('modalConta');
}
function saveAccount(){
  const id = document.getElementById('contaEditId').value;
  const nome = document.getElementById('contaNome').value.trim();
  const saldo = parseFloat(document.getElementById('contaSaldo').value || 0);
  const icone = document.getElementById('contaIcone').value.trim().toUpperCase();
  const colorEl = document.querySelector('.color-dot.selected');
  const cor = colorEl ? colorEl.dataset.color : COLORS[0];
  if(!nome){ toast('Digite um nome para a conta','⚠️'); return; }
  if(id){
    const acc = state.accounts.find(a=>a.id===id);
    acc.nome = nome; acc.saldo = saldo; acc.cor = cor; acc.icone = icone;
    toast('Conta atualizada');
  } else {
    state.accounts.push({ id: uid(), nome, saldo, cor, icone, favorito:false });
    toast('Conta criada');
  }
  closeModal('modalConta'); save();
}
function deleteAccount(id){
  document.getElementById('confirmText').textContent = 'Excluir esta conta e todo o seu histórico?';
  document.getElementById('confirmBtn').onclick = ()=>{
    state.accounts = state.accounts.filter(a=>a.id!==id);
    state.moves = state.moves.filter(m=>m.contaId!==id);
    closeModal('modalConfirm'); save(); toast('Conta excluída','🗑');
  };
  openModal('modalConfirm');
}
function toggleFavorite(id){
  const acc = state.accounts.find(a=>a.id===id);
  acc.favorito = !acc.favorito; save();
}

/* ---------- MOVE MODAL ---------- */
function openMoveModal(type, accountId){
  document.getElementById('moveType').value = type;
  document.getElementById('moveModalTitle').textContent = type==='receita' ? 'Adicionar Receita' : 'Adicionar Despesa';
  document.getElementById('moveSaveBtn').style.background = type==='receita' ? 'var(--green)' : 'var(--red)';
  const sel = document.getElementById('moveAccountSelect');
  sel.innerHTML = state.accounts.map(a=>`<option value="${a.id}" ${a.id===accountId?'selected':''}>${a.nome}</option>`).join('');
  const catSel = document.getElementById('moveCategoria');
  catSel.innerHTML = (type==='receita'?CAT_INCOME:CAT_EXPENSE).map(c=>`<option>${c}</option>`).join('');
  document.getElementById('moveValor').value='';
  document.getElementById('moveDesc').value='';
  document.getElementById('moveData').value = todayStr();
  openModal('modalMove');
}
function saveMove(){
  const type = document.getElementById('moveType').value;
  const contaId = document.getElementById('moveAccountSelect').value;
  const valor = parseFloat(document.getElementById('moveValor').value || 0);
  const desc = document.getElementById('moveDesc').value.trim() || (type==='receita'?'Receita':'Despesa');
  const categoria = document.getElementById('moveCategoria').value;
  const data = document.getElementById('moveData').value || todayStr();
  if(!contaId){ toast('Cadastre uma conta primeiro','⚠️'); return; }
  if(valor<=0){ toast('Informe um valor válido','⚠️'); return; }
  const acc = state.accounts.find(a=>a.id===contaId);
  acc.saldo += (type==='receita' ? valor : -valor);
  state.moves.push({ id:uid(), contaId, type, valor, desc, categoria, data, saldoApos:acc.saldo, criadoEm: Date.now() });
  closeModal('modalMove'); save();
  toast(type==='receita' ? 'Receita adicionada' : 'Despesa registrada', type==='receita'?'💰':'💸');
}

/* ---------- HISTÓRICO ---------- */
function openHistory(accountId){
  const acc = state.accounts.find(a=>a.id===accountId);
  document.getElementById('histTitle').textContent = 'Histórico — ' + acc.nome;
  const list = state.moves.filter(m=>m.contaId===accountId).sort((a,b)=>b.criadoEm-a.criadoEm);
  const el = document.getElementById('histList');
  el.innerHTML = list.length ? list.map(m=>moveRowHtml(m,false)).join('') : '<div class="empty-state"><div class="icon">📄</div>Nenhuma movimentação ainda</div>';
  openModal('modalHist');
}

/* ---------- RENDER: ACCOUNTS ---------- */
function accountCardHtml(a){
  const negative = a.saldo < 0;
  return `
  <div class="account-card ${negative?'negative':''}" style="--acc-color: ${a.cor}">
    <div class="account-topbar"></div>
    <div class="account-head">
      <div class="account-id">
        <div class="avatar">${a.icone ? a.icone : initials(a.nome)}</div>
        <div class="account-name">${a.nome}</div>
      </div>
      <button class="account-star ${a.favorito?'fav':''}" onclick="toggleFavorite('${a.id}')">${a.favorito?'★':'☆'}</button>
    </div>
    <div class="account-balance-label">Saldo</div>
    <div class="account-balance mono ${negative?'negative':''} ${state.privacy?'hidden-value':''}">${fmt(a.saldo)}</div>
    <div class="account-actions">
      <button class="mini-btn income" onclick="openMoveModal('receita','${a.id}')">➕<span>Receita</span></button>
      <button class="mini-btn expense" onclick="openMoveModal('despesa','${a.id}')">➖<span>Despesa</span></button>
      <button class="mini-btn hist" onclick="openHistory('${a.id}')">📄<span>Hist.</span></button>
      <button class="mini-btn edit" onclick="openAccountModal('${a.id}')">✏️<span>Edit.</span></button>
      <button class="mini-btn del" onclick="deleteAccount('${a.id}')">🗑<span>Excl.</span></button>
    </div>
  </div>`;
}
function renderAccounts(){
  const sorted = [...state.accounts].sort((a,b)=> (b.favorito - a.favorito));
  const html = sorted.length ? sorted.map(accountCardHtml).join('') : `<div class="empty-state" style="grid-column:1/-1;"><div class="icon">🏦</div>Nenhuma conta cadastrada.<br>Clique em "+ Nova Conta" para começar.</div>`;
  document.getElementById('accountsGrid').innerHTML = html;
  document.getElementById('dashAccountsGrid').innerHTML = html;
  document.getElementById('contasCount').textContent = `(${state.accounts.length} contas)`;
  document.getElementById('dashAccCount').textContent = `(${state.accounts.length})`;
}

/* ---------- RENDER: MOVES ---------- */
let currentFilter = 'tudo';
document.querySelectorAll('.chip').forEach(c=>{
  c.addEventListener('click', ()=>{
    document.querySelectorAll('.chip').forEach(x=>x.classList.remove('active'));
    c.classList.add('active'); currentFilter = c.dataset.filter; renderMoves();
  });
});
document.getElementById('searchInput').addEventListener('input', renderMoves);

function inRange(dateStr, filter){
  const d = new Date(dateStr+'T00:00:00'); const now = new Date();
  if(filter==='tudo') return true;
  if(filter==='hoje') return dateStr === todayStr();
  if(filter==='semana'){ const start = new Date(now); start.setDate(now.getDate()-7); return d>=start; }
  if(filter==='mes') return d.getMonth()===now.getMonth() && d.getFullYear()===now.getFullYear();
  if(filter==='ano') return d.getFullYear()===now.getFullYear();
  return true;
}
function moveRowHtml(m, showAccount=true){
  const acc = state.accounts.find(a=>a.id===m.contaId);
  return `
  <div class="move-row">
    <div class="move-left">
      <div class="move-icon ${m.type}">${m.type==='receita'?'↑':'↓'}</div>
      <div class="move-info">
        <div class="move-desc">${m.desc}${showAccount && acc ? ' · '+acc.nome : ''}</div>
        <div class="move-meta">${fmtDate(m.data)} · ${m.categoria}</div>
      </div>
    </div>
    <div class="move-right">
      <div class="move-value ${m.type} mono ${state.privacy?'hidden-value':''}">${m.type==='receita'?'+':'-'}${fmt(m.valor)}</div>
      <div class="move-after mono ${state.privacy?'hidden-value':''}">saldo: ${fmt(m.saldoApos)}</div>
    </div>
  </div>`;
}
function renderMoves(){
  const q = (document.getElementById('searchInput').value||'').toLowerCase();
  let list = [...state.moves].sort((a,b)=>b.criadoEm-a.criadoEm).filter(m=>inRange(m.data, currentFilter));
  if(q){
    list = list.filter(m=>{
      const acc = state.accounts.find(a=>a.id===m.contaId);
      return (m.desc||'').toLowerCase().includes(q) || (m.categoria||'').toLowerCase().includes(q) ||
             (acc&&acc.nome.toLowerCase().includes(q)) || String(m.valor).includes(q);
    });
  }
  document.getElementById('movesList').innerHTML = list.length ? list.map(m=>moveRowHtml(m,true)).join('') :
    `<div class="empty-state"><div class="icon">🔎</div>Nenhuma movimentação encontrada</div>`;
}

/* ---------- STATS / DASHBOARD ---------- */
let barChart, pieChart;
function monthMoves(){
  const now = new Date();
  return state.moves.filter(m=>{ const d = new Date(m.data+'T00:00:00'); return d.getMonth()===now.getMonth() && d.getFullYear()===now.getFullYear(); });
}
function renderStats(){
  const total = state.accounts.reduce((s,a)=>s+a.saldo,0);
  const mm = monthMoves();
  const income = mm.filter(m=>m.type==='receita').reduce((s,m)=>s+m.valor,0);
  const expense = mm.filter(m=>m.type==='despesa').reduce((s,m)=>s+m.valor,0);
  document.getElementById('statTotal').textContent = fmt(total);
  document.getElementById('statIncome').textContent = fmt(income);
  document.getElementById('statExpense').textContent = fmt(expense);
  document.getElementById('statCount').textContent = state.moves.length;
  if(state.privacy){ ['statTotal','statIncome','statExpense'].forEach(id=>document.getElementById(id).classList.add('hidden-value')); }
  else { ['statTotal','statIncome','statExpense'].forEach(id=>document.getElementById(id).classList.remove('hidden-value')); }
  renderCharts(income, expense);
}
function renderCharts(income, expense){
  const ctxBar = document.getElementById('chartBars');
  const mm = monthMoves();
  const hasData = mm.length > 0;
  
  const days = {};
  if(hasData) {
    mm.forEach(m=>{ days[m.data] = days[m.data] || {in:0,out:0}; days[m.data][m.type==='receita'?'in':'out'] += m.valor; });
  } else {
    // Placeholder para empty state
    days[todayStr()] = {in: 0, out: 0}; 
  }
  
  const labels = Object.keys(days).sort();
  if(barChart) barChart.destroy();
  
  // Plugin customizado para texto no centro do Doughnut
  const centerTextPlugin = {
    id: 'centerText',
    beforeDraw: function(chart) {
      if (chart.config.type !== 'doughnut') return;
      var width = chart.width, height = chart.height, ctx = chart.ctx;
      ctx.restore();
      var fontSize = (height / 140).toFixed(2);
      ctx.font = "800 " + fontSize + "em Inter, sans-serif";
      ctx.textBaseline = "middle";
      ctx.fillStyle = document.body.getAttribute('data-theme') === 'light' ? '#111827' : '#F3F4F6';
      
      var text = hasData ? fmt(income - expense) : 'R$ 0,00';
      var textX = Math.round((width - ctx.measureText(text).width) / 2);
      var textY = height / 2;
      if(chart.options.plugins.legend.display && chart.options.plugins.legend.position === 'bottom') {
         textY -= 15;
      }
      
      ctx.fillText(text, textX, textY + 10);
      
      ctx.font = "600 " + (fontSize * 0.35) + "em Inter, sans-serif";
      ctx.fillStyle = "#9CA3AF";
      var subText = "Saldo do Mês";
      var subX = Math.round((width - ctx.measureText(subText).width) / 2);
      ctx.fillText(subText, subX, textY - 15);
      ctx.save();
    }
  };

  barChart = new Chart(ctxBar, { 
    type:'bar', 
    data:{ 
      labels: labels.map(d=>fmtDate(d).slice(0,5)), // Mostrar só dd/mm para ficar mais limpo
      datasets:[ 
        {label:'Receita', data:labels.map(d=>days[d].in), backgroundColor: hasData ? '#10B981' : 'rgba(128,128,128,0.1)', borderRadius:6},
        {label:'Despesa', data:labels.map(d=>days[d].out), backgroundColor: hasData ? '#EF4444' : 'rgba(128,128,128,0.1)', borderRadius:6} 
      ]
    },
    options:{ 
      responsive:true, 
      maintainAspectRatio: false,
      plugins:{legend:{display: hasData, labels:{color:'#9CA3AF', font:{size:12, family:'Inter'}}}}, 
      scales:{
        x:{ticks:{color:'#6B7280', font:{size:11, family:'Inter'}}, grid:{display:false}}, 
        y:{ticks:{color:'#6B7280', font:{size:11, family:'Inter'}}, grid:{color:'rgba(128,128,128,0.06)'}, beginAtZero: true, suggestedMax: hasData ? undefined : 100} 
      } 
    } 
  });
  
  const ctxPie = document.getElementById('chartPie');
  if(pieChart) pieChart.destroy();
  
  const pieData = hasData ? [income||0, expense||0] : [1];
  const pieColors = hasData ? ['#10B981','#EF4444'] : ['rgba(128,128,128,0.08)'];
  const pieLabels = hasData ? ['Receitas','Despesas'] : ['Sem movimentos'];

  pieChart = new Chart(ctxPie, { 
    type:'doughnut', 
    data:{ 
      labels: pieLabels, 
      datasets:[{ data: pieData, backgroundColor: pieColors, borderWidth:0, cutout: '75%' }] 
    },
    plugins: [centerTextPlugin],
    options:{ 
      responsive:true,
      maintainAspectRatio: false,
      plugins:{
        legend:{ display: hasData, position:'bottom', labels:{color:'#9CA3AF', font:{size:12, family:'Inter'}, padding: 20}},
        tooltip: { enabled: hasData }
      },
      layout: { padding: { bottom: hasData ? 0 : 20 } }
    } 
  });
}

/* ---------- REPORTS ---------- */
function renderReports(){
  const mm = monthMoves();
  const income = mm.filter(m=>m.type==='receita').reduce((s,m)=>s+m.valor,0);
  const expense = mm.filter(m=>m.type==='despesa').reduce((s,m)=>s+m.valor,0);
  document.getElementById('repTotalIncome').textContent = fmt(income);
  document.getElementById('repTotalExpense').textContent = fmt(expense);
  document.getElementById('repNet').textContent = fmt(income-expense);
  document.getElementById('repCount').textContent = mm.length;
  const byCat = {};
  mm.filter(m=>m.type==='despesa').forEach(m=>{ byCat[m.categoria] = (byCat[m.categoria]||0) + m.valor; });
  const max = Math.max(...Object.values(byCat), 1);
  const catHtml = Object.keys(byCat).length ? Object.entries(byCat).sort((a,b)=>b[1]-a[1]).map(([cat,val])=>`
    <div class="cat-row"><span>${cat}</span><div class="cat-bar-wrap"><div class="cat-bar" style="width:${(val/max*100)}%; background:var(--red);"></div></div><span class="mono">${fmt(val)}</span></div>
  `).join('') : '<div class="empty-state">Sem despesas este mês</div>';
  document.getElementById('catBreakdown').innerHTML = catHtml;
}

/* ---------- EXPORT / IMPORT / CLEAR ---------- */
function exportCSV(){
  let csv = 'Data,Conta,Tipo,Categoria,Descrição,Valor,Saldo Após\n';
  [...state.moves].sort((a,b)=>a.criadoEm-b.criadoEm).forEach(m=>{
    const acc = state.accounts.find(a=>a.id===m.contaId);
    csv += `${m.data},${acc?acc.nome:''},${m.type},${m.categoria},"${m.desc}",${m.valor},${m.saldoApos}\n`;
  });
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'glassfinance_export.csv'; a.click();
  toast('CSV exportado');
}
function exportJSON(){
  const blob = new Blob([JSON.stringify(state, null, 2)], {type:'application/json'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'glassfinance_backup.json'; a.click();
  toast('Backup JSON exportado');
}
function parseCSVLine(line){
  const res = [];
  let cur = '';
  let inQuotes = false;
  for(let i=0; i<line.length; i++){
    const char = line[i];
    if(char === '"'){ inQuotes = !inQuotes; }
    else if(char === ',' && !inQuotes){ res.push(cur.trim()); cur = ''; }
    else { cur += char; }
  }
  res.push(cur.trim());
  return res.map(v => v.replace(/^"|"$/g, '').trim());
}
function parseValue(raw){
  if(typeof raw === 'number') return raw;
  if(!raw) return 0;
  let s = String(raw).replace(/[^\d.,-]/g, '').trim();
  if(s.includes(',') && s.includes('.')) s = s.replace(/\./g, '').replace(',', '.');
  else if(s.includes(',')) s = s.replace(',', '.');
  return parseFloat(s) || 0;
}
function importData(event){
  const file = event.target.files && event.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const text = e.target.result;
      if(file.name.toLowerCase().endsWith('.json')){
        const data = JSON.parse(text);
        if(data && (Array.isArray(data.accounts) || Array.isArray(data.moves))){
          state.accounts = Array.isArray(data.accounts) ? data.accounts : state.accounts;
          state.moves = Array.isArray(data.moves) ? data.moves : state.moves;
          if(data.theme) setTheme(data.theme);
          save();
          toast('Backup JSON importado com sucesso!','✓');
        } else {
          toast('Formato de JSON inválido','⚠️');
        }
      } else {
        const lines = text.trim().split(/\r?\n/);
        if(lines.length < 2){ toast('Arquivo CSV sem dados','⚠️'); return; }
        let count = 0;
        for(let i=1; i<lines.length; i++){
          const line = lines[i].trim();
          if(!line) continue;
          const cols = parseCSVLine(line);
          if(cols.length < 6) continue;
          const data = cols[0] || todayStr();
          const contaNome = cols[1] || 'Principal';
          const type = (cols[2] || '').toLowerCase() === 'receita' ? 'receita' : 'despesa';
          const categoria = cols[3] || 'Outros';
          const desc = cols[4] || (type==='receita' ? 'Receita' : 'Despesa');
          const valor = parseValue(cols[5]);
          if(valor <= 0) continue;

          let acc = state.accounts.find(a => a.nome.toLowerCase() === contaNome.toLowerCase());
          if(!acc){
            acc = { id: uid(), nome: contaNome, saldo: 0, cor: COLORS[state.accounts.length % COLORS.length], icone: initials(contaNome), favorito:false };
            state.accounts.push(acc);
          }
          acc.saldo += (type==='receita' ? valor : -valor);
          state.moves.push({ id: uid(), contaId: acc.id, type, valor, desc, categoria, data, saldoApos: acc.saldo, criadoEm: Date.now() + i });
          count++;
        }
        save();
        toast(`${count} movimentações importadas!`, '✓');
      }
    } catch(err){
      toast('Erro ao processar o arquivo', '⚠️');
    }
    event.target.value = '';
  };
  reader.readAsText(file);
}
function clearAllData(){
  document.getElementById('confirmText').textContent = 'Isso vai apagar TODAS as contas e movimentações. Não pode ser desfeito.';
  document.getElementById('confirmBtn').onclick = ()=>{
    state = { accounts:[], moves:[], privacy:false, theme: state.theme };
    closeModal('modalConfirm'); save(); toast('Todos os dados foram limpos','🗑');
  };
  openModal('modalConfirm');
}

/* ---------- MAIN RENDER ---------- */
function render(){
  renderAccounts();
  renderStats();
  renderMoves();
}
render();

/* ---------- PWA: SERVICE WORKER ---------- */
if('serviceWorker' in navigator){
  window.addEventListener('load', ()=>{
    navigator.serviceWorker.register('service-worker.js').catch(()=>{});
  });
}
