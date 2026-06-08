import { useState, useEffect, useRef } from 'react'
import { sb } from '../supabase'

// ── Chart placeholders ────────────────────────────────────────────────────────

function AreaChart({ color = '#7c3aed', data }) {
  const pts = data || [40,80,60,120,90,200,160,220,180,250,210,280]
  const max = Math.max(...pts) || 1
  const w = 300, h = 90
  const coords = pts.map((v,i) => `${(i/(pts.length-1))*w},${h-(v/max)*(h-4)}`)
  const line = coords.join(' ')
  const area = `${line} ${w},${h} 0,${h}`
  const gid = `g${color.replace(/[^a-z0-9]/gi,'')}`
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width:'100%', height:90 }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25"/>
          <stop offset="100%" stopColor={color} stopOpacity="0.02"/>
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${gid})`}/>
      <polyline points={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"/>
    </svg>
  )
}

function MultiLineChart({ lines }) {
  const w = 300, h = 90
  const all = lines.flatMap(l => l.data)
  const max = Math.max(...all) || 1
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width:'100%', height:90 }} preserveAspectRatio="none">
      {lines.map((line, i) => {
        const pts = line.data.map((v,j) => `${(j/(line.data.length-1))*w},${h-(v/max)*(h-4)}`).join(' ')
        return <polyline key={i} points={pts} fill="none" stroke={line.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
      })}
    </svg>
  )
}

function HBarChart({ data }) {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:5, marginTop:12 }}>
      {data.map((d,i) => (
        <div key={i} style={{ display:'grid', gridTemplateColumns:'80px 1fr 48px', gap:6, alignItems:'center' }}>
          <span style={{ fontSize:11, color:'#60697d', textAlign:'right', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{d.label}</span>
          <div style={{ background:'#f0f2f7', borderRadius:99, height:7, overflow:'hidden' }}>
            <div style={{ width:`${(d.value/max)*100}%`, height:'100%', background:'#7c3aed', borderRadius:99 }}/>
          </div>
          <span style={{ fontSize:11, fontWeight:700, color:'#172033' }}>{d.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  )
}

// ── Stat helpers ──────────────────────────────────────────────────────────────

function Trend({ pct, invert = false }) {
  if (pct === null || pct === undefined) return <span style={{ color:'#aaa', fontSize:12 }}>TBC</span>
  const up = pct >= 0
  const good = invert ? !up : up
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:3, fontSize:13, fontWeight:700, color: good ? '#16a34a' : '#dc2626' }}>
      {up ? '▲' : '▼'} {Math.abs(pct)}%
    </span>
  )
}

function BigStat({ label, value, trend, invert, color }) {
  return (
    <div style={{ textAlign:'center' }}>
      <div style={{ fontSize:48, fontWeight:900, lineHeight:1, color: color || '#172033' }}>{value ?? '—'}</div>
      <div style={{ fontSize:13, color:'#60697d', marginTop:4 }}>{label}</div>
      {trend !== undefined && <div style={{ marginTop:6 }}><Trend pct={trend} invert={invert}/></div>}
    </div>
  )
}

function SmallStat({ label, value, trend, invert, color }) {
  return (
    <div style={{ textAlign:'center' }}>
      <div style={{ fontSize:26, fontWeight:900, color: color || '#172033' }}>{value ?? '—'}</div>
      <div style={{ fontSize:11, color:'#60697d', marginTop:2 }}>{label}</div>
      {trend !== undefined && <div style={{ marginTop:4 }}><Trend pct={trend} invert={invert}/></div>}
    </div>
  )
}

function Card({ title, children, style, noPad }) {
  return (
    <div style={{ background:'#fff', border:'1px solid #e4e7ee', borderRadius:18, padding: noPad ? 0 : 20, overflow:'hidden', ...style }}>
      {title && <div style={{ fontSize:11, fontWeight:900, color:'#8c93a3', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:14, padding: noPad ? '20px 20px 0' : 0 }}>{title}</div>}
      {children}
    </div>
  )
}

// ── Placeholder data ──────────────────────────────────────────────────────────

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const CURRENT_YEAR = new Date().getFullYear()

const PLACEHOLDER = {
  pr: { placements:9, placementsTrend:-10, pressCoverage:6, pressTrend:0, thoughtLeadership:3, thoughtTrend:-25 },
  sov: {
    winner:'SGB', winnerPct:48,
    lines:[
      { label:'SGB',       color:'#7c3aed', data:[20,40,30,60,45,100,80,110,90,125,105,140] },
      { label:'Noonana',   color:'#0ea5e9', data:[10,20,15,30,22,50,40,55,45,62,52,70] },
      { label:'Spink',     color:'#10b981', data:[5,10,8,15,11,25,20,27,22,31,26,35] },
      { label:'Heritage',  color:'#f59e0b', data:[8,16,12,24,18,40,32,44,36,50,42,56] },
    ]
  },
  sos: {
    winner:'SGB', winnerPct:-11,
    lines:[
      { label:'SGB',     color:'#7c3aed', data:[60,62,58,65,60,70,65,72,68,75,70,78] },
      { label:'Noonans', color:'#0ea5e9', data:[30,28,32,25,30,20,25,18,22,15,20,12] },
      { label:'Spink',   color:'#10b981', data:[10,10,10,10,10,10,10,10,10,10,10,10] },
    ]
  },
  webSessions: {
    total:20760, totalTrend:-16,
    channels:[
      {label:'Organic',value:8200},{label:'Direct',value:4100},{label:'Referral',value:2800},
      {label:'Unassigned',value:2100},{label:'Paid Social',value:1500},{label:'Email',value:900},
      {label:'Organic Social',value:600},{label:'Paid Search',value:300},{label:'SMS',value:150},{label:'Display',value:110},
    ]
  },
  valuation:{ total:192, totalTrend:null, stamps:157, stampsTrend:22, coins:18, coinsTrend:-14, popC:17, popCTrend:13 },
  crm:{ contacts:'72k', contactsTrend:0, opens:'18.51%', opensTrend:-2, clicks:'1.91%', clicksTrend:-0.4, unsubs:'0%', unsubsTrend:0 },
  social:[
    {name:'Facebook', abbr:'FB',  value:'23,163', trend:0,    color:'#1877f2'},
    {name:'Instagram',abbr:'IG',  value:'28,314', trend:-0.1, color:'#e1306c'},
    {name:'TikTok',   abbr:'TT',  value:'386',    trend:-0.1, color:'#172033'},
    {name:'YouTube',  abbr:'YT',  value:'11,144', trend:1,    color:'#ff0000'},
    {name:'X',        abbr:'X',   value:'8,501',  trend:0,    color:'#172033'},
    {name:'LinkedIn', abbr:'IN',  value:'431',    trend:15,   color:'#0077b5'},
  ]
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export default function Dashboard({ onNavigate }) {
  const [mode,    setMode]   = useState('monthly')
  const [monthA,  setMonthA] = useState(new Date().getMonth())
  const [monthB,  setMonthB] = useState((new Date().getMonth() + 11) % 12)
  const [year,    setYear]   = useState(CURRENT_YEAR)
  const [comments, setComments] = useState('')
  const [commentsSaved, setCommentsSaved] = useState(true)
  const saveTimer = useRef(null)

  useEffect(() => {
    sb.from('dashboard_comments').select('*').eq('id', 1).single()
      .then(({ data }) => { if (data) setComments(data.content || '') })
      .catch(() => {})
  }, [])

  function handleComments(val) {
    setComments(val)
    setCommentsSaved(false)
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      try {
        await sb.from('dashboard_comments').upsert({ id: 1, content: val }, { onConflict: 'id' })
        setCommentsSaved(true)
      } catch {}
    }, 1500)
  }

  const d = PLACEHOLDER
  const periodLabel = mode === 'monthly' ? `${MONTHS[monthA]} ${year}` : mode === 'compare' ? `${MONTHS[monthA]} vs ${MONTHS[monthB]} ${year}` : `${year} — Full Year`

  return (
    <div style={{ minHeight:'100vh', background:'#f6f7fb', fontFamily:'Inter,system-ui,sans-serif', color:'#172033' }}>

      {/* ── Header ── */}
      <div style={{ background:'#fff', borderBottom:'1px solid #e4e7ee', padding:'0 28px', display:'flex', alignItems:'center', justifyContent:'space-between', height:62, flexShrink:0, gap:16, flexWrap:'wrap' }}>

        {/* Left: logo + back */}
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:'#151927', color:'#fff', display:'grid', placeItems:'center', fontWeight:900, fontSize:16, flexShrink:0 }}>M</div>
          <div>
            <div style={{ fontSize:11, color:'#8c93a3', lineHeight:1 }}>Marketing</div>
            <div style={{ fontWeight:900, fontSize:15, lineHeight:1.2 }}>Marketing Data</div>
          </div>
          <div style={{ width:1, height:28, background:'#e4e7ee', margin:'0 4px' }}/>
          <button onClick={() => onNavigate('planner')} style={{ border:'1px solid #e4e7ee', borderRadius:10, padding:'6px 14px', background:'#f6f7fb', fontSize:13, fontWeight:700, cursor:'pointer', color:'#60697d', display:'flex', alignItems:'center', gap:6 }}>
            ← Campaign Planner
          </button>
        </div>

        {/* Centre: mode tabs */}
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          {[['monthly','Monthly'],['compare','Compare'],['yearly','Full Year']].map(([val,label]) => (
            <button key={val} onClick={() => setMode(val)} style={{ border:'1px solid #e4e7ee', borderRadius:10, padding:'6px 14px', background: mode===val ? '#151927' : '#f6f7fb', color: mode===val ? '#fff' : '#60697d', fontSize:13, fontWeight:700, cursor:'pointer' }}>
              {label}
            </button>
          ))}
          <div style={{ width:1, height:24, background:'#e4e7ee', margin:'0 4px' }}/>
          {mode !== 'yearly' && (
            <select value={monthA} onChange={e => setMonthA(Number(e.target.value))} style={{ borderRadius:10, border:'1px solid #e4e7ee', padding:'6px 10px', fontSize:13, fontWeight:700, background:'#f6f7fb', cursor:'pointer' }}>
              {MONTHS.map((m,i) => <option key={i} value={i}>{m}</option>)}
            </select>
          )}
          {mode === 'compare' && (
            <>
              <span style={{ fontSize:13, color:'#8c93a3', fontWeight:700 }}>vs</span>
              <select value={monthB} onChange={e => setMonthB(Number(e.target.value))} style={{ borderRadius:10, border:'1px solid #e4e7ee', padding:'6px 10px', fontSize:13, fontWeight:700, background:'#f6f7fb', cursor:'pointer' }}>
                {MONTHS.map((m,i) => <option key={i} value={i}>{m}</option>)}
              </select>
            </>
          )}
          <select value={year} onChange={e => setYear(Number(e.target.value))} style={{ borderRadius:10, border:'1px solid #e4e7ee', padding:'6px 10px', fontSize:13, fontWeight:700, background:'#f6f7fb', cursor:'pointer' }}>
            {[CURRENT_YEAR-1, CURRENT_YEAR, CURRENT_YEAR+1].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {/* Right: period label */}
        <div style={{ fontSize:16, fontWeight:900, color:'#8c93a3', whiteSpace:'nowrap' }}>{periodLabel}</div>
      </div>

      {/* ── Grid ── */}
      <div style={{ padding:'20px 24px', display:'grid', gap:16, gridTemplateColumns:'repeat(4,1fr)' }}>

        {/* PR */}
        <Card title="PR">
          <BigStat label="Placements" value={d.pr.placements} trend={d.pr.placementsTrend} invert/>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginTop:18 }}>
            <SmallStat label="Press Coverage"     value={d.pr.pressCoverage}     trend={d.pr.pressTrend}   color="#16a34a"/>
            <SmallStat label="Thought Leadership"  value={d.pr.thoughtLeadership} trend={d.pr.thoughtTrend} invert color="#dc2626"/>
          </div>
        </Card>

        {/* Share of Voice */}
        <Card title="Share of Voice">
          <AreaChart color="#7c3aed" data={d.sov.lines[0].data}/>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:8, flexWrap:'wrap', gap:6 }}>
            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              {d.sov.lines.map(l => (
                <span key={l.label} style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, color:'#60697d' }}>
                  <span style={{ width:8, height:8, borderRadius:'50%', background:l.color, display:'inline-block'}}/>
                  {l.label}
                </span>
              ))}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ fontSize:13, fontWeight:700 }}>{d.sov.winner}</span>
              <Trend pct={d.sov.winnerPct}/>
            </div>
          </div>
        </Card>

        {/* Share of Search */}
        <Card title="Share of Search">
          <MultiLineChart lines={d.sos.lines}/>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:8, flexWrap:'wrap', gap:6 }}>
            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              {d.sos.lines.map(l => (
                <span key={l.label} style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, color:'#60697d' }}>
                  <span style={{ width:8, height:8, borderRadius:'50%', background:l.color, display:'inline-block'}}/>
                  {l.label}
                </span>
              ))}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ fontSize:13, fontWeight:700 }}>{d.sos.winner}</span>
              <Trend pct={d.sos.winnerPct} invert/>
            </div>
          </div>
        </Card>

        {/* Comments — spans 2 rows */}
        <Card title="Comments" style={{ gridRow:'1 / 3' }}>
          <textarea
            value={comments}
            onChange={e => handleComments(e.target.value)}
            placeholder="Add your summary, key highlights, actions and next steps here…"
            style={{ width:'100%', minHeight:320, border:'1px solid #e4e7ee', borderRadius:12, padding:12, fontSize:13, lineHeight:1.65, fontFamily:'inherit', color:'#172033', resize:'vertical', outline:'none', boxSizing:'border-box' }}
          />
          <div style={{ fontSize:11, color: commentsSaved ? '#16a34a' : '#f59e0b', marginTop:8, fontWeight:700 }}>
            {commentsSaved ? '✓ Saved' : 'Saving…'}
          </div>
        </Card>

        {/* Web Sessions */}
        <Card title="Web Sessions">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <div>
              <div style={{ fontSize:32, fontWeight:900 }}>{d.webSessions.total.toLocaleString()}</div>
              <Trend pct={d.webSessions.totalTrend} invert/>
            </div>
          </div>
          <HBarChart data={d.webSessions.channels}/>
        </Card>

        {/* Valuation Enquiries */}
        <Card title="Valuation Enquiries">
          <BigStat label="Total Enquiries" value={d.valuation.total} trend={d.valuation.totalTrend}/>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginTop:18 }}>
            <SmallStat label="Stamps" value={d.valuation.stamps} trend={d.valuation.stampsTrend} color="#16a34a"/>
            <SmallStat label="Coins"  value={d.valuation.coins}  trend={d.valuation.coinsTrend}  invert color="#dc2626"/>
            <SmallStat label="Pop.C"  value={d.valuation.popC}   trend={d.valuation.popCTrend}   color="#16a34a"/>
          </div>
        </Card>

        {/* CRM */}
        <Card title="CRM">
          <BigStat label="Total Contacts" value={d.crm.contacts} trend={d.crm.contactsTrend}/>
          <div style={{ marginTop:16, display:'grid', gap:10 }}>
            {[
              {label:'Opens',        value:d.crm.opens,  trend:d.crm.opensTrend,  invert:true},
              {label:'Clicks',       value:d.crm.clicks, trend:d.crm.clicksTrend, invert:true},
              {label:'Unsubscribes', value:d.crm.unsubs, trend:d.crm.unsubsTrend, invert:false},
            ].map(row => (
              <div key={row.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #f0f2f7', paddingBottom:8 }}>
                <span style={{ fontSize:13, color:'#60697d' }}>{row.label}</span>
                <span style={{ fontSize:15, fontWeight:900 }}>{row.value}</span>
                <Trend pct={row.trend} invert={row.invert}/>
              </div>
            ))}
          </div>
        </Card>

      </div>

      {/* ── Social footer ── */}
      <div style={{ margin:'0 24px 24px', background:'#fff', border:'1px solid #e4e7ee', borderRadius:18, padding:'16px 24px', display:'flex', justifyContent:'space-around', alignItems:'center', flexWrap:'wrap', gap:16 }}>
        {d.social.map(s => (
          <div key={s.name} style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:34, height:34, borderRadius:9, background:s.color, display:'grid', placeItems:'center', color:'#fff', fontWeight:900, fontSize:11 }}>{s.abbr}</div>
            <div>
              <div style={{ fontWeight:900, fontSize:17 }}>{s.value}</div>
              <Trend pct={s.trend}/>
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}
