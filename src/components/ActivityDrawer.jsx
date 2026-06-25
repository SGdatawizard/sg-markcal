import { useState } from 'react'
import { ACTIVITY_CATEGORIES, ACTIVITY_TIERS, STATUS_OPTIONS, CATEGORY_ICONS } from '../constants'

function Label({ children }) {
  return (
    <div style={{ fontSize:11, fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:5 }}>
      {children}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom:12 }}>
      <Label>{label}</Label>
      {children}
    </div>
  )
}

export default function ActivityDrawer({ activity, isDraft, channels, owners, calendars = [], onUpdate, onUpdateDraft, onCreate, onDelete, onDuplicate, onClose, onCreateAndLinkCalendar }) {
  const [titleVal,       setTitleVal]       = useState(activity?.title           || '')
  const [startVal,       setStartVal]       = useState(activity?.start           || '')
  const [endVal,         setEndVal]         = useState(activity?.end             || '')
  const [notesVal,       setNotesVal]       = useState(activity?.notes           || '')
  const [channelVal,     setChannelVal]     = useState(activity?.channel         || '')
  const [ownerVal,       setOwnerVal]       = useState(activity?.owner           || '')
  const [statusVal,      setStatusVal]      = useState(activity?.status          || 'Planned')
  const [priorityVal,    setPriorityVal]    = useState(activity?.priority        || 'Tier 1')
  const [categoryVal,    setCategoryVal]    = useState(activity?.category        || 'Uncategorised')
  const [recurrenceVal,  setRecurrenceVal]  = useState(activity?.recurrence      || 'None')
  const [recCountVal,    setRecCountVal]    = useState(activity?.recurrenceCount || 1)
  const [creatingLinked, setCreatingLinked] = useState(false)
  const [newCalName,     setNewCalName]     = useState('')

  // Sync state when activity changes
  const actId = activity?.id
  const [lastId, setLastId] = useState(actId)
  if (actId !== lastId) {
    setTitleVal(activity?.title           || '')
    setStartVal(activity?.start           || '')
    setEndVal(activity?.end               || '')
    setNotesVal(activity?.notes           || '')
    setChannelVal(activity?.channel       || '')
    setOwnerVal(activity?.owner           || '')
    setStatusVal(activity?.status         || 'Planned')
    setPriorityVal(activity?.priority     || 'Tier 1')
    setCategoryVal(activity?.category     || 'Uncategorised')
    setRecurrenceVal(activity?.recurrence      || 'None')
    setRecCountVal(activity?.recurrenceCount   || 1)
    setLastId(actId)
  }

  if (!activity) return null

  const linkedCalendar = calendars.find(c => c.id === activity.linked_calendar_id)

  function handleSave() {
    if (!titleVal.trim()) { alert('Please add an activity title.'); return }
    if (endVal < startVal) { alert('End date cannot be before start date.'); return }
    onUpdate({ title:titleVal.trim(), start:startVal, end:endVal, notes:notesVal, channel:channelVal, owner:ownerVal, status:statusVal, priority:priorityVal, category:categoryVal })
  }

  function handleCreate() {
    if (!titleVal.trim()) { alert('Please add an activity title.'); return }
    if (endVal < startVal) { alert('End date cannot be before start date.'); return }
    onCreate({ ...activity, title:titleVal.trim(), start:startVal, end:endVal, notes:notesVal, channel:channelVal, owner:ownerVal, status:statusVal, priority:priorityVal, category:categoryVal, recurrence:recurrenceVal, recurrenceCount:Number(recCountVal) })
  }

  function openLinkedCalendar(calId) {
    window.open(`${window.location.origin}${window.location.pathname}#calendar=${calId}`, '_blank')
  }

  async function handleCreateAndLink() {
    const name = newCalName.trim()
    if (!name) return
    await onCreateAndLinkCalendar(activity.id, name)
    setCreatingLinked(false); setNewCalName('')
  }

  const set = (setter, field) => e => {
    setter(e.target.value)
    if (isDraft) onUpdateDraft({ [field]: e.target.value })
  }

  return (
    <aside className="activity-drawer" style={{ width:380, flexShrink:0, background:'#fff', borderLeft:'1px solid var(--line)', display:'flex', flexDirection:'column', overflow:'hidden' }}>

      {/* Header */}
      <div style={{ padding:'14px 16px', borderBottom:'1px solid var(--line)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
        <h3 style={{ fontSize:14, fontWeight:700 }}>{isDraft ? 'New activity' : 'Edit activity'}</h3>
        <button className="btn-mini" onClick={onClose}>✕</button>
      </div>

      {/* Scrollable body */}
      <div style={{ flex:1, overflowY:'auto', padding:'14px 16px' }}>

        <Field label="Title">
          <input value={titleVal} onChange={set(setTitleVal, 'title')} placeholder="Activity title" />
        </Field>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <Field label="Channel">
            <select value={channelVal} onChange={set(setChannelVal, 'channel')}>
              {channels.map(ch => <option key={ch.id} value={ch.id}>{ch.name}</option>)}
            </select>
          </Field>
          <Field label="Owner">
            <select value={ownerVal} onChange={set(setOwnerVal, 'owner')}>
              {owners.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </Field>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <Field label="Start">
            <input type="date" value={startVal} onChange={e => {
              setStartVal(e.target.value)
              if (isDraft) onUpdateDraft({ start: e.target.value })
              else setEndVal(new Date().toISOString().slice(0, 10))
            }} />
          </Field>
          <Field label="End">
            <input type="date" value={endVal} onChange={set(setEndVal, 'end')} />
          </Field>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <Field label="Status">
            <select value={statusVal} onChange={set(setStatusVal, 'status')}>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Priority">
            <select value={priorityVal} onChange={set(setPriorityVal, 'priority')}>
              {ACTIVITY_TIERS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Category">
          <select value={categoryVal} onChange={set(setCategoryVal, 'category')}>
            {ACTIVITY_CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_ICONS[c]} {c}</option>)}
          </select>
        </Field>

        {/* Recurrence — draft only */}
        {isDraft && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <Field label="Repeat">
              <select value={recurrenceVal} onChange={e => { setRecurrenceVal(e.target.value); onUpdateDraft({ recurrence: e.target.value }) }}>
                <option>None</option><option>Weekly</option><option>Monthly</option><option>Yearly</option>
              </select>
            </Field>
            <Field label="Occurrences">
              <input type="number" min="1" max="52" value={recCountVal} onChange={e => { setRecCountVal(e.target.value); onUpdateDraft({ recurrenceCount: e.target.value }) }} />
            </Field>
          </div>
        )}

        <Field label="Notes">
          <textarea rows={4} value={notesVal} onChange={set(setNotesVal, 'notes')} style={{ width:'100%', borderRadius:8, border:'1px solid var(--line)', padding:'8px 10px', fontFamily:'inherit', resize:'vertical', fontSize:13 }} />
        </Field>

        {/* Planning calendar — existing activities only */}
        {!isDraft && (
          <div style={{ marginBottom:12, padding:12, background:'var(--soft)', borderRadius:10, border:'1px solid var(--line)' }}>
            <Label>Planning Calendar</Label>
            {linkedCalendar ? (
              <div style={{ display:'flex', flexDirection:'column', gap:7, marginTop:4 }}>
                <div style={{ display:'flex', alignItems:'center', gap:7, fontSize:13, fontWeight:600 }}>
                  <span>📅</span> {linkedCalendar.name}
                </div>
                <button onClick={() => openLinkedCalendar(linkedCalendar.id)} className="btn btn-primary" style={{ fontSize:13 }}>
                  Open planning calendar →
                </button>
                <button onClick={() => onUpdate({ linked_calendar_id: null })} className="btn btn-danger" style={{ fontSize:12 }}>
                  Remove link
                </button>
              </div>
            ) : creatingLinked ? (
              <div style={{ display:'flex', flexDirection:'column', gap:7, marginTop:4 }}>
                <input placeholder="e.g. Summer Campaign Planning" value={newCalName} onChange={e => setNewCalName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreateAndLink()} autoFocus />
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                  <button className="btn btn-primary" style={{ fontSize:12 }} onClick={handleCreateAndLink}>Create & link</button>
                  <button className="btn btn-secondary" style={{ fontSize:12 }} onClick={() => { setCreatingLinked(false); setNewCalName('') }}>Cancel</button>
                </div>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:6, marginTop:4 }}>
                {calendars.length > 1 && (
                  <select defaultValue="" onChange={e => { if (e.target.value) onUpdate({ linked_calendar_id: e.target.value }) }}>
                    <option value="" disabled>Link to existing calendar…</option>
                    {calendars.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                )}
                <button onClick={() => setCreatingLinked(true)} className="btn btn-secondary" style={{ fontSize:13, color:'var(--accent)', borderColor:'var(--accent)' }}>
                  + Create new planning calendar
                </button>
              </div>
            )}
          </div>
        )}

        {/* Duplicate button — edit mode only, above footer */}
        {!isDraft && (
          <button className="btn btn-secondary" style={{ width:'100%', marginBottom:8 }} onClick={onDuplicate}>
            Duplicate activity
          </button>
        )}
      </div>

      {/* Sticky footer */}
      <div style={{ padding:'12px 16px', borderTop:'1px solid var(--line)', display:'flex', gap:8, flexShrink:0 }}>
        {isDraft ? (
          <>
            <button className="btn btn-primary" style={{ flex:1 }} onClick={handleCreate}>Create activity</button>
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          </>
        ) : (
          <>
            <button className="btn btn-primary" style={{ flex:1 }} onClick={handleSave}>Save changes</button>
            <button className="btn btn-danger" onClick={onDelete} style={{ padding:'8px 12px' }}>Delete</button>
          </>
        )}
      </div>

    </aside>
  )
}
