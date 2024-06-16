// Purpose: Add new product to database
require('dotenv').config();
const bcrypt = require('bcrypt');
const mongoose = require('./db');
const passport = require('passport');
const express = require('express');
const session = require('express-session');
var bodyParser = require('body-parser');
const cors = require("cors");
const uuid = require('uuid');



// Schema for products of app
    const ProductSchema = new mongoose.Schema({

        productCode: {
            type: String,
            required: true
        },

        productName: {
            type: String,
            required: true
        },
        productQty: {
            type: Number,
            required: true,
            default: 0
            
        },
        productPrice: {
            type: Number,
            required: true,
            default: 0
        },
        transactionDate: {
            type: Date,
            default: Date.now,
            required: true
        },
        transactionType: {
            type: String,
            required: true
        }

    });
    const Product = mongoose.model('products', ProductSchema);
    Product.createIndexes();

    const UserSchema = new mongoose.Schema({
        username: {
        type: String,
        required: true,
        unique: true
        },
        password: {
        type: String,
        required: true
        },
        userType: {
        type: String,
        required: true
        },

        userRegCode: {
            type: String,
            required: true,
            unique: true
        }

    });

    UserSchema.pre('save', async function(next) {
        const user = this;
        if (user.isModified('password')) {
            console.log("Password is modified");
        user.password = await bcrypt.hash(user.password, 10);
        }
        else {
            console.log("Password is not modified");
        }
        next();
    });
    
    UserSchema.methods.validPassword = async function(password) {
        const user = this;
        console.log("Password is valid" + password);
        console.log("User password" + user.password);
        return await bcrypt.compare(password, user.password);
    };

    const User = mongoose.model('users', UserSchema);


    const LocalStrategy = require('passport-local').Strategy;

    passport.use(new LocalStrategy(
    function(username, password, done) {
        User.findOne({ username: username })
        .exec()
        .then(user => {
            if (!user) {
                return done(null, false);
            }
            if (!user.validPassword(password)) {
                return done(null, false);
            }
            return done(null, user);
        })
        .catch(err => {
            return done(err);
        });
    }
    ));

    const TransactionSchema = new mongoose.Schema({

        transactionID: {
            type: String,
            required: true,
            unique: true,
            index: true
        },

        product: ProductSchema, // Embed the ProductSchema here
  

        transactDate: {
            type: Date,
            default: Date.now,
            required: true
        },
        transactType: {
            type: String,
            required: true
        },
        transactUser: {
            type: String,
            required: true
        }

    });

    TransactionSchema.pre('validate', function(next) {
        if (!this.transactionID) {
          this.transactionID = uuid.v4();
        }
        next();
      });

    const Transaction = mongoose.model('transaction', TransactionSchema);
    Transaction.createIndexes();

    const RegCodeSchema = new mongoose.Schema({ 
        userRegCode: {
            type: String,
            required: true,
            unique: true
        }
    });

    const RegCode = mongoose.model('regcodes', RegCodeSchema);
   

    


    const app = express();

    // 1. Use CORS middleware
    // app.use(cors());
    app.use(cors({
          origin: process.env.CLIENT_URL,
        credentials: true
    }));


    // 2. Use body-parser middleware
    app.use(bodyParser.json());

    // 3. Use session middleware
    app.use(session({
        secret: 'boknoks-inventory-system',
        resave: false,
        saveUninitialized: false,
    }));

 

    // 4. Initialize Passport
    app.use(passport.initialize());
    app.use(passport.session());

    passport.serializeUser((user, done) => {
        done(null, user.id);
    });
    
    passport.deserializeUser((id, done) => {
        User.findById(id, (err, user) => {
            done(err, user);
        });
    });

    // 5. Define your routes
    var router = express.Router();
    app.use(router);

    var port =  process.env.DB_PORT || 3000;

  




    app.post("/addnewproduct", async (req, resp) => {
        try {
            
            
            const prod = new Product(req.body);
            let result = await prod.save();
            result = result.toObject();
            if (result) {
                resp.send(req.body);
                console.log(result);
            } else {
                console.log("Product already register");
            }
            
            

        } catch (e) {
            console.log(e);
            resp.send("Something Went Wrong");
        }
    });

    app.post("/addtransaction", async (req, resp) => {
        try {
            
            
            const prod = {
                productCode: req.body.productCode,
                productName: req.body.productName,
                productQty: req.body.productQty,
                productPrice: req.body.productPrice,
                transactionDate: req.body.transactionDate,
                transactionType: req.body.transactionType
              };

            

            const transaction = new Transaction({
                product: prod, // Assign the product details here
                transactDate: req.body.transactDate,
                transactType: req.body.transactType,
                transactUser: req.body.transactUser
            });

            let result = await transaction.save();
            result = result.toObject();
            if (result) {
                console.log("added transaction successfully!");
                resp.send(req.body);
                console.log(result);
            } else {
                console.log("error in adding transaction!");
            }
            
            

        } catch (e) {
            console.log(e);
            resp.send("Something Went Wrong");
        }
    });

    app.put("/updateDataQty/:pCode", async (req, res) => {
        try {
            const productCode = req.params.pCode;
            const productQty = req.body.productQty;

        
            console.log("PProduct code is " + productCode);
            console.log("Product qty is " + productQty);
            let result  = await Product
                .findOneAndUpdate({ productCode: productCode }, { productQty: productQty } ,{ new: true });
            if (result) {
                res.send(result);
            }
            else {
                res.send("Product not found");
            }
        } catch (e) {
            console.log(e);
            res.send("Something Went Wrong");
        }
    });


    app.put("/updateDataPrice/:pCode", async (req, res) => {
        try {
            const productCode = req.params.pCode;
        
            const productPrice = req.body.productPrice;
            let result  = await Product
                .findOneAndUpdate({ productCode: productCode }, { productPrice: productPrice } ,{ new: true });
            if (result) {
                res.send(result);
            }
            else {
                res.send("Product not found");
            }
        } catch (e) {
            console.log(e);
            res.send("Something Went Wrong");
        }
    });

    app.get("/getProducts", function (req, res) 
    {   
        Product.find({})
        .exec()
        .then(allProducts => {
            if (allProducts) {
                console.log("Products found");
                res.send(allProducts);
            } else {
                res.send("No products found");
            }
        })
        .catch(err => {
            console.log(err);
        });
    });

    app.get("/getSalesForDate/:tDate/:tType", function (req, res) {   
        const date = new Date(req.params.tDate);
        const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
        const transactType = req.params.tType;

        console.log(startOfDay);
        console.log(endOfDay);
        console.log(transactType);
    
        Transaction.find({
            transactDate: {
                $gte: startOfDay,
                $lt: endOfDay
            },
            transactType: transactType
        })
        .exec()
        .then(allTransactions => {
            if (allTransactions.length > 0) {
                console.log("Transactions found");
            }
            res.send(allTransactions);
        })
        .catch(err => {
            console.log(err);
        });
    });

    app.get("/getProductWithProductCodeAndName/:pCode/:pName", function (req, res) 
    {   
        const productCode = req.params.pCode;
        const productName = req.params.pName;

        if (productCode === "empty" && productName != "empty") {
            console.log("Product Code Empty");
            Product.find({ productName: { $regex: productName, $options: 'i' } })
            .exec()
            .then(product => {
                if (product && product.length > 0) {
                    console.log("Product found");
                    console.log(product);
                    res.send(product);
                } else {
                    res.send("No product found with the given product code");
                }
            })
            .catch(err => {
                console.log(err);
            });
            
        }
        else if (productName === "empty" && productCode!= "empty") 
        {
            console.log("Product name Empty");
            Product.find({ productCode: { $regex: productCode, $options: 'i' } })
            .exec()
            .then(product => {
                if (product && product.length > 0) {
                    console.log("Product found");
                    console.log(product);
                    res.send(product);
                } else {
                    res.send("No product found with the given product code");
                }
            })
            .catch(err => {
                console.log(err);
            });
        }
        else if (productName === "empty" && productCode === "empty") {
            console.log("Product Code and Product Name Empty");
            res.send("No products found");
        }
        else
        {
            console.log("Product Code and Product Name not Empty");
            Product.find({
                $or: [
                    { productCode: { $regex: productCode, $options: 'i' } },
                    { productName: { $regex: productName, $options: 'i' } }
                ]
            })
            .exec()
            .then(allProducts => {
                if (allProducts) {
                    console.log("Products found");
                    console.log(allProducts);
                    res.send(allProducts);
                } else {
                    res.send("No products found");
                }
            })
            .catch(err => {
                console.log(err);
            });
        }
        
    
    });


    app.delete("/deleteProduct/:pCode", async (req, res) => {
        try {
            const productCode = req.params.pCode;
            console.log(productCode);
            let result  = await Product.findOneAndDelete({ productCode: productCode });
            if (result) {
                res.send(result);
            }
            else {
                res.send("Product not found");
            }
        } catch (e) {
            console.log(e);
            res.send("Something went wrong");
        }
    });


    app.post("/login", async (req, res) => {
        try {
        const { username, password } = req.body;
    
        async function checkUserValidity() {
        
            try {

                // Check if user exists
                const user = await User.findOne({ username });
                console.log(user);
                if (!user) {
                    return res.status(400).json({ message: 'User does not exist' });
                }
                // Check password
                console.log(user);
                const validPassword = await user.validPassword(password);
                console.log(validPassword);
                if (!validPassword) {
                    
                    return res.status(400).json({ message: 'Invalid password' });
                }

                else {

                    // User is authenticated
                    res.status(200).json({ message: 'User authenticated successfully' });
                }
            } catch (error) {
            console.error(error);
            }
        }
        
        checkUserValidity();
    
        
        } catch (error) {
        res.status(500).json({ message: 'Server error' });
        }
    });



    app.post("/register", async (req, res) => {
    try {
        const { username, password , userType, userRegCode} = req.body;

        // Check if user already exists
      
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }
       
        const validRegCode = await RegCode.findOne({userRegCode});
        if (!validRegCode) {
            return res.status(400).json({ message: 'Invalid registration code' });
        }
        else
        {
            console.log("Valid registration code");
            const existingRegCode = await User.findOne({ userRegCode });
            if (existingRegCode) {
                return res.status(400).json({ message: 'User registration code already exists' });
            }
        }



        //Create new user
        async function saveUser() {
        try {
            const user = new User(req.body);
            let result = await user.save();
            result = result.toObject();

            if (res) {
                
                console.log(result);
                res.status(201).json({ message: 'User registered successfully' });
            }
        } catch (error) {
            console.error(error);
        }
        }
        
        saveUser();




        
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
    });


    app.post('/logout', function(req, res, next) {
        req.logout(function(err,user,info) {
          if (err) 
          {     
            
            err.info = info;
            return next(err); 
          }
         
          res.status(200).json({ message: 'logged out' });
        });
    });

    app.post('/loginv2', (req, res, next) => {
        passport.authenticate('local', (err, user, info) => {
            try {
                console.log(err);
                console.log(user);
                console.log(info);
                if (err) {
                    const error = new Error('Authentication error: ' + err.message);
                    error.info = info;
                    
                    return next(error);
                }
                if (!user) {
                    const error = new Error('Authentication failed: user not found');
                    error.info = info;
                    return next(error);
                }
    
                req.login(user, (error) => {
                    if (error) return next(error);
                    // + req.user.username
                    res.status(200).json({ message: 'User authenticated successfully', user: req.user});
                });
            } catch (error) {
                return next(error);
            }
        })(req, res, next);
    });
    
    app.use((err, req, res, next) => {
        console.log(err);
        console.log(res);
  
        res.status(500);
        res.json({ 
            error: err.message,
            info: err.info, // additional info about the error
            stack: err.stack // stack trace of the error
        });
    });

    app.get('/render', function(req, res) {
        res.render('server', {title: 'res vs app render'})
    })

    app.listen(port, () => {
        console.log("App listen at port " + port);
    });
    module.exports = {User, Product, app};