import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Check, X, UserCheck, UserX } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useCompany } from '../../hooks/useCompany'

interface Vendedor { id: string; nome: string; ativo: boolean }

const css = `
  .vend-page { padding: 24px; max-width: 700px; }
  .vend-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
  .vend-title { font-size: 15px; font-weight: 700; color: var(--text-primary); }
  .vend-sub { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
  .btn-add { background: #F58226; color: #fff; border: none; border-radius: 10px; padding: 10px 18px; font-size: 13px; font-weight: 700; font-family: 'Montserrat',sans-serif; cursor: pointer; display: flex; align-items: center; gap: 7px; transition: opacity .15s; }
  .btn-add:hover { opacity: .88; }
  .add-form { background: #FFF0E9; border: 0.5px solid #F5822640; border-radius: 12px; padding: 16px 18px; margin-bottom: 16px; display: flex; gap: 10px; align-items: center; }
  .add-form input { flex: 1; padding: 10px 14px; border: 0.5px solid var(--border-card); border-radius: 9px; font-family: 'Montserrat',sans-serif; font-size: 13px; color: var(--text-primary); outline: none; background: #fff; }
  .add-form input:focus { border-color: #F58226; }
  .btn-confirm { background: #F58226; color: #fff; border: none; border-radius: 9px; padding: 10px 16px; font-size: 13px; font-weight: 700; cursor: pointer; font-family: 'Montserrat',sans-serif; display: flex; align-items: center; gap: 6px; }
  .btn-cancel { background: var(--border-color); color: var(--text-secondary); border: none; border-radius: 9px; padding: 10px 14px; font-size: 13px; font-weight: 700; cursor: pointer; font-family: 'Montserrat',sans-serif; }
  .vend-list { display: flex; flex-direction: column; gap: 8px; }
  .vend-card { background: #fff; border: 0.5px solid var(--border-card); border-radius: 12px; padding: 14px 18px; display: flex; align-items: center; gap: 14px; }
  .vend-avatar { width: 38px; height: 38px; border-radius: 50%; background: #FFF0E9; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; color: #F58226; flex-shrink: 0; }
  .vend-avatar.inativo { background: var(--border-color); color: #bbb; }
  .vend-info { flex: 1; }
  .vend-nome { font-size: 14px; font-weight: 600; color: var(--text-primary); }
  .vend-nome.inativo { color: #bbb; text-decoration: line-through; }
  .vend-status { font-size: 11px; font-weight: 600; margin-top: 2px; }
  .vend-status.ativo { color: #2E7D32; }
  .vend-status.inativo { color: #bbb; }
  .vend-actions { display: flex; gap: 6px; }
  .btn-icon { width: 32px; height: 32px; border-radius: 8px; border: 0.5px solid var(--border-card); background: var(--bg-input); display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--text-secondary); transition: all .15s; }
  .btn-icon:hover { background: #F58226; color: #fff; border-color: #F58226; }
  .btn-icon.danger:hover { background: #FFEBEE; color: #C62828; border-color: #C62828; }
  .btn-icon.success:hover { background: #E8F5E9; color: #2E7D32; border-color: #2E7D32; }
  .edit-input { padding: 6px 10px; border: 0.5px solid #F58226; border-radius: 8px; font-family: 'Montserrat',sans-serif; font-size: 13px; color: var(--text-primary); outline: none; width: 200px; }
  .empty-vend { text-align: center; padding: 40px; color: #bbb; font-size: 13px; background: #fff; border: 0.5px solid var(--border-card); border-radius: 12px; }
  .stats-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 20px; }
  .stat-card { background: #fff; border: 0.5px solid var(--border-card); border-radius: 10px; padding: 14px 16px; text-align: center; }
  .stat-num { font-size: 20px; font-weight: 700; color: #F58226; }
  .stat-lbl { font-size: 11px; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: .4px; margin-top: 3px; }
`

function iniciais(n: string) { return n.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase() }

