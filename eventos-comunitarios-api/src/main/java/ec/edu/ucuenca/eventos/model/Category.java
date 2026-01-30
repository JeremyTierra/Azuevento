package ec.edu.ucuenca.eventos.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "categories")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Category {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotBlank(message = "Category name is required")
    @Size(max = 50, message = "Category name cannot exceed 50 characters")
    @Column(nullable = false, unique = true, length = 50)
    private String name;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Size(max = 100, message = "Icon cannot exceed 100 characters")
    @Column(length = 100)
    private String icon;
    
    // Relationships
    @OneToMany(mappedBy = "category", cascade = CascadeType.ALL)
    @Builder.Default
    @JsonIgnore
    private Set<Event> events = new HashSet<>();
    
    @ManyToMany(mappedBy = "interests")
    @Builder.Default
    @JsonIgnore
    private Set<User> interestedUsers = new HashSet<>();
}
