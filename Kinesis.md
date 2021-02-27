# Kinesis Stream

## Add Kinesis

serverless.yml, add following configuration

```yml
resources:
  Resources:
    orderEventsStream:
      Type: AWS::Kinesis::Stream
      Properties:
        Name: order-events
        ShardCount: 1
```

## Add DynamoDB

serverless.yml, add following configuration

```yml
resources:
  Resources:
    orderEventsStream:
      Type: AWS::Kinesis::Stream
      Properties:
        Name: order-events
        ShardCount: 1
    orderTable:
      Type: AWS::DynamoDB::Table
      Properties:
        TableName: ordersTable
        AttributeDefinitions:
          - AttributeName: "orderId"
            AttributeType: "S"
        KeySchema:
          - AttributeName: "orderId"
            KeyType: "HASH"
        BillingMode: PAY_PER_REQUEST
```

When lambda `handler` get trigger, what we want is 2 steps:

1. Save the order to DynamoDB
2. Place the order to Kinesis Stream

`handler.js`:

```js
"use strict";

const orderManager = require("./orderManager");

const createResponse = async (statusCode, message) => {
  const response = {
    statusCode: statusCode,
    body: JSON.stringify(message),
  };

  return response;
};

module.exports.createOrder = async (event) => {
  const body = JSON.parse(event.body);
  const order = orderManager.createOrder(body);
  return orderManager
    .placeNewOrder(order)
    .then(() => {
      return createResponse(200, order);
    })
    .catch((error) => {
      return createResponse(400, error);
    });
};
```

`orderManager.js`:

```js
"use strict";

const { v4: uuid } = require("uuid");
const AWS = require("aws-sdk");
const dynamo = new AWS.DynamoDB.DocumentClient();
const kinesis = new AWS.Kinesis();

const TABLE_NAME = process.env.orderTableName;
const STREAM_NAME = process.env.orderStreamName;

module.exports.createOrder = (body) => {
  const order = {
    orderId: uuid(),
    name: body.name,
    address: body.address,
    productId: body.productId,
    quantity: body.quantity,
    orderDate: Date.now(),
    eventType: "order_placed",
  };
  return order;
};

module.exports.placeNewOrder = (order) => {
  // save order in table
  return saveNewOrder(order).then(() => {
    return placeOrderStream(order);
  });
};

function saveNewOrder(order) {
  const params = {
    TableName: TABLE_NAME,
    Item: order,
  };

  return dynamo.put(params).promise();
}

function placeOrderStream(order) {
  const params = {
    Data: JSON.stringify(order),
    PartitionKey: order.orderId,
    StreamName: STREAM_NAME,
  };

  return kinesis.putRecord(params).promise();
}
```

`TABLE_NAME` & `STREAM_NAME` are coming from enviorment variables.

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
    environment:
      orderTableName: ordersTable
      orderStreamName: order-events
```

## Enable Presmissions

In AWS, you need to give premissions everytime, none of the premissions are given in the begining.

serverless.yml:

```yml
provider:
  name: aws
  runtime: nodejs12.x
  lambdaHashingVersion: 20201221

  iamRoleStatements:
    - Effect: Allow
      Action:
        - dynamodb:PutItem
        - dynamodb:GetItem
      Resource:
        - arn:aws:dynamodb:#{AWS::Region}:#{AWS::AccountId}:table/ordersTable
    - Effect: Allow
      Action:
        - kinesis:PutRecord
      Resource:
        - arn:aws:kinesis:#{AWS::Region}:#{AWS::AccountId}:stream/order-events
```
