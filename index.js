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
    const furnitureCategoriesCollection = client.db("Buy&Sell").collection("furnitureCategories");
    const furnitureByCategoryCollection = client.db("Buy&Sell").collection("furnitureByCategory");

    app.get("/categories", async (req, res) => {
      const query = {};
      const result = await furnitureCategoriesCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/category/:id", async (req, res) => {
      const query = {};
      const id = req.params.id;
      const furnitureCategory = await furnitureByCategoryCollection.find(query).toArray();
      const categoryById = furnitureCategory.filter((category) => category.category_id === id);
      res.send(categoryById);
    });
  } finally {
  }
}
run().catch((err) => console.error(err));

app.get("/", async (req, res) => {
  res.send("BUY & SELL server is running");
});

app.listen(port, () => console.log(`BUY & SELL server is running on ${port}`));
