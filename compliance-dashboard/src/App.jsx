import './App.css'
import findings from './data/findings.json'

function App() {
  const getStatusStyle = (status) => {
    return {
      padding: '4px 12px',
      borderRadius: '4px',
      fontWeight: 'bold',
      color: 'white',
      backgroundColor: status === 'PASS' ? '#22c55e' : '#ef4444'
    }
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return '#dc2626'
      case 'HIGH':
        return '#f97316'
      case 'MEDIUM':
        return '#eab308'
      case 'LOW':
        return '#3b82f6'
      default:
        return '#6b7280'
    }
  }

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <h1 style={{
        textAlign: 'center',
        marginBottom: '40px',
        color: '#1f2937'
      }}>
        Security Compliance Dashboard
      </h1>

      {findings.sections.map(section => (
        <div key={section.name} style={{
          marginBottom: '40px',
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          padding: '20px',
          border: '1px solid #e5e7eb'
        }}>
          <h2 style={{
            color: '#111827',
            marginTop: '0',
            marginBottom: '20px',
            fontSize: '24px'
          }}>
            {section.name}
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {section.checks.map(check => (
              <div key={check.id} style={{
                backgroundColor: 'white',
                padding: '16px',
                borderRadius: '6px',
                border: '1px solid #e5e7eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontWeight: '600',
                    color: '#111827',
                    marginBottom: '4px',
                    fontSize: '14px'
                  }}>
                    {check.title}
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  flexShrink: 0
                }}>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: 'white',
                    backgroundColor: getSeverityColor(check.severity)
                  }}>
                    {check.severity}
                  </span>
                  <span style={getStatusStyle(check.status)}>
                    {check.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default App
