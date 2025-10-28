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
public class RatingResponse {
    private Long id;
    private Long eventId;
    private Long userId;
    private String userName;
    private Integer score;
    private String comment;
    private LocalDateTime createdAt;
}
