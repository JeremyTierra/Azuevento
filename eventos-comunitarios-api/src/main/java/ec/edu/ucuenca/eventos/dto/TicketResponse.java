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
public class TicketResponse {
    private Long eventId;
    private String eventTitle;
    private String eventLocation;
    private LocalDateTime eventStartDate;
    private Long userId;
    private String userName;
    private String checkinToken;
    private String attendanceStatus;
    private LocalDateTime registrationDate;
    private LocalDateTime checkedInAt;
}
