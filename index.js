var express = require("express")
var bodyParser = require("body-parser")
var cookieParser = require('cookie-parser')
var app = express()
var ObjectId = require("mongodb").ObjectID
var common = require("./common")
var authController = require("./controllers/authentication")
var accountController = require("./controllers/account")
var classController = require("./controllers/class")
var roomController = require("./controllers/room")
var scheduleController = require("./controllers/schedule")

app.use(bodyParser.urlencoded({ extended: false })) // enable req.body
app.use(express.static('public'))
app.use(cookieParser())
// custom middleware
app.use(function (req, res, next) {
	(async function() {
		if (req.url != '/signin') {
			res.parts = {avatar: "images/admin.jpg"}
			var uid = req.cookies['login']
			if (uid != undefined) {
				var oid = new ObjectId(uid)
				var query = {"_id": oid}
				objUser = null
				try {
					objUser = await common.getDb().collection("users").findOne(query)
				} catch (err) {
					console.log("index.js: error")
				}
				if (objUser != null) {
					req.user = objUser
					if (objUser["avatar"] != undefined) {
						res.parts["avatar"] = objUser["avatar"]
					}
				} else {
					res.redirect(302, "/signin")
					return
				}
			} else {
				res.redirect(302, "/signin")
				return
			}
		}
		next()
	})()
})

app.use(authController)
app.use(accountController)
app.use(classController)
app.use(roomController)
app.use(scheduleController)

app.get("/", function (req, res) {
	res.redirect(302, "/signin")
})

app.get("/admin", function (req, res) {
	res.redirect(302, "/homepage")
})

app.get("/teacher", function (req, res) {
	res.redirect(302, "/schedule")
})

var server = app.listen(80)
