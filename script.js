/* ======================= MOCK DATA ======================= */
const SETORES = ["ADM. DE TRANSPORTES - MINERAÇÃO","ADM. FRETAMENTO","ADM. FRETAMENTO - BEMISA","ADM. FRETAMENTO - CENIBRA","ADM. FRETAMENTO - TECHINT","ADM. FRETAMENTO - USIMINAS","ADM. MANUTENÇÃO/SUPRIMENTOS","ADMINISTRAÇÃO DE PESSOAL","ADMINISTRAÇÃO DE TRANSPORTES","ADMINISTRAÇÃO DE TRANSPORTES/FRETAMENTO MUSA","APRENDIZAGEM","ARRECADAÇÃO","ASSESSORIA JURÍDICA","ASSESSORIA OPERACIONAL","ASSISTÊNCIA  ADMINISTRATIVA","BORRACHARIA","CENTRO DE SERVIÇOS COMPARTILHADOS","COBRADORES","COMERCIAL","CONSERVAÇÃO","CONTABILIDADE","CONTROLE RECEITAS","CUSTOS","ELÉTRICA","FINANCEIRO","FISCALIZAÇÃO DE TRANSPORTES","GARAGISTAS / FRENTISTAS","GERENCIA","INFORMÁTICA","INSTRUÇÃO DE TRANSPORTES","JARDINAGEM","LANTERNAGEM","LAVANDERIA","MECÂNICA GERAL","MONITORAMENTO","MOTORISTAS - COMPARTILHADOS","MOTORISTAS - COMPLEXO MARIANA","MOTORISTAS - COMPLEXO MINAS CENTRAIS","MOTORISTAS - FRETAMENTO - BYD","MOTORISTAS - FRETAMENTO - ENGEPACK","MOTORISTAS - FRETAMENTO - KORDSA","MOTORISTAS - FRETAMENTO - OXITENO","MOTORISTAS - FRETAMENTO - POOL I","MOTORISTAS - FRETAMENTO - TURISMO","MOTORISTAS - FRETAMENTO MUSA","MOTORISTAS - LINHAS INTERMUNICIPAIS - CAPITAL","MOTORISTAS (FRETAMENTO APERAM)","MOTORISTAS (FRETAMENTO BEMISA PEDRA BRANCA)","MOTORISTAS (FRETAMENTO BEMISA)","MOTORISTAS (FRETAMENTO CENIBRA)","MOTORISTAS (FRETAMENTO CIPALAM)","MOTORISTAS (FRETAMENTO TECHINT)","MOTORISTAS (FRETAMENTO USIMEC - OPEX)","MOTORISTAS (FRETAMENTO USIMINAS)","MOTORISTAS (LINHAS)","PORTARIA","PROGRAMAÇÃO DE TRANSPORTES","QUALIDADE","QUALIDADE E RH","RECEPÇÃO DE MANUTENCAO","RECURSOS HUMANOS","SERVIÇOS GERAIS","SERVIÇOS GERAIS - BEMISA","SERVIÇOS GERAIS - CENIBRA","SERVIÇOS GERAIS - USIMINAS","SESMT","SUPERVISÃO DE MANUTENÇÃO","SUPRIMENTOS","TURISMO"];
const UNIDADES = ["Matriz – Coronel Fabriciano","Complexo Minas Centrais - Filial Santa Bárbara","Complexo Mariana - Filial Mariana","Bahia - Filial","Mineração Usiminas - Filial Itaúna"];
const FUNCOES = ["ADVOGADO","AJUDANTE DE PEDREIRO","ANALISTA AMBIENTAL","ANALISTA COMERCIAL","ANALISTA CONTABIL","ANALISTA DA QUALIDADE","ANALISTA DE CUSTOS","ANALISTA DE MEDIÇÃO","ANALISTA DE PESSOAL","ANALISTA DE TELEMETRIA","ANALISTA DE TI","ASSIST. ADMINISTRATIVO","ASSISTENTE SOCIAL","AUX. ADMINISTRATIVO","AUX. CONTABIL","AUX. DE JARDINAGEM","AUX. DE PESSOAL","AUX. DE PESSOAL","AUX. ELETRICISTA","AUX. MECANICO","AUX. SERV. GERAIS","BORRACHEIRO","CAPOTEIRO","COBRADOR","COORD. DE MANUTENCAO","COORD. DE TRANSPORTES","ELETRICISTA","ENC. DE SETOR - ADMINISTRATIVO","ENC. DE SETOR - MANUTENCAO","ENC. DE SETOR - OPERACIONAL","ENCARREGADO DE TI","ENG. SEGURANÇA DO TRABALHO","ESPECIALISTA EM MANUTENÇÃO","FISCAL","GARAGISTA","GERENTE COMERCIAL","GERENTE CONTÁBIL","GERENTE DE CSC","GERENTE DE FILIAL","GERENTE DE MANUTENÇÃO","GERENTE DE OPERAÇÃO","GERENTE DE RH/QUALIDADE","GERENTE DE SUPRIMENTOS","GERENTE FINANCEIRO","GERENTE JURÍDICO","LANTERNEIRO","LAVADOR","LAVADOR CHASSIS","LUBRIFICADOR","MECANICO","MEDICO DO TRABALHO","MOLEIRO","MOTO BOY","MOTORISTA DE MICROONIBUS","MOTORISTA DE ONIBUS - SÊNIOR","MOTORISTA DE VAN","MOTORISTA INSTRUTOR","PEDREIRO","PINTOR DE VEICULOS","POLIDOR","PORTEIRO","SUPERVISOR","TÉC. DE INFORMÁTICA","TÉC. ENFERMAGEM TRABALHO","TÉC. SEG. TRABALHO","VIGIA"];
const CARGOS_IMPEDIDOS = ["COORD. DE MANUTENCAO","COORD. DE TRANSPORTES","ENC. DE SETOR - ADMINISTRATIVO","ENC. DE SETOR - MANUTENCAO","ENC. DE SETOR - OPERACIONAL","ENCARREGADO DE TI","ENG. SEGURANÇA DO TRABALHO","ESPECIALISTA EM MANUTENÇÃO","GERENTE COMERCIAL","GERENTE CONTÁBIL","GERENTE DE CSC","GERENTE DE FILIAL","GERENTE DE MANUTENÇÃO","GERENTE DE OPERAÇÃO","GERENTE DE RH/QUALIDADE","GERENTE DE SUPRIMENTOS","GERENTE FINANCEIRO","GERENTE JURÍDICO"];
// Cargos permitidos = todas as funções da empresa que NÃO estão na lista de impedidos
const CARGOS_PERMITIDOS = FUNCOES.filter(f => !CARGOS_IMPEDIDOS.includes(f));
const NOMES = ["Ana Souza","Bruno Lima","Carla Mendes","Diego Alves","Elaine Costa","Fábio Rocha","Gisele Ramos","Henrique Dias",
"Isabela Nunes","João Pedro","Karina Silva","Lucas Farias","Marina Torres","Nelson Braga","Olívia Prado","Paulo Cesar",
"Renata Vieira","Sérgio Matos","Tatiane Cruz","Vinícius Melo","Camila Duarte","Rafael Nogueira","Beatriz Amaral","Thiago Peixoto"];

