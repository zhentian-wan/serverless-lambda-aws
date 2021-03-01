# Serverless AWS lambda

## Config serverless with aws

```bash
serverless config credentials --provider aws --key <ACCESS_KEY_AWS> --secret <SECRET_KEY_AWS>
```

## Init project

```bash
serverless create --template aws-nodejs --name cake-ordering-system
```

## Define how to trigger lambda in `serverless.yml`

for example:

```yml
functions:
  createOrder:
    handler: handler.createOrder
    # trigger for lambda
    events:
      # http: stands for APIGateWay
      - http:
          path: /order
          method: post
```

## Hanlder

In `handler.js`:

```js
"use strict";

module.exports.createOrder = async (event) => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Create Order",
      input: event,
    }),
  };
};
```

## Deploy

```bash
sls deploy
```

## Logs

```bash
sls logs -f <FUNCTION_NAME>
## sls logs -f notifyExternalParties
```
