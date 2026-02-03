import './App.css'
import { useEffect, useState } from 'react'

function Section({ title, items }) {
  if (!items || items.length === 0) {
    return null
  }

  return (
    <div className="section">
      <h2 className="section-title">{title}</h2>

      <div className="rows">
        {items.map((item) => (
          <div key={item.id} className="row">
            <div className="row-content">
              <span className="check-id">{item.id}</span>
              <span className="check-title">{item.title}</span>
            </div>

            <div className="badges">
              <span className={`badge severity ${item.severity.toLowerCase()}`}>
                {item.severity}
              </span>

              <span className={`badge status ${item.status.toLowerCase()}`}>
                {item.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function App() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/devsecops-pipe/data/compliance.json')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch compliance data')
        return res.json()
      })
      .then(setData)
      .catch((err) => {
        console.error(err)
        setError(err.message)
      })
  }, [])

  if (error) {
    return (
      <div className="container">
        <div className="error">
          <h2>Error Loading Data</h2>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading compliance data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <header className="header">
        <h1>Security Compliance Dashboard</h1>
        <p className="subtitle">AWS Security Posture Assessment</p>
        {data.generatedAt && (
          <p className="generated-at">Last updated: {data.generatedAt}</p>
        )}
      </header>

      <Section title="IAM" items={data.checks.iam || []} />
      <Section title="S3" items={data.checks.s3 || []} />
      <Section title="EC2" items={data.checks.ec2 || []} />
      <Section title="CloudTrail" items={data.checks.cloudtrail || []} />
    </div>
  )
}
