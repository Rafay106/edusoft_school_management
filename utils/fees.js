const assert = require("node:assert");
const C = require("../constants");
const UC = require("../utils/common");
const FeeConcession = require("../models/fees/feeConcessionModel");
const FeeFine = require("../models/fees/feeFineModel");
const FeeStructure = require("../models/fees/feeStructureModel");
const Student = require("../models/studentInfo/studentModel");
const FeePaid = require("../models/fees/feePaidModel");
const FeeTerm = require("../models/fees/feeTermModel");
const BusAssignment = require("../models/transport/busAssignModel");
const BusStop = require("../models/transport/busStopModel");
const FeeType = require("../models/fees/feeTypeModel");
const { constants } = require("node:http2");
const StudentWaiver = require("../models/fees/studentWaiverModel");
const StudentFine = require("../models/fees/studentFineModel");
const { DOMAIN } = process.env;

// new

const getFormatedStudent = async (admission_no, academic_year) => {
  assert(admission_no !== undefined, "admission_no missing!");
  assert(academic_year !== undefined, "academic_year missing!");

  const student = await Student.findOne({ admission_no, academic_year })
    .select(
      "admission_no roll_no name gender house doa student_status phone father_details mother_details dob address"
    )
    .populate({
      path: "class section stream boarding_type sub_ward bus_pick bus_drop bus_stop",
      select: "name",
    })
    .lean();

  if (!student) throwError(C.getResourse404Id("Student", admission_no));

  student.class_title = UC.getStudentClassSectionTitle(student);

  student.doa = UC.formatDate(student.doa);
  student.dob = UC.formatDate(student.dob);

  if (student.photo) {
    student.photo = `${DOMAIN}/uploads/student/${student.photo}`;
  }

  return student;
};

const calcBusTermAmount = (busAssignList, startMonth, endMonth) => {
  let amount = 0;

  for (let i = 0; i < busAssignList.length; i++) {
    const assign = busAssignList[i];
    if (assign.status !== C.ASSIGNED) continue;

    const assignMonth = assign.month.getUTCMonth() + 1;

    if (assignMonth >= startMonth && assignMonth < endMonth) {
      amount += assign.bus_stop.monthly_charges;
    }
  }

  return amount;
};

const getStudentBusFees = async (student, ayear) => {
  assert(student !== undefined, "student missing!");
  assert(ayear !== undefined, "ayear missing!");

  const stuBusAssign = await BusAssignment.findOne({
    student: student._id,
    academic_year: ayear,
  })
    .populate("list.bus_stop", "monthly_charges")
    .lean();

  if (!stuBusAssign) return false;

  let busFeeType = await FeeType.findOne({ name: C.BUS_FEE })
    .select("name")
    .lean();

  if (!busFeeType) {
    busFeeType = await FeeType.create({
      name: C.BUS_FEE,
      description: "Bus Fees",
      academic_year: ayear,
    });

    busFeeType = { _id: busFeeType._id, name: busFeeType.name };
  }

  const terms = await FeeTerm.find({ academic_year: ayear })
    .sort("year start_month")
    .lean();

  const busFees = [];

  for (const term of terms) {
    const startMonth = term.start_month;

    if (term.term_type === "m") {
      const endMonth = startMonth + 1;

      busFees.push({
        fee_term: { _id: term._id, name: term.name },
        fee_type: busFeeType,
        amount: calcBusTermAmount(stuBusAssign.list, startMonth, endMonth),
      });
    } else if (term.term_type === "bm") {
      const endMonth = startMonth + 2;

      busFees.push({
        fee_term: { _id: term._id, name: term.name },
        fee_type: busFeeType,
        amount: calcBusTermAmount(stuBusAssign.list, startMonth, endMonth),
      });
    } else if (term.term_type === "q") {
      const endMonth = startMonth + 3;

      busFees.push({
        fee_term: { _id: term._id, name: term.name },
        fee_type: busFeeType,
        amount: calcBusTermAmount(stuBusAssign.list, startMonth, endMonth),
      });
    } else if (term.term_type === "hy") {
      const endMonth = startMonth + 6;

      busFees.push({
        fee_term: { _id: term._id, name: term.name },
        fee_type: busFeeType,
        amount: calcBusTermAmount(stuBusAssign.list, startMonth, endMonth),
      });
    } else if (term.term_type === "y") {
      const endMonth = startMonth + 12;

      busFees.push({
        fee_term: { _id: term._id, name: term.name },
        fee_type: busFeeType,
        amount: calcBusTermAmount(stuBusAssign.list, startMonth, endMonth),
      });
    }
  }

  return busFees;
};

