"use strict";

module.exports.slackinstall = (event, context, callback) => {
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
        "/slack/activate"
    }
  };
  return callback(null, response);
}

module.exports.slackactivate = (event, context, callback) => {
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
    form: {
      client_id: process.env.SLACK_CLIENT_ID,
      client_secret: process.env.SLACK_CLIENT_SECRET,
      code: event.queryStringParameters.code
    },
    json: true
  };

  // OAuth handshake
  request(options)
    .then((json) => {
      let ssm = new AWS.SSM();
      let params = {
        Name: process.env.SLACK_ACCESS_TOKEN_VARIABLE,
        Type: "SecureString",
        Value: json.access_token,
        Overwrite: true
      };

      return new Promise((resolve, reject) => {
        ssm.putParameter(params, resolve(json));
      });
    }).then((json) => {
      return request({
        method: "POST",
        uri: "https://slack.com/api/channels.join",
        form: {
          token: json.access_token,
          name: "#general"
        }
      });
    })
    .then(() => callback(null, response))
    .catch(error => {
      console.error(error);
      response.statusCode = 501;
      response.body = "error";
      callback(error, response);
    });
}

module.exports.slackhooks = (event, context, callback) => {
  const ssm = require("aws-sdk").SSM();
  const request = require("request-promise");
  const requestBody = JSON.parse(event.body);
  const response = {
    statusCode: 200
  };
  let accessToken = null;

  if (requestBody.type == "url_verification") {
    response.body = requestBody.challenge;
    return callback(null, response);
  } else if (
    requestBody.type == "event_callback" &&
    requestBody.event.type == "message"
  )

  new Promise(resolve => {
    ssm.getParameter(
      {
        Name: process.env.SLACK_ACCESS_TOKEN_VARIABLE,
        WithDecryption: true
      },
      resolve
    );
  })
  .then((error, data) => {
    accessToken = data.Parameter.Value;

    request({
      uri: "https://slack.com/api/users.info",
      body: {
        token: accessToken,
        user: requestBody["event"].user
      },
      json: true
    });
  })
  .then(() => {
    let json = JSON.parse(body);

    if (json.user.is_admin != true) {
      request({
        uri: "https://slack.com/api/chat.delete",
        body: {
          token: accessToken,
          channel: requestBody["event"].channel,
          ts: requestBody["event"].ts
        },
        json: true
      })
      .then(() => callback(null, response));
    }
  })
  .catch(error => {
    console.error(error);
    response.statusCode = 501;
    response.body = "error";
    callback(error, response);
  });
};