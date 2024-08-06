const express = require('express');
const router = express.Router();
const HWC = require("../controllers/homeworkController");

const homeworkRouter = express.Router();


// 1 addHomework || getHomeworkList
const addHomeworkRouter = express.Router();
addHomeworkRouter.route("/").post(HWC.addHomework);
addHomeworkRouter.route('/List').get(HWC.getHomeworkList);
addHomeworkRouter.route('/Report').get(HWC.getHomeworkReportList);




homeworkRouter.use('/addHomework',addHomeworkRouter);

module.exports = homeworkRouter;




        










