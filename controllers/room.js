var express = require("express")
var router = express.Router()
var ObjectId = require("mongodb").ObjectID
var common = require("../common")

router.get("/room_list", function (req, res) {
	(async function() {		
		let tbtext = "";
		const result = await common.getDb().collection("rooms").find().toArray()
		let stt = 1
		result.forEach(function (room) {
			tbtext = tbtext + "<tr><th scope=\"row\">" + stt + "</th>"
					+ "<td>" + room["name"] + "</td>"
					+ "<td>" + room["building"] + "</td>"
					+ "<td><a href=\"/room_edit_" + room["_id"] + "\"><i data-feather=\"edit\" class=\"feather-icon\"></i></a></td>"
					+ "<td><a href=\"javascript:confirmDelete('" + room["_id"] + "')\"><i data-feather=\"trash-2\" class=\"feather-icon\"></i></a></td>"
				+ "</tr>"
			stt++
		})
		let parts = {tb: tbtext}
		res.parts = {...res.parts, ...parts}
		res.viewpath = './views/room_list.html'
		await common.render(res)
	})()
})

router.get("/room_create", function (req, res) {
	(async function() {
		let parts = {msg_style: "display:none;", rname_value: "", building_value: "", rname_err: "Username must be longer than 4 characters", pwd_err: "Password must be 6 - 32 characters"}
		res.parts = {...res.parts, ...parts}
		res.viewpath = './views/room_create.html'
		await common.render(res)
	})()
})

router.post("/room_create", function (req, res) {
	(async function() {
		let success = true
		let parts = {msg_style: "display:none;", rname_value: "", building_value: "", rname_err: ""}
		var query = {"name": req.body.rname}
		var send_html = true, result = null
		if (req.body.rname.length < 4) {
			parts["validate"] = "is-invalid"
			parts["rname_err"] = "<span style='color:red'>Room name length is not valid</span>"
			success = false
		} else {
			try {
				result = await common.getDb().collection("rooms").findOne(query)
			} catch (err) {
				console.log("error")
			}
			if (result != null) {
				parts["usr_err"] = "<span style='color:red'>Room name already exists</span>"
				success = false
			}
		}

		if (success) {
			let room_obj = {"name": req.body.rname, "building": req.body.building}
			try {
				const result = await common.getDb().collection("users").insertOne(room_obj)
				parts["msg_style"] = ""
			} catch (err) {
				console.log(err)
				res.send("500 error inserting to db")
				send_html = false
			}
		}
		if (send_html) {
			res.parts = {...res.parts, ...parts}
			res.viewpath = './views/room_create.html'
			await common.render(res)
		}
	})()
})

router.get("/room_edit_:roomId", function (req, res) {
	(async function() {
		var oid = new ObjectId(req.params["roomId"])
		var query = {"_id": oid}
		result = null
		try {
			result = await common.getDb().collection("rooms").findOne(query)
		} catch (err) {
			console.log("error")
		}
		if (result == null) {
			res.send("User with id '" + req.params["roomId"] + "' cannot be found!")
			return;
		}
		let parts = {msg_style: "display:none;", roomId: req.params["roomId"], name_value: result["name"], building_value: result["building"], pwd_err: "Password must be 6 - 32 characters"}
		res.parts = {...res.parts, ...parts}
		res.viewpath = './views/room_edit.html'
		await common.render(res)
	})()
})

router.post("/room_edit_:roomId", function (req, res) {
	(async function() {
		let success = true
		var oid = new ObjectId(req.params["roomId"])
		var query = {"_id": oid}
		objRoom = null
		try {
			objRoom = await common.getDb().collection("rooms").findOne(query)
		} catch (err) {
			console.log("error")
		}
		if (objRoom == null) {
			res.send("Room with id '" + req.params["roomId"] + "' cannot be found!")
			return;
		}

		let parts = {msg_style: "display:none;", roomId: req.params["roomId"], name_value: req.body.name, building_value: req.body.building, name_err: "Room name must be longer than 4 characters"}
		
		if (req.body.name.length < 4) {
			parts["validate"] = "is-invalid"
			parts["name_err"] = "<span style='color:red'>Room name length is not valid</span>"
			success = false
		} else {
			var query = {"_id": {$ne: oid}, name: req.body.name}
			result = null
			try {
				result = await common.getDb().collection("rooms").findOne(query)
			} catch (err) {
				console.log("error")
			}
			if (result != null) {
				parts["name_err"] = "<span style='color:red'>Room name '" + req.body.name + "' has been inserted already</span>"
				success = false
			}
		}
		objRoom["name"] = req.body.name
		objRoom["building"] = req.body.building

		if (success) {
			var query = {"_id": oid}
			try {
				const result = await common.getDb().collection("rooms").updateOne(query, {$set: objRoom})
				parts["msg_style"] = ""
			} catch (err) {
				console.log(err)
				res.send("500 error updating db")
				return;
			}
		}

		res.parts = {...res.parts, ...parts}
		res.viewpath = './views/room_edit.html'
		await common.render(res)
	})()
})

router.get("/room_delete_:roomId", function (req, res) {
	(async function() {
		var oid = new ObjectId(req.params["roomId"])
		var query = {"_id": oid}
		result = null
		try {
			result = await common.getDb().collection("rooms").deleteOne(query)
		} catch (err) {
			res.send("database error")
			return;
		}
		res.redirect(302, "/room_list")
	})()
})

module.exports = router