import { useUserRole } from '../../hooks/useUserRole'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useCompany } from '../../hooks/useCompany'
import { Plus, Trash2, Pencil, Check, X, Upload, Download, Package } from 'lucide-react'
import * as XLSX from 'xlsx'

interface Peca {
  id?: string
  codigo_peca?: string
  categoria: string
  produto: string
  marca_produto: string
  carro: string
  motor_carro: string
  marca_carro: string
  carro_chave: string
  ano_carro: string
  quantidade: number
  valor: number
}

const css = `
  .est-page { padding: 24px; max-width: 1200px; }
  .est-header { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
  .est-title { font-size: 15px; font-weight: 700; color: var(--text-primary); flex: 1; }
  .btn-primary { background: #F58226; color: #fff; border: none; border-radius: 10px; padding: 9px 16px; font-size: 12px; font-weight: 700; font-family: Montserrat,sans-serif; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: opacity .15s; }
  .btn-primary:hover { opacity: .88; }
  .btn-outline { background: transparent; color: #F58226; border: 1px solid #F58226; border-radius: 10px; padding: 8px 14px; font-size: 12px; font-weight: 700; font-family: Montserrat,sans-serif; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: background .15s; }
  .btn-outline:hover { background: var(--bg-card)0E9; }
  .btn-gray { background: var(--border-color); color: var(--text-secondary); border: none; border-radius: 10px; padding: 9px 14px; font-size: 12px; font-weight: 700; font-family: Montserrat,sans-serif; cursor: pointer; display: flex; align-items: center; gap: 6px; }
  .est-stats { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; margin-bottom: 20px; }
  .est-stat { background: var(--bg-card); border: 0.5px solid var(--border-card); border-radius: 12px; padding: 14px 18px; }
  .est-stat-val { font-size: 22px; font-weight: 700; color: #F58226; }
  .est-stat-lbl { font-size: 11px; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: .4px; margin-top: 2px; }
  .table-wrap { background: var(--bg-card); border: 0.5px solid var(--border-card); border-radius: 12px; overflow: auto; }
  .est-table { width: 100%; border-collapse: collapse; min-width: 900px; }
  .est-table th { font-size: 10px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: .5px; padding: 12px 14px; background: var(--bg-table-head); border-bottom: 0.5px solid var(--border-card); text-align: left; white-space: nowrap; }
  .est-table td { font-size: 12px; color: var(--text-primary); padding: 10px 14px; border-bottom: 0.5px solid var(--border-color); vertical-align: middle; }
  .est-table tr:last-child td { border-bottom: none; }
  .est-table tr:hover td { background: var(--bg-card)AF8; }
  .badge-qtd { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 700; }
  .badge-ok { background: var(--bg-success); color: var(--color-success); }
  .badge-low { background: var(--bg-card)8E1; color: #F57F17; }
  .badge-zero { background: var(--bg-danger); color: var(--color-danger); }
  .btn-icon { width: 28px; height: 28px; border-radius: 7px; border: 0.5px solid var(--border-card); background: var(--bg-input); display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--text-secondary); transition: all .15s; }
  .btn-icon:hover { background: #F58226; color: #fff; border-color: #F58226; }
  .btn-icon.danger:hover { background: var(--bg-danger); color: var(--color-danger); border-color: var(--color-danger); }
  .modal-bg { position: fixed; inset: 0; background: rgba(0,0,0,0.35); z-index: 200; display: flex; align-items: center; justify-content: center; }
  .modal { background: var(--bg-card); border-radius: 16px; padding: 28px; width: 560px; max-height: 90vh; overflow-y: auto; box-shadow: 0 8px 32px rgba(0,0,0,0.15); }
  .modal-title { font-size: 15px; font-weight: 700; color: var(--text-primary); margin-bottom: 20px; }
  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .form-group { display: flex; flex-direction: column; gap: 5px; }
  .form-group.full { grid-column: 1/-1; }
  .form-label { font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: .4px; }
  .form-input { padding: 9px 12px; border: 0.5px solid var(--border-card); border-radius: 8px; font-family: Montserrat,sans-serif; font-size: 13px; color: var(--text-primary); outline: none; }
  .form-input:focus { border-color: #F58226; }
  .modal-footer { display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px; }
  .empty-est { text-align: center; padding: 60px; color: var(--text-muted); }
`

