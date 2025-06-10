//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
mongoose.connect("mongodb+srv://derbaliiyed:iyedd@cluster0.chwrqcj.mongodb.net/todolistDB?retryWrites=true&w=majority&appName=Cluster0");

const items = ["Buy Food", "Cook Food", "Eat Food"];
const workItems = [];
const itemSchema={
  name: String,
};
const Item=mongoose.model("Item",itemSchema);
const item1 = new Item({
  name: "eat",
});
const item2 = new Item({
  name: "sleep",
});
const item3 = new Item({
  name: "eat",
});
const defaultItems = [item1, item2, item3];

const listSchema={
  name: String,
  items: [itemSchema], // Use the itemSchema for the items array
}

const List = mongoose.model("List", listSchema);
async function insertItems(res, defaultItems) {
  try {
    const foundItems = await Item.find(); // Fetch items from the database
    // console.log(foundItems);

    if (foundItems.length === 0) {
      await Item.insertMany(defaultItems); // Insert default items if the list is empty
      console.log("Items inserted successfully");
      res.redirect("/"); // Redirect to the home route after inserting items
    } else {
      res.render("list", { listTitle: "Today", newListItems: foundItems }); // Render the list if items exist
    }
  } catch (err) {
    console.log(err);
  }
}

app.get("/", function (req, res) {

  insertItems(res, defaultItems); // Pass `res` and `defaultItems` to `insertItems`
});

app.post("/", async function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName,
  });
    if (listName === "Today") {
      item.save(); // Save the new item to the database
      res.redirect("/");
  }else{
    try{
      const foundList=await List.findOne({name:listName});
      if (foundList) {
        foundList.items.push(item); // Add the new item to the found list
        await foundList.save(); // Save the updated list
        res.redirect("/" + listName); // Redirect to the custom list
      } else {
        console.log("List not found:", listName);
        res.redirect("/"); // Redirect to the home route if the list is not found
      }

    }catch(err){
      console.log(err);
    }
  }

});
app.post("/delete", async (req, res) => {
  try {
    const checkedItemId = req.body.checkbox; // Get the item ID from the request body
    const listName= req.body.listName; // Get the list name from the request body
    if (listName === "Today") {
      const result = await Item.findByIdAndDelete(checkedItemId); // Use findByIdAndDelete instead of findByIdAndRemove
    if (result) {
      console.log("Successfully deleted the checked item:", checkedItemId);
    } else {
      console.log("No item found with that ID:", checkedItemId);
    }
    res.redirect("/"); // Redirect to the home route after deletion
    }else{
      const result = await List.findOneAndUpdate({name:listName},{$pull:{items:{_id:checkedItemId}}});
      if (result) {
        console.log("Successfully deleted the item from the list:", listName);
      } else {
        console.log("No list found with that name:", listName);
      }
      res.redirect("/" + listName); // Redirect to the custom list after deletion
    }
    
  } catch (err) {
    console.error("Error deleting item:", err);
    res.redirect("/"); // Redirect even if there's an error
  }
});

app.get("/:paramName", async function(req,res){
  let customListName= _.capitalize(req.params.paramName); // Access the parameter from the URL
  let result= await List.findOne({name:customListName});
  if (result) {
    console.log("List already exists:", customListName);
    res.render("list", { listTitle: result.name, newListItems: result.items }); // Render the list if items exist

    
  } else {
    console.log("List does not exist");
    const list=new List({
      name: customListName,
      items: defaultItems,
    });
    list.save(); // Save the new list to the database
    res.redirect("/" + customListName); // Redirect to the new list
  }
  

});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
