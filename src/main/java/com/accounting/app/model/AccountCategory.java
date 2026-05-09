package com.accounting.app.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import lombok.EqualsAndHashCode;

@Entity
@Table(name = "account_categories") // Bảng Danh mục tài khoản
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class AccountCategory extends BaseEntity {
    @Id
    private String id; // Mã danh mục tài khoản

    private String name; // Tên danh mục
    private String type; // Loại tài khoản
    private String status; // Trạng thái

    @Column(name = "english_name")
    private String englishName; // Tên tiếng Anh

    @Column(name = "parent_id")
    private String parentId; // Mã tài khoản cha

    public AccountCategory(String id, String name, String type) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.status = "PENDING";
    }

    public AccountCategory(String id, String name, String type, String parentId) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.parentId = parentId;
        this.status = "PENDING";
    }
}
