import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

interface Recipient {
  email: string;
  code: string;
}

export const sendTeamCode = async (
  recipients: Recipient[],
  teamName: string
) => {
  if (!recipients || recipients.length === 0) return;

  const validRecipients = recipients.filter((r) => r.email && r.email.includes('@'));

  if (validRecipients.length === 0) return;

  // Send individual emails in parallel
  const emailPromises = validRecipients.map(async (recipient) => {
    const mailOptions = {
      from: '"GeoQuest Command" <tedcusat@gmail.com>',
      to: recipient.email,
      subject: `🔐 ACCESS CODE: ${teamName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #333; background-color: #1a1a1a; color: #fff;">
          <h2 style="color: #00ff9d; text-align: center; text-transform: uppercase;">Mission Briefing</h2>
          
          <p>Agent,</p>
          
          <p>Your squad <strong>${teamName}</strong> has been registered for the operation.</p>
          
          <div style="background-color: #333; padding: 15px; border-left: 4px solid #00ff9d; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; text-transform: uppercase; color: #aaa;">Your Unique Access Code</p>
            <p style="margin: 5px 0 0; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #fff;">${recipient.code}</p>
          </div>
  
          <p>Use this code specifically to verify your identity and access the secure network.</p>
          <p style="color: #ff4444; font-weight: bold;">DO NOT SHARE THIS CODE WITH OTHER SQUAD MEMBERS.</p>
          
          <p style="margin-top: 30px; font-size: 12px; color: #666; text-align: center;">
            SECURE TRANSMISSION // END OF MESSAGE
          </p>
        </div>
      `,
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log(`Email sent to ${recipient.email}: %s`, info.messageId);
      return { email: recipient.email, success: true, messageId: info.messageId };
    } catch (error) {
      console.error(`Error sending email to ${recipient.email}:`, error);
      return { email: recipient.email, success: false, error };
    }
  });

  return Promise.all(emailPromises);
};
