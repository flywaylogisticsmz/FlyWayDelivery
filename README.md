# ✈️ Fly Way Delivery v2 — Sistema de Gestão Logística
### Arquitectura: GitHub Pages + Google Apps Script REST API

---

## 📐 Como funciona a nova arquitectura

```
Utilizador
    │
    ▼  https://SEU-USERNAME.github.io/flyway-delivery   ← Link limpo e profissional
┌─────────────────────────────────┐
│  GitHub Pages                   │
│  ├── index.html  (interface)    │
│  └── config.js   (API_URL)      │
└────────────┬────────────────────┘
             │  fetch() via HTTPS
             ▼
┌─────────────────────────────────┐
│  Google Apps Script Web App     │
│  Code.gs — API REST             │
│  doGet(?action=xxx)             │
│  doPost(?action=xxx, body=JSON) │
└────────────┬────────────────────┘
             │  lê / escreve
             ▼
┌─────────────────────────────────┐
│  Google Sheets                  │
│  ├── Pedidos                    │
│  ├── Clientes                   │
│  ├── Motoboys                   │
│  └── Usuarios                   │
└─────────────────────────────────┘
```

---

## 📁 Ficheiros do Projecto

```
flyway-delivery/
├── index.html   ← Frontend completo (HTML + CSS + JS)
├── config.js    ← ⚠️  ÚNICA linha a editar: cole o URL do GAS aqui
├── Code.gs      ← Backend Google Apps Script (API REST)
└── README.md    ← Este guia
```

---

## 🔧 PARTE 1 — Configurar o Backend (Google Apps Script)

### Passo 1 — Criar a Planilha Google Sheets

