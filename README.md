# PolyLib2025 - Hệ thống Quản lý Thư viện

## Giới thiệu

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

## Giao diện người dùng

### Đăng nhập và Đăng ký

- **DangNhap.png**: Giao diện đăng nhập cho tất cả người dùng.
- **DangKy.png**: Giao diện đăng ký tài khoản mới.

### Giao diện người dùng thông thường (User)

- **TrangChu.png**: Màn hình chính hiển thị các tài liệu mới, phổ biến và đề xuất.
- **ThongBao.png**: Hiển thị các thông báo về trạng thái đăng ký, mượn sách và các thông tin khác.
- **QuanLyPhieuDangKy(User).png**: Cho phép người dùng quản lý các phiếu đăng ký mượn tài liệu.
- **QuanLyPhieuMuon:Tra.png**: Hiển thị các phiếu mượn hiện tại và lịch sử trả tài liệu.
- **ThongTin.png**: Hiển thị và cho phép cập nhật thông tin cá nhân của người dùng.

### Giao diện quản trị (Admin và Nhân viên)

- **QuanLySanPham.png**: Quản lý tất cả các tài liệu trong thư viện (sách, tạp chí, đĩa CD/DVD, v.v.).
- **QuanLyDanhMuc.png**: Quản lý các danh mục, thể loại của tài liệu.
- **QuanLyTaiKhoan.png**: Quản lý tài khoản người dùng, phân quyền và thông tin.
- **QuanLyPhieuDangKy.png**: Xử lý các yêu cầu đăng ký mượn từ người dùng.
- **QuanLyPhieuMuon.png**: Quản lý các phiếu mượn hiện tại.
- **PhieuTra.png**: Xử lý việc trả tài liệu từ người dùng.
- **ThongKe.png**: Hiển thị báo cáo thống kê về hoạt động thư viện, tài liệu phổ biến, v.v.

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

# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
    npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
