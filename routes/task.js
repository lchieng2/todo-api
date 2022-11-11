module.exports = function (router) {

    const User = require("../models/user");
    const Task = require("../models/task");

    // users [GET POST]
    var tasksRoute = router.route('/tasks');

    tasksRoute.get(async (req, res) => {
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
                const count = await Task.find(_where, _select).sort(_sort).skip(_skip).limit(_limit).count();
                res.status(200).json({ message: "OK", data: count });
            } else {
                const users = await Task.find(_where, _select).sort(_sort).skip(_skip).limit(_limit);
                res.status(200).json({ message: "OK", data: users });
            }
        } catch (error) {
            res.status(500).json({ message: error.message, data: {} });
        }
    })



    tasksRoute.post(async (req, res) => {
        try {
            // no missing values validation
            if (req.body.name == undefined || req.body.deadline == undefined) {
                throw { message: "name and deadline must be defined" };
            }

            const task = new Task({
                name: req.body.name,
                description: req.body.description,
                deadline: req.body.deadline,
                completed: req.body.completed,
                assignedUser: req.body.assignedUser,
                assignedUserName: req.body.assignedUserName,
                dateCreated: new Date().toJSON().slice(0, 10)
            });

            task.save();
            res.status(201).json({ message: "OK", data: task });
        } catch (error) {
            res.status(500).json({ message: error.message, data: {} });
        }
    })


    // tasks/:id [GET PUT DELETE]
    var taskRoute = router.route('/tasks/:id');
    taskRoute.get(async (req, res) => {
        try {
            // query handling
            const { select } = req.query;
            var _select = {}
            if (select) _select = JSON.parse(select);

            where = { "_id": req.params.id };

            const task = await Task.findById(where, _select);
            res.status(200).json({ message: "OK", data: task });
        } catch (error) {
            res.status(404).json({ message: error.message, data: {} });
        }
    })

    taskRoute.put(async (req, res) => {
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

    taskRoute.delete(async (req, res) => {
        try {
            const id = req.params.id;
            const task = await Task.findByIdAndDelete(id);
            const user = await User.findOne({ "_id": task.assignedUser });

            var userTasks = user.pendingTasks;
            for (var i = 0; i < userTasks.length; i++) {
                if (userTasks[i] == task._id) {
                    userTasks.splice(i, 1);
                }
            }

            const newUser = {
                name: user.name,
                email: user.email,
                pendingTasks: userTasks,
                dateCreated: user.dateCreated
            };

            await User.findByIdAndUpdate(task.assignedUser, newUser, { new: true });

            res.status(200).json({ message: "OK", data: task });
        }
        catch (error) {
            res.status(404).json({ message: error.message, data: {} });
        }
    })

    return router;
}