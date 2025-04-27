# PolyLib2025 - Hệ thống Quản lý Thư viện
## Giao diện người dùng

### Đăng nhập và Đăng ký

<table>
  <tr>
    <td width="50%"><b>Đăng nhập</b><br/>Giao diện đăng nhập cho tất cả người dùng</td>
    <td width="50%"><b>Đăng ký</b><br/>Giao diện đăng ký tài khoản mới</td>
  </tr>
  <tr>
    <td><img src="https://github.com/user-attachments/assets/60bc2664-99f7-4d2b-87ac-ed46e8a7c1ea" width="300"/></td>
    <td><img src="https://github.com/user-attachments/assets/203f4e35-07d2-441a-bd52-0ee24972027d" width="300"/></td>
  </tr>
</table>

### Giao diện người dùng thông thường (User)

<table>
  <tr>
    <td width="33%"><b>Màn hình chính</b><br/>Hiển thị tài liệu mới, phổ biến và đề xuất</td>
    <td width="33%"><b>Thông báo</b><br/>Hiển thị thông báo về trạng thái đăng ký, mượn sách</td>
    <td width="33%"><b>Phiếu đăng ký</b><br/>Quản lý phiếu đăng ký mượn tài liệu</td>
  </tr>
  <tr>
    <td><img src="https://github.com/user-attachments/assets/7802e6d8-60ae-42cf-b094-05f0be7a3f1d" width="250"/></td>
    <td><img src="https://github.com/user-attachments/assets/6a9d2028-7d2f-4852-bd94-0504f717fb83" width="250"/></td>
    <td><img src="https://github.com/user-attachments/assets/81c852bf-7470-42c1-b4c1-786a9c37916b" width="250"/></td>
  </tr>
  <tr>
    <td width="33%"><b>Phiếu mượn</b><br/>Hiển thị phiếu mượn hiện tại và lịch sử</td>
    <td width="33%"><b>Thông tin cá nhân</b><br/>Hiển thị và cập nhật thông tin người dùng</td>
    <td width="33%"></td>
  </tr>
  <tr>
    <td><img src="https://github.com/user-attachments/assets/65bfb725-7c32-41b2-ac6d-2d61d540a897" width="250"/></td>
    <td><img src="https://github.com/user-attachments/assets/200c584e-32e4-4fea-af3d-2aa1ffcb9eed" width="250"/></td>
    <td></td>
  </tr>
</table>

### Giao diện quản trị (Admin và Nhân viên)

<table>
  <tr>
    <td width="33%"><b>Quản lý tài liệu</b><br/>Quản lý tất cả tài liệu trong thư viện</td>
    <td width="33%"><b>Quản lý danh mục</b><br/>Quản lý các danh mục, thể loại tài liệu</td>
    <td width="33%"><b>Quản lý người dùng</b><br/>Quản lý tài khoản và phân quyền</td>
  </tr>
  <tr>
    <td><img src="https://github.com/user-attachments/assets/eeac6da9-41aa-4afa-89c9-30f69295e2da" width="250"/></td>
    <td><img src="https://github.com/user-attachments/assets/d2f5ba2f-87c3-43fd-b29d-573f26d5ef01" width="250"/></td>
    <td><img src="https://github.com/user-attachments/assets/33b0727e-9fd0-4d50-9470-4f3ceea25866" width="250"/></td>
  </tr>
  <tr>
    <td width="33%"><b>Xử lý đăng ký</b><br/>Xử lý yêu cầu đăng ký mượn</td>
    <td width="33%"><b>Quản lý phiếu mượn</b><br/>Quản lý phiếu mượn hiện tại</td>
    <td width="33%"><b>Quản lý phiếu trả</b><br/>Quản lý các phiếu trả</td>
  </tr>
  <tr>
    <td><img src="https://github.com/user-attachments/assets/d6395da4-05f6-47db-9c96-a99eb765f70d" width="250"/></td>
    <td><img src="https://github.com/user-attachments/assets/351250bb-ffed-471c-b1d9-bb4d698ed5ee" width="250"/></td>
    <td><img src="https://github.com/user-attachments/assets/76e09e3e-1113-478f-a1c8-daa22416d0cf" width="250"/></td>
  </tr>
  <tr>
    <td width="33%"><b>Báo cáo thống kê</b><br/>Hiển thị báo cáo về hoạt động thư viện</td>
    <td width="33%"></td>
    <td width="33%"></td>
  </tr>
  <tr>
    <td><img src="https://github.com/user-attachments/assets/3df38f77-fc0e-4a5d-8189-805372c007f9" width="250"/></td>
    <td></td>
    <td></td>
  </tr>
</table>

## Quy trình sử dụng

1. Người dùng đăng ký/đăng nhập vào hệ thống
2. Người dùng tìm kiếm tài liệu từ trang chủ
3. Đăng ký mượn tài liệu qua chức năng QuanLyPhieuDangKy
4. Admin/Nhân viên xử lý phiếu đăng ký
5. Người dùng nhận thông báo và đến mượn tài liệu
6. Trả tài liệu và quản lý thông qua giao diện tương ứng

## Công nghệ

- React Native với Expo framework
- File-based routing
- UI/UX hiện đại và thân thiện người dùng

## Hướng dẫn phát triển

Bạn có thể bắt đầu phát triển bằng cách chỉnh sửa các tệp trong thư mục **app**. Dự án này sử dụng [file-based routing](https://docs.expo.dev/router/introduction).

Để tìm hiểu thêm về phát triển dự án với Expo, hãy tham khảo:
- [Tài liệu Expo](https://docs.expo.dev/)
- [Hướng dẫn Learn Expo](https://docs.expo.dev/tutorial/introduction/)

- ## Giới thiệu

PolyLib2025 là một ứng dụng quản lý thư viện hiện đại, được phát triển bằng Expo. Hệ thống hỗ trợ nhiều nhóm người dùng khác nhau với các chức năng phù hợp.

## Cài đặt

1. Cài đặt các gói phụ thuộc:
   ```bash
   npm install
   ```

2. Khởi động ứng dụng:
   ```bash
   npx expo start
   ```
