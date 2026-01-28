package ec.edu.ucuenca.eventos.service;

import ec.edu.ucuenca.eventos.dto.EventResponse;
import ec.edu.ucuenca.eventos.exception.BadRequestException;
import ec.edu.ucuenca.eventos.exception.ResourceNotFoundException;
import ec.edu.ucuenca.eventos.model.Event;
import ec.edu.ucuenca.eventos.model.Favorite;
import ec.edu.ucuenca.eventos.model.User;
import ec.edu.ucuenca.eventos.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FavoriteService {
    
    private final FavoriteRepository favoriteRepository;
    private final EventRepository eventRepository;
    private final UserRepository userRepository;
    private final ParticipantRepository participantRepository;
    private final CommentRepository commentRepository;
    private final RatingRepository ratingRepository;
    
    @Transactional
    public void addFavorite(Long userId, Long eventId) {
        Event event = eventRepository.findByIdAndDeletedAtIsNull(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found"));
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        // Check if already favorited
        if (favoriteRepository.existsByEventIdAndUserId(eventId, userId)) {
            throw new BadRequestException("Event already in favorites");
        }
        
        Favorite favorite = Favorite.builder()
                .event(event)
                .user(user)
                .build();
        
        favoriteRepository.save(favorite);
    }
    
    @Transactional
    public void removeFavorite(Long userId, Long eventId) {
        if (!favoriteRepository.existsByEventIdAndUserId(eventId, userId)) {
            throw new ResourceNotFoundException("Favorite not found");
        }
        
        favoriteRepository.deleteByEventIdAndUserId(eventId, userId);
    }
    
    @Transactional(readOnly = true)
    public List<EventResponse> getUserFavorites(Long userId) {
        List<Event> favoriteEvents = favoriteRepository.findFavoriteEventsByUserId(userId);
        
        return favoriteEvents.stream()
                .map(event -> mapToEventResponse(event, userId))
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public boolean isFavorite(Long userId, Long eventId) {
        return favoriteRepository.existsByEventIdAndUserId(eventId, userId);
    }
    
    private EventResponse mapToEventResponse(Event event, Long userId) {
        // Similar mapping as in EventService
        Long participantCount = participantRepository.countByEventId(event.getId());
        Long commentCount = commentRepository.countByEventId(event.getId());
        Double averageRating = ratingRepository.getAverageRatingByEventId(event.getId());
        Long ratingCount = ratingRepository.countByEventId(event.getId());
        Long favoriteCount = favoriteRepository.countByEventId(event.getId());
        
        Boolean hasUserRegistered = participantRepository.existsByEventIdAndUserId(event.getId(), userId);
        Boolean isFavorite = favoriteRepository.existsByEventIdAndUserId(event.getId(), userId);
        Boolean isOrganizer = event.getOrganizer() != null && 
                              event.getOrganizer().getId().equals(userId);
        
        return EventResponse.builder()
                .id(event.getId())
                .title(event.getTitle())
                .description(event.getDescription())
                .categoryId(event.getCategory() != null ? event.getCategory().getId() : null)
                .categoryName(event.getCategory() != null ? event.getCategory().getName() : null)
                .organizerId(event.getOrganizer() != null ? event.getOrganizer().getId() : null)
                .organizerName(event.getOrganizer() != null ? event.getOrganizer().getName() : null)
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
}
