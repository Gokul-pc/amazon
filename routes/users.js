const { response, request, Router } = require('express');
var express = require('express');
var router = express.Router();
const passport = require('passport')
var GoogleStrategy = require('passport-google-oauth20').Strategy;

const productHelpers = require('../helpers/product-helpers');
const userHelpers = require('../helpers/user-helpers')
const veryfyLogin = (req, res, next) => {
    if (req.session.userLoggedIn) {
        next()
    } else {
        res.redirect('/login')
    }
}

/* GET home page. */
router.get('/', async function (req, res) {
    let user = req.session.user
    console.log(user);
    let cartCount = null
    if (req.session.user) {
        cartCount = await userHelpers.getCartCount(req.session.user._id)
    }
    productHelpers.getAllProducts().then((products) => {

        res.render('user/home-page', { products, user, cartCount })
    })
})


router.get('/login', (req, res) => {
    if (req.session.user) {
        res.redirect('/')
    } else {
        res.render('user/login', { "loginErr": req.session.userLoginErr })
        req.session.userLoginErr = false
    }
})

// router.get('/signup', (req, res) => {
//     res.render('user/signup')
// })






    router.post('/signup', (req, res) => {
        userHelpers.doSignup(req.body).then((response) => {
            console.log(response)
            req.session.user = response
            req.session.userLoggedIn = true
            res.redirect('/')
        })
    })


    router.post('/userlogin', (req, res) => {
        userHelpers.doLogin(req.body).then((response) => {
            if (response.status) {
                req.session.user = response.user
                req.session.userLoggedIn = true
                res.redirect('/')
            } else {
                req.session.userLoginErr = "Invalid username or Password"
                res.redirect('/login')
            }
        })
    })


    router.get('/logout', (req, res) => {
        req.session.user = null
        res.redirect('/login')
    })


    router.get('/cart', veryfyLogin, async (req, res) => {
        let products = await userHelpers.getCartProducts(req.session.user._id)
        let totalValue = await userHelpers.getTotalAmount(req.session.user._id)
        console.log(products);
        // res.render('user/cart', { products,user:req.session.user._id,totalValue})
        res.render('user/cart', { layout: 'backend', products, user: req.session.user._id, totalValue });
    })

    router.get('/add-to-cart/:id', (req, res) => {
        console.log("api call");
        userHelpers.addToCart(req.params.id, req.session.user._id).then(() => {
            res.json({ status: true })
        })
    })

    router.post('/change-product-quantity', (req, res, next) => {
        userHelpers.changeProductQuantity(req.body).then(async (response) => {
            response.total = await userHelpers.getTotalAmount(req.session.user._id)
            res.json(response)

        })

    })

    router.get('/place-order', veryfyLogin, async (req, res) => {
        let total = await userHelpers.getTotalAmount(req.session.user._id)


        res.render('user/place-order', { layout: 'backend', total, user: req.session.user })

    })

    router.post('/place-order', async (req, res) => {
        let products = await userHelpers.getCartProductList(req.body.userId)
        let totalPrice = await userHelpers.getTotalAmount(req.body.userId)
        userHelpers.placeOrder(req.body, products, totalPrice).then((orderId) => {
            console.log("gokul=", orderId);
            if (req.body['payment-method'] === 'COD') {
                res.json({ codSuccess: true })
            } else {
                userHelpers.generateRazorpay(orderId, totalPrice).then((response) => {
                    res.json(response);
                })

            }

        })
        console.log(req.body)
    })

    router.get('/order-success', (req, res) => {
        res.render('user/order-success', { layout: null })
    })
    router.post('/verify-payment', (req, res) => {

        console.log(req.body);
        userHelpers.verifyPayment(req.body).then(() => {
            userHelpers.changePaymentStatus(req.body['receipt']).then(() => {
                console.log("payment succcessful");
                res.json({ status: true })
            })

        }).catch((err) => {
            console.log(err);
            res.json({ status: false, errMsg: 'payment faild' })
        })


    })





    module.exports = router;