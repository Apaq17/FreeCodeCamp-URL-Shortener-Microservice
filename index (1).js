require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const mongoose = require("mongoose");
const jsonParser = require("body-parser").json();
const bodyParser = require("body-parser");
const mySecret = process.env["MONGO_URI"];
const dns = require("dns");
const urlParser = require("url");
const urlAddress = require("url");
const { MongoClient } = require("mongodb");
const client = new MongoClient(mySecret);
const db = client.db("URL_SHORTENER_DATABASE");
const coll = db.collection("url_collection");
var result = {};
var url_or = "";
var url_sh = 0;

mongoose.connect(mySecret, { useNewUrlParser: true, useUnifiedTopology: true });

// Basic Configuration
const port = process.env.PORT || 3000;

const urlSchema = new mongoose.Schema({
  original_url: { type: String, required: true },
  short_url: Number,
});

const Url = mongoose.model("Url", urlSchema);

app.use(cors());

app.use("/public", express.static(`${process.cwd()}/public`));
app.use(express.urlencoded({ extended: true }));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});

app.post("/api/shorturl", async function (req, res) {
  //url_or = req.body.url;
  // url_or = urlParser.parse(req.body.url);
  // hostname = url_or.hostname;
  // url_href = url_or.href;
  const parsedUrl = new URL(req.body.url);

  hostname = parsedUrl.hostname;
  url_href = parsedUrl.href;
  console.log("hostname:", hostname);

  console.log("url_href:", url_href);
  const valid_address = dns.lookup(hostname, async (err, address, family) => {
    console.log("valid_address", valid_address);
    if (err) {
      console.log("err", err);
      console.log("error: invalid url");
      console.log("valid_address", valid_address);
      return res.json({ error: "invalid url" });
    } else {
      try {
        async function run() {
          result = await coll.findOne({ original_url: url_href });
          console.log("result", result);
          if (result) {
            return res.json({
              original_url: result.original_url,
              short_url: result.short_url,
            });
          } else {
            randomNumber = Math.floor(Math.random() * 100) + 1;
            const url = new Url({
              original_url: url_href,
              short_url: randomNumber,
            });
            url_sh = url.short_url;
            await coll.insertOne(url);
            return res.json({
              original_url: url_href,
              short_url: url_sh,
            });
          }
        }
        run();
      } catch (error) {
        console.error("Error saving model:", error);
      }
    } //TRY
  });
});

app.get("/api/shorturl/:short", async function (req, res) {
  const sh = req.params.short;
  const findURL = await coll
    .findOne({ short_url: parseInt(sh) })
    .then((docs) => {
      console.log("This Result :", docs);
      console.log("This Result original url :", docs.original_url);
      res.redirect(docs.original_url);
      return docs.original_url;
    })
    .catch((err) => {
      console.log(err);
      return res.json({ error: "invalid url" });
    });
  console.log("###FindURL::::", findURL);
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
