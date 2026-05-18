package com.accounting.app.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.HashSet;
import java.util.Set;

import lombok.EqualsAndHashCode;

@Entity
@Table(name = "nguoi_dung",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = "ten_dang_nhap"),
                @UniqueConstraint(columnNames = "email")
        }) // Bảng Người dùng
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class User extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(name = "ten_dang_nhap", length = 50)
    private String username; // Tên đăng nhập

    @NotBlank
    @Email
    @Column(name = "email", length = 100)
    private String email; // Thư điện tử (Email)

    @NotBlank
    @Column(name = "mat_khau", length = 255)
    private String password; // Mật khẩu

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "nguoi_dung_vai_tro",
            joinColumns = @JoinColumn(name = "id_nguoi_dung"),
            inverseJoinColumns = @JoinColumn(name = "id_vai_tro"))
    private Set<Role> roles = new HashSet<>(); // Danh sách vai trò

    public User(String username, String email, String password) {
        this.username = username;
        this.email = email;
        this.password = password;
    }
}
