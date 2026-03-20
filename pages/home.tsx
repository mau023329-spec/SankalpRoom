// pages/home.tsx — Home page with real Supabase Auth + WhatsApp invite
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import Avatar from '../components/Avatar'

type Room = { id:number; name:string; description:string; invite_code:string; created_at:string }

export default function HomePage() {
  const router = useRouter()
  const { profile, loading, logout } = useAuth()
  const [rooms,     setRooms]   = useState<Room[]>([])
  const [roomsLoad, setRLoad]   = useState(true)
  const [mode,      setMode]    = useState<null|'create'|'join'>(null)
  const [roomName,  setRName]   = useState('')
  const [roomDesc,  setRDesc]   = useState('')
  const [joinCode,  setJCode]   = useState('')
  const [error,     setError]   = useState('')
  const [shared,    setShared]  = useState<number|null>(null)

  useEffect(() => {
    if (profile) loadRooms()
  }, [profile])

  async function loadRooms() {
    const { data } = await supabase.from('rooms').select('*')
      .order('created_at', { ascending: false })
    if (data) setRooms(data)
    setRLoad(false)
  }

  async function createRoom(e: React.FormEvent) {
    e.preventDefault(); setError('')
    if (!roomName.trim() || !profile) return
    const code = Math.random().toString(36).substring(2,10).toUpperCase()
    const { data, error } = await supabase.from('rooms').insert({
      name: roomName.trim(), description: roomDesc.trim(),
      invite_code: code, created_by: profile.id
    }).select().single()
    if (error) { setError(error.message); return }
    if (data) {
      await supabase.from('room_members').insert({
        room_id: data.id, user_id: profile.id, role: 'admin'
      })
      router.push(`/room/${data.id}`)
    }
  }

  async function joinRoom(e: React.FormEvent) {
    e.preventDefault(); setError('')
    if (!profile) return
    const { data: room } = await supabase.from('rooms').select('*')
      .eq('invite_code', joinCode.trim().toUpperCase()).single()
    if (!room) { setError('Invalid invite code — double check and try again'); return }
    // Check not blacklisted
    const { data: banned } = await supabase.from('room_blacklist')
      .select('user_id').eq('room_id', room.id).eq('user_id', profile.id).maybeSingle()
    if (banned) { setError('You have been banned from this room'); return }
    await supabase.from('room_members').upsert({
      room_id: room.id, user_id: profile.id, role: 'member'
    })
    router.push(`/room/${room.id}`)
  }

  // WhatsApp invite share
  function shareViaWhatsApp(room: Room) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
    const inviteUrl = `${appUrl}/?invite=${room.invite_code}`
    const msg = `Hey! Join my room "${room.name}" on SankalpRoom 🚀\n\nClick to join: ${inviteUrl}\n\nOr use invite code: *${room.invite_code}*`
    const waUrl = `https://wa.me/?text=${encodeURIComponent(msg)}`
    window.open(waUrl, '_blank')
    setShared(room.id)
    setTimeout(() => setShared(null), 3000)
  }

  function copyInviteLink(room: Room) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
    const inviteUrl = `${appUrl}/?invite=${room.invite_code}`
    navigator.clipboard.writeText(inviteUrl)
    setShared(room.id)
    setTimeout(() => setShared(null), 2000)
  }

  if (loading) return <Loader />

  const first = profile?.username?.split(' ')[0] || 'there'
  const hues  = ['#6C63FF','#FF6B9D','#34D399','#FFB347','#60A5FA','#F472B6']

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', fontFamily:'var(--font-body)' }}>

      {/* Ambient */}
      <div style={{ position:'fixed', top:'-20%', right:'-10%', width:600, height:600,
        borderRadius:'50%', background:'radial-gradient(circle,#6C63FF08 0%,transparent 70%)',
        pointerEvents:'none', zIndex:0 }}/>

      {/* Topbar */}
      <header style={{ position:'sticky', top:0, zIndex:100,
        background:'rgba(7,8,13,0.9)', backdropFilter:'blur(20px)',
        borderBottom:'1px solid var(--border)' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', height:56, padding:'0 1.5rem',
          display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ fontFamily:'var(--font-head)', fontWeight:800, fontSize:'1.1rem',
            background:'linear-gradient(135deg,#6C63FF,#FF6B9D)',
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
            ⚡ SankalpRoom
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
            <button onClick={() => router.push('/dm')} style={NB} title="Messages">💬</button>
            <button onClick={() => router.push('/profile')} style={{ background:'none',
              border:'none', cursor:'pointer', padding:0 }}>
              <Avatar name={profile?.username||'?'}
                color={profile?.avatar_color||'#6C63FF'}
                url={profile?.avatar_url} size={32}/>
            </button>
            <button onClick={logout} style={{ ...NB, fontSize:'0.78rem',
              color:'var(--text3)', padding:'0 0.75rem' }}>
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth:1100, margin:'0 auto', padding:'2.5rem 1.5rem', position:'relative', zIndex:1 }}>

        {/* Greeting */}
        <div className="fade-up" style={{ marginBottom:'2rem' }}>
          <h1 style={{ fontFamily:'var(--font-head)', fontSize:'clamp(1.6rem,4vw,2.2rem)',
            fontWeight:800, color:'var(--text)', letterSpacing:'-0.03em',
            lineHeight:1.1, marginBottom:'0.4rem' }}>
            Hey, {first} 👋
          </h1>
          <p style={{ color:'var(--text2)', fontSize:'0.9rem' }}>
            {rooms.length} room{rooms.length !== 1 ? 's' : ''} · pick one or start something new
          </p>
        </div>

        {/* Actions */}
        <div className="fade-up" style={{ display:'flex', gap:'0.75rem',
          marginBottom:'1.75rem', flexWrap:'wrap', animationDelay:'0.05s' }}>
          <button onClick={() => setMode(mode==='create' ? null : 'create')} style={BtnP}>
            + Create Room
          </button>
          <button onClick={() => setMode(mode==='join' ? null : 'join')} style={BtnG}>
            → Join with Code
          </button>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background:'#F8717115', border:'1px solid #F8717130',
            borderRadius:'var(--radius-sm)', padding:'0.75rem 1rem',
            color:'var(--red)', fontSize:'0.85rem', marginBottom:'1.25rem',
            display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            ⚠️ {error}
            <button onClick={() => setError('')} style={{ background:'none', border:'none',
              color:'var(--red)', cursor:'pointer' }}>✕</button>
          </div>
        )}

        {/* Create form */}
        {mode === 'create' && (
          <div className="fade-in" style={{ ...Card, marginBottom:'1.5rem',
            borderColor:'var(--primary)' }}>
            <div style={{ fontFamily:'var(--font-head)', fontWeight:700,
              color:'var(--text)', marginBottom:'1.25rem' }}>
              Create New Room
            </div>
            <form onSubmit={createRoom}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr',
                gap:'0.75rem', marginBottom:'1rem' }}>
                <div>
                  <label style={LS}>Room Name *</label>
                  <input value={roomName} onChange={e=>setRName(e.target.value)}
                    placeholder="e.g. Product Sprint" style={IS} required/>
                </div>
                <div>
                  <label style={LS}>Description</label>
                  <input value={roomDesc} onChange={e=>setRDesc(e.target.value)}
                    placeholder="What's the goal?" style={IS}/>
                </div>
              </div>
              <div style={{ display:'flex', gap:'0.5rem' }}>
                <button type="submit" style={BtnP}>Create Room</button>
                <button type="button" style={BtnG} onClick={() => setMode(null)}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Join form */}
        {mode === 'join' && (
          <div className="fade-in" style={{ ...Card, marginBottom:'1.5rem',
            borderColor:'var(--accent)' }}>
            <div style={{ fontFamily:'var(--font-head)', fontWeight:700,
              color:'var(--text)', marginBottom:'1.25rem' }}>
              Join a Room
            </div>
            <form onSubmit={joinRoom}>
              <div style={{ display:'flex', gap:'0.75rem', alignItems:'flex-end' }}>
                <div style={{ flex:1 }}>
                  <label style={LS}>Invite Code</label>
                  <input value={joinCode} onChange={e=>setJCode(e.target.value)}
                    placeholder="ABC12345" style={{ ...IS,
                      fontFamily:'var(--font-mono)', letterSpacing:'0.1em',
                      textTransform:'uppercase' }} required/>
                </div>
                <div style={{ display:'flex', gap:'0.5rem' }}>
                  <button type="submit" style={{ ...BtnP,
                    background:'linear-gradient(135deg,var(--accent),#FF8C69)' }}>
                    Join
                  </button>
                  <button type="button" style={BtnG} onClick={() => setMode(null)}>✕</button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Rooms grid */}
        {roomsLoad ? (
          <div style={{ display:'grid',
            gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:'1rem' }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ ...Card, height:160,
                background:`linear-gradient(90deg,var(--surface) 25%,var(--surface2) 50%,var(--surface) 75%)`,
                backgroundSize:'200% 100%', animation:'shimmer 1.5s infinite' }}/>
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <div style={{ textAlign:'center', padding:'5rem 1rem',
            border:'1px dashed var(--border2)', borderRadius:16, color:'var(--text3)' }}>
            <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>⚡</div>
            <div style={{ fontFamily:'var(--font-head)', fontSize:'1.1rem',
              fontWeight:700, color:'var(--text2)', marginBottom:'0.5rem' }}>
              No rooms yet
            </div>
            <div style={{ fontSize:'0.875rem' }}>Create one to get started</div>
          </div>
        ) : (
          <div className="stagger" style={{ display:'grid',
            gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:'1rem' }}>
            {rooms.map((room, i) => {
              const accent = hues[i % hues.length]
              const isShared = shared === room.id
              return (
                <div key={room.id} className="fade-up" style={{ ...Card,
                  position:'relative', overflow:'hidden', transition:'all 0.2s ease' }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLDivElement
                    el.style.transform = 'translateY(-3px)'
                    el.style.borderColor = accent
                    el.style.boxShadow = `0 12px 40px ${accent}18`
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLDivElement
                    el.style.transform = 'translateY(0)'
                    el.style.borderColor = 'var(--border)'
                    el.style.boxShadow = 'none'
                  }}>

                  {/* Accent bar */}
                  <div style={{ position:'absolute', top:0, left:0, right:0, height:3,
                    background:`linear-gradient(90deg,${accent},${accent}88)` }}/>

                  {/* Room info — clickable */}
                  <div onClick={() => router.push(`/room/${room.id}`)}
                    style={{ cursor:'pointer', paddingTop:'0.25rem' }}>
                    <div style={{ display:'flex', justifyContent:'space-between',
                      alignItems:'flex-start', marginBottom:'0.5rem' }}>
                      <div style={{ fontFamily:'var(--font-head)', fontWeight:700,
                        fontSize:'1rem', color:'var(--text)', flex:1, marginRight:'0.75rem' }}>
                        {room.name}
                      </div>
                      <span style={{ background:`${accent}15`, color:accent,
                        border:`1px solid ${accent}25`, borderRadius:6,
                        padding:'2px 8px', fontSize:'0.65rem', fontWeight:700,
                        fontFamily:'var(--font-mono)', letterSpacing:'0.08em',
                        whiteSpace:'nowrap' }}>
                        {room.invite_code}
                      </span>
                    </div>
                    <div style={{ color:'var(--text2)', fontSize:'0.82rem',
                      marginBottom:'1rem', lineHeight:1.5, minHeight:36 }}>
                      {room.description || 'No description'}
                    </div>
                  </div>

                  {/* Actions row */}
                  <div style={{ display:'flex', gap:'0.5rem', alignItems:'center' }}>
                    <button onClick={() => router.push(`/room/${room.id}`)}
                      style={{ ...BtnP, padding:'0.4rem 1rem',
                        fontSize:'0.78rem', flex:1 }}>
                      Open →
                    </button>

                    {/* WhatsApp share */}
                    <button onClick={() => shareViaWhatsApp(room)}
                      title="Share via WhatsApp"
                      style={{ width:34, height:34, border:'none', borderRadius:'var(--radius-sm)',
                        background: isShared ? '#25D36618' : '#25D36615',
                        cursor:'pointer', fontSize:'1rem', display:'flex',
                        alignItems:'center', justifyContent:'center',
                        transition:'all 0.15s',
                        outline: isShared ? '1px solid #25D36640' : 'none' }}>
                      {isShared ? '✓' : '🟢'}
                    </button>

                    {/* Copy link */}
                    <button onClick={() => copyInviteLink(room)}
                      title="Copy invite link"
                      style={{ width:34, height:34, border:'1px solid var(--border)',
                        borderRadius:'var(--radius-sm)', background:'var(--surface2)',
                        cursor:'pointer', fontSize:'0.8rem', display:'flex',
                        alignItems:'center', justifyContent:'center',
                        color:'var(--text2)' }}>
                      🔗
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

function Loader() {
  return <div style={{ height:'100vh', background:'var(--bg)', display:'flex',
    alignItems:'center', justifyContent:'center', color:'var(--text2)' }}>Loading…</div>
}

const Card: React.CSSProperties = {
  background:'var(--surface)', border:'1px solid var(--border)',
  borderRadius:'var(--radius)', padding:'1.25rem',
}
const LS: React.CSSProperties = {
  display:'block', color:'var(--text3)', fontSize:'0.68rem', fontWeight:600,
  textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'0.4rem',
}
const IS: React.CSSProperties = {
  width:'100%', padding:'0.7rem 0.875rem', background:'var(--surface2)',
  border:'1px solid var(--border)', borderRadius:'var(--radius-sm)',
  color:'var(--text)', fontSize:'0.875rem', outline:'none',
  fontFamily:'var(--font-body)', display:'block', boxSizing:'border-box',
}
const BtnP: React.CSSProperties = {
  padding:'0.6rem 1.25rem',
  background:'linear-gradient(135deg,var(--primary),var(--primary2))',
  color:'white', border:'none', borderRadius:'var(--radius-sm)',
  fontWeight:600, cursor:'pointer', fontSize:'0.875rem', fontFamily:'var(--font-body)',
}
const BtnG: React.CSSProperties = {
  padding:'0.6rem 1.25rem', background:'var(--surface2)', color:'var(--text2)',
  border:'1px solid var(--border)', borderRadius:'var(--radius-sm)',
  fontWeight:500, cursor:'pointer', fontSize:'0.875rem', fontFamily:'var(--font-body)',
}
const NB: React.CSSProperties = {
  background:'var(--surface2)', border:'1px solid var(--border)',
  borderRadius:'var(--radius-sm)', height:34, padding:'0 0.5rem',
  cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
  fontSize:'1rem', color:'var(--text2)',
}
