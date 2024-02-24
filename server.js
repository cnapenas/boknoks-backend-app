// Purpose: Add new product to database
const bcrypt = require('bcrypt');
const mongoose = require('./db');
const passport = require('passport');
const express = require('express');
const session = require('express-session');
var bodyParser = require('body-parser');
const cors = require("cors");



// Schema for users of app
    const ProductSchema = new mongoose.Schema({

        productCode: {
            type: String,
            required: true,
        },

        productName: {
            type: String,
            required: true,
        },
        productQty: {
            type: Number,
            required: true,
            default: 0,
            
        },
        productPrice: {
            type: Number,
            required: true,
            default: 0,
        },
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
        User.findOne({ username: username }, function (err, user) {
        if (err) { return done(err); }
        if (!user) { return done(null, false); }
        if (!user.validPassword(password)) { return done(null, false); }
        return done(null, user);
        });
    }
    ));


    const app = express();

    // 1. Use CORS middleware
    // app.use(cors());
    app.use(cors({
         origin: 'http://localhost:3001',
        // origin: 'https://boknoks-nxsiy.mongodbstitch.com',
        // origin: 'https://boknokssystem.onrender.com',
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

    var port =  3000;

  




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

    app.put("/updateDataQty/:pCode", async (req, res) => {
        try {
            const productCode = req.params.pCode;
            const productQty = req.body.productQty;

        
            
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
        Product.find({}, function (err, allProducts) {
            if (err) {
                console.log(err);
            } else {
                //res.render("home", { details: allDetails })
                if (allProducts) {
                    
                    console.log("Products found");
                    res.send(allProducts);
                }
                else {
                    res.send("No products found");
                }
            }
        });
    });

    app.get("/getProductWithProductCodeAndName/:pCode/:pName", function (req, res) 
    {   
        const productCode = req.params.pCode;
        const productName = req.params.pName;

        if (productCode === "empty" && productName != "empty") {
            console.log("Product Code Empty");
            Product.find({ productName: productName }, function (err, product) {
                if (err) {
                    console.log(err);
                } else {
                    if (product && product.length > 0) {
                        console.log("Product found");
                        console.log(product);
                        res.send(product);
                    } else {
                        res.send("No product found with the given product code");
                    }
                }
            });
        }
        else if (productName === "empty" && productCode!= "empty") 
        {
            console.log("Product name Empty");
            Product.find({ productCode: productCode }, function (err, product) {
                if (err) {
                    console.log(err);
                } else {
                    if (product && product.length > 0) {
                        console.log("Product found");
                        console.log(product);
                        res.send(product);
                    } else {
                        res.send("No product found with the given product code");
                    }
                }
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
                    { productCode: productCode },
                    { productName: productName }
                ]
            }, function (err, allProducts) {
                if (err) {
                    console.log(err);
                } else {
                    //res.render("home", { details: allDetails })
                    if (allProducts) {
                        
                        console.log("Products found");
                        console.log(allProducts);
                        res.send(allProducts);
                    }
                    else {
                        res.send("No products found");
                    }
                }
            });
        }
        
    
    });


    app.delete("/deleteProduct/:pCode", async (req, res) => {
        try {
            const productCode = req.params.pCode;
        
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
        const { username, password } = req.body;

        // Check if user already exists
        console.log(username);
        console.log(password);
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
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
                    res.status(200).json({ message: 'User authenticated successfully', user: req.user.username });
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