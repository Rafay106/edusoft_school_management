require("dotenv").config();

// Connect to db
require("./config/db")();

const express = require("express");

const app = express();
const PORT = process.env.PORT || 8000;

app.listen(PORT, () =>
  console.log(`${process.env.NAME} running on port: ${PORT}`)
);
