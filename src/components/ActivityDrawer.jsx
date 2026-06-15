import { useState } from 'react'
import { ACTIVITY_CATEGORIES, ACTIVITY_TIERS, STATUS_OPTIONS, CATEGORY_ICONS } from '../constants'

export default function ActivityDrawer({ activity, isDraft, channels, owners, onUpdate, onUpdateDraft, onCreate, onDelete, onDuplicate, onClose }) {
  const [titleVal,       setTitleVal]       = useState(activity?.title          || '')
  const [startVal,       setStartVal]       = useState(activity?.start          || '')
  const [endVal,         setEndVal]         = useState(activity?.end            || '')
  const [notesVal,       setNotesVal]       = useState(activity?.notes          || '')
  const [channelVal,     setChannelVal]     = useState(activity?.channel        || '')
  const [ownerVal,       setOwnerVal]       = useState(activity?.owner          || '')
  const [statusVal,      setStatusVal]      = useState(activity?.status         || 'Planned')
  const [priorityVal,    setPriorityVal]    = useState(activity?.priority       || 'Tier 1')
  const [categoryVal,    setCategoryVal]    = useState(activity?.category       || 'Uncategorised')
  const [recurrenceVal,  setRecurrenceVal]  = useState(activity?.recurrence     || 'None')
  const [recCountVal,    setRecCountVal]    = useState(activity?.recurrenceCount || 1)

  // Sync all local state when selected activity changes
  const actId = activity?.id
  const [lastId, setLastId] = useState(actId)
  if (actId !== lastId) {
    setTitleVal(activity?.title          || '')
    setStartVal(activity?.start          || '')
    setEndVal(activity?.end              || '')
    setNotesVal(activity?.notes          || '')
    setChannelVal(activity?.channel      || '')
    setOwnerVal(activity?.owner          || '')
    setStatusVal(activity?.status        || 'Planned')
    setPriorityVal(activity?.priority    || 'Tier 1')
    setCategoryVal(activity?.category    || 'Uncategorised')
    setRecurrenceVal(activity?.recurrence     || 'None')
    setRecCountVal(activity?.recurrenceCount  || 1)
    setLastId(actId)
  }

  if (!activity) return null

  function handleSave() {
    if (!titleVal.trim()) { alert('Please add an activity title.'); return }
    if (endVal < startVal) { alert('End date cannot be before start date.'); return }
    onUpdate({
      title: titleVal.trim(), start: startVal, end: endVal, notes: notesVal,
      channel: channelVal, owner: ownerVal, status: statusVal,
      priority: priorityVal, category: categoryVal,
    })
  }

  function handleCreate() {
    if (!titleVal.trim()) { alert('Please add an activity title.'); return }
    if (endVal < startVal) { alert('End date cannot be before start date.'); return }
    // Pass recurrence from local state — this is what was broken before
    onCreate({
      ...activity,
      title: titleVal.trim(), start: startVal, end: endVal, notes: notesVal,
      channel: channelVal, owner: ownerVal, status: statusVal,
      priority: priorityVal, category: categoryVal,
      recurrence: recurrenceVal,
      recurrenceCount: Number(recCountVal),
    })
  }

  const set = (setter, field) => e => {
    setter(e.target.value)
    if (isDraft) onUpdateDraft({ [field]: e.target.value })
  }

  return (
    <aside className="activity-drawer" style={{ width:390, flexShrink:0, background:'#fff', borderLeft:'1px solid var(--line)', padding:24, overflowY:'auto' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, gap:12 }}>
        <h3>{isDraft ? 'New activity' : 'Edit activity'}</h3>
        <button className="btn-mini" onClick={onClose}>✕</button>
      </div>

      {/* Title */}
      <div style={{ marginBottom:14 }}>
        <label style={{ display:'block', fontSize:11, fontWeight:900, color:'#7b8497', textTransform:'uppercase', marginBottom:6 }}>Title</label>
        <input value={titleVal} onChange={set(setTitleVal, 'title')} />
      </div>

      {/* Channel + Owner */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
        <div style={{ marginBottom:14 }}>
          <label style={{ display:'block', fontSize:11, fontWeight:900, color:'#7b8497', textTransform:'uppercase', marginBottom:6 }}>Channel</label>
          <select value={channelVal} onChange={set(setChannelVal, 'channel')}>
            {channels.map(ch => <option key={ch.id} value={ch.id}>{ch.name}</option>)}
          </select>
        </div>
        <div style={{ marginBottom:14 }}>
          <label style={{ display:'block', fontSize:11, fontWeight:900, color:'#7b8497', textTransform:'uppercase', marginBottom:6 }}>Owner</label>
          <select value={ownerVal} onChange={set(setOwnerVal, 'owner')}>
            {owners.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      </div>

      {/* Dates */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
        <div style={{ marginBottom:14 }}>
          <label style={{ display:'block', fontSize:11, fontWeight:900, color:'#7b8497', textTransform:'uppercase', marginBottom:6 }}>Start</label>
          <input type="date" value={startVal} onChange={set(setStartVal, 'start')} />
        </div>
        <div style={{ marginBottom:14 }}>
          <label style={{ display:'block', fontSize:11, fontWeight:900, color:'#7b8497', textTransform:'uppercase', marginBottom:6 }}>End</label>
          <input type="date" value={endVal} onChange={set(setEndVal, 'end')} />
        </div>
      </div>

      {/* Status + Priority */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
        <div style={{ marginBottom:14 }}>
          <label style={{ display:'block', fontSize:11, fontWeight:900, color:'#7b8497', textTransform:'uppercase', marginBottom:6 }}>Status</label>
          <select value={statusVal} onChange={set(setStatusVal, 'status')}>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div style={{ marginBottom:14 }}>
          <label style={{ display:'block', fontSize:11, fontWeight:900, color:'#7b8497', textTransform:'uppercase', marginBottom:6 }}>Priority</label>
          <select value={priorityVal} onChange={set(setPriorityVal, 'priority')}>
            {ACTIVITY_TIERS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {/* Category */}
      <div style={{ marginBottom:14 }}>
        <label style={{ display:'block', fontSize:11, fontWeight:900, color:'#7b8497', textTransform:'uppercase', marginBottom:6 }}>Category</label>
        <select value={categoryVal} onChange={set(setCategoryVal, 'category')}>
          {ACTIVITY_CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_ICONS[c]} {c}</option>)}
        </select>
      </div>

      {/* Recurrence (draft only) */}
      {isDraft && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <div style={{ marginBottom:14 }}>
            <label style={{ display:'block', fontSize:11, fontWeight:900, color:'#7b8497', textTransform:'uppercase', marginBottom:6 }}>Repeat</label>
            <select value={recurrenceVal} onChange={e => {
              setRecurrenceVal(e.target.value)
              onUpdateDraft({ recurrence: e.target.value })
            }}>
              <option>None</option>
              <option>Weekly</option>
              <option>Monthly</option>
              <option>Yearly</option>
            </select>
          </div>
          <div style={{ marginBottom:14 }}>
            <label style={{ display:'block', fontSize:11, fontWeight:900, color:'#7b8497', textTransform:'uppercase', marginBottom:6 }}>Occurrences</label>
            <input
              type="number" min="1" max="52"
              value={recCountVal}
              onChange={e => {
                setRecCountVal(e.target.value)
                onUpdateDraft({ recurrenceCount: e.target.value })
              }}
            />
          </div>
        </div>
      )}

      {/* Notes */}
      <div style={{ marginBottom:20 }}>
        <label style={{ display:'block', fontSize:11, fontWeight:900, color:'#7b8497', textTransform:'uppercase', marginBottom:6 }}>Notes</label>
        <textarea rows={5} value={notesVal} onChange={set(setNotesVal, 'notes')} style={{ width:'100%', borderRadius:13, border:'1px solid #dfe3ec', padding:'10px 12px', fontFamily:'inherit', resize:'vertical' }} />
      </div>

      {/* Actions */}
      {isDraft ? (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <button className="btn btn-primary" onClick={handleCreate}>Create activity</button>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        </div>
      ) : (
        <>
          <button className="btn btn-primary" style={{ width:'100%', marginBottom:10 }} onClick={handleSave}>
            Save changes
          </button>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <button className="btn btn-secondary" onClick={onDuplicate}>Duplicate</button>
            <button className="btn btn-danger" onClick={onDelete}>Delete activity</button>
          </div>
        </>
      )}

      <div className="hint"><strong>Tip:</strong><br />Drag a block to move it. Click a lane to add a new activity.</div>
    </aside>
  )
}
