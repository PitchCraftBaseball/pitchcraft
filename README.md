# Pitchcraft
Repository for the PitchCraft web application, authored by Seth Richards, Andrew Chen, Dylan Ferareza, Nicolo Agbayani, Lucas Duong, and Mike Madden.

This repo contains the main PitchCraft webserver (frontend + backend). The model is accessed via the MODEL_BASE_URL environment variable.

---

## Deployment

The app runs as two Docker containers managed by Docker Compose:

- nginx - serves the React frontend and proxies `/api/` requests to the backend
- web - the Node/Express backend, connects to the database and forwards model requests

### Environment variables

Copy `.env.example` to `.env` and fill in the values before running either compose file.

- `DATABASE_URL` - Prisma-format connection string for the database
- `MODEL_BASE_URL` - host and port of the model server, no scheme. The model runs via its own separate Docker Compose stack, so in our setup this is `host.docker.internal:3175`, which routes from the container back to the host where the model is listening
- `IMAGE_TAG` - image tag to pull from the registry (production only)

### Local

Builds images from source. Useful for testing changes without pushing to the registry.

1. Run `docker compose -f docker-compose.local.yml up --build`
2. The app is available at `http://localhost:8080`
3. The backend is also directly reachable at `http://localhost:8000` for debugging

### Production

Pulls pre-built images from `ghcr.io/pitchcraftbaseball/`. Make sure `IMAGE_TAG` is set in your `.env`.

1. Run `docker compose up -d`
2. The app is available at `http://localhost:80`

To update to a new image tag, set `IMAGE_TAG` to the new value and run `docker compose up -d --pull always`.

### Notes

- nginx depends on the backend passing its healthcheck before it starts accepting traffic
- The nginx config is mounted from `./nginx/nginx.conf` at runtime, so changes to it take effect with a container restart without a full rebuild
- The backend runs on port 8000 internally; it is not exposed publicly in the production compose file