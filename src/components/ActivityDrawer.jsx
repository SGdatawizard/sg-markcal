import { useState } from 'react'
import { ACTIVITY_CATEGORIES, ACTIVITY_TIERS, STATUS_OPTIONS, CATEGORY_ICONS } from '../constants'

export default function ActivityDrawer({ activity, isDraft, channels, owners, calendars = [], onUpdate, onUpdateDraft, onCreate, onDelete, onDuplicate, onClose, onCreateAndLinkCalendar }) {
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
  const [creatingLinked, setCreatingLinked] = useState(false)
  const [newCalName,     setNewCalName]     = useState('')

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

  const linkedCalendar = calendars.find(c => c.id === activity.linked_calendar_id)

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
    onCreate({
      ...activity,
      title: titleVal.trim(), start: startVal, end: endVal, notes: notesVal,
      channel: channelVal, owner: ownerVal, status: statusVal,
      priority: priorityVal, category: categoryVal,
      recurrence: recurrenceVal,
      recurrenceCount: Number(recCountVal),
    })
  }

  function openLinkedCalendar(calId) {
    const url = `${window.location.origin}${window.location.pathname}#calendar=${calId}`
    window.open(url, '_blank')
  }

  async function handleCreateAndLink() {
    const name = newCalName.trim()
    if (!name) return
    await onCreateAndLinkCalendar(activity.id, name)
    setCreatingLinked(false)
    setNewCalName('')
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
            <select value={recurrenceVal} onChange={e => { setRecurrenceVal(e.target.value); onUpdateDraft({ recurrence: e.target.value }) }}>
              <option>None</option><option>Weekly</option><option>Monthly</option><option>Yearly</option>
            </select>
          </div>
          <div style={{ marginBottom:14 }}>
            <label style={{ display:'block', fontSize:11, fontWeight:900, color:'#7b8497', textTransform:'uppercase', marginBottom:6 }}>Occurrences</label>
            <input type="number" min="1" max="52" value={recCountVal} onChange={e => { setRecCountVal(e.target.value); onUpdateDraft({ recurrenceCount: e.target.value }) }} />
          </div>
        </div>
      )}

      {/* Notes */}
      <div style={{ marginBottom:20 }}>
        <label style={{ display:'block', fontSize:11, fontWeight:900, color:'#7b8497', textTransform:'uppercase', marginBottom:6 }}>Notes</label>
        <textarea rows={5} value={notesVal} onChange={set(setNotesVal, 'notes')} style={{ width:'100%', borderRadius:13, border:'1px solid #dfe3ec', padding:'10px 12px', fontFamily:'inherit', resize:'vertical' }} />
      </div>

      {/* Planning calendar — only on existing activities */}
      {!isDraft && (
        <div style={{ marginBottom:20, padding:14, background:'#f7f8fb', borderRadius:14, border:'1px solid #eef1f7' }}>
          <label style={{ display:'block', fontSize:11, fontWeight:900, color:'#7b8497', textTransform:'uppercase', marginBottom:10 }}>Planning Calendar</label>

          {linkedCalendar ? (
            // Already linked
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, fontWeight:700, color:'#172033' }}>
                <span>📅</span>
                <span style={{ flex:1 }}>{linkedCalendar.name}</span>
              </div>
              <button
                onClick={() => openLinkedCalendar(linkedCalendar.id)}
                style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, width:'100%', padding:'9px 12px', background:'#151927', color:'#fff', border:'none', borderRadius:11, fontWeight:800, fontSize:13, cursor:'pointer' }}
              >
                Open planning calendar →
              </button>
              <button
                onClick={() => onUpdate({ linked_calendar_id: null })}
                style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, width:'100%', padding:'7px 12px', background:'none', color:'#be123c', border:'1px solid #fecdd3', borderRadius:11, fontWeight:700, fontSize:12, cursor:'pointer' }}
              >
                Remove link
              </button>
            </div>
          ) : creatingLinked ? (
            // Creating a new calendar to link
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              <input
                placeholder="Calendar name e.g. Black History Month Planning"
                value={newCalName}
                onChange={e => setNewCalName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreateAndLink()}
                autoFocus
                style={{ borderRadius:10, border:'1px solid #dfe3ec', padding:'8px 10px', fontSize:13 }}
              />
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                <button className="btn btn-primary" style={{ fontSize:12 }} onClick={handleCreateAndLink}>Create & link</button>
                <button className="btn btn-secondary" style={{ fontSize:12 }} onClick={() => { setCreatingLinked(false); setNewCalName('') }}>Cancel</button>
              </div>
            </div>
          ) : (
            // No link yet — options to link or create
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {/* Link to existing calendar */}
              {calendars.length > 1 && (
                <select
                  defaultValue=""
                  onChange={e => { if (e.target.value) onUpdate({ linked_calendar_id: e.target.value }) }}
                  style={{ borderRadius:10, border:'1px solid #dfe3ec', padding:'8px 10px', fontSize:13 }}
                >
                  <option value="" disabled>Link to existing calendar…</option>
                  {calendars.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              )}
              <button
                onClick={() => setCreatingLinked(true)}
                style={{ padding:'8px 12px', background:'#fff', border:'1px solid #e4e7ee', borderRadius:11, fontSize:13, fontWeight:700, cursor:'pointer', color:'#7c3aed' }}
              >
                + Create new planning calendar
              </button>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      {isDraft ? (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <button className="btn btn-primary" onClick={handleCreate}>Create activity</button>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        </div>
      ) : (
        <>
          <button className="btn btn-primary" style={{ width:'100%', marginBottom:10 }} onClick={handleSave}>Save changes</button>
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
