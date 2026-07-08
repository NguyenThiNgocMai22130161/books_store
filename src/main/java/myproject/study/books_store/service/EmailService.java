package myproject.study.books_store.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;

/**
 * Service xử lý gửi email OTP cho:
 *  - Xác thực đăng ký tài khoản
 *  - Đặt lại mật khẩu (quên mật khẩu)
 */
@Service
@RequiredArgsConstructor
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    /** Lấy địa chỉ email gửi từ application.properties */
    @Value("${spring.mail.username}")
    private String fromEmail;

    // ─────────────────────────────────────────────────────────────────
    // PUBLIC API
    // ─────────────────────────────────────────────────────────────────

    /**
     * Gửi OTP xác thực khi đăng ký tài khoản mới.
     *
     * @param toEmail địa chỉ email người nhận
     * @param otp     mã OTP 6 chữ số
     */
    public void sendOtpEmail(String toEmail, String otp) {
        String subject = "📚 Tiệm Sách – Mã xác thực đăng ký tài khoản";
        String html = buildRegisterOtpHtml(otp);
        sendHtmlEmail(toEmail, subject, html);
    }

    /**
     * Gửi OTP đặt lại mật khẩu (quên mật khẩu).
     *
     * @param toEmail địa chỉ email người nhận
     * @param otp     mã OTP 6 chữ số
     */
    public void sendPasswordResetOtp(String toEmail, String otp) {
        String subject = "🔐 Tiệm Sách – Mã xác thực đặt lại mật khẩu";
        String html = buildPasswordResetHtml(otp);
        sendHtmlEmail(toEmail, subject, html);
    }

    // ─────────────────────────────────────────────────────────────────
    // PRIVATE HELPERS
    // ─────────────────────────────────────────────────────────────────

    /**
     * Gửi email HTML qua JavaMailSender.
     * Ném RuntimeException nếu gửi thất bại để caller (UserService) có thể xử lý.
     */
    private void sendHtmlEmail(String toEmail, String subject, String htmlBody) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, "Tiệm Sách");
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(htmlBody, true); // true = nội dung là HTML

            mailSender.send(message);
            log.info("[EmailService] Đã gửi email tới {} | Tiêu đề: {}", toEmail, subject);

        } catch (MessagingException e) {
            log.error("[EmailService] Gửi email thất bại tới {} | Lỗi: {}", toEmail, e.getMessage(), e);
            throw new RuntimeException("Không thể gửi email. Vui lòng thử lại sau.", e);
        } catch (Exception e) {
            log.error("[EmailService] Lỗi không xác định khi gửi email tới {}: {}", toEmail, e.getMessage(), e);
            throw new RuntimeException("Lỗi hệ thống khi gửi email.", e);
        }
    }

    // ─────────────────────────────────────────────────────────────────
    // HTML TEMPLATES
    // ─────────────────────────────────────────────────────────────────

    /** Template HTML cho email OTP đăng ký tài khoản */
    private String buildRegisterOtpHtml(String otp) {
        return buildBaseTemplate(
            "Xác thực tài khoản",
            "📚",
            "Chào mừng đến với <strong>Tiệm Sách</strong>!",
            "Bạn vừa đăng ký tài khoản. Hãy dùng mã OTP bên dưới để hoàn tất xác thực.",
            otp,
            "Mã này có hiệu lực trong <strong>5 phút</strong>. Vui lòng không chia sẻ mã này với bất kỳ ai."
        );
    }

    /** Template HTML cho email OTP đặt lại mật khẩu */
    private String buildPasswordResetHtml(String otp) {
        return buildBaseTemplate(
            "Đặt lại mật khẩu",
            "🔐",
            "Yêu cầu đặt lại mật khẩu",
            "Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. "
                + "Nếu bạn <strong>không thực hiện yêu cầu này</strong>, hãy bỏ qua email này.",
            otp,
            "Mã này có hiệu lực trong <strong>5 phút</strong>. "
                + "Nếu bạn không yêu cầu đặt lại mật khẩu, tài khoản của bạn vẫn an toàn."
        );
    }

    /**
     * Khung HTML chung cho mọi email OTP.
     *
     * @param title     tiêu đề hiển thị trong thẻ &lt;title&gt;
     * @param icon      emoji icon đầu email
     * @param heading   dòng tiêu đề lớn
     * @param intro     đoạn mô tả
     * @param otp       mã OTP 6 chữ số
     * @param footer    ghi chú phía dưới OTP
     */
    private String buildBaseTemplate(String title, String icon,
                                     String heading, String intro,
                                     String otp, String footer) {
        // Tách OTP thành 6 ký tự để hiển thị từng ô
        StringBuilder otpBoxes = new StringBuilder();
        for (char c : otp.toCharArray()) {
            otpBoxes.append("""
                <td style="padding:0 4px;">
                  <div style="
                    width:46px; height:56px; line-height:56px;
                    background:#f0f4ff; border:2px solid #6366f1;
                    border-radius:10px; text-align:center;
                    font-size:26px; font-weight:800; color:#4f46e5;
                    font-family:'Segoe UI',Arial,sans-serif; letter-spacing:0;">
                    %c
                  </div>
                </td>
            """.formatted(c));
        }

        return """
            <!DOCTYPE html>
            <html lang="vi">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>%s – Tiệm Sách</title>
            </head>
            <body style="margin:0; padding:0; background:#f8fafc; font-family:'Segoe UI',Arial,sans-serif;">

              <!-- Wrapper -->
              <table width="100%%" cellpadding="0" cellspacing="0"
                     style="background:#f8fafc; padding:40px 16px;">
                <tr>
                  <td align="center">

                    <!-- Card -->
                    <table width="560" cellpadding="0" cellspacing="0"
                           style="background:#ffffff; border-radius:20px;
                                  box-shadow:0 4px 24px rgba(0,0,0,0.08);
                                  overflow:hidden; max-width:100%%;">

                      <!-- Header gradient -->
                      <tr>
                        <td style="background:linear-gradient(135deg,#6366f1 0%%,#8b5cf6 100%%);
                                   padding:36px 40px 28px; text-align:center;">
                          <div style="font-size:48px; margin-bottom:12px;">%s</div>
                          <div style="font-size:22px; font-weight:800; color:#ffffff;
                                      letter-spacing:-0.3px;">%s</div>
                        </td>
                      </tr>

                      <!-- Body -->
                      <tr>
                        <td style="padding:36px 40px 28px;">

                          <!-- Intro -->
                          <p style="font-size:15px; color:#4b5563; line-height:1.7; margin:0 0 28px;">
                            %s
                          </p>

                          <!-- OTP Label -->
                          <p style="font-size:13px; font-weight:600; color:#6366f1;
                                    text-transform:uppercase; letter-spacing:1px;
                                    margin:0 0 14px; text-align:center;">
                            Mã OTP của bạn
                          </p>

                          <!-- OTP Boxes -->
                          <table cellpadding="0" cellspacing="0"
                                 style="margin:0 auto 28px;">
                            <tr>%s</tr>
                          </table>

                          <!-- Footer note -->
                          <p style="font-size:13px; color:#9ca3af; line-height:1.6;
                                    margin:0; text-align:center; background:#f9fafb;
                                    border-radius:10px; padding:14px 20px; border:1px solid #e5e7eb;">
                            %s
                          </p>
                        </td>
                      </tr>

                      <!-- Divider -->
                      <tr>
                        <td style="height:1px; background:#f3f4f6;"></td>
                      </tr>

                      <!-- Footer -->
                      <tr>
                        <td style="padding:20px 40px; text-align:center;">
                          <p style="font-size:12px; color:#9ca3af; margin:0 0 4px;">
                            Email này được gửi tự động từ hệ thống <strong>Tiệm Sách</strong>.
                          </p>
                          <p style="font-size:12px; color:#d1d5db; margin:0;">
                            © 2026 Tiệm Sách. Mọi quyền được bảo lưu.
                          </p>
                        </td>
                      </tr>

                    </table>
                    <!-- /Card -->

                  </td>
                </tr>
              </table>
            </body>
            </html>
            """.formatted(title, icon, heading, intro, otpBoxes, footer);
    }
}