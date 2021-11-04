var express = require("express")
var router = express.Router()
var ObjectId = require("mongodb").ObjectID
var common = require("../common")

//TEACHER
router.get("/schedule", function (req, res) {
	(async function() {	
		var uid = req.cookies["login"]
		var oid = new ObjectId(uid)
		var query = {"_id": oid}
		let tbtext = "";
		const objUser = await common.getDb().collection("users").findOne(query)
		let id = 1
		var q = {teacher: objUser["username"]}
		const result = await common.getDb().collection("schedules").find(q).toArray()
		result.forEach(function (schedule) {
			tbtext = tbtext + "<tr><th scope=\"row\">" + id + "</th>"
					+ "<td>" + schedule["teacher"] + "</td>"
					+ "<td>" + schedule["class"] + "</td>"
					+ "<td>" + schedule["room"] + "</td>"
					+ "<td>" + schedule["time"] + "</td>"
					+ "<td>" + schedule["date"] + "</td>"
					+ "<td>" + schedule["status"] + "</td>"
				+ "</tr>"
			id++
		})
		let parts = {tb: tbtext}
		res.parts = {...res.parts, ...parts}
		res.viewpath = './views/teacher_schedule.html'
		await common.render(res)
	})()
})

//ADMIN
router.get("/schedule_list", function (req, res) {
	(async function() {		
		let tbtext = "";
		const result = await common.getDb().collection("schedules").find().toArray()
		let stt = 1
		result.forEach(function (schedule) {
			tbtext = tbtext + "<tr><th scope=\"row\">" + stt + "</th>"
					+ "<td>" + schedule["teacher"] + "</td>"
					+ "<td>" + schedule["class"] + "</td>"
					+ "<td>" + schedule["room"] + "</td>"
					+ "<td>" + schedule["time"] + "</td>"
					+ "<td>" + schedule["date"] + "</td>"
					+ "<td>" + schedule["status"] + "</td>"
					+ "<td><a href=\"/schedule_edit_" + schedule["_id"] + "\"><i data-feather=\"edit\" class=\"feather-icon\"></i></a></td>"
					+ "<td><a href=\"javascript:confirmDelete('" + schedule["_id"] + "')\"><i data-feather=\"trash-2\" class=\"feather-icon\"></i></a></td>"
				+ "</tr>"
			stt++
		})
		let parts = {tb: tbtext}
		res.parts = {...res.parts, ...parts}
		res.viewpath = './views/schedule_list.html'
		await common.render(res)
	})()
})

router.get("/schedule_create", function (req, res) {
	(async function() {
		let parts = {msg_style: "display:none;", teacher_value: "", class_value: "", room_value: "", time_value: "", date_value: "", status_value: "", usr_err: "Teacher name must be from 4 - 32 characters", pwd_err: "Password must be 6 - 32 characters"}
		res.parts = {...res.parts, ...parts}
		res.viewpath = './views/schedule_create.html'
		await common.render(res)
	})()
})

router.post("/schedule_create", function (req, res) {
	(async function() {
		let success = true
		let parts = {msg_style: "display:none;", teacher_value: req.body.teacher, class_value: req.body.class, room_value: req.body.room, time_value: req.body.time, date_value: req.body.date, status_value: req.body.status, usr_err: "Username must be from 4 - 32 characters", time_err: ""}
		var query = {"teacher": req.body.teacher}
		var send_html = true, result = null
		if (req.body.teacher.length < 4 || req.body.teacher.length > 32) {
			parts["validate"] = "is-invalid"
			parts["teacher_err"] = "<span style='color:red'>Teacher name length is not valid</span>"
			success = false
		} else {
			try {
				result = await common.getDb().collection("schedules").findOne(query)
			} catch (err) {
				console.log("error")
			}
			
			if (result["time"] == req.body.time) {
				parts["validate"] = "is-invalid"
				parts["time_err"] = "<span style='color:red'>Teacher already has schedule in this time</span>"
				success = false
			}
		}
		if (success) {
			let room_obj = {"teacher": req.body.teacher, "class": req.body.class, "room": req.body.room, "time": req.body.time, "date": req.body.date, "status": req.body.status}
			try {
				const result = await common.getDb().collection("schedules").insertOne(room_obj)
				parts["msg_style"] = ""
			} catch (err) {
				console.log(err)
				res.send("500 error inserting to db")
				send_html = false
			}
		}
		if (send_html) {
			res.parts = {...res.parts, ...parts}
			res.viewpath = './views/schedule_create.html'
			await common.render(res)
		}
	})()
})

