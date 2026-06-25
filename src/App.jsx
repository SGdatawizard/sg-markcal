import { useState, useEffect, useRef } from 'react'
import './index.css'
import { sb, loadAll, loadCalendars, createCalendar, deleteCalendar, saveChannels, saveOwners, saveCampaigns, saveMilestones, subscribeToChanges } from './supabase'
import { addDays, startOfWeek, fmtDate } from './dateUtils'
import { CHANNEL_COLOURS } from './constants'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import Timeline from './components/Timeline'
import ActivityDrawer from './components/ActivityDrawer'
import SyncStatus from './components/SyncStatus'
import Dashboard from './components/Dashboard'

function ensureIds(items) {
  const seen = new Set()
  return (items || []).map((item, i) => {
    let id = item.id
    if (!id || seen.has(id)) id = Date.now() + i + Math.floor(Math.random() * 1e5)
    seen.add(id)
    return { ...item, id }
  })
}

const DEFAULT_CHANNELS = [
  { id: 'channel1', name: 'SEO',    color: '#7c3aed' },
  { id: 'channel2', name: 'PR',     color: '#0ea5e9' },
  { id: 'channel3', name: 'Events', color: '#10b981' },
]
const DEFAULT_OWNERS = ['Pierre', 'Maya', 'Alex', 'Sam']

