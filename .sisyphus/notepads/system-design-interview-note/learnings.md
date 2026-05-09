# Learnings — System Design Interview Note

## Conventions
- **Links**: Standard markdown `[text](path.md)`, NOT wikilinks
- **Language**: Russian
- **Tags**: interview, systemdesign, architecture
- **Format**: Narrative methodology guide (NOT Q&A like javascript.md/react.md/web.md)
- **Style**: DDIA (Kleppmann) + System Design Interview (Alex Xu) — methodological, trade-off focused

## Key Decisions
- Do NOT duplicate methodology from `System Design.md` — only reference it
- WhatsApp is primary walkthrough (from ДЗ.md: 200M DAU, 10 msg/day)
- URL Shortener is second walkthrough (contrast: read-heavy, different trade-offs)
- Infrastructure realism: real numbers for disks, racks, latency

## Existing Files Verified by Momus
- `base/architecture/System Design/System Design.md` — line refs accurate
- `base/architecture/System Design/ДЗ.md` — WhatsApp requirements
- `base/devops/networks.md` — 2038 lines
- `base/devops/linux/os/_lessons/Хранение.md` — storage
- `base/devops/linux/os/_lessons/Доступ и права.md` — access control
- `base/devops/kubernetes/Kubernetes Entities.md` — NetworkPolicy, RBAC
- `base/devops/service-mesh.md` — mTLS
- `base/devops/database-ops.md` — DB operations
- `base/backend/Microservices/Микросервисы.md` — microservices
- `base/interview/javascript.md`, `react.md`, `web.md` — existing interview format

## Line Number Anchors (verified)
- WebSocket: line 412
- Caching: line 606
- Sharding: line 2097
- Message brokers: line 1566
- Replication: line 1743
- DB types: line 926
- CAP: line 1997

## Infrastructure Specs (to be researched)
- SSD: 1-8TB
- HDD: 8-20TB
- Rack: 42U standard, 20-40 disks per rack
- Latency: <1ms same DC, 5-20ms same region, 50-200ms cross-continent

## Target Output
- `base/interview/system-design.md` (~1500-2500 lines)
- Must pass `npx quartz build -d base`
