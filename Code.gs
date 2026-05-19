// ╔══════════════════════════════════════════════════════════════════╗
// ║  FLY WAY DELIVERY v2 — BACKEND API REST (Google Apps Script)    ║
// ║                                                                  ║
// ║  Arquitectura: GitHub Pages (frontend) → fetch() → GAS API      ║
// ║  O frontend está em GitHub Pages e chama este script via HTTP.   ║
// ║                                                                  ║
// ║  CONFIGURAÇÃO OBRIGATÓRIA:                                       ║
// ║  1. Execute inicializarPlanilha() uma vez                        ║
// ║  2. Publique como Web App:                                       ║
// ║     - Executar como: Eu                                          ║
// ║     - Quem tem acesso: Qualquer pessoa                           ║
// ║  3. Copie o URL e cole em config.js (no frontend)               ║
// ╚══════════════════════════════════════════════════════════════════╝

var SS = SpreadsheetApp.getActiveSpreadsheet();

var SHEETS = {
  PEDIDOS:  'Pedidos',
  CLIENTES: 'Clientes',
  MOTOBOYS: 'Motoboys',
  USUARIOS: 'Usuarios'
};

var CP  = { ID:0, DATA:1, CLIENTE:2, CONTACTO:3, LOCAL:4, TIPO:5, PIN:6, VALOR:7, STATUS:8, MOTOBOY:9 };
var CCL = { NOME:0, CONTACTO:1 };
var CMB = { NOME:0, CONTACTO:1, STATUS:2 };
var CU  = { USERNAME:0, SENHA:1, NOME:2, STATUS:3, ROLE:4 };

// ═══════════════════════════════════════════════════════════════════
// ROUTER — ponto de entrada HTTP
// Todas as chamadas chegam aqui via GET ou POST
// ═══════════════════════════════════════════════════════════════════

function doGet(e) {
  // Suporta chamadas de GitHub Pages (cross-origin GET sem CORS preflight)
  // O frontend envia dados em Base64 no parâmetro ?d=
  var action = '';
  var body   = {};

  try {
    if (!e || !e.parameter) return _jsonResponse({ success: false, message: 'Sem parâmetros.' });

    action = e.parameter.action || '';

    // Decodificar dados enviados pelo frontend (Base64 → JSON)
    if (e.parameter.d) {
      try {
        var decoded = Utilities.newBlob(Utilities.base64Decode(e.parameter.d)).getDataAsString();
        body = JSON.parse(decoded);
      } catch(decErr) {
        Logger.log('Erro ao decodificar ?d: ' + decErr.message);
        body = {};
      }
    }

    var result = _route(action, body);
    return _jsonResponse(result);

  } catch(err) {
    Logger.log('doGet error [' + action + ']: ' + err.message);
    return _jsonResponse({ success: false, message: err.message });
  }
}

// doPost mantido como fallback (caso algum cliente use POST)
function doPost(e) {
  var action = '';
  var body   = {};
  try {
    action = (e && e.parameter && e.parameter.action) ? e.parameter.action : '';
    if (e && e.postData && e.postData.contents) {
      try { body = JSON.parse(e.postData.contents); } catch(x) {}
    }
    // Também tenta decodificar ?d= em POST
    if (e && e.parameter && e.parameter.d) {
      try {
        var decoded = Utilities.newBlob(Utilities.base64Decode(e.parameter.d)).getDataAsString();
        body = JSON.parse(decoded);
      } catch(x2) {}
    }
    var result = _route(action, body);
    return _jsonResponse(result);
  } catch(err) {
    Logger.log('doPost error [' + action + ']: ' + err.message);
    return _jsonResponse({ success: false, message: err.message });
  }
}

