.PHONY : \
	analyze \
	build \
	check \
	clean \
	composer \
	composer-audit \
	composer-install \
	config-check \
	config-export \
	config-import \
	config-status \
	drush \
	init \
	lint \
	lint-fix \
	login \
	logs \
	release-build \
	release-smoke-test \
	seed \
	shell \
	site-install \
	start \
	stop \
	test

# Docker user configuration
# This logic is to avoid issues with permissions and mounting local volumes,
# which should be owned by the same UID for Linux distros. Mac OS can use root,
# but it is best practice to run things as with least permission where possible

# Can be set by adding user=<username> and/ or uid=<id> after the make command
# If variables are not set explicitly: try looking up values from current
# environment, otherwise fixed defaults.
# uid= defaults to 0 if user= set (which makes sense if user=root, otherwise you
# probably want to set uid as well).
ifeq ($(user),)
RUN_USER ?= $(or $(strip $(USER)),nodummy)
RUN_UID ?= $(or $(strip $(shell id -u)),4000)
else
RUN_USER = $(user)
RUN_UID = $(or $(strip $(uid)),0)
endif

export RUN_USER
export RUN_UID

# CI has no TTY to attach to
ifdef CI
 DOCKER_EXEC_ARGS := -T
endif

# Commands that need the running site (and its database)
DRUSH := docker compose exec $(DOCKER_EXEC_ARGS) cms drush
# Commands that only need the code
PHP_RUN := docker compose run $(DOCKER_EXEC_ARGS) --rm --no-deps cms

##################################################
# Local development
##################################################
init: build start composer-install site-install seed # Build, start, install Drupal from config/sync and add seed content
	@echo "CMS is running at http://localhost:8090. Run 'make login' for an admin login link."

build: # Build the local development image
	docker compose build cms

start: # Start Drupal and its database
	docker compose up --detach cms cms-db

stop:
	docker compose --profile release down

clean: # Stop everything and delete the local database
	docker compose --profile release down --volumes

logs:
	docker compose logs --follow cms

shell: # Open a shell in the Drupal container
	docker compose exec cms bash

composer-install:
	$(PHP_RUN) composer install

composer: # Run any Composer command, e.g. make composer args="require drupal/token"
	$(PHP_RUN) composer $(args)

site-install: # Install Drupal from config/sync. Replaces the local database.
	$(DRUSH) site:install --existing-config --yes

seed: # Add sample content for local development and CI
	docker compose exec $(DOCKER_EXEC_ARGS) cms dr recipe:apply /app/recipes/simpler_seed_content

drush: # Run any drush command, e.g. make drush args="status"
	$(DRUSH) $(args)

login: # Print a one-time admin login link
	$(DRUSH) user:login

##################################################
# Configuration
##################################################
config-export: # Write the site's configuration to config/sync
	$(DRUSH) config:export --yes

config-import: # Apply config/sync to the local site
	$(DRUSH) config:import --yes

config-status:
	$(DRUSH) config:status

config-check: # Fail if the site's configuration differs from config/sync
	@changes="$$($(DRUSH) config:status --format=list 2>/dev/null)"; \
	if [ -n "$$changes" ]; then \
	  echo "Configuration differs from config/sync. Run 'make config-export' and commit the result:"; \
	  echo "$$changes"; \
	  exit 1; \
	fi; \
	echo "No configuration differences"

##################################################
# Checks
##################################################
check: lint analyze test composer-audit

lint: # Check Drupal coding standards
	$(PHP_RUN) phpcs

lint-fix: # Fix coding standard issues that can be fixed automatically
	$(PHP_RUN) phpcbf

analyze: # Run static analysis
	$(PHP_RUN) phpstan analyse --memory-limit=1G

test:
	$(PHP_RUN) phpunit

composer-audit: # Check dependencies for known security advisories
	$(PHP_RUN) composer audit

##################################################
# Release
##################################################
release-build:
	docker buildx build \
		--target release \
		--platform=linux/amd64 \
		--build-arg RUN_USER=$(RUN_USER) \
		--build-arg RUN_UID=$(RUN_UID) \
		$(OPTS) \
		.

release-smoke-test: # Run the release image with ECS restrictions against the local database and check /health
	docker compose --profile release up --detach --build cms-release
	@for i in $$(seq 1 30); do \
	  if curl -fsS http://localhost:8091/health; then \
	    echo; echo "Release image is healthy"; \
	    docker compose --profile release stop cms-release; \
	    exit 0; \
	  fi; \
	  sleep 2; \
	done; \
	docker compose logs cms-release; \
	docker compose --profile release stop cms-release; \
	exit 1
