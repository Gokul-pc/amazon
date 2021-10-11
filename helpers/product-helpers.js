var db = require('../config/connection')
var collection = require('../config/collections')


var objectId = require('mongodb').ObjectId
const { ObjectId } = require('bson')
const { response } = require('express')



module.exports = {
    addProduct: (product, callback) => {

        db.get().collection('product').insertOne(product).then((data) => {
            console.log(data);
            callback(data.insertedId)
        })
    },
    getAllProducts: () => {
        return new Promise(async(resolve, reject) => {
            let products = await db.get().collection(collection.PORDUCT_COLLECTION).find().toArray()
            resolve(products)
        })
    },
    deleteProduct: (prodId) => {
        return new Promise((resolve, reject) => {
            console.log(prodId);
            console.log(objectId(prodId));
            db.get().collection(collection.PORDUCT_COLLECTION).deleteOne({ _id: objectId(prodId) }).then((response) => {
                // console.log(response);
                resolve(response)
            })
        })
    },
    getProductDetails: (proId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PORDUCT_COLLECTION).findOne({ _id: ObjectId(proId) }).then((product) => {
                resolve(product)

            })
        })
    },
    updateProduct: (proId, proDetails) => {

        return new Promise((resolve, reject) => {
            db.get().collection(collection.PORDUCT_COLLECTION).updateOne({ _id: ObjectId(proId) }, {
                $set: {
                    name: proDetails.name,
                    catogery: proDetails.catogery,
                    description: proDetails.description,
                    price: proDetails.price

                }
            }).then((response) => {
                resolve()
            })



        })
    }

}