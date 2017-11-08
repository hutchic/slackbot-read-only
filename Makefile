#!/bin/bash
WD = $(shell pwd)

clean:
	docker rmi slackbot-read-only

build_development:
	docker build -f Dockerfile.dev -t slackbot-read-only .

development: build_development
	docker run -it --rm --net=host -v $(WD):/src -e SLACK_CLIENT_ID=$$SLACK_CLIENT_ID -e SLACK_CLIENT_SECRET=$$SLACK_CLIENT_SECRET -e AWS_ACCESS_KEY_ID=$$AWS_ACCESS_KEY_ID -e AWS_SECRET_ACCESS_KEY=$$AWS_SECRET_ACCESS_KEY slackbot-read-only /bin/bash
