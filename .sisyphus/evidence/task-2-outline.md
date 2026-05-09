# Outline: System Design Interview Walkthroughs

## Walkthrough 1: WhatsApp Messenger (Primary, Detailed)

### Phase 1: Requirements (2-3 min)
**Ask interviewer:**
- "Are we designing 1:1 messaging, group chats, or both?"
- "Do we need cross-device sync (mobile + desktop)?"
- "What's the target scale — millions or billions of users?"

**Functional Requirements (from ДЗ.md):**
- Send/receive text messages
- 1:1 and group chats (up to 256 members)
- Online/offline status
- Read receipts (double checkmarks)
- Media sharing (images, videos, files)
- Cross-device sync

**Non-Functional Requirements:**
- Availability: 99.99% (minimal downtime)
- Latency: < 200ms for message delivery
- Consistency: Messages must arrive in order
- Security: End-to-end encryption

**Link insertions:**
- Reference `base/architecture/System Design/System Design.md` for general methodology
- Reference `base/devops/networks.md` for latency numbers

---

### Phase 2: Estimation (5-10 min)

**Scale (from ДЗ.md):**
- DAU: 200 million
- Messages per user per day: 10
- Total messages per day: 2 billion
- QPS (write): ~23,000 (2B / 86400)
- QPS (read): ~230,000 (10x write, assuming each message read by ~10 people on average)
- Average message size: 100 bytes
- Storage per day: 200 GB (2B × 100 bytes)
- Storage per year: ~73 TB
- Media storage: much larger (images ~1MB, videos ~10MB)

**Dialogue pattern:**
- "Let me do some back-of-the-envelope calculations. With 200M DAU and 10 messages per day..."
- Show the math clearly on the whiteboard

---

### Phase 3: High-Level Design (10-15 min)

**Architecture Diagram (3-5 boxes):**
```
Client App → API Gateway → Application Servers → Database
                ↓
            Message Queue → Push Notification Service
                ↓
            Object Storage (S3) for media
```

**API Design:**
- `POST /messages` — send message
- `GET /messages?chat_id=X&limit=50` — fetch messages
- `GET /users/{id}/status` — get online status
- `POST /media/upload` — upload media

**Data Model:**
- Users table: id, username, phone, last_seen, public_key
- Chats table: id, type (1:1/group), created_at
- Chat_Members table: chat_id, user_id, joined_at
- Messages table: id, chat_id, sender_id, content, type (text/media), created_at, status
- Media table: id, message_id, url, type, size

**Links:**
- Reference `base/architecture/System Design/System Design.md` for API design patterns
- Reference `base/devops/database-ops.md` for database considerations

---

### Phase 4: Deep Dive (15-25 min)

**Topic 1: Message Delivery**
- How to ensure messages arrive in order?
  - Sequence numbers per chat
  - Vector clocks for ordering across servers
- How to handle offline users?
  - Store messages in database
  - Push notifications when user comes online
  - Use WebSocket for real-time delivery

**Topic 2: Scaling the Database**
- Sharding strategy: by user_id or chat_id?
  - By chat_id: keeps conversation history together
  - By user_id: balances load better
  - Hybrid: shard by chat_id, replicate by user_id
- Read replicas for read-heavy workloads
- Caching: Redis for recent messages, user status

**Topic 3: Media Storage**
- Object storage (S3) for images/videos
- CDN for global delivery
- Compression and transcoding

**Topic 4: Cross-Device Sync**
- WebSocket connections per device
- Sync protocol: last_seen_message_id per device
- Conflict resolution: server wins (last write)

**Links:**
- Reference `base/architecture/System Design/System Design.md` for sharding (line 2097)
- Reference `base/architecture/System Design/System Design.md` for caching (line 606)
- Reference `base/architecture/System Design/System Design.md` for message brokers (line 1566)
- Reference `base/architecture/System Design/System Design.md` for replication (line 1743)
- Reference `base/devops/networks.md` for WebSocket (line 412)

---

### Phase 5: Wrap-up (3-5 min)

**Monitoring:**
- Message delivery latency (p50, p95, p99)
- Failed message rate
- Active WebSocket connections
- Storage growth rate

**Failure Scenarios:**
- Database node failure: promote read replica
- WebSocket server failure: reconnect to different server
- Message queue failure: buffer locally, retry

**Future Scaling:**
- Federation: support inter-service messaging
- End-to-end encryption: Signal Protocol
- Disappearing messages

**Links:**
- Reference `base/backend/Microservices/Микросервисы.md` for monitoring patterns

---

## Walkthrough 2: URL Shortener (Secondary, Compact)

### Why This Example?
- **Contrast with WhatsApp**: WhatsApp is write-heavy (messages created constantly); URL Shortener is read-heavy (many reads per write)
- **Different trade-offs**: Consistency vs availability, read optimization vs write optimization
- **Compact**: Fewer components, simpler architecture

