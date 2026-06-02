import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { Trash2, RotateCcw, Clock } from "lucide-react";

interface Pedido {
  id: string;
  cliente_nome: string;
  cliente_telefone?: string;
  itens: any;
  total: number;
  forma_pagamento?: string;
  deleted_at: string;
  marca_produto?: string;
  veiculo_carro?: string;
}

function parseItens(itens: any): any[] {
  if (Array.isArray(itens)) return itens;
  if (typeof itens === "string") {
    try { return JSON.parse(itens); } catch { return []; }
  }
  return [];
}

function diasRestantes(deleted_at: string): number {
  const deletedDate = new Date(deleted_at);
  const expira = new Date(deletedDate.getTime() + 60 * 24 * 60 * 60 * 1000);
  const agora = new Date();
  const diff = Math.ceil((expira.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

export default function Lixeira() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [restaurando, setRestaurando] = useState<string | null>(null);

  async function carregar() {
    setLoading(true);
    const { data, error } = await supabase
      .from("pedidos")
      .select("*")
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false });
    if (!error && data) setPedidos(data);
    setLoading(false);
  }

  async function restaurar(id: string) {
    setRestaurando(id);
    const { error } = await supabase
      .from("pedidos")
      .update({ deleted_at: null })
      .eq("id", id);
    if (!error) {
      setPedidos((prev) => prev.filter((p) => p.id !== id));
    }
    setRestaurando(null);
  }

  useEffect(() => { carregar(); }, []);

  return (
    <div style={{ padding: "2rem", maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: "1.5rem" }}>
        <Trash2 size={24} color="#E8421F" />
        <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#1a1a1a", margin: 0 }}>
          Lixeira
        </h1>
        <span style={{
          marginLeft: "auto", fontSize: 13, color: "#888",
          background: "#f5f5f5", padding: "4px 12px", borderRadius: 20
        }}>
          Itens apagados automaticamente após 60 dias
        </span>
      </div>

      {loading && (
        <p style={{ color: "#888", textAlign: "center", marginTop: "3rem" }}>Carregando...</p>
      )}

      {!loading && pedidos.length === 0 && (
        <div style={{ textAlign: "center", marginTop: "4rem", color: "#aaa" }}>
          <Trash2 size={48} color="#ddd" />
          <p style={{ marginTop: 12, fontSize: 15 }}>Lixeira vazia</p>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {pedidos.map((p) => {
          const itens = parseItens(p.itens);
          const dias = diasRestantes(p.deleted_at);
          const urgente = dias <= 10;

          return (
            <div key={p.id} style={{
              background: "#fff",
              border: "1px solid #eee",
              borderRadius: 12,
              padding: "1rem 1.25rem",
              display: "flex",
              alignItems: "center",
              gap: 16,
              boxShadow: "0 1px 4px rgba(0,0,0,0.05)"
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, fontSize: 15, color: "#1a1a1a" }}>
                    {p.cliente_nome}
                  </span>
                  {p.veiculo_carro && (
                    <span style={{
                      fontSize: 11, background: "#f0f0f0", color: "#666",
                      padding: "2px 8px", borderRadius: 10
                    }}>
                      {p.veiculo_carro}
                    </span>
                  )}
                  {p.marca_produto && (
                    <span style={{
                      fontSize: 11, background: "#FFF3EC", color: "#E8421F",
                      padding: "2px 8px", borderRadius: 10
                    }}>
                      {p.marca_produto}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 13, color: "#666", marginBottom: 4 }}>
                  {itens.length > 0
                    ? itens.map((it: any) =>
                        typeof it === "string" ? it : `${it.quantidade || 1}x ${it.descricao || it.nome || ""}`
                      ).join(", ")
                    : "Sem itens"}
                </div>
                <div style={{ fontSize: 12, color: "#999" }}>
                  Total: <strong style={{ color: "#1a1a1a" }}>
                    R$ {Number(p.total || 0).toFixed(2)}
                  </strong>
                  {p.forma_pagamento && (
                    <span style={{ marginLeft: 8 }}>· {p.forma_pagamento}</span>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 5,
                  background: urgente ? "#FFF0F0" : "#f5f5f5",
                  padding: "4px 10px", borderRadius: 20,
                  fontSize: 12,
                  color: urgente ? "#E8421F" : "#888"
                }}>
                  <Clock size={12} />
                  {dias}d restantes
                </div>

                <button
                  onClick={() => restaurar(p.id)}
                  disabled={restaurando === p.id}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    background: "#F58226", color: "#fff",
                    border: "none", borderRadius: 8,
                    padding: "8px 16px", fontSize: 13,
                    fontWeight: 600, cursor: "pointer",
                    opacity: restaurando === p.id ? 0.6 : 1
                  }}
                >
                  <RotateCcw size={14} />
                  {restaurando === p.id ? "Restaurando..." : "Restaurar"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
