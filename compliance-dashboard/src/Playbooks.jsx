import './Playbooks.css'

const playbooks = [
  {
    id: 1,
    title: 'Credential Leak',
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

function PlaybookCard({ playbook }) {
  return (
    <div className="playbook-card">
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
      </div>
    </div>
  )
}

export default function Playbooks() {
  return (
    <div className="playbooks-container">
      <header className="playbooks-header">
        <h1>Security Incident Response Playbooks</h1>
        <p className="playbooks-subtitle">Automated response procedures for common security incidents</p>
      </header>

      <div className="playbooks-grid">
        {playbooks.map((playbook) => (
          <PlaybookCard key={playbook.id} playbook={playbook} />
        ))}
      </div>
    </div>
  )
}
