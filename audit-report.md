# js-forum — Audit Report

All issues below have been fixed in the patched files.

---

## 🔴 Critical

### 1. SQL Injection in `src/services/auth.js`

**Problem:** User input was concatenated directly into the SQL query string.

```js
// BEFORE (vulnerable)
db.get("SELECT ... WHERE username ='" + user + "' AND password = '" + password + "'", ...)
```

An attacker could log in as any user by supplying `username = ' OR '1'='1`.

**Fix:** Use parameterised queries so user input is never interpreted as SQL.

```js
// AFTER
db.get(
  "SELECT id, username, password FROM users WHERE username = ?",
  [username],
  (err, row) => { ... }
);
```

---

### 2. Plaintext Passwords

**Problem:** Passwords were stored and compared as plaintext. The seed data contained `'admin'` as a literal password. `bcrypt` was already listed in `dependencies` but was never used.

**Fix:** Hash passwords with `bcrypt.hash()` on registration and verify with `bcrypt.compare()` on login. The `addUser` and `authentification` functions in `src/services/auth.js` now use bcrypt with a cost factor of 12.

```js
const hashed = await bcrypt.hash(password, 12);
// ...
const match = await bcrypt.compare(password, row.password);
```

> **Action required:** The seed user passwords in `database/db.js` are placeholder hashes. Run `addUser()` to create real users with properly hashed passwords before use.

---

### 3. Debug Code at Module Top Level in `src/server.js`

**Problem:** A `console.log` with a live `await` call was left at the top level of the server module, running on every startup in production and leaking credentials into logs.

```js
// BEFORE (runs at startup, leaks creds)
console.log("test authentification", await authentification("alice", "admin"))
```

**Fix:** Removed entirely.

---

### 4. Broken Login Response Logic in `src/server.js`

**Problem:** `authentification()` returned a plain boolean, but the success branch tried to read `result.user.username`, which would always be `undefined` and crash.

```js
// BEFORE (always crashes on success)
if (result == true) {
  res.send(`Bienvenue, ${result.user.username} !`); // result.user is undefined
}
```

**Fix:** `authentification()` now returns a structured object `{ success, user?, message? }`, and the response reads from it correctly.

```js
// AFTER
const result = await authentification(username, password);
if (result.success) {
  res.send(`Bienvenue, ${result.user.username} !`);
} else {
  res.status(401).send(`Erreur : ${result.message}`);
}
```

---

### 5. Config Crashes at Startup for the Wrong Database

**Problem:** `src/config/config.js` threw an error if `DB_USER`, `DB_PASSWORD`, or `DB_NAME` environment variables were missing — but the project uses SQLite (a file-based database), not MySQL/PostgreSQL. These env vars were never used, so every fresh clone crashed immediately.

**Fix:** Removed the MySQL/PostgreSQL block from `config.js`. If you migrate to a remote database in the future, add those checks back at that time.

---

### 6. Non-ASCII Character in Database File Path

**Problem:** The SQLite database was opened with an accented filename:

```js
new sqlite3.Database('./database/BaseDeDonné.db');
```

The `é` can cause failures on certain operating systems, filesystems, and CI environments.

**Fix:** Changed to use `forum.db` (which already existed in the project root) with an absolute path resolved via `import.meta.url`.

```js
const db = new sqlite3.Database(path.join(__dirname, 'forum.db'));
```

---

## 🟠 Significant

### 7. `src/services/auth.js` Was a Mix of Router and Service Logic

**Problem:** The file created a `new express.Router()` and a `new express()` app that were never used or exported, and imported `sqlite3` directly instead of using the shared `db` instance.

**Fix:** Cleaned up to a pure service module — only `db`, `bcrypt`, and the two exported functions remain.

---

### 8. Seed Data Violated the `posts` Schema

**Problem:** The `posts` table requires `topic_id NOT NULL`, but seed inserts omitted it:

```js
// BEFORE — violates NOT NULL constraint
db.run("INSERT OR IGNORE INTO posts (id, title, user_id) VALUES (0, 'Welcome...', 0)");
```

**Fix:** Added a seed `topics` row and included `topic_id` in all post seeds:

```js
db.run("INSERT OR IGNORE INTO topics (id, title) VALUES (1, 'General')");
db.run("INSERT OR IGNORE INTO posts (id, topic_id, title, user_id) VALUES (1, 1, 'Welcome to the forum!', 1)");
```

---

### 9. `NOW` Used as a Bare Word Instead of a Function

**Problem:** In `addUser`, the timestamp was passed as the literal string `"NOW"` instead of a date value:

```js
// BEFORE — inserts the string "NOW", not a timestamp
db.prepare("INSERT INTO users ... VALUES (?, ?, ?, NOW)")
```

**Fix:** Use `datetime('now')` inline in the SQL, or pass `new Date().toISOString()` as a bound parameter. The schema now uses `DEFAULT (datetime('now'))` so timestamps are handled automatically.

---

### 10. Mixed `sqlite3` and `sqlite` APIs

**Problem:** `database/db.js` used `new sqlite3.Database()` (the low-level callback API), while `src/services/auth.js` called `.prepare()` / `.finalize()` which belong to the promise-based `sqlite` wrapper. Mixing the two is a runtime error.

**Fix:** All database calls now consistently use the `sqlite3` callback API, matching the `db` instance created in `db.js`.

---

### 11. Unused `mysql2` Dependency

**Problem:** `package.json` declared `mysql2` as a dependency despite the project using SQLite.

**Fix:** Removed from `package.json`.

---

### 12. Spurious `engine` Dependency

**Problem:** `"engine": "^1.0.0"` in `package.json` is a generic placeholder package, not the `engine.io` package also listed. Almost certainly a mistake.

**Fix:** Removed from `package.json`. `engine.io` remains.

---

## 🟡 Minor / Quality

### 13. `.env.exemple` Typo

**Problem:** The env template file used the French spelling `exemple` instead of the English `example`. Tools and developers expect `.env.example`.

**Fix:** File renamed to `.env.example`.

---

### 14. `database/schema.sql` Contains DBML, Not SQL

**Problem:** The file is written in DBML (Database Markup Language, used by dbdiagram.io) but was named `.sql`, making it look like executable SQL.

**Fix:** Renamed to `database/schema.dbml` to match its actual format.

---

### 15. Seed User IDs Start at 0

**Problem:** IDs starting at `0` are unusual, can clash with falsy checks (`if (!id)`), and are inconsistent with SQLite's `AUTOINCREMENT` which starts at 1.

**Fix:** Seed IDs updated to start at 1 throughout (users, posts, follows).

---

### 16. No Tests

**Problem:** `tests/auth.test.js` and `tests/post.test.js` are both empty (0 bytes). The `test` script just echoes a placeholder. Several of the critical bugs above (wrong return type in `authentification`, crash on success) would have been caught immediately by even basic unit tests.

**Recommendation:** Add a test framework (e.g. `vitest` or `jest`) and write tests for `authentification()` covering: valid credentials, wrong password, unknown user, and SQL-special characters in input.

---

## File Change Summary

| File | Changes |
|---|---|
| `src/services/auth.js` | SQL injection fix, bcrypt, clean imports, structured return value |
| `src/server.js` | Removed debug `await`, fixed login response logic, removed dead `console.log`s |
| `database/db.js` | Fixed file path, `datetime('now')`, seed `topic_id`, IDs start at 1 |
| `src/config/config.js` | Removed crash on unused MySQL env vars |
| `package.json` | Removed `engine` and `mysql2` |
| `.env.example` | Renamed from `.env.exemple` |
| `database/schema.dbml` | Renamed from `database/schema.sql` |

---

# js-forum — Full Code Audit Report

**Date:** 2026-06-10  
**Project:** `js-forum-router` (v1.0.0)  
**Scope:** All files under `src/` and `eslint.config.js`  
**Auditor:** Claude (Anthropic)

---

## Summary

| Severity | Count | Status |
|---|---|---|
| 🔴 Critical (runtime crash / broken feature) | 5 | ✅ Fixed |
| 🟠 High (wrong behaviour, security risk) | 4 | ✅ Fixed |
| 🟡 Medium (lint errors, unreachable code) | 3 | ✅ Fixed |
| 🔵 Low (warnings, typos, style) | 3 | ✅ Fixed |
| **Total** | **15** | **0 remaining** |

**Lint result before:** `✖ 4 problems (2 errors, 2 warnings)`  
**Lint result after:** `✔ 0 problems`

---

## 🔴 Critical — Runtime Crash / Broken Feature

---

### C-1 · `src/services/like.js` — `vote` used but never declared

**Lines:** 5, 16  
**ESLint:** `no-undef` error

Both `voteOnPost` and `voteOnComment` compare `current === vote` and pass `vote` to the repo, but neither function accepted `vote` as a parameter. At runtime every call throws a `ReferenceError`, making the entire like/dislike system non-functional.

**Before:**
```js
export async function voteOnPost(userId, postId) {
    const current = await likeRepo.getPostVote(userId, postId);
    if (current === vote) { // ReferenceError: vote is not defined
```

**After:**
```js
export async function voteOnPost(userId, postId, vote) {
    const current = await likeRepo.getPostVote(userId, postId);
    if (current === vote) {
```

Same fix applied to `voteOnComment`.

---

### C-2 · `src/services/like.js` — Wrong repository method names

The service called `likeRepo.createPostVote()` and `likeRepo.createCommentVote()`, which do not exist in `src/repository/like.js`. The correct methods are `upsertPostVote` and `upsertCommentVote` (which use `INSERT … ON CONFLICT DO UPDATE`).

**Before:**
```js
return await likeRepo.createPostVote(userId, postId);
```

**After:**
```js
await likeRepo.upsertPostVote(userId, postId, vote);
```

---

### C-3 · `src/services/like.js` — `recalc` calls are unreachable

`recalcPostVotes` and `recalcCommentVotes` were placed **after** `return` statements inside the `if/else` block. They never executed, meaning post/comment like counts in the database were never updated after a vote.

**Before:**
```js
if (current === vote) {
    return await likeRepo.deletePostVote(userId, postId);
} else {
    return await likeRepo.createPostVote(userId, postId);
}
await likeRepo.recalcPostVotes(postId); // never reached
```

**After:**
```js
if (current === vote) {
    await likeRepo.deletePostVote(userId, postId);
} else {
    await likeRepo.upsertPostVote(userId, postId, vote);
}
await likeRepo.recalcPostVotes(postId); // always runs
```

---

### C-4 · `src/middleware/auth.js` — `req.session` set, but handlers read `req.user`

`requireAuth` stored the resolved session on `req.session`, but every handler in the codebase reads `req.user.id` and `req.user.role`. This meant `req.user` was always `undefined` on authenticated routes, causing every protected endpoint to crash with a `TypeError`.

**Before:**
```js
req.session = session;
```

**After:**
```js
req.user = session;
```

The same mismatch existed in `requireRole`, which read `req.session.role` instead of `req.user.role`:

**Before:**
```js
if (!req.session || !roles.includes(req.session.role)) {
```

**After:**
```js
if (!req.user || !roles.includes(req.user.role)) {
```

---

### C-5 · `src/utils/cookie.js` — Malformed `Set-Cookie` header

`buildCookie` produced an invalid cookie string with `; Path` as a literal fragment before the real `; Path=/` directive:

**Before:**
```js
let cookie = `${encodeURIComponent(name)} = ${encodeURIComponent(value)}; Path`;
cookie += `; Path=${path}`;
```

This built: `session_id%20%3D%20abc123; Path; Path=/; Max-Age=…`

Two bugs in one line:
1. Spaces around `=` caused the cookie name/value to be URL-encoded incorrectly, so `parseCookies` could never find `session_id`.
2. The stray `; Path` text appeared before the real `; Path=` directive, making the cookie unparseable in some browsers.

**After:**
```js
let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
cookie += `; Path=${path}`;
```

---

## 🟠 High — Wrong Behaviour / Security Risk

---

### H-1 · `src/utils/cookie.js` — Wrong environment variable for `secure` flag

The `secure` option defaulted to `process.env.name === 'production'` — `name` is not a valid env var. It should be `NODE_ENV`. In practice `secure` was always `false`, meaning session cookies would have been sent over HTTP even in production.

**Before:**
```js
secure = process.env.name === 'production',
```

**After:**
```js
secure = process.env.NODE_ENV === 'production',
```

---

### H-2 · `src/server.js` — Hardcoded session secret

The `express-session` secret was hardcoded as the plaintext string `'ton_secret_ici'`. A hardcoded secret is a security vulnerability — if the source code is ever exposed, all sessions can be forged.

**Before:**
```js
app.use(session({
  secret: 'ton_secret_ici',
```

**After:**
```js
app.use(session({
  secret: process.env.SESSION_SECRET || 'change_this_secret_in_production',
```

The `SESSION_SECRET` variable should be set in `.env` for local development and as a proper secret in production deployments.

---

### H-3 · `src/server.js` — `session()` registered twice, in the wrong position (second time)

`express-session` was registered once before the routes (correct) and again after the page routes but before the error handler (wrong). The second registration is a no-op at best and a source of subtle session-state confusion at worst. It also placed the session middleware after `app.use("/api", router)`, which would be too late for it to apply to API routes if the first line were ever removed.

Both duplicate registrations were removed and the single correct one (before all routes) was kept.

---

### H-4 · `src/utils/cookie.js` — `buildExpireCookie` always sets `Secure`

