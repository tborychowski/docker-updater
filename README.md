# docker updater


## API
- https://docs.docker.com/registry/spec/api/

## Example
- `curl -L -s 'https://registry.hub.docker.com/v2/repositories/library/centos/tags?page_size=1024'|jq '."results"[]["name"]'`
- `curl -s 'https://registry.hub.docker.com/v2/repositories/library/debian/tags/' | jq -r '."results"[]["name"]'`

## Inspiration
- https://github.com/al4/docker-registry-list
- https://gist.github.com/robv8r/fa66f5e0fdf001f425fe9facf2db6d49
-
