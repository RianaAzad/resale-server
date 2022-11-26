const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion } = require('mongodb');
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
            if(req.query.categoryName){
                query = {
                    categoryName: req.query.categoryName
                }
            }
            const cursor = productsCollection.find(query)
            const products = await cursor.toArray();
            res.send(products)
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