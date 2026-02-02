#!/usr/bin/env python3
"""
Security Report Generator for DevSecOps Pipeline

Aggregates results from multiple security scanning tools and generates
a comprehensive security report in various formats.

Usage:
    python generate-report.py [--input-dir DIRECTORY] [--output FORMAT] [--output-file FILE]

Example:
    python generate-report.py --input-dir ./security-reports --output html --output-file report.html
"""

import argparse
import json
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any
from dataclasses import dataclass, field, asdict
from collections import defaultdict


@dataclass
class Vulnerability:
    """Represents a security vulnerability finding."""
    id: str
    title: str
    severity: str
    description: str
    source: str
    file_path: str = ""
    line_number: int = 0
    cwe: str = ""
    cvss: float = 0.0
    remediation: str = ""
    references: List[str] = field(default_factory=list)


@dataclass
class ScanResult:
    """Represents results from a single scanner."""
    scanner: str
    timestamp: str
    vulnerabilities: List[Vulnerability]
    summary: Dict[str, int]


@dataclass
class SecurityReport:
    """Aggregated security report."""
    generated_at: str
    repository: str
    branch: str
    commit: str
    scan_results: List[ScanResult]
    total_vulnerabilities: Dict[str, int]
    recommendations: List[str]


class ReportGenerator:
    """Generates security reports from scan results."""

    SEVERITY_ORDER = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO']

    def __init__(self, input_dir: str):
        self.input_dir = Path(input_dir)
        self.scan_results: List[ScanResult] = []

    def parse_sarif(self, filepath: Path) -> List[Vulnerability]:
        """Parse SARIF format (Semgrep, Trivy, etc.)."""
        vulnerabilities = []

        try:
            with open(filepath) as f:
                data = json.load(f)

            for run in data.get('runs', []):
                tool_name = run.get('tool', {}).get('driver', {}).get('name', 'Unknown')
                rules = {r['id']: r for r in run.get('tool', {}).get('driver', {}).get('rules', [])}

                for result in run.get('results', []):
                    rule_id = result.get('ruleId', '')
                    rule = rules.get(rule_id, {})

                    level = result.get('level', 'warning')
                    severity_map = {'error': 'HIGH', 'warning': 'MEDIUM', 'note': 'LOW'}
                    severity = severity_map.get(level, 'MEDIUM')

                    props = rule.get('properties', {})
                    if 'security-severity' in props:
                        score = float(props['security-severity'])
                        if score >= 9.0:
                            severity = 'CRITICAL'
                        elif score >= 7.0:
                            severity = 'HIGH'
                        elif score >= 4.0:
                            severity = 'MEDIUM'
                        else:
                            severity = 'LOW'

                    locations = result.get('locations', [{}])
                    location = locations[0] if locations else {}
                    physical_location = location.get('physicalLocation', {})
                    artifact_location = physical_location.get('artifactLocation', {})
                    region = physical_location.get('region', {})

                    vuln = Vulnerability(
                        id=rule_id,
                        title=rule.get('shortDescription', {}).get('text', rule_id),
                        severity=severity,
                        description=result.get('message', {}).get('text', ''),
                        source=tool_name,
                        file_path=artifact_location.get('uri', ''),
                        line_number=region.get('startLine', 0),
                        cwe=props.get('cwe', ''),
                        cvss=float(props.get('security-severity', 0)),
                        remediation=rule.get('help', {}).get('text', ''),
                        references=[tag for tag in props.get('tags', []) if tag.startswith('http')]
                    )
                    vulnerabilities.append(vuln)

        except Exception as e:
            print(f"Error parsing SARIF {filepath}: {e}", file=sys.stderr)

        return vulnerabilities

    def parse_npm_audit(self, filepath: Path) -> List[Vulnerability]:
        """Parse npm audit JSON output."""
        vulnerabilities = []

        try:
            with open(filepath) as f:
                data = json.load(f)

            for vuln_id, vuln_data in data.get('vulnerabilities', {}).items():
                severity_map = {'critical': 'CRITICAL', 'high': 'HIGH', 'moderate': 'MEDIUM', 'low': 'LOW'}

                vuln = Vulnerability(
                    id=vuln_id,
                    title=vuln_data.get('name', vuln_id),
                    severity=severity_map.get(vuln_data.get('severity', ''), 'MEDIUM'),
                    description=vuln_data.get('title', ''),
                    source='npm audit',
                    file_path='package.json',
                    remediation=vuln_data.get('fixAvailable', {}).get('name', '') if isinstance(
                        vuln_data.get('fixAvailable'), dict) else '',
                    references=[vuln_data.get('url', '')]
                )
                vulnerabilities.append(vuln)

        except Exception as e:
            print(f"Error parsing npm audit {filepath}: {e}", file=sys.stderr)

        return vulnerabilities

    def parse_trivy_json(self, filepath: Path) -> List[Vulnerability]:
        """Parse Trivy JSON output."""
        vulnerabilities = []

        try:
            with open(filepath) as f:
                data = json.load(f)

            for result in data.get('Results', []):
                target = result.get('Target', '')

                for vuln_data in result.get('Vulnerabilities', []):
                    vuln = Vulnerability(
                        id=vuln_data.get('VulnerabilityID', ''),
                        title=vuln_data.get('Title', vuln_data.get('VulnerabilityID', '')),
                        severity=vuln_data.get('Severity', 'UNKNOWN').upper(),
                        description=vuln_data.get('Description', ''),
                        source='Trivy',
                        file_path=target,
                        cvss=vuln_data.get('CVSS', {}).get('nvd', {}).get('V3Score', 0),
                        remediation=f"Update {vuln_data.get('PkgName', '')} to {vuln_data.get('FixedVersion', 'N/A')}",
                        references=vuln_data.get('References', [])[:3]
                    )
                    vulnerabilities.append(vuln)

        except Exception as e:
            print(f"Error parsing Trivy {filepath}: {e}", file=sys.stderr)

        return vulnerabilities

    def collect_results(self):
        """Collect all scan results from input directory."""
        if not self.input_dir.exists():
            print(f"Input directory {self.input_dir} does not exist", file=sys.stderr)
            return

        for sarif_file in self.input_dir.rglob('*.sarif'):
            vulns = self.parse_sarif(sarif_file)
            if vulns:
                summary = defaultdict(int)
                for v in vulns:
                    summary[v.severity] += 1

                self.scan_results.append(ScanResult(
                    scanner=sarif_file.stem,
                    timestamp=datetime.now().isoformat(),
                    vulnerabilities=vulns,
                    summary=dict(summary)
                ))

        for npm_file in self.input_dir.rglob('npm-audit.json'):
            vulns = self.parse_npm_audit(npm_file)
            if vulns:
                summary = defaultdict(int)
                for v in vulns:
                    summary[v.severity] += 1

                self.scan_results.append(ScanResult(
                    scanner='npm-audit',
                    timestamp=datetime.now().isoformat(),
                    vulnerabilities=vulns,
                    summary=dict(summary)
                ))

        for trivy_file in self.input_dir.rglob('trivy*.json'):
            if trivy_file.suffix == '.json':
                vulns = self.parse_trivy_json(trivy_file)
                if vulns:
                    summary = defaultdict(int)
                    for v in vulns:
                        summary[v.severity] += 1

                    self.scan_results.append(ScanResult(
                        scanner='trivy-' + trivy_file.stem,
                        timestamp=datetime.now().isoformat(),
                        vulnerabilities=vulns,
                        summary=dict(summary)
                    ))

    def generate_report(self) -> SecurityReport:
        """Generate aggregated security report."""
        total = defaultdict(int)

        for result in self.scan_results:
            for severity, count in result.summary.items():
                total[severity] += count

        recommendations = self._generate_recommendations()

        return SecurityReport(
            generated_at=datetime.now().isoformat(),
            repository=os.environ.get('GITHUB_REPOSITORY', 'unknown'),
            branch=os.environ.get('GITHUB_REF_NAME', 'unknown'),
            commit=os.environ.get('GITHUB_SHA', 'unknown')[:8],
            scan_results=self.scan_results,
            total_vulnerabilities=dict(total),
            recommendations=recommendations
        )

    def _generate_recommendations(self) -> List[str]:
        """Generate recommendations based on findings."""
        recommendations = []
        total_critical = sum(r.summary.get('CRITICAL', 0) for r in self.scan_results)
        total_high = sum(r.summary.get('HIGH', 0) for r in self.scan_results)

        if total_critical > 0:
            recommendations.append(
                f"CRITICAL: {total_critical} critical vulnerabilities found. "
                "These must be addressed immediately before deployment."
            )

        if total_high > 0:
            recommendations.append(
                f"HIGH: {total_high} high severity vulnerabilities found. "
                "Plan to remediate these within 7 days."
            )

        scanners = [r.scanner for r in self.scan_results]

        if not any('semgrep' in s.lower() for s in scanners):
            recommendations.append(
                "Consider enabling SAST scanning with Semgrep for code analysis."
            )

        if not recommendations:
            recommendations.append(
                "No critical or high severity vulnerabilities found. "
                "Continue monitoring and keep dependencies updated."
            )

        return recommendations

    def output_json(self, report: SecurityReport) -> str:
        """Output report as JSON."""
        def serialize(obj):
            if hasattr(obj, '__dict__'):
                return asdict(obj) if hasattr(obj, '__dataclass_fields__') else obj.__dict__
            return str(obj)

        return json.dumps(asdict(report), indent=2, default=serialize)

    def output_markdown(self, report: SecurityReport) -> str:
        """Output report as Markdown."""
        lines = [
            "# Security Scan Report",
            "",
            f"**Generated:** {report.generated_at}",
            f"**Repository:** {report.repository}",
            f"**Branch:** {report.branch}",
            f"**Commit:** {report.commit}",
            "",
            "## Summary",
            "",
            "| Severity | Count |",
            "|----------|-------|",
        ]

        for severity in self.SEVERITY_ORDER:
            count = report.total_vulnerabilities.get(severity, 0)
            lines.append(f"| {severity} | {count} |")

        lines.extend(["", "## Recommendations", ""])

        for rec in report.recommendations:
            lines.append(f"- {rec}")

        lines.extend(["", "## Detailed Findings", ""])

        for result in report.scan_results:
            lines.append(f"### {result.scanner}")
            lines.append("")

            if not result.vulnerabilities:
                lines.append("No vulnerabilities found.")
                lines.append("")
                continue

            by_severity = defaultdict(list)
            for vuln in result.vulnerabilities:
                by_severity[vuln.severity].append(vuln)

            for severity in self.SEVERITY_ORDER:
                vulns = by_severity.get(severity, [])
                if vulns:
                    lines.append(f"#### {severity} ({len(vulns)})")
                    lines.append("")

                    for vuln in vulns[:10]:
                        lines.append(f"- **{vuln.title}** ({vuln.id})")
                        if vuln.file_path:
                            lines.append(f"  - File: `{vuln.file_path}`:{vuln.line_number}")
                        if vuln.remediation:
                            lines.append(f"  - Fix: {vuln.remediation[:100]}")
                        lines.append("")

                    if len(vulns) > 10:
                        lines.append(f"  *...and {len(vulns) - 10} more*")
                        lines.append("")

        return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description='Generate security report from scan results')
    parser.add_argument('--input-dir', '-i', default='./security-reports',
                        help='Directory containing scan results')
    parser.add_argument('--output', '-o', choices=['json', 'markdown', 'html'],
                        default='markdown', help='Output format')
    parser.add_argument('--output-file', '-f', help='Output file path')

    args = parser.parse_args()

    generator = ReportGenerator(args.input_dir)
    generator.collect_results()

    if not generator.scan_results:
        print("No scan results found in input directory", file=sys.stderr)
        sys.exit(1)

    report = generator.generate_report()

    if args.output == 'json':
        output = generator.output_json(report)
    else:
        output = generator.output_markdown(report)

    if args.output_file:
        with open(args.output_file, 'w') as f:
            f.write(output)
        print(f"Report written to {args.output_file}")
    else:
        print(output)


if __name__ == '__main__':
    main()
