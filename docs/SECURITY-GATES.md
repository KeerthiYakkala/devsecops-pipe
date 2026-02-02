# Security Gates Documentation

## Overview

Security gates are checkpoints in the CI/CD pipeline that enforce security
standards before code can progress to the next stage. This document defines
the gate criteria, thresholds, and exception process.

## Gate Philosophy

Our security gates follow the principle of **"Shift Left"** - catching security
issues as early as possible in the development cycle when they are cheapest to fix.

```
Cost to Fix Security Issues:

                                    ████████████████████████████  Production
                                ████████████████████████  Staging
                            ████████████████████  Testing
                        ████████████████  PR/Review
                    ████████████  Development
                ████████  Design

     Relative Cost →
```

## Gate Definitions

### Gate 1: Pre-Commit (Local)

**When:** Before code is committed locally

**Tools:**
- pre-commit hooks
- git-secrets
- local linting

**Criteria:**
| Check | Threshold | Blocking |
|-------|-----------|----------|
| Secrets detected | 0 | ✅ Yes |
| Syntax errors | 0 | ✅ Yes |
| Linting warnings | Configurable | ❌ No |

**Setup:**
```bash
# Install pre-commit
pip install pre-commit

# Install hooks
pre-commit install

# Run manually
pre-commit run --all-files
```

### Gate 2: Pull Request Gate

**When:** On every pull request

**Tools:**
- Gitleaks (secrets)
- Semgrep (SAST)
- pip-audit / npm audit (dependencies)
- Trivy (containers)

**Criteria:**

| Category | Threshold | Blocking | SLA |
|----------|-----------|----------|-----|
| Secrets | 0 findings | ✅ Yes | Immediate |
| CRITICAL vulnerabilities | 0 findings | ✅ Yes | 24 hours |
| HIGH vulnerabilities | 0 findings | ✅ Yes | 7 days |
| MEDIUM vulnerabilities | ≤10 findings | ⚠️ Warning | 30 days |
| LOW vulnerabilities | Unlimited | ❌ No | Best effort |

**PR Merge Requirements:**
1. All CI checks pass
2. Security gate passes (no CRITICAL/HIGH)
3. At least 1 code review approval
4. No unresolved security comments

### Gate 3: Main Branch Gate

**When:** On push to main/develop

**Additional Tools:**
- ZAP DAST scan (on main only)
- Full container scan
- IaC security scan

**Criteria:**
Same as PR gate, plus:

| Category | Threshold | Blocking |
|----------|-----------|----------|
| DAST HIGH/CRITICAL | 0 findings | ✅ Yes |
| IaC misconfigurations (HIGH) | 0 findings | ⚠️ Warning |

### Gate 4: Release Gate

**When:** Before deployment to production

**Additional Checks:**
- All prior gates passed
- Manual security review (if applicable)
- Compliance checks
- License compliance

**Criteria:**

| Requirement | Status |
|-------------|--------|
| Zero CRITICAL vulnerabilities | Required |
| Zero HIGH vulnerabilities | Required |
| MEDIUM vulnerabilities documented | Required |
| Security review approved | Conditional* |
| Penetration test passed | Conditional* |

*Required for major releases or significant changes

## Severity Definitions

### CRITICAL (CVSS 9.0-10.0)

**Definition:** Vulnerabilities that can be exploited remotely without
authentication and result in complete system compromise.

**Examples:**
- Remote code execution
- Authentication bypass
- Exposed secrets/credentials
- SQL injection allowing data extraction

**Response:**
- Stop all deployments
- Immediate remediation required
- Incident response if in production

### HIGH (CVSS 7.0-8.9)

**Definition:** Vulnerabilities that significantly impact confidentiality,
integrity, or availability but may require some conditions to exploit.

**Examples:**
- Cross-site scripting (stored)
- Privilege escalation
- Sensitive data exposure
- Server-side request forgery

**Response:**
- Block PR merge
- Remediate within 7 days
- Escalate if blocking release

### MEDIUM (CVSS 4.0-6.9)

