/* =====================================================================
   PPG — IMPORTADOR UNIVERSAL
   Lê QUALQUER arquivo (Excel, CSV/TXT, Word, PDF, foto) e ajuda a entender:
     - Campanhas antigas: colunas, quem são os ganhadores (inclusive por COR
       de célula pintada), nomes de campanha e período
     - Banco de perguntas: o que é enunciado, o que são alternativas e qual
       é a correta (por asterisco, negrito, cor, "Gabarito: B", coluna...)
   Módulo sem tela: funciona no navegador (window.PPGImport) e em testes (Node).
   ===================================================================== */
(function (root) {
  'use strict';
  const PPGImport = {};

  /* ---------------------------- utilitários ---------------------------- */
  const norm = s => String(s == null ? '' : s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
  const txt = v => (v == null ? '' : String(v).replace(/\u00a0/g, ' ').trim());
  const ehNumero = s => /^-?\d+([.,]\d+)?%?$/.test(txt(s));
  PPGImport.norm = norm;

  function normalizarMatricula(v) {
    let s = txt(v).replace(/\.0+$/, '');
    return s;
  }
  PPGImport.normalizarMatricula = normalizarMatricula;
  const matKey = v => { let s = norm(normalizarMatricula(v)); if (/^\d+$/.test(s)) s = s.replace(/^0+(?=\d)/, ''); return s; };
  PPGImport.matKey = matKey;

  function aparar(folha) {
    // remove linhas vazias do começo/fim e colunas totalmente vazias (mantendo alinhamento de cores)
    const L = folha.linhas, C = folha.cores || [];
    let ini = 0, fim = L.length - 1;
    const vazia = r => !r.some(c => txt(c) !== '');
    while (ini <= fim && vazia(L[ini])) ini++;
    while (fim >= ini && vazia(L[fim])) fim--;
    const linhas = L.slice(ini, fim + 1), cores = C.slice(ini, fim + 1);
    const nCols = Math.max(0, ...linhas.map(r => r.length));
    const manter = [];
    for (let c = 0; c < nCols; c++) if (linhas.some(r => txt(r[c]) !== '') || cores.some(r => r && r[c])) manter.push(c);
    const pad = (r, def) => manter.map(c => (r && r[c] !== undefined ? r[c] : def));
    const out = Object.assign({}, folha, { linhas: linhas.map(r => pad(r, '')), cores: cores.length ? cores.map(r => pad(r, null)) : linhas.map(() => manter.map(() => null)), linhaOriginal: linhas.map((_, i) => ini + i + 1) });
    if (folha.negritos) out.negritos = folha.negritos.slice(ini, fim + 1).map(r => pad(r, false));
    return out;
  }

  /* ---------------------------- carregamento de bibliotecas (sob demanda) ---------------------------- */
  const LIBS = {
    xlsx: { url: 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js', global: 'XLSX' },
    pdfjs: { url: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js', global: 'pdfjsLib', depois: () => { root.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'; } },
    mammoth: { url: 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js', global: 'mammoth' },
    tesseract: { url: 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js', global: 'Tesseract' }
  };
  const _promessas = {};
  function carregarLib(nome) {
    const L = LIBS[nome];
    if (root[L.global]) { if (L.depois) try { L.depois(); } catch (e) {} return Promise.resolve(root[L.global]); }
    if (_promessas[nome]) return _promessas[nome];
    _promessas[nome] = new Promise((resolve, reject) => {
      if (!root.document) return reject(new Error('Biblioteca ' + nome + ' indisponível neste ambiente.'));
      const s = root.document.createElement('script');
      s.src = L.url; s.async = true;
      s.onload = () => { if (L.depois) try { L.depois(); } catch (e) {} resolve(root[L.global]); };
      s.onerror = () => { delete _promessas[nome]; reject(new Error('Não foi possível carregar o leitor de ' + nome + '. Verifique a internet.')); };
      root.document.head.appendChild(s);
    });
    return _promessas[nome];
  }
  PPGImport.carregarLib = carregarLib;

  /* ---------------------------- LEITORES ---------------------------- */
  // --- Excel / ODS (inclui cor de preenchimento das células) ---
  const INDEXADAS = { 8: '000000', 9: 'FFFFFF', 10: 'FF0000', 11: '00FF00', 12: '0000FF', 13: 'FFFF00', 14: 'FF00FF', 15: '00FFFF', 22: 'C0C0C0', 26: 'FFFF00', 27: '00FFFF', 43: 'FFFF99', 44: '99CCFF', 45: 'FF99CC', 46: 'CC99FF', 47: 'FFCC99', 50: '33CCCC', 51: '99CC00', 52: 'FFCC00', 53: 'FF9900', 54: 'FF6600' };
  function corDaCelula(cel) {
    const s = cel && cel.s;
    if (!s || s.patternType === 'none') return null;
    const f = s.fgColor;
    if (!f) return null;
    let hex = null;
    if (f.rgb) hex = String(f.rgb).slice(-6).toUpperCase();
    else if (f.indexed != null && INDEXADAS[f.indexed]) hex = INDEXADAS[f.indexed];
    if (!hex || !/^[0-9A-F]{6}$/.test(hex)) return null;
    const r = parseInt(hex.slice(0, 2), 16), g = parseInt(hex.slice(2, 4), 16), b = parseInt(hex.slice(4, 6), 16);
    if (r > 244 && g > 244 && b > 244) return null; // branco
    return '#' + hex;
  }
  function textoDaCelula(cel) {
    if (!cel) return '';
    if (cel.w != null && String(cel.w) !== '') return txt(cel.w);
    return cel.v == null ? '' : txt(cel.v);
  }
  function lerExcel(buf, nomeArq) {
    const XL = root.XLSX;
    const wb = XL.read(new Uint8Array(buf), { type: 'array', cellStyles: true });
    const folhas = wb.SheetNames.map(nome => {
      const ws = wb.Sheets[nome];
      if (!ws || !ws['!ref']) return { nome, linhas: [], cores: [], linhaOriginal: [] };
      const rg = XL.utils.decode_range(ws['!ref']);
      const linhas = [], cores = [];
      for (let r = rg.s.r; r <= rg.e.r; r++) {
        const lin = [], cor = [];
        for (let c = rg.s.c; c <= rg.e.c; c++) {
          const cel = ws[XL.utils.encode_cell({ r, c })];
          lin.push(textoDaCelula(cel)); cor.push(corDaCelula(cel));
        }
        linhas.push(lin); cores.push(cor);
      }
      return aparar({ nome, linhas, cores });
    }).filter(f => f.linhas.length);
    return { nome: nomeArq, tipo: 'planilha', folhas, textoLinhas: [], avisos: [] };
  }

  // --- texto delimitado (CSV, TSV, TXT) ---
  function decodificar(buf) {
    const u8 = new Uint8Array(buf);
    try { return new TextDecoder('utf-8', { fatal: true }).decode(u8).replace(/^\uFEFF/, ''); }
    catch (e) { return new TextDecoder('windows-1252').decode(u8); }
  }
  function parseCsv(texto, delim) {
    const linhas = []; let lin = [], cel = '', aspas = false;
    for (let i = 0; i < texto.length; i++) {
      const ch = texto[i];
      if (aspas) {
        if (ch === '"') { if (texto[i + 1] === '"') { cel += '"'; i++; } else aspas = false; } else cel += ch;
      } else if (ch === '"' && cel === '') aspas = true;
      else if (ch === delim) { lin.push(cel); cel = ''; }
      else if (ch === '\n') { lin.push(cel); linhas.push(lin); lin = []; cel = ''; }
      else if (ch !== '\r') cel += ch;
    }
    if (cel !== '' || lin.length) { lin.push(cel); linhas.push(lin); }
    return linhas;
  }
  function detectarDelimitador(texto) {
    const amostra = texto.split(/\r?\n/).filter(l => l.trim()).slice(0, 30).join('\n');
    let melhor = null, melhorScore = 0;
    [';', '\t', '|', ','].forEach(d => {
      const ls = parseCsv(amostra, d).filter(l => l.length);
      if (!ls.length) return;
      const cont = {}; ls.forEach(l => { cont[l.length] = (cont[l.length] || 0) + 1; });
      let modal = 1, cobertura = 0;
      Object.keys(cont).forEach(k => { if (cont[k] > cobertura) { cobertura = cont[k]; modal = +k; } });
      const score = modal > 1 ? (cobertura / ls.length) * modal : 0;
      if (score > melhorScore + 0.001) { melhorScore = score; melhor = d; }
    });
    return melhor;
  }
  function textoParaDocumento(texto, nomeArq, tipo) {
    const brutas = texto.split(/\r?\n/);
    const textoLinhas = brutas.map(t => ({ t: txt(t), b: false }));
    const delim = detectarDelimitador(texto);
    let folhas = [];
    if (delim) {
      const linhas = parseCsv(texto, delim).map(r => r.map(txt));
      folhas = [aparar({ nome: tipo === 'imagem' ? 'Imagem' : 'Dados', linhas, cores: [] })];
    } else {
      // sem delimitador: tenta separar por 2+ espaços (colunas alinhadas em PDF/foto)
      const partes = brutas.map(l => l.trim()).filter(Boolean).map(l => l.split(/\t| {2,}/).map(txt));
      const multi = partes.filter(p => p.length >= 2).length;
      if (partes.length && multi / partes.length > 0.6) folhas = [aparar({ nome: 'Dados', linhas: partes, cores: [] })];
      else folhas = [aparar({ nome: 'Texto', linhas: brutas.map(l => [txt(l)]).filter(r => r[0] !== ''), cores: [] })];
    }
    return { nome: nomeArq, tipo: tipo || 'texto', folhas: folhas.filter(f => f.linhas.length), textoLinhas, avisos: [] };
  }

  // --- HTML (usado por Word e arquivos .html) ---
  function htmlParaDocumento(html, nomeArq, tipo, ParserCls) {
    const P = ParserCls || root.DOMParser;
    const doc = new P().parseFromString('<!DOCTYPE html><html><body>' + html + '</body></html>', 'text/html');
    const folhas = [], textoLinhas = [];
    const boldRatio = el => { const t = txt(el.textContent); if (!t) return false; let b = 0; el.querySelectorAll('strong,b').forEach(x => { b += txt(x.textContent).length; }); return b / t.length >= 0.6; };
    const letra = i => String.fromCharCode(97 + (i % 26));
    function percorrerLista(lista, nivel) {
      const ordenada = lista.tagName === 'OL';
      let i = 0;
      Array.from(lista.children).forEach(li => {
        if (li.tagName !== 'LI') return;
        const clone = li.cloneNode(true);
        clone.querySelectorAll('ul,ol').forEach(x => x.remove());
        const t = txt(clone.textContent);
        const prefixo = ordenada ? (nivel === 0 ? (i + 1) + '. ' : letra(i) + ') ') : '- ';
        if (t) textoLinhas.push({ t: prefixo + t, b: boldRatio(clone) });
        li.querySelectorAll(':scope > ul, :scope > ol').forEach(sub => percorrerLista(sub, nivel + 1));
        i++;
      });
    }
    let nTab = 0;
    Array.from(doc.body.children).forEach(el => {
      const tag = el.tagName;
      if (tag === 'TABLE') {
        nTab++;
        const linhas = [], negritos = [];
        el.querySelectorAll('tr').forEach(tr => {
          const cs = Array.from(tr.querySelectorAll('th,td'));
          linhas.push(cs.map(c => txt(c.textContent))); negritos.push(cs.map(c => boldRatio(c)));
        });
        const f = aparar({ nome: 'Tabela ' + nTab, linhas, cores: [], negritos });
        if (f.linhas.length) folhas.push(f);
      } else if (tag === 'UL' || tag === 'OL') percorrerLista(el, 0);
      else {
        const t = txt(el.textContent);
        if (t) t.split(/\n+/).forEach(parte => { if (txt(parte)) textoLinhas.push({ t: txt(parte), b: boldRatio(el) }); });
      }
    });
    if (!folhas.length && textoLinhas.length) folhas.push(aparar({ nome: 'Texto', linhas: textoLinhas.map(l => [l.t]), cores: [] }));
    return { nome: nomeArq, tipo: tipo || 'docx', folhas, textoLinhas, avisos: [] };
  }
  async function lerDocx(buf, nomeArq) {
    const m = await carregarLib('mammoth');
    const res = await m.convertToHtml({ arrayBuffer: buf });
    return htmlParaDocumento(res.value, nomeArq, 'docx');
  }

  // --- PDF: junta os pedacinhos de texto em linhas e colunas pela posição ---
  function linhasDeItens(items) {
    const it = items.filter(i => txt(i.str) !== '');
    if (!it.length) return [];
    it.sort((a, b) => (b.y - a.y) || (a.x - b.x));
    const alturas = it.map(i => i.h || 10).sort((a, b) => a - b);
    const tolY = Math.max(2, (alturas[Math.floor(alturas.length / 2)] || 10) * 0.55);
    const grupos = []; let atual = null;
    it.forEach(i => {
      if (!atual || Math.abs(atual.y - i.y) > tolY) { atual = { y: i.y, itens: [] }; grupos.push(atual); }
      atual.itens.push(i);
    });
    return grupos.map(g => {
      g.itens.sort((a, b) => a.x - b.x);
      const chars = g.itens.reduce((a, i) => a + i.str.length, 0) || 1;
      const larg = g.itens.reduce((a, i) => a + (i.w || 0), 0);
      const cw = larg > 0 ? larg / chars : 5;
      const limite = Math.max(cw * 2.2, 6);
      const cels = []; let fim = null, cur = '';
      g.itens.forEach(i => {
        const gap = fim == null ? 0 : i.x - fim;
        if (fim != null && gap > limite) { cels.push(cur); cur = i.str; }
        else cur += (fim != null && gap > cw * 0.3 && !/\s$/.test(cur) && !/^\s/.test(i.str) ? ' ' : '') + i.str;
        fim = i.x + (i.w || i.str.length * cw);
      });
      cels.push(cur);
      return cels.map(txt).filter(c => c !== '');
    }).filter(r => r.length);
  }
  function pdfItensParaDocumento(paginasItens, nomeArq) {
    let linhas = [];
    paginasItens.forEach(items => { linhas = linhas.concat(linhasDeItens(items)); });
    const nCols = Math.max(1, ...linhas.map(r => r.length));
    const retangular = linhas.map(r => r.concat(Array(nCols - r.length).fill('')));
    const folha = aparar({ nome: 'PDF', linhas: retangular, cores: [] });
    return { nome: nomeArq, tipo: 'pdf', folhas: folha.linhas.length ? [folha] : [], textoLinhas: linhas.map(r => ({ t: r.join(' '), b: false })), avisos: [] };
  }
  async function lerPdf(buf, nomeArq) {
    const pdfjs = await carregarLib('pdfjs');
    const pdf = await pdfjs.getDocument({ data: new Uint8Array(buf) }).promise;
    const paginas = [];
    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      const tc = await page.getTextContent();
      paginas.push(tc.items.map(i => ({ str: i.str, x: i.transform[4], y: i.transform[5], w: i.width, h: i.height || Math.abs(i.transform[3]) || 10 })));
    }
    const d = pdfItensParaDocumento(paginas, nomeArq);
    if (!d.textoLinhas.length) d.avisos.push('Este PDF parece ser uma imagem escaneada (sem texto). Tente enviar como foto/imagem para eu ler pelo reconhecimento de texto.');
    return d;
  }

  // --- imagem (OCR) ---
  async function lerImagem(arquivo, nomeArq, onProgresso) {
    const T = await carregarLib('tesseract');
    const r = await T.recognize(arquivo, 'por', { logger: m => { if (onProgresso && m && m.status) onProgresso(m.status, m.progress); } });
    const d = textoParaDocumento(r.data.text || '', nomeArq, 'imagem');
    d.avisos.push('Texto lido de uma imagem: confira a prévia com atenção, o reconhecimento pode errar letras.');
    return d;
  }

  /* ---------------------------- entrada única ---------------------------- */
  const EXT = {
    planilha: ['xlsx', 'xlsm', 'xlsb', 'xls', 'ods', 'fods'],
    texto: ['csv', 'tsv', 'txt', 'tab', 'text', 'md', 'log'],
    docx: ['docx'], pdf: ['pdf'], html: ['html', 'htm'],
    imagem: ['png', 'jpg', 'jpeg', 'webp', 'bmp', 'gif', 'tif', 'tiff']
  };
  function tipoPorNome(nome, mime) {
    const ext = (String(nome).split('.').pop() || '').toLowerCase();
    for (const t in EXT) if (EXT[t].indexOf(ext) !== -1) return t;
    if (/pdf/.test(mime || '')) return 'pdf';
    if (/^image\//.test(mime || '')) return 'imagem';
    if (/^text\//.test(mime || '')) return 'texto';
    if (ext === 'doc') return 'doc';
    return 'desconhecido';
  }
  PPGImport.tipoPorNome = tipoPorNome;
  function lerComoArrayBuffer(arquivo) {
    if (arquivo.arrayBuffer) return arquivo.arrayBuffer();
    return new Promise((res, rej) => { const fr = new root.FileReader(); fr.onload = () => res(fr.result); fr.onerror = () => rej(fr.error); fr.readAsArrayBuffer(arquivo); });
  }
  async function lerArquivoUniversal(arquivo, opcoes) {
    opcoes = opcoes || {};
    const tipo = tipoPorNome(arquivo.name, arquivo.type);
    if (tipo === 'doc') throw new Error('Arquivos Word antigos (.doc) não são lidos. Abra no Word e salve como .docx, e envie de novo.');
    if (tipo === 'desconhecido') throw new Error('Formato não reconhecido. Aceito: Excel (.xlsx/.xls/.ods), CSV/TXT, Word (.docx), PDF e imagens (foto/print).');
    const buf = tipo === 'imagem' ? null : await lerComoArrayBuffer(arquivo);
    if (tipo === 'planilha') { await carregarLib('xlsx'); return lerExcel(buf, arquivo.name); }
    if (tipo === 'texto') return textoParaDocumento(decodificar(buf), arquivo.name, 'texto');
    if (tipo === 'docx') return lerDocx(buf, arquivo.name);
    if (tipo === 'html') return htmlParaDocumento(decodificar(buf), arquivo.name, 'html');
    if (tipo === 'pdf') return lerPdf(buf, arquivo.name);
    if (tipo === 'imagem') return lerImagem(arquivo, arquivo.name, opcoes.onProgresso);
    throw new Error('Formato não suportado.');
  }
  PPGImport.lerArquivoUniversal = lerArquivoUniversal;
  PPGImport._internos = { lerExcel, textoParaDocumento, htmlParaDocumento, pdfItensParaDocumento, linhasDeItens, parseCsv, detectarDelimitador, aparar };

  /* =====================================================================
     CAMPANHAS ANTIGAS — cabeçalho, colunas, ganhadores
     ===================================================================== */
  const ALIAS = {
    matricula: ['matricula', 'matric', 'chapa', 'registro', 'cod colaborador', 'codigo colaborador', 'id colaborador', 're', 'mat'],
    nome: ['nome', 'colaborador', 'funcionario', 'participante', 'empregado', 'ganhador', 'ganhadores', 'premiado', 'sorteado', 'vencedor', 'contemplado'],
    setor: ['setor', 'departamento', 'depto', 'area'],
    filial: ['filial', 'unidade', 'loja', 'regional', 'local'],
    funcao: ['funcao', 'cargo', 'posicao'],
    percentual: ['%', 'acerto', 'percent', 'nota', 'aproveitamento', 'pontuacao', 'desempenho'],
    ganhador: ['ganhador', 'premiado', 'sorteado', 'vencedor', 'contemplado', 'resultado do sorteio', 'ganhou'],
    premio: ['premio', 'brinde', 'recompensa', 'valor do premio'],
    campanha: ['campanha', 'rodada', 'edicao', 'programa', 'ppg'],
    periodoInicio: ['data inicio', 'inicio', 'periodo inicio', 'data de inicio', 'abertura'],
    periodoFim: ['data fim', 'fim', 'termino', 'periodo fim', 'encerramento', 'data de termino']
  };
  PPGImport.ROTULOS = { matricula: 'Matrícula', nome: 'Nome', setor: 'Setor', filial: 'Filial', funcao: 'Função/Cargo', percentual: '% de acertos', ganhador: 'Ganhador (coluna Sim/Não)', premio: 'Prêmio', campanha: 'Nome da campanha (coluna)', periodoInicio: 'Início do período', periodoFim: 'Fim do período' };
  const ALIAS_PLANO = Object.keys(ALIAS).reduce((a, k) => a.concat(ALIAS[k]), []);
  const ehAlias = (c, a) => (a.length <= 3 ? (c === a || c.split(/[^a-z%0-9]+/).indexOf(a) !== -1) : c === a || c.indexOf(a) !== -1);

  PPGImport.sugerirCabecalho = function (linhas) {
    let melhor = -1, melhorScore = 1;
    for (let i = 0; i < Math.min(linhas.length, 25); i++) {
      const cels = linhas[i].map(norm).filter(Boolean);
      if (cels.length < 2) continue;
      let s = 0; cels.forEach(c => { if (ALIAS_PLANO.some(a => ehAlias(c, a))) s++; });
      if (s > melhorScore) { melhorScore = s; melhor = i; }
    }
    if (melhor >= 0) return melhor;
    for (let i = 0; i < Math.min(linhas.length - 1, 25); i++) {
      const cels = linhas[i].filter(c => txt(c));
      if (cels.length >= 2 && cels.filter(c => !ehNumero(c)).length >= cels.length * 0.8) return i;
    }
    return -1;
  };
  const SIM = /^(sim|s|x|xx|ok|yes|y|true|1|ganhou|ganhador|ganhadora|premiado|premiada|sorteado|sorteada|vencedor|vencedora|contemplado|contemplada|\u2713|\u2714|\u2705|\u2611)$/i;
  PPGImport.valorEhSim = v => SIM.test(norm(v));
  function colunaPareceSimNao(valores) {
    const v = valores.map(norm).filter(Boolean);
    if (v.length < 2) return false;
    const unicos = Array.from(new Set(v));
    return unicos.length <= 4 && unicos.every(u => /^(sim|nao|n|s|x|ok|yes|no|true|false|1|0|ganhou|ganhador|premiado|-|\u2713|\u2714)$/.test(u));
  }
  PPGImport.sugerirMapeamento = function (linhas, headerIdx) {
    const cab = headerIdx >= 0 ? linhas[headerIdx].map(norm) : [];
    const dados = linhas.slice(headerIdx + 1);
    const nCols = Math.max(0, ...linhas.map(r => r.length));
    const col = c => dados.map(r => txt(r[c])).filter(Boolean);
    const mapa = {}; const usadas = new Set();
    const tomar = (papel, c) => { if (c >= 0 && !usadas.has(c)) { mapa[papel] = c; usadas.add(c); return true; } return false; };
    const ordem = ['matricula', 'ganhador', 'nome', 'setor', 'filial', 'funcao', 'percentual', 'premio', 'campanha', 'periodoInicio', 'periodoFim'];
    ordem.forEach(papel => {
      let achou = -1;
      for (let c = 0; c < nCols && achou < 0; c++) {
        if (usadas.has(c) || !cab[c]) continue;
        if (ALIAS[papel].some(a => ehAlias(cab[c], a))) {
          if (papel === 'ganhador' && !colunaPareceSimNao(col(c))) continue; // "Ganhador" com nomes => é a coluna de nome
          achou = c;
        }
      }
      if (achou >= 0) tomar(papel, achou);
    });
    // por conteúdo, quando o cabeçalho não ajudou
    if (mapa.matricula == null) {
      for (let c = 0; c < nCols; c++) {
        if (usadas.has(c)) continue; const v = col(c);
        if (v.length >= 2 && v.filter(x => /^\d{3,9}(\.0)?$/.test(x)).length / v.length >= 0.8 && new Set(v).size / v.length > 0.8) { tomar('matricula', c); break; }
      }
    }
    if (mapa.nome == null) {
      let melhor = -1, ms = 0;
      for (let c = 0; c < nCols; c++) {
        if (usadas.has(c)) continue; const v = col(c); if (v.length < 2) continue;
        const s = v.filter(x => /^[A-Za-zÀ-ÿ' .-]{4,}$/.test(x) && /\s/.test(x)).length / v.length;
        if (s > ms && s >= 0.6) { ms = s; melhor = c; }
      }
      tomar('nome', melhor);
    }
    if (mapa.percentual == null) {
      for (let c = 0; c < nCols; c++) {
        if (usadas.has(c)) continue; const v = col(c);
        if (v.length >= 2 && v.every(x => ehNumero(x) && parseFloat(x.replace(',', '.').replace('%', '')) <= 100)) { if (/%|acert|nota|percent/.test(cab[c] || '')) { tomar('percentual', c); break; } }
      }
    }
    if (mapa.ganhador == null) {
      for (let c = 0; c < nCols; c++) { if (!usadas.has(c) && colunaPareceSimNao(col(c)) && /ganh|premi|sorte|venc|contemp/.test(cab[c] || '')) { tomar('ganhador', c); break; } }
    }
    return mapa;
  };

  PPGImport.analisarCores = function (folha, headerIdx) {
    const ignoradas = new Set();
    if (headerIdx >= 0 && folha.cores[headerIdx]) folha.cores[headerIdx].forEach(c => { if (c) ignoradas.add(c); });
    const grupos = {};
    folha.linhas.forEach((lin, i) => {
      if (i <= headerIdx) return;
      if (!lin.some(c => txt(c))) return;
      const vistas = new Set();
      (folha.cores[i] || []).forEach(c => { if (c && !ignoradas.has(c)) vistas.add(c); });
      vistas.forEach(c => { (grupos[c] = grupos[c] || { cor: c, linhas: [] }).linhas.push(i); });
    });
    const total = folha.linhas.slice(headerIdx + 1).filter(l => l.some(c => txt(c))).length || 1;
    return Object.keys(grupos).map(k => grupos[k]).sort((a, b) => a.linhas.length - b.linhas.length).map(g => Object.assign(g, { qtd: g.linhas.length, proporcao: g.linhas.length / total }));
  };

  function paraPercentual(v, tudoFracao) {
    const s = txt(v); if (!s) return '';
    const n = parseFloat(s.replace('%', '').replace(',', '.'));
    if (isNaN(n)) return '';
    return Math.round((tudoFracao && n <= 1 ? n * 100 : n) * 100) / 100;
  }
  PPGImport.montarRegistros = function (folha, cfg) {
    const { headerIdx, mapa } = cfg;
    const linhas = folha.linhas;
    const cab = headerIdx >= 0 ? linhas[headerIdx] : linhas[0].map((_, i) => 'Coluna ' + (i + 1));
    const coresGanha = new Set(cfg.coresGanhador || []);
    const manual = cfg.manual || {};
    const dados = []; const idxs = [];
    for (let i = headerIdx + 1; i < linhas.length; i++) {
      const l = linhas[i]; if (!l.some(c => txt(c))) continue;
      const mat = mapa.matricula != null ? normalizarMatricula(l[mapa.matricula]) : '';
      const nome = mapa.nome != null ? txt(l[mapa.nome]) : '';
      if (!mat && !nome) continue;
      dados.push(l); idxs.push(i);
    }
    const pcts = mapa.percentual != null ? dados.map(l => txt(l[mapa.percentual])).filter(Boolean) : [];
    const tudoFracao = pcts.length > 0 && pcts.every(p => ehNumero(p) && !/%/.test(p) && parseFloat(p.replace(',', '.')) <= 1);
    const extras = cfg.colunasExtras || [];
    const registros = dados.map((l, k) => {
      const i = idxs[k];
      let ganhou = false, motivo = '';
      if (manual[i] !== undefined) { ganhou = !!manual[i]; motivo = 'manual'; }
      else {
        const cs = folha.cores[i] || [];
        if (coresGanha.size && cs.some(c => c && coresGanha.has(c))) { ganhou = true; motivo = 'cor'; }
        else if (mapa.ganhador != null && SIM.test(norm(l[mapa.ganhador]))) { ganhou = true; motivo = 'coluna'; }
      }
      const ex = {}; extras.forEach(c => { const v = txt(l[c]); if (v) ex[txt(cab[c]) || ('Coluna ' + (c + 1))] = v; });
      return {
        _linha: i,
        campanha: mapa.campanha != null && txt(l[mapa.campanha]) ? txt(l[mapa.campanha]) : (cfg.campanhaNome || ''),
        periodoInicio: mapa.periodoInicio != null && txt(l[mapa.periodoInicio]) ? (PPGImport.normalizarData(l[mapa.periodoInicio]) || txt(l[mapa.periodoInicio])) : (cfg.periodoInicio || ''),
        periodoFim: mapa.periodoFim != null && txt(l[mapa.periodoFim]) ? (PPGImport.normalizarData(l[mapa.periodoFim]) || txt(l[mapa.periodoFim])) : (cfg.periodoFim || ''),
        matricula: mapa.matricula != null ? normalizarMatricula(l[mapa.matricula]) : '',
        nome: mapa.nome != null ? txt(l[mapa.nome]) : '',
        setor: mapa.setor != null ? txt(l[mapa.setor]) : '',
        filial: mapa.filial != null ? txt(l[mapa.filial]) : '',
        funcao: mapa.funcao != null ? txt(l[mapa.funcao]) : '',
        percentualAcertos: mapa.percentual != null ? paraPercentual(l[mapa.percentual], tudoFracao) : '',
        ganhador: ganhou, _motivo: motivo,
        premio: mapa.premio != null && txt(l[mapa.premio]) ? txt(l[mapa.premio]) : (ganhou ? (cfg.premioPadrao || '') : ''),
        extras: ex
      };
    });
    return registros;
  };
  // completa a matrícula pelo nome quando a planilha antiga não tinha matrícula
  PPGImport.resolverMatriculasPorNome = function (registros, roster) {
    const porNome = {};
    (roster || []).forEach(c => { const k = norm(c.nome); (porNome[k] = porNome[k] || []).push(c); });
    let resolvidos = 0;
    registros.forEach(r => {
      if (r.matricula || !r.nome) return;
      const achados = porNome[norm(r.nome)];
      if (achados && achados.length === 1) { r.matricula = String(achados[0].matricula); r._matriculaPorNome = true; if (!r.setor) r.setor = achados[0].setor || ''; if (!r.filial) r.filial = achados[0].filial || ''; resolvidos++; }
    });
    return resolvidos;
  };

  // "15/03/2024", "3/15/24", "2024-03-15", "03/2024", "2024" => "AAAA-MM-DD" (ou "" se não entender)
  PPGImport.normalizarData = function (v) {
    const s = txt(v); if (!s) return '';
    let m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
    if (m) return m[1] + '-' + m[2] + '-' + m[3];
    m = /^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})/.exec(s);
    if (m) {
      let a = +m[1], b = +m[2], y = +m[3]; if (y < 100) y += 2000;
      let d = a, mo = b; if (a <= 12 && b > 12) { d = b; mo = a; }
      if (mo > 12 || mo < 1 || d > 31 || d < 1) return '';
      return y + '-' + String(mo).padStart(2, '0') + '-' + String(d).padStart(2, '0');
    }
    m = /^(\d{1,2})[\/.\-](\d{4})$/.exec(s);
    if (m && +m[1] >= 1 && +m[1] <= 12) return m[2] + '-' + String(+m[1]).padStart(2, '0') + '-28';
    if (/^(19|20)\d{2}$/.test(s)) return s + '-12-31';
    return '';
  };

  PPGImport.nomeCampanhaSugerido = function (nomeArq, nomeAba) {
    const aba = txt(nomeAba);
    if (aba && !/^(plan|sheet|folha|tabela|dados|pdf|texto|imagem)\s*\d*$/i.test(aba)) return aba;
    return txt(nomeArq).replace(/\.[^.]+$/, '').replace(/[_]+/g, ' ');
  };

  /* =====================================================================
     BANCO DE PERGUNTAS — entender enunciado × alternativas × gabarito
     ===================================================================== */
  const RE_MARC_FIM = /\s*(\(\s*(correta|certa|certo|resposta|gabarito|x)\s*\)|\[\s*x\s*\]|[\u2713\u2714\u2705\u2611]|\*+)\s*$/i;
  const RE_MARC_INI = /^\s*(\(\s*x\s*\)|\[\s*x\s*\]|[\u2713\u2714\u2705\u2611]|\*{1,2})\s*/i;
  const RE_ALT_LETRA = /^\s*[\(\[]?\s*([a-hA-H])\s*[\)\]\.\-\u2013:]\s+(\S.*)$/;
  const RE_ALT_BULLET = /^\s*[-\u2022*\u25CB\u25E6\u25AA\u25A1\u2610\u2611\u2713\u2714\u2705]\s+(\S.*)$/;
  const RE_GAB = /^\s*(?:gabarito|resposta(?:s)?(?:\s+correta(?:s)?)?|resp\.?|correta(?:s)?|alternativa(?:s)?\s+correta(?:s)?)\s*[:\-\u2013=]?\s*(.+)$/i;
  const RE_Q_NUM = /^\s*(?:(?:quest[aã]o|pergunta|q)\s*)?(\d{1,3})\s*[\.\)\-\u2013:]\s*(\S.*)$/i;
  const RE_Q_PALAVRA = /^\s*(?:quest[aã]o|pergunta)\s*(?:n[\u00ba\u00b0o.]*\s*)?(\d{0,3})\s*[:\-\u2013.)]?\s*(.*)$/i;

  function limparMarcadores(t) {
    let marcada = false, s = t;
    if (RE_MARC_INI.test(s)) { marcada = true; s = s.replace(RE_MARC_INI, ''); }
    while (RE_MARC_FIM.test(s)) { marcada = true; s = s.replace(RE_MARC_FIM, ''); }
    return { texto: s.replace(/\*\*/g, '').trim(), marcada };
  }
  function letrasDoGabarito(s) {
    const t = norm(s).replace(/[^a-h0-9, ;/e\-]/g, ' ');
    const L = new Set();
    t.split(/[\s,;/]+|\be\b/).forEach(p => { if (/^[a-h]$/.test(p)) L.add(p); else if (/^[1-8]$/.test(p)) L.add(String.fromCharCode(96 + +p)); });
    return Array.from(L);
  }
  function fecharQuestao(q, lista, avisos) {
    if (!q) return;
    q.texto = q.texto.replace(/\s+/g, ' ').trim();
    q.options.forEach(o => { o.text = o.text.replace(/\s+/g, ' ').trim(); });
    q.options = q.options.filter(o => o.text);
    if (!q.texto || q.options.length < 2) { if (q.texto) avisos.push('Ignorado (menos de 2 alternativas): "' + q.texto.slice(0, 60) + '"'); return; }
    const n = q.options.filter(o => o.correct).length;
    q.type = n > 1 ? 'multiplas_respostas' : 'unica';
    q.semGabarito = n === 0;
    lista.push(q);
  }

  /* Estratégia A/B: linhas de planilha (uma pergunta por linha, alternativas nas colunas seguintes) */
  function parsearTabela(folha) {
    const L = folha.linhas, C = folha.cores || [], N = folha.negritos || [];
    if (L.length < 1) return null;
    // cabeçalho?
    let h = -1;
    for (let i = 0; i < Math.min(L.length, 8); i++) {
      const cs = L[i].map(norm);
      if (cs.some(c => /^(pergunta|enunciado|questao|quest[aã]o|texto da pergunta)/.test(c)) && cs.filter(Boolean).length >= 3) { h = i; break; }
    }
    const lista = [], avisos = [];
    if (h >= 0) {
      const cab = L[h].map(norm);
      const iQ = cab.findIndex(c => /^(pergunta|enunciado|questao|texto da pergunta)/.test(c));
      const iAlt = []; cab.forEach((c, i) => { if (i !== iQ && /^(alternativa|opcao|resposta|alt\.?|item)?\s*[\(\[]?([a-h]|[1-8])[\)\]]?$/.test(c) || /^(alternativa|opcao|alt)\s*[a-h1-8]/.test(c)) iAlt.push(i); });
      const iGab = cab.findIndex((c, i) => i !== iQ && iAlt.indexOf(i) === -1 && /(gabarito|correta|certa|resposta correta|resp\b)/.test(c));
      const iCat = cab.findIndex(c => /(categoria|tema|assunto|topico)/.test(c));
      if (iQ >= 0 && iAlt.length >= 2) {
        for (let i = h + 1; i < L.length; i++) {
          const l = L[i]; if (!txt(l[iQ])) continue;
          const q = { texto: txt(l[iQ]), options: [], categoria: iCat >= 0 ? txt(l[iCat]) : '' };
          const gab = iGab >= 0 ? letrasDoGabarito(l[iGab]) : [];
          const gabTexto = iGab >= 0 ? norm(l[iGab]) : '';
          const coresRow = iAlt.map(c => (C[i] || [])[c]).filter(Boolean);
          iAlt.forEach((c, k) => {
            const t = txt(l[c]); if (!t) return;
            const m = limparMarcadores(t);
            let correta = m.marcada;
            const letra = String.fromCharCode(97 + k);
            if (gab.indexOf(letra) !== -1 && gab.length && /^[a-h1-8][\s,;/e]*([a-h1-8][\s,;/e]*)*$/.test(gabTexto)) correta = true;
            if (gabTexto && norm(m.texto) === gabTexto) correta = true;
            const cor = (C[i] || [])[c];
            if (cor && coresRow.length < iAlt.filter(cc => txt(l[cc])).length) correta = true;
            if ((N[i] || [])[c] && !(N[i] || []).every((x, ii) => !iAlt.includes(ii) || x || !txt(l[ii]))) correta = true;
            q.options.push({ text: m.texto, correct: correta });
          });
          fecharQuestao(q, lista, avisos);
        }
        return { perguntas: lista, avisos, estrategia: 'tabela com cabeçalho' };
      }
    }
    // sem cabeçalho: [pergunta, alt1, alt2, ... , (gabarito)]
    let candidatas = 0;
    L.forEach(l => { const cs = l.map(txt).filter(Boolean); if (cs.length >= 3 && cs[0].length > 12) candidatas++; });
    if (candidatas >= Math.max(2, L.filter(l => l.some(c => txt(c))).length * 0.6)) {
      const lista2 = [], av2 = [];
      L.forEach((l, i) => {
        const cel = l.map(txt); if (!cel[0] && !cel.some(Boolean)) return;
        let ini = cel.findIndex(c => c);
        if (/^\d{1,3}$/.test(cel[ini]) && cel[ini + 1]) ini++; // coluna só com número da questão
        const qTxt = cel[ini]; if (!qTxt || qTxt.length < 8) return;
        let alts = cel.slice(ini + 1).map((t, k) => ({ t, k: ini + 1 + k })).filter(a => a.t);
        let gabL = [];
        const ult = alts[alts.length - 1];
        if (ult && alts.length >= 3 && (/^[a-h1-8]([\s,;/e]+[a-h1-8])*$/i.test(ult.t) || /^(gabarito|resp)/i.test(ult.t))) { gabL = letrasDoGabarito(ult.t.replace(/^(gabarito|resposta)\s*[:\-]?\s*/i, '')); alts = alts.slice(0, -1); }
        const q = { texto: qTxt.replace(RE_Q_NUM, '$2'), options: [], categoria: '' };
        const coresRow = alts.map(a => (C[i] || [])[a.k]).filter(Boolean);
        alts.forEach((a, k) => {
          const m = limparMarcadores(a.t.replace(RE_ALT_LETRA, '$2'));
          let correta = m.marcada || gabL.indexOf(String.fromCharCode(97 + k)) !== -1;
          if ((C[i] || [])[a.k] && coresRow.length < alts.length) correta = true;
          q.options.push({ text: m.texto, correct: correta });
        });
        fecharQuestao(q, lista2, av2);
      });
      if (lista2.length) return { perguntas: lista2, avisos: av2, estrategia: 'planilha (uma pergunta por linha)' };
    }
    return null;
  }

  /* Estratégia C: texto corrido (Word, PDF, TXT, foto, planilha de 1 coluna) */
  function parsearTexto(linhasTexto) {
    const L = linhasTexto.map(l => (typeof l === 'string' ? { t: l, b: false } : l));
    const ls = L.map(l => l.t);
    const qtdLetra = ls.filter(t => RE_ALT_LETRA.test(t)).length;
    const qtdBullet = ls.filter(t => RE_ALT_BULLET.test(t)).length;
    const altPorLetra = qtdLetra >= 2, altPorBullet = !altPorLetra && qtdBullet >= 2;
    const lista = [], avisos = [];
    const gabaritoGeral = {};
    // bloco final de gabarito "1-B 2-C 3-A"
    const reParesG = /(\d{1,3})\s*[-\u2013.):]\s*([a-hA-H])(?![a-zA-Z])/g;
    const ehLinhaChave = t => {
      const s2 = t.replace(/^\s*(gabarito|respostas?|resp\.?)\s*[:\-]?\s*/i, '');
      const ps = s2.match(reParesG) || [];
      if (ps.length < 2) return false;
      return !/[a-z0-9]/i.test(s2.replace(reParesG, '').replace(/[\s,;|/]+|\be\b/gi, ''));
    };
    const linhaChave = ls.map((t, i) => ({ t, i })).filter(x => ehLinhaChave(x.t) && !RE_ALT_LETRA.test(x.t));
    linhaChave.forEach(x => {
      (x.t.replace(/^\s*(gabarito|respostas?|resp\.?)\s*[:\-]?\s*/i, '').match(reParesG) || []).forEach(p => {
        const m = /(\d{1,3})\s*[-\u2013.):]\s*([a-hA-H])/.exec(p);
        (gabaritoGeral[+m[1]] = gabaritoGeral[+m[1]] || []).push(m[2].toLowerCase());
      });
    });
    const idxChave = new Set(linhaChave.map(x => x.i));

    let q = null, numQ = 0, ultimaAlt = null;
    const ehInicioQuestao = (t) => {
      if (RE_ALT_LETRA.test(t) && (altPorLetra)) return null;
      if (altPorBullet && RE_ALT_BULLET.test(t)) return null;
      let m = RE_Q_PALAVRA.exec(t);
      if (m && /^(quest|pergunta)/i.test(t.trim())) return { n: m[1] ? +m[1] : null, texto: m[2] || '' };
      m = RE_Q_NUM.exec(t);
      if (m && !(altPorLetra === false && altPorBullet === false && false)) return { n: +m[1], texto: m[2] };
      if (/\?\s*$/.test(t) && t.length > 12 && !(q && q.options.length === 0 && false)) return { n: null, texto: t };
      return null;
    };
    ls.forEach((t0, idx) => {
      const t = t0; const info = L[idx];
      if (idxChave.has(idx)) return;
      if (!t) { return; }
      const g = RE_GAB.exec(t);
      if (g && q && q.options.length >= 2) {
        const letras = letrasDoGabarito(g[1]);
        if (letras.length) { q.options.forEach((o, k) => { o.correct = letras.indexOf(String.fromCharCode(97 + k)) !== -1; }); q._gabarito = true; return; }
      }
      let mAlt = null;
      if (altPorLetra) mAlt = RE_ALT_LETRA.exec(t);
      else if (altPorBullet) { const b = RE_ALT_BULLET.exec(t); if (b) mAlt = [t, '', b[1]]; }
      if (mAlt && q) {
        const m = limparMarcadores(mAlt[2]);
        q.options.push({ text: m.texto, correct: (m.marcada || !!info.b) && !(info.b && q.options.length === 0 && false) });
        ultimaAlt = q.options[q.options.length - 1];
        if (info.b) q._negritoAlt = true;
        return;
      }
      const ini = ehInicioQuestao(t);
      // enunciado em várias linhas: uma 2ª linha terminada em "?" (sem número/“Pergunta:”) continua a mesma pergunta
      if (ini && ini.n == null && q && q.options.length === 0 && !/^\s*(quest[aã]o|pergunta)/i.test(t)) { q.texto += ' ' + t; return; }
      if (ini && (ini.n != null || /\?\s*$/.test(t) || !q || q.options.length >= 2)) {
        if (q) fecharQuestao(q, lista, avisos);
        numQ = ini.n != null ? ini.n : numQ + 1;
        q = { texto: ini.texto, options: [], numero: numQ, categoria: '' };
        ultimaAlt = null;
        return;
      }
      if (q) {
        if (!q.options.length) q.texto += ' ' + t;           // enunciado em várias linhas
        else if (ultimaAlt) ultimaAlt.text += ' ' + t;       // alternativa quebrada em várias linhas
      }
    });
    if (q) fecharQuestao(q, lista, avisos);
    // negrito só vale como gabarito se destacar UMA minoria das alternativas
    lista.forEach(p => { if (p._negritoAlt && !p._gabarito) { const n = p.options.filter(o => o.correct).length; if (n === p.options.length) p.options.forEach(o => { o.correct = false; }); } });
    // gabarito geral por número
    if (Object.keys(gabaritoGeral).length) lista.forEach(p => {
      const letras = gabaritoGeral[p.numero];
      if (letras && !p.options.some(o => o.correct)) p.options.forEach((o, k) => { o.correct = letras.indexOf(String.fromCharCode(97 + k)) !== -1; });
    });
    lista.forEach(p => { const n = p.options.filter(o => o.correct).length; p.type = n > 1 ? 'multiplas_respostas' : 'unica'; p.semGabarito = n === 0; delete p._gabarito; delete p._negritoAlt; });
    return { perguntas: lista, avisos, estrategia: 'texto corrido' };
  }

  PPGImport.parsearPerguntas = function (documento) {
    const resultados = [];
    (documento.folhas || []).forEach(f => {
      if (documento.tipo === 'planilha' || documento.tipo === 'docx' || documento.tipo === 'html' || documento.tipo === 'texto') {
        const r = parsearTabela(f);
        if (r && r.perguntas.length) resultados.push(r);
      }
    });
    if (resultados.length) {
      const todas = [], avisos = [];
      resultados.forEach(r => { todas.push.apply(todas, r.perguntas); avisos.push.apply(avisos, r.avisos); });
      return { perguntas: todas, avisos, estrategia: resultados[0].estrategia };
    }
    let linhas = documento.textoLinhas && documento.textoLinhas.length ? documento.textoLinhas : null;
    if (!linhas) { linhas = []; (documento.folhas || []).forEach(f => f.linhas.forEach(r => { const t = r.map(txt).filter(Boolean).join(' '); if (t) linhas.push({ t, b: false }); })); }
    return parsearTexto(linhas);
  };
  PPGImport._internos.parsearTexto = parsearTexto; PPGImport._internos.parsearTabela = parsearTabela;

  if (typeof module !== 'undefined' && module.exports) module.exports = PPGImport;
  root.PPGImport = PPGImport;
})(typeof window !== 'undefined' ? window : globalThis);