const VAZIA: Peca = {
  codigo_peca: '', categoria: 'Carro', produto: '', marca_produto: '', carro: '',
  motor_carro: '', marca_carro: '', carro_chave: '', ano_carro: '',
  quantidade: 0, valor: 0,
}

function fmtMoeda(v: number) {
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function Estoque() {
  const { role } = useUserRole()
  const podeGerenciar = role !== 'vendedor'
  const companyId = useCompany()
  const [pecas, setPecas] = useState<(Peca & { id: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editando, setEditando] = useState<(Peca & { id: string }) | null>(null)
  const [form, setForm] = useState<Peca>(VAZIA)
  const [saving, setSaving] = useState(false)
  const [filterText, setFilterText] = useState('')
  const [colFilters, setColFilters] = useState<Record<string,string>>({})
  const [openFilter, setOpenFilter] = useState<string|null>(null)
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set())
  const fileRef = useRef<HTMLInputElement>(null)

  const toggleSelecionar = (id: string) => {
    setSelecionados(prev => {
      const novo = new Set(prev)
      if (novo.has(id)) novo.delete(id)
      else novo.add(id)
      return novo
    })
  }

  const toggleTodos = () => {
    if (selecionados.size === pecas.length) setSelecionados(new Set())
    else setSelecionados(new Set(pecas.map(p => p.id)))
  }

  const excluirSelecionados = async () => {
    if (!confirm(`Excluir ${selecionados.size} peça(s) do estoque?`)) return
    await supabase.from('estoque').delete().in('id', Array.from(selecionados))
    setSelecionados(new Set())
    await carregar()
  }

  const carregar = async () => {
    if (!companyId) return
    setLoading(true)
    const { data } = await supabase.from('estoque').select('*').eq('company_id', companyId).order('produto')
    if (data) setPecas(data as any)
    setLoading(false)
  }

  useEffect(() => { carregar() }, [companyId])

  const abrirNovo = () => { setForm(VAZIA); setEditando(null); setModal(true) }
  const abrirEdicao = (p: Peca & { id: string }) => { setForm({ ...p }); setEditando(p); setModal(true) }

  const salvar = async () => {
    if (!companyId || !form.produto.trim()) return
    setSaving(true)
    const payload = { ...form, company_id: companyId, valor: Number(form.valor), quantidade: Number(form.quantidade) }
    if (editando) {
      await supabase.from('estoque').update(payload).eq('id', editando.id)
    } else {
      await supabase.from('estoque').insert(payload)
    }
    await carregar()
    setModal(false)
    setSaving(false)
  }

  const excluir = async (id: string) => {
    if (!confirm('Excluir esta peça do estoque?')) return
    await supabase.from('estoque').delete().eq('id', id)
    setPecas(prev => prev.filter(p => p.id !== id))
  }

  const baixarModelo = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['CODIGO_PECA','CATEGORIA','PRODUTO','MARCA_PRODUTO','CARRO','MOTOR_CARRO','MARCA_CARRO','CARRO_CHAVE','ANO_CARRO','QUANTIDADE','VALOR'],
      ['GP30352PS','Carro','Amortecedor Dianteiro','Monroe','Hyundai Creta','1.6, 2.0','Hyundai','Creta','2020, 2021, 2022',4,1320],
    ])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Estoque')
    XLSX.writeFile(wb, 'modelo_estoque.xlsx')
  }

  const importar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !companyId) return
    const data = await file.arrayBuffer()
    const wb = XLSX.read(data)
    const ws = wb.Sheets[wb.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json(ws) as any[]
    const inserir = rows.map(r => ({
      company_id: companyId,
      codigo_peca: r.CODIGO_PECA || r.CODIGO || '',
      categoria: r.CATEGORIA || 'Carro',
      produto: r.PRODUTO || '',
      marca_produto: r.MARCA_PRODUTO || '',
      carro: r.CARRO || '',
      motor_carro: r.MOTOR_CARRO || '',
      marca_carro: r.MARCA_CARRO || '',
      carro_chave: r.CARRO_CHAVE || '',
      ano_carro: String(r.ANO_CARRO || ''),
      quantidade: Number(r.QUANTIDADE || 0),
      valor: Number(String(r.VALOR || '0').replace(/[^0-9,.]/g,'').replace(',','.')) || 0,
    })).filter(r => r.produto)
    if (inserir.length > 0) {
      await supabase.from('estoque').insert(inserir)
      await carregar()
      alert(`${inserir.length} peças importadas com sucesso!`)
    }
    e.target.value = ''
  }

  const totalItens = pecas.length
  const totalValor = pecas.reduce((a, p) => a + (p.valor * p.quantidade), 0)
  const semEstoque = pecas.filter(p => p.quantidade === 0).length

  return (
    <>
      <style>{css}</style>
      <div className="est-page">
        <div className="est-header">
          <div className="est-title">
            <Package size={16} style={{ display: 'inline', marginRight: 8, color: '#F58226' }} />
            Estoque de Peças
          </div>
          {podeGerenciar && selecionados.size > 0 && (
            <button className="btn-primary" style={{ background: '#C62828' }} onClick={excluirSelecionados}>
              <Trash2 size={13} /> Excluir {selecionados.size} selecionado(s)
            </button>
          )}
          {podeGerenciar && pecas.length > 0 && (
            <button className="btn-gray" onClick={toggleTodos}>
              {selecionados.size === pecas.length ? 'Desmarcar tudo' : 'Selecionar tudo'}
            </button>
          )}
          {podeGerenciar && (
            <button className="btn-gray" onClick={baixarModelo}>
              <Download size={13} /> Baixar modelo
            </button>
          )}
          {podeGerenciar && (
            <button className="btn-outline" onClick={() => fileRef.current?.click()}>
              <Upload size={13} /> Importar planilha
            </button>
          )}
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} onChange={importar} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-input)', border: '1px solid var(--border-card)', borderRadius: 10, padding: '6px 12px', minWidth: 220 }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>🔍</span>
            <input
              type="text"
              placeholder="Buscar no estoque..."
              value={filterText}
              onChange={e => setFilterText(e.target.value)}
              style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 12, color: 'var(--text-primary)', fontFamily: 'Montserrat, sans-serif', width: '100%' }}
            />
          </div>
          {podeGerenciar && (
            <button className="btn-primary" onClick={abrirNovo}>
              <Plus size={13} /> Nova peça
            </button>
          )}
        </div>

        <div className="est-stats">
          <div className="est-stat">
            <div className="est-stat-val">{totalItens}</div>
            <div className="est-stat-lbl">Total de itens</div>
          </div>
          <div className="est-stat">
            <div className="est-stat-val">{fmtMoeda(totalValor)}</div>
            <div className="est-stat-lbl">Valor em estoque</div>
          </div>
          <div className="est-stat">
            <div className="est-stat-val" style={{ color: semEstoque > 0 ? '#C62828' : '#2E7D32' }}>{semEstoque}</div>
            <div className="est-stat-lbl">Sem estoque</div>
          </div>
        </div>

        <div className="table-wrap">
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#bbb' }}>Carregando...</div>
          ) : pecas.length === 0 ? (
            <div className="empty-est">
              <Package size={40} color="#ddd" />
              <p style={{ marginTop: 12 }}>Nenhuma peça cadastrada ainda.</p>
            </div>
          ) : (
            <table className="est-table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}></th>
                  <th>Codigo</th>
                  {[
                    { label: 'Produto', col: 'produto' },
                    { label: 'Marca', col: 'marca_produto' },
                    { label: 'Carro', col: 'carro' },
                    { label: 'Motor', col: 'motor_carro' },
                    { label: 'Ano', col: 'ano_carro' },
                  ].map(({ label, col }) => (
                    <th key={col} style={{ position: 'relative' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', userSelect: 'none' }} onClick={() => setOpenFilter(openFilter === col ? null : col)}>
                        <span>{label}</span>
                        <span style={{ fontSize: 9, color: colFilters[col] ? 'var(--brand-orange)' : 'var(--text-muted)', marginLeft: 2 }}>{colFilters[col] ? '▼' : '⇅'}</span>
                      </div>
                      {openFilter === col && (
                        <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 100, background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: 8, padding: 8, minWidth: 160, boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
                          <input
                            autoFocus
                            type="text"
                            placeholder={`Filtrar ${label}...`}
                            value={colFilters[col] || ''}
                            onChange={e => setColFilters(f => ({ ...f, [col]: e.target.value }))}
                            onKeyDown={e => e.key === 'Escape' && setOpenFilter(null)}
                            style={{ width: '100%', padding: '6px 8px', border: '1px solid var(--border-card)', borderRadius: 6, fontSize: 12, background: 'var(--bg-input)', color: 'var(--text-primary)', outline: 'none', fontFamily: 'Montserrat, sans-serif' }}
                          />
                          {colFilters[col] && (
                            <div onClick={() => { setColFilters(f => ({ ...f, [col]: '' })); setOpenFilter(null) }} style={{ marginTop: 6, fontSize: 11, color: 'var(--color-danger)', cursor: 'pointer', textAlign: 'right' }}>
                              Limpar filtro
                            </div>
                          )}
                          <div style={{ marginTop: 4, maxHeight: 150, overflowY: 'auto' }}>
                            {[...new Set(pecas.map(p => String(p[col as keyof typeof p] || '')))].filter(Boolean).filter(v => !colFilters[col] || v.toLowerCase().includes((colFilters[col]||'').toLowerCase())).slice(0,10).map(val => (
                              <div key={val} onClick={() => { setColFilters(f => ({ ...f, [col]: val })); setOpenFilter(null) }} style={{ padding: '4px 8px', fontSize: 11, cursor: 'pointer', borderRadius: 4, color: 'var(--text-secondary)' }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-input)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                {val}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </th>
                  ))}
                  <th>Qtd</th>
                  <th>Valor</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {pecasFiltradas.map(p => (
                  <tr key={p.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selecionados.has(p.id)}
                        onChange={() => toggleSelecionar(p.id)}
                        style={{ width: 16, height: 16, accentColor: '#F58226', cursor: 'pointer' }}
                      />
                    </td>
                    <td style={{ fontSize: 11, color: '#888', fontFamily: 'monospace' }}>{p.codigo_peca || '—'}</td>
                    <td style={{ fontWeight: 600 }}>{p.produto}</td>
                    <td>{p.marca_produto}</td>
                    <td>{p.carro}</td>
                    <td style={{ color: '#888' }}>{p.motor_carro}</td>
                    <td style={{ color: '#888', fontSize: 11 }}>{p.ano_carro}</td>
                    <td>
                      <span className={`badge-qtd ${p.quantidade === 0 ? 'badge-zero' : p.quantidade <= 3 ? 'badge-low' : 'badge-ok'}`}>
                        {p.quantidade} un.
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: '#F58226' }}>{fmtMoeda(p.valor)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <div className="btn-icon" onClick={() => abrirEdicao(p)}><Pencil size={13} /></div>
                        <div className="btn-icon danger" onClick={() => excluir(p.id)}><Trash2 size={13} /></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modal && (
        <div className="modal-bg" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">{editando ? 'Editar peça' : 'Nova peça'}</div>
            <div className="form-grid">
              {[
                { label: 'Codigo da peca', key: 'codigo_peca' },
                { label: 'Produto', key: 'produto', full: true },
                { label: 'Marca do produto', key: 'marca_produto' },
                { label: 'Categoria', key: 'categoria' },
                { label: 'Carro', key: 'carro', full: true },
                { label: 'Carro chave', key: 'carro_chave' },
                { label: 'Marca do carro', key: 'marca_carro' },
                { label: 'Motor', key: 'motor_carro' },
                { label: 'Ano(s)', key: 'ano_carro' },
                { label: 'Quantidade', key: 'quantidade' },
                { label: 'Valor (R$)', key: 'valor' },
              ].map(({ label, key, full }) => (
                <div key={key} className={`form-group${full ? ' full' : ''}`}>
                  <label className="form-label">{label}</label>
                  <input
                    className="form-input"
                    value={(form as any)[key]}
                    onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
            <div className="modal-footer">
              <button className="btn-gray" onClick={() => setModal(false)}><X size={13} /> Cancelar</button>
              <button className="btn-primary" onClick={salvar} disabled={saving}>
                <Check size={13} /> {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
