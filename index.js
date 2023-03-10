const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
const app = express();


const port = process.env.PORT || 5000;

//middle ware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.pdzsrjb.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
}

async function run() {
  try {
    const furnitureCategoriesCollection = client.db("Buy&Sell").collection("furnitureCategories");
    const furnitureByCategoryCollection = client.db("Buy&Sell").collection("furnitureByCategory");
    const usersCollection = client.db("Buy&Sell").collection("users");
    const bookingOrdersCollection = client.db("Buy&Sell").collection("bookingOrders");
    const advertiseCategoryCollection = client.db("Buy&Sell").collection("advertiseCategory");

    // verifyAdmin API , this API must be written after verifyJWT
    const verifyAdmin = async (req, res, next) => {
      const decodedEmail = req.decoded.email;
      const query = { email: decodedEmail };
      const user = await usersCollection.findOne(query);
      if (user?.role !== "admin") {
        return res.status(403).send({ message: "forbidden access" });
      }
      next();
    };

    const verifySeller = async (req, res, next) => {
      const decodedEmail = req.decoded.email;
      const query = { email: decodedEmail };
      const user = await usersCollection.findOne(query);
      if (user?.role !== "seller") {
        return res.status(403).send({ message: "forbidden access" });
      }
      next();
    };

    //******  furniture categories & category API ******//
    app.get("/categories", async (req, res) => {
      const query = {};
      const result = await furnitureCategoriesCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/category/:id", verifyJWT, async (req, res) => {
      const query = {};
      const id = req.params.id;
      const furnitureCategory = await furnitureByCategoryCollection.find(query).toArray();
      const categoryById = furnitureCategory.filter((category) => category.category_id === id);
      res.send(categoryById);
    });

    app.get("/category/seller/:email", verifyJWT, verifySeller, async (req, res) => {
      const email = req.params.email;
      const query = { "seller.email": email };
      console.log(query);
      const productByEmail = await furnitureByCategoryCollection.find(query).toArray();
      console.log(productByEmail);
      res.send(productByEmail);
    });

    app.delete("/category/:id", verifyJWT, verifySeller, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const result = await furnitureByCategoryCollection.deleteOne(filter);
      res.send(result);
    });

    app.post("/category", verifyJWT, verifySeller, async (req, res) => {
      const furniture = req.body;
      const result = await furnitureByCategoryCollection.insertOne(furniture);
      res.send(result);
    });

    app.get("/advertiseCategory", async (req, res) => {
      const query = {};
      const result = await advertiseCategoryCollection.find(query).limit(3).toArray();
      res.send(result);
    });

    app.post("/advertiseCategory", verifyJWT, verifySeller, async (req, res) => {
      const advertiseFurniture = req.body;
      const result = await advertiseCategoryCollection.insertOne(advertiseFurniture);
      res.send(result);
    });

    app.get("/furniture/reported/:id", verifyJWT, verifyAdmin, async (req, res) => {
      const query = { itemStatus: "reported" };
      const result = await furnitureByCategoryCollection.find(query).toArray();
      //   console.log(result);
      res.send(result);
    });

    app.put("/furniture/report/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updatedDoc = {
        $set: {
          itemStatus: "reported",
        },
      };
      const result = await furnitureByCategoryCollection.updateOne(filter, updatedDoc, options);
      //   console.log(result);
      res.send(result);
    });

    app.delete("/reportedFurniture/:id", verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const result = await furnitureByCategoryCollection.deleteOne(filter);
      res.send(result);
    });

    //***** jtw API *****//
    app.get("/jwt", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      if (user) {
        const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: "10h" });
        return res.send({ accessToken: token });
      }
      res.status(403).send({ accessToken: "" });
    });

    //***** users API *****//
    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const duplicateEmailCount = await usersCollection.countDocuments(query);
      if (duplicateEmailCount) {
        return res.status(409).send({ message: "Email is already exist" });
      }
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    // check isAdmin
    app.get("/users/admin/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await usersCollection.findOne(query);
      res.send({ isAdmin: user?.role === "admin" }); // true or false
    });

    app.get("/users/seller/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await usersCollection.findOne(query);
      res.send({ isSeller: user?.role === "seller" }); // true or false
    });

    // check isVerified
    app.get("/seller/verified/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const seller = await usersCollection.findOne(query);
      res.send({ isVerified: seller?.status === "verified" }); // true or false
    });

    app.get("/users/allSellers", verifyJWT, verifyAdmin, async (req, res) => {
      const query = { role: "seller" };
      const result = await usersCollection.find(query).toArray();
      //   console.log(result);
      res.send(result);
    });

    app.get("/users/allBuyers", verifyJWT, verifyAdmin, async (req, res) => {
      const query = { role: "buyer" };
      const result = await usersCollection.find(query).toArray();
      res.send(result);
    });

    app.put("/seller/verify/:id", verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updatedDoc = {
        $set: {
          status: "verified",
        },
      };
      const result = await usersCollection.updateOne(filter, updatedDoc, options);
      res.send(result);
    });

    app.delete("/seller/:id", verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const result = await usersCollection.deleteOne(filter);
      res.send(result);
    });
    app.delete("/buyer/:id", verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const result = await usersCollection.deleteOne(filter);
      res.send(result);
    });

    //***** booking orders API *****//
    app.get("/myOrders/:email", verifyJWT, async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const myOrders = await bookingOrdersCollection.find(query).toArray();
      res.send(myOrders);
    });

    app.post("/bookingOrders", async (req, res) => {
      const order = req.body;
      const result = await bookingOrdersCollection.insertOne(order);
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