**Definition:** Vulnerabilities that have limited impact or require significant
user interaction or access to exploit.

**Examples:**
- Cross-site scripting (reflected)
- Information disclosure (limited)
- Missing security headers
- Weak cryptographic algorithms

**Response:**
- Warning, does not block
- Remediate within 30 days
- Document if accepting risk

### LOW (CVSS 0.1-3.9)

**Definition:** Vulnerabilities with minimal security impact.

**Examples:**
- Verbose error messages
- Minor information leakage
- Best practice violations
- Deprecated functions

**Response:**
- Informational
- Best effort remediation
- May be bulk-addressed periodically

## Exception Process

### When to Request an Exception

Request an exception when:
1. No fix is currently available
2. Fix would cause significant regression
3. Finding is a false positive
4. Risk is mitigated by other controls

### Exception Request Requirements

1. **Justification** - Why the exception is needed
2. **Risk Assessment** - Impact if exploited
3. **Compensating Controls** - What mitigates the risk
4. **Timeline** - When will this be resolved
5. **Owner** - Who is responsible

### Exception Template

```markdown
## Security Exception Request

**Vulnerability ID:** CVE-XXXX-XXXXX or Rule ID
**Severity:** HIGH/MEDIUM/LOW
**Affected Component:** [component name]

### Justification
[Why this exception is needed]

### Risk Assessment
- **Likelihood:** [LOW/MEDIUM/HIGH]
- **Impact:** [LOW/MEDIUM/HIGH]
- **Risk Score:** [Likelihood x Impact]

### Compensating Controls
- [ ] Control 1: [description]
- [ ] Control 2: [description]

### Resolution Plan
- **Target Date:** YYYY-MM-DD
- **Owner:** @username
- **Plan:** [How this will be resolved]

### Approval
- [ ] Security Team
- [ ] Engineering Lead
- [ ] Product Owner (if customer-facing)
```

### Exception Duration

| Severity | Maximum Duration | Renewal Allowed |
|----------|-----------------|-----------------|
| CRITICAL | 7 days | No |
| HIGH | 30 days | Once |
| MEDIUM | 90 days | Yes |
| LOW | 180 days | Yes |

## Monitoring and Compliance

### Weekly Security Review

Every week, the security gate status is reviewed:
1. Total vulnerabilities by severity
2. Exception inventory
3. MTTR metrics
4. Trends over time

### Monthly Metrics Report

| Metric | Target | Current |
|--------|--------|---------|
| MTTR (CRITICAL) | <24 hours | - |
| MTTR (HIGH) | <7 days | - |
| False Positive Rate | <5% | - |
| Exception Count | <5 active | - |
| Gate Pass Rate | >95% | - |

### Compliance Mapping

Our security gates help meet:

| Standard | Controls |
|----------|----------|
| SOC 2 | CC6.1, CC7.1, CC7.2 |
| ISO 27001 | A.12.6.1, A.14.2.1 |
| PCI DSS | 6.3, 6.5, 6.6 |
| OWASP SAMM | Implementation Verification |

## Escalation Path

```
Finding Detected
      │
      ▼
  Can fix in < 24 hours?
      │
    Yes ──► Fix and merge
      │
     No
      │
      ▼
  CRITICAL severity?
      │
    Yes ──► Notify Security Lead immediately
      │         │
     No         ▼
      │    Incident response
      ▼
  HIGH severity?
      │
    Yes ──► Notify Engineering Lead
      │         │
     No         ▼
      │    Create urgent ticket
      ▼
  Document and track
```

## Continuous Improvement

### Gate Tuning Process

1. **Collect Metrics** - Track false positives, bypass requests
2. **Analyze Trends** - Identify patterns in findings
3. **Adjust Rules** - Add/remove scanner rules
4. **Update Thresholds** - Modify gate criteria if needed
5. **Document Changes** - Update this documentation

### Feedback Loop

Developers can provide feedback on gates:
- False positive reports
- Rule improvement suggestions
- Process improvement ideas

Submit feedback via:
- GitHub Issues in this repository
- Security team Slack channel
- Monthly security office hours
