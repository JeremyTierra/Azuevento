package ec.edu.ucuenca.eventos.service;

import ec.edu.ucuenca.eventos.dto.UpdatePasswordRequest;
import ec.edu.ucuenca.eventos.dto.UpdateProfileRequest;
import ec.edu.ucuenca.eventos.exception.BadRequestException;
import ec.edu.ucuenca.eventos.exception.DuplicateResourceException;
import ec.edu.ucuenca.eventos.exception.ResourceNotFoundException;
import ec.edu.ucuenca.eventos.model.User;
import ec.edu.ucuenca.eventos.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    
    public User getUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
    }
    
    @Transactional
    public User updateProfile(Long userId, UpdateProfileRequest request) {
        User user = getUserById(userId);
        
        // Verificar si el email ya está en uso por otro usuario
        if (!user.getEmail().equals(request.getEmail()) && 
            userRepository.existsByEmailAndIdNot(request.getEmail(), userId)) {
            throw new DuplicateResourceException("Email already in use");
        }
        
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        
        return userRepository.save(user);
    }
    
    @Transactional
    public void updatePassword(Long userId, UpdatePasswordRequest request) {
        User user = getUserById(userId);
        
        // Verificar que la contraseña actual sea correcta
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Current password is incorrect");
        }
        
        // Actualizar a la nueva contraseña
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }
    
    @Transactional
    public void deleteAccount(Long userId) {
        User user = getUserById(userId);
        userRepository.delete(user);
    }
}
