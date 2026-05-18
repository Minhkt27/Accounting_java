package com.accounting.app.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import lombok.EqualsAndHashCode;

@Entity
@Table(name = "danh_muc_tai_khoan") // Bảng Danh mục tài khoản
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class AccountCategory extends BaseEntity {
    @Id
    @Column(name = "ma_tai_khoan", length = 20)
    private String id; // Mã danh mục tài khoản

    @Column(name = "ten_tai_khoan", length = 100)
    private String name; // Tên danh mục

    @Column(name = "loai_tai_khoan", length = 50)
    private String type; // Loại tài khoản

    @Column(name = "trang_thai", length = 30)
    private String status; // Trạng thái

    @Column(name = "ten_tieng_anh", length = 100)
    private String englishName; // Tên tiếng Anh

    @Column(name = "ma_tai_khoan_cha", length = 20)
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
