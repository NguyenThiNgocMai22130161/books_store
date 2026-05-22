package myproject.study.books_store.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;

@Entity
@Table(name = "categories")
public class Category {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotBlank(message = "Tên danh mục không được để trống")
    @Column(unique = true, nullable = false)
    private String name;
    
    private String description;
    
    private boolean isDefault = false;

    public Category() {}

    public Category(String name, String description) {
        this.name = name;
        this.description = description;
        this.isDefault = false;
    }

    public Category(String name, String description, boolean isDefault) {
        this.name = name;
        this.description = description;
        this.isDefault = isDefault;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    // SỬA Ở ĐÂY - Thêm getter với "get" prefix
    public boolean getIsDefault() {
        return isDefault;
    }
    
    // Giữ nguyên getter boolean style
    public boolean isDefault() { 
        return isDefault; 
    }
    
    // SỬA Ở ĐÂY - Thêm setter với "set" prefix
    public void setIsDefault(boolean isDefault) { 
        this.isDefault = isDefault; 
    }
    
    // Giữ nguyên setter hiện tại
    public void setDefault(boolean isDefault) { 
        this.isDefault = isDefault; 
    }

    @Override
    public String toString() {
        return name;
    }
}
