//Loading modules from express
const express = require("express");

//npm library used to process data sent through http requests
const bodyParser = require("body-parser"); 

// Using Mongoose npm package for handling MongoDB Database
const mongoose = require("mongoose");

//Require lodash for addind some javascript functionalities
const _ = require("lodash");

const app = express();  // create application using express.js
app.set('view engine', 'ejs'); //use ejs module in the app

//transform url encoded request to JS accessible requests
app.use(bodyParser.urlencoded({extended: true})); 
app.use(express.static("public")); //use static files in the app

//connecting to mongodb server
const DB = "mongodb+srv://veer-admin:Veer-1501@cluster0.ie5qd.mongodb.net/todolistDB";
mongoose.connect(DB);

//Everything in Mongoose starts with a Schema. Each schema maps to a
//MongoDB collection and defines the shape of the documents within that collection.
const itemsSchema = {
    name: String
};

/* Creating a Model : To use our schema definition, we need to convert our itemsSchema
into a Model we can work with.
Model: Models are responsible for creating and reading documents from the underlying MongoDB
databases */ 
const Item = mongoose.model("Item", itemsSchema);

//creating new data for our collection
const item1 = new Item({
    name: "Welcome to your todolist"
});
const item2 = new Item({
    name: "Hit the + button to add new item to the list"
});

const item3 = new Item({
    name: "<--- Hit this to delete and item"
});
// Pushing all data to array
const defaultItems = [item1, item2, item3];

//creating another Schema which also contains ItemsSchema
const listSchema = {
    name: String,
    items: [itemsSchema]
};
//creating mongoose model
const List = mongoose.model("List", listSchema);


//GET Request for home route
app.get("/", function (req, res) {
    Item.find({}, function (err, foundItems) { //find in Item object

        if (foundItems.length === 0) { //If no any item found then insert defaultItems
            Item.insertMany(defaultItems, function (err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("Successfully saved the changes");
                }
            });
            res.redirect("/"); //and then redirect to the home page route
        } else { //else render list.ejs along with items
            res.render("list", {listTitle: "Today", newListItems: foundItems});
        }
    });
});

//GET Request for custom ToDolist
app.get("/:customListName", function (req, res) {
    const customListName = _.capitalize( req.params.customListName);//Captlize the first letter

    List.findOne({name: customListName}, function (err, foundList) { //we find the list with name
        if (!err) {
            if (!foundList) {//if not found with same name
                //create a new list
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
                list.save(); //save the list
                res.redirect("/" + customListName); //then redirect to the customList
            } else {
                //show existing list
                res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
            }
        }
    });
    // const list = new List({
    //     name: customListName,
    //     items: defaultItems
    // });
    // list.save();
});

//POST Request for home page
app.post("/", function (req, res) {

    const itemName = req.body.newItem; // store the values input from user in diff variables
    const listName = req.body.list;
    const item = new Item({ //create new item
        name: itemName
    });
    if(listName==="Today"){ //if listname is Today then save the input by user in list and redirect
    item.save();
    res.redirect("/");
    }else{ //else push the input in the other list and save and redirect it to particular that page
        List.findOne({name: listName}, function(err, foundList){ 
           foundList.items.push(item);
           foundList.save();
           res.redirect("/"+listName);
        });
    }
});

//POST request for deleting
app.post("/delete", function (req, res) {
    const checkedId = req.body.checkbox; //store inputs by user in checkID nd listname
    const listName = req.body.listName;
    if(listName==="Today"){ //if list is home page list then once the item is checked then remove it
        Item.findByIdAndRemove(checkedId, function (err) {
        if (!err) {
            console.log("Successfully deleted checked item");
            res.redirect("/");
        }
    });
    }
    else{ //else find the list and then remove it and redirect to that page
        List.findOneAndUpdate({name: listName}, {$pull :{items: {_id: checkedId}}}, function(err, foundList){
           if(!err){
               res.redirect("/"+listName)
           }
        });
    }
});

//GET request for work page
app.get("/work", function (req, res) {
    res.render("list", {listTitle: "Work List", newListItems: workItems});
});

// GET Request for About page
app.get("/about", function (req, res) {
    res.render("about");
});

//used to bind and listen the connections on the specified host and port
let port = process.env.PORT;
if(port==null ||port==""){
  port=3000;
}
app.listen(port, function () {
    console.log("Server started successfully");
});