function _route(action, body) {
  body = body || {};
  switch(action) {
    // ── Auth ──────────────────────────────────────────────────────
    case 'login':             return _login(body);

    // ── Pedidos ───────────────────────────────────────────────────
    case 'getPedidos':        return { success: true, data: _getPedidos() };
    case 'criarPedido':       return _criarPedido(body);
    case 'atualizarPedido':   return _atualizarStatusPedido(body.id, body.status, body.motoboy);
    case 'eliminarPedido':    return _eliminarPedido(body.id);

    // ── Clientes ──────────────────────────────────────────────────
    case 'getClientes':       return { success: true, data: _getClientes() };

    // ── Motoboys ──────────────────────────────────────────────────
    case 'getMotoboys':       return { success: true, data: _getMotoboys() };
    case 'criarMotoboy':      return _criarMotoboy(body);
    case 'editarMotoboy':     return _editarMotoboy(body.idx, body);
    case 'eliminarMotoboy':   return _eliminarMotoboy(body.idx);

    // ── Usuarios ──────────────────────────────────────────────────
    case 'getUsuarios':       return { success: true, data: _getUsuarios() };
    case 'criarUsuario':      return _criarUsuario(body);
    case 'atualizarUsuario':  return _atualizarUsuario(body);
    case 'eliminarUsuario':   return _eliminarUsuario(body.username);

    // ── Dashboard & Relatório ─────────────────────────────────────
    case 'getDashboard':      return { success: true, data: _getDashboard() };
    case 'getRelatorio':      return { success: true, data: _getRelatorio(body) };

    default:
      return { success: false, message: 'Accao desconhecida: "' + action + '"' };
  }
}

// Resposta JSON com headers CORS para permitir chamadas do GitHub Pages
function _jsonResponse(obj) {
  var output = ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
  return output;
}

// ═══════════════════════════════════════════════════════════════════
// AUTENTICAÇÃO
// ═══════════════════════════════════════════════════════════════════
function _login(body) {
  var username = String(body.username || '').trim();
  var password = String(body.password || '').trim();
  if (!username || !password) return { success: false, message: 'Credenciais em falta.' };

  var rows = _sh(SHEETS.USUARIOS).getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    if (String(r[CU.USERNAME]).trim() === username &&
        String(r[CU.SENHA]).trim()    === password &&
        String(r[CU.STATUS]).trim()   === 'Ativo') {
      return { success: true, user: {
        username: String(r[CU.USERNAME]),
        nome:     String(r[CU.NOME]),
        role:     String(r[CU.ROLE])
      }};
    }
  }
  return { success: false, message: 'Credenciais inválidas ou usuário inativo.' };
}

// ═══════════════════════════════════════════════════════════════════
// PEDIDOS
// ═══════════════════════════════════════════════════════════════════
function _getPedidos() {
  var sh   = _sh(SHEETS.PEDIDOS);
  var rows = sh.getDataRange().getValues();
  if (rows.length <= 1) return [];
  var tz = Session.getScriptTimeZone();
  return rows.slice(1).map(function(r) {
    var dt = '';
    try { if (r[CP.DATA]) dt = Utilities.formatDate(new Date(r[CP.DATA]), tz, 'yyyy-MM-dd HH:mm'); } catch(x){}
    return {
      id:          String(r[CP.ID]       || ''),
      dataHora:    dt,
      cliente:     String(r[CP.CLIENTE]  || ''),
      contacto:    String(r[CP.CONTACTO] || ''),
      localizacao: String(r[CP.LOCAL]    || ''),
      tipo:        String(r[CP.TIPO]     || ''),
      pin:         String(r[CP.PIN]      || ''),
      valorTaxa:   parseFloat(r[CP.VALOR])  || 0,
      status:      String(r[CP.STATUS]   || 'Pendente'),
      motoboy:     String(r[CP.MOTOBOY]  || '')
    };
  });
}

function _criarPedido(dados) {
  var sh  = _sh(SHEETS.PEDIDOS);
  var id  = _gerarID('PED');
  var pin = _gerarPIN();
  sh.appendRow([
    id, new Date(),
    String(dados.cliente     || ''),
    String(dados.contacto    || ''),
    String(dados.localizacao || ''),
    String(dados.tipo        || ''),
    pin,
    parseFloat(dados.valorTaxa) || 0,
    'Pendente',
    String(dados.motoboy || '')
  ]);
  sh.getRange(sh.getLastRow(), CP.DATA + 1).setNumberFormat('dd/MM/yyyy HH:mm');
  if (dados.motoboy && String(dados.motoboy).trim()) _setMbStatus(String(dados.motoboy), 'Ocupado');
  _registarCliente(String(dados.cliente || ''), String(dados.contacto || ''));
  return { success: true, id: id, pin: pin };
}

