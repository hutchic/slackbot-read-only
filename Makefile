#!/bin/bash
WD = $(shell pwd)

build_development:
	docker build -f Dockerfile.dev -t slackbot-jobs .

development:
	docker run -it --rm --net=host -v $(WD):/src -e SLACK_CLIENT_ID=$$SLACK_CLIENT_ID -e SLACK_CLIENT_SECRET=$$SLACK_CLIENT_SECRET -e AWS_ACCESS_KEY_ID=$$AWS_ACCESS_KEY_ID -e AWS_SECRET_ACCESS_KEY=$$AWS_SECRET_ACCESS_KEY slackbot-jobs /bin/bash
