# Integration Guide

This guide explains how to integrate the DevSecOps pipeline into your existing
projects. Follow these steps to add comprehensive security scanning to any repository.

## Quick Start

### Option 1: Use as Template

1. Click "Use this template" on GitHub
2. Create your new repository
3. Your project now has the full security pipeline

### Option 2: Copy Workflows

1. Copy the `.github/workflows/` directory to your repository
2. Copy the `config/` directory for scanner configurations
3. Customize as needed for your project

### Option 3: Reference Workflows (Reusable)

Create a minimal workflow that references this template:

```yaml
# .github/workflows/security.yml
name: Security

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  security:
    uses: your-org/devsecops-pipe/.github/workflows/security-pipeline.yml@main
    secrets: inherit
```

## Step-by-Step Integration

### Step 1: Add Workflow Files

Copy the workflow files to your repository:

```bash
# Clone the template
git clone https://github.com/your-org/devsecops-pipe.git /tmp/devsecops

# Copy workflows
mkdir -p .github/workflows
cp /tmp/devsecops/.github/workflows/*.yml .github/workflows/

# Copy configurations
mkdir -p config
cp /tmp/devsecops/config/* config/
```

### Step 2: Configure for Your Project

#### Python Projects

Ensure you have a `requirements.txt` or `pyproject.toml`:

```bash
# Generate requirements.txt from current environment
pip freeze > requirements.txt

# Or from pyproject.toml
pip install pip-tools
pip-compile pyproject.toml
```

#### Node.js Projects

Ensure you have a `package.json` and lockfile:

```bash
# Generate package-lock.json
npm install

# Or if using yarn
yarn install
```

#### Docker Projects

Ensure Dockerfiles follow security best practices:

```dockerfile
# Good: Use specific version, not latest
FROM python:3.11-slim-bookworm

# Good: Run as non-root
RUN useradd -m appuser
USER appuser

# Good: Use multi-stage builds
FROM node:20-alpine AS builder
# ... build steps ...

FROM node:20-alpine AS production
COPY --from=builder /app/dist /app
```

### Step 3: Add Ignore Files (Optional)

Create ignore files for known false positives or accepted risks.

#### .gitleaksignore

```
# Ignore test fixtures
tests/fixtures/fake-credentials.json

# Ignore example configurations
docs/examples/*.env.example
```

#### .trivyignore

```
# Ignore unfixed vulnerabilities in base image
CVE-2023-xxxxx

# Accept risk - documented in SEC-123
CVE-2023-yyyyy
```

#### .semgrepignore

```
# Ignore test files
*_test.py
*.spec.js

# Ignore generated code
generated/
```

### Step 4: Set Up Secrets

Add required secrets in GitHub repository settings:

| Secret | Required | Description |
|--------|----------|-------------|
| `GITHUB_TOKEN` | Auto | Automatically provided |
| `SLACK_WEBHOOK_URL` | Optional | For Slack notifications |
| `SEMGREP_APP_TOKEN` | Optional | For Semgrep Cloud features |
| `SNYK_TOKEN` | Optional | For Snyk integration |

### Step 5: Enable GitHub Security Features

1. Go to repository **Settings** > **Security**
2. Enable **Dependency graph**
3. Enable **Dependabot alerts**
4. Enable **Code scanning** (for SARIF uploads)
5. Enable **Secret scanning** (additional layer)

### Step 6: Test the Pipeline

Create a test PR to verify everything works:

```bash
# Create test branch
git checkout -b test/security-pipeline

# Make a small change
echo "# Test" >> README.md

# Commit and push
git add README.md
git commit -m "test: verify security pipeline"
git push origin test/security-pipeline

# Create PR and watch the checks run
```

## Example: Integrating with DayTrade Project

Here's a complete example of integrating with a Python trading application:

### Project Structure

```
daytrade/
├── .github/
│   └── workflows/
│       ├── ci.yml                 # Existing CI
│       └── security-pipeline.yml  # Add this
├── config/
│   ├── semgrep-rules.yml         # Custom rules
│   └── trivy-config.yml          # Container config
├── src/
│   └── daytrade/
│       ├── __init__.py
│       ├── trading.py
│       └── api.py
├── tests/
├── Dockerfile
├── requirements.txt
└── docker-compose.yml
```

### Modified Workflow for DayTrade

