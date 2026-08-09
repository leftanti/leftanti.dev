---
title: Failed sign-on bursts from a single address
date: 2026-08-04
description: Groups failed Entra sign-ins by source address and application to surface password spraying, while ignoring the interrupt result codes that are not really failures.
tags: [entra, identity, password-spray]
dataTable: SigninLogs
technique: T1110.003
draft: true
---

Password spraying looks nothing like brute force in the logs. Brute force is many
failures against one account; spraying is one or two failures against many
accounts, from one address, inside a short window. Counting failures alone finds
neither — you have to count *distinct accounts* alongside them.

## The query

```kql
let lookback = 1h;
let minFailures = 12;
let minAccounts = 5;
// Interrupts, not credential failures. Leaving these in inflates every count.
let interrupts = dynamic(["50125", "50140", "50144"]);
SigninLogs
| where TimeGenerated > ago(lookback)
| where ResultType != "0"
| where ResultType !in (interrupts)
| summarize
    Failures      = count(),
    Accounts      = dcount(UserPrincipalName),
    AccountSample = make_set(UserPrincipalName, 8),
    ResultCodes   = make_set(ResultType, 8),
    FirstSeen     = min(TimeGenerated),
    LastSeen      = max(TimeGenerated)
    by IPAddress, AppDisplayName
| where Failures >= minFailures and Accounts >= minAccounts
| extend BurstWindow = LastSeen - FirstSeen
| project IPAddress, AppDisplayName, Failures, Accounts, BurstWindow,
          AccountSample, ResultCodes, FirstSeen, LastSeen
| sort by Accounts desc, Failures desc
```

## Data sources

`SigninLogs` carries interactive sign-ins only, and only once the Entra ID
diagnostic setting is shipping it to the workspace. Non-interactive sign-ins land
in `AADNonInteractiveUserSignInLogs`, which is a far larger table and frequently
where spraying against legacy protocols actually shows up. If you get nothing
here, check that table before concluding the tenant is quiet.

## Result codes worth knowing

| Code | Meaning |
| --- | --- |
| `0` | Success. Excluded above. |
| `50053` | Account locked, or smart lockout tripped. |
| `50055` | Password expired. |
| `50126` | Invalid username or password. The spraying signal. |
| `50125` | Sign-in interrupted by a password reset. Not a failure. |
| `50140` | Interrupted by "keep me signed in". Not a failure. |

## Tuning

The two thresholds are the whole rule, and both are tenant-shaped. Start by
running the `summarize` on a week of data with the `where` removed, then read the
distribution before you pick numbers — a tenant behind a small NAT range will
show a legitimate baseline that would swamp the defaults here.

Three things generate benign hits, in rough order of how often you will see them:

- **Shared egress.** VPN concentrators and office NAT collapse thousands of users
  onto one address, so `Accounts` climbs on its own. Suppress by address rather
  than by raising the threshold, or you will lose the real signal.
- **Stale credentials on autoconnect.** A saved password on a device that retries
  on a timer produces a steady drip of `50126` from one account. High `Failures`,
  `Accounts` of 1 — which is why the distinct-account floor matters.
- **Service accounts against legacy endpoints.** These cluster on one
  `AppDisplayName`, so grouping by application keeps them contained instead of
  contaminating every other result.

Resist widening `lookback`. A slow spray spread over a day is a different
detection with different thresholds, not this one with a bigger window.
