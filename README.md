# Read Only Channels

Add this slackbot to your free slack to create a channel that only admins can post into. Any messages
by a non-admin get's auto deleted.

## Prerequisites

- AWS Account
- Slack Admin
- Docker

## Installation

```
export SLACK_CLIENT_ID=xxxx
export SLACK_CLIENT_SECRET=xxxx
export AWS_ACCESS_KEY_ID=xxxx
export AWS_SECRET_ACCESS_KEY=xxxx
make development
cd slackbot-read-only
make deploy
```

Set the bot OAuth & Permission redirect url to the `/slack/activate` url

Set the Event Subscriptions url to the `/slack/hooks` url