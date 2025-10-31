package ec.edu.ucuenca.eventos.controller;

import ec.edu.ucuenca.eventos.dto.UpdatePasswordRequest;
import ec.edu.ucuenca.eventos.dto.UpdateProfileRequest;
import ec.edu.ucuenca.eventos.model.User;
import ec.edu.ucuenca.eventos.security.JwtTokenProvider;
import ec.edu.ucuenca.eventos.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class UserController {
    
    private final UserService userService;
    private final JwtTokenProvider tokenProvider;
    
    @GetMapping("/me")
    public ResponseEntity<User> getCurrentUser(HttpServletRequest request) {
        Long userId = getUserIdFromRequest(request);
        User user = userService.getUserById(userId);
        return ResponseEntity.ok(user);
    }
    
    @PutMapping("/me")
    public ResponseEntity<User> updateProfile(
            HttpServletRequest request,
            @Valid @RequestBody UpdateProfileRequest updateRequest) {
        Long userId = getUserIdFromRequest(request);
        User updatedUser = userService.updateProfile(userId, updateRequest);
        return ResponseEntity.ok(updatedUser);
    }
    
    @PutMapping("/me/password")
    public ResponseEntity<Map<String, String>> updatePassword(
            HttpServletRequest request,
            @Valid @RequestBody UpdatePasswordRequest updateRequest) {
        Long userId = getUserIdFromRequest(request);
        userService.updatePassword(userId, updateRequest);
        
        Map<String, String> response = new HashMap<>();
        response.put("message", "Password updated successfully");
        return ResponseEntity.ok(response);
    }
    
    @DeleteMapping("/me")
    public ResponseEntity<Map<String, String>> deleteAccount(HttpServletRequest request) {
        Long userId = getUserIdFromRequest(request);
        userService.deleteAccount(userId);
        
        Map<String, String> response = new HashMap<>();
        response.put("message", "Account deleted successfully");
        return ResponseEntity.ok(response);
    }
    
    private Long getUserIdFromRequest(HttpServletRequest request) {
        String jwt = getJwtFromRequest(request);
        if (jwt != null) {
            return tokenProvider.getUserIdFromToken(jwt);
        }
        throw new RuntimeException("User ID not found in request");
    }
    
    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