function randomFrom(arr){return arr[Math.floor(Math.random()*arr.length)];}
function pad(n){return n.toString().padStart(2,'0');}
function fmtDateTime(d){return pad(d.getDate())+"/"+pad(d.getMonth()+1)+"/"+d.getFullYear()+" "+pad(d.getHours())+":"+pad(d.getMinutes());}

function opt(text, correct){ return {text, correct: !!correct}; }

function buildParticipants(campaignId, count, pct100Count){
  const list = [];
  const usedNames = [...NOMES];
  for(let i=0;i<count;i++){
    const idx = Math.floor(Math.random()*usedNames.length);
    const nome = usedNames.splice(idx,1)[0] || (NOMES[i % NOMES.length] + " " + i);
    const acertos = i < pct100Count ? 100 : [90,80,70,60][Math.floor(Math.random()*4)];
    const d = new Date(2026, 5, 10 + Math.floor(i/4), 8 + (i%9), (i*7)%60);
    const cargo = (i % 7 === 0) ? randomFrom(CARGOS_IMPEDIDOS) : randomFrom(CARGOS_PERMITIDOS);
    list.push({campaignId, nome, matricula:"MAT"+(10230+i*3), setor:randomFrom(SETORES), filial:randomFrom(UNIDADES), funcao:randomFrom(FUNCOES), cargo, data:d, pct:acertos, respostasCorretas:null});
  }
  return list;
}

