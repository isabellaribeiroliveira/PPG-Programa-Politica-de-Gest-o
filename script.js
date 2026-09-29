/* =====================================================================
   PPG — Programa Política de Gestão
   v4.0 — dados organizacionais coerentes (via empresa.config.js),
   questionário estilo Duolingo, perfis totalmente separados, menu
   expansível/recolhível, Banco de Perguntas, Auditoria e drill-down.
   ===================================================================== */

/* ======================= DADOS DERIVADOS DA CONFIGURAÇÃO DA EMPRESA =======================
   Tudo aqui vem de window.EMPRESA_CONFIG (empresa.config.js). Nenhuma lista de
   setor/função/filial é mantida solta neste arquivo — isso evita combinações
   incoerentes como "setor ELÉTRICA + função GERENTE DE CSC". */
const EMPRESA = window.EMPRESA_CONFIG;


const SETORES = EMPRESA.setores.map(s => s.nome);
const UNIDADES = EMPRESA.filiais;
const FUNCOES = [...new Set(EMPRESA.setores.flatMap(s => s.funcoes))];
const CARGOS_IMPEDIDOS = EMPRESA.cargosImpedidos;
const CARGOS_PERMITIDOS = FUNCOES.filter(f => !CARGOS_IMPEDIDOS.includes(f));

const NOMES = []; // não é mais usado — participantes agora vêm do quadro real (EMPRESA.colaboradores)

function randomFrom(arr){return arr[Math.floor(Math.random()*arr.length)];}
function pad(n){return n.toString().padStart(2,'0');}
function fmtDateTime(d){return pad(d.getDate())+"/"+pad(d.getMonth()+1)+"/"+d.getFullYear()+" "+pad(d.getHours())+":"+pad(d.getMinutes());}
function opt(text, correct){ return {text, correct: !!correct}; }

/* Geração de participantes fictícios para o modo de teste — mas usando
   SEMPRE colaboradores reais do quadro ativo (planilha da empresa), nunca
   nomes/combinações inventadas. Cada campanha sorteia um grupo de
   colaboradores reais (sem repetir matrícula dentro da mesma campanha). */
/* Código único de resposta — auditável, formato PPG-AAAA-MM-NNNNNN */
let responseSeqCounter = 0;
function gerarCodigoResposta(d){
  responseSeqCounter++;
  const ano = d.getFullYear();
  const mes = String(d.getMonth()+1).padStart(2,'0');
  const seq = String(responseSeqCounter).padStart(6,'0');
  return `PPG-${ano}-${mes}-${seq}`;
}
function gerarSessaoId(){ return 'S-' + Math.random().toString(36).slice(2,10).toUpperCase(); }

/* Dispositivo/sessão — para dados de demonstração, sorteia um rótulo plausível;
   para respostas reais, lê o navegador de verdade (não expõe dados sensíveis, só o tipo de dispositivo e navegador). */
const DISPOSITIVOS_DEMO = ["Desktop · Chrome","Desktop · Edge","Notebook · Firefox","Celular · Chrome Mobile","Celular · Safari Mobile","Tablet · Safari"];
function dispositivoFicticio(seedIndex){ return DISPOSITIVOS_DEMO[seedIndex % DISPOSITIVOS_DEMO.length]; }
function dispositivoReal(){
  try{
    const ua = navigator.userAgent || "";
    const tipo = /Mobi|Android/i.test(ua) ? "Celular" : (/iPad|Tablet/i.test(ua) ? "Tablet" : "Desktop");
    let nav = "Navegador";
    if(/Edg\//.test(ua)) nav = "Edge";
    else if(/Chrome\//.test(ua)) nav = "Chrome";
    else if(/Firefox\//.test(ua)) nav = "Firefox";
    else if(/Safari\//.test(ua)) nav = "Safari";
    return `${tipo} · ${nav}`;
  }catch(e){ return "Não identificado"; }
}
function duracaoLabel(ini, fim){
  if(!ini || !fim) return "—";
  const segs = Math.max(0, Math.round((new Date(fim) - new Date(ini))/1000));
  return formatSegundos(segs);
}
function formatSegundos(segs){
  const m = Math.floor(segs/60), s = segs%60;
  return m > 0 ? `${m}min ${s}s` : `${s}s`;
}

function buildParticipants(campaignId, count, pct100Count){
  const list = [];
  const sampled = EMPRESA.sortearColaboradores(count);
  const totalQuestoes = (campaigns.find(c=>c.id===campaignId) || {}).questoes?.length || 4;
  sampled.forEach((colab, i)=>{
    const acertos = i < pct100Count ? 100 : [90,80,70,60][Math.floor(Math.random()*4)];
    const dataFim = new Date(2026, 5, 10 + Math.floor(i/4), 8 + (i%9), (i*7)%60);
    const dataInicio = new Date(dataFim.getTime() - (3 + Math.floor(Math.random()*9)) * 60000);
    list.push({
      campaignId, nome: colab.nome, matricula: colab.matricula, cpf: EMPRESA.cpfFicticio(colab.matricula),
      setor: colab.setor, filial: colab.filial, funcao: colab.funcao, cargo: colab.funcao,
      data: dataFim, dataInicio, dataFim, pct: acertos, respostasCorretas: null,
      acertosQtd: Math.round(acertos/100*totalQuestoes), totalQuestoes,
      codigoResposta: gerarCodigoResposta(dataFim), sessaoId: gerarSessaoId(),
      dispositivo: dispositivoFicticio(i)
    });
  });
  return list;
}

function isoLocal(d){
  const p = n => String(n).padStart(2,'0');
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
const _hoje = new Date();
const _inicioC1 = new Date(_hoje.getTime() - 20*24*60*60*1000);
const _fimC1 = new Date(_hoje.getTime() + 20*24*60*60*1000);

let campaigns = [];

let participants = [];

let wonHistory = [];

/* ======================= BANCO DE PERGUNTAS ======================= */
let questionBank = [
  {codigo:"BQ-001", categoria:"Segurança", tema:"Segurança da Informação", procedimento:"POL-SEG-01",
   texto:"Qual é a prática recomendada ao identificar um e-mail suspeito?", type:"unica",
   options:[opt("Clicar no link para verificar a origem"),opt("Reportar ao canal de segurança e não interagir com o e-mail",true),opt("Responder pedindo mais informações ao remetente"),opt("Encaminhar para colegas avaliarem")],
   autor:"Mariana Queiroz", dataCriacao:new Date(2026,4,20), ultimaUtilizacao:new Date(2026,5,15), qtdUtilizacoes:1, status:"ativa"},
  {codigo:"BQ-002", categoria:"Qualidade", tema:"ISO 9001", procedimento:"POL-QUA-04",
   texto:"O que é uma não conformidade?", type:"unica",
   options:[opt("Um elogio do cliente"),opt("Um desvio em relação a um requisito estabelecido",true),opt("Uma sugestão de melhoria qualquer"),opt("Um novo processo criado")],
   autor:"Mariana Queiroz", dataCriacao:new Date(2025,9,10), ultimaUtilizacao:new Date(2025,10,5), qtdUtilizacoes:2, status:"ativa"},
  {codigo:"BQ-003", categoria:"Ética", tema:"Compliance", procedimento:"COD-ETI-01",
   texto:"O que é conflito de interesses?", type:"unica",
   options:[opt("Quando interesses pessoais podem influenciar decisões profissionais",true),opt("Uma discordância entre colegas de equipe"),opt("Um erro de sistema"),opt("Uma reunião com clientes")],
   autor:"Mariana Queiroz", dataCriacao:new Date(2025,6,2), ultimaUtilizacao:new Date(2025,7,10), qtdUtilizacoes:1, status:"ativa"},
  {codigo:"BQ-004", categoria:"Segurança", tema:"Proteção de Dados", procedimento:"POL-SEG-02",
   texto:"O uso de pen drives pessoais em computadores corporativos é permitido sem autorização?", type:"vf",
   options:[opt("Verdadeiro"),opt("Falso",true)],
   autor:"Mariana Queiroz", dataCriacao:new Date(2024,2,1), ultimaUtilizacao:new Date(2024,2,20), qtdUtilizacoes:1, status:"ativa"}
];
function bqUsageStatus(q){
  if(!q.ultimaUtilizacao) return {label:"Nunca utilizada", cls:"nunca"};
  const twoYearsMs = 2*365*24*60*60*1000;
  const diff = new Date() - new Date(q.ultimaUtilizacao);
  if(diff < twoYearsMs){
    const months = Math.max(1, Math.round(diff/(30*24*60*60*1000)));
    return {label:`Usada há ${months} mês(es) — considere outra`, cls:"recente"};
  }
  return {label:"Livre para reutilização", cls:"livre"};
}

/* ======================= AUDITORIA (log de ações) ======================= */
let actionLog = [];
let ruleChangeLog = []; // histórico de alterações/exceções às regras de elegibilidade, por campanha
function logAction(acao, detalhe){
  actionLog.unshift({acao, detalhe: detalhe||"", usuario: currentUser ? currentUser.nome : "Sistema", data:new Date()});
  const sec = document.getElementById('sec-auditoria');
  if(sec && sec.classList.contains('active')) renderAuditoria();
  saveState();
}
function renderAuditoria(){
  const tbody = document.getElementById('tblAuditoria');
  if(!tbody) return;
  tbody.innerHTML = actionLog.map(a=>`<tr><td>${fmtDateTime(a.data)}</td><td>${a.usuario}</td><td>${a.acao}</td><td>${a.detalhe}</td></tr>`).join('') ||
    `<tr><td colspan="4" style="text-align:center; color:var(--ink-soft); padding:20px;">Nenhuma ação registrada ainda nesta sessão.</td></tr>`;
}

/* ======================= AUDITORIA DETALHADA (rastreabilidade por participação) ======================= */
function audFillFilterSelects(){
  const camp = document.getElementById('audFiltroCampanha');
  if(!camp) return;
  const prevCamp = camp.value;
  camp.innerHTML = '<option value="">Todas</option>' + campaigns.map(c=>`<option value="${c.id}">${c.nome}</option>`).join('');
  camp.value = prevCamp;
  const setor = document.getElementById('audFiltroSetor');
  if(setor.options.length <= 1) setor.innerHTML = '<option value="">Todos</option>' + [...SETORES].sort().map(s=>`<option value="${s}">${s}</option>`).join('');
  const filial = document.getElementById('audFiltroFilial');
  if(filial.options.length <= 1) filial.innerHTML = '<option value="">Todas</option>' + UNIDADES.map(f=>`<option value="${f}">${f}</option>`).join('');
  const funcao = document.getElementById('audFiltroFuncao');
  if(funcao.options.length <= 1) funcao.innerHTML = '<option value="">Todas</option>' + [...FUNCOES].sort().map(f=>`<option value="${f}">${f}</option>`).join('');
}
function audGetFilteredParticipants(){
  const campId = document.getElementById('audFiltroCampanha').value;
  const setor = document.getElementById('audFiltroSetor').value;
  const filial = document.getElementById('audFiltroFilial').value;
  const funcao = document.getElementById('audFiltroFuncao').value;
  const dataDe = document.getElementById('audFiltroDataDe').value;
  const dataAte = document.getElementById('audFiltroDataAte').value;
  const status = document.getElementById('audFiltroStatus').value;
  const busca = document.getElementById('audFiltroBusca').value.trim().toLowerCase();
  return participants.filter(p=>{
    if(campId && p.campaignId !== campId) return false;
    if(setor && p.setor !== setor) return false;
    if(filial && p.filial !== filial) return false;
    if(funcao && p.funcao !== funcao) return false;
    const d = p.dataFim || p.data;
    if(dataDe && d < new Date(dataDe+'T00:00:00')) return false;
    if(dataAte && d > new Date(dataAte+'T23:59:59')) return false;
    if(busca){
      const hay = `${p.nome} ${p.matricula} ${p.codigoResposta||''}`.toLowerCase();
      if(!hay.includes(busca)) return false;
    }
    if(status){
      const {eligible, excluded} = evaluateEligibility(p.campaignId);
      const isElig = eligible.some(e=>e.matricula===p.matricula);
      const isExcl = excluded.some(e=>e.matricula===p.matricula);
      if(status==='elegivel' && !isElig) return false;
      if(status==='excluido' && !isExcl) return false;
      const ex = excluded.find(e=>e.matricula===p.matricula);
      if(status==='naoelegivel' && !(ex && ex.motivos.some(m=>m.includes('100%')))) return false;
      if(status==='cargoimpedido' && !(ex && ex.motivos.some(m=>m.includes('cargo de liderança')))) return false;
      if(status==='premiadorecente' && !(ex && ex.motivos.some(m=>m.includes('premiado')))) return false;
    }
    return true;
  });
}
function audEligLabel(p){
  const {eligible, excluded} = evaluateEligibility(p.campaignId);
  const ex = excluded.find(e=>e.matricula===p.matricula);
  if(ex) return `<span class="badge excluido" title="${ex.motivo}">${ex.motivo}</span>`;
  return `<span class="badge finalizada">Elegível</span>`;
}
function renderAuditoriaBarChart(elId, dataObj){
  const el = document.getElementById(elId);
  if(!el) return;
  const entries = Object.entries(dataObj).filter(([k,v])=>v>0);
  if(!entries.length){ el.innerHTML = '<p class="hint">Sem dados para os filtros atuais.</p>'; return; }
  const max = Math.max(...entries.map(([,v])=>v));
  el.innerHTML = entries.map(([k,v])=>`
    <div class="hbar-row"><div class="hbar-label">${k}</div><div class="hbar-track"><div class="hbar-fill" style="width:0%" data-w="${(v/max*100)}"></div></div><div class="hbar-value">${v}</div></div>`).join('');
  requestAnimationFrame(()=> el.querySelectorAll('.hbar-fill').forEach(f=> f.style.width = f.dataset.w + "%"));
}
function renderAuditoriaDetalhe(){
  const tbody = document.getElementById('tblAuditoriaDetalhe');
  if(!tbody) return;
  audFillFilterSelects();
  const list = audGetFilteredParticipants().sort((a,b)=> (b.dataFim||b.data) - (a.dataFim||a.data));
  tbody.innerHTML = list.map(p=>{
    const c = campaigns.find(x=>x.id===p.campaignId);
    return `<tr>
      <td>${p.nome}</td><td>${p.matricula}</td><td style="font-family:monospace; font-size:11px;">${p.cpf||'—'}</td><td>${p.funcao||p.cargo}</td><td>${p.setor}</td><td>${p.filial}</td>
      <td>${c?c.nome:p.campaignId}</td><td style="font-family:monospace; font-size:11px;">${p.codigoResposta||'—'}</td>
      <td>${p.dataInicio?fmtDateTime(p.dataInicio):'—'}</td><td>${p.dataFim?fmtDateTime(p.dataFim):fmtDateTime(p.data)}</td>
      <td>${duracaoLabel(p.dataInicio, p.dataFim||p.data)}</td>
      <td>${p.acertosQtd!=null && p.totalQuestoes ? `${p.acertosQtd}/${p.totalQuestoes}` : '—'}</td>
      <td><span class="${p.pct===100?'pct100':'pctless'}">${p.pct}%</span></td>
      <td style="font-size:11px;">${p.dispositivo||'—'}<br><span style="font-family:monospace; color:var(--ink-soft); font-size:10px;">${p.sessaoId||''}</span></td>
      <td>${audEligLabel(p)}</td>
      <td style="display:flex; gap:6px; flex-wrap:wrap;">
        <button class="btn btn-outline btn-sm" onclick="audVerDetalhe('${p.campaignId}','${p.matricula}')">Respostas</button>
        <button class="btn btn-outline btn-sm" onclick="audVerPerfil('${p.matricula}')">Perfil</button>
      </td>
    </tr>`;
  }).join('') || `<tr><td colspan="16" style="text-align:center; color:var(--ink-soft); padding:20px;">Nenhum registro encontrado com os filtros atuais.</td></tr>`;

  const totalPart = list.length;
  const total100 = list.filter(p=>p.pct===100).length;
  const media = list.length ? Math.round(list.reduce((a,p)=>a+p.pct,0)/list.length) : 0;
  const comDuracao = list.filter(p=>p.dataInicio && (p.dataFim||p.data));
  const duracaoMediaSeg = comDuracao.length ? Math.round(comDuracao.reduce((a,p)=> a + (new Date(p.dataFim||p.data) - new Date(p.dataInicio))/1000, 0) / comDuracao.length) : 0;
  let totalEleg = 0, totalExcl = 0;
  const campanhasNoFiltro = [...new Set(list.map(p=>p.campaignId))];
  campanhasNoFiltro.forEach(cid=>{ const {eligible, excluded} = evaluateEligibility(cid); totalEleg += eligible.length; totalExcl += excluded.length; });
  document.getElementById('audResumo').innerHTML = `
    <div class="stat"><b>${totalPart}</b><span>Participações no filtro</span></div>
    <div class="stat"><b>${total100}</b><span>Com 100% de acertos</span></div>
    <div class="stat"><b>${media}%</b><span>Média de acertos</span></div>
    <div class="stat"><b>${formatSegundos(duracaoMediaSeg)}</b><span>Tempo médio de resposta</span></div>
    <div class="stat"><b>${totalEleg}</b><span>Elegíveis (campanhas no filtro)</span></div>
    <div class="stat"><b>${totalExcl}</b><span>Excluídos (campanhas no filtro)</span></div>`;

  const bySetor = {}, byFilial = {};
  list.forEach(p=>{ bySetor[p.setor]=(bySetor[p.setor]||0)+1; byFilial[p.filial]=(byFilial[p.filial]||0)+1; });
  renderAuditoriaBarChart('audChartSetor', bySetor);
  renderAuditoriaBarChart('audChartFilial', byFilial);

  const ordered = [...campaigns].sort((a,b)=> new Date(a.inicio) - new Date(b.inicio));
  const evoData = {};
  ordered.forEach(c=> evoData[c.nome.split('–')[0].trim()] = campaignParticipants(c.id).length);
  renderAuditoriaBarChart('audChartEvolucao', evoData);
}
window.audVerDetalhe = function(campaignId, matricula){
  const p = participants.find(pp=>pp.campaignId===campaignId && pp.matricula===matricula);
  const c = campaigns.find(x=>x.id===campaignId);
  if(!p || !c) return;
  const rows = c.questoes.map((q,i)=>{
    const ans = p.respostasSelecionadas ? p.respostasSelecionadas[i] : undefined;
    const selTexts = Array.isArray(ans) ? ans.map(a=> (q.options[a]||{}).text).join(', ') : (ans!==undefined && ans!==null && q.options[ans] ? q.options[ans].text : 'Não disponível (registro histórico)');
    const correctTexts = q.options.filter(o=>o.correct).map(o=>o.text).join(', ');
    const ok = p.respostasCorretas ? p.respostasCorretas[i] : null;
    return `<tr><td>${q.texto}</td><td>${selTexts||'—'}</td><td>${correctTexts}</td><td>${ok===null?'—':(ok?'<span class="pct100">✓ Correta</span>':'<span style="color:var(--error);">✕ Incorreta</span>')}</td></tr>`;
  }).join('');
  const backdrop = document.createElement('div');
  backdrop.className = 'share-backdrop';
  backdrop.id = 'audDetalheBackdrop';
  backdrop.innerHTML = `
    <div class="share-card" style="max-width:640px; text-align:left;">
      <h3 style="margin-bottom:4px;">${p.nome} — ${p.codigoResposta||''}</h3>
      <p class="hint" style="margin-bottom:14px;">${c.nome} · ${p.matricula} · ${p.setor} · ${p.filial}</p>
      <div class="table-wrap" style="max-height:360px; overflow-y:auto;">
        <table><thead><tr><th>Pergunta</th><th>Resposta selecionada</th><th>Alternativa correta</th><th>Resultado</th></tr></thead>
        <tbody>${rows}</tbody></table>
      </div>
      <div class="share-actions" style="margin-top:16px;"><button class="btn btn-outline" id="audCloseDetalhe">Fechar</button></div>
    </div>`;
  document.body.appendChild(backdrop);
  backdrop.addEventListener('click', (e)=>{ if(e.target===backdrop) backdrop.remove(); });
  document.getElementById('audCloseDetalhe').addEventListener('click', ()=> backdrop.remove());
};
window.audVerPerfil = function(matricula){
  const historico = participants.filter(p=>p.matricula===matricula).sort((a,b)=> (b.dataFim||b.data) - (a.dataFim||a.data));
  if(!historico.length) return;
  const ref = historico[0];
  const premios = wonHistory.filter(w=>w.matricula===matricula).sort((a,b)=>b.data-a.data);
  const rows = historico.map(p=>{
    const c = campaigns.find(x=>x.id===p.campaignId);
    const ganhou = c && c.ganhadores && c.ganhadores.some(g=>g.matricula===matricula);
    return `<tr>
      <td>${c?c.nome:p.campaignId}</td><td style="font-family:monospace; font-size:11px;">${p.codigoResposta||'—'}</td>
      <td>${fmtDateTime(p.dataFim||p.data)}</td><td>${duracaoLabel(p.dataInicio, p.dataFim||p.data)}</td>
      <td><span class="${p.pct===100?'pct100':'pctless'}">${p.pct}%</span></td>
      <td>${audEligLabel(p)}</td>
      <td>${ganhou ? '<span class="badge finalizada"><i data-lucide="trophy" style="width:12px;height:12px;vertical-align:-2px;"></i> Ganhador</span>' : '—'}</td>
    </tr>`;
  }).join('');
  const premiosHtml = premios.length
    ? premios.map(w=>`<li>${fmtDateTime(w.data)}</li>`).join('')
    : '<li>Nenhum prêmio recebido até o momento.</li>';
  const backdrop = document.createElement('div');
  backdrop.className = 'share-backdrop';
  backdrop.id = 'audPerfilBackdrop';
  backdrop.innerHTML = `
    <div class="share-card" style="max-width:720px; text-align:left;">
      <h3 style="margin-bottom:2px;">${ref.nome}</h3>
      <p class="hint" style="margin-bottom:2px;">${matricula} · CPF ${ref.cpf||'—'} · ${ref.funcao||ref.cargo} · ${ref.setor} · ${ref.filial}</p>
      <p class="hint" style="margin-bottom:14px;">${historico.length} participação(ões) registrada(s) no total, em ${new Set(historico.map(p=>p.campaignId)).size} campanha(s) distinta(s).</p>
      <div class="table-wrap" style="max-height:280px; overflow-y:auto;">
        <table><thead><tr><th>Campanha</th><th>Código</th><th>Data</th><th>Duração</th><th>%</th><th>Elegibilidade</th><th>Sorteio</th></tr></thead>
        <tbody>${rows}</tbody></table>
      </div>
      <h4 style="margin:16px 0 6px; font-size:13px;">Histórico de premiações</h4>
      <ul style="margin:0; padding-left:18px; font-size:12.5px; color:var(--ink-soft); display:flex; flex-direction:column; gap:4px;">${premiosHtml}</ul>
      <div class="share-actions" style="margin-top:16px;"><button class="btn btn-outline" id="audClosePerfil">Fechar</button></div>
    </div>`;
  document.body.appendChild(backdrop);
  backdrop.addEventListener('click', (e)=>{ if(e.target===backdrop) backdrop.remove(); });
  document.getElementById('audClosePerfil').addEventListener('click', ()=> backdrop.remove());
};
document.getElementById('audAplicarFiltros')?.addEventListener('click', renderAuditoriaDetalhe);
document.getElementById('audLimparFiltros')?.addEventListener('click', ()=>{
  ['audFiltroCampanha','audFiltroSetor','audFiltroFilial','audFiltroFuncao','audFiltroStatus'].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; });
  ['audFiltroDataDe','audFiltroDataAte','audFiltroBusca'].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; });
  renderAuditoriaDetalhe();
});
document.getElementById('audExportXlsx')?.addEventListener('click', ()=>{
  const list = audGetFilteredParticipants();
  if(!list.length){ showToast("Não há dados para exportar com os filtros atuais.","warning"); return; }
  const headers = ["Nome","Matrícula","CPF","Função","Setor","Filial","Campanha","Código","Início","Fim","Duração","Acertos","% Acertos","Dispositivo","Sessão","Elegibilidade"];
  const rows = list.map(p=>{
    const c = campaigns.find(x=>x.id===p.campaignId);
    const {eligible, excluded} = evaluateEligibility(p.campaignId);
    const ex = excluded.find(e=>e.matricula===p.matricula);
    const elegStr = ex ? `Excluído — ${ex.motivo}` : 'Elegível';
    return [p.nome,p.matricula,p.cpf||'',p.funcao||p.cargo,p.setor,p.filial,c?c.nome:p.campaignId,p.codigoResposta||'',
      p.dataInicio?fmtDateTime(p.dataInicio):'', p.dataFim?fmtDateTime(p.dataFim):fmtDateTime(p.data),
      duracaoLabel(p.dataInicio, p.dataFim||p.data), p.acertosQtd!=null?`${p.acertosQtd}/${p.totalQuestoes}`:'', p.pct+'%',
      p.dispositivo||'', p.sessaoId||'', elegStr];
  });
  downloadCSV('auditoria_participacoes.csv', headers, rows);
  logAction("Relatório exportado", `Auditoria detalhada (Excel) — ${list.length} registro(s)`);
  showToast("Arquivo .csv baixado (compatível com Excel).","success");
});
document.getElementById('audExportPdf')?.addEventListener('click', ()=>{
  const list = audGetFilteredParticipants();
  if(!list.length){ showToast("Não há dados para exportar com os filtros atuais.","warning"); return; }
  const headers = ["Nome","Matrícula","Setor","Filial","Campanha","Código","Duração","% Acertos","Dispositivo","Elegibilidade"];
  const rows = list.map(p=>{
    const c = campaigns.find(x=>x.id===p.campaignId);
    const {eligible, excluded} = evaluateEligibility(p.campaignId);
    const ex = excluded.find(e=>e.matricula===p.matricula);
    const elegStr = ex ? `Excluído — ${ex.motivo}` : 'Elegível';
    return [p.nome,p.matricula,p.setor,p.filial,c?c.nome:p.campaignId,p.codigoResposta||'',duracaoLabel(p.dataInicio,p.dataFim||p.data),p.pct+'%',p.dispositivo||'',elegStr];
  });
  openPrintReport("Auditoria de participações", headers, rows, `Total filtrado: ${list.length} registro(s)`);
  logAction("Relatório exportado", `Auditoria detalhada (PDF) — ${list.length} registro(s)`);
});

let currentUser = null;
let currentRole = "qualidade";
let historyLog = [];
let editingCampaignId = null;
let quizState = null;
let editingBQCodigo = null;

/* ======================= PERSISTÊNCIA (localStorage) =======================
   O app é só HTML/CSS/JS, sem servidor — então "banco de dados" aqui significa
   salvar automaticamente no navegador de quem está usando. Os dados sobrevivem
   a um recarregamento de página (F5) ou a fechar e reabrir a aba, permitindo
   acompanhar o processo ao longo do tempo. Isso é local a cada navegador/
   computador — não é compartilhado entre pessoas diferentes (para isso seria
   necessário um backend real). */
const STORAGE_KEY = "ppg_app_state_v1";
const STATE_VERSION = 3; // aumente este número sempre que a "forma" dos dados salvos mudar de forma incompatível

function dateReviver(key, value){
  if(typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) return new Date(value);
  return value;
}
function saveState(){
  try{
    const state = {
      version: STATE_VERSION,
      campaigns, participants, wonHistory, questionBank, actionLog, ruleChangeLog,
      responseSeqCounter, currentUser, currentRole,
      themePreference: window.themePreference || 'auto',
      savedAt: new Date()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }catch(e){ console.warn("Não foi possível salvar os dados localmente:", e); }
}
function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return false;
    const state = JSON.parse(raw, dateReviver);
    if(state.version !== STATE_VERSION){
      console.warn("Dados salvos de uma versão anterior do app — ignorando e começando do zero.");
      localStorage.removeItem(STORAGE_KEY);
      return false;
    }
    if(state.campaigns) campaigns = state.campaigns;
    if(state.participants) participants = state.participants;
    if(state.wonHistory) wonHistory = state.wonHistory;
    if(state.questionBank) questionBank = state.questionBank;
    if(state.actionLog) actionLog = state.actionLog;
    if(state.ruleChangeLog) ruleChangeLog = state.ruleChangeLog;
    if(typeof state.responseSeqCounter === 'number') responseSeqCounter = state.responseSeqCounter;
    currentUser = state.currentUser || null;
    currentRole = state.currentRole || "qualidade";
    window.themePreference = state.themePreference || 'auto';
    return true;
  }catch(e){ console.warn("Não foi possível carregar os dados salvos:", e); return false; }
}
function clearSavedState(){ try{ localStorage.removeItem(STORAGE_KEY); }catch(e){} }

