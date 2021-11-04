var express = require("express")
var router = express.Router()
var ObjectId = require("mongodb").ObjectID
var common = require("../common")

router.get("/class_list", function (req, res) {
	(async function() {		
		let tbtext = "";
		const result = await common.getDb().collection("classes").find().toArray()
		let stt = 1
		result.forEach(function (classes) {
			tbtext = tbtext + "<tr><th scope=\"row\">" + stt + "</th>"
					+ "<td>" + classes["name"] + "</td>"
					+ "<td>" + classes["major"] + "</td>"
					+ "<td>" + classes["year"] + "</td>"
					+ "<td>" + classes["no_student"] + "</td>"
					+ "<td><a href=\"/class_edit_" + classes["_id"] + "\"><i data-feather=\"edit\" class=\"feather-icon\"></i></a></td>"
					+ "<td><a href=\"javascript:confirmDelete('" + classes["_id"] + "')\"><i data-feather=\"trash-2\" class=\"feather-icon\"></i></a></td>"
				+ "</tr>"
			stt++
		})
		let parts = {tb: tbtext}
		res.parts = {...res.parts, ...parts}
		res.viewpath = './views/class_list.html'
		await common.render(res)
	})()
})

router.get("/class_create", function (req, res) {
	(async function() {
		let parts = {msg_style: "display:none;", validate: "", name_value: "", major_value:"", year_value:"", no_student_value: "", name_err: "Class name must be longer than 3 characters"}
		res.parts = {...res.parts, ...parts}
		res.viewpath = './views/class_create.html'
		await common.render(res)
	})()
})

router.post("/class_create", function (req, res) {
	(async function() {
		let success = true
		let parts = {msg_style: "display:none;", name_value: req.body.name, major_value: req.body.major, year_value: req.body.year, no_student_value: req.body.no_student, name_err: "Class name must be longer than 3 characters"}
		var query = {"name": req.body.name}
		var send_html = true, result = null
		if (req.body.name.length < 3) {
			parts["validate"] = "is-invalid"
			parts["name_err"] = "<span style='color:red'>Class name length is not valid</span>"
			success = false
		} else {
			try {
				result = await common.getDb().collection("classes").findOne(query)
			} catch (err) {
				console.log("error")
			}
			if (result["year"] == req.body.year) {
				parts["validate"] = "is-invalid"
				parts["year_err"] = "<span style='color:red'>That class has already added. Try another?</span>"
				success = false
			}
		}
		if (req.body.major.length < 4 || req.body.major.length > 50) {
			parts["validate"] = "is-invalid"
			parts["major_err"] = "<span style='color:red'>Major length is invalid</span>"
			success = false
		}
		if (success) {
			let class_obj = {"name": req.body.name, "major": req.body.major, "year": req.body.year, "no_student": req.body.no_student}
			try {
				const result = await common.getDb().collection("classes").insertOne(class_obj)
				parts["msg_style"] = ""
			} catch (err) {
				console.log(err)
				res.send("500 error inserting to db")
				send_html = false
			}
		}
		if (send_html) {
			res.parts = {...res.parts, ...parts}
			res.viewpath = './views/class_create.html'
			await common.render(res)
		}
	})()
})

router.get("/class_edit_:classesId", function (req, res) {
	(async function() {
		var oid = new ObjectId(req.params["classesId"])
		var query = {"_id": oid}
		result = null
		try {
			result = await common.getDb().collection("classes").findOne(query)
		} catch (err) {
			console.log("error")
		}
		if (result == null) {
			res.send("Class with id '" + req.params["classesId"] + "' cannot be found!")
			return;
		}
		let parts = {msg_style: "display:none;", classesId: req.params["classesId"], cname_value: result["name"], major_value: result["major"], year_value: result["year"], no_student_value: result["no_student"], name_err: "Username must be from 4 - 32 characters"}
		res.parts = {...res.parts, ...parts}
		res.viewpath = './views/class_edit.html'
		await common.render(res)
	})()
})

router.post("/class_edit_:classesId", function (req, res) {
	(async function() {
		let success = true
		var oid = new ObjectId(req.params["classesId"])
		var query = {"_id": oid}
		objClass = null
		try {
			objClass = await common.getDb().collection("classes").findOne(query)
		} catch (err) {
			console.log("error")
		}
		if (objClass == null) {
			res.send("Class with id '" + req.params["classesId"] + "' cannot be found!")
			return;
		}

		let parts = {msg_style: "display:none;", classesId: req.params["classesId"], cname_value: req.body.cname, major_value: req.body.major, year_value: req.body.year, no_student_value: req.body.no_student, name_err: "Username must be from 4 - 32 characters"}

		if (req.body.cname.length < 4) {
			parts["name_err"] = "<span style='color:red'>Class name length is not valid</span>"
			success = false
		} else {
			var query = {"_id": {$ne: oid}, name: req.body.cname}
			result = null
			try {
				result = await common.getDb().collection("classes").findOne(query)
			} catch (err) {
				console.log("error")
			}
			if (result != null) {
				parts["name_err"] = "<span style='color:red'>Class name '" + req.body.cname + "' has been used already</span>"
				success = false
			}
		}
		objClass["name"] = req.body.cname
		objClass["major"] = req.body.major
		objClass["year"] = req.body.year
		objClass["no_student"] = req.body.no_student

		if (success) {
			var query = {"_id": oid}
			try {
				const result = await common.getDb().collection("classes").updateOne(query, {$set: objClass})
				parts["msg_style"] = ""
			} catch (err) {
				console.log(err)
				res.send("500 error updating db")
				return;
			}
		}

		res.parts = {...res.parts, ...parts}
		res.viewpath = './views/class_edit.html'
		await common.render(res)
	})()
})

router.get("/class_delete_:classesId", function (req, res) {
	(async function() {
		var oid = new ObjectId(req.params["classesId"])
		var query = {"_id": oid}
		result = null
		try {
			result = await common.getDb().collection("classes").deleteOne(query)
		} catch (err) {
			res.send("database error")
			return;
		}
		res.redirect(302, "/class_list")
	})()
})

module.exports = router