import { useRef, useEffect, useState, useCallback } from 'react'
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
    (channelFilter.length === 0 || channelFilter.includes(i.channel)) &&
    (categoryFilter.length === 0 || categoryFilter.includes(i.category || 'Uncategorised')) &&
    (tierFilter === 'all' || (i.priority || 'Tier 1') === tierFilter) &&
    (String(i.title).toLowerCase().includes(q) || String(i.owner).toLowerCase().includes(q))
  )
}

const STYLES = `
  .act-wrap { position: absolute; }
  .act-block {
    width: 100%; height: 52px;
    border-radius: 8px;
    display: flex; align-items: center;
    overflow: hidden;
    position: relative;
    user-select: none;
    transition: box-shadow 0.15s, transform 0.1s, min-width 0.15s, width 0.15s;
  }
  .act-block:not(.is-dragging):hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(99,102,241,0.18) !important;
    z-index: 999 !important;
    overflow: visible !important;
    min-width: var(--hover-w) !important;
    width: var(--hover-w) !important;
    background: #fff !important;
  }
  .act-block:not(.is-dragging):hover .act-meta { display: block !important; }
  .act-wrap:hover { z-index: 999 !important; }
  .resize-grip {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 14px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 2px;
    cursor: ew-resize;
    z-index: 30;
    border-radius: 4px;
    background: rgba(99,102,241,0.9);
    opacity: 0;
    transition: opacity 0.15s;
  }
  .resize-grip-left  { left: -7px; }
  .resize-grip-right { right: -7px; }
  .resize-grip-bar {
    width: 2px; height: 14px;
    border-radius: 2px;
    background: #fff;
    opacity: 0.9;
  }
  .act-wrap.is-selected .resize-grip { opacity: 1; }
`

// ── Tooltip content ───────────────────────────────────────────────────────────
function ActivityTooltip({ item, channels, layoutRow }) {
  const ch  = channels.find(c => c.id === item.channel)
  const dur = daysBetween(item.start, item.end)
  // Show below if in first two rows (near top of calendar)
  const below = (layoutRow || 0) < 2
  return (
    <div className={`act-tooltip ${below ? 'act-tooltip-below' : 'act-tooltip-above'}`}>
      <div className="act-tooltip-title">{item.title || 'Untitled activity'}</div>
      <div className="act-tooltip-row">Channel: <span>{ch?.name || '—'}</span></div>
      <div className="act-tooltip-row">Owner: <span>{item.owner}</span></div>
      <div className="act-tooltip-row">Status: <span>{item.status}</span></div>
      <div className="act-tooltip-row">Priority: <span>{item.priority}</span></div>
      <div className="act-tooltip-row">Category: <span>{CATEGORY_ICONS[item.category]} {item.category}</span></div>
      <div className="act-tooltip-row">Dates: <span>{item.start} → {item.end} ({dur}d)</span></div>
      {item.notes && <div className="act-tooltip-row">Notes: <span style={{ whiteSpace:'normal', maxWidth:200 }}>{item.notes.slice(0,80)}{item.notes.length > 80 ? '…' : ''}</span></div>}
    </div>
  )
}

