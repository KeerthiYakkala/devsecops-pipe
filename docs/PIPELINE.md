# DevSecOps Pipeline Documentation

## Overview

This document describes the security pipeline implemented in this template repository.
The pipeline integrates multiple security scanning tools to provide comprehensive
coverage across the software development lifecycle.

## Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DevSecOps Security Pipeline                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Secret    │  │    SAST     │  │ Dependency  │  │  Container  │        │
│  │   Scan      │  │    Scan     │  │    Scan     │  │    Scan     │        │
│  │ (Gitleaks)  │  │ (Semgrep)   │  │(pip/npm)    │  │  (Trivy)    │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
│         │                │                │                │                │
│         │                │                │                │                │
│         └────────────────┴────────────────┴────────────────┘                │
│                                   │                                         │
│                                   ▼                                         │
│                         ┌─────────────────┐                                │
│                         │  Security Gate  │                                │
│                         │   (Aggregate)   │                                │
│                         └────────┬────────┘                                │
│                                  │                                         │
│                    ┌─────────────┼─────────────┐                          │
│                    ▼             ▼             ▼                          │
│               ┌────────┐   ┌──────────┐   ┌─────────┐                     │
│               │  PASS  │   │  REPORT  │   │  FAIL   │                     │
│               └────────┘   └──────────┘   └─────────┘                     │
│                                                                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Scan Types

### 1. Secret Scanning (Gitleaks)

**Purpose:** Detect leaked credentials, API keys, and sensitive data in code.

**What it scans:**
- All files in the repository
- Git history (all commits in PRs)
- Environment files
- Configuration files

**Common findings:**
- Hardcoded API keys
- AWS credentials
- Private keys
- Database passwords
- OAuth tokens

**Configuration:** The scanner uses default Gitleaks rules plus custom patterns
defined for common credential formats.

### 2. Static Application Security Testing - SAST (Semgrep)

**Purpose:** Identify security vulnerabilities in source code without executing it.

**Rulesets enabled:**
- `p/security-audit` - General security checks
- `p/secrets` - Secret detection in code
- `p/owasp-top-ten` - OWASP Top 10 vulnerabilities
- `p/ci` - CI/CD specific checks
- Custom rules in `config/semgrep-rules.yml`

**What it detects:**
- SQL injection
- Cross-site scripting (XSS)
- Command injection
- Path traversal
- Insecure deserialization
- Weak cryptography

### 3. Dependency Scanning

**Purpose:** Find known vulnerabilities in third-party dependencies.

#### Python (pip-audit)
- Scans `requirements.txt`
- Checks against PyPI advisory database
- Generates CycloneDX SBOM

#### Node.js (npm audit)
- Scans `package.json` and lockfiles
- Checks against npm advisory database
- Reports fix availability

**Severity thresholds:**
- **CRITICAL/HIGH:** Pipeline fails
- **MEDIUM:** Warning, requires review
- **LOW:** Informational

### 4. Container Scanning (Trivy)

**Purpose:** Scan Docker images for OS and library vulnerabilities.

**What it scans:**
- Base image OS packages
- Language-specific dependencies
- Dockerfile misconfigurations
- Secrets in image layers

**Configuration:** See `config/trivy-config.yml` for customization options.

### 5. Dynamic Application Security Testing - DAST (ZAP)

**Purpose:** Test running applications for security vulnerabilities.

**When it runs:**
- On pushes to `main` branch
- Manual trigger via workflow_dispatch
- Requires running application

**What it tests:**
- Cross-site scripting
- SQL injection
- Missing security headers
- Information disclosure
- Authentication issues

**Configuration:** See `config/zap-rules.tsv` for rule customization.

### 6. Infrastructure as Code Scanning (Checkov/Trivy)

**Purpose:** Scan IaC files for misconfigurations.

**Supported formats:**
- Terraform
- Kubernetes manifests
- Dockerfiles
- CloudFormation
- Helm charts

## Security Gate

The security gate job aggregates results from all scanners and enforces policy.