The expire cookie (used on logout) unconditionally set the `Secure` flag. In development over plain HTTP, the browser would ignore the cookie deletion, leaving the session cookie alive client-side after logout.

**Before:**
```js
return `${encodeURIComponent(name)}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
```

**After:**
```js
return `${encodeURIComponent(name)}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`;
```

The `Secure` flag is only appropriate on the session-set cookie (where it is already controlled by `NODE_ENV`), not unconditionally on the expiry cookie.

---

## 🟡 Medium — Lint Errors / Unreachable Code

---

### M-1 · `src/server.js` — `closeDb` imported but never used

**ESLint:** `no-unused-vars` warning  
`closeDb` was imported from `database/db.js` but the SIGINT handler used `db.close()` directly (the default export). The named import was dead code.

**Before:**
```js
import { closeDb } from '../database/db.js';
```

**After:** line removed entirely.

---

### M-2 · `src/server.js` — Middleware and routes registered twice

`applyBodyParsing(app)`, `applyLogger(app)`, and `app.use("/api", router)` were each called twice. This caused every API route to be registered twice in Express's routing table and every request body to be parsed twice. The duplicate block was removed.

---

### M-3 · `src/repository/comment.js` — Stray semicolon on function declaration

`getCommentById` was declared as a `function` statement but had a trailing `;` after the closing brace, making it syntactically a function expression statement — inconsistent with every other function in the file and a lint smell.

**Before:**
```js
export function getCommentById(commentId) {
    ...
};  // ← stray semicolon
```

**After:**
```js
export function getCommentById(commentId) {
    ...
}
```

---

## 🔵 Low — Warnings / Typos / Style

---

### L-1 · `src/middleware/errorHandler.js` — `next` declared but never used

**ESLint:** `no-unused-vars` warning  
Express requires error handlers to have exactly 4 parameters `(err, req, res, next)` to be recognised as error handlers — but `next` is legitimately never called here. The fix is to prefix it with `_` to signal intentional non-use, and to configure ESLint to honour that convention.

**Before:**
```js
export const errorHandler = (err, req, res, next) => {
```

**After:**
```js
export const errorHandler = (err, req, res, _next) => {
```

---

### L-2 · `eslint.config.js` — `argsIgnorePattern` not configured

Without `argsIgnorePattern`, ESLint warned on `_next` even after the rename. The rule was updated to suppress warnings on any argument prefixed with `_`, which is the standard convention.

**Before:**
```js
"no-unused-vars": "warn",
```

**After:**
```js
"no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
```

---

### L-3 · `src/services/auth.js` — Constant name typo `SessION_DURATION`

The constant holding the session lifetime was named `SessION_DURATION` (random capitalisation). This is purely cosmetic but breaks naming conventions and reduces readability.

**Before:**
```js
const SessION_DURATION = 7 * 24 * 60 * 60 * 1000;
```

**After:**
```js
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000;
```

---

## Files Changed

| File | Changes |
|---|---|
| `src/services/like.js` | C-1, C-2, C-3 |
| `src/middleware/auth.js` | C-4 |
| `src/utils/cookie.js` | C-5, H-1, H-4 |
| `src/server.js` | H-2, H-3, M-1, M-2 |
| `src/repository/comment.js` | M-3 |
| `src/middleware/errorHandler.js` | L-1 |
| `src/services/auth.js` | L-3 |
| `eslint.config.js` | L-2 |

---

## Recommendations (not yet implemented)

These are observations that go beyond the scope of bug-fixing but are worth addressing before any production deployment.

- **Add a `.env` file** with at minimum `SESSION_SECRET`, `PORT`, and `NODE_ENV`. A `.env.exemple` already exists in the repo — make sure it is complete and that `.env` itself is in `.gitignore`.
- **Remove placeholder password hashes** from `database/db.js` seed data. The `$2b$12$placeholder_replace_with_real_hash` strings are not valid bcrypt hashes and will cause `bcrypt.compare` to throw.
- **Add a `comments` table** to the DB schema. The `schema` string in `db.js` defines `posts`, `users`, `topics`, `follows`, and `sessions` — but not `comments` or `post_votes`/`comment_votes`, which the application actively uses.
- **Validate `topic_id` exists** in `createPost` before inserting — currently a foreign key violation from SQLite will bubble up as an unhandled 500 error.
- **Rate-limit all mutation routes**, not just auth. The `apiLimiter` is currently only applied to `GET /posts` and `GET /posts/:id`. POST, PUT, and DELETE routes have no rate limiting.
- **Populate the empty model files** (`src/models/*.js` are all empty) or remove them to avoid confusion about the intended architecture.