// ── Activity block (visual) ───────────────────────────────────────────────────
function ActivityBlock({ item, channels, calendars = [], selectedId, isDragging, isOverlay }) {
  const ch      = channels.find(c => c.id === item.channel) || channels[0]
  const len     = daysBetween(item.start, item.end)
  const isDone  = item.status === 'Done'
  const isBlock = item.status === 'Blocked'
  const accent  = isDone ? '#94a3b8' : isBlock ? '#ef4444' : (ch?.color || '#6366f1')
  const hasLink = !!item.linked_calendar_id
  const isShort = len <= 1
  const bgAlpha = isDone ? '#f3f4f6' : isBlock ? '#fff1f2' : `${accent}12`
  const textCol = isDone ? '#6b7280' : '#1a1a2e'

  const titleLen = String(item.title || 'Untitled').length
  const metaLen  = String(`${item.owner} · ${item.status} · ${item.category} · ${item.priority}`).length
  const hoverW   = Math.min(520, Math.max(260, Math.max(titleLen, metaLen) * 8 + 80))

  function openLink(e) {
    e.stopPropagation()
    window.open(`${window.location.origin}${window.location.pathname}#calendar=${item.linked_calendar_id}`, '_blank')
  }

  return (
    <div
      className={['act-block', isDragging ? 'is-dragging' : '', isOverlay ? 'is-overlay' : ''].filter(Boolean).join(' ')}
      style={{
        background: bgAlpha,
        border: `1.5px solid ${accent}40`,
        borderLeft: `3px solid ${accent}`,
        padding: '6px 28px 6px 10px',
        color: textCol,
        opacity: isDragging ? 0.35 : 1,
        outline: !isDragging && !isOverlay && selectedId === item.id ? `2px solid ${accent}` : 'none',
        outlineOffset: 1,
        cursor: isOverlay ? 'grabbing' : 'grab',
        boxShadow: isOverlay ? '0 12px 32px rgba(0,0,0,0.15)' : '0 1px 3px rgba(0,0,0,0.06)',
        '--hover-w': hoverW + 'px',
      }}
    >
      <div style={{ minWidth:0, flex:1 }}>
        <div style={{ fontSize:12, fontWeight:700, lineHeight:1.2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
          {item.title || 'Untitled'}
          {hasLink && <span style={{ marginLeft:5, fontSize:9, background:'var(--accent-bg)', color:'var(--accent-txt)', borderRadius:3, padding:'1px 4px', fontWeight:700, verticalAlign:'middle' }}>↗</span>}
        </div>
        <div className="act-meta" style={{ fontSize:10, color:'var(--muted)', marginTop:2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', display: isShort ? 'none' : 'block' }}>
          {item.owner} · {item.status} · {CATEGORY_ICONS[item.category] || '📦'} {item.category} · {item.priority}
        </div>
      </div>
      {hasLink && !isDragging && !isOverlay ? (
        <span onClick={openLink} title="Open planning calendar"
          style={{ position:'absolute', right:6, top:'50%', transform:'translateY(-50%)', width:16, height:16, borderRadius:'50%', display:'grid', placeItems:'center', fontSize:9, background:'var(--accent-bg)', color:'var(--accent)', cursor:'pointer', zIndex:6 }}>→</span>
      ) : (
        <span style={{ position:'absolute', right:6, top:'50%', transform:'translateY(-50%)', fontSize:11, zIndex:6, opacity:0.5 }}>
          {STATUS_ICONS[item.status] || '·'}
        </span>
      )}
    </div>
  )
}

// ── Draggable item + resize grips ─────────────────────────────────────────────
function DraggableItem({ item, channels, calendars, viewStart, selectedId, onSelect, onResize }) {
  const offset  = Math.round((parseDate(item.start) - viewStart) / 86400000)
  const leftPx  = Math.max(0, offset) * DAY_WIDTH
  const top     = 10 + (item.layoutRow || 0) * 62
  const widthPx = Math.max(DAY_WIDTH - 4, daysBetween(item.start, item.end) * DAY_WIDTH - 4)
  const isSelected = selectedId === item.id

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: String(item.id),
    data: { item },
  })

  const leftGripRef  = useRef(null)
  const rightGripRef = useRef(null)

  // Attach native capture-phase pointerdown to grips so they fire before dnd-kit
  useEffect(() => {
    const grips = [
      { el: leftGripRef.current,  side: 'left'  },
      { el: rightGripRef.current, side: 'right' },
    ]

    function makeHandler(side) {
      return function onPointerDown(e) {
        e.stopPropagation()
        e.preventDefault()
        const startX    = e.clientX
        const origStart = parseDate(item.start)
        const origEnd   = parseDate(item.end)

        // Track pending values during drag — don't call onResize until release
        let pendingStart = null
        let pendingEnd   = null

        function onMove(mv) {
          const delta = Math.round((mv.clientX - startX) / DAY_WIDTH)
          if (side === 'right') {
            const ne = addDays(origEnd, delta)
            if (ne >= origStart) pendingEnd = ne
          } else {
            const ns = addDays(origStart, delta)
            if (ns <= origEnd) pendingStart = ns
          }
        }
        function onUp() {
          window.removeEventListener('pointermove', onMove)
          window.removeEventListener('pointerup', onUp)
          // Only save if something actually changed
          if (pendingStart !== null || pendingEnd !== null) {
            onResize(item.id, pendingStart, pendingEnd)
          }
        }
        window.addEventListener('pointermove', onMove)
        window.addEventListener('pointerup', onUp)
      }
    }

    const handlers = []
    for (const { el, side } of grips) {
      if (!el) continue
      const handler = makeHandler(side)
      el.addEventListener('pointerdown', handler, { capture: true })
      handlers.push({ el, handler })
    }
    return () => {
      for (const { el, handler } of handlers) {
        el.removeEventListener('pointerdown', handler, { capture: true })
      }
    }
  }, [item.start, item.end, item.id])

  return (
    <div
      className={`act-wrap${isSelected ? ' is-selected' : ''}`}
      ref={setNodeRef}
      onClick={e => { e.stopPropagation(); if (!isDragging) onSelect(item.id) }}
      style={{ left:leftPx, top, width:widthPx, height:52, touchAction:'none', zIndex: isDragging ? 1 : isSelected ? 10 : 2 }}
    >
      {/* Left resize grip — native capture listener */}
      <div ref={leftGripRef} className="resize-grip resize-grip-left" style={{ cursor:'ew-resize' }}>
        <div className="resize-grip-bar" /><div className="resize-grip-bar" />
      </div>

      {/* dnd-kit drag zone — inner div only */}
      <div {...listeners} {...attributes} style={{ position:'absolute', inset:0 }}>
        <ActivityBlock item={item} channels={channels} calendars={calendars} selectedId={selectedId} isDragging={isDragging} />
      </div>

      {/* Right resize grip */}
      <div ref={rightGripRef} className="resize-grip resize-grip-right" style={{ cursor:'ew-resize' }}>
        <div className="resize-grip-bar" /><div className="resize-grip-bar" />
      </div>
    </div>
  )
}

// ── Milestone line ────────────────────────────────────────────────────────────
function DraggableMilestoneLine({ milestone, lineLeft, onEdit }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `milestone-${milestone.id}`,
    data: { type: 'milestone', milestone },
  })
  return (
    <div
      ref={setNodeRef} {...listeners} {...attributes}
      title={milestone.title} onClick={onEdit}
      style={{ position:'absolute', top:0, left:lineLeft-3, width:6, height:'100%', background: isDragging ? 'rgba(190,18,60,0.1)' : 'rgba(190,18,60,0.3)', zIndex:1, cursor:'grab', touchAction:'none', transition:'background 0.15s' }}
      onMouseEnter={e => { if (!isDragging) e.currentTarget.style.background='rgba(190,18,60,0.6)' }}
      onMouseLeave={e => { if (!isDragging) e.currentTarget.style.background='rgba(190,18,60,0.3)' }}
    />
  )
}