/* ======================= ELEGIBILIDADE ======================= */
function isWithinTwoYears(matricula, refDate){
  const twoYearsMs = 2*365*24*60*60*1000;
  return wonHistory.some(w => w.matricula === matricula && (refDate - w.data) < twoYearsMs);
}
function evaluateEligibility(campaignId){
  const all = campaignParticipants(campaignId);
  const eligible = [], excluded = [];
  const now = new Date();
  all.forEach(p=>{
    const motivos = [];
    if(p.pct !== 100) motivos.push(`Não atingiu 100% de acertos no questionário (fez ${p.pct}%)`);
    if(CARGOS_IMPEDIDOS.includes(p.cargo)) motivos.push(`Ocupa cargo de liderança impedido de participar (${p.cargo})`);
    if(isWithinTwoYears(p.matricula, now)) motivos.push("Já foi premiado(a) em uma campanha do PPG nos últimos 2 anos");
    if(motivos.length) excluded.push({...p, motivo: motivos.join(" · "), motivos});
    else eligible.push(p);
  });
  return {eligible, excluded};
}

/* ======================= ACESSO POR DATA ======================= */
function campaignAccessStatus(c){
  const now = new Date();
  const start = new Date(c.inicio), end = new Date(c.fim);
  if(now < start) return 'nao_iniciada';
  if(now > end) return 'encerrada';
  return 'aberta';
}

/* ======================= NAV ======================= */
const titles = {
  inicio:"Início", campanhas:"Rodadas", nova:"Nova Campanha", participantes:"Resultados",
  elegiveis:"Elegíveis", sorteio:"Sorteio", relatorios:"Relatórios", historico:"Histórico",
  banco:"Banco de Perguntas", auditoria:"Auditoria", config:"Configurações", responder:"Questionário",
  "regras-excecoes":"Regras & Exceções", "divulgacao":"Divulgação", "fale-conosco":"Fale com a Qualidade", "importar-historico":"Importar Histórico",
  "campanha-atual":"Campanha Atual", "historico-colab":"Histórico", "meu-resultado":"Meu Resultado", regulamento:"Regulamento"
};

document.querySelectorAll('.menu-item').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const target = btn.dataset.target;
    document.querySelectorAll('.menu-item').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    goToSection(target);
  });
});
document.querySelectorAll('.menu-group-header').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    btn.closest('.menu-group').classList.toggle('expanded');
  });
});
let currentSectionId = "inicio";
function goToSection(target){
  document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
  const sec = document.getElementById('sec-'+target);
  if(sec) sec.classList.add('active');
  document.getElementById('pageTitle').textContent = titles[target] || target;
  closeSidebarMobile();
  currentSectionId = target;
  renderSectionContent(target);
}
function renderSectionContent(target){
  if(target==="inicio") renderDashboard();
  if(target==="campanhas") renderCampaignGrid();
  if(target==="historico") renderTimeline();
  if(target==="participantes") renderParticipantsTable();
  if(target==="elegiveis") renderEligibleTable();
  if(target==="banco") renderBanco();
  if(target==="auditoria"){ renderAuditoria(); renderAuditoriaDetalhe(); }
  if(target==="regras-excecoes") renderRegrasExcecoes();
  if(target==="divulgacao") renderDivulgacao();
  if(target==="fale-conosco" && currentRole==="qualidade") renderDuvidas();
  if(target==="importar-historico") renderHistoricoImportado();
  if(target==="config" && currentRole==="qualidade") renderPedidosSenha();
  if(target==="campanha-atual") renderCampanhaAtual();
  if(target==="historico-colab") renderHistoricoColaborador();
  if(target==="meu-resultado") renderMeuResultado();
  if(target==="regulamento") renderRegulamentoStats();
}

document.getElementById('hamburger').addEventListener('click', ()=>{
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('overlay').classList.toggle('open');
});
document.getElementById('overlay').addEventListener('click', closeSidebarMobile);
function closeSidebarMobile(){ document.getElementById('sidebar').classList.remove('open'); document.getElementById('overlay').classList.remove('open'); }

const btnResetDemoData = document.getElementById('btnResetDemoData');
if(btnResetDemoData){
  btnResetDemoData.addEventListener('click', ()=>{
    if(confirm("Isso vai apagar os dados salvos neste navegador (sessão, tema, cache local) e recarregar a página. Os dados da planilha não são afetados. Continuar?")){
      clearSavedState();
      window.location.reload();
    }
  });
}

/* Menu lateral recolhível (ícone-somente) */
const btnCollapseSidebar = document.getElementById('btnCollapseSidebar');
if(btnCollapseSidebar){
  btnCollapseSidebar.addEventListener('click', ()=>{
    document.getElementById('sidebar').classList.toggle('collapsed');
  });
}
// Em telas de tablet, começa recolhido automaticamente (mais espaço de conteúdo)
if(window.innerWidth <= 1180 && window.innerWidth > 880){
  document.getElementById('sidebar').classList.add('collapsed');
}

/* Link/QR de divulgação: ?campanha=ID leva direto ao questionário após o login */
const urlParams = new URLSearchParams(window.location.search);
const deepLinkCampaignId = urlParams.get('campanha');

/* ======================= TELA DE LOGIN — SAC, abas e credenciais retráteis ======================= */
(function initLoginExtras(){
  const sacFab = document.getElementById('sacFab');
  const sacPopup = document.getElementById('sacPopup');
  const sacClose = document.getElementById('sacClose');
  function openSac(){
    sacPopup.classList.add('open');
    requestAnimationFrame(()=> sacPopup.classList.add('show'));
  }
  function closeSac(){
    sacPopup.classList.remove('show');
    setTimeout(()=> sacPopup.classList.remove('open'), 250);
  }
  if(sacFab) sacFab.addEventListener('click', ()=>{
    sacPopup.classList.contains('open') ? closeSac() : openSac();
  });
  if(sacClose) sacClose.addEventListener('click', closeSac);
  document.addEventListener('click', (e)=>{
    if(sacPopup && sacPopup.classList.contains('open') && !sacPopup.contains(e.target) && e.target !== sacFab && !sacFab.contains(e.target)){
      closeSac();
    }
  });

  // Painel retrátil de credenciais de teste (escondido por padrão)
  const demoToggle = document.getElementById('loginDemoToggle');
  const demoPanel = document.getElementById('loginDemoPanel');
  if(demoToggle) demoToggle.addEventListener('click', ()=>{
    demoToggle.classList.toggle('open');
    demoPanel.classList.toggle('open');
  });

  // Botão "conheça o programa" rola suavemente até a landing
  const scrollHint = document.getElementById('loginScrollHint');
  if(scrollHint) scrollHint.addEventListener('click', ()=>{
    document.getElementById('loginLanding').scrollIntoView({behavior:'smooth', block:'start'});
  });
})();

/* ======================= LOGIN ======================= */
/* A autenticação de verdade agora mora na planilha (via Google Apps Script).
   Não existe mais senha nenhuma escrita aqui no código. */
const BACKEND_URL = "https://script.google.com/macros/s/AKfycbwfKlz_TuxeCNl2F21M4_ebtnHy2lMn-ppggOXU5kjZwDoNQaoTv1E0DLYSvBcyQK_x9Q/exec";

async function backendCall(action, payload){
  try{
    const res = await fetch(BACKEND_URL, {
      method: "POST",
      headers: {"Content-Type": "text/plain;charset=utf-8"}, // evita pre-flight de CORS no Apps Script
      body: JSON.stringify({action, solicitante: (typeof currentUser !== 'undefined' && currentUser) ? currentUser.matricula : null, ...(payload||{})})
    });
    const textoCru = await res.text();
    if(!res.ok){
      console.error(`Backend respondeu HTTP ${res.status} para a ação "${action}". Corpo da resposta:`, textoCru);
      return {ok:false, erro:`O servidor respondeu com erro ${res.status}. Veja o Console (F12) para detalhes.`};
    }
    try{
      return JSON.parse(textoCru);
    }catch(parseErr){
      console.error(`A resposta da ação "${action}" não veio em JSON. Isso geralmente acontece quando a implantação do Apps Script não está com acesso "Qualquer pessoa", ou quando houve um erro dentro do próprio script. Resposta recebida:`, textoCru);
      return {ok:false, erro:"O servidor respondeu algo inesperado (não era JSON). Veja o Console (F12) — provavelmente a implantação do Apps Script precisa ser revisada."};
    }
  }catch(e){
    // "Failed to fetch" / TypeError aqui quase sempre é bloqueio de CORS ou URL incorreta/implantação não publicada.
    console.error(`Erro de conexão com o backend na ação "${action}":`, e);
    return {ok:false, erro:"Não foi possível conectar ao servidor. Verifique sua internet e tente de novo. (Detalhe técnico no Console, F12)"};
  }
}