let campaigns = [
  {
    id:"c1", nome:"PPG 2026.1 – Segurança da Informação",
    descricao:"Avaliação sobre práticas de segurança da informação e proteção de dados corporativos.",
    objetivo:"Reforçar a cultura de segurança da informação entre todos os colaboradores.",
    inicio:"2026-06-01T08:00", fim:"2026-07-30T18:00",
    qtdGanhadores:4, premio:"Vale-compras R$ 200,00", criterios:"Nenhum critério adicional definido.",
    status:"andamento", ganhadores:null,
    questoes:[
      {texto:"Qual é a prática recomendada ao identificar um e-mail suspeito?", type:"unica", options:[opt("Clicar no link para verificar a origem"),opt("Reportar ao canal de segurança e não interagir com o e-mail",true),opt("Responder pedindo mais informações ao remetente"),opt("Encaminhar para colegas avaliarem")]},
      {texto:"O que caracteriza uma senha forte?", type:"unica", options:[opt("Data de nascimento e nome do usuário"),opt("Sequência numérica simples, como 123456"),opt("Combinação de letras, números e símbolos, sem dados pessoais",true),opt("A mesma senha usada em vários sistemas")]},
      {texto:"Dados de clientes podem ser compartilhados sem autorização?", type:"vf", options:[opt("Verdadeiro"),opt("Falso",true)]},
      {texto:"Qual canal deve ser usado para reportar incidentes de segurança?", type:"unica", options:[opt("Grupo de WhatsApp da equipe"),opt("Canal oficial de segurança da informação",true),opt("Rede social corporativa"),opt("E-mail pessoal do gestor")]}
    ]
  },
  {
    id:"c2", nome:"PPG 2025.4 – Qualidade e Processos",
    descricao:"Questionário sobre procedimentos de qualidade, ISO 9001 e melhoria contínua.",
    objetivo:"Consolidar o entendimento sobre os processos certificados pela ISO 9001.",
    inicio:"2025-11-01T08:00", fim:"2025-11-20T18:00",
    qtdGanhadores:4, premio:"Vale-compras R$ 200,00", criterios:"Priorizar setores ainda não contemplados em 2025.",
    status:"encerrada", ganhadores:null,
    questoes:[
      {texto:"O que é uma não conformidade?", type:"unica", options:[opt("Um elogio do cliente"),opt("Um desvio em relação a um requisito estabelecido",true),opt("Uma sugestão de melhoria qualquer"),opt("Um novo processo criado")]},
      {texto:"Qual a periodicidade da auditoria interna?", type:"unica", options:[opt("Definida no programa de auditoria da empresa",true),opt("Nunca é definida"),opt("Somente quando há reclamação"),opt("A cada 5 anos, sem exceções")]},
      {texto:"Quais das opções abaixo fazem parte do ciclo PDCA?", type:"multiplas_respostas", options:[opt("Planejar",true),opt("Executar",true),opt("Ignorar os resultados"),opt("Verificar e agir",true)]},
      {texto:"Quem é responsável por abrir uma RNC (Registro de Não Conformidade)?", type:"unica", options:[opt("Somente a diretoria"),opt("Qualquer colaborador que identificar o desvio",true),opt("Somente auditores externos"),opt("Ninguém, é automático")]}
    ]
  },
  {
    id:"c3", nome:"PPG 2025.3 – Ética e Compliance",
    descricao:"Reforço das diretrizes do código de ética e canal de denúncias.",
    objetivo:"Assegurar o conhecimento do código de ética por todos os colaboradores.",
    inicio:"2025-08-01T08:00", fim:"2025-08-20T18:00",
    qtdGanhadores:4, premio:"Vale-compras R$ 150,00", criterios:"Nenhum critério adicional definido.",
    status:"finalizada",
    ganhadores:[
      {nome:"Isabela Nunes", matricula:"MAT10251", setor:"INFORMÁTICA", filial:"Matriz – Coronel Fabriciano", funcao:"ANALISTA DE TI"},
      {nome:"Paulo Cesar", matricula:"MAT10281", setor:"FINANCEIRO", filial:"Complexo Minas Centrais - Filial Santa Bárbara", funcao:"ASSIST. ADMINISTRATIVO"},
      {nome:"Karina Silva", matricula:"MAT10263", setor:"RECURSOS HUMANOS", filial:"Complexo Mariana - Filial Mariana", funcao:"AUX. DE PESSOAL"},
      {nome:"Diego Alves", matricula:"MAT10236", setor:"SUPRIMENTOS", filial:"Matriz – Coronel Fabriciano", funcao:"AUX. ADMINISTRATIVO"}
    ],
    randomSeed:"748291063", justificativa:"Distribuição justa alcançada: 4 setores e 3 Unidades distintas representadas entre os ganhadores.", responsavel:"Mariana Queiroz",
    questoes:[
      {texto:"Qual o canal oficial para registrar uma denúncia?", type:"unica", options:[opt("Comentário em rede social"),opt("Canal de denúncias da Ética e Compliance",true),opt("Conversa informal com colegas"),opt("E-mail pessoal do diretor")]},
      {texto:"O que é conflito de interesses?", type:"unica", options:[opt("Quando interesses pessoais podem influenciar decisões profissionais",true),opt("Uma discordância entre colegas de equipe"),opt("Um erro de sistema"),opt("Uma reunião com clientes")]},
      {texto:"Presentes de fornecedores devem ser sempre recusados, independentemente do valor?", type:"vf", options:[opt("Verdadeiro"),opt("Falso — a política define limites de valor e situações permitidas",true)]},
      {texto:"Quem pode acionar o código de ética da empresa?", type:"unica", options:[opt("Somente gestores"),opt("Qualquer colaborador",true),opt("Somente o setor de Compliance"),opt("Somente fornecedores")]}
    ]
  }
];

let participants = [
  ...buildParticipants("c1", 34, 6),
  ...buildParticipants("c2", 28, 5),
  ...buildParticipants("c3", 22, 4),
];

let wonHistory = [
  {matricula:"MAT10251", data:new Date(2025,7,21)},
  {matricula:"MAT10281", data:new Date(2025,7,21)},
  {matricula:"MAT10263", data:new Date(2025,7,21)},
  {matricula:"MAT10236", data:new Date(2025,7,21)},
  {matricula:participants.find(p=>p.campaignId==="c1")?.matricula, data:new Date(2025,2,10)}
];

let currentUser = null;
let currentRole = "qualidade";
let historyLog = [];
let editingCampaignId = null;
let respondingCampaignId = null;


/* ======================= SINCRONIZAÇÃO EM TEMPO REAL =======================
 * A tela de Rodadas consulta o Google Apps Script periodicamente.
 * Substitua somente PPG_API_URL pela URL da implantação do seu Apps Script.
 */
const PPG_API_URL = "https://script.google.com/macros/s/AKfycby_jHTsQQvA9PwOrYwwcf7Z0494lwg1sWHy0v5ol2Z0te2642ICoBBpJuv0WnjFANWGxg/exec";
const PPG_SYNC_INTERVAL_MS = 10000;
let ppgSyncTimer = null;
let ppgSyncBusy = false;
let ppgLastSync = null;

function ppgApiUrlConfigured(){
  return PPG_API_URL && !PPG_API_URL.includes("COLE_AQUI");
}

async function ppgGet(action, params = {}){
  if(!ppgApiUrlConfigured()) throw new Error("URL do Apps Script ainda não configurada.");
  const qs = new URLSearchParams({action, ...params});
  const response = await fetch(`${PPG_API_URL}?${qs.toString()}`, {
    method: "GET",
    cache: "no-store"
  });
  if(!response.ok) throw new Error(`HTTP ${response.status}`);
  return await response.json();
}

function calcularStatusTempoReal(c){
  const agora = new Date();
  const inicio = new Date(c.inicio);
  const fim = new Date(c.fim);
  if(!isNaN(inicio.getTime()) && agora < inicio) return "programada";
  if(!isNaN(fim.getTime()) && agora > fim){
    return c.status === "finalizada" ? "finalizada" : "encerrada";
  }
  return "andamento";
}

