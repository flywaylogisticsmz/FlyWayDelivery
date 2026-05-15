# ✈️ Fly Way Delivery — Sistema de Gestão Logística
## Guia Completo de Configuração e Uso

---

## 📁 Ficheiros do Projecto

```
flyway-delivery/
├── Code.gs          ← Backend Google Apps Script
├── index.html       ← Frontend (HTML + CSS + JS)
└── README.md        ← Este guia
```

---

## 🔧 PARTE 1 — CONFIGURAR O GOOGLE SHEETS + APPS SCRIPT

### Passo 1 — Criar a Planilha Google Sheets

1. Acesse [sheets.google.com](https://sheets.google.com)
2. Clique em **"+ Em branco"** para criar uma nova planilha
3. Renomeie para: **"Fly Way Delivery - Sistema"**

### Passo 2 — Abrir o Editor de Scripts

1. No menu superior, clique em **Extensões → Apps Script**
2. Será aberto o editor do Google Apps Script
3. Apague todo o código padrão do arquivo `Code.gs`
4. Cole **todo o conteúdo** do arquivo `Code.gs` fornecido
5. Salve com **Ctrl+S** (ou Cmd+S no Mac)

### Passo 3 — Inicializar as Abas da Planilha

1. No editor Apps Script, clique no menu suspenso de funções (canto superior, onde diz "selecionar função")
2. Selecione a função **`inicializarPlanilha`**
3. Clique no botão **▶ Executar**
4. Será solicitado permissão — clique em **"Analisar permissões"** → **"Avançado"** → **"Ir para [nome do projeto]"** → **"Permitir"**
5. Aguarde a execução. Depois, volte à planilha e você verá as abas criadas:
   - **Pedidos** — com cabeçalhos em laranja
   - **Clientes** — com cabeçalhos em laranja
   - **Motoboys** — com cabeçalhos em laranja
   - **Usuarios** — com usuários padrão criados

### Passo 4 — Publicar como Web App

1. No editor Apps Script, clique em **"Implementar" → "Nova implementação"**
2. Clique no ícone de engrenagem ⚙️ ao lado de "Selecionar tipo" → escolha **"App da Web"**
3. Preencha:
   - **Descrição:** `Sistema Fly Way Delivery v1.0`
   - **Executar como:** `Eu (seu e-mail)`
   - **Quem tem acesso:** `Qualquer pessoa` (para acesso público) OU `Qualquer pessoa com conta do Google`
4. Clique em **"Implementar"**
5. **Copie o URL da Web App** (formato: `https://script.google.com/macros/s/XXXXX/exec`)
6. Este é o link do seu sistema! Guarde-o.

> ⚠️ **Importante:** Toda vez que editar o `Code.gs`, deve criar uma **nova implementação** para que as mudanças entrem em vigor.

---

## 🌐 PARTE 2 — PUBLICAR NO GITHUB (Frontend Estático)

O arquivo `index.html` pode ser hospedado no GitHub Pages para um link estático (útil para desenvolvimento/teste ou como interface standalone).

> ⚠️ **Nota:** Para o sistema funcionar completamente (com dados reais do Google Sheets), o `index.html` deve ser servido pelo Google Apps Script como Web App (conforme Passo 4 acima). O GitHub hospedará a interface para visualização do código e testes.

### Para publicar no GitHub:

1. Acesse [github.com](https://github.com) e faça login
2. Crie um novo repositório: **"flyway-delivery"** (público)
3. Clique em **"Add file" → "Upload files"**
4. Faça upload dos ficheiros: `index.html`, `Code.gs`, `README.md`
5. Clique em **"Commit changes"**
6. Para ativar GitHub Pages:
   - Vá em **Settings → Pages**
   - Source: **Deploy from a branch** → Branch: **main** → pasta: **/ (root)**
   - Clique **Save**
7. Após alguns minutos, acesse: `https://SEU-USERNAME.github.io/flyway-delivery/`

---

## 🔐 PARTE 3 — CREDENCIAIS PADRÃO

Após a inicialização, o sistema criará estes usuários automaticamente:

| Username      | Senha        | Perfil         |
|---------------|--------------|----------------|
| `admin`       | `admin123`   | Administrador  |
| `assistente`  | `assist123`  | Assistente     |

> 🔒 **Altere as senhas imediatamente após o primeiro login!** (Menu Usuários → editar)

---

## 👥 PARTE 4 — PERFIS DE ACESSO

### Administrador
- ✅ Ver Dashboard
- ✅ Criar e Editar Pedidos
- ✅ **Eliminar Pedidos** (exclusivo)
- ✅ Gerir MotoBoys
- ✅ Ver e Exportar Relatórios
- ✅ Gerir Usuários do Sistema (criar, editar, eliminar)

### Assistente
- ✅ Ver Dashboard
- ✅ Criar e Editar Pedidos
- ❌ Eliminar Pedidos
- ✅ Gerir MotoBoys
- ✅ Ver e Exportar Relatórios
- ❌ Acesso à gestão de Usuários

---

## 📋 PARTE 5 — COMO USAR O SISTEMA

### Dashboard
- Exibe resumo de pedidos do dia, receita total, motoboys disponíveis
- Gráfico de pedidos dos últimos 7 dias
- Lista de pedidos recentes
- ℹ️ O valor em receita **só é contabilizado** quando o status do pedido for **"Entregue"**

### Novo Pedido
1. Preencha os dados do cliente (nome com autocompletar, contacto)
2. Informe o endereço de entrega
3. Selecione o tipo: Encomenda, Comida, Documento, Outro
4. Defina o valor da taxa de entrega
5. Atribua um MotoBoy disponível (opcional)
6. Clique **"Criar Pedido"**
7. Um **PIN de 4 dígitos** será gerado — entregue ao cliente para confirmar a encomenda

### Etapas do Pedido
```
Pendente → Em Rota → Entregue
                  ↘ Cancelado
```
- **Pendente:** Pedido registado, aguardando recolha
- **Em Rota:** MotoBoy a caminho do destino
- **Entregue:** Entrega concluída (receita contabilizada)
- **Cancelado:** Pedido cancelado

### Atualizar Status de um Pedido
1. Na aba **Pedidos**, clique no ícone ✏️ na linha do pedido
2. Selecione o novo status
3. Atribua ou mude o MotoBoy se necessário
4. Clique **"Confirmar"**

### Central MotoBoy
- Visualize todos os motoboys e seus status (Disponível/Ocupado)
- Adicione novos motoboys com nome e contacto
- Edite informações e status manualmente
- Elimine motoboys inativos

### Relatório
1. Aplique filtros: data início/fim, cliente, status, tipo
2. Clique **"Gerar Relatório"**
3. Visualize resumo e tabela detalhada
4. Exporte em **CSV** ou **Excel (.xls)**

### Gestão de Usuários (só Administrador)
1. Acesse **"Usuários"** no menu lateral
2. Clique **"Novo Usuário"** para adicionar
3. Defina: username único, senha, nome completo, perfil (Administrador/Assistente)
4. Use ✏️ para editar ou 🗑️ para eliminar

---

## 🏗️ ESTRUTURA DAS ABAS NO GOOGLE SHEETS

### Aba: Pedidos
| Coluna | Campo       | Descrição                    |
|--------|-------------|------------------------------|
| A      | ID          | Identificador único (PED-XXXXXX) |
| B      | Data/Hora   | Data e hora de criação       |
| C      | Cliente     | Nome do cliente              |
| D      | Contacto    | Telefone do cliente          |
| E      | Localização | Endereço de entrega          |
| F      | Tipo        | Encomenda/Comida/Documento/Outro |
| G      | PIN         | Código PIN de 4 dígitos      |
| H      | Valor Taxa  | Valor em MZN                 |
| I      | Status      | Pendente/Em Rota/Entregue/Cancelado |
| J      | Motoboy     | Nome do motoboy atribuído    |

### Aba: Clientes
| Coluna | Campo    |
|--------|----------|
| A      | Nome     |
| B      | Contacto |

### Aba: Motoboys
| Coluna | Campo    |
|--------|----------|
| A      | Nome     |
| B      | Contacto |
| C      | Status   |

### Aba: Usuarios
| Coluna | Campo         |
|--------|---------------|
| A      | Username      |
| B      | Senha         |
| C      | Nome Completo |
| D      | Status        |
| E      | Role (perfil) |

---

## 🔄 PARTE 6 — ACTUALIZAÇÕES FUTURAS

Para adicionar novas funcionalidades ao sistema:

### Actualizar o Backend (Code.gs):
1. Edite o `Code.gs` no Apps Script
2. Salve as mudanças
3. Clique **"Implementar" → "Gerir implementações"**
4. Clique no ícone ✏️ na implementação existente
5. Em "Versão", seleccione **"Nova versão"**
6. Clique **"Implementar"**

### Actualizar o Frontend (index.html):
1. No Apps Script, aceda a **Ficheiro → Novo → Ficheiro HTML**
2. Nomeie como `index`
3. Cole o conteúdo actualizado do `index.html`
4. Republicar como descrito acima

---

## 🐛 RESOLUÇÃO DE PROBLEMAS

| Problema | Solução |
|----------|---------|
| "Tabela de usuários não encontrada" | Execute a função `inicializarPlanilha` novamente |
| Dados não carregam | Verifique as permissões da Web App (deve ser "Qualquer pessoa") |
| Erro 403 | Republicar o Apps Script com nova versão |
| Exportação não funciona | Verificar se o browser permite downloads (popup blocker) |
| Login não funciona na Web App | Certifique-se que o `index.html` está no Apps Script, não no GitHub |

---

## 📞 SUPORTE TÉCNICO

Para dúvidas ou suporte na configuração:
- Verifique os logs: Apps Script → **Execuções** (menu lateral)
- Console do browser: **F12 → Console** para erros no frontend

---

*Sistema Fly Way Delivery v1.0 | Desenvolvido com Google Apps Script + HTML/CSS/JS*
