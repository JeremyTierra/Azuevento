package ec.edu.ucuenca.eventos.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttendanceItemResponse {
    private Long participantId;
    private Long userId;
    private String userName;
    private String userEmail;
    private String attendanceStatus;
    private LocalDateTime registrationDate;
    private LocalDateTime checkedInAt;
    private boolean hasCheckedIn;
}
