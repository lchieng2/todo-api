module.exports = function (router) {

    const User = require("../models/user");
    const Task = require("../models/task");

    // users [GET POST]
    var usersRoute = router.route('/users');

    usersRoute.get(async (req, res) => {
        try {
            // query handling
            const {where, sort, select, skip, limit, count} = req.query;
            var _where = {};
            var _select = {};
            var _sort = {};
            var _skip = null;
            var _limit = null;
            var _count = false;

            if (where) _where = JSON.parse(where);
            if (sort) _sort = JSON.parse(sort);
            if (select) _select = JSON.parse(select);
            if (skip) _skip = parseInt(skip);
            if (limit) _limit = parseInt(limit);
            if (count) _count = true;
           
            if (_count) {
                const count = await User.find(_where, _select).sort(_sort).skip(_skip).limit(_limit).count();
                res.status(200).json({ message: "OK", data: count });
            } else {
                const users = await User.find(_where, _select).sort(_sort).skip(_skip).limit(_limit);
                res.status(200).json({ message: "OK", data: users });
            }
        } catch (error) {
            res.status(500).json({ message: error, data: {} });
        }
    })

    usersRoute.post(async (req, res) => {
        try {
            // no missing values validation
            if (req.body.name == undefined || req.body.email == undefined) {
                throw { message: "name and email must be defined" };
            }

            // no multiple emails validation
            const numEmails = await User.find({ "email": req.body.email }).count();
            if (numEmails > 0) {
                throw { message: "email already exists" }
            }

            const user = new User({
                name: req.body.name,
                email: req.body.email,
                pendingTasks: req.body.pendingTasks,
                dateCreated: new Date().toJSON().slice(0, 10)
            });

            user.save();
            res.status(201).json({ message: "OK", data: user });
        } catch (error) {
            res.status(500).json({ message: error.message, data: {} });
        }
    })

    // users/:id [GET PUT DELETE]
    var userRoute = router.route('/users/:id');

    userRoute.get(async (req, res) => {
        try {
            // query handling
            const { select } = req.query;
            var _select = {}
            if (select) _select = JSON.parse(select);

            where = { "_id": req.params.id };

            const user = await User.findById(where, _select);
            res.status(200).json({ message: "OK", data: user });
        } catch (error) {
            res.status(404).json({ message: error.message, data: {} });
        }
    })

    userRoute.put(async (req, res) => {
        try {
            // no missing values validation
            if (req.body.name == undefined || req.body.email == undefined) {
                throw { message: "name and email must be defined" };
            }

            const id = req.params.id;
            const updatedData = req.body;

            const result = await User.findByIdAndUpdate(id, updatedData, { new: true });
            res.status(200).json({ message: "OK", data: result });
        } catch (error) {
            res.status(404).json({ message: error.message, data: {} });
        }
    })

    userRoute.delete(async (req, res) => {
        try {
            const id = req.params.id;
            const user = await User.findByIdAndDelete(id);

            // unassign user's pending tasks
            for (var i = 0; i < user.pendingTasks.length; i++) {
                const task = await Task.findOne({ "_id": user.pendingTasks[i] });

                const newTask = {
                    name: task.name,
                    description: task.description,
                    deadline: task.deadline,
                    completed: task.completed,
                    assignedUser: "",
                    assignedUserName: "unassigned",
                    dateCreated: task.dateCreated
                }

                await Task.findByIdAndUpdate(user.pendingTasks[i], newTask, { new: true });
            }

            res.status(200).json({ message: "OK", data: user });
        } catch (error) {
            res.status(404).json({ message: error.message, data: {} });
        }
    })

    return router;
}