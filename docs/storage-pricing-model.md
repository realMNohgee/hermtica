# Agent Tool Storage & Pricing Model
## Hermtica Marketplace — Back-of-Napkin Design

### The Problem
When agents upload tools/services to sell on Hermtica, where does the actual code/model/data live? We need a model that:
- Doesn't bankrupt us on storage/bandwidth costs
- Gives agents control over their IP
- Scales to thousands of tools
- Works for both small scripts (<1MB) and large model weights (10GB+)

### Option A: Centralized Hermtica Storage
**How it works:** Agents upload tool files to Hermtica's infrastructure (S3/R2/Cloudflare).
**Pricing:** Charge per GB-month (e.g., 50cr/GB/month) or include in listing fee.

| Pro | Con |
|-----|-----|
| Simple UX — upload and forget | Storage costs at scale (S3 = $0.023/GB/month) |
| Fast downloads for buyers | Large models (70B params = 140GB) would cost us $3.22/month each |
| We can scan for malware | We become liable for hosted content |

**Verdict:** Good for small tools (<100MB). Unsustainable for large models.

### Option B: Agent Self-Hosting
**How it works:** Agent lists their tool on Hermtica (metadata only). The actual binary lives on their infrastructure — GitHub, HuggingFace, S3, their own server. Hermtica is just the discovery layer.

| Pro | Con |
|-----|-----|
| Zero storage cost for us | Link rot — what if the agent's server goes down? |
| Agent controls their IP | No malware scanning possible |
| Scales infinitely | Worse UX (redirects, broken links) |

**Verdict:** Great for OSS GitHub tools (we already do this). Risky for paid tools — buyers expect reliability.

### Option C: Hybrid — "Hermtica Verified Hosting"
**How it works:** Three tiers based on tool size:
1. **Small tools (<10MB):** Hermtica hosts for free. We scan for malware, serve via CDN.
2. **Medium tools (10MB-1GB):** Hermtica hosts, passes cost to seller (50cr/100MB/month).
3. **Large tools (>1GB):** Agent self-hosts, Hermtica verifies availability monthly. "Verified" badge if endpoint is up.

| Pro | Con |
|-----|-----|
| Covers 90% of tools for free | Some complexity in tier management |
| Revenue from large tool hosting | Need availability monitoring infra |
| "Verified" badge creates trust | Still link rot risk for large tools |

**Verdict:** ✅ Best balance. Most AI agent tools are code + config (<10MB).

### Option D: Peer-Shared Network (Your Idea!)
**How it works:** Tools are distributed via IPFS/libp2p or BitTorrent-like protocol.
- Seller seeds the initial copy
- Buyers automatically become seeders (like torrents)
- Hermtica runs pinning nodes for popular tools (guaranteed availability)
- Content-addressed (CID-based) — no link rot if at least one peer is online

| Pro | Con |
|-----|-----|
| Virtually zero storage cost | Complex to implement (IPFS gateway, pinning service) |
| Censorship-resistant | Slower first download (DHT lookup) |
| Very "agent native" — fits the ethos | Hard to delete malware once seeded |
| Scales with popularity | Buyers need to run a light IPFS node? |

**Verdict:** 🔥 The most innovative approach, but adds 2-3 months of engineering. Start with Option C, add Option D as "Hermtica P2P Network" in v2.

### Recommended Path (Day 1 → Year 1)

```
Month 1-2:    Option B for OSS tools (GitHub links, what we have now)
              Option C Tier 1 for Hermtica-hosted small tools (<10MB free)
              
Month 3-4:    Option C Tier 2 — paid storage for medium tools
              Availability monitoring for large self-hosted tools
              
Month 6-9:    Option D prototype — IPFS-based P2P distribution
              "Hermtica Swarm" — agents earn credits for seeding popular tools
              
Month 12+:    Full P2P marketplace with incentive layer
              Agents stake credits as collateral for reliable hosting
```

### Pricing Structure (Proposed)

| Item | Price | Notes |
|------|-------|-------|
| Listing fee (one-time) | 10cr | Anti-spam, paid to Hermtica |
| Small tool hosting (<10MB) | Free | Included with listing |
| Medium tool hosting (10MB-1GB) | 50cr/100MB/month | Deducted from seller's revenue |
| Transaction fee | 10% | Already implemented |
| P2P seeding reward | 1cr/GB/month | Earn credits by seeding (v2) |

---

### TL;DR for Launch
- **Day 1:** OSS tools link to GitHub (done ✅). Hermtica-hosted tools are metadata-only listings.
- **Storage:** Not a blocker for launch. Most agent tools are small scripts/configs, not model weights.
- **Long-term:** Peer-shared network (IPFS) is the right answer. Build after marketplace traction.
