# WorkQueue — TypeScript Rewrite Plan

## Project Overview

Your **WorkQueue** is a distributed background task processing system (~330 lines of Go) with:
- **Producer** — HTTP server with `/enqueue` endpoint that pushes tasks to Redis
- **Worker** — Concurrent workers (goroutines) that pop tasks from Redis, process them, retry on failure, and expose `/metrics`
- **Shared modules** — Task/Metrics types, file-based logger, task processor (switch-case dispatch)

---

## Should You Use TypeScript? (Language Comparison)

| Aspect | Go (current) | TypeScript / Node.js | Other options |
|---|---|---|---|
| **Concurrency** | Goroutines + sync.WaitGroup (built-in, lightweight) | `async/await` + event loop (single-threaded but great for I/O-bound work like Redis polling) | Rust (overkill), Python (GIL issues) |
| **Redis support** | `go-redis` | `ioredis` or `redis` (excellent, battle-tested) | — |
| **HTTP server** | `net/http` (stdlib) | Express.js / Fastify (very mature) | — |
| **Type safety** | Struct-based | Interfaces + types (great with TS) | — |
| **Ecosystem** | Smaller but focused | Massive npm ecosystem | — |
| **Deployment** | Single binary | Needs Node.js runtime | — |
| **Learning value** | Already done ✅ | High — TS is the most in-demand language for web/backend dev | — |

> [!TIP]
> **TypeScript is an excellent choice** for this project. Your app is I/O-bound (Redis reads/writes, HTTP), which is exactly where Node.js shines. You'll also learn skills directly transferable to full-stack web development.

---

## What You Need to Learn

### Must-Know (before starting)

| Topic | Why | Time to learn |
|---|---|---|
| **TypeScript basics** — types, interfaces, enums, generics | Core language for the rewrite | 2-3 days |
| **async/await & Promises** | Replaces goroutines for I/O concurrency | 1 day |
| **Node.js fundamentals** — modules, `process.env`, file system (`fs`) | Runtime environment | 1 day |
| **Express.js** — routes, middleware, request/response handling | Replaces Go's `net/http` | 1 day |

### Good-to-Know (learn as you build)

