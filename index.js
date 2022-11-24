const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

// Database access

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.6ifow7m.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
    try{
        const productsCollection = client.db('resaleCar').collection('products');
        const categoriesCollection = client.db('resaleCar').collection('categories')

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