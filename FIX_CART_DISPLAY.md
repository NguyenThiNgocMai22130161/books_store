# Sửa Lỗi: Giỏ Hàng Không Hiển Thị Sản Phẩm

## Vấn Đề
Sau khi thêm sách vào giỏ hàng, vào trang `/cart` nhưng không thấy sản phẩm.

## Nguyên Nhân

### Vấn đề 1: Sai tên field trong response ❌
```javascript
// Cart.jsx - SAI
setCartItems(response.data.items || []);
```

**Backend trả về**:
```json
{
  "cartItems": [...],  // ✅ Đúng
  "total": 700000,
  "itemCount": 2
}
```

**Frontend expect**:
```javascript
response.data.items  // ❌ SAI - Backend không có field 'items'
```

### Vấn đề 2: API update quantity sai URL ❌
```javascript
// Cart.jsx - SAI
await axios.put('http://localhost:8080/api/cart/update', {
  itemId, 
  quantity: newQuantity
});
```

**Backend expect**:
```java
@PutMapping("/update/{itemId}")
public ResponseEntity<?> updateCart(@PathVariable String itemId, ...)
```

**Đúng phải là**:
```javascript
await axios.put(`http://localhost:8080/api/cart/update/${itemId}`, {
  quantity: newQuantity
});
```

## Giải Pháp

### 1. **Sửa fetchCart() - Đọc đúng field** ✅

**Trước:**
```javascript
const fetchCart = async () => {
  const response = await axios.get('http://localhost:8080/api/cart');
  
  setCartItems(response.data.items || []);  // ❌ SAI
  setTotal(response.data.total || 0);
  setItemCount(response.data.itemCount || 0);
};
```

**Sau:**
```javascript
const fetchCart = async () => {
  console.log('Fetching cart...');
  
  const response = await axios.get('http://localhost:8080/api/cart', {
    withCredentials: true
  });
  
  console.log('Cart response:', response.data);
  
  // Backend trả về cartItems, không phải items
  setCartItems(response.data.cartItems || []);  // ✅ ĐÚNG
  setTotal(response.data.total || 0);
  setItemCount(response.data.itemCount || 0);
  
  console.log('Cart items:', response.data.cartItems);
};
```

### 2. **Sửa handleUpdateQuantity() - Đúng URL** ✅

**Trước:**
```javascript
const handleUpdateQuantity = async (itemId, newQuantity) => {
  await axios.put(
    'http://localhost:8080/api/cart/update',  // ❌ SAI - thiếu itemId
    { itemId, quantity: newQuantity }
  );
};
```

**Sau:**
```javascript
const handleUpdateQuantity = async (itemId, newQuantity) => {
  console.log('Updating quantity - itemId:', itemId, 'newQuantity:', newQuantity);
  
  await axios.put(
    `http://localhost:8080/api/cart/update/${itemId}`,  // ✅ ĐÚNG
    { quantity: newQuantity }
  );
  
  await fetchCart();  // Refresh cart
};
```

### 3. **Thêm Console Log** ✅
```javascript
console.log('Fetching cart...');
console.log('Cart response:', response.data);
console.log('Cart items:', response.data.cartItems);
```

## Backend API

### GET /api/cart
**Response**:
```json
{
  "cartItems": [
    {
      "id": 1,
      "book": {
        "id": 123,
        "title": "Clean Code",
        "author": "Robert C. Martin",
        "price": 350000,
        "imageUrl": "..."
      },
      "quantity": 2
    }
  ],
  "total": 700000,
  "itemCount": 2
}
```

**Lưu ý**: Field là `cartItems`, không phải `items`

### PUT /api/cart/update/{itemId}
**URL**: `/api/cart/update/1` (itemId trong URL)

**Request Body**:
```json
{
  "quantity": 3
}
```

**Response**:
```json
{
  "message": "Đã cập nhật giỏ hàng!"
}
```

### DELETE /api/cart/remove/{itemId}
**URL**: `/api/cart/remove/1`

**Response**:
```json
{
  "message": "Đã xóa khỏi giỏ hàng!"
}
```

## Test Cases

### Test 1: Xem giỏ hàng
1. **Thêm sách** vào giỏ từ trang `/books`
2. **Click icon giỏ hàng** (navbar)
3. **Kiểm tra**:
   - Sách đã thêm có hiển thị không?
   - Tên, giá, số lượng đúng không?
   - Tổng tiền đúng không?

**Console log**:
```
Fetching cart...
Cart response: {cartItems: [...], total: 700000, itemCount: 2}
Cart items: [{id: 1, book: {...}, quantity: 2}]
```

### Test 2: Cập nhật số lượng
1. **Vào giỏ hàng**
2. **Thay đổi số lượng** (tăng/giảm)
3. **Kiểm tra**:
   - Số lượng cập nhật đúng không?
   - Tổng tiền tự động cập nhật không?

**Console log**:
```
Updating quantity - itemId: 1, newQuantity: 3
Fetching cart...
Cart response: {cartItems: [...], total: 1050000, itemCount: 3}
```

### Test 3: Xóa sản phẩm
1. **Vào giỏ hàng**
2. **Click nút "Xóa"**
3. **Confirm**
4. **Kiểm tra**: Sản phẩm biến mất

### Test 4: Giỏ hàng trống
1. **Xóa hết sản phẩm**
2. **Kiểm tra**: Hiển thị "Giỏ hàng trống"

## Debug Checklist

Nếu vẫn không hiển thị:

- [ ] **Console có log "Fetching cart..." không?**
  - Nếu không → useEffect không chạy
  
- [ ] **Console có log "Cart response" không?**
  - Nếu không → API call fail
  - Xem error message
  
- [ ] **response.data.cartItems có data không?**
  - Nếu có → Frontend đã nhận data
  - Nếu không → Backend không trả về data
  
- [ ] **Backend có log không?**
  - Xem terminal Spring Boot
  - Kiểm tra CartService.getCartItems()
  
- [ ] **Database có data không?**
  ```sql
  SELECT * FROM cart_items WHERE user_id = ?;
  ```

## Files Đã Sửa

1. ✅ `/frontend/src/components/Cart.jsx`
   - Sửa `response.data.items` → `response.data.cartItems`
   - Sửa API update: `/api/cart/update` → `/api/cart/update/${itemId}`
   - Thêm console.log để debug

## Kết Luận

**Vấn đề chính**:
1. Frontend đọc sai field name (`items` thay vì `cartItems`)
2. API update sai URL (thiếu `itemId` trong path)

**Giải pháp**:
1. Đọc đúng field `cartItems` từ response
2. Gọi đúng URL `/api/cart/update/{itemId}`
3. Thêm log để debug

Sau khi sửa, giỏ hàng sẽ hiển thị đúng sản phẩm!
