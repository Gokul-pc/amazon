var db = require('../config/connection')
var collection = require('../config/collections')
const bcrypt = require('bcrypt')
var objectId = require('mongodb').ObjectId
const { ObjectId } = require('bson')
const { response } = require('express')
const { Db } = require('mongodb')



module.exports = {



    doLogin: (adminData) => {
        return new Promise(async (resolve, reject) => {
            let loginStatus = false
            let response = {}
            let admin = await db.get().collection(collection.ADMIN_COLLECTION).findOne({ email: adminData.email })
            console.log(admin);
            if (admin) {
                bcrypt.compare(adminData.password, admin.password).then((status) => {
                    if (status) {
                        console.log("success");
                        response.admin = admin
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
    }
}