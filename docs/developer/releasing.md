# Releasing

This repository uses a tag-based npm release flow in [`.github/workflows/release.yml`](../../.github/workflows/release.yml).
Only release code that has already been merged into `main`.

## Prerequisite

- Configure npm trusted publishing for this repository/workflow in npm settings.
- Ensure the GitHub Actions workflow keeps `permissions.id-token: write` enabled.

## Release Steps

1. Merge your release PR into `main` (including the `package.json` version bump).
2. Update local `main` and verify you are on the commit you want to release:

```bash
git checkout main
git pull
```

3. Create and push the version tag from `main`:

```bash
git tag -a v0.1.1 -m "Release v0.1.1"
git push origin v0.1.1
```

When a tag like `v1.2.3` is pushed, the release workflow verifies the tag matches `package.json`, runs build, lint, format, tests, and publishes to npm.
It also fails if the tagged commit is not contained in `main`.