```yaml
# .github/workflows/security-pipeline.yml
name: DayTrade Security Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  # Project-specific settings
  PYTHON_VERSION: '3.11'
  NODE_VERSION: '20'
  
jobs:
  secret-scan:
    name: Secret Detection
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

  sast-scan:
    name: SAST Analysis
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: returntocorp/semgrep-action@v1
        with:
          config: >-
            p/security-audit
            p/python
            p/flask
            p/django
            p/owasp-top-ten
            ./config/semgrep-rules.yml
      
      # DayTrade-specific: Scan for insecure trading patterns
      - name: Check for insecure trading patterns
        run: |
          # Check for hardcoded trading credentials
          if grep -r "api_key\s*=\s*['\"]" src/; then
            echo "::error::Hardcoded API keys found in trading code"
            exit 1
          fi
          
          # Check for production credentials in test files
          if grep -r "LIVE\|PRODUCTION" tests/; then
            echo "::warning::Production references in test files"
          fi

  dependency-scan:
    name: Dependency Audit
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-python@v5
        with:
          python-version: ${{ env.PYTHON_VERSION }}
      
      - name: Install and run pip-audit
        run: |
          pip install pip-audit
          pip-audit -r requirements.txt --format json --output audit.json || true
          pip-audit -r requirements.txt --fix --dry-run
          
          # Fail on HIGH/CRITICAL
          pip-audit -r requirements.txt --desc

  container-scan:
    name: Container Security
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Build image
        run: docker build -t daytrade:scan .
      
      - uses: aquasecurity/trivy-action@master
        with:
          image-ref: 'daytrade:scan'
          format: 'sarif'
          output: 'trivy.sarif'
          severity: 'CRITICAL,HIGH'
      
      - uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: 'trivy.sarif'

  # DayTrade-specific: Financial compliance checks
  compliance-scan:
    name: Financial Compliance
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Check for PII handling
        run: |
          # Ensure PII fields are encrypted
          if grep -r "ssn\|social_security\|tax_id" src/ | grep -v "encrypt"; then
            echo "::warning::PII fields may not be encrypted"
          fi
          
          # Check for audit logging
          if ! grep -r "audit_log\|AuditLog" src/; then
            echo "::warning::No audit logging found for financial transactions"
          fi

  security-gate:
    name: Security Gate
    needs: [secret-scan, sast-scan, dependency-scan, container-scan, compliance-scan]
    if: always()
    runs-on: ubuntu-latest
    steps:
      - name: Check results
        run: |
          if [ "${{ needs.secret-scan.result }}" == "failure" ]; then
            echo "::error::Secrets detected - cannot merge"
            exit 1
          fi
          
          if [ "${{ needs.sast-scan.result }}" == "failure" ]; then
            echo "::error::SAST vulnerabilities found"
            exit 1
          fi
          
          echo "Security gate passed"
```

### Custom Semgrep Rules for DayTrade

```yaml
# config/semgrep-rules.yml
rules:
  - id: trading-credentials-exposure
    patterns:
      - pattern-either:
          - pattern: $BROKER_KEY = "..."
          - pattern: $API_SECRET = "..."
    message: "Trading API credentials should not be hardcoded"
    languages: [python]
    severity: ERROR
    metadata:
      category: security
      technology: [trading]

  - id: unvalidated-trade-amount
    patterns:
      - pattern: |
          def execute_trade($AMOUNT, ...):
            ...
            broker.place_order($AMOUNT, ...)
      - pattern-not: |
          def execute_trade($AMOUNT, ...):
            ...
            validate_amount($AMOUNT)
            ...
    message: "Trade amounts should be validated before execution"
    languages: [python]
    severity: WARNING

  - id: missing-trade-audit-log
    patterns:
      - pattern: |
          def execute_trade(...):
            ...
            broker.place_order(...)
      - pattern-not: |
          def execute_trade(...):
            ...
            audit_log(...)
            ...
    message: "All trades should be audit logged"
    languages: [python]
    severity: WARNING
```

## Customization Options

### Adjusting Severity Thresholds

Edit the workflow to change what blocks PRs:

```yaml
# Only block on CRITICAL
- name: Run Trivy
  uses: aquasecurity/trivy-action@master
  with:
    severity: 'CRITICAL'  # Changed from 'CRITICAL,HIGH'
    exit-code: '1'
```

### Adding Custom Checks

Add project-specific security checks:

```yaml
- name: Custom security check
  run: |
    # Your custom checks here
    ./scripts/security-check.sh
```

### Disabling Specific Scans

Comment out or remove unwanted jobs:

```yaml
# Disable DAST if not needed
# dast-scan:
#   ...
```

### Changing Notification Channels

Configure different notification methods:

```yaml
- name: Notify on failure
  if: failure()
  run: |
    # Slack
    ./scripts/slack-notify.sh --status failure
    
    # Email (via GitHub notification settings)
    # Teams (via webhook)
    # PagerDuty (via API)
```

## Troubleshooting Integration

### "Workflow not triggering"

Check:
1. Workflow file is in `.github/workflows/`
2. YAML syntax is valid
3. Trigger events match your actions
4. Branch names match trigger configuration

### "Scanner not finding files"

Check:
1. File extensions match scanner expectations
2. Files aren't in ignored directories
3. Working directory is set correctly

### "False positives overwhelming results"

Solutions:
1. Add ignore rules in scanner config
2. Use inline ignore comments
3. Adjust severity thresholds
4. Add to `.semgrepignore` or equivalent

### "SARIF upload failing"

Check:
1. GitHub Advanced Security is enabled
2. SARIF file is valid JSON
3. File isn't too large (GitHub has limits)
4. Permissions include `security-events: write`

## Best Practices

1. **Start with warnings, then enforce** - Begin with non-blocking scans
2. **Fix issues incrementally** - Don't try to fix everything at once
3. **Document exceptions** - Always explain why something is ignored
4. **Review scan results regularly** - Don't just look at pass/fail
5. **Keep scanners updated** - New vulnerabilities are discovered daily
6. **Educate your team** - Everyone should understand the gates
