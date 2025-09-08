import cron from 'node-cron';
import Subscription from '../models/Subscription.js';
import Member from '../models/Member.js';
import { sendMail } from '../utils/mailer.js';

export function scheduleReminders() {
  // Run every day at 9 AM server time
  cron.schedule('0 9 * * *', async () => {
    const today = new Date();
    const soon = new Date();
    soon.setDate(today.getDate() + 3);

    const expiring = await Subscription.find({
      endDate: { $gte: today, $lte: soon },
      status: 'active',
    }).populate('member');

    for (const sub of expiring) {
      const member = sub.member instanceof Member ? sub.member : await Member.findById(sub.member);
      if (!member?.email) continue;
      await sendMail({
        to: member.email,
        subject: 'Subscription expiring soon',
        text: `Hi ${member.firstName}, your ${sub.planName} plan expires on ${sub.endDate.toDateString()}.`,
      });
    }
  });
}


