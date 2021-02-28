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

module.exports.orderFulfillment = async (event) => {
  const body = JSON.parse(event.body);
  const { orderId, fulfillmentId } = body;
  return orderManager
    .fulfillOrder(orderId, fulfillmentId)
    .then(() => {
      return createResponse(
        200,
        `Order with orderId = ${orderId} has been fulfilled`
      );
    })
    .catch((error) => {
      return createResponse(400, error);
    });
};
