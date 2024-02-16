.PHONY : \
	release-build

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

ENVIRONMENT ?= dev

##################################################
# Release
##################################################
release-build:
	docker buildx build \
	  --target release \
		--platform=linux/amd64 \
		--build-arg RUN_USER=$(RUN_USER) \
		--build-arg RUN_UID=$(RUN_UID) \
		--build-arg NEXT_PUBLIC_ENVIRONMENT=${ENVIRONMENT} \
		$(OPTS) \
		.

##################################################
# Local development
##################################################
build: # Build the Next.js local dev server in Docker
	docker-compose build --no-cache nextjs

dev: # Run the Next.js local dev server in Docker
	docker compose up --detach nextjs
	docker compose logs --follow nextjs

storybook: # Run the Storybook local dev server in Docker
	docker compose up --detach storybook
	docker compose logs --follow storybook

stop:
	docker compose down

##################################################
# Load testing
##################################################
load-test-local: # Load test the local environment at localhost:3000
	artillery run -e local artillery-load-test.yml

load-test-staging: # Load test the staging environment in aws
	artillery run artillery-load-test.yml

load-test-production: # Load test the production environment in aws. Please test responsibly
	artillery run -e production artillery-load-test.yml