const calcFeesTotalAmount = (
  oneTimeFees = [],
  termFees = [],
  partialFees = []
) => {
  let totalAmount = 0;
  let totalFine = 0;
  let totalConcession = 0;
  let totalDue = 0;

  totalAmount += oneTimeFees.reduce((acc, ele) => acc + ele.amount, 0);
  totalDue += totalAmount;

  termFees.forEach((tf) => {
    totalAmount += tf.term_amount;
    totalFine += tf.term_fine;
    totalConcession += tf.term_concession;
    totalDue += tf.term_due;
  });

  partialFees.forEach((tf) => {
    totalAmount += tf.term_amount;
    totalFine += tf.term_fine;
    totalConcession += tf.term_concession;
    totalDue += tf.term_due;
  });

  return {
    totalAmount: Math.round(totalAmount),
    totalFine: Math.round(totalFine),
    totalConcession: Math.round(totalConcession),
    totalDue: Math.round(totalDue),
  };
};

const calcFeeConcessionForFeeType = (feeConcessions, feeTermId, feeTypeObj) => {
  let amount = 0;

  const feeCon = feeConcessions.find((ele) => ele.fee_term.equals(feeTermId));

  if (!feeCon) return amount;

  const ftCon = feeCon.fee_types.find((ele) =>
    ele.fee_type.equals(feeTypeObj.fee_type._id)
  );

  if (ftCon) {
    if (ftCon.is_percentage) {
      amount = feeTypeObj.amount * (ftCon.amount / 100);
    } else amount = ftCon.amount;
  }

  return amount;
};

const calcStudentWaiverForFeeType = (studentWaivers, feeTermId, feeTypeId) => {
  let amount = 0;

  if (!studentWaivers.length) return amount;

  const waiver = studentWaivers.find((ele) => ele.fee_term.equals(feeTermId));

  if (!waiver) return amount;

  const waiverFeeType = waiver.fee_types.find((ele) =>
    ele.fee_type.equals(feeTypeId)
  );

  if (!waiverFeeType) return amount;

  amount = waiverFeeType.amount;

  return amount;
};

const calcFeeFineForFeeTerm = (fine, term) => {
  assert(term !== undefined, "term missing!");

  let amount = 0;
  let msg = "";

  if (!fine) return { amount, msg };

  const now = new Date();

  const year = term.year;
  const month = String(term.start_month).padStart(2, "0");
  const day = String(term.late_fee_days + 1).padStart(2, "0");
  const termDate = new Date(`${year}-${month}-${day}T00:00:00Z`);

  if (now < termDate) return { amount, msg };

  if (fine.type === C.FIXED) {
    amount = fine.amount;
    msg = `Late Fee Fine (Fixed) - ${fine.amount}`;
  } else if (fine.type === C.DAILY) {
    const totalDays = Math.ceil(
      (now.getTime() - termDate.getTime()) / 86400000
    );

    amount = totalDays * fine.amount;
    msg = `Late Fee Fine (Daily) - Amount ${fine.amount} | Days: ${totalDays}`;
  } else if (fine.type === C.WEEKLY) {
    const totalDays = (now.getTime() - termDate.getTime()) / 86400000;

    const totalWeeks = Math.ceil(totalDays / 7);

    amount = totalWeeks * fine.amount;
    msg = `Late Fee Fine (Weekly) - Amount: ${fine.amount} | Weeks: ${totalWeeks}`;
  } else if (fine.type === C.MONTHLY) {
    const totalMonths = UC.getMonthsBetweenDates(termDate, now);

    amount = totalMonths * fine.amount;
    msg = `Late Fee Fine (Monthly) - Amount: ${fine.amount} | Months: ${totalMonths}`;
  } else if (fine.type === C.CUSTOM) {
    for (const item of fine.custom) {
      if (now >= item.from && now <= item.to) {
        amount += item.amount;
        break;
      }

      if (now > item.to) amount += item.amount;
    }

    msg = `Late Fee Fine (Custom): ${amount}`;
  }

  return { amount, msg };
};

