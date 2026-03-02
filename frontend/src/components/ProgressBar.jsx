export default function ProgressBar({ done, total, failed }) {
  const pct = total > 0 ? (done / total) * 100 : 0

  return (
    <section className="progress-section">
      <div className="progress-bar-wrap">
        <div className="progress-bar" style={{ width: `${pct}%` }} />
      </div>
      <p className="progress-text">
        Converting {done} / {total} &nbsp;&mdash;&nbsp; all running in parallel on Java server
        {failed > 0 && <span style={{ color: '#fca5a5' }}> &nbsp;({failed} failed)</span>}
      </p>
    </section>
  )
}
