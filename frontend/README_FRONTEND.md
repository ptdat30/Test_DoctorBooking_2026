# Frontend Setup Guide

## Đã hoàn thành Phase 1: Setup & Authentication

### Cấu trúc thư mục:
<!-- AUTO-GENERATED-START: FOLDER_TREE -->
```
Folder PATH listing for volume Windows-SSD
Volume serial number is 0027-8218
C:\USERS\DAT\ONEDRIVE - UT.EDU.VN\DOCUMENTS\DESKTOP\REPO\FRONTEND\SRC
+---assets
+---components
|   +---admin
|   +---common
|   +---doctor
|   \---patient
+---config
+---contexts
+---data
+---hooks
+---mockData
|   +---admin
|   +---doctor
|   \---patient
+---pages
|   +---admin
|   |   +---appointments
|   |   +---doctors
|   |   +---patients
|   |   \---users
|   +---auth
|   +---doctor
|   \---patient
+---services
+---styles
\---utils
```
<!-- AUTO-GENERATED-END: FOLDER_TREE -->

## Cách chạy:

1. **Cài đặt dependencies** (nếu chưa cài):
```bash
cd frontend
npm install
```

2. **Tạo file .env** (nếu cần thay đổi API URL):
```bash
# Tạo file .env trong thư mục frontend
VITE_API_BASE_URL=http://localhost:8080/api
```

3. **Chạy development server**:
```bash
npm run dev
```

Frontend sẽ chạy tại: `http://localhost:5173`

## Features đã implement:

✅ **Authentication Flow**
- Login với username/password
- Register cho Patient
- Auto redirect dựa trên role sau login
- JWT token management
- Auto logout khi token hết hạn

✅ **Route Protection**
- ProtectedRoute component
- Role-based access control
- Auto redirect to login nếu chưa authenticated

✅ **UI Components**
- Login page
- Register page
- Loading component
- Error message component
- 404 page

✅ **API Integration**
- Axios configuration với interceptors
- Auto attach JWT token to requests
- Auto handle 401 errors

## Testing:

1. Mở browser tại `http://localhost:5173`
2. Bạn sẽ được redirect đến `/login`
3. Test register một patient mới
4. Test login với credentials vừa tạo
5. Sau login, sẽ được redirect đến dashboard tương ứng với role

## Next Steps:

- Phase 2: Admin Dashboard và các features
- Phase 3: Doctor Dashboard và các features  
- Phase 4: Patient Dashboard và các features

