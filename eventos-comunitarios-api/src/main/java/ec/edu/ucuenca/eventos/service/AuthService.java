package ec.edu.ucuenca.eventos.service;

import ec.edu.ucuenca.eventos.dto.AuthResponse;
import ec.edu.ucuenca.eventos.dto.LoginRequest;
import ec.edu.ucuenca.eventos.dto.RegisterRequest;
import ec.edu.ucuenca.eventos.exception.BadRequestException;
import ec.edu.ucuenca.eventos.model.User;
import ec.edu.ucuenca.eventos.model.UserRole;
import ec.edu.ucuenca.eventos.repository.UserRepository;
import ec.edu.ucuenca.eventos.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final AuthenticationManager authenticationManager;
    
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // Check if email already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already in use");
        }
        
        // Create new user
        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(UserRole.USER)
                .active(true)
                .build();
        
        User savedUser = userRepository.save(user);
        
        // Generate JWT token
        String token = tokenProvider.generateToken(savedUser.getId(), savedUser.getEmail());
        
        return AuthResponse.builder()
                .token(token)
                .userId(savedUser.getId())
                .name(savedUser.getName())
                .email(savedUser.getEmail())
                .role(savedUser.getRole().name())
                .build();
    }
    
    public AuthResponse login(LoginRequest request) {
        // Authenticate user
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );
        
        // Get user from database
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadRequestException("User not found"));
        
        // Generate JWT token
        String token = tokenProvider.generateToken(user.getId(), user.getEmail());
        
        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .build();
    }
}
