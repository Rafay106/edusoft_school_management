const UC = require("../utils/common");

const customLogger = (req, res, next) => {
  const url = req.url;
  const method = req.method;
  const user = req.user ? "Private: " + req.user._id : "Public";
  const ip = req.ip;

  const data = `${ip} ${method} ${url} ${user}`;

  UC.writeLog("custom_logs", data);

  next();
};

module.exports = { customLogger };
