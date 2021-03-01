"use strict";

module.exports.deliveryOrder = (ordersFulfilled) => {
  console.log("Delivery order was called");
  return new Promise((res) => {
    setTimeout(() => {
      res("foo");
    }, 10);
  });
};