function atualizarIndicadorTempoReal(erro = false){
  let el = document.getElementById("ppgLiveIndicator");
  if(!el){
    el = document.createElement("div");
    el.id = "ppgLiveIndicator";
    el.style.cssText = "position:fixed;right:18px;bottom:16px;z-index:9999;padding:7px 12px;border-radius:20px;background:rgba(255,255,255,.95);border:1px solid #DDE8E6;box-shadow:0 4px 14px rgba(0,0,0,.08);font:700 11px Arial,sans-serif;color:#087F6C;";
    document.body.appendChild(el);
  }
  if(erro){
    el.style.color = "#B42318";
    el.textContent = "● Sincronização indisponível";
    return;
  }
  el.style.color = "#087F6C";
  const hora = ppgLastSync ? ppgLastSync.toLocaleTimeString("pt-BR") : "--:--:--";
  el.textContent = `● Atualizado ${hora}`;
}

function redesenharTelasPPG(){
  try{ fillCampaignSelects(); }catch(e){}
  try{ renderDashboard(); }catch(e){}
  try{ renderCampaignGrid(); }catch(e){}
  try{ renderParticipantsTable(); }catch(e){}
  try{ renderEligibleTable(); }catch(e){}
  try{ renderSorteioSetup(); }catch(e){}
  try{ renderTimeline(); }catch(e){}
}

async function sincronizarPPGEmTempoReal(){
  if(ppgSyncBusy || !ppgApiUrlConfigured()) return;
  ppgSyncBusy = true;
  try{
    const camp = await ppgGet("getCampanhas");
    if(!camp || !camp.ok) throw new Error(camp?.erro || "Falha ao carregar campanhas.");

    campaigns = (camp.campanhas || []).map(c => ({
      ...c,
      status: calcularStatusTempoReal(c),
      questoes: Array.isArray(c.questoes) ? c.questoes : [],
      ganhadores: c.ganhadores || null,
      qtdRespostas: Number(c.qtdRespostas || 0)
    }));

    const resp = await ppgGet("getRespostas");
    if(resp && resp.ok && Array.isArray(resp.respostas)){
      participants = resp.respostas.map(r => ({
        ...r,
        campaignId: String(r.campaignId || ""),
        matricula: String(r.matricula || ""),
        pct: Number(r.pct || 0),
        acertosQtd: Number(r.acertosQtd || 0),
        totalQuestoes: Number(r.totalQuestoes || 0),
        data: r.data || r.dataInicio || r.dataHora || new Date(),
        respostasCorretas: Array.isArray(r.respostasCorretas) ? r.respostasCorretas : [],
        respostasSelecionadas: Array.isArray(r.respostasSelecionadas) ? r.respostasSelecionadas : []
      }));
    }

    ppgLastSync = new Date();
    atualizarIndicadorTempoReal(false);
    redesenharTelasPPG();
  }catch(err){
    console.warn("PPG: falha na sincronização em tempo real", err);
    atualizarIndicadorTempoReal(true);
  }finally{
    ppgSyncBusy = false;
  }
}

function iniciarPPGTempoReal(){
  if(ppgSyncTimer) clearInterval(ppgSyncTimer);
  atualizarIndicadorTempoReal(false);
  sincronizarPPGEmTempoReal();
  ppgSyncTimer = setInterval(sincronizarPPGEmTempoReal, PPG_SYNC_INTERVAL_MS);
}


/* ======================= ELEGIBILIDADE ======================= */
function isWithinTwoYears(matricula, refDate){
  const twoYearsMs = 2*365*24*60*60*1000;
  return wonHistory.some(w => w.matricula === matricula && (refDate - w.data) < twoYearsMs);
}
function evaluateEligibility(campaignId){
  const all = campaignParticipants(campaignId).filter(p=>p.pct===100);
  const eligible = [], excluded = [];
  const now = new Date();
  all.forEach(p=>{
    if(CARGOS_IMPEDIDOS.includes(p.cargo)) excluded.push({...p, motivo:`Cargo impedido (${p.cargo})`});
    else if(isWithinTwoYears(p.matricula, now)) excluded.push({...p, motivo:"Premiado(a) em campanha do PPG nos últimos 2 anos"});
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
const titles = {inicio:"Início", campanhas:"Campanhas PPG", nova:"Nova Campanha", participantes:"Participantes", elegiveis:"Elegíveis", sorteio:"Sorteio", relatorios:"Relatórios", historico:"Histórico", config:"Configurações", responder:"Questionário"};

document.querySelectorAll('.menu-item').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    if(btn.classList.contains('locked')) return;
    goToSection(btn.dataset.target);
    document.querySelectorAll('.menu-item').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
  });
});
function goToSection(target){
  document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
  document.getElementById('sec-'+target).classList.add('active');
  document.getElementById('pageTitle').textContent = titles[target];
  closeSidebarMobile();
  if(target==="inicio") renderDashboard();
  if(target==="campanhas") renderCampaignGrid();
  if(target==="historico") renderTimeline();
}

document.getElementById('hamburger').addEventListener('click', ()=>{
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('overlay').classList.toggle('open');
});
document.getElementById('overlay').addEventListener('click', closeSidebarMobile);
function closeSidebarMobile(){ document.getElementById('sidebar').classList.remove('open'); document.getElementById('overlay').classList.remove('open'); }

