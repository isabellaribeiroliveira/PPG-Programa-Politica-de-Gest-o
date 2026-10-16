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
/* Cargos de liderança são reconhecidos por PALAVRA-CHAVE no cargo/função real da planilha (ex.: "Gerente de Operações", "Coordenadora de RH"). */
const CARGOS_PALAVRAS = (EMPRESA.cargosImpedidosPalavras && EMPRESA.cargosImpedidosPalavras.length ? EMPRESA.cargosImpedidosPalavras : ['gerente','coordenador','encarregado','assessor']).map(w => String(w).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase());
function cargoImpedido(p){
  return [p.cargo, p.funcao].filter(Boolean).some(a => CARGOS_IMPEDIDOS.includes(a) || CARGOS_PALAVRAS.some(w => String(a).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(w)));
}

const NOMES = []; // não é mais usado — participantes agora vêm do quadro real (EMPRESA.colaboradores)

function randomFrom(arr){return arr[Math.floor(Math.random()*arr.length)];}
function pad(n){return n.toString().padStart(2,'0');}
function fmtDateTime(d){return pad(d.getDate())+"/"+pad(d.getMonth()+1)+"/"+d.getFullYear()+" "+pad(d.getHours())+":"+pad(d.getMinutes());}
/* Formata início/fim de campanha com segurança — a planilha às vezes devolve
   uma data "de verdade" (Date, ou um texto ISO completo com segundos/fuso)
   em vez do texto simples original. Isso não pode quebrar a tela inteira de
   campanhas por causa de uma linha só, nem mostrar algo feio tipo ".000Z". */
function fmtPeriodoValor(valor){
  if(valor == null || valor === '') return '—';
  if(valor instanceof Date) return isNaN(valor) ? '—' : fmtDateTime(valor);
  const s = String(valor);
  if(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s)){ const d = new Date(s); return isNaN(d) ? s : fmtDateTime(d); }
  if(/^\d{4}-\d{2}-\d{2}$/.test(s)){ const [y,mo,d] = s.split('-'); return `${d}/${mo}/${y}`; }
  return s;
}
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
      campaignId, nome: colab.nome, matricula: colab.matricula,
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
let campanhasAntigas = [], participantesAntigos = [];   // campanhas importadas (método anterior)

let participants = [];

let wonHistory = [];

/* ======================= BANCO DE PERGUNTAS ======================= */
let questionBank = [];
function bqUsageStatus(q){
  /* Pergunta vinda de campanha antiga (método anterior) já foi usada: guarda a data em que a rodada terminou. */
  const antiga = /^Campanha antiga:/.test(q.origem || '');
  const nomeAnt = antiga ? String(q.origem).replace(/^Campanha antiga:\s*/, '').replace(/\s*\(método anterior\)\s*$/, '') : '';
  if(!q.ultimaUtilizacao) return {label:"Nunca utilizada", cls:"nunca"};
  const twoYearsMs = 2*365*24*60*60*1000;
  const diff = new Date() - new Date(q.ultimaUtilizacao);
  if(diff < twoYearsMs){
    const months = Math.max(1, Math.round(diff/(30*24*60*60*1000)));
    return {label: antiga ? `Já usada em ${nomeAnt} (método anterior) · há ${months} mês(es) — considere outra` : `Usada há ${months} mês(es) — considere outra`, cls:"recente"};
  }
  return {label: antiga ? `Já usada em ${nomeAnt} (método anterior) — livre para reutilizar` : "Livre para reutilização", cls:"livre"};
}

/* ======================= AUDITORIA (log de ações) ======================= */
let actionLog = [];
let ruleChangeLog = []; // histórico de alterações/exceções às regras de elegibilidade, por campanha
/* O registro de atividades agora é gravado no SERVIDOR (aba "Log" da planilha) — o servidor anota senhas, acessos,
   campanhas, sorteios, importações, banco e mensagens. Daqui só seguem os eventos que apenas o navegador conhece. */
