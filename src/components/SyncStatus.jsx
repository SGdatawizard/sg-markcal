export default function SyncStatus({ msg, isError }) {
  if (!msg) return null
  return (
    <div className={`sync-status${isError ? ' error' : ''}`}>
      {msg}
    </div>
  )
}
