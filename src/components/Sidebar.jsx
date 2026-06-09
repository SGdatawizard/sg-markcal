import { useState } from 'react'
import { CHANNEL_COLOURS } from '../constants'

export default function Sidebar({
  channels, owners, campaigns, channelFilter, onFilterChange,
  onAddChannel, onRenameChannel, onColorChange, onDeleteChannel, onMoveChannel,
  onAddOwner, onRenameOwner, onDeleteOwner,
  isOpen, onClose, onNavigate,
  calendars, activeCalendarId, onSwitchCalendar, onCreateCalendar, onDeleteCalendar,
}) {
  const [newChannelName,   setNewChannelName]   = useState('')
  const [addChannelOpen,   setAddChannelOpen]   = useState(false)
  const [editingChannelId, setEditingChannelId] = useState(null)
  const [editChannelVal,   setEditChannelVal]   = useState('')
  const [openPaletteId,    setOpenPaletteId]    = useState(null)
  const [newOwnerName,     setNewOwnerName]     = useState('')
  const [editingOwnerIdx,  setEditingOwnerIdx]  = useState(null)
  const [editOwnerVal,     setEditOwnerVal]     = useState('')
  const [navOpen,          setNavOpen]          = useState(false)
  const [calOpen,          setCalOpen]          = useState(false)

  // New calendar form state
  const [creatingCal,     setCreatingCal]     = useState(false)
  const [newCalName,      setNewCalName]      = useState('')
  const [selectedChIds,   setSelectedChIds]   = useState([])

  function handleAddChannel() {
    const name = newChannelName.trim()
    if (!name) return
    onAddChannel(name)
    setNewChannelName('')
    setAddChannelOpen(false)
  }

  function handleAddOwner() {
    const name = newOwnerName.trim()
    if (!name) return
    onAddOwner(name)
    setNewOwnerName('')
  }

  function toggleChSelection(id) {
    setSelectedChIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  function handleCreateCalendar() {
    const name = newCalName.trim()
    if (!name) return
    onCreateCalendar(name, selectedChIds, channels)
    setCreatingCal(false)
    setNewCalName('')
    setSelectedChIds([])
    setCalOpen(false)
  }

  const activeCalendar = calendars.find(c => c.id === activeCalendarId)

  const content = (
    <div style={{ padding:22, overflowY:'auto', height:'100%' }}>

      {/* ── Calendar switcher ─────────────────────────────────────────────── */}
      <div style={{ marginBottom:16, position:'relative' }}>
        <div style={{ fontSize:11, fontWeight:900, color:'#8c93a3', textTransform:'uppercase', marginBottom:8, letterSpacing:'0.06em' }}>Calendar</div>
        <button
          onClick={() => setCalOpen(v => !v)}
          style={{ display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%', padding:'10px 14px', background:'#f7f8fb', border:'1px solid #e4e7ee', borderRadius:13, cursor:'pointer', fontWeight:800, fontSize:14, color:'#172033' }}
        >
          <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            📅 {activeCalendar?.name || 'Select calendar'}
          </span>
          <span style={{ flexShrink:0, marginLeft:8, color:'#8c93a3' }}>▾</span>
        </button>

        {calOpen && (
          <>
            <div onClick={() => { setCalOpen(false); setCreatingCal(false) }} style={{ position:'fixed', inset:0, zIndex:98 }} />
            <div style={{ position:'absolute', top:'100%', left:0, right:0, marginTop:6, background:'#fff', border:'1px solid #e4e7ee', borderRadius:14, boxShadow:'0 8px 32px rgba(0,0,0,0.12)', zIndex:99, overflow:'hidden' }}>
              {/* Calendar list */}
              {calendars.map(cal => (
                <div key={cal.id} style={{ display:'flex', alignItems:'center' }}>
                  <button
                    onClick={() => { onSwitchCalendar(cal.id); setCalOpen(false) }}
                    style={{ display:'flex', alignItems:'center', gap:10, flex:1, padding:'11px 14px', border:'none', background: cal.id === activeCalendarId ? '#f0f2f7' : '#fff', cursor:'pointer', fontSize:14, fontWeight: cal.id === activeCalendarId ? 800 : 600, color:'#172033', textAlign:'left' }}
                  >
                    <span>📅</span>
                    <span style={{ flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{cal.name}</span>
                    {cal.id === activeCalendarId && <span style={{ color:'#7c3aed', fontSize:12 }}>✓</span>}
                  </button>
                  {calendars.length > 1 && (
                    <button
                      onClick={e => { e.stopPropagation(); onDeleteCalendar(cal.id) }}
                      title="Delete calendar"
                      style={{ border:'none', background:'none', cursor:'pointer', padding:'0 12px', color:'#be123c', fontSize:15, opacity:0.5, flexShrink:0 }}
                      onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                      onMouseLeave={e => e.currentTarget.style.opacity = '0.5'}
                    >🗑</button>
                  )}
                </div>
              ))}

              {/* Divider */}
              <div style={{ height:1, background:'#e4e7ee', margin:'4px 0' }} />

              {/* Create new calendar */}
              {!creatingCal ? (
                <button
                  onClick={() => setCreatingCal(true)}
                  style={{ display:'flex', alignItems:'center', gap:10, width:'100%', padding:'11px 14px', border:'none', background:'#fff', cursor:'pointer', fontSize:14, fontWeight:700, color:'#7c3aed', textAlign:'left' }}
                >
                  + Create new calendar
                </button>
              ) : (
                <div style={{ padding:14 }} onClick={e => e.stopPropagation()}>
                  <div style={{ fontSize:12, fontWeight:900, color:'#8c93a3', textTransform:'uppercase', marginBottom:8 }}>New calendar</div>
                  <input
                    placeholder="Calendar name"
                    value={newCalName}
                    onChange={e => setNewCalName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleCreateCalendar()}
                    style={{ width:'100%', padding:'8px 10px', borderRadius:10, border:'1px solid #dfe3ec', fontSize:13, marginBottom:10, boxSizing:'border-box' }}
                    autoFocus
                  />
                  {channels.length > 0 && (
                    <>
                      <div style={{ fontSize:11, fontWeight:900, color:'#8c93a3', textTransform:'uppercase', marginBottom:6 }}>Pre-select channels</div>
                      <div style={{ display:'grid', gap:5, marginBottom:10 }}>
                        {channels.map(ch => (
                          <label key={ch.id} style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:13, fontWeight:600 }}>
                            <input
                              type="checkbox"
                              checked={selectedChIds.includes(ch.id)}
                              onChange={() => toggleChSelection(ch.id)}
                              style={{ accentColor: ch.color }}
                            />
                            <span className="dot" style={{ background: ch.color }} />
                            {ch.name}
                          </label>
                        ))}
                      </div>
                    </>
                  )}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                    <button className="btn btn-primary" style={{ fontSize:12 }} onClick={handleCreateCalendar}>Create</button>
                    <button className="btn btn-secondary" style={{ fontSize:12 }} onClick={() => { setCreatingCal(false); setNewCalName(''); setSelectedChIds([]) }}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Divider between calendar switcher and nav */}
      <div style={{ height:1, background:'#e4e7ee', marginBottom:16 }} />

      {/* ── Logo / Nav dropdown ───────────────────────────────────────────── */}
      <div style={{ marginBottom:24, position:'relative' }}>
        <button
          onClick={() => setNavOpen(v => !v)}
          style={{ display:'flex', alignItems:'center', gap:12, width:'100%', border:'none', background:'none', cursor:'pointer', padding:0, textAlign:'left' }}
        >
          <div style={{ width:42, height:42, borderRadius:14, background:'var(--dark)', color:'#fff', display:'grid', placeItems:'center', fontWeight:900, fontSize:18, flexShrink:0 }}>M</div>
          <div style={{ flex:1 }}>
            <p style={{ color:'var(--muted)', fontSize:13, margin:0 }}>Marketing planner</p>
            <h1 style={{ margin:0, fontSize:16 }}>Campaign Flow ▾</h1>
          </div>
          {onClose && (
            <span onClick={e => { e.stopPropagation(); onClose() }} className="btn-mini" style={{ marginLeft:'auto', flexShrink:0, cursor:'pointer' }}>✕</span>
          )}
        </button>

        {navOpen && (
          <>
            <div onClick={() => setNavOpen(false)} style={{ position:'fixed', inset:0, zIndex:98 }} />
            <div style={{ position:'absolute', top:'100%', left:0, right:0, marginTop:6, background:'#fff', border:'1px solid #e4e7ee', borderRadius:14, boxShadow:'0 8px 24px rgba(0,0,0,0.1)', zIndex:99, overflow:'hidden' }}>
              <button onClick={() => setNavOpen(false)} style={{ display:'flex', alignItems:'center', gap:10, width:'100%', padding:'12px 14px', border:'none', background:'#f0f2f7', cursor:'pointer', fontSize:14, fontWeight:800 }}>
                📅 Marketing Planner
              </button>
              <button onClick={() => { setNavOpen(false); onNavigate('dashboard') }} style={{ display:'flex', alignItems:'center', gap:10, width:'100%', padding:'12px 14px', border:'none', background:'#fff', cursor:'pointer', fontSize:14, fontWeight:700, color:'#60697d' }}>
                📊 Marketing Data
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── Channels ─────────────────────────────────────────────────────── */}
      <div style={{ fontSize:12, fontWeight:900, color:'#8c93a3', textTransform:'uppercase', margin:'20px 0 10px' }}>Your channels</div>
      <button className="btn btn-secondary" style={{ width:'100%', marginBottom:10 }} onClick={() => setAddChannelOpen(v => !v)}>
        {addChannelOpen ? 'Cancel' : '+ Add channel'}
      </button>
      {addChannelOpen && (
        <div style={{ display:'grid', gap:8, marginBottom:10 }}>
          <input placeholder="e.g. SEO, PR, Events" value={newChannelName} onChange={e => setNewChannelName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddChannel()} />
          <button className="btn btn-primary" onClick={handleAddChannel}>Save channel</button>
        </div>
      )}
      <button className={`btn ${channelFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`} style={{ width:'100%', margin:'6px 0 12px' }} onClick={() => { onFilterChange('all'); onClose?.() }}>
        Show all channels
      </button>
      <div style={{ display:'grid', gap:7 }}>
        {channels.map(ch => (
          <div key={ch.id} style={{ display:'grid', gap:6, padding:8, borderRadius:14, background:'#fafbfe', border:'1px solid #eef1f7' }}>
            {editingChannelId === ch.id ? (
              <>
                <input value={editChannelVal} onChange={e => setEditChannelVal(e.target.value)} />
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                  <button className="btn-mini" onClick={() => { onRenameChannel(ch.id, editChannelVal.trim()); setEditingChannelId(null) }}>Save</button>
                  <button className="btn-mini" onClick={() => setEditingChannelId(null)}>Cancel</button>
                </div>
              </>
            ) : (
              <>
                <button onClick={() => { onFilterChange(ch.id); onClose?.() }}
                  style={{ minWidth:0, border:0, background: channelFilter === ch.id ? 'var(--soft)' : 'transparent', textAlign:'left', padding:10, borderRadius:13, fontWeight:800, display:'flex', alignItems:'center', gap:8, width:'100%', cursor:'pointer' }}>
                  <span className="dot" style={{ background: ch.color }} />
                  <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ch.name}</span>
                </button>
                <div style={{ display:'grid', gridTemplateColumns:'34px 36px 36px 44px 64px', gap:6, alignItems:'center' }}>
                  <div style={{ position:'relative' }}>
                    <span style={{ width:28, height:28, borderRadius:'50%', border:'2px solid #fff', boxShadow:'0 0 0 1px #d8dce6', display:'block', cursor:'pointer', background: ch.color }}
                      onClick={() => setOpenPaletteId(openPaletteId === ch.id ? null : ch.id)} />
                    {openPaletteId === ch.id && (
                      <div style={{ display:'flex', flexWrap:'wrap', gap:6, padding:8, background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, position:'absolute', zIndex:90, marginTop:6, width:160, boxShadow:'0 10px 24px rgba(0,0,0,0.08)' }}>
                        {CHANNEL_COLOURS.map(col => (
                          <span key={col} style={{ width:22, height:22, borderRadius:'50%', border:'2px solid #fff', boxShadow:'0 0 0 1px #d8dce6', cursor:'pointer', background: col }}
                            onClick={() => { onColorChange(ch.id, col); setOpenPaletteId(null) }} />
                        ))}
                      </div>
                    )}
                  </div>
                  <button className="btn-mini" onClick={() => onMoveChannel(ch.id, -1)}>↑</button>
                  <button className="btn-mini" onClick={() => onMoveChannel(ch.id, 1)}>↓</button>
                  <button className="btn-mini" onClick={() => { setEditingChannelId(ch.id); setEditChannelVal(ch.name) }}>Edit</button>
                  <button className="btn-mini" onClick={() => onDeleteChannel(ch.id)}>Remove</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* ── Team ─────────────────────────────────────────────────────────── */}
      <div style={{ marginTop:24, padding:16, background:'#f7f8fb', borderRadius:20 }}>
        <strong>Team members</strong>
        <div style={{ display:'grid', gap:8, marginTop:12 }}>
          <input placeholder="e.g. Sarah" value={newOwnerName} onChange={e => setNewOwnerName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddOwner()} />
          <button className="btn btn-primary" onClick={handleAddOwner}>+ Add team member</button>
        </div>
        <div style={{ display:'grid', gap:7, marginTop:8 }}>
          {owners.map((owner, i) => {
            const count = campaigns.filter(c => c.owner === owner).length
            return (
              <div key={i} style={{ display:'grid', gridTemplateColumns:'minmax(0,1fr) 52px 72px', gap:6, alignItems:'center' }}>
                {editingOwnerIdx === i ? (
                  <div style={{ gridColumn:'1/-1' }}>
                    <input value={editOwnerVal} onChange={e => setEditOwnerVal(e.target.value)} />
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginTop:6 }}>
                      <button className="btn-mini" onClick={() => { onRenameOwner(i, editOwnerVal.trim()); setEditingOwnerIdx(null) }}>Save</button>
                      <button className="btn-mini" onClick={() => setEditingOwnerIdx(null)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <strong>{owner}</strong>
                      <div style={{ marginTop:6, fontSize:12, color:'var(--muted)' }}>{count} activities</div>
                      <div style={{ height:7, background:'#e5e8f0', borderRadius:999, overflow:'hidden', marginTop:5 }}>
                        <div style={{ height:'100%', background:'var(--dark)', borderRadius:999, width:`${Math.min(100, count * 24)}%` }} />
                      </div>
                    </div>
                    <button className="btn-mini" onClick={() => { setEditingOwnerIdx(i); setEditOwnerVal(owner) }}>Edit</button>
                    <button className="btn-mini" onClick={() => onDeleteOwner(i)}>Remove</button>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )

  return (
    <>
      <aside className="sidebar-desktop" style={{ width:300, flexShrink:0, background:'#fff', borderRight:'1px solid var(--line)', overflowY:'auto' }}>
        {content}
      </aside>
      {isOpen && (
        <div style={{ position:'fixed', inset:0, zIndex:500 }}>
          <div onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.4)' }} />
          <aside style={{ position:'absolute', left:0, top:0, bottom:0, width:300, maxWidth:'90vw', background:'#fff', overflowY:'auto', boxShadow:'4px 0 24px rgba(0,0,0,0.15)' }}>
            {content}
          </aside>
        </div>
      )}
    </>
  )
}