function normalizarTextoCliente(s){
  return String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
}
const PAPEIS_QUALIDADE = ["qualidade", "admin", "administrador", "gestao", "gestor", "coordenacao", "coordenador"];
function mapColaboradorParaUser(colab){
  const papelNorm = normalizarTextoCliente(colab.papel);
  const setorNorm = normalizarTextoCliente(colab.setor);
  const role = (PAPEIS_QUALIDADE.some(p => papelNorm.includes(p)) || setorNorm.includes("qualidade")) ? "qualidade" : "colaborador";
  return {
    matricula: String(colab.matricula), nome: colab.nome, role,
    setor: colab.setor, filial: colab.filial, funcao: colab.funcao, cargo: colab.cargo || colab.funcao,
    email: colab.email || ""
  };
}

document.getElementById('loginForm').addEventListener('submit', async function(e){
  e.preventDefault();
  const mat = document.getElementById('loginMatricula').value.trim();
  const senha = document.getElementById('loginSenha').value;
  const errEl = document.getElementById('loginError');
  const btnEntrar = this.querySelector('button[type="submit"]');
  errEl.style.display = "none";
  btnEntrar.disabled = true; btnEntrar.textContent = "Entrando...";

  const resp = await backendCall('login', {matricula: mat, senha});

  btnEntrar.disabled = false; btnEntrar.textContent = "Entrar";

  if(!resp.ok){
    errEl.textContent = resp.erro || "Matrícula ou senha inválida.";
    errEl.style.display = "block";
    return;
  }

  try{
    currentUser = mapColaboradorParaUser(resp.colaborador);
    if(resp.precisaTrocarSenha){
      abrirModalTrocaSenha({obrigatoria: true, primeiroAcesso: !!resp.primeiroAcesso, senhaAtual: senha});
      return; // só entra de fato no app depois de trocar a senha
    }
    entrarNoApp();
  }catch(err){
    console.error("Erro ao entrar:", err);
    currentUser = null;
    errEl.textContent = "Ocorreu um erro inesperado ao entrar. Tente novamente.";
    errEl.style.display = "block";
  }
});

function entrarNoApp(){
  document.getElementById('loginScreen').style.display = "none";
  document.getElementById('appRoot').style.display = "flex";
  applyRole(currentUser.role);
  saveState();
  showToast(`Bem-vindo(a), ${currentUser.nome}.`, "success");
  sincronizarDadosDoServidor(true);
  if(!window._syncIntervalIniciado){
    window._syncIntervalIniciado = true;
    setInterval(()=> sincronizarDadosDoServidor(true), 20 * 1000); // a cada 20s, em segundo plano
  }
}

/* ======================= TROCA DE SENHA (obrigatória no 1º acesso, ou voluntária) ======================= */
function abrirModalTrocaSenha(opts){
  opts = opts || {};
  const obrigatoria = !!opts.obrigatoria;
  const backdrop = document.createElement('div');
  backdrop.className = 'share-backdrop';
  backdrop.id = 'trocaSenhaBackdrop';
  backdrop.innerHTML = `
    <div class="share-card" style="max-width:380px; text-align:left;">
      <h3>${opts.primeiroAcesso ? '👋 Bem-vindo(a)! Crie sua senha' : '🔒 Trocar senha'}</h3>
      <p class="hint" style="margin-bottom:16px;">${opts.primeiroAcesso
        ? 'Este é seu primeiro acesso. Por segurança, defina uma senha só sua antes de continuar.'
        : 'Defina uma nova senha de acesso.'}</p>
      <form id="formTrocaSenha">
        ${obrigatoria ? '' : '<div class="field" style="margin-bottom:10px;"><label>Senha atual</label><input type="password" id="tsSenhaAtual" required></div>'}
        <div class="field" style="margin-bottom:10px;"><label>Nova senha</label><input type="password" id="tsNovaSenha" minlength="4" required></div>
        <div class="field" style="margin-bottom:10px;"><label>Confirmar nova senha</label><input type="password" id="tsConfirmar" minlength="4" required></div>
        <div class="login-error" id="tsErro">As senhas não coincidem.</div>
        <button type="submit" class="btn btn-primary btn-block" style="margin-top:8px;">Salvar nova senha</button>
      </form>
      ${obrigatoria ? '' : '<div class="share-actions" style="margin-top:12px;"><button class="btn btn-outline" id="tsCancelar">Cancelar</button></div>'}
    </div>`;
  document.body.appendChild(backdrop);
  if(!obrigatoria){
    backdrop.addEventListener('click', (e)=>{ if(e.target===backdrop) backdrop.remove(); });
    document.getElementById('tsCancelar').addEventListener('click', ()=> backdrop.remove());
  }
  document.getElementById('formTrocaSenha').addEventListener('submit', async function(e){
    e.preventDefault();
    const erroEl = document.getElementById('tsErro');
    erroEl.style.display = "none";
    const novaSenha = document.getElementById('tsNovaSenha').value;
    const confirmar = document.getElementById('tsConfirmar').value;
    if(novaSenha !== confirmar){ erroEl.textContent = "As senhas não coincidem."; erroEl.style.display = "block"; return; }
    // No primeiro acesso obrigatório, a "senha atual" ainda é a própria matrícula.
    const senhaAtual = obrigatoria ? (opts.senhaAtual != null ? opts.senhaAtual : currentUser.matricula) : document.getElementById('tsSenhaAtual').value;
    const btn = this.querySelector('button[type="submit"]');
    btn.disabled = true; btn.textContent = "Salvando...";
    const resp = await backendCall('changePassword', {matricula: currentUser.matricula, senhaAtual, novaSenha});
    btn.disabled = false; btn.textContent = "Salvar nova senha";
    if(!resp.ok){ erroEl.textContent = resp.erro || "Não foi possível trocar a senha."; erroEl.style.display = "block"; return; }
    backdrop.remove();
    showToast("Senha atualizada com sucesso!", "success");
    if(obrigatoria) entrarNoApp();
  });
}

/* ======================= ESQUECI MINHA SENHA ======================= */
document.getElementById('btnEsqueciSenha').addEventListener('click', ()=>{
  const backdrop = document.createElement('div');
  backdrop.className = 'share-backdrop';
  backdrop.id = 'esqueciSenhaBackdrop';
  backdrop.innerHTML = `
    <div class="share-card" style="max-width:380px; text-align:left;">
      <h3>Esqueci minha senha</h3>
      <p class="hint" style="margin-bottom:16px;">Informe sua matrícula. A equipe de Qualidade vai receber um aviso por e-mail e liberar uma senha temporária para você.</p>
      <form id="formEsqueciSenha">
        <div class="field" style="margin-bottom:10px;"><label>Matrícula</label><input type="text" id="esqMatricula" required></div>
        <div class="login-error" id="esqErro"></div>
        <button type="submit" class="btn btn-primary btn-block" style="margin-top:8px;">Solicitar redefinição</button>
      </form>
      <div class="share-actions" style="margin-top:12px;"><button class="btn btn-outline" id="esqCancelar">Fechar</button></div>
    </div>`;
  document.body.appendChild(backdrop);
  backdrop.addEventListener('click', (e)=>{ if(e.target===backdrop) backdrop.remove(); });
  document.getElementById('esqCancelar').addEventListener('click', ()=> backdrop.remove());
  document.getElementById('formEsqueciSenha').addEventListener('submit', async function(e){
    e.preventDefault();
    const erroEl = document.getElementById('esqErro');
    erroEl.style.display = "none";
    const matricula = document.getElementById('esqMatricula').value.trim();
    const btn = this.querySelector('button[type="submit"]');
    btn.disabled = true; btn.textContent = "Enviando...";
    const resp = await backendCall('requestReset', {matricula});
    btn.disabled = false; btn.textContent = "Solicitar redefinição";
    if(!resp.ok){ erroEl.textContent = resp.erro || "Não foi possível registrar o pedido."; erroEl.style.display = "block"; return; }
    backdrop.remove();
    showToast("Pedido enviado! A Qualidade foi avisada por e-mail e vai liberar uma senha temporária.", "success");
  });
});

/* ======================= IMPORTAR HISTÓRICO DE CAMPANHAS PASSADAS ======================= */
let historicoParseado = null;

document.getElementById('btnBaixarModeloHistorico')?.addEventListener('click', ()=>{
  const headers = ["campanha","periodoInicio","periodoFim","matricula","nome","setor","filial","funcao","percentualAcertos","ganhador","premio"];
  const rows = [["PPG 2023.2 – Ética","2023-08-01","2023-08-20","100234","Ana Souza","TI","Matriz","Analista","100","Sim","Vale-compras R$ 150,00"]];
  downloadCSV('modelo_historico_ppg.csv', headers, rows);
});

document.getElementById('historicoImportFile')?.addEventListener('change', function(e){
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = function(evt){
    try{
      const data = new Uint8Array(evt.target.result);
      const wb = XLSX.read(data, {type:'array'});
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, {defval:""});
      historicoParseado = rows.map(r=>({
        campanha: String(r.campanha || r.Campanha || '').trim(),
        periodoInicio: String(r.periodoInicio || r['Período Início'] || r.inicio || '').trim(),
        periodoFim: String(r.periodoFim || r['Período Fim'] || r.fim || '').trim(),
        matricula: String(r.matricula || r.Matricula || r['Matrícula'] || '').trim(),
        nome: String(r.nome || r.Nome || '').trim(),
        setor: String(r.setor || r.Setor || '').trim(),
        filial: String(r.filial || r.Filial || '').trim(),
        funcao: String(r.funcao || r.Funcao || r['Função'] || '').trim(),
        percentualAcertos: Number(r.percentualAcertos || r['% Acertos'] || r.pct || 0),
        ganhador: /sim|true|1/i.test(String(r.ganhador || r.Ganhador || '')),
        premio: String(r.premio || r.Premio || r['Prêmio'] || '').trim()
      })).filter(r=>r.campanha && r.matricula);

      if(!historicoParseado.length){ showToast("Não encontrei linhas válidas nesse arquivo. Confira se as colunas 'campanha' e 'matricula' estão preenchidas.","warning"); return; }

      const campanhasUnicas = new Set(historicoParseado.map(r=>r.campanha));
      const ganhadoresCount = historicoParseado.filter(r=>r.ganhador).length;
      document.getElementById('historicoResumoPreview').innerHTML = `
        <div class="stat"><b>${campanhasUnicas.size}</b><span>Campanha(s) encontrada(s)</span></div>
        <div class="stat"><b>${historicoParseado.length}</b><span>Participações no arquivo</span></div>
        <div class="stat"><b>${ganhadoresCount}</b><span>Marcado(s) como ganhador</span></div>`;

      document.getElementById('tblHistoricoPreview').innerHTML = historicoParseado.slice(0,200).map(r=>`
        <tr><td>${r.campanha}</td><td>${r.matricula}</td><td>${r.nome}</td><td>${r.setor}</td><td>${r.percentualAcertos}%</td><td>${r.ganhador?'🏆 Sim':'—'}</td></tr>
      `).join('');
      document.getElementById('historicoPreviewWrap').style.display = "block";
      if(window.lucide) lucide.createIcons();
    }catch(err){
      showToast("Não foi possível ler o arquivo. Verifique se é .xlsx ou .csv com as colunas esperadas.","warning");
    }
    e.target.value = "";
  };
  reader.readAsArrayBuffer(file);
});

document.getElementById('btnCancelarImportHistorico')?.addEventListener('click', ()=>{
  historicoParseado = null;
  document.getElementById('historicoPreviewWrap').style.display = "none";
});

document.getElementById('btnConfirmarImportHistorico')?.addEventListener('click', async ()=>{
  if(!historicoParseado || !historicoParseado.length) return;
  const btn = document.getElementById('btnConfirmarImportHistorico');
  btn.disabled = true; btn.textContent = "Importando...";
  const resp = await backendCall('importarHistorico', {linhas: historicoParseado, importadoPor: currentUser.nome});
  btn.disabled = false; btn.innerHTML = '<i data-lucide="check"></i> Confirmar importação';
  if(window.lucide) lucide.createIcons();
  if(!resp.ok){ showToast(resp.erro || "Não foi possível importar.", "warning"); return; }
  showToast(`${resp.importadas} linha(s) importada(s) com sucesso! Já fica visível para toda a equipe.`, "success");
  logAction("Histórico importado", `${resp.importadas} linha(s) via arquivo`);
  document.getElementById('historicoPreviewWrap').style.display = "none";
  historicoParseado = null;
  renderHistoricoImportado();
});

async function renderHistoricoImportado(){
  const tbody = document.getElementById('tblHistoricoImportado');
  if(!tbody) return;
  tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--ink-soft); padding:16px;">Carregando…</td></tr>`;
  const resp = await backendCall('getHistorico');
  if(!resp.ok){
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--error); padding:16px;">${resp.erro || 'Não foi possível carregar.'}</td></tr>`;
    return;
  }
  const linhas = resp.historico || [];
  const porCampanha = {};
  linhas.forEach(l=>{
    if(!porCampanha[l.campanha]) porCampanha[l.campanha] = {periodo:`${l.periodoInicio} – ${l.periodoFim}`, total:0, ganhadores:0};
    porCampanha[l.campanha].total++;
    if(String(l.ganhador).toLowerCase() === 'sim') porCampanha[l.campanha].ganhadores++;
  });
  tbody.innerHTML = Object.entries(porCampanha).map(([nome, info])=>`
    <tr><td>${nome}</td><td>${info.periodo}</td><td>${info.total}</td><td>${info.ganhadores}</td></tr>
  `).join('') || `<tr><td colspan="4" style="text-align:center; color:var(--ink-soft); padding:16px;">Nenhum histórico importado ainda.</td></tr>`;
}
document.getElementById('btnAtualizarHistoricoImportado')?.addEventListener('click', renderHistoricoImportado);

/* ======================= FALE COM A QUALIDADE ======================= */
document.getElementById('formFaleConosco')?.addEventListener('submit', async function(e){
  e.preventDefault();
  const erroEl = document.getElementById('fcErro');
  erroEl.style.display = "none";
  const assunto = document.getElementById('fcAssunto').value.trim();
  const mensagem = document.getElementById('fcMensagem').value.trim();
  const btn = this.querySelector('button[type="submit"]');
  btn.disabled = true; btn.textContent = "Enviando...";
  const resp = await backendCall('enviarDuvida', {matricula: currentUser.matricula, assunto, mensagem});
  btn.disabled = false; btn.innerHTML = '<i data-lucide="send"></i> Enviar para a Qualidade';
  if(window.lucide) lucide.createIcons();
  if(!resp.ok){ erroEl.textContent = resp.erro || "Não foi possível enviar sua mensagem."; erroEl.style.display = "block"; return; }
  this.reset();
  showToast("Mensagem enviada! A equipe de Qualidade foi avisada por e-mail.", "success");
});
async function renderDuvidas(){
  const tbody = document.getElementById('tblDuvidas');
  if(!tbody) return;
  tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--ink-soft); padding:16px;">Carregando…</td></tr>`;
  const resp = await backendCall('listarDuvidas');
  if(!resp.ok){
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--error); padding:16px;">${resp.erro || 'Não foi possível carregar as mensagens.'}</td></tr>`;
    return;
  }
  const duvidas = (resp.duvidas || []).sort((a,b)=> new Date(b.dataHora) - new Date(a.dataHora));
  tbody.innerHTML = duvidas.map(d=>`
    <tr><td>${fmtDateTime(new Date(d.dataHora))}</td><td>${d.matricula}</td><td>${d.nome}</td><td>${d.assunto}</td><td>${d.mensagem}</td></tr>
  `).join('') || `<tr><td colspan="5" style="text-align:center; color:var(--ink-soft); padding:16px;">Nenhuma mensagem recebida ainda.</td></tr>`;
}
document.getElementById('btnAtualizarDuvidas')?.addEventListener('click', renderDuvidas);

/* ======================= QUALIDADE: RESOLVER PEDIDOS DE SENHA ======================= */
async function renderPedidosSenha(){
  const tbody = document.getElementById('tblPedidosSenha');
  if(!tbody) return;
  tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--ink-soft); padding:16px;">Carregando…</td></tr>`;
  const resp = await backendCall('listPasswordRequests');
  if(!resp.ok){
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--error); padding:16px;">${resp.erro || 'Não foi possível carregar os pedidos.'}</td></tr>`;
    return;
  }
  const pedidos = (resp.pedidos || []).sort((a,b)=> new Date(b.dataHora) - new Date(a.dataHora));
  tbody.innerHTML = pedidos.map(p=>`
    <tr>
      <td>${fmtDateTime(new Date(p.dataHora))}</td><td>${p.matricula}</td><td>${p.nome}</td>
      <td><span class="badge ${p.status==='pendente'?'programada':'finalizada'}">${p.status}</span></td>
      <td>${p.status==='pendente'
        ? `<button class="btn btn-outline btn-sm" onclick="resolverPedidoSenha('${p.matricula}')">Definir senha temporária</button>`
        : `—`}</td>
    </tr>`).join('') || `<tr><td colspan="5" style="text-align:center; color:var(--ink-soft); padding:16px;">Nenhum pedido registrado.</td></tr>`;
}
window.resolverPedidoSenha = function(matricula){
  const senhaTemp = prompt(`Defina a senha temporária para a matrícula ${matricula}:\n(a pessoa vai precisar trocá-la no próximo acesso)`);
  if(!senhaTemp) return;
  backendCall('resolveReset', {matricula, novaSenhaTemp: senhaTemp, atendidoPor: currentUser.nome}).then(resp=>{
    if(resp.ok){ showToast("Senha temporária definida com sucesso.", "success"); renderPedidosSenha(); }
    else showToast(resp.erro || "Não foi possível concluir.", "warning");
  });
};
document.getElementById('btnAtualizarPedidosSenha')?.addEventListener('click', renderPedidosSenha);
document.getElementById('btnTrocarMinhaSenha')?.addEventListener('click', ()=> abrirModalTrocaSenha({obrigatoria:false}));

