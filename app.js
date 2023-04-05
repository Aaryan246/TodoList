//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ = require("lodash");
const { Schema } = mongoose;

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect('mongodb+srv://Admin:Admin@cluster0.c0xt2gm.mongodb.net/?retryWrites=true&w=majority', {useNewUrlParser : true});

const itemsSchema = new Schema({
  name:  String
});

const listSchema = new Schema({
  name: String,
  items: [itemsSchema]
})
const Item = mongoose.model('Item', itemsSchema);

const List = mongoose.model("List", listSchema);

const item1 = new Item({
  name:"Welcome to your ToDo List!"});

const item2 = new Item({
  name:"Hit the + button to add new item."});

const item3 = new Item({
  name:"<-- Hit this to delete an item."});

const defaultItems = [item1, item2, item3];

app.get("/", function(req, res) {

  Item.find({}).then(function(foundItems){
    if (foundItems.length === 0){
      Item.insertMany(defaultItems)
            .then(function () {
              console.log("Successfully saved defult items to DB");
            })
            .catch(function (err) {
              console.log(err);
            });
      res.redirect("/");
    }else {
      res.render("list", { listTitle: "Today", newListItems: foundItems });
  }}).catch(function(err){
    console.log(err);
  });
});

app.get("/:customListName",function(req, res){
  const customListName = _.capitalize(req.params.customListName);


  List.findOne({name: customListName}).then(function(foundList){
    if(!foundList){
      //Create a new list
      const list = new List({
        name: customListName,
        items: defaultItems
      });
      list.save();
      res.redirect("/" + customListName);
    }else{
      //List already exists
      res.render("list", {listTitle: foundList.name, newListItems: foundList.items });
    }
  }).catch(function(err){
    console.log(err);
  });
});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.listName;

  const item = new Item ({
    name : itemName
  });

  if (listName === "Today"){
    item.save();
    res.redirect("/");
  }else {
    List.findOne({name: listName}).then(
      function(foundList){
         foundList.items.push(item);
         foundList.save();
         res.redirect("/" + listName);
      }
    ).catch(function(err){
      console.log(err);
    });
  }
});

app.post("/delete",function(req,res){

  const deleteItemID = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today"){
    Item.findByIdAndRemove(deleteItemID).then(function(){
      console.log("Delete Successfully");
      res.redirect("/");
    }).catch(function(err){
      console.log(err)
    });
  }else {
    List.findOneAndUpdate(
      {name: listName},
      {$pull: {items: {_id: deleteItemID}}}).then(function(){
        res.redirect("/" + listName);
      }).catch(function(err){
        console.log(err);
      });
  }
});

app.get("/work", function(req,res){
  res.render("list", {listTitle: "Work List", newListItems: workItems});
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
