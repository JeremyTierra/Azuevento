package ec.edu.ucuenca.eventos.repository;

import ec.edu.ucuenca.eventos.model.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {
    
    List<Comment> findByEventIdOrderByCreatedAtDesc(Long eventId);
    
    List<Comment> findByUserIdOrderByCreatedAtDesc(Long userId);
    
    Long countByEventId(Long eventId);
}
