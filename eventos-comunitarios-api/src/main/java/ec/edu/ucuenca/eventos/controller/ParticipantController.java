package ec.edu.ucuenca.eventos.controller;

import ec.edu.ucuenca.eventos.model.AttendanceStatus;
import ec.edu.ucuenca.eventos.security.JwtTokenProvider;
import ec.edu.ucuenca.eventos.service.ParticipantService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/events/{eventId}")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ParticipantController {
    
    private final ParticipantService participantService;
    private final JwtTokenProvider tokenProvider;
    
    @PostMapping("/attendance")
    public ResponseEntity<Map<String, String>> registerAttendance(
            @PathVariable Long eventId,
            HttpServletRequest request
    ) {
        Long userId = getUserIdFromRequest(request);
        participantService.registerAttendance(userId, eventId);
        return ResponseEntity.ok(Map.of("message", "Attendance registered successfully"));
    }
    
    @PutMapping("/attendance")
    public ResponseEntity<Map<String, String>> updateAttendanceStatus(
            @PathVariable Long eventId,
            @RequestParam AttendanceStatus status,
            HttpServletRequest request
    ) {
        Long userId = getUserIdFromRequest(request);
        participantService.updateAttendanceStatus(userId, eventId, status);
        return ResponseEntity.ok(Map.of("message", "Attendance status updated successfully"));
    }
    
    @DeleteMapping("/attendance")
    public ResponseEntity<Map<String, String>> cancelAttendance(
            @PathVariable Long eventId,
            HttpServletRequest request
    ) {
        Long userId = getUserIdFromRequest(request);
        participantService.cancelAttendance(userId, eventId);
        return ResponseEntity.ok(Map.of("message", "Attendance cancelled successfully"));
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
