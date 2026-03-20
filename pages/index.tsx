// pages/index.tsx — Login + Signup with WhatsApp invite support
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'

export default function AuthPage() {
  const router = useRouter()
  const [tab,      setTab]   = useState<'login'|'signup'>('login')
  const [username, setUser]  = useState('')
  const [email,    setEmail] = useState('')
  const [password, setPass]  = useState('')
  const [loading,  setLoad]  = useState(false)
  const [error,    setErr]   = useState('')
  const [invite,   setInvite]= useState('')
  const [checking, setCheck] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const returnTo = router.query.returnTo as string
        router.push(returnTo || '/home')
      } else { setCheck(false) }
    })
  }, [])

  useEffect(() => {
    if (router.query.invite) {
      setInvite(router.query.invite as string)
      setTab('signup')
    }
  }, [router.query])

  async function joinRoomByCode(code: string, userId: string) {
    const { data: room } = await supabase.from('rooms')
      .select('id').eq('invite_code', code.toUpperCase()).single()
    if (!room) return
    await supabase.from('room_members').upsert({
      room_id: room.id, user_id: userId, role: 'member'
    })
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault(); setLoad(true); setErr('')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setErr(error.message); setLoad(false); return }
    if (invite && data.user) await joinRoomByCode(invite, data.user.id)
    router.push((router.query.returnTo as string) || '/home')
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault(); setLoad(true); setErr('')
    if (!username.trim()) { setErr('Username is required'); setLoad(false); return }
    if (password.length < 6) { setErr('Password must be at least 6 characters'); setLoad(false); return }
    const { data: existing } = await supabase.from('profiles')
      .select('id').eq('username', username.trim()).maybeSingle()
    if (existing) { setErr('Username taken — try another'); setLoad(false); return }
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { username: username.trim() } }
    })
    if (error) { setErr(error.message); setLoad(false); return }
    if (invite && data.user) await joinRoomByCode(invite, data.user.id)
    router.push((router.query.returnTo as string) || '/home')
  }

  if (checking) return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex',
      alignItems:'center', justifyContent:'center', color:'var(--text2)' }}>
      Loading...
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', fontFamily:'var(--font-body)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>

      <div style={{ position:'fixed', top:'-20%', left:'50%', transform:'translateX(-50%)',
        width:700, height:700, borderRadius:'50%',
        background:'radial-gradient(circle,#6C63FF0A 0%,transparent 65%)',
        pointerEvents:'none' }}/>

      <div className="fade-up" style={{ width:'100%', maxWidth:420, position:'relative', zIndex:1 }}>

        <div style={{ textAlign:'center', marginBottom:'2.5rem' }}>
          <div style={{ fontFamily:'var(--font-head)', fontSize:'1.8rem', fontWeight:800,
            background:'linear-gradient(135deg,#6C63FF,#FF6B9D)',
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
            marginBottom:'0.4rem' }}>
            ⚡ SankalpRoom
          </div>
          <div style={{ color:'var(--text2)', fontSize:'0.875rem' }}>
            Where ideas become action
          </div>
        </div>

        {invite && (
          <div style={{ background:'linear-gradient(135deg,#6C63FF15,#FF6B9D10)',
            border:'1px solid #6C63FF30', borderRadius:'var(--radius)',
            padding:'0.875rem 1rem', marginBottom:'1.25rem',
            display:'flex', alignItems:'center', gap:'0.75rem' }}>
            <span style={{ fontSize:'1.3rem' }}>🔗</span>
            <div>
              <div style={{ fontFamily:'var(--font-head)', fontWeight:700,
                color:'var(--text)', fontSize:'0.875rem' }}>
                You were invited to a room!
              </div>
              <div style={{ color:'var(--text2)', fontSize:'0.75rem', marginTop:'0.15rem' }}>
                Sign in or create an account to join.
              </div>
            </div>
          </div>
        )}

        <div style={{ background:'var(--surface)', border:'1px solid var(--border)',
          borderRadius:'var(--radius)', overflow:'hidden' }}>

          <div style={{ display:'flex', borderBottom:'1px solid var(--border)' }}>
            {(['login','signup'] as const).map(t => (
              <button key={t} onClick={() => { setTab(t); setErr('') }} style={{
                flex:1, padding:'0.875rem', background:'none', border:'none',
                borderBottom: tab===t ? '2px solid var(--primary)' : '2px solid transparent',
                color: tab===t ? 'var(--primary)' : 'var(--text2)',
                fontWeight: tab===t ? 600 : 400, cursor:'pointer',
                fontFamily:'var(--font-body)', fontSize:'0.875rem', transition:'all 0.15s' }}>
                {t === 'login' ? 'Sign in' : 'Create account'}
              </button>
            ))}
          </div>

          <div style={{ padding:'1.5rem' }}>
            <form onSubmit={tab==='login' ? handleLogin : handleSignup}>

              {tab==='signup' && (
                <div style={{ marginBottom:'1rem' }}>
                  <label style={LS}>Username</label>
                  <input value={username} onChange={e=>setUser(e.target.value)}
                    placeholder="cooluser123" style={IS} autoComplete="off"/>
                </div>
              )}

              <div style={{ marginBottom:'1rem' }}>
                <label style={LS}>Email</label>
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
                  placeholder="you@example.com" style={IS} required/>
              </div>

              <div style={{ marginBottom:'1.25rem' }}>
                <label style={LS}>Password</label>
                <input type="password" value={password} onChange={e=>setPass(e.target.value)}
                  placeholder="••••••••" style={IS} required/>
              </div>

              {error && (
                <div style={{ background:'#F8717115', border:'1px solid #F8717130',
                  borderRadius:'var(--radius-sm)', padding:'0.75rem',
                  color:'var(--red)', fontSize:'0.82rem', marginBottom:'1rem' }}>
                  ⚠️ {error}
                </div>
              )}

              <button type="submit" disabled={loading} style={{
                width:'100%', padding:'0.875rem',
                background: loading ? 'var(--surface2)'
                  : 'linear-gradient(135deg,var(--primary),var(--primary2))',
                color:'white', border:'none', borderRadius:'var(--radius-sm)',
                fontWeight:700, fontSize:'0.9rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily:'var(--font-body)', transition:'all 0.15s' }}>
                {loading ? 'Please wait…' : tab==='login' ? 'Sign in →' : 'Create account →'}
              </button>
            </form>
          </div>
        </div>

        <div style={{ textAlign:'center', marginTop:'1.5rem',
          color:'var(--text3)', fontSize:'0.78rem' }}>
          {tab==='login' ? <>No account?{' '}
            <button onClick={()=>setTab('signup')} style={{ background:'none', border:'none',
              color:'var(--primary)', cursor:'pointer', fontSize:'0.78rem',
              fontFamily:'var(--font-body)' }}>Create one free</button>
          </> : <>Already have an account?{' '}
            <button onClick={()=>setTab('login')} style={{ background:'none', border:'none',
              color:'var(--primary)', cursor:'pointer', fontSize:'0.78rem',
              fontFamily:'var(--font-body)' }}>Sign in</button>
          </>}
        </div>
      </div>
    </div>
  )
}

const LS: React.CSSProperties = {
  display:'block', color:'var(--text3)', fontSize:'0.68rem', fontWeight:600,
  textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'0.4rem',
}
const IS: React.CSSProperties = {
  width:'100%', padding:'0.75rem 0.875rem', background:'var(--surface2)',
  border:'1px solid var(--border)', borderRadius:'var(--radius-sm)',
  color:'var(--text)', fontFamily:'var(--font-body)', fontSize:'0.875rem',
  outline:'none', display:'block', boxSizing:'border-box',
}