function _atualizarStatusPedido(id, novoStatus, motoboy) {
  var sh   = _sh(SHEETS.PEDIDOS);
  var rows = sh.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][CP.ID]) !== String(id)) continue;
    var rn      = i + 1;
    var mbAntes = String(rows[i][CP.MOTOBOY] || '');
    var mbNovo  = (motoboy !== undefined && motoboy !== null) ? String(motoboy) : mbAntes;
    sh.getRange(rn, CP.STATUS  + 1).setValue(novoStatus);
    sh.getRange(rn, CP.MOTOBOY + 1).setValue(mbNovo);
    if (mbAntes && mbAntes !== mbNovo)                        _setMbStatus(mbAntes, 'Disponível');
    if (mbNovo && novoStatus === 'Em Rota')                   _setMbStatus(mbNovo, 'Ocupado');
    if (mbNovo && (novoStatus === 'Entregue' || novoStatus === 'Cancelado')) _setMbStatus(mbNovo, 'Disponível');
    return { success: true };
  }
  return { success: false, message: 'Pedido não encontrado.' };
}

function _eliminarPedido(id) {
  var sh   = _sh(SHEETS.PEDIDOS);
  var rows = sh.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][CP.ID]) === String(id)) {
      var mb = String(rows[i][CP.MOTOBOY] || '');
      sh.deleteRow(i + 1);
      if (mb) _setMbStatus(mb, 'Disponível');
      return { success: true };
    }
  }
  return { success: false, message: 'Pedido não encontrado.' };
}

// ═══════════════════════════════════════════════════════════════════
// CLIENTES
// ═══════════════════════════════════════════════════════════════════
function _getClientes() {
  var rows = _sh(SHEETS.CLIENTES).getDataRange().getValues();
  if (rows.length <= 1) return [];
  return rows.slice(1).map(function(r) {
    return { nome: String(r[CCL.NOME] || ''), contacto: String(r[CCL.CONTACTO] || '') };
  });
}

function _registarCliente(nome, contacto) {
  if (!nome) return;
  var sh   = _sh(SHEETS.CLIENTES);
  var rows = sh.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][CCL.NOME]).trim() === nome.trim()) return;
  }
  sh.appendRow([nome, contacto]);
}

// ═══════════════════════════════════════════════════════════════════
// MOTOBOYS
// ═══════════════════════════════════════════════════════════════════
function _getMotoboys() {
  var rows = _sh(SHEETS.MOTOBOYS).getDataRange().getValues();
  if (rows.length <= 1) return [];
  return rows.slice(1).map(function(r, idx) {
    return { idx: idx, nome: String(r[CMB.NOME] || ''), contacto: String(r[CMB.CONTACTO] || ''), status: String(r[CMB.STATUS] || 'Disponível') };
  });
}

function _criarMotoboy(dados) {
  _sh(SHEETS.MOTOBOYS).appendRow([String(dados.nome || ''), String(dados.contacto || ''), 'Disponível']);
  return { success: true };
}

function _editarMotoboy(idx, dados) {
  var sh = _sh(SHEETS.MOTOBOYS);
  var rn = Number(idx) + 2;
  sh.getRange(rn, CMB.NOME     + 1).setValue(String(dados.nome     || ''));
  sh.getRange(rn, CMB.CONTACTO + 1).setValue(String(dados.contacto || ''));
  sh.getRange(rn, CMB.STATUS   + 1).setValue(String(dados.status   || 'Disponível'));
  return { success: true };
}

function _eliminarMotoboy(idx) {
  _sh(SHEETS.MOTOBOYS).deleteRow(Number(idx) + 2);
  return { success: true };
}

