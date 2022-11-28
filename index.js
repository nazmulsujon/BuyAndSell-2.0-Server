const express = require("express");
const cors = require("cors");
require("dotenv").config();
// const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
// const jwt = require("jsonwebtoken");

const port = process.env.PORT || 5000;

const app = express();

//middle ware
app.use(cors());
app.use(express.json());

app.get("/", async (req, res) => {
  res.send("BUY & SELL server is running");
});

app.listen(port, () => console.log(`BUY & SELL server is running on ${port}`));