const calcStudentFineForFeeTerm = (studentFines, feeTermId) => {
  let amount = 0;

  if (!studentFines.length) return amount;

  const fine = studentFines.find((ele) => ele.fee_term.equals(feeTermId));

  if (!fine) return amount;

  amount = fine.amount;

  return amount;
};

/**
 *
 * @param {String} admNo
 * @param {ObjectId} ayear
 * @returns Complete due fees of a student
 */
const calcStudentFees = async (admNo, ayear) => {
  const student = await getFormatedStudent(admNo, ayear);

  const feeStructure = await FeeStructure.findOne({
    class: student.class._id,
    boarding_type: student.boarding_type._id,
    academic_year: ayear,
  })
    .populate("one_time_fees.fee_type", "name")
    .populate("term_fees.fee_type", "name")
    .populate("partial_fees.fee_type", "name")
    .lean();

  if (!feeStructure) {
    const className = student.class.name;
    const boardingName = student.boarding_type.name;
    throwError(
      `FeeStructure not found for class: ${className} and boarding_type: ${boardingName}`
    );
  }

  const busFees = await getStudentBusFees(student, ayear);

  const feeTerms = await FeeTerm.find({ academic_year: ayear })
    .sort("year start_month")
    .lean();

  const feeTermIds = feeTerms.map((ele) => ele._id);

  const feeConcessions = await FeeConcession.find({
    student: student._id,
    fee_term: feeTermIds,
    academic_year: ayear,
  }).lean();

  const studentWaivers = await StudentWaiver.find({
    student: student._id,
    fee_term: feeTermIds,
    academic_year: ayear,
  }).lean();

  const feeFineGlobal = await FeeFine.findOne({
    boarding_type: student.boarding_type._id,
    academic_year: ayear,
  }).lean();

  const studentFines = await StudentFine.find({
    student: student._id,
    fee_term: feeTermIds,
    academic_year: ayear,
  }).lean();

  const oneTimeFeeTotal = calcFeesTotalAmount(
    feeStructure.one_time_fees
  ).totalAmount;

  let academicTotal = oneTimeFeeTotal;
  let academicConcession = 0;
  let academicFine = 0;
  let academicDue = oneTimeFeeTotal;

  // Generate Term Fees
  const termFees = [];
  for (const ft of feeTerms) {
    const termFee = { fee_term: ft, fee_types: [...feeStructure.term_fees] };

    // Add bus fees into fee_types
    if (busFees) {
      const busTermFee = busFees.find((ele) => ele.fee_term._id.equals(ft._id));

      if (busTermFee) {
        termFee.fee_types.push({
          fee_type: busTermFee.fee_type,
          amount: busTermFee.amount,
        });
      }
    }

    let termAmount = 0;
    let termConcession = 0;
    const feeFine = calcFeeFineForFeeTerm(feeFineGlobal, ft);
    const studentFine = calcStudentFineForFeeTerm(studentFines, ft._id);
    const termFine = feeFine.amount + studentFine;

    // Fee Concessions for term_fees
    for (const feeType of termFee.fee_types) {
      feeType.concession = calcFeeConcessionForFeeType(
        feeConcessions,
        ft._id,
        feeType
      );

      feeType.concession += calcStudentWaiverForFeeType(
        studentWaivers,
        ft._id,
        feeType.fee_type._id
      );

      termAmount += feeType.amount;
      termConcession += feeType.concession;
    }

    const termDue = termAmount + termFine - termConcession;

    termFees.push({
      ...termFee,
      term_amount: termAmount,
      term_fine: termFine,
      term_fine_msg: feeFine.msg,
      term_concession: termConcession,
      term_due: termDue,
    });

    academicTotal += termAmount;
    academicFine += termFine;
    academicConcession += termConcession;
    academicDue += termDue;
  }

  // Generate Partial Fees
  const partialFees = [];
  for (const ft of feeTerms) {
    const feeTypes = feeStructure.partial_fees.map((ele) => ({ ...ele }));

    let termAmount = 0;
    let termConcession = 0;

    // Fee Concessions for term_fees
    for (const feeType of feeTypes) {
      feeType.concession = calcFeeConcessionForFeeType(
        feeConcessions,
        ft._id,
        feeType
      );

      feeType.concession += calcStudentWaiverForFeeType(
        studentWaivers,
        ft._id,
        feeType.fee_type._id
      );

      termAmount += feeType.amount;
      termConcession += feeType.concession;
    }

    const termDue = termAmount - termConcession;

    partialFees.push({
      fee_term: ft,
      fee_types: feeTypes,
      term_amount: termAmount,
      term_fine: 0,
      term_fine_msg: "",
      term_concession: termConcession,
      term_due: termDue,
    });

    academicTotal += termAmount;
    academicConcession += termConcession;
    academicDue += termDue;
  }

  const paidFees = await FeePaid.findOne({
    student: student._id,
    academic_year: ayear,
  })
    .populate("one_time_fees.fee_type", "name")
    .populate("term_fees.fee_term", "name")
    .populate("term_fees.fee_types.fee_type", "name")
    .populate("partial_fees.fee_term", "name")
    .populate("partial_fees.fee_types.fee_type", "name")
    .lean();

  const amounts = calcFeesTotalAmount(
    paidFees?.one_time_fees,
    paidFees?.term_fees,
    paidFees?.partial_fees
  );

  const totalPaidAmount = amounts.totalDue;

  const result = {
    student,
    one_time_fees: feeStructure.one_time_fees,
    term_fees: termFees,
    partial_fees: partialFees,
    paid_fees: {
      one_time_fees: paidFees?.one_time_fees,
      term_fees: paidFees?.term_fees,
      partial_fees: paidFees?.partial_fees,
    },
    total_amount: Math.round(academicTotal),
    total_concession: Math.round(academicConcession),
    total_fine: Math.round(academicFine),
    total_paid_amount: Math.round(totalPaidAmount),
    total_due_amount: Math.round(academicDue - totalPaidAmount),
  };

  // Clear one_time_fees if old student
  if (student.student_status === "o") result.one_time_fees = [];

  // Clear already paid fees
  if (paidFees) {
    result.one_time_fees = result.one_time_fees?.filter(
      (otf) =>
        !paidFees.one_time_fees.find((ele) =>
          ele.fee_type._id.equals(otf.fee_type._id)
        )
    );

    result.term_fees = result.term_fees.filter(
      (tf) =>
        !paidFees.term_fees.find((ele) =>
          ele.fee_term._id.equals(tf.fee_term._id)
        )
    );

    result.partial_fees = result.partial_fees?.filter(
      (tf) =>
        !paidFees.partial_fees.find((ele) =>
          ele.fee_term._id.equals(tf.fee_term._id)
        )
    );
  }

  return result;
};

