# 🔒 DevSecOps Pipeline Template

[![Security Pipeline](https://github.com/YOUR_USERNAME/devsecops-pipe/actions/workflows/security-pipeline.yml/badge.svg)](https://github.com/YOUR_USERNAME/devsecops-pipe/actions/workflows/security-pipeline.yml)
[![Secret Scan](https://github.com/YOUR_USERNAME/devsecops-pipe/actions/workflows/secret-scan.yml/badge.svg)](https://github.com/YOUR_USERNAME/devsecops-pipe/actions/workflows/secret-scan.yml)
[![Dependency Check](https://github.com/YOUR_USERNAME/devsecops-pipe/actions/workflows/dependency-check.yml/badge.svg)](https://github.com/YOUR_USERNAME/devsecops-pipe/actions/workflows/dependency-check.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A comprehensive, production-ready DevSecOps pipeline template that integrates
security scanning into your CI/CD workflows. Supports Python, Node.js, and
containerized applications.

## 🎯 Features

- **🔐 Secret Detection** - Find leaked credentials with Gitleaks
- **🔍 SAST Analysis** - Static code analysis with Semgrep
- **📦 Dependency Scanning** - Vulnerability detection in dependencies
- **🐳 Container Security** - Docker image scanning with Trivy
- **🌐 DAST Testing** - Dynamic testing with OWASP ZAP
- **🏗️ IaC Scanning** - Infrastructure security with Checkov
- **🚦 Security Gates** - Automated policy enforcement
- **📊 Reporting** - Comprehensive vulnerability reports

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Pipeline Overview](#-pipeline-overview)
- [Security Scanners](#-security-scanners)
- [Configuration](#-configuration)
- [Integration Guide](#-integration-guide)
- [Example Applications](#-example-applications)
- [Documentation](#-documentation)
- [Contributing](#-contributing)

## 🚀 Quick Start

### Use as Template

1. Click **"Use this template"** button on GitHub
2. Create your new repository
3. Replace `YOUR_USERNAME` in badge URLs with your GitHub username
4. Push code and watch the security pipeline run

### Manual Installation

```bash
# Clone the template
git clone https://github.com/YOUR_USERNAME/devsecops-pipe.git

# Copy to your project
cp -r devsecops-pipe/.github/workflows your-project/.github/
cp -r devsecops-pipe/config your-project/

# Customize for your needs
cd your-project
# Edit workflow files as needed
```

## 🔄 Pipeline Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Pull Request / Push                          │
└───────────────────────────┬─────────────────────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            │               │               │
            ▼               ▼               ▼
    ┌───────────┐   ┌───────────┐   ┌───────────┐
    │  Secret   │   │   SAST    │   │   Deps    │
    │   Scan    │   │   Scan    │   │   Scan    │
    └─────┬─────┘   └─────┬─────┘   └─────┬─────┘
          │               │               │
          └───────────────┼───────────────┘
                          │
                          ▼
                  ┌───────────────┐
                  │   Container   │
                  │     Scan      │
                  └───────┬───────┘
                          │
                          ▼
                  ┌───────────────┐
                  │   Security    │
                  │     Gate      │
                  └───────┬───────┘
                          │
              ┌───────────┴───────────┐
              │                       │
              ▼                       ▼
        ┌─────────┐             ┌─────────┐
        │  PASS   │             │  FAIL   │
        │ ✅ Merge │             │ ❌ Block │
        └─────────┘             └─────────┘
```

## 🛡️ Security Scanners

| Scanner | Purpose | Findings |
|---------|---------|----------|
| **Gitleaks** | Secret detection | API keys, passwords, tokens |
| **Semgrep** | Static analysis | Code vulnerabilities, OWASP Top 10 |
| **pip-audit** | Python dependencies | Known CVEs in packages |
| **npm audit** | Node.js dependencies | Known CVEs in packages |
| **Trivy** | Container scanning | OS & library vulnerabilities |
| **ZAP** | Dynamic testing | Runtime vulnerabilities |
| **Checkov** | IaC scanning | Misconfigurations |

## ⚙️ Configuration

### Workflow Files

| File | Trigger | Purpose |
|------|---------|---------|
| `security-pipeline.yml` | Push, PR | Main security pipeline |
| `secret-scan.yml` | Push, PR, Schedule | Dedicated secret scanning |
| `dependency-check.yml` | Schedule, Manual | Weekly dependency audit |

### Configuration Files

| File | Description |
|------|-------------|
| `config/semgrep-rules.yml` | Custom SAST rules |
| `config/trivy-config.yml` | Container scanner settings |
| `config/zap-rules.tsv` | DAST rule configuration |

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GITHUB_TOKEN` | Auto | GitHub API access |
| `SLACK_WEBHOOK_URL` | Optional | Slack notifications |
| `SEMGREP_APP_TOKEN` | Optional | Semgrep Cloud features |

## 📖 Integration Guide

### For Python Projects

```yaml
# Ensure requirements.txt exists
pip freeze > requirements.txt

# Pipeline will automatically:
# - Run pip-audit on requirements.txt
# - Generate SBOM
# - Report vulnerabilities
```

### For Node.js Projects

```yaml
# Ensure package-lock.json exists
npm install

# Pipeline will automatically:
# - Run npm audit
# - Generate SBOM
# - Report vulnerabilities
```

### For Docker Projects

```dockerfile
# Follow security best practices:
FROM python:3.11-slim  # Use specific versions

# Create non-root user
RUN useradd -m appuser
USER appuser

# Add health check
HEALTHCHECK CMD curl -f http://localhost/health
```

See [INTEGRATION.md](docs/INTEGRATION.md) for detailed instructions.

## 📁 Example Applications

The `examples/` directory contains sample applications demonstrating:

### Python App (`examples/python-app/`)

- Flask REST API
- Secure Dockerfile
- Security best practices

```bash
cd examples/python-app
docker build -t python-demo .
docker run -p 8080:8080 python-demo
curl http://localhost:8080/health
```

### Node.js App (`examples/node-app/`)

- Express REST API
- Helmet security middleware
- Rate limiting

```bash
cd examples/node-app
docker build -t node-demo .
docker run -p 8080:8080 node-demo
curl http://localhost:8080/health
```

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [PIPELINE.md](docs/PIPELINE.md) | Detailed pipeline documentation |
| [SECURITY-GATES.md](docs/SECURITY-GATES.md) | Gate criteria and thresholds |
| [INTEGRATION.md](docs/INTEGRATION.md) | How to integrate into projects |

## 🔧 Customization

### Adjusting Severity Thresholds

Edit `security-pipeline.yml`:

```yaml
env:
  SEVERITY_THRESHOLD: 'HIGH'  # Options: LOW, MEDIUM, HIGH, CRITICAL
```

### Adding Custom Semgrep Rules

Edit `config/semgrep-rules.yml`:

```yaml
rules:
  - id: my-custom-rule
    pattern: $DANGEROUS_PATTERN
    message: "Security issue found"
    severity: ERROR
    languages: [python]
```

### Ignoring False Positives

Create `.semgrepignore`:

```
# Ignore test files
*_test.py
tests/

# Ignore specific patterns
generated/
```

## 📊 Reports and Artifacts

The pipeline generates:

1. **GitHub Security Tab** - SARIF uploads for code scanning alerts
2. **PR Comments** - Summary of findings on pull requests
3. **Workflow Artifacts** - Detailed JSON/SARIF reports (30-day retention)
4. **Step Summaries** - Visual reports in workflow runs

### Generating Custom Reports

```bash
python scripts/generate-report.py \
    --input-dir ./security-reports \
    --output markdown \
    --output-file security-report.md
```

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run the security pipeline locally
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file.

## 🙏 Acknowledgments

- [Gitleaks](https://github.com/gitleaks/gitleaks) - Secret detection
- [Semgrep](https://semgrep.dev/) - Static analysis
- [Trivy](https://github.com/aquasecurity/trivy) - Container scanning
- [OWASP ZAP](https://www.zaproxy.org/) - Dynamic testing
- [Checkov](https://www.checkov.io/) - IaC scanning

---

**Built with ❤️ for secure software development**

*Star ⭐ this repo if you find it useful!*
