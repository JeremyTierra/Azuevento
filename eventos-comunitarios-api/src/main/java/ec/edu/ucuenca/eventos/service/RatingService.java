package ec.edu.ucuenca.eventos.service;

import ec.edu.ucuenca.eventos.dto.RatingRequest;
import ec.edu.ucuenca.eventos.dto.RatingResponse;
import ec.edu.ucuenca.eventos.exception.BadRequestException;
import ec.edu.ucuenca.eventos.exception.ResourceNotFoundException;
import ec.edu.ucuenca.eventos.model.Event;
import ec.edu.ucuenca.eventos.model.Rating;
import ec.edu.ucuenca.eventos.model.User;
import ec.edu.ucuenca.eventos.repository.EventRepository;
import ec.edu.ucuenca.eventos.repository.RatingRepository;
import ec.edu.ucuenca.eventos.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RatingService {
    
    private final RatingRepository ratingRepository;
    private final EventRepository eventRepository;
    private final UserRepository userRepository;
    
    @Transactional
    public RatingResponse createOrUpdateRating(Long userId, Long eventId, RatingRequest request) {
        Event event = eventRepository.findByIdAndDeletedAtIsNull(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found"));
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        // Check if rating already exists
        Rating rating = ratingRepository.findByEventIdAndUserId(eventId, userId)
                .orElse(null);
        
        if (rating != null) {
            // Update existing rating
            rating.setScore(request.getScore());
            rating.setComment(request.getComment());
        } else {
            // Create new rating
            rating = Rating.builder()
                    .event(event)
                    .user(user)
                    .score(request.getScore())
                    .comment(request.getComment())
                    .build();
        }
        
        Rating savedRating = ratingRepository.save(rating);
        return mapToRatingResponse(savedRating);
    }
    
    @Transactional
    public void deleteRating(Long userId, Long eventId) {
        Rating rating = ratingRepository.findByEventIdAndUserId(eventId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Rating not found"));
        
        ratingRepository.delete(rating);
    }
    
    @Transactional(readOnly = true)
    public List<RatingResponse> getEventRatings(Long eventId) {
        List<Rating> ratings = ratingRepository.findByEventIdOrderByCreatedAtDesc(eventId);
        
        return ratings.stream()
                .map(this::mapToRatingResponse)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public Double getAverageRating(Long eventId) {
        Double average = ratingRepository.getAverageRatingByEventId(eventId);
        return average != null ? average : 0.0;
    }
    
    private RatingResponse mapToRatingResponse(Rating rating) {
        return RatingResponse.builder()
                .id(rating.getId())
                .eventId(rating.getEvent().getId())
                .userId(rating.getUser().getId())
                .userName(rating.getUser().getName())
                .score(rating.getScore())
                .comment(rating.getComment())
                .createdAt(rating.getCreatedAt())
                .build();
    }
}
