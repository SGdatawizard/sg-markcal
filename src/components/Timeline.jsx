import { useRef, useEffect, useState } from 'react'
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  pointerWithin, useDraggable, useDroppable,
} from '@dnd-kit/core'
import { DAY_WIDTH, LABEL_WIDTH, VIEW_DAYS, CATEGORY_ICONS, STATUS_ICONS } from '../constants'
import { addDays, parseDate, daysBetween, isToday, isWeekend } from '../dateUtils'

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
    (categoryFilter === 'all' || (i.category || 'Uncategorised') === categoryFilter) &&
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
`

function ActivityBlock({ item, channels, selectedId, isDragging, isOverlay }) {
  const ch = channels.find(c => c.id === item.channel) || channels[0]
  const length    = daysBetween(item.start, item.end)
  const isDone    = item.status === 'Done'
  const isBlocked = item.status === 'Blocked'
  const colour    = isDone ? '#cbd5e1' : isBlocked ? '#ef4444' : ch?.color || '#94a3b8'
  const bg        = isDone ? '#f3f4f6' : isBlocked ? '#fff1f2' : '#fff'
  const textCol   = isDone ? '#6b7280' : '#172033'
  const isShort   = length <= 2

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
        background: bg,
        '--hover-w': hoverW + 'px',
        zIndex: isDragging ? 0 : 2,
      }}
    >
      <div style={{ position:'absolute', left:0, top:0, width:6, height:'100%', background:colour, borderRadius:'12px 0 0 12px', opacity:0.9 }} />
      {!isShort ? (
        <div style={{ position:'relative', zIndex:5, width:'100%', minWidth:0 }}>
          <div style={{ fontWeight:900, lineHeight:1.15, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
            {item.title || 'Untitled activity'}
          </div>
          <div className="activity-meta" style={{ color:'var(--muted)', fontSize:11, marginTop:3, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
            {item.owner} • {item.status} • {CATEGORY_ICONS[item.category] || '📦'} {item.category} • {item.priority}
          </div>
        </div>
      ) : (
        <div style={{ position:'relative', zIndex:5, width:'100%', minWidth:0 }}>
          <div className="short-title" style={{ fontWeight:900, lineHeight:1.15, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
            {item.title || 'Untitled activity'}
          </div>
          <div className="activity-meta short-meta" style={{ color:'var(--muted)', fontSize:11, marginTop:3, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', display:'none' }}>
            {item.owner} • {item.status} • {CATEGORY_ICONS[item.category] || '📦'} {item.category} • {item.priority}
          </div>
        </div>
      )}
      <span style={{ position:'absolute', right:10, bottom:8, width:18, height:18, borderRadius:'50%', display:'grid', placeItems:'center', fontSize:12, background:'var(--soft)', zIndex:6 }}>
        {STATUS_ICONS[item.status] || '📌'}
      </span>
    </div>
  )
}

function DraggableItem({ item, channels, viewStart, viewDays, selectedId, onSelect }) {
  const offset  = Math.round((parseDate(item.start) - viewStart) / 86400000)
  const leftPx  = Math.max(0, offset) * DAY_WIDTH
  const top     = 12 + (item.layoutRow || 0) * 68
  const widthPx = Math.max(DAY_WIDTH, daysBetween(item.start, item.end) * DAY_WIDTH)

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: String(item.id),
    data: { item },
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="draggable-item"
      onClick={e => { e.stopPropagation(); if (!isDragging) onSelect(item.id) }}
      style={{
        position: 'absolute',
        left: leftPx,
        top,
        width: widthPx,
        height: 62,
        touchAction: 'none',
        zIndex: isDragging ? 0 : 2,
      }}
    >
      <ActivityBlock item={item} channels={channels} selectedId={selectedId} isDragging={isDragging} />
    </div>
  )
}

function LaneDropZone({ channelId, children }) {
  const { setNodeRef } = useDroppable({ id: `lane-${channelId}`, data: { channelId } })
  return <div ref={setNodeRef}>{children}</div>
}

export default function Timeline({ channels, campaigns, viewStart, setViewStart, channelFilter, categoryFilter, tierFilter, search, selectedId, onSelectCampaign, onAddAtDate, onMoveCampaign, scrollToToday, milestones = [], onAddMilestone, onDeleteMilestone }) {
  const wrapRef    = useRef(null)
  const scrollLock = useRef(false)
  const scrollInit = useRef(false)
  const [activeItem,    setActiveItem]    = useState(null)
  const [overChannelId, setOverChannelId] = useState(null)
  const [milestoneForm, setMilestoneForm] = useState(false)
  const [mTitle, setMTitle] = useState('')
  const [mDate,  setMDate]  = useState('')

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

  useEffect(() => {
    if (!wrapRef.current || scrollInit.current) return
    scrollInit.current = true
    requestAnimationFrame(() => { if (wrapRef.current) wrapRef.current.scrollLeft = 30 * DAY_WIDTH })
  }, [])

  useEffect(() => {
    if (!scrollToToday || !wrapRef.current) return
    const wrap = wrapRef.current
    const todayOffset = Math.round((new Date().setHours(0,0,0,0) - new Date(viewStart).setHours(0,0,0,0)) / 86400000)
    wrap.scrollLeft = Math.max(0, todayOffset * DAY_WIDTH - DAY_WIDTH * 2)
  }, [scrollToToday])

  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    function onScroll() {
      const distFromRight = wrap.scrollWidth - wrap.scrollLeft - wrap.clientWidth
      if (distFromRight < DAY_WIDTH * 30) {
        // Grow by 180 days at the end — simple append, no scroll jump
        setViewDays(viewDaysRef.current + 180)
      }
    }
    wrap.addEventListener('scroll', onScroll, { passive: true })
    return () => wrap.removeEventListener('scroll', onScroll)
  }, [])

  function handleDragStart({ active }) {
    setActiveItem(active.data.current.item)
    setOverChannelId(active.data.current.item.channel)
  }

  function handleDragOver({ over }) {
    const channelId = over?.data?.current?.channelId
    if (channelId) setOverChannelId(channelId)
  }

  function handleDragEnd({ active, delta, over }) {
    setActiveItem(null)
    if (!active) return
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
        <div style={{ padding:'8px 24px 8px 16px', background:'#fff', borderBottom:'1px solid var(--line)', display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', flexShrink:0 }}>
          <span style={{ fontSize:12, fontWeight:900, color:'#8c93a3', textTransform:'uppercase' }}>Milestones</span>
          {milestoneForm ? (
            <div style={{ display:'flex', gap:6, alignItems:'center' }}>
              <input placeholder="Milestone title" value={mTitle} onChange={e => setMTitle(e.target.value)} style={{ width:160, padding:'5px 10px', borderRadius:10, border:'1px solid #dfe3ec', fontSize:13 }} />
              <input type="date" value={mDate} onChange={e => setMDate(e.target.value)} style={{ padding:'5px 10px', borderRadius:10, border:'1px solid #dfe3ec', fontSize:13 }} />
              <button className="btn btn-primary" style={{ padding:'5px 12px', fontSize:12 }} onClick={() => {
                if (!mTitle.trim() || !mDate) return
                onAddMilestone(mTitle.trim(), mDate)
                setMTitle(''); setMDate(''); setMilestoneForm(false)
              }}>Add</button>
              <button className="btn btn-secondary" style={{ padding:'5px 12px', fontSize:12 }} onClick={() => setMilestoneForm(false)}>Cancel</button>
            </div>
          ) : (
            <button className="btn btn-secondary" style={{ padding:'5px 12px', fontSize:12 }} onClick={() => setMilestoneForm(true)}>+ Add milestone</button>
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
                    {/* Milestone lines */}
                    {milestones.map(m => {
                      const offset = Math.round((parseDate(m.date) - viewStart) / 86400000)
                      if (offset < 0 || offset >= viewDays) return null
                      const lineLeft = offset * DAY_WIDTH + DAY_WIDTH / 2
                      return (
                        <div key={m.id} title={m.title} style={{ position:'absolute', top:0, left:lineLeft, width:2, height:'100%', background:'rgba(190,18,60,0.45)', zIndex:10, pointerEvents:'none' }} />
                      )
                    })}
                    {items.map(item => (
                      <DraggableItem key={item.id} item={item} channels={channels} viewStart={viewStart} viewDays={viewDays} selectedId={selectedId} onSelect={onSelectCampaign} />
                    ))}
                  </div>
                </div>
              </LaneDropZone>
            )
          })}
        </div>
      </div>
      </div>

      <DragOverlay dropAnimation={{ duration: 150, easing: 'ease' }}>
        {activeItem ? (
          <ActivityBlock item={activeItem} channels={channels} selectedId={null} isOverlay isDragging={false} />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
