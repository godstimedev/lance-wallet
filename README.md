# Lance Wallet

A full-stack, atomic wallet ledger system designed for high-concurrency financial transactions, complete with a modern, reactive client dashboard.

## 1. System Architecture

This project is split into a decoupled frontend and backend to mirror production environments.

- **Frontend:** A Vite + React application utilizing `Tailwind v4` and `shadcn/ui` for a responsive interface. State and data fetching are managed by `TanStack React Query` to ensure real-time UI updates and cache invalidation.
- **Backend:** A Node.js/Express REST API adhering to a strict 3-tier architecture (Routes ➡️ Controllers ➡️ Models) for clear separation of concerns.
- **Database:** PostgreSQL. The schema relies on an append-only ledger pattern to guarantee financial data integrity.

## 2. Key Design Decisions

- **Strict Double-Entry Accounting:** The database splits financial data into two specialized tables. The `transactions` table acts as the immutable receipt (recording the Sender, Receiver, and Event). The `ledger` table handles the actual double-entry math, creating two rows (a debit and a credit) for every event. This guarantees perfect auditability and lightning-fast balance calculations via `SUM()`.
- **Concurrency & Atomicity:** Transfers are wrapped in strict `BEGIN/COMMIT` transaction blocks. I utilized PostgreSQL's `FOR UPDATE` row-level locking on the sender's wallet to prevent race conditions and overdrafts during concurrent requests.
- **Subjective Metadata via SQL:** Transaction types (e.g. 'TRANSFER_IN' vs 'TRANSFER_OUT') and descriptions are not stored in the database. Because a single transfer is viewed differently by the sender and receiver, these fields are dynamically derived on the fly using SQL `CASE` statements during the `GET /transactions` request. This keeps the database perfectly normalized.
- **Client-Driven Idempotency:** The frontend generates a UUID and passes it via the `Idempotency-Key` header to the `POST /transfer` and `POST /deposit` endpoint. This guarantees that network retries or accidental double-clicks cannot double-charge a user.
- **The User Resolution Pattern:** To respect the backend's strict requirement for UUIDs while providing a consumer-grade UX, I added a `/users/find` endpoint. This allows the frontend to search by human-readable names while seamlessly passing the required user ID to the transfer payload.

## 3. Explanation of Trade-offs

I prioritize core ledger integrity over expansive feature sets.

- **No Automated Test Suite:**
  - _Trade-off:_ I omitted automated tests to focus on concurrency logic and frontend UI polish.
  - _Resolution:_ In production, I would add Integration Tests (Supertest/Vitest) to fire concurrent transfer requests and mathematically prove the row-level locks prevent race conditions, alongside React Testing Library for the UI state.
- **Calculated Balances vs. Cached Balances:**
  - _Trade-off:_ Calculating balance via `SUM()` on every request is 100% accurate but becomes a performance bottleneck at enterprise scale.
  - _Resolution:_ In production, I would use asynchronous materialized views or a Redis cache to serve read-heavy balance requests, keeping the ledger purely for writes.
- **Authentication Shortcut:**
  - _Trade-off:_ I bypassed a complex password/hashing system (bcrypt) in favor of an automatic JWT generation flow upon account creation.
  - _Resolution:_ This allowed me to secure endpoints with `Bearer` tokens and focus engineering time on database concurrency rather than auth boilerplate.
- **Frontend Polling vs. WebSockets:**
  - _Trade-off:_ Used React Query polling (`refetchInterval`) to update the receiving user's dashboard, which adds unnecessary database reads.
  - _Resolution:_ In a real-world app, I would replace this with WebSockets or Server-Sent Events (SSE) to push ledger updates directly to the client.

## 4. Assumptions Made

- **The "System Wallet" for External Deposits:** I assumed that external deposits (e.g., via a credit card or Stripe) should not break the fundamental rule of double-entry accounting (where the sum of the entire ledger must always equal zero). I implemented a "System Wallet" (a master account with a zero-UUID). When a user deposits funds, it is recorded as a strict database transfer from this System Wallet, allowing the platform to easily audit the total amount of real-world cash held in the system.

## 5. How to Run Locally

The entire application has been containerized for developer convenience. Ensure Docker Desktop is running.

**Prerequisites:**

- [Git](https://git-scm.com/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) running on your machine.

### Step 1: Clone the Repository

```bash
git clone https://github.com/godstimedev/lance-wallet.git
cd lance-wallet
```

### Step 2: Start the Application

While in the root directory (where the docker-compose.yml lives), spin up the containers.

_Note: Make sure PORT: 3000, 4000, 5432 are not in use on your machine_

```bash
docker-compose up --build -d
```

_Note: The PostgreSQL container uses an initialization script that automatically builds the tables, indexes, and seeds the initial System Wallet. No manual database migrations are required!_

### Step 3: Access the App

Once Docker finishes building, you can access the completely isolated environments:

Frontend Dashboard: http://localhost:3000

Backend API: http://localhost:4000

Database (Postgres): localhost:5432

## Scaling Question

### How would I scale this application to handle 10,000,000 transactions a day

Processing 10,000,000 transactions a day averages out to ~115 transactions per second (TPS), with peak load potentially hitting 1,000+ TPS. To support this without locking the database, the architecture must transition from synchronous to heavily asynchronous.

- **Compute Infrastructure:** Transition the Node.js backend to stateless microservices running on Kubernetes (EKS/GKE) to allow horizontal auto-scaling based on CPU utilization.

- **Implement load testing or stress testing:** This involves build into our deployment CI/CD pipeline, load or stress test with predefined amount of users on any major release, replicating our production environment to observe bottlenecks and fix them.

- **Asynchronous Queues:** Holding an HTTP connection open for a FOR UPDATE lock will exhaust database connections at high TPS. The POST /transfer endpoint must become asynchronous, returning a 202 Accepted and pushing the payload onto a message broker like Apache Kafka or RabbitMQ. Background workers then pull from this queue and execute the DB transactions sequentially.

- **Database & Caching:** Introduce Redis to cache user balances. When a Kafka worker successfully processes a transfer, it updates the Redis cache. The frontend queries Redis (sub-millisecond latency) instead of PostgreSQL.

- **Monitoring & Observability:** Implement Prometheus and Grafana for real-time monitoring of message broker queue depth and transaction latency. Set up strict PagerDuty alerting for Dead Letter Queues (DLQ) to catch any transactions that fail their concurrency locks and exceed retry limits.
