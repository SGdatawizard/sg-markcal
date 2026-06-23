import { useRef, useEffect, useState } from 'react'
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  pointerWithin, useDraggable, useDroppable,
} from '@dnd-kit/core'
import { DAY_WIDTH, LABEL_WIDTH, VIEW_DAYS, CATEGORY_ICONS, STATUS_ICONS } from '../constants'
import { addDays, fmtDate, parseDate, daysBetween, isToday, isWeekend } from '../dateUtils'

function layoutItems(items) {
  const lanes = []
  return items
    .slice()
    .sort((a, b) => parseDate(a.start) - parseDate(b.start))
    .map(item => {
      const s = parseDate(item.start), e = parseDate(item.end)
      let row = lanes.findIndex(last => s > last)
      if (row === -1) { row = lanes.length; lanes.push(e) } else lanes[row] = e
      return { ...item, layoutRow: row }
    })
}

function getVisible(campaigns, channelFilter, categoryFilter, tierFilter, search) {
  const q = search.toLowerCase()
  return campaigns.filter(i =>
    (channelFilter === 'all' || i.channel === channelFilter) &&
    (categoryFilter.length === 0 || categoryFilter.includes(i.category || 'Uncategorised')) &&
    (tierFilter === 'all' || (i.priority || 'Tier 1') === tierFilter) &&
    (String(i.title).toLowerCase().includes(q) || String(i.owner).toLowerCase().includes(q))
  )
}

const HOVER_STYLES = `
  .activity-block {
    transition: box-shadow 0.2s, width 0.2s ease, transform 0.15s ease;
  }
  .activity-block:not(.is-dragging):not(.is-overlay):not(.no-expand):hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 30px rgba(20,24,38,0.18) !important;
    min-width: var(--hover-w) !important;
    width: var(--hover-w) !important;
    overflow: visible !important;
    z-index: 999 !important;
  }
  .activity-block.no-expand:not(.is-dragging):not(.is-overlay):hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 30px rgba(20,24,38,0.18) !important;
    z-index: 999 !important;
  }
  .activity-block:not(.is-dragging):not(.is-overlay):hover .activity-meta {
    display: block !important;
    white-space: nowrap !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
  }
  .draggable-item:hover {
    z-index: 999 !important;
  }
  .resize-handle {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 10px;
    height: 28px;
    border-radius: 4px;
    background: rgba(0,0,0,0.15);
    cursor: ew-resize;
    z-index: 20;
    opacity: 0;
    transition: opacity 0.15s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 2px;
  }
  .resize-handle::before, .resize-handle::after {
    content: '';
    width: 2px;
    height: 12px;
    background: rgba(255,255,255,0.8);
    border-radius: 1px;
  }
  .draggable-item:hover .resize-handle {
    opacity: 1;
  }
  .resize-handle-left { left: 4px; }
  .resize-handle-right { right: 4px; }
`

