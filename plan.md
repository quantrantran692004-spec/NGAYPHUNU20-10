# Kế hoạch — Thiệp 20/10 tương tác

## Phạm vi
Xây dựng website tĩnh, ưu tiên màn hình điện thoại, tái tạo bối cảnh ảnh tham chiếu: nền đêm xanh navy/cobalt cố định, trăng khuyết, sao nhấp nháy, sao băng, núi xa, đồng cỏ và quầng sáng xanh. Không dùng 100 màu khác nhau; nền chủ đạo giữ sát mẫu.

## Bản đồ trạng thái
1. `cover`: lời mời chạm vào quả cầu sáng để mở quà.
2. `bloom`: tiêu đề và một tulip đơn xuất hiện, sau đó tulip phát triển thành bó nhiều bông với giấy gói và phong bì.
3. `letter`: thư tình ở giữa màn hình, có đóng/mở và tiếp tục.
4. `fade`: bó hoa xuất hiện lại, phát sáng rồi tan dần bằng opacity và hạt sáng.
5. `gallery`: ảnh kỷ niệm bay từ dưới lên theo từng nhịp, mỗi ảnh là một khung phát sáng với góc xoay/kích thước riêng.

## Kiến trúc
- `index.html`: markup 5 trạng thái, nút nhạc, chia sẻ và bảng cá nhân hóa.
- `styles.css`: nền đêm và toàn bộ layout/animation thuần CSS.
- `app.js`: state machine, sinh hoa/sao/ảnh, tải media cục bộ, audio, chia sẻ và gọi Supabase RPC.
- `config.js`: dữ liệu cá nhân hóa dễ sửa để đóng gói lên GitHub Pages.
- `assets/`: nơi đặt ảnh và nhạc thật của người dùng.
- `manus-routes.json`: khai báo route `/` cho Preview.

## Cá nhân hóa
Bảng “Cá nhân hóa” cho phép sửa người nhận, người gửi, tiêu đề, lời chúc, thư, ảnh nền, nhạc và chọn hơn 10 ảnh. Dữ liệu chỉnh trong trình duyệt lưu bằng localStorage; để link GitHub Pages hiển thị cho người khác, người dùng đặt file vào `assets/` rồi sửa `config.js`.

## Thiết kế
- **Các hướng tham khảo:** cinematic night garden (0.06); romantic scrapbook (0.07); neon blue moonlit letter (0.08).
- **Được chọn:** cinematic night garden.
- **Design Movement:** thiệp điện tử lãng mạn kiểu cinematic night garden, dựng theo chiều dọc như một cảnh phim ngắn.
- **Core Principles:** nền xanh đêm là nhân vật chính; chuyển động theo nhịp thở; ánh sáng mềm quanh vật thể; nội dung cá nhân nằm trên đường đọc rõ ràng.
- **Color Philosophy:** navy/cobalt giữ cảm giác đêm trong ảnh; xanh phát sáng tạo chiều sâu; hồng tulip là điểm ấm duy nhất; kem của giấy gói tạo tương phản dịu.
- **Layout Paradigm:** sân khấu dọc toàn màn hình, vật thể xuất hiện từ tâm hoặc trôi qua không gian thay vì lưới đều.
- **Signature Elements:** quả cầu chạm mở; tulip CSS nở theo tầng; khung ảnh viền xanh-trắng bay như ký ức.
- **Interaction Philosophy:** một chạm để bắt đầu, nút tiếp tục để người nhận làm chủ nhịp đọc, nút tùy chỉnh luôn dễ tìm nhưng không lấn át món quà.
- **Animation:** easing mềm, opacity và blur chuyển tiếp; không cắt cảnh; respect `prefers-reduced-motion`.
- **Typography System:** Fraunces cho tiêu đề mềm, Caveat cho lời chúc, Manrope cho điều khiển và nội dung dễ đọc.
- **Brand Essence:** một lời tỏ tình có thể mở ra như một bó hoa; riêng tư, ấm áp, điện ảnh.
- **Brand Voice:** gần gũi, chân thành, không sáo rỗng. Ví dụ: “Chạm vào ánh sáng để mở món quà này”; “Những kỷ niệm của chúng mình vẫn còn ở phía trước...”.
- **Wordmark & Logo:** dấu `20/10` nhỏ dạng con dấu ở góc trên.
- **Signature Brand Color:** cobalt night `#0a3fae`, dùng làm quầng sáng đặc trưng.

## Triển khai
Website không cần máy chủ ứng dụng riêng và tương thích GitHub Pages. Cấu hình link người nhận được lưu trong Supabase qua `save_gift`/`get_gift`, với publishable key ở frontend và RLS bảo vệ bảng `gifts`. Mọi đường dẫn đều tương đối, không dùng server-side routing. GitHub Pages sẽ phục vụ `index.html` từ nhánh `main`.