/* ======================= SINCRONIZAÇÃO DO QUADRO DE COLABORADORES ======================= */
/* Busca o quadro real na planilha (em segundo plano, sem pedir nada a ninguém)
   e mantém a amostragem de participantes/sorteio coerente com dados reais. */
async function sincronizarColaboradores(){
  const resp = await backendCall('getColaboradores');
  if(resp.ok && Array.isArray(resp.colaboradores) && resp.colaboradores.length){
    EMPRESA.colaboradores = resp.colaboradores.map(c=>({
      matricula: String(c.matricula), nome: c.nome, setor: c.setor, filial: c.filial, funcao: c.funcao
    }));
    console.log(`Quadro de colaboradores sincronizado: ${EMPRESA.colaboradores.length} pessoa(s).`);
  }
}
sincronizarColaboradores();
setInterval(sincronizarColaboradores, 5 * 60 * 1000); // a cada 5 minutos, em segundo plano

/* ======================= SINCRONIZAÇÃO AO VIVO: campanhas, perguntas, respostas ======================= */
/* A planilha é a única fonte de verdade — campanhas, banco de perguntas e
   respostas nunca ficam "presas" num navegador. Toda tela relevante busca
   os dados mais recentes nesta função, tanto ao entrar quanto em ciclos
   automáticos em segundo plano. */
let sincronizando = false;
async function sincronizarDadosDoServidor(silencioso){
  if(sincronizando) return; // evita chamadas simultâneas empilhadas
  sincronizando = true;
  try{
    const [respCamp, respBanco, respRespostas, respHist] = await Promise.all([
      backendCall('getCampanhas'),
      backendCall('getBancoPerguntas'),
      backendCall('getRespostas'),
      backendCall('getHistorico')
    ]);
    if(respCamp.ok && Array.isArray(respCamp.campanhas)) campaigns = respCamp.campanhas;
    if(respBanco.ok && Array.isArray(respBanco.perguntas)) questionBank = respBanco.perguntas;
    if(respRespostas.ok && Array.isArray(respRespostas.respostas)){
      participants = respRespostas.respostas.map(r=>({...r, data: r.dataFim ? new Date(r.dataFim) : new Date(), dataInicio: r.dataInicio ? new Date(r.dataInicio) : null, dataFim: r.dataFim ? new Date(r.dataFim) : null}));
    }
    const historicoImportado = (respHist.ok && Array.isArray(respHist.historico)) ? respHist.historico : [];
    const ganhosImportados = historicoImportado
      .filter(h => String(h.ganhador).toLowerCase() === 'sim')
      .map(h => ({matricula: String(h.matricula), data: new Date(h.periodoFim || h.importadoEm || Date.now())}));
    const ganhosAoVivo = [];
    campaigns.forEach(c=>{
      if(c.ganhadores && c.ganhadores.length) c.ganhadores.forEach(g => ganhosAoVivo.push({matricula: String(g.matricula), data: new Date(c.fim)}));
    });
    wonHistory = [...ganhosImportados, ...ganhosAoVivo];

    renderSectionContent(currentSectionId); // atualiza a tela que estiver aberta com os dados frescos
    if(!silencioso) console.log("Dados sincronizados com o servidor.");
  }catch(e){
    console.warn("Não foi possível sincronizar com o servidor agora:", e);
  }finally{
    sincronizando = false;
  }
}
document.getElementById('btnLogout').addEventListener('click', ()=>{
  currentUser = null;
  saveState();
  document.getElementById('appRoot').style.display = "none";
  document.getElementById('loginScreen').style.display = "";
  document.getElementById('loginScreen').scrollTo(0, 0);
  document.getElementById('loginForm').reset();
});
function applyRole(role){
  currentRole = role;
  const isAdmin = role === "qualidade";
  document.body.classList.toggle('role-colaborador', !isAdmin);
  document.getElementById('userName').textContent = currentUser.nome;
  document.getElementById('userRole').textContent = isAdmin ? "Qualidade · Administrador" : `Colaborador · ${currentUser.funcao || ''}`;
  const initials = currentUser.nome.split(' ').filter(Boolean).slice(0,2).map(n=>n[0]).join('').toUpperCase();
  document.getElementById('avatarInit').textContent = initials;
  document.getElementById('configSubtitle').textContent = isAdmin ? "Preferências pessoais e parâmetros gerais do sistema." : "Preferências pessoais.";
  logAction(isAdmin ? "Login (Qualidade)" : "Login (Colaborador)", `${currentUser.nome} autenticado(a) no sistema.`);
  if(window.lucide) lucide.createIcons();
  const defaultTarget = isAdmin ? "inicio" : "campanha-atual";
  document.querySelectorAll('.menu-item').forEach(b=>b.classList.remove('active'));
  const btn = document.querySelector(`[data-target="${defaultTarget}"]`);
  if(btn) btn.classList.add('active');
  if(!isAdmin && deepLinkCampaignId && campaigns.find(c=>c.id===deepLinkCampaignId)){
    goToSection(defaultTarget);
    openQuiz(deepLinkCampaignId);
  } else {
    goToSection(defaultTarget);
  }
}

/* ======================= TEMA ======================= */
function setDarkMode(on){ document.body.classList.toggle('dark', on); }
window.themePreference = 'auto';
function aplicarTema(pref){
  window.themePreference = pref;
  const escuro = pref === 'auto'
    ? !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
    : pref === 'dark';
  setDarkMode(escuro);
  document.querySelectorAll('#themeTabs .login-tab').forEach(t => t.classList.toggle('active', t.dataset.theme === pref));
  saveState();
}
document.querySelectorAll('#themeTabs .login-tab').forEach(tab=>{
  tab.addEventListener('click', ()=> aplicarTema(tab.dataset.theme));
});
document.getElementById('themeToggleTop').addEventListener('click', ()=>{
  aplicarTema(document.body.classList.contains('dark') ? 'light' : 'dark');
});
if(window.matchMedia){
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', ()=>{
    if(window.themePreference === 'auto') aplicarTema('auto');
  });
}

/* ======================= TOAST ======================= */
function showToast(msg, type=""){
  const t = document.getElementById('toast');
  t.textContent = msg; t.className = "toast show " + type;
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(()=> t.className = "toast " + type, 2800);
}

/* ======================= HELPERS ======================= */
function statusBadge(status){
  const map = {programada:["programada","Programada"], andamento:["andamento","Em andamento"], encerrada:["encerrada","Encerrada"], finalizada:["finalizada","Finalizada"]};
  const [cls,label] = map[status];
  return `<span class="badge ${cls}">${label}</span>`;
}
function campaignParticipants(id){ return participants.filter(p=>p.campaignId===id); }
function fillCampaignSelects(){
  const selects = [document.getElementById('selectCampanhaParticipantes'), document.getElementById('selectCampanhaElegiveis'), document.getElementById('selectCampanhaSorteio'), document.getElementById('selectCampanhaRelatorio')];
  selects.forEach(sel=>{
    if(!sel) return;
    const prev = sel.value;
    sel.innerHTML = campaigns.map(c=>`<option value="${c.id}">${c.nome}</option>`).join('');
    if(prev) sel.value = prev;
  });
}

/* ======================= DASHBOARD (com drill-down) ======================= */
function renderDashboard(){
  renderQualidadeTip();
  document.getElementById('kpiTotalCampanhas').textContent = campaigns.length;
  document.getElementById('kpiAndamento').textContent = campaigns.filter(c=>c.status==="andamento").length;
  document.getElementById('kpiProgramadas').textContent = campaigns.filter(c=>c.status==="programada").length;
  const latest = campaigns[0];
  document.getElementById('kpiParticipantes').textContent = latest ? campaignParticipants(latest.id).length : 0;
  document.getElementById('kpiElegiveis').textContent = latest ? evaluateEligibility(latest.id).eligible.length : 0;
  const ganhadores = campaigns.filter(c=>c.ganhadores).reduce((a,c)=>a+c.ganhadores.length,0);
  document.getElementById('kpiGanhadores').textContent = ganhadores;

  const barsEl = document.getElementById('chartParticipacao');
  const maxCount = Math.max(...campaigns.map(c=>campaignParticipants(c.id).length), 1);
  barsEl.innerHTML = campaigns.map(c=>{
    const n = campaignParticipants(c.id).length;
    const h = Math.max(8, Math.round((n/maxCount)*130));
    const shortName = c.nome.split('–')[0].trim();
    return `<div class="bar-col"><div class="bar-value">${n}</div><div class="bar-shell"><div class="bar-fill" style="height:0px" data-h="${h}"></div></div><div class="bar-label">${shortName}</div></div>`;
  }).join('');
  requestAnimationFrame(()=> document.querySelectorAll('#chartParticipacao .bar-fill').forEach(el=> el.style.height = el.dataset.h + "px"));

  const ref = campaigns.find(c=>c.status==="encerrada") || campaigns[0];
  const refP = ref ? campaignParticipants(ref.id) : [];
  const p100 = refP.filter(p=>p.pct===100).length, p90 = refP.filter(p=>p.pct===90).length, p80 = refP.filter(p=>p.pct===80).length;
  const pOther = refP.length - p100 - p90 - p80;
  const total = refP.length || 1;
  const seg = [{v:p100,c:"var(--success)",label:"100%"},{v:p90,c:"var(--primary)",label:"90%"},{v:p80,c:"var(--warning)",label:"80%"},{v:pOther,c:"var(--error)",label:"≤70%"}];
  let acc = 0;
  const stops = seg.map(s=>{const start=acc/total*360; acc+=s.v; const end=acc/total*360; return `${s.c} ${start}deg ${end}deg`;}).join(', ');
  document.getElementById('chartDonut').innerHTML = `
    <div style="width:130px;height:130px;border-radius:50%; background:conic-gradient(${stops}); display:flex; align-items:center; justify-content:center;">
      <div style="width:78px;height:78px;border-radius:50%; background:var(--card); display:flex; flex-direction:column; align-items:center; justify-content:center;">
        <div style="font-family:'Manrope'; font-weight:800; font-size:18px; color:var(--secondary);">${total}</div><div style="font-size:10px; color:var(--ink-soft);">respostas</div>
      </div></div>
    <div class="donut-legend">${seg.map(s=>`<div><span class="legend-dot" style="background:${s.c}"></span>${s.label} — ${s.v}</div>`).join('')}</div>`;

  const allWinners = campaigns.filter(c=>c.ganhadores).flatMap(c=>c.ganhadores);
  renderHBarChart('chartSetor', allWinners, 'setor', SETORES.filter(s=> allWinners.some(w=>w.setor===s)).length ? [...new Set(allWinners.map(w=>w.setor))] : SETORES.slice(0,8));
  renderHBarChart('chartFilial', allWinners, 'filial', UNIDADES);

  document.getElementById('tblUltimasCampanhas').innerHTML = campaigns.map(c=>{
    const n = campaignParticipants(c.id).length;
    return `<tr><td>${c.nome}</td><td>${c.inicio.replace('T',' ')} – ${c.fim.replace('T',' ')}</td><td>${n}</td><td>${statusBadge(c.status)}</td></tr>`;
  }).join('');
}
function renderHBarChart(elId, winners, field, universe){
  const counts = {}; universe.forEach(u=>counts[u]=0);
  winners.forEach(w=>{ counts[w[field]] = (counts[w[field]]||0) + 1; });
  const max = Math.max(...Object.values(counts), 1);
  const el = document.getElementById(elId);
  el.innerHTML = Object.entries(counts).map(([k,v],idx)=>{
    const rowId = elId + "_row" + idx;
    const names = winners.filter(w=>w[field]===k).map(w=>`${w.nome} · ${w.funcao||''}`);
    return `<div>
      <div class="hbar-row clickable" onclick="toggleHbarDetail('${rowId}')">
        <div class="hbar-label">${k}</div>
        <div class="hbar-track"><div class="hbar-fill" style="width:0%" data-w="${(v/max*100)}"></div></div>
        <div class="hbar-value">${v}</div>
      </div>
      <div class="hbar-detail" id="${rowId}">${names.length ? names.map(n=>`<span>${n}</span>`).join('') : 'Nenhum ganhador ainda neste grupo.'}</div>
    </div>`;
  }).join('');
  requestAnimationFrame(()=> el.querySelectorAll('.hbar-fill').forEach(f=> f.style.width = f.dataset.w + "%"));
}
window.toggleHbarDetail = function(id){ document.getElementById(id).classList.toggle('open'); };

/* Drill-down dos KPIs do dashboard */
window.goToRodadas = function(){ document.querySelector('[data-target="campanhas"]').click(); };
window.goToResultadosLatest = function(){ if(campaigns[0]) goToParticipants(campaigns[0].id); };
window.goToElegiveisLatest = function(){
  if(!campaigns[0]) return;
  document.querySelector('[data-target="elegiveis"]').click();
  document.getElementById('selectCampanhaElegiveis').value = campaigns[0].id;
  renderEligibleTable();
};
window.goToHistoricoAdmin = function(){ document.querySelector('[data-target="historico"]').click(); };

/* ======================= CAMPANHAS / RODADAS (Qualidade) ======================= */
function renderCampaignGrid(){
  document.getElementById('campaignGrid').innerHTML = campaigns.map(c=>{
    const n = campaignParticipants(c.id).length;
    const {eligible} = evaluateEligibility(c.id);
    return `<div class="ccard">
      <div style="display:flex; justify-content:space-between; align-items:flex-start;"><h4>${c.nome}</h4>${statusBadge(c.status)}</div>
      <div class="desc">${c.descricao}</div>
      <div class="meta">
        <span><i data-lucide="calendar"></i> ${c.inicio.replace('T',' ')} → ${c.fim.replace('T',' ')}</span>
        <span><i data-lucide="clipboard-list"></i> ${c.questoes ? c.questoes.length : '—'} perguntas · <i data-lucide="trophy"></i> ${c.qtdGanhadores} ganhadores</span>
        <span><i data-lucide="users"></i> ${n} participantes · <i data-lucide="check-circle-2"></i> ${eligible.length} elegíveis</span>
      </div>
      <div class="actions">
        <button class="btn btn-ghost btn-sm" onclick="goToParticipants('${c.id}')">Ver participantes</button>
        <button class="btn btn-outline btn-sm" onclick="loadCampaignForEdit('${c.id}')">Editar</button>
        <button class="btn btn-outline btn-sm" onclick="openShareModal('${c.id}')"><i data-lucide="share-2"></i> Compartilhar</button>
      </div>
    </div>`;
  }).join('') || `<p style="color:var(--ink-soft); font-size:13px;">Nenhuma campanha cadastrada.</p>`;
}
window.goToParticipants = function(id){
  document.querySelectorAll('.menu-item').forEach(b=>b.classList.remove('active'));
  const btn = document.querySelector('[data-target="participantes"]'); if(btn) btn.classList.add('active');
  goToSection('participantes');
  document.getElementById('selectCampanhaParticipantes').value = id;
  renderParticipantsTable();
};

/* ======================= PARTICIPANTES / RESULTADOS ======================= */
function renderParticipantsTable(){
  const sel = document.getElementById('selectCampanhaParticipantes');
  const id = sel.value;
  const list = campaignParticipants(id).sort((a,b)=>b.pct-a.pct);
  document.getElementById('tblParticipantes').innerHTML = list.map(p=>`
    <tr><td>${p.nome}</td><td>${p.matricula}</td><td>${p.cargo}</td><td>${p.setor}</td><td>${p.filial}</td><td>${fmtDateTime(p.data)}</td><td><span class="${p.pct===100?'pct100':'pctless'}">${p.pct}%</span></td></tr>`).join('') ||
    `<tr><td colspan="7" style="text-align:center; color:var(--ink-soft); padding:20px;">Nenhum participante ainda.</td></tr>`;
  const media = list.length ? Math.round(list.reduce((a,p)=>a+p.pct,0)/list.length) : 0;
  const {eligible} = evaluateEligibility(id);
  document.getElementById('participantesStats').innerHTML = `
    <div class="stat"><b>${list.length}</b><span>Total de participantes</span></div>
    <div class="stat"><b>${eligible.length}</b><span>Total de elegíveis</span></div>
    <div class="stat"><b>${media}%</b><span>Média geral de acertos</span></div>`;

  const c = campaigns.find(x=>x.id===id);
  const qs = (c && c.questoes) || [];
  const stats = qs.map((q,idx)=>{
    const answered = list.filter(p=>p.respostasCorretas);
    const withData = answered.length ? answered : null;
    let pctCorrect;
    if(withData){
      pctCorrect = Math.round(withData.filter(p=>p.respostasCorretas[idx]).length / withData.length * 100);
    } else {
      pctCorrect = q._mockAcerto !== undefined ? q._mockAcerto : (55 + Math.floor(Math.random()*35));
      q._mockAcerto = pctCorrect;
    }
    return {texto:q.texto, pct:pctCorrect};
  });
  const asc = [...stats].sort((a,b)=>a.pct-b.pct), desc = [...stats].sort((a,b)=>b.pct-a.pct);
  document.getElementById('questoesErro').innerHTML = asc.slice(0,3).map(s=>`<div class="hbar-row"><div class="hbar-label" style="width:auto; flex:1; white-space:normal;">${s.texto}</div><div class="hbar-value" style="color:var(--error); width:40px;">${s.pct}%</div></div>`).join('') || '<p class="hint">Sem dados.</p>';
  document.getElementById('questoesAcerto').innerHTML = desc.slice(0,3).map(s=>`<div class="hbar-row"><div class="hbar-label" style="width:auto; flex:1; white-space:normal;">${s.texto}</div><div class="hbar-value" style="color:var(--success); width:40px;">${s.pct}%</div></div>`).join('') || '<p class="hint">Sem dados.</p>';
}
document.getElementById('selectCampanhaParticipantes').addEventListener('change', renderParticipantsTable);

