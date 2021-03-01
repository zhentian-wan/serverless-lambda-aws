# Kinesis trigger Lambda flow

When kinesis stream receive `order_placed` event then trigger Lambda which will call `ses` (Simple Email Service) to send email.

serverless.yml

```yml
functions:
  ...
  notifyCakeProducer:
    handler: handler.notifyCakeProducer
    events:
      - stream:
        arn: arn:aws:kinesis:#{AWS::Region}:#{AWS::AccountId}:stream/order-events
    environment:
      region: ${self.provider.region}
      cakeProducerEmail: <....>
      orderingSystemEmail: <....>
```

helper file:

Kinesis `Record` is `base64` format.

```js
"use strict";

function parsePayload(record) {
  const json = new Buffer(record.kinesis.data, "base64").toString("utf8");
  return JSON.parse(json);
}

module.exports.getRecords = (event) => {
  return event.Records.map(parsePayload);
};
```

handler.js

```js
module.exports.notifyCakeProducer = async (event) => {
  const records = kinesisHelper.getRecords(event);

  const ordersPlaced = records.filter((r) => r.eventType === "order_placed");

  if (ordersPlaced <= 0) {
    return "there is nothing";
  }

  return cakeProducerManager
    .handlePlacedOrders(ordersPlaced)
    .then(() => {
      return "everything went well";
    })
    .catch((error) => {
      return error;
    });
};
```

cakeProducerManager.js

```js
"use strict";

const AWS = require("aws-sdk");
const ses = new AWS.SES({
  region: process.env.region,
});

const CAKE_PRODUCER_EMAIL = process.env.cakeProducerEmail;
const ORDERING_SYSTEM_EMAIL = process.env.orderingSystemEmail;

module.exports.handlePlacedOrders = (ordersPlaced) => {
  var ordersPlacedPromises = [];

  for (let order of ordersPlaced) {
    const temp = notifyCakeProducerByEmail(order);

    ordersPlacedPromises.push(temp);
  }

  return Promise.all(ordersPlacedPromises);
};

function notifyCakeProducerByEmail(order) {
  const params = {
    Destination: {
      ToAddresses: [CAKE_PRODUCER_EMAIL],
    },
    Message: {
      Body: {
        Text: {
          Data: JSON.stringify(order),
        },
      },
      Subject: {
        Data: "New cake order",
      },
    },
    Source: ORDERING_SYSTEM_EMAIL,
  };

  return ses
    .sendEmail(params)
    .promise()
    .then((data) => {
      return data;
    });
}
```