const getStudentFees = async (
  admNo,
  ayear,
  termFees,
  partialFees = [],
  oneTimeFees = []
) => {
  assert(admNo !== undefined, "admNo missing!");
  assert(ayear !== undefined, "ayear missing!");
  assert(termFees !== undefined, "termFees missing!");

  const fees = await calcStudentFees(admNo, ayear);

  if (fees.one_time_fees.length) {
    if (oneTimeFees.length === 0) {
      UC.throwCustomValidationErr(C.getFieldIsReq("ONE_TIME_FEES"));
    }
  }

  if (fees.term_fees.length) {
    // if (!termFees.length && !fees.one_time_fees.length) {
    //   UC.throwCustomValidationErr(C.getFieldIsReq("TERM_FEES"));
    // }

    for (let i = 0; i < termFees.length; i++) {
      const TFTermName = termFees[i];

      if (!fees.term_fees.find((ele) => ele.fee_term.name === TFTermName)) {
        UC.throwCustomValidationErr(C.getFieldIsInvalid("term_fees"));
      }

      const TF = fees.term_fees[i];

      if (TF.fee_term.name !== TFTermName) {
        UC.throwCustomValidationErr("Invalid term_fees sequence!");
      }
    }

    fees.term_fees = fees.term_fees.filter((TF) =>
      termFees.includes(TF.fee_term.name)
    );
  }

  if (fees.partial_fees.length) {
    // if (!partialFees.length && termFees.length) {
    //   UC.throwCustomValidationErr(C.getFieldIsReq("PARTIAL_FEES"));
    // }

    for (let i = 0; i < partialFees.length; i++) {
      const PFTermName = partialFees[i];

      if (!fees.partial_fees.find((ele) => ele.fee_term.name === PFTermName)) {
        UC.throwCustomValidationErr(C.getFieldIsInvalid("partial_fees"));
      }

      const PF = fees.partial_fees[i];

      if (PF.fee_term.name !== PFTermName) {
        UC.throwCustomValidationErr("Invalid partial_fees sequence!");
      }
    }

    fees.partial_fees = fees.partial_fees.filter((PF) =>
      partialFees.includes(PF.fee_term.name)
    );
  } // else fees.partial_fees = [];

  const amounts = calcFeesTotalAmount(
    fees.one_time_fees,
    fees.term_fees,
    fees.partial_fees
  );

  fees.total_amount = amounts.totalAmount;
  fees.total_fine = amounts.totalFine;
  fees.total_concession = amounts.totalConcession;
  fees.total_due_amount = amounts.totalDue;

  return fees;
};

