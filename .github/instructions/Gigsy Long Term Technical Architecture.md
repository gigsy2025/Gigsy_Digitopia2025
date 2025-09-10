---
applyTo: "**/*.ts,**/*.tsx,**/*.js,**/*.jsx"
---

# **📑 Gigsy Long Term Technical Architecture Document**

## **1\. Frontend Layer**

* **Framework:** [Next.js](https://nextjs.org/) (React-based, deployed on **Vercel**)

* **Rendering Strategy:**

  * **SSR (Server-Side Rendering)** → personalized dashboards, gig listings.

  * **SSG/ISR (Static Site Generation / Incremental Static Regeneration)** → marketing pages, static course catalogs.

  * **Prefetching & Next.js Cache** → aggressive client-side caching, reduces backend load.

* **Communication with Backend:**

  * HTTPS API calls (REST/GraphQL from NestJS).

  * Real-time features via **WebSockets** for chat \+ notifications.

---

## **2\. Backend Layer**

* **Framework:** [NestJS](https://nestjs.com/) (Node.js, modular monolith style with potential to evolve into microservices).

* **Patterns:**

  * **Domain-driven modules** (Career Growth, LMS, Gigs, Gamification).

  * **Event-driven architecture** using **NATS** message bus.

* **Services:**

  * **Career Growth Service** → portfolios, mentorship.

  * **Learning Management Service (LMS)** → courses, quizzes, progress, certificates.

  * **Gig Marketplace Service (GMS)** → job postings, applications, escrow/payment.

  * **Gamification Service** → badges, leaderboards, XP (Redis-backed).

  * **Chat Service** → WebSocket \+ MongoDB persistence.

  * **Vector/Embedding Service** → generates embeddings \+ queries vector store (Pinecone/Qdrant).

  * **Search/Recommendation Service** → fuses vector results with filters/scoring (possible Meilisearch for text).

---

## **3\. Data Layer**

* **Postgres (primary relational DB)**

  * Each bounded context has its schema (clean separation).

  * Transactions for critical flows (gig applications, payments).

* **MongoDB**

  * Chat messages, activity streams (append-only, flexible schema).

* **Redis (Upstash)**

  * Caching API responses.

  * Session store.

  * Leaderboards (gamification).

  * Rate-limiting \+ locks.

* **Vector DB (Pinecone/Qdrant/Milvus)**

  * Embedding-powered recommendations & semantic search.

* **Object Storage (S3 / DigitalOcean Spaces)**

  * Course videos.

  * Certificates (PDFs).

  * User portfolio artifacts.

---

## **4\. Messaging & Events**

* **NATS**: lightweight message bus for decoupled services.

  * Example events:

    * `gig.posted` → triggers student recommendations.

    * `course.completed` → updates gamification \+ certificates.

    * `profile.updated` → refreshes vector embeddings.

* **Correlation IDs**:

  * Added via middleware.

  * Propagated in headers \+ logs → request tracing across systems.

---

## **5\. Infrastructure & Deployment**

* **Containerization:**

  * Each service packaged as a **Docker image**.

  * Backend, NATS, Redis, Postgres, MongoDB, Nginx, Certbot defined in `docker-compose.prod.yml`.

* **Reverse Proxy \+ TLS:**

  * **Nginx** routes traffic to NestJS backend.

  * **Certbot** auto-renews Let’s Encrypt certificates for HTTPS.

  * Domain managed via **DuckDNS** (free subdomain).

* **Deployment Target:**

  * **Cloud VPS** (AWS EC2 Free Tier / GCP e2-micro / Hetzner CX11).

  * VPS pulls latest Docker images from **DockerHub**.

  * `docker-compose pull && docker-compose up -d` on each deploy.

---

## **6\. CI/CD Pipeline**

* **GitHub Actions Workflow:**

  * Step 1: Build Docker image for backend.

  * Step 2: Push image to DockerHub (tags: `:dev`, `:prod`, `:commit-sha`).

  * Step 3: SSH into VPS → run `docker-compose pull && up -d`.

* **Frontend:**

  * Auto-deployed by **Vercel** on pushes to `main` branch.

---

## **7\. Logging & Observability**

* **App-level Logging:**

  * **Pino** logger (JSON structured logs).

  * **AsyncLocalStorage** for correlation ID propagation.

* **Log Aggregation:**

  * Forward logs to **Logtail** (real-time searchable dashboard).

* **Metrics (future extension):**

  * Add Prometheus \+ Grafana if scaling beyond hackathon.

---

## **8\. Performance Considerations**

* **Caching Layers:**

  * Next.js cache \+ SSR/ISR for frontend.

  * Redis for hot data and rate-limiting.

* **Database Optimization:**

  * Postgres → normalized schema \+ indexes.

  * MongoDB → capped collections for chat.

* **Scalability:**

  * NATS decouples event-driven flows.

  * Redis \+ Postgres connection pooling.

  * CDN (Vercel \+ S3) for media delivery.

---

## **9\. Future Extensions**

* **Meilisearch** for fast keyword search (complement to vector DB). // Essential we will Implement it.

* **Feature flags** (Unleash / LaunchDarkly).

* **Analytics pipeline** (ClickHouse or Segment).

* **Mobile app** (React Native, reusing backend).

---

✅ **Summary for Hackathon Judges**  
 Gigsy runs on a **modern, production-grade stack**:

* **Frontend:** Next.js (Vercel).

* **Backend:** NestJS (Dockerized, VPS).

* **Data:** Postgres \+ MongoDB \+ Redis \+ Vector DB \+ S3.

* **Messaging:** NATS.

* **Infra:** Nginx \+ Certbot \+ Docker Compose on VPS.

* **CI/CD:** GitHub Actions → DockerHub → VPS auto-pull.

* **Observability:** Pino \+ Correlation IDs \+ Logtail.

This architecture balances **speed (3-week hackathon)** with **enterprise best practices**, and is easily extensible beyond the hackathon.