/* ======================= LOGIN ======================= */
// Cada usuário de demonstração tem sua própria senha (nada de senha única compartilhada).
const USERS = {
  "1000": { senha:"qualidade2026", nome:"Mariana Queiroz", role:"qualidade" },
  "2000": { senha:"colab2026", nome:"Carlos Bento", role:"colaborador",
            setor:"QUALIDADE", filial:"Matriz – Coronel Fabriciano", funcao:"ANALISTA DA QUALIDADE", cargo:"ANALISTA DA QUALIDADE" }
};
document.getElementById('loginForm').addEventListener('submit', function(e){
  e.preventDefault();
  const mat = document.getElementById('loginMatricula').value.trim();
  const senha = document.getElementById('loginSenha').value;
  const errEl = document.getElementById('loginError');
  const user = USERS[mat];
  if(user && senha === user.senha){
    currentUser = {matricula: mat, nome:user.nome, role:user.role, setor:user.setor, filial:user.filial, funcao:user.funcao, cargo:user.cargo};
  } else { errEl.style.display = "block"; return; }
  errEl.style.display = "none";
  document.getElementById('loginScreen').style.display = "none";
  document.getElementById('appRoot').style.display = "flex";
  applyRole(currentUser.role);
  showToast(`Bem-vindo(a), ${currentUser.nome}.`, "success");
});
document.getElementById('btnLogout').addEventListener('click', ()=>{
  currentUser = null;
  document.getElementById('appRoot').style.display = "none";
  document.getElementById('loginScreen').style.display = "flex";
  document.getElementById('loginForm').reset();
});
function applyRole(role){
  currentRole = role;
  const isAdmin = role === "qualidade";
  document.getElementById('userName').textContent = currentUser.nome;
  document.getElementById('userRole').textContent = isAdmin ? "Qualidade · Administrador" : "Colaborador";
  document.getElementById('avatarInit').textContent = isAdmin ? "MQ" : "CB";
  document.querySelectorAll('.menu-item.admin-only').forEach(item=> item.classList.toggle('locked', !isAdmin));
  document.querySelectorAll('.admin-only-panel').forEach(p=> p.style.display = isAdmin ? "" : "none");
  document.getElementById('dashTitle').textContent = isAdmin ? "Painel da Qualidade" : "Minhas campanhas";
  document.getElementById('dashSubtitle').textContent = isAdmin ? "Visão geral das campanhas do Programa Política de Gestão." : "Acompanhe as campanhas ativas e seus resultados anteriores.";
  document.getElementById('campanhasSubtitle').textContent = isAdmin ? "Todas as campanhas cadastradas, programadas, em andamento e encerradas." : "Campanhas ativas e campanhas das quais você já participou.";
  document.getElementById('configSubtitle').textContent = isAdmin ? "Preferências pessoais e parâmetros gerais do sistema." : "Preferências pessoais.";
  document.querySelector('[data-target="inicio"]').click();
}

/* ======================= TEMA ======================= */
function setDarkMode(on){ document.body.classList.toggle('dark', on); document.getElementById('themeToggle').checked = on; }
document.getElementById('themeToggle').addEventListener('change', (e)=> setDarkMode(e.target.checked));
document.getElementById('themeToggleTop').addEventListener('click', ()=> setDarkMode(!document.body.classList.contains('dark')));

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
    const prev = sel.value;
    sel.innerHTML = campaigns.map(c=>`<option value="${c.id}">${c.nome}</option>`).join('');
    if(prev) sel.value = prev;
  });
}

/* ======================= DASHBOARD ======================= */
function renderDashboard(){
  document.getElementById('kpiTotalCampanhas').textContent = campaigns.length;
  document.getElementById('kpiAndamento').textContent = campaigns.filter(c=>c.status==="andamento").length;
  document.getElementById('kpiProgramadas').textContent = campaigns.filter(c=>c.status==="programada").length;
  const latest = campaigns[0];
  document.getElementById('kpiParticipantes').textContent = latest ? Number(latest.qtdRespostas ?? campaignParticipants(latest.id).length) : 0;
  document.getElementById('kpiElegiveis').textContent = evaluateEligibility(latest.id).eligible.length;
  const ganhadores = campaigns.filter(c=>c.ganhadores).reduce((a,c)=>a+c.ganhadores.length,0);
  document.getElementById('kpiGanhadores').textContent = ganhadores;

  const barsEl = document.getElementById('chartParticipacao');
  const maxCount = Math.max(...campaigns.map(c=>Number(c.qtdRespostas ?? campaignParticipants(c.id).length)), 1);
  barsEl.innerHTML = campaigns.map(c=>{
    const n = Number(c.qtdRespostas ?? campaignParticipants(c.id).length);
    const h = Math.max(8, Math.round((n/maxCount)*130));
    const shortName = c.nome.split('–')[0].trim();
    return `<div class="bar-col"><div class="bar-value">${n}</div><div class="bar-shell"><div class="bar-fill" style="height:0px" data-h="${h}"></div></div><div class="bar-label">${shortName}</div></div>`;
  }).join('');
  requestAnimationFrame(()=> document.querySelectorAll('#chartParticipacao .bar-fill').forEach(el=> el.style.height = el.dataset.h + "px"));

  const ref = campaigns.find(c=>c.status==="encerrada") || campaigns[0];
  const refP = campaignParticipants(ref.id);
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
  renderHBarChart('chartSetor', allWinners, 'setor', SETORES);
  renderHBarChart('chartFilial', allWinners, 'filial', UNIDADES);

  document.getElementById('tblUltimasCampanhas').innerHTML = campaigns.map(c=>{
    const n = Number(c.qtdRespostas ?? campaignParticipants(c.id).length);
    return `<tr><td>${c.nome}</td><td>${c.inicio.replace('T',' ')} – ${c.fim.replace('T',' ')}</td><td>${n}</td><td>${statusBadge(c.status)}</td></tr>`;
  }).join('');
}
function renderHBarChart(elId, winners, field, universe){
  const counts = {}; universe.forEach(u=>counts[u]=0);
  winners.forEach(w=>{ counts[w[field]] = (counts[w[field]]||0) + 1; });
  const max = Math.max(...Object.values(counts), 1);
  const el = document.getElementById(elId);
  el.innerHTML = Object.entries(counts).map(([k,v])=>`
    <div class="hbar-row"><div class="hbar-label">${k}</div><div class="hbar-track"><div class="hbar-fill" style="width:0%" data-w="${(v/max*100)}"></div></div><div class="hbar-value">${v}</div></div>`).join('');
  requestAnimationFrame(()=> el.querySelectorAll('.hbar-fill').forEach(f=> f.style.width = f.dataset.w + "%"));
}

