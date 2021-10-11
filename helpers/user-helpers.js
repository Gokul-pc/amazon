var db = require('../config/connection')
var collection = require('../config/collections')
const bcrypt = require('bcrypt')
var objectId = require('mongodb').ObjectId
const { ObjectId } = require('bson')
const { response } = require('express')
const { Db } = require('mongodb')
const Razorpay=require('razorpay')
const { resolve } = require('path')
var instance = new Razorpay({
    key_id:'rzp_test_8bJVknTKBETSq1',
    key_secret:'a9e2BvPFdji9G6EBZjPX8AiU'
})
module.exports = {
    doSignup: (userData) => {
        return new Promise(async(resolve, reject) => {
            userData.Password = await bcrypt.hash(userData.Password, 10)
            db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data) => {
                resolve(data.insertedId)
            })
        })


    },
    doLogin: (userData) => {
        return new Promise(async(resolve, reject) => {
            let loginStatus = false
            let response = {}
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ Email: userData.Email })
            if (user) {
                bcrypt.compare(userData.Password, user.Password).then((status) => {
                    if (status) {
                        console.log("success");
                        response.user = user
                        response.status = true
                        resolve(response)
                    } else {
                        console.log("login fail");
                        resolve({ status: false })
                    }
                })
            } else {
                console.log("failed");
                resolve({ status: false })
            }
        })
    },
    addToCart: (proId, userId) => {
        let proObj={
            item:objectId(proId),
            quantity:1
        }
        return new Promise(async(resolve, reject) => {
            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: ObjectId(userId) })
            if (userCart) {
                let proExist=userCart.products.findIndex(product=>product.item==proId)
                console.log(proExist);
                if(proExist!=-1){
                    db.get().collection(collection.CART_COLLECTION).updateOne({user:objectId(userId), 'products.item':objectId(proId)},
                    {
                        $inc:{'products.$.quantity':1}
                    }
                    ).then(()=>{
                        resolve()
                    })
                }else{

               
                db.get().collection(collection.CART_COLLECTION).updateOne({ user: ObjectId(userId) },
                    {
                        $push: { products:proObj }
                    }
                ).then((response) => {
                    resolve()
                })
            }

            } else {
                let cartObj = {
                    user: ObjectId(userId),
                    products: [proObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((resolve) => {
                    resolve()
                })
            }


        })
    },
    getCartProducts: (userId) => {
        return new Promise(async(resolve, reject) => {
            let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([{
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }
                },
                {
                    $lookup:{
                        from:collection.PORDUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                    }
                }

               
            ]).toArray()
            resolve(cartItems)
        })
    },
    getCartCount:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let count=0
            let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
            if(cart){
                count=cart.products.length
            }
            resolve(count)
        })
    },
    changeProductQuantity:(details)=>{
        details.count=parseInt(details.count)
        details.quantity=parseInt(details.quantity)

        return new Promise((resolve,reject)=>{
            if(details.count==-1 && details.quantity==1){
            db.get().collection(collection.CART_COLLECTION).updateOne({_id:objectId(details.cart)},
            {
                $pull:{products:{item:objectId(details.product)}}
            }
            ).then((response)=>{
                resolve({removeProduct:true})
            })
        }else{


            db.get().collection(collection.CART_COLLECTION).updateOne({_id:objectId(details.cart), 'products.item':objectId(details.product)},
            {
                $inc:{'products.$.quantity':details.count}
            }
            ).then((response)=>{
                resolve({status:true})
            })
        }
     
        })
    },
    getTotalAmount:(userId)=>{
        return new Promise(async(resolve, reject) => {
            let total = await db.get().collection(collection.CART_COLLECTION).aggregate([{
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }
                },
                {
                    $lookup:{
                        from:collection.PORDUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                    }
                },
                {
                    $group:{
                        
                        _id:null,
                        total:{$sum:{$multiply:['$quantity',{$convert:{input:'$product.price',to:'int'}}]}}
                    }
                }

               
            ]).toArray()
            
            resolve(total[0].total)
        })

    },
    placeOrder:(order,products,total)=>{
        return new Promise((resolve,reject)=>{
            let status=order['payment-method']==='COD'?'placed':'pending'
            let orderObj={
                deliveryDetails:{
                    name:order.name,
                    address:order.address,
                    city:order.city,
                    country:order.country,
                    state:order.state,
                    pincode:order.pincode,
                    mobile:order.mobile    
                },

                userId:objectId(order.userId),
                paymentMethod:order['payment-method'],
                products:products,
                totalAmount:total,
                status:status,
                date:new Date()
            }
            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response)=>{
                // db.get().collection(collection.CART_COLLECTION).deleteOne({user:objectId(order.userId)})
                console.log("orderid=",response.insertedId);
                resolve(response.insertedId)
            })

        })


    },
    getCartProductList:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
            console.log(cart);
            resolve(cart.products)
        })
    },
    generateRazorpay:(orderId,total)=>{
        
        return new Promise((resolve,reject)=>{
            var options={
                amount:total*100,
                currency:"INR",
                receipt:""+orderId
            }
            instance.orders.create(options,function(err,order){
                resolve(order)           
            })

        })
    },
    verifyPayment:(details)=>{
        return new Promise((resolve,reject)=>{
            const crypto=require('crypto')
            let hmac=crypto.createHmac('sha256','a9e2BvPFdji9G6EBZjPX8AiU')
            hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]'])
            hmac=hmac.digest('hex')
            if(hmac==details['payment[razorpay_signature]']){
                resolve()
            }else{
                reject()
            }
        })
    },
    changePaymentStatus:(orderId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:objectId(orderId)},{
                $set:{
                    status:'placed'
                }
            }).then(()=>{
                resolve()
            })
        })
    }
}