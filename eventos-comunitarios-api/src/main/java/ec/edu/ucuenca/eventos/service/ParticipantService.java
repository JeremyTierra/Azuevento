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
        
        Participant participant = Participant.builder()
                .event(event)
                .user(user)
                .attendanceStatus(AttendanceStatus.CONFIRMED)
                .build();
        
        participantRepository.save(participant);
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
}
