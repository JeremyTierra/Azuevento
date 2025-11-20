package ec.edu.ucuenca.eventos.controller;

import ec.edu.ucuenca.eventos.dto.EventRequest;
import ec.edu.ucuenca.eventos.dto.EventResponse;
import ec.edu.ucuenca.eventos.security.JwtTokenProvider;
import ec.edu.ucuenca.eventos.service.EventService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class EventController {
    
    private final EventService eventService;
    private final JwtTokenProvider tokenProvider;
    
    @PostMapping
    public ResponseEntity<EventResponse> createEvent(
            @Valid @RequestBody EventRequest request,
            HttpServletRequest httpRequest
    ) {
        Long userId = getUserIdFromRequest(httpRequest);
        EventResponse response = eventService.createEvent(userId, request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<EventResponse> updateEvent(
            @PathVariable Long id,
            @Valid @RequestBody EventRequest request,
            HttpServletRequest httpRequest
    ) {
        Long userId = getUserIdFromRequest(httpRequest);
        EventResponse response = eventService.updateEvent(userId, id, request);
        return ResponseEntity.ok(response);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteEvent(
            @PathVariable Long id,
            HttpServletRequest httpRequest
    ) {
        Long userId = getUserIdFromRequest(httpRequest);
        eventService.deleteEvent(userId, id);
        return ResponseEntity.ok(Map.of("message", "Event deleted successfully"));
    }
    
    @PostMapping("/{id}/publish")
    public ResponseEntity<Map<String, String>> publishEvent(
            @PathVariable Long id,
            HttpServletRequest httpRequest
    ) {
        Long userId = getUserIdFromRequest(httpRequest);
        eventService.publishEvent(userId, id);
        return ResponseEntity.ok(Map.of("message", "Event published successfully"));
    }
    
    @PostMapping("/{id}/cancel")
    public ResponseEntity<Map<String, String>> cancelEvent(
            @PathVariable Long id,
            HttpServletRequest httpRequest
    ) {
        Long userId = getUserIdFromRequest(httpRequest);
        eventService.cancelEvent(userId, id);
        return ResponseEntity.ok(Map.of("message", "Event cancelled successfully"));
    }
    
    @PostMapping("/{id}/archive")
    public ResponseEntity<Map<String, String>> archiveEvent(
            @PathVariable Long id,
            HttpServletRequest httpRequest
    ) {
        Long userId = getUserIdFromRequest(httpRequest);
        eventService.archiveEvent(userId, id);
        return ResponseEntity.ok(Map.of("message", "Event archived successfully"));
    }
    
    @GetMapping
    public ResponseEntity<List<EventResponse>> getPublicEvents(HttpServletRequest httpRequest) {
        Long userId = getUserIdFromRequestOptional(httpRequest);
        List<EventResponse> events = eventService.getPublicEvents(userId);
        return ResponseEntity.ok(events);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<EventResponse> getEventById(
            @PathVariable Long id,
            HttpServletRequest httpRequest
    ) {
        Long userId = getUserIdFromRequestOptional(httpRequest);
        EventResponse event = eventService.getEventById(id, userId);
        return ResponseEntity.ok(event);
    }
    
    @GetMapping("/my-events")
    public ResponseEntity<List<EventResponse>> getMyEvents(HttpServletRequest httpRequest) {
        Long userId = getUserIdFromRequest(httpRequest);
        List<EventResponse> events = eventService.getMyEvents(userId);
        return ResponseEntity.ok(events);
    }

    @GetMapping("/attending")
    public ResponseEntity<List<EventResponse>> getAttendingEvents(HttpServletRequest httpRequest) {
        Long userId = getUserIdFromRequest(httpRequest);
        List<EventResponse> events = eventService.getAttendingEvents(userId);
        return ResponseEntity.ok(events);
    }

    @GetMapping("/search")
    public ResponseEntity<List<EventResponse>> searchEvents(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Long categoryId,
            HttpServletRequest httpRequest
    ) {
        Long userId = getUserIdFromRequestOptional(httpRequest);
        List<EventResponse> events = eventService.searchEvents(q, categoryId, userId);
        return ResponseEntity.ok(events);
    }
    
    private Long getUserIdFromRequest(HttpServletRequest request) {
        String jwt = getJwtFromRequest(request);
        if (jwt != null) {
            return tokenProvider.getUserIdFromToken(jwt);
        }
        throw new RuntimeException("User ID not found in request");
    }
    
    private Long getUserIdFromRequestOptional(HttpServletRequest request) {
        String jwt = getJwtFromRequest(request);
        if (jwt != null && tokenProvider.validateToken(jwt)) {
            return tokenProvider.getUserIdFromToken(jwt);
        }
        return null;
    }
    
    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