export default function App() {
  const [page, setPage] = useState('planner')

  // ── Calendars ───────────────────────────────────────────────────────────────
  const [calendars,       setCalendars]       = useState([])
  const [activeCalendarId, setActiveCalendarId] = useState(null)

  // ── Per-calendar data ───────────────────────────────────────────────────────
  const [channels,   setChannels]   = useState(DEFAULT_CHANNELS)
  const [owners,     setOwners]     = useState(DEFAULT_OWNERS)
  const [campaigns,  setCampaigns]  = useState([])
  const [milestones, setMilestones] = useState([])
  const [loading,    setLoading]    = useState(true)

  const [viewStart,      setViewStart]      = useState(() => new Date(new Date().getFullYear(), 0, 1))
  const [channelFilter,  setChannelFilter]  = useState([])
  const [categoryFilter, setCategoryFilter] = useState([])
  const [tierFilter,     setTierFilter]     = useState('all')
  const [search,         setSearch]         = useState('')

  const [selectedId,    setSelectedId]    = useState(null)
  const [drawerOpen,    setDrawerOpen]    = useState(false)
  const [draftActivity, setDraftActivity] = useState(null)

  const [scrollToToday, setScrollToToday] = useState(0)
  const [sidebarOpen,      setSidebarOpen]      = useState(false)
  const [syncMsg,   setSyncMsg]   = useState('')
  const [syncError, setSyncError] = useState(false)
  const syncTimer  = useRef(null)
  const isSaving   = useRef(false)
  const undoStack  = useRef([])
  const realtimeSub = useRef(null)

  function showSync(msg, isError = false) {
    setSyncMsg(msg); setSyncError(isError)
    clearTimeout(syncTimer.current)
    syncTimer.current = setTimeout(() => setSyncMsg(''), 2200)
  }

  function snapshot(ch = channels, ow = owners, cam = campaigns) {
    undoStack.current.push(JSON.stringify({ channels: ch, owners: ow, campaigns: cam }))
    if (undoStack.current.length > 30) undoStack.current.shift()
  }

  async function saveAll(ch = channels, ow = owners, cam = campaigns, calId = activeCalendarId) {
    if (isSaving.current || !calId) return
    isSaving.current = true
    showSync('Saving…')
    try {
      await Promise.all([saveChannels(ch, calId), saveOwners(ow, calId), saveCampaigns(cam, calId)])
      showSync('Saved ✓')
    } catch (e) {
      showSync('Save failed', true); console.error(e)
    }
    isSaving.current = false
  }

  // ── Boot: load calendars first, then load active calendar data ──────────────
  useEffect(() => {
    async function boot() {
      showSync('Loading…')
      try {
        let cals = await loadCalendars()

        // If no calendars exist yet, create the default one and migrate existing data
        if (!cals.length) {
          const cal = await createCalendar('Main Calendar')
          cals = [cal]
        }

        setCalendars(cals)
        // Check URL hash for direct calendar link e.g. #calendar=<id>
        const hash = window.location.hash
        const hashCalId = hash.match(/^#calendar=(.+)$/)?.[1]
        const targetCal = hashCalId ? cals.find(c => c.id === hashCalId) : null
        const calId = targetCal ? targetCal.id : cals[0].id
        setActiveCalendarId(calId)
        await loadCalendarData(calId)
      } catch (e) {
        showSync('Load failed', true); console.error(e)
        setLoading(false)
      }
    }
    boot()
  }, [])

  async function loadCalendarData(calId, cal) {
    setLoading(true)
    // Unsubscribe from previous calendar's realtime
    if (realtimeSub.current) {
      realtimeSub.current.unsubscribe()
      realtimeSub.current = null
    }

    try {
      const { channels: ch, owners: ow, campaigns: cam, milestones: mil } = await loadAll(calId)
      let fCh  = ch  || []
      let fOw  = ow  || []
      let fCam = cam ? ensureIds(cam) : []
      let fMil = mil || []

      // Seed defaults if this calendar is brand new and empty
      if (!ch && !ow && !cam) {
        fCh = DEFAULT_CHANNELS
        fOw = DEFAULT_OWNERS
        await saveChannels(fCh, calId)
        await saveOwners(fOw, calId)
      }

      setChannels(fCh)
      setOwners(fOw)
      setCampaigns(fCam)
      setMilestones(fMil)
      setChannelFilter([])
      setSelectedId(null)
      setDrawerOpen(false)
      setDraftActivity(null)
      undoStack.current = []
      showSync('Loaded ✓')
    } catch (e) {
      showSync('Load failed', true); console.error(e)
    }

    // Subscribe to this calendar's realtime changes
    realtimeSub.current = subscribeToChanges(
      calId,
      cam => setCampaigns(ensureIds(cam)),
      ch  => setChannels(ch),
      ow  => setOwners(ow),
      mil => setMilestones(mil),
    )

    setLoading(false)
  }

  async function switchCalendar(calId) {
    if (calId === activeCalendarId) return
    setActiveCalendarId(calId)
    await loadCalendarData(calId)
  }

  async function handleDeleteCalendar(calId) {
    if (calendars.length <= 1) { alert('You need at least one calendar.'); return }
    if (!confirm('Delete this calendar and all its activities? This cannot be undone.')) return
    try {
      showSync('Deleting…')
      await deleteCalendar(calId)
      const remaining = calendars.filter(c => c.id !== calId)
      setCalendars(remaining)
      // Switch to another calendar if we deleted the active one
      if (calId === activeCalendarId) {
        const next = remaining[0]
        setActiveCalendarId(next.id)
        await loadCalendarData(next.id)
      }
      showSync('Deleted ✓')
    } catch (e) {
      showSync('Delete failed', true); console.error(e)
    }
  }

  async function handleCreateAndLinkCalendar(activityId, calendarName) {
    try {
      showSync('Creating planning calendar…')
      const cal = await createCalendar(calendarName)
      setCalendars(prev => [...prev, cal])
      // Link the calendar to the activity
      const next = campaigns.map(c => c.id === activityId ? { ...c, linked_calendar_id: cal.id } : c)
      setCampaigns(next)
      saveAll(channels, owners, next)
      showSync('Planning calendar created ✓')
    } catch (e) {
      showSync('Failed to create calendar', true); console.error(e)
    }
  }

  async function handleCreateCalendar(name, selectedChannelIds, allAvailableChannels) {
    try {
      showSync('Creating calendar…')
      const cal = await createCalendar(name)
      const newCalendars = [...calendars, cal]
      setCalendars(newCalendars)

      // Pre-populate with selected channels (fresh copies with new IDs)
      const preChannels = selectedChannelIds.length > 0
        ? allAvailableChannels
            .filter(ch => selectedChannelIds.includes(ch.id))
            .map((ch, i) => ({ ...ch, id: `${ch.id}_${cal.id}_${i}` }))
        : []

      if (preChannels.length) {
        await saveChannels(preChannels, cal.id)
      }

      setActiveCalendarId(cal.id)
      await loadCalendarData(cal.id)
      showSync('Calendar created ✓')
    } catch (e) {
      showSync('Failed to create calendar', true); console.error(e)
    }
  }

  async function undoLast() {
    const last = undoStack.current.pop()
    if (!last) { alert('Nothing to undo yet.'); return }
    const s = JSON.parse(last)
    setChannels(s.channels); setOwners(s.owners); setCampaigns(s.campaigns)
    await saveAll(s.channels, s.owners, s.campaigns)
  }

  // ── Channel actions ─────────────────────────────────────────────────────────
  function addChannel(name) {
    snapshot()
    const c = { id: 'channel_' + Date.now(), name, color: CHANNEL_COLOURS[channels.length % CHANNEL_COLOURS.length] }
    const next = [...channels, c]
    setChannels(next); setChannelFilter([c.id])
    saveAll(next, owners, campaigns)
  }
  function renameChannel(id, name) {
    snapshot()
    const next = channels.map(c => c.id === id ? { ...c, name } : c)
    setChannels(next); saveAll(next, owners, campaigns)
  }
  function changeChannelColor(id, color) {
    snapshot()
    const next = channels.map(c => c.id === id ? { ...c, color } : c)
    setChannels(next); saveAll(next, owners, campaigns)
  }
  function deleteChannel(id) {
    if (channels.length <= 1) { alert('You need at least one channel.'); return }
    snapshot()
    const fallback = channels.find(c => c.id !== id).id
    const nextCh  = channels.filter(c => c.id !== id)
    const nextCam = campaigns.map(c => c.channel === id ? { ...c, channel: fallback } : c)
    setChannels(nextCh); setCampaigns(nextCam)
    if (channelFilter.includes(id)) setChannelFilter([])
    saveAll(nextCh, owners, nextCam)
  }
  function moveChannel(id, dir) {
    const i = channels.findIndex(c => c.id === id), j = i + dir
    if (i < 0 || j < 0 || j >= channels.length) return
    snapshot()
    const next = [...channels]; const [item] = next.splice(i, 1); next.splice(j, 0, item)
    setChannels(next); saveAll(next, owners, campaigns)
  }

  // ── Owner actions ───────────────────────────────────────────────────────────
  function addOwner(name) {
    if (owners.some(o => o.toLowerCase() === name.toLowerCase())) { alert('Team member already exists.'); return }
    snapshot()
    const next = [...owners, name]; setOwners(next); saveAll(channels, next, campaigns)
  }
  function renameOwner(i, name) {
    snapshot()
    const old = owners[i]
    const nextOw  = owners.map((o, idx) => idx === i ? name : o)
    const nextCam = campaigns.map(c => c.owner === old ? { ...c, owner: name } : c)
    setOwners(nextOw); setCampaigns(nextCam); saveAll(channels, nextOw, nextCam)
  }
  function deleteOwner(i) {
    if (owners.length <= 1) { alert('You need at least one team member.'); return }
    snapshot()
    const old = owners[i], fallback = owners.find((_, idx) => idx !== i)
    const nextOw  = owners.filter((_, idx) => idx !== i)
    const nextCam = campaigns.map(c => c.owner === old ? { ...c, owner: fallback } : c)
    setOwners(nextOw); setCampaigns(nextCam); saveAll(channels, nextOw, nextCam)
  }

  // ── Campaign actions ────────────────────────────────────────────────────────
  function updateCampaign(id, fields) {
    snapshot()
    const next = campaigns.map(c => c.id === id ? { ...c, ...fields } : c)
    setCampaigns(next); saveAll(channels, owners, next)
  }
  function moveCampaign(id, newStart, newEnd, newChannel) {
    snapshot()
    const next = campaigns.map(c =>
      c.id === id ? { ...c, start: fmtDate(newStart), end: fmtDate(newEnd), channel: newChannel } : c
    )
    setCampaigns(next); saveAll(channels, owners, next)
  }
  function deleteCampaign(id) {
    snapshot()
    const next = campaigns.filter(c => c.id !== id)
    setCampaigns(next)
    setSelectedId(null)
    setDrawerOpen(false)
    // Delete directly by ID — avoids stale closure issue with saveAll
    sb.from('campaigns').delete().eq('id', id).then(() => showSync('Saved ✓')).catch(() => showSync('Save failed', true))
  }
  function duplicateCampaign(id) {
    const item = campaigns.find(c => c.id === id); if (!item) return
    snapshot()
    const copy = { ...item, id: Date.now() + Math.floor(Math.random() * 1e5), title: item.title + ' copy', start: fmtDate(addDays(item.start, 1)), end: fmtDate(addDays(item.end, 1)) }
    const next = [...campaigns, copy]
    setCampaigns(next); setSelectedId(copy.id); saveAll(channels, owners, next)
  }
  function createActivity(draft) {
    snapshot()
    const { recurrence = 'None', recurrenceCount = 1, ...base } = draft
    const count = Math.max(1, Number(recurrenceCount))
    const created = []
    const batch = Date.now() + Math.floor(Math.random() * 1e5)
    for (let i = 0; i < count; i++) {
      let offset = 0
      if (recurrence === 'Weekly')  offset = i * 7
      if (recurrence === 'Monthly') offset = i * 30
      if (recurrence === 'Yearly')  offset = i * 365
      created.push({ ...base, id: batch + i, start: fmtDate(addDays(base.start, offset)), end: fmtDate(addDays(base.end, offset)), title: i === 0 ? base.title : `${base.title} ${i + 1}` })
    }
    const next = [...campaigns, ...created]
    setCampaigns(next); setSelectedId(created[0].id); setDraftActivity(null); setDrawerOpen(false)
    saveAll(channels, owners, next)
  }

  // ── Milestone actions ───────────────────────────────────────────────────────
  function addMilestone(title, date) {
    const m = { id: Date.now(), title, date }
    const next = [...milestones, m]
    setMilestones(next); saveMilestones(next, activeCalendarId)
  }
  function updateMilestone(id, title, date) {
    const next = milestones.map(m => m.id === id ? { ...m, title, date } : m)
    setMilestones(next); saveMilestones(next, activeCalendarId)
  }
  function deleteMilestone(id) {
    const next = milestones.filter(m => m.id !== id)
    setMilestones(next); saveMilestones(next, activeCalendarId)
  }

  function addActivityAtDate(startDate, channelId) {
    const ch = channelId || (channelFilter.length === 0 ? channels[0]?.id : channelFilter[0])
    const s = startDate || new Date()
    setDraftActivity({ id: Date.now(), title: '', channel: ch, owner: owners[0] || 'Team', status: 'Planned', priority: 'Tier 1', category: 'Uncategorised', start: fmtDate(s), end: fmtDate(s), notes: '', attachments: [], recurrence: 'None', recurrenceCount: 1 })
    setDrawerOpen(true); setSelectedId(null)
  }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', fontSize:16, color:'#70798b' }}>
      Loading Campaign Flow…
    </div>
  )

  if (page === 'dashboard') return <Dashboard onNavigate={setPage} />

  const selectedCampaign = draftActivity || campaigns.find(c => c.id === selectedId) || null
  const activeCalendar = calendars.find(c => c.id === activeCalendarId)

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden' }}>
      <Sidebar
        channels={channels} owners={owners} campaigns={campaigns}
        channelFilter={channelFilter} onFilterChange={setChannelFilter}
        onAddChannel={addChannel} onRenameChannel={renameChannel}
        onColorChange={changeChannelColor} onDeleteChannel={deleteChannel}
        onMoveChannel={moveChannel} onAddOwner={addOwner}
        onRenameOwner={renameOwner} onDeleteOwner={deleteOwner}
        isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)}
        onNavigate={setPage}
        calendars={calendars}
        activeCalendarId={activeCalendarId}
        onSwitchCalendar={switchCalendar}
        onCreateCalendar={handleCreateCalendar}
        onDeleteCalendar={handleDeleteCalendar}
      />
      <div style={{ flex:1, minWidth:0, height:'100vh', display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <Topbar
          search={search} onSearchChange={setSearch}
          channels={channels}
          channelFilter={channelFilter} onChannelChange={setChannelFilter}
          categoryFilter={categoryFilter} onCategoryChange={setCategoryFilter}
          tierFilter={tierFilter} onTierChange={setTierFilter}
          drawerOpen={drawerOpen} onToggleDrawer={() => setDrawerOpen(v => !v)}
          onUndo={undoLast} onPrev={() => setViewStart(d => addDays(d, -7))}
          onNext={() => setViewStart(d => addDays(d, 7))}
          onToday={() => { setViewStart(addDays(startOfWeek(new Date()), -30)); setScrollToToday(n => n + 1) }}
          onAddActivity={() => addActivityAtDate()}
          onOpenSidebar={() => setSidebarOpen(true)}
          calendarName={activeCalendar?.name}
        />
        <div style={{ flex:1, minHeight:0, display:'flex', overflow:'hidden' }}>
          <Timeline
            channels={channels} campaigns={campaigns} calendars={calendars}
            viewStart={viewStart} setViewStart={setViewStart}
            channelFilter={channelFilter} categoryFilter={categoryFilter}
            tierFilter={tierFilter} search={search} selectedId={selectedId}
            onSelectCampaign={(id) => { setSelectedId(id); setDraftActivity(null); setDrawerOpen(true) }}
            onAddAtDate={addActivityAtDate}
            onMoveCampaign={moveCampaign}
            onUpdateCampaign={updateCampaign}
            scrollToToday={scrollToToday}
            milestones={milestones}
            onAddMilestone={addMilestone}
            onUpdateMilestone={updateMilestone}
            onDeleteMilestone={deleteMilestone}
          />
          {drawerOpen && selectedCampaign && (
            <ActivityDrawer
              activity={selectedCampaign} isDraft={!!draftActivity}
              channels={channels} owners={owners} calendars={calendars}
              onUpdate={(fields) => updateCampaign(selectedId, fields)}
              onUpdateDraft={(fields) => setDraftActivity(d => ({ ...d, ...fields }))}
              onCreate={createActivity}
              onDelete={() => deleteCampaign(selectedId)}
              onDuplicate={() => duplicateCampaign(selectedId)}
              onClose={() => { setDrawerOpen(false); setDraftActivity(null) }}
              onCreateAndLinkCalendar={handleCreateAndLinkCalendar}
            />
          )}
        </div>
      </div>
      <SyncStatus msg={syncMsg} isError={syncError} />
    </div>
  )
}