| Topic | Why |
|---|---|
| **`ioredis`** npm package | Redis client — very similar API to `go-redis` |
| **`dotenv`** npm package | Replaces `godotenv` for `.env` loading |
| **`winston`** or `pino`** (logging library) | Better than manual file appends |
| **`zod`** (validation library) | Type-safe request validation (optional but great) |
| **npm/package.json** | Dependency management (replaces [go.mod](file:///e:/main_projcts/WorkQueue/go.mod)) |
| **tsconfig.json** | TypeScript compiler configuration |

### Free Resources

1. **TypeScript Handbook** — [typescriptlang.org/docs/handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
2. **Node.js Learn** — [nodejs.org/en/learn](https://nodejs.org/en/learn)
3. **Express.js Getting Started** — [expressjs.com/en/starter](https://expressjs.com/en/starter/installing.html)

---

## Proposed Project Structure (TypeScript)

```
WorkQueue-TS/
├── src/
│   ├── producer/
│   │   └── index.ts          ← Producer HTTP server (/enqueue)
│   ├── worker/
│   │   └── index.ts          ← Worker service (polling loop + /metrics)
│   ├── shared/
│   │   ├── types.ts          ← Task & Metrics interfaces
│   │   ├── redis.ts          ← Redis client factory
│   │   ├── logger.ts         ← File-based logger
│   │   └── processor.ts     ← Task processing (switch-case dispatch)
├── logs/
│   └── logs.txt
├── .env
├── package.json
├── tsconfig.json
└── README.md
```

---

## Go → TypeScript Mapping (file by file)

### 1. [internal/task/task.go](file:///e:/main_projcts/WorkQueue/internal/task/task.go) → `src/shared/types.ts`

```typescript
// Go struct → TypeScript interface
export interface Task {
  type: string;
  payload: Record<string, unknown>;
  retries: number;
}

export interface Metrics {
  total_jobs_in_queue: number;
  jobs_done: number;
  jobs_failed: number;
}
```

### 2. [internal/worker/worker.go](file:///e:/main_projcts/WorkQueue/internal/worker/worker.go) → `src/shared/processor.ts`

```typescript
// Go switch-case → TypeScript switch-case (identical pattern)
export async function processTask(task: Task): Promise<void> {
  if (!task.payload) throw new Error("payload is empty");

  switch (task.type) {
    case "send_email":
      await sleep(2000);
      console.log(`Sending email to ${task.payload.to} with subject ${task.payload.subject}`);
      break;
    case "resize_image":
      console.log(`Resizing image to x: ${task.payload.new_x} y: ${task.payload.new_y}`);
      break;
    // ... add more cases
    default:
      throw new Error("unsupported task");
  }
}
```

### 3. [internal/logger/logger.go](file:///e:/main_projcts/WorkQueue/internal/logger/logger.go) → `src/shared/logger.ts`

- Replace `os.OpenFile` + manual string concatenation with `fs.appendFile`
- Or use `winston`/`pino` for structured logging

### 4. [cmd/producer/main.go](file:///e:/main_projcts/WorkQueue/cmd/producer/main.go) → `src/producer/index.ts`

- `net/http` → Express.js
- `json.NewDecoder` → Express built-in JSON middleware (`express.json()`)
- `rdb.RPush` → `ioredis` `rpush()`

### 5. [cmd/worker/main.go](file:///e:/main_projcts/WorkQueue/cmd/worker/main.go) → `src/worker/index.ts`

- **Goroutines + WaitGroup** → Multiple `async` polling loops with `Promise.all()`
- `rdb.BLPop` → `ioredis` `blpop()` (same blocking pop concept)
- `sync.WaitGroup` → Not needed; `Promise.all()` handles concurrency

---

## Key Concept Translations

| Go Concept | TypeScript Equivalent |
|---|---|
| `goroutine` | `async function` + `Promise.all()` |
| `sync.WaitGroup` | `Promise.all([...])` |
| `context.Background()` | Not needed (or `AbortController` for cancellation) |
| `json.Marshal / Unmarshal` | `JSON.stringify() / JSON.parse()` |
| `map[string]interface{}` | `Record<string, unknown>` |
| `fmt.Errorf(...)` | `new Error(...)` |
| `log.Fatal(...)` | `process.exit(1)` or throw |
| `os.Getenv(...)` | `process.env.VAR_NAME` |
| `godotenv.Load()` | `dotenv.config()` |

---

## Step-by-Step Implementation Order

1. **Initialize project** — `npm init`, install deps, configure `tsconfig.json`
2. **Build shared types** — `types.ts` (Task, Metrics interfaces)
3. **Build Redis client** — `redis.ts` (connect using `ioredis`)
4. **Build logger** — `logger.ts` (file append)
5. **Build task processor** — `processor.ts` (switch-case dispatch)
6. **Build Producer** — Express server with `/enqueue` route
7. **Build Worker** — Polling loop with concurrent async workers + `/metrics`
8. **Test end-to-end** — Start both services, enqueue tasks via curl, check metrics

---

## Verification Plan

### Manual Testing
1. Start Redis locally (or use your existing Redis URL)
2. Run `npx ts-node src/producer/index.ts` — verify server starts
3. Run `npx ts-node src/worker/index.ts` — verify workers start polling
4. `curl -X POST http://localhost:<PORT>/enqueue -H "Content-Type: application/json" -d '{"type":"send_email","retries":3,"payload":{"to":"test@example.com","subject":"hello"}}'`
5. Check worker console for "Sending email to..." output
6. `curl http://localhost:<PORT>/metrics` — verify metrics JSON response
7. Check `logs/logs.txt` for log entries

> [!IMPORTANT]
> Since this is a learning-oriented rewrite, I recommend you **build it yourself step by step** following the plan above, rather than having me generate all the code. That way you'll actually learn TypeScript, async patterns, and Express.js. I can help you with each step as you go.
