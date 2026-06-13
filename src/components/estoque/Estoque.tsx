import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useCompany } from '../../hooks/useCompany'
import { Plus, Trash2, Pencil, Check, X, Upload, Download, Package } from 'lucide-react'
import * as XLSX from 'xlsx'

interface Peca {
  id?: string
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
  .est-title { font-size: 15px; font-weight: 700; color: #1A1A1A; flex: 1; }
  .btn-primary { background: #F58226; color: #fff; border: none; border-radius: 10px; padding: 9px 16px; font-size: 12px; font-weight: 700; font-family: Montserrat,sans-serif; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: opacity .15s; }
  .btn-primary:hover { opacity: .88; }
  .btn-outline { background: transparent; color: #F58226; border: 1px solid #F58226; border-radius: 10px; padding: 8px 14px; font-size: 12px; font-weight: 700; font-family: Montserrat,sans-serif; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: background .15s; }
  .btn-outline:hover { background: #FFF0E9; }
  .btn-gray { background: #F0F0F0; color: #666; border: none; border-radius: 10px; padding: 9px 14px; font-size: 12px; font-weight: 700; font-family: Montserrat,sans-serif; cursor: pointer; display: flex; align-items: center; gap: 6px; }
  .est-stats { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; margin-bottom: 20px; }
  .est-stat { background: #fff; border: 0.5px solid #E0E0E0; border-radius: 12px; padding: 14px 18px; }
  .est-stat-val { font-size: 22px; font-weight: 700; color: #F58226; }
  .est-stat-lbl { font-size: 11px; color: #999; font-weight: 600; text-transform: uppercase; letter-spacing: .4px; margin-top: 2px; }
  .table-wrap { background: #fff; border: 0.5px solid #E0E0E0; border-radius: 12px; overflow: auto; }
  .est-table { width: 100%; border-collapse: collapse; min-width: 900px; }
  .est-table th { font-size: 10px; font-weight: 700; color: #999; text-transform: uppercase; letter-spacing: .5px; padding: 12px 14px; background: #F9F9F9; border-bottom: 0.5px solid #E8E8E8; text-align: left; white-space: nowrap; }
  .est-table td { font-size: 12px; color: #1A1A1A; padding: 10px 14px; border-bottom: 0.5px solid #F0F0F0; vertical-align: middle; }
  .est-table tr:last-child td { border-bottom: none; }
  .est-table tr:hover td { background: #FFFAF8; }
  .badge-qtd { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 700; }
  .badge-ok { background: #E8F5E9; color: #2E7D32; }
  .badge-low { background: #FFF8E1; color: #F57F17; }
  .badge-zero { background: #FFEBEE; color: #C62828; }
  .btn-icon { width: 28px; height: 28px; border-radius: 7px; border: 0.5px solid #E0E0E0; background: #F6F6F6; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #666; transition: all .15s; }
  .btn-icon:hover { background: #F58226; color: #fff; border-color: #F58226; }
  .btn-icon.danger:hover { background: #FFEBEE; color: #C62828; border-color: #C62828; }
  .modal-bg { position: fixed; inset: 0; background: rgba(0,0,0,0.35); z-index: 200; display: flex; align-items: center; justify-content: center; }
  .modal { background: #fff; border-radius: 16px; padding: 28px; width: 560px; max-height: 90vh; overflow-y: auto; box-shadow: 0 8px 32px rgba(0,0,0,0.15); }
  .modal-title { font-size: 15px; font-weight: 700; color: #1A1A1A; margin-bottom: 20px; }
  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .form-group { display: flex; flex-direction: column; gap: 5px; }
  .form-group.full { grid-column: 1/-1; }
  .form-label { font-size: 11px; font-weight: 700; color: #999; text-transform: uppercase; letter-spacing: .4px; }
  .form-input { padding: 9px 12px; border: 0.5px solid #E0E0E0; border-radius: 8px; font-family: Montserrat,sans-serif; font-size: 13px; color: #1A1A1A; outline: none; }
  .form-input:focus { border-color: #F58226; }
  .modal-footer { display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px; }
  .empty-est { text-align: center; padding: 60px; color: #bbb; }
`

const VAZIA: Peca = {
  categoria: 'Carro', produto: '', marca_produto: '', carro: '',
  motor_carro: '', marca_carro: '', carro_chave: '', ano_carro: '',
  quantidade: 0, valor: 0,
}

function fmtMoeda(v: number) {
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function Estoque() {
  const companyId = useCompany()
  const [pecas, setPecas] = useState<(Peca & { id: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editando, setEditando] = useState<(Peca & { id: string }) | null>(null)
  const [form, setForm] = useState<Peca>(VAZIA)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

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
      ['CATEGORIA','PRODUTO','MARCA_PRODUTO','CARRO','MOTOR_CARRO','MARCA_CARRO','CARRO_CHAVE','ANO_CARRO','QUANTIDADE','VALOR'],
      ['Carro','Amortecedor Dianteiro','Monroe','Hyundai Creta','1.6, 2.0','Hyundai','Creta','2020, 2021, 2022',4,1320],
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
          <button className="btn-gray" onClick={baixarModelo}>
            <Download size={13} /> Baixar modelo
          </button>
          <button className="btn-outline" onClick={() => fileRef.current?.click()}>
            <Upload size={13} /> Importar planilha
          </button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} onChange={importar} />
          <button className="btn-primary" onClick={abrirNovo}>
            <Plus size={13} /> Nova peça
          </button>
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
                  <th>Produto</th>
                  <th>Marca</th>
                  <th>Carro</th>
                  <th>Motor</th>
                  <th>Ano</th>
                  <th>Qtd</th>
                  <th>Valor</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {pecas.map(p => (
                  <tr key={p.id}>
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
