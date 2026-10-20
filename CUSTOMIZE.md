# Chỉnh món quà trước khi gửi

## Sửa trực tiếp trong file
Mở `config.js` và sửa `recipient`, `sender`, `greeting`, `letter`. Nhạc dùng `music: "./assets/nhac-nen.mp3"`; ảnh dùng `src: "./assets/anh-01.jpg"`. Có thể thêm bao nhiêu ảnh tùy ý trong mảng `photos`.

## Tải ảnh/nhạc từ giao diện
Bấm nút `✦` trên thiệp, chọn ảnh nền, nhạc nền và nhiều ảnh kỷ niệm, sau đó bấm **Lưu thay đổi**. Ảnh được hiển thị trong khung giữ nguyên tỉ lệ, không bị kéo méo; nếu file lỗi, thiệp tự thay bằng placeholder để không hỏng toàn bộ hiệu ứng. Nút **Xuất cấu hình** tải file `config.js` để đưa lên repository.

Ảnh/nhạc chọn trực tiếp trong trình duyệt được lưu cho bản xem trước trên trình duyệt đó. Muốn người yêu mở link GitHub Pages và thấy cùng nội dung, hãy đặt file thật vào `assets/`, sửa `config.js`, rồi commit/push lại.

## Link riêng cho từng người
Mở link thiệp gốc trên điện thoại, chạm `✦` để cá nhân hóa, sửa tên/lời chúc/thư, chọn ảnh nền, nhạc và ảnh kỷ niệm; cuối form bấm **Lưu và tạo link riêng**. Ứng dụng lưu bản xem trước trên thiết bị, nén ảnh, rồi hiện ngay link cùng hai nút **Gửi link** (mở bảng chia sẻ của điện thoại nếu được hỗ trợ) và **Sao chép link**. Mỗi lần lưu tạo mã URL ngẫu nhiên mới; link được gửi giữ nguyên nội dung của lần lưu đó và độc lập với các link của người khác.

Website hiện chạy tĩnh, không có tài khoản hay cơ sở dữ liệu: nội dung thiệp được đóng gói trong phần hash của URL, không tải lên máy chủ. Bất kỳ ai có link đều có thể mở hoặc chuyển tiếp thiệp; không đưa thông tin riêng tư nhạy cảm vào đó. Ảnh được giảm kích thước và nén trên thiết bị trước khi thêm vào URL. Nhạc lớn hoặc quá nhiều ảnh vẫn có thể làm link dài; hãy dùng tệp nhỏ hơn hoặc đặt tệp trong `assets/` để rút gọn và ổn định hơn.
## Nền và hiệu ứng
Không đổi bảng màu xanh đêm hiện tại. Bản nâng cấp chỉ thêm chiều sâu bằng nhiều lớp cỏ tiền cảnh, gân cỏ, sương chân núi, vệt núi xa, sao nhiều kích thước, sao băng, phản sáng cánh hoa, nhị hoa, gân lá và chuyển động gió rất nhẹ.
