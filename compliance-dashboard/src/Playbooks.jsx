import './Playbooks.css'
import { useState } from 'react'

const playbooks = [
  {
    id: 1,
    title: 'Credential Leak',
    scriptName: 'deactivate-key.py',
    trigger: 'Detected exposed API keys, passwords, or credentials in code repository or logs',
    steps: [
      'Immediately revoke the leaked credentials in the affected service',
      'Rotate all related credentials and API keys',
      'Scan all repositories and logs for additional exposed secrets',
      'Review access logs to identify any unauthorized usage',
      'Implement secret scanning tools to prevent future leaks'
    ]
  },
  {
    id: 2,
    title: 'Brute Force Attack',
    scriptName: 'block_ip.sh',
    trigger: 'Multiple failed login attempts detected from same IP address or targeting same account',
    steps: [
      'Block the attacking IP addresses at firewall/WAF level',
      'Lock affected user accounts and notify account owners',
      'Review authentication logs for successful breaches',
      'Enable MFA for all affected accounts',
      'Implement rate limiting and CAPTCHA on login endpoints'
    ]
  },
  {
    id: 3,
    title: 'Unauthorized Cloud Access',
    scriptName: 'terminate-session.py',
    trigger: 'Cloud access from unusual location, new device, or outside business hours',
    steps: [
      'Suspend the suspicious session immediately',
      'Verify the activity with the account owner',
      'Review CloudTrail logs for unauthorized actions',
      'Rotate access keys and force password reset',
      'Enable CloudWatch alarms for anomalous access patterns'
    ]
  },
  {
    id: 4,
    title: 'Insecure Dependency',
    scriptName: 'patch-dependencies.sh',
    trigger: 'Vulnerability scanner detected high/critical severity issues in dependencies',
    steps: [
      'Identify all affected applications and services',
      'Update the vulnerable dependency to the patched version',
      'Test the application thoroughly after the update',
      'Deploy the patched version to production',
      'Schedule regular dependency audits and automated scanning'
    ]
  },
  {
    id: 5,
    title: 'Malware Detection',
    scriptName: 'isolate-and-clean.sh',
    trigger: 'Antivirus or EDR system detected malicious file or suspicious behavior',
    steps: [
      'Isolate the infected system from the network immediately',
      'Run a full system scan and identify the malware type',
      'Remove the malware and restore from clean backup if necessary',
      'Review logs to determine infection source and scope',
      'Update antivirus signatures and security policies'
    ]
  }
]

function PlaybookCard({ playbook, isUnderAttack, onRemediationComplete }) {
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const handleExecuteRemediation = () => {
    setIsLoading(true)
    setSuccessMessage('')

    // Simulate script execution with 2 second delay
    setTimeout(() => {
      setIsLoading(false)
      setSuccessMessage(`✅ Remediation Script Executed Successfully: ${playbook.scriptName}`)

      // Notify parent component that remediation is complete
      if (isUnderAttack) {
        onRemediationComplete(playbook.id)
      }
    }, 2000)
  }

  return (
    <div className={`playbook-card ${isUnderAttack ? 'under-attack' : ''}`}>
      {isUnderAttack && (
        <div className="attack-banner">
          🚨 ACTIVE THREAT DETECTED
        </div>
      )}

      <div className="playbook-header">
        <h3 className="playbook-title">{playbook.title}</h3>
      </div>

      <div className="playbook-body">
        <div className="playbook-trigger">
          <strong>Trigger:</strong>
          <p>{playbook.trigger}</p>
        </div>

        <div className="playbook-steps">
          <strong>Response Steps:</strong>
          <ol>
            {playbook.steps.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ol>
        </div>

        <div className="playbook-actions">
          <button
            className={`execute-button ${isUnderAttack ? 'urgent' : ''}`}
            onClick={handleExecuteRemediation}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="button-spinner"></span>
                Executing...
              </>
            ) : isUnderAttack ? (
              '🛡️ Execute Remediation Now!'
            ) : (
              'Execute Remediation'
            )}
          </button>

          {successMessage && (
            <div className="success-message">
              {successMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Playbooks() {
  const [attackedPlaybookId, setAttackedPlaybookId] = useState(null)

  const handleSimulateAttack = () => {
    // Pick a random playbook
    const randomIndex = Math.floor(Math.random() * playbooks.length)
    const randomPlaybook = playbooks[randomIndex]
    setAttackedPlaybookId(randomPlaybook.id)
  }

  const handleRemediationComplete = (playbookId) => {
    // Clear the attack if the correct playbook was remediated
    if (playbookId === attackedPlaybookId) {
      setAttackedPlaybookId(null)
    }
  }

  return (
    <div className="playbooks-container">
      <header className="playbooks-header">
        <h1>Security Incident Response Playbooks</h1>
        <p className="playbooks-subtitle">Automated response procedures for common security incidents</p>

        <button
          className="simulate-attack-button"
          onClick={handleSimulateAttack}
          disabled={attackedPlaybookId !== null}
        >
          {attackedPlaybookId !== null ? '⚠️ Attack In Progress' : '⚡ Simulate Attack'}
        </button>
      </header>

      <div className="playbooks-grid">
        {playbooks.map((playbook) => (
          <PlaybookCard
            key={playbook.id}
            playbook={playbook}
            isUnderAttack={playbook.id === attackedPlaybookId}
            onRemediationComplete={handleRemediationComplete}
          />
        ))}
      </div>
    </div>
  )
}
