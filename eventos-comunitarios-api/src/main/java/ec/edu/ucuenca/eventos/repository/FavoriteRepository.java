package ec.edu.ucuenca.eventos.repository;

import ec.edu.ucuenca.eventos.model.Favorite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FavoriteRepository extends JpaRepository<Favorite, Long> {
    
    Optional<Favorite> findByEventIdAndUserId(Long eventId, Long userId);
    
    List<Favorite> findByUserIdOrderByCreatedAtDesc(Long userId);
    
    Boolean existsByEventIdAndUserId(Long eventId, Long userId);
    
    void deleteByEventIdAndUserId(Long eventId, Long userId);
    
    Long countByEventId(Long eventId);
    
    @Query("SELECT f.event FROM Favorite f WHERE f.user.id = :userId ORDER BY f.createdAt DESC")
    List<ec.edu.ucuenca.eventos.model.Event> findFavoriteEventsByUserId(@Param("userId") Long userId);
}
