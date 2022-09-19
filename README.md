# docker updater
Check for updates for images of running containers.


## Requirements
1. NodeJS v18+ installed
2. docker CLI installed


## Usage
```sh
node index.js  # can be aliased to e.g. `dupd`
```



## Setup for GitHub & GitLab

### If using GitHub (ghcr.io) registry - a token is required:
1. Create a new token: https://github.com/settings/tokens with `read:packages` scope.
2. Add `GH_TOKEN=<token>` to `.env` file


### If using GitLab registry - a token is required:
1. Create a new token: https://gitlab.com/-/profile/personal_access_tokens with `read_api` and `read_registry` scopes.
2. Add `GITLAB_TOKEN=<token>` to `.env` file


## What's wrong with WatchTower?
WatchTower and Diun (I didn't find anything else) have a workflow that I didn't like:<br>
- blind pull everything -> diff hashes -> notify or auto-update<br>

I want to be able to check for updates without pulling anything and at the time I have time to update manually. Like a typical package manager.<br>

This script checks for updates using registry API and check the dates and hashes.

## Inspiration
- https://github.com/al4/docker-registry-list
- https://gist.github.com/robv8r/fa66f5e0fdf001f425fe9facf2db6d49
