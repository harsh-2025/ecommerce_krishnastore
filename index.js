const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv").config();
const app = express();
app.use(cors());
const Stripe=require("stripe")
app.use(express.json({ limit: "10mb" }));
const PORT = process.env.PORT || 8080;

//mongodb connection
console.log(process.env.MONGODB_URL);
mongoose.set("strictQuery", false);
mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => console.log("connect to database"))
  .catch((err) => console.log(err));

//sschema
const userSchema = mongoose.Schema({
  firstName: String,
  lastName: String,
  email: {
    type: String,
    unique: true,
  },
  password: String,
  confirmPassword: String,
  image: String,
});
//moel
const userModel = mongoose.model("user", userSchema);

//api
app.get("/", (req, res) => {
  res.send("server is running");
});
app.post("/signup", async (req, res) => {
  const { email } = req.body;

  try {
    const result = await userModel.findOne({ email: email });

    if (result) {
      res.send({ message: "Email id is already registered", alert: false });
    } else {
      const data = new userModel(req.body);
      await data.save();
      res.send({ message: "Successfully signed up", alert: true });
    }
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: "An error occurred", alert: false });
  }
});
//api login
app.post("/login", async (req, res) => {
  console.log(req.body);
  const { email } = req.body;
  const { password } = req.body;
  try {
    const resultmail = await userModel.findOne({ email: email });
    const resultpass = await userModel.findOne({ password: password });
    const result = resultmail && resultpass;
    if (result) {
      const dataSend = {
        _id: result._id,
        firstName: result.firstName,
        lastName: result.lastName,
        email: result.email,
        image: result.image,
      };
      res.send({ message: "Login successfull", alert: true, data: dataSend });
      console.log(dataSend);
    } else {
      res.send({ message: "Please check Email or password", alert: false });
    }
  } catch (err) {
    console.log(err);
  }
});
//product section
const schemaProduct = mongoose.Schema({
  name: String,
  category: String,
  image: String,
  price: String,
  description: String,
});
const productModel = mongoose.model("product", schemaProduct);

//save product in database
app.post("/uploadProduct", async (req, res) => {
  console.log(req.body);
  const data = await productModel(req.body);
  const datasave = await data.save();
  res.send({ message: "Upload Successfully" });
});

app.get("/product", async(req, res) => {
const data=await productModel.find({})
res.send(JSON.stringify(data))
});



// payment gateway
console.log(process.env.STRIPE_SECRET_KEY)
const stripe  = new Stripe(process.env.STRIPE_SECRET_KEY)

app.post("/create-checkout-session",async(req,res)=>{

     try{
      const params = {
          submit_type : 'pay',
          mode : "payment",
          payment_method_types : ['card'],
          billing_address_collection : "auto",
          shipping_options : [{shipping_rate : "shr_1NSB7DSDEITmVpzKWEKPw5Bh"}],

          line_items : req.body.map((item)=>{
            return{
              price_data : {
                currency : "inr",
                product_data : {
                  name : item.name,
                  // images : [item.image]
                },
                unit_amount : item.price * 100,
              },
              adjustable_quantity : {
                enabled : true,
                minimum : 1,
              },
              quantity : item.qty
            }
          }),

          success_url : `${process.env.FRONTEND_URL}/success`,
          cancel_url : `${process.env.FRONTEND_URL}/cancel`,

      }


      const session = await stripe.checkout.sessions.create(params)
      // console.log(session)
      res.status(200).json(session.id)
     }
     catch (err){
        res.status(err.statusCode || 500).json(err.message)
     }

})


//api for getting the data
app.listen(PORT, () => console.log("server is running"));
