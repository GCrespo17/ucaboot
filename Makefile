# Shortcuts for the local Docker setup. Without make, see "Comandos del día a día" in README.md.

# Run one-off backend commands as your host user, so generated files aren't root-owned
RUN_BACKEND := docker compose run --rm --no-deps --user $(shell id -u):$(shell id -g) -e HOME=/tmp backend

.PHONY: up down logs db

up:
	docker compose up --build -d

down:
	docker compose down

logs:
	docker compose logs -f

# After changing the domain schema: generate the Drizzle migration,
# then restart the backend so it applies it.
db:
	$(RUN_BACKEND) npm run db:generate
	docker compose restart backend