1. Acesse [sheets.google.com](https://sheets.google.com) → **"+ Em branco"**
2. Renomeie para: **"Fly Way Delivery"**

### Passo 2 — Abrir o Editor Apps Script

1. Menu → **Extensões → Apps Script**
2. Apague o código padrão do `Code.gs`
3. Cole o conteúdo completo do ficheiro **`Code.gs`** fornecido
4. Salve com **Ctrl+S**

### Passo 3 — Inicializar as Abas

1. No editor, seleccione a função **`inicializarPlanilha`** no menu
2. Clique **▶ Executar**
3. Autorize as permissões quando pedido
4. Aguarde o alerta de confirmação — as 4 abas serão criadas automaticamente

### Passo 4 — Publicar como Web App (API REST)

1. Clique em **"Implementar" → "Nova implementação"**
2. Clique no ícone ⚙️ → **"App da Web"**
3. Configure:
   ```
   Descrição:        Fly Way Delivery API v2
   Executar como:    Eu (seu email)
   Quem tem acesso:  Qualquer pessoa
   ```
4. Clique **"Implementar"**
5. **Copie o URL** — tem este formato:
   ```
   https://script.google.com/macros/s/AKfycbxXXXXXXXXX/exec
   ```
6. Guarde este URL — vai precisar no próximo passo

> ⚠️ **Importante:** Sempre que editar o `Code.gs`, crie uma **nova versão**:
> Implementar → Gerir implementações → ✏️ Editar → Versão: Nova versão → Implementar

---

## 🌐 PARTE 2 — Publicar o Frontend no GitHub

### Passo 1 — Configurar o API_URL (passo crítico)

Abra o ficheiro **`config.js`** num editor de texto e substitua:

```javascript
// ANTES (placeholder):
const API_URL = 'COLE_AQUI_O_URL_DO_GAS_WEB_APP';

// DEPOIS (com o URL real):
const API_URL = 'https://script.google.com/macros/s/AKfycbxXXXXXXXXX/exec';
```

### Passo 2 — Criar repositório no GitHub

1. Acesse [github.com](https://github.com) → **"New repository"**
2. Nome: **`flyway-delivery`**
3. Visibilidade: **Público** ← obrigatório para GitHub Pages gratuito
4. Clique **"Create repository"**

### Passo 3 — Fazer upload dos ficheiros

1. No repositório criado, clique **"Add file" → "Upload files"**
2. Arraste ou seleccione os 4 ficheiros:
   - `index.html`
   - `config.js` ← com o URL real já configurado
   - `Code.gs`
   - `README.md`
3. Clique **"Commit changes"**

### Passo 4 — Activar GitHub Pages

1. No repositório → **Settings** (separador no topo)
2. Menu lateral → **Pages**
3. Em "Source": **Deploy from a branch**
4. Branch: **main** | Pasta: **/ (root)**
5. Clique **Save**
6. Aguarde 1-2 minutos e acesse:

```
🔗 https://SEU-USERNAME.github.io/flyway-delivery
```

Este é o link que partilha com os utilizadores! ✅

---

## 🔐 PARTE 3 — Credenciais Padrão

| Username      | Senha        | Perfil         |
|---------------|--------------|----------------|
| `admin`       | `admin123`   | Administrador  |
| `assistente`  | `assist123`  | Assistente     |

> 🔒 **Altere as senhas imediatamente** após o primeiro login em Usuários → Editar.

---

## 👥 PARTE 4 — Perfis de Acesso

| Funcionalidade         | Administrador | Assistente |
|------------------------|:---:|:---:|
| Dashboard              | ✅  | ✅  |
| Ver Pedidos            | ✅  | ✅  |
| Criar Pedidos          | ✅  | ✅  |
| Actualizar Status      | ✅  | ✅  |
| **Eliminar Pedidos**   | ✅  | ❌  |
| Central MotoBoy        | ✅  | ✅  |
| Relatórios + Exportar  | ✅  | ✅  |
| **Gerir Usuários**     | ✅  | ❌  |

---

## 🔄 PARTE 5 — Actualizar o Sistema

### Actualizar o Frontend (index.html ou config.js)
1. Edite o ficheiro localmente
2. No GitHub → **"Add file" → "Upload files"** → substitua o ficheiro existente
3. GitHub Pages publica automaticamente em ~1 minuto — sem republica do GAS necessário

### Actualizar o Backend (Code.gs)
1. Edite o `Code.gs` no Apps Script
2. Salve
3. **Implementar → Gerir implementações → ✏️ → Nova versão → Implementar**
4. O URL do GAS **não muda** — o frontend continua a funcionar sem alterações

---

## 🐛 Resolução de Problemas

| Sintoma | Causa provável | Solução |
|---------|---------------|---------|
| Página mostra "Configure o API_URL" | `config.js` tem o placeholder | Edite `config.js` com o URL real do GAS |
| Login falha com "Erro de conexão" | URL errado ou GAS não publicado | Verifique o URL e republique o GAS |
| "Qualquer pessoa" não está seleccionado | Permissão errada no GAS | Reimplemente com "Qualquer pessoa" |
| Dados não aparecem mas login funciona | Abas não criadas | Execute `inicializarPlanilha()` no GAS |
| GitHub Pages mostra página em branco | Cache do browser | Force refresh: Ctrl+Shift+R |
| GAS retorna erro 403 | Nova implementação necessária | Crie nova versão no GAS |

---

## 📊 Estrutura das Abas no Google Sheets

### Aba Pedidos
| ID | Data/Hora | Cliente | Contacto | Localização | Tipo | PIN | Valor Taxa | Status | Motoboy |

### Aba Clientes
| Nome | Contacto |

### Aba Motoboys  
| Nome | Contacto | Status |

### Aba Usuarios
| Username | Senha | Nome Completo | Status | Role |

---

## 🏗️ Detalhes Técnicos da API

O backend aceita chamadas HTTP:

```
GET  ?action=getPedidos
GET  ?action=getMotoboys
GET  ?action=getClientes
GET  ?action=getDashboard
POST ?action=login          body: { username, password }
POST ?action=criarPedido    body: { cliente, contacto, localizacao, tipo, valorTaxa, motoboy }
POST ?action=atualizarPedido body: { id, status, motoboy }
POST ?action=eliminarPedido  body: { id }
POST ?action=criarMotoboy    body: { nome, contacto }
POST ?action=editarMotoboy   body: { idx, nome, contacto, status }
POST ?action=eliminarMotoboy body: { idx }
POST ?action=getRelatorio    body: { dataInicio?, dataFim?, cliente?, status?, tipo? }
POST ?action=criarUsuario    body: { username, password, nome, role }
POST ?action=atualizarUsuario body: { username, password?, nome, role, status }
POST ?action=eliminarUsuario  body: { username }
```

Todas as respostas têm formato:
```json
{ "success": true, "data": { ... } }
{ "success": false, "message": "Descrição do erro" }
```

---

*Fly Way Delivery v2 | GitHub Pages + Google Apps Script REST API + Google Sheets*