export default function Vendedores() {
  const companyId = useCompany()
  const [vendedores, setVendedores] = useState<Vendedor[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [novoNome, setNovoNome] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [editNome, setEditNome] = useState('')
  const [saving, setSaving] = useState(false)

  const fetch = async () => {
    if (!companyId) return
    const { data } = await supabase.from('vendedores').select('*').eq('company_id', companyId).order('nome')
    if (data) setVendedores(data)
    setLoading(false)
  }

  useEffect(() => { fetch() }, [companyId])

  const adicionar = async () => {
    if (!novoNome.trim()) return
    setSaving(true)
    const { data } = await supabase.from('vendedores').insert({ nome: novoNome.trim(), ativo: true, company_id: companyId }).select().single()
    if (data) setVendedores(prev => [...prev, data].sort((a,b) => a.nome.localeCompare(b.nome)))
    setNovoNome('')
    setShowAdd(false)
    setSaving(false)
  }

  const salvarEdicao = async (id: string) => {
    if (!editNome.trim()) return
    await supabase.from('vendedores').update({ nome: editNome.trim() }).eq('id', id)
    setVendedores(prev => prev.map(v => v.id === id ? { ...v, nome: editNome.trim() } : v))
    setEditId(null)
  }

  const toggleAtivo = async (v: Vendedor) => {
    await supabase.from('vendedores').update({ ativo: !v.ativo }).eq('id', v.id)
    setVendedores(prev => prev.map(x => x.id === v.id ? { ...x, ativo: !v.ativo } : x))
  }

  const excluir = async (id: string) => {
    if (!confirm('Excluir este vendedor?')) return
    await supabase.from('vendedores').delete().eq('id', id)
    setVendedores(prev => prev.filter(v => v.id !== id))
  }

  const ativos = vendedores.filter(v => v.ativo).length

  return (
    <>
      <style>{css}</style>
      <div className="vend-page">
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-num">{vendedores.length}</div>
            <div className="stat-lbl">Total</div>
          </div>
          <div className="stat-card">
            <div className="stat-num" style={{ color: '#2E7D32' }}>{ativos}</div>
            <div className="stat-lbl">Ativos</div>
          </div>
          <div className="stat-card">
            <div className="stat-num" style={{ color: '#bbb' }}>{vendedores.length - ativos}</div>
            <div className="stat-lbl">Inativos</div>
          </div>
        </div>

        <div className="vend-header">
          <div>
            <div className="vend-title">Vendedores cadastrados</div>
            <div className="vend-sub">Gerencie quem pode receber pedidos no Kanban</div>
          </div>
          <button className="btn-add" onClick={() => setShowAdd(true)}>
            <Plus size={15} /> Novo vendedor
          </button>
        </div>

        {showAdd && (
          <div className="add-form">
            <input
              autoFocus
              placeholder="Nome completo do vendedor..."
              value={novoNome}
              onChange={e => setNovoNome(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && adicionar()}
            />
            <button className="btn-confirm" onClick={adicionar} disabled={saving}>
              <Check size={14} /> {saving ? 'Salvando...' : 'Adicionar'}
            </button>
            <button className="btn-cancel" onClick={() => { setShowAdd(false); setNovoNome('') }}>
              Cancelar
            </button>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#bbb' }}>Carregando...</div>
        ) : (
          <div className="vend-list">
            {vendedores.length === 0 && (
              <div className="empty-vend">Nenhum vendedor cadastrado ainda.</div>
            )}
            {vendedores.map(v => (
              <div key={v.id} className="vend-card">
                <div className={`vend-avatar ${v.ativo ? '' : 'inativo'}`}>{iniciais(v.nome)}</div>
                <div className="vend-info">
                  {editId === v.id ? (
                    <input
                      className="edit-input"
                      autoFocus
                      value={editNome}
                      onChange={e => setEditNome(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') salvarEdicao(v.id); if (e.key === 'Escape') setEditId(null) }}
                    />
                  ) : (
                    <div className={`vend-nome ${v.ativo ? '' : 'inativo'}`}>{v.nome}</div>
                  )}
                  <div className={`vend-status ${v.ativo ? 'ativo' : 'inativo'}`}>
                    {v.ativo ? '● Ativo' : '○ Inativo'}
                  </div>
                </div>
                <div className="vend-actions">
                  {editId === v.id ? (
                    <>
                      <div className="btn-icon success" onClick={() => salvarEdicao(v.id)}><Check size={14} /></div>
                      <div className="btn-icon" onClick={() => setEditId(null)}><X size={14} /></div>
                    </>
                  ) : (
                    <>
                      <div className="btn-icon" title="Editar" onClick={() => { setEditId(v.id); setEditNome(v.nome) }}><Pencil size={14} /></div>
                      <div className={`btn-icon ${v.ativo ? 'danger' : 'success'}`} title={v.ativo ? 'Desativar' : 'Ativar'} onClick={() => toggleAtivo(v)}>
                        {v.ativo ? <UserX size={14} /> : <UserCheck size={14} />}
                      </div>
                      <div className="btn-icon danger" title="Excluir" onClick={() => excluir(v.id)}><Trash2 size={14} /></div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
