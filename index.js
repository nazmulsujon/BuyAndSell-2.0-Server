const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");
// const jwt = require("jsonwebtoken");

const port = process.env.PORT || 5000;

const app = express();

//middle ware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.pdzsrjb.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    const furnitureCategories = client.db("Buy&Sell").collection("furnitureCategories");

    app.get("/categories", async (req, res) => {
      const query = {};
      const result = await furnitureCategories.find(query).toArray();
      res.send(result);
    });
  } finally {
  }
}
run().catch((err) => console.error(err));

app.get("/", async (req, res) => {
  res.send("BUY & SELL server is running");
});

app.listen(port, () => console.log(`BUY & SELL server is running on ${port}`));
