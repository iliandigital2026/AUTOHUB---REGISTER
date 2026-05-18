// Logo AutoHub v2 — extraído do SVG oficial atualizado
// Tagline: Pedidos · Métricas · Controle
// Subtítulo: PAINEL DE GESTÃO AUTOMOTIVA

export function LogoIconDark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="lig-d" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F58226"/>
          <stop offset="100%" stopColor="#D62C27"/>
        </linearGradient>
      </defs>
      <rect width="50" height="50" rx="12" fill="url(#lig-d)"/>
      {/* círculo central */}
      <circle cx="25" cy="25" r="7" fill="#fff" opacity="0.95"/>
      {/* satélites */}
      <circle cx="39" cy="13" r="4" fill="#fff" opacity="0.7"/>
      <circle cx="42" cy="31" r="4" fill="#fff" opacity="0.7"/>
      <circle cx="13" cy="37" r="4" fill="#fff" opacity="0.7"/>
      {/* linhas de conexão */}
      <line x1="25" y1="25" x2="39" y2="13" stroke="#fff" strokeWidth="1.6" opacity="0.5"/>
      <line x1="25" y1="25" x2="42" y2="31" stroke="#fff" strokeWidth="1.6" opacity="0.5"/>
      <line x1="25" y1="25" x2="13" y2="37" stroke="#fff" strokeWidth="1.6" opacity="0.5"/>
    </svg>
  )
}

export function LogoIconLight({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="lig-l" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F9A05A"/>
          <stop offset="100%" stopColor="#E8421F"/>
        </linearGradient>
        <linearGradient id="lig-lc" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#F58226"/>
          <stop offset="55%" stopColor="#E8421F"/>
          <stop offset="100%" stopColor="#D62C27"/>
        </linearGradient>
      </defs>
      <rect width="50" height="50" rx="12" fill="#FFF3EC" stroke="#F9A05A" strokeWidth="0.75"/>
      <circle cx="25" cy="25" r="7" fill="url(#lig-lc)" opacity="0.9"/>
      <circle cx="39" cy="13" r="4" fill="#E8421F" opacity="0.45"/>
      <circle cx="42" cy="31" r="4" fill="#E8421F" opacity="0.45"/>
      <circle cx="13" cy="37" r="4" fill="#E8421F" opacity="0.45"/>
      <line x1="25" y1="25" x2="39" y2="13" stroke="#F58226" strokeWidth="1.6" opacity="0.35"/>
      <line x1="25" y1="25" x2="42" y2="31" stroke="#F58226" strokeWidth="1.6" opacity="0.35"/>
      <line x1="25" y1="25" x2="13" y2="37" stroke="#F58226" strokeWidth="1.6" opacity="0.35"/>
    </svg>
  )
}

