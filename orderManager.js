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
