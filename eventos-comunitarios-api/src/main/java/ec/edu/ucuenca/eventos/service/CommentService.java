package ec.edu.ucuenca.eventos.service;

import ec.edu.ucuenca.eventos.dto.CommentRequest;
import ec.edu.ucuenca.eventos.dto.CommentResponse;
import ec.edu.ucuenca.eventos.exception.ResourceNotFoundException;
import ec.edu.ucuenca.eventos.exception.UnauthorizedException;
import ec.edu.ucuenca.eventos.model.Comment;
import ec.edu.ucuenca.eventos.model.Event;
import ec.edu.ucuenca.eventos.model.User;
import ec.edu.ucuenca.eventos.repository.CommentRepository;
import ec.edu.ucuenca.eventos.repository.EventRepository;
import ec.edu.ucuenca.eventos.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommentService {
    
    private final CommentRepository commentRepository;
    private final EventRepository eventRepository;
    private final UserRepository userRepository;
    
    @Transactional
    public CommentResponse createComment(Long userId, Long eventId, CommentRequest request) {
        Event event = eventRepository.findByIdAndDeletedAtIsNull(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found"));
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        Comment comment = Comment.builder()
                .event(event)
                .user(user)
                .content(request.getContent())
                .build();
        
        Comment savedComment = commentRepository.save(comment);
        return mapToCommentResponse(savedComment, userId);
    }
    
    @Transactional
    public CommentResponse updateComment(Long userId, Long commentId, CommentRequest request) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));
        
        if (!comment.getUser().getId().equals(userId)) {
            throw new UnauthorizedException("Only the comment author can update it");
        }
        
        comment.setContent(request.getContent());
        Comment updatedComment = commentRepository.save(comment);
        return mapToCommentResponse(updatedComment, userId);
    }
    
    @Transactional
    public void deleteComment(Long userId, Long commentId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));
        
        if (!comment.getUser().getId().equals(userId)) {
            throw new UnauthorizedException("Only the comment author can delete it");
        }
        
        commentRepository.delete(comment);
    }
    
    @Transactional(readOnly = true)
    public List<CommentResponse> getEventComments(Long eventId, Long userId) {
        List<Comment> comments = commentRepository.findByEventIdOrderByCreatedAtDesc(eventId);
        
        return comments.stream()
                .map(comment -> mapToCommentResponse(comment, userId))
                .collect(Collectors.toList());
    }
    
    private CommentResponse mapToCommentResponse(Comment comment, Long userId) {
        return CommentResponse.builder()
                .id(comment.getId())
                .eventId(comment.getEvent().getId())
                .userId(comment.getUser().getId())
                .userName(comment.getUser().getName())
                .content(comment.getContent())
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .isOwner(userId != null && comment.getUser().getId().equals(userId))
                .build();
    }
}