function _setMbStatus(nome, status) {
  var sh   = _sh(SHEETS.MOTOBOYS);
  var rows = sh.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][CMB.NOME]).trim() === String(nome).trim()) {
      sh.getRange(i + 1, CMB.STATUS + 1).setValue(status);
      return;
    }
  }
}

// ═══════════════════════════════════════════════════════════════════
// USUÁRIOS
// ═══════════════════════════════════════════════════════════════════
function _getUsuarios() {
  var rows = _sh(SHEETS.USUARIOS).getDataRange().getValues();
  if (rows.length <= 1) return [];
  return rows.slice(1).map(function(r) {
    return { username: String(r[CU.USERNAME]||''), nome: String(r[CU.NOME]||''),
             role: String(r[CU.ROLE]||''), status: String(r[CU.STATUS]||'') };
  });
}

function _criarUsuario(dados) {
  var sh   = _sh(SHEETS.USUARIOS);
  var rows = sh.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][CU.USERNAME]).trim() === String(dados.username).trim())
      return { success: false, message: 'Username "' + dados.username + '" já existe.' };
  }
  sh.appendRow([String(dados.username||''), String(dados.password||''), String(dados.nome||''), 'Ativo', String(dados.role||'Assistente')]);
  return { success: true, message: 'Usuário criado.' };
}

function _atualizarUsuario(dados) {
  var sh   = _sh(SHEETS.USUARIOS);
  var rows = sh.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][CU.USERNAME]).trim() === String(dados.username).trim()) {
      var rn = i + 1;
      sh.getRange(rn, CU.NOME   + 1).setValue(String(dados.nome   ||''));
      sh.getRange(rn, CU.STATUS + 1).setValue(String(dados.status ||'Ativo'));
      sh.getRange(rn, CU.ROLE   + 1).setValue(String(dados.role   ||'Assistente'));
      if (dados.password && String(dados.password).trim())
        sh.getRange(rn, CU.SENHA + 1).setValue(String(dados.password));
      return { success: true, message: 'Usuário actualizado.' };
    }
  }
  return { success: false, message: 'Usuário não encontrado.' };
}

function _eliminarUsuario(username) {
  var sh   = _sh(SHEETS.USUARIOS);
  var rows = sh.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][CU.USERNAME]).trim() === String(username).trim()) {
      sh.deleteRow(i + 1);
      return { success: true };
    }
  }
  return { success: false, message: 'Usuário não encontrado.' };
}

// ═══════════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════════
function _getDashboard() {
  var pedidos  = _getPedidos();
  var motoboys = _getMotoboys();
  var hoje     = new Date();
  var ini      = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  var tz       = Session.getScriptTimeZone();

  var totalHoje=0, entreguesN=0, emRotaN=0, pendentesN=0, canceladosN=0, receita=0;
  pedidos.forEach(function(p) {
    var d = p.dataHora ? new Date(p.dataHora) : null;
    if (d && d >= ini) totalHoje++;
    if (p.status==='Entregue')  { entreguesN++;  receita += parseFloat(p.valorTaxa)||0; }
    if (p.status==='Em Rota')   emRotaN++;
    if (p.status==='Pendente')  pendentesN++;
    if (p.status==='Cancelado') canceladosN++;
  });

  var grafico = [];
  for (var i = 6; i >= 0; i--) {
    var d    = new Date(hoje); d.setDate(d.getDate() - i);
    var ini2 = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    var fim2 = new Date(ini2); fim2.setDate(fim2.getDate() + 1);
    var label = Utilities.formatDate(d, tz, 'EEE dd');
    var cnt   = pedidos.filter(function(p) {
      var pd = p.dataHora ? new Date(p.dataHora) : null;
      return pd && pd >= ini2 && pd < fim2;
    }).length;
    grafico.push({ label: label, count: cnt });
  }

  return {
    totalHoje: totalHoje, entregues: entreguesN, emRota: emRotaN,
    pendentes: pendentesN, cancelados: canceladosN, receitaTotal: receita,
    totalMotoboys: motoboys.length,
    motoboyDisponiveis: motoboys.filter(function(m){ return m.status==='Disponível'; }).length,
    grafico: grafico,
    pedidosRecentes: pedidos.slice().reverse().slice(0, 5)
  };
}