### Phase 1: Requirements (brief)
**Functional:**
- Shorten long URL to short alias
- Redirect short URL to original
- Custom aliases (optional)
- Expiration (optional)

**Non-Functional:**
- Latency: < 100ms for redirect
- Availability: 99.9%
- Scale: 100M new URLs/month, 10B redirects/month

### Phase 2: Estimation (brief)
- Write QPS: ~40 (100M/month ÷ 30 days ÷ 86400)
- Read QPS: ~4,000 (10B/month ÷ 30 days ÷ 86400)
- Storage: 100M URLs × 500 bytes = 50 GB/month

### Phase 3: High-Level Design
```
Client → Load Balancer → Application Server → Cache (Redis)
                                    ↓
                                Database (SQL or NoSQL)
```

**API:**
- `POST /shorten` — create short URL
- `GET /{short_code}` — redirect to original

**Data Model:**
- URL mapping: short_code → original_url, created_at, expires_at, click_count

### Phase 4: Deep Dive

**Topic 1: URL Generation**
- Hash-based: MD5/SHA-256 of original URL, take first 7 chars
  - Collision handling: append counter or rehash
- Base62 encoding of auto-increment ID
  - Predictable but simple
- Random string (7 chars, base62 = ~3.5 trillion combinations)
  - Most common approach

**Topic 2: Read Optimization**
- Cache-first: Redis with TTL
- Cache hit ratio: 95%+
- Cache miss: query DB, write to cache

**Topic 3: Database Choice**
- SQL (PostgreSQL): ACID, transactions for counter updates
- NoSQL (Cassandra): horizontal scaling for reads
- **Trade-off**: Consistency vs scalability

**Links:**
- Reference `base/architecture/System Design/System Design.md` for DB types (line 926)
- Reference `base/architecture/System Design/System Design.md` for caching (line 606)
- Reference `base/architecture/System Design/System Design.md` for CAP theorem (line 1997)

### Phase 5: Wrap-up (brief)
- Analytics: click tracking, geographic distribution
- Cleanup: expired URLs, archive old data
- Rate limiting: prevent abuse

---

## Link Insertion Map

| Section | Existing Note | Anchor/Line | Context |
|---------|--------------|-------------|---------|
| Methodology | System Design.md | Introduction | "Подробнее о методологии см. в [System Design.md](path)" |
| Requirements | System Design.md | Requirements section | Reference for requirement types |
| Estimation | System Design.md | Estimation section | Reference for calculation approaches |
| HLD | System Design.md | HLD section | Reference for architecture patterns |
| Deep Dive | System Design.md | Deep Dive section | Reference for component analysis |
| Networks | devops/networks.md | Various | Latency, topology, protocols |
| Storage | devops/linux/os/Хранение.md | Various | Disk types, RAID, partitions |
| K8s Security | devops/kubernetes/Kubernetes Entities.md | NetworkPolicy, RBAC | Security concepts |
| Service Mesh | devops/service-mesh.md | mTLS section | Inter-service security |
| DB Ops | devops/database-ops.md | Various | Database operations |
| Microservices | backend/Microservices/Микросервисы.md | Various | Service patterns |
| WhatsApp ДЗ | architecture/System Design/ДЗ.md | Full document | Requirements source |

## Dialogue Patterns Summary

**At Requirements phase:**
- "Before I start designing, let me clarify a few things..."
- "What's the expected scale — are we talking millions or billions of users?"

**At Estimation phase:**
- "Let me do some back-of-the-envelope math..."
- Show calculations clearly, explain assumptions

**At HLD phase:**
- "I'll start with a simple design and then iterate..."
- Draw 3-5 boxes, explain data flow

**At Deep Dive phase:**
- "Let me dive deeper into [component]..."
- "What are the trade-offs here?"
- Always mention 2-3 alternatives and why you chose one

**At Wrap-up phase:**
- "To monitor this system, I'd track..."
- "If [component] fails, we'd..."
- "In the future, we could scale by..."

## Structural Notes for Final Note

### Section Order in `base/interview/system-design.md`:
1. Introduction (what is SD interview, why it matters)
2. Interview Framework (5 phases, timing, evaluation criteria)
3. Communication Patterns (what to ask, how to present)
4. WhatsApp Walkthrough (full, detailed)
5. Infrastructure Realism (racks, disks, RBAC, Network Policy)
6. URL Shortener Walkthrough (compact, contrast)
7. Preparation Checklist (topics to review, practice exercises)
8. Common Mistakes (7+ mistakes with explanations)
9. Conclusion (key takeaways, further resources)

### Tags: interview, systemdesign, architecture
### Style: Narrative methodology guide (NOT Q&A)
### Links: Standard markdown `[text](path.md)`
### Language: Russian