/* ======================= ELEGÍVEIS ======================= */
function renderEligibleTable(){
  const id = document.getElementById('selectCampanhaElegiveis').value;
  const {eligible, excluded} = evaluateEligibility(id);
  document.getElementById('tblElegiveis').innerHTML = eligible.map((p,i)=>`<tr><td>${i+1}</td><td>${p.nome}</td><td>${p.matricula}</td><td>${p.cargo}</td><td>${p.setor}</td><td>${p.filial}</td><td>${fmtDateTime(p.data)}</td></tr>`).join('') ||
    `<tr><td colspan="7" style="text-align:center; color:var(--ink-soft); padding:20px;">Nenhum colaborador elegível nesta campanha.</td></tr>`;
  document.getElementById('tblExcluidos').innerHTML = excluded.map(p=>`<tr><td>${p.nome}</td><td>${p.matricula}</td><td>${p.cargo}</td><td>${p.setor}</td><td><span class="badge excluido">${p.motivo}</span></td></tr>`).join('') ||
    `<tr><td colspan="5" style="text-align:center; color:var(--ink-soft); padding:20px;">Nenhuma exclusão automática nesta campanha.</td></tr>`;
}
document.getElementById('selectCampanhaElegiveis').addEventListener('change', renderEligibleTable);

/* ======================= COMPARTILHAMENTO (LINK + QR CODE) ======================= */
window.openShareModal = function(campaignId){
  const c = campaigns.find(x=>x.id===campaignId);
  if(!c) return;
  const link = `${window.location.origin}${window.location.pathname}?campanha=${campaignId}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(link)}`;
  const backdrop = document.createElement('div');
  backdrop.className = "share-backdrop";
  backdrop.id = "shareBackdrop";
  backdrop.innerHTML = `
    <div class="share-card">
      <h3>Divulgar campanha</h3>
      <p>${c.nome}</p>
      <div class="share-qr"><img src="${qrUrl}" alt="QR Code de acesso à campanha" onerror="this.parentElement.innerHTML='<span style=\\'font-size:11px;color:var(--ink-soft);padding:12px;\\'>QR indisponível sem conexão à internet</span>'"></div>
      <div class="share-link-box">
        <input type="text" id="shareLinkInput" value="${link}" readonly>
        <button class="btn btn-primary btn-sm" id="btnCopyShareLink">Copiar</button>
      </div>
      <p class="hint" style="margin-bottom:16px;">Compartilhe este link ou o QR Code por e-mail, WhatsApp ou impresso — ao abrir, o colaborador faz login e já cai direto no questionário.</p>
      <div class="share-actions"><button class="btn btn-outline" id="btnCloseShare">Fechar</button></div>
    </div>`;
  document.body.appendChild(backdrop);
  backdrop.addEventListener('click', (e)=>{ if(e.target === backdrop) closeShareModal(); });
  document.getElementById('btnCloseShare').addEventListener('click', closeShareModal);
  document.getElementById('btnCopyShareLink').addEventListener('click', ()=>{
    const input = document.getElementById('shareLinkInput');
    input.select();
    navigator.clipboard && navigator.clipboard.writeText(input.value).then(()=>{
      showToast("Link copiado para a área de transferência.","success");
    }).catch(()=>{
      document.execCommand('copy');
      showToast("Link copiado.","success");
    });
  });
  logAction("Campanha divulgada", `Link/QR gerado para ${c.nome}`);
};
window.closeShareModal = function(){
  const el = document.getElementById('shareBackdrop');
  if(el) el.remove();
};


let questionCounter = 0;
function createQuestionCard(qData){
  questionCounter++;
  const qid = "q" + questionCounter;
  const wrap = document.createElement('div');
  wrap.className = "qcard"; wrap.id = qid;
  const type = (qData && qData.type) || "unica";
  const texto = (qData && qData.texto) || "";
  const options = (qData && qData.options) || [{text:"",correct:false},{text:"",correct:false},{text:"",correct:false},{text:"",correct:false}];
  wrap.innerHTML = `
    <div class="qcard-head"><b>Pergunta</b><button type="button" class="remove-q" onclick="document.getElementById('${qid}').remove()">Remover</button></div>
    <div class="form-grid">
      <div class="field full"><label>Enunciado</label><input type="text" class="q-text" placeholder="Digite a pergunta" value="${texto.replace(/"/g,'&quot;')}"></div>
      <div class="field"><label>Tipo de pergunta</label>
        <select class="q-type" onchange="toggleQuestionType('${qid}', this.value)">
          <option value="unica" ${type==='unica'?'selected':''}>Resposta única</option>
          <option value="multipla" ${type==='multipla'?'selected':''}>Múltipla escolha</option>
          <option value="multiplas_respostas" ${type==='multiplas_respostas'?'selected':''}>Resposta múltipla</option>
          <option value="vf" ${type==='vf'?'selected':''}>Verdadeiro ou falso</option>
        </select>
      </div>
      <div class="field"><label>Anexo / imagem (opcional)</label><input type="file" accept="image/*" class="q-file"></div>
      <div class="field full q-options-wrap">
        <label>Alternativas — marque a(s) correta(s)</label>
        <div class="opt-hint">O sistema usa a marcação abaixo como gabarito oficial para corrigir automaticamente.</div>
        <div class="q-options"></div>
      </div>
    </div>`;
  document.getElementById('questionList').appendChild(wrap);
  renderOptionsFor(qid, type, options);
}
function renderOptionsFor(qid, type, options){
  const card = document.getElementById(qid);
  const opts = card.querySelector('.q-options');
  if(type === 'vf'){
    const vTrue = options[0] ? options[0].correct : true;
    opts.innerHTML = `
      <div class="opt-row"><input type="radio" name="${qid}-vf" class="q-correct-vf" value="0" ${vTrue?'checked':''}><span style="font-size:13px;">Verdadeiro</span></div>
      <div class="opt-row"><input type="radio" name="${qid}-vf" class="q-correct-vf" value="1" ${!vTrue?'checked':''}><span style="font-size:13px;">Falso</span></div>`;
  } else {
    const inputType = type === 'multiplas_respostas' ? 'checkbox' : 'radio';
    const nameAttr = inputType === 'radio' ? `name="${qid}-radio"` : "";
    opts.innerHTML = options.map((o,i)=>`
      <div class="opt-row"><input type="${inputType}" ${nameAttr} class="q-correct" ${o.correct?'checked':''}><input type="text" class="q-opt-text" placeholder="Alternativa ${i+1}" value="${(o.text||"").replace(/"/g,'&quot;')}"></div>`).join('');
  }
}
window.toggleQuestionType = function(qid, type){
  const blankOpts = type==='vf' ? [{text:"Verdadeiro",correct:true},{text:"Falso",correct:false}] : [{text:"",correct:false},{text:"",correct:false},{text:"",correct:false},{text:"",correct:false}];
  renderOptionsFor(qid, type, blankOpts);
};
document.getElementById('btnAddQuestion').addEventListener('click', ()=> createQuestionCard());
document.getElementById('btnResetForm').addEventListener('click', ()=>{
  document.getElementById('formCampanha').reset();
  document.getElementById('questionList').innerHTML = ""; questionCounter = 0;
  createQuestionCard(); createQuestionCard();
});
createQuestionCard(); createQuestionCard();

function collectQuestionsFromForm(){
  const qCards = document.querySelectorAll('#questionList .qcard');
  return Array.from(qCards).map(card=>{
    const texto = card.querySelector('.q-text').value || "Pergunta sem enunciado";
    const typeSel = card.querySelector('.q-type').value;
    let options;
    if(typeSel === 'vf'){
      const checked = card.querySelector('.q-correct-vf:checked');
      const isTrue = checked ? checked.value === "0" : true;
      options = [opt("Verdadeiro", isTrue), opt("Falso", !isTrue)];
    } else {
      const rows = card.querySelectorAll('.q-options .opt-row');
      options = Array.from(rows).map(r=>{
        const txt = r.querySelector('.q-opt-text').value || "";
        const chk = r.querySelector('.q-correct').checked;
        return opt(txt, chk);
      }).filter(o=>o.text.trim() !== "");
    }
    return {texto, type: typeSel, options};
  });
}

/* Reaproveitar pergunta do Banco de Perguntas dentro de Nova Campanha,
   com alerta de reutilização (controle de repetição — regra 14) */
function fillBQPicker(){
  const sel = document.getElementById('bqPickerSelect');
  if(!sel) return;
  sel.innerHTML = questionBank.filter(q=>q.status==='ativa').map(q=>`<option value="${q.codigo}">${q.codigo} — ${q.texto.slice(0,55)}</option>`).join('');
}
const btnInserirDoBanco = document.getElementById('btnInserirDoBanco');
if(btnInserirDoBanco){
  btnInserirDoBanco.addEventListener('click', ()=>{
    const sel = document.getElementById('bqPickerSelect');
    const q = questionBank.find(x=>x.codigo===sel.value);
    if(!q) return;
    const u = bqUsageStatus(q);
    if(u.cls === 'recente'){
      showToast(`Atenção: esta pergunta foi ${u.label.toLowerCase()}. Você pode reutilizá-la mesmo assim, se necessário.`, "warning");
    } else {
      showToast("Pergunta inserida no questionário.","success");
    }
    createQuestionCard({texto:q.texto, type:q.type, options:q.options});
    q.qtdUtilizacoes++; q.ultimaUtilizacao = new Date();
    renderBanco();
    logAction("Reutilização de pergunta do banco", `${q.codigo} inserida em nova campanha`);
  });
}

/* ======================= NOVA CAMPANHA — SUBMIT (criar ou editar) ======================= */
document.getElementById('formCampanha').addEventListener('submit', async function(e){
  e.preventDefault();
  const f = new FormData(this);
  const questoes = collectQuestionsFromForm();
  const payload = {
    nome: f.get('nome') || "Nova campanha PPG",
    descricao: f.get('descricao') || "",
    objetivo: f.get('objetivo') || "",
    inicio: f.get('inicio'),
    fim: f.get('fim'),
    qtdGanhadores: Number(f.get('qtdGanhadores')) || 4,
    premio: f.get('premio') || "",
    criterios: f.get('criterios') || "Nenhum critério adicional definido.",
    status: f.get('status') || "programada",
    questoes: questoes.length ? questoes : [{texto:"Pergunta de exemplo", type:"unica", options:[opt("Sim",true),opt("Não")]}]
  };
  const btnSubmit = document.getElementById('btnSubmitCampanha');
  const textoOriginal = btnSubmit.textContent;
  btnSubmit.disabled = true; btnSubmit.textContent = "Salvando...";

  if(editingCampaignId){
    const idx = campaigns.findIndex(c=>c.id===editingCampaignId);
    const campanhaCompleta = {...(idx>-1 ? campaigns[idx] : {}), ...payload, id: editingCampaignId};
    const resp = await backendCall('salvarCampanha', {campanha: campanhaCompleta, usuario: currentUser.nome});
    btnSubmit.disabled = false; btnSubmit.textContent = textoOriginal;
    if(!resp.ok){ showToast(resp.erro || "Não foi possível salvar a campanha.", "warning"); return; }
    if(idx > -1) campaigns[idx] = campanhaCompleta;
    showToast("Campanha atualizada com sucesso!","success");
    logAction("Campanha editada", payload.nome);
    editingCampaignId = null;
    btnSubmit.textContent = "Cadastrar campanha";
    document.getElementById('btnCancelEdit').style.display = "none";
    document.getElementById('novaTitle').textContent = "Nova Campanha";
  } else {
    const resp = await backendCall('salvarCampanha', {campanha: {ganhadores:null, ...payload}, usuario: currentUser.nome});
    btnSubmit.disabled = false; btnSubmit.textContent = textoOriginal;
    if(!resp.ok){ showToast(resp.erro || "Não foi possível salvar a campanha.", "warning"); return; }
    campaigns.unshift({id: resp.id, ganhadores:null, ...payload});
    showToast("Campanha e questionário cadastrados com sucesso!","success");
    logAction("Nova campanha cadastrada", payload.nome);
  }
  fillCampaignSelects();
  renderCampaignGrid();
  this.reset();
  document.getElementById('questionList').innerHTML = ""; questionCounter = 0;
  createQuestionCard(); createQuestionCard();
  document.querySelector('[data-target="campanhas"]').click();
});

window.loadCampaignForEdit = function(id){
  const c = campaigns.find(x=>x.id===id);
  if(!c) return;
  editingCampaignId = id;
  const form = document.getElementById('formCampanha');
  form.nome.value = c.nome; form.descricao.value = c.descricao || ""; form.objetivo.value = c.objetivo || "";
  form.inicio.value = c.inicio; form.fim.value = c.fim;
  form.qtdGanhadores.value = c.qtdGanhadores; form.status.value = c.status;
  form.premio.value = c.premio || ""; form.criterios.value = c.criterios || "";
  document.getElementById('questionList').innerHTML = ""; questionCounter = 0;
  (c.questoes||[]).forEach(q=> createQuestionCard(q));
  document.getElementById('btnSubmitCampanha').textContent = "Salvar alterações";
  document.getElementById('btnCancelEdit').style.display = "inline-flex";
  document.getElementById('novaTitle').textContent = "Editar Campanha";
  document.querySelector('[data-target="nova"]').click();
  showToast("Editando campanha — altere os campos e clique em Salvar alterações.","");
};
document.getElementById('btnCancelEdit').addEventListener('click', ()=>{
  editingCampaignId = null;
  document.getElementById('formCampanha').reset();
  document.getElementById('questionList').innerHTML = ""; questionCounter = 0;
  createQuestionCard(); createQuestionCard();
  document.getElementById('btnSubmitCampanha').textContent = "Cadastrar campanha";
  document.getElementById('btnCancelEdit').style.display = "none";
  document.getElementById('novaTitle').textContent = "Nova Campanha";
});

/* ======================= BANCO DE PERGUNTAS (Qualidade) ======================= */
function renderBanco(){
  const tbody = document.getElementById('bqTableBody');
  if(!tbody) return;
  tbody.innerHTML = questionBank.map(q=>{
    const u = bqUsageStatus(q);
    return `<tr>
      <td>${q.codigo}</td><td>${q.categoria}</td><td>${q.tema}</td><td>${q.procedimento||'—'}</td>
      <td>${q.qtdUtilizacoes}x</td>
      <td><span class="bq-badge ${u.cls}">${u.label}</span></td>
      <td><span class="badge ${q.status==='ativa'?'finalizada':'excluido'}">${q.status==='ativa'?'Ativa':'Inativa'}</span></td>
      <td style="display:flex; gap:6px;">
        <button class="btn btn-outline btn-sm" onclick="editBQ('${q.codigo}')">Editar</button>
        <button class="btn btn-outline btn-sm" onclick="deleteBQ('${q.codigo}')">Excluir</button>
      </td>
    </tr>`;
  }).join('') || `<tr><td colspan="8" style="text-align:center; color:var(--ink-soft); padding:20px;">Nenhuma pergunta cadastrada no banco.</td></tr>`;
  fillBQPicker();
}
function bqRenderOptions(type, options){
  const wrap = document.getElementById('bqOptionsWrap');
  if(!wrap) return;
  options = options || (type==='vf' ? [{text:"Verdadeiro",correct:true},{text:"Falso",correct:false}] : [{text:"",correct:false},{text:"",correct:false},{text:"",correct:false},{text:"",correct:false}]);
  if(type==='vf'){
    wrap.innerHTML = `
      <div class="opt-row"><input type="radio" name="bq-vf" class="bq-correct-vf" value="0" ${options[0] && options[0].correct?'checked':''}><span style="font-size:13px;">Verdadeiro</span></div>
      <div class="opt-row"><input type="radio" name="bq-vf" class="bq-correct-vf" value="1" ${!(options[0] && options[0].correct)?'checked':''}><span style="font-size:13px;">Falso</span></div>`;
  } else {
    const inputType = type==='multiplas_respostas' ? 'checkbox' : 'radio';
    const nameAttr = inputType==='radio' ? 'name="bq-radio"' : '';
    wrap.innerHTML = options.map((o,i)=>`<div class="opt-row"><input type="${inputType}" ${nameAttr} class="bq-correct" ${o.correct?'checked':''}><input type="text" class="bq-opt-text" placeholder="Alternativa ${i+1}" value="${(o.text||'').replace(/"/g,'&quot;')}"></div>`).join('');
  }
}
window.renderBQOptionInputs = function(type){ bqRenderOptions(type, null); };
function collectBQOptions(){
  const type = document.getElementById('bqTipo').value;
  if(type==='vf'){
    const checked = document.querySelector('.bq-correct-vf:checked');
    const isTrue = checked ? checked.value==="0" : true;
    return [opt("Verdadeiro", isTrue), opt("Falso", !isTrue)];
  }
  const rows = document.querySelectorAll('#bqOptionsWrap .opt-row');
  return Array.from(rows).map(r=>opt(r.querySelector('.bq-opt-text').value||"", r.querySelector('.bq-correct').checked)).filter(o=>o.text.trim()!=="");
}
const bqForm = document.getElementById('bqForm');
if(bqForm){
  bqRenderOptions('unica', null);
  bqForm.addEventListener('submit', async function(e){
    e.preventDefault();
    const options = collectBQOptions();
    const payload = {
      categoria: document.getElementById('bqCategoria').value || "Geral",
      tema: document.getElementById('bqTema').value || "",
      procedimento: document.getElementById('bqProcedimento').value || "",
      texto: document.getElementById('bqTexto').value || "Pergunta sem enunciado",
      type: document.getElementById('bqTipo').value,
      options: options.length ? options : [opt("Sim",true),opt("Não")],
      status: document.getElementById('bqStatus').value
    };
    const btn = this.querySelector('button[type="submit"]');
    const textoOriginal = btn ? btn.textContent : null;
    if(btn){ btn.disabled = true; btn.textContent = "Salvando..."; }

    if(editingBQCodigo){
      const idx = questionBank.findIndex(q=>q.codigo===editingBQCodigo);
      const perguntaCompleta = {...(idx>-1 ? questionBank[idx] : {}), ...payload, codigo: editingBQCodigo};
      const resp = await backendCall('salvarPergunta', {pergunta: perguntaCompleta});
      if(btn){ btn.disabled = false; btn.textContent = textoOriginal; }
      if(!resp.ok){ showToast(resp.erro || "Não foi possível salvar a pergunta.", "warning"); return; }
      if(idx>-1) questionBank[idx] = perguntaCompleta;
      logAction("Edição de pergunta", `${editingBQCodigo} — ${payload.texto.slice(0,40)}`);
      showToast("Pergunta atualizada.","success");
    } else {
      const resp = await backendCall('salvarPergunta', {pergunta: {autor: currentUser.nome, dataCriacao:new Date(), ultimaUtilizacao:null, qtdUtilizacoes:0, ...payload}});
      if(btn){ btn.disabled = false; btn.textContent = textoOriginal; }
      if(!resp.ok){ showToast(resp.erro || "Não foi possível salvar a pergunta.", "warning"); return; }
      questionBank.push({codigo: resp.codigo, autor: currentUser.nome, dataCriacao:new Date(), ultimaUtilizacao:null, qtdUtilizacoes:0, ...payload});
      logAction("Nova pergunta cadastrada", `${resp.codigo} — ${payload.texto.slice(0,40)}`);
      showToast("Pergunta cadastrada no banco.","success");
    }
    editingBQCodigo = null;
    this.reset();
    document.getElementById('bqCodigo').value = "";
    bqRenderOptions('unica', null);
    renderBanco();
  });
  document.getElementById('btnResetBQ').addEventListener('click', ()=>{
    editingBQCodigo = null;
    bqForm.reset();
    document.getElementById('bqCodigo').value = "";
    bqRenderOptions('unica', null);
  });
  document.getElementById('bqImportFile').addEventListener('change', function(e){
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = function(evt){
      try{
        const data = new Uint8Array(evt.target.result);
        const wb = XLSX.read(data, {type:'array'});
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, {defval:""});
        let count = 0;
        rows.forEach(r=>{
          const opts = [1,2,3,4].map(i=>r['opcao'+i]).filter(v=>v!=="").map((t,i)=>opt(String(t), String(r.correta||"").split(',').map(s=>s.trim()).includes(String(i+1))));
          questionBank.push({
            codigo: r.codigo ? String(r.codigo) : ("BQ-"+String(questionBank.length+1).padStart(3,'0')),
            categoria: r.categoria || "Importada", tema: r.tema || "", procedimento: r.procedimento || "",
            texto: r.texto || r.pergunta || "Pergunta importada",
            type: r.tipo || "unica", options: opts.length ? opts : [opt("Sim",true),opt("Não")],
            autor: currentUser.nome, dataCriacao:new Date(), ultimaUtilizacao:null, qtdUtilizacoes:0, status:"ativa"
          });
          count++;
        });
        renderBanco();
        logAction("Importação de perguntas", `${count} pergunta(s) via ${file.name}`);
        showToast(`${count} pergunta(s) importada(s) com sucesso.`,"success");
      }catch(err){
        showToast("Não foi possível importar o arquivo. Verifique se é .xlsx ou .csv com as colunas esperadas.","warning");
      }
      e.target.value = "";
    };
    reader.readAsArrayBuffer(file);
  });
}
window.editBQ = function(codigo){
  const q = questionBank.find(x=>x.codigo===codigo);
  if(!q) return;
  editingBQCodigo = codigo;
  document.getElementById('bqCodigo').value = q.codigo;
  document.getElementById('bqCategoria').value = q.categoria;
  document.getElementById('bqTema').value = q.tema;
  document.getElementById('bqProcedimento').value = q.procedimento || "";
  document.getElementById('bqTexto').value = q.texto;
  document.getElementById('bqTipo').value = q.type;
  document.getElementById('bqStatus').value = q.status;
  bqRenderOptions(q.type, q.options);
  document.getElementById('bqForm').scrollIntoView({behavior:'smooth', block:'start'});
};
window.deleteBQ = async function(codigo){
  const resp = await backendCall('excluirPergunta', {codigo});
  if(!resp.ok){ showToast(resp.erro || "Não foi possível excluir a pergunta.", "warning"); return; }
  questionBank = questionBank.filter(q=>q.codigo!==codigo);
  logAction("Exclusão de pergunta", codigo);
  renderBanco();
  showToast("Pergunta removida do banco.","");
};

