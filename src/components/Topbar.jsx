import { useState } from 'react'
import { ACTIVITY_CATEGORIES, ACTIVITY_TIERS, CATEGORY_ICONS } from '../constants'

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
          <select style={{ width:170 }} value={categoryFilter} onChange={e => onCategoryChange(e.target.value)}>
            <option value="all">All categories</option>
            {ACTIVITY_CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_ICONS[c]} {c}</option>)}
          </select>
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
        {/* Row 1: menu + title + add */}
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <button className="btn-mini" onClick={onOpenSidebar} style={{ fontSize:16, padding:'8px 10px' }}>☰</button>
          <div style={{ flex:1 }}>
            <h2 style={{ margin:0, fontSize:20 }}>Marketing calendar</h2>
          </div>
          <button className="btn btn-secondary" onClick={onToday} style={{ padding:'8px 12px', fontSize:13 }}>Today</button>
          <button className="btn btn-primary" onClick={onAddActivity} style={{ padding:'8px 12px', fontSize:13 }}>+ Add</button>
        </div>

        {/* Row 2: nav + search + filters toggle */}
        <div style={{ display:'flex', gap:8, marginTop:10, alignItems:'center' }}>
          <button className="btn btn-secondary" onClick={onPrev} style={{ padding:'8px 10px', fontSize:13 }}>←</button>
          <button className="btn btn-secondary" onClick={onNext} style={{ padding:'8px 10px', fontSize:13 }}>→</button>
          <input
            style={{ flex:1, minWidth:0 }}
            placeholder="Search…"
            value={search}
            onChange={e => onSearchChange(e.target.value)}
          />
          <button className="btn btn-secondary" onClick={() => setFiltersOpen(v => !v)} style={{ padding:'8px 10px', fontSize:13, whiteSpace:'nowrap' }}>
            {filtersOpen ? 'Less ▲' : 'Filter ▼'}
          </button>
        </div>

        {/* Row 3: filters (collapsible) */}
        {filtersOpen && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:8 }}>
            <select value={categoryFilter} onChange={e => onCategoryChange(e.target.value)}>
              <option value="all">All categories</option>
              {ACTIVITY_CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_ICONS[c]} {c}</option>)}
            </select>
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
