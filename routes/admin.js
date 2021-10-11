const { log } = require('debug');
var express = require('express');
const productHelpers = require('../helpers/product-helpers');
const adminHelpers = require('../helpers/admin-helpers')
var router = express.Router();
const bp = require('body-parser');
const { response, Router } = require('express');

const veryfyLogin = (req, res, next) => {
  if (req.session.adminLoggedIn) {
      next()
  } else {
      res.redirect('/admin')
  }
}

/* GET home page. */
router.get('/', async function(req, res ) {
  let admin = req.session.admin
  console.log(admin);
  if(req.session.admin){
    productHelpers.getAllProducts().then((products) => {
     res.render('admin/dashboard', {layout:'admin-layout', products,admin })
    })
     }
     else{
    res.render('admin/adminlogin')
  }
})

router.post('/login', (req, res) => {
  adminHelpers.doLogin(req.body).then((response) => {
      if (response.status) {
          req.session.admin = response.admin
          req.session.adminLoggedIn = true
          productHelpers.getAllProducts().then((products) => {
          res.redirect('/admin')
          })
      } else {
          req.session.adminLoginErr = "Invalid username or Password"
          res.redirect('/admin')
      }
  })
})

router.get('/logout', (req, res) => {
  req.session.admin=null
  res.redirect('/admin')
})



router.get("/view-products",veryfyLogin,(req,res)=>{
  productHelpers.getAllProducts().then((products) => {

    
  res.render("admin/view-products", {layout:'admin-layout',products,admin:true})
  })
})







router.get('/add-product',veryfyLogin,function (req, res) {
  res.render('admin/add-product',{layout:'admin-layout',admin:true})
})
router.post('/add-product',veryfyLogin,(req, res) => {



  productHelpers.addProduct(req.body, (insertedId) => {




    let image = req.files.Image
    image.mv('./public/product-images/' + insertedId + '.png', (err, done) => {
      if (!err) {
        res.redirect("/admin/view-products")
      } else {
        console.log(err);
      }
    })

  })


})
router.get('/delete-product/:id',veryfyLogin,(req,res)=>{
  let proId=req.params.id
  console.log(proId);
  productHelpers.deleteProduct(proId).then((response)=>{
    res.redirect('/admin/view-products')
  })

})
router.get('/edit-product/:id',veryfyLogin,async(req,res)=>{
  let product=await productHelpers.getProductDetails(req.params.id)
  console.log(product);
  res.render('admin/edit-product',{layout:'admin-layout',admin:true,product})
})
router.post('/edit-product/:id',veryfyLogin,(req,res)=>{
  console.log(req.params.id);
  let id=req.params.id
  productHelpers.updateProduct(req.params.id,req.body).then(()=>{
    res.redirect('/admin')
    if(req.files.Image){
      let image = req.files.Image
    image.mv('./public/product-images/' + id + '.png')
    

    }
  })
})

module.exports = router;