/* ======================= CAMPANHAS ======================= */
function renderCampaignGrid(){
  const list = currentRole==='qualidade' ? campaigns : campaigns.filter(c=>{
    const access = campaignAccessStatus(c);
    const answered = participants.some(p=>p.campaignId===c.id && p.matricula==='2000');
    return access==='aberta' || answered;
  });
  document.getElementById('campaignGrid').innerHTML = list.map(c=>{
    const n = Number(c.qtdRespostas ?? campaignParticipants(c.id).length);
    const {eligible} = evaluateEligibility(c.id);
    const access = campaignAccessStatus(c);
    const answered = participants.some(p=>p.campaignId===c.id && p.matricula==='2000');
    let colabActions = "";
    if(currentRole !== 'qualidade'){
      if(answered){
        colabActions = `<button class="btn btn-ghost btn-sm" onclick="openQuiz('${c.id}')">Ver meu resultado</button>`;
      } else if(access === 'aberta'){
        colabActions = `<button class="btn btn-primary btn-sm" onclick="openQuiz('${c.id}')">Responder questionário</button>`;
      } else if(access === 'nao_iniciada'){
        colabActions = `<button class="btn btn-outline btn-sm" disabled>Ainda não iniciada</button>`;
      } else {
        colabActions = `<button class="btn btn-outline btn-sm" disabled>Encerrada — você não participou</button>`;
      }
    }
    return `<div class="ccard">
      <div style="display:flex; justify-content:space-between; align-items:flex-start;"><h4>${c.nome}</h4>${statusBadge(c.status)}</div>
      <div class="desc">${c.descricao}</div>
      <div class="meta">
        <span>📅 ${c.inicio.replace('T',' ')} → ${c.fim.replace('T',' ')}</span>
        <span>📝 ${c.questoes ? c.questoes.length : '—'} perguntas · 🏆 ${c.qtdGanhadores} ganhadores</span>
        ${currentRole==='qualidade' ? `<span>👥 ${n} participantes · ✅ ${eligible.length} elegíveis</span>` : ''}
      </div>
      <div class="actions">
        ${currentRole==='qualidade' ? `<button class="btn btn-ghost btn-sm" onclick="goToParticipants('${c.id}')">Ver participantes</button>
        <button class="btn btn-outline btn-sm" onclick="loadCampaignForEdit('${c.id}')">Editar</button>` : colabActions}
      </div>
    </div>`;
  }).join('') || `<p style="color:var(--ink-soft); font-size:13px;">Nenhuma campanha disponível no momento.</p>`;
}
window.goToParticipants = function(id){
  document.querySelector('[data-target="participantes"]').click();
  document.getElementById('selectCampanhaParticipantes').value = id;
  renderParticipantsTable();
};

