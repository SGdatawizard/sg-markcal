import { useState } from 'react'
import { CHANNEL_COLOURS } from '../constants'

// ── Icon rail button ──────────────────────────────────────────────────────────
function RailBtn({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      title={label}
      style={{
        width: 40, height: 40, borderRadius: 10,
        border: 'none',
        background: active ? 'var(--accent-bg)' : 'transparent',
        color: active ? 'var(--accent)' : 'var(--muted)',
        fontSize: 18, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 0.15s, color 0.15s',
      }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'var(--soft)'; e.currentTarget.style.color = 'var(--ink)' } }}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--muted)' } }}
    >
      {icon}
    </button>
  )
}

// ── Panel section label ───────────────────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '16px 14px 6px' }}>
      {children}
    </div>
  )
}

export default function Sidebar({
  channels, owners, campaigns, channelFilter, onFilterChange,
  onAddChannel, onRenameChannel, onColorChange, onDeleteChannel, onMoveChannel,
  onAddOwner, onRenameOwner, onDeleteOwner,
  isOpen, onClose, onNavigate,
  calendars, activeCalendarId, onSwitchCalendar, onCreateCalendar, onDeleteCalendar,
}) {
  const [activePanel, setActivePanel] = useState('channels') // 'channels' | 'team' | null

  // Channel state
  const [newChannelName,   setNewChannelName]   = useState('')
  const [addChannelOpen,   setAddChannelOpen]   = useState(false)
  const [editingChannelId, setEditingChannelId] = useState(null)
  const [editChannelVal,   setEditChannelVal]   = useState('')
  const [openPaletteId,    setOpenPaletteId]    = useState(null)

  // Owner state
  const [newOwnerName,    setNewOwnerName]    = useState('')
  const [editingOwnerIdx, setEditingOwnerIdx] = useState(null)
  const [editOwnerVal,    setEditOwnerVal]    = useState('')

  // Calendar state
  const [calOpen,      setCalOpen]      = useState(false)
  const [creatingCal,  setCreatingCal]  = useState(false)
  const [newCalName,   setNewCalName]   = useState('')
  const [selectedChIds, setSelectedChIds] = useState([])

  function togglePanel(name) {
    setActivePanel(p => p === name ? null : name)
  }

  function handleAddChannel() {
    const name = newChannelName.trim()
    if (!name) return
    onAddChannel(name)
    setNewChannelName(''); setAddChannelOpen(false)
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
    setCreatingCal(false); setNewCalName(''); setSelectedChIds([]); setCalOpen(false)
  }

  const activeCalendar = calendars.find(c => c.id === activeCalendarId)

  // ── Channels panel content ──────────────────────────────────────────────────
  const channelsPanel = (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <div style={{ padding:'14px 14px 10px', borderBottom:'1px solid var(--line)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <span style={{ fontSize:13, fontWeight:700, color:'var(--ink)' }}>Channels</span>
        <button className="btn-mini" onClick={() => setActivePanel(null)}>✕</button>
      </div>
      <div style={{ flex:1, overflowY:'auto', padding:'8px 10px' }}>
        {/* All channels */}
        <button
          onClick={() => { onFilterChange([]); onClose?.() }}
          style={{ display:'flex', alignItems:'center', gap:8, width:'100%', padding:'8px 10px', borderRadius:8, border:'none', background: channelFilter.length === 0 ? 'var(--accent-bg)' : 'transparent', color: channelFilter.length === 0 ? 'var(--accent-txt)' : 'var(--ink)', fontSize:13, fontWeight: channelFilter.length === 0 ? 700 : 500, cursor:'pointer', textAlign:'left', marginBottom:4 }}
        >
          <span style={{ fontSize:14 }}>◈</span> All channels
        </button>

        {channels.map(ch => (
          <div key={ch.id} style={{ marginBottom:4 }}>
            {editingChannelId === ch.id ? (
              <div style={{ padding:'6px 8px', background:'var(--soft)', borderRadius:8 }}>
                <input value={editChannelVal} onChange={e => setEditChannelVal(e.target.value)} style={{ marginBottom:6 }} autoFocus />
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                  <button className="btn btn-primary" style={{ fontSize:12, padding:'5px 8px' }} onClick={() => { onRenameChannel(ch.id, editChannelVal.trim()); setEditingChannelId(null) }}>Save</button>
                  <button className="btn btn-secondary" style={{ fontSize:12, padding:'5px 8px' }} onClick={() => setEditingChannelId(null)}>Cancel</button>
                </div>
              </div>
            ) : (
              <div style={{ borderRadius:8, overflow:'hidden' }}>
                <button
                  onClick={() => { onFilterChange([ch.id]); onClose?.() }}
                  style={{ display:'flex', alignItems:'center', gap:8, width:'100%', padding:'8px 10px', border:'none', background: channelFilter.length === 1 && channelFilter[0] === ch.id ? 'var(--accent-bg)' : 'transparent', color: channelFilter.length === 1 && channelFilter[0] === ch.id ? 'var(--accent-txt)' : 'var(--ink)', fontSize:13, fontWeight: channelFilter.length === 1 && channelFilter[0] === ch.id ? 700 : 500, cursor:'pointer', textAlign:'left' }}
                >
                  <span className="dot" style={{ background: ch.color }} />
                  <span style={{ flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ch.name}</span>
                </button>
                <div style={{ display:'flex', gap:4, padding:'2px 10px 6px', flexWrap:'wrap' }}>
                  {/* Colour swatch */}
                  <div style={{ position:'relative' }}>
                    <button className="btn-mini" style={{ width:22, height:22, padding:0, background:ch.color, border:'2px solid #fff', boxShadow:'0 0 0 1px var(--line)', borderRadius:'50%' }}
                      onClick={() => setOpenPaletteId(openPaletteId === ch.id ? null : ch.id)} />
                    {openPaletteId === ch.id && (
                      <>
                        <div onClick={() => setOpenPaletteId(null)} style={{ position:'fixed', inset:0, zIndex:88 }} />
                        <div style={{ display:'flex', flexWrap:'wrap', gap:5, padding:8, background:'#fff', border:'1px solid var(--line)', borderRadius:10, position:'absolute', zIndex:90, marginTop:4, width:148, boxShadow:'0 8px 20px rgba(0,0,0,0.1)' }}>
                          {CHANNEL_COLOURS.map(col => (
                            <span key={col} style={{ width:20, height:20, borderRadius:'50%', border:'2px solid #fff', boxShadow:'0 0 0 1px var(--line)', cursor:'pointer', background:col, display:'block' }}
                              onClick={() => { onColorChange(ch.id, col); setOpenPaletteId(null) }} />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                  <button className="btn-mini" onClick={() => onMoveChannel(ch.id, -1)} style={{ padding:'2px 7px', fontSize:11 }}>↑</button>
                  <button className="btn-mini" onClick={() => onMoveChannel(ch.id, 1)} style={{ padding:'2px 7px', fontSize:11 }}>↓</button>
                  <button className="btn-mini" onClick={() => { setEditingChannelId(ch.id); setEditChannelVal(ch.name) }} style={{ padding:'2px 7px', fontSize:11 }}>Edit</button>
                  <button className="btn-mini" onClick={() => onDeleteChannel(ch.id)} style={{ padding:'2px 7px', fontSize:11, color:'var(--danger)' }}>✕</button>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Add channel */}
        {addChannelOpen ? (
          <div style={{ padding:'8px', background:'var(--soft)', borderRadius:8, marginTop:6 }}>
            <input placeholder="e.g. Email, TikTok" value={newChannelName} onChange={e => setNewChannelName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddChannel()} autoFocus style={{ marginBottom:6 }} />
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
              <button className="btn btn-primary" style={{ fontSize:12, padding:'6px 8px' }} onClick={handleAddChannel}>Add</button>
              <button className="btn btn-secondary" style={{ fontSize:12, padding:'6px 8px' }} onClick={() => { setAddChannelOpen(false); setNewChannelName('') }}>Cancel</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setAddChannelOpen(true)} style={{ display:'flex', alignItems:'center', gap:6, width:'100%', padding:'8px 10px', border:'1px dashed var(--line)', borderRadius:8, background:'transparent', color:'var(--muted)', fontSize:13, cursor:'pointer', marginTop:6 }}>
            + Add channel
          </button>
        )}
      </div>
    </div>
  )

  // ── Team panel content ──────────────────────────────────────────────────────
  const teamPanel = (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <div style={{ padding:'14px 14px 10px', borderBottom:'1px solid var(--line)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <span style={{ fontSize:13, fontWeight:700, color:'var(--ink)' }}>Team members</span>
        <button className="btn-mini" onClick={() => setActivePanel(null)}>✕</button>
      </div>
      <div style={{ flex:1, overflowY:'auto', padding:'8px 10px' }}>
        {owners.map((owner, i) => {
          const count = campaigns.filter(c => c.owner === owner).length
          return (
            <div key={i} style={{ marginBottom:8, padding:'10px 12px', background:'var(--soft)', borderRadius:8 }}>
              {editingOwnerIdx === i ? (
                <>
                  <input value={editOwnerVal} onChange={e => setEditOwnerVal(e.target.value)} autoFocus style={{ marginBottom:6 }} />
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                    <button className="btn btn-primary" style={{ fontSize:12, padding:'5px 8px' }} onClick={() => { onRenameOwner(i, editOwnerVal.trim()); setEditingOwnerIdx(null) }}>Save</button>
                    <button className="btn btn-secondary" style={{ fontSize:12, padding:'5px 8px' }} onClick={() => setEditingOwnerIdx(null)}>Cancel</button>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
                    <span style={{ fontSize:13, fontWeight:600 }}>{owner}</span>
                    <div style={{ display:'flex', gap:4 }}>
                      <button className="btn-mini" style={{ fontSize:11, padding:'2px 7px' }} onClick={() => { setEditingOwnerIdx(i); setEditOwnerVal(owner) }}>Edit</button>
                      <button className="btn-mini" style={{ fontSize:11, padding:'2px 7px', color:'var(--danger)' }} onClick={() => onDeleteOwner(i)}>✕</button>
                    </div>
                  </div>
                  <div style={{ fontSize:12, color:'var(--muted)', marginBottom:4 }}>{count} activities</div>
                  <div style={{ height:4, background:'var(--line)', borderRadius:99, overflow:'hidden' }}>
                    <div style={{ height:'100%', background:'var(--accent)', borderRadius:99, width:`${Math.min(100, count * 20)}%`, transition:'width 0.3s' }} />
                  </div>
                </>
              )}
            </div>
          )
        })}

        {/* Add owner */}
        <div style={{ padding:'8px', background:'var(--soft)', borderRadius:8, marginTop:6 }}>
          <input placeholder="e.g. Sarah" value={newOwnerName} onChange={e => setNewOwnerName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddOwner()} style={{ marginBottom:6 }} />
          <button className="btn btn-primary" style={{ width:'100%', fontSize:12, padding:'6px 8px' }} onClick={handleAddOwner}>+ Add team member</button>
        </div>
      </div>
    </div>
  )

  // ── Rail + panel wrapper ────────────────────────────────────────────────────
  const railAndPanel = (
    <div style={{ display:'flex', height:'100%' }}>
      {/* Icon rail */}
      <div style={{ width:52, flexShrink:0, background:'#fff', borderRight:'1px solid var(--line)', display:'flex', flexDirection:'column', alignItems:'center', padding:'10px 0', gap:4 }}>
        {/* Calendar switcher at top */}
        <div style={{ position:'relative', marginBottom:8 }}>
          <button
            onClick={() => setCalOpen(v => !v)}
            title={activeCalendar?.name || 'Calendars'}
            style={{ width:40, height:40, borderRadius:10, border:'none', background:'var(--accent)', color:'#fff', fontSize:16, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}
          >
            {(activeCalendar?.name?.[0] || 'C').toUpperCase()}
          </button>

          {calOpen && (
            <>
              <div onClick={() => { setCalOpen(false); setCreatingCal(false) }} style={{ position:'fixed', inset:0, zIndex:198 }} />
              <div style={{ position:'absolute', top:0, left:52, marginLeft:4, background:'#fff', border:'1px solid var(--line)', borderRadius:10, boxShadow:'0 8px 24px rgba(0,0,0,0.1)', zIndex:199, overflow:'hidden', minWidth:200 }}>
                <div style={{ padding:'10px 14px 6px', fontSize:11, fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.06em' }}>Calendars</div>
                {calendars.map(cal => (
                  <div key={cal.id} style={{ display:'flex', alignItems:'center' }}>
                    <button
                      onClick={() => { onSwitchCalendar(cal.id); setCalOpen(false) }}
                      style={{ flex:1, display:'flex', alignItems:'center', gap:8, padding:'9px 14px', border:'none', background: cal.id === activeCalendarId ? 'var(--accent-bg)' : '#fff', color: cal.id === activeCalendarId ? 'var(--accent-txt)' : 'var(--ink)', cursor:'pointer', fontSize:13, fontWeight: cal.id === activeCalendarId ? 700 : 400, textAlign:'left' }}
                    >
                      <span style={{ fontSize:14 }}>📅</span>
                      <span style={{ flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{cal.name}</span>
                      {cal.id === activeCalendarId && <span style={{ fontSize:11 }}>✓</span>}
                    </button>
                    {calendars.length > 1 && (
                      <button onClick={e => { e.stopPropagation(); onDeleteCalendar(cal.id) }} style={{ border:'none', background:'none', padding:'0 10px', color:'var(--danger)', cursor:'pointer', opacity:0.4, fontSize:14 }}
                        onMouseEnter={e => e.currentTarget.style.opacity='1'}
                        onMouseLeave={e => e.currentTarget.style.opacity='0.4'}
                      >🗑</button>
                    )}
                  </div>
                ))}
                <div style={{ height:1, background:'var(--line)', margin:'4px 0' }} />
                {!creatingCal ? (
                  <button onClick={() => setCreatingCal(true)} style={{ display:'flex', alignItems:'center', gap:8, width:'100%', padding:'9px 14px', border:'none', background:'#fff', color:'var(--accent)', fontSize:13, fontWeight:600, cursor:'pointer', textAlign:'left' }}>
                    + Create new calendar
                  </button>
                ) : (
                  <div style={{ padding:12 }} onClick={e => e.stopPropagation()}>
                    <input placeholder="Calendar name" value={newCalName} onChange={e => setNewCalName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreateCalendar()} autoFocus style={{ marginBottom:8 }} />
                    {channels.length > 0 && (
                      <>
                        <div style={{ fontSize:11, fontWeight:700, color:'var(--muted)', textTransform:'uppercase', marginBottom:6 }}>Pre-select channels</div>
                        <div style={{ display:'grid', gap:4, marginBottom:8 }}>
                          {channels.map(ch => (
                            <label key={ch.id} style={{ display:'flex', alignItems:'center', gap:7, fontSize:13, cursor:'pointer' }}>
                              <input type="checkbox" checked={selectedChIds.includes(ch.id)} onChange={() => toggleChSelection(ch.id)} style={{ accentColor:ch.color }} />
                              <span className="dot" style={{ background:ch.color }} /> {ch.name}
                            </label>
                          ))}
                        </div>
                      </>
                    )}
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                      <button className="btn btn-primary" style={{ fontSize:12, padding:'6px' }} onClick={handleCreateCalendar}>Create</button>
                      <button className="btn btn-secondary" style={{ fontSize:12, padding:'6px' }} onClick={() => { setCreatingCal(false); setNewCalName(''); setSelectedChIds([]) }}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div style={{ width:28, height:1, background:'var(--line)', margin:'2px 0 6px' }} />

        <RailBtn icon="⊞" label="Channels" active={activePanel === 'channels'} onClick={() => togglePanel('channels')} />
        <RailBtn icon="👥" label="Team" active={activePanel === 'team'} onClick={() => togglePanel('team')} />

        <div style={{ flex:1 }} />

        {/* Dashboard nav */}
        <RailBtn icon="📊" label="Marketing Data" active={false} onClick={() => onNavigate('dashboard')} />
      </div>

      {/* Slide-out panel */}
      {activePanel && (
        <div className="rail-panel" style={{ width:240, flexShrink:0, background:'#fff', borderRight:'1px solid var(--line)', display:'flex', flexDirection:'column', overflow:'hidden' }}>
          {activePanel === 'channels' && channelsPanel}
          {activePanel === 'team' && teamPanel}
        </div>
      )}
    </div>
  )

  return (
    <>
      {/* Desktop */}
      <aside className="sidebar-desktop" style={{ display:'flex', flexShrink:0, background:'#fff', borderRight:'1px solid var(--line)' }}>
        {railAndPanel}
      </aside>

      {/* Mobile overlay */}
      {isOpen && (
        <div style={{ position:'fixed', inset:0, zIndex:500 }}>
          <div onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.4)' }} />
          <aside style={{ position:'absolute', left:0, top:0, bottom:0, width:292, maxWidth:'90vw', background:'#fff', overflowY:'auto', boxShadow:'4px 0 24px rgba(0,0,0,0.15)' }}>
            {railAndPanel}
          </aside>
        </div>
      )}
    </>
  )
}
