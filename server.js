const express = require("express");
const mongoose = require("mongoose");
const cors = require('cors');

const auth = require("./middleware/auth");
const timer = require('./middleware/timer');
const userRoute = require("./routes/UserRoute");
const pollRoute = require("./routes/PollRoute");
const restaurantRoute = require("./routes/RestaurantRoute");
const orderRoute = require("./routes/OrderRoute");
const mealRoute = require("./routes/MealRoute");
const orderItemRoute = require("./routes/OrderItemRoute");

const app = express();
const port = process.env.PORT || 3000;

// cors
app.use(cors());
/*app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if(req.method === 'OPTIONS'){
        return res.status(200);
    }
    next();
});*/

// middlewares
app.use(express.json());
app.use(auth);
timer();

// API routes
app.use("/user", userRoute);
app.use("/poll", pollRoute);
app.use("/order", orderRoute);
app.use("/restaurant", restaurantRoute);
app.use("/meal", mealRoute);
app.use("/orderitem", orderItemRoute);

// connect to mongodb cluster
mongoose.connect(`mongodb+srv://nikolahot:pasteta@mydb-x0kvb.mongodb.net/hungry-herceg?retryWrites=true&w=majority`,
  {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  }
)
.then(res => {
  app.listen(port, (req, res) => {
    console.log(`Server started on port ${port}`);
  });
})
.catch(err => {
  console.log(err);
});