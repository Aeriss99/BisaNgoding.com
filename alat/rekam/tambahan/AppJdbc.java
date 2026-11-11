package com.bisangoding.todolist;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

public class App {
    public static void main(String[] args) throws SQLException {
        String url = "jdbc:mysql://localhost:3306/todolist";
        String sandi = System.getenv("DB_PASSWORD");
        try (Connection koneksi = DriverManager.getConnection(url, "root", sandi);
             Statement st = koneksi.createStatement();
             ResultSet rs = st.executeQuery("SELECT id, judul, selesai FROM todo ORDER BY id")) {
            System.out.println("Terhubung ke " + koneksi.getMetaData().getDatabaseProductName() + " "
                    + koneksi.getMetaData().getDatabaseProductVersion());
            while (rs.next()) {
                System.out.println(rs.getInt("id") + ". [" + (rs.getBoolean("selesai") ? "x" : " ") + "] " + rs.getString("judul"));
            }
        }
    }
}
