package ec.edu.ucuenca.eventos.controller;

import ec.edu.ucuenca.eventos.dto.CommentRequest;
import ec.edu.ucuenca.eventos.dto.CommentResponse;
import ec.edu.ucuenca.eventos.security.JwtTokenProvider;
import ec.edu.ucuenca.eventos.service.CommentService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/events/{eventId}/comments")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CommentController {
    
    private final CommentService commentService;
    private final JwtTokenProvider tokenProvider;
    
    @PostMapping
    public ResponseEntity<CommentResponse> createComment(
            @PathVariable Long eventId,
            @Valid @RequestBody CommentRequest request,
            HttpServletRequest httpRequest
    ) {
        Long userId = getUserIdFromRequest(httpRequest);
        CommentResponse response = commentService.createComment(userId, eventId, request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }
    
    @PutMapping("/{commentId}")
    public ResponseEntity<CommentResponse> updateComment(
            @PathVariable Long eventId,
            @PathVariable Long commentId,
            @Valid @RequestBody CommentRequest request,
            HttpServletRequest httpRequest
    ) {
        Long userId = getUserIdFromRequest(httpRequest);
        CommentResponse response = commentService.updateComment(userId, commentId, request);
        return ResponseEntity.ok(response);
    }
    
    @DeleteMapping("/{commentId}")
    public ResponseEntity<Map<String, String>> deleteComment(
            @PathVariable Long eventId,
            @PathVariable Long commentId,
            HttpServletRequest httpRequest
    ) {
        Long userId = getUserIdFromRequest(httpRequest);
        commentService.deleteComment(userId, commentId);
        return ResponseEntity.ok(Map.of("message", "Comment deleted successfully"));
    }
    
    @GetMapping
    public ResponseEntity<List<CommentResponse>> getEventComments(
            @PathVariable Long eventId,
            HttpServletRequest httpRequest
    ) {
        Long userId = getUserIdFromRequestOptional(httpRequest);
        List<CommentResponse> comments = commentService.getEventComments(eventId, userId);
        return ResponseEntity.ok(comments);
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
