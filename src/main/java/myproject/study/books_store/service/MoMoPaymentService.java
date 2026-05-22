package myproject.study.books_store.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import myproject.study.books_store.config.MoMoPaymentConfig;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.*;

@Service
public class MoMoPaymentService {

    @Autowired
    private MoMoPaymentConfig momoConfig;

    private static final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    public MoMoPaymentService(MoMoPaymentConfig momoConfig) {
        this.momoConfig = momoConfig;
    }

    public Map<String, Object> createPaymentRequest(String orderId, Long amount, String orderInfo) {
    try {
        System.out.println("=== START MOMO PAYMENT REQUEST ===");
        System.out.println("Order ID: " + orderId);
        System.out.println("Amount: " + amount);
        System.out.println("Order Info: " + orderInfo);
        
        String requestId = UUID.randomUUID().toString();
        String requestType = "captureWallet";
        String extraData = "";
        
        // 1. Tạo raw signature - ĐÚNG THỨ TỰ VÀ ĐÚNG FORMAT
        String rawSignature = "accessKey=" + momoConfig.getAccessKey()
                + "&amount=" + amount
                + "&extraData=" + extraData
                + "&ipnUrl=" + momoConfig.getNotifyUrl()
                + "&orderId=" + orderId
                + "&orderInfo=" + orderInfo
                + "&partnerCode=" + momoConfig.getPartnerCode()
                + "&redirectUrl=" + momoConfig.getReturnUrl()
                + "&requestId=" + requestId
                + "&requestType=" + requestType;

        System.out.println("Raw Signature String: " + rawSignature);
        System.out.println("Raw Signature Length: " + rawSignature.length());
        
        String signature = hmacSHA256(rawSignature, momoConfig.getSecretKey());
        System.out.println("Generated Signature: " + signature);
        System.out.println("Signature Length: " + signature.length());

        // 2. Tạo request body - BỎ accessKey khỏi body (vì đã có trong signature)
        Map<String, Object> requestBody = new LinkedHashMap<>();
        requestBody.put("partnerCode", momoConfig.getPartnerCode());
        requestBody.put("partnerName", "Tiệm Sách");
        requestBody.put("storeId", "Tiệm Sách");
        requestBody.put("requestId", requestId);
        requestBody.put("amount", amount);
        requestBody.put("orderId", orderId);
        requestBody.put("orderInfo", orderInfo);
        requestBody.put("redirectUrl", momoConfig.getReturnUrl());
        requestBody.put("ipnUrl", momoConfig.getNotifyUrl());
        requestBody.put("lang", "vi");
        requestBody.put("extraData", extraData);
        requestBody.put("requestType", requestType);
        requestBody.put("signature", signature);
        // KHÔNG thêm accessKey vào body

        System.out.println("Request Body JSON: " + objectMapper.writeValueAsString(requestBody));

        // 3. Gửi request
        String jsonResponse = sendHttpRequest(momoConfig.getApiEndpoint(), requestBody);
        System.out.println("MoMo Response: " + jsonResponse);

        JsonNode jsonNode = objectMapper.readTree(jsonResponse);

        Map<String, Object> result = new HashMap<>();
        result.put("resultCode", jsonNode.get("resultCode").asInt());
        result.put("message", jsonNode.get("message").asText());

        if (jsonNode.get("resultCode").asInt() == 0) {
            result.put("payUrl", jsonNode.get("payUrl").asText());
        }

        System.out.println("=== END MOMO PAYMENT REQUEST ===");
        return result;

    } catch (Exception e) {
        e.printStackTrace();
        Map<String, Object> errorResult = new HashMap<>();
        errorResult.put("resultCode", -1);
        errorResult.put("message", "Error: " + e.getMessage());
        return errorResult;
    }
}

