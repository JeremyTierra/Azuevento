package ec.edu.ucuenca.eventos.controller;

import ec.edu.ucuenca.eventos.dto.EventResponse;
import ec.edu.ucuenca.eventos.security.JwtTokenProvider;
import ec.edu.ucuenca.eventos.service.FavoriteService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class FavoriteController {
    
    private final FavoriteService favoriteService;
    private final JwtTokenProvider tokenProvider;
    
    @PostMapping("/events/{eventId}/favorite")
    public ResponseEntity<Map<String, Object>> addFavorite(
            @PathVariable Long eventId,
            HttpServletRequest httpRequest
    ) {
        Long userId = getUserIdFromRequest(httpRequest);
        favoriteService.addFavorite(userId, eventId);
        return ResponseEntity.ok(Map.of(
                "message", "Event added to favorites",
                "isFavorite", true
        ));
    }
    
    @DeleteMapping("/events/{eventId}/favorite")
    public ResponseEntity<Map<String, Object>> removeFavorite(
            @PathVariable Long eventId,
            HttpServletRequest httpRequest
    ) {
        Long userId = getUserIdFromRequest(httpRequest);
        favoriteService.removeFavorite(userId, eventId);
        return ResponseEntity.ok(Map.of(
                "message", "Event removed from favorites",
                "isFavorite", false
        ));
    }
    
    @GetMapping("/users/favorites")
    public ResponseEntity<List<EventResponse>> getUserFavorites(HttpServletRequest httpRequest) {
        Long userId = getUserIdFromRequest(httpRequest);
        List<EventResponse> favorites = favoriteService.getUserFavorites(userId);
        return ResponseEntity.ok(favorites);
    }
    
    @GetMapping("/events/{eventId}/favorite/check")
    public ResponseEntity<Map<String, Boolean>> checkFavorite(
            @PathVariable Long eventId,
            HttpServletRequest httpRequest
    ) {
        Long userId = getUserIdFromRequest(httpRequest);
        boolean isFavorite = favoriteService.isFavorite(userId, eventId);
        return ResponseEntity.ok(Map.of("isFavorite", isFavorite));
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
