---
title: BTL2 — network forensics reference
date: 2026-07-06
description: Ports, protocol tells, and the Wireshark and tcpdump filters worth having in muscle memory for the network forensics section of BTL2.
tags: [btl2, network, wireshark, pcap]
cert: BTL2
draft: true
---

Recall material, not a tutorial. Everything here is standard protocol behaviour.

## Ports worth knowing cold

| Port | Protocol | Note |
| --- | --- | --- |
| 20 / 21 | FTP | Data / control. Credentials in cleartext. |
| 22 | SSH | Also SFTP and SCP. |
| 23 | Telnet | Cleartext. Its presence is the finding. |
| 25 | SMTP | 587 submission, 465 implicit TLS. |
| 53 | DNS | UDP, TCP above 512 bytes and for zone transfers. |
| 67 / 68 | DHCP | Server / client. |
| 80 | HTTP | |
| 88 | Kerberos | |
| 110 / 143 | POP3 / IMAP | 995 / 993 over TLS. |
| 135 | MSRPC | Endpoint mapper. |
| 137–139 | NetBIOS | Name, datagram, session. |
| 389 | LDAP | 636 over TLS, 3268 global catalog. |
| 443 | HTTPS | |
| 445 | SMB | Lateral movement staple. |
| 3389 | RDP | |
| 5985 / 5986 | WinRM | HTTP / HTTPS. PowerShell remoting. |

## Wireshark display filters

| Goal | Filter |
| --- | --- |
| One host, either direction | `ip.addr == 10.0.0.5` |
| Conversation between two hosts | `ip.addr == 10.0.0.5 && ip.addr == 10.0.0.9` |
| Exclude a host | `!(ip.addr == 10.0.0.5)` |
| TCP handshake only | `tcp.flags.syn == 1 && tcp.flags.ack == 0` |
| Resets | `tcp.flags.reset == 1` |
| Retransmissions | `tcp.analysis.retransmission` |
| HTTP requests | `http.request` |
| Requests by host header | `http.host contains "example"` |
| DNS queries only | `dns.flags.response == 0` |
| DNS answers only | `dns.flags.response == 1` |
| Long DNS names (tunnelling tell) | `dns.qry.name.len > 50` |
| TLS client hello | `tls.handshake.type == 1` |
| SNI | `tls.handshake.extensions_server_name` |
| Payload contains a string | `frame contains "password"` |
| SMB2 only | `smb2` |

Display filters use `==`. Capture filters use BPF syntax and do not — mixing the
two is the most common exam slip.

## tcpdump capture filters

| Goal | Filter |
| --- | --- |
| Host | `tcpdump host 10.0.0.5` |
| Source only | `tcpdump src 10.0.0.5` |
| Port | `tcpdump port 53` |
| Range | `tcpdump portrange 1-1024` |
| Network | `tcpdump net 10.0.0.0/24` |
| Combine | `tcpdump 'src 10.0.0.5 and port 443'` |
| Write to file | `tcpdump -w capture.pcap` |
| Read a file | `tcpdump -r capture.pcap` |
| Full packet, no truncation | `tcpdump -s 0` |
| No name resolution | `tcpdump -nn` |

`-nn` matters in forensics: name resolution both slows the capture and generates
traffic of your own.

## File signatures

| Magic bytes | Type |
| --- | --- |
| `4D 5A` | Windows PE (`MZ`) |
| `7F 45 4C 46` | ELF |
| `50 4B 03 04` | ZIP, and everything built on it |
| `25 50 44 46` | PDF (`%PDF`) |
| `FF D8 FF` | JPEG |
| `89 50 4E 47` | PNG |
| `1F 8B` | GZIP |
| `D0 CF 11 E0` | Legacy Office compound file |

## Protocol tells

**DNS tunnelling.** Long labels, high query volume to one domain, `TXT` or `NULL`
record types, high entropy in the subdomain, steady timing. Any one alone is
weak; together they are conclusive.

**Beaconing.** Regular interval between connections to the same destination, small
and near-identical request sizes, an interval that persists across hours. Jitter
widens the distribution but rarely removes the pattern.

**Exfiltration over HTTP.** Outbound volume far exceeding inbound on a protocol
that is normally the other way round. `POST` where the site only ever serves
`GET`.

**ARP spoofing.** Two different MAC addresses claiming one IP, or a burst of
gratuitous ARP replies nobody asked for.

**SMB lateral movement.** Sessions to `ADMIN$` or `IPC$`, service creation over
`svcctl`, a single source touching 445 on many hosts in sequence.

## TCP flags

| Flag | Meaning |
| --- | --- |
| SYN | Open a connection |
| SYN-ACK | Accept |
| ACK | Acknowledge |
| FIN | Graceful close |
| RST | Abrupt close, or nothing listening |
| PSH | Deliver to the application now |
| URG | Urgent pointer valid. Rare, and suspicious when seen. |

Handshake is SYN → SYN-ACK → ACK. Graceful teardown is FIN-ACK both ways. A SYN
answered by RST means the port is closed; a SYN answered by nothing usually means
it was filtered.
