package ec.edu.ucuenca.eventos.repository;

import ec.edu.ucuenca.eventos.model.Participant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ParticipantRepository extends JpaRepository<Participant, Long> {
    
    Optional<Participant> findByEventIdAndUserId(Long eventId, Long userId);
    
    List<Participant> findByEventId(Long eventId);
    
    List<Participant> findByUserId(Long userId);
    
    Boolean existsByEventIdAndUserId(Long eventId, Long userId);

    Long countByEventId(Long eventId);

    // QR Check-in methods
    Optional<Participant> findByCheckinToken(String checkinToken);

    Optional<Participant> findByEventIdAndCheckinToken(Long eventId, String checkinToken);
}
