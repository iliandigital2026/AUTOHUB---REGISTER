import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseKey)

export const SQL_SETUP = `
-- Rodar no Supabase SQL Editor

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

-- Habilitar Realtime na tabela pedidos
alter publication supabase_realtime add table pedidos;

-- Dados iniciais de vendedores
insert into vendedores (nome) values
  ('Carlos Mendes'),
  ('João Silva'),
  ('Ana Paula'),
  ('Roberto Costa')
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

  ('Elias Auto Peças', '5562955550005', 'Toyota Corolla', '2018', '2.0', 'EFG-5678',
   '[{"descricao":"Correia serpentina","valor":75},{"descricao":"Tensor","valor":95}]',
   170, 'debito', 'finalizado', now() - interval '3 hours', now() - interval '2 hours 45 minutes'),

  ('Top Car Service', '5562944440006', 'Fiat Argo', '2022', '1.3', 'FGH-6789',
   '[{"descricao":"Filtro de combustível","valor":45},{"descricao":"Filtro de ar","valor":35},{"descricao":"Óleo 5W30","valor":120}]',
   200, 'pix', 'aguardando_registro', now() - interval '45 minutes', now() - interval '38 minutes'),

  ('Mecânica Veloz', '5562933330007', 'VW Polo', '2021', '1.0', 'GHI-7890',
   '[{"descricao":"Pastilha de freio traseira","valor":88},{"descricao":"Disco de freio","valor":160}]',
   248, 'credito', 'finalizado', now() - interval '5 hours', now() - interval '4 hours 50 minutes')
on conflict do nothing;
`
