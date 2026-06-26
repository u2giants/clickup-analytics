# Directus Access Guard

Date applied: 2026-06-26

## Purpose

`/worksp/directus` is legacy rollback/reference context only. Current POP CRM,
PM/PIM, DAM, PLM master-data import, host workers, timers, systemd units,
shared Supabase schema work, and production app runtime must not depend on this
checkout.

This guard keeps the directory available to AI maintenance sessions running as
the host user `ai`, while blocking ordinary non-`ai` host users and applications
from reading or traversing it. It also adds Linux audit logging so accidental
access attempts can be traced back to a user, process, command, and timestamp.

## What Was Done

Directory ownership and permissions:

```bash
sudo chown ai:ai /worksp/directus
sudo setfacl -b -k /worksp/directus
sudo chmod g-s /worksp/directus
sudo chmod 700 /worksp/directus
```

Meaning:

- `ai` can enter, read, write, run git, and use the repo normally.
- Members of group `ai`, `www-data`, service users, and other normal users
  cannot traverse `/worksp/directus`.
- Existing files were not deleted or moved.
- Root can still bypass normal Unix permissions. Use the audit log to identify
  root-owned or privileged process access.

Linux audit rule:

```bash
sudo tee /etc/audit/rules.d/directus-access-guard.rules >/dev/null <<'EOF'
-a always,exit -F arch=b64 -F dir=/worksp/directus -F perm=rwxa -k directus_access_guard
-a always,exit -F arch=b32 -F dir=/worksp/directus -F perm=rwxa -k directus_access_guard
EOF
sudo augenrules --load
sudo systemctl enable --now auditd
```

Meaning:

- Auditd records read, write, execute, and attribute-change attempts under
  `/worksp/directus`.
- Events are tagged with key `directus_access_guard`.
- Logs are stored in `/var/log/audit/audit.log`.

## How To Check Who Tried To Access It

Show recent matching audit events:

```bash
sudo ausearch -k directus_access_guard -i
```

Show events since a specific time:

```bash
sudo ausearch -k directus_access_guard -ts '2026-06-26 00:00:00' -i
```

Summarize by executable:

```bash
sudo aureport -k -i | rg directus_access_guard
sudo ausearch -k directus_access_guard -i | rg 'type=SYSCALL|exe=|comm=|uid=|auid='
```

Useful fields:

- `comm=` is the process command name.
- `exe=` is the executable path.
- `pid=` is the process id at the time of access.
- `uid=` is the effective user.
- `auid=` is the login/audit user that started the session.
- `cwd=` and `name=` records show the working directory and path involved.
- `success=no` plus `exit=-13(Permission denied)` usually means the guard
  blocked the access.

Example investigation flow:

```bash
sudo ausearch -k directus_access_guard -i
sudo ausearch -k directus_access_guard -i | rg 'success=no|comm=|exe=|uid=|auid=|name='
ps -fp <pid>
systemctl status <suspected-unit> --no-pager -l
```

If the process is gone, use the audit event's `comm=`, `exe=`, `uid=`, `auid=`,
and timestamp to correlate with:

```bash
journalctl --since 'YYYY-MM-DD HH:MM:SS' --until 'YYYY-MM-DD HH:MM:SS'
systemctl list-timers --all
systemctl list-units --type=service --all
```

## How To Verify The Guard

As `ai`, this should work:

```bash
sudo -u ai test -r /worksp/directus/DIRECTUS_ACCESS_GUARD.md
```

As a normal non-`ai` service user, this should fail:

```bash
sudo -u nobody ls /worksp/directus
```

The failed attempt should appear in audit logs:

```bash
sudo ausearch -k directus_access_guard -i | tail -80
```

## How To Temporarily Allow Another User

Prefer temporary ACLs over widening the directory for everyone:

```bash
sudo setfacl -m u:<username>:rx /worksp/directus
```

Remove the temporary access afterward:

```bash
sudo setfacl -x u:<username> /worksp/directus
```

## How To Undo The Guard

Remove the audit rule:

```bash
sudo rm -f /etc/audit/rules.d/directus-access-guard.rules
sudo augenrules --load
```

Restore the old broad workspace-style permissions:

```bash
sudo chown ai:ai /worksp/directus
sudo chmod 2775 /worksp/directus
sudo setfacl -m g:ai:rwx,m:rwx,o:rx /worksp/directus
sudo setfacl -d -m u::rwx,g::rwx,g:ai:rwx,m::rwx,o::rx /worksp/directus
```

Only undo this if `/worksp/directus` intentionally becomes an active dependency
again. Current production Supabase CRM/PLM runtime should stay on
`/worksp/popcrm-web` and `/worksp/shared-db`.
