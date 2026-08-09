---
title: Where persistence hides in Entra app registrations
date: 2026-07-19
description: A hunt for credentials quietly added to existing service principals — the persistence that survives a password reset, an MFA enrolment, and a device wipe.
tags: [entra, persistence, service-principals]
dataTable: AuditLogs
technique: T1098.001
draft: true
---

Resetting a compromised account's password feels like closure. It is not, if the
attacker added a client secret to an app registration on the way through. That
credential belongs to the application, not the user, and it survives every
identity remediation step you are likely to take.

## Hypothesis

An attacker with delegated rights over an application will add a credential to an
*existing* service principal rather than register a new one, because new
registrations are what everybody watches.

If true, the signal is in `AuditLogs` under credential-management operations —
and it will be sparse, because legitimate secret rotation is rare in most
tenants.

## The hunt

```kql
let lookback = 30d;
AuditLogs
| where TimeGenerated > ago(lookback)
| where OperationName has_any (
    "Update application - Certificates and secrets management",
    "Update service principal",
    "Add service principal credentials"
  )
| where Result == "success"
| extend
    Actor  = tostring(InitiatedBy.user.userPrincipalName),
    AppId  = tostring(InitiatedBy.app.appId),
    Target = tostring(TargetResources[0].displayName),
    TargetId = tostring(TargetResources[0].id),
    Changes  = tostring(TargetResources[0].modifiedProperties)
| extend Principal = coalesce(Actor, strcat("app:", AppId))
| where Changes has_any ("KeyDescription", "PasswordCredentials", "KeyCredentials")
| project TimeGenerated, Principal, OperationName, Target, TargetId, Changes
| sort by TimeGenerated desc
```

`InitiatedBy` holds either a user or an app depending on how the change was made,
which is why the actor is coalesced. A credential added *by another application*
is considerably more interesting than one added by a named administrator.

## Reading the results

Work outward from the change, not inward from the actor:

1. **Does the application need a credential at all?** Plenty of registrations
   exist for delegated flows and never legitimately hold a secret. One appearing
   is the whole finding.
2. **What is the app entitled to?** Check the app roles granted. A secret on an
   application holding `Mail.Read` or `Directory.ReadWrite.All` is an incident.
   The same secret on an app with no consented permissions is housekeeping.
3. **Who added it, and had they done it before?** First-time credential
   management by an account that has never touched an app registration is worth
   more than the operation itself.
4. **What is the expiry?** Long-dated secrets on an app nobody maintains are how
   this persists past the incident review.

## What this hunt does not cover

Federated credentials, which do not appear as a password or key credential at
all. If the tenant permits workload identity federation, that is a separate hunt
against the same operations with different modified properties — and it is the
quieter option, because there is no secret to leak.

Owner additions are also out of scope here. Adding yourself as an owner of an
application grants the ability to add credentials later, which is the same
persistence one step removed.

## Outcome

Run over 30 days this typically returns single digits in a tenant of any size,
which makes it a good candidate for promotion to a scheduled rule. Before you
promote it, confirm your secret rotation is genuinely as rare as you think — a
tenant with automated rotation will need the rotating principal excluded, and
that exclusion belongs in a watchlist.
