const mongoose = require("mongoose");

const schema = new mongoose.Schema({}, { timestamps: true });

const AcademicYear = mongoose.model("academic_years", schema);
module.exports = AcademicYear;