// ═══════════════════════════════════════════════════════════════════
// RELATÓRIO
// ═══════════════════════════════════════════════════════════════════
function _getRelatorio(filtros) {
  var lista = _getPedidos();
  if (filtros.dataInicio) {
    var di = new Date(filtros.dataInicio);
    lista  = lista.filter(function(p){ return p.dataHora && new Date(p.dataHora) >= di; });
  }
  if (filtros.dataFim) {
    var df = new Date(filtros.dataFim); df.setDate(df.getDate() + 1);
    lista  = lista.filter(function(p){ return p.dataHora && new Date(p.dataHora) < df; });
  }
  if (filtros.cliente && filtros.cliente.trim()) {
    var cl = filtros.cliente.toLowerCase();
    lista  = lista.filter(function(p){ return p.cliente.toLowerCase().indexOf(cl) !== -1; });
  }
  if (filtros.status && filtros.status !== 'Todos')
    lista = lista.filter(function(p){ return p.status === filtros.status; });
  if (filtros.tipo && filtros.tipo !== 'Todos')
    lista = lista.filter(function(p){ return p.tipo === filtros.tipo; });

  var totalReceita = lista
    .filter(function(p){ return p.status === 'Entregue'; })
    .reduce(function(s, p){ return s + (parseFloat(p.valorTaxa)||0); }, 0);

  return { pedidos: lista, totalReceita: totalReceita, total: lista.length };
}

// ═══════════════════════════════════════════════════════════════════
// UTILITÁRIOS
// ═══════════════════════════════════════════════════════════════════
function _sh(nome) {
  var s = SS.getSheetByName(nome);
  if (!s) throw new Error('Aba "' + nome + '" não encontrada. Execute inicializarPlanilha() primeiro.');
  return s;
}
function _gerarID(prefix) {
  var data = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyMMdd');
  return prefix + '-' + data + '-' + Math.floor(Math.random() * 900 + 100);
}
function _gerarPIN() { return String(Math.floor(1000 + Math.random() * 9000)); }

// ═══════════════════════════════════════════════════════════════════
// INICIALIZAR PLANILHA — execute uma vez antes de publicar
// ═══════════════════════════════════════════════════════════════════
function inicializarPlanilha() {
  var log = [];
  function criarAba(nome, cab) {
    var sh = SS.getSheetByName(nome);
    if (!sh) { sh = SS.insertSheet(nome); log.push('Aba "' + nome + '" criada.'); }
    if (sh.getLastRow() === 0) {
      sh.appendRow(cab);
      sh.getRange(1,1,1,cab.length).setBackground('#ed4b09').setFontColor('#fff')
        .setFontWeight('bold').setHorizontalAlignment('center').setFontSize(11);
      sh.setFrozenRows(1);
    }
    return sh;
  }
  criarAba(SHEETS.PEDIDOS,  ['ID','Data/Hora','Cliente','Contacto','Localização','Tipo','PIN','Valor Taxa (MZN)','Status','Motoboy']);
  criarAba(SHEETS.CLIENTES, ['Nome','Contacto']);
  criarAba(SHEETS.MOTOBOYS, ['Nome','Contacto','Status']);
  var shU = criarAba(SHEETS.USUARIOS, ['Username','Senha','Nome Completo','Status','Role']);
  if (shU.getLastRow() === 1) {
    shU.appendRow(['admin',      'admin123',  'Administrador',      'Ativo', 'Administrador']);
    shU.appendRow(['assistente', 'assist123', 'Assistente Padrão',  'Ativo', 'Assistente']);
    log.push('Utilizadores padrão criados.');
  }
  var msg = 'Planilha inicializada!\n' + log.join('\n') +
            '\n\nAdmin: admin / admin123\nAssistente: assistente / assist123';
  try { SpreadsheetApp.getUi().alert(msg); } catch(e){}
  Logger.log(msg);
  return { success: true };
}
