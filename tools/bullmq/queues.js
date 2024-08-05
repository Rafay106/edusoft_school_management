const { Queue } = require("bullmq");
const C = require("../../constants");

const EmailQueue = new Queue(C.EMAIL_QUEUE);
const WhatsappQueue = new Queue(C.WHATSAPP_QUEUE);
const PushQueue = new Queue(C.PUSH_QUEUE);

const addJobToEmailQueue = async (name, data) => {
  await EmailQueue.add(name, data);
};

const addJobToWhatsappQueue = async (name, data) => {
  await WhatsappQueue.add(name, data);
};

const addJobToPushQueue = async (name, data) => {
  await PushQueue.add(name, data);
};

module.exports = {
  addJobToEmailQueue,
  addJobToWhatsappQueue,
  addJobToPushQueue,
};
