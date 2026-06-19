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
    <div ref={ref} style={{ position:'relative' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{ width:170, padding:'10px 12px', border:'1px solid #dfe3ec', borderRadius:13, background:'#fff', cursor:'pointer', textAlign:'left', fontSize:'inherit', display:'flex', justifyContent:'space-between', alignItems:'center', gap:6, fontFamily:'inherit' }}
      >
        <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>{label}</span>
        <span style={{ color:'#8c93a3', flexShrink:0, fontSize:11 }}>▾</span>
      </button>

      {open && (
        <div style={{ position:'absolute', top:'calc(100% + 4px)', left:0, width:210, background:'#fff', border:'1px solid #e4e7ee', borderRadius:14, boxShadow:'0 8px 24px rgba(0,0,0,0.1)', zIndex:200, padding:8, overflow:'hidden' }}>
          {/* All categories option */}
          <button
            onClick={() => { onChange([]); setOpen(false) }}
            style={{ display:'flex', alignItems:'center', gap:8, width:'100%', padding:'8px 10px', border:'none', background: selected.length === 0 ? '#f0f2f7' : '#fff', borderRadius:10, cursor:'pointer', fontSize:13, fontWeight: selected.length === 0 ? 800 : 600, textAlign:'left' }}
          >
            All categories
            {selected.length === 0 && <span style={{ marginLeft:'auto', color:'#7c3aed', fontSize:12 }}>✓</span>}
          </button>
          <div style={{ height:1, background:'#e4e7ee', margin:'4px 0' }} />
          {ACTIVITY_CATEGORIES.map(cat => (
            <label key={cat} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 10px', borderRadius:10, cursor:'pointer', fontSize:13, fontWeight:600, background: selected.includes(cat) ? '#f5f3ff' : '#fff' }}
              onMouseEnter={e => { if (!selected.includes(cat)) e.currentTarget.style.background = '#f7f8fb' }}
              onMouseLeave={e => { if (!selected.includes(cat)) e.currentTarget.style.background = '#fff' }}
            >
              <input
                type="checkbox"
                checked={selected.includes(cat)}
                onChange={() => toggle(cat)}
                style={{ accentColor:'#7c3aed', width:14, height:14, flexShrink:0 }}
              />
              <span>{CATEGORY_ICONS[cat]} {cat}</span>
            </label>
          ))}
          {selected.length > 0 && (
            <>
              <div style={{ height:1, background:'#e4e7ee', margin:'4px 0' }} />
              <button
                onClick={() => { onChange([]); setOpen(false) }}
                style={{ width:'100%', padding:'6px 10px', border:'none', background:'none', cursor:'pointer', fontSize:12, color:'#be123c', fontWeight:700, textAlign:'left', borderRadius:10 }}
              >
                Clear filter
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default function Topbar({ search, onSearchChange, categoryFilter, onCategoryChange, tierFilter, onTierChange, drawerOpen, onToggleDrawer, onUndo, onPrev, onNext, onToday, onAddActivity, onOpenSidebar }) {
  const [filtersOpen, setFiltersOpen] = useState(false)

  return (
    <header style={{ flexShrink:0, background:'rgba(255,255,255,0.94)', borderBottom:'1px solid var(--line)', padding:'14px 16px', zIndex:5 }}>

      {/* ── Desktop layout ── */}
      <div className="topbar-desktop" style={{ display:'flex', justifyContent:'space-between', gap:18, alignItems:'center', flexWrap:'wrap' }}>
        <div>
          <p style={{ color:'var(--muted)', fontSize:13, margin:0 }}>Drag activities across dates and channels</p>
          <h2 style={{ margin:0 }}>Marketing calendar</h2>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
          <input style={{ width:230 }} placeholder="Search activities or owners" value={search} onChange={e => onSearchChange(e.target.value)} />
          <CategoryDropdown selected={categoryFilter} onChange={onCategoryChange} />
          <select style={{ width:120 }} value={tierFilter} onChange={e => onTierChange(e.target.value)}>
            <option value="all">All tiers</option>
            {ACTIVITY_TIERS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <button className="btn btn-secondary" onClick={onUndo}>Undo</button>
          <button className="btn btn-secondary" onClick={onPrev}>← Week</button>
          <button className="btn btn-secondary" onClick={onToday}>Today</button>
          <button className="btn btn-secondary" onClick={onNext}>Week →</button>
          <button className="btn btn-secondary" onClick={onToggleDrawer}>{drawerOpen ? 'Hide panel' : 'Show panel'}</button>
          <button className="btn btn-primary" onClick={onAddActivity}>+ Add activity</button>
        </div>
      </div>

      {/* ── Mobile layout ── */}
      <div className="topbar-mobile">
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <button className="btn-mini" onClick={onOpenSidebar} style={{ fontSize:16, padding:'8px 10px' }}>☰</button>
          <div style={{ flex:1 }}>
            <h2 style={{ margin:0, fontSize:20 }}>Marketing calendar</h2>
          </div>
          <button className="btn btn-secondary" onClick={onToday} style={{ padding:'8px 12px', fontSize:13 }}>Today</button>
          <button className="btn btn-primary" onClick={onAddActivity} style={{ padding:'8px 12px', fontSize:13 }}>+ Add</button>
        </div>
        <div style={{ display:'flex', gap:8, marginTop:10, alignItems:'center' }}>
          <button className="btn btn-secondary" onClick={onPrev} style={{ padding:'8px 10px', fontSize:13 }}>←</button>
          <button className="btn btn-secondary" onClick={onNext} style={{ padding:'8px 10px', fontSize:13 }}>→</button>
          <input style={{ flex:1, minWidth:0 }} placeholder="Search…" value={search} onChange={e => onSearchChange(e.target.value)} />
          <button className="btn btn-secondary" onClick={() => setFiltersOpen(v => !v)} style={{ padding:'8px 10px', fontSize:13, whiteSpace:'nowrap' }}>
            {filtersOpen ? 'Less ▲' : 'Filter ▼'}
          </button>
        </div>
        {filtersOpen && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:8 }}>
            <CategoryDropdown selected={categoryFilter} onChange={onCategoryChange} />
            <select value={tierFilter} onChange={e => onTierChange(e.target.value)}>
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
