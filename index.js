const express = require("express");
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;

const corsOptions = {
  origin: ["http://localhost:5173", "http://localhost:5174"],
  credentials: true,
  optionSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

//
const jwtToken = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).send({ message: "unauthorize" });
  }
  if (token) {
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRECT, (err, decode) => {
      if (err) {
        return res.status(401).send({ message: "unauthorize" });
      }
      req.user = decode;
      next();
    });
  }
};
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
    // ? jwt generate ==================================
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRECT, {
        expiresIn: "1hr",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: false,
          sameSite: false,
        })
        .send({ status: "true" });
    });
    app.get("/logout", async (req, res) => {
      res
        .clearCookie("token", {
          httpOnly: true,
          secure: false,
          sameSite: false,
          maxAge: 0,
        })
        .send({ statu: true });
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
      // duplicate data not allow
      const query = { userEmail: bidData.userEmail };
      const allReadyApplied = await bidCollection.findOne(query);
      if (allReadyApplied) {
        return res.status(400).send("you have already  applied this job");
      }
      const result = await bidCollection.insertOne(bidData);
      res.send("result");
    });
    // ! save  a job data in db
    app.post("/job", async (req, res) => {
      const jobData = req.body;
      const result = await jobsCollection.insertOne(jobData);
      res.send(result);
    });
    // ! get all jobs posted by a specific user
    app.get("/jobs/:email", jwtToken, async (req, res) => {
      // !=================================================================
      const email = req.params.email;
      const tokenEmail = req.user.email;
      if (tokenEmail !== email) {
        return res.status(403).send({ message: "forbiddenAccess" });
      }
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
    app.get("/my-bids/:email", jwtToken, async (req, res) => {
      const email = req.params.email;
      const tokenEmail = req.user.email;
      if (tokenEmail !== email) {
        return res.status(403).send({ message: "forbiddenaccess" });
      }
      const query = { userEmail: email };
      const result = await bidCollection.find(query).toArray();
      res.send(result);
    });
    // ! get all   bids request for owner  specific data
    app.get("/bid-requests/:email", jwtToken, async (req, res) => {
      const email = req.params.email;
      const tokenEmail = req.user.email;
      if (tokenEmail !== email) {
        return res.status(403).send({ message: "forbiddenaccess" });
      }
      const query = { "buyer.buyer_email": email };
      const result = await bidCollection.find(query).toArray();
      res.send(result);
    });
    // ! owner change bit status for bid request
    app.patch("/bid/:id", async (req, res) => {
      const id = req.params.id;
      const status = req.body;
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: { JobStatus: status.status },
      };
      const result = await bidCollection.updateOne(query, updateDoc);
      res.send(result);
    });
    // ! =================================== paignation implement =================================
    app.get("/all-jobs", async (req, res) => {
      const page = parseFloat(req.query.page) - 1;
      const size = parseFloat(req.query.size);
      const filter = req.query.filter;
      let query = {};
      if (filter) {
        query = { category: filter };
      }
      //  ! sort
      const sort = req.query.sort;
      let option = {};
      if (sort) {
        option = { sort: { job_title: sort === "asc" ? 1 : -1 } };
      }
      // ! search
      const search = req.query.search;
      console.log(search);
      const result = await jobsCollection
        .find(query, option)
        .skip(page * size)
        .limit(size)
        .toArray();
      res.send(result);
    });
    app.get("/jobs-count", async (req, res) => {
      const filter = req.query.filter;
      let query = {};
      if (filter) {
        query.category = filter;
      }
      const count = await jobsCollection.countDocuments(query);
      res.send({ count });
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
