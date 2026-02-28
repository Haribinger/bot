/**
 * Built-in tool catalog — security tools available for installation.
 * Sourced from Harbinger HexStrike, RedTeam, and PentAGI MCP servers.
 * Each tool has metadata for display, Docker image for execution, and GitHub source for installation.
 */

export const TOOL_CATEGORIES = [
  { id: 'recon', name: 'Recon & Subdomain', color: 'blue', description: 'Asset discovery, subdomain enumeration, DNS resolution' },
  { id: 'scanning', name: 'Network Scanning', color: 'cyan', description: 'Port scanning, service detection, vulnerability scanning' },
  { id: 'web', name: 'Web Application', color: 'orange', description: 'Web fuzzing, SQL injection, XSS, directory brute-forcing' },
  { id: 'osint', name: 'OSINT', color: 'green', description: 'Email harvesting, social recon, breach data, Shodan' },
  { id: 'cloud', name: 'Cloud Security', color: 'purple', description: 'AWS/GCP/Azure auditing, container scanning, IaC analysis' },
  { id: 'credential', name: 'Credential Testing', color: 'red', description: 'Password cracking, brute-forcing, Kerberos attacks' },
  { id: 'exploitation', name: 'Exploitation', color: 'red', description: 'Metasploit, Impacket, payload generation' },
  { id: 'binary', name: 'Binary Analysis', color: 'gray', description: 'Reverse engineering, firmware analysis, debugging' },
  { id: 'forensics', name: 'Forensics & CTF', color: 'yellow', description: 'Memory forensics, file carving, steganography' },
  { id: 'automation', name: 'Automation & Pipelines', color: 'indigo', description: 'Recon pipelines, workflow tools, orchestration' },
];