/* ======================= PARTICIPANTES ======================= */
function renderParticipantsTable(){
  const id = document.getElementById('selectCampanhaParticipantes').value;
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

/* ======================= NOVA CAMPANHA — QUESTION BUILDER ======================= */
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

/* ======================= NOVA CAMPANHA — SUBMIT (criar ou editar) ======================= */
document.getElementById('formCampanha').addEventListener('submit', function(e){
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

  if(editingCampaignId){
    const idx = campaigns.findIndex(c=>c.id===editingCampaignId);
    if(idx > -1) campaigns[idx] = {...campaigns[idx], ...payload};
    showToast("Campanha atualizada com sucesso!","success");
    editingCampaignId = null;
    document.getElementById('btnSubmitCampanha').textContent = "Cadastrar campanha";
    document.getElementById('btnCancelEdit').style.display = "none";
    document.getElementById('novaTitle').textContent = "Nova Campanha";
  } else {
    const id = "c" + (campaigns.length + 1) + "_" + Date.now().toString().slice(-4);
    campaigns.unshift({id, ganhadores:null, ...payload});
    showToast("Campanha e questionário cadastrados com sucesso!","success");
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

/* ======================= RESPONDER QUESTIONÁRIO (colaborador) ======================= */
window.openQuiz = function(campaignId){
  respondingCampaignId = campaignId;
  const c = campaigns.find(x=>x.id===campaignId);
  const existing = participants.find(p=>p.campaignId===campaignId && p.matricula==='2000');
  document.getElementById('responderTitle').textContent = c.nome;
  document.getElementById('responderSubtitle').textContent = c.descricao;
  document.getElementById('sec-responder').classList.add('_temp');
  document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
  document.getElementById('sec-responder').classList.add('active');
  document.getElementById('pageTitle').textContent = "Questionário";

  if(existing){
    renderQuizResult(c, existing);
  } else {
    renderQuizForm(c);
  }
};
document.getElementById('btnVoltarCampanhas').addEventListener('click', ()=>{
  document.querySelectorAll('.menu-item').forEach(b=>b.classList.remove('active'));
  document.querySelector('[data-target="campanhas"]').classList.add('active');
  goToSection('campanhas');
});

function renderQuizForm(c){
  const access = campaignAccessStatus(c);
  const body = document.getElementById('responderBody');
  if(access !== 'aberta'){
    body.innerHTML = `<div class="lock-banner">
      <div style="font-size:26px;">⏳</div>
      <div>${access==='nao_iniciada' ? 'Esta campanha ainda não está aberta para respostas.' : 'O prazo para responder esta campanha já foi encerrado.'}</div>
      <div class="hint">Período: ${c.inicio.replace('T',' ')} até ${c.fim.replace('T',' ')}</div>
    </div>`;
    return;
  }
  body.innerHTML = `<form class="panel" id="quizForm">
    ${c.questoes.map((q,i)=>`
      <div class="quiz-q">
        <div class="qn">Pergunta ${i+1} de ${c.questoes.length}</div>
        <div class="qt">${q.texto}</div>
        ${q.options.map((o,oi)=>`
          <label class="quiz-opt">
            <input type="${q.type==='multiplas_respostas'?'checkbox':'radio'}" name="resp_${i}" value="${oi}">
            <span>${o.text}</span>
          </label>`).join('')}
      </div>`).join('')}
    <button type="submit" class="btn btn-primary btn-block">Enviar respostas</button>
    <p class="hint" style="text-align:center; margin-top:10px;">Você poderá enviar apenas uma resposta para esta campanha, vinculada à sua matrícula.</p>
  </form>`;
  document.getElementById('quizForm').addEventListener('submit', function(e){
    e.preventDefault();
    submitQuiz(c);
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

function submitQuiz(c){
  const form = document.getElementById('quizForm');
  const respostasCorretas = [];
  c.questoes.forEach((q,i)=>{
    let ans;
    if(q.type === 'multiplas_respostas'){
      ans = Array.from(form.querySelectorAll(`input[name="resp_${i}"]:checked`)).map(el=>Number(el.value));
    } else {
      const checked = form.querySelector(`input[name="resp_${i}"]:checked`);
      ans = checked ? Number(checked.value) : null;
    }
    respostasCorretas.push(isCorrect(q, ans));
  });
  const correctCount = respostasCorretas.filter(Boolean).length;
  const pct = Math.round(correctCount / c.questoes.length * 100);

  const novoParticipante = {
    campaignId: c.id, nome: currentUser.nome, matricula: currentUser.matricula,
    setor: currentUser.setor, filial: currentUser.filial, funcao: currentUser.funcao, cargo: currentUser.cargo,
    data: new Date(), pct, respostasCorretas
  };
  participants.push(novoParticipante);

  fillCampaignSelects();
  renderDashboard(); renderCampaignGrid(); renderParticipantsTable(); renderEligibleTable(); renderSorteioSetup();
  renderQuizResult(c, novoParticipante);
  showToast(`Respostas enviadas! Você acertou ${correctCount} de ${c.questoes.length} questões.`, pct===100 ? "success" : "");
}

function renderQuizResult(c, participant){
  const body = document.getElementById('responderBody');
  const correctCount = participant.respostasCorretas ? participant.respostasCorretas.filter(Boolean).length : Math.round(participant.pct/100*c.questoes.length);
  let eligibilityMsg = "";
  if(participant.pct === 100){
    if(CARGOS_IMPEDIDOS.includes(participant.cargo)){
      eligibilityMsg = `<div class="justification" style="display:block;">Você acertou 100% das questões, porém colaboradores no cargo de <b>${participant.cargo}</b> não participam do sorteio, conforme as regras do programa.</div>`;
    } else if(isWithinTwoYears(participant.matricula, new Date())){
      eligibilityMsg = `<div class="justification" style="display:block;">Você acertou 100% das questões, porém já foi premiado(a) em uma campanha do PPG nos últimos 2 anos, o que o(a) impede de concorrer novamente neste período.</div>`;
    } else {
      eligibilityMsg = `<div class="justification" style="display:block; background:#E4F3E5; color:var(--success); border-color:#BEE0C1;">Parabéns! Você acertou 100% das questões e está elegível ao sorteio desta campanha.</div>`;
    }
  }
  body.innerHTML = `
    <div class="score-hero">
      <div class="score-ring" style="background:conic-gradient(var(--primary) ${participant.pct*3.6}deg, var(--border) 0deg);">
        <div class="inner"><b>${participant.pct}%</b><span>de acertos</span></div>
      </div>
      <div>
        <h3 style="font-size:16px;">Você acertou ${correctCount} de ${c.questoes.length} questões</h3>
        <p class="hint" style="margin-top:4px;">Resposta enviada em ${fmtDateTime(participant.data)}. O gabarito completo é de acesso exclusivo da equipe da Qualidade.</p>
      </div>
    </div>
    ${eligibilityMsg}
    <div class="panel">
      <h3>Seu desempenho por questão</h3>
      <div class="hint">O ícone indica se a sua resposta estava certa, sem revelar a alternativa correta</div>
      ${c.questoes.map((q,i)=>{
        const ok = participant.respostasCorretas ? participant.respostasCorretas[i] : null;
        const badge = ok===null ? "" : `<span class="result-badge ${ok?'ok':'bad'}">${ok?'✓':'✕'}</span>`;
        return `<div class="quiz-q" style="display:flex; align-items:center; gap:12px;">${badge}<div style="flex:1;"><div class="qt" style="margin-bottom:0;">Pergunta ${i+1}: ${q.texto}</div></div></div>`;
      }).join('')}
    </div>`;
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
  const UnidadesRepresentadas = new Set(eligible.map(p=>p.filial)).size;
  document.getElementById('sorteioStats').innerHTML = `
    <div class="stat"><b>${eligible.length}</b><span>Total de elegíveis</span></div>
    <div class="stat"><b>${excluded.length}</b><span>Excluídos por regra</span></div>
    <div class="stat"><b>${setoresRepresentados}</b><span>Setores representados</span></div>
    <div class="stat"><b>${UnidadesRepresentadas}</b><span>Unidades representadas</span></div>`;
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
  const winners = []; const usedSetores = new Set(), usedUnidades = new Set();
  for(const p of shuffled){ if(winners.length>=need) break; if(!usedSetores.has(p.setor) || !usedUnidades.has(p.filial)){ winners.push(p); usedSetores.add(p.setor); usedUnidades.add(p.filial); } }
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
document.getElementById('btnValidarSorteio').addEventListener('click', ()=> showToast("Resultado validado por Mariana Queiroz (Qualidade).","success"));
document.getElementById('btnRelatorioOficial').addEventListener('click', ()=>{
  if(!window._lastSorteio){ showToast("Realize o sorteio antes de gerar o relatório.","warning"); return; }
  const {campaignId, winners, seed} = window._lastSorteio;
  const c = campaigns.find(x=>x.id===campaignId);
  const headers = ["Posição","Nome","Matrícula","Setor","Filial"];
  const rows = winners.map((w,i)=>[i+1, w.nome, w.matricula, w.setor, w.filial]);
  openPrintReport(`Relatório oficial do sorteio — ${c.nome}`, headers, rows, `Número aleatório utilizado: ${seed} · Gerado em ${fmtDateTime(new Date())}`);
});
document.getElementById('btnRegistrarHistorico').addEventListener('click', ()=>{
  if(!window._lastSorteio) return;
  const {campaignId, winners, seed, fair, distinctSetores, eligibleCount} = window._lastSorteio;
  const c = campaigns.find(x=>x.id===campaignId);
  c.ganhadores = winners.map(w=>({nome:w.nome, matricula:w.matricula, setor:w.setor, filial:w.filial, funcao:w.funcao}));
  c.status = "finalizada"; c.randomSeed = seed; c.responsavel = "Mariana Queiroz";
  c.justificativa = fair ? `Distribuição justa alcançada entre ${distinctSetores} setor(es) distintos.` : `Distribuição parcial: apenas ${distinctSetores} setor(es) representado(s) entre os ${eligibleCount} elegíveis.`;
  winners.forEach(w=> wonHistory.push({matricula:w.matricula, data:new Date()}));
  historyLog.unshift({campaignId, data:new Date(), texto:`Sorteio realizado para a campanha ${c.nome}.`});
  fillCampaignSelects();
  showToast("Sorteio registrado no histórico para auditoria.","success");
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
function openPrintReport(title, headers, rows, footNote){
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
    </style></head><body>
    <h1>PPG · Programa Política de Gestão</h1>
    <p class="meta">${title} — gerado em ${fmtDateTime(new Date())}</p>
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
    return {title:`Distribuição de ganhadores por setor/filial/função — todas as campanhas`, headers:["Nome","Setor","Filial","Função"], rows};
  }
  if(reportType === 'auditoria'){
    const rows = [[c.nome, c.criterios||"—", c.randomSeed||"—", c.responsavel||"—", c.justificativa||"—"]];
    return {title:`Registro de auditoria do sorteio — ${c.nome}`, headers:["Campanha","Critérios aplicados","Nº aleatório","Responsável","Justificativa"], rows};
  }
  if(reportType === 'historico'){
    const rows = campaigns.filter(x=>x.ganhadores || x.status==='encerrada').map(x=>[x.nome, x.inicio.replace('T',' '), x.fim.replace('T',' '), campaignParticipants(x.id).length, x.ganhadores?x.ganhadores.length:0]);
    return {title:"Histórico completo de campanhas", headers:["Campanha","Início","Encerramento","Participantes","Ganhadores"], rows};
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
      openPrintReport(data.title, data.headers, data.rows);
      showToast("Abrindo visualização para impressão/PDF.","success");
    }
  });
});

/* ======================= HISTÓRICO ======================= */
function renderTimeline(){
  document.getElementById('timeline').innerHTML = campaigns.filter(c=>c.status==="finalizada" || c.status==="encerrada").map(c=>{
    const {eligible} = evaluateEligibility(c.id);
    const winnersHtml = c.ganhadores ? `<div class="tl-winners">${c.ganhadores.map(w=>`<span class="chip">🏆 ${w.nome} · ${w.setor}</span>`).join('')}</div>` : `<div class="tl-winners"><span class="chip">Sorteio pendente de execução</span></div>`;
    const metaHtml = c.ganhadores ? `
      <div class="tl-meta"><span>👥 ${campaignParticipants(c.id).length} participantes</span><span>✅ ${eligible.length} elegíveis avaliados</span><span>🎲 nº aleatório: ${c.randomSeed || "—"}</span><span>👤 responsável: ${c.responsavel || "—"}</span></div>
      <div class="hint" style="margin-top:6px;">${c.justificativa || ""}</div>` : "";
    return `<div class="tl-item"><div class="tl-dot"></div><div class="tl-body"><h4>${c.nome}</h4><p>${c.inicio.replace('T',' ')} → ${c.fim.replace('T',' ')} · ${statusBadge(c.status)}</p>${winnersHtml}${metaHtml}</div></div>`;
  }).join('') || `<p style="color:var(--ink-soft); font-size:13px;">Nenhuma campanha encerrada ainda.</p>`;
}

/* ======================= INIT ======================= */
fillCampaignSelects();
renderDashboard();
renderCampaignGrid();
renderParticipantsTable();
renderEligibleTable();
renderSorteioSetup();
renderTimeline();
iniciarPPGTempoReal();
