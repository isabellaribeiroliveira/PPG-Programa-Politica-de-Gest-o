/* =====================================================================
   ARQUIVO DE CONFIGURAÇÃO DA EMPRESA (DADOS FICTÍCIOS DE DEMONSTRAÇÃO)
   =====================================================================
   Este arquivo contém APENAS uma estrutura organizacional de exemplo —
   filiais, setores, funções compatíveis por setor e um quadro fictício de
   colaboradores. Nenhum nome, matrícula, setor ou função aqui corresponde
   a dados reais de qualquer empresa.

   O que importa aqui é a LÓGICA, que é o que deve ser reaproveitado ao
   plugar os dados reais no futuro:
     Empresa → Filial (independente)
     Empresa → Setor → Funções compatíveis (encadeado)

   Quando o modo de teste gera um colaborador fictício, ele sorteia um
   registro já coerente do quadro abaixo — nunca combina setor e função
   de forma aleatória e desconexa.

   Para plugar dados reais no futuro: substitua os arrays `filiais`,
   `setores` e `colaboradores` pelos dados da empresa (ou por uma consulta
   à API do RH) — nenhuma outra parte do sistema precisa mudar, pois todo
   o restante do código consome apenas esta mesma estrutura.
   ===================================================================== */

window.EMPRESA_CONFIG = {
  nome: "Empresa Modelo Ltda (dados fictícios)",
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
  colaboradores: [
    {matricula:"100004", nome:"Paulo Dias", funcao:"Analista Financeiro", setor:"Financeiro", filial:"Filial Sul"},
    {matricula:"100010", nome:"Fábio Cruz", funcao:"Gerente Financeiro", setor:"Financeiro", filial:"Filial Oeste"},
    {matricula:"100017", nome:"Nelson Dias", funcao:"Analista da Qualidade", setor:"Qualidade", filial:"Matriz"},
    {matricula:"100023", nome:"Patrícia Dias", funcao:"Assistente de RH", setor:"Recursos Humanos", filial:"Filial Oeste"},
    {matricula:"100028", nome:"Rodrigo Silva", funcao:"Mecânico", setor:"Manutenção", filial:"Filial Norte"},
    {matricula:"100034", nome:"Gisele Mendes", funcao:"Analista Contábil", setor:"Contabilidade", filial:"Filial Sul"},
    {matricula:"100043", nome:"Aline Nunes", funcao:"Assistente Financeiro", setor:"Financeiro", filial:"Filial Sul"},
    {matricula:"100049", nome:"Vanessa Alves", funcao:"Supervisor da Qualidade", setor:"Qualidade", filial:"Filial Leste"},
    {matricula:"100058", nome:"Rogério Pinto", funcao:"Encarregado de TI", setor:"Tecnologia da Informação", filial:"Filial Sul"},
    {matricula:"100066", nome:"Elaine Lima", funcao:"Gerente de Suprimentos", setor:"Suprimentos", filial:"Filial Norte"},
    {matricula:"100069", nome:"Olívia Machado", funcao:"Auxiliar de Logística", setor:"Logística", filial:"Matriz"},
    {matricula:"100074", nome:"Thiago Rocha", funcao:"Engenheiro de Segurança do Trabalho", setor:"Segurança do Trabalho", filial:"Filial Leste"},
    {matricula:"100082", nome:"Elaine Melo", funcao:"Analista de Suprimentos", setor:"Suprimentos", filial:"Filial Sul"},
    {matricula:"100088", nome:"Karina Prado", funcao:"Gerente Comercial", setor:"Comercial", filial:"Filial Norte"},
    {matricula:"100097", nome:"Camila Correia", funcao:"Gerente de Manutenção", setor:"Manutenção", filial:"Filial Norte"},
    {matricula:"100102", nome:"Camila Torres", funcao:"Analista da Qualidade", setor:"Qualidade", filial:"Matriz"},
    {matricula:"100110", nome:"Camila Ramos", funcao:"Analista de TI", setor:"Tecnologia da Informação", filial:"Filial Oeste"},
    {matricula:"100114", nome:"João Nunes", funcao:"Assistente de CSC", setor:"Central de Serviços Compartilhados", filial:"Filial Leste"},
    {matricula:"100122", nome:"Vanessa Nunes", funcao:"Coordenador de Logística", setor:"Logística", filial:"Filial Oeste"},
    {matricula:"100129", nome:"Olívia Costa", funcao:"Supervisor de Atendimento", setor:"Atendimento ao Cliente", filial:"Filial Sul"},
    {matricula:"100137", nome:"Henrique Costa", funcao:"Analista de CSC", setor:"Central de Serviços Compartilhados", filial:"Matriz"},
    {matricula:"100143", nome:"Aline Mendes", funcao:"Gerente Comercial", setor:"Comercial", filial:"Filial Leste"},
    {matricula:"100150", nome:"Felipe Nunes", funcao:"Médico do Trabalho", setor:"Segurança do Trabalho", filial:"Filial Leste"},
    {matricula:"100158", nome:"Sérgio Barbosa", funcao:"Analista de RH", setor:"Recursos Humanos", filial:"Filial Oeste"},
    {matricula:"100164", nome:"Rodrigo Rocha", funcao:"Auxiliar de Serviços Gerais", setor:"Serviços Gerais", filial:"Filial Sul"},
    {matricula:"100167", nome:"Lucas Vieira", funcao:"Auxiliar de RH", setor:"Recursos Humanos", filial:"Filial Oeste"},
    {matricula:"100171", nome:"Thiago Barbosa", funcao:"Motorista Instrutor", setor:"Operações", filial:"Filial Norte"},
    {matricula:"100174", nome:"Camila Cesar", funcao:"Gerente de Filial", setor:"Direção Geral", filial:"Filial Oeste"},
    {matricula:"100178", nome:"Paulo Lima", funcao:"Assistente Financeiro", setor:"Financeiro", filial:"Filial Sul"},
    {matricula:"100185", nome:"Elaine Barbosa", funcao:"Analista de TI", setor:"Tecnologia da Informação", filial:"Filial Leste"},
    {matricula:"100190", nome:"Gustavo Rocha", funcao:"Analista Contábil", setor:"Contabilidade", filial:"Filial Leste"},
    {matricula:"100198", nome:"Vanessa Barbosa", funcao:"Pintor de Veículos", setor:"Manutenção de Frota", filial:"Filial Norte"},
    {matricula:"100206", nome:"Eduardo Nogueira", funcao:"Gerente Jurídico", setor:"Jurídico", filial:"Filial Sul"},
    {matricula:"100210", nome:"Juliana Alves", funcao:"Assistente de Suprimentos", setor:"Suprimentos", filial:"Filial Oeste"},
    {matricula:"100217", nome:"Bruno Cruz", funcao:"Analista de Logística", setor:"Logística", filial:"Filial Sul"},
    {matricula:"100225", nome:"Ana Mendes", funcao:"Coordenador de Logística", setor:"Logística", filial:"Filial Norte"},
    {matricula:"100230", nome:"Carla Machado", funcao:"Analista da Qualidade", setor:"Qualidade", filial:"Matriz"},
    {matricula:"100236", nome:"Sérgio Nogueira", funcao:"Encarregado de TI", setor:"Tecnologia da Informação", filial:"Filial Norte"},
    {matricula:"100242", nome:"Priscila Cruz", funcao:"Gerente Jurídico", setor:"Jurídico", filial:"Filial Norte"},
    {matricula:"100245", nome:"Marina Alves", funcao:"Auxiliar de Logística", setor:"Logística", filial:"Filial Leste"},
    {matricula:"100254", nome:"Patrícia Prado", funcao:"Supervisor de Atendimento", setor:"Atendimento ao Cliente", filial:"Filial Leste"},
    {matricula:"100262", nome:"Diego Torres", funcao:"Supervisor da Qualidade", setor:"Qualidade", filial:"Matriz"},
    {matricula:"100269", nome:"Marina Ramos", funcao:"Auxiliar de Serviços Gerais", setor:"Serviços Gerais", filial:"Filial Norte"},
    {matricula:"100275", nome:"Lucas Nunes", funcao:"Analista de Pessoal", setor:"Administração de Pessoal", filial:"Filial Leste"},
    {matricula:"100278", nome:"Gustavo Alves", funcao:"Analista de Logística", setor:"Logística", filial:"Filial Leste"},
    {matricula:"100284", nome:"Paulo Rocha", funcao:"Gerente de Filial", setor:"Direção Geral", filial:"Matriz"},
    {matricula:"100287", nome:"Eduardo Pinto", funcao:"Assistente de CSC", setor:"Central de Serviços Compartilhados", filial:"Filial Norte"},
    {matricula:"100296", nome:"Larissa Nunes", funcao:"Assistente Comercial", setor:"Comercial", filial:"Matriz"},
    {matricula:"100304", nome:"Gustavo Nogueira", funcao:"Auxiliar de Pessoal", setor:"Administração de Pessoal", filial:"Filial Leste"},
    {matricula:"100307", nome:"Tatiane Ramos", funcao:"Analista de CSC", setor:"Central de Serviços Compartilhados", filial:"Filial Norte"},
    {matricula:"100314", nome:"Diego Lima", funcao:"Gerente de Filial", setor:"Direção Geral", filial:"Filial Sul"},
    {matricula:"100321", nome:"Karina Lima", funcao:"Gerente de CSC", setor:"Central de Serviços Compartilhados", filial:"Filial Oeste"},
    {matricula:"100324", nome:"Paulo Torres", funcao:"Analista de TI", setor:"Tecnologia da Informação", filial:"Matriz"},
    {matricula:"100327", nome:"Carla Melo", funcao:"Coordenador de Logística", setor:"Logística", filial:"Filial Oeste"},
    {matricula:"100335", nome:"Nelson Nogueira", funcao:"Supervisor de Atendimento", setor:"Atendimento ao Cliente", filial:"Filial Sul"},
    {matricula:"100343", nome:"Eduardo Costa", funcao:"Porteiro", setor:"Serviços Gerais", filial:"Filial Sul"},
    {matricula:"100349", nome:"Elaine Souza", funcao:"Gerente de Operações", setor:"Operações", filial:"Filial Sul"},
    {matricula:"100354", nome:"Nelson Vieira", funcao:"Analista Financeiro", setor:"Financeiro", filial:"Filial Oeste"},
    {matricula:"100359", nome:"Paulo Farias", funcao:"Auxiliar Contábil", setor:"Contabilidade", filial:"Matriz"},
    {matricula:"100368", nome:"Vinícius Melo", funcao:"Assistente Comercial", setor:"Comercial", filial:"Filial Oeste"},
    {matricula:"100376", nome:"Vinícius Moreira", funcao:"Lavador", setor:"Manutenção de Frota", filial:"Filial Oeste"},
    {matricula:"100379", nome:"Henrique Pinto", funcao:"Analista Financeiro", setor:"Financeiro", filial:"Filial Sul"},
    {matricula:"100383", nome:"Tatiane Melo", funcao:"Gerente de Filial", setor:"Direção Geral", filial:"Filial Sul"},
    {matricula:"100388", nome:"Simone Cesar", funcao:"Porteiro", setor:"Serviços Gerais", filial:"Filial Sul"},
    {matricula:"100391", nome:"Sérgio Lima", funcao:"Analista da Qualidade", setor:"Qualidade", filial:"Filial Leste"},
    {matricula:"100397", nome:"Karina Peixoto", funcao:"Porteiro", setor:"Serviços Gerais", filial:"Filial Sul"},
    {matricula:"100400", nome:"Ana Alves", funcao:"Assessor da Diretoria", setor:"Direção Geral", filial:"Filial Oeste"},
    {matricula:"100407", nome:"Thiago Cruz", funcao:"Gerente Contábil", setor:"Contabilidade", filial:"Matriz"},
    {matricula:"100412", nome:"Carla Pedro", funcao:"Auxiliar Contábil", setor:"Contabilidade", filial:"Filial Norte"},
    {matricula:"100415", nome:"Paulo Nogueira", funcao:"Assistente da Qualidade", setor:"Qualidade", filial:"Filial Norte"},
    {matricula:"100419", nome:"Rogério Peixoto", funcao:"Gerente de Suprimentos", setor:"Suprimentos", filial:"Filial Leste"},
    {matricula:"100423", nome:"Patrícia Souza", funcao:"Analista de Logística", setor:"Logística", filial:"Filial Norte"},
    {matricula:"100432", nome:"Sérgio Rocha", funcao:"Jardineiro", setor:"Serviços Gerais", filial:"Filial Norte"},
    {matricula:"100436", nome:"Fernanda Dias", funcao:"Assistente Financeiro", setor:"Financeiro", filial:"Matriz"},
    {matricula:"100439", nome:"Olívia Dias", funcao:"Auxiliar de Pessoal", setor:"Administração de Pessoal", filial:"Filial Sul"},
    {matricula:"100442", nome:"Sérgio Machado", funcao:"Assistente Jurídico", setor:"Jurídico", filial:"Filial Sul"},
    {matricula:"100445", nome:"Vanessa Silva", funcao:"Eletricista", setor:"Manutenção", filial:"Filial Oeste"},
    {matricula:"100448", nome:"Leonardo Nunes", funcao:"Assistente Financeiro", setor:"Financeiro", filial:"Filial Norte"},
    {matricula:"100457", nome:"Beatriz Peixoto", funcao:"Gerente Financeiro", setor:"Financeiro", filial:"Filial Leste"},
    {matricula:"100463", nome:"Simone Alves", funcao:"Jardineiro", setor:"Serviços Gerais", filial:"Filial Oeste"},
    {matricula:"100470", nome:"Rodrigo Souza", funcao:"Assistente Jurídico", setor:"Jurídico", filial:"Matriz"},
    {matricula:"100478", nome:"Rodrigo Mendes", funcao:"Gerente de Filial", setor:"Direção Geral", filial:"Filial Sul"},
    {matricula:"100483", nome:"Vinícius Vieira", funcao:"Vigia", setor:"Serviços Gerais", filial:"Matriz"},
    {matricula:"100487", nome:"Tatiane Matos", funcao:"Supervisor de Atendimento", setor:"Atendimento ao Cliente", filial:"Filial Leste"},
    {matricula:"100494", nome:"Lucas Melo", funcao:"Assistente Jurídico", setor:"Jurídico", filial:"Filial Leste"},
    {matricula:"100499", nome:"Ana Pedro", funcao:"Gerente de Operações", setor:"Operações", filial:"Filial Oeste"},
    {matricula:"100504", nome:"Aline Duarte", funcao:"Assistente Jurídico", setor:"Jurídico", filial:"Filial Oeste"},
    {matricula:"100513", nome:"Fernanda Teixeira", funcao:"Auxiliar de Pessoal", setor:"Administração de Pessoal", filial:"Filial Leste"},
    {matricula:"100521", nome:"Tatiane Vieira", funcao:"Gerente Comercial", setor:"Comercial", filial:"Matriz"},
    {matricula:"100530", nome:"Vinícius Dias", funcao:"Auxiliar de Serviços Gerais", setor:"Serviços Gerais", filial:"Filial Norte"},
    {matricula:"100536", nome:"Carla Dias", funcao:"Advogado", setor:"Jurídico", filial:"Matriz"},
    {matricula:"100544", nome:"Priscila Ramos", funcao:"Técnico de Informática", setor:"Tecnologia da Informação", filial:"Filial Leste"},
    {matricula:"100552", nome:"Paulo Costa", funcao:"Engenheiro de Segurança do Trabalho", setor:"Segurança do Trabalho", filial:"Filial Leste"},
    {matricula:"100561", nome:"Olívia Rocha", funcao:"Analista de RH", setor:"Recursos Humanos", filial:"Filial Leste"},
    {matricula:"100570", nome:"Gustavo Dias", funcao:"Pintor de Veículos", setor:"Manutenção de Frota", filial:"Matriz"},
    {matricula:"100577", nome:"Marcelo Nogueira", funcao:"Assistente Financeiro", setor:"Financeiro", filial:"Filial Norte"},
    {matricula:"100585", nome:"Rogério Correia", funcao:"Assessor da Diretoria", setor:"Direção Geral", filial:"Filial Leste"},
    {matricula:"100589", nome:"Juliana Pinto", funcao:"Pintor de Veículos", setor:"Manutenção de Frota", filial:"Filial Oeste"},
    {matricula:"100597", nome:"Paulo Correia", funcao:"Assistente de CSC", setor:"Central de Serviços Compartilhados", filial:"Filial Sul"},
    {matricula:"100603", nome:"Paulo Nunes", funcao:"Gerente de Manutenção", setor:"Manutenção", filial:"Filial Leste"},
    {matricula:"100610", nome:"Rafael Silva", funcao:"Encarregado de TI", setor:"Tecnologia da Informação", filial:"Filial Sul"},
    {matricula:"100618", nome:"Olívia Torres", funcao:"Analista de TI", setor:"Tecnologia da Informação", filial:"Filial Norte"},
    {matricula:"100624", nome:"Elaine Braga", funcao:"Gerente Contábil", setor:"Contabilidade", filial:"Filial Norte"},
    {matricula:"100633", nome:"Diego Ramos", funcao:"Jardineiro", setor:"Serviços Gerais", filial:"Filial Leste"},
    {matricula:"100642", nome:"Bruno Machado", funcao:"Supervisor de Atendimento", setor:"Atendimento ao Cliente", filial:"Filial Oeste"},
    {matricula:"100651", nome:"Beatriz Pedro", funcao:"Engenheiro de Segurança do Trabalho", setor:"Segurança do Trabalho", filial:"Matriz"},
    {matricula:"100658", nome:"Vanessa Teixeira", funcao:"Engenheiro de Segurança do Trabalho", setor:"Segurança do Trabalho", filial:"Filial Oeste"},
    {matricula:"100664", nome:"Sérgio Braga", funcao:"Auxiliar de Logística", setor:"Logística", filial:"Filial Norte"},
    {matricula:"100668", nome:"Eduardo Peixoto", funcao:"Gerente de RH", setor:"Recursos Humanos", filial:"Filial Sul"},
    {matricula:"100674", nome:"Vanessa Souza", funcao:"Analista de Pessoal", setor:"Administração de Pessoal", filial:"Filial Oeste"},
    {matricula:"100680", nome:"Isabela Machado", funcao:"Analista de RH", setor:"Recursos Humanos", filial:"Filial Leste"},
    {matricula:"100684", nome:"Larissa Silva", funcao:"Analista Comercial", setor:"Comercial", filial:"Filial Sul"},
    {matricula:"100693", nome:"Patrícia Nunes", funcao:"Auxiliar de Pessoal", setor:"Administração de Pessoal", filial:"Filial Sul"},
    {matricula:"100698", nome:"Vanessa Lima", funcao:"Técnico de Informática", setor:"Tecnologia da Informação", filial:"Matriz"},
    {matricula:"100701", nome:"Carla Barbosa", funcao:"Coordenador de Logística", setor:"Logística", filial:"Matriz"},
    {matricula:"100705", nome:"Rogério Costa", funcao:"Analista de Logística", setor:"Logística", filial:"Matriz"},
    {matricula:"100710", nome:"Marcelo Amaral", funcao:"Auxiliar Contábil", setor:"Contabilidade", filial:"Matriz"},
    {matricula:"100718", nome:"Aline Peixoto", funcao:"Analista de Suprimentos", setor:"Suprimentos", filial:"Filial Oeste"},
    {matricula:"100721", nome:"Gisele Cruz", funcao:"Analista Financeiro", setor:"Financeiro", filial:"Filial Sul"},
    {matricula:"100728", nome:"Marina Mendes", funcao:"Gerente de Operações", setor:"Operações", filial:"Filial Leste"},
    {matricula:"100731", nome:"Aline Teixeira", funcao:"Analista de Logística", setor:"Logística", filial:"Filial Sul"},
    {matricula:"100736", nome:"Rodrigo Nogueira", funcao:"Assistente da Qualidade", setor:"Qualidade", filial:"Filial Oeste"},
    {matricula:"100742", nome:"Ana Machado", funcao:"Encarregado de TI", setor:"Tecnologia da Informação", filial:"Filial Sul"},
    {matricula:"100751", nome:"Thiago Duarte", funcao:"Analista de CSC", setor:"Central de Serviços Compartilhados", filial:"Filial Leste"},
    {matricula:"100756", nome:"Felipe Duarte", funcao:"Encarregado de Pessoal", setor:"Administração de Pessoal", filial:"Filial Norte"},
    {matricula:"100764", nome:"Rodrigo Correia", funcao:"Assessor da Diretoria", setor:"Direção Geral", filial:"Filial Leste"},
    {matricula:"100770", nome:"Fábio Nunes", funcao:"Eletricista", setor:"Manutenção", filial:"Filial Norte"},
    {matricula:"100776", nome:"Rogério Nogueira", funcao:"Auxiliar de Logística", setor:"Logística", filial:"Filial Oeste"},
    {matricula:"100782", nome:"Camila Rocha", funcao:"Auxiliar de Serviços Gerais", setor:"Serviços Gerais", filial:"Filial Leste"},
    {matricula:"100789", nome:"Rafael Nunes", funcao:"Assistente Jurídico", setor:"Jurídico", filial:"Filial Sul"},
    {matricula:"100792", nome:"Felipe Ramos", funcao:"Gerente de Manutenção", setor:"Manutenção", filial:"Matriz"},
    {matricula:"100801", nome:"André Matos", funcao:"Coordenador de Logística", setor:"Logística", filial:"Filial Leste"},
    {matricula:"100810", nome:"André Prado", funcao:"Coordenador de Logística", setor:"Logística", filial:"Filial Leste"},
    {matricula:"100818", nome:"Paulo Pedro", funcao:"Analista de RH", setor:"Recursos Humanos", filial:"Filial Sul"},
    {matricula:"100824", nome:"Felipe Farias", funcao:"Assistente de Suprimentos", setor:"Suprimentos", filial:"Filial Oeste"},
    {matricula:"100829", nome:"Marcelo Nunes", funcao:"Assessor da Diretoria", setor:"Direção Geral", filial:"Filial Sul"},
    {matricula:"100832", nome:"Marina Silva", funcao:"Auxiliar Mecânico", setor:"Manutenção", filial:"Matriz"},
    {matricula:"100838", nome:"Nelson Peixoto", funcao:"Gerente de Filial", setor:"Direção Geral", filial:"Filial Norte"},
    {matricula:"100841", nome:"Aline Pedro", funcao:"Gerente de Manutenção", setor:"Manutenção", filial:"Filial Oeste"},
    {matricula:"100849", nome:"Vinícius Souza", funcao:"Assistente Jurídico", setor:"Jurídico", filial:"Filial Norte"},
    {matricula:"100856", nome:"Carla Lima", funcao:"Gerente de Filial", setor:"Direção Geral", filial:"Filial Sul"},
    {matricula:"100859", nome:"Gisele Machado", funcao:"Motorista Instrutor", setor:"Operações", filial:"Filial Leste"},
    {matricula:"100863", nome:"Juliana Silva", funcao:"Gerente de Operações", setor:"Operações", filial:"Filial Leste"},
    {matricula:"100866", nome:"Henrique Correia", funcao:"Assistente da Qualidade", setor:"Qualidade", filial:"Filial Leste"},
    {matricula:"100874", nome:"Priscila Duarte", funcao:"Engenheiro de Segurança do Trabalho", setor:"Segurança do Trabalho", filial:"Matriz"},
    {matricula:"100877", nome:"Priscila Pedro", funcao:"Analista da Qualidade", setor:"Qualidade", filial:"Filial Norte"},
    {matricula:"100884", nome:"Patrícia Melo", funcao:"Analista de Logística", setor:"Logística", filial:"Filial Oeste"},
    {matricula:"100890", nome:"Juliana Moreira", funcao:"Coordenador de Logística", setor:"Logística", filial:"Filial Leste"},
    {matricula:"100893", nome:"Priscila Melo", funcao:"Gerente de Operações", setor:"Operações", filial:"Filial Sul"},
    {matricula:"100896", nome:"Renata Nogueira", funcao:"Analista Financeiro", setor:"Financeiro", filial:"Filial Norte"},
    {matricula:"100900", nome:"Gustavo Mendes", funcao:"Analista Comercial", setor:"Comercial", filial:"Filial Norte"},
    {matricula:"100905", nome:"Aline Cesar", funcao:"Gerente de RH", setor:"Recursos Humanos", filial:"Filial Leste"},
    {matricula:"100914", nome:"Tatiane Amaral", funcao:"Analista da Qualidade", setor:"Qualidade", filial:"Filial Sul"},
    {matricula:"100923", nome:"Renata Teixeira", funcao:"Analista de Pessoal", setor:"Administração de Pessoal", filial:"Filial Norte"},
    {matricula:"100931", nome:"Vanessa Dias", funcao:"Assistente Jurídico", setor:"Jurídico", filial:"Matriz"},
    {matricula:"100936", nome:"Karina Teixeira", funcao:"Auxiliar Contábil", setor:"Contabilidade", filial:"Filial Norte"},
    {matricula:"100942", nome:"Vinícius Amaral", funcao:"Gerente de Operações", setor:"Operações", filial:"Matriz"},
    {matricula:"100945", nome:"Fábio Melo", funcao:"Gerente de Manutenção", setor:"Manutenção", filial:"Filial Oeste"},
    {matricula:"100948", nome:"Renata Souza", funcao:"Supervisor de Atendimento", setor:"Atendimento ao Cliente", filial:"Filial Oeste"},
    {matricula:"100957", nome:"Leonardo Souza", funcao:"Coordenador de Logística", setor:"Logística", filial:"Filial Oeste"},
    {matricula:"100964", nome:"Lucas Cesar", funcao:"Gerente de Manutenção", setor:"Manutenção", filial:"Matriz"},
    {matricula:"100972", nome:"Leonardo Braga", funcao:"Auxiliar de Pessoal", setor:"Administração de Pessoal", filial:"Filial Norte"},
    {matricula:"100977", nome:"Beatriz Braga", funcao:"Analista de CSC", setor:"Central de Serviços Compartilhados", filial:"Filial Leste"},
    {matricula:"100985", nome:"Rafael Braga", funcao:"Auxiliar de Serviços Gerais", setor:"Serviços Gerais", filial:"Filial Norte"},
    {matricula:"100991", nome:"Gustavo Lima", funcao:"Assistente de CSC", setor:"Central de Serviços Compartilhados", filial:"Filial Leste"},
    {matricula:"101000", nome:"Camila Alves", funcao:"Técnico de Informática", setor:"Tecnologia da Informação", filial:"Filial Sul"},
    {matricula:"101006", nome:"Vanessa Prado", funcao:"Médico do Trabalho", setor:"Segurança do Trabalho", filial:"Matriz"},
    {matricula:"101015", nome:"Thiago Melo", funcao:"Analista da Qualidade", setor:"Qualidade", filial:"Filial Oeste"},
    {matricula:"101019", nome:"Sérgio Matos", funcao:"Gerente de CSC", setor:"Central de Serviços Compartilhados", filial:"Filial Leste"},
    {matricula:"101027", nome:"Henrique Souza", funcao:"Gerente de Operações", setor:"Operações", filial:"Filial Leste"},
    {matricula:"101030", nome:"Vinícius Matos", funcao:"Coordenador de Logística", setor:"Logística", filial:"Filial Norte"},
    {matricula:"101033", nome:"Olívia Correia", funcao:"Assessor da Diretoria", setor:"Direção Geral", filial:"Matriz"},
    {matricula:"101041", nome:"André Moreira", funcao:"Analista de Pessoal", setor:"Administração de Pessoal", filial:"Filial Norte"},
    {matricula:"101045", nome:"Fernanda Cesar", funcao:"Supervisor de Operações", setor:"Operações", filial:"Filial Leste"},
    {matricula:"101052", nome:"Larissa Ramos", funcao:"Encarregado de Pessoal", setor:"Administração de Pessoal", filial:"Filial Norte"},
    {matricula:"101061", nome:"Patrícia Silva", funcao:"Borracheiro", setor:"Manutenção de Frota", filial:"Matriz"},
    {matricula:"101066", nome:"Tatiane Peixoto", funcao:"Lanterneiro", setor:"Manutenção de Frota", filial:"Matriz"},
    {matricula:"101071", nome:"Vanessa Cesar", funcao:"Analista de CSC", setor:"Central de Serviços Compartilhados", filial:"Filial Leste"},
    {matricula:"101075", nome:"Camila Machado", funcao:"Jardineiro", setor:"Serviços Gerais", filial:"Filial Leste"},
    {matricula:"101080", nome:"Patrícia Lima", funcao:"Coordenador de Logística", setor:"Logística", filial:"Filial Leste"},
    {matricula:"101089", nome:"Larissa Nogueira", funcao:"Gerente de CSC", setor:"Central de Serviços Compartilhados", filial:"Filial Leste"},
    {matricula:"101096", nome:"Isabela Vieira", funcao:"Auxiliar Contábil", setor:"Contabilidade", filial:"Matriz"},
    {matricula:"101102", nome:"Gisele Vieira", funcao:"Auxiliar de Serviços Gerais", setor:"Serviços Gerais", filial:"Filial Leste"},
    {matricula:"101108", nome:"João Mendes", funcao:"Assistente de RH", setor:"Recursos Humanos", filial:"Filial Leste"},
    {matricula:"101111", nome:"Eduardo Duarte", funcao:"Eletricista", setor:"Manutenção", filial:"Filial Oeste"},
    {matricula:"101118", nome:"André Machado", funcao:"Jardineiro", setor:"Serviços Gerais", filial:"Filial Sul"},
    {matricula:"101126", nome:"Paulo Duarte", funcao:"Supervisor da Qualidade", setor:"Qualidade", filial:"Matriz"},
    {matricula:"101135", nome:"Rodrigo Alves", funcao:"Motorista Instrutor", setor:"Operações", filial:"Matriz"},
    {matricula:"101138", nome:"Vinícius Pinto", funcao:"Assistente Financeiro", setor:"Financeiro", filial:"Filial Norte"},
    {matricula:"101143", nome:"Tatiane Farias", funcao:"Assistente da Qualidade", setor:"Qualidade", filial:"Matriz"},
    {matricula:"101150", nome:"Felipe Braga", funcao:"Atendente", setor:"Atendimento ao Cliente", filial:"Filial Norte"},
    {matricula:"101158", nome:"Larissa Melo", funcao:"Analista Comercial", setor:"Comercial", filial:"Filial Norte"},
    {matricula:"101164", nome:"João Dias", funcao:"Auxiliar de Logística", setor:"Logística", filial:"Filial Oeste"},
    {matricula:"101173", nome:"Ana Pinto", funcao:"Encarregado de Manutenção", setor:"Manutenção", filial:"Filial Sul"},
    {matricula:"101179", nome:"Karina Mendes", funcao:"Auxiliar de Pessoal", setor:"Administração de Pessoal", filial:"Filial Oeste"},
    {matricula:"101184", nome:"Rodrigo Amaral", funcao:"Gerente de Suprimentos", setor:"Suprimentos", filial:"Filial Sul"},
    {matricula:"101190", nome:"Larissa Machado", funcao:"Auxiliar de Pessoal", setor:"Administração de Pessoal", filial:"Filial Norte"},
    {matricula:"101197", nome:"Priscila Farias", funcao:"Analista Financeiro", setor:"Financeiro", filial:"Filial Leste"},
    {matricula:"101200", nome:"Eduardo Nunes", funcao:"Supervisor de Operações", setor:"Operações", filial:"Matriz"},
    {matricula:"101209", nome:"Tatiane Barbosa", funcao:"Supervisor da Qualidade", setor:"Qualidade", filial:"Filial Leste"},
    {matricula:"101213", nome:"Olívia Duarte", funcao:"Coordenador de Logística", setor:"Logística", filial:"Filial Sul"},
    {matricula:"101220", nome:"Juliana Lima", funcao:"Auxiliar Mecânico", setor:"Manutenção", filial:"Matriz"},
    {matricula:"101225", nome:"Fábio Moreira", funcao:"Gerente de Suprimentos", setor:"Suprimentos", filial:"Filial Norte"},
    {matricula:"101234", nome:"Marina Costa", funcao:"Jardineiro", setor:"Serviços Gerais", filial:"Filial Norte"},
    {matricula:"101239", nome:"Simone Moreira", funcao:"Assessor da Diretoria", setor:"Direção Geral", filial:"Filial Oeste"},
    {matricula:"101242", nome:"Rafael Teixeira", funcao:"Assistente Comercial", setor:"Comercial", filial:"Filial Leste"},
    {matricula:"101251", nome:"Eduardo Machado", funcao:"Analista de Pessoal", setor:"Administração de Pessoal", filial:"Filial Norte"},
    {matricula:"101256", nome:"Eduardo Souza", funcao:"Assessor da Diretoria", setor:"Direção Geral", filial:"Matriz"},
    {matricula:"101264", nome:"Thiago Nogueira", funcao:"Gerente de Filial", setor:"Direção Geral", filial:"Filial Leste"},
    {matricula:"101272", nome:"Thiago Alves", funcao:"Gerente de Manutenção", setor:"Manutenção", filial:"Filial Leste"},
    {matricula:"101279", nome:"Gustavo Silva", funcao:"Auxiliar de Logística", setor:"Logística", filial:"Matriz"},
    {matricula:"101287", nome:"Marcelo Moreira", funcao:"Coordenador de Logística", setor:"Logística", filial:"Matriz"},
    {matricula:"101290", nome:"Isabela Lima", funcao:"Gerente de Operações", setor:"Operações", filial:"Matriz"},
    {matricula:"101297", nome:"Gisele Dias", funcao:"Gerente de Operações", setor:"Operações", filial:"Matriz"},
    {matricula:"101304", nome:"Vanessa Braga", funcao:"Auxiliar Contábil", setor:"Contabilidade", filial:"Filial Leste"},
    {matricula:"101310", nome:"André Melo", funcao:"Auxiliar Contábil", setor:"Contabilidade", filial:"Matriz"},
    {matricula:"101316", nome:"Nelson Prado", funcao:"Mecânico", setor:"Manutenção", filial:"Filial Sul"},
    {matricula:"101324", nome:"Thiago Matos", funcao:"Auxiliar de Logística", setor:"Logística", filial:"Matriz"},
    {matricula:"101327", nome:"Sérgio Ramos", funcao:"Analista de Suprimentos", setor:"Suprimentos", filial:"Filial Leste"},
    {matricula:"101330", nome:"Aline Souza", funcao:"Analista de Pessoal", setor:"Administração de Pessoal", filial:"Filial Norte"},
  ]
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

/* CPF FICTÍCIO — gerado de forma determinística a partir da matrícula, só para
   preencher os campos de auditoria (nenhum CPF real é usado em lugar nenhum
   deste protótipo). O mesmo colaborador sempre recebe o mesmo CPF fictício. */
window.EMPRESA_CONFIG.cpfFicticio = function(matricula){
  let seed = 0;
  const s = String(matricula);
  for(let i=0;i<s.length;i++) seed = (seed * 31 + s.charCodeAt(i)) >>> 0;
  const digits = [];
  for(let i=0;i<9;i++){ seed = (seed * 1103515245 + 12345) >>> 0; digits.push(seed % 10); }
  // dígitos verificadores fictícios (não seguem o algoritmo oficial — é só formatação)
  seed = (seed * 1103515245 + 12345) >>> 0; digits.push(seed % 10);
  seed = (seed * 1103515245 + 12345) >>> 0; digits.push(seed % 10);
  const d = digits.join('');
  return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9,11)}`;
};