/* ======================= RESPONDER QUESTIONÁRIO — ESTILO DUOLINGO ======================= */
window.openQuiz = async function(campaignId){
  const c = campaigns.find(x=>x.id===campaignId);
  document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
  document.getElementById('sec-responder').classList.add('active');
  document.getElementById('pageTitle').textContent = "Questionário";
  document.getElementById('responderTitle').textContent = c.nome;
  document.getElementById('responderSubtitle').textContent = "";
  const body = document.getElementById('responderBody');

  let existing = participants.find(p=>p.campaignId===campaignId && p.matricula===currentUser.matricula);
  if(!existing){
    // checagem fresca no servidor — cobre o caso raro de ter respondido em
    // outro dispositivo nos últimos segundos, antes do próximo ciclo de sincronização
    body.innerHTML = `<div class="duo-done"><span class="mascot-figure mascot-figure-emoji">${MASCOT_SVG}</span><h2>Carregando...</h2></div>`;
    const check = await backendCall('jaRespondeu', {campaignId, matricula: currentUser.matricula});
    if(check.ok && check.jaRespondeu){
      body.innerHTML = `<div class="duo-done"><span class="mascot-figure mascot-figure-emoji">🔒</span><h2>Você já respondeu esta campanha</h2><p>O registro já existe — feito neste ou em outro dispositivo.</p></div>`;
      return;
    }
  }
  document.getElementById('responderSubtitle').textContent = existing ? "" : c.descricao;
  if(existing){
    renderQuizDoneInto(body, c, existing);
  } else {
    startQuizFlow(c);
  }
};
document.getElementById('btnVoltarCampanhas').addEventListener('click', ()=>{
  const target = currentRole === 'qualidade' ? 'campanhas' : 'campanha-atual';
  document.querySelectorAll('.menu-item').forEach(b=>b.classList.remove('active'));
  const btn = document.querySelector(`[data-target="${target}"]`); if(btn) btn.classList.add('active');
  goToSection(target);
});

function startQuizFlow(c){
  const access = campaignAccessStatus(c);
  const body = document.getElementById('responderBody');
  if(access !== 'aberta'){
    body.innerHTML = mascotBubble(access==='nao_iniciada' ? "Ainda não é hoje! Essa campanha abre em breve." : "Essa campanha já encerrou — mas fica de olho na próxima!") +
      `<div class="lock-banner">
      <div style="font-size:26px;">⏳</div>
      <div>${access==='nao_iniciada' ? 'Esta campanha ainda não está aberta para respostas.' : 'O prazo para responder esta campanha já foi encerrado.'}</div>
      <div class="hint">Período: ${c.inicio.replace('T',' ')} até ${c.fim.replace('T',' ')}</div>
    </div>`;
    return;
  }
  // Limite de participação: 1 resposta por matrícula (regra 12)
  const already = participants.find(p=>p.campaignId===c.id && p.matricula===currentUser.matricula);
  if(already){
    showToast("Sua participação nesta campanha já foi registrada.", "warning");
    renderQuizDoneInto(body, c, already);
    return;
  }
  quizState = {campaign:c, index:0, answers:new Array(c.questoes.length).fill(null), dataInicio:new Date(), sessaoId:gerarSessaoId()};
  renderQuizStep();
}

function renderQuizStep(){
  const {campaign, index, answers} = quizState;
  const q = campaign.questoes[index];
  const total = campaign.questoes.length;
  const progressPct = Math.round((index / total) * 100);
  const body = document.getElementById('responderBody');
  const selected = answers[index];
  body.innerHTML = `
    <div class="duo-wrap">
      <div class="duo-progress"><div class="duo-progress-fill" style="width:${progressPct}%"></div></div>
      <div class="duo-counter">Pergunta ${index+1} de ${total}</div>
      <div class="duo-card" id="duoCard">
        <div class="duo-question">${q.texto}</div>
        <div class="duo-options">
          ${q.options.map((o,oi)=>{
            const isSel = Array.isArray(selected) ? selected.includes(oi) : selected === oi;
            return `<button type="button" class="duo-option ${isSel?'selected':''}" data-oi="${oi}">${o.text}</button>`;
          }).join('')}
        </div>
      </div>
      <div class="duo-nav">
        <button class="btn btn-outline" id="duoBack" ${index===0?'disabled':''}>← Voltar</button>
        <button class="btn btn-primary" id="duoContinue">${index===total-1?'Finalizar':'Continuar'}</button>
      </div>
      <p class="hint" style="text-align:center; margin-top:14px;">Você poderá enviar apenas uma resposta para esta campanha, vinculada à sua matrícula.</p>
    </div>`;

  body.querySelectorAll('.duo-option').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const oi = Number(btn.dataset.oi);
      if(q.type === 'multiplas_respostas'){
        let arr = Array.isArray(answers[index]) ? [...answers[index]] : [];
        if(arr.includes(oi)) arr = arr.filter(x=>x!==oi); else arr.push(oi);
        answers[index] = arr;
      } else {
        answers[index] = oi;
      }
      renderQuizStep();
    });
  });
  document.getElementById('duoBack').addEventListener('click', ()=>{
    quizState.index = Math.max(0, index-1);
    renderQuizStep();
  });
  const contBtn = document.getElementById('duoContinue');
  const hasAnswer = Array.isArray(selected) ? selected.length>0 : (selected !== null && selected !== undefined);
  contBtn.disabled = !hasAnswer;
  contBtn.addEventListener('click', ()=>{
    if(index < total-1){ quizState.index++; renderQuizStep(); }
    else { finalizeQuiz(); }
  });
}

function isCorrect(q, ans){
  if(q.type === 'multiplas_respostas'){
    const correctSet = new Set(q.options.map((o,i)=>o.correct?i:null).filter(x=>x!==null));
    const ansSet = new Set(ans||[]);
    if(correctSet.size !== ansSet.size) return false;
    for(const i of correctSet) if(!ansSet.has(i)) return false;
    return true;
  }
  if(ans===undefined || ans===null) return false;
  return !!(q.options[ans] && q.options[ans].correct);
}

async function finalizeQuiz(){
  const {campaign, answers, dataInicio, sessaoId} = quizState;
  const respostasCorretas = campaign.questoes.map((q,i)=> isCorrect(q, answers[i]));
  const correctCount = respostasCorretas.filter(Boolean).length;
  const pct = Math.round(correctCount / campaign.questoes.length * 100);
  const dataFim = new Date();
  const novoParticipante = {
    campaignId: campaign.id, nome: currentUser.nome, matricula: currentUser.matricula,
    cpf: EMPRESA.cpfFicticio(currentUser.matricula),
    setor: currentUser.setor, filial: currentUser.filial, funcao: currentUser.funcao, cargo: currentUser.cargo,
    data: dataFim, dataInicio: dataInicio || dataFim, dataFim, pct, respostasCorretas,
    respostasSelecionadas: answers, acertosQtd: correctCount, totalQuestoes: campaign.questoes.length,
    codigoResposta: gerarCodigoResposta(dataFim), sessaoId: sessaoId || gerarSessaoId(), dispositivo: dispositivoReal()
  };

  const container = document.getElementById('responderBody');
  container.innerHTML = `<div class="duo-done"><span class="mascot-figure mascot-figure-emoji">${MASCOT_SVG}</span><h2>Enviando sua resposta...</h2><p>Só um instante, isso é registrado direto no servidor.</p></div>`;

  const resp = await backendCall('submeterResposta', {resposta: novoParticipante});

  if(!resp.ok){
    if(resp.jaRespondida){
      container.innerHTML = `
        <div class="duo-done">
          <span class="mascot-figure mascot-figure-emoji">🔒</span>
          <h2>Você já respondeu esta campanha</h2>
          <p>Encontramos um registro seu para <b>${campaign.nome}</b> — feito neste ou em outro dispositivo. Cada matrícula só pode responder uma vez, para manter tudo justo.</p>
        </div>`;
    } else {
      container.innerHTML = `
        <div class="duo-done">
          <span class="mascot-figure mascot-figure-emoji">⚠️</span>
          <h2>Não foi possível enviar sua resposta</h2>
          <p>${resp.erro || 'Verifique sua internet e tente novamente.'}</p>
          <button class="btn btn-primary" onclick="openQuiz('${campaign.id}')" style="margin-top:12px;">Tentar novamente</button>
        </div>`;
    }
    quizState = null;
    return;
  }

  participants.push(novoParticipante);
  logAction("Resposta registrada", `${novoParticipante.codigoResposta} — ${campaign.nome} — ${novoParticipante.nome}`);
  fillCampaignSelects();
  renderDashboard(); renderParticipantsTable(); renderEligibleTable(); renderSorteioSetup();
  renderQuizDoneInto(container, campaign, novoParticipante);
  saveState();
  quizState = null;
}

/* Univaldo, o mascote oficial da Univale Transportes — representado por emoji,
   sempre com as animações (respirar, balançar, "piscar") aplicadas via CSS. */
const MASCOT_EMOJI = "🎯";
/* Versão em SVG (Twemoji oficial) do mascote — nítida em qualquer aparelho,
   sem depender da fonte de emoji do sistema operacional (que varia e pode
   ficar com baixa qualidade em alguns dispositivos). */
const MASCOT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" width="100%" height="100%"><circle fill="#DD2E44" cx="18" cy="18" r="18"/><circle fill="#FFF" cx="18" cy="18" r="13.5"/><circle fill="#DD2E44" cx="18" cy="18" r="10"/><circle fill="#FFF" cx="18" cy="18" r="6"/><circle fill="#DD2E44" cx="18" cy="18" r="3"/><path opacity=".2" d="M18.24 18.282l13.144 11.754s-2.647 3.376-7.89 5.109L17.579 18.42l.661-.138z"/><path fill="#FFAC33" d="M18.294 19c-.255 0-.509-.097-.704-.292-.389-.389-.389-1.018 0-1.407l.563-.563c.389-.389 1.018-.389 1.408 0 .388.389.388 1.018 0 1.407l-.564.563c-.194.195-.448.292-.703.292z"/><path fill="#55ACEE" d="M24.016 6.981c-.403 2.079 0 4.691 0 4.691l7.054-7.388c.291-1.454-.528-3.932-1.718-4.238-1.19-.306-4.079.803-5.336 6.935zm5.003 5.003c-2.079.403-4.691 0-4.691 0l7.388-7.054c1.454-.291 3.932.528 4.238 1.718.306 1.19-.803 4.079-6.935 5.336z"/><path fill="#3A87C2" d="M32.798 4.485L21.176 17.587c-.362.362-1.673.882-2.51.046-.836-.836-.419-2.08-.057-2.443L31.815 3.501s.676-.635 1.159-.152-.176 1.136-.176 1.136z"/></svg>`;
const MASCOT_NOME = "Univaldo";
function mascotBubble(texto, opts){
  const pro = opts && opts.pro;
  const conteudo = (opts && opts.emoji) ? opts.emoji : MASCOT_SVG;
  return `<div class="mascot-row ${pro ? 'mascot-pro' : ''}">
    <div class="mascot-avatar">
      <span class="mascot-emoji mascot-emoji-blink">${conteudo}</span>
    </div>
    <div class="mascot-speech"><span class="mascot-name">${MASCOT_NOME}</span>${texto}</div>
  </div>`;
}
function renderQualidadeTip(){
  const el = document.getElementById('qualidadeTip');
  if(!el) return;
  const dicas = [];
  const encerrandoEm3Dias = campaigns.filter(c=>{
    if(c.status !== 'andamento') return false;
    const dias = (new Date(c.fim) - new Date()) / (1000*60*60*24);
    return dias > 0 && dias <= 3;
  });
  const finalizadasSemSorteio = campaigns.filter(c=>c.status==='encerrada' && !c.ganhadores);
  const total100 = campaigns.reduce((a,c)=> a + evaluateEligibility(c.id).eligible.length, 0);

  if(finalizadasSemSorteio.length){
    dicas.push(`${finalizadasSemSorteio.length} campanha(s) encerrada(s) já podem ter o sorteio executado — dá uma olhada em "Sorteio".`);
  }
  if(encerrandoEm3Dias.length){
    dicas.push(`${encerrandoEm3Dias.length} campanha(s) encerram nos próximos 3 dias — bom momento para divulgar de novo o link.`);
  }
  dicas.push(`Hoje há ${total100} colaborador(es) com 100% de acertos somando todas as campanhas.`);

  el.innerHTML = mascotBubble(dicas[0], {pro:true});
}

function confettiHTML(){
  const emojis = ["🎉","🎊","⭐","✨","🏆"];
  let spans = "";
  for(let i=0;i<14;i++){
    const left = Math.round(Math.random()*100);
    const delay = (Math.random()*0.6).toFixed(2);
    const size = 14 + Math.round(Math.random()*10);
    spans += `<span style="left:${left}%; animation-delay:${delay}s; font-size:${size}px;">${randomFrom(emojis)}</span>`;
  }
  return `<div class="duo-confetti">${spans}</div>`;
}

/* Tela final — exatamente o que o colaborador deve ver, nada de gabarito ou
   detalhamento de acertos/erros por pergunta (isso fica exclusivo da Qualidade). */
function renderQuizDoneInto(container, c, participant){
  const roundClosed = campaignAccessStatus(c) !== 'aberta';

  if(!roundClosed){
    /* Rodada ainda aberta: o colaborador só sabe que a resposta foi registrada.
       Nada de nota, acertos ou confete — isso só é revelado após o encerramento. */
    container.innerHTML = `
      <div class="duo-done">
        <span class="mascot-figure mascot-figure-emoji">${MASCOT_SVG}</span>
        <h2>Resposta registrada!</h2>
        <p>Sua participação em <b>${c.nome}</b> foi registrada com sucesso.</p>
        <p class="hint">Por transparência com todos os participantes, o resultado só é liberado depois que a rodada encerrar, em <b>${fmtDateTime(new Date(c.fim))}</b>. Volte aqui depois desse prazo para ver seu desempenho.</p>
      </div>
      ${mascotBubble("Sua resposta está registrada e segura. Assim que a rodada encerrar, você vê aqui quantas você acertou. Até lá! 🤝")}`;
    return;
  }

  const correctCount = participant.respostasCorretas ? participant.respostasCorretas.filter(Boolean).length : Math.round(participant.pct/100*c.questoes.length);
  const perfeito = participant.pct === 100;
  const mascotEmoji = perfeito ? "🎉" : MASCOT_EMOJI;
  const mascotMsg = perfeito
    ? "Mandou muito bem! 100% de acertos — boa sorte no sorteio! 🍀"
    : "Valeu por participar! Continue de olho nas próximas campanhas. 💪";
  container.innerHTML = `
    <div class="duo-done">
      ${perfeito ? confettiHTML() : ''}
      <span class="mascot-figure mascot-figure-emoji">${mascotEmoji}</span>
      <h2>Obrigado por participar!</h2>
      <p>Sua participação foi registrada com sucesso.</p>
      <div class="duo-score">Você acertou <b>${correctCount} de ${c.questoes.length}</b> perguntas.</div>
      <p class="hint">Boa sorte no sorteio!</p>
    </div>
    ${mascotBubble(mascotMsg)}`;
}

