# AutoHub — Painel de Atendimento IA

Sistema de gestão de pedidos para distribuidoras de auto peças com integração ao N8N e Supabase.

---

## 🚀 PASSO A PASSO PARA COLOCAR NO AR HOJE

### 1. SUPABASE — Criar as tabelas

1. Acesse https://supabase.com e entre no seu projeto
2. Vá em **SQL Editor** → clique em **New query**
3. Cole e execute o SQL abaixo:

```sql
create table if not exists vendedores (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  ativo boolean default true
);

create table if not exists pedidos (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  started_at timestamptz default now(),
  ended_at timestamptz default now(),
  cliente_nome text not null,
  cliente_telefone text,
  veiculo_carro text,
  veiculo_ano text,
  veiculo_motor text,
  veiculo_placa text,
  itens jsonb default '[]',
  total numeric default 0,
  forma_pagamento text default 'pix',
  status text default 'aguardando_registro',
  vendedor text,
  n8n_pedido_id text unique
);

create table if not exists clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  telefone text unique,
  total_pedidos integer default 0,
  valor_acumulado numeric default 0,
  ultima_compra timestamptz
);

alter publication supabase_realtime add table pedidos;

insert into vendedores (nome) values
  ('Carlos Mendes'), ('João Silva'), ('Ana Paula'), ('Roberto Costa')
on conflict do nothing;

-- Dados de demonstração
insert into pedidos (cliente_nome, cliente_telefone, veiculo_carro, veiculo_ano, veiculo_motor, veiculo_placa, itens, total, forma_pagamento, status, started_at, ended_at)
values
  ('Oficina São Paulo', '5511999990001', 'Fiat Uno', '2019', '1.0', 'ABC-1234',
   '[{"descricao":"Filtro de óleo WEGA","valor":30},{"descricao":"Óleo 15W40 MAXON 4L","valor":120}]',
   150, 'pix', 'aguardando_registro', now() - interval '12 minutes', now() - interval '8 minutes'),
  ('Auto Center Goiás', '5562988880002', 'Chevrolet Onix', '2021', '1.0', 'BCD-2345',
   '[{"descricao":"Pastilha de freio Bosch","valor":95},{"descricao":"Correia dentada Gates","valor":180}]',
   275, 'credito', 'em_atendimento', now() - interval '5 minutes', now() - interval '2 minutes'),
  ('Mecânica do Zé', '5562977770003', 'VW Gol', '2017', '1.6', 'CDE-3456',
   '[{"descricao":"Vela de ignição NGK","valor":48},{"descricao":"Filtro de ar","valor":35}]',
   83, 'dinheiro', 'finalizado', now() - interval '2 hours', now() - interval '1 hour 50 minutes'),
  ('Garagem Total', '5562966660004', 'Honda Civic', '2020', '2.0', 'DEF-4567',
   '[{"descricao":"Amortecedor dianteiro","valor":320},{"descricao":"Kit bucha","valor":85}]',
   405, 'pix', 'aguardando_registro', now() - interval '30 minutes', now() - interval '24 minutes'),
  ('Top Car Service', '5562944440006', 'Fiat Argo', '2022', '1.3', 'FGH-6789',
   '[{"descricao":"Filtro de combustível","valor":45},{"descricao":"Filtro de ar","valor":35},{"descricao":"Óleo 5W30","valor":120}]',
   200, 'pix', 'aguardando_registro', now() - interval '45 minutes', now() - interval '38 minutes')
on conflict do nothing;
```

4. Vá em **Database → Replication** e confirme que a tabela `pedidos` está com Realtime ativo.

---

### 2. GITHUB — Subir o código

1. Crie um repositório novo em https://github.com/new (pode ser privado)
2. Faça upload de todos os arquivos desta pasta para o repositório
   - Ou use GitHub Desktop para arrastar a pasta

---

### 3. VERCEL — Deploy

1. Acesse https://vercel.com → **Add New Project**
2. Importe o repositório do GitHub
3. Em **Environment Variables**, adicione:

| Variável | Valor |
|----------|-------|
| `VITE_SUPABASE_URL` | `https://wyuhozopfyvpwsfsygqu.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `sb_publishable_4L53n3X9-oJTo8uHktxs0Q_UXIJ9pXP` |
| `VITE_N8N_WEBHOOK_ATUALIZAR_STATUS` | URL do seu webhook N8N |
| `VITE_N8N_WEBHOOK_FOLLOW_UP` | URL do seu webhook N8N |

4. Clique em **Deploy** — em 2 minutos está no ar!

---

### 4. N8N — Configurar webhooks

#### Webhook para receber novos pedidos (N8N → Sistema)
Configure seu fluxo do N8N para fazer POST no Supabase diretamente com este payload:

```
POST https://wyuhozopfyvpwsfsygqu.supabase.co/rest/v1/pedidos
Headers:
  apikey: sb_publishable_4L53n3X9-oJTo8uHktxs0Q_UXIJ9pXP
  Authorization: Bearer sb_publishable_4L53n3X9-oJTo8uHktxs0Q_UXIJ9pXP
  Content-Type: application/json
  Prefer: return=minimal

Body:
{
  "cliente_nome": "{{ $json.cliente_nome }}",
  "cliente_telefone": "{{ $json.cliente_telefone }}",
  "veiculo_carro": "{{ $json.veiculo_carro }}",
  "veiculo_ano": "{{ $json.veiculo_ano }}",
  "veiculo_motor": "{{ $json.veiculo_motor }}",
  "veiculo_placa": "{{ $json.veiculo_placa }}",
  "itens": {{ $json.itens }},
  "total": {{ $json.total }},
  "forma_pagamento": "{{ $json.forma_pagamento }}",
  "status": "aguardando_registro",
  "started_at": "{{ $json.started_at }}",
  "ended_at": "{{ $json.ended_at }}"
}
```

> O Supabase Realtime fará o card aparecer automaticamente no Kanban sem recarregar a página.

#### Webhook para atualizar status (Sistema → N8N)
Crie um webhook no N8N que recebe:
```json
{
  "pedidoId": "uuid",
  "status": "finalizado",
  "vendedor": "João Silva",
  "clienteNome": "Oficina São Paulo",
  "total": 150.00,
  "formaPagamento": "pix",
  "timestamp": "2025-05-13T14:32:00Z"
}
```
Use este webhook para enviar mensagem de confirmação ao cliente no WhatsApp.

---

## 📱 FUNCIONALIDADES

- **Dashboard** — KPIs, filtro por período, gráficos, top clientes, formas de pagamento, exportar Excel
- **Kanban** — 3 colunas drag & drop, atribuição de vendedor, link direto WhatsApp, finalizar pedido
- **Clientes** — Tabela com histórico completo, busca, link WhatsApp
- **Follow-up** — Alertas de atendimentos pendentes, envio de follow-up via N8N

## 🔔 Realtime
Novos pedidos inseridos pelo N8N aparecem automaticamente no Kanban com notificação toast.
