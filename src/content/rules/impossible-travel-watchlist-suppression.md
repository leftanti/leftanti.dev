---
title: Impossible travel that survives contact with a VPN estate
date: 2026-07-28
description: An impossible-travel rule is only as good as its suppression list. This one drives exclusions from a watchlist so the logic never has to be edited to add an egress range.
tags: [entra, identity, watchlists, false-positives]
dataTable: SigninLogs
technique: T1078.004
severity: medium
draft: true
---

Every impossible-travel detection works on day one and drowns by week two. The
logic is rarely the problem — the problem is that corporate egress makes users
appear to teleport, and the usual fix is to bury exclusions inside the query
where nobody can audit them.

Keep the exclusions in a watchlist instead. The rule then stops changing, and
adding an egress range becomes a data edit rather than a detection edit.

## The logic

Two successful sign-ins for one account, from two countries, close enough
together that the implied speed is impossible. The rule pairs each sign-in with
the account's previous one, so it measures actual consecutive events rather than
comparing everything to a daily first-seen.

```kql
let window = 1d;
let maxPlausibleKph = 900.0;
// Anything egressing through corporate infrastructure. Maintained as data.
let corporateEgress =
    _GetWatchlist('CorporateEgressIPs')
    | project IPAddress = tostring(SearchKey);
SigninLogs
| where TimeGenerated > ago(window)
| where ResultType == "0"
| where isnotempty(LocationDetails)
| where IPAddress !in (corporateEgress)
| extend
    Country   = tostring(LocationDetails.countryOrRegion),
    City      = tostring(LocationDetails.city),
    Latitude  = todouble(LocationDetails.geoCoordinates.latitude),
    Longitude = todouble(LocationDetails.geoCoordinates.longitude)
| where isnotnull(Latitude) and isnotnull(Longitude)
| sort by UserPrincipalName asc, TimeGenerated asc
| extend
    PrevTime = prev(TimeGenerated),
    PrevUser = prev(UserPrincipalName),
    PrevLat  = prev(Latitude),
    PrevLon  = prev(Longitude),
    PrevCity = prev(City),
    PrevCountry = prev(Country)
| where PrevUser == UserPrincipalName
| where Country != PrevCountry
| extend
    Hours = datetime_diff('second', TimeGenerated, PrevTime) / 3600.0,
    Km    = geo_distance_2points(PrevLon, PrevLat, Longitude, Latitude) / 1000.0
| where Hours > 0
| extend ImpliedKph = round(Km / Hours, 1)
| where ImpliedKph > maxPlausibleKph
| project UserPrincipalName, PrevCountry, PrevCity, Country, City,
          PrevTime, TimeGenerated, Km = round(Km, 0), Hours = round(Hours, 2),
          ImpliedKph, IPAddress, AppDisplayName
| sort by ImpliedKph desc
```

## Why a watchlist

`_GetWatchlist` is evaluated at query time, so the suppression list is live. The
practical consequences:

- Adding an egress range is a row, reviewed by whoever owns the range, with a
  timestamp on it. No detection change, no redeploy, no approval queue.
- The exclusion list is greppable. When somebody asks in six months why a
  country pair never alerts, the answer is a row rather than an archaeology dig
  through query history.
- The rule stays readable. Suppression logic inlined into a `where` clause grows
  until the detection's actual intent is unrecoverable.

Keep `SearchKey` as the address column so `!in` stays an indexed lookup.

## False positives

| Cause | What it looks like | Handling |
| --- | --- | --- |
| Mobile roaming | Country flips, same user, minutes apart, mobile carrier ASN | Expected. Suppress by ASN, not by user. |
| Consumer VPN on a laptop | Plausible home country, then an exit node country | Real risk signal. Triage, do not suppress. |
| Geo-IP drift near borders | Two countries, tiny distance, absurd implied speed | Raise `maxPlausibleKph`, or floor on `Km`. |
| Automation with stored creds | Same account, datacentre ASN both sides | Suppress the identity, and ask why it holds a user credential. |

The geo-IP drift case is the one that catches people out. A 30 km hop across a
border in 40 seconds yields an implied speed in the thousands and looks dramatic
in the results. Add `| where Km > 500` if that noise dominates; it costs you
nothing real, because a genuine impossible-travel case is never 30 km.

## Tuning

`maxPlausibleKph` at 900 is roughly commercial cruise speed, which means a
legitimate flight will not trigger but will sit close to the line. Lower it and
you start alerting on connecting flights; raise it much beyond 1000 and you
begin missing the slower end of genuinely anomalous cases.

Do not tune this rule by raising the threshold in response to noise. Almost every
time, the noise is a missing watchlist row.
