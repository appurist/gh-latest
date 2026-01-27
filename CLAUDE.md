# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`gh-latest` (aka `github-latest`) is a CLI utility that downloads the latest release of a GitHub project. It fetches releases by publish date (not version/tags) and supports downloading zip/tar archives or specific release assets.

## Build Commands

```bash
yarn install          # Install dependencies
yarn build            # Build native executable for current platform
yarn build:win        # Build Windows executable (latest.exe)
yarn build:linux      # Build Linux executable (latest)
yarn build:mac        # Build macOS executable (latest-macos)
yarn start            # Run directly via Node.js
```

Uses [pkg](https://github.com/vercel/pkg) to compile Node.js into standalone executables.

## Architecture

Two-file structure:

- **latest.js** - Main entry point and CLI logic:
  - Argument parsing (options: `-a`, `-v`, `-x`, `-X`, `-h`)
  - GitHub API calls via axios to fetch releases
  - Download handling for zip, tar, and asset formats
  - Determines latest release by comparing `published_at` dates

- **archive.js** - Zip extraction module:
  - Uses yauzl library for zip handling
  - Renames the GitHub-generated top-level folder (e.g., `owner-project-hash`) to `latest-unzipped` for consistent output

## Key Behaviors

- Default format is `zip`, default output filename is `latest.zip` or `latest.tar.gz`
- The `unzip` format is equivalent to `zip` with automatic extraction
- Asset mode (`asset`) can list or download specific release assets
- Extraction always outputs to `latest-unzipped/` folder, replacing GitHub's hash-based folder name