function renderRegulamentoStats(){
  const el = document.getElementById('regulamentoStats');
  if(!el) return;
  const totalCampanhas = campaigns.length;
  const totalPremiados = new Set(wonHistory.map(w=>w.matricula)).size;
  const allParts = participants;
  const media = allParts.length ? Math.round(allParts.reduce((a,p)=>a+p.pct,0)/allParts.length) : 0;
  const totalElegiveisHoje = campaigns.reduce((a,c)=> a + evaluateEligibility(c.id).eligible.length, 0);
  el.innerHTML = `<div class="transp-stats">
    <div class="transp-stat"><b>${totalCampanhas}</b><span>Campanhas realizadas</span></div>
    <div class="transp-stat"><b>${totalPremiados}</b><span>Colaboradores já premiados</span></div>
    <div class="transp-stat"><b>${media}%</b><span>Média geral de acertos</span></div>
    <div class="transp-stat"><b>${totalElegiveisHoje}</b><span>Elegíveis somando as rodadas</span></div>
  </div>`;
}

/* ======================= PÁGINAS DO COLABORADOR ======================= */
function colaboradorStreakStrip(){
  const mine = participants.filter(p=>p.matricula===currentUser.matricula);
  const total = mine.length;
  const media = total ? Math.round(mine.reduce((a,p)=>a+p.pct,0)/total) : 0;
  const premios = campaigns.filter(c=>c.ganhadores && c.ganhadores.some(w=>w.matricula===currentUser.matricula)).length;
  return `<div class="streak-strip">
    <div class="streak-chip fire"><div class="si"><i data-lucide="flame"></i></div><div><b>${total}</b><span>Campanhas respondidas</span></div></div>
    <div class="streak-chip star"><div class="si">⭐</div><div><b>${media}%</b><span>Média de acertos</span></div></div>
    <div class="streak-chip trophy"><div class="si">🏆</div><div><b>${premios}</b><span>Vezes premiado(a)</span></div></div>
  </div>`;
}
function renderCampanhaAtual(){
  const body = document.getElementById('campanhaAtualBody');
  if(!body) return;
  const open = campaigns.filter(c=>campaignAccessStatus(c)==='aberta');
  let html = mascotBubble(`Oi, ${currentUser.nome.split(' ')[0]}! ${open.length ? 'Tem campanha nova esperando por você aqui embaixo 👇' : 'Nenhuma campanha aberta agora, mas fica de olho — aviso assim que abrir uma nova!'}`);
  html += colaboradorStreakStrip();
  if(!open.length){
    html += `<div class="panel fun-empty">
      <div class="fe-icon"><i data-lucide="clock"></i></div>
      <h3>Nenhuma campanha em andamento</h3>
      <p class="hint">Assim que uma nova campanha do PPG for aberta, ela aparecerá aqui.</p>
    </div>`;
    body.innerHTML = html;
    return;
  }
  html += open.map(c=>{
    const answered = participants.some(p=>p.campaignId===c.id && p.matricula===currentUser.matricula);
    return `<div class="panel">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px; flex-wrap:wrap;">
        <div><h3>${c.nome}</h3><p class="hint" style="margin-top:6px; max-width:480px;">${c.descricao}</p></div>
        ${statusBadge(c.status)}
      </div>
      <div class="meta" style="margin:14px 0;">
        <span><i data-lucide="calendar"></i> Responda até ${c.fim.replace('T',' ')}</span>
        <span>🎁 Prêmio: ${c.premio || 'a definir'}</span>
      </div>
      ${answered
        ? `<button class="btn btn-ghost" onclick="openQuiz('${c.id}')">Ver meu resultado</button>`
        : `<button class="btn btn-primary" onclick="openQuiz('${c.id}')"><i data-lucide="rocket"></i> Responder agora</button>`}
    </div>`;
  }).join('');
  body.innerHTML = html;
}
function renderHistoricoColaborador(){
  const body = document.getElementById('historicoColabBody');
  if(!body) return;
  const mine = participants.filter(p=>p.matricula===currentUser.matricula).sort((a,b)=>b.data-a.data);
  let html = mascotBubble("Aqui está tudo que você já respondeu até agora. Bora conferir? 📋");
  html += mine.map(p=>{
    const c = campaigns.find(x=>x.id===p.campaignId);
    const roundClosed = c ? campaignAccessStatus(c) !== 'aberta' : true;
    const resultadoHtml = roundClosed
      ? `<span style="font-family:'Manrope'; font-weight:800; font-size:18px; color:var(--secondary);">${p.pct}%</span>`
      : `<span class="badge programada" title="O resultado é liberado após o encerramento da rodada">🔒 Aguardando encerramento</span>`;
    return `<div class="panel" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
      <div><h3 style="font-size:14.5px;">${c ? c.nome : p.campaignId}</h3><p class="hint" style="margin-top:4px;">Respondido em ${fmtDateTime(p.data)}</p></div>
      <div style="display:flex; align-items:center; gap:12px;">
        ${resultadoHtml}
        <button class="btn btn-outline btn-sm" onclick="openQuiz('${p.campaignId}')">Ver resultado</button>
      </div>
    </div>`;
  }).join('') || `<div class="panel fun-empty"><div class="fe-icon"><i data-lucide="inbox"></i></div>Você ainda não participou de nenhuma campanha.</div>`;
  body.innerHTML = html;
}
function renderMeuResultado(){
  const body = document.getElementById('meuResultadoBody');
  if(!body) return;
  const mine = participants.filter(p=>p.matricula===currentUser.matricula).sort((a,b)=>b.data-a.data);
  if(!mine.length){
    body.innerHTML = mascotBubble("Você ainda não respondeu nenhuma campanha — que tal começar agora?") +
      `<div class="panel fun-empty"><div class="fe-icon"><i data-lucide="hourglass"></i></div>Assim que você responder, seu resultado mais recente aparece aqui.</div>`;
    return;
  }
  const latest = mine[0];
  const c = campaigns.find(x=>x.id===latest.campaignId);
  renderQuizDoneInto(body, c, latest);

  const roundClosed = campaignAccessStatus(c) !== 'aberta';
  if(!roundClosed) return; // nada de elegibilidade enquanto a rodada não encerra — isso revelaria o desempenho

  /* Transparência total: o colaborador vê exatamente se está elegível ao
     sorteio e, se não estiver, o(s) motivo(s) exato(s) — os mesmos critérios
     aplicados a todo mundo, sem exceção. */
  const {eligible, excluded} = evaluateEligibility(latest.campaignId);
  const souElegivel = eligible.some(e=>e.matricula===currentUser.matricula);
  const meuExcluido = excluded.find(e=>e.matricula===currentUser.matricula);
  const elegHtml = souElegivel
    ? `<div class="panel eleg-panel eleg-ok">
        <h3>✅ Você está elegível para o sorteio desta rodada</h3>
        <p>Isso significa que você atingiu 100% de acertos, sua função não está entre as impedidas de participar e você não foi premiado(a) nos últimos 2 anos. Boa sorte! 🍀</p>
      </div>`
    : meuExcluido
      ? `<div class="panel eleg-panel eleg-excluded">
          <h3>🔒 Você não está elegível para o sorteio desta rodada</h3>
          <p><b>Motivo:</b> ${meuExcluido.motivo}</p>
          <p class="hint">A elegibilidade é calculada automaticamente pelo sistema, seguindo os mesmos 3 critérios oficiais para todos os colaboradores, sem exceção. Veja o detalhamento completo das regras abaixo.</p>
          <button class="btn btn-outline btn-sm" id="btnVerRegrasElegibilidade"><i data-lucide="scroll-text"></i> Ver regras completas</button>
        </div>`
      : '';
  body.insertAdjacentHTML('beforeend', elegHtml);
  const btnRegras = document.getElementById('btnVerRegrasElegibilidade');
  if(btnRegras) btnRegras.addEventListener('click', ()=> document.querySelector('[data-target="regulamento"]').click());
}

/* ======================= SORTEIO ======================= */
let sorteioRunning = false;
function renderSorteioSetup(){
  const sel = document.getElementById('selectCampanhaSorteio');
  if(!sel.value) return;
  const id = sel.value;
  const {eligible, excluded} = evaluateEligibility(id);
  document.getElementById('eligibleStrip').innerHTML = `<span style="font-size:12px; color:var(--ink-soft); margin-right:4px;">Elegíveis:</span>` +
    eligible.map(p=>`<span class="chip">${p.nome} · ${p.setor}</span>`).join('') +
    excluded.map(p=>`<span class="chip excluded" title="${p.motivo}">${p.nome}</span>`).join('');
  const setoresRepresentados = new Set(eligible.map(p=>p.setor)).size;
  const filiaisRepresentadas = new Set(eligible.map(p=>p.filial)).size;
  document.getElementById('sorteioStats').innerHTML = `
    <div class="stat"><b>${eligible.length}</b><span>Total de elegíveis</span></div>
    <div class="stat"><b>${excluded.length}</b><span>Excluídos por regra</span></div>
    <div class="stat"><b>${setoresRepresentados}</b><span>Setores representados</span></div>
    <div class="stat"><b>${filiaisRepresentadas}</b><span>Filiais representadas</span></div>`;
  document.getElementById('randomSeedWrap').style.display = "none";
  document.getElementById('justificationBox').style.display = "none";
  buildEmptySlots(id);
}
document.getElementById('selectCampanhaSorteio').addEventListener('change', renderSorteioSetup);
function buildEmptySlots(campaignId){
  const c = campaigns.find(x=>x.id===campaignId);
  const n = (c && c.qtdGanhadores) || 4;
  const slotsEl = document.getElementById('slots');
  slotsEl.innerHTML = "";
  for(let i=0;i<n;i++) slotsEl.innerHTML += `<div class="slot" id="slot${i}"><div class="pos">${i+1}º LUGAR</div><div class="name">—</div><div class="info">aguardando sorteio</div></div>`;
  document.getElementById('sorteioResultActions').style.display = "none";
}
function pickFairWinners(pool, need){
  const shuffled = [...pool].sort(()=>Math.random()-0.5);
  const winners = []; const usedSetores = new Set(), usedFiliais = new Set();
  for(const p of shuffled){ if(winners.length>=need) break; if(!usedSetores.has(p.setor) || !usedFiliais.has(p.filial)){ winners.push(p); usedSetores.add(p.setor); usedFiliais.add(p.filial); } }
  for(const p of shuffled){ if(winners.length>=need) break; if(!winners.includes(p)) winners.push(p); }
  const distinctSetores = new Set(winners.map(w=>w.setor)).size;
  const fair = distinctSetores === Math.min(need, new Set(pool.map(p=>p.setor)).size);
  return {winners, fair, distinctSetores};
}
document.getElementById('btnSortear').addEventListener('click', ()=>{
  if(sorteioRunning) return;
  const id = document.getElementById('selectCampanhaSorteio').value;
  const {eligible} = evaluateEligibility(id);
  const c = campaigns.find(x=>x.id===id);
  const need = (c && c.qtdGanhadores) || 4;
  if(eligible.length === 0){ showToast("Não há colaboradores elegíveis após aplicar as regras de elegibilidade.","warning"); return; }
  if(eligible.length < need) showToast(`Apenas ${eligible.length} elegível(is) disponível(is) para ${need} vagas — sorteando o possível.`,"warning");
  sorteioRunning = true;
  buildEmptySlots(id);
  const slotEls = Array.from(document.querySelectorAll('.slot'));
  slotEls.forEach(s=>s.classList.add('rolling'));
  const finalCount = Math.min(need, eligible.length);
  const {winners, fair, distinctSetores} = pickFairWinners(eligible, finalCount);
  const seed = Math.floor(100000000 + Math.random()*899999999).toString();
  let ticks = 0; const maxTicks = 22; const rollNames = eligible.map(p=>p.nome);
  const interval = setInterval(()=>{
    ticks++;
    slotEls.forEach((slotEl,i)=>{ if(i<finalCount){ slotEl.querySelector('.name').textContent = randomFrom(rollNames); } });
    if(ticks >= maxTicks){ clearInterval(interval); revealWinners(slotEls, winners, id, seed, fair, distinctSetores, eligible); }
  }, 80);
});
function revealWinners(slotEls, winners, campaignId, seed, fair, distinctSetores, eligible){
  winners.forEach((w,i)=>{
    setTimeout(()=>{
      const slotEl = slotEls[i];
      slotEl.classList.remove('rolling'); slotEl.classList.add('won');
      slotEl.querySelector('.name').textContent = w.nome;
      slotEl.querySelector('.info').textContent = `${w.matricula} · ${w.setor} · ${w.filial}`;
      if(i === winners.length-1){
        sorteioRunning = false;
        document.getElementById('sorteioResultActions').style.display = "flex";
        document.getElementById('randomSeedWrap').style.display = "block";
        document.getElementById('randomSeedValue').textContent = seed;
        const justBox = document.getElementById('justificationBox');
        if(!fair){
          justBox.style.display = "block";
          justBox.textContent = `⚠ Distribuição justa parcial: havia apenas ${distinctSetores || new Set(eligible.map(e=>e.setor)).size} setor(es) distinto(s) entre os elegíveis, portanto não foi possível garantir total diversidade. Justificativa registrada no histórico para auditoria.`;
        } else justBox.style.display = "none";
        window._lastSorteio = {campaignId, winners, seed, fair, distinctSetores, eligibleCount: eligible.length};
        showToast(`Sorteio concluído! ${winners.length} ganhador(es) selecionado(s).`,"success");
      }
    }, i*350);
  });
  for(let i=winners.length;i<slotEls.length;i++){ slotEls[i].classList.remove('rolling'); slotEls[i].querySelector('.info').textContent = "sem elegível disponível"; }
}
document.getElementById('btnResetSorteio').addEventListener('click', ()=>{ if(!sorteioRunning) renderSorteioSetup(); });
document.getElementById('btnValidarSorteio').addEventListener('click', ()=>{
  if(!window._lastSorteio){ showToast("Realize o sorteio antes de validar.","warning"); return; }
  window._lastSorteio.validado = true;
  showToast("Resultado validado por Mariana Queiroz (Qualidade). Resultado ainda provisório até ser registrado no histórico.","success");
  logAction("Sorteio validado (provisório)", "Resultado confirmado pela equipe da Qualidade — aguardando registro oficial.");
});
document.getElementById('btnRelatorioOficial').addEventListener('click', ()=>{
  if(!window._lastSorteio){ showToast("Realize o sorteio antes de gerar o relatório.","warning"); return; }
  const {campaignId, winners, seed} = window._lastSorteio;
  const c = campaigns.find(x=>x.id===campaignId);
  const headers = ["Posição","Nome","Matrícula","Setor","Filial"];
  const rows = winners.map((w,i)=>[i+1, w.nome, w.matricula, w.setor, w.filial]);
  openPrintReport(`Relatório oficial do sorteio — ${c.nome}`, headers, rows, `Número aleatório utilizado: ${seed} · Gerado em ${fmtDateTime(new Date())}`);
  logAction("Relatório oficial gerado", c.nome);
});
document.getElementById('btnRegistrarHistorico').addEventListener('click', async ()=>{
  if(!window._lastSorteio) return;
  if(!window._lastSorteio.validado){ showToast("Valide o resultado (botão 'Validar resultado') antes de registrar oficialmente.","warning"); return; }
  const {campaignId, winners, seed, fair, distinctSetores, eligibleCount} = window._lastSorteio;
  const c = campaigns.find(x=>x.id===campaignId);
  const campanhaAtualizada = {
    ...c,
    ganhadores: winners.map(w=>({nome:w.nome, matricula:w.matricula, setor:w.setor, filial:w.filial, funcao:w.funcao})),
    status: "finalizada", randomSeed: seed, responsavel: currentUser.nome,
    justificativa: fair ? `Distribuição justa alcançada entre ${distinctSetores} setor(es) distintos.` : `Distribuição parcial: apenas ${distinctSetores} setor(es) representado(s) entre os ${eligibleCount} elegíveis.`
  };
  const btn = document.getElementById('btnRegistrarHistorico');
  btn.disabled = true; btn.textContent = "Registrando...";
  const resp = await backendCall('salvarCampanha', {campanha: campanhaAtualizada, usuario: currentUser.nome});
  btn.disabled = false; btn.textContent = "Registrar no histórico";
  if(!resp.ok){ showToast(resp.erro || "Não foi possível registrar o sorteio.", "warning"); return; }
  Object.assign(c, campanhaAtualizada);
  winners.forEach(w=> wonHistory.push({matricula:w.matricula, data:new Date()}));
  historyLog.unshift({campaignId, data:new Date(), texto:`Sorteio realizado para a campanha ${c.nome}.`});
  logAction("Sorteio registrado no histórico", c.nome);
  fillCampaignSelects();
  showToast("Sorteio registrado oficialmente! Agora você já pode gerar o banner dos ganhadores em Divulgação.","success");
  window._lastSorteio = null;
  document.querySelector('[data-target="historico"]').click();
});

