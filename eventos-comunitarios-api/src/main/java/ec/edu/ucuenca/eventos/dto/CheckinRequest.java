package ec.edu.ucuenca.eventos.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CheckinRequest {
    @NotBlank(message = "El token de check-in es requerido")
    private String token;
}
