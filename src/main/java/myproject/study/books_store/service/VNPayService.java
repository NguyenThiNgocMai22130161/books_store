package myproject.study.books_store.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.*;

@Service
public class VNPayService {

    @Value("${vnpay.url}")
    private String vnp_Url;

    @Value("${vnpay.tmn-code}")
    private String vnp_TmnCode;

    @Value("${vnpay.hash-secret}")
    private String vnp_HashSecret;

    @Value("${vnpay.return-url}")
    private String vnp_ReturnUrl;

    // =========================================================================
    // TẠO LINK THANH TOÁN VNPAY (ĐỒNG BỘ 100% CẤU TRÚC CODE DEMO VNPAY)
    // =========================================================================
    public Map<String, Object> createPaymentRequest(double totalAmount, String ipAddr, String orderCode) throws Exception {
        String vnp_Version = "2.1.0";
        String vnp_Command = "pay";
        String vnp_TxnRef = orderCode;
        String vnp_OrderInfo = "Thanh toan don hang " + vnp_TxnRef;
        long amount = (long) (totalAmount * 100);

        Map<String, String> vnp_Params = new HashMap<>();
        vnp_Params.put("vnp_Version", vnp_Version);
        vnp_Params.put("vnp_Command", vnp_Command);
        vnp_Params.put("vnp_TmnCode", vnp_TmnCode);
        vnp_Params.put("vnp_Amount", String.valueOf(amount));
        vnp_Params.put("vnp_CurrCode", "VND");
        vnp_Params.put("vnp_TxnRef", vnp_TxnRef);
        vnp_Params.put("vnp_OrderInfo", vnp_OrderInfo);
        vnp_Params.put("vnp_OrderType", "170000");
        vnp_Params.put("vnp_Locale", "vn");
        vnp_Params.put("vnp_ReturnUrl", vnp_ReturnUrl);

        if (ipAddr == null || ipAddr.equals("0:0:0:0:0:0:0:1") || ipAddr.equals("::1") || ipAddr.contains(":")) {
            ipAddr = "127.0.0.1";
        }
        vnp_Params.put("vnp_IpAddr", ipAddr);

        Calendar cld = Calendar.getInstance(TimeZone.getTimeZone("Asia/Ho_Chi_Minh"));
        SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
        formatter.setTimeZone(TimeZone.getTimeZone("Asia/Ho_Chi_Minh"));
        vnp_Params.put("vnp_CreateDate", formatter.format(cld.getTime()));

        cld.add(Calendar.MINUTE, 15);
        vnp_Params.put("vnp_ExpireDate", formatter.format(cld.getTime()));

        // Sắp xếp tham số theo thứ tự alphabet (chuẩn VNPay)
        List<String> fieldNames = new ArrayList<>(vnp_Params.keySet());
        Collections.sort(fieldNames);

        // Xây dựng hashData và query theo đúng chuẩn VNPay demo
        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();

        for (int i = 0; i < fieldNames.size(); i++) {
            String fieldName = fieldNames.get(i);
            String fieldValue = vnp_Params.get(fieldName);

            if (fieldValue != null && fieldValue.length() > 0) {
                // Thêm dấu & nếu không phải phần tử đầu tiên
                if (hashData.length() > 0) {
                    hashData.append('&');
                    query.append('&');
                }

                // hashData: Bắt buộc phải URL encode giá trị giống như query!
                hashData.append(fieldName);
                hashData.append('=');
                hashData.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII.toString()));

                // query: URL encode cả key và value
                query.append(URLEncoder.encode(fieldName, StandardCharsets.US_ASCII.toString()));
                query.append('=');
                query.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII.toString()));
            }
        }

        // Tính HMAC SHA512 hash
        String vnp_SecureHash = hmacSHA512(vnp_HashSecret, hashData.toString());
        query.append("&vnp_SecureHashType=HmacSHA512");
        query.append("&vnp_SecureHash=").append(vnp_SecureHash);

        String paymentUrl = vnp_Url + "?" + query.toString();

        System.out.println("====== [SPRING BOOT VNPAY OUTBOUND DEBUG] ======");
        System.out.println("-> HashSecret: " + vnp_HashSecret);
        System.out.println("-> Chuỗi hashData gửi đi:\n" + hashData.toString());
        System.out.println("-> SecureHash: " + vnp_SecureHash);
        System.out.println("-> URL Tạo thành:\n" + paymentUrl);
        System.out.println("=================================================");

        return Map.of(
                "paymentUrl", paymentUrl,
                "orderId", vnp_TxnRef
        );
    }

    // =========================================================================
    // VERIFY CALLBACK VNPAY (XỬ LÝ TRẢ VỀ CHUẨN CHỮ KÝ PHẢN HỒI)
    // =========================================================================
    public boolean validatePaymentSignature(Map<String, String> rawParams) throws Exception {
        String vnp_SecureHash = rawParams.get("vnp_SecureHash");

        Map<String, String> fields = new HashMap<>();
        for (Map.Entry<String, String> entry : rawParams.entrySet()) {
            String key = entry.getKey();
            String value = entry.getValue();

            if (key != null && key.startsWith("vnp_") 
                    && !key.equals("vnp_SecureHash") 
                    && !key.equals("vnp_SecureHashType")) {
                
                // Giữ nguyên tham số phản hồi thô không bị biến dạng
                if (value != null && !value.isEmpty()) {
                    fields.put(key, value);
                }
            }
        }

        List<String> fieldNames = new ArrayList<>(fields.keySet());
        Collections.sort(fieldNames);

        StringBuilder hashData = new StringBuilder();
        Iterator<String> itr = fieldNames.iterator();
        while (itr.hasNext()) {
            String fieldName = itr.next();
            String fieldValue = fields.get(fieldName);
          
            hashData.append(fieldName).append('=').append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII.toString()));
            if (itr.hasNext()) {
                hashData.append("&");
            }
        }

        String calculatedHash = hmacSHA512(vnp_HashSecret, hashData.toString());
        
        System.out.println("====== [SPRING BOOT VNPAY INBOUND DEBUG] ======");
        System.out.println("-> Mã hash tự tính toán: " + calculatedHash.toUpperCase());
        System.out.println("-> Mã hash VNPay gửi về: " + vnp_SecureHash.toUpperCase());
        System.out.println("===============================================");

        return calculatedHash.equalsIgnoreCase(vnp_SecureHash);
    }

    // =========================================================================
    // THUẬT TOÁN MÃ HÓA HMAC SHA512
    // =========================================================================
    private String hmacSHA512(final String key, final String data) {
        try {
            Mac hmac512 = Mac.getInstance("HmacSHA512");
            SecretKeySpec secretKey = new SecretKeySpec(
                key.getBytes(StandardCharsets.UTF_8), "HmacSHA512"
            );
            hmac512.init(secretKey);
            byte[] result = hmac512.doFinal(data.getBytes(StandardCharsets.UTF_8));

            StringBuilder sb = new StringBuilder(128);
            for (byte b : result) {
                sb.append(String.format("%02x", b & 0xff));
            }
            return sb.toString();
        } catch (Exception ex) {
            return "";
        }
    }
}