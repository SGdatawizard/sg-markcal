import { useState, useEffect, useRef } from 'react'
import './index.css'
import { loadAll, saveChannels, saveOwners, saveCampaigns, subscribeToChanges } from './supabase'
import { addDays, startOfWeek, fmtDate } from './dateUtils'
import { CHANNEL_COLOURS } from './constants'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import Timeline from './components/Timeline'
import ActivityDrawer from './components/ActivityDrawer'
import SyncStatus from './components/SyncStatus'

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
  const [channels,  setChannels]  = useState(DEFAULT_CHANNELS)
  const [owners,    setOwners]    = useState(DEFAULT_OWNERS)
  const [campaigns, setCampaigns] = useState([])
  const [loading,   setLoading]   = useState(true)

  const [viewStart,      setViewStart]      = useState(() => addDays(startOfWeek(new Date()), -30))
  const [channelFilter,  setChannelFilter]  = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [tierFilter,     setTierFilter]     = useState('all')
  const [search,         setSearch]         = useState('')

  const [selectedId,    setSelectedId]    = useState(null)
  const [drawerOpen,    setDrawerOpen]    = useState(false)
  const [draftActivity, setDraftActivity] = useState(null)

  const [syncMsg,   setSyncMsg]   = useState('')
  const [syncError, setSyncError] = useState(false)
  const syncTimer = useRef(null)
  const isSaving  = useRef(false)
  const undoStack = useRef([])

  function showSync(msg, isError = false) {
    setSyncMsg(msg); setSyncError(isError)
    clearTimeout(syncTimer.current)
    syncTimer.current = setTimeout(() => setSyncMsg(''), 2200)
  }

  function snapshot(ch = channels, ow = owners, cam = campaigns) {
    undoStack.current.push(JSON.stringify({ channels: ch, owners: ow, campaigns: cam }))
    if (undoStack.current.length > 30) undoStack.current.shift()
  }

  async function saveAll(ch = channels, ow = owners, cam = campaigns) {
    if (isSaving.current) return
    isSaving.current = true
    showSync('Saving…')
    try {
      await Promise.all([saveChannels(ch), saveOwners(ow), saveCampaigns(cam)])
      showSync('Saved ✓')
    } catch (e) {
      showSync('Save failed', true); console.error(e)
    }
    isSaving.current = false
  }

  // Boot
  useEffect(() => {
    async function boot() {
      showSync('Loading…')
      try {
        const { channels: ch, owners: ow, campaigns: cam } = await loadAll()
        let fCh  = ch  || DEFAULT_CHANNELS
        let fOw  = ow  || DEFAULT_OWNERS
        let fCam = cam ? ensureIds(cam) : []
        if (!ch)  await saveChannels(fCh)
        if (!ow)  await saveOwners(fOw)
        if (!cam) {
          fCam = ensureIds([
            { id: 1, title: 'Example campaign', channel: fCh[0].id, owner: fOw[0], status: 'Planned', priority: 'Tier 1', category: 'Uncategorised', start: fmtDate(addDays(new Date(), 1)), end: fmtDate(addDays(new Date(), 8)), notes: 'Drag this block to a different date or channel.', attachments: [] },
            { id: 2, title: 'Example content sprint', channel: fCh[1]?.id || fCh[0].id, owner: fOw[1] || fOw[0], status: 'In progress', priority: 'Tier 2', category: 'Coins', start: fmtDate(addDays(new Date(), 5)), end: fmtDate(addDays(new Date(), 18)), notes: 'Add your own channels, team members and activities.', attachments: [] },
          ])
          await saveCampaigns(fCam)
        }
        setChannels(fCh); setOwners(fOw); setCampaigns(fCam)
        showSync('Loaded ✓')
      } catch (e) { showSync('Load failed', true); console.error(e) }
      setLoading(false)
    }
    boot()
  }, [])

  // Realtime
  useEffect(() => {
    const sub = subscribeToChanges(
      cam => setCampaigns(ensureIds(cam)),
      ch  => setChannels(ch),
      ow  => setOwners(ow),
    )
    return () => sub.unsubscribe()
  }, [])

  async function undoLast() {
    const last = undoStack.current.pop()
    if (!last) { alert('Nothing to undo yet.'); return }
    const s = JSON.parse(last)
    setChannels(s.channels); setOwners(s.owners); setCampaigns(s.campaigns)
    await saveAll(s.channels, s.owners, s.campaigns)
  }

  // Channel actions
  function addChannel(name) {
    snapshot()
    const c = { id: 'channel_' + Date.now(), name, color: CHANNEL_COLOURS[channels.length % CHANNEL_COLOURS.length] }
    const next = [...channels, c]
    setChannels(next); setChannelFilter(c.id)
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
    if (channelFilter === id) setChannelFilter('all')
    saveAll(nextCh, owners, nextCam)
  }
  function moveChannel(id, dir) {
    const i = channels.findIndex(c => c.id === id), j = i + dir
    if (i < 0 || j < 0 || j >= channels.length) return
    snapshot()
    const next = [...channels]; const [item] = next.splice(i, 1); next.splice(j, 0, item)
    setChannels(next); saveAll(next, owners, campaigns)
  }

  // Owner actions
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

  // Campaign actions
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
    setCampaigns(next); setSelectedId(null); setDrawerOpen(false)
    saveAll(channels, owners, next)
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
      if (recurrence === 'Weekly') offset = i * 7
      if (recurrence === 'Monthly') offset = i * 30
      created.push({ ...base, id: batch + i, start: fmtDate(addDays(base.start, offset)), end: fmtDate(addDays(base.end, offset)), title: i === 0 ? base.title : `${base.title} ${i + 1}` })
    }
    const next = [...campaigns, ...created]
    setCampaigns(next); setSelectedId(created[0].id); setDraftActivity(null); setDrawerOpen(false)
    saveAll(channels, owners, next)
  }

  function addActivityAtDate(startDate, channelId) {
    const ch = channelId || (channelFilter === 'all' ? channels[0]?.id : channelFilter)
    const s = startDate || new Date()
    setDraftActivity({ id: Date.now(), title: '', channel: ch, owner: owners[0] || 'Team', status: 'Planned', priority: 'Tier 1', category: 'Uncategorised', start: fmtDate(s), end: fmtDate(addDays(s, 5)), notes: '', attachments: [], recurrence: 'None', recurrenceCount: 1 })
    setDrawerOpen(true); setSelectedId(null)
  }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', fontSize:16, color:'#70798b' }}>
      Loading Campaign Flow…
    </div>
  )

  const selectedCampaign = draftActivity || campaigns.find(c => c.id === selectedId) || null

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden' }}>
      <Sidebar
        channels={channels} owners={owners} campaigns={campaigns}
        channelFilter={channelFilter} onFilterChange={setChannelFilter}
        onAddChannel={addChannel} onRenameChannel={renameChannel}
        onColorChange={changeChannelColor} onDeleteChannel={deleteChannel}
        onMoveChannel={moveChannel} onAddOwner={addOwner}
        onRenameOwner={renameOwner} onDeleteOwner={deleteOwner}
      />
      <div style={{ flex:1, minWidth:0, height:'100vh', display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <Topbar
          search={search} onSearchChange={setSearch}
          categoryFilter={categoryFilter} onCategoryChange={setCategoryFilter}
          tierFilter={tierFilter} onTierChange={setTierFilter}
          drawerOpen={drawerOpen} onToggleDrawer={() => setDrawerOpen(v => !v)}
          onUndo={undoLast} onPrev={() => setViewStart(d => addDays(d, -7))}
          onNext={() => setViewStart(d => addDays(d, 7))}
          onToday={() => setViewStart(addDays(startOfWeek(new Date()), -30))}
          onAddActivity={() => addActivityAtDate()}
        />
        <div style={{ flex:1, minHeight:0, display:'flex', overflow:'hidden' }}>
          <Timeline
            channels={channels} campaigns={campaigns}
            viewStart={viewStart} setViewStart={setViewStart}
            channelFilter={channelFilter} categoryFilter={categoryFilter}
            tierFilter={tierFilter} search={search} selectedId={selectedId}
            onSelectCampaign={(id) => { setSelectedId(id); setDraftActivity(null); setDrawerOpen(true) }}
            onAddAtDate={addActivityAtDate}
            onMoveCampaign={moveCampaign}
            onUpdateCampaign={updateCampaign}
          />
          {drawerOpen && selectedCampaign && (
            <ActivityDrawer
              activity={selectedCampaign} isDraft={!!draftActivity}
              channels={channels} owners={owners}
              onUpdate={(fields) => updateCampaign(selectedId, fields)}
              onUpdateDraft={(fields) => setDraftActivity(d => ({ ...d, ...fields }))}
              onCreate={createActivity}
              onDelete={() => deleteCampaign(selectedId)}
              onDuplicate={() => duplicateCampaign(selectedId)}
              onClose={() => { setDrawerOpen(false); setDraftActivity(null) }}
            />
          )}
        </div>
      </div>
      <SyncStatus msg={syncMsg} isError={syncError} />
    </div>
  )
}
