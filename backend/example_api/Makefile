
# TODO - have to figure out the Docker issues that prevent
# us from pulling in the shared package locally, so just run natively at the moment
run-logs:
	uv run flask --app src.app run --host 0.0.0.0 --port 8080 --reload


# TODO - this is missing the wait-for script logic
# need to figure out how we effectively reuse that (or just copy it)
start-db:
	docker compose up --detach example-db