const { Worker } = require("bullmq");
const C = require("../../constants");
const UC = require("../../utils/common");
const { sendEmail } = require("../email");
const { sendWhatsapp } = require("../whatsapp_aisensy");
const { sendPushNotification } = require("../push");
const EmailQ = require("../../models/queues/emailQueueModel");
const WhatsAppQ = require("../../models/queues/whatsappQueueModel");
const PushQ = require("../../models/queues/pushQueueModel");

const workerEmailQueue = async (connection) => {
  const worker = new Worker(
    C.EMAIL_QUEUE,
    async (job) => {
      console.log(job.id);
      console.log(job.data);

      const result = await sendEmail(
        job.data.to,
        job.data.subject,
        job.data.text,
        job.data.html,
        job.data.attachments
      );

      if (result) await EmailQ.deleteOne({ _id: job.name });

      UC.writeLog(
        "bullmq_email",
        `Worker job: ${JSON.stringify(job)} | Result: ${result}`
      );
    },
    { connection }
  );
};

const workerWhatsappQueue = async () => {
  const worker = new Worker(C.WHATSAPP_QUEUE, async (job) => {
    console.log(job);

    const result = await sendWhatsapp(
      job.data.to,
      job.data.subject,
      job.data.text,
      job.data.html,
      job.data.attachments
    );

    if (result) await WhatsAppQ.deleteOne({ _id: job.name });

    UC.writeLog(
      "bullmq_whatsapp",
      `Worker job: ${JSON.stringify(job)} | Result: ${result}`
    );
  });
};

const workerPushQueue = async () => {
  const worker = new Worker(C.PUSH_QUEUE, async (job) => {
    console.log(job);

    const result = await sendPushNotification(
      job.data.to,
      job.data.subject,
      job.data.text,
      job.data.html,
      job.data.attachments
    );

    if (result) await PushQ.deleteOne({ _id: job.name });

    UC.writeLog(
      "bullmq_push",
      `Worker job: ${JSON.stringify(job)} | Result: ${result}`
    );
  });
};

module.exports = { workerEmailQueue, workerWhatsappQueue, workerPushQueue };
