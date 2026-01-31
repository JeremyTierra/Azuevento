package ec.edu.ucuenca.eventos.service;

import ec.edu.ucuenca.eventos.exception.BadRequestException;
import ec.edu.ucuenca.eventos.exception.ResourceNotFoundException;
import ec.edu.ucuenca.eventos.model.AttendanceStatus;
import ec.edu.ucuenca.eventos.model.Event;
import ec.edu.ucuenca.eventos.model.Participant;
import ec.edu.ucuenca.eventos.model.User;
import ec.edu.ucuenca.eventos.repository.EventRepository;
import ec.edu.ucuenca.eventos.repository.ParticipantRepository;
import ec.edu.ucuenca.eventos.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ParticipantService {
    
    private final ParticipantRepository participantRepository;
    private final EventRepository eventRepository;
    private final UserRepository userRepository;
    
    @Transactional
    public void registerAttendance(Long userId, Long eventId) {
        Event event = eventRepository.findByIdAndDeletedAtIsNull(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found"));
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        // Validate event can accept attendance
        if (!event.canAcceptAttendance()) {
            throw new BadRequestException(
                    "Cannot register attendance for cancelled or archived events"
            );
        }
        
        // Check if user already registered
        if (participantRepository.existsByEventIdAndUserId(eventId, userId)) {
            throw new BadRequestException("User already registered for this event");
        }
        
        // Generate unique check-in token
        String checkinToken = generateCheckinToken();

        Participant participant = Participant.builder()
                .event(event)
                .user(user)
                .attendanceStatus(AttendanceStatus.CONFIRMED)
                .checkinToken(checkinToken)
                .build();

        participantRepository.save(participant);
    }

    private String generateCheckinToken() {
        SecureRandom random = new SecureRandom();
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
    
    @Transactional
    public void updateAttendanceStatus(Long userId, Long eventId, AttendanceStatus status) {
        Participant participant = participantRepository.findByEventIdAndUserId(eventId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Attendance record not found"));
        
        participant.setAttendanceStatus(status);
        participantRepository.save(participant);
    }
    
    @Transactional
    public void cancelAttendance(Long userId, Long eventId) {
        Participant participant = participantRepository.findByEventIdAndUserId(eventId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Attendance record not found"));

        participantRepository.delete(participant);
    }

    // ==================== QR Check-in Methods ====================

    /**
     * Get user's ticket (QR token) for an event
     */
    public Participant getTicket(Long userId, Long eventId) {
        Participant participant = participantRepository.findByEventIdAndUserId(eventId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("No estás registrado en este evento"));

        // Generate token if doesn't exist (for existing participants)
        if (participant.getCheckinToken() == null) {
            participant.setCheckinToken(generateCheckinToken());
            participantRepository.save(participant);
        }

        return participant;
    }

    /**
     * Validate QR token and mark attendance (used by organizer)
     */
    @Transactional
    public Participant checkinByToken(Long eventId, String token, Long organizerId) {
        // Verify organizer owns the event
        Event event = eventRepository.findByIdAndDeletedAtIsNull(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Evento no encontrado"));

        if (!event.getOrganizer().getId().equals(organizerId)) {
            throw new BadRequestException("Solo el organizador puede hacer check-in de asistentes");
        }

        // Find participant by token
        Participant participant = participantRepository.findByEventIdAndCheckinToken(eventId, token)
                .orElseThrow(() -> new ResourceNotFoundException("Código QR inválido o no pertenece a este evento"));

        // Check if already checked in
        if (participant.getCheckedInAt() != null) {
            throw new BadRequestException("Este asistente ya hizo check-in a las " +
                    participant.getCheckedInAt().toLocalTime());
        }

        // Mark as attended
        participant.setAttendanceStatus(AttendanceStatus.ATTENDED);
        participant.setCheckedInAt(LocalDateTime.now());

        return participantRepository.save(participant);
    }

    /**
     * Get attendance list for an event (for organizer)
     */
    public List<Participant> getAttendanceList(Long eventId, Long organizerId) {
        Event event = eventRepository.findByIdAndDeletedAtIsNull(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Evento no encontrado"));

        if (!event.getOrganizer().getId().equals(organizerId)) {
            throw new BadRequestException("Solo el organizador puede ver la lista de asistencia");
        }

        return participantRepository.findByEventId(eventId);
    }
}
