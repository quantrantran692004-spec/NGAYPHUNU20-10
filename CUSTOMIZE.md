# Chỉnh món quà trước khi gửi

## Sửa trực tiếp trong file
Mở `config.js` và sửa `recipient`, `sender`, `greeting`, `letter`. Nhạc dùng `music: "./assets/nhac-nen.mp3"`; ảnh dùng `src: "./assets/anh-01.jpg"`. Có thể thêm bao nhiêu ảnh tùy ý trong mảng `photos`.

## Tải ảnh/nhạc từ giao diện
Bấm nút `✦` trên thiệp, chọn ảnh nền, nhạc nền và nhiều ảnh kỷ niệm, sau đó bấm **Lưu thay đổi**. Ảnh được hiển thị trong khung giữ nguyên tỉ lệ, không bị kéo méo; nếu file lỗi, thiệp tự thay bằng placeholder để không hỏng toàn bộ hiệu ứng. Nút **Xuất cấu hình** tải file `config.js` để đưa lên repository.

Ảnh/nhạc chọn trực tiếp trong trình duyệt được lưu cho bản xem trước trên trình duyệt đó. Muốn người yêu mở link GitHub Pages và thấy cùng nội dung, hãy đặt file thật vào `assets/`, sửa `config.js`, rồi commit/push lại.

## Link riêng cho từng người
Sau khi sửa nội dung trong giao diện và bấm **Lưu thay đổi**, đi đến màn hình album rồi bấm **Chia sẻ thiệp**. Website tạo một URL riêng với cấu hình cá nhân hóa nằm trong phần hash của URL, nên người nhận mở link sẽ thấy đúng tên, lời chúc, thư, ảnh và nhạc đã nhúng. Với nhạc hoặc ảnh quá lớn, URL có thể dài; khi đó đặt file vào `assets/` và dùng đường dẫn tương đối trong `config.js` để link gọn, ổn định hơn.

## Nền và hiệu ứng
Không đổi bảng màu xanh đêm hiện tại. Bản nâng cấp chỉ thêm chiều sâu bằng nhiều lớp cỏ tiền cảnh, gân cỏ, sương chân núi, vệt núi xa, sao nhiều kích thước, sao băng, phản sáng cánh hoa, nhị hoa, gân lá và chuyển động gió rất nhẹ.
