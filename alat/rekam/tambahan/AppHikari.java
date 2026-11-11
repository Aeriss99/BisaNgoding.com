package com.bisangoding.todolist;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;

public class App {
    public static void main(String[] args) throws SQLException {
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl("jdbc:mysql://localhost:3306/todolist");
        config.setUsername("root");
        config.setPassword(System.getenv("DB_PASSWORD"));
        config.setMaximumPoolSize(10);
        try (HikariDataSource ds = new HikariDataSource(config)) {
            for (int i = 1; i <= 3; i++) {
                try (Connection c = ds.getConnection();
                     PreparedStatement ps = c.prepareStatement("SELECT judul FROM todo WHERE id = ?")) {
                    ps.setInt(1, i);
                    try (ResultSet rs = ps.executeQuery()) {
                        System.out.println("Pinjam koneksi ke-" + i + ": " + (rs.next() ? rs.getString("judul") : "(tidak ada)"));
                    }
                }
            }
        }
    }
}