### Gate Criteria

| Condition | Result |
|-----------|--------|
| Any CRITICAL vulnerability | ❌ FAIL |
| Any HIGH vulnerability | ❌ FAIL |
| Secrets detected | ❌ FAIL |
| Only MEDIUM/LOW | ⚠️ WARN (pass) |
| No vulnerabilities | ✅ PASS |

### Outputs

1. **GitHub Step Summary** - Visual summary in workflow run
2. **PR Comment** - Automatic comment on pull requests
3. **SARIF Upload** - Results in GitHub Security tab
4. **Artifacts** - Detailed reports downloadable for 30 days

## Workflow Files

### security-pipeline.yml (Main Pipeline)

Triggered on:
- Push to `main` or `develop`
- Pull requests to `main`
- Manual dispatch

Jobs:
1. `secret-scan` - Gitleaks secret detection
2. `sast-scan` - Semgrep static analysis
3. `dependency-scan` - pip-audit and npm audit
4. `container-scan` - Trivy image scanning
5. `iac-scan` - Checkov/Trivy IaC scanning
6. `dast-scan` - ZAP baseline scan (main branch only)
7. `security-gate` - Aggregate and enforce policy

### secret-scan.yml (Standalone)

Triggered on:
- All pushes
- All pull requests
- Daily schedule (midnight UTC)

Purpose: Quick feedback on secret detection.

### dependency-check.yml (Scheduled)

Triggered on:
- Weekly schedule (Monday 9 AM UTC)
- Changes to dependency files
- Manual dispatch

Purpose: Regular dependency vulnerability monitoring.

## Remediation Guidelines

### Secrets Found

1. **Immediately rotate** the exposed credential
2. Remove from code history using `git filter-branch` or BFG Repo-Cleaner
3. Add to `.gitignore` if configuration file
4. Use environment variables or secret managers
5. Update any systems using the credential

### SAST Findings

1. Review the finding to understand the vulnerability
2. Check if it's a false positive
3. Apply the recommended fix
4. Test that the fix works
5. Consider adding custom Semgrep rules for project patterns

### Vulnerable Dependencies

1. Check if a patched version exists
2. Update to the patched version
3. If no patch:
   - Check for alternative packages
   - Implement compensating controls
   - Document accepted risk with justification
4. Monitor for patch availability

### Container Vulnerabilities

1. Update base image to latest patched version
2. Rebuild and rescan
3. For application dependencies:
   - Update in requirements/package files
   - Rebuild image
4. For unfixed OS vulnerabilities:
   - Use `--ignore-unfixed` flag
   - Document in `.trivyignore` with justification

## Metrics and Reporting

### Key Metrics to Track

- **Mean Time to Remediation (MTTR)** - Time from detection to fix
- **Vulnerability Density** - Vulnerabilities per KLOC
- **Fix Rate** - Percentage of vulnerabilities fixed vs. ignored
- **False Positive Rate** - Tuning effectiveness

### Report Generation

Use the provided script to generate reports:

```bash
# Generate markdown report
python scripts/generate-report.py --input-dir ./security-reports --output markdown

# Generate HTML report
python scripts/generate-report.py --input-dir ./security-reports --output html -f report.html

# Generate JSON report
python scripts/generate-report.py --input-dir ./security-reports --output json -f report.json
```

## Troubleshooting

### Common Issues

**Pipeline timeout:**
- Increase job timeout in workflow
- Consider running scans in parallel
- Use caching for Docker builds

**False positives:**
- Add exceptions to scanner configs
- Use inline ignore comments
- Submit false positive reports to tool maintainers

**Missing SARIF upload:**
- Check GitHub Advanced Security is enabled
- Verify SARIF file format is valid
- Check permissions in workflow

**DAST scan fails to connect:**
- Ensure application starts correctly
- Verify health check endpoint
- Increase wait time for application startup

### Getting Help

1. Check scanner documentation
2. Review GitHub Actions logs
3. Open issue in this repository
4. Contact security team
