# Thiệp 20/10 — một món quà dành cho em

Đây là website tĩnh mô phỏng sát phong cách ảnh tham khảo: nền xanh đêm navy/cobalt cố định, trăng khuyết, sao, sao băng, núi xa, đồng cỏ phát sáng, tulip hồng nở thành bó, lá thư tình, bó hoa tan dần và album ảnh bay từ dưới lên.

## Chạy thử

Mở `index.html` trực tiếp hoặc chạy một máy chủ tĩnh trong thư mục dự án:

```bash
python3 -m http.server 3000
```

Sau đó mở `http://localhost:3000`.

## Mỗi người tạo thiệp và link riêng trên điện thoại
Mở trang thiệp, chạm `✦` để sửa tên, lời chúc, thư, ảnh nền, nhạc và album. Sau khi bấm **Lưu và tạo link riêng**, bạn nhận hai URL: **link gốc** để tiếp tục chỉnh sửa trên thiết bị này và **link người nhận** chứa nội dung đã lưu. Chỉ gửi link người nhận bằng Zalo, Messenger hoặc ứng dụng khác; nó mở ở chế độ xem và ẩn nút cài đặt. Mỗi lần lưu tạo mã người nhận mới; ảnh được nén trên điện thoại, còn ảnh/nhạc được upload lên Supabase Storage để cấu hình không bị phình to.

Ảnh vừa chọn sẽ hiện ngay trong danh sách để kiểm tra trước khi lưu. Mỗi ảnh có ô sửa chú thích/ghi chú, chọn **Vừa khung · không cắt** hoặc **Phủ khung · có thể cắt**, canh **giữa/trên/dưới/trái/phải**, nút **↑/↓** đổi thứ tự, **Đổi** thay ảnh và **×** xóa. Mặc định ảnh mới là **vừa khung, không cắt**. Ảnh nền và nhạc có thể thay hoặc gỡ; khi có thay đổi chưa lưu, link người nhận cũ bị khóa để tránh gửi nhầm.

Trang vẫn là frontend tĩnh trên GitHub Pages, nhưng khi bấm **Lưu và tạo link riêng**, cấu hình được lưu vào Supabase bằng `share_id`; media mới được upload vào bucket Storage `gift-media`, còn link người nhận chỉ mang mã này nên không nhúng toàn bộ ảnh/nhạc vào URL. Link `gift=` cũ vẫn được đọc để không làm hỏng các thiệp đã gửi trước đây. Chế độ người nhận **chỉ ẩn giao diện cài đặt, không phải kiểm soát truy cập tuyệt đối** — bất kỳ ai có link đều có thể mở hoặc chuyển tiếp thiệp. Không nhúng thông tin nhạy cảm.

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

Có thể thêm bao nhiêu ảnh tùy ý; trong `config.js`, từng ảnh cũng có thể khai báo `fit: "cover"` và `position: "top"` (hoặc `center`, `bottom`, `left`, `right`). Nếu bỏ qua, mặc định là `contain`/`center` để không cắt ảnh. Bảng `✦` cho phép cá nhân hóa và xem trước trên điện thoại. Sau khi lưu, giữ link gốc để chỉnh sửa và chỉ gửi link người nhận. Nút **Xuất cấu hình** dùng để thay nội dung mặc định cho khách mở link gốc.

Nền xanh đêm chính được giữ cố định theo ảnh tham khảo. Ảnh nền tùy chọn chỉ phủ nhẹ lên bối cảnh mẫu, không thay thế phong cách bầu trời đêm.

## Gửi thiệp qua Zalo hoặc Facebook

Xem [hướng dẫn gửi link, làm mới ảnh preview và các lưu ý riêng tư](CHIA-SE-ZALO-FACEBOOK.md). Ảnh tiêu đề chung của trang sẽ hiện trong thẻ chia sẻ; nội dung từng thiệp vẫn được tải từ link cá nhân.

## GitHub Pages

Repository đã có `index.html` ở thư mục gốc, các đường dẫn đều tương đối và có `.nojekyll`. Trên GitHub, mở **Settings → Pages**, chọn **Deploy from a branch**, chọn nhánh **main** và thư mục **/ (root)**, sau đó nhấn **Save**. Đợi GitHub hoàn tất rồi dùng URL dạng `https://TEN-TAI-KHOAN.github.io/TEN-REPOSITORY/`.

Website vẫn không cần máy chủ ứng dụng riêng hoặc đăng nhập. Supabase cung cấp Data API/RPC để lưu và tải cấu hình thiệp cùng Storage để lưu media; publishable key nằm trong frontend và quyền truy cập được giới hạn bằng RLS/policy upload. Nhạc có thể bị trình duyệt chặn autoplay; người nhận chỉ cần chạm mở quà hoặc bấm nút `♫` để phát.
