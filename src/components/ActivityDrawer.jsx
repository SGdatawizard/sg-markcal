import { useState } from 'react'
import { ACTIVITY_CATEGORIES, ACTIVITY_TIERS, STATUS_OPTIONS, CATEGORY_ICONS } from '../constants'

export default function ActivityDrawer({ activity, isDraft, channels, owners, onUpdate, onUpdateDraft, onCreate, onDelete, onDuplicate, onClose }) {
  const [titleVal, setTitleVal] = useState(activity?.title || '')
  const [startVal, setStartVal] = useState(activity?.start || '')
  const [endVal,   setEndVal]   = useState(activity?.end   || '')
  const [notesVal, setNotesVal] = useState(activity?.notes || '')

  // Sync local state when selected activity changes
  const actId = activity?.id
  const [lastId, setLastId] = useState(actId)
  if (actId !== lastId) {
    setTitleVal(activity?.title || '')
    setStartVal(activity?.start || '')
    setEndVal(activity?.end     || '')
    setNotesVal(activity?.notes || '')
    setLastId(actId)
  }

  if (!activity) return null

  function saveTitle() {
    const val = titleVal.trim()
    if (!val) return
    if (isDraft) onUpdateDraft({ title: val })
    else onUpdate({ title: val })
  }

  function saveDates() {
    if (endVal < startVal) { alert('End date cannot be before start date.'); return }
    if (isDraft) onUpdateDraft({ start: startVal, end: endVal })
    else onUpdate({ start: startVal, end: endVal })
  }

  function saveNotes() {
    if (isDraft) onUpdateDraft({ notes: notesVal })
    else onUpdate({ notes: notesVal })
  }

  function handleCreate() {
    if (!titleVal.trim()) { alert('Please add an activity title.'); return }
    if (endVal < startVal) { alert('End date cannot be before start date.'); return }
    onCreate({ ...activity, title: titleVal.trim(), start: startVal, end: endVal, notes: notesVal })
  }

  const update = isDraft ? (f, v) => onUpdateDraft({ [f]: v }) : (f, v) => onUpdate({ [f]: v })

  return (
    <aside className="activity-drawer" style={{ width:390, flexShrink:0, background:'#fff', borderLeft:'1px solid var(--line)', padding:24, overflowY:'auto' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, gap:12 }}>
        <h3>{isDraft ? 'New activity' : 'Edit activity'}</h3>
        <button className="btn-mini" onClick={onClose}>✕</button>
      </div>

      {/* Title */}
      <div style={{ marginBottom:14 }}>
        <label style={{ display:'block', fontSize:11, fontWeight:900, color:'#7b8497', textTransform:'uppercase', marginBottom:6 }}>Title</label>
        <input value={titleVal} onChange={e => setTitleVal(e.target.value)} />
        {!isDraft && <button className="btn btn-primary" style={{ width:'100%', marginTop:6 }} onClick={saveTitle}>Save title</button>}
      </div>

      {/* Channel + Owner */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
        <div style={{ marginBottom:14 }}>
          <label style={{ display:'block', fontSize:11, fontWeight:900, color:'#7b8497', textTransform:'uppercase', marginBottom:6 }}>Channel</label>
          <select value={activity.channel} onChange={e => update('channel', e.target.value)}>
            {channels.map(ch => <option key={ch.id} value={ch.id}>{ch.name}</option>)}
          </select>
        </div>
        <div style={{ marginBottom:14 }}>
          <label style={{ display:'block', fontSize:11, fontWeight:900, color:'#7b8497', textTransform:'uppercase', marginBottom:6 }}>Owner</label>
          <select value={activity.owner} onChange={e => update('owner', e.target.value)}>
            {owners.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      </div>

      {/* Dates */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
        <div style={{ marginBottom:14 }}>
          <label style={{ display:'block', fontSize:11, fontWeight:900, color:'#7b8497', textTransform:'uppercase', marginBottom:6 }}>Start</label>
          <input type="date" value={startVal} onChange={e => setStartVal(e.target.value)} />
        </div>
        <div style={{ marginBottom:14 }}>
          <label style={{ display:'block', fontSize:11, fontWeight:900, color:'#7b8497', textTransform:'uppercase', marginBottom:6 }}>End</label>
          <input type="date" value={endVal} onChange={e => setEndVal(e.target.value)} />
        </div>
      </div>
      {!isDraft && <button className="btn btn-primary" style={{ width:'100%', marginBottom:14 }} onClick={saveDates}>Save dates</button>}

      {/* Status + Priority */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
        <div style={{ marginBottom:14 }}>
          <label style={{ display:'block', fontSize:11, fontWeight:900, color:'#7b8497', textTransform:'uppercase', marginBottom:6 }}>Status</label>
          <select value={activity.status} onChange={e => update('status', e.target.value)}>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div style={{ marginBottom:14 }}>
          <label style={{ display:'block', fontSize:11, fontWeight:900, color:'#7b8497', textTransform:'uppercase', marginBottom:6 }}>Priority</label>
          <select value={activity.priority} onChange={e => update('priority', e.target.value)}>
            {ACTIVITY_TIERS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {/* Category */}
      <div style={{ marginBottom:14 }}>
        <label style={{ display:'block', fontSize:11, fontWeight:900, color:'#7b8497', textTransform:'uppercase', marginBottom:6 }}>Category</label>
        <select value={activity.category || 'Uncategorised'} onChange={e => update('category', e.target.value)}>
          {ACTIVITY_CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_ICONS[c]} {c}</option>)}
        </select>
      </div>

      {/* Recurrence (draft only) */}
      {isDraft && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <div style={{ marginBottom:14 }}>
            <label style={{ display:'block', fontSize:11, fontWeight:900, color:'#7b8497', textTransform:'uppercase', marginBottom:6 }}>Repeat</label>
            <select value={activity.recurrence || 'None'} onChange={e => onUpdateDraft({ recurrence: e.target.value })}>
              <option>None</option><option>Weekly</option><option>Monthly</option>
            </select>
          </div>
          <div style={{ marginBottom:14 }}>
            <label style={{ display:'block', fontSize:11, fontWeight:900, color:'#7b8497', textTransform:'uppercase', marginBottom:6 }}>Occurrences</label>
            <input type="number" min="1" max="24" value={activity.recurrenceCount || 1} onChange={e => onUpdateDraft({ recurrenceCount: e.target.value })} />
          </div>
        </div>
      )}

      {/* Notes */}
      <div style={{ marginBottom:14 }}>
        <label style={{ display:'block', fontSize:11, fontWeight:900, color:'#7b8497', textTransform:'uppercase', marginBottom:6 }}>Notes</label>
        <textarea rows={5} value={notesVal} onChange={e => setNotesVal(e.target.value)} style={{ width:'100%', borderRadius:13, border:'1px solid #dfe3ec', padding:'10px 12px', fontFamily:'inherit', resize:'vertical' }} />
        {!isDraft && <button className="btn btn-primary" style={{ width:'100%', marginTop:6 }} onClick={saveNotes}>Save notes</button>}
      </div>

      {/* Actions */}
      {isDraft ? (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <button className="btn btn-primary" onClick={handleCreate}>Create activity</button>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <button className="btn btn-secondary" onClick={onDuplicate}>Duplicate</button>
          <button className="btn btn-danger" onClick={onDelete}>Delete activity</button>
        </div>
      )}

      <div className="hint"><strong>Tip:</strong><br />Drag a block to move it. Click a lane to add a new activity.</div>
    </aside>
  )
}