const combineFeesArrays = (
  oneTimeFees = [],
  termFees = [],
  partialFees = []
) => {
  const fees = [];

  if (oneTimeFees.length) {
    let totalAmount = 0;
    const feeTypes = [];

    for (const ft of oneTimeFees) {
      feeTypes.push({
        fee_type: ft.fee_type.name,
        amount: ft.amount,
      });

      totalAmount += ft.amount;
    }

    fees.push({
      fee_term: C.ONE_TIME_FEES,
      fee_types: feeTypes,
      term_amount: totalAmount,
      term_fine: 0,
      term_fine_msg: "",
      term_concession: 0,
      term_due: totalAmount,
    });
  }

  for (let i = 0; i < termFees.length; i++) {
    const tf = termFees[i];
    const pf = partialFees[i];

    fees.push({
      ...tf,
      fee_term: `${C.TERM_FEES} ${tf.fee_term.name}`,
      fee_types: tf.fee_types.map((ft) => ({
        ...ft,
        fee_type: ft.fee_type.name,
      })),
    });

    if (!pf) continue;

    fees.push({
      ...pf,
      fee_term: `${C.PARTIAL_FEES} ${pf.fee_term.name}`,
      fee_types: pf.fee_types.map((ft) => ({
        ...ft,
        fee_type: ft.fee_type.name,
      })),
    });
  }

  return fees;
};

const splitFeesArrays = (fees) => {
  const oneTimeFees = [];
  const termFees = [];
  const partialFees = [];

  for (const item of fees) {
    if (item === C.ONE_TIME_FEES) {
      oneTimeFees.push(item);
    } else if (item.startsWith(C.TERM_FEES)) {
      const idx = item.indexOf(" ");
      termFees.push(item.slice(idx + 1));
    } else if (item.startsWith(C.PARTIAL_FEES)) {
      const idx = item.indexOf(" ");
      partialFees.push(item.slice(idx + 1));
    }
  }

  return [oneTimeFees, termFees, partialFees];
};

// old

