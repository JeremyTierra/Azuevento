package ec.edu.ucuenca.eventos.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotBlank(message = "Name is required")
    @Size(max = 100, message = "Name cannot exceed 100 characters")
    @Column(nullable = false, length = 100)
    private String name;
    
    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    @Size(max = 150, message = "Email cannot exceed 150 characters")
    @Column(nullable = false, unique = true, length = 150)
    private String email;
    
    
    @JsonIgnore
    @NotBlank(message = "Password is required")
    @Column(nullable = false, name = "password_hash", length = 255)
    private String passwordHash;
    
    @Size(max = 20, message = "Phone cannot exceed 20 characters")
    @Column(length = 20)
    private String phone;
    
    @Size(max = 255, message = "Profile picture URL cannot exceed 255 characters")
    @Column(name = "profile_picture", length = 255)
    private String profilePicture;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private UserRole role = UserRole.USER;
    
    @CreationTimestamp
    @Column(nullable = false, updatable = false, name = "registration_date")
    private LocalDateTime registrationDate;
    
    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;
    
    // Relationships
    @ManyToMany
    @JoinTable(
        name = "user_interests",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "category_id")
    )
    @Builder.Default
    private Set<Category> interests = new HashSet<>();
    
    @OneToMany(mappedBy = "organizer", cascade = CascadeType.ALL)
    @Builder.Default
    @JsonIgnore
    private Set<Event> organizedEvents = new HashSet<>();
    
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    @Builder.Default
    @JsonIgnore
    private Set<Participant> participations = new HashSet<>();
    
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    @Builder.Default
    @JsonIgnore
    private Set<Comment> comments = new HashSet<>();
    
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    @Builder.Default
    @JsonIgnore
    private Set<Rating> ratings = new HashSet<>();
    
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    @Builder.Default
    @JsonIgnore
    private Set<Favorite> favorites = new HashSet<>();
}
