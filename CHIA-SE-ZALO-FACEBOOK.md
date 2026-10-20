# Cách gửi thiệp 20/10 qua Zalo hoặc Facebook

## Gửi bằng điện thoại

1. Mở thiệp, chạm dấu **✦**, chỉnh tên, lời chúc, ảnh và nhạc. Chạm **Lưu và tạo link riêng** để cập nhật nội dung; màn hình hiện **link gốc** và **link người nhận** riêng biệt.
2. Giữ **link gốc** để chỉnh sửa trên thiết bị/trình duyệt đã lưu nội dung. Chỉ chia sẻ **link người nhận**: chạm **Gửi link người nhận** để mở bảng chia sẻ của điện thoại, hoặc **Sao chép link người nhận** rồi dán vào cuộc trò chuyện Zalo/Messenger. Nếu webview chặn clipboard, ô link sẽ được chọn sẵn; nhấn giữ ô đó và chọn **Sao chép**.
3. Trên Facebook, dán link người nhận vào bài viết hoặc Messenger, đợi ảnh và tiêu đề hiện ra trước khi đăng/gửi. Gửi trong tin nhắn riêng nếu thiệp có nội dung chỉ dành cho người nhận.
4. Người nhận chạm vào link để mở đúng thiệp cá nhân hóa. Nhạc thường bắt đầu sau khi họ chạm mở quà vì trình duyệt điện thoại chặn tự phát âm thanh.
5. Nếu link mở ngay trong Messenger thì đó là **trình duyệt tích hợp**, không phải lỗi và không bắt buộc phải nhảy sang Chrome/Safari. Ở album cuối, người nhận vuốt ngang hoặc chạm mũi tên để xem từng ảnh; album chỉ hiện ảnh đã tải lên và không tự cho ảnh trôi chồng nhau. Nếu nhạc không phát, chạm nút **♫**; nếu webview chặn một thao tác, mở menu **⋯ → Mở bằng trình duyệt**.

Link người nhận ẩn nút cài đặt để giao diện chỉ còn trải nghiệm xem thiệp. Đây là website tĩnh, nên chế độ này chỉ ẩn giao diện chỉnh sửa, không phải bảo vệ nội dung bằng đăng nhập hay mật khẩu; người có link có thể chuyển tiếp link.

Trang công khai có Open Graph title/description/image, ảnh JPEG 1200×630 và `og:image:alt`. Ảnh preview là ảnh đại diện chung của thiệp; người nhận vẫn mở đúng nội dung cá nhân hóa từ link của họ.

## Nếu không thấy ảnh hoặc tiêu đề chưa cập nhật

- Dùng [Meta Sharing Debugger](https://developers.facebook.com/tools/debug/), dán link thiệp rồi chọn **Debug** và **Scrape Again** để Facebook đọc lại metadata. Chờ card preview tải xong rồi dán/gửi lại.
- Dùng [Zalo URL Validator](https://developers.zalo.me/api/verify/url?continue=https%3A%2F%2Fquantrantran692004-spec.github.io%2FNGAYPHUNU20-10%2F) để kiểm tra ảnh và metadata. Nếu vừa thay ảnh, nên đổi URL ảnh trong metadata ở lần triển khai sau để tránh cache cũ.
- Ảnh phải truy cập công khai bằng HTTPS; không dùng ảnh chỉ nằm trong điện thoại, Google Photos yêu cầu đăng nhập, hoặc đường dẫn tạm thời.

## Vì sao preview chưa cá nhân hóa theo tên từng người?

Link thiệp lưu cấu hình riêng trong phần sau dấu `#gift=` (fragment). Trình duyệt người nhận đọc phần này để dựng tên, lời chúc, ảnh và nhạc; nhưng fragment không gửi trong yêu cầu HTTP của crawler. Website GitHub Pages hiện cũng phục vụ cùng một `index.html` tĩnh cho mọi link, nên Zalo/Facebook thấy cùng một tiêu đề và ảnh preview mặc định. Vì thế preview hiện tại không thể lấy tên, ảnh hay nhạc riêng của từng thiệp.

Muốn mỗi người có preview riêng (ví dụ ảnh người nhận và tiêu đề được cá nhân hóa), cần thêm một endpoint tạo HTML/Open Graph phía máy chủ hoặc tạo trang HTML tĩnh riêng cho mỗi thiệp. Bản GitHub Pages hiện tại không có chức năng đó; không nên đổi `og:url` theo từng fragment vì crawler vẫn tải cùng trang và Meta khuyến nghị canonical URL không chứa tham số nhận diện.

## Nguồn

- [Meta: A Guide to Sharing for Webmasters](https://developers.facebook.com/documentation/sharing/webmasters) — các thẻ Open Graph, canonical URL và Sharing Debugger.
- [Meta: Images in Link Shares](https://developers.facebook.com/documentation/sharing/webmasters/images) — tối thiểu 200×200, giới hạn 8 MB, khuyến nghị ít nhất 1200×630 và tỷ lệ gần 1.91:1.
- [Open Graph protocol](https://ogp.me/) — ý nghĩa của `og:title`, `og:description`, `og:image` và `og:url`.
- [Zalo Developers: thảo luận về thumbnail website](https://developers.zalo.me/community/detail/6aff651b595eb000e94f) — trong bài có liên kết tới công cụ xác thực URL của Zalo.