const calcTermFee = async (student, ft, ayear) => {
  const result = {
    term: { _id: ft._id, name: ft.name },
    fee_types: [],
    amount: 0,
    concession: 0,
    fine: 0,
    final_amount: 0,
  };

  const feeStructure = await FeeStructure.findOne({
    fee_term: ft._id,
    class: student.class._id,
    academic_year: ayear,
  })
    .select("-school")
    .populate(
      "fee_term class fee_types.boarding_type fee_types.amounts.fee_type academic_year",
      "name"
    )
    .lean();

  if (!feeStructure) {
    throwError(
      `FeeStructure not available for FeeTerm: ${ft.name}, Class: ${student.class.name} of given Student`
    );
  }

  const stuFeeStruct = feeStructure.fee_types.find((ele) =>
    ele.boarding_type._id.equals(student.boarding_type._id)
  );

  if (!stuFeeStruct) {
    throwError(
      `FeeStructure not found for BoardingType: ${student.boarding_type.name}, Student: ${student.admission_no}`
    );
  }

  for (const fee of stuFeeStruct.amounts) {
    result.fee_types.push({ fee_type: fee.fee_type, amount: fee.amount });

    result.amount += fee.amount;
  }

  const feeConcession = await FeeConcession.findOne({
    subward: student.sub_ward._id,
    class: student.class._id,
    fee_term: ft._id,
    academic_year: ayear,
  })
    .populate("fee_types.fee_type", "name")
    .lean();

  if (feeConcession)
    for (const fee of stuFeeStruct.amounts) {
      const feeType = result.fee_types.find(
        (ele) => ele.fee_type === fee.fee_type.name
      );

      const feeConType = feeConcession
        ? feeConcession.fee_types.find((ele) =>
            ele.fee_type._id.equals(fee.fee_type._id)
          )
        : false;

      if (!feeConType) {
        feeType.concession = 0;
        continue;
      }

      let conAmt = 0;
      if (feeConType.is_percentage) {
        conAmt = fee.amount * (feeConType.amount / 100);
      } else conAmt = feeConType.amount;

      if (feeType) feeType.concession = conAmt;

      result.concession += conAmt;
    }

  const feeFine = await FeeFine.findOne({
    class: student.class._id,
    fee_term: ft._id,
    boarding_type: student.boarding_type._id,
    academic_year: ayear,
  })
    // .populate("class fee_term")
    .lean();

  if (feeFine) {
    // calculate fee fine
  }

  result.final_amount = result.amount - result.concession + result.fine;

  return result;
};

const calcStudentFee = async (admNo, ayear) => {
  let stuSelect = "admission_no roll_no name class section stream gender ";
  stuSelect += "house doa phone father_details mother_details dob address ";
  stuSelect += "boarding_type sub_ward bus_pick bus_drop bus_stop";

  const student = await Student.findOne({
    admission_no: admNo,
    academic_year: ayear,
  })
    .select(stuSelect)
    .populate(
      "class section stream student_status boarding_type sub_ward bus_pick bus_drop bus_stop photo",
      "name title"
    )
    .lean();

  if (!student) throwError(C.getResourse404Id("Student", admNo));

  if (student.photo) {
    student.photo = `${DOMAIN}/uploads/student/${student.photo}`;
  }

  const paidFeeTerms = await FeePaid.find({
    student: student._id,
    academic_year: ayear,
  })
    .select("fee_term fee_types amount concession fine final_amount")
    .populate("fee_term", "name")
    .populate("fee_types.fee_type", "name")
    .lean();

  const feeTerms = await FeeTerm.find({
    _id: { $nin: paidFeeTerms.map((e) => e.fee_term) },
    academic_year: ayear,
  })
    .sort("year start_month")
    .lean();

  const result = {
    student,
    terms: [],
    paid_terms: paidFeeTerms,
    total_amount: 0,
    total_concession: 0,
    total_fine: 0,
    total_due_amount: 0,
    total_paid_amount: paidFeeTerms.reduce(
      (total, feeTerm) => total + feeTerm.final_amount,
      0
    ),
  };

  for (const ft of feeTerms) {
    if (ft.new_admission && student.student_status === "o") continue;

    const termFee = await calcTermFee(student, ft, ayear);

    result.total_amount += termFee.amount;
    result.total_concession += termFee.concession;
    result.total_fine += termFee.fine;
    result.total_due_amount += termFee.final_amount;

    result.terms.push(termFee);
  }

  return result;
};

