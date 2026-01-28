package ec.edu.ucuenca.eventos.repository;

import ec.edu.ucuenca.eventos.model.Rating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RatingRepository extends JpaRepository<Rating, Long> {
    
    Optional<Rating> findByEventIdAndUserId(Long eventId, Long userId);
    
    List<Rating> findByEventIdOrderByCreatedAtDesc(Long eventId);
    
    Boolean existsByEventIdAndUserId(Long eventId, Long userId);
    
    Long countByEventId(Long eventId);
    
    @Query("SELECT AVG(r.score) FROM Rating r WHERE r.event.id = :eventId")
    Double getAverageRatingByEventId(@Param("eventId") Long eventId);
}
