const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
    res.send('Server is running');
})


// mongoDB connection

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rzp8pq2.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const servicesCollection = client.db('carShopDB').collection('services');
    const bookingsCollection = client.db('carShopDB').collection('bookings');

    // auth related api

    app.post('/jwt', async(req, res) => {
        const user = req.body;
        console.log(user);
        const token = jwt.sign(user, 'secret', {expiresIn:'1h'});
        res.send(token);
    })


    // services related api

    app.get('/services', async (req, res) => {
        const cursor = servicesCollection.find();
        const result = await cursor.toArray();
        res.send(result); 
    })

    app.get('/services/:id', async(req, res) => {
        const id = req.params.id;
        const query = {_id : new ObjectId(id)};
        const options = {
            // Include only the `title` and `imdb` fields in the returned document
            projection: { title: 1, price: 1, img: 1, service_id: 1, service: 1 },
          };
        const result = await servicesCollection.findOne(query, options);
        res.send(result);
    })

    // bookings

    app.get('/bookings', async(req, res) => {
        let query = {};
        if(req.query?.email){
            query = {email : req.query.email}
        }
        const cursor = await bookingsCollection.find(query).toArray();
        res.send(cursor);
    })

    app.post('/bookings', async(req, res) => {
        const booking = req.body;
        const result = await bookingsCollection.insertOne(booking);
        res.send(result);
    })

    app.patch('/bookings/:id', async(req, res) => {
        const id = req.params.id;
        const filter = {_id : new ObjectId(id)};
        const updatedBookings = req.body;
        const updateDoc = {
            $set: {
              status: updatedBookings.status
            },
          };
        const result = await bookingsCollection.updateOne(filter, updateDoc);
        res.send(result);  

    })

    app.delete('/bookings/:id', async(req, res) => {
        const id = req.params.id;
        const query = {_id : new ObjectId(id)};
        const result = await bookingsCollection.deleteOne(query);
        res.send(result);
    })



    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);




app.listen(port , () => {
    console.log(`Server is running on ${port}`);
})