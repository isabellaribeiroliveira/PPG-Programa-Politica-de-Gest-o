/* =====================================================================
   CONFIGURAÇÃO DA EMPRESA
   =====================================================================
   Os colaboradores reais vêm da planilha (aba "Colaboradores"). Aqui ficam
   só regras fixas do programa.

   cargosImpedidosPalavras: palavras que, se aparecerem no CARGO ou na FUNÇÃO
   da pessoa (ex.: "Gerente de Operações"), a deixam de fora do sorteio.
   ===================================================================== */

window.EMPRESA_CONFIG = {
  nome: "Univale",
  cargosImpedidosPalavras: ["gerente", "coordenador", "encarregado", "assessor"],
  filiais: ["Matriz", "Filial Norte", "Filial Sul", "Filial Leste", "Filial Oeste"],
  cargosImpedidos: [
    "Assessor da Diretoria",
    "Coordenador de Logística",
    "Encarregado de Manutenção",
    "Encarregado de Pessoal",
    "Encarregado de TI",
    "Gerente Comercial",
    "Gerente Contábil",
    "Gerente Financeiro",
    "Gerente Jurídico",
    "Gerente de CSC",
    "Gerente de Filial",
    "Gerente de Manutenção",
    "Gerente de Operações",
    "Gerente de RH",
    "Gerente de Suprimentos"
],
  setores: [
    {nome:"Recursos Humanos", funcoes:["Analista de RH", "Assistente de RH", "Auxiliar de RH", "Gerente de RH"]},
    {nome:"Qualidade", funcoes:["Analista da Qualidade", "Assistente da Qualidade", "Supervisor da Qualidade"]},
    {nome:"Tecnologia da Informação", funcoes:["Analista de TI", "Técnico de Informática", "Encarregado de TI"]},
    {nome:"Financeiro", funcoes:["Analista Financeiro", "Assistente Financeiro", "Gerente Financeiro"]},
    {nome:"Contabilidade", funcoes:["Analista Contábil", "Auxiliar Contábil", "Gerente Contábil"]},
    {nome:"Comercial", funcoes:["Analista Comercial", "Assistente Comercial", "Gerente Comercial"]},
    {nome:"Jurídico", funcoes:["Advogado", "Assistente Jurídico", "Gerente Jurídico"]},
    {nome:"Logística", funcoes:["Analista de Logística", "Auxiliar de Logística", "Coordenador de Logística"]},
    {nome:"Manutenção", funcoes:["Mecânico", "Auxiliar Mecânico", "Eletricista", "Encarregado de Manutenção", "Gerente de Manutenção"]},
    {nome:"Operações", funcoes:["Motorista", "Motorista Instrutor", "Supervisor de Operações", "Gerente de Operações"]},
    {nome:"Serviços Gerais", funcoes:["Auxiliar de Serviços Gerais", "Porteiro", "Vigia", "Jardineiro"]},
    {nome:"Suprimentos", funcoes:["Analista de Suprimentos", "Assistente de Suprimentos", "Gerente de Suprimentos"]},
    {nome:"Segurança do Trabalho", funcoes:["Técnico de Segurança do Trabalho", "Engenheiro de Segurança do Trabalho", "Médico do Trabalho"]},
    {nome:"Atendimento ao Cliente", funcoes:["Atendente", "Supervisor de Atendimento"]},
    {nome:"Administração de Pessoal", funcoes:["Analista de Pessoal", "Auxiliar de Pessoal", "Encarregado de Pessoal"]},
    {nome:"Central de Serviços Compartilhados", funcoes:["Analista de CSC", "Assistente de CSC", "Gerente de CSC"]},
    {nome:"Manutenção de Frota", funcoes:["Lavador", "Borracheiro", "Lanterneiro", "Pintor de Veículos"]},
    {nome:"Direção Geral", funcoes:["Gerente de Filial", "Assessor da Diretoria"]},
  ],

  // Quadro fictício de colaboradores (nenhuma pessoa real) — usado para gerar participantes coerentes no modo de teste
  colaboradores: [] // preenchido automaticamente a partir da planilha real (ver sincronizarColaboradores em script.js)
};

/* Helpers usados pelo restante do sistema */
window.EMPRESA_CONFIG.getFuncoesDoSetor = function(nomeSetor){
  const s = this.setores.find(x => x.nome === nomeSetor);
  return s ? s.funcoes : [];
};
window.EMPRESA_CONFIG.sortearSetorEFuncao = function(){
  const setor = this.setores[Math.floor(Math.random() * this.setores.length)];
  const funcao = setor.funcoes[Math.floor(Math.random() * setor.funcoes.length)];
  return {setor: setor.nome, funcao};
};
// Sorteia colaboradores fictícios do quadro (sem repetir matrícula no mesmo lote)
window.EMPRESA_CONFIG.sortearColaboradores = function(qtd, excluirMatriculas){
  excluirMatriculas = excluirMatriculas || new Set();
  const pool = this.colaboradores.filter(c => !excluirMatriculas.has(c.matricula));
  const shuffled = [...pool].sort(()=>Math.random()-0.5);
  return shuffled.slice(0, qtd);
};

