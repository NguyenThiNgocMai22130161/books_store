# 🔑 Hướng Dẫn Lấy Google Gemini API Key

## Bước 1: Truy cập Google AI Studio

Mở trình duyệt và truy cập: **https://aistudio.google.com/**

## Bước 2: Đăng Nhập

- Đăng nhập bằng tài khoản Google của bạn
- Nếu chưa có, tạo tài khoản Google mới (miễn phí)

## Bước 3: Tạo API Key

1. Sau khi đăng nhập, bạn sẽ thấy giao diện Google AI Studio
2. Tìm và click nút **"Get API Key"** (thường ở góc trên bên phải)
3. Chọn **"Create API Key"** hoặc **"Create API Key in new project"**
4. Google sẽ tạo API key cho bạn

## Bước 4: Copy API Key

- API key sẽ hiển thị dạng: `AIzaSy...` (dài khoảng 39 ký tự)
- Click vào icon **Copy** để copy API key
- **LƯU Ý:** Giữ API key này bí mật, không share công khai!

## Bước 5: Cập Nhật File .env

```bash
# Mở file .env trong thư mục books-store-ai
cd /Users/nguyenmai/Documents/doanchuyennganh/main/books_store/books-store-ai

# Mở bằng text editor
# Mac: open -e .env
# Hoặc dùng VSCode, Sublime, vim, nano...
```

Tìm dòng:
```env
GOOGLE_API_KEY=YOUR_API_KEY_HERE
```

Thay thế bằng:
```env
GOOGLE_API_KEY=AIzaSy...your_actual_key...
```

**Ví dụ:**
```env
GOOGLE_API_KEY=AIzaSyABC123XYZ789example_key_here
```

Save file.

## Bước 6: Kiểm Tra (Optional)

Test API key có hoạt động không:

```bash
cd books-store-ai
source venv/bin/activate

python -c "
import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv('GOOGLE_API_KEY'))

model = genai.GenerativeModel('gemini-pro')
response = model.generate_content('Hello!')
print('✅ API Key works!')
print('Response:', response.text)
"
```

Nếu thấy `✅ API Key works!` → Thành công!

## 🎉 Xong!

Giờ bạn có thể chạy server:

```bash
uvicorn app.main:app --reload --port 8000
```

---

## 💰 Giá Cả & Quota

### Free Tier (Đủ để development & testing)
- **60 requests/minute**
- **1,500 requests/day**
- **Miễn phí hoàn toàn**

### Gemini 1.5 Flash Pricing
- **Input:** $0.075 / 1M tokens
- **Output:** $0.30 / 1M tokens
- **Embedding:** $0.025 / 1M characters

### Ước Tính Chi Phí
- **Development:** Hoàn toàn miễn phí (trong free quota)
- **Production (10K requests/tháng):** ~$3-5/month

---

## 🔒 Bảo Mật API Key

### ✅ DO:
- Lưu trong file `.env` (đã có trong `.gitignore`)
- Sử dụng environment variables
- Rotate key định kỳ nếu dùng production

### ❌ DON'T:
- Commit `.env` vào Git
- Share API key công khai
- Hard-code API key trong source code
- Push lên GitHub/GitLab public

---

## ❓ Troubleshooting

### "Invalid API key"
→ Kiểm tra:
- Copy đúng API key (không có khoảng trắng thừa)
- API key chưa bị revoke
- Tạo API key mới nếu cần

### "Quota exceeded"
→ Đợi 1 phút (free tier: 60 requests/minute)
→ Hoặc upgrade lên paid tier

### "API not enabled"
→ Enable Generative Language API tại:
https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com

---

## 📚 Tài Liệu Tham Khảo

- **Google AI Studio:** https://aistudio.google.com/
- **Gemini API Docs:** https://ai.google.dev/docs
- **Pricing:** https://ai.google.dev/pricing
- **Python SDK:** https://github.com/google/generative-ai-python

---

**Hoàn thành bước này → Tiếp tục QUICK_START.md để test server!**
