# Tag vocabulary

A working list to pick from when filling in an entry's `tags:` field, so
similar entries converge on the same word instead of drifting — `entra` vs
`azure-ad`, `phishing` vs `social-engineering`.

Not enforced by the schema. `tags` accepts any string. This is a style guide,
not a validator.

**Format:** lowercase, hyphenated, no spaces — `password-spray`, not
`Password Spray`. Matches what's already in use across the example entries and
the intel filter's own vocabulary.

Don't feel obliged to tag heavily. Two or three specific tags beat six vague
ones — the point is finding entries later, not covering every angle.

---

## Identity

`entra` · `azure-ad` · `identity` · `conditional-access` · `mfa` ·
`mfa-bypass` · `mfa-fatigue` · `password-spray` · `credential-theft` ·
`token-theft` · `session-hijacking` · `impossible-travel` · `service-principals` ·
`app-registrations` · `oauth` · `device-code-phishing` · `pim` ·
`privileged-roles` · `guest-accounts` · `federation`

## Endpoint

`defender` · `defender-for-endpoint` · `edr` · `process-creation` ·
`command-line` · `powershell` · `living-off-the-land` · `lolbins` ·
`persistence` · `scheduled-tasks` · `registry` · `services` · `wmi` ·
`dll-hijacking` · `process-injection` · `code-signing`

## Network

`network` · `dns` · `dns-tunneling` · `c2` · `beaconing` · `proxy` ·
`vpn` · `lateral-movement` · `smb` · `rdp` · `winrm` · `kerberos` ·
`ntlm` · `pcap` · `wireshark` · `zeek` · `tls` · `exfiltration`

## Cloud

`azure` · `aws` · `gcp` · `microsoft-365` · `exchange-online` ·
`sharepoint` · `teams` · `storage-accounts` · `key-vault` · `arm-templates` ·
`cloud-misconfiguration` · `supply-chain`

## Email and social engineering

`phishing` · `spearphishing` · `vishing` · `smishing` · `social-engineering` ·
`business-email-compromise` · `clickfix` · `fake-captcha` · `qr-phishing` ·
`attachment-based` · `link-based`

## Malware and tooling

`malware` · `ransomware` · `infostealer` · `stealer` · `backdoor` ·
`rat` · `loader` · `dropper` · `webshell` · `wiper` · `botnet` ·
`cobalt-strike` · `living-off-trusted-sites`

## Threat actors and campaigns

`threat-actor` · `apt` · `nation-state` · `affiliate` · `ransomware-as-a-service` ·
`campaign` · `initial-access-broker`

## Detection engineering

`detection-engineering` · `analytics-rules` · `false-positives` ·
`tuning` · `alert-fatigue` · `severity` · `suppression` · `watchlists` ·
`correlation` · `sigma` · `mitre-attack` · `detection-opportunity`

## Threat hunting

`threat-hunting` · `hypothesis-driven` · `baseline` · `anomaly-detection` ·
`hunting-methodology`

## DFIR

`dfir` · `incident-response` · `forensics` · `memory-forensics` · `volatility` ·
`disk-forensics` · `timeline-analysis` · `artefacts` · `chain-of-custody` ·
`triage`

## Vulnerabilities (used sparingly — this site is not vuln management)

`zero-day` · `known-exploited` · `patch-tuesday` · `exploit`

## KQL and Sentinel mechanics

`kql` · `sentinel` · `log-analytics` · `workbooks` · `data-connectors` ·
`ingestion` · `retention` · `cost-optimisation`

## Certifications and study

`btl2` · `sc-200` · `sc-100` · `az-500` · `ceh` · `oscp` · `gcih` ·
`exam-notes`

## Meta

`opinion` · `methodology` · `career` · `tooling` · `writing`

---

## Sentinel / Defender table names

These usually belong in the typed `dataTable` field rather than free-form
`tags` — see [`maintaining.md`](maintaining.md#adding-content) — but are listed
here since both feed the same tag pages, and it helps to know the exact,
consistent spelling.

`SigninLogs` · `AADNonInteractiveUserSignInLogs` · `AuditLogs` ·
`OfficeActivity` · `DeviceProcessEvents` · `DeviceNetworkEvents` ·
`DeviceFileEvents` · `DeviceRegistryEvents` · `DeviceLogonEvents` ·
`EmailEvents` · `EmailAttachmentInfo` · `EmailUrlInfo` · `IdentityLogonEvents` ·
`CloudAppEvents` · `AlertEvidence` · `SecurityAlert` · `SecurityIncident`

---

## Adding to this list

It's a plain markdown file — edit it like any other doc. No build step
depends on it.
