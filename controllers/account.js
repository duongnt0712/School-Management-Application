var express = require("express")
var router = express.Router()
var multer = require("multer")
const sharp = require('sharp')
var md5 = require("md5")
var fs = require("fs").promises
var ObjectId = require("mongodb").ObjectID
var common = require("../common")
var upload = multer({ dest: 'uploads/' })

router.get("/account_list", function (req, res) {
	(async function() {		
		let tbtext = "";
		const result = await common.getDb().collection("users").find().toArray()
		let stt = 1
		result.forEach(function (user) {
			let role = user["role"] == "Admin" ? "Manager" : "Teacher"
			let regDate = new Date(user["register_time"])
			let strRegTime = regDate.getHours() + ":" + regDate.getMinutes() + ", "
							+ regDate.getDate() + "/" + (regDate.getMonth() + 1) + "/" + regDate.getFullYear()
			tbtext = tbtext + "<tr><th scope=\"row\">" + stt + "</th>"
					+ "<td>" + role + "</td>"
					+ "<td>" + user["username"] + "</td>"
					+ "<td>" + user["phone"] + "</td>"
					+ "<td>" + user["email"] + "</td>"
					+ "<td>" + strRegTime + "</td>"
					+ "<td><a href=\"/account_edit_" + user["_id"] + "\"><i data-feather=\"edit\" class=\"feather-icon\"></i></a></td>"
					+ "<td><a href=\"javascript:confirmDelete('" + user["_id"] + "')\"><i data-feather=\"trash-2\" class=\"feather-icon\"></i></a></td>"
				+ "</tr>"
			stt++
		})
		let parts = {tb: tbtext}
		res.parts = {...res.parts, ...parts}
		res.viewpath = './views/account_list.html'
		await common.render(res)
	})()
})

router.get("/account_create", function (req, res) {
	(async function() {
		let parts = {msg_style: "display:none;", usr_value: "", phone_value: "", avatar: "", email_value: "", usr_err: "Username must be from 4 - 32 characters", pwd_err: "Password must be 6 - 32 characters"}
		res.parts = {...res.parts, ...parts}
		res.viewpath = './views/account_create.html'
		await common.render(res)
	})()
})

router.post("/account_create", upload.single('avatar'), function (req, res) {
	(async function() {
		let success = true
		let parts = {msg_style: "display:none;",validate: "", usr_value: req.body.username, phone_value: req.body.phone, email_value: req.body.email, usr_err: "Username must be from 4 - 32 characters", pwd_err: "Password must be 6 - 32 characters"}
		var query = {"username": req.body.username}
		var send_html = true, result = null
		if (req.body.username.length < 4 || req.body.username.length > 32) {
			parts["validate"] = "is-invalid"
			parts["usr_err"] = "<span style='color:red'>Username length is not valid</span>"
			success = false
		} else {
			try {
				result = await common.getDb().collection("users").findOne(query)
			} catch (err) {
				console.log("error")
			}
			if (result != null) {
				parts["validate"] = "is-invalid"
				parts["usr_err"] = "<span style='color:red'>Sorry, that username's taken. Try another?</span>"
				success = false
			}
		}
		if (req.body.password.length < 6 || req.body.password.length > 32) {
			parts["validate"] = "is-invalid"
			parts["pwd_err"] = "<span style='color:red'>Password length is not valid</span>"
			success = false
		}

		if (req.file != undefined) {
			var filename = objUser["username"] + ".jpg"
			await sharp(req.file.path)
			.resize(100, 100)
			.jpeg({ quality: 100, progressive: true })
			.toFile('public/profile_pics/' + filename)
			fs.unlink(req.file.path)
			objUser["avatar"] = 'profile_pics/' + filename
		}

		if (success) {
			let salt = common.randStr(6)
			let dbhash = salt + md5(req.body.password + salt)			
			let usr_obj = {"role": "Teacher", "username": req.body.username, "phone": req.body.phone, "email": req.body.email, "password": dbhash, register_time: Date.now()}
			try {
				const result = await common.getDb().collection("users").insertOne(usr_obj)
				parts["msg_style"] = ""
			} catch (err) {
				console.log(err)
				res.send("500 error inserting to db")
				send_html = false
			}
		}
		
		if (send_html) {
			res.parts = {...res.parts, ...parts}
			res.viewpath = './views/account_create.html'
			await common.render(res)
		}
	})()
})

