# Research Findings: System Design Interview Methodology

## 1. Alex Xu — "System Design Interview" Walkthrough Structure

### 5-Phase Framework (45-60 minutes total)

| Phase | Time | What to Do |
|-------|------|-----------|
| **1. Requirements** | 2-3 min | Clarify functional and non-functional requirements. Ask interviewer: "Are we focusing on 1:1 chats, group chats, or both?" |
| **2. Estimation** | 5-10 min | Back-of-the-envelope calculations: DAU, QPS, storage, bandwidth. Show you understand scale. |
| **3. High-Level Design** | 10-15 min | API design, data model, basic architecture diagram. Keep it simple — 3-5 boxes. |
| **4. Deep Dive** | 15-25 min | Pick 2-3 components and go deep. Discuss trade-offs: SQL vs NoSQL, caching strategy, sharding approach. |
| **5. Wrap-up** | 3-5 min | Discuss monitoring, failure scenarios, future scaling. Show you think beyond the initial design. |

### Key Principles from Alex Xu
- **Start simple, then iterate**: Don't over-engineer from the start
- **Trade-offs are the answer**: Every design decision has pros and cons — articulate them
- **Communication > Perfection**: Interviewers evaluate your thought process, not the perfect solution
- **Drive the conversation**: Don't wait for the interviewer to ask — proactively explain your reasoning

---

## 2. DDIA (Kleppmann) — Part I: Foundations

### Chapter Structure

**Chapter 1: Reliable, Scalable, and Maintainable Applications**
- Reliability: faults vs failures, hardware faults, software errors, human errors
- Scalability: describing load (QPS, latency percentiles), describing performance, approaches to coping with load
- Maintainability: operability, simplicity, evolvability

**Chapter 2: Data Models and Query Languages**
- Relational vs document models
- Schema flexibility, data locality
- Query languages: declarative vs imperative
- Graph-like data models

**Chapter 3: Storage and Retrieval**
- Log-structured storage (LSM trees)
- Page-oriented storage (B-trees)
- Indexes: primary, secondary, clustered
- Column-oriented storage

**Chapter 4: Encoding and Evolution**
- JSON, XML, binary formats
- Schema evolution: forward/backward compatibility
- Dataflow: databases, services, message passing

### Key Concepts for Interviews
- **Latency percentiles**: p50, p95, p99, p999 — why tail latency matters
- **Throughput vs latency**: optimizing for different metrics
- **CAP theorem**: consistency, availability, partition tolerance — know the trade-offs
- **ACID vs BASE**: when to use which

---

## 3. Infrastructure Specifications

### Disk Storage

| Type | Capacity | Use Case | IOPS | Latency |
|------|----------|----------|------|---------|
| **SSD (SATA)** | 1-8 TB | Hot data, databases | ~100K | ~0.1 ms |
| **SSD (NVMe)** | 1-8 TB | High-performance DB | ~500K | ~0.05 ms |
| **HDD** | 8-20 TB | Cold storage, backups | ~200 | ~5 ms |

### Rack Configuration

- **Standard rack**: 42U height
- **Disks per rack**: 20-40 (depending on disk size and power)
- **Power per rack**: ~5-10 kW
- **Network per rack**: 10-40 Gbps top-of-rack switch
- **Racks per datacenter**: 100s to 1000s

### Datacenter Latency

| Distance | Latency | Example |
|----------|---------|---------|
| Same DC | < 1 ms | Two servers in same building |
| Same region | 5-20 ms | US East to US East |
| Cross-region | 20-50 ms | US East to US West |
| Cross-continent | 50-200 ms | US to Europe |
| Cross-globe | 150-300 ms | US to Asia |

### Network Throughput

| Connection | Bandwidth |
|-----------|-----------|
| 1 Gbps | ~125 MB/s |
| 10 Gbps | ~1.25 GB/s |
| 40 Gbps | ~5 GB/s |
| 100 Gbps | ~12.5 GB/s |

### Memory

| Type | Capacity | Latency |
|------|----------|---------|
| **RAM (DDR4)** | 64-512 GB per server | ~100 ns |
| **RAM (DDR5)** | 128-1024 GB per server | ~80 ns |

---

## 4. Network Policy and RBAC

### Network Policy (SD-Interview Level)

**Concepts to mention:**
- **Microsegmentation**: Divide network into small segments, restrict traffic between them
- **Zero Trust**: Never trust, always verify — every connection is authenticated
- **K8s NetworkPolicy**: Define which pods can communicate with each other
  - Ingress rules: who can talk TO this pod
  - Egress rules: where this pod can talk TO
  - Default deny: block all traffic unless explicitly allowed
- **AWS Security Groups**: Stateful firewall at instance level
  - Inbound rules: allow traffic from specific sources
  - Outbound rules: allow traffic to specific destinations
- **Service Mesh (Istio/Linkerd)**: mTLS between services, traffic policies

**What NOT to go deep into:**
- Specific YAML syntax for NetworkPolicy
- BGP routing details
- Low-level packet filtering rules

### RBAC (SD-Interview Level)

**Concepts to mention:**
- **Principle of Least Privilege**: Give minimum necessary permissions
- **K8s RBAC**:
  - Role: defines permissions within a namespace
  - ClusterRole: defines permissions across the cluster
  - RoleBinding: links a Role to users/groups/service accounts
  - ServiceAccount: identity for pods to access K8s API
- **IAM (AWS/Azure/GCP)**:
  - Policies: JSON documents defining permissions
  - Roles: assumed by entities (users, services, EC2 instances)
  - Groups: collection of users with shared permissions
- **ABAC (Attribute-Based Access Control)**: Access based on attributes (user department, time of day, location)

**What NOT to go deep into:**
- Specific JSON policy syntax
- K8s admission controllers
- OIDC/OAuth2 implementation details

---

## 5. Key Numbers for Interviews

### Scale Benchmarks

| Metric | Number | Context |
|--------|--------|---------|
| **Twitter QPS** | 6,000 write, 300K read | Peak traffic |
| **WhatsApp messages** | 65B/day | Global messaging |
| **YouTube uploads** | 500 hours/minute | Video content |
| **Google Search** | 40K QPS | Average |
| **Netflix streaming** | 450M devices | Concurrent streams |

### Time Scales

| Operation | Time | Human-Readable |
|-----------|------|----------------|
| **L1 cache read** | 1 ns | 1 second |
| **L2 cache read** | 4 ns | 4 seconds |
| **RAM read** | 100 ns | 1.5 minutes |
| **SSD read** | 100 μs | 1.5 days |
| **HDD read** | 5 ms | 2.5 months |
| **Network (same DC)** | 0.5 ms | 2.5 weeks |
| **Network (cross-continent)** | 150 ms | 5 years |

### Storage Costs (approximate)

| Storage Type | Cost per GB/Month |
|-------------|-------------------|
| **RAM** | $3-5 |
| **SSD** | $0.10-0.20 |
| **HDD** | $0.01-0.02 |
| **S3 Standard** | $0.023 |
| **S3 Glacier** | $0.004 |

---

*Research compiled for System Design Interview methodology note.*
