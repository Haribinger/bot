# Bug Bounty Automation

thepopebot includes a complete bug bounty hunting automation suite with target management, vulnerability tracking, and a security tool marketplace.

---

## Overview

The bug bounty system adds three pages to the web UI and a full backend for managing your hunting workflow:

| Page | Route | Purpose |
|------|-------|---------|
| **Targets** | `/targets` | Manage programs and their in-scope targets |
| **Findings** | `/findings` | Track discovered vulnerabilities and bounties |
| **Toolbox** | `/toolbox` | Install and manage security tools |

---

## Targets Dashboard

### Programs

Programs represent bug bounty programs from platforms like HackerOne, Bugcrowd, Intigriti, YesWeHack, and Federacy. Each program has:

- **Name** — Program name
- **Platform** — Which bounty platform (or custom)
- **URL** — Link to the program page
- **Max Bounty** — Maximum bounty amount
- **Status** — active, paused, or retired

### Syncing from Bounty Platforms

The Targets page includes a **Sync Panel** that imports programs and targets from [arkadiyt/bounty-targets-data](https://github.com/arkadiyt/bounty-targets-data), which aggregates scope data from all major platforms (updated hourly).

**Supported platforms:**
- HackerOne
- Bugcrowd
- Intigriti
- YesWeHack
- Federacy

Click a platform button to sync, or **Sync All** to import from every platform. Use the **Max programs** field to limit how many programs are imported (0 = unlimited).

Syncing is additive — it creates new programs and targets without modifying existing ones. Targets are deduplicated by type + value per program.

### Targets

Each target belongs to a program and has:

- **Value** — The actual target (e.g., `*.example.com`, `192.168.1.0/24`)
- **Type** — domain, wildcard, ip, cidr, url, api, or mobile
- **Status** — in_scope, testing, completed, or out_of_scope

### Automating with Crons

Schedule automatic target syncing by adding a cron entry to `config/CRONS.json`:

```json
{
  "name": "Sync bounty targets",
  "schedule": "0 */6 * * *",
  "type": "agent",
  "job": "Sync targets from all bounty platforms. Use the syncAllTargets function to import new programs and targets from HackerOne, Bugcrowd, Intigriti, YesWeHack, and Federacy."
}
```

---

## Findings Feed

Track vulnerabilities discovered by your agents (or added manually).

### Severity Levels

| Severity | Description |
|----------|-------------|
| **Critical** | Remote code execution, authentication bypass, full data breach |
| **High** | SQL injection, significant data exposure, privilege escalation |
| **Medium** | XSS, CSRF, information disclosure with limited impact |
| **Low** | Minor information leaks, rate limiting issues |
| **Info** | Observations, best practice recommendations |

### Status Workflow

Findings progress through a status pipeline:

```
new → triaging → confirmed → reported → bounty_paid
                                      → duplicate
                                      → resolved
```

### Finding Types

Supported vulnerability types: xss, sqli, ssrf, idor, rce, lfi, open_redirect, subdomain_takeover, info_disclosure, misconfig, auth_bypass, rate_limit, cors, xxe, csrf, other.

### Stats Bar

The Findings page shows a stats bar with counts for total findings, critical, high, confirmed, reported, and total bounty earnings.

---

## Toolbox (Tool Registry)

The Toolbox is a marketplace for security tools that your agents can use.

### Catalog

The built-in catalog includes 68+ real security tools organized into 10 categories:

| Category | Example Tools |
|----------|--------------|
| **Recon** | subfinder, amass, assetfinder, httpx, dnsx, massdns |
| **Scanning** | nuclei, nmap, masscan, naabu, rustscan |
| **Web** | ffuf, feroxbuster, dirsearch, katana, gospider, hakrawler |
| **OSINT** | shodan, theharvester, spiderfoot, recon-ng |
| **Cloud** | prowler, scoutsuite, cloudsplaining, pacu |
| **Credential** | hydra, hashcat, john, kerbrute |
| **Exploitation** | sqlmap, dalfox, xsstrike, commix, metasploit |
| **Binary** | ghidra, radare2, pwntools, ropper |
| **Forensics** | volatility, autopsy, binwalk, foremost |
| **Automation** | axiom, interlace, rush, notify |

### Installing Tools

**From the catalog:** Click **Install** on any tool in the catalog tab.

**From GitHub:** Paste any GitHub URL in the "Install from GitHub" section. The system fetches repo metadata and adds the tool to your registry.

### Docker Containers

Tools with Docker images can be spawned as containers for agents to use. The Containers tab shows running containers with status indicators and stop controls.

---

## Database Tables

The bug bounty system adds 5 tables to the SQLite database:

| Table | Purpose |
|-------|---------|
| `programs` | Bug bounty programs with platform, bounty range, sync status |
| `targets` | In-scope targets (domains, IPs, URLs) linked to programs |
| `findings` | Discovered vulnerabilities with severity, status, and bounty tracking |
| `tools` | Installed security tools from the catalog or GitHub |
| `docker_containers` | Managed Docker containers for tool execution |

Migrations are applied automatically on server startup.

---

## API (Server Actions)

All bounty operations are available as server actions (authenticated via session cookie):

### Programs
- `getPrograms()` — List all programs
- `createProgram(data)` — Create a new program
- `updateProgram(id, data)` — Update a program
- `deleteProgram(id)` — Delete a program

### Targets
- `getTargets(programId?)` — List targets (optionally filtered by program)
- `createTarget(data)` — Create a new target
- `updateTarget(id, data)` — Update a target
- `deleteTarget(id)` — Delete a target

### Findings
- `getFindings(filters?)` — List findings with optional severity/status/target filters
- `createFinding(data)` — Create a new finding
- `updateFinding(id, data)` — Update a finding
- `deleteFinding(id)` — Delete a finding
- `getFindingCounts()` — Get aggregate counts by severity and status

### Sync
- `syncTargetsFromPlatform(platform, options?)` — Sync from a specific platform
- `syncAllTargets(options?)` — Sync from all platforms
- `getSyncStatus()` — Get sync status summary

### Tools
- `getCatalog()` — Get the full tool catalog
- `getInstalledTools()` — List installed tools
- `installTool(catalogId)` — Install a tool from the catalog
- `installFromGithub(url)` — Install a tool from a GitHub URL
- `uninstallTool(id)` — Uninstall a tool
- `toggleTool(id)` — Enable/disable a tool

Import server actions from `thepopebot/chat` for UI components, or from the backing modules directly for programmatic use.
