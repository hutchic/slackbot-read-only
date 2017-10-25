"use strict";

module.exports.installSlack = (event, context, callback) => {
  const clientId = process.env.SLACK_CLIENT_ID;
  const scopes =
    "channels:write,channels:read,channels:history,chat:write:user,chat:write:bot,users:read";
  const requestBody = JSON.parse(event.body);
  const response = {
    statusCode: 302,
    headers: {
      Location:
        "https://slack.com/oauth/authorize?client_id=" +
        process.env.SLACK_CLIENT_ID +
        "&scope=" +
        scopes +
        "&redirect_uri=" +
        process.env.BASE_URL +
        "slack/activate"
    }
  };
  callback(null, response);
};

module.exports.activateSlack = (event, context, callback) => {
  const request = require("request-promise");
  const body = "done";
  const AWS = require("aws-sdk");
  const response = {
    statusCode: 200,
    body: "done"
  };

  let options = {
    method: "POST",
    uri: "https://slack.com/api/oauth.access",
    body: {
      client_id: process.env.SLACK_CLIENT_ID,
      client_secret: process.env.SLACK_CLIENT_SECRET,
      code: event.queryStringParameters.code
    },
    json: true
  };

  // OAuth handshake
  request(options)
    .then(() => {
      let ssm = new AWS.SSM();
      let json = JSON.parse(body);

      let params = {
        Name: process.env.SLACK_ACCESS_TOKEN_VARIABLE,
        Type: "SecureString",
        Value: json.access_token,
        Overwrite: true
      };

      return new Promise((resolve, reject) => {
        ssm.putParameter(params, resolve);
      });
    })
    // Slack access
    .then(() => {
      return request({
        method: "POST",
        uri: "https://slack.com/api/channels.join",
        body: {
          token: json.access_token,
          name: "#general"
        },
        json: true
      });
    })
    .then(() => callback(null, response))
    .catch((error) => {
      console.error(error);
      response.statusCode = 501;
      response.body = "error";
      callback(error, response);
    });
};

module.exports.slackHooks = (event, context, callback) => {
  const ssm = require("aws-sdk").SSM();
  const request = require("request-promise");
  const requestBody = JSON.parse(event.body);
  const response = {
    statusCode: 200
  };
  let accessToken = null;

  if (requestBody.type == "url_verification") {
    response.body = requestBody.challenge;
  } else if (
    requestBody.type == "event_callback" &&
    requestBody.event.type == "message"
  )

  new Promise((resolve) => {
    ssm.getParameter(
      {
        Name: process.env.SLACK_ACCESS_TOKEN_VARIABLE,
        WithDecryption: true
      },
      resolve
    );
  }).then((error, data) => {
    if (error) {
      console.error(error);
      response.statusCode = 501;
      response.body = "error";
      callback(error, response);
    } else {
      accessToken = data.Parameter.Value;

      request.post(
        {
          url: "https://slack.com/api/users.info",
          form: {
            token: accessToken,
            user: requestBody["event"].user
          }
        },
        (error, response, body) => {
          if (error) {
            console.error(error);
            response.statusCode = 501;
            response.body = "error";
            callback(error, response);
          } else {
            let json = JSON.parse(body);
            if (json.user.is_admin != true) {
              request.post(
                {
                  url: "https://slack.com/api/chat.delete",
                  form: {
                    token: accessToken,
                    channel: requestBody["event"].channel,
                    ts: requestBody["event"].ts
                  }
                },
                (error, response, body) => {
                  if (error) {
                    console.error(error);
                    response.statusCode = 501;
                    response.body = "error";
                    callback(error, response);
                  }
                }
              );
            }
          }
        }
      );
    }
  });
  callback(null, response);
};