const EVENTOS_DO_NAVEGADOR = {'Relatório exportado':'exportacao', 'Relatório oficial gerado':'exportacao', 'Campanha divulgada':'divulgacao', 'Arte de divulgação gerada':'divulgacao', 'Banner de ganhadores gerado':'divulgacao'};
function logAction(acao, detalhe){
  const tipo = EVENTOS_DO_NAVEGADOR[acao];
  if(!tipo || !currentUser || !currentUser.token || currentRole !== 'qualidade') return;
  backendCall('registrarEvento', {tipo, acao, detalhe: String(detalhe || '')});
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
  const distintos = campo => [...new Set([...(EMPRESA.colaboradores||[]).map(c=>c[campo]), ...todosParticipantes().map(p=>p[campo]), ...(historicoServidor||[]).map(h=>h[campo])].filter(Boolean))].sort((a,b)=>String(a).localeCompare(String(b),'pt-BR'));
  const preencher = (id, rotuloTodos, valores) => { const el = document.getElementById(id); if(!el) return; const atual = el.value; el.innerHTML = `<option value="">${rotuloTodos}</option>` + valores.map(v=>`<option value="${escH(v)}">${escH(v)}</option>`).join(''); el.value = atual; };
  const prevCamp = camp.value;
  camp.innerHTML = '<option value="">Todas</option>' + todasCampanhas().map(c=>`<option value="${escH(c.id)}">${escH(c.nome)}</option>`).join('');
  camp.value = prevCamp;
  preencher('audFiltroSetor', 'Todos', distintos('setor'));
  preencher('audFiltroFilial', 'Todas', distintos('filial'));
  preencher('audFiltroFuncao', 'Todas', distintos('funcao'));
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
  return todosParticipantes().filter(p=>{
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
  if(p.importada) return '<span class="badge finalizada">Campanha anterior</span>';
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
    <div class="hbar-row"><div class="hbar-label">${k}</div><div class="hbar-track"><div class="hbar-fill" style="width:${window.__renderSilencioso ? (v/max*100) : 0}%" data-w="${(v/max*100)}"></div></div><div class="hbar-value">${v}</div></div>`).join('');
  requestAnimationFrame(()=> el.querySelectorAll('.hbar-fill').forEach(f=> f.style.width = f.dataset.w + "%"));
}
function renderAuditoriaDetalhe(){
  const tbody = document.getElementById('tblAuditoriaDetalhe');
  if(!tbody) return;
  audFillFilterSelects();
  const list = audGetFilteredParticipants().sort((a,b)=> (b.dataFim||b.data) - (a.dataFim||a.data));
  tbody.innerHTML = list.map(p=>{
    const c = todasCampanhas().find(x=>x.id===p.campaignId);
    return `<tr>
      <td>${p.nome}</td><td>${p.matricula}</td><td>${p.funcao||p.cargo}</td><td>${p.setor}</td><td>${p.filial}</td>
      <td>${c?c.nome:p.campaignId}</td><td style="font-family:monospace; font-size:11px;">${p.codigoResposta||'—'}</td>
      <td>${p.dataInicio?fmtDateTime(p.dataInicio):'—'}</td><td>${p.dataFim?fmtDateTime(p.dataFim):fmtDateTime(p.data)}</td>
      <td>${duracaoLabel(p.dataInicio, p.dataFim||p.data)}</td>
      <td>${p.acertosQtd!=null && p.totalQuestoes ? `${p.acertosQtd}/${p.totalQuestoes}` : '—'}</td>
      <td><span class="${p.pct===100?'pct100':'pctless'}">${pctTxt(p.pct)}</span></td>
      <td style="font-size:11px;">${escH(p.dispositivo||'—')}<br><span style="font-family:monospace; color:var(--ink-soft); font-size:10px;">${escH(p.sessaoId||'')}</span></td>
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
  const p = todosParticipantes().find(pp=>pp.campaignId===campaignId && pp.matricula===matricula);
  const c = todasCampanhas().find(x=>x.id===campaignId);
  if(!p || !c) return;
  if(c.importada){ showToast('Campanha anterior ao sistema: não há respostas por pergunta registradas.', 'warning'); return; }
  const rows = c.questoes.map((q,i)=>{
    const ans = p.respostasSelecionadas ? p.respostasSelecionadas[i] : undefined;
    const selTexts = Array.isArray(ans) ? ans.map(a=> (q.options[a]||{}).text).join(', ') : (ans!==undefined && ans!==null && q.options[ans] ? q.options[ans].text : 'Não disponível (registro histórico)');
    const correctTexts = q.options.filter(o=>o.correct).map(o=>o.text).join(', ');
    const ok = p.respostasCorretas ? p.respostasCorretas[i] : null;
    return `<tr><td>${q.texto}</td><td>${selTexts||'—'}</td><td>${correctTexts}</td><td>${ok===null?'—':(ok?'<span class="pct100"><i data-lucide="check"></i> Correta</span>':'<span style="color:var(--error);"><i data-lucide="x"></i> Incorreta</span>')}</td></tr>`;
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
  const historico = todosParticipantes().filter(p=>p.matricula===matricula).sort((a,b)=> (b.dataFim||b.data) - (a.dataFim||a.data));
  if(!historico.length) return;
  const ref = historico[0];
  const premios = wonHistory.filter(w=>w.matricula===matricula).sort((a,b)=>b.data-a.data);
  const rows = historico.map(p=>{
    const c = todasCampanhas().find(x=>x.id===p.campaignId);
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
      <p class="hint" style="margin-bottom:2px;">${matricula} · ${ref.funcao||ref.cargo} · ${ref.setor} · ${ref.filial}</p>
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
  const headers = ["Nome","Matrícula","Função","Setor","Filial","Campanha","Código","Início","Fim","Duração","Acertos","% Acertos","Dispositivo","Sessão","Elegibilidade"];
  const rows = list.map(p=>{
    const c = todasCampanhas().find(x=>x.id===p.campaignId);
    const {eligible, excluded} = evaluateEligibility(p.campaignId);
    const ex = excluded.find(e=>e.matricula===p.matricula);
    const elegStr = ex ? `Excluído — ${ex.motivo}` : 'Elegível';
    return [p.nome,p.matricula,p.funcao||p.cargo,p.setor,p.filial,c?c.nome:p.campaignId,p.codigoResposta||'',
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
    const c = todasCampanhas().find(x=>x.id===p.campaignId);
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
      actionLog, ruleChangeLog, currentUser, currentRole,
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
    if(state.actionLog) actionLog = state.actionLog;
    if(state.ruleChangeLog) ruleChangeLog = state.ruleChangeLog;
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
    if(cargoImpedido(p)) motivos.push(`Ocupa cargo de liderança impedido de participar (${p.cargo || p.funcao})`);
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
/* Calcula o status que a campanha DEVERIA ter, com base nas datas.
   "Finalizada" é definitivo (só muda quando o sorteio é registrado) — a
   data nunca reverte isso. Fora esse caso, o status sempre reflete a
   realidade: programada → em andamento → encerrada, sozinho. */
function calcularStatusPorData(c){
  if(c.status === 'finalizada') return 'finalizada';
  const acesso = campaignAccessStatus(c);
  if(acesso === 'nao_iniciada') return 'programada';
  if(acesso === 'aberta') return 'andamento';
  return 'encerrada';
}

/* ======================= NAV ======================= */
const titles = {
  inicio:"Início", campanhas:"Rodadas", nova:"Nova Campanha", participantes:"Resultados",
  elegiveis:"Elegíveis", sorteio:"Sorteio", relatorios:"Relatórios", historico:"Histórico",
  banco:"Banco de Perguntas", auditoria:"Auditoria", config:"Configurações", responder:"Questionário",
  "regras-excecoes":"Regras & Exceções", "divulgacao":"Divulgação", "fale-conosco":"Fale com a Qualidade", "importar-historico":"Importar Histórico",
  "campanha-atual":"Campanha Atual", "historico-colab":"Minhas participações", regulamento:"Regulamento"
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
/* Telas que foram juntadas em outras (links antigos continuam funcionando). */
const ALIAS_SECOES = {'meu-resultado':'historico-colab', 'auditoria':'historico#auditoria', 'importar-historico':'historico#importar', 'regras-excecoes':'config', 'log':'historico#log'};
let abaHistoricoAtual = 'rodadas';
function mostrarAbaHistorico(pane){
  abaHistoricoAtual = pane;
  document.querySelectorAll('#histTabs .hist-tab').forEach(b=>b.classList.toggle('active', b.dataset.pane === pane));
  document.querySelectorAll('#sec-historico .hist-pane').forEach(p=>{ p.style.display = (p.id === 'histPane-'+pane) ? 'block' : 'none'; });
  renderPaneHistorico();
}
function renderPaneHistorico(){
  if(abaHistoricoAtual === 'rodadas') renderTimeline();
  else if(abaHistoricoAtual === 'auditoria'){ renderAuditoria(); renderAuditoriaDetalhe(); }
  else if(abaHistoricoAtual === 'importar'){ if(!IMP.doc) impInicio(); renderHistoricoImportado(); }
  else if(abaHistoricoAtual === 'log') logMostrar();
}
document.querySelectorAll('#histTabs .hist-tab').forEach(b=> b.addEventListener('click', ()=> mostrarAbaHistorico(b.dataset.pane)));
function goToSection(target){
  let aba = null;
  if(ALIAS_SECOES[target]){ const [t, a] = ALIAS_SECOES[target].split('#'); target = t; aba = a || null; }
  document.body.classList.add('anim-entrada');
  clearTimeout(window._animEntradaT);
  window._animEntradaT = setTimeout(()=> document.body.classList.remove('anim-entrada'), 900);
  document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
  const sec = document.getElementById('sec-'+target);
  if(sec) sec.classList.add('active');
  document.getElementById('pageTitle').textContent = titles[target] || target;
  closeSidebarMobile();
  currentSectionId = target;
  if(target === 'historico' && aba) mostrarAbaHistorico(aba);
  else renderSectionContent(target);
}
function renderSectionContent(target){
  if(target==="inicio") renderDashboard();
  if(target==="campanhas") renderCampaignGrid();
  if(target==="historico") renderPaneHistorico();
  if(target==="participantes") renderParticipantsTable();
  if(target==="elegiveis") renderEligibleTable();
  if(target==="banco") renderBanco();
  if(target==="divulgacao") renderDivulgacao();
  if(target==="fale-conosco" && currentRole==="qualidade") renderDuvidas();
  if(target==="fale-conosco" && currentRole==="colaborador") renderMinhasDuvidas();
  if(target==="config" && currentRole==="qualidade"){ renderPedidosSenha(); renderRegrasExcecoes(); renderInfoPlanilha(); renderQuadro(); }
  if(target==="campanha-atual") renderCampanhaAtual();
  if(target==="historico-colab") renderHistoricoColaborador();
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
const BACKEND_URL = "https://script.google.com/macros/s/AKfycbzgYAiKM2pwmMAbhGXoiGAlCxMloU5E7pypzeuI3XUgaFLOP3ogFYz5VNSTnDetacUQcw/exec";

function urlDoApp(){ try{ return location.href.split('#')[0].split('?')[0]; }catch(e){ return ''; } }

/* QR Code gerado aqui mesmo (data URL): por ser da própria página, sai na imagem baixada do banner. */
function gerarQrDataUrl(texto, px){
  try{
    const qr = qrcode(0, 'M'); qr.addData(texto); qr.make();
    const cell = Math.max(2, Math.floor((px || 180) / (qr.getModuleCount() + 8)));
    return qr.createDataURL(cell, cell * 4);
  }catch(e){ console.warn('Falha ao gerar o QR Code', e); return ''; }
}

async function backendCall(action, payload){
  try{
    const controller = new AbortController();
    const timeoutId = setTimeout(()=> controller.abort(), 20000); // nunca deixa uma chamada travada pra sempre
    let res;
    try{
      res = await fetch(BACKEND_URL, {
        method: "POST",
        headers: {"Content-Type": "text/plain;charset=utf-8"}, // evita pre-flight de CORS no Apps Script
        body: JSON.stringify({action, token: (typeof currentUser !== 'undefined' && currentUser) ? currentUser.token : undefined, appUrl: urlDoApp(), ...(payload||{})}),
        signal: controller.signal
      });
    } finally {
      clearTimeout(timeoutId);
    }
    const textoCru = await res.text();
    if(!res.ok){
      console.error(`Backend respondeu HTTP ${res.status} para a ação "${action}". Corpo da resposta:`, textoCru);
      return {ok:false, erro:`O servidor respondeu com erro ${res.status}. Veja o Console (F12) para detalhes.`};
    }
    try{
      const r = JSON.parse(textoCru);
      if(r && r.sessaoExpirada && typeof currentUser !== 'undefined' && currentUser){ sairDoApp("Sua sessão expirou. Entre novamente."); }
      return r;
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
function mapColaboradorParaUser(colab, roleServidor){
  const papelNorm = normalizarTextoCliente(colab.papel);
  const setorNorm = normalizarTextoCliente(colab.setor);
  const role = roleServidor || ((PAPEIS_QUALIDADE.some(p => papelNorm.includes(p)) || setorNorm.includes("qualidade")) ? "qualidade" : "colaborador");
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
  btnEntrar.disabled = true; btnEntrar.innerHTML = '<span class="spinner-w"></span><span>Entrando…</span>';

  const resp = await backendCall('login', {matricula: mat, senha});

  btnEntrar.disabled = false; btnEntrar.innerHTML = '<span>Entrar</span><i data-lucide="arrow-right"></i>'; if(window.lucide) lucide.createIcons();

  if(!resp.ok){
    errEl.textContent = resp.erro || "Matrícula ou senha inválida.";
    errEl.style.display = "block";
    return;
  }

  try{
    currentUser = mapColaboradorParaUser(resp.colaborador, resp.role);
    if(resp.token) currentUser.token = resp.token;
    if(resp.snapshot) _snapPendente = resp.snapshot;
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
  if(_snapPendente){ try{ aplicarSnapshot(_snapPendente); _aplicouNoLogin = true; }catch(e){ console.warn('Dados do login não aplicados:', e); } _snapPendente = null; }
  const loginScreen = document.getElementById('loginScreen');
  const appRoot = document.getElementById('appRoot');
  loginScreen.classList.add('login-exit');
  appRoot.style.display = "flex";
  appRoot.classList.add('app-enter');
  setTimeout(()=>{
    loginScreen.style.display = "none";
    loginScreen.classList.remove('login-exit');
    appRoot.classList.remove('app-enter');
  }, 420);
  applyRole(currentUser.role);
  saveState();
  showToast(`Bem-vindo(a), ${currentUser.nome}.`, "success");
  iniciarSincronizacao();
}

/* ======================= TROCA DE SENHA (obrigatória no 1º acesso, ou voluntária) ======================= */
function abrirModalTrocaSenha(opts){
  opts = opts || {};
  const obrigatoria = !!opts.obrigatoria;
  const backdrop = document.createElement('div');
  backdrop.className = 'share-backdrop';
  backdrop.id = 'trocaSenhaBackdrop';
  if(opts && opts.obrigatoria) backdrop.dataset.fixo = '1';   // criação obrigatória da senha: ESC não fecha
  backdrop.innerHTML = `
    <div class="share-card" style="max-width:380px; text-align:left;">
      <h3>${opts.primeiroAcesso ? '<i data-lucide="sparkles"></i> Bem-vindo(a)! Crie sua senha' : '<i data-lucide="lock-keyhole"></i> Trocar senha'}</h3>
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
    if(resp.token){ currentUser.token = resp.token; if(resp.role) currentUser.role = resp.role; if(resp.snapshot && obrigatoria) _snapPendente = resp.snapshot; saveState(); }
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
      <p class="hint" style="margin-bottom:16px;">Informe sua matrícula. Sua senha volta a ser a própria matrícula na hora — depois é só entrar e criar uma senha nova. A equipe de Qualidade é avisada por e-mail.</p>
      <form id="formEsqueciSenha">
        <div class="field" style="margin-bottom:10px;"><label>Matrícula</label><input type="text" id="esqMatricula" required></div>
        <div class="login-error" id="esqErro"></div>
        <button type="submit" class="btn btn-primary btn-block" style="margin-top:8px;">Redefinir minha senha</button>
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
    btn.disabled = false; btn.textContent = "Redefinir minha senha";
    if(!resp.ok){ erroEl.textContent = resp.erro || "Não foi possível registrar o pedido."; erroEl.style.display = "block"; return; }
    const card = backdrop.querySelector('.share-card');
    card.innerHTML = `<h3><i data-lucide="check-circle-2"></i> Senha redefinida</h3><p class="hint" style="margin-bottom:16px;">Pronto! Sua senha voltou a ser a <b>sua própria matrícula</b>. Entre usando a matrícula no lugar da senha e crie uma senha nova.</p><button class="btn btn-primary btn-block" id="esqIrLogin">Ir para o login</button>`;
    document.getElementById('esqIrLogin').addEventListener('click', ()=>{ backdrop.remove(); const m = document.getElementById('loginMatricula'); m.value = matricula; document.getElementById('loginSenha').value = ''; document.getElementById('loginSenha').focus(); });
  });
});

function renderHistoricoImportado(){
  const tbody = document.getElementById('tblHistoricoImportado');
  if(!tbody) return;
  const porCampanha = {};
  historicoServidor.forEach(l=>{
    const k = l.campanha || '(sem nome)';
    if(!porCampanha[k]) porCampanha[k] = {periodo: `${fmtPeriodoValor(l.periodoInicio)} – ${fmtPeriodoValor(l.periodoFim)}`, total:0, ganhadores:0, arquivo: l.origemArquivo || ''};
    porCampanha[k].total++;
    if(String(l.ganhador).toLowerCase() === 'sim') porCampanha[k].ganhadores++;
  });
  tbody.innerHTML = Object.entries(porCampanha).map(([nome, info])=>`
    <tr><td>${escH(nome)}</td><td>${escH(info.periodo)}</td><td>${info.total}</td><td>${info.ganhadores}</td></tr>
  `).join('') || `<tr><td colspan="4" style="text-align:center; color:var(--ink-soft); padding:16px;">Nenhum histórico importado ainda.</td></tr>`;
}
document.getElementById('btnAtualizarHistoricoImportado')?.addEventListener('click', ()=>{ _ultimaAssinatura = null; sincronizarDadosDoServidor(true); renderHistoricoImportado(); });

/* ======================= FALE COM A QUALIDADE ======================= */
document.getElementById('formFaleConosco')?.addEventListener('submit', async function(e){
  e.preventDefault();
  const erroEl = document.getElementById('fcErro');
  erroEl.style.display = "none";
  const assunto = document.getElementById('fcAssunto').value.trim();
  const mensagem = document.getElementById('fcMensagem').value.trim();
  const btn = this.querySelector('button[type="submit"]');
  btn.disabled = true; btn.textContent = "Enviando...";
  const resp = await backendCall('enviarDuvida', {assunto, mensagem});
  btn.disabled = false; btn.innerHTML = '<i data-lucide="send"></i> Enviar para a Qualidade';
  if(window.lucide) lucide.createIcons();
  if(!resp.ok){ erroEl.textContent = resp.erro || "Não foi possível enviar sua mensagem."; erroEl.style.display = "block"; return; }
  this.reset();
  showToast(resp.avisouQualidade ? "Mensagem enviada! A equipe de Qualidade foi avisada por e-mail." : "Mensagem enviada! A Qualidade verá no painel.", "success");
  renderMinhasDuvidas();
});

async function renderMinhasDuvidas(){
  const lista = document.getElementById('listaMinhasDuvidas');
  if(!lista || !currentUser) return;
  lista.innerHTML = `<p class="hint">Carregando…</p>`;
  const resp = await backendCall('getMinhasDuvidas', {matricula: currentUser.matricula});
  if(!resp.ok){ lista.innerHTML = `<p class="hint" style="color:var(--error);">${resp.erro || 'Não foi possível carregar.'}</p>`; return; }
  const minhas = (resp.duvidas || []).sort((a,b)=> new Date(b.dataHora) - new Date(a.dataHora));
  if(!minhas.length){ lista.innerHTML = `<p class="hint">Você ainda não enviou nenhuma mensagem.</p>`; return; }
  lista.innerHTML = minhas.map(d=>`
    <div class="panel duvida-card">
      <div class="duvida-head">
        <b>${escH(d.assunto)}</b>
        <span class="badge ${d.status==='pendente'?'programada':'finalizada'}">${d.status==='pendente'?'Aguardando resposta':'Respondida'}</span>
      </div>
      <p class="hint" style="margin:8px 0 ${d.resposta?'12px':'0'};">${escH(d.mensagem)}</p>
      ${d.resposta ? `<div class="duvida-resposta"><b>Resposta de ${escH(d.respondidoPor)} em ${fmtDateTime(new Date(d.respondidoEm))}:</b><p>${escH(d.resposta)}</p></div>` : ''}
    </div>
  `).join('');
}

let _duvidasAtuais = [];
async function renderDuvidas(){
  const lista = document.getElementById('listaDuvidas');
  if(!lista) return;
  lista.innerHTML = `<p class="hint" style="padding:16px; text-align:center;">Carregando…</p>`;
  const resp = await backendCall('listarDuvidas');
  if(!resp.ok){
    lista.innerHTML = `<p class="hint" style="padding:16px; text-align:center; color:var(--error);">${resp.erro || 'Não foi possível carregar as mensagens.'}</p>`;
    return;
  }
  _duvidasAtuais = (resp.duvidas || []).sort((a,b)=> new Date(b.dataHora) - new Date(a.dataHora));
  if(!_duvidasAtuais.length){
    lista.innerHTML = `<div class="panel fun-empty"><div class="fe-icon"><i data-lucide="inbox"></i></div>Nenhuma mensagem recebida ainda.</div>`;
    if(window.lucide) lucide.createIcons();
    return;
  }
  lista.innerHTML = _duvidasAtuais.map((d,i)=>`
    <div class="panel duvida-card">
      <div class="duvida-head">
        <div><b>${escH(d.nome)}</b> <span class="hint">· ${escH(d.matricula)} · ${fmtDateTime(new Date(d.dataHora))}</span></div>
        <span class="badge ${d.status==='pendente'?'programada':'finalizada'}">${d.status==='pendente'?'Aguardando resposta':'Respondida'}</span>
      </div>
      <p style="margin:10px 0 4px;"><b>${escH(d.assunto)}</b></p>
      <p class="hint" style="margin:0 0 12px;">${escH(d.mensagem)}</p>
      ${d.resposta
        ? `<div class="duvida-resposta"><b>Resposta de ${escH(d.respondidoPor)} em ${fmtDateTime(new Date(d.respondidoEm))}:</b><p>${escH(d.resposta)}</p></div>`
        : `<div class="duvida-responder">
            <textarea id="respTexto_${i}" rows="2" placeholder="Escreva uma resposta para ${escH(d.nome.split(' ')[0])}..."></textarea>
            <button class="btn btn-primary btn-sm" onclick="enviarRespostaDuvida(${i})" style="margin-top:8px;"><i data-lucide="send"></i> Enviar resposta</button>
          </div>`
      }
    </div>
  `).join('');
  if(window.lucide) lucide.createIcons();
}
window.enviarRespostaDuvida = async function(i){
  const d = _duvidasAtuais[i];
  const textarea = document.getElementById(`respTexto_${i}`);
  const resposta = textarea.value.trim();
  if(!resposta){ showToast("Escreva uma resposta antes de enviar.", "warning"); return; }
  const btn = textarea.nextElementSibling;
  btn.disabled = true; btn.textContent = "Enviando...";
  const resp = await backendCall('responderDuvida', {id: d.id, resposta});
  if(!resp.ok){ showToast(resp.erro || "Não foi possível enviar a resposta.", "warning"); btn.disabled = false; btn.innerHTML = '<i data-lucide="send"></i> Enviar resposta'; return; }
  showToast("Resposta enviada! A pessoa também recebe um aviso por e-mail.", "success");
  renderDuvidas();
};
document.getElementById('btnAtualizarDuvidas')?.addEventListener('click', renderDuvidas);

/* ======================= QUALIDADE: RESOLVER PEDIDOS DE SENHA ======================= */
async function renderPedidosSenha(){
  const tbody = document.getElementById('tblPedidosSenha');
  if(!tbody) return;
  const resp = await backendCall('listPasswordRequests');
  if(!resp.ok){
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--error); padding:16px;">${resp.erro || 'Não foi possível carregar o histórico.'}</td></tr>`;
    return;
  }
  const pedidos = (resp.pedidos || []).sort((a,b)=> new Date(b.dataHora) - new Date(a.dataHora));
  tbody.innerHTML = pedidos.map(p=>`
    <tr><td>${fmtDateTime(new Date(p.dataHora))}</td><td>${p.matricula}</td><td>${p.nome}</td><td><span class="badge finalizada">${p.status}</span></td></tr>`
  ).join('') || `<tr><td colspan="4" style="text-align:center; color:var(--ink-soft); padding:16px;">Nenhuma redefinição registrada.</td></tr>`;
}
document.getElementById('btnResetManual')?.addEventListener('click', ()=>{
  const m = document.getElementById('resetMatriculaManual').value.trim();
  if(!m){ showToast("Digite a matrícula.", "warning"); return; }
  window.resolverPedidoSenha(m);
});
let _infoServidor = null;
async function renderInfoPlanilha(){
  const a = document.getElementById('linkPlanilha');
  if(!a) return;
  if(!_infoServidor){ const r = await backendCall('getInfo'); if(r.ok) _infoServidor = r; }
  if(!_infoServidor) return;
  a.href = _infoServidor.planilhaUrl; a.style.display = '';
  const i = document.getElementById('infoEmailTeste');
  if(i) i.textContent = _infoServidor.modoTesteEmail
    ? `Modo teste de e-mail ativo: todos os e-mails do sistema estão indo somente para ${_infoServidor.emailTeste}.`
    : 'E-mails sendo enviados para os destinatários reais.';
}
window.resolverPedidoSenha = function(matricula){
  if(!confirm(`Redefinir a senha da matrícula ${matricula}?\n\nA senha volta a ser a própria matrícula (igual ao primeiro acesso) — a pessoa será obrigada a criar uma senha nova no próximo login.`)) return;
  backendCall('resolveReset', {matricula, atendidoPor: currentUser.nome}).then(resp=>{
    if(resp.ok){ showToast("Senha redefinida — a pessoa já pode entrar usando a matrícula como senha.", "success"); const i = document.getElementById('resetMatriculaManual'); if(i) i.value = ''; renderPedidosSenha(); }
    else showToast(resp.erro || "Não foi possível concluir.", "warning");
  });
};
document.getElementById('btnAtualizarPedidosSenha')?.addEventListener('click', renderPedidosSenha);
document.getElementById('btnTrocarMinhaSenha')?.addEventListener('click', ()=> abrirModalTrocaSenha({obrigatoria:false}));

/* ======================= SINCRONIZAÇÃO DO QUADRO DE COLABORADORES ======================= */
/* Busca o quadro real na planilha (em segundo plano, sem pedir nada a ninguém)
   e mantém a amostragem de participantes/sorteio coerente com dados reais. */
/* ======================= SINCRONIZAÇÃO (silenciosa) ======================= */
/* Uma única chamada (getSnapshot) traz tudo. Se nada mudou, NADA é redesenhado.
   Se mudou, redesenha sem piscar: mantém a rolagem, não interrompe quem está
   digitando e adia enquanto houver janela aberta ou prova em andamento. */
let sincronizando = false, _ultimaAssinatura = null, _falhasSync = 0, _renderPendente = false;
let historicoServidor = [];

async function sincronizarColaboradores(){
  if(!currentUser || currentRole !== 'qualidade') return; // só a Qualidade precisa (e só ela recebe) o quadro de pessoas
  const resp = await backendCall('getColaboradores');
  if(resp.ok && Array.isArray(resp.colaboradores)){
    EMPRESA.colaboradores = resp.colaboradores.map(c=>({matricula:String(c.matricula), nome:c.nome, setor:c.setor, filial:c.filial, funcao:c.funcao, qualidade:!!c.qualidade, temEmail:!!c.temEmail}));
    _renderPendente = true;
  }
}

function capturarRolagem(){
  return {y: window.scrollY, x: window.scrollX, els: [...document.querySelectorAll('.content, .main, .app, main')].map(e=>[e, e.scrollTop])};
}
function restaurarRolagem(s){
  window.scrollTo(s.x, s.y);
  s.els.forEach(([e,t])=>{ e.scrollTop = t; });
}
function usuarioOcupado(){
  const a = document.activeElement;
  const digitando = a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName);
  const janela = document.querySelector('.share-backdrop, .celebrate-backdrop.show, .pop-backdrop');
  return !!(digitando || janela || (typeof quizState !== 'undefined' && quizState));
}
function renderSilencioso(){
  if(usuarioOcupado()){ _renderPendente = true; return; }
  _renderPendente = false;
  const sc = capturarRolagem();
  window.__renderSilencioso = true;
  try{ fillCampaignSelects(); renderSectionContent(currentSectionId); }
  finally{ window.__renderSilencioso = false; }
  restaurarRolagem(sc);
}
setInterval(()=>{ if(_renderPendente && currentUser) renderSilencioso(); }, 2500);

function sairDoApp(msg){
  currentUser = null; _ultimaAssinatura = null; quizState = null;
  campaigns = []; participants = []; questionBank = []; wonHistory = []; historicoServidor = []; EMPRESA.colaboradores = [];
  campanhasAntigas = []; participantesAntigos = []; _dadosCarregados = false; _ultimoSyncOk = 0; _snapPendente = null; limparCacheSnapshot();
  LOG.itens = []; LOG.resumo = null; LOG.contagem = {}; ruleChangeLog = []; _excTs = 0;
  saveState();
  document.getElementById('appRoot').style.display = "none";
  document.getElementById('loginScreen').style.display = "";
  document.getElementById('loginScreen').scrollTo(0, 0);
  document.getElementById('loginForm').reset();
  if(msg) showToast(msg, "warning");
}
document.getElementById('btnLogout').addEventListener('click', ()=> sairDoApp());
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
/* Pop-up de celebração — para momentos que merecem mais destaque que um
   toast rápido (campanha criada, sorteio oficializado, etc). */
function showCelebrationPopup(titulo, mensagem, icone){
  const antigo = document.getElementById('celebratePopup');
  if(antigo) antigo.remove();
  const backdrop = document.createElement('div');
  backdrop.className = 'celebrate-backdrop';
  backdrop.id = 'celebratePopup';
  backdrop.innerHTML = `
    <div class="celebrate-card">
      <div class="celebrate-icon"><i data-lucide="${icone || 'party-popper'}"></i></div>
      <h3>${titulo}</h3>
      <p>${mensagem}</p>
      <button class="btn btn-primary" id="btnFecharCelebracao">Continuar</button>
    </div>`;
  document.body.appendChild(backdrop);
  requestAnimationFrame(()=> backdrop.classList.add('show'));
  const fechar = ()=>{ backdrop.classList.remove('show'); setTimeout(()=> backdrop.remove(), 250); };
  document.getElementById('btnFecharCelebracao').addEventListener('click', fechar);
  backdrop.addEventListener('click', (e)=>{ if(e.target === backdrop) fechar(); });
  window._celebrateTimer && clearTimeout(window._celebrateTimer);
  window._celebrateTimer = setTimeout(fechar, 4500);
}

/* ======================= HELPERS ======================= */
function statusBadge(status){
  const map = {programada:["programada","Programada"], andamento:["andamento","Em andamento"], encerrada:["encerrada","Encerrada"], finalizada:["finalizada","Finalizada"]};
  const [cls,label] = map[status] || ["encerrada", status || "—"];
  return `<span class="badge ${cls}">${label}</span>`;
}
function campaignParticipants(id){ return (String(id).indexOf('hist:') === 0 ? participantesAntigos : participants).filter(p=>p.campaignId===id); }
function fillCampaignSelects(){
  const comAntigas = {selectCampanhaParticipantes:true, selectCampanhaRelatorio:true, selectCampanhaElegiveis:false, selectCampanhaSorteio:false};
  Object.keys(comAntigas).forEach(id=>{
    const sel = document.getElementById(id); if(!sel) return;
    const lista = comAntigas[id] ? [...campaigns, ...ordenarPorFim(campanhasAntigas).reverse()] : campaigns;
    const assinatura = lista.map(c=>c.id+'|'+c.nome).join('¦');
    if(sel.dataset.sig === assinatura) return;
    const prev = sel.value;
    sel.innerHTML = lista.map(c=>`<option value="${escH(c.id)}">${escH(c.nome)}${c.importada ? ' (anterior)' : ''}</option>`).join('');
    if(prev && [...sel.options].some(o=>o.value === prev)) sel.value = prev;
    sel.dataset.sig = assinatura;
  });
}

/* ======================= DASHBOARD (com drill-down) ======================= */
function renderDashboard(){
  renderQualidadeTip();
  renderHomeExtras();
  document.getElementById('kpiTotalCampanhas').textContent = todasCampanhas().length;
  document.getElementById('kpiAndamento').textContent = campaigns.filter(c=>c.status==="andamento").length;
  document.getElementById('kpiProgramadas').textContent = campaigns.filter(c=>c.status==="programada").length;
  const emAndamento = campaigns.filter(c=>c.status==="andamento");
  const candidatos = emAndamento.length ? emAndamento : campaigns;
  const latest = [...candidatos].sort((a,b)=> new Date(b.inicio||0) - new Date(a.inicio||0))[0];
  document.getElementById('kpiParticipantes').textContent = latest ? campaignParticipants(latest.id).length : 0;
  document.getElementById('kpiElegiveis').textContent = latest ? evaluateEligibility(latest.id).eligible.length : 0;
  const ganhadores = todasCampanhas().filter(c=>c.ganhadores).reduce((a,c)=>a+c.ganhadores.length,0);
  document.getElementById('kpiGanhadores').textContent = ganhadores;

  const barsEl = document.getElementById('chartParticipacao');
  const barras = ordenarPorFim(todasCampanhas()).slice(-12);
  const maxCount = Math.max(...barras.map(c=>campaignParticipants(c.id).length), 1);
  barsEl.innerHTML = barras.map(c=>{
    const n = campaignParticipants(c.id).length;
    const h = Math.max(8, Math.round((n/maxCount)*130));
    const shortName = c.nome.split('–')[0].trim();
    return `<div class="bar-col"><div class="bar-value">${n}</div><div class="bar-shell"><div class="bar-fill" style="height:${window.__renderSilencioso ? h : 0}px" data-h="${h}"></div></div><div class="bar-label">${shortName}</div></div>`;
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

  const allWinners = todasCampanhas().filter(c=>c.ganhadores).flatMap(c=>c.ganhadores);
  renderHBarChart('chartSetor', allWinners, 'setor', [...new Set(allWinners.map(w=>w.setor).filter(Boolean))]);
  renderHBarChart('chartFilial', allWinners, 'filial', [...new Set(allWinners.map(w=>w.filial).filter(Boolean))]);

  document.getElementById('tblUltimasCampanhas').innerHTML = ordenarPorFim(todasCampanhas()).reverse().slice(0,10).map(c=>{
    const n = campaignParticipants(c.id).length;
    return `<tr><td>${c.nome}</td><td>${fmtPeriodoValor(c.inicio)} – ${fmtPeriodoValor(c.fim)}</td><td>${n}</td><td>${statusBadge(c.status)}</td></tr>`;
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
        <div class="hbar-track"><div class="hbar-fill" style="width:${window.__renderSilencioso ? (v/max*100) : 0}%" data-w="${(v/max*100)}"></div></div>
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
window.goToResultadosLatest = function(){ if(rodadaDestaque()) goToParticipants(rodadaDestaque().id); };
window.goToElegiveisLatest = function(){
  if(!rodadaDestaque()) return;
  document.querySelector('[data-target="elegiveis"]').click();
  document.getElementById('selectCampanhaElegiveis').value = rodadaDestaque().id;
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
        <span><i data-lucide="calendar"></i> ${fmtPeriodoValor(c.inicio)} → ${fmtPeriodoValor(c.fim)}</span>
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
  const list = campaignParticipants(id).sort((a,b)=>(b.pct||0)-(a.pct||0));
  document.getElementById('tblParticipantes').innerHTML = list.map(p=>`
    <tr><td>${p.nome}</td><td>${p.matricula}</td><td>${p.cargo}</td><td>${p.setor}</td><td>${p.filial}</td><td>${fmtDateTime(p.data)}</td><td><span class="${p.pct===100?'pct100':'pctless'}">${pctTxt(p.pct)}</span></td></tr>`).join('') ||
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
  const asc = [...stats].sort((a,b)=>a.pct-b.pct), desc = [...stats].sort((a,b)=>(b.pct||0)-(a.pct||0));
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
  const qrUrl = gerarQrDataUrl(link, 200);
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
    showCelebrationPopup("Campanha criada!", `"${payload.nome}" já está pronta e visível para os colaboradores dentro do período configurado.`, 'rocket');
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
    const opts = (q.options || []).map(o=>`<li class="${o.correct ? 'ok' : ''}">${o.correct ? '<i data-lucide="check-circle-2"></i>' : '<i data-lucide="circle"></i>'} ${escH(o.text)}</li>`).join('');
    return `<tr>
      <td class="bq-q"><div class="bq-enun">${escH(q.texto)}</div><ul class="bq-alts">${opts}</ul><span class="hint bq-cod">${escH(q.codigo)}${q.type === 'multiplas_respostas' ? ' · múltipla escolha' : ''}</span></td>
      <td>${escH(q.categoria || '—')}${q.tema ? `<div class="hint">${escH(q.tema)}</div>` : ''}${q.procedimento ? `<div class="hint">${escH(q.procedimento)}</div>` : ''}</td>
      <td>${q.qtdUtilizacoes || 0}x<br><span class="bq-badge ${u.cls}">${escH(u.label)}</span>${q.origem && !/^Campanha antiga:/.test(q.origem) ? `<div class="hint" style="margin-top:4px;font-size:11px;">${escH(q.origem)}</div>` : ''}</td>
      <td><span class="badge ${q.status==='ativa'?'finalizada':'excluido'}">${q.status==='ativa'?'Ativa':'Inativa'}</span></td>
      <td><div style="display:flex; gap:6px; flex-wrap:wrap;">
        <button class="btn btn-outline btn-sm" onclick="editBQ('${escH(q.codigo)}')">Editar</button>
        <button class="btn btn-outline btn-sm" onclick="deleteBQ('${escH(q.codigo)}')">Excluir</button>
      </div></td>
    </tr>`;
  }).join('') || `<tr><td colspan="5" style="text-align:center; color:var(--ink-soft); padding:20px;">Nenhuma pergunta cadastrada no banco.</td></tr>`;
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
    const file = e.target.files[0]; e.target.value = '';
    bqImportarArquivo(file);
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
      body.innerHTML = `<div class="duo-done"><span class="mascot-figure mascot-figure-emoji"><i data-lucide="lock-keyhole"></i></span><h2>Você já respondeu esta campanha</h2><p>O registro já existe — feito neste ou em outro dispositivo.</p></div>`;
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
      <div class="duo-wait"><i data-lucide="hourglass"></i></div>
      <div>${access==='nao_iniciada' ? 'Esta campanha ainda não está aberta para respostas.' : 'O prazo para responder esta campanha já foi encerrado.'}</div>
      <div class="hint">Período: ${fmtPeriodoValor(c.inicio)} até ${fmtPeriodoValor(c.fim)}</div>
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
  const segmentosHtml = campaign.questoes.map((_,i)=>{
    const cls = i < index ? 'done' : (i === index ? 'current' : '');
    return `<div class="duo-seg ${cls}"></div>`;
  }).join('');
  body.innerHTML = `
    <div class="duo-wrap">
      <div class="duo-progress-segmented">${segmentosHtml}</div>
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
  // Trava de segurança: nenhuma pergunta pode ficar em branco.
  const faltando = campaign.questoes.findIndex((q,i)=>{ const x = answers[i]; return Array.isArray(x) ? x.length === 0 : (x === null || x === undefined); });
  if(faltando !== -1){
    quizState.index = faltando;
    showToast(`Responda todas as perguntas antes de enviar — falta a pergunta ${faltando+1}.`, "warning");
    renderQuizStep();
    return;
  }
  const container = document.getElementById('responderBody');
  container.innerHTML = `<div class="duo-done"><span class="mascot-figure mascot-figure-emoji">${MASCOT_SVG}</span><h2>Enviando sua resposta...</h2><p>Só um instante, isso é registrado direto no servidor.</p></div>`;

  // O navegador só manda o que foi marcado — quem corrige a prova é o servidor.
  const resp = await backendCall('submeterResposta', {resposta: {
    campaignId: campaign.id, respostasSelecionadas: answers,
    dataInicio: (dataInicio || new Date()).toISOString(), sessaoId, dispositivo: dispositivoReal()
  }});

  if(!resp.ok){
    if(resp.sessaoExpirada) return;
    if(resp.jaRespondida){
      container.innerHTML = `<div class="duo-done"><span class="mascot-figure mascot-figure-emoji"><i data-lucide="lock-keyhole"></i></span><h2>Você já respondeu esta campanha</h2><p>Encontramos um registro seu para <b>${campaign.nome}</b> — feito neste ou em outro dispositivo. Cada matrícula só pode responder uma vez, para manter tudo justo.</p></div>`;
      quizState = null; _ultimaAssinatura = null; sincronizarDadosDoServidor(true);
      return;
    }
    if(typeof resp.faltando === 'number'){ quizState.index = resp.faltando; showToast(resp.erro, "warning"); renderQuizStep(); return; }
    // Qualquer outro erro: mantém as respostas na tela para tentar de novo sem perder nada.
    container.innerHTML = `<div class="duo-done"><span class="mascot-figure mascot-figure-emoji"><i data-lucide="alert-triangle"></i></span><h2>Não foi possível enviar sua resposta</h2><p>${resp.erro || 'Verifique sua internet e tente novamente.'}</p><p class="hint">Suas respostas continuam aqui — é só tentar de novo.</p><button class="btn btn-primary" onclick="finalizeQuiz()" style="margin-top:12px;">Tentar novamente</button></div>`;
    return;
  }

  const agora = new Date();
  const novoParticipante = {
    campaignId: campaign.id, nome: currentUser.nome, matricula: currentUser.matricula,
    setor: currentUser.setor, filial: currentUser.filial, funcao: currentUser.funcao, cargo: currentUser.cargo,
    data: agora, dataInicio: dataInicio || agora, dataFim: agora, pct: null, acertosQtd: null, totalQuestoes: campaign.questoes.length,
    respostasCorretas: [], respostasSelecionadas: [], codigoResposta: resp.codigoResposta, resultadoOculto: true
  };
  participants.push(novoParticipante);
  _ultimaAssinatura = null; // o próximo ciclo traz a versão oficial do servidor
  logAction("Resposta registrada", `${novoParticipante.codigoResposta} — ${campaign.nome} — ${novoParticipante.nome}`);
  fillCampaignSelects();
  renderQuizDoneInto(container, campaign, novoParticipante);
  quizState = null;
}

/* Univaldo, o mascote oficial da Univale Transportes — representado por emoji,
   sempre com as animações (respirar, balançar, "piscar") aplicadas via CSS. */
const MASCOT_EMOJI = '';
/* Versão em SVG (Twemoji oficial) do mascote — nítida em qualquer aparelho,
   sem depender da fonte de emoji do sistema operacional (que varia e pode
   ficar com baixa qualidade em alguns dispositivos). */
/* Mascote da marca: mira em traço (mesmo estilo dos ícones Lucide) com o centro vermelho da logo. */
function mascotSvg(cor){ return `<svg viewBox="0 0 48 48" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="24" cy="24" r="18.5" stroke="${cor}" stroke-width="2.6"/><circle cx="24" cy="24" r="11" stroke="${cor}" stroke-width="2.6" opacity=".72"/><circle cx="24" cy="24" r="4.6" fill="#E2082D"/><path d="M24 2.5v8M24 37.5v8M2.5 24h8M37.5 24h8" stroke="${cor}" stroke-width="2.6" stroke-linecap="round"/></svg>`; }
const MASCOT_SVG = mascotSvg('currentColor');
const MASCOT_NOME = "Univaldo";
function mascotBubble(texto, opts){
  const pro = opts && opts.pro;
  const conteudo = (opts && opts.emoji) ? opts.emoji : MASCOT_SVG;
  return `<div class="mascot-row ${pro ? 'mascot-pro' : ''}">
    <div class="mascot-avatar">
      <span class="mascot-emoji mascot-emoji-blink">${conteudo}</span>
    </div>
    <div class="mascot-speech">${texto}</div>
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
  const cores = ['#0EB6B0','#02A39D','#E2082D','#F9A825','#00695C'];
  let spans = "";
  for(let i=0;i<24;i++){
    const left = Math.round(Math.random()*100), delay = (Math.random()*0.7).toFixed(2), w = 6 + Math.round(Math.random()*6);
    const h = Math.random() > .5 ? Math.round(w*2.2) : w, rot = Math.round(Math.random()*360), raio = Math.random() > .6 ? '50%' : '2px';
    spans += `<span style="left:${left}%; animation-delay:${delay}s; width:${w}px; height:${h}px; background:${randomFrom(cores)}; transform:rotate(${rot}deg); border-radius:${raio};"></span>`;
  }
  return `<div class="duo-confetti">${spans}</div>`;
}

/* Tela final — exatamente o que o colaborador deve ver, nada de gabarito ou
   detalhamento de acertos/erros por pergunta (isso fica exclusivo da Qualidade). */
function renderQuizDoneInto(container, c, participant){
  const roundClosed = campaignAccessStatus(c) !== 'aberta' && participant.pct != null;

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
      ${mascotBubble("Sua resposta está registrada e segura. Assim que a rodada encerrar, você vê aqui quantas você acertou. Até lá!")}`;
    return;
  }

  const correctCount = participant.respostasCorretas ? participant.respostasCorretas.filter(Boolean).length : Math.round(participant.pct/100*c.questoes.length);
  const perfeito = participant.pct === 100;
  const mascotEmoji = perfeito ? '<i data-lucide="trophy"></i>' : MASCOT_SVG;
  const mascotMsg = perfeito
    ? "Mandou muito bem! 100% de acertos — boa sorte no sorteio!"
    : "Valeu por participar! Continue de olho nas próximas campanhas.";
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
  // Só números que não revelam desempenho de ninguém: rodadas já encerradas e quantos já foram premiados.
  const encerradas = campaigns.filter(c=> campaignAccessStatus(c) === 'encerrada').length;
  const totalPremiados = new Set(wonHistory.map(w=>w.matricula)).size;
  el.innerHTML = `<div class="transp-stats">
    <div class="transp-stat"><b>${encerradas}</b><span>Campanhas encerradas</span></div>
    <div class="transp-stat"><b>${totalPremiados}</b><span>Colaboradores já premiados</span></div>
  </div>`;
}

/* ======================= PÁGINAS DO COLABORADOR ======================= */
function tempoRestanteTexto(fim){
  const ms = new Date(fim) - new Date();
  if(!(ms > 0)) return 'encerrada';
  const h = Math.floor(ms / 3600000), d = Math.floor(h / 24);
  if(d >= 2) return `${d} dias`;
  if(h >= 1) return `${h} h`;
  return `${Math.max(1, Math.floor(ms / 60000))} min`;
}
function rodadaFechada(c, p){ return campaignAccessStatus(c) !== 'aberta' && (!p || p.pct != null); }

function colaboradorStreakStrip(){
  const mine = todosParticipantes().filter(p=>p.matricula===currentUser.matricula);
  const fechadas = mine.filter(p=>p.pct != null);   // média só das rodadas já encerradas (nunca antecipa resultado)
  const media = fechadas.length ? Math.round(fechadas.reduce((a,p)=>a+p.pct,0)/fechadas.length) : null;
  const premios = wonHistory.filter(w=>w.matricula===currentUser.matricula).length;
  return `<div class="streak-strip">
    <div class="streak-chip fire"><div class="si"><i data-lucide="flame"></i></div><div><b>${mine.length}</b><span>Campanhas respondidas</span></div></div>
    <div class="streak-chip star"><div class="si"><i data-lucide="star"></i></div><div><b>${media == null ? '—' : media + '%'}</b><span>Média (rodadas encerradas)</span></div></div>
    <div class="streak-chip trophy"><div class="si"><i data-lucide="trophy"></i></div><div><b>${premios}</b><span>Vezes premiado(a)</span></div></div>
  </div>`;
}
function renderCampanhaAtual(){
  const body = document.getElementById('campanhaAtualBody');
  if(!body) return;
  if(!_dadosCarregados){ body.innerHTML = esqueletoHtml(); return; }
  const open = campaigns.filter(c=>campaignAccessStatus(c)==='aberta');
  const respondida = c => participants.some(p=>p.campaignId===c.id && p.matricula===currentUser.matricula);
  const pendentes = open.filter(c=>!respondida(c));
  const primeiro = currentUser.nome.split(' ')[0];
  const msg = !open.length ? `Oi, ${primeiro}! Nenhuma campanha aberta agora, mas fica de olho — aviso assim que abrir uma nova!`
    : !pendentes.length ? `Oi, ${primeiro}! Você já participou da rodada atual — sua resposta está computada. Obrigado!`
    : `Oi, ${primeiro}! Tem campanha nova esperando por você aqui embaixo`;
  let html = mascotBubble(msg) + colaboradorStreakStrip();
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
    const ja = respondida(c);
    return `<div class="panel">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px; flex-wrap:wrap;">
        <div><h3>${c.nome}</h3><p class="hint" style="margin-top:6px; max-width:480px;">${c.descricao || ''}</p></div>
        ${statusBadge(c.status)}
      </div>
      <div class="meta" style="margin:14px 0;">
        <span><i data-lucide="calendar"></i> Responda até ${fmtPeriodoValor(c.fim)}</span>
        <span><i data-lucide="hourglass"></i> Encerra em ${tempoRestanteTexto(c.fim)}</span>
        ${(!ja && (new Date(c.fim) - new Date()) < 86400000) ? '<span class="urgente"><i data-lucide="alarm-clock"></i> Últimas horas — responda hoje!</span>' : ''}
        <span><i data-lucide="gift"></i> Prêmio: ${c.premio || 'a definir'}</span>
      </div>
      ${ja
        ? `<div class="participou-banner"><i data-lucide="check-circle-2"></i><div><b>Participação computada</b><span>Você já respondeu esta rodada. O resultado é liberado em ${fmtDateTime(new Date(c.fim))}.</span></div></div>
           <button class="btn btn-ghost btn-sm" onclick="goToSection('historico-colab')">Ver minhas participações</button>`
        : `<button class="btn btn-primary" onclick="openQuiz('${c.id}')"><i data-lucide="rocket"></i> Responder agora</button>`}
    </div>`;
  }).join('');
  body.innerHTML = html;
}

function painelElegibilidadeHtml(p){
  const {eligible, excluded} = evaluateEligibility(p.campaignId);
  const souElegivel = eligible.some(e=>e.matricula===currentUser.matricula);
  const meuExcluido = excluded.find(e=>e.matricula===currentUser.matricula);
  if(souElegivel) return `<div class="panel eleg-panel eleg-ok">
      <h3><i data-lucide="check-circle-2"></i> Você está elegível para o sorteio desta rodada</h3>
      <p>Você atingiu 100% de acertos e atende aos critérios do programa para concorrer. Boa sorte!</p>
    </div>`;
  if(!meuExcluido) return '';
  // Só o critério de "100% de acertos" fica explícito (é sobre o próprio desempenho).
  // Os demais critérios internos ficam visíveis apenas para a equipe de Qualidade.
  const motivoDesempenho = meuExcluido.motivos.find(m => m.includes('100%'));
  const temOutros = meuExcluido.motivos.some(m => !m.includes('100%'));
  const texto = motivoDesempenho && !temOutros ? motivoDesempenho : 'Você não atende a um ou mais critérios de elegibilidade desta rodada.';
  return `<div class="panel eleg-panel eleg-excluded">
      <h3><i data-lucide="lock-keyhole"></i> Você não está elegível para o sorteio desta rodada</h3>
      <p><b>Motivo:</b> ${texto}</p>
      <p class="hint">A elegibilidade é calculada automaticamente, seguindo os critérios oficiais do programa. Veja mais em "Regulamento".</p>
      <button class="btn btn-outline btn-sm" id="btnVerRegrasElegibilidade"><i data-lucide="scroll-text"></i> Ver regulamento</button>
    </div>`;
}

/* Histórico + Resultado numa tela só. Rodada aberta: só "resposta computada".
   Rodada encerrada: percentual, acertos e elegibilidade. */
function renderHistoricoColaborador(){
  const body = document.getElementById('historicoColabBody');
  if(!body) return;
  if(!_dadosCarregados){ body.innerHTML = esqueletoHtml(); return; }
  const mine = todosParticipantes().filter(p=>p.matricula===currentUser.matricula).sort((a,b)=>b.data-a.data);
  let html = mascotBubble(mine.length ? "Aqui estão todas as suas participações. O resultado de cada rodada aparece assim que ela encerra." : "Você ainda não participou de nenhuma campanha — que tal começar agora?");
  html += colaboradorStreakStrip();
  if(!mine.length){
    html += `<div class="panel fun-empty"><div class="fe-icon"><i data-lucide="inbox"></i></div>Assim que você responder, sua participação aparece aqui.</div>`;
    body.innerHTML = html;
    return;
  }
  html += mine.map(p=>{
    const c = todasCampanhas().find(x=>x.id===p.campaignId);
    const nome = c ? c.nome : p.campaignId;
    const quando = `Respondido em ${fmtDateTime(p.data)}`;
    if(c && c.importada){
      const ganhou = (c.ganhadores||[]).some(g=>matK(g.matricula) && matK(g.matricula) === matK(currentUser.matricula));
      return `<div class="panel part-card"><div><h3 style="font-size:14.5px;">${escH(nome)} <span class="badge antiga">Campanha anterior</span></h3><p class="hint" style="margin-top:4px;">${c.fim ? escH(fmtPeriodoValor(c.fim)) : ''}</p></div><div class="part-status">${p.pct != null ? `<span class="part-pct">${p.pct}%</span>` : ''}${ganhou ? '<span class="badge programada"><i data-lucide="trophy"></i> Você foi premiado(a)</span>' : ''}</div></div>`;
    }
    if(!(c ? rodadaFechada(c, p) : p.pct != null)){
      return `<div class="panel part-card">
        <div><h3 style="font-size:14.5px;">${nome}</h3><p class="hint" style="margin-top:4px;">${quando}</p></div>
        <div class="part-status"><span class="badge finalizada"><i data-lucide="check" style="width:12px;height:12px;vertical-align:-2px;"></i> Resposta computada</span><span class="hint"><i data-lucide="lock-keyhole"></i> Resultado liberado em ${c ? fmtDateTime(new Date(c.fim)) : 'breve'}</span></div>
      </div>`;
    }
    const total = p.totalQuestoes || (c && c.questoes ? c.questoes.length : 0);
    const acertos = p.acertosQtd != null ? p.acertosQtd : Math.round(p.pct/100*total);
    return `<div class="panel part-card">
      <div><h3 style="font-size:14.5px;">${nome}</h3><p class="hint" style="margin-top:4px;">${quando}</p></div>
      <div style="display:flex; align-items:center; gap:14px; flex-wrap:wrap;">
        <div class="part-status"><span class="part-pct">${p.pct}%</span><span class="hint">${acertos} de ${total} perguntas</span></div>
        <button class="btn btn-outline btn-sm" onclick="openQuiz('${p.campaignId}')">Ver resumo</button>
      </div>
    </div>`;
  }).join('');
  const ultimaFechada = mine.find(p=>{ const c = todasCampanhas().find(x=>x.id===p.campaignId); return c && !c.importada && rodadaFechada(c, p); });
  if(ultimaFechada) html += painelElegibilidadeHtml(ultimaFechada);
  body.innerHTML = html;
  const btnRegras = document.getElementById('btnVerRegrasElegibilidade');
  if(btnRegras) btnRegras.addEventListener('click', ()=> document.querySelector('[data-target="regulamento"]').click());
}
function renderMeuResultado(){ renderHistoricoColaborador(); }

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
          justBox.textContent = `Distribuição justa parcial: havia apenas ${distinctSetores || new Set(eligible.map(e=>e.setor)).size} setor(es) distinto(s) entre os elegíveis, portanto não foi possível garantir total diversidade. Justificativa registrada no histórico para auditoria.`;
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
  showCelebrationPopup("Sorteio oficializado!", "Os ganhadores já estão registrados. Agora você pode gerar o banner de divulgação em \"Divulgação\".", 'trophy');
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
  const c = todasCampanhas().find(x=>x.id===campaignId);
  if(reportType === 'participantes'){
    const rows = campaignParticipants(campaignId).map(p=>[p.nome,p.matricula,p.cargo,p.setor,p.filial,fmtDateTime(p.data),pctTxt(p.pct)]);
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
    const allWinners = todasCampanhas().filter(x=>x.ganhadores).flatMap(x=>x.ganhadores);
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
    const rows = todasCampanhas().filter(x=>x.ganhadores || x.status==='encerrada').map(x=>[x.nome, fmtPeriodoValor(x.inicio), fmtPeriodoValor(x.fim), campaignParticipants(x.id).length, x.ganhadores?x.ganhadores.length:0]);
    return {title:"Histórico completo de campanhas", headers:["Campanha","Início","Encerramento","Participantes","Ganhadores"], rows};
  }
  if(reportType === 'comparativo'){
    const rows = todasCampanhas().map(x=>{
      const parts = campaignParticipants(x.id);
      const media = parts.length ? Math.round(parts.reduce((a,p)=>a+p.pct,0)/parts.length) : 0;
      const {eligible} = evaluateEligibility(x.id);
      return [x.nome, parts.length, eligible.length, media+"%", x.ganhadores?x.ganhadores.length:0, x.status];
    });
    const chartSvg = buildBarChartSVG(todasCampanhas().map(x=>x.nome.split('–')[0].trim()), todasCampanhas().map(x=>campaignParticipants(x.id).length), {suffix:' resp.'});
    return {title:"Comparativo entre campanhas", headers:["Campanha","Participantes","Elegíveis","Média de acertos","Ganhadores","Status"], rows, chartSvg};
  }
  if(reportType === 'evolucao'){
    const ordered = [...campaigns].sort((a,b)=> new Date(a.inicio) - new Date(b.inicio));
    const rows = ordered.map(x=>{
      const parts = campaignParticipants(x.id);
      const media = parts.length ? Math.round(parts.reduce((a,p)=>a+p.pct,0)/parts.length) : 0;
      return [fmtPeriodoValor(x.inicio), x.nome, parts.length, media+"%"];
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
function renderTimelineReais(){
  return campaigns.filter(c=>c.status==="finalizada" || c.status==="encerrada").map(c=>{
    const {eligible} = evaluateEligibility(c.id);
    const winnersHtml = c.ganhadores ? `<div class="tl-winners">${c.ganhadores.map(w=>`<span class="chip"><i data-lucide="trophy"></i> ${w.nome} · ${w.setor}</span>`).join('')}</div>` : `<div class="tl-winners"><span class="chip">Sorteio pendente de execução</span></div>`;
    const metaHtml = c.ganhadores ? `
      <div class="tl-meta"><span><i data-lucide="users"></i> ${campaignParticipants(c.id).length} participantes</span><span><i data-lucide="check-circle-2"></i> ${eligible.length} elegíveis avaliados</span><span><i data-lucide="dices"></i> nº aleatório: ${c.randomSeed || "—"}</span><span><i data-lucide="user"></i> responsável: ${c.responsavel || "—"}</span></div>
      <div class="hint" style="margin-top:6px;">${c.justificativa || ""}</div>` : "";
    return `<div class="tl-item"><div class="tl-dot"></div><div class="tl-body"><h4>${c.nome}</h4><p>${fmtPeriodoValor(c.inicio)} → ${fmtPeriodoValor(c.fim)} · ${statusBadge(c.status)}</p>${winnersHtml}${metaHtml}</div></div>`;
  }).join('') ;
}

/* ======================= REGRAS & EXCEÇÕES ======================= */
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
  const qrUrl = gerarQrDataUrl(link, 180);
  const wrap = document.getElementById('divPreviewWrap');
  wrap.style.display = "block";
  wrap.innerHTML = `
    <div id="divBannerArt" style="background:linear-gradient(135deg, var(--primary), var(--secondary)); border-radius:20px; padding:36px; color:#fff; text-align:center; max-width:520px; margin:0 auto;">
      <div style="font-size:13px; letter-spacing:2px; opacity:.85; text-transform:uppercase;">Programa Política de Gestão</div>
      <div style="width:64px; height:64px; margin:14px auto; animation:mascotBob 3s ease-in-out infinite;">${mascotSvg('#ffffff')}</div>
      <h2 style="margin:6px 0; font-family:'Manrope',sans-serif;">${escH(c.nome)}</h2>
      <p style="opacity:.95; margin-bottom:18px;">Participe respondendo o questionário e concorra aos prêmios!</p>
      <div style="background:#fff; display:inline-block; padding:10px; border-radius:12px;"><img src="${qrUrl}" alt="QR Code" onerror="this.parentElement.innerHTML='<span style=\\'font-size:11px;color:#333;\\'>QR indisponível offline</span>'"></div>
      <p style="font-size:11px; margin-top:12px; opacity:.85;">Período: ${fmtPeriodoValor(c.inicio)} até ${fmtPeriodoValor(c.fim)}</p>
    </div>
    <div style="text-align:center; margin-top:16px; display:flex; gap:10px; justify-content:center; flex-wrap:wrap;">
      <button class="btn btn-primary btn-sm" id="btnBaixarDivulgacao"><i data-lucide="download"></i> Baixar como imagem (PNG)</button>
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
      <div style="width:76px; height:76px; margin:12px auto;"><svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg></div>
      <h2 style="margin:4px 0 18px; font-family:'Manrope',sans-serif;">Ganhadores — ${escH(c.nome)}</h2>
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
      <button class="btn btn-primary btn-sm" id="btnBaixarBannerGanhadores"><i data-lucide="download"></i> Baixar banner (PNG)</button>
    </div>`;
  document.getElementById('btnBaixarBannerGanhadores').addEventListener('click', ()=> baixarComoImagem('bannerGanhadoresArt', `ganhadores-${c.id}.png`));
  logAction("Banner de ganhadores gerado", c.nome);
});

/* ======================= UTILITÁRIOS DE TELA: escape + mini páginas (pop-up) ======================= */
function escH(s){ return String(s==null?'':s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function matK(v){ return (window.PPGImport && PPGImport.matKey) ? PPGImport.matKey(v) : String(v==null?'':v).trim().replace(/^0+(?=\d)/,''); }

let _focoAntes = null;
function fecharMiniPagina(){
  const b = document.getElementById('miniPagina'); if(!b) return;
  b.classList.remove('show');
  try{ if(_focoAntes && _focoAntes.focus) _focoAntes.focus(); }catch(e){} setTimeout(()=>{ if(b.parentNode) b.remove(); }, 220);
  document.removeEventListener('keydown', _escMini);
}
function _escMini(e){ if(e.key === 'Escape') fecharMiniPagina(); }
/* Janela flutuante ("mini página"): { titulo, subtitulo, corpo(html|Node), rodape(html|Node), largura } */
function abrirMiniPagina(o){
  const antigo = document.getElementById('miniPagina'); if(antigo) antigo.remove();
  const b = document.createElement('div');
  b.className = 'pop-backdrop'; b.id = 'miniPagina';
  b.innerHTML = `<div class="pop-card" role="dialog" aria-modal="true" style="max-width:${o.largura||760}px">
    <div class="pop-head"><div><h3>${escH(o.titulo||'')}</h3>${o.subtitulo?`<p class="hint">${escH(o.subtitulo)}</p>`:''}</div>
    <button type="button" class="icon-btn pop-close" aria-label="Fechar"><i data-lucide="x"></i></button></div>
    <div class="pop-body"></div>${o.rodape?'<div class="pop-foot"></div>':''}</div>`;
  const corpo = b.querySelector('.pop-body');
  if(typeof o.corpo === 'string') corpo.innerHTML = o.corpo; else if(o.corpo) corpo.appendChild(o.corpo);
  if(o.rodape){ const f = b.querySelector('.pop-foot'); if(typeof o.rodape === 'string') f.innerHTML = o.rodape; else f.appendChild(o.rodape); }
  _focoAntes = antigo ? _focoAntes : document.activeElement;
  document.body.appendChild(b);
  let _baixou = false;   // só fecha se o clique COMEÇOU fora (selecionar texto e soltar fora não fecha)
  b.addEventListener('mousedown', e=>{ _baixou = (e.target === b); });
  b.addEventListener('touchstart', e=>{ _baixou = (e.target === b); }, {passive:true});
  b.addEventListener('click', e=>{ if(e.target === b && _baixou) fecharMiniPagina(); _baixou = false; });
  b.querySelector('.pop-close').addEventListener('click', fecharMiniPagina);
  document.addEventListener('keydown', _escMini);
  requestAnimationFrame(()=> b.classList.add('show'));
  if(window.lucide) lucide.createIcons();
  try{ b.querySelector('.pop-close').focus(); }catch(e){}
  return b;
}
function tabelaHtml(cabecalhos, linhas, vazio){
  if(!linhas.length) return `<p class="hint" style="padding:10px 0;">${escH(vazio||'Nada para mostrar.')}</p>`;
  return `<div class="table-wrap"><table><thead><tr>${cabecalhos.map(h=>`<th>${escH(h)}</th>`).join('')}</tr></thead><tbody>${linhas.map(l=>`<tr>${l.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}

/* ======================= IMPORTAR CAMPANHAS ANTIGAS (qualquer arquivo) ======================= */
const IMP = {doc:null, fi:0, header:-1, mapa:{}, extras:new Set(), cores:new Set(), manual:{}, nome:'', ini:'', fim:'', premio:'', resolver:true, enviando:false};
const IMP_PAPEIS = ['matricula','nome','setor','filial','funcao','percentual','ganhador','premio','campanha','periodoInicio','periodoFim'];
const impRoot = ()=> document.getElementById('impHistRoot');
function impLetra(c){ let s='', n=c+1; while(n>0){ const m=(n-1)%26; s=String.fromCharCode(65+m)+s; n=Math.floor((n-1)/26); } return s; }

function impInicio(){
  IMP.doc = null;
  const r = impRoot(); if(!r) return;
  r.innerHTML = `
    <h3><i data-lucide="upload-cloud"></i> Subir campanha antiga</h3>
    <p class="hint" style="margin-bottom:14px;">Aceito qualquer arquivo: Excel (.xlsx/.xls/.ods), CSV/TXT, Word (.docx), PDF e foto/print da lista. Depois você confere a prévia, escolhe a aba, as colunas e quem foram os ganhadores (inclusive por célula pintada). <b>Nada é salvo antes de você confirmar.</b></p>
    <label class="imp-drop" id="impDrop">
      <i data-lucide="file-up"></i><b>Arraste o arquivo aqui</b><span>ou clique para escolher</span>
      <input type="file" data-imp="arquivo" accept=".xlsx,.xlsm,.xlsb,.xls,.ods,.csv,.tsv,.txt,.docx,.pdf,.html,.htm,.png,.jpg,.jpeg,.webp,.bmp,.gif,.tif,.tiff" style="display:none;">
    </label>
    <div id="impStatus" class="hint" style="margin-top:10px;"></div>`;
  if(!r._impLigado){
    r._impLigado = true;
    r.addEventListener('change', impOnChange);
    r.addEventListener('input', e=>{ if(e.target.dataset.imp === 'campo') impOnChange(e); });
    r.addEventListener('click', e=>{ const b = e.target.closest('[data-impacao]'); if(b) impAcao(b.dataset.impacao); });
    r.addEventListener('dragover', e=>{ const d = e.target.closest('#impDrop'); if(d){ e.preventDefault(); d.classList.add('over'); } });
    r.addEventListener('dragleave', e=>{ const d = e.target.closest('#impDrop'); if(d) d.classList.remove('over'); });
    r.addEventListener('drop', e=>{ const d = e.target.closest('#impDrop'); if(d){ e.preventDefault(); d.classList.remove('over'); if(e.dataTransfer.files[0]) impAbrir(e.dataTransfer.files[0]); } });
  }
  if(window.lucide) lucide.createIcons();
}
async function impAbrir(file){
  const st = document.getElementById('impStatus');
  const msg = t=>{ if(st) st.innerHTML = `<span class="spinner"></span> ${escH(t)}`; };
  msg('Lendo "'+file.name+'"…');
  try{
    const doc = await PPGImport.lerArquivoUniversal(file, {onProgresso:(s,p)=> msg('Reconhecendo o texto da imagem… ' + (p!=null ? Math.round(p*100)+'%' : ''))});
    if(!doc.folhas.length){ if(st) st.innerHTML = '<span style="color:var(--error)">Não encontrei dados nesse arquivo.</span>'; return; }
    IMP.doc = doc;
    IMP.fi = doc.folhas.reduce((b,f,i)=> f.linhas.length > doc.folhas[b].linhas.length ? i : b, 0);
    IMP.ini = ''; IMP.fim = ''; IMP.premio = ''; IMP.resolver = true;
    impPrepararFolha();
    impForm();
  }catch(e){ if(st) st.innerHTML = `<span style="color:var(--error)">${escH(e.message||'Não foi possível ler o arquivo.')}</span>`; }
}
function impPrepararFolha(){
  const f = IMP.doc.folhas[IMP.fi];
  IMP.header = PPGImport.sugerirCabecalho(f.linhas);
  IMP.nome = PPGImport.nomeCampanhaSugerido(IMP.doc.nome, f.nome);
  IMP.manual = {};
  impRecalcular();
}
function impRecalcular(){
  const f = IMP.doc.folhas[IMP.fi];
  IMP.mapa = PPGImport.sugerirMapeamento(f.linhas, IMP.header);
  IMP.extras = new Set();
  const grupos = PPGImport.analisarCores(f, IMP.header);
  IMP.cores = new Set(IMP.mapa.ganhador == null ? grupos.filter(g=>g.proporcao <= 0.35).map(g=>g.cor) : []);
}
function impAmostra(f, c){
  for(let i = IMP.header + 1; i < f.linhas.length; i++){ const v = String(f.linhas[i][c] == null ? '' : f.linhas[i][c]).trim(); if(v) return v.length > 26 ? v.slice(0,26)+'…' : v; }
  return '';
}
function impOpcoesColuna(f, sel){
  const nCols = Math.max(0, ...f.linhas.map(r=>r.length));
  let h = '<option value="">— não usar —</option>';
  for(let c = 0; c < nCols; c++){
    const cab = IMP.header >= 0 ? String(f.linhas[IMP.header][c] == null ? '' : f.linhas[IMP.header][c]).trim() : '';
    const am = impAmostra(f, c);
    h += `<option value="${c}"${sel === c ? ' selected' : ''}>${impLetra(c)} · ${escH(cab || '(sem título)')}${am ? ' — ex.: ' + escH(am) : ''}</option>`;
  }
  return h;
}
function impForm(){
  const r = impRoot(); if(!r || !IMP.doc) return;
  const f = IMP.doc.folhas[IMP.fi];
  const nCols = Math.max(0, ...f.linhas.map(x=>x.length));
  const usadas = new Set(Object.values(IMP.mapa));
  const grupos = PPGImport.analisarCores(f, IMP.header);
  const temRoster = EMPRESA.colaboradores && EMPRESA.colaboradores.length;
  const optHeader = `<option value="-1"${IMP.header < 0 ? ' selected' : ''}>Sem cabeçalho (a primeira linha já é um participante)</option>` +
    f.linhas.slice(0, 25).map((l,i)=>`<option value="${i}"${IMP.header === i ? ' selected' : ''}>Linha ${f.linhaOriginal ? f.linhaOriginal[i] : i+1} — ${escH(l.filter(x=>String(x).trim()).slice(0,4).join(' | ').slice(0,70))}</option>`).join('');
  const coresHtml = grupos.length
    ? grupos.map(g=>{
        const nomes = g.linhas.slice(0,3).map(i=>{ const row = f.linhas[i]; return IMP.mapa.nome != null ? row[IMP.mapa.nome] : row.find(x=>String(x).trim()); }).filter(Boolean).join(', ');
        return `<label class="imp-cor"><input type="checkbox" data-imp="cor" data-cor="${g.cor}" ${IMP.cores.has(g.cor)?'checked':''}><span class="imp-swatch" style="background:${g.cor}"></span><span><b>${g.qtd}</b> linha(s) com essa cor${nomes ? ' — ex.: ' + escH(nomes) : ''}</span></label>`;
      }).join('')
    : `<p class="hint" style="margin:0;">Nenhuma célula colorida encontrada nesta aba${IMP.doc.tipo === 'planilha' ? '' : ' (cores só existem em planilhas Excel .xlsx)'}.</p>`;
  const extrasHtml = Array.from({length:nCols}, (_,c)=>c).filter(c=>!usadas.has(c)).map(c=>{
    const cab = IMP.header >= 0 ? String(f.linhas[IMP.header][c] == null ? '' : f.linhas[IMP.header][c]).trim() : '';
    return `<label class="imp-chip"><input type="checkbox" data-imp="extra" data-col="${c}" ${IMP.extras.has(c)?'checked':''}> ${impLetra(c)} · ${escH(cab || '(sem título)')}</label>`;
  }).join('') || '<span class="hint">Todas as colunas já foram usadas acima.</span>';

  r.innerHTML = `
    <div class="imp-bar"><div><i data-lucide="file-check-2"></i> <b>${escH(IMP.doc.nome)}</b> <span class="hint">· ${IMP.doc.tipo} · ${f.linhas.length} linha(s) na aba</span></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;"><button type="button" class="btn btn-outline btn-sm" data-impacao="perguntas"><i data-lucide="help-circle"></i> Importar também as perguntas</button><button type="button" class="btn btn-outline btn-sm" data-impacao="trocar"><i data-lucide="refresh-cw"></i> Trocar arquivo</button></div></div>
    ${(IMP.doc.avisos||[]).map(a=>`<div class="imp-aviso"><i data-lucide="alert-triangle"></i> ${escH(a)}</div>`).join('')}

    <div class="imp-passo"><span class="imp-num">1</span> Onde estão os dados?</div>
    <div class="form-grid">
      ${IMP.doc.folhas.length > 1 ? `<div class="field"><label>Aba a importar</label><select data-imp="folha">${IMP.doc.folhas.map((x,i)=>`<option value="${i}"${i===IMP.fi?' selected':''}>${escH(x.nome)} (${x.linhas.length} linhas)</option>`).join('')}</select></div>` : ''}
      <div class="field${IMP.doc.folhas.length > 1 ? '' : ' full'}"><label>Linha dos títulos das colunas</label><select data-imp="header">${optHeader}</select></div>
    </div>

    <div class="imp-passo"><span class="imp-num">2</span> O que é cada coluna? <span class="hint">(já sugeri — corrija se precisar)</span></div>
    <div class="form-grid">
      ${IMP_PAPEIS.map(p=>`<div class="field"><label>${escH(PPGImport.ROTULOS[p])}</label><select data-imp="map" data-papel="${p}">${impOpcoesColuna(f, IMP.mapa[p])}</select></div>`).join('')}
    </div>
    <div class="field" style="margin-top:10px;"><label>Guardar também estas colunas (opcional)</label><div class="imp-chips">${extrasHtml}</div></div>

    <div class="imp-passo"><span class="imp-num">3</span> Sobre a campanha</div>
    <div class="form-grid">
      <div class="field"><label>Nome da campanha</label><input type="text" data-imp="campo" data-campo="nome" value="${escH(IMP.nome)}" placeholder="Ex: PPG 2023.1 – Segurança da Informação"></div>
      <div class="field"><label>Prêmio padrão dos ganhadores (opcional)</label><input type="text" data-imp="campo" data-campo="premio" value="${escH(IMP.premio)}" placeholder="Ex: Vale-compras R$ 150,00"></div>
      <div class="field"><label>Início (opcional)</label><input type="date" data-imp="campo" data-campo="ini" value="${escH(IMP.ini)}"></div>
      <div class="field"><label>Quando terminou <span style="color:var(--error)">*</span></label><input type="date" data-imp="campo" data-campo="fim" value="${escH(IMP.fim)}"><div class="hint">Obrigatório: a data é usada na regra de quem ganhou nos últimos 2 anos.</div></div>
    </div>

    <div class="imp-passo"><span class="imp-num">4</span> Quem foram os ganhadores?</div>
    <p class="hint" style="margin:0 0 8px;">${IMP.mapa.ganhador != null ? 'Estou usando a coluna “Ganhador” (Sim/Não). ' : ''}Se os ganhadores estão <b>pintados</b> na planilha, marque a cor abaixo. Você também pode ajustar linha a linha na prévia.</p>
    <div class="imp-cores">${coresHtml}</div>
    ${temRoster ? `<label class="imp-chip" style="margin-top:12px;"><input type="checkbox" data-imp="resolver" ${IMP.resolver?'checked':''}> Completar a matrícula pelo nome quando a planilha não tiver (compara com o quadro atual de colaboradores)</label>` : ''}

    <div class="imp-passo"><span class="imp-num">5</span> Prévia — confira antes de salvar</div>
    <div id="impPrevia"></div>
    <div class="imp-acoes"><button type="button" class="btn btn-primary" id="impBtnConfirmar" data-impacao="confirmar"><i data-lucide="check"></i> Importar para o histórico</button>
      <button type="button" class="btn btn-outline" data-impacao="trocar">Cancelar</button></div>`;
  impPrevia();
  if(window.lucide) lucide.createIcons();
}
function impRegistros(){
  const f = IMP.doc.folhas[IMP.fi];
  const regs = PPGImport.montarRegistros(f, {headerIdx: IMP.header, mapa: IMP.mapa, campanhaNome: IMP.nome, periodoInicio: IMP.ini, periodoFim: IMP.fim, premioPadrao: IMP.premio, coresGanhador: [...IMP.cores], colunasExtras: [...IMP.extras], manual: IMP.manual});
  let resolvidos = 0;
  if(IMP.resolver && EMPRESA.colaboradores && EMPRESA.colaboradores.length) resolvidos = PPGImport.resolverMatriculasPorNome(regs, EMPRESA.colaboradores);
  return {regs, resolvidos};
}
function impResumoHtml(regs, resolvidos){
  const gan = regs.filter(r=>r.ganhador).length, semMat = regs.filter(r=>!r.matricula).length;
  return `<div class="imp-pills"><span class="imp-pill"><b>${regs.length}</b> participante(s)</span><span class="imp-pill ok"><b>${gan}</b> ganhador(es)</span>` +
    (semMat ? `<span class="imp-pill warn"><b>${semMat}</b> sem matrícula (não contam na regra dos 2 anos)</span>` : '') +
    (resolvidos ? `<span class="imp-pill"><b>${resolvidos}</b> matrícula(s) completada(s) pelo nome</span>` : '') + `</div>`;
}
function impPrevia(){
  const box = document.getElementById('impPrevia'); if(!box || !IMP.doc) return;
  const {regs, resolvidos} = impRegistros();
  const mostrar = regs.slice(0, 200);
  box.innerHTML = `<div id="impResumo">${impResumoHtml(regs, resolvidos)}</div>` + (regs.length ? `
    <div class="table-wrap imp-tabela"><table><thead><tr><th>Ganhador</th><th>Matrícula</th><th>Nome</th><th>Setor</th><th>Filial</th><th>%</th><th>Prêmio</th></tr></thead><tbody>
    ${mostrar.map(r=>`<tr class="${r.ganhador?'imp-ganhou':''}"><td><label class="imp-check"><input type="checkbox" data-imp="manual" data-linha="${r._linha}" ${r.ganhador?'checked':''}><span>${r._motivo === 'cor' ? 'pela cor' : r._motivo === 'coluna' ? 'pela coluna' : r._motivo === 'manual' ? 'manual' : ''}</span></label></td><td>${escH(r.matricula)||'<span class="hint">—</span>'}</td><td>${escH(r.nome)}</td><td>${escH(r.setor)}</td><td>${escH(r.filial)}</td><td>${r.percentualAcertos === '' ? '' : escH(r.percentualAcertos) + '%'}</td><td>${escH(r.premio)}</td></tr>`).join('')}
    </tbody></table></div>${regs.length > 200 ? `<p class="hint">Mostrando as primeiras 200 de ${regs.length} linhas — todas serão importadas.</p>` : ''}`
    : `<p class="hint" style="color:var(--error)">Nenhum participante encontrado com esta configuração. Confira a linha dos títulos e as colunas de matrícula e nome.</p>`);
}
function impOnChange(e){
  const t = e.target, k = t.dataset && t.dataset.imp; if(!k) return;
  if(k === 'arquivo'){ if(t.files && t.files[0]){ impAbrir(t.files[0]); t.value = ''; } return; }
  if(!IMP.doc) return;
  if(k === 'folha'){ IMP.fi = +t.value; impPrepararFolha(); impForm(); return; }
  if(k === 'header'){ IMP.header = +t.value; impRecalcular(); impForm(); return; }
  if(k === 'map'){ const p = t.dataset.papel; if(t.value === '') delete IMP.mapa[p]; else { IMP.mapa[p] = +t.value; IMP.extras.delete(+t.value); } impForm(); return; }
  if(k === 'extra'){ const c = +t.dataset.col; if(t.checked) IMP.extras.add(c); else IMP.extras.delete(c); impPrevia(); return; }
  if(k === 'cor'){ if(t.checked) IMP.cores.add(t.dataset.cor); else IMP.cores.delete(t.dataset.cor); impPrevia(); return; }
  if(k === 'campo'){ IMP[t.dataset.campo] = t.value; return; }
  if(k === 'resolver'){ IMP.resolver = t.checked; impPrevia(); return; }
  if(k === 'manual'){
    IMP.manual[+t.dataset.linha] = t.checked;
    const {regs, resolvidos} = impRegistros(); const rs = document.getElementById('impResumo'); if(rs) rs.innerHTML = impResumoHtml(regs, resolvidos);
    const tr = t.closest('tr'); if(tr) tr.classList.toggle('imp-ganhou', t.checked);
  }
}
function impValidar(regs){
  if(!regs.length) return 'Nenhum participante encontrado — confira a linha dos títulos e as colunas.';
  if(regs.some(r=>!r.campanha)) return 'Informe o nome da campanha.';
  if(!regs.some(r=>PPGImport.normalizarData(r.periodoFim))) return 'Informe quando a campanha terminou (a data é usada na regra dos 2 anos).';
  return '';
}
function impAcao(a){
  if(a === 'perguntas'){ impPerguntasDoArquivo(); return; }
  if(a === 'trocar'){ if(IMP.enviando) return; impInicio(); return; }
  if(a === 'confirmar') impConfirmar();
}
async function impConfirmar(){
  if(IMP.enviando || !IMP.doc) return;
  const {regs} = impRegistros();
  const erro = impValidar(regs);
  if(erro){ showToast(erro, 'warning'); return; }
  const btn = document.getElementById('impBtnConfirmar'); const rotulo = btn.innerHTML;
  IMP.enviando = true; btn.disabled = true;
  const f = IMP.doc.folhas[IMP.fi];
  const linhas = regs.map(r=>({campanha:r.campanha, periodoInicio:PPGImport.normalizarData(r.periodoInicio)||'', periodoFim:PPGImport.normalizarData(r.periodoFim)||'', matricula:r.matricula, nome:r.nome, setor:r.setor, filial:r.filial, funcao:r.funcao, percentualAcertos:r.percentualAcertos, ganhador:r.ganhador, premio:r.premio, extras:r.extras}));
  let enviadas = 0;
  for(let i = 0; i < linhas.length; i += 400){
    btn.textContent = `Enviando… ${Math.min(i+400, linhas.length)} de ${linhas.length}`;
    const resp = await backendCall('importarHistorico', {linhas: linhas.slice(i, i+400), arquivo: IMP.doc.nome, aba: f.nome});
    if(!resp.ok){ IMP.enviando = false; btn.disabled = false; btn.innerHTML = rotulo; showToast((resp.erro || 'Não foi possível importar.') + (enviadas ? ` (${enviadas} linha(s) já tinham sido gravadas)` : ''), 'warning'); return; }
    enviadas += resp.importadas || 0;
  }
  IMP.enviando = false;
  logAction('Histórico importado', `${enviadas} linha(s) de "${IMP.doc.nome}"`);
  const gan = regs.filter(r=>r.ganhador).length;
  showCelebrationPopup('Histórico importado!', `${enviadas} participação(ões) de “${escH(regs[0].campanha)}” foram guardadas${gan ? `, com ${gan} ganhador(es) que já contam na regra dos 2 anos` : ''}.`, 'archive');
  _ultimaAssinatura = null; sincronizarDadosDoServidor(true);
  impInicio(); renderHistoricoImportado();
}

/* ======================= PÁGINA INICIAL DA QUALIDADE: rodada, atalhos, setor/filial e pop-ups ======================= */
let _msgsPendentes = null, _msgsTs = 0;
function rodadaDestaque(){
  const abertas = campaigns.filter(c=>campaignAccessStatus(c) === 'aberta');
  const lista = abertas.length ? abertas : campaigns;
  return [...lista].sort((a,b)=> new Date(b.inicio||0) - new Date(a.inicio||0))[0] || null;
}
function statusRodada(c){
  const roster = (EMPRESA.colaboradores || []).filter(c=>!c.qualidade);   // a Qualidade não participa
  const resp = new Set(participants.filter(p=>p.campaignId === c.id).map(p=>matK(p.matricula)));
  return {roster, respondeu: roster.filter(r=>resp.has(matK(r.matricula))), faltam: roster.filter(r=>!resp.has(matK(r.matricula))), totalRespostas: resp.size};
}
function renderHomeQualidade(){
  const box = document.getElementById('homeRodada'); if(!box) return;
  if(!_dadosCarregados){ box.innerHTML = '<div class="rodada-card"><div class="skel skel-l1"></div><div class="skel skel-bar"></div><div class="skel skel-l2"></div></div>'; return; }
  const c = rodadaDestaque();
  if(!c){
    box.innerHTML = `<div class="rodada-card vazio"><div><h3>Nenhuma campanha ainda</h3><p class="hint">Crie a primeira rodada do PPG para começar a receber respostas.</p></div><button type="button" class="btn btn-primary" onclick="goToSection('nova')"><i data-lucide="plus-circle"></i> Criar campanha</button></div>`;
    return;
  }
  const acesso = campaignAccessStatus(c), st = statusRodada(c);
  const total = st.roster.length, n = st.respondeu.length, pct = total ? Math.round(n / total * 100) : 0;
  const quando = acesso === 'aberta'
    ? `<span class="countdown"><i data-lucide="hourglass"></i><b data-countdown="${escH(c.fim)}">${tempoRestanteTexto(c.fim)}</b><small>para encerrar</small></span>`
    : acesso === 'nao_iniciada'
      ? `<span class="countdown"><i data-lucide="calendar-clock"></i><b data-countdown="${escH(c.inicio)}">${tempoRestanteTexto(c.inicio)}</b><small>para começar</small></span>`
      : `<span class="countdown fim"><i data-lucide="flag"></i><b>Encerrada</b><small>${escH(fmtPeriodoValor(c.fim))}</small></span>`;
  box.innerHTML = `<div class="rodada-card">
    <div class="rodada-top"><div><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">${statusBadge(c.status)}<span class="hint">${escH(fmtPeriodoValor(c.inicio))} → ${escH(fmtPeriodoValor(c.fim))}</span></div><h3>${escH(c.nome)}</h3></div>${quando}</div>
    ${total ? `<div class="progress"><div class="progress-fill" style="width:${pct}%"></div></div>
      <div class="rodada-stats"><b>${n}</b> de <b>${total}</b> colaboradores já responderam (<b>${pct}%</b>) · <b>${st.faltam.length}</b> ainda faltam</div>`
      : `<div class="rodada-stats"><b>${st.totalRespostas}</b> resposta(s) recebida(s) <span class="hint">· carregando o quadro de colaboradores…</span></div>`}
    <div class="rodada-acoes">
      <button type="button" class="btn btn-primary btn-sm" onclick="abrirQuemFalta()"><i data-lucide="user-x"></i> Quem falta responder</button>
      <button type="button" class="btn btn-outline btn-sm" onclick="kpiPopup('participantes')"><i data-lucide="users"></i> Quem já respondeu</button>
      <button type="button" class="btn btn-outline btn-sm" onclick="openShareModal('${escH(c.id)}')"><i data-lucide="share-2"></i> Divulgar</button>
    </div></div>`;
}
function renderHomeAtalhos(){
  const el = document.getElementById('homeAtalhos'); if(!el) return;
  const itens = [];
  const semSorteio = campaigns.filter(c=>campaignAccessStatus(c) === 'encerrada' && !c.ganhadores && c.status !== 'finalizada');
  if(semSorteio.length) itens.push({ico:'dices', cls:'warn', txt:`${semSorteio.length} rodada(s) encerrada(s) aguardando o sorteio`, acao:"goToSection('sorteio')"});
  const encerrando = campaigns.filter(c=>{ if(campaignAccessStatus(c) !== 'aberta') return false; const d = (new Date(c.fim) - new Date()) / 86400000; return d > 0 && d <= 3; });
  if(encerrando.length) itens.push({ico:'megaphone', txt:`${encerrando.length} rodada(s) encerram em até 3 dias — divulgue de novo`, acao:"goToSection('divulgacao')"});
  if(_msgsPendentes > 0) itens.push({ico:'message-circle-question', cls:'warn', txt:`${_msgsPendentes} mensagem(ns) de colaboradores esperando resposta`, acao:"goToSection('fale-conosco')"});
  const prox = campaigns.filter(c=>campaignAccessStatus(c) === 'nao_iniciada').sort((a,b)=> new Date(a.inicio) - new Date(b.inicio))[0];
  if(prox) itens.push({ico:'calendar-clock', txt:`Próxima rodada: “${prox.nome}” começa em ${tempoRestanteTexto(prox.inicio)}`, acao:"goToSection('campanhas')"});
  if(campaigns.length && !campaigns.some(c=>campaignAccessStatus(c) === 'aberta') && !prox) itens.push({ico:'plus-circle', txt:'Nenhuma rodada em andamento ou programada — crie a próxima campanha', acao:"goToSection('nova')"});
  el.innerHTML = itens.length
    ? itens.map(i=>`<button type="button" class="atalho ${i.cls||''}" onclick="${i.acao}"><i data-lucide="${i.ico}"></i><span>${escH(i.txt)}</span><i data-lucide="chevron-right" class="atalho-seta"></i></button>`).join('')
    : (campaigns.length ? `<div class="atalho ok"><i data-lucide="check-circle-2"></i><span>Tudo em dia — nada pendente por aqui.</span></div>` : '');
}
function renderHomeSetorFilial(){
  const c = rodadaDestaque(), st = c ? statusRodada(c) : null;
  [['setor','homeSetor'],['filial','homeFilial']].forEach(([campo, id])=>{
    const el = document.getElementById(id); if(!el) return;
    if(!c || !st.roster.length){ el.innerHTML = '<p class="hint">Sem dados ainda — o quadro de colaboradores ou a rodada ainda não carregaram.</p>'; return; }
    const grupos = {};
    st.roster.forEach(r=>{ const k = r[campo] || '(não informado)'; (grupos[k] = grupos[k] || {total:0, resp:0}).total++; });
    st.respondeu.forEach(r=>{ grupos[r[campo] || '(não informado)'].resp++; });
    el.innerHTML = Object.entries(grupos).sort((a,b)=> (b[1].resp/b[1].total) - (a[1].resp/a[1].total) || b[1].total - a[1].total).map(([k,g])=>{
      const p = Math.round(g.resp / g.total * 100);
      return `<button type="button" class="part-row" onclick="popGrupo('${campo}','${encodeURIComponent(k)}')"><span class="part-nome">${escH(k)}</span><span class="part-barra"><span style="width:${p}%"></span></span><span class="part-num">${g.resp}/${g.total} · ${p}%</span></button>`;
    }).join('');
  });
}
async function carregarMsgsPendentes(){
  if(currentRole !== 'qualidade' || !currentUser || !currentUser.token) return;
  const agora = Date.now(); if(_msgsTs && agora - _msgsTs < 60000) return; _msgsTs = agora;
  const r = await backendCall('listarDuvidas');
  if(r && r.ok){ _msgsPendentes = (r.duvidas || []).filter(d=>d.status === 'pendente').length; renderHomeAtalhos(); if(window.lucide) lucide.createIcons(); }
}
function renderHomeExtras(){
  try{ renderHomeQualidade(); renderHomeAtalhos(); renderHomeSetorFilial(); carregarMsgsPendentes(); }catch(e){ console.warn('Painel inicial (extras):', e); }
}
setInterval(()=>{ document.querySelectorAll('[data-countdown]').forEach(el=>{ el.textContent = tempoRestanteTexto(el.dataset.countdown); }); }, 30000);

function copiarTexto(t, ok){
  const fim = ()=> showToast(ok || 'Copiado!', 'success');
  if(navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(fim, ()=> showToast('Não foi possível copiar.', 'warning'));
  else { const ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta); ta.select(); try{ document.execCommand('copy'); fim(); }catch(e){ showToast('Não foi possível copiar.', 'warning'); } ta.remove(); }
}
window.abrirQuemFalta = function(){
  const c = rodadaDestaque(); if(!c){ showToast('Ainda não há campanha.', 'warning'); return; }
  const st = statusRodada(c);
  if(!st.roster.length){ showToast('O quadro de colaboradores ainda está carregando. Tente de novo em instantes.', 'warning'); return; }
  const setores = [...new Set(st.roster.map(r=>r.setor).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR'));
  const filiais = [...new Set(st.roster.map(r=>r.filial).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR'));
  const corpo = document.createElement('div');
  corpo.innerHTML = `<div class="form-grid" style="margin-bottom:12px;">
    <div class="field"><label>Setor</label><select data-qf="setor"><option value="">Todos</option>${setores.map(s=>`<option>${escH(s)}</option>`).join('')}</select></div>
    <div class="field"><label>Filial</label><select data-qf="filial"><option value="">Todas</option>${filiais.map(s=>`<option>${escH(s)}</option>`).join('')}</select></div>
    <div class="field full"><label>Buscar por nome ou matrícula</label><input type="text" data-qf="busca" placeholder="Digite para filtrar…"></div></div>
    <div id="qfLista"></div>`;
  const rodape = document.createElement('div'); rodape.className = 'pop-actions';
  rodape.innerHTML = `<span class="hint" id="qfContagem"></span><div style="display:flex;gap:8px;flex-wrap:wrap;"><button type="button" class="btn btn-outline btn-sm" id="qfCopiar"><i data-lucide="copy"></i> Copiar lista</button><button type="button" class="btn btn-outline btn-sm" id="qfCsv"><i data-lucide="download"></i> Baixar .csv</button>${campaignAccessStatus(c) === 'aberta' ? '<button type="button" class="btn btn-primary btn-sm" id="qfLembrar"><i data-lucide="mail"></i> Enviar lembrete por e-mail</button>' : ''}</div>`;
  let filtrados = [];
  const aplicar = ()=>{
    const f = {setor: corpo.querySelector('[data-qf=setor]').value, filial: corpo.querySelector('[data-qf=filial]').value, busca: PPGImport.norm(corpo.querySelector('[data-qf=busca]').value)};
    filtrados = st.faltam.filter(r=> (!f.setor || r.setor === f.setor) && (!f.filial || r.filial === f.filial) && (!f.busca || PPGImport.norm(r.nome).includes(f.busca) || String(r.matricula).includes(f.busca)));
    corpo.querySelector('#qfLista').innerHTML = tabelaHtml(['Nome','Matrícula','Setor','Filial'], filtrados.slice(0,300).map(r=>[escH(r.nome), escH(r.matricula), escH(r.setor||''), escH(r.filial||'')]), 'Ninguém falta neste filtro') + (filtrados.length > 300 ? `<p class="hint">Mostrando 300 de ${filtrados.length} — use os filtros ou baixe o .csv completo.</p>` : '');
    rodape.querySelector('#qfContagem').innerHTML = `<b>${filtrados.length}</b> de ${st.faltam.length} que faltam responder`;
  };
  corpo.addEventListener('input', aplicar); corpo.addEventListener('change', aplicar);
  abrirMiniPagina({titulo:'Quem ainda não respondeu', subtitulo:`${c.nome} · ${st.respondeu.length} de ${st.roster.length} já responderam`, corpo, rodape, largura:820});
  rodape.querySelector('#qfCopiar').addEventListener('click', ()=> copiarTexto(filtrados.map(r=>`${r.nome} (${r.matricula}) — ${r.setor||''} / ${r.filial||''}`).join('\n'), 'Lista copiada!'));
  rodape.querySelector('#qfCsv').addEventListener('click', ()=> downloadCSV('quem_falta_responder.csv', ['Nome','Matrícula','Setor','Filial'], filtrados.map(r=>[r.nome, r.matricula, r.setor||'', r.filial||''])));
  const bl = rodape.querySelector('#qfLembrar'); if(bl) bl.addEventListener('click', ()=> lembrarQuemFalta(c, bl));
  aplicar();
};
window.popGrupo = function(campo, kEnc){
  const k = decodeURIComponent(kEnc), c = rodadaDestaque(); if(!c) return;
  const st = statusRodada(c); const val = r=> (r[campo] || '(não informado)') === k;
  const ja = st.respondeu.filter(val), falta = st.faltam.filter(val);
  const lin = r=>[escH(r.nome), escH(r.matricula), escH(r.setor||''), escH(r.filial||'')];
  abrirMiniPagina({titulo:`${campo === 'setor' ? 'Setor' : 'Filial'}: ${k}`, subtitulo:`${c.nome} · ${ja.length} de ${ja.length + falta.length} responderam`, largura:760,
    corpo:`<h4 class="pop-sub">Ainda faltam (${falta.length})</h4>${tabelaHtml(['Nome','Matrícula','Setor','Filial'], falta.map(lin), 'Todos já responderam')}<h4 class="pop-sub">Já responderam (${ja.length})</h4>${tabelaHtml(['Nome','Matrícula','Setor','Filial'], ja.map(lin), 'Ninguém respondeu ainda.')}`});
};
window.kpiPopup = function(tipo){
  const c = rodadaDestaque();
  const periodo = x=> `${escH(fmtPeriodoValor(x.inicio))} – ${escH(fmtPeriodoValor(x.fim))}`;
  const tabCamp = lista=> tabelaHtml(['Campanha','Período','Status','Participantes'], lista.map(x=>[escH(x.nome), periodo(x), statusBadge(x.status), campaignParticipants(x.id).length]), 'Nenhuma campanha aqui.');
  let o = null;
  if(tipo === 'total') o = {titulo:'Todas as campanhas', corpo:tabCamp(campaigns)};
  else if(tipo === 'andamento') o = {titulo:'Campanhas em andamento', corpo:tabCamp(campaigns.filter(x=>x.status === 'andamento'))};
  else if(tipo === 'programadas') o = {titulo:'Campanhas programadas', corpo:tabCamp(campaigns.filter(x=>x.status === 'programada'))};
  else if(tipo === 'participantes' && c){
    const ps = campaignParticipants(c.id);
    o = {titulo:'Quem já respondeu', subtitulo:`${c.nome} · ${ps.length} resposta(s)`, corpo:tabelaHtml(['Nome','Setor','Filial','Acertos','Respondeu em'], ps.map(p=>[escH(p.nome), escH(p.setor||''), escH(p.filial||''), p.pct == null ? '—' : p.pct + '%', escH(fmtDateTime(new Date(p.data)))]), 'Ninguém respondeu ainda.'), rodape:`<div class="pop-actions"><span></span><button type="button" class="btn btn-outline btn-sm" onclick="fecharMiniPagina();goToResultadosLatest()">Abrir tela completa</button></div>`};
  } else if(tipo === 'elegiveis' && c){
    const ev = evaluateEligibility(c.id);
    o = {titulo:'Elegíveis ao sorteio', subtitulo:`${c.nome} · ${ev.eligible.length} elegível(is) · ${ev.excluded.length} fora`, corpo:tabelaHtml(['Nome','Setor','Filial','Função'], ev.eligible.map(p=>[escH(p.nome), escH(p.setor||''), escH(p.filial||''), escH(p.funcao||'')]), 'Ninguém elegível por enquanto.'), rodape:`<div class="pop-actions"><span></span><button type="button" class="btn btn-outline btn-sm" onclick="fecharMiniPagina();goToElegiveisLatest()">Abrir tela completa</button></div>`};
  } else if(tipo === 'ganhadores'){
    const linhas = []; campaigns.filter(x=>x.ganhadores && x.ganhadores.length).forEach(x=> x.ganhadores.forEach(g=> linhas.push([escH(x.nome), escH(g.nome), escH(g.setor||''), escH(g.filial||'')])));
    o = {titulo:'Ganhadores sorteados', corpo:tabelaHtml(['Campanha','Ganhador','Setor','Filial'], linhas, 'Nenhum sorteio realizado ainda.')};
  }
  if(!o){ showToast('Ainda não há dados para mostrar.', 'warning'); return; }
  abrirMiniPagina(Object.assign({largura:820}, o));
};


/* ======================= CAMPANHAS ANTIGAS (importadas) — entram no Histórico, Relatórios, Auditoria e Resultados ======================= */
function hashTxt(s){ let h = 5381; s = String(s); for(let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return Math.abs(h).toString(36); }
function pctTxt(v){ return (v == null || v === '' || isNaN(v)) ? '—' : v + '%'; }
function ordenarPorFim(lista){ return [...lista].sort((a,b)=> new Date(a.fim || a.inicio || 0) - new Date(b.fim || b.inicio || 0)); }
function todasCampanhas(){ return [...campaigns, ...campanhasAntigas]; }
function todosParticipantes(){ return [...participants, ...participantesAntigos]; }
function construirAntigas(hist){
  const grupos = {};
  (hist || []).forEach(h=>{
    const nome = String(h.campanha || '').trim() || '(sem nome)';
    const fim = (window.PPGImport ? PPGImport.normalizarData(h.periodoFim) : '') || '';
    const ini = (window.PPGImport ? PPGImport.normalizarData(h.periodoInicio) : '') || '';
    const k = nome + '|' + fim;
    const g = grupos[k] = grupos[k] || {nome, fim, ini:'', linhas:[]};
    g.linhas.push(h); if(!g.ini && ini) g.ini = ini;
  });
  const cs = [], ps = [];
  Object.keys(grupos).forEach(k=>{
    const g = grupos[k], id = 'hist:' + hashTxt(k);
    const fimISO = g.fim ? g.fim + 'T23:59' : '', iniISO = (g.ini || g.fim) ? (g.ini || g.fim) + 'T00:00' : '';
    const ganhadores = g.linhas.filter(h=>String(h.ganhador).toLowerCase() === 'sim').map(h=>({nome:h.nome, matricula:String(h.matricula || ''), setor:h.setor || '', filial:h.filial || '', funcao:h.funcao || '', premio:h.premio || ''}));
    cs.push({id, nome:g.nome, descricao:'Campanha anterior ao sistema (importada)', objetivo:'', inicio:iniISO, fim:fimISO, status:'finalizada', premio:(ganhadores.find(w=>w.premio) || {}).premio || '', qtdGanhadores:ganhadores.length, criterios:'', questoes:[], ganhadores, importada:true, arquivo:g.linhas[0].origemArquivo || '', importadoEm:g.linhas[0].importadoEm || ''});
    const dt = fimISO ? new Date(fimISO) : new Date(g.linhas[0].importadoEm || Date.now());
    g.linhas.forEach(h=>{
      const n = (h.percentualAcertos === '' || h.percentualAcertos == null) ? null : Number(h.percentualAcertos);
      ps.push({campaignId:id, matricula:String(h.matricula || ''), nome:h.nome || '', setor:h.setor || '', filial:h.filial || '', funcao:h.funcao || '', cargo:h.funcao || '', pct:(n == null || isNaN(n)) ? null : n, acertosQtd:null, totalQuestoes:null, data:dt, dataInicio:null, dataFim:dt, importada:true});
    });
  });
  return {campanhas:cs, participantes:ps};
}

/* ======================= CARREGAMENTO RÁPIDO E CONFIÁVEL ======================= */
let _ultimoSyncOk = 0, _dadosCarregados = false, _snapPendente = null, _rosterEm = 0, _aplicouNoLogin = false;
const CACHE_SNAP = 'ppg_snap_v1';
function salvarCacheSnapshot(resp){
  try{ if(!currentUser) return; localStorage.setItem(CACHE_SNAP, JSON.stringify({mat:currentUser.matricula, em:Date.now(), snap:{campanhas:resp.campanhas, respostas:resp.respostas, historico:resp.historico, perguntas:resp.perguntas || null}})); }
  catch(e){ try{ localStorage.removeItem(CACHE_SNAP); }catch(_){} }
}
function limparCacheSnapshot(){ try{ localStorage.removeItem(CACHE_SNAP); }catch(e){} }
/* Reabre o app com os últimos dados já na tela (e atualiza por trás) — sem tela vazia esperando o servidor. */
function carregarCacheSnapshot(){
  try{
    const c = JSON.parse(localStorage.getItem(CACHE_SNAP) || 'null');
    if(!c || !currentUser || c.mat !== currentUser.matricula || Date.now() - c.em > 12*3600*1000) return false;
    aplicarSnapshot(Object.assign({ok:true}, c.snap)); _ultimoSyncOk = c.em;
    return true;
  }catch(e){ return false; }
}
function esqueletoHtml(){ return `<div class="skel-wrap"><div class="skel skel-l1"></div><div class="skel skel-l2"></div><div class="skel skel-card"></div></div>`; }

function aplicarSnapshot(resp){
  _ultimoSyncOk = Date.now(); _falhasSync = 0;
  if(resp.colaboradores){
    EMPRESA.colaboradores = resp.colaboradores.map(c=>({matricula:String(c.matricula), nome:c.nome, setor:c.setor, filial:c.filial, funcao:c.funcao, qualidade:!!c.qualidade, temEmail:!!c.temEmail}));
    _rosterEm = Date.now(); _renderPendente = true;
  }
  const primeira = !_dadosCarregados;
  _dadosCarregados = true;
  const assinatura = JSON.stringify([resp.campanhas, resp.respostas, resp.historico, resp.perguntas || null]);
  if(assinatura === _ultimaAssinatura && !primeira){ atualizarIndicadorSync(); return false; }
  _ultimaAssinatura = assinatura;

  campaigns = (resp.campanhas || []).map(c=>({...c, id: String(c.id)}));
  campaigns.forEach(c=>{ try{ c.status = calcularStatusPorData(c); }catch(e){} });   // programada → andamento → encerrada (só exibição)
  if(resp.perguntas) questionBank = resp.perguntas.map(q=>({...q, codigo: String(q.codigo)}));
  participants = (resp.respostas || []).map(r=>({
    ...r, matricula: String(r.matricula), campaignId: String(r.campaignId),
    data: r.dataFim ? new Date(r.dataFim) : new Date(),
    dataInicio: r.dataInicio ? new Date(r.dataInicio) : null, dataFim: r.dataFim ? new Date(r.dataFim) : null
  }));
  historicoServidor = resp.historico || [];
  const antigas = construirAntigas(historicoServidor);
  campanhasAntigas = antigas.campanhas; participantesAntigos = antigas.participantes;
  const ganhosImportados = historicoServidor
    .filter(h => String(h.ganhador).toLowerCase() === 'sim')
    .map(h => ({matricula: String(h.matricula), data: new Date(h.periodoFim || h.importadoEm || Date.now())}));
  const ganhosAoVivo = [];
  campaigns.forEach(c=>{ if(c.ganhadores && c.ganhadores.length) c.ganhadores.forEach(g => ganhosAoVivo.push({matricula: String(g.matricula), data: new Date(c.fim)})); });
  wonHistory = [...ganhosImportados, ...ganhosAoVivo];
  salvarCacheSnapshot(resp);
  atualizarIndicadorSync();
  return true;
}
async function sincronizarDadosDoServidor(){
  if(sincronizando || !currentUser || !currentUser.token) return;
  sincronizando = true; atualizarIndicadorSync();
  try{
    const precisaQuadro = currentRole === 'qualidade' && (!(EMPRESA.colaboradores || []).length || Date.now() - _rosterEm > 300000);
    const resp = await backendCall('getSnapshot', {comColaboradores: precisaQuadro});
    if(!resp.ok){ if(!resp.sessaoExpirada) _falhasSync++; return; }
    if(aplicarSnapshot(resp)) renderSilencioso();
  }catch(e){
    _falhasSync++; console.warn("Não foi possível sincronizar com o servidor agora:", e);
  }finally{
    sincronizando = false; atualizarIndicadorSync();
  }
}
function iniciarSincronizacao(){
  _falhasSync = 0;
  if(_aplicouNoLogin) _aplicouNoLogin = false;   // os dados já vieram junto com o login
  else sincronizarDadosDoServidor();
  if(window._syncAtivo) return;
  window._syncAtivo = true;
  const ciclo = async ()=>{
    try{ if(currentUser && document.visibilityState === 'visible') await sincronizarDadosDoServidor(); }catch(e){}
    const base = currentRole === 'qualidade' ? 20000 : 30000;
    setTimeout(ciclo, base * Math.min(4, 1 + _falhasSync));   // servidor instável: espaça as tentativas
  };
  setTimeout(ciclo, 20000);
  document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState === 'visible' && currentUser) sincronizarDadosDoServidor(); });
}
function atualizarIndicadorSync(){
  const chip = document.getElementById('syncChip'), txt = document.getElementById('syncTxt'); if(!chip || !txt) return;
  let estado = 'ok', t;
  if(sincronizando){ estado = 'sync'; t = 'Atualizando…'; }
  else if(_falhasSync >= 2){ estado = 'erro'; t = _ultimoSyncOk ? 'Sem conexão · dados das ' + pad(new Date(_ultimoSyncOk).getHours()) + ':' + pad(new Date(_ultimoSyncOk).getMinutes()) : 'Sem conexão com o servidor'; }
  else if(!_ultimoSyncOk){ estado = 'sync'; t = 'Carregando…'; }
  else { const s = Math.round((Date.now() - _ultimoSyncOk) / 1000); t = s < 10 ? 'Atualizado agora' : s < 60 ? `Atualizado há ${s}s` : `Atualizado há ${Math.round(s/60)} min`; }
  chip.dataset.estado = estado; txt.textContent = t; chip.title = t + ' — clique para atualizar agora';
}
setInterval(atualizarIndicadorSync, 10000);
document.getElementById('syncChip')?.addEventListener('click', ()=>{ if(!currentUser) return; _ultimaAssinatura = null; sincronizarDadosDoServidor(); });

/* ======================= HISTÓRICO: campanhas antigas na linha do tempo ======================= */
function renderTimeline(){
  const el = document.getElementById('timeline'); if(!el) return;
  const reais = renderTimelineReais();
  const antigas = ordenarPorFim(campanhasAntigas).reverse();
  const htmlAnt = antigas.map(c=>{
    const ps = participantesAntigos.filter(p=>p.campaignId === c.id), gan = c.ganhadores || [];
    return `<div class="tl-item"><div class="tl-dot"></div><div class="tl-body">
      <h4>${escH(c.nome)} <span class="badge antiga" style="vertical-align:2px;">Campanha anterior</span></h4>
      <p>${c.fim ? escH(fmtPeriodoValor(c.fim)) : 'data não informada'}${c.arquivo ? ' · origem: ' + escH(c.arquivo) : ''}</p>
      <div class="tl-meta"><span><i data-lucide="users"></i> ${ps.length} participante(s)</span><span><i data-lucide="trophy"></i> ${gan.length} ganhador(es)</span></div>
      ${gan.length ? `<div class="tl-winners">${gan.slice(0,12).map(w=>`<span class="chip"><i data-lucide="trophy"></i> ${escH(w.nome)}${w.setor ? ' · ' + escH(w.setor) : ''}</span>`).join('')}${gan.length > 12 ? `<span class="chip">+${gan.length - 12}</span>` : ''}</div>` : '<div class="hint" style="margin-top:6px;">Ganhadores não informados na planilha.</div>'}
      <button type="button" class="btn btn-ghost btn-sm" style="margin-top:8px;" onclick="abrirHistoricoCampanha('${c.id}')"><i data-lucide="eye"></i> Ver detalhes</button>
    </div></div>`;
  }).join('');
  el.innerHTML = (reais ? `<h4 class="tl-grupo">Rodadas no sistema</h4>${reais}` : '') + (htmlAnt ? `<h4 class="tl-grupo">Campanhas anteriores ao sistema (importadas)</h4>${htmlAnt}` : '')
    || `<p style="color:var(--ink-soft); font-size:13px;">Nenhuma campanha encerrada ainda. As campanhas antigas que você importar aparecem aqui.</p>`;
}
window.abrirHistoricoCampanha = function(id){
  const c = campanhasAntigas.find(x=>x.id === id); if(!c) return;
  const ps = participantesAntigos.filter(p=>p.campaignId === id), gan = c.ganhadores || [];
  const perguntas = questionBank.filter(q=> String(q.origem || '').indexOf(c.nome) !== -1);
  const corpo = `<div class="imp-pills"><span class="imp-pill"><b>${ps.length}</b> participante(s)</span><span class="imp-pill ok"><b>${gan.length}</b> ganhador(es)</span><span class="imp-pill"><b>${perguntas.length}</b> pergunta(s) no banco</span></div>
    <p class="hint">${c.fim ? 'Terminou em ' + escH(fmtPeriodoValor(c.fim)) : 'Data de término não informada'}${c.arquivo ? ' · arquivo: ' + escH(c.arquivo) : ''}${c.premio ? ' · prêmio: ' + escH(c.premio) : ''}</p>
    <h4 class="pop-sub">Ganhadores</h4>${tabelaHtml(['Nome','Matrícula','Setor','Filial','Prêmio'], gan.map(w=>[escH(w.nome), escH(w.matricula), escH(w.setor), escH(w.filial), escH(w.premio)]), 'Ganhadores não informados.')}
    <h4 class="pop-sub">Participantes</h4>${tabelaHtml(['Nome','Matrícula','Setor','Filial','% acertos'], ps.slice(0,300).map(p=>[escH(p.nome), escH(p.matricula), escH(p.setor), escH(p.filial), pctTxt(p.pct)]), 'Sem participantes.')}${ps.length > 300 ? `<p class="hint">Mostrando 300 de ${ps.length}.</p>` : ''}`;
  const rodape = `<div class="pop-actions"><span class="hint">Campanha anterior ao sistema — importada de planilha</span><button type="button" class="btn btn-outline btn-sm" id="histCsv"><i data-lucide="download"></i> Baixar .csv</button></div>`;
  const b = abrirMiniPagina({titulo:c.nome, subtitulo:'Campanha anterior ao sistema', corpo, rodape, largura:860});
  b.querySelector('#histCsv').addEventListener('click', ()=> downloadCSV('campanha_antiga.csv', ['Nome','Matrícula','Setor','Filial','% acertos','Ganhador'], ps.map(p=>[p.nome, p.matricula, p.setor, p.filial, p.pct == null ? '' : p.pct, gan.some(w=>matK(w.matricula) && matK(w.matricula) === matK(p.matricula)) || gan.some(w=>w.nome === p.nome && !w.matricula) ? 'Sim' : 'Não'])));
};

/* ======================= BANCO DE PERGUNTAS INTELIGENTE ======================= */
const PREV = {lista:[], categoria:'', tema:'', avisos:[], usada:false, campanhaUso:'', dataUso:'', arquivo:''};
async function bqImportarArquivo(file, preset){
  if(!file) return;
  showToast('Lendo "'+file.name+'"…');
  try{
    const doc = await PPGImport.lerArquivoUniversal(file);
    const r = PPGImport.parsearPerguntas(doc);
    if(!r.perguntas.length){ showToast('Não consegui identificar perguntas nesse arquivo. Confira se há enunciados seguidos de alternativas (a, b, c…).', 'warning'); return; }
    abrirPreviaPerguntas(r, doc, preset);
  }catch(e){ showToast(e.message || 'Não foi possível ler o arquivo.', 'warning'); }
}
function abrirPreviaPerguntas(r, doc, preset){
  PREV.lista = r.perguntas.map(p=>({texto:p.texto, categoria:p.categoria || '', options:p.options.map(o=>({text:o.text, correct:!!o.correct}))}));
  PREV.categoria = ''; PREV.tema = ''; PREV.arquivo = doc.nome; PREV.avisos = [].concat(r.avisos || [], doc.avisos || []);
  const p = preset || {};
  PREV.usada = !!p.usada; PREV.campanhaUso = p.campanha || ''; PREV.dataUso = p.data || '';
  const corpo = document.createElement('div'); corpo.id = 'prevCorpo';
  const rodape = document.createElement('div'); rodape.className = 'pop-actions';
  rodape.innerHTML = `<span class="hint" id="prevResumo"></span><div style="display:flex;gap:8px;"><button type="button" class="btn btn-outline" id="prevCancelar">Cancelar</button><button type="button" class="btn btn-primary" id="prevSalvar"><i data-lucide="check"></i> Salvar no banco</button></div>`;
  abrirMiniPagina({titulo:'Conferir as perguntas encontradas', subtitulo:`${PREV.lista.length} pergunta(s) em “${doc.nome}” · leitura: ${r.estrategia}. Ajuste o que precisar — nada é salvo antes de você confirmar.`, corpo, rodape, largura:900});
  corpo.addEventListener('input', prevOnInput); corpo.addEventListener('click', prevOnClick); corpo.addEventListener('change', prevOnChange);
  rodape.querySelector('#prevCancelar').addEventListener('click', fecharMiniPagina);
  rodape.querySelector('#prevSalvar').addEventListener('click', prevSalvar);
  prevRender();
}
function impPerguntasDoArquivo(){
  if(!IMP.doc) return;
  const r = PPGImport.parsearPerguntas(IMP.doc);
  if(!r.perguntas.length){ showToast('Não encontrei perguntas neste arquivo. Se elas estão em outro arquivo, use “Importar perguntas” no Banco de Perguntas e marque que já foram usadas.', 'warning'); return; }
  abrirPreviaPerguntas(r, IMP.doc, {usada:true, campanha:IMP.nome, data:IMP.fim});
}
function prevResumo(){
  const sem = PREV.lista.filter(p=>!p.options.some(o=>o.correct)).length;
  const el = document.getElementById('prevResumo');
  if(el) el.innerHTML = `<b>${PREV.lista.length}</b> pergunta(s)${sem ? ` · <span style="color:var(--warning)"><b>${sem}</b> sem gabarito (serão salvas como inativas)</span>` : ''}`;
}
function prevRender(){
  const c = document.getElementById('prevCorpo'); if(!c) return;
  const sc = c.parentElement ? c.parentElement.scrollTop : 0;
  c.innerHTML = (PREV.avisos.length ? `<div class="imp-aviso"><i data-lucide="alert-triangle"></i> ${PREV.avisos.slice(0,4).map(escH).join('<br>')}</div>` : '') +
    `<div class="form-grid" style="margin-bottom:12px;"><div class="field"><label>Categoria para todas (opcional)</label><input type="text" data-prev="cat" value="${escH(PREV.categoria)}" placeholder="Ex: Segurança"></div><div class="field"><label>Tema para todas (opcional)</label><input type="text" data-prev="tema" value="${escH(PREV.tema)}" placeholder="Ex: Segurança da Informação"></div></div>` +
    `<div class="prev-uso"><label class="imp-chip"><input type="checkbox" data-prev="usada" ${PREV.usada ? 'checked' : ''}> Estas perguntas já foram usadas em uma campanha antiga (método anterior)</label>` +
    (PREV.usada ? `<div class="form-grid" style="margin-top:10px;"><div class="field"><label>Nome da campanha antiga</label><input type="text" data-prev="campuso" value="${escH(PREV.campanhaUso)}" placeholder="Ex: PPG 2023.1"></div><div class="field"><label>Quando terminou <span style="color:var(--error)">*</span></label><input type="date" data-prev="datauso" value="${escH(PREV.dataUso)}"></div></div><p class="hint" style="margin:8px 0 0;">Entram no banco como <b>já utilizadas</b> (1 vez, nessa data). Se alguém tentar reaproveitar dentro de 2 anos, o sistema avisa.</p>` : '') + `</div>` +
    PREV.lista.map((p,i)=>{
      const n = p.options.filter(o=>o.correct).length;
      return `<div class="prev-q${n===0?' sem-gab':''}">
        <div class="prev-q-head"><b>${i+1}.</b><span class="badge ${n>1?'finalizada':'andamento'}">${n>1?'Múltipla escolha':'Resposta única'}</span>${n===0?'<span class="badge programada">sem gabarito — marque a correta</span>':''}<span style="flex:1"></span><button type="button" class="icon-btn" data-prev="delq" data-i="${i}" title="Remover pergunta"><i data-lucide="trash-2"></i></button></div>
        <textarea rows="2" data-prev="qtexto" data-i="${i}">${escH(p.texto)}</textarea>
        ${p.options.map((o,j)=>`<div class="prev-alt"><input type="checkbox" title="Marque se for a correta" data-prev="ok" data-i="${i}" data-j="${j}" ${o.correct?'checked':''}><input type="text" data-prev="atexto" data-i="${i}" data-j="${j}" value="${escH(o.text)}"><button type="button" class="icon-btn" data-prev="delalt" data-i="${i}" data-j="${j}" title="Remover alternativa"><i data-lucide="x"></i></button></div>`).join('')}
        <button type="button" class="btn btn-ghost btn-sm" data-prev="addalt" data-i="${i}"><i data-lucide="plus"></i> alternativa</button>
      </div>`;
    }).join('');
  if(c.parentElement) c.parentElement.scrollTop = sc;
  prevResumo();
  if(window.lucide) lucide.createIcons();
}
function prevOnInput(e){
  const t = e.target, k = t.dataset.prev; if(!k) return;
  if(k === 'cat') PREV.categoria = t.value; else if(k === 'tema') PREV.tema = t.value;
  else if(k === 'campuso') PREV.campanhaUso = t.value; else if(k === 'datauso') PREV.dataUso = t.value;
  else if(k === 'qtexto') PREV.lista[+t.dataset.i].texto = t.value;
  else if(k === 'atexto') PREV.lista[+t.dataset.i].options[+t.dataset.j].text = t.value;
}
function prevOnChange(e){
  const t = e.target;
  if(t.dataset.prev === 'ok'){ PREV.lista[+t.dataset.i].options[+t.dataset.j].correct = t.checked; prevRender(); }
  else if(t.dataset.prev === 'usada'){ PREV.usada = t.checked; prevRender(); }
  else if(t.dataset.prev === 'datauso'){ PREV.dataUso = t.value; }
}
function prevOnClick(e){
  const b = e.target.closest('button[data-prev]'); if(!b) return;
  const i = +b.dataset.i, j = +b.dataset.j, k = b.dataset.prev;
  if(k === 'delq') PREV.lista.splice(i, 1);
  else if(k === 'delalt') PREV.lista[i].options.splice(j, 1);
  else if(k === 'addalt') PREV.lista[i].options.push({text:'', correct:false});
  else return;
  prevRender();
}
async function prevSalvar(){
  const validas = PREV.lista.filter(p=>p.texto.trim() && p.options.filter(o=>o.text.trim()).length >= 2);
  if(!validas.length){ showToast('Nenhuma pergunta válida para salvar (cada uma precisa de enunciado e 2+ alternativas).', 'warning'); return; }
  if(PREV.usada && !PPGImport.normalizarData(PREV.dataUso)){ showToast('Informe quando a campanha antiga terminou — é assim que o sistema sabe há quanto tempo a pergunta foi usada.', 'warning'); return; }
  const uso = PREV.usada
    ? {ultimaUtilizacao:PPGImport.normalizarData(PREV.dataUso), qtdUtilizacoes:1, origem:`Campanha antiga: ${PREV.campanhaUso.trim() || 'sem nome'} (método anterior)`}
    : {origem:`Importada de ${PREV.arquivo}`};
  const payload = validas.map(p=>{
    const opts = p.options.filter(o=>o.text.trim()).map(o=>({text:o.text.trim(), correct:!!o.correct}));
    const n = opts.filter(o=>o.correct).length;
    return Object.assign({texto:p.texto.trim(), type:n>1?'multiplas_respostas':'unica', options:opts, categoria:PREV.categoria.trim() || p.categoria || (PREV.usada ? 'Campanhas antigas' : 'Importada'), tema:PREV.tema.trim(), status:n===0?'inativa':'ativa'}, uso);
  });
  const btn = document.getElementById('prevSalvar'); btn.disabled = true; btn.textContent = 'Salvando…';
  const resp = await backendCall('salvarPerguntasLote', {perguntas: payload});
  if(!resp.ok){ btn.disabled = false; btn.innerHTML = '<i data-lucide="check"></i> Salvar no banco'; showToast(resp.erro || 'Não foi possível salvar as perguntas.', 'warning'); return; }
  const sem = payload.filter(p=>p.status === 'inativa').length;
  fecharMiniPagina();
  logAction('Importação de perguntas', `${resp.salvas} pergunta(s)${PREV.usada ? ' (já usadas em ' + PREV.campanhaUso + ')' : ''}`);
  showToast(`${resp.salvas} pergunta(s) salva(s) no banco${PREV.usada ? ' como já utilizadas' : ''}${sem ? ` — ${sem} sem gabarito ficaram inativas` : ''}.`, 'success');
  _ultimaAssinatura = null; sincronizarDadosDoServidor();
}

/* ======================= LEMBRETE POR E-MAIL ======================= */
async function lembrarQuemFalta(c, btn){
  const st = statusRodada(c);
  if(!confirm(`Enviar um lembrete por e-mail para quem ainda não respondeu “${c.nome}”?\n\nFaltam ${st.faltam.length} pessoa(s).`)) return;
  btn.disabled = true; const rot = btn.innerHTML; btn.textContent = 'Enviando…';
  const resp = await backendCall('enviarLembretes', {campaignId: c.id});
  btn.disabled = false; btn.innerHTML = rot;
  if(!resp.ok){ showToast(resp.erro || 'Não foi possível enviar o lembrete.', 'warning'); return; }
  logAction('Lembrete enviado', `${resp.enviados} e-mail(s) — ${c.nome}`);
  showToast(resp.modoTeste
    ? `Modo teste: simulei o lembrete para ${resp.enviados} pessoa(s) e enviei só um e-mail de exemplo para o endereço de teste.`
    : `Lembrete enviado para ${resp.enviados} pessoa(s)${resp.semEmail ? ` (${resp.semEmail} sem e-mail cadastrado)` : ''}.`, 'success');
}

/* ======================= VERIFICAÇÃO DO QUADRO DE COLABORADORES (Configurações) ======================= */
function renderQuadro(){
  const el = document.getElementById('painelQuadroBody'); if(!el) return;
  const r = EMPRESA.colaboradores || [];
  if(!r.length){ el.innerHTML = '<p class="hint">Carregando o quadro de colaboradores…</p>'; return; }
  const part = r.filter(c=>!c.qualidade);
  const cont = {}; r.forEach(c=>{ const k = matK(c.matricula); cont[k] = (cont[k] || 0) + 1; });
  const dups = Object.keys(cont).filter(k=>cont[k] > 1);
  const semSetor = r.filter(c=>!String(c.setor || '').trim()).length, semFilial = r.filter(c=>!String(c.filial || '').trim()).length;
  const semEmail = part.filter(c=>!c.temEmail).length;
  const pill = (n, txt, aviso)=> `<span class="imp-pill${n && aviso ? ' warn' : ''}"><b>${n}</b> ${txt}</span>`;
  el.innerHTML = `<div class="imp-pills">${pill(r.length, 'pessoa(s) no quadro')}${pill(part.length, 'participam das rodadas')}${pill(r.length - part.length, 'da Qualidade (não participam)')}${pill(semEmail, 'participante(s) sem e-mail — não recebem lembrete', true)}${pill(semSetor, 'sem setor', true)}${pill(semFilial, 'sem filial', true)}${pill(dups.length, 'matrícula(s) repetida(s)', true)}</div>` +
    (dups.length ? `<p class="hint" style="color:var(--error);">Matrículas repetidas na planilha: ${dups.slice(0,8).map(escH).join(', ')}${dups.length > 8 ? '…' : ''} — corrija na aba “Colaboradores”.</p>` : '<p class="hint">Dados do quadro conferidos: sem matrículas repetidas.</p>');
}

/* ======================= JANELAS (pop-ups): ESC fecha, rolagem do fundo travada ======================= */
document.addEventListener('keydown', e=>{
  if(e.key !== 'Escape') return;
  const abertos = [...document.querySelectorAll('.pop-backdrop, .share-backdrop, .celebrate-backdrop')];
  const topo = abertos[abertos.length - 1];
  if(!topo || topo.dataset.fixo) return;
  if(topo.id === 'miniPagina') fecharMiniPagina(); else topo.remove();
});
new MutationObserver(()=>{ document.body.classList.toggle('modal-aberto', !!document.querySelector('.pop-backdrop, .share-backdrop, .celebrate-backdrop')); }).observe(document.body, {childList:true});


/* ======================= REGISTRO DE ATIVIDADES (gravado no servidor) ======================= */
const LOG = {tipo:'', busca:'', dias:7, limite:300, itens:[], total:0, contagem:{}, resumo:null, carregando:false, ultimo:0, erro:''};
const LOG_TIPOS = [
  ['','Tudo','layers'], ['senha','Senhas','key-round'], ['acesso','Acessos','log-in'], ['campanha','Campanhas','folder-kanban'],
  ['sorteio','Sorteios','dices'], ['participacao','Participações','clipboard-check'], ['importacao','Importações','upload-cloud'],
  ['banco','Banco de perguntas','database'], ['mensagem','Mensagens','message-circle'], ['regra','Regras e exceções','scale'],
  ['exportacao','Exportações','download'], ['divulgacao','Divulgação','megaphone']
];
const LOG_ICONE = Object.fromEntries(LOG_TIPOS.filter(t=>t[0]).map(t=>[t[0], t[2]]));

function logRelativo(d){
  const s = Math.round((Date.now() - d.getTime()) / 1000);
  if(s < 45) return 'agora há pouco';
  if(s < 3600) return `há ${Math.round(s/60)} min`;
  if(s < 86400) return `há ${Math.round(s/3600)} h`;
  return `há ${Math.round(s/86400)} dia(s)`;
}
function logDiaRotulo(d){
  const hoje = new Date(); hoje.setHours(0,0,0,0);
  const alvo = new Date(d); alvo.setHours(0,0,0,0);
  const diff = Math.round((hoje - alvo) / 86400000);
  return diff === 0 ? 'Hoje' : diff === 1 ? 'Ontem' : `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}`;
}
async function logCarregar(silencioso){
  if(LOG.carregando || !currentUser || currentRole !== 'qualidade') return;
  LOG.carregando = true;
  const lista = document.getElementById('logLista');
  if(!silencioso && lista && !LOG.itens.length) lista.innerHTML = '<div class="skel-wrap"><div class="skel skel-l1"></div><div class="skel skel-l2"></div><div class="skel skel-card"></div></div>';
  try{
    const resp = await backendCall('listarLog', {filtro:{tipos: LOG.tipo ? [LOG.tipo] : [], busca: LOG.busca, dias: LOG.dias, limite: LOG.limite}});
    if(resp.ok){ LOG.itens = resp.itens || []; LOG.total = resp.total || 0; LOG.contagem = resp.contagem || {}; LOG.resumo = resp.resumo || null; LOG.erro = ''; LOG.ultimo = Date.now(); }
    else LOG.erro = resp.erro || 'Não foi possível carregar o registro.';
  }finally{ LOG.carregando = false; }
  renderLog();
}
function logMostrar(){ renderLog(); logCarregar(false); }
function renderLog(){
  const lista = document.getElementById('logLista'); if(!lista) return;
  const r = LOG.resumo || {acessosHoje:0, senhas7d:0, acoesQualidade7d:0, falhas7d:0};
  const stat = (ico, n, txt, cls)=> `<div class="log-stat ${cls||''}"><span class="log-stat-ico"><i data-lucide="${ico}"></i></span><div><b>${n}</b><span>${txt}</span></div></div>`;
  document.getElementById('logResumo').innerHTML = stat('log-in', r.acessosHoje, 'acessos nas últimas 24 h') + stat('key-round', r.senhas7d, 'senhas criadas ou trocadas (7 dias)') + stat('shield-check', r.acoesQualidade7d, 'ações da Qualidade (7 dias)') + stat('alert-octagon', r.falhas7d, 'falhas de acesso (7 dias)', r.falhas7d ? 'alerta' : '');
  document.getElementById('logChips').innerHTML = LOG_TIPOS.map(([k, rot, ico])=>{
    const n = k ? (LOG.contagem[k] || 0) : Object.values(LOG.contagem).reduce((a,b)=>a+b, 0);
    return `<button type="button" class="log-chip${LOG.tipo === k ? ' ativo' : ''}" data-logtipo="${k}"><i data-lucide="${ico}"></i> ${rot}${n ? ` <em>${n}</em>` : ''}</button>`;
  }).join('');
  if(LOG.erro){ lista.innerHTML = `<div class="imp-aviso"><i data-lucide="alert-triangle"></i> ${escH(LOG.erro)}</div>`; if(window.lucide) lucide.createIcons(); return; }
  if(!LOG.itens.length){
    lista.innerHTML = `<div class="panel fun-empty"><div class="fe-icon"><i data-lucide="activity"></i></div>${LOG.carregando ? 'Carregando…' : 'Nenhuma atividade encontrada neste filtro.'}</div>`;
    document.getElementById('logMais').style.display = 'none'; if(window.lucide) lucide.createIcons(); return;
  }
  let html = '', dia = '';
  LOG.itens.forEach(x=>{
    const d = new Date(x.dataHora), rot = logDiaRotulo(d);
    if(rot !== dia){ dia = rot; html += `<div class="log-dia">${escH(rot)}</div>`; }
    const quem = x.usuarioNome ? `<b>${escH(x.usuarioNome)}</b> <span class="log-mat">${escH(x.usuarioMat)}</span>` : '<b>Sistema</b>';
    const alvo = x.alvoNome ? ` <i data-lucide="arrow-right" class="log-seta"></i> <b>${escH(x.alvoNome)}</b> <span class="log-mat">${escH(x.alvoMat)}</span>` : '';
    html += `<div class="log-item t-${escH(x.tipo)}${x.resultado === 'falha' ? ' falha' : ''}">
      <span class="log-ico"><i data-lucide="${LOG_ICONE[x.tipo] || 'activity'}"></i></span>
      <div class="log-main">
        <div class="log-acao">${escH(x.acao)}${x.resultado === 'falha' ? ' <span class="badge excluido">falha</span>' : ''}${x.perfil === 'Qualidade' ? ' <span class="badge andamento">Qualidade</span>' : ''}</div>
        <div class="log-quem">${quem}${alvo}</div>
        ${x.detalhe ? `<div class="log-det">${escH(x.detalhe)}</div>` : ''}
      </div>
      <div class="log-quando" title="${escH(fmtDateTime(d))}"><b>${pad(d.getHours())}:${pad(d.getMinutes())}</b><span>${escH(logRelativo(d))}</span></div>
    </div>`;
  });
  lista.innerHTML = html;
  const mais = document.getElementById('logMais');
  mais.style.display = LOG.total > LOG.itens.length ? '' : 'none';
  mais.textContent = `Mostrar mais (${LOG.total - LOG.itens.length} restantes)`;
  if(window.lucide) lucide.createIcons();
}
(function ligarLog(){
  const q = id => document.getElementById(id);
  if(!q('logChips')) return;
  q('logChips').addEventListener('click', e=>{ const b = e.target.closest('[data-logtipo]'); if(!b) return; LOG.tipo = b.dataset.logtipo; LOG.limite = 300; logCarregar(false); });
  let t = null;
  q('logBusca').addEventListener('input', e=>{ clearTimeout(t); t = setTimeout(()=>{ LOG.busca = e.target.value.trim(); LOG.limite = 300; logCarregar(false); }, 350); });
  q('logPeriodo').addEventListener('change', e=>{ LOG.dias = +e.target.value; LOG.limite = 300; logCarregar(false); });
  q('logAtualizar').addEventListener('click', ()=> logCarregar(false));
  q('logMais').addEventListener('click', ()=>{ LOG.limite += 300; logCarregar(false); });
  q('logSenhas').addEventListener('click', abrirSituacaoSenhas);
  q('logCsv').addEventListener('click', ()=>{
    downloadCSV('registro_atividades.csv', ['Data/hora','Tipo','Ação','Quem','Matrícula','Perfil','Alvo','Matrícula do alvo','Detalhe','Resultado'],
      LOG.itens.map(x=>[fmtDateTime(new Date(x.dataHora)), x.tipo, x.acao, x.usuarioNome, x.usuarioMat, x.perfil, x.alvoNome, x.alvoMat, x.detalhe, x.resultado]));
    logAction('Relatório exportado', 'Registro de atividades (CSV)');
  });
  document.querySelectorAll('[data-pane-link]').forEach(b=> b.addEventListener('click', ()=> mostrarAbaHistorico(b.dataset.paneLink)));
  setInterval(()=>{ if(currentUser && currentRole === 'qualidade' && currentSectionId === 'historico' && abaHistoricoAtual === 'log' && !usuarioOcupado() && document.visibilityState === 'visible') logCarregar(true); }, 45000);
})();

/* Situação das senhas: quem nunca acessou, quem está com senha provisória e quem já criou a própria. */
async function abrirSituacaoSenhas(){
  const corpo = document.createElement('div'); corpo.innerHTML = '<div class="skel-wrap"><div class="skel skel-l1"></div><div class="skel skel-card"></div></div>';
  abrirMiniPagina({titulo:'Situação das senhas', subtitulo:'Quem já criou a própria senha e quem ainda não acessou o PPG', corpo, largura:960});
  const resp = await backendCall('situacaoSenhas');
  if(!resp.ok){ corpo.innerHTML = `<div class="imp-aviso"><i data-lucide="alert-triangle"></i> ${escH(resp.erro || 'Não foi possível carregar.')}</div>`; return; }
  const S = {filtro:'', busca:'', pessoas: resp.pessoas || []};
  const cls = {'nunca acessou':'excluido', 'senha provisória':'programada', 'senha própria':'finalizada'};
  const pintar = ()=>{
    const cont = {'nunca acessou':0, 'senha provisória':0, 'senha própria':0}; S.pessoas.forEach(p=>{ cont[p.estado]++; });
    const b = PPGImport.norm(S.busca);
    const lista = S.pessoas.filter(p=> (!S.filtro || p.estado === S.filtro) && (!b || PPGImport.norm(p.nome).includes(b) || String(p.matricula).includes(b)));
    corpo.innerHTML = `<div class="log-chips" style="margin-bottom:12px;">
        ${[['', 'Todos', S.pessoas.length], ['nunca acessou', 'Nunca acessou', cont['nunca acessou']], ['senha provisória', 'Senha provisória', cont['senha provisória']], ['senha própria', 'Senha própria', cont['senha própria']]].map(([k, rot, n])=>`<button type="button" class="log-chip${S.filtro === k ? ' ativo' : ''}" data-sf="${k}">${rot} <em>${n}</em></button>`).join('')}
      </div>
      <div class="field" style="margin-bottom:12px;"><input type="text" id="sfBusca" placeholder="Buscar por nome ou matrícula…" value="${escH(S.busca)}"></div>
      ${tabelaHtml(['Nome','Matrícula','Setor','Situação','Última troca','Ação'], lista.slice(0,400).map(p=>[
        escH(p.nome) + (p.qualidade ? ' <span class="badge andamento">Qualidade</span>' : ''), escH(p.matricula), escH(p.setor || ''),
        `<span class="badge ${cls[p.estado]}">${escH(p.estado)}</span>`, p.atualizadoEm ? escH(fmtPeriodoValor(p.atualizadoEm)) : '—',
        p.matricula === currentUser.matricula ? '' : `<button type="button" class="btn btn-outline btn-sm" data-redef="${escH(p.matricula)}"><i data-lucide="rotate-ccw"></i> Redefinir</button>`
      ]), 'Ninguém neste filtro.')}${lista.length > 400 ? `<p class="hint">Mostrando 400 de ${lista.length}. Use a busca.</p>` : ''}`;
    const inp = corpo.querySelector('#sfBusca'); if(S.busca){ inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); }
    if(window.lucide) lucide.createIcons();
  };
  corpo.addEventListener('click', async e=>{
    const f = e.target.closest('[data-sf]'); if(f){ S.filtro = f.dataset.sf; pintar(); return; }
    const r = e.target.closest('[data-redef]'); if(!r) return;
    const p = S.pessoas.find(x=>x.matricula === r.dataset.redef); if(!p) return;
    if(!confirm(`Redefinir a senha de ${p.nome}?\n\nA senha volta a ser a matrícula (${p.matricula}) e a pessoa cria uma nova no próximo acesso. Isso fica registrado.`)) return;
    r.disabled = true;
    const rr = await backendCall('resolveReset', {matricula: p.matricula, atendidoPor: currentUser.nome});
    if(!rr.ok){ showToast(rr.erro || 'Não foi possível redefinir.', 'warning'); r.disabled = false; return; }
    p.estado = 'senha provisória'; p.atualizadoEm = ''; showToast(`Senha de ${p.nome} redefinida.`, 'success'); LOG.ultimo = 0; pintar();
  });
  corpo.addEventListener('input', e=>{ if(e.target.id === 'sfBusca'){ S.busca = e.target.value; clearTimeout(S._t); S._t = setTimeout(pintar, 250); } });
  pintar();
}
window.abrirSituacaoSenhas = abrirSituacaoSenhas;

/* ======================= EXCEÇÕES ÀS REGRAS (agora gravadas no servidor, visíveis em qualquer aparelho) ======================= */
let _excTs = 0;
function pintarExcecoes(){
  const tbody = document.getElementById('tblExcecoes'); if(!tbody) return;
  tbody.innerHTML = ruleChangeLog.map(r=>`<tr><td>${escH(fmtDateTime(r.data))}</td><td>${escH(r.responsavel)}</td><td>${escH(r.campanha)}</td><td>${escH(r.regraOriginal)}</td><td>${escH(r.alteracao)}</td><td>${escH(r.justificativa)}</td></tr>`).join('')
    || `<tr><td colspan="6" style="text-align:center; color:var(--ink-soft); padding:20px;">Nenhuma exceção registrada até o momento.</td></tr>`;
}
async function carregarExcecoes(){
  _excTs = Date.now();
  const resp = await backendCall('listarLog', {filtro:{tipos:['regra'], limite:200}});
  if(resp.ok) ruleChangeLog = (resp.itens || []).map(x=>{ const e = x.extra || {}; return {data:new Date(x.dataHora), responsavel:x.usuarioNome, campaignId:e.campaignId, campanha:e.campanha || '', regraOriginal:e.regraOriginal || '', alteracao:e.alteracao || '', justificativa:e.justificativa || ''}; });
  pintarExcecoes();
}
function renderRegrasExcecoes(){
  const sel = document.getElementById('excCampanha');
  if(sel){
    const assinatura = campaigns.map(c=>c.id).join('|');
    if(sel.dataset.sig !== assinatura){ sel.innerHTML = campaigns.map(c=>`<option value="${escH(c.id)}">${escH(c.nome)}</option>`).join(''); sel.dataset.sig = assinatura; }
  }
  pintarExcecoes();
  if(Date.now() - _excTs > 20000) carregarExcecoes();
}
document.getElementById('formExcecao')?.addEventListener('submit', async function(e){
  e.preventDefault();
  const campaignId = document.getElementById('excCampanha').value;
  const regraOriginal = document.getElementById('excRegraOriginal').value.trim();
  const alteracao = document.getElementById('excAlteracao').value.trim();
  const justificativa = document.getElementById('excJustificativa').value.trim();
  if(!campaignId || !regraOriginal || !alteracao || !justificativa) return;
  const c = campaigns.find(x=>x.id === campaignId);
  const btn = this.querySelector('button[type="submit"]'); btn.disabled = true;
  const resp = await backendCall('registrarEvento', {tipo:'regra', acao:'Exceção às regras registrada', detalhe:`${c ? c.nome : campaignId} — ${alteracao}`, extra:{campaignId, campanha: c ? c.nome : '', regraOriginal, alteracao, justificativa}});
  btn.disabled = false;
  if(!resp.ok){ showToast(resp.erro || 'Não foi possível registrar a exceção.', 'warning'); return; }
  this.reset(); LOG.ultimo = 0;
  showToast('Exceção registrada e gravada no registro de atividades.', 'success');
  carregarExcecoes();
});

/* ======================= MENU RECOLHIDO: todos os botões funcionam, com dica ao passar o mouse ======================= */
(function menuRecolhido(){
  const sb = document.getElementById('sidebar'); if(!sb) return;
  const rotular = ()=> sb.querySelectorAll('.menu-item, .menu-group-header').forEach(b=>{ const l = b.querySelector('.label'); if(l) b.dataset.tip = l.textContent.trim(); });
  rotular();
  let dica = document.getElementById('navTip');
  if(!dica){ dica = document.createElement('div'); dica.id = 'navTip'; dica.className = 'nav-tip'; document.body.appendChild(dica); }
  const esconder = ()=> dica.classList.remove('show');
  sb.addEventListener('mouseover', e=>{
    const b = e.target.closest('.menu-item'); if(!b || !sb.classList.contains('collapsed') || !b.dataset.tip) return esconder();
    const r = b.getBoundingClientRect();
    dica.textContent = b.dataset.tip; dica.style.left = (r.right + 12) + 'px'; dica.style.top = (r.top + r.height / 2) + 'px'; dica.classList.add('show');
  });
  sb.addEventListener('mouseleave', esconder); sb.addEventListener('scroll', esconder); sb.addEventListener('click', esconder);
  // lembra a escolha (recolhido / aberto) neste aparelho
  const KEY = 'ppg_menu_recolhido';
  try{ const salvo = localStorage.getItem(KEY); if(window.innerWidth > 880){ if(salvo === '1') sb.classList.add('collapsed'); else if(salvo === '0') sb.classList.remove('collapsed'); } }catch(e){}   // respeita a escolha da pessoa (em telas médias o app já nasce recolhido)
  document.getElementById('btnCollapseSidebar')?.addEventListener('click', ()=>{ setTimeout(()=>{ try{ localStorage.setItem(KEY, sb.classList.contains('collapsed') ? '1' : '0'); }catch(e){} esconder(); }, 0); });
})();

/* ======================= LOGIN: mostrar/ocultar senha ======================= */
document.getElementById('btnVerSenha')?.addEventListener('click', ()=>{
  const inp = document.getElementById('loginSenha'), btn = document.getElementById('btnVerSenha');
  const mostrar = inp.type === 'password';
  inp.type = mostrar ? 'text' : 'password';
  btn.innerHTML = `<i data-lucide="${mostrar ? 'eye-off' : 'eye'}"></i>`; btn.setAttribute('aria-label', mostrar ? 'Ocultar senha' : 'Mostrar senha');
  if(window.lucide) lucide.createIcons(); inp.focus();
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
  if(_hadSavedState && currentUser && currentUser.matricula && currentUser.token){
    document.getElementById('loginScreen').style.display = "none";
    document.getElementById('appRoot').style.display = "flex";
    carregarCacheSnapshot();
    applyRole(currentUser.role);
    showToast(`Sessão restaurada — bem-vindo(a) de volta, ${currentUser.nome}.`, "");
    iniciarSincronizacao();
  } else if(_hadSavedState){
    if(currentUser){ currentUser = null; saveState(); } // sessão antiga (sem token) — exige novo login
  } else {
    saveState(); // primeira vez neste navegador: grava o estado inicial
  }
}catch(e){
  console.warn("Não foi possível restaurar a sessão salva — voltando para a tela de login.", e);
  clearSavedState();
  document.getElementById('appRoot').style.display = "none";
  document.getElementById('loginScreen').style.display = "";
}
