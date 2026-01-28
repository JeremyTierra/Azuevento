package ec.edu.ucuenca.eventos.controller;

import ec.edu.ucuenca.eventos.dto.RatingRequest;
import ec.edu.ucuenca.eventos.dto.RatingResponse;
import ec.edu.ucuenca.eventos.security.JwtTokenProvider;
import ec.edu.ucuenca.eventos.service.RatingService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/events/{eventId}/ratings")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class RatingController {
    
    private final RatingService ratingService;
    private final JwtTokenProvider tokenProvider;
    
    @PostMapping
    public ResponseEntity<RatingResponse> createOrUpdateRating(
            @PathVariable Long eventId,
            @Valid @RequestBody RatingRequest request,
            HttpServletRequest httpRequest
    ) {
        Long userId = getUserIdFromRequest(httpRequest);
        RatingResponse response = ratingService.createOrUpdateRating(userId, eventId, request);
        return ResponseEntity.ok(response);
    }
    
    @DeleteMapping
    public ResponseEntity<Map<String, String>> deleteRating(
            @PathVariable Long eventId,
            HttpServletRequest httpRequest
    ) {
        Long userId = getUserIdFromRequest(httpRequest);
        ratingService.deleteRating(userId, eventId);
        return ResponseEntity.ok(Map.of("message", "Rating deleted successfully"));
    }
    
    @GetMapping
    public ResponseEntity<List<RatingResponse>> getEventRatings(@PathVariable Long eventId) {
        List<RatingResponse> ratings = ratingService.getEventRatings(eventId);
        return ResponseEntity.ok(ratings);
    }
    
    @GetMapping("/average")
    public ResponseEntity<Map<String, Double>> getAverageRating(@PathVariable Long eventId) {
        Double average = ratingService.getAverageRating(eventId);
        return ResponseEntity.ok(Map.of("averageRating", average));
    }
    
    private Long getUserIdFromRequest(HttpServletRequest request) {
        String jwt = getJwtFromRequest(request);
        if (jwt != null) {
            return tokenProvider.getUserIdFromToken(jwt);
        }
        throw new RuntimeException("User ID not found in request");
    }
    
    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
