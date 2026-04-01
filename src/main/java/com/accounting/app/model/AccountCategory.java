package com.accounting.app.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "account_categories")
@Data
@NoArgsConstructor
public class AccountCategory {
    @Id
    private String id;

    private String name;
    private String type;

    private String status;

    public AccountCategory(String id, String name, String type) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.status = "PENDING";
    }
}
