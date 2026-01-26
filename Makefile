PROJECT_ROOT ?= $(notdir $(PWD))

# Use `=` instead of `:=` so that we only execute `./bin/current-account-alias` when needed
# See https://www.gnu.org/software/make/manual/html_node/Flavors.html#Flavors
CURRENT_ACCOUNT_ALIAS = `./bin/current-account-alias`

CURRENT_ACCOUNT_ID = $(./bin/current-account-id)

# Get the list of reusable terraform modules by getting out all the modules
# in infra/modules and then stripping out the "infra/modules/" prefix
MODULES := $(notdir $(wildcard infra/modules/*))

# Check that given variables are set and all have non-empty values,
# die with an error otherwise.
#
# Params:
#   1. Variable name(s) to test.
#   2. (optional) Error message to print.
# Based off of https://stackoverflow.com/questions/10858261/how-to-abort-makefile-if-variable-not-set
check_defined = \
	$(strip $(foreach 1,$1, \
        $(call __check_defined,$1,$(strip $(value 2)))))
__check_defined = \
	$(if $(value $1),, \
		$(error Undefined $1$(if $2, ($2))$(if $(value @), \
			required by target '$@')))


.PHONY : \
	e2e-build \
	e2e-clean-report \
<<<<<<< before updating
<<<<<<< before updating
	e2e-delete-image \
=======
=======
>>>>>>> after updating
	e2e-format \
	e2e-format-check \
	e2e-format-check-native \
	e2e-format-native \
<<<<<<< before updating
>>>>>>> after updating
=======
>>>>>>> after updating
	e2e-merge-reports \
	e2e-setup \
	e2e-setup-ci \
	e2e-show-report \
	e2e-test \
	e2e-test-native \
<<<<<<< before updating
=======
	e2e-test-native-ui \
	e2e-type-check \
	e2e-type-check-native \
<<<<<<< before updating
>>>>>>> after updating
=======
>>>>>>> after updating
	help \
	infra-check-app-database-roles \
	infra-check-compliance-checkov \
	infra-check-compliance-tfsec \
	infra-check-compliance \
	infra-check-github-actions-auth \
	infra-configure-app-build-repository \
	infra-configure-app-database \
	infra-configure-app-service \
	infra-configure-monitoring-secrets \
	infra-configure-network \
	infra-format \
	infra-lint \
	infra-lint-markdown \
	infra-lint-scripts \
	infra-lint-terraform \
	infra-lint-workflows \
	infra-module-database-role-manager-archive \
	infra-set-up-account \
	infra-test-service \
	infra-update-app-build-repository \
	infra-update-app-database-roles \
	infra-update-app-database \
	infra-update-app-service \
	infra-update-current-account \
	infra-update-network \
	infra-validate-modules \
	invalidate-cloudfront-cache \
	release-build \
	release-deploy \
	release-image-name \
	release-image-tag \
	release-publish \
	release-run-database-migrations

##############################
## End-to-end (E2E) Testing ##
##############################

e2e-build: ## Build the e2e Docker image, if not already built, using ./e2e/Dockerfile
	docker build -t playwright-e2e -f ./e2e/Dockerfile .

e2e-clean-report: ## Remove the local ./e2e/playwright-report and ./e2e/test-results folder and their contents
	rm -rf ./e2e/playwright-report
	rm -rf ./e2e/blob-report
	rm -rf ./e2e/test-results

<<<<<<< before updating
<<<<<<< before updating
e2e-delete-image: ## Delete the Docker image for e2e tests
	@docker rmi -f playwright-e2e 2>/dev/null || echo "Docker image playwright-e2e does not exist, skipping."

e2e-merge-reports: ## Merge Playwright blob reports from multiple shards into an HTML report
	@cd e2e && npx playwright merge-reports --reporter html blob-report

e2e-setup-ci: ## Setup end-to-end tests for CI
	@cd e2e && npm ci
	@cd e2e && npx playwright install --with-deps

e2e-setup-native: ## Setup end-to-end tests
	@cd e2e && npm install
	@cd e2e && npx playwright install --with-deps

e2e-show-report: ## Show the ./e2e/playwright-report
	@cd e2e && npx playwright show-report
=======
e2e-format: ## Format code with autofix inside Docker
e2e-format: e2e-build
	docker run --rm -v $(CURDIR)/e2e:/e2e $(E2E_IMAGE_NAME) npm run format

e2e-format-check: ## Format check without autofix inside Docker
e2e-format-check: e2e-build
	docker run --rm -v $(CURDIR)/e2e:/e2e $(E2E_IMAGE_NAME) npm run format:check

e2e-format-check-native: ## Format check without autofix natively
	cd e2e && npm run format:check

=======
e2e-format: ## Format code with autofix inside Docker
e2e-format: e2e-build
	docker run --rm -v $(CURDIR)/e2e:/e2e $(E2E_IMAGE_NAME) npm run format

e2e-format-check: ## Format check without autofix inside Docker
e2e-format-check: e2e-build
	docker run --rm -v $(CURDIR)/e2e:/e2e $(E2E_IMAGE_NAME) npm run format:check

e2e-format-check-native: ## Format check without autofix natively
	cd e2e && npm run format:check

>>>>>>> after updating
e2e-format-native: ## Format code with autofix natively
	cd e2e && npm run format

e2e-merge-reports: ## Merge E2E blob reports from multiple shards into an HTML report
	cd e2e && npm run merge-reports

e2e-setup: ## Setup end-to-end tests
	cd e2e && npm install

e2e-setup-ci: ## Setup end-to-end tests for CI
	cd e2e && npm ci

e2e-show-report: ## Show the E2E report
	cd e2e && npm run show-report
<<<<<<< before updating
>>>>>>> after updating
=======
>>>>>>> after updating

e2e-test: ## Run E2E Playwright tests in a Docker container and copy the report locally
e2e-test: e2e-build
	@:$(call check_defined, APP_NAME, You must pass in a specific APP_NAME)
	@:$(call check_defined, BASE_URL, You must pass in a BASE_URL)
	docker run --rm\
		--name playwright-e2e-container \
		-e APP_NAME=$(APP_NAME) \
		-e BASE_URL=$(BASE_URL) \
		-e CURRENT_SHARD=$(CURRENT_SHARD) \
		-e TOTAL_SHARDS=$(TOTAL_SHARDS) \
		-e CI=$(CI) \
<<<<<<< before updating
<<<<<<< before updating
		-v $(PWD)/e2e/playwright-report:/e2e/playwright-report \
		-v $(PWD)/e2e/blob-report:/e2e/blob-report \
		playwright-e2e
=======
=======
>>>>>>> after updating
		-v $(CURDIR)/e2e/playwright-report:/e2e/playwright-report \
		-v $(CURDIR)/e2e/blob-report:/e2e/blob-report \
		$(E2E_IMAGE_NAME) \
		npm test -- $(E2E_ARGS)
	@echo "Run 'make e2e-show-report' to view the test report"
>>>>>>> after updating

e2e-test-native: ## Run end-to-end tests
	@:$(call check_defined, APP_NAME, You must pass in a specific APP_NAME)
	@:$(call check_defined, BASE_URL, You must pass in a BASE_URL)
	@echo "Running e2e tests with CI=${CI}, APP_NAME=${APP_NAME}, BASE_URL=${BASE_URL}"
<<<<<<< before updating
<<<<<<< before updating
	@cd e2e/$(APP_NAME) && APP_NAME=$(APP_NAME) BASE_URL=$(BASE_URL) npx playwright test $(E2E_ARGS)
=======
=======
>>>>>>> after updating
	cd e2e && APP_NAME=$(APP_NAME) BASE_URL=$(BASE_URL) npm test -- $(E2E_ARGS)

e2e-test-native-ui: ## Run end-to-end tests natively in UI mode
	@:$(call check_defined, APP_NAME, You must pass in a specific APP_NAME)
	@echo "Running e2e UI tests natively with APP_NAME=$(APP_NAME), BASE_URL=$(BASE_URL)"
	cd e2e && APP_NAME=$(APP_NAME) BASE_URL=$(BASE_URL) npm run test:ui -- $(E2E_ARGS)

e2e-type-check: ## Run TypeScript type checking in Docker
	docker run --rm -v $(CURDIR)/e2e:/e2e $(E2E_IMAGE_NAME) npm run type-check -- $(TYPE_CHECK_ARGS)

e2e-type-check-native: ## Run TypeScript type checking natively
	cd e2e && npm run type-check -- $(TYPE_CHECK_ARGS)
<<<<<<< before updating
>>>>>>> after updating
=======
>>>>>>> after updating

###########
## Infra ##
###########

infra-set-up-account: ## Configure and create resources for current AWS profile and save tfbackend file to infra/accounts/$ACCOUNT_NAME.ACCOUNT_ID.s3.tfbackend
	@:$(call check_defined, ACCOUNT_NAME, human readable name for account e.g. "prod" or the AWS account alias)
	./bin/set-up-current-account $(ACCOUNT_NAME)

infra-configure-network: ## Configure network $NETWORK_NAME
	@:$(call check_defined, NETWORK_NAME, the name of the network in /infra/networks)
	./bin/create-tfbackend infra/networks $(NETWORK_NAME)

infra-configure-app-build-repository: ## Configure infra/$APP_NAME/build-repository tfbackend and tfvars files
	@:$(call check_defined, APP_NAME, the name of subdirectory of /infra that holds the application's infrastructure code)
	./bin/create-tfbackend "infra/$(APP_NAME)/build-repository" shared

infra-configure-app-database: ## Configure infra/$APP_NAME/database module's tfbackend and tfvars files for $ENVIRONMENT
	@:$(call check_defined, APP_NAME, the name of subdirectory of /infra that holds the application's infrastructure code)
	@:$(call check_defined, ENVIRONMENT, the name of the application environment e.g. "prod" or "staging")
	./bin/create-tfbackend "infra/$(APP_NAME)/database" "$(ENVIRONMENT)"

infra-configure-monitoring-secrets: ## Set $APP_NAME's incident management service integration URL for $ENVIRONMENT
	@:$(call check_defined, APP_NAME, the name of subdirectory of /infra that holds the application's infrastructure code)
	@:$(call check_defined, ENVIRONMENT, the name of the application environment e.g. "prod" or "staging")
	@:$(call check_defined, URL, incident management service (PagerDuty or VictorOps) integration URL)
	./bin/configure-monitoring-secret $(APP_NAME) $(ENVIRONMENT) $(URL)

infra-configure-app-service: ## Configure infra/$APP_NAME/service module's tfbackend and tfvars files for $ENVIRONMENT
	@:$(call check_defined, APP_NAME, the name of subdirectory of /infra that holds the application's infrastructure code)
	@:$(call check_defined, ENVIRONMENT, the name of the application environment e.g. "prod" or "staging")
	./bin/create-tfbackend "infra/$(APP_NAME)/service" "$(ENVIRONMENT)"

infra-update-current-account: ## Update infra resources for current AWS profile
	./bin/terraform-init-and-apply infra/accounts `./bin/current-account-config-name`

infra-update-network: ## Update network
	@:$(call check_defined, NETWORK_NAME, the name of the network in /infra/networks)
	terraform -chdir="infra/networks" init -input=false -reconfigure -backend-config="$(NETWORK_NAME).s3.tfbackend"
	terraform -chdir="infra/networks" apply -var="network_name=$(NETWORK_NAME)"

infra-update-app-build-repository: ## Create or update $APP_NAME's build repository
	@:$(call check_defined, APP_NAME, the name of subdirectory of /infra that holds the application's infrastructure code)
	./bin/terraform-init-and-apply infra/$(APP_NAME)/build-repository shared

infra-update-app-database: ## Create or update $APP_NAME's database module for $ENVIRONMENT
	@:$(call check_defined, APP_NAME, the name of subdirectory of /infra that holds the application's infrastructure code)
	@:$(call check_defined, ENVIRONMENT, the name of the application environment e.g. "prod" or "staging")
	terraform -chdir="infra/$(APP_NAME)/database" init -input=false -reconfigure -backend-config="$(ENVIRONMENT).s3.tfbackend"
	terraform -chdir="infra/$(APP_NAME)/database" apply -var="environment_name=$(ENVIRONMENT)"

infra-module-database-role-manager-archive: ## Build/rebuild role manager code package for Lambda deploys
	rm -f infra/modules/database/resources/role_manager.zip
	pip3 install -r infra/modules/database/resources/role_manager/requirements.txt -t infra/modules/database/resources/role_manager/vendor --upgrade
	cd infra/modules/database/resources/role_manager/ && zip -r ../role_manager.zip *

infra-update-app-database-roles: ## Create or update database roles and schemas for $APP_NAME's database in $ENVIRONMENT
	@:$(call check_defined, APP_NAME, the name of subdirectory of /infra that holds the application's infrastructure code)
	@:$(call check_defined, ENVIRONMENT, the name of the application environment e.g. "prod" or "staging")
	./bin/create-or-update-database-roles $(APP_NAME) $(ENVIRONMENT)

infra-update-app-service: ## Create or update $APP_NAME's web service module
	@:$(call check_defined, APP_NAME, the name of subdirectory of /infra that holds the application's infrastructure code)
	@:$(call check_defined, ENVIRONMENT, the name of the application environment e.g. "prod" or "staging")
	terraform -chdir="infra/$(APP_NAME)/service" init -input=false -reconfigure -backend-config="$(ENVIRONMENT).s3.tfbackend"
	terraform -chdir="infra/$(APP_NAME)/service" apply -var="environment_name=$(ENVIRONMENT)"

infra-update-metabase-service: ## Create or update $APP_NAME's web service module
	# APP_NAME has a default value defined above, but check anyways in case the default is ever removed
	@:$(call check_defined, APP_NAME, the name of subdirectory of /infra that holds the application's infrastructure code)
	@:$(call check_defined, ENVIRONMENT, the name of the application environment e.g. "prod" or "staging")
	terraform -chdir="infra/analytics/metabase" init -input=false -reconfigure -backend-config="$(ENVIRONMENT).s3.tfbackend"
	terraform -chdir="infra/analytics/metabase" apply -var="environment_name=$(ENVIRONMENT)"

# The prerequisite for this rule is obtained by
# prefixing each module with the string "infra-validate-module-"
infra-validate-modules: ## Run terraform validate on reusable child modules
infra-validate-modules: $(patsubst %, infra-validate-module-%, $(MODULES))

infra-validate-module-%:
	@echo "Validate library module: $*"
	terraform -chdir=infra/modules/$* init -backend=false
	terraform -chdir=infra/modules/$* validate

infra-check-app-database-roles: ## Check that app database roles have been configured properly
	@:$(call check_defined, APP_NAME, the name of subdirectory of /infra that holds the application's infrastructure code)
	@:$(call check_defined, ENVIRONMENT, the name of the application environment e.g. "prod" or "staging")
	./bin/check-database-roles $(APP_NAME) $(ENVIRONMENT)

infra-check-compliance: ## Run compliance checks
infra-check-compliance: infra-check-compliance-checkov infra-check-compliance-tfsec

infra-check-github-actions-auth: ## Check that GitHub actions can authenticate to the AWS account
	@:$(call check_defined, ACCOUNT_NAME, the name of account in infra/accounts)
	./bin/check-github-actions-auth $(ACCOUNT_NAME)


infra-check-compliance-checkov: ## Run checkov compliance checks
	checkov --directory infra

infra-check-compliance-tfsec: ## Run tfsec compliance checks
	tfsec infra

infra-lint: infra-lint-markdown infra-lint-scripts infra-lint-terraform infra-lint-workflows ## Lint infra code

infra-lint-markdown: ## Lint Markdown docs for broken links
	./bin/lint-markdown.sh

infra-lint-scripts: ## Lint shell scripts
	shellcheck bin/**

infra-lint-terraform: ## Lint Terraform code
	terraform fmt -recursive -check infra

infra-lint-workflows: ## Lint GitHub actions
	actionlint

infra-format: ## Format infra code
	terraform fmt -recursive infra

infra-test-service: ## Run service layer infra test suite
	@:$(call check_defined, APP_NAME, "the name of subdirectory of /infra that holds the application's infrastructure code")
	cd infra/test && APP_NAME=$(APP_NAME) go test -run TestService -v -timeout 30m

#############
## Linting ##
#############

lint-markdown: ## Lint Markdown docs for broken links
	./bin/lint-markdown

########################
## Release Management ##
########################

# Include project name in image name so that image name
# does not conflict with other images during local development
IMAGE_NAME := $(PROJECT_ROOT)-$(APP_NAME)

# Generate an informational tag so we can see where every image comes from.
DATE := $(shell date -u '+%Y%m%d.%H%M%S')
INFO_TAG := $(DATE).$(USER)

GIT_REPO_AVAILABLE := $(shell git rev-parse --is-inside-work-tree 2>/dev/null)


ROOT_REV := $(shell git rev-parse HEAD)

# Generate a unique tag based solely on the git hash.
# This will be the identifier used for deployment via terraform.


ifdef APP_NAME
	APP_NAME_ARG := ${APP_NAME}
else
	APP_NAME_ARG := "."
endif

<<<<<<< before updating
ifdef IMAGE_TAG
else
	ifdef GIT_REPO_AVAILABLE
		IMAGE_TAG := $(shell git log --pretty=format:'%H' -n 1 "${ROOT_REV}" -- "${APP_NAME_ARG}")
	else
		IMAGE_TAG := "unknown-dev.$(DATE)"
	endif
endif

<<<<<<< before updating

# Generate an informational tag so we can see where every image comes from.
DATE := $(shell date -u '+%Y%m%d.%H%M%S')
INFO_TAG := $(DATE).$(USER)

release-build: ## Build release for $APP_NAME and tag it with current git hash
	@:$(call check_defined, APP_NAME, the name of subdirectory of /infra that holds the application's infrastructure code)
	cd $(APP_NAME) && $(MAKE) release-build \
		OPTS="--tag $(IMAGE_NAME):latest --tag $(IMAGE_NAME):$(IMAGE_TAG) --load -t $(IMAGE_NAME):$(IMAGE_TAG) $(OPTIONAL_BUILD_FLAGS)"
=======
release-build: ## Build release for $APP_NAME and tag it with current git hash
	@:$(call check_defined, APP_NAME, the name of subdirectory of /infra that holds the application's infrastructure code)
	cd $(APP_NAME) && $(MAKE) release-build \
		OPTS="--tag $(IMAGE_NAME):latest --tag $(IMAGE_NAME):$(IMAGE_TAG) $(OPTS)"
>>>>>>> after updating
=======
release-build: ## Build release for $APP_NAME and tag it with current git hash
	@:$(call check_defined, APP_NAME, the name of subdirectory of /infra that holds the application's infrastructure code)
	cd $(APP_NAME) && $(MAKE) release-build \
		OPTS="--tag $(IMAGE_NAME):latest --tag $(IMAGE_NAME):$(IMAGE_TAG) $(OPTS)"
>>>>>>> after updating

release-publish: ## Publish release to $APP_NAME's build repository
	@:$(call check_defined, APP_NAME, the name of subdirectory of /infra that holds the application's infrastructure code)
	./bin/publish-release $(APP_NAME) $(IMAGE_NAME) $(IMAGE_TAG)

release-run-database-migrations: ## Run $APP_NAME's database migrations in $ENVIRONMENT
	@:$(call check_defined, APP_NAME, the name of subdirectory of /infra that holds the application's infrastructure code)
	@:$(call check_defined, ENVIRONMENT, the name of the application environment e.g. "prod" or "dev")
	./bin/run-database-migrations $(APP_NAME) $(IMAGE_TAG) $(ENVIRONMENT)

release-deploy: ## Deploy release to $APP_NAME's web service in $ENVIRONMENT
	@:$(call check_defined, APP_NAME, the name of subdirectory of /infra that holds the application's infrastructure code)
	@:$(call check_defined, ENVIRONMENT, the name of the application environment e.g. "prod" or "dev")
	./bin/deploy-release $(APP_NAME) $(IMAGE_TAG) $(ENVIRONMENT)

metabase-deploy: ## Deploy metabase to $APP_NAME's web service in $ENVIRONMENT
	@:$(call check_defined, APP_NAME, the name of subdirectory of /infra that holds the application's infrastructure code)
	@:$(call check_defined, ENVIRONMENT, the name of the application environment e.g. "prod" or "dev")
	./bin/deploy-metabase $(APP_NAME) $(IMAGE_TAG) $(ENVIRONMENT)

invalidate-cloudfront-cache: ## Invalidate CloudFront cache for $ENVIRONMENT
	@:$(call check_defined, ENVIRONMENT, the name of the application environment e.g. "prod" or "dev")
	./bin/invalidate-cloudfront-cache $(ENVIRONMENT)

release-image-name: ## Prints the image name of the release image
	@:$(call check_defined, APP_NAME, the name of subdirectory of /infra that holds the application's infrastructure code)
	@echo $(IMAGE_NAME)

release-image-tag: ## Prints the image tag of the release image
	@echo $(IMAGE_TAG)

########################
## Scripts and Helper ##
########################

help: ## Prints the help documentation and info about each command
	@grep -Eh '^[[:print:]]+:.*?##' $(MAKEFILE_LIST) | \
	sort -d | \
	awk -F':.*?## ' '{printf "\033[36m%s\033[0m\t%s\n", $$1, $$2}' | \
	column -t -s "$$(printf '\t')"
	@echo ""
	@$(MAKE) dump-env

dump-env:
	@echo "APP_NAME=$(APP_NAME)"
	@echo "ENVIRONMENT=$(ENVIRONMENT)"
	@echo "IMAGE_NAME=$(IMAGE_NAME)"
	@echo "IMAGE_TAG=$(IMAGE_TAG)"
	@echo "INFO_TAG=$(INFO_TAG)"
	@echo "GIT_REPO_AVAILABLE=$(GIT_REPO_AVAILABLE)"
	@echo "SHELL=$(SHELL)"
	@echo "MAKE_VERSION=$(MAKE_VERSION)"
	@echo "MODULES=$(MODULES)"
