require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const {MongoClient} = require('mongodb');
const dns = require('dns');
const { URL } = require('url');

const uri = process.env.DB_URL;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

const db = client.db('urlshortener');
const collection = db.collection('urls');

client.connect(err => { 
  if (err) {  
    console.log(err);
  } else {  
    console.log('Connected successfully to database');    
  }
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));



// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.post('/api/shorturl', function(req, res) {
  const url = req.body.url;

  const parsedUrl = new URL(url);

  const dnslookup = dns.lookup(parsedUrl.host, async (err, address) => {
    if (!address) {
      res.json({ error: 'invalid url' });
    } else {
     const urlCount = await collection.countDocuments();

     const urlObject = {
        url,
        short_url: urlCount + 1
      };  
      const result = await collection.insertOne(urlObject);
      console.log(result);
      res.json({original_url : url, short_url : urlCount + 1});
    }
  console.log(req.body);
  });
});

app.get('/api/shorturl/:short_url', async (req, res) => {
  const shortUrl = req.params.short_url;  

  const urlDoc = await collection.findOne({ short_url: parseInt(shortUrl) });
  res.redirect(urlDoc.url);

});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

