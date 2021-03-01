"use strict";

const orderManager = require("./orderManager");
const kinesisHelper = require("./kinesisHelper");
const cakeProducerManager = require("./cakeProducerManager");
const deliveryManager = require("./deliveryManager");

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

module.exports.notifyExternalParties = async (event) => {
  const records = kinesisHelper.getRecords(event);
  const cakeProducerPromise = getCakeProducerPromise(records);
  const deliveryPromise = getDeliveryPromise(records);

  return Promise.all([cakeProducerPromise, deliveryPromise])
    .then(() => {
      return "everything went well";
    })
    .catch((error) => {
      return error;
    });
};

module.exports.notifyDeliveryCompany = async (event) => {
  console.log("notifyDeliveryCompany:: call the API");
  return "done";
};

function getCakeProducerPromise(records) {
  const ordersPlaced = records.filter((r) => r.eventType === "order_placed");

  if (ordersPlaced.length > 0) {
    return cakeProducerManager.handlePlacedOrders(ordersPlaced);
  } else {
    return null;
  }
}

function getDeliveryPromise(records) {
  const orderFulilled = records.filter(
    (r) => r.eventType === "order_fulfilled"
  );

  if (orderFulilled.length > 0) {
    return deliveryManager.deliveryOrder(orderFulilled);
  } else {
    return null;
  }
}
