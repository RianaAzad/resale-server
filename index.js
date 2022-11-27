const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

// Database access

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.6ifow7m.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


function verifyJWT(req, res, next){
    const authHeader = req.headers.authorization;
    if(!authHeader){
        return res.status(401).send('unauthorized access');
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN, function(err, decoded){
        if(err){
            return res.status(403).send({message: 'Forbidden access'})
        }
        req.decoded = decoded;
        next();
    })
}


async function run(){
    try{
        const productsCollection = client.db('resaleCar').collection('products');
        const categoriesCollection = client.db('resaleCar').collection('categories');
        const bookingsCollection = client.db('resaleCar').collection('bookings');
        const usersCollection = client.db('resaleCar').collection('users');

        // Get Categories
        app.get('/categories', async(req, res)=>{
            const query = {};
            const cursor = categoriesCollection.find(query)
            const categories = await cursor.toArray();
            res.send(categories)
        })

        // Get products 
        app.get('/products', async(req, res)=>{
            let query = {};
            if(req.query.category){
                query = {
                    category: req.query.category
                }
            }
            const cursor = productsCollection.find(query)
            const products = await cursor.toArray();
            res.send(products)
            console.log(products)
        })
// ************
        app.get('/sellerProducts', async(req, res)=>{
            let query = {};
            if(req.query.seller){
                query = {
                    seller: req.query.seller
                }
            }
            const cursor = productsCollection.find(query)
            const products = await cursor.toArray();
            res.send(products)
            console.log(products)
        })

        // Post booking information
        app.post('/bookings', async(req, res)=>{
            const booking = req.body;
            console.log(booking);
            const result = await bookingsCollection.insertOne(booking);
            res.send(result);
        })

        // Get booking information
        app.get('/bookings', verifyJWT, async(req, res)=>{
            const email = req.query.email;
            const decodedEmail = req.decoded.email;

            if(email !== decodedEmail){
                return res.status(403).send({message: 'Forbidden Access'})
            }
          
            const query = {buyerEmail : email}
            const bookings = await bookingsCollection.find(query).toArray();
            res.send(bookings);
        })

        app.get('/jwt', async(req, res)=>{
            const email = req.query.email;
            const query = {email: email}
            const user = await usersCollection.findOne(query);
            if(user){
                const token = jwt.sign({email}, process.env.ACCESS_TOKEN, {expiresIn: '2h'})
                return res.send({accessToken: token});
            }
            console.log(user)
            res.status(403).send({accessToken: ''})
        })

        // Post users in DB
        app.post ('/users', async(req, res)=>{
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result);
        })

        // Get users
        app.get('/users', async(req, res)=> {
            const query = {};
            const users = await usersCollection.find(query).toArray();
            res.send(users);
        })

        // Update Admin
        app.put('/users/admin/:id', verifyJWT, async(req, res)=>{
            const decodedEmail = req.decoded.email;
            const query = {email: decodedEmail};
            const user = await usersCollection.findOne(query);
            if(user?.role !== 'admin'){
                return res.status(403).send({message: 'Forbidden Access'})
            }

            const id = req.params.id;
            const filter = { _id: ObjectId(id)}
            const options = {upsert: true};
            const updatedDoc = {
                $set: {
                    role: 'admin'
                }
            }
            const result = await usersCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        })

        // Check admins
        app.get('/users/admin/:email', async(req, res)=>{
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({isAdmin: user?.role === 'admin'})
        })

        // Check Sellers
        app.get('/users/seller/:email', async(req, res)=>{
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({isSeller: user?.role === 'Seller'})
        })

        // Check Buyers
        app.get('/users/buyer/:email', async(req, res)=>{
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({isBuyer: user?.role === 'Buyer'})
        })

        // Add product
        app.post('/products', async(req, res)=>{
            const product = req.body;
            const result = await productsCollection.insertOne(product);
            res.send(result);
        })


    }
    finally{

    }
}

run().catch(console.dir);


app.get('/', (req, res)=>{
    res.send('Resale server is running')
})

app.listen(port, ()=> {
    console.log(`Resale server running on ${port}`);
})