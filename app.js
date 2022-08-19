var express = require('express');
var mongoose = require('mongoose');
//Multer allows us to handle multipart/form data
var multer = require('multer');
var upload = multer();
var path = require('path');
var app = express();
var liveReload = require('livereload');
var connectLiveReload = require('connect-livereload');

const public = path.join(__dirname + '/public');

app.use(express.json());
//app.use(bodyParser.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static(public));
app.use(connectLiveReload());

const URI = 'mongodb+srv://mongo:pass1@cluster0.h3dfd.mongodb.net/?retryWrites=true&w=majority';

var liveReloadServer = liveReload.createServer();
liveReloadServer.watch(public);

mongoose.connect(
    URI, 
    {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
  );
  
  const db = mongoose.connection;
  db.on("error", console.error.bind(console, "connection error: "));
  db.once("open", function () {
    console.log("Connected successfully");
  });
  
  
  //Create a schema
  const UserSchema = new mongoose.Schema({
    username: {
      type: String,
      required: true,
    },
    log: [{
      description: {type: String}, 
      duration: {type: Number}, 
      date: {type: String},
    }]
  });
  
  
  const User = mongoose.model("User", UserSchema);
  
  //app.use(Router);
  
  
  
  
  //Creating a POST endpoint to add user
  app.post("/api/users", upload.none(), async (req,res) => {
    const newUser = new User(req.body);
    newUser.save()
    .then(item => {
      res.json({
        "username": item.username, 
        "id": item._id,
        });
  
    })
    .catch(err => {
      res.status(400).send(err);
    });
  });
  
  
  //GET request to showcase all users
  app.get("/api/users", async (req, res) => {
    User.find().select(['username', '_id'])
    .then((user) => {
      res.send(user)
    }) .catch((err) => {
      res.send("Items not found")
    })
  })
  
  //Retrieve user exercise logs
  app.get("/api/users/:_id/logs", async (req,res) => {
    var from = req.query['from'];
    var to = req.query['to'];
    var limit = parseInt(req.query['limit']);
  
    if(from == undefined) {
      from = "";
    }
    if(to == undefined) {
      to = new Date().toISOString().split('T')[0];
    }
    
    
    User.find({_id: req.params._id}, (err,value) => {
      if(err || value.length == 0) {
       res.send("Error or user not found in database"); 
      }
      else {
      var record = value[0].log;
      record = record.filter(item => item.date >= from && item.date <= to);
      if(!limit) {
        limit = record.length+1;
        }
      record = record.splice(0, limit);
       res.json({
         _id: req.params._id,
         username: value.username,
         count: record.length,
         log: record,
       });
      }
    })
  
  
  });
  
  
  
  
  //Create POST endpoint to add exercises
  app.post("/api/users/:_id/exercises", async (req,res) => {
    const id = req.body['_id'];
    const data = req.body;
    if(data.date == "") {
      data.date = new Date().toISOString().split('T')[0];
    }
    const log = {description: data.description, duration: data.duration, date: data.date};
  
    User.findOneAndUpdate(
      {_id: id},
      {$push: {log: log} }, (err, value) => {
        if(err) console.log(err);
        else {
          res.json({
          "_id": id,
          "username": value.username,
          "date": data.date,
          "duration": data.duration,      
          "description": data.description, 
        })};
      }
    );
    
    
  });
  
  
  
  //Create GET endpoint
  app.get("/users", async (req, res) => {
    const findUser = await User.find({});
  
    try {
      res.send(findUser);
    } catch (error) {
      res.status(500).send(error);
    }
  });
  
  
  
  app.listen(3000, () => {
    console.log("Server running on port 3000")
  });
  
  
  //Initial web page
  app.get('/', (req, res) => {
    res.sendFile(public + '/html/index.html')
  });