// Logo completo — versão sidebar (clara)
export function LogoFull({ variant = 'light' }: { variant?: 'dark' | 'light' }) {
  const isDark = variant === 'dark'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
      {isDark ? <LogoIconDark size={38} /> : <LogoIconLight size={38} />}
      <div>
        {/* Nome: Auto (gradiente) + Hub (leve) */}
        <div style={{ lineHeight: 1.1, fontFamily: 'Montserrat, sans-serif', fontSize: 18, fontWeight: 700, letterSpacing: '-0.5px' }}>
          <span style={{
            background: 'linear-gradient(90deg, #F58226 0%, #E8421F 55%, #D62C27 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>Auto</span>
          <span style={{
            fontWeight: 300,
            color: isDark ? '#ffffff' : '#1a1a1a',
            WebkitTextFillColor: isDark ? '#ffffff' : '#1a1a1a',
          }}>Hub</span>
        </div>

        {/* Linha de separação fina com gradiente */}
        <div style={{
          height: '0.75px',
          background: 'linear-gradient(90deg, rgba(245,130,38,0.9) 0%, rgba(214,44,39,0.15) 100%)',
          margin: '4px 0',
          borderRadius: 1,
        }} />

        {/* Tagline: Pedidos · Métricas · Controle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'Montserrat, sans-serif', fontSize: 9.5 }}>
          <span style={{ color: '#F58226', fontWeight: 600, letterSpacing: '0.04em' }}>Pedidos</span>
          <span style={{ color: isDark ? 'rgba(255,255,255,0.25)' : '#ddd', fontSize: 10 }}>·</span>
          <span style={{ color: '#E8421F', fontWeight: 600, letterSpacing: '0.04em' }}>Métricas</span>
          <span style={{ color: isDark ? 'rgba(255,255,255,0.25)' : '#ddd', fontSize: 10 }}>·</span>
          <span style={{ color: '#D62C27', fontWeight: 600, letterSpacing: '0.04em' }}>Controle</span>
        </div>

        {/* Subtítulo: PAINEL DE GESTÃO AUTOMOTIVA */}
        <div style={{
          fontSize: 7.5,
          fontWeight: 300,
          letterSpacing: '0.12em',
          color: isDark ? 'rgba(255,255,255,0.28)' : '#bbb',
          textTransform: 'uppercase',
          fontFamily: 'Montserrat, sans-serif',
          marginTop: 3,
        }}>
          Painel de Gestão Automotiva
        </div>
      </div>
    </div>
  )
}

// Versão compacta para o login (ícone grande + nome centralizado)
export function LogoLogin() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      {/* Ícone grande com sombra */}
      <div style={{
        width: 68, height: 68,
        background: 'linear-gradient(135deg, #F58226, #D62C27)',
        borderRadius: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 10px 28px rgba(245,130,38,0.4)',
      }}>
        <svg width="40" height="40" viewBox="0 0 50 50" fill="none">
          <circle cx="25" cy="25" r="7" fill="#fff" opacity="0.95"/>
          <circle cx="39" cy="13" r="4" fill="#fff" opacity="0.7"/>
          <circle cx="42" cy="31" r="4" fill="#fff" opacity="0.7"/>
          <circle cx="13" cy="37" r="4" fill="#fff" opacity="0.7"/>
          <line x1="25" y1="25" x2="39" y2="13" stroke="#fff" strokeWidth="1.8" opacity="0.5"/>
          <line x1="25" y1="25" x2="42" y2="31" stroke="#fff" strokeWidth="1.8" opacity="0.5"/>
          <line x1="25" y1="25" x2="13" y2="37" stroke="#fff" strokeWidth="1.8" opacity="0.5"/>
        </svg>
      </div>

      {/* Nome */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px', lineHeight: 1 }}>
          <span style={{
            background: 'linear-gradient(90deg, #F58226 0%, #E8421F 55%, #D62C27 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>Auto</span>
          <span style={{ fontWeight: 300, color: '#fff', WebkitTextFillColor: '#fff' }}>Hub</span>
        </div>

        {/* linha fina */}
        <div style={{ height: '0.75px', background: 'linear-gradient(90deg, rgba(245,130,38,0.9), rgba(214,44,39,0.15))', margin: '8px auto', width: 160 }} />

        {/* Tagline colorida */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontFamily: 'Montserrat, sans-serif', fontSize: 10.5 }}>
          <span style={{ color: '#F58226', fontWeight: 600, letterSpacing: '0.04em' }}>Pedidos</span>
          <span style={{ color: 'rgba(255,255,255,0.3)' }}>·</span>
          <span style={{ color: '#F06040', fontWeight: 600, letterSpacing: '0.04em' }}>Métricas</span>
          <span style={{ color: 'rgba(255,255,255,0.3)' }}>·</span>
          <span style={{ color: '#D62C27', fontWeight: 600, letterSpacing: '0.04em' }}>Controle</span>
        </div>

        {/* Subtítulo */}
        <div style={{ fontSize: 9, fontWeight: 300, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif', marginTop: 6 }}>
          Painel de Gestão Automotiva
        </div>
      </div>
    </div>
  )
}