router.get("/schedule_edit_:scheduleId", function (req, res) {
	(async function() {
		var oid = new ObjectId(req.params["scheduleId"])
		var query = {"_id": oid}
		result = null
		try {
			result = await common.getDb().collection("schedules").findOne(query)
		} catch (err) {
			console.log("error")
		}
		if (result == null) {
			res.send("User with id '" + req.params["scheduleId"] + "' cannot be found!")
			return;
		}
		let parts = {msg_style: "display:none;", scheduleId: req.params["scheduleId"], teacher_value: result["teacher"], class_value: result["class"], room_value: result["room"], time_value: result["time"], date_value: result["date"], status_value: result["status"], teacher_err: "Username must be from 4 - 32 characters", pwd_err: "Password must be 6 - 32 characters"}
		res.parts = {...res.parts, ...parts}
		res.viewpath = './views/schedule_edit.html'
		await common.render(res)
	})()
})

router.post("/schedule_edit_:scheduleId", function (req, res) {
	(async function() {
		let success = true
		var oid = new ObjectId(req.params["scheduleId"])
		var query = {"_id": oid}
		objUser = null
		try {
			objUser = await common.getDb().collection("schedules").findOne(query)
		} catch (err) {
			console.log("error")
		}
		if (objUser == null) {
			res.send("User with id '" + req.params["scheduleId"] + "' cannot be found!")
			return;
		}

		let parts = {msg_style: "display:none;", scheduleId: req.params["scheduleId"], teacher_value: req.body.teacher, class_value: req.body.class, room_value: req.body.room, time_value: req.body.time, date_value: req.body.date, status_value: req.body.status, teacher_err: "Username must be from 4 - 32 characters", pwd_err: "Password must be 6 - 32 characters"}
		
		if (req.body.teacher.length < 4 || req.body.teacher.length > 32) {
			parts["teacher_err"] = "<span style='color:red'>Teacher name length is not valid</span>"
			success = false
		} else {
			var query = {"_id": {$ne: oid}, teacher: req.body.teacher}
			result = null
			try {
				result = await common.getDb().collection("schedules").findOne(query)
			} catch (err) {
				console.log("error")
			}
			if (result != null) {
				parts["usr_err"] = "<span style='color:red'>Teacher '" + req.body.teacher + "' has another schedule already</span>"
				success = false
			}
		}
		objUser["teacher"] = req.body.teacher
		objUser["class"] = req.body.class
		objUser["room"] = req.body.room
		objUser["time"] = req.body.time
		objUser["date"] = req.body.date
		objUser["status"] = req.body.status
		if (success) {
			var query = {"_id": oid}
			try {
				const result = await common.getDb().collection("schedules").updateOne(query, {$set: objUser})
				parts["msg_style"] = ""
			} catch (err) {
				console.log(err)
				res.send("500 error updating db")
				return;
			}
		}

		res.parts = {...res.parts, ...parts}
		res.viewpath = './views/schedule_edit.html'
		await common.render(res)
	})()
})

router.get("/schedule_delete_:scheduleId", function (req, res) {
	(async function() {
		var oid = new ObjectId(req.params["scheduleId"])
		var query = {"_id": oid}
		result = null
		try {
			result = await common.getDb().collection("schedules").deleteOne(query)
		} catch (err) {
			res.send("database error")
			return;
		}
		res.redirect(302, "/schedule_list")
	})()
})

module.exports = router