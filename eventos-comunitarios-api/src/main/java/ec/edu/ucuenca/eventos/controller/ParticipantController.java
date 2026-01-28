package ec.edu.ucuenca.eventos.controller;

import ec.edu.ucuenca.eventos.dto.*;
import ec.edu.ucuenca.eventos.model.AttendanceStatus;
import ec.edu.ucuenca.eventos.model.Participant;
import ec.edu.ucuenca.eventos.security.JwtTokenProvider;
import ec.edu.ucuenca.eventos.service.ParticipantService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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

    // ==================== QR Check-in Endpoints ====================

    /**
     * Get user's ticket (QR data) for an event
     */
    @GetMapping("/my-ticket")
    public ResponseEntity<TicketResponse> getMyTicket(
            @PathVariable Long eventId,
            HttpServletRequest request
    ) {
        Long userId = getUserIdFromRequest(request);
        Participant participant = participantService.getTicket(userId, eventId);

        TicketResponse response = TicketResponse.builder()
                .eventId(participant.getEvent().getId())
                .eventTitle(participant.getEvent().getTitle())
                .eventLocation(participant.getEvent().getLocation())
                .eventStartDate(participant.getEvent().getStartDate())
                .userId(participant.getUser().getId())
                .userName(participant.getUser().getName())
                .checkinToken(participant.getCheckinToken())
                .attendanceStatus(participant.getAttendanceStatus().name())
                .registrationDate(participant.getRegistrationDate())
                .checkedInAt(participant.getCheckedInAt())
                .build();

        return ResponseEntity.ok(response);
    }

    /**
     * Check-in a participant by scanning their QR code (organizer only)
     */
    @PostMapping("/checkin")
    public ResponseEntity<CheckinResponse> checkinParticipant(
            @PathVariable Long eventId,
            @Valid @RequestBody CheckinRequest checkinRequest,
            HttpServletRequest request
    ) {
        Long organizerId = getUserIdFromRequest(request);
        Participant participant = participantService.checkinByToken(
                eventId,
                checkinRequest.getToken(),
                organizerId
        );

        CheckinResponse response = CheckinResponse.builder()
                .success(true)
                .message("Check-in exitoso")
                .participantId(participant.getId())
                .userName(participant.getUser().getName())
                .userEmail(participant.getUser().getEmail())
                .checkedInAt(participant.getCheckedInAt())
                .build();

        return ResponseEntity.ok(response);
    }

    /**
     * Get attendance list for an event (organizer only)
     */
    @GetMapping("/attendance-list")
    public ResponseEntity<List<AttendanceItemResponse>> getAttendanceList(
            @PathVariable Long eventId,
            HttpServletRequest request
    ) {
        Long organizerId = getUserIdFromRequest(request);
        List<Participant> participants = participantService.getAttendanceList(eventId, organizerId);

        List<AttendanceItemResponse> response = participants.stream()
                .map(p -> AttendanceItemResponse.builder()
                        .participantId(p.getId())
                        .userId(p.getUser().getId())
                        .userName(p.getUser().getName())
                        .userEmail(p.getUser().getEmail())
                        .attendanceStatus(p.getAttendanceStatus().name())
                        .registrationDate(p.getRegistrationDate())
                        .checkedInAt(p.getCheckedInAt())
                        .hasCheckedIn(p.getCheckedInAt() != null)
                        .build())
                .collect(Collectors.toList());

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