function ActivityBlock({ item, channels, calendars = [], selectedId, isDragging, isOverlay }) {
  const ch = channels.find(c => c.id === item.channel) || channels[0]
  const length    = daysBetween(item.start, item.end)
  const isDone    = item.status === 'Done'
  const isBlocked = item.status === 'Blocked'
  const colour    = isDone ? '#cbd5e1' : isBlocked ? '#ef4444' : ch?.color || '#94a3b8'
  const bg        = isDone ? '#f3f4f6' : isBlocked ? '#fff1f2' : '#fff'
  const textCol   = isDone ? '#6b7280' : '#172033'
  const isShort   = length <= 2
  const hasLink   = !!item.linked_calendar_id

  const titleLen = String(item.title || 'Untitled activity').length
  const metaLen  = String(`${item.owner} • ${item.status} • ${item.category} • ${item.priority}`).length
  const hoverW   = Math.min(620, Math.max(280, Math.max(titleLen, metaLen) * 8 + 120))
  const widthPx  = Math.max(DAY_WIDTH, length * DAY_WIDTH)

  const classes = [
    'activity-block',
    isDragging        ? 'is-dragging' : '',
    isOverlay         ? 'is-overlay'  : '',
    widthPx >= hoverW ? 'no-expand'   : '',
  ].filter(Boolean).join(' ')

  function openLinkedCalendar(e) {
    e.stopPropagation()
    const url = `${window.location.origin}${window.location.pathname}#calendar=${item.linked_calendar_id}`
    window.open(url, '_blank')
  }

  return (
    <div
      className={classes}
      style={{
        width: isOverlay ? Math.max(200, widthPx) : '100%',
        height: 62,
        background: bg,
        border: `1px solid ${isDragging ? colour : '#e1e5ef'}`,
        borderRadius: 12,
        padding: '10px 36px 10px 22px',
        boxShadow: isDragging ? 'none' : isOverlay ? '0 18px 42px rgba(20,24,38,0.28)' : '0 8px 24px rgba(20,24,38,0.1)',
        display: 'flex', alignItems: 'center', overflow: 'hidden',
        color: textCol,
        opacity: isDragging ? 0.3 : 1,
        outline: !isDragging && !isOverlay && selectedId === item.id ? '4px solid #e8ebf5' : 'none',
        position: 'relative',
        cursor: isOverlay ? 'grabbing' : 'grab',
        '--hover-w': hoverW + 'px',
        zIndex: isDragging ? 0 : 2,
      }}
    >
      <div style={{ position:'absolute', left:0, top:0, width:6, height:'100%', background:colour, borderRadius:'12px 0 0 12px', opacity:0.9 }} />
      {!isShort ? (
        <div style={{ position:'relative', zIndex:5, width:'100%', minWidth:0 }}>
          <div style={{ fontWeight:900, lineHeight:1.15, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
            {item.title || 'Untitled activity'}
            {hasLink && <span style={{ marginLeft:6, fontSize:10, background:'#ede9fe', color:'#7c3aed', borderRadius:4, padding:'1px 5px', fontWeight:800, verticalAlign:'middle' }}>📅</span>}
          </div>
          <div className="activity-meta" style={{ color:'var(--muted)', fontSize:11, marginTop:3, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
            {item.owner} • {item.status} • {CATEGORY_ICONS[item.category] || '📦'} {item.category} • {item.priority}
          </div>
        </div>
      ) : (
        <div style={{ position:'relative', zIndex:5, width:'100%', minWidth:0 }}>
          <div className="short-title" style={{ fontWeight:900, lineHeight:1.15, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
            {item.title || 'Untitled activity'}
            {hasLink && <span style={{ marginLeft:6, fontSize:10, background:'#ede9fe', color:'#7c3aed', borderRadius:4, padding:'1px 5px', fontWeight:800, verticalAlign:'middle' }}>📅</span>}
          </div>
          <div className="activity-meta short-meta" style={{ color:'var(--muted)', fontSize:11, marginTop:3, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', display:'none' }}>
            {item.owner} • {item.status} • {CATEGORY_ICONS[item.category] || '📦'} {item.category} • {item.priority}
          </div>
        </div>
      )}
      {/* Status icon or link button */}
      {hasLink && !isDragging && !isOverlay ? (
        <span
          title="Open planning calendar"
          onClick={openLinkedCalendar}
          style={{ position:'absolute', right:10, bottom:8, width:18, height:18, borderRadius:'50%', display:'grid', placeItems:'center', fontSize:11, background:'#ede9fe', color:'#7c3aed', zIndex:6, cursor:'pointer' }}
        >→</span>
      ) : (
        <span style={{ position:'absolute', right:10, bottom:8, width:18, height:18, borderRadius:'50%', display:'grid', placeItems:'center', fontSize:12, background:'var(--soft)', zIndex:6 }}>
          {STATUS_ICONS[item.status] || '📌'}
        </span>
      )}
    </div>
  )
}

function DraggableItem({ item, channels, calendars, viewStart, viewDays, selectedId, onSelect, onResize }) {
  const offset  = Math.round((parseDate(item.start) - viewStart) / 86400000)
  const leftPx  = Math.max(0, offset) * DAY_WIDTH
  const top     = 12 + (item.layoutRow || 0) * 68
  const widthPx = Math.max(DAY_WIDTH, daysBetween(item.start, item.end) * DAY_WIDTH)

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: String(item.id),
    data: { item },
  })

  function startResize(e, side) {
    e.stopPropagation()
    e.preventDefault()
    const startX    = e.clientX
    const origStart = parseDate(item.start)
    const origEnd   = parseDate(item.end)
    function onMove(e) {
      const dayDelta = Math.round((e.clientX - startX) / DAY_WIDTH)
      if (side === 'right') {
        const newEnd = addDays(origEnd, dayDelta)
        if (newEnd >= origStart) onResize(item.id, null, newEnd)
      } else {
        const newStart = addDays(origStart, dayDelta)
        if (newStart <= origEnd) onResize(item.id, newStart, null)
      }
    }
    function onUp() {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  return (
    <div
      ref={setNodeRef}
      className="draggable-item"
      onClick={e => { e.stopPropagation(); if (!isDragging) onSelect(item.id) }}
      style={{ position:'absolute', left:leftPx, top, width:widthPx, height:62, touchAction:'none', zIndex: isDragging ? 0 : 2 }}
    >
      {/* Left resize grip — outside dnd-kit listeners */}
      <div className="resize-handle resize-handle-left" onMouseDown={e => startResize(e, 'left')} />

      {/* Drag zone — dnd-kit listeners only on this inner div */}
      <div {...listeners} {...attributes} style={{ position:'absolute', inset:0, cursor: isDragging ? 'grabbing' : 'grab' }}>
        <ActivityBlock item={item} channels={channels} calendars={calendars} selectedId={selectedId} isDragging={isDragging} />
      </div>

      {/* Right resize grip — outside dnd-kit listeners */}
      <div className="resize-handle resize-handle-right" onMouseDown={e => startResize(e, 'right')} />
    </div>
  )
}

function DraggableMilestoneLine({ milestone, lineLeft, onEdit }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `milestone-${milestone.id}`,
    data: { type: 'milestone', milestone },
  })
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      title={milestone.title}
      onClick={onEdit}
      style={{
        position: 'absolute',
        top: 0,
        left: lineLeft - 3,
        width: 6,
        height: '100%',
        background: isDragging ? 'rgba(190,18,60,0.15)' : 'rgba(190,18,60,0.35)',
        zIndex: 1,
        cursor: 'grab',
        transition: 'background 0.15s',
        touchAction: 'none',
      }}
      onMouseEnter={e => { if (!isDragging) e.currentTarget.style.background = 'rgba(190,18,60,0.6)' }}
      onMouseLeave={e => { if (!isDragging) e.currentTarget.style.background = 'rgba(190,18,60,0.35)' }}
    />
  )
}

function LaneDropZone({ channelId, children }) {
  const { setNodeRef } = useDroppable({ id: `lane-${channelId}`, data: { channelId } })
  return <div ref={setNodeRef}>{children}</div>
}

export default function Timeline({ channels, campaigns, calendars = [], viewStart, setViewStart, channelFilter, categoryFilter, tierFilter, search, selectedId, onSelectCampaign, onAddAtDate, onMoveCampaign, onUpdateCampaign, scrollToToday, milestones = [], onAddMilestone, onUpdateMilestone, onDeleteMilestone }) {
  const wrapRef    = useRef(null)
  const scrollLock = useRef(false)
  const scrollInit = useRef(false)
  const [activeItem,       setActiveItem]       = useState(null)
  const [activeMilestone,  setActiveMilestone]  = useState(null)
  const [overChannelId,    setOverChannelId]    = useState(null)
  const [milestoneForm, setMilestoneForm] = useState(false)
  const [mTitle, setMTitle] = useState('')
  const [mDate,  setMDate]  = useState('')
  const [scrollLeft, setScrollLeft] = useState(0)
  const [editingMilestone, setEditingMilestone] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDate,  setEditDate]  = useState('')

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  )

  const viewDaysRef = useRef(365)
  const [viewDays, setViewDaysState] = useState(365)
  function setViewDays(n) {
    viewDaysRef.current = n
    setViewDaysState(n)
  }

  const visible    = getVisible(campaigns, channelFilter, categoryFilter, tierFilter, search)
  const days       = Array.from({ length: viewDays }, (_, i) => addDays(viewStart, i))
  const totalWidth = LABEL_WIDTH + viewDays * DAY_WIDTH

  // On mount: scroll so today is near the left edge
  useEffect(() => {
    if (!wrapRef.current || scrollInit.current) return
    scrollInit.current = true
    requestAnimationFrame(() => {
      if (!wrapRef.current) return
      const todayOffset = Math.round((new Date().setHours(0,0,0,0) - new Date(viewStart).setHours(0,0,0,0)) / 86400000)
      wrapRef.current.scrollLeft = Math.max(0, todayOffset * DAY_WIDTH - DAY_WIDTH * 3)
    })
  }, [])

  // Today button: scroll to today
  useEffect(() => {
    if (!scrollToToday || !wrapRef.current) return
    const wrap = wrapRef.current
    const todayOffset = Math.round((new Date().setHours(0,0,0,0) - new Date(viewStart).setHours(0,0,0,0)) / 86400000)
    wrap.scrollLeft = Math.max(0, todayOffset * DAY_WIDTH - DAY_WIDTH * 2)
  }, [scrollToToday])

  // Infinite scroll — expand right and left as needed
  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    function onScroll() {
      setScrollLeft(wrap.scrollLeft)
      const distFromRight = wrap.scrollWidth - wrap.scrollLeft - wrap.clientWidth
      const distFromLeft  = wrap.scrollLeft

      // Expand right — just add more days, no scroll jump needed
      if (distFromRight < DAY_WIDTH * 30) {
        setViewDays(viewDaysRef.current + 180)
      }

      // Expand left — prepend days and compensate scroll position so view doesn't jump
      if (distFromLeft < DAY_WIDTH * 30 && !scrollLock.current) {
        scrollLock.current = true
        const added = 90
        setViewStart(d => addDays(d, -added))
        setViewDays(viewDaysRef.current + added)
        requestAnimationFrame(() => {
          wrap.scrollLeft = wrap.scrollLeft + added * DAY_WIDTH
          setTimeout(() => { scrollLock.current = false }, 200)
        })
      }
    }
    wrap.addEventListener('scroll', onScroll, { passive: true })
    return () => wrap.removeEventListener('scroll', onScroll)
  }, [])

  function handleResize(id, newStart, newEnd) {
    const item = campaigns.find(c => c.id === id)
    if (!item) return
    onUpdateCampaign(id, {
      start: newStart ? fmtDate(newStart) : item.start,
      end:   newEnd   ? fmtDate(newEnd)   : item.end,
    })
  }

  function handleDragStart({ active }) {
    if (active.data.current?.type === 'milestone') {
      setActiveMilestone(active.data.current.milestone)
      return
    }
    setActiveItem(active.data.current.item)
    setOverChannelId(active.data.current.item.channel)
  }

  function handleDragOver({ over }) {
    const channelId = over?.data?.current?.channelId
    if (channelId) setOverChannelId(channelId)
  }

  function handleDragEnd({ active, delta, over }) {
    setActiveItem(null)
    setActiveMilestone(null)
    if (!active) return

    // Milestone drag — horizontal only, updates date
    if (active.data.current?.type === 'milestone') {
      const m = active.data.current.milestone
      const dayDelta = Math.round(delta.x / DAY_WIDTH)
      if (dayDelta !== 0) {
        const newDate = addDays(parseDate(m.date), dayDelta)
        onUpdateMilestone(m.id, m.title, fmtDate(newDate))
      }
      return
    }

    // Activity drag
    const item       = active.data.current.item
    const newChannel = over?.data?.current?.channelId || overChannelId || item.channel
    setOverChannelId(null)
    const dayDelta   = Math.round(delta.x / DAY_WIDTH)
    const dur        = daysBetween(item.start, item.end)
    const newStart   = addDays(parseDate(item.start), dayDelta)
    const newEnd     = addDays(newStart, dur - 1)
    onMoveCampaign(item.id, newStart, newEnd, newChannel)
  }

  function handleLaneClick(e, channelId) {
    if (e.defaultPrevented) return
    const rect   = e.currentTarget.getBoundingClientRect()
    const dayIdx = Math.max(0, Math.min(VIEW_DAYS - 1, Math.floor((e.clientX - rect.left) / DAY_WIDTH)))
    onAddAtDate(addDays(viewStart, dayIdx), channelId)
  }

  const filteredChannels = channels.filter(ch => channelFilter === 'all' || ch.id === channelFilter)

  return (
    <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
      <style>{HOVER_STYLES}</style>
      <div style={{ flex:1, minWidth:0, display:'flex', flexDirection:'column', overflow:'hidden' }}>

        {/* Milestone toolbar */}
        <div
          style={{ position:'relative', background:'#fff', borderBottom:'1px solid var(--line)', flexShrink:0, height:44, display:'flex', alignItems:'center', cursor: milestoneForm ? 'default' : 'pointer' }}
          onClick={() => { if (!milestoneForm) setMilestoneForm(true) }}
        >
          {/* Fixed left label */}
          <span style={{ flexShrink:0, width: LABEL_WIDTH, paddingLeft:16, fontSize:11, fontWeight:900, color:'#8c93a3', textTransform:'uppercase', zIndex:3, background:'#fff', borderRight:'1px solid var(--line)', height:'100%', display:'flex', alignItems:'center' }}>
            Milestones
          </span>

          {/* Scrolling area for pills */}
          <div style={{ flex:1, position:'relative', height:'100%', overflow:'hidden' }}>
            {!milestoneForm && milestones.map(m => {
              const offset = Math.round((parseDate(m.date) - viewStart) / 86400000)
              const lineX  = offset * DAY_WIDTH + DAY_WIDTH / 2 - scrollLeft
              if (lineX < -60 || lineX > (wrapRef.current?.clientWidth || 9999) + 60) return null
              return (
                <span
                  key={m.id}
                  onClick={e => {
                    e.stopPropagation()
                    setEditingMilestone({ id: m.id, x: e.clientX, y: e.clientY })
                    setEditTitle(m.title)
                    setEditDate(m.date)
                  }}
                  title={`${m.title} — ${m.date}`}
                  style={{ position:'absolute', left: lineX, top:'50%', transform:'translate(-50%, -50%)', display:'inline-flex', alignItems:'center', gap:4, background:'#fff1f2', border:'1px solid #fecdd3', borderRadius:99, padding:'3px 10px', fontSize:12, fontWeight:700, color:'#be123c', cursor:'pointer', whiteSpace:'nowrap', zIndex:2 }}
                  onMouseEnter={e => e.currentTarget.style.background = '#ffe4e6'}
                  onMouseLeave={e => e.currentTarget.style.background = '#fff1f2'}
                >
                  🚩 {m.title}
                </span>
              )
            })}
          </div>

          {/* Add form — floats over the right side when open */}
          {milestoneForm && (
            <div
              onClick={e => e.stopPropagation()}
              style={{ position:'absolute', right:16, top:'50%', transform:'translateY(-50%)', display:'flex', gap:6, alignItems:'center', background:'#fff', zIndex:4, padding:'0 4px' }}
            >
              <input placeholder="Title" value={mTitle} onChange={e => setMTitle(e.target.value)} autoFocus style={{ width:140, padding:'5px 10px', borderRadius:10, border:'1px solid #dfe3ec', fontSize:13 }} />
              <input type="date" value={mDate} onChange={e => setMDate(e.target.value)} style={{ padding:'5px 8px', borderRadius:10, border:'1px solid #dfe3ec', fontSize:13, width:130 }} />
              <button className="btn btn-primary" style={{ padding:'5px 12px', fontSize:12, whiteSpace:'nowrap' }} onClick={() => {
                if (!mTitle.trim() || !mDate) return
                onAddMilestone(mTitle.trim(), mDate)
                setMTitle(''); setMDate(''); setMilestoneForm(false)
              }}>Add</button>
              <button className="btn btn-secondary" style={{ padding:'5px 12px', fontSize:12 }} onClick={() => { setMilestoneForm(false); setMTitle(''); setMDate('') }}>✕</button>
            </div>
          )}
        </div>

        <div ref={wrapRef} style={{ flex:1, minHeight:0, overflowX:'auto', overflowY:'auto', paddingRight:24, paddingBottom:24, position:'relative' }}>
        <div style={{ background:'#fff', border:'1px solid var(--line)', borderRadius:'0 26px 26px 0', boxShadow:'0 12px 35px rgba(20,24,38,0.06)', width: totalWidth, position:'relative' }}>

          {/* Header row */}
          <div style={{ display:'grid', gridTemplateColumns:`${LABEL_WIDTH}px repeat(${viewDays}, ${DAY_WIDTH}px)`, background:'#f7f8fb', borderBottom:'1px solid var(--line)', position:'sticky', top:0, zIndex:120 }}>
            <div style={{ padding:'10px 8px', borderRight:'1px solid var(--line)', fontSize:12, fontWeight:900, color:'#667085', position:'sticky', left:0, zIndex:140, background:'#f7f8fb', boxShadow:'1px 0 0 var(--line)' }}>Channel</div>
            {days.map((day, i) => {
              const today   = isToday(day)
              const weekend = isWeekend(day)
              return (
                <div key={i} style={{ padding:'10px 8px', borderRight:'1px solid var(--line)', fontSize:12, whiteSpace:'nowrap', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', background: today ? '#ede9fe' : weekend ? '#f1f3f7' : undefined, color: today ? '#5b21b6' : weekend ? '#9aa2b4' : undefined }}>
                  <span style={{ display:'block', fontSize:10, fontWeight:800, marginBottom:2, color: today ? '#5b21b6' : '#98a2b3', minHeight:12 }}>{day.toLocaleDateString('en-GB', { month:'short' })}</span>
                  <span><strong style={{ color: today ? '#5b21b6' : '#344054', marginRight:4 }}>{day.toLocaleDateString('en-GB', { weekday:'short' })}</strong>{day.getDate()}</span>
                </div>
              )
            })}
          </div>

          {/* Lane rows */}
          {filteredChannels.map(ch => {
            const items     = layoutItems(visible.filter(it => it.channel === ch.id))
            const maxRow    = items.reduce((m, it) => Math.max(m, it.layoutRow || 0), 0)
            const rowHeight = Math.max(110, 28 + (maxRow + 1) * 74)
            const isOver    = overChannelId === ch.id && !!activeItem

            return (
              <LaneDropZone key={ch.id} channelId={ch.id}>
                <div style={{ display:'grid', gridTemplateColumns:`${LABEL_WIDTH}px 1fr`, minHeight: rowHeight, borderBottom:'1px solid var(--line)' }}>
                  <div style={{ position:'sticky', left:0, zIndex:50, background: isOver ? `${ch.color}08` : '#fff', borderRight:'1px solid var(--line)', padding:18, fontWeight:900, boxShadow:'1px 0 0 var(--line)', minWidth: LABEL_WIDTH, transition:'background 0.15s' }}>
                    <span className="dot" style={{ background: ch.color }} /> {ch.name}
                    <small style={{ display:'block', marginTop:4, color:'#818898', fontWeight:650 }}>{items.length} planned</small>
                  </div>
                  <div
                    style={{ position:'relative', minHeight: rowHeight, backgroundImage:'repeating-linear-gradient(to right,transparent 0,transparent 61px,var(--line) 61px,var(--line) 62px)', backgroundColor: isOver ? `${ch.color}18` : undefined, outline: isOver ? `2px dashed ${ch.color}88` : 'none', outlineOffset: -2, transition:'background-color 0.1s', cursor:'pointer' }}
                    onClick={e => handleLaneClick(e, ch.id)}
                  >
                    {days.map((day, idx) =>
                      isToday(day) ? <div key={idx} style={{ position:'absolute', top:0, height:'100%', width:DAY_WIDTH, left:idx*DAY_WIDTH, background:'#f5f3ff', pointerEvents:'none', zIndex:0 }} />
                      : isWeekend(day) ? <div key={idx} style={{ position:'absolute', top:0, height:'100%', width:DAY_WIDTH, left:idx*DAY_WIDTH, background:'#f8fafc', pointerEvents:'none', zIndex:0 }} />
                      : null
                    )}
                    {/* Milestone lines — below activities */}
                    {milestones.map(m => {
                      const offset = Math.round((parseDate(m.date) - viewStart) / 86400000)
                      if (offset < 0 || offset >= viewDays) return null
                      const lineLeft = offset * DAY_WIDTH + DAY_WIDTH / 2
                      return (
                        <DraggableMilestoneLine
                          key={m.id}
                          milestone={m}
                          lineLeft={lineLeft}
                          onEdit={(e) => {
                            e.stopPropagation()
                            setEditingMilestone({ id: m.id, x: e.clientX, y: e.clientY })
                            setEditTitle(m.title)
                            setEditDate(m.date)
                          }}
                        />
                      )
                    })}
                    {items.map(item => (
                      <DraggableItem key={item.id} item={item} channels={channels} calendars={calendars} viewStart={viewStart} viewDays={viewDays} selectedId={selectedId} onSelect={onSelectCampaign} onResize={handleResize} />
                    ))}
                  </div>
                </div>
              </LaneDropZone>
            )
          })}
        </div>
      </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeItem ? (
          <ActivityBlock item={activeItem} channels={channels} selectedId={null} isOverlay isDragging={false} />
        ) : activeMilestone ? (
          <div style={{
            width: 6,
            height: '100vh',
            background: 'rgba(190,18,60,0.6)',
            borderRadius: 3,
            boxShadow: '0 0 16px rgba(190,18,60,0.5)',
            cursor: 'grabbing',
            position: 'fixed',
            top: 0,
          }} />
        ) : null}
      </DragOverlay>

      {/* Milestone edit popover */}
      {editingMilestone && (
        <>
          <div onClick={() => setEditingMilestone(null)} style={{ position:'fixed', inset:0, zIndex:1000 }} />
          <div style={{
            position: 'fixed',
            left: Math.min(editingMilestone.x, window.innerWidth - 260),
            top: editingMilestone.y - 10,
            transform: 'translateY(-100%)',
            zIndex: 1001,
            background: '#fff',
            border: '1px solid #e4e7ee',
            borderRadius: 16,
            padding: 18,
            width: 240,
            boxShadow: '0 12px 40px rgba(20,24,38,0.16)',
          }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <strong style={{ fontSize:13 }}>Edit milestone</strong>
              <button onClick={() => setEditingMilestone(null)} className="btn-mini">✕</button>
            </div>
            <div style={{ marginBottom:10 }}>
              <label style={{ display:'block', fontSize:11, fontWeight:900, color:'#7b8497', textTransform:'uppercase', marginBottom:5 }}>Title</label>
              <input value={editTitle} onChange={e => setEditTitle(e.target.value)} style={{ width:'100%', padding:'8px 10px', borderRadius:10, border:'1px solid #dfe3ec', fontSize:13 }} />
            </div>
            <div style={{ marginBottom:14 }}>
              <label style={{ display:'block', fontSize:11, fontWeight:900, color:'#7b8497', textTransform:'uppercase', marginBottom:5 }}>Date</label>
              <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} style={{ width:'100%', padding:'8px 10px', borderRadius:10, border:'1px solid #dfe3ec', fontSize:13 }} />
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              <button className="btn btn-primary" style={{ fontSize:13 }} onClick={() => {
                if (!editTitle.trim() || !editDate) return
                onUpdateMilestone(editingMilestone.id, editTitle.trim(), editDate)
                setEditingMilestone(null)
              }}>Save</button>
              <button className="btn btn-danger" style={{ fontSize:13 }} onClick={() => {
                onDeleteMilestone(editingMilestone.id)
                setEditingMilestone(null)
              }}>Delete</button>
            </div>
          </div>
        </>
      )}
    </DndContext>
  )
}
