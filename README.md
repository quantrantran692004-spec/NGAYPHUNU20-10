# Thiệp 20/10 — một món quà dành cho em

Đây là website tĩnh mô phỏng sát phong cách ảnh tham khảo: nền xanh đêm navy/cobalt cố định, trăng khuyết, sao, sao băng, núi xa, đồng cỏ phát sáng, tulip hồng nở thành bó, lá thư tình, bó hoa tan dần và album ảnh bay từ dưới lên.

## Chạy thử

Mở `index.html` trực tiếp hoặc chạy một máy chủ tĩnh trong thư mục dự án:

```bash
python3 -m http.server 3000
```

Sau đó mở `http://localhost:3000`.

## Thay ảnh, nhạc và lời chúc cho người yêu

Cách ổn định nhất để người nhận thấy nội dung khi mở link GitHub Pages là đặt file thật vào thư mục `assets/`, rồi sửa `config.js`:

```js
window.GIFT_CONFIG = {
  recipient: "Tên người yêu",
  sender: "Tên của bạn",
  title: "Happy Vietnamese Women's Day 20/10",
  greeting: "Lời chúc ngắn của bạn",
  letter: "Nội dung lá thư...",
  music: "./assets/nhac-nen.mp3",
  background: "",
  photos: [
    { src: "./assets/anh-01.jpg", caption: "Ngày đầu tiên", note: "Một kỷ niệm nhỏ" },
    { src: "./assets/anh-02.jpg", caption: "Có em bên cạnh", note: "Anh luôn nhớ" }
  ]
};
```

Có thể thêm bao nhiêu ảnh tùy ý; album tự tạo nhịp bay khác nhau cho từng khung. Nếu chưa có ảnh/nhạc, website dùng các placeholder khác nhau và vẫn chạy đủ hiệu ứng. Bảng `✦` trên trang cho phép xem trước thay đổi ngay trong trình duyệt, nhưng file localStorage đó không tự truyền sang người khác; dùng nút **Xuất cấu hình** để tải `config.js`, thay file trong repository rồi push lại.

Nền xanh đêm chính được giữ cố định theo ảnh tham khảo. Ảnh nền tùy chọn chỉ phủ nhẹ lên bối cảnh mẫu, không thay thế phong cách bầu trời đêm.

## GitHub Pages

Repository đã có `index.html` ở thư mục gốc, các đường dẫn đều tương đối và có `.nojekyll`. Trên GitHub, mở **Settings → Pages**, chọn **Deploy from a branch**, chọn nhánh **main** và thư mục **/ (root)**, sau đó nhấn **Save**. Đợi GitHub hoàn tất rồi dùng URL dạng `https://TEN-TAI-KHOAN.github.io/TEN-REPOSITORY/`.

Website này chỉ cần frontend tĩnh, không cần backend, đăng nhập hoặc cơ sở dữ liệu. Nhạc có thể bị trình duyệt chặn autoplay; người nhận chỉ cần chạm mở quà hoặc bấm nút `♫` để phát.