const getTermsFees = async (feeTerms, admNo, ayear) => {
  assert(feeTerms !== undefined, "feeTerms missing!");
  assert(admNo !== undefined, "admNo missing!");
  assert(ayear !== undefined, "ayear missing!");

  const student = await Student.findOne({
    admission_no: admNo,
    academic_year: ayear,
  })
    .select()
    .populate(
      "class section stream boarding_type sub_ward bus_pick bus_drop bus_stop"
    )
    .lean();

  if (!student) throw new Error(C.getResourse404Id("Student", admNo));

  const paidFeeTerms = await FeePaid.find({
    student: student._id,
    academic_year: ayear,
  })
    .select("fee_term")
    .lean();

  const feeTermList = await FeeTerm.find({
    _id: { $nin: paidFeeTerms.map((e) => e.fee_term) },
    academic_year: ayear,
  })
    .sort("year start_month")
    .lean();

  const feeTermsSorted = [];
  for (let i = 0; i < feeTerms.length; i++) {
    const ft = await FeeTerm.findOne({
      name: feeTerms[i].toUpperCase(),
    }).lean();

    if (!ft) {
      throw new Error(C.getResourse404Id("fee_terms", feeTerms[i]));
    }

    if (!feeTermList[i]._id.equals(ft._id)) {
      throw new Error("Invalid fee_terms sequence!");
    }

    feeTermsSorted.push(ft);
  }

  const result = {
    student,
    terms: [],
    total_amount: 0,
    total_concession: 0,
    total_fine: 0,
    total_due_amount: 0,
  };

  for (const ft of feeTermsSorted) {
    if (ft.new_admission && student.student_status === "o") continue;

    const termFee = await calcTermFee(student, ft, ayear);

    result.total_amount += termFee.amount;
    result.total_concession += termFee.concession;
    result.total_fine += termFee.fine;
    result.total_due_amount += termFee.final_amount;

    result.terms.push(termFee);
  }

  return result;
};

const calcBusFees = async (admNo, ayear) => {
  let stuSelect = "admission_no roll_no name class section stream gender ";
  stuSelect += "house doa phone father_details mother_details dob address ";
  stuSelect += "boarding_type sub_ward bus_pick bus_drop bus_stop";

  const student = await Student.findOne({
    admission_no: admNo,
    academic_year: ayear,
  })
    .select(stuSelect)
    .populate(
      "class section stream student_status boarding_type sub_ward bus_pick bus_drop bus_stop photo",
      "name title"
    )
    .lean();

  if (!student) throwError(C.getResourse404Id("Student", admNo));

  student.photo ? `${DOMAIN}/uploads/student/${student.photo}` : undefined;

  if (!student.bus_stop) throwError(`Student: ${admNo} is not bus student`);

  const busAssign = await BusAssignment.findOne({
    student: student._id,
    academic_year: ayear,
  })
    .populate(
      "list.bus_stop list.bus_pick list.bus_drop",
      "name monthly_charges"
    )
    .lean();

  if (!busAssign) throwError(`Student: ${admNo} bus assignment not found!`);

  const result = { months: [], total: 0 };

  for (const month of busAssign.list) {
    if (month.status === C.UNASSIGNED) continue;

    result.months.push({
      month: UC.getMonthAndYear(month.date),
      bus_stop: month.bus_stop.name,
      bus_pick: month.bus_pick.name,
      bus_drop: month.bus_drop.name,
      fee: month.bus_stop.monthly_charges,
    });

    result.total += month.bus_stop.monthly_charges;
  }

  return result;
};

const throwError = (err) => {
  throw new Error(err);
};

module.exports = {
  calcStudentFees,
  getStudentFees,
  combineFeesArrays,
  splitFeesArrays,

  // calcTermFee,
  // calcStudentFee,
  // getTermsFees,
  // calcBusFees,
};