    public boolean validatePaymentSignature(String signature, Map<String, String> params) {
        try {
            System.out.println("=== VALIDATE MOMO SIGNATURE ===");
            System.out.println("Received signature: " + signature);
            
            // Xử lý null values
            String accessKey = params.get("accessKey") != null ? params.get("accessKey") : "";
            String amount = params.get("amount") != null ? params.get("amount") : "";
            String extraData = params.get("extraData") != null ? params.get("extraData") : "";
            String ipnUrl = params.get("ipnUrl") != null ? params.get("ipnUrl") : "";
            String orderId = params.get("orderId") != null ? params.get("orderId") : "";
            String orderInfo = params.get("orderInfo") != null ? params.get("orderInfo") : "";
            String partnerCode = params.get("partnerCode") != null ? params.get("partnerCode") : "";
            String redirectUrl = params.get("redirectUrl") != null ? params.get("redirectUrl") : "";
            String requestId = params.get("requestId") != null ? params.get("requestId") : "";
            String resultCode = params.get("resultCode") != null ? params.get("resultCode") : "";
            String transId = params.get("transId") != null ? params.get("transId") : "";

            String rawSignature = "accessKey=" + accessKey +
                    "&amount=" + amount +
                    "&extraData=" + extraData +
                    "&ipnUrl=" + ipnUrl +
                    "&orderId=" + orderId +
                    "&orderInfo=" + orderInfo +
                    "&partnerCode=" + partnerCode +
                    "&redirectUrl=" + redirectUrl +
                    "&requestId=" + requestId +
                    "&resultCode=" + resultCode +
                    "&transId=" + transId;

            System.out.println("Raw signature for validation: " + rawSignature);
            
            String calculatedSignature = hmacSHA256(rawSignature, momoConfig.getSecretKey());
            System.out.println("Calculated signature: " + calculatedSignature);
            System.out.println("Signatures match: " + calculatedSignature.equals(signature));
            System.out.println("=== END VALIDATE MOMO SIGNATURE ===");

            return calculatedSignature.equals(signature);

        } catch (Exception e) {
            System.err.println("Error validating MoMo signature: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }

    private String sendHttpRequest(String apiUrl, Map<String, Object> requestBody) throws Exception {
    HttpURLConnection connection = null;
    try {
        URL url = URI.create(apiUrl).toURL();
        connection = (HttpURLConnection) url.openConnection();

        connection.setRequestMethod("POST");
        connection.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
        connection.setRequestProperty("Accept", "application/json");
        connection.setConnectTimeout(30000); // 30 seconds
        connection.setReadTimeout(30000); // 30 seconds
        connection.setDoOutput(true);
        connection.setDoInput(true);

        String jsonBody = objectMapper.writeValueAsString(requestBody);
        System.out.println("Sending to MoMo URL: " + apiUrl);
        System.out.println("Request body: " + jsonBody);

        try (OutputStream os = connection.getOutputStream()) {
            byte[] input = jsonBody.getBytes(StandardCharsets.UTF_8);
            os.write(input, 0, input.length);
        }

        int responseCode = connection.getResponseCode();
        System.out.println("Response Code: " + responseCode);

        StringBuilder response = new StringBuilder();
        if (responseCode == HttpURLConnection.HTTP_OK) {
            try (BufferedReader br = new BufferedReader(
                    new InputStreamReader(connection.getInputStream(), StandardCharsets.UTF_8))) {
                String responseLine;
                while ((responseLine = br.readLine()) != null) {
                    response.append(responseLine.trim());
                }
            }
        } else {
            // Đọc error stream
            try (BufferedReader br = new BufferedReader(
                    new InputStreamReader(connection.getErrorStream(), StandardCharsets.UTF_8))) {
                String responseLine;
                while ((responseLine = br.readLine()) != null) {
                    response.append(responseLine.trim());
                }
            }
            throw new RuntimeException("HTTP error code: " + responseCode + ", response: " + response.toString());
        }

        return response.toString();

    } finally {
        if (connection != null) {
            connection.disconnect();
        }
    }
}

    private String hmacSHA256(String data, String key) throws Exception {
    try {
        Mac sha256_HMAC = Mac.getInstance("HmacSHA256");
        SecretKeySpec secret_key = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        sha256_HMAC.init(secret_key);
        byte[] hash = sha256_HMAC.doFinal(data.getBytes(StandardCharsets.UTF_8));
        
        // QUAN TRỌNG: Chuyển byte array sang hex string
        StringBuilder hexString = new StringBuilder();
        for (byte b : hash) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) {
                hexString.append('0');
            }
            hexString.append(hex);
        }
        return hexString.toString();
        
    } catch (Exception e) {
        e.printStackTrace();
        throw e;
    }
}

    public String generateOrderId() {
        SimpleDateFormat sdf = new SimpleDateFormat("yyyyMMddHHmmss");
        return sdf.format(new Date()) + "_" + UUID.randomUUID().toString().substring(0, 8);
    }
}
