// ============================================================
// FLY WAY DELIVERY - Sistema de Gestão Logística
// Backend: Google Apps Script (Code.gs)
// ============================================================

// ─── CONFIGURAÇÕES GLOBAIS ───────────────────────────────────
const SHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();
const SS = SpreadsheetApp.getActiveSpreadsheet();

// Nomes das abas
const SHEETS = {
  PEDIDOS:    'Pedidos',
  CLIENTES:   'Clientes',
  MOTOBOYS:   'Motoboys',
  USUARIOS:   'Usuarios',
  CONFIG:     'Config'
};

// ─── PONTO DE ENTRADA WEB APP ────────────────────────────────
function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('Fly Way Delivery - Sistema de Gestão')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
}

// ─── AUTENTICAÇÃO ────────────────────────────────────────────
function login(username, password) {
  try {
    const sheet = SS.getSheetByName(SHEETS.USUARIOS);
    if (!sheet) return { success: false, message: 'Tabela de usuários não encontrada.' };

    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[0] === username && row[1] === String(password) && row[3] === 'Ativo') {
        return {
          success: true,
          user: {
            username: row[0],
            nome:     row[2],
            role:     row[4]  // 'Administrador' ou 'Assistente'
          }
        };
      }
    }
    return { success: false, message: 'Credenciais inválidas ou usuário inativo.' };
  } catch (err) {
    return { success: false, message: 'Erro: ' + err.message };
  }
}

// ─── USUÁRIOS ────────────────────────────────────────────────
function getUsuarios() {
  try {
    const sheet = SS.getSheetByName(SHEETS.USUARIOS);
    const data  = sheet.getDataRange().getValues();
    const headers = data[0];
    return data.slice(1).map(row => ({
      username: row[0],
      nome:     row[2],
      role:     row[4],
      status:   row[3]
    }));
  } catch (err) { return []; }
}

function criarUsuario(dados) {
  try {
    const sheet = SS.getSheetByName(SHEETS.USUARIOS);
    // Verificar duplicata
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === dados.username) {
        return { success: false, message: 'Username já existe.' };
      }
    }
    sheet.appendRow([dados.username, dados.password, dados.nome, 'Ativo', dados.role]);
    return { success: true, message: 'Usuário criado com sucesso.' };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

function atualizarUsuario(dados) {
  try {
    const sheet = SS.getSheetByName(SHEETS.USUARIOS);
    const data  = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === dados.username) {
        sheet.getRange(i + 1, 3).setValue(dados.nome);
        sheet.getRange(i + 1, 4).setValue(dados.status);
        sheet.getRange(i + 1, 5).setValue(dados.role);
        if (dados.password) sheet.getRange(i + 1, 2).setValue(dados.password);
        return { success: true, message: 'Usuário atualizado.' };
      }
    }
    return { success: false, message: 'Usuário não encontrado.' };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

function eliminarUsuario(username) {
  try {
    const sheet = SS.getSheetByName(SHEETS.USUARIOS);
    const data  = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === username) {
        sheet.deleteRow(i + 1);
        return { success: true };
      }
    }
    return { success: false, message: 'Usuário não encontrado.' };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

// ─── PEDIDOS ─────────────────────────────────────────────────
function getPedidos() {
  try {
    const sheet = SS.getSheetByName(SHEETS.PEDIDOS);
    const data  = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];
    return data.slice(1).map(row => ({
      id:        row[0],
      dataHora:  row[1] ? Utilities.formatDate(new Date(row[1]), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm') : '',
      cliente:   row[2],
      contacto:  row[3],
      localizacao: row[4],
      tipo:      row[5],
      pin:       row[6],
      valorTaxa: row[7],
      status:    row[8] || 'Pendente',
      motoboy:   row[9] || ''
    }));
  } catch (err) { return []; }
}

function criarPedido(dados) {
  try {
    const sheet    = SS.getSheetByName(SHEETS.PEDIDOS);
    const id       = gerarID('PED');
    const pin      = gerarPIN();
    const dataHora = new Date();

    sheet.appendRow([
      id,
      dataHora,
      dados.cliente,
      dados.contacto,
      dados.localizacao,
      dados.tipo,
      pin,
      dados.valorTaxa,
      'Pendente',
      dados.motoboy || ''
    ]);

    // Registar cliente se novo
    registarCliente(dados.cliente, dados.contacto);

    return { success: true, id: id, pin: pin };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

function atualizarStatusPedido(id, novoStatus, motoboy) {
  try {
    const sheet = SS.getSheetByName(SHEETS.PEDIDOS);
    const data  = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === id) {
        sheet.getRange(i + 1, 9).setValue(novoStatus);
        if (motoboy !== undefined) sheet.getRange(i + 1, 10).setValue(motoboy);
        // Atualizar status motoboy se necessário
        if (motoboy) atualizarStatusMotoboy(motoboy, novoStatus === 'Em Rota' ? 'Ocupado' : 'Disponível');
        return { success: true };
      }
    }
    return { success: false, message: 'Pedido não encontrado.' };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

function eliminarPedido(id) {
  try {
    const sheet = SS.getSheetByName(SHEETS.PEDIDOS);
    const data  = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === id) {
        sheet.deleteRow(i + 1);
        return { success: true };
      }
    }
    return { success: false, message: 'Pedido não encontrado.' };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

// ─── CLIENTES ────────────────────────────────────────────────
function getClientes() {
  try {
    const sheet = SS.getSheetByName(SHEETS.CLIENTES);
    const data  = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];
    return data.slice(1).map(row => ({ nome: row[0], contacto: row[1] }));
  } catch (err) { return []; }
}

function registarCliente(nome, contacto) {
  try {
    const sheet = SS.getSheetByName(SHEETS.CLIENTES);
    const data  = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === nome && data[i][1] === contacto) return;
    }
    sheet.appendRow([nome, contacto]);
  } catch (err) {}
}

// ─── MOTOBOYS ────────────────────────────────────────────────
function getMotoboys() {
  try {
    const sheet = SS.getSheetByName(SHEETS.MOTOBOYS);
    const data  = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];
    return data.slice(1).map((row, idx) => ({
      id:       'MB' + String(idx + 1).padStart(3, '0'),
      nome:     row[0],
      contacto: row[1],
      status:   row[2] || 'Disponível'
    }));
  } catch (err) { return []; }
}

function criarMotoboy(dados) {
  try {
    const sheet = SS.getSheetByName(SHEETS.MOTOBOYS);
    sheet.appendRow([dados.nome, dados.contacto, 'Disponível']);
    return { success: true };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

function atualizarStatusMotoboy(nome, status) {
  try {
    const sheet = SS.getSheetByName(SHEETS.MOTOBOYS);
    const data  = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === nome) {
        sheet.getRange(i + 1, 3).setValue(status);
        return { success: true };
      }
    }
  } catch (err) {}
}

function editarMotoboy(index, dados) {
  try {
    const sheet = SS.getSheetByName(SHEETS.MOTOBOYS);
    const rowNum = index + 2; // +1 header, +1 1-based
    sheet.getRange(rowNum, 1).setValue(dados.nome);
    sheet.getRange(rowNum, 2).setValue(dados.contacto);
    sheet.getRange(rowNum, 3).setValue(dados.status);
    return { success: true };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

function eliminarMotoboy(index) {
  try {
    const sheet = SS.getSheetByName(SHEETS.MOTOBOYS);
    sheet.deleteRow(index + 2);
    return { success: true };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

// ─── DASHBOARD ───────────────────────────────────────────────
function getDashboardData() {
  try {
    const pedidos  = getPedidos();
    const motoboys = getMotoboys();

    const hoje = new Date();
    const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());

    const totalHoje     = pedidos.filter(p => new Date(p.dataHora) >= inicioHoje).length;
    const entregues     = pedidos.filter(p => p.status === 'Entregue');
    const emRota        = pedidos.filter(p => p.status === 'Em Rota').length;
    const pendentes     = pedidos.filter(p => p.status === 'Pendente').length;
    const cancelados    = pedidos.filter(p => p.status === 'Cancelado').length;
    const receitaTotal  = entregues.reduce((s, p) => s + (parseFloat(p.valorTaxa) || 0), 0);
    const disponiveis   = motoboys.filter(m => m.status === 'Disponível').length;

    // Últimos 7 dias para gráfico
    const grafico = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(hoje);
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' });
      const ini   = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const fim   = new Date(ini); fim.setDate(fim.getDate() + 1);
      const count = pedidos.filter(p => {
        const pd = new Date(p.dataHora);
        return pd >= ini && pd < fim;
      }).length;
      grafico.push({ label, count });
    }

    return {
      totalHoje, entregues: entregues.length, emRota,
      pendentes, cancelados, receitaTotal,
      totalMotoboys: motoboys.length, motoboyDisponiveis: disponiveis,
      grafico,
      pedidosRecentes: pedidos.slice(-5).reverse()
    };
  } catch (err) {
    return { error: err.message };
  }
}

// ─── RELATÓRIO ───────────────────────────────────────────────
function getRelatorio(filtros) {
  try {
    let pedidos = getPedidos();

    if (filtros.dataInicio) {
      const di = new Date(filtros.dataInicio);
      pedidos = pedidos.filter(p => new Date(p.dataHora) >= di);
    }
    if (filtros.dataFim) {
      const df = new Date(filtros.dataFim);
      df.setDate(df.getDate() + 1);
      pedidos = pedidos.filter(p => new Date(p.dataHora) < df);
    }
    if (filtros.cliente) {
      pedidos = pedidos.filter(p =>
        p.cliente.toLowerCase().includes(filtros.cliente.toLowerCase())
      );
    }
    if (filtros.status && filtros.status !== 'Todos') {
      pedidos = pedidos.filter(p => p.status === filtros.status);
    }
    if (filtros.tipo && filtros.tipo !== 'Todos') {
      pedidos = pedidos.filter(p => p.tipo === filtros.tipo);
    }

    const totalReceita = pedidos
      .filter(p => p.status === 'Entregue')
      .reduce((s, p) => s + (parseFloat(p.valorTaxa) || 0), 0);

    return { pedidos, totalReceita, total: pedidos.length };
  } catch (err) {
    return { pedidos: [], totalReceita: 0, total: 0 };
  }
}

// ─── UTILITÁRIOS ─────────────────────────────────────────────
function gerarID(prefix) {
  const ts   = new Date().getTime().toString().slice(-6);
  const rand = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return prefix + '-' + ts + rand;
}

function gerarPIN() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// ─── INICIALIZAR PLANILHA ────────────────────────────────────
function inicializarPlanilha() {
  // Pedidos
  let sh = SS.getSheetByName(SHEETS.PEDIDOS);
  if (!sh) { sh = SS.insertSheet(SHEETS.PEDIDOS); }
  if (sh.getLastRow() === 0) {
    sh.appendRow(['ID','Data/Hora','Cliente','Contacto','Localização','Tipo','PIN','Valor Taxa','Status','Motoboy']);
    sh.getRange(1, 1, 1, 10).setFontWeight('bold').setBackground('#ed4b09').setFontColor('#ffffff');
  }

  // Clientes
  let sc = SS.getSheetByName(SHEETS.CLIENTES);
  if (!sc) { sc = SS.insertSheet(SHEETS.CLIENTES); }
  if (sc.getLastRow() === 0) {
    sc.appendRow(['Nome','Contacto']);
    sc.getRange(1, 1, 1, 2).setFontWeight('bold').setBackground('#ed4b09').setFontColor('#ffffff');
  }

  // Motoboys
  let sm = SS.getSheetByName(SHEETS.MOTOBOYS);
  if (!sm) { sm = SS.insertSheet(SHEETS.MOTOBOYS); }
  if (sm.getLastRow() === 0) {
    sm.appendRow(['Nome','Contacto','Status']);
    sm.getRange(1, 1, 1, 3).setFontWeight('bold').setBackground('#ed4b09').setFontColor('#ffffff');
  }

  // Usuários
  let su = SS.getSheetByName(SHEETS.USUARIOS);
  if (!su) { su = SS.insertSheet(SHEETS.USUARIOS); }
  if (su.getLastRow() === 0) {
    su.appendRow(['Username','Senha','Nome Completo','Status','Role']);
    su.getRange(1, 1, 1, 5).setFontWeight('bold').setBackground('#ed4b09').setFontColor('#ffffff');
    // Usuário admin padrão
    su.appendRow(['admin', 'admin123', 'Administrador', 'Ativo', 'Administrador']);
    su.appendRow(['assistente', 'assist123', 'Assistente Padrão', 'Ativo', 'Assistente']);
  }

  return { success: true, message: 'Planilha inicializada com sucesso!' };
}
