const { default: axios } = require("axios");
const WhatsAppQ = require("../models/queues/whatsappQueueModel");
const UC = require("../utils/common");
const { debit } = require("./whatsapp_coin");
const School = require("../models/system/schoolModel");
const { addJobToWhatsappQueue } = require("./bullmq/queues");
const { AISENSY_URL, AISENSY_USERNAME, AISENSY_API_KEY } = process.env;

const sendWhatsappQueue = async (
  campaignName,
  destinations,
  templateParams,
  media
) => {
  const school = await School.findOne().select("whatsapp_coins").lean();

  if (!school) return false;

  if (school.whatsapp_coins < 1) return false;

  const data = {
    campaignName,
    destinations,
    templateParams,
    media,
  };

  const whatsappQ = await WhatsAppQ.create(data);

  await addJobToWhatsappQueue(whatsappQ._id.toString(), data);

  return destinations.length;
};

const sendWhatsapp = async (
  campaignName,
  destination,
  templateParams,
  media = {}
) => {
  const payload = {
    apiKey: AISENSY_API_KEY,
    campaignName,
    destination,
    userName: AISENSY_USERNAME,
    templateParams,
    source: "new-landing-page form",
    media,
  };

  const config = {
    headers: {
      "Content-Type": "application/json",
    },
  };

  try {
    const { data } = await axios.post(AISENSY_URL, payload, config);

    const result = Boolean(data.success);

    if (result) debit(1);

    UC.writeLog("send_whatsapp", `Response: ${JSON.stringify(data)}`);

    return result;
  } catch (err) {
    UC.writeLog(
      "send_whatsapp",
      `Error: ${JSON.stringify(err)} | Message: ${err.message}`
    );
    console.log(err);
    return false;
  }
};

module.exports = {
  sendWhatsappQueue,
  sendWhatsapp,
};
