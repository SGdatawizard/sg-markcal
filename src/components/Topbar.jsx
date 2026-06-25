import { useState, useRef, useEffect } from 'react'
import { ACTIVITY_CATEGORIES, ACTIVITY_TIERS, CATEGORY_ICONS } from '../constants'

function CategoryDropdown({ selected, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function toggle(cat) {
    if (selected.includes(cat)) onChange(selected.filter(c => c !== cat))
    else onChange([...selected, cat])
  }

  const label = selected.length === 0
    ? 'All categories'
    : selected.length === 1
    ? `${CATEGORY_ICONS[selected[0]]} ${selected[0]}`
    : `${selected.length} categories`

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{ padding:'7px 12px', border:'1px solid var(--line)', borderRadius:8, background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', gap:6, fontSize:13, color:'var(--ink)', whiteSpace:'nowrap', fontFamily:'inherit' }}
      >
        <span>{label}</span>
        <span style={{ color:'var(--muted)', fontSize:10 }}>▾</span>
      </button>
      {open && (
        <div style={{ position:'absolute', top:'calc(100% + 6px)', left:0, width:210, background:'#fff', border:'1px solid var(--line)', borderRadius:10, boxShadow:'0 8px 24px rgba(0,0,0,0.08)', zIndex:300, padding:6 }}>
          <button
            onClick={() => { onChange([]); setOpen(false) }}
            style={{ display:'flex', alignItems:'center', gap:8, width:'100%', padding:'7px 10px', border:'none', background: selected.length === 0 ? 'var(--accent-bg)' : '#fff', borderRadius:7, cursor:'pointer', fontSize:13, color: selected.length === 0 ? 'var(--accent-txt)' : 'var(--ink)', fontWeight: selected.length === 0 ? 700 : 400, textAlign:'left' }}
          >
            All categories
            {selected.length === 0 && <span style={{ marginLeft:'auto', fontSize:12 }}>✓</span>}
          </button>
          <div style={{ height:1, background:'var(--line)', margin:'4px 0' }} />
          {ACTIVITY_CATEGORIES.map(cat => (
            <label key={cat} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 10px', borderRadius:7, cursor:'pointer', fontSize:13, background: selected.includes(cat) ? 'var(--accent-bg)' : 'transparent', color: selected.includes(cat) ? 'var(--accent-txt)' : 'var(--ink)' }}>
              <input type="checkbox" checked={selected.includes(cat)} onChange={() => toggle(cat)} style={{ accentColor:'var(--accent)', width:13, height:13, flexShrink:0 }} />
              {CATEGORY_ICONS[cat]} {cat}
            </label>
          ))}
          {selected.length > 0 && (
            <>
              <div style={{ height:1, background:'var(--line)', margin:'4px 0' }} />
              <button onClick={() => { onChange([]); setOpen(false) }} style={{ width:'100%', padding:'6px 10px', border:'none', background:'none', cursor:'pointer', fontSize:12, color:'var(--danger)', fontWeight:600, textAlign:'left', borderRadius:7 }}>
                Clear filter
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function ChannelDropdown({ channels, selected, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function toggle(id) {
    if (selected.includes(id)) onChange(selected.filter(c => c !== id))
    else onChange([...selected, id])
  }

  const label = selected.length === 0
    ? 'All channels'
    : selected.length === 1
    ? channels.find(c => c.id === selected[0])?.name || 'Channel'
    : `${selected.length} channels`

  return (
    <div ref={ref} style={{ position:'relative' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{ padding:'7px 12px', border:'1px solid var(--line)', borderRadius:8, background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', gap:6, fontSize:13, color:'var(--ink)', whiteSpace:'nowrap', fontFamily:'inherit' }}
      >
        <span>{label}</span>
        <span style={{ color:'var(--muted)', fontSize:10 }}>▾</span>
      </button>
      {open && (
        <div style={{ position:'absolute', top:'calc(100% + 6px)', left:0, width:190, background:'#fff', border:'1px solid var(--line)', borderRadius:10, boxShadow:'0 8px 24px rgba(0,0,0,0.08)', zIndex:300, padding:6 }}>
          <button
            onClick={() => { onChange([]); setOpen(false) }}
            style={{ display:'flex', alignItems:'center', gap:8, width:'100%', padding:'7px 10px', border:'none', background: selected.length === 0 ? 'var(--accent-bg)' : '#fff', borderRadius:7, cursor:'pointer', fontSize:13, color: selected.length === 0 ? 'var(--accent-txt)' : 'var(--ink)', fontWeight: selected.length === 0 ? 700 : 400, textAlign:'left' }}
          >
            All channels
            {selected.length === 0 && <span style={{ marginLeft:'auto', fontSize:12 }}>✓</span>}
          </button>
          <div style={{ height:1, background:'var(--line)', margin:'4px 0' }} />
          {channels.map(ch => (
            <label key={ch.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 10px', borderRadius:7, cursor:'pointer', fontSize:13, background: selected.includes(ch.id) ? 'var(--accent-bg)' : 'transparent', color: selected.includes(ch.id) ? 'var(--accent-txt)' : 'var(--ink)' }}>
              <input type="checkbox" checked={selected.includes(ch.id)} onChange={() => toggle(ch.id)} style={{ accentColor:'var(--accent)', width:13, height:13, flexShrink:0 }} />
              <span style={{ width:8, height:8, borderRadius:'50%', background:ch.color, flexShrink:0, display:'inline-block' }} />
              {ch.name}
            </label>
          ))}
          {selected.length > 0 && (
            <>
              <div style={{ height:1, background:'var(--line)', margin:'4px 0' }} />
              <button onClick={() => { onChange([]); setOpen(false) }} style={{ width:'100%', padding:'6px 10px', border:'none', background:'none', cursor:'pointer', fontSize:12, color:'var(--danger)', fontWeight:600, textAlign:'left', borderRadius:7 }}>
                Clear filter
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default function Topbar({ channels = [], search, onSearchChange, channelFilter, onChannelChange, categoryFilter, onCategoryChange, tierFilter, onTierChange, drawerOpen, onToggleDrawer, onUndo, onPrev, onNext, onToday, onAddActivity, onOpenSidebar, calendarName }) {
  const [filtersOpen, setFiltersOpen] = useState(false)

  const navBtn = {
    padding: '7px 12px',
    border: '1px solid var(--line)',
    borderRadius: 8,
    background: '#fff',
    fontSize: 13,
    color: 'var(--ink)',
    fontWeight: 500,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
  }

  return (
    <header style={{ flexShrink:0, background:'#fff', borderBottom:'1px solid var(--line)', height:52, display:'flex', alignItems:'center', padding:'0 16px', gap:10, zIndex:150, position:'relative' }}>

      {/* ── Desktop layout ── */}
      <div className="topbar-desktop" style={{ flex:1, display:'flex', alignItems:'center', gap:8 }}>
        {/* Nav buttons */}
        <button style={navBtn} onClick={onPrev}>← Week</button>
        <button style={{ ...navBtn, background:'var(--accent)', color:'#fff', border:'none', fontWeight:600 }} onClick={onToday}>Today</button>
        <button style={navBtn} onClick={onNext}>Week →</button>

        {/* Calendar name — centred */}
        <span style={{ flex:1, textAlign:'center', fontSize:13, fontWeight:600, color:'var(--muted)' }}>
          {calendarName || 'Marketing Calendar'}
        </span>

        {/* Right side tools */}
        <ChannelDropdown channels={channels} selected={channelFilter} onChange={onChannelChange} />
        <CategoryDropdown selected={categoryFilter} onChange={onCategoryChange} />
        <select value={tierFilter} onChange={e => onTierChange(e.target.value)} style={{ width:110, padding:'7px 10px', borderRadius:8, border:'1px solid var(--line)', fontSize:13, background:'#fff', color:'var(--ink)' }}>
          <option value="all">All tiers</option>
          {ACTIVITY_TIERS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <input style={{ width:200, padding:'7px 10px', borderRadius:8, border:'1px solid var(--line)', fontSize:13 }} placeholder="Search…" value={search} onChange={e => onSearchChange(e.target.value)} />
        <button style={navBtn} onClick={onUndo} title="Undo">↩ Undo</button>
        <button style={navBtn} onClick={onToggleDrawer}>{drawerOpen ? 'Hide panel' : 'Show panel'}</button>
        <button style={{ ...navBtn, background:'var(--accent)', color:'#fff', border:'none', fontWeight:600 }} onClick={onAddActivity}>+ Add activity</button>
      </div>

      {/* ── Mobile layout ── */}
      <div className="topbar-mobile" style={{ flex:1, display:'flex', flexDirection:'column', gap:8 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <button className="btn-mini" onClick={onOpenSidebar} style={{ fontSize:16 }}>☰</button>
          <span style={{ flex:1, fontWeight:700, fontSize:16 }}>{calendarName || 'Marketing Calendar'}</span>
          <button style={{ ...navBtn, background:'var(--accent)', color:'#fff', border:'none' }} onClick={onToday}>Today</button>
          <button style={{ ...navBtn, background:'var(--accent)', color:'#fff', border:'none' }} onClick={onAddActivity}>+ Add</button>
        </div>
        <div style={{ display:'flex', gap:6, alignItems:'center' }}>
          <button style={navBtn} onClick={onPrev}>←</button>
          <button style={navBtn} onClick={onNext}>→</button>
          <input style={{ flex:1, minWidth:0, padding:'7px 10px', borderRadius:8, border:'1px solid var(--line)', fontSize:13 }} placeholder="Search…" value={search} onChange={e => onSearchChange(e.target.value)} />
          <button style={navBtn} onClick={() => setFiltersOpen(v => !v)}>{filtersOpen ? '▲' : 'Filter ▼'}</button>
        </div>
        {filtersOpen && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            <CategoryDropdown selected={categoryFilter} onChange={onCategoryChange} />
            <select value={tierFilter} onChange={e => onTierChange(e.target.value)} style={{ padding:'7px 10px', borderRadius:8, border:'1px solid var(--line)', fontSize:13 }}>
              <option value="all">All tiers</option>
              {ACTIVITY_TIERS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <button className="btn btn-secondary" onClick={onUndo}>Undo</button>
            <button className="btn btn-secondary" onClick={onToggleDrawer}>{drawerOpen ? 'Hide panel' : 'Show panel'}</button>
          </div>
        )}
      </div>
    </header>
  )
}
