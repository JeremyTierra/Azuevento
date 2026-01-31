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
public class CheckinResponse {
    private boolean success;
    private String message;
    private Long participantId;
    private String userName;
    private String userEmail;
    private LocalDateTime checkedInAt;
}