/* ======================= RELATÓRIOS (exportação real) ======================= */
function downloadCSV(filename, headers, rows){
  const escape = v => `"${String(v).replace(/"/g,'""')}"`;
  const csv = [headers.map(escape).join(';'), ...rows.map(r=>r.map(escape).join(';'))].join('\r\n');
  const blob = new Blob(["\uFEFF"+csv], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}
function buildBarChartSVG(labels, values, opts){
  opts = opts || {};
  const w = 580, h = 240, padTop = 30, padBottom = 50, padSide = 20;
  const innerH = h - padTop - padBottom;
  const max = Math.max(...values, 1);
  const n = values.length || 1;
  const gap = 14;
  const barW = Math.max(16, (w - padSide*2 - gap*(n-1)) / n);
  let bars = "";
  values.forEach((v,i)=>{
    const barH = Math.round((v/max) * innerH);
    const x = padSide + i*(barW+gap);
    const y = h - padBottom - barH;
    const label = String(labels[i]||'').length > 15 ? String(labels[i]).slice(0,14)+'…' : String(labels[i]||'');
    bars += `<rect x="${x.toFixed(1)}" y="${y}" width="${barW.toFixed(1)}" height="${barH}" fill="#02A39D" rx="5"/>`;
    bars += `<text x="${(x+barW/2).toFixed(1)}" y="${y-6}" font-size="11" text-anchor="middle" fill="#00695C" font-family="Arial">${v}${opts.suffix||''}</text>`;
    bars += `<text x="${(x+barW/2).toFixed(1)}" y="${h-padBottom+16}" font-size="9.5" text-anchor="middle" fill="#5B7370" font-family="Arial">${label}</text>`;
  });
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;">
    <line x1="${padSide}" y1="${h-padBottom}" x2="${w-padSide}" y2="${h-padBottom}" stroke="#E3ECEA"/>
    ${bars}
  </svg>`;
}
function openPrintReport(title, headers, rows, footNote, chartSvg){
  const win = window.open('', '_blank');
  if(!win){ showToast("O navegador bloqueou a abertura da janela de impressão.","warning"); return; }
  win.document.write(`
    <html><head><title>${title}</title>
    <style>
      body{font-family:Arial,sans-serif; padding:32px; color:#0F2A28;}
      h1{font-size:18px; color:#00695C; margin-bottom:4px;}
      p.meta{color:#5B7370; font-size:12px; margin-top:0;}
      table{width:100%; border-collapse:collapse; margin-top:18px;}
      th,td{border:1px solid #E3ECEA; padding:8px 10px; font-size:12px; text-align:left;}
      th{background:#F7F9FB; color:#5B7370; text-transform:uppercase; font-size:10px;}
      .chart-wrap{margin-top:16px; text-align:center;}
    </style></head><body>
    <h1>PPG · Programa Política de Gestão</h1>
    <p class="meta">${title} — gerado em ${fmtDateTime(new Date())}</p>
    ${chartSvg ? `<div class="chart-wrap">${chartSvg}</div>` : ''}
    <table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead>
    <tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>
    ${footNote ? `<p class="meta" style="margin-top:16px;">${footNote}</p>` : ''}
    </body></html>`);
  win.document.close();
  win.focus();
  setTimeout(()=> win.print(), 300);
}
function buildReportData(reportType, campaignId){
  const c = campaigns.find(x=>x.id===campaignId);
  if(reportType === 'participantes'){
    const rows = campaignParticipants(campaignId).map(p=>[p.nome,p.matricula,p.cargo,p.setor,p.filial,fmtDateTime(p.data),p.pct+"%"]);
    return {title:`Lista de participantes — ${c.nome}`, headers:["Nome","Matrícula","Cargo","Setor","Filial","Data/hora","% Acertos"], rows};
  }
  if(reportType === 'elegiveis'){
    const {eligible} = evaluateEligibility(campaignId);
    const rows = eligible.map((p,i)=>[i+1,p.nome,p.matricula,p.cargo,p.setor,p.filial,fmtDateTime(p.data)]);
    return {title:`Elegíveis ao sorteio — ${c.nome}`, headers:["#","Nome","Matrícula","Cargo","Setor","Filial","Data/hora"], rows};
  }
  if(reportType === 'ganhadores'){
    const rows = (c.ganhadores||[]).map((w,i)=>[i+1,w.nome,w.matricula,w.setor,w.filial,w.funcao]);
    return {title:`Ganhadores sorteados — ${c.nome}`, headers:["Posição","Nome","Matrícula","Setor","Filial","Função"], rows};
  }
  if(reportType === 'distribuicao'){
    const allWinners = campaigns.filter(x=>x.ganhadores).flatMap(x=>x.ganhadores);
    const rows = allWinners.map(w=>[w.nome,w.setor,w.filial,w.funcao]);
    const counts = {};
    allWinners.forEach(w=> counts[w.setor] = (counts[w.setor]||0)+1);
    const chartSvg = Object.keys(counts).length ? buildBarChartSVG(Object.keys(counts), Object.values(counts)) : null;
    return {title:`Distribuição de ganhadores por setor/filial/função — todas as campanhas`, headers:["Nome","Setor","Filial","Função"], rows, chartSvg};
  }
  if(reportType === 'auditoria'){
    const rows = [[c.nome, c.criterios||"—", c.randomSeed||"—", c.responsavel||"—", c.justificativa||"—"]];
    return {title:`Registro de auditoria do sorteio — ${c.nome}`, headers:["Campanha","Critérios aplicados","Nº aleatório","Responsável","Justificativa"], rows};
  }
  if(reportType === 'historico'){
    const rows = campaigns.filter(x=>x.ganhadores || x.status==='encerrada').map(x=>[x.nome, x.inicio.replace('T',' '), x.fim.replace('T',' '), campaignParticipants(x.id).length, x.ganhadores?x.ganhadores.length:0]);
    return {title:"Histórico completo de campanhas", headers:["Campanha","Início","Encerramento","Participantes","Ganhadores"], rows};
  }
  if(reportType === 'comparativo'){
    const rows = campaigns.map(x=>{
      const parts = campaignParticipants(x.id);
      const media = parts.length ? Math.round(parts.reduce((a,p)=>a+p.pct,0)/parts.length) : 0;
      const {eligible} = evaluateEligibility(x.id);
      return [x.nome, parts.length, eligible.length, media+"%", x.ganhadores?x.ganhadores.length:0, x.status];
    });
    const chartSvg = buildBarChartSVG(campaigns.map(x=>x.nome.split('–')[0].trim()), campaigns.map(x=>campaignParticipants(x.id).length), {suffix:' resp.'});
    return {title:"Comparativo entre campanhas", headers:["Campanha","Participantes","Elegíveis","Média de acertos","Ganhadores","Status"], rows, chartSvg};
  }
  if(reportType === 'evolucao'){
    const ordered = [...campaigns].sort((a,b)=> new Date(a.inicio) - new Date(b.inicio));
    const rows = ordered.map(x=>{
      const parts = campaignParticipants(x.id);
      const media = parts.length ? Math.round(parts.reduce((a,p)=>a+p.pct,0)/parts.length) : 0;
      return [x.inicio.replace('T',' '), x.nome, parts.length, media+"%"];
    });
    const chartSvg = buildBarChartSVG(ordered.map(x=>x.nome.split('–')[0].trim()), ordered.map(x=>{
      const parts = campaignParticipants(x.id);
      return parts.length ? Math.round(parts.reduce((a,p)=>a+p.pct,0)/parts.length) : 0;
    }), {suffix:'%'});
    return {title:"Evolução histórica — média de acertos por campanha ao longo do tempo", headers:["Início","Campanha","Participantes","Média de acertos"], rows, chartSvg};
  }
}
document.querySelectorAll('.report-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const campaignId = document.getElementById('selectCampanhaRelatorio').value;
    const data = buildReportData(btn.dataset.report, campaignId);
    if(!data.rows.length){ showToast("Não há dados para exportar neste relatório.","warning"); return; }
    if(btn.dataset.type === "Excel"){
      downloadCSV(data.title.replace(/[^\w]+/g,'_') + ".csv", data.headers, data.rows);
      showToast("Arquivo .csv baixado (compatível com Excel).","success");
    } else {
      openPrintReport(data.title, data.headers, data.rows, null, data.chartSvg);
      showToast("Abrindo visualização para impressão/PDF.","success");
    }
    logAction("Relatório exportado", `${btn.dataset.report} (${btn.dataset.type})`);
  });
});

/* ======================= HISTÓRICO (Qualidade) ======================= */
function renderTimeline(){
  document.getElementById('timeline').innerHTML = campaigns.filter(c=>c.status==="finalizada" || c.status==="encerrada").map(c=>{
    const {eligible} = evaluateEligibility(c.id);
    const winnersHtml = c.ganhadores ? `<div class="tl-winners">${c.ganhadores.map(w=>`<span class="chip">🏆 ${w.nome} · ${w.setor}</span>`).join('')}</div>` : `<div class="tl-winners"><span class="chip">Sorteio pendente de execução</span></div>`;
    const metaHtml = c.ganhadores ? `
      <div class="tl-meta"><span><i data-lucide="users"></i> ${campaignParticipants(c.id).length} participantes</span><span><i data-lucide="check-circle-2"></i> ${eligible.length} elegíveis avaliados</span><span><i data-lucide="dices"></i> nº aleatório: ${c.randomSeed || "—"}</span><span><i data-lucide="user"></i> responsável: ${c.responsavel || "—"}</span></div>
      <div class="hint" style="margin-top:6px;">${c.justificativa || ""}</div>` : "";
    return `<div class="tl-item"><div class="tl-dot"></div><div class="tl-body"><h4>${c.nome}</h4><p>${c.inicio.replace('T',' ')} → ${c.fim.replace('T',' ')} · ${statusBadge(c.status)}</p>${winnersHtml}${metaHtml}</div></div>`;
  }).join('') || `<p style="color:var(--ink-soft); font-size:13px;">Nenhuma campanha encerrada ainda.</p>`;
}

/* ======================= REGRAS & EXCEÇÕES ======================= */
function renderRegrasExcecoes(){
  const sel = document.getElementById('excCampanha');
  if(sel && sel.options.length !== campaigns.length){
    sel.innerHTML = campaigns.map(c=>`<option value="${c.id}">${c.nome}</option>`).join('');
  }
  const tbody = document.getElementById('tblExcecoes');
  if(!tbody) return;
  tbody.innerHTML = ruleChangeLog.map(r=>{
    const c = campaigns.find(x=>x.id===r.campaignId);
    return `<tr><td>${fmtDateTime(r.data)}</td><td>${r.responsavel}</td><td>${c?c.nome:r.campaignId}</td><td>${r.regraOriginal}</td><td>${r.alteracao}</td><td>${r.justificativa}</td></tr>`;
  }).join('') || `<tr><td colspan="6" style="text-align:center; color:var(--ink-soft); padding:20px;">Nenhuma exceção registrada até o momento.</td></tr>`;
}
document.getElementById('formExcecao').addEventListener('submit', function(e){
  e.preventDefault();
  const campaignId = document.getElementById('excCampanha').value;
  const regraOriginal = document.getElementById('excRegraOriginal').value.trim();
  const alteracao = document.getElementById('excAlteracao').value.trim();
  const justificativa = document.getElementById('excJustificativa').value.trim();
  if(!campaignId || !regraOriginal || !alteracao || !justificativa) return;
  const entry = {campaignId, regraOriginal, alteracao, justificativa, responsavel: currentUser ? currentUser.nome : "Qualidade", data: new Date()};
  ruleChangeLog.unshift(entry);
  const c = campaigns.find(x=>x.id===campaignId);
  logAction("Exceção registrada", `${c?c.nome:campaignId} — ${alteracao}`);
  this.reset();
  renderRegrasExcecoes();
  saveState();
  showToast("Exceção registrada e disponível para auditoria.","success");
});

/* ======================= DIVULGAÇÃO (banners) ======================= */
function renderDivulgacao(){
  const selDiv = document.getElementById('divCampanha');
  const selGanh = document.getElementById('divCampanhaGanhadores');
  if(selDiv) selDiv.innerHTML = campaigns.map(c=>`<option value="${c.id}">${c.nome}</option>`).join('');
  const comGanhadores = campaigns.filter(c=>c.ganhadores && c.ganhadores.length);
  if(selGanh) selGanh.innerHTML = comGanhadores.length
    ? comGanhadores.map(c=>`<option value="${c.id}">${c.nome}</option>`).join('')
    : `<option value="">Nenhuma campanha com sorteio oficial registrado ainda</option>`;
}
function baixarComoImagem(elId, filename){
  const el = document.getElementById(elId);
  if(!el){ return; }
  if(typeof html2canvas === 'undefined'){
    showToast("Não foi possível gerar a imagem (sem conexão com a internet para carregar a ferramenta de captura).","warning");
    return;
  }
  html2canvas(el, {backgroundColor:null, scale:2}).then(canvas=>{
    canvas.toBlob(blob=>{
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(()=>URL.revokeObjectURL(url), 4000);
      showToast("Imagem baixada com sucesso.","success");
    });
  }).catch(()=>{
    showToast("Não foi possível gerar a imagem agora. Tente novamente.","warning");
  });
}
document.getElementById('btnGerarDivulgacao').addEventListener('click', ()=>{
  const c = campaigns.find(x=>x.id===document.getElementById('divCampanha').value);
  if(!c) return;
  const link = `${window.location.origin}${window.location.pathname}?campanha=${c.id}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(link)}`;
  const wrap = document.getElementById('divPreviewWrap');
  wrap.style.display = "block";
  wrap.innerHTML = `
    <div id="divBannerArt" style="background:linear-gradient(135deg, var(--primary), var(--secondary)); border-radius:20px; padding:36px; color:#fff; text-align:center; max-width:520px; margin:0 auto;">
      <div style="font-size:13px; letter-spacing:2px; opacity:.85; text-transform:uppercase;">Programa Política de Gestão</div>
      <div style="width:64px; height:64px; margin:14px auto; animation:mascotBob 3s ease-in-out infinite;">${MASCOT_SVG}</div>
      <h2 style="margin:6px 0; font-family:'Manrope',sans-serif;">${c.nome}</h2>
      <p style="opacity:.95; margin-bottom:18px;">Participe respondendo o questionário e concorra aos prêmios!</p>
      <div style="background:#fff; display:inline-block; padding:10px; border-radius:12px;"><img src="${qrUrl}" alt="QR Code" onerror="this.parentElement.innerHTML='<span style=\\'font-size:11px;color:#333;\\'>QR indisponível offline</span>'"></div>
      <p style="font-size:11px; margin-top:12px; opacity:.85;">Período: ${c.inicio.replace('T',' ')} até ${c.fim.replace('T',' ')}</p>
    </div>
    <div style="text-align:center; margin-top:16px; display:flex; gap:10px; justify-content:center; flex-wrap:wrap;">
      <button class="btn btn-primary btn-sm" id="btnBaixarDivulgacao">⬇️ Baixar como imagem (PNG)</button>
      <button class="btn btn-outline btn-sm" onclick="openShareModal('${c.id}')"><i data-lucide="share-2"></i> Ver link e copiar</button>
    </div>`;
  document.getElementById('btnBaixarDivulgacao').addEventListener('click', ()=> baixarComoImagem('divBannerArt', `divulgacao-${c.id}.png`));
  logAction("Arte de divulgação gerada", c.nome);
});
document.getElementById('btnGerarBannerGanhadores').addEventListener('click', ()=>{
  const c = campaigns.find(x=>x.id===document.getElementById('divCampanhaGanhadores').value);
  const wrap = document.getElementById('bannerGanhadoresWrap');
  if(!c || !c.ganhadores || !c.ganhadores.length){
    showToast("Selecione uma campanha com sorteio oficial registrado.","warning");
    return;
  }
  wrap.style.display = "block";
  wrap.innerHTML = `
    <div id="bannerGanhadoresArt" style="position:relative; background:linear-gradient(135deg, var(--secondary), var(--primary)); border-radius:20px; padding:36px; color:#fff; text-align:center; max-width:560px; margin:0 auto; overflow:hidden;">
      <div style="font-size:13px; letter-spacing:2px; opacity:.85; text-transform:uppercase;">Resultado oficial</div>
      <div style="font-size:70px; margin:10px auto; animation:celebrateBounce .8s ease;">🎉</div>
      <h2 style="margin:4px 0 18px; font-family:'Manrope',sans-serif;">🎉 Ganhadores — ${c.nome}</h2>
      <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:12px; text-align:left;">
        ${c.ganhadores.map((w,i)=>`
          <div style="background:rgba(255,255,255,.15); border-radius:14px; padding:14px;">
            <div style="font-size:11px; opacity:.85;">${i+1}º lugar</div>
            <div style="font-weight:700; font-family:'Manrope',sans-serif;">${w.nome}</div>
            <div style="font-size:11px; opacity:.9;">${w.setor} · ${w.filial}</div>
          </div>`).join('')}
      </div>
      <p style="font-size:11px; margin-top:18px; opacity:.85;">Sorteio realizado com número aleatório auditável: ${c.randomSeed || '—'}</p>
    </div>
    <div style="text-align:center; margin-top:16px;">
      <button class="btn btn-primary btn-sm" id="btnBaixarBannerGanhadores">⬇️ Baixar banner (PNG)</button>
    </div>`;
  document.getElementById('btnBaixarBannerGanhadores').addEventListener('click', ()=> baixarComoImagem('bannerGanhadoresArt', `ganhadores-${c.id}.png`));
  logAction("Banner de ganhadores gerado", c.nome);
});

/* ======================= INIT ======================= */
const _hadSavedState = loadState();
aplicarTema(window.themePreference || 'auto');
fillCampaignSelects();
renderDashboard();
renderCampaignGrid();
renderParticipantsTable();
renderEligibleTable();
renderSorteioSetup();
renderTimeline();
renderBanco();
if(window.lucide) lucide.createIcons();

/* Ícones Lucide sempre em dia: sempre que qualquer tela muda (tabelas,
   listas, cards renderizados de novo), este observador redesenha os ícones
   sozinho. Assim nenhuma tela nova precisa lembrar de chamar isso na mão. */
if(window.lucide){
  const _iconObserver = new MutationObserver(()=>{
    clearTimeout(window._iconObserverTimeout);
    window._iconObserverTimeout = setTimeout(()=>{ if(window.lucide) lucide.createIcons(); }, 60);
  });
  _iconObserver.observe(document.body, {childList:true, subtree:true});
}

try{
  if(_hadSavedState && currentUser && currentUser.matricula){
    document.getElementById('loginScreen').style.display = "none";
    document.getElementById('appRoot').style.display = "flex";
    applyRole(currentUser.role);
    showToast(`Sessão restaurada — bem-vindo(a) de volta, ${currentUser.nome}.`, "");
    sincronizarDadosDoServidor(true);
    if(!window._syncIntervalIniciado){
      window._syncIntervalIniciado = true;
      setInterval(()=> sincronizarDadosDoServidor(true), 20 * 1000);
    }
  } else if(_hadSavedState){
    if(currentUser){ currentUser = null; saveState(); } // sessão salva não corresponde a nenhum usuário válido — exige novo login
    showToast("Dados salvos anteriormente neste navegador foram restaurados.", "");
  } else {
    saveState(); // primeira vez neste navegador: grava o estado inicial
  }
}catch(e){
  console.warn("Não foi possível restaurar a sessão salva — voltando para a tela de login.", e);
  clearSavedState();
  document.getElementById('appRoot').style.display = "none";
  document.getElementById('loginScreen').style.display = "";
}
