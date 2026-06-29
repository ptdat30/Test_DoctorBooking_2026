package com.doctorbooking.backend.controller;

import com.doctorbooking.backend.dto.request.ChangePasswordRequest;
import com.doctorbooking.backend.dto.request.UpdateUserRequest;
import com.doctorbooking.backend.dto.request.UserRequest;
import com.doctorbooking.backend.dto.response.UserResponse;
import com.doctorbooking.backend.service.UserService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("UserController Unit Tests")
class UserControllerTest {

    @Mock
    private UserService userService;

    @InjectMocks
    private UserController controller;

    @Test
    @DisplayName("getAllUsers không search → getAllUsers")
    void getAllUsers_noSearch() {
        when(userService.getAllUsers()).thenReturn(List.of());
        ResponseEntity<List<UserResponse>> result = controller.getAllUsers(null);
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(userService).getAllUsers();
    }

    @Test
    @DisplayName("getAllUsers có search → searchUsers")
    void getAllUsers_withSearch() {
        when(userService.searchUsers("an")).thenReturn(List.of());
        ResponseEntity<List<UserResponse>> result = controller.getAllUsers("an");
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(userService).searchUsers("an");
    }

    @Test
    @DisplayName("getAllUsers search rỗng (blank) → getAllUsers")
    void getAllUsers_blankSearch() {
        when(userService.getAllUsers()).thenReturn(List.of());
        controller.getAllUsers("   ");
        verify(userService).getAllUsers();
    }

    @Test
    @DisplayName("getUserById tồn tại → 200")
    void getUserById_found() {
        when(userService.getUserById(1L)).thenReturn(mock(UserResponse.class));
        ResponseEntity<UserResponse> result = controller.getUserById(1L);
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("getUserById không tồn tại → 404")
    void getUserById_notFound() {
        when(userService.getUserById(1L)).thenThrow(new RuntimeException("not found"));
        ResponseEntity<UserResponse> result = controller.getUserById(1L);
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    @DisplayName("createUser thành công → 201")
    void createUser_success() {
        UserRequest req = new UserRequest();
        when(userService.createUser(req)).thenReturn(mock(UserResponse.class));
        ResponseEntity<?> result = controller.createUser(req);
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.CREATED);
    }

    @Test
    @DisplayName("createUser lỗi → 400")
    void createUser_badRequest() {
        UserRequest req = new UserRequest();
        when(userService.createUser(req)).thenThrow(new RuntimeException("dup"));
        ResponseEntity<?> result = controller.createUser(req);
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    @DisplayName("updateUser thành công → 200")
    void updateUser_success() {
        UpdateUserRequest req = new UpdateUserRequest();
        when(userService.updateUser(1L, req)).thenReturn(mock(UserResponse.class));
        ResponseEntity<?> result = controller.updateUser(1L, req);
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("updateUser lỗi → 400")
    void updateUser_badRequest() {
        UpdateUserRequest req = new UpdateUserRequest();
        when(userService.updateUser(1L, req)).thenThrow(new RuntimeException("err"));
        ResponseEntity<?> result = controller.updateUser(1L, req);
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    @DisplayName("deleteUser thành công → 204")
    void deleteUser_success() {
        doNothing().when(userService).deleteUser(1L);
        ResponseEntity<?> result = controller.deleteUser(1L);
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
    }

    @Test
    @DisplayName("deleteUser còn ràng buộc dữ liệu → 409 CONFLICT")
    void deleteUser_dataIntegrity_conflict() {
        doThrow(new DataIntegrityViolationException("fk")).when(userService).deleteUser(1L);
        ResponseEntity<?> result = controller.deleteUser(1L);
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    @DisplayName("deleteUser not found → 404")
    void deleteUser_notFound() {
        doThrow(new RuntimeException("user not found")).when(userService).deleteUser(1L);
        ResponseEntity<?> result = controller.deleteUser(1L);
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    @DisplayName("deleteUser lỗi khác → 400")
    void deleteUser_otherError_badRequest() {
        doThrow(new RuntimeException("some other error")).when(userService).deleteUser(1L);
        ResponseEntity<?> result = controller.deleteUser(1L);
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    @DisplayName("toggleUserStatus thành công → 200")
    void toggleUserStatus_success() {
        when(userService.toggleUserStatus(1L)).thenReturn(mock(UserResponse.class));
        ResponseEntity<UserResponse> result = controller.toggleUserStatus(1L);
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("toggleUserStatus không tồn tại → 404")
    void toggleUserStatus_notFound() {
        when(userService.toggleUserStatus(1L)).thenThrow(new RuntimeException("not found"));
        ResponseEntity<UserResponse> result = controller.toggleUserStatus(1L);
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    @DisplayName("changePassword thành công → 200")
    void changePassword_success() {
        ChangePasswordRequest req = new ChangePasswordRequest();
        doNothing().when(userService).changeUserPassword(1L, req);
        ResponseEntity<String> result = controller.changePassword(1L, req);
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("changePassword lỗi → 400")
    void changePassword_badRequest() {
        ChangePasswordRequest req = new ChangePasswordRequest();
        doThrow(new RuntimeException("wrong")).when(userService).changeUserPassword(1L, req);
        ResponseEntity<String> result = controller.changePassword(1L, req);
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }
}
