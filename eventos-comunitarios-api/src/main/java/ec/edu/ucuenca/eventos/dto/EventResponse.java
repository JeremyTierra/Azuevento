package ec.edu.ucuenca.eventos.dto;

import ec.edu.ucuenca.eventos.model.EventStatus;
import ec.edu.ucuenca.eventos.model.EventVisibility;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventResponse {
    private Long id;
    private String title;
    private String description;
    private Long categoryId;
    private String categoryName;
    private Long organizerId;
    private String organizerName;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private String location;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private Integer maxCapacity;
    private String coverImage;
    private EventVisibility visibility;
    private EventStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Counters
    private Long participantCount;
    private Long commentCount;
    private Double averageRating;
    private Long ratingCount;
    private Long favoriteCount;
    
    // User-specific flags
    private Boolean isOrganizer;
    private Boolean hasUserRegistered;
    private Boolean isFavorite;
}