export const TOOL_CATALOG = [
  // ── Recon & Subdomain ──────────────────────────────────────────────────────
  { id: 'subfinder', name: 'Subfinder', category: 'recon', description: 'Fast passive subdomain enumeration using multiple sources', dockerImage: 'projectdiscovery/subfinder:latest', installCmd: 'go install -v github.com/projectdiscovery/subfinder/v2/cmd/subfinder@latest', sourceUrl: 'https://github.com/projectdiscovery/subfinder' },
  { id: 'amass', name: 'Amass', category: 'recon', description: 'In-depth DNS enumeration and network mapping with OWASP backing', dockerImage: 'caffix/amass:latest', installCmd: 'go install -v github.com/owasp-amass/amass/v4/...@master', sourceUrl: 'https://github.com/owasp-amass/amass' },
  { id: 'dnsx', name: 'dnsx', category: 'recon', description: 'Fast DNS resolution and brute-forcing toolkit', dockerImage: 'projectdiscovery/dnsx:latest', installCmd: 'go install -v github.com/projectdiscovery/dnsx/cmd/dnsx@latest', sourceUrl: 'https://github.com/projectdiscovery/dnsx' },
  { id: 'httpx', name: 'httpx', category: 'recon', description: 'HTTP probing — status codes, titles, tech detection, content-length', dockerImage: 'projectdiscovery/httpx:latest', installCmd: 'go install -v github.com/projectdiscovery/httpx/cmd/httpx@latest', sourceUrl: 'https://github.com/projectdiscovery/httpx' },
  { id: 'katana', name: 'Katana', category: 'recon', description: 'Next-gen web crawling framework for endpoint and parameter discovery', dockerImage: 'projectdiscovery/katana:latest', installCmd: 'go install github.com/projectdiscovery/katana/cmd/katana@latest', sourceUrl: 'https://github.com/projectdiscovery/katana' },
  { id: 'waybackurls', name: 'Waybackurls', category: 'recon', description: 'Fetch all URLs from Wayback Machine for a domain', installCmd: 'go install github.com/tomnomnom/waybackurls@latest', sourceUrl: 'https://github.com/tomnomnom/waybackurls' },
  { id: 'gau', name: 'GAU', category: 'recon', description: 'Get All URLs from AlienVault OTX, Wayback Machine, Common Crawl, URLScan', installCmd: 'go install github.com/lc/gau/v2/cmd/gau@latest', sourceUrl: 'https://github.com/lc/gau' },
  { id: 'hakrawler', name: 'Hakrawler', category: 'recon', description: 'Web crawler for discovering links, endpoints, and forms', installCmd: 'go install github.com/hakluke/hakrawler@latest', sourceUrl: 'https://github.com/hakluke/hakrawler' },
  { id: 'naabu', name: 'Naabu', category: 'recon', description: 'Fast port scanner with SYN/CONNECT scanning and Nmap integration', dockerImage: 'projectdiscovery/naabu:latest', installCmd: 'go install -v github.com/projectdiscovery/naabu/v2/cmd/naabu@latest', sourceUrl: 'https://github.com/projectdiscovery/naabu' },
  { id: 'uncover', name: 'Uncover', category: 'recon', description: 'Quickly discover exposed hosts using Shodan, Censys, Fofa, Hunter', dockerImage: 'projectdiscovery/uncover:latest', installCmd: 'go install -v github.com/projectdiscovery/uncover/cmd/uncover@latest', sourceUrl: 'https://github.com/projectdiscovery/uncover' },

  // ── Network Scanning ───────────────────────────────────────────────────────
  { id: 'nmap', name: 'Nmap', category: 'scanning', description: 'Port scanning, service/OS fingerprinting, NSE scripts', dockerImage: 'instrumentisto/nmap:latest', installCmd: 'apt install -y nmap', sourceUrl: 'https://github.com/nmap/nmap' },
  { id: 'masscan', name: 'Masscan', category: 'scanning', description: 'Internet-scale port scanner — 10M packets/sec', installCmd: 'apt install -y masscan', sourceUrl: 'https://github.com/robertdavidgraham/masscan' },
  { id: 'rustscan', name: 'RustScan', category: 'scanning', description: 'Ultra-fast port scanner written in Rust, pipes to Nmap', dockerImage: 'rustscan/rustscan:latest', installCmd: 'cargo install rustscan', sourceUrl: 'https://github.com/RustScan/RustScan' },
  { id: 'nuclei', name: 'Nuclei', category: 'scanning', description: 'Template-based vulnerability scanner with 8000+ community templates', dockerImage: 'projectdiscovery/nuclei:latest', installCmd: 'go install -v github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest', sourceUrl: 'https://github.com/projectdiscovery/nuclei' },
  { id: 'nikto', name: 'Nikto', category: 'scanning', description: 'Web server vulnerability scanner — misconfigs, dangerous files, outdated software', installCmd: 'apt install -y nikto', sourceUrl: 'https://github.com/sullo/nikto' },
  { id: 'testssl', name: 'testssl.sh', category: 'scanning', description: 'TLS/SSL cipher and protocol testing from the command line', installCmd: 'git clone --depth 1 https://github.com/drwetter/testssl.sh.git', sourceUrl: 'https://github.com/drwetter/testssl.sh' },

  // ── Web Application ────────────────────────────────────────────────────────
  { id: 'ffuf', name: 'FFuf', category: 'web', description: 'Fast web fuzzer for directories, vhosts, parameters, headers', dockerImage: 'ffuf/ffuf:latest', installCmd: 'go install github.com/ffuf/ffuf/v2@latest', sourceUrl: 'https://github.com/ffuf/ffuf' },
  { id: 'gobuster', name: 'Gobuster', category: 'web', description: 'Directory/file/DNS/vhost brute-forcer written in Go', installCmd: 'go install github.com/OJ/gobuster/v3@latest', sourceUrl: 'https://github.com/OJ/gobuster' },
  { id: 'feroxbuster', name: 'Feroxbuster', category: 'web', description: 'Recursive web content discovery with smart filtering', dockerImage: 'epi052/feroxbuster:latest', installCmd: 'cargo install feroxbuster', sourceUrl: 'https://github.com/epi052/feroxbuster' },
  { id: 'sqlmap', name: 'SQLMap', category: 'web', description: 'Automated SQL injection detection and exploitation', installCmd: 'pip install sqlmap', sourceUrl: 'https://github.com/sqlmapproject/sqlmap' },
  { id: 'dalfox', name: 'DalFox', category: 'web', description: 'XSS scanner and parameter analyzer with DOM-based detection', installCmd: 'go install github.com/hahwul/dalfox/v2@latest', sourceUrl: 'https://github.com/hahwul/dalfox' },
  { id: 'wpscan', name: 'WPScan', category: 'web', description: 'WordPress vulnerability scanner — plugins, themes, users', dockerImage: 'wpscanteam/wpscan:latest', installCmd: 'gem install wpscan', sourceUrl: 'https://github.com/wpscanteam/wpscan' },
  { id: 'arjun', name: 'Arjun', category: 'web', description: 'HTTP parameter discovery via brute-force and heuristics', installCmd: 'pip install arjun', sourceUrl: 'https://github.com/s0md3v/Arjun' },
  { id: 'xsser', name: 'XSSer', category: 'web', description: 'XSS vulnerability detection framework with multiple vectors', installCmd: 'pip install xsser', sourceUrl: 'https://github.com/epsylon/xsser' },
  { id: 'jwt_tool', name: 'jwt_tool', category: 'web', description: 'JWT token testing — alg:none, key confusion, brute-force', installCmd: 'pip install jwt_tool', sourceUrl: 'https://github.com/ticarpi/jwt_tool' },
  { id: 'commix', name: 'Commix', category: 'web', description: 'Automated command injection and exploitation tool', installCmd: 'pip install commix', sourceUrl: 'https://github.com/commixproject/commix' },
  { id: 'ssrfmap', name: 'SSRFMap', category: 'web', description: 'SSRF exploitation and detection framework', installCmd: 'git clone https://github.com/swisskyrepo/SSRFmap.git', sourceUrl: 'https://github.com/swisskyrepo/SSRFmap' },
  { id: 'paramspider', name: 'ParamSpider', category: 'web', description: 'Mine parameters from web archives for all endpoints', installCmd: 'pip install paramspider', sourceUrl: 'https://github.com/devanshbatham/ParamSpider' },

  // ── OSINT ──────────────────────────────────────────────────────────────────
  { id: 'theharvester', name: 'theHarvester', category: 'osint', description: 'Email, subdomain, and name harvesting from public sources', installCmd: 'pip install theHarvester', sourceUrl: 'https://github.com/laramies/theHarvester' },
  { id: 'shodan', name: 'Shodan CLI', category: 'osint', description: 'Search internet-connected devices, ICS, databases, webcams', installCmd: 'pip install shodan', sourceUrl: 'https://github.com/achillean/shodan-python' },
  { id: 'sherlock', name: 'Sherlock', category: 'osint', description: 'Hunt usernames across 400+ social networks', installCmd: 'pip install sherlock-project', sourceUrl: 'https://github.com/sherlock-project/sherlock' },
  { id: 'spiderfoot', name: 'SpiderFoot', category: 'osint', description: 'OSINT automation — 200+ data sources, correlation engine', dockerImage: 'spiderfoot/spiderfoot:latest', installCmd: 'pip install spiderfoot', sourceUrl: 'https://github.com/smicallef/spiderfoot' },
  { id: 'dnsrecon', name: 'DNSRecon', category: 'osint', description: 'DNS enumeration — zone transfers, brute-force, cache snooping', installCmd: 'pip install dnsrecon', sourceUrl: 'https://github.com/darkoperator/dnsrecon' },
  { id: 'whois', name: 'Whois', category: 'osint', description: 'Domain registration lookup — registrar, nameservers, contacts', installCmd: 'apt install -y whois' },
  { id: 'trufflehog', name: 'TruffleHog', category: 'osint', description: 'Find leaked credentials in Git repos, S3, filesystems', installCmd: 'pip install trufflehog', sourceUrl: 'https://github.com/trufflesecurity/trufflehog' },
  { id: 'gitleaks', name: 'Gitleaks', category: 'osint', description: 'Detect hardcoded secrets in Git repos using regex and entropy', installCmd: 'go install github.com/gitleaks/gitleaks/v8@latest', sourceUrl: 'https://github.com/gitleaks/gitleaks' },

  // ── Cloud Security ─────────────────────────────────────────────────────────
  { id: 'prowler', name: 'Prowler', category: 'cloud', description: 'AWS/Azure/GCP security assessment and CIS compliance', dockerImage: 'prowlercloud/prowler:latest', installCmd: 'pip install prowler', sourceUrl: 'https://github.com/prowler-cloud/prowler' },
  { id: 'trivy', name: 'Trivy', category: 'cloud', description: 'Container, filesystem, and IaC vulnerability scanner', dockerImage: 'aquasec/trivy:latest', installCmd: 'apt install -y trivy', sourceUrl: 'https://github.com/aquasecurity/trivy' },
  { id: 'checkov', name: 'Checkov', category: 'cloud', description: 'IaC security scanner — Terraform, Kubernetes, ARM, CloudFormation', installCmd: 'pip install checkov', sourceUrl: 'https://github.com/bridgecrewio/checkov' },
  { id: 'scoutsuite', name: 'ScoutSuite', category: 'cloud', description: 'Multi-cloud security auditing for AWS, GCP, Azure, Alibaba, Oracle', installCmd: 'pip install scoutsuite', sourceUrl: 'https://github.com/nccgroup/ScoutSuite' },
  { id: 'docker_bench', name: 'Docker Bench', category: 'cloud', description: 'CIS Docker Community Edition benchmark checks', sourceUrl: 'https://github.com/docker/docker-bench-security', installCmd: 'git clone https://github.com/docker/docker-bench-security.git' },
  { id: 'kube_hunter', name: 'Kube-Hunter', category: 'cloud', description: 'Kubernetes cluster penetration testing from inside or outside', installCmd: 'pip install kube-hunter', sourceUrl: 'https://github.com/aquasecurity/kube-hunter' },
  { id: 's3scanner', name: 'S3Scanner', category: 'cloud', description: 'Scan for misconfigured S3 buckets across AWS accounts', installCmd: 'pip install s3scanner', sourceUrl: 'https://github.com/sa7mon/S3Scanner' },
  { id: 'cloudbrute', name: 'CloudBrute', category: 'cloud', description: 'Enumerate cloud resources across AWS, Azure, GCP', installCmd: 'go install github.com/0xsha/CloudBrute@latest', sourceUrl: 'https://github.com/0xsha/CloudBrute' },

  // ── Credential Testing ─────────────────────────────────────────────────────
  { id: 'hydra', name: 'Hydra', category: 'credential', description: 'Parallelized login brute-forcer for 50+ protocols', installCmd: 'apt install -y hydra', sourceUrl: 'https://github.com/vanhauser-thc/thc-hydra' },
  { id: 'hashcat', name: 'Hashcat', category: 'credential', description: 'GPU-accelerated hash cracking — 300+ hash types', installCmd: 'apt install -y hashcat', sourceUrl: 'https://github.com/hashcat/hashcat' },
  { id: 'john', name: 'John the Ripper', category: 'credential', description: 'Password cracker supporting many hash formats with wordlist and rules', installCmd: 'apt install -y john', sourceUrl: 'https://github.com/openwall/john' },
  { id: 'kerbrute', name: 'Kerbrute', category: 'credential', description: 'Kerberos pre-auth brute-forcing for AD user enumeration', installCmd: 'go install github.com/ropnop/kerbrute@latest', sourceUrl: 'https://github.com/ropnop/kerbrute' },

  // ── Exploitation ───────────────────────────────────────────────────────────
  { id: 'metasploit', name: 'Metasploit', category: 'exploitation', description: 'Penetration testing framework — exploit development and execution', dockerImage: 'metasploitframework/metasploit-framework:latest', installCmd: 'curl https://raw.githubusercontent.com/rapid7/metasploit-framework/master/msfinstall | bash', sourceUrl: 'https://github.com/rapid7/metasploit-framework' },
  { id: 'impacket', name: 'Impacket', category: 'exploitation', description: 'Windows protocol attack suite — psexec, secretsdump, ntlmrelayx', installCmd: 'pip install impacket', sourceUrl: 'https://github.com/fortra/impacket' },
  { id: 'pwntools', name: 'pwntools', category: 'exploitation', description: 'CTF and exploit development library for Python', installCmd: 'pip install pwntools', sourceUrl: 'https://github.com/Gallopsled/pwntools' },

  // ── Binary Analysis ────────────────────────────────────────────────────────
  { id: 'binwalk', name: 'Binwalk', category: 'binary', description: 'Firmware analysis, extraction, and signature scanning', installCmd: 'pip install binwalk', sourceUrl: 'https://github.com/ReFirmLabs/binwalk' },
  { id: 'checksec', name: 'Checksec', category: 'binary', description: 'Check binary security properties — NX, PIE, RELRO, canary', installCmd: 'apt install -y checksec', sourceUrl: 'https://github.com/slimm609/checksec.sh' },
  { id: 'radare2', name: 'Radare2', category: 'binary', description: 'Reverse engineering framework — disassembly, debugging, analysis', installCmd: 'git clone https://github.com/radareorg/radare2.git && cd radare2 && sys/install.sh', sourceUrl: 'https://github.com/radareorg/radare2' },
  { id: 'ghidra', name: 'Ghidra', category: 'binary', description: 'NSA reverse engineering and decompilation tool', sourceUrl: 'https://github.com/NationalSecurityAgency/ghidra' },

  // ── Forensics & CTF ────────────────────────────────────────────────────────
  { id: 'volatility', name: 'Volatility3', category: 'forensics', description: 'Memory forensics — process analysis, network connections, malware detection', installCmd: 'pip install volatility3', sourceUrl: 'https://github.com/volatilityfoundation/volatility3' },
  { id: 'foremost', name: 'Foremost', category: 'forensics', description: 'File carving from raw disk images and memory dumps', installCmd: 'apt install -y foremost' },
  { id: 'steghide', name: 'Steghide', category: 'forensics', description: 'Steganography detection and extraction from images and audio', installCmd: 'apt install -y steghide' },
  { id: 'exiftool', name: 'ExifTool', category: 'forensics', description: 'Read, write, and analyze file metadata across all formats', installCmd: 'apt install -y libimage-exiftool-perl', sourceUrl: 'https://github.com/exiftool/exiftool' },
  { id: 'tshark', name: 'Tshark', category: 'forensics', description: 'CLI packet capture and analysis (Wireshark engine)', installCmd: 'apt install -y tshark' },

  // ── Automation & Pipelines ─────────────────────────────────────────────────
  { id: 'reconftw', name: 'ReconFTW', category: 'automation', description: 'All-in-one recon pipeline: subdomains → ports → vulns → screenshots', dockerImage: 'six2dez/reconftw:latest', installCmd: 'git clone https://github.com/six2dez/reconftw.git && cd reconftw && ./install.sh', sourceUrl: 'https://github.com/six2dez/reconftw' },
  { id: 'axiom', name: 'Axiom', category: 'automation', description: 'Dynamic infrastructure for distributed scanning across cloud VPS', installCmd: 'bash <(curl -s https://raw.githubusercontent.com/pry0cc/axiom/master/interact/axiom-configure)', sourceUrl: 'https://github.com/pry0cc/axiom' },
  { id: 'notify', name: 'Notify', category: 'automation', description: 'Stream tool output to Slack, Discord, Telegram, email', installCmd: 'go install -v github.com/projectdiscovery/notify/cmd/notify@latest', sourceUrl: 'https://github.com/projectdiscovery/notify' },
  { id: 'interactsh', name: 'Interactsh', category: 'automation', description: 'OOB interaction server for detecting blind vulnerabilities (SSRF, XXE, RCE)', dockerImage: 'projectdiscovery/interactsh:latest', installCmd: 'go install -v github.com/projectdiscovery/interactsh/cmd/interactsh-client@latest', sourceUrl: 'https://github.com/projectdiscovery/interactsh' },
  { id: 'gowitness', name: 'Gowitness', category: 'automation', description: 'Web screenshot utility for large-scale recon visualization', installCmd: 'go install github.com/sensepost/gowitness@latest', sourceUrl: 'https://github.com/sensepost/gowitness' },
  { id: 'aquatone', name: 'Aquatone', category: 'automation', description: 'Visual recon — HTTP screenshot and report generation for subdomains', installCmd: 'go install github.com/michenriksen/aquatone@latest', sourceUrl: 'https://github.com/michenriksen/aquatone' },
];

/**
 * Get the full catalog as a lookup map by ID.
 */
export function getCatalogMap() {
  return Object.fromEntries(TOOL_CATALOG.map(t => [t.id, t]));
}

/**
 * Get tools grouped by category.
 */
export function getCatalogByCategory() {
  const groups = {};
  for (const tool of TOOL_CATALOG) {
    if (!groups[tool.category]) groups[tool.category] = [];
    groups[tool.category].push(tool);
  }
  return groups;
}

/**
 * Search catalog by name/description.
 */
export function searchCatalog(query) {
  const q = query.toLowerCase();
  return TOOL_CATALOG.filter(t =>
    t.name.toLowerCase().includes(q) ||
    t.description.toLowerCase().includes(q) ||
    t.category.toLowerCase().includes(q)
  );
}
