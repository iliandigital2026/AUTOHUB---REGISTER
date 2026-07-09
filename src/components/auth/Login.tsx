import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { LogoLogin } from '../layout/Logo'

const css = `
  .login-bg {
    min-height: 100vh;
    background: linear-gradient(140deg, #111111 0%, #1e100a 55%, #150808 100%);
    display: flex; align-items: center; justify-content: center;
    position: relative; overflow: hidden;
  }
  .login-bg::before {
    content: '';
    position: absolute; inset: 0;
    background:
      radial-gradient(ellipse at 25% 45%, rgba(245,130,38,0.10) 0%, transparent 55%),
      radial-gradient(ellipse at 75% 55%, rgba(214,44,39,0.07) 0%, transparent 55%);
    pointer-events: none;
  }
  .login-card {
    background: #ffffff; border-radius: 22px;
    padding: 44px 40px 36px; width: 100%; max-width: 420px;
    position: relative; box-shadow: 0 28px 72px rgba(0,0,0,0.4);
  }
  .login-logo-wrap { margin-bottom: 36px; }
  .login-title {
    font-size: 17px; font-weight: 700; color: var(--text-primary);
    margin-bottom: 4px; text-align: center;
    font-family: 'Montserrat', sans-serif;
  }
  .login-sub {
    font-size: 12px; color: #aaa; text-align: center;
    margin-bottom: 26px; font-family: 'Montserrat', sans-serif;
  }
  .field { margin-bottom: 15px; }
  .field label {
    display: block; font-size: 10px; font-weight: 700; color: #777;
    text-transform: uppercase; letter-spacing: .6px; margin-bottom: 6px;
    font-family: 'Montserrat', sans-serif;
  }
  .field input {
    width: 100%; padding: 12px 14px;
    border: 0.5px solid #E8E8E8; border-radius: 10px;
    font-family: 'Montserrat', sans-serif; font-size: 13px;
    color: var(--text-primary); background: #FAFAFA; outline: none;
    transition: border .15s, box-shadow .15s;
  }
  .field input:focus {
    border-color: #F58226; background: #fff;
    box-shadow: 0 0 0 3px rgba(245,130,38,0.09);
  }
  .btn-login {
    width: 100%; border: none; border-radius: 11px; padding: 13px;
    font-size: 14px; font-weight: 700; font-family: 'Montserrat', sans-serif;
    cursor: pointer; margin-top: 6px; letter-spacing: 0.02em;
    background: linear-gradient(90deg, #F58226 0%, #E8421F 55%, #D62C27 100%);
    color: #fff; box-shadow: 0 5px 18px rgba(245,130,38,0.32);
    transition: opacity .15s, box-shadow .15s;
  }
  .btn-login:hover { opacity: .91; box-shadow: 0 7px 22px rgba(245,130,38,0.42); }
  .btn-login:disabled { opacity: .5; cursor: not-allowed; }
  .login-error {
    background: #FFEBEE; color: #C62828; border-radius: 9px;
    padding: 10px 14px; font-size: 12px; font-weight: 600;
    margin-bottom: 14px; font-family: 'Montserrat', sans-serif;
  }
  .login-success {
    background: #E8F5E9; color: #2E7D32; border-radius: 9px;
    padding: 10px 14px; font-size: 12px; font-weight: 600;
    margin-bottom: 14px; font-family: 'Montserrat', sans-serif;
  }
  .divider {
    display: flex; align-items: center; gap: 10px;
    margin: 18px 0; color: #ddd; font-size: 11px;
    font-family: 'Montserrat', sans-serif;
  }
  .divider::before, .divider::after { content: ''; flex: 1; height: 0.5px; background: var(--border-color); }
  .login-footer {
    text-align: center; margin-top: 22px; font-size: 10px;
    color: #ccc; font-family: 'Montserrat', sans-serif; letter-spacing: 0.04em;
  }
`

export default function Login() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [sucesso, setSucesso]   = useState('')
  const [modo, setModo]         = useState<'login' | 'cadastro'>('login')

  const handleSubmit = async () => {
    setError(''); setSucesso('')
    if (!email || !password) { setError('Preencha e-mail e senha.'); return }
    if (password.length < 6) { setError('Senha mínima: 6 caracteres.'); return }
    setLoading(true)
    if (modo === 'login') {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password })
      if (err) setError('E-mail ou senha incorretos.')
    } else {
      const { error: err } = await supabase.auth.signUp({ email, password })
      if (err) setError(err.message)
      else setSucesso('Cadastro realizado! Verifique seu e-mail para confirmar o acesso.')
    }
    setLoading(false)
  }

  return (
    <>
      <style>{css}</style>
      <div className="login-bg">
        <div className="login-card">

          {/* Logo centralizado com visual do SVG */}
          <div className="login-logo-wrap">
            <LogoLogin />
          </div>

          <div className="login-title">
            {modo === 'login' ? 'Bem-vindo de volta' : 'Criar acesso'}
          </div>
          <div className="login-sub">
            {modo === 'login'
              ? 'Entre com suas credenciais para acessar o painel'
              : 'Preencha para criar seu acesso ao sistema'}
          </div>

          {error   && <div className="login-error">⚠️ {error}</div>}
          {sucesso && <div className="login-success">✅ {sucesso}</div>}

          <div className="field">
            <label>E-mail</label>
            <input type="email" placeholder="seu@email.com" value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
          </div>
          <div className="field">
            <label>Senha</label>
            <input type="password" placeholder="••••••••" value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
          </div>

          <button className="btn-login" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Aguarde...' : modo === 'login' ? '→ Entrar no painel' : 'Criar conta'}
          </button>

          <div className="divider">ou</div>

          <div style={{ textAlign: 'center', fontSize: 12, color: '#aaa', fontFamily: 'Montserrat, sans-serif' }}>
            {modo === 'login' ? 'Não tem acesso? ' : 'Já tem conta? '}
            <span
              style={{ color: '#F58226', fontWeight: 700, cursor: 'pointer' }}
              onClick={() => { setModo(modo === 'login' ? 'cadastro' : 'login'); setError(''); setSucesso('') }}
            >
              {modo === 'login' ? 'Solicite ao administrador' : 'Fazer login'}
            </span>
          </div>

          <div className="login-footer">
            AutoHub © {new Date().getFullYear()} · Painel de Gestão Automotiva
          </div>
        </div>
      </div>
    </>
  )
}
