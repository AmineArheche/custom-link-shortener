# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

---

## Reporting a Vulnerability

We take the security of AuraLink seriously. If you discover a security vulnerability, please do **NOT** open a public issue on GitHub.

Instead, please send an email to the project maintainers or report it privately through GitHub Security Advisories.

### What to Include:
- Description of the vulnerability.
- Steps or proof-of-concept script to reproduce.
- Potential impact and affected components.

We will acknowledge receipt within 48 hours and work with you to coordinate a patched release.

---

## Security Architecture Highlights

AuraLink incorporates multiple defense-in-depth security mechanisms by default:
- **SSRF Mitigation**: Pre-flight DNS resolution and IP validation blocking private RFC 1918 ranges, loopback (`127.0.0.0/8`, `::1`), cloud metadata (`169.254.169.254`), and link-local addresses before scraping HTML metadata.
- **Protocol Whitelisting**: Strict `http` and `https` enforcement, blocking dangerous schemes (`javascript:`, `data:`, `file:`, `vbscript:`).
- **CRLF & Header Injection Defense**: Rejecting carriage returns (`\r`), newlines (`\n`), and control characters.
- **SQL Wildcard DoS Prevention**: Escaping `%`, `_`, and `\` in user search queries.
- **Security Headers**: Standard inclusion of `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, and `X-XSS-Protection`.
