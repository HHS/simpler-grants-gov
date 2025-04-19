# 533243300146 is an AWS account belonging to New Relic.
release-build:
	aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 533243300146.dkr.ecr.us-east-1.amazonaws.com
	docker buildx build \
		--target release \
		--platform=linux/amd64 \
		--build-arg RUN_USER=$(RUN_USER) \
		--build-arg RUN_UID=$(RUN_UID) \
		$(OPTS) \
		.
