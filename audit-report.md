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
