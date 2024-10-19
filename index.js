const express = require("express");
const app = express();
const { MongoClient, ServerApiVersion } = require("mongodb");
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;

app.use(
  cors({
    origin: ["http://localhost:5173"],
    credential: true,
    optionSuccessStatus: 200,
  })
);
app.use(express.json());

//

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ovfeh1r.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  const database = client.db("clean-co");
  const movies = database.collection("bookings");
  try {
    // Connect the client to the server	(optional starting in v4.7)
    app.get("/cole", async (req, res) => {
      const query = {};
      const cursor = await movies.find({}).toArray();
      res.send(cursor);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir);

//
app.get("/", (req, res) => {
  res.send("Hello World!.........swiftmart");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
