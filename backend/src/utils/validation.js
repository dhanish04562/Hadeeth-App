const { z } = require("zod");

const optionalBoolean = z.preprocess((value) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (value === true || value === "true") {
    return true;
  }

  if (value === false || value === "false") {
    return false;
  }

  return value;
}, z.boolean().optional());

const requiredBoolean = z.preprocess((value) => {
  if (value === true || value === "true") {
    return true;
  }

  if (value === false || value === "false") {
    return false;
  }

  return value;
}, z.boolean());

const optionalInt = z.preprocess((value) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  return Number(value);
}, z.number().int().optional());

module.exports = {
  z,
  optionalBoolean,
  requiredBoolean,
  optionalInt
};