router.get("/account_edit_:userId", function (req, res) {
	(async function() {
		var oid = new ObjectId(req.params["userId"])
		var query = {"_id": oid}
		result = null
		try {
			result = await common.getDb().collection("users").findOne(query)
		} catch (err) {
			console.log("error")
		}
		if (result == null) {
			res.send("Account with id '" + req.params["userId"] + "' cannot be found!")
			return;
		}
		let parts = {msg_style: "display:none;", userId: req.params["userId"], usr_value: result["username"],phone_value: result["phone"], email_value: result["email"], usr_err: "Username must be from 4 - 32 characters", pwd_err: "Password must be 6 - 32 characters"}
		res.parts = {...res.parts, ...parts}
		res.viewpath = './views/account_edit.html'
		await common.render(res)
	})()
})

router.post("/account_edit_:userId", function (req, res) {
	(async function() {
		let success = true
		var oid = new ObjectId(req.params["userId"])
		var query = {"_id": oid}
		objUser = null
		try {
			objUser = await common.getDb().collection("users").findOne(query)
		} catch (err) {
			console.log("error")
		}
		if (objUser == null) {
			res.send("User with id '" + req.params["userId"] + "' cannot be found!")
			return;
		}

		let parts = {msg_style: "display:none;", userId: req.params["userId"], usr_value: req.body.username, phone_value:req.body.phone, email_value: req.body.email, usr_err: "Username must be from 4 - 32 characters", pwd_err: "Password must be 6 - 32 characters"}
		
		if (req.body.username.length < 4 || req.body.username.length > 32) {
			parts["usr_err"] = "<span style='color:red'>Username length is not valid</span>"
			success = false
		} else {
			var query = {"_id": {$ne: oid}, username: req.body.username}
			result = null
			try {
				result = await common.getDb().collection("users").findOne(query)
			} catch (err) {
				console.log("error")
			}
			if (result != null) {
				parts["usr_err"] = "<span style='color:red'>Username '" + req.body.username + "' has been used already</span>"
				success = false
			}
		}
		objUser["username"] = req.body.username
		objUser["phone"] = req.body.phone
		objUser["email"] = req.body.email
		objUser["register_time"] = Date.now()
		if (req.body["password"] != "") {
			if (req.body["password"].length < 6 || req.body["password"].length > 32) {
				parts["pwd_err"] = "<span style='color:red'>Password length is not valid</span>"
				success = false
			} else {
				let salt = common.randStr(6)
				let dbhash = salt + md5(req.body["password"] + salt)
				objUser["password"] = dbhash
			}
		}

		if (success) {
			var query = {"_id": oid}
			try {
				const result = await common.getDb().collection("users").updateOne(query, {$set: objUser})
				parts["msg_style"] = ""
			} catch (err) {
				console.log(err)
				res.send("500 error updating db")
				return;
			}
		}

		res.parts = {...res.parts, ...parts}
		res.viewpath = './views/account_edit.html'
		await common.render(res)
	})()
})

router.get("/account_delete_:userId", function (req, res) {
	(async function() {
		var oid = new ObjectId(req.params["userId"])
		var query = {"_id": oid}
		result = null
		try {
			result = await common.getDb().collection("users").deleteOne(query)
		} catch (err) {
			res.send("database error")
			return;
		}
		res.redirect(302, "/account_list")
	})()
})

module.exports = router