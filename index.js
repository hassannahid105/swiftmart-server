const express = require("express");
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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
  const database = client.db("swiftmart");
  const jobsCollection = database.collection("jobs");
  const bidCollection = database.collection("bid");
  try {
    // Connect the client to the server	(optional starting in v4.7)
    app.get("/jobs", async (req, res) => {
      const result = await jobsCollection.find({}).toArray();
      res.send(result);
    });
    // ! get a single job data form database using job id
    app.get("/job/:id", async (req, res) => {
      const id = req.params.id;
      //   const query = { id: new ObjectId(id) };
      const result = await jobsCollection.findOne({ _id: new ObjectId(id) });
      res.send(result);
    });
    // ! save  a bid data in db
    app.post("/bid", async (req, res) => {
      const bidData = req.body;
      const result = await bidCollection.insertOne(bidData);
      res.send(result);
    });
    // ! save  a job data in db
    app.post("/job", async (req, res) => {
      const jobData = req.body;
      const result = await jobsCollection.insertOne(jobData);
      res.send(result);
    });
    // ! get all jobs posted by a specific user
    app.get("/jobs/:email", async (req, res) => {
      const email = req.params.email;
      const query = { "buyer.email": email };
      const result = await jobsCollection.find(query).toArray();
      res.send(result);
    });
    // ! delete a job data form db
    app.delete("/jobs/:id", async (req, res) => {
      const id = req.params.id;
      //   const query = { id: new ObjectId(id) };
      const result = await jobsCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });
    // ! update a job data form db
    app.put("/update/:id", async (req, res) => {
      const id = req.params.id;
      const doc = req.body;
      const filter = { _id: new ObjectId(id) };
      const option = { upsert: true };
      const updateDoc = {
        $set: {
          ...doc,
        },
      };
      const result = await jobsCollection.updateOne(filter, updateDoc, option);
      res.send(result);
    });
    // ?======================================================================================
    // ! get all my posted  bids by a specific user
    app.get("/my-bids/:email", async (req, res) => {
      const email = req.params.email;
      const query = { userEmail: email };
      const result = await bidCollection.find(query).toArray();
      res.send(result);
    });
    // ! get all   bids request for owner  specific data
    app.get("/bid-requests/:email", async (req, res) => {
      const email = req.params.email;
      const query = { "buyer.buyer_email": email };
      const result = await bidCollection.find(query).toArray();
      res.send(result);
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
