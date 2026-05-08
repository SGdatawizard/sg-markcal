import { ACTIVITY_CATEGORIES, ACTIVITY_TIERS, CATEGORY_ICONS } from '../constants'

export default function Topbar({ search, onSearchChange, categoryFilter, onCategoryChange, tierFilter, onTierChange, drawerOpen, onToggleDrawer, onUndo, onPrev, onNext, onToday, onAddActivity }) {
  return (
    <header style={{ flexShrink:0, background:'rgba(255,255,255,0.94)', borderBottom:'1px solid var(--line)', padding:'20px 24px', zIndex:5 }}>
      <div style={{ display:'flex', justifyContent:'space-between', gap:18, alignItems:'center', flexWrap:'wrap' }}>
        <div>
          <p style={{ color:'var(--muted)', fontSize:13, margin:0 }}>Drag activities across dates and channels</p>
          <h2>Marketing calendar</h2>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
          <input
            style={{ width:230 }}
            placeholder="Search activities or owners"
            value={search}
            onChange={e => onSearchChange(e.target.value)}
          />
          <select style={{ width:170 }} value={categoryFilter} onChange={e => onCategoryChange(e.target.value)}>
            <option value="all">All categories</option>
            {ACTIVITY_CATEGORIES.map(c => (
              <option key={c} value={c}>{CATEGORY_ICONS[c]} {c}</option>
            ))}
          </select>
          <select style={{ width:120 }} value={tierFilter} onChange={e => onTierChange(e.target.value)}>
            <option value="all">All tiers</option>
            {ACTIVITY_TIERS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <button className="btn btn-secondary" onClick={onUndo}>Undo</button>
          <button className="btn btn-secondary" onClick={onPrev}>← Week</button>
          <button className="btn btn-secondary" onClick={onToday}>Today</button>
          <button className="btn btn-secondary" onClick={onNext}>Week →</button>
          <button className="btn btn-secondary" onClick={onToggleDrawer}>
            {drawerOpen ? 'Hide edit panel' : 'Show edit panel'}
          </button>
          <button className="btn btn-primary" onClick={onAddActivity}>+ Add activity</button>
        </div>
      </div>
    </header>
  )
}
