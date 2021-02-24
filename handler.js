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