function LaneDropZone({ channelId, children }) {
  const { setNodeRef } = useDroppable({ id: `lane-${channelId}`, data: { channelId } })
  return <div ref={setNodeRef}>{children}</div>
}

// ── Main Timeline ─────────────────────────────────────────────────────────────
export default function Timeline({ channels, campaigns, calendars = [], viewStart, setViewStart, channelFilter, categoryFilter, tierFilter, search, selectedId, onSelectCampaign, onAddAtDate, onMoveCampaign, onUpdateCampaign, scrollToToday, milestones = [], onAddMilestone, onUpdateMilestone, onDeleteMilestone }) {
  const wrapRef    = useRef(null)
  const scrollLock = useRef(false)
  const scrollInit = useRef(false)

  const [activeItem,      setActiveItem]      = useState(null)
  const [activeMilestone, setActiveMilestone] = useState(null)
  const [overChannelId,   setOverChannelId]   = useState(null)
  const [scrollLeft,      setScrollLeft]      = useState(0)

  const [milestoneForm,    setMilestoneForm]    = useState(false)
  const [mTitle,           setMTitle]           = useState('')
  const [mDate,            setMDate]            = useState('')
  const [editingMilestone, setEditingMilestone] = useState(null)
  const [editTitle,        setEditTitle]        = useState('')
  const [editDate,         setEditDate]         = useState('')

  const viewDaysRef = useRef(365)
  const [viewDays, setViewDaysState] = useState(365)
  function setViewDays(n) { viewDaysRef.current = n; setViewDaysState(n) }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  )

  const visible    = getVisible(campaigns, channelFilter, categoryFilter, tierFilter, search)
  const days       = Array.from({ length: viewDays }, (_, i) => addDays(viewStart, i))
  const totalWidth = LABEL_WIDTH + viewDays * DAY_WIDTH

  useEffect(() => {
    if (!wrapRef.current || scrollInit.current) return
    scrollInit.current = true
    requestAnimationFrame(() => {
      if (!wrapRef.current) return
      const offset = Math.round((new Date().setHours(0,0,0,0) - new Date(viewStart).setHours(0,0,0,0)) / 86400000)
      wrapRef.current.scrollLeft = Math.max(0, offset * DAY_WIDTH - DAY_WIDTH * 3)
    })
  }, [])

  useEffect(() => {
    if (!scrollToToday || !wrapRef.current) return
    const offset = Math.round((new Date().setHours(0,0,0,0) - new Date(viewStart).setHours(0,0,0,0)) / 86400000)
    wrapRef.current.scrollLeft = Math.max(0, offset * DAY_WIDTH - DAY_WIDTH * 2)
  }, [scrollToToday])

  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    function onScroll() {
      setScrollLeft(wrap.scrollLeft)
      const fromRight = wrap.scrollWidth - wrap.scrollLeft - wrap.clientWidth
      const fromLeft  = wrap.scrollLeft
      if (fromRight < DAY_WIDTH * 30) setViewDays(viewDaysRef.current + 180)
      if (fromLeft < DAY_WIDTH * 30 && !scrollLock.current) {
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
    onUpdateCampaign(id, { start: newStart ? fmtDate(newStart) : item.start, end: newEnd ? fmtDate(newEnd) : item.end })
  }

  function handleDragStart({ active }) {
    if (active.data.current?.type === 'milestone') { setActiveMilestone(active.data.current.milestone); return }
    setActiveItem(active.data.current.item)
    setOverChannelId(active.data.current.item.channel)
  }

  function handleDragOver({ over }) {
    const ch = over?.data?.current?.channelId
    if (ch) setOverChannelId(ch)
  }

  function handleDragEnd({ active, delta, over }) {
    setActiveItem(null); setActiveMilestone(null)
    if (!active) return
    if (active.data.current?.type === 'milestone') {
      const m = active.data.current.milestone
      const d = Math.round(delta.x / DAY_WIDTH)
      if (d !== 0) onUpdateMilestone(m.id, m.title, fmtDate(addDays(parseDate(m.date), d)))
      return
    }
    const item       = active.data.current.item
    const newChannel = over?.data?.current?.channelId || overChannelId || item.channel
    setOverChannelId(null)
    const d   = Math.round(delta.x / DAY_WIDTH)
    const dur = daysBetween(item.start, item.end)
    const ns  = addDays(parseDate(item.start), d)
    const ne  = addDays(ns, dur - 1)
    onMoveCampaign(item.id, ns, ne, newChannel)
  }

  function handleLaneClick(e, channelId) {
    if (e.defaultPrevented) return
    const rect   = e.currentTarget.getBoundingClientRect()
    const dayIdx = Math.max(0, Math.min(VIEW_DAYS - 1, Math.floor((e.clientX - rect.left) / DAY_WIDTH)))
    onAddAtDate(addDays(viewStart, dayIdx), channelId)
  }

  const filteredChannels = channels.filter(ch => channelFilter.length === 0 || channelFilter.includes(ch.id))

  return (
    <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
      <style>{STYLES}</style>
      <div style={{ flex:1, minWidth:0, display:'flex', flexDirection:'column', overflow:'hidden' }}>

        {/* Milestone bar */}
        <div
          style={{ position:'relative', background:'#fff', borderBottom:'1px solid var(--line)', flexShrink:0, height:40, display:'flex', alignItems:'center', cursor: milestoneForm ? 'default' : 'pointer' }}
          onClick={() => { if (!milestoneForm) setMilestoneForm(true) }}
        >
          <span style={{ flexShrink:0, width:LABEL_WIDTH, paddingLeft:14, fontSize:11, fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.05em', borderRight:'1px solid var(--line)', height:'100%', display:'flex', alignItems:'center' }}>
            Milestones
          </span>
          <div style={{ flex:1, position:'relative', height:'100%', overflow:'hidden' }}>
            {!milestoneForm && milestones.map(m => {
              const offset = Math.round((parseDate(m.date) - viewStart) / 86400000)
              const x = offset * DAY_WIDTH + DAY_WIDTH / 2 - scrollLeft
              if (x < -80 || x > (wrapRef.current?.clientWidth || 9999) + 80) return null
              return (
                <span key={m.id}
                  onClick={e => { e.stopPropagation(); setEditingMilestone({ id:m.id, x:e.clientX, y:e.clientY }); setEditTitle(m.title); setEditDate(m.date) }}
                  title={`${m.title} — ${m.date}`}
                  style={{ position:'absolute', left:x, top:'50%', transform:'translate(-50%,-50%)', display:'inline-flex', alignItems:'center', gap:4, background:'#fff1f2', border:'1px solid #fecdd3', borderRadius:99, padding:'2px 9px', fontSize:11, fontWeight:700, color:'#be123c', cursor:'pointer', whiteSpace:'nowrap', zIndex:2 }}
                  onMouseEnter={e => e.currentTarget.style.background='#ffe4e6'}
                  onMouseLeave={e => e.currentTarget.style.background='#fff1f2'}
                >🚩 {m.title}</span>
              )
            })}
          </div>
          {milestoneForm && (
            <div onClick={e => e.stopPropagation()} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', display:'flex', gap:6, alignItems:'center', background:'#fff', zIndex:4 }}>
              <input placeholder="Title" value={mTitle} onChange={e => setMTitle(e.target.value)} autoFocus style={{ width:130, padding:'5px 8px', borderRadius:7, border:'1px solid var(--line)', fontSize:12 }} />
              <input type="date" value={mDate} onChange={e => setMDate(e.target.value)} style={{ padding:'5px 8px', borderRadius:7, border:'1px solid var(--line)', fontSize:12, width:128 }} />
              <button className="btn btn-primary" style={{ padding:'5px 10px', fontSize:12 }} onClick={() => { if (!mTitle.trim() || !mDate) return; onAddMilestone(mTitle.trim(), mDate); setMTitle(''); setMDate(''); setMilestoneForm(false) }}>Add</button>
              <button className="btn btn-secondary" style={{ padding:'5px 8px', fontSize:12 }} onClick={() => { setMilestoneForm(false); setMTitle(''); setMDate('') }}>✕</button>
            </div>
          )}
        </div>

        {/* Calendar scroll area */}
        <div ref={wrapRef} style={{ flex:1, minHeight:0, overflowX:'auto', overflowY:'auto', paddingBottom:24 }}>
          <div style={{ width:totalWidth, position:'relative' }}>

            {/* Header */}
            <div style={{ display:'grid', gridTemplateColumns:`${LABEL_WIDTH}px repeat(${viewDays}, ${DAY_WIDTH}px)`, background:'var(--soft)', borderBottom:'1px solid var(--line)', position:'sticky', top:0, zIndex:120 }}>
              <div style={{ padding:'8px 12px', borderRight:'1px solid var(--line)', fontSize:11, fontWeight:700, color:'var(--muted)', position:'sticky', left:0, zIndex:140, background:'var(--soft)', letterSpacing:'0.04em', textTransform:'uppercase' }}>Channel</div>
              {days.map((day, i) => {
                const today   = isToday(day)
                const weekend = isWeekend(day)
                return (
                  <div key={i} style={{ padding:'5px 2px', borderRight:'1px solid var(--line)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', background: today ? '#dcfce7' : weekend ? '#ededf2' : undefined }}>
                    <span style={{ fontSize:10, fontWeight:600, color: today ? '#16a34a' : weekend ? '#8890a8' : 'var(--muted)', whiteSpace:'nowrap' }}>
                      {day.toLocaleDateString('en-GB', { month:'short' })} {day.getDate()}
                    </span>
                    <span style={{ fontSize:10, fontWeight:700, color: today ? '#16a34a' : weekend ? '#8890a8' : 'var(--muted)', textTransform:'uppercase', letterSpacing:'0.03em' }}>
                      {day.toLocaleDateString('en-GB', { weekday:'short' })}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Lanes */}
            {filteredChannels.map(ch => {
              const items     = layoutItems(visible.filter(it => it.channel === ch.id))
              const maxRow    = items.reduce((m, it) => Math.max(m, it.layoutRow || 0), 0)
              const rowHeight = Math.max(90, 16 + (maxRow + 1) * 62)
              const isOver    = overChannelId === ch.id && !!activeItem

              return (
                <LaneDropZone key={ch.id} channelId={ch.id}>
                  <div style={{ display:'grid', gridTemplateColumns:`${LABEL_WIDTH}px 1fr`, minHeight:rowHeight, borderBottom:'1px solid var(--line)' }}>
                    <div style={{ position:'sticky', left:0, zIndex:50, background: isOver ? `${ch.color}10` : '#fff', borderRight:'1px solid var(--line)', padding:'12px 14px', display:'flex', flexDirection:'column', justifyContent:'center', gap:3, transition:'background 0.15s' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                        <span style={{ width:8, height:8, borderRadius:'50%', background:ch.color, flexShrink:0, display:'inline-block' }} />
                        <span style={{ fontSize:13, fontWeight:700, color:'var(--ink)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ch.name}</span>
                      </div>
                      <span style={{ fontSize:11, color:'var(--muted)', paddingLeft:15 }}>{items.length} activities</span>
                    </div>
                    <div
                      style={{ position:'relative', minHeight:rowHeight, backgroundImage:`repeating-linear-gradient(to right,transparent 0,transparent ${DAY_WIDTH-1}px,var(--line) ${DAY_WIDTH-1}px,var(--line) ${DAY_WIDTH}px)`, backgroundColor: isOver ? `${ch.color}0c` : undefined, outline: isOver ? `2px dashed ${ch.color}60` : 'none', outlineOffset:-2, transition:'background-color 0.1s', cursor:'crosshair' }}
                      onClick={e => handleLaneClick(e, ch.id)}
                    >
                      {days.map((day, idx) =>
                        isToday(day)
                          ? <div key={idx} style={{ position:'absolute', top:0, height:'100%', width:DAY_WIDTH, left:idx*DAY_WIDTH, background:'#dcfce7', opacity:0.5, pointerEvents:'none', zIndex:0 }} />
                          : isWeekend(day)
                          ? <div key={idx} style={{ position:'absolute', top:0, height:'100%', width:DAY_WIDTH, left:idx*DAY_WIDTH, background:'#eeeef3', pointerEvents:'none', zIndex:0 }} />
                          : null
                      )}
                      {milestones.map(m => {
                        const offset = Math.round((parseDate(m.date) - viewStart) / 86400000)
                        if (offset < 0 || offset >= viewDays) return null
                        return (
                          <DraggableMilestoneLine key={m.id} milestone={m}
                            lineLeft={offset * DAY_WIDTH + DAY_WIDTH / 2}
                            onEdit={e => { e.stopPropagation(); setEditingMilestone({ id:m.id, x:e.clientX, y:e.clientY }); setEditTitle(m.title); setEditDate(m.date) }}
                          />
                        )
                      })}
                      {items.map(item => (
                        <DraggableItem key={item.id} item={item} channels={channels} calendars={calendars} viewStart={viewStart} selectedId={selectedId} onSelect={onSelectCampaign} onResize={handleResize} />
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
          <div style={{ width:6, height:'100vh', background:'rgba(190,18,60,0.5)', borderRadius:3, cursor:'grabbing', position:'fixed', top:0 }} />
        ) : null}
      </DragOverlay>

      {/* Milestone edit popover */}
      {editingMilestone && (
        <>
          <div onClick={() => setEditingMilestone(null)} style={{ position:'fixed', inset:0, zIndex:1000 }} />
          <div style={{ position:'fixed', left:Math.min(editingMilestone.x, window.innerWidth-260), top:editingMilestone.y-10, transform:'translateY(-100%)', zIndex:1001, background:'#fff', border:'1px solid var(--line)', borderRadius:12, padding:16, width:240, boxShadow:'0 8px 32px rgba(0,0,0,0.12)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <strong style={{ fontSize:13 }}>Edit milestone</strong>
              <button onClick={() => setEditingMilestone(null)} className="btn-mini">✕</button>
            </div>
            <div style={{ marginBottom:10 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--muted)', textTransform:'uppercase', marginBottom:5 }}>Title</div>
              <input value={editTitle} onChange={e => setEditTitle(e.target.value)} />
            </div>
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--muted)', textTransform:'uppercase', marginBottom:5 }}>Date</div>
              <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} />
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              <button className="btn btn-primary" style={{ fontSize:13 }} onClick={() => { if (!editTitle.trim() || !editDate) return; onUpdateMilestone(editingMilestone.id, editTitle.trim(), editDate); setEditingMilestone(null) }}>Save</button>
              <button className="btn btn-danger" style={{ fontSize:13 }} onClick={() => { onDeleteMilestone(editingMilestone.id); setEditingMilestone(null) }}>Delete</button>
            </div>
          </div>
        </>
      )}
    </DndContext>
  )
}
