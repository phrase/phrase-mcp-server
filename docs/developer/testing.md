# Testing

## Replay tests (Polly cassettes)

Some tests use [Polly.js](https://netflix.github.io/pollyjs/) to record and replay real HTTP interactions. Cassettes (HAR files) are committed under `src/products/strings/tools/__recordings__/` and are played back automatically — no API token or network access required when running tests normally.

### When to re-record

Re-record cassettes when:

- The underlying API behaviour has changed (new fields, different response shape).
- A new test case was added that has no cassette yet.
- An existing cassette is stale and tests fail in replay mode.

### How to re-record

1. Export a valid Phrase Strings API token:

   ```sh
   export PHRASE_STRINGS_TOKEN=your-api-token
   ```

2. Run the target tests in `record` mode:

   ```sh
   POLLY_MODE=record npm test -- src/products/strings/tools/pull.test.ts
   POLLY_MODE=record npm test -- src/products/strings/tools/push.test.ts
   ```

   Polly writes new HAR files under `__recordings__/` next to the test file.

3. Verify the new cassettes work in replay mode (default):

   ```sh
   npm test -- src/products/strings/tools/pull.test.ts
   npm test -- src/products/strings/tools/push.test.ts
   ```

4. Commit the updated cassette files.

### What gets scrubbed

Before cassettes are written to disk, `polly-setup.ts` automatically redacts:

- `Authorization` request headers → `Bearer REDACTED`
- `subject_token` in IDM token-exchange request bodies → `REDACTED`
- `access_token` in IDM token-exchange response bodies → `REDACTED`
- `_phrase_session_sec` session cookies → `REDACTED`
- Multipart form boundaries → `POLLY_BOUNDARY` (so boundaries don't affect matching)

It is safe to commit cassettes — no secrets are stored.

### Matching strategy

Cassettes are matched by HTTP method and URL path only (query strings, headers, and request bodies are ignored). Within a single test, repeated calls to the same endpoint are matched in order.
