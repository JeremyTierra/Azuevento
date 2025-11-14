package ec.edu.ucuenca.eventos.repository;

import ec.edu.ucuenca.eventos.model.Event;
import ec.edu.ucuenca.eventos.model.EventStatus;
import ec.edu.ucuenca.eventos.model.EventVisibility;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {
    
    // Find all public and published events (not deleted)
    List<Event> findByVisibilityAndStatusAndDeletedAtIsNull(
        EventVisibility visibility, 
        EventStatus status
    );
    
    // Find events by organizer
    List<Event> findByOrganizerIdAndDeletedAtIsNull(Long organizerId);
    
    // Find event by id (not deleted)
    Optional<Event> findByIdAndDeletedAtIsNull(Long id);
    
    // Search events by title (case-insensitive)
    @Query("SELECT e FROM Event e WHERE " +
           "LOWER(e.title) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "AND e.visibility = :visibility " +
           "AND e.status = :status " +
           "AND e.deletedAt IS NULL")
    List<Event> searchByTitle(
        @Param("query") String query,
        @Param("visibility") EventVisibility visibility,
        @Param("status") EventStatus status
    );
    
    // Search events by title and category
    @Query("SELECT e FROM Event e WHERE " +
           "LOWER(e.title) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "AND e.category.id = :categoryId " +
           "AND e.visibility = :visibility " +
           "AND e.status = :status " +
           "AND e.deletedAt IS NULL")
    List<Event> searchByTitleAndCategory(
        @Param("query") String query,
        @Param("categoryId") Long categoryId,
        @Param("visibility") EventVisibility visibility,
        @Param("status") EventStatus status
    );
    
    // Find by category
    List<Event> findByCategoryIdAndVisibilityAndStatusAndDeletedAtIsNull(
        Long categoryId,
        EventVisibility visibility,
        EventStatus status
    );
}
