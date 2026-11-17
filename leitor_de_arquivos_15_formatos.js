const puppeteer = require('puppeteer-core'), fs = require('fs');
const esp = ms => new Promise(r => setTimeout(r, ms));
const CASOS = {
 'A gabarito em linha depois do bloco': { t: ['Brasília','4','Azul'], n: 3, ok: [1, 2, 0], txt: `1) Qual a capital do Brasil?\na) Rio\nb) Brasília\nc) São Paulo\nGabarito: B\n\n2) Quanto é 2+2?\na) 3\nb) 5\nc) 4\nGabarito: C\n\n3) Cor do céu?\na) Azul\nb) Verde\nc) Preto\nGabarito: A` },
 'B gabarito no fim do documento': { t: ['Brasília','4','Azul'], n: 3, ok: [1, 2, 0], txt: `1. Qual a capital do Brasil?\nA) Rio\nB) Brasília\nC) São Paulo\n2. Quanto é 2+2?\nA) 3\nB) 5\nC) 4\n3. Cor do céu?\nA) Azul\nB) Verde\nC) Preto\n\nGABARITO\n1-B  2-C  3-A` },
 'C sem linha em branco entre questões': { t: ['Brasília','4','Azul'], n: 3, ok: [1, 2, 0], txt: `Questão 1 - Qual a capital do Brasil?\na) Rio\nb) Brasília*\nc) São Paulo\nQuestão 2 - Quanto é 2+2?\na) 3\nb) 5\nc) 4*\nQuestão 3 - Cor do céu?\na) Azul*\nb) Verde\nc) Preto` },
 'D alternativas na mesma linha': { t: ['Brasília','Azul'], n: 2, ok: [1, 0], txt: `1) Qual a capital do Brasil? a) Rio b) Brasília c) São Paulo\nResposta: b\n\n2) Cor do céu? a) Azul b) Verde c) Preto\nResposta: a` },
 'E resposta correta por texto': { t: ['Brasília','4'], n: 2, ok: [1, 2], txt: `1) Qual a capital do Brasil?\n- Rio\n- Brasília\n- São Paulo\nResposta correta: Brasília\n\n2) Quanto é 2+2?\n- 3\n- 5\n- 4\nResposta correta: 4` },
 'F marcadores (X) e ✓': { t: ['Brasília','Azul'], n: 2, ok: [1, 0], txt: `1) Qual a capital do Brasil?\n( ) Rio\n(X) Brasília\n( ) São Paulo\n\n2) Cor do céu?\n✓ Azul\n  Verde\n  Preto` },
 'G verdadeiro ou falso': { t: ['Verdadeiro','Falso'], n: 2, ok: [0, 1], txt: `1) O sol é uma estrela?\n( ) Falso\n(X) Verdadeiro\n\n2) A lua é quadrada?\n( ) Verdadeiro\n(X) Falso` },
 'H alternativas sem letra e pergunta sem número': { t: ['Brasília','Azul'], n: 2, ok: [1, 0], txt: `Qual a capital do Brasil?\nRio de Janeiro\nBrasília (correta)\nSão Paulo\n\nQual a cor do céu?\nAzul (correta)\nVerde\nPreto` },
 'I perguntas com quebra de linha no enunciado': { t: ['Seguir o procedimento','É obrigatório'], n: 2, ok: [1, 0], txt: `1) Em relação aos procedimentos de segurança\nda empresa, qual a atitude correta?\na) Ignorar\nb) Seguir o procedimento*\nc) Esperar\n\n2) Sobre o uso do cinto de segurança\nnos veículos da frota:\na) É obrigatório*\nb) É opcional\nc) Só na estrada` },
 'J 5 alternativas (a-e) e gabarito numérico': { t: ['cinco','certa'], n: 2, ok: [4, 0], txt: `1) Pergunta um?\na) um\nb) dois\nc) três\nd) quatro\ne) cinco\nGabarito: 5\n\n2) Pergunta dois?\na) certa\nb) x\nc) y\nd) z\ne) w\nGabarito: 1` }
};
const TABELAS = {
 'K tabela com gabarito em letra': { t: ['Brasília','4','Azul'], n: 3, ok: [1, 2, 0], doc: { tipo: 'planilha', nome: 't.xlsx', folhas: [{ nome: 'P', linhas: [['Pergunta', 'A', 'B', 'C', 'Gabarito', 'Assunto'], ['Capital do Brasil?', 'Rio', 'Brasília', 'SP', 'B', 'Geografia'], ['2+2?', '3', '5', '4', 'C', 'Matemática'], ['Cor do céu?', 'Azul', 'Verde', 'Preto', 'A', 'Natureza']] }] } },
 'L tabela vertical (alternativas em linhas abaixo)': { t: ['Brasília','Azul'], n: 2, ok: [1, 0], doc: { tipo: 'planilha', nome: 't.xlsx', folhas: [{ nome: 'P', linhas: [['1', 'Capital do Brasil?', ''], ['', 'Rio', ''], ['', 'Brasília', 'x'], ['', 'São Paulo', ''], ['2', 'Cor do céu?', ''], ['', 'Azul', 'x'], ['', 'Verde', ''], ['', 'Preto', '']] }] } },
 'M duas abas': { t: ['Brasília','Azul','4'], n: 3, ok: [1, 0, 2], doc: { tipo: 'planilha', nome: 't.xlsx', folhas: [{ nome: 'Seg', linhas: [['Pergunta', 'A', 'B', 'C', 'Gabarito'], ['Capital do Brasil?', 'Rio', 'Brasília', 'SP', 'B'], ['Cor do céu?', 'Azul', 'Verde', 'Preto', 'A']] }, { nome: 'Outra', linhas: [['Pergunta', 'A', 'B', 'C', 'Gabarito'], ['2+2?', '3', '5', '4', 'C']] }] } },
 'N colunas "Resposta correta" + "Resposta errada 1..n"': { t: ['Brasília','4'], n: 2, ok: [0, 0], doc: { tipo: 'planilha', nome: 't.xlsx', folhas: [{ nome: 'P', linhas: [['Pergunta', 'Resposta correta', 'Resposta errada 1', 'Resposta errada 2'], ['Capital do Brasil?', 'Brasília', 'Rio', 'SP'], ['2+2?', '4', '3', '5']] }] } },
 'O cabeçalho na linha 4 com título antes': { t: ['Brasília','Azul'], n: 2, ok: [1, 0], doc: { tipo: 'planilha', nome: 't.xlsx', folhas: [{ nome: 'P', linhas: [['Banco de perguntas PPG 2026', '', '', '', ''], ['', '', '', '', ''], ['Atualizado em 10/10', '', '', '', ''], ['Nº', 'Pergunta', 'Opção A', 'Opção B', 'Correta'], ['1', 'Capital do Brasil?', 'Rio', 'Brasília', 'B'], ['2', 'Cor do céu?', 'Azul', 'Verde', 'A']] }] } }
};
(async () => {
  const br = await puppeteer.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', args: ['--no-sandbox'] });
  const p = await br.newPage(); await p.goto('file:///home/claude/t2/index.html'); await esp(900);
  const res = await p.evaluate((CASOS, TABELAS) => {
    const out = {}; const I = PPGImport._internos;
    const avalia = (r, caso) => { const ps = r.perguntas || []; const corretas = ps.map(q => (q.options || []).filter(o => o.correct).map(o => o.text).join('+')); return { n: ps.length, esperado: caso.n, gab: corretas.join(' | '), esp: caso.t.join(' | '), estr: r.estrategia, ok: ps.length === caso.n && corretas.join(' | ') === caso.t.join(' | ') }; };
    for (const [k, c] of Object.entries(CASOS)) { try { out[k] = avalia(PPGImport.parsearPerguntas(I.textoParaDocumento(c.txt, 'teste.txt', 'texto')), c); } catch (e) { out[k] = { erro: e.message }; } }
    for (const [k, c] of Object.entries(TABELAS)) { try { out[k] = avalia(PPGImport.parsearPerguntas(c.doc), c); } catch (e) { out[k] = { erro: e.message }; } }
    return out;
  }, CASOS, TABELAS);
  let bons = 0; for (const [k, v] of Object.entries(res)) { if (v.ok) bons++; console.log((v.ok ? '✓ ' : '✗ ') + k.padEnd(52), v.erro ? 'ERRO ' + v.erro : `lidas ${v.n}/${v.esperado} · gabarito [${v.gab}] esperado [${v.esp}] · ${v.estr}`); }
  console.log(`\n${bons}/${Object.keys(res).length} formatos lidos corretamente`); await br.close();
})().catch(e => { console.error(e); process.exit(1); });
