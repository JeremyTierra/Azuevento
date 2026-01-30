package ec.edu.ucuenca.eventos.service;

import ec.edu.ucuenca.eventos.dto.EventRequest;
import ec.edu.ucuenca.eventos.dto.EventResponse;
import ec.edu.ucuenca.eventos.exception.BadRequestException;
import ec.edu.ucuenca.eventos.exception.ResourceNotFoundException;
import ec.edu.ucuenca.eventos.exception.UnauthorizedException;
import ec.edu.ucuenca.eventos.model.*;
import ec.edu.ucuenca.eventos.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EventService {
    
    private final EventRepository eventRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final ParticipantRepository participantRepository;
    private final CommentRepository commentRepository;
    private final RatingRepository ratingRepository;
    private final FavoriteRepository favoriteRepository;
    
    @Transactional
    public EventResponse createEvent(Long userId, EventRequest request) {
        User organizer = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
        
        // Validate dates
        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw new BadRequestException("End date must be after start date");
        }
        
        Event event = Event.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .category(category)
                .organizer(organizer)
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .location(request.getLocation())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .maxCapacity(request.getMaxCapacity())
                .coverImage(request.getCoverImage())
                .visibility(request.getVisibility() != null ? request.getVisibility() : EventVisibility.PUBLIC)
                .status(EventStatus.DRAFT)
                .build();
        
        Event savedEvent = eventRepository.save(event);
        return mapToEventResponse(savedEvent, userId);
    }
    
    @Transactional
    public EventResponse updateEvent(Long userId, Long eventId, EventRequest request) {
        Event event = eventRepository.findByIdAndDeletedAtIsNull(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found"));
        
        // Check if user is organizer
        if (!event.getOrganizer().getId().equals(userId)) {
            throw new UnauthorizedException("Only the event organizer can update this event");
        }
        
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
        
        // Validate dates
        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw new BadRequestException("End date must be after start date");
        }
        
        event.setTitle(request.getTitle());
        event.setDescription(request.getDescription());
        event.setCategory(category);
        event.setStartDate(request.getStartDate());
        event.setEndDate(request.getEndDate());
        event.setLocation(request.getLocation());
        event.setLatitude(request.getLatitude());
        event.setLongitude(request.getLongitude());
        event.setMaxCapacity(request.getMaxCapacity());
        event.setCoverImage(request.getCoverImage());
        if (request.getVisibility() != null) {
            event.setVisibility(request.getVisibility());
        }
        
        Event updatedEvent = eventRepository.save(event);
        return mapToEventResponse(updatedEvent, userId);
    }
    
    @Transactional
    public void publishEvent(Long userId, Long eventId) {
        Event event = eventRepository.findByIdAndDeletedAtIsNull(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found"));
        
        if (!event.getOrganizer().getId().equals(userId)) {
            throw new UnauthorizedException("Only the event organizer can publish this event");
        }
        
        if (event.getStatus() != EventStatus.DRAFT) {
            throw new BadRequestException("Only draft events can be published");
        }
        
        event.setStatus(EventStatus.PUBLISHED);
        eventRepository.save(event);
    }
    
    @Transactional
    public void cancelEvent(Long userId, Long eventId) {
        Event event = eventRepository.findByIdAndDeletedAtIsNull(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found"));
        
        if (!event.getOrganizer().getId().equals(userId)) {
            throw new UnauthorizedException("Only the event organizer can cancel this event");
        }
        
        if (event.getStatus() != EventStatus.PUBLISHED) {
            throw new BadRequestException("Only published events can be cancelled");
        }
        
        event.setStatus(EventStatus.CANCELLED);
        eventRepository.save(event);
    }
    
    @Transactional
    public void archiveEvent(Long userId, Long eventId) {
        Event event = eventRepository.findByIdAndDeletedAtIsNull(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found"));
        
        if (!event.getOrganizer().getId().equals(userId)) {
            throw new UnauthorizedException("Only the event organizer can archive this event");
        }
        
        if (event.getStatus() != EventStatus.PUBLISHED && event.getStatus() != EventStatus.CANCELLED) {
            throw new BadRequestException("Only published or cancelled events can be archived");
        }
        
        event.setStatus(EventStatus.ARCHIVED);
        eventRepository.save(event);
    }
    
    @Transactional
    public void deleteEvent(Long userId, Long eventId) {
        Event event = eventRepository.findByIdAndDeletedAtIsNull(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found"));
        
        if (!event.getOrganizer().getId().equals(userId)) {
            throw new UnauthorizedException("Only the event organizer can delete this event");
        }
        
        // Soft delete
        event.setDeletedAt(LocalDateTime.now());
        eventRepository.save(event);
    }
    
    @Transactional(readOnly = true)
    public List<EventResponse> getPublicEvents(Long userId) {
        List<Event> events = eventRepository.findByVisibilityAndStatusAndDeletedAtIsNull(
                EventVisibility.PUBLIC, 
                EventStatus.PUBLISHED
        );
        
        return events.stream()
                .map(event -> mapToEventResponse(event, userId))
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public EventResponse getEventById(Long eventId, Long userId) {
        Event event = eventRepository.findByIdAndDeletedAtIsNull(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found"));
        
        return mapToEventResponse(event, userId);
    }
    
    @Transactional(readOnly = true)
    public List<EventResponse> getMyEvents(Long userId) {
        List<Event> events = eventRepository.findByOrganizerIdAndDeletedAtIsNull(userId);

        return events.stream()
                .map(event -> mapToEventResponse(event, userId))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<EventResponse> getAttendingEvents(Long userId) {
        // Get all participations for this user
        List<Participant> participations = participantRepository.findByUserId(userId);

        // Map to events, filtering out deleted events and events where user is organizer
        return participations.stream()
                .map(Participant::getEvent)
                .filter(event -> event.getDeletedAt() == null)
                .filter(event -> !event.getOrganizer().getId().equals(userId))
                .map(event -> mapToEventResponse(event, userId))
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<EventResponse> searchEvents(String query, Long categoryId, Long userId) {
        List<Event> events;
        
        if (query != null && !query.trim().isEmpty() && categoryId != null) {
            events = eventRepository.searchByTitleAndCategory(
                    query, 
                    categoryId, 
                    EventVisibility.PUBLIC, 
                    EventStatus.PUBLISHED
            );
        } else if (query != null && !query.trim().isEmpty()) {
            events = eventRepository.searchByTitle(
                    query, 
                    EventVisibility.PUBLIC, 
                    EventStatus.PUBLISHED
            );
        } else if (categoryId != null) {
            events = eventRepository.findByCategoryIdAndVisibilityAndStatusAndDeletedAtIsNull(
                    categoryId, 
                    EventVisibility.PUBLIC, 
                    EventStatus.PUBLISHED
            );
        } else {
            events = getPublicEvents(userId).stream()
                    .map(this::mapResponseToEvent)
                    .collect(Collectors.toList());
        }
        
        return events.stream()
                .map(event -> mapToEventResponse(event, userId))
                .collect(Collectors.toList());
    }
    
    private EventResponse mapToEventResponse(Event event, Long userId) {
        Long participantCount = participantRepository.countByEventId(event.getId());
        Long commentCount = commentRepository.countByEventId(event.getId());
        Double averageRating = ratingRepository.getAverageRatingByEventId(event.getId());
        Long ratingCount = ratingRepository.countByEventId(event.getId());
        Long favoriteCount = favoriteRepository.countByEventId(event.getId());
        
        Boolean hasUserRegistered = false;
        Boolean isFavorite = false;
        Boolean isOrganizer = false;
        
        if (userId != null) {
            hasUserRegistered = participantRepository.existsByEventIdAndUserId(event.getId(), userId);
            isFavorite = favoriteRepository.existsByEventIdAndUserId(event.getId(), userId);
            isOrganizer = event.getOrganizer().getId().equals(userId);
        }
        
        return EventResponse.builder()
                .id(event.getId())
                .title(event.getTitle())
                .description(event.getDescription())
                .categoryId(event.getCategory().getId())
                .categoryName(event.getCategory().getName())
                .organizerId(event.getOrganizer().getId())
                .organizerName(event.getOrganizer().getName())
                .startDate(event.getStartDate())
                .endDate(event.getEndDate())
                .location(event.getLocation())
                .latitude(event.getLatitude())
                .longitude(event.getLongitude())
                .maxCapacity(event.getMaxCapacity())
                .coverImage(event.getCoverImage())
                .visibility(event.getVisibility())
                .status(event.getStatus())
                .createdAt(event.getCreatedAt())
                .updatedAt(event.getUpdatedAt())
                .participantCount(participantCount)
                .commentCount(commentCount)
                .averageRating(averageRating)
                .ratingCount(ratingCount)
                .favoriteCount(favoriteCount)
                .isOrganizer(isOrganizer)
                .hasUserRegistered(hasUserRegistered)
                .isFavorite(isFavorite)
                .build();
    }
    
    private Event mapResponseToEvent(EventResponse response) {
        // This is a simplified mapping for internal use only
        // In practice, you should fetch from repository
        return eventRepository.findById(response.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Event not found"));
    }
}
