package com.bisangoding.todolist;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

import javax.sql.DataSource;

public class TodoRepositoryJdbc implements TodoRepository {
    private final DataSource ds;

    public TodoRepositoryJdbc(DataSource ds) {
        this.ds = ds;
    }

    public Todo simpan(String judul) {
        String sql = "INSERT INTO todo (judul) VALUES (?)";
        try (Connection c = ds.getConnection();
             PreparedStatement ps = c.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setString(1, judul);
            ps.executeUpdate();
            try (ResultSet rs = ps.getGeneratedKeys()) {
                rs.next();
                return new Todo(rs.getInt(1), judul, false);
            }
        } catch (SQLException e) {
            throw new IllegalStateException("Gagal menyimpan todo", e);
        }
    }

    public List<Todo> semua() {
        List<Todo> hasil = new ArrayList<>();
        try (Connection c = ds.getConnection();
             PreparedStatement ps = c.prepareStatement("SELECT id, judul, selesai FROM todo ORDER BY id");
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                hasil.add(baca(rs));
            }
        } catch (SQLException e) {
            throw new IllegalStateException("Gagal membaca todo", e);
        }
        return hasil;
    }

    public Todo cari(int id) {
        try (Connection c = ds.getConnection();
             PreparedStatement ps = c.prepareStatement("SELECT id, judul, selesai FROM todo WHERE id = ?")) {
            ps.setInt(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? baca(rs) : null;
            }
        } catch (SQLException e) {
            throw new IllegalStateException("Gagal mencari todo", e);
        }
    }

    public boolean hapus(int id) {
        try (Connection c = ds.getConnection();
             PreparedStatement ps = c.prepareStatement("DELETE FROM todo WHERE id = ?")) {
            ps.setInt(1, id);
            return ps.executeUpdate() == 1;
        } catch (SQLException e) {
            throw new IllegalStateException("Gagal menghapus todo", e);
        }
    }

    public void perbarui(Todo todo) {
        try (Connection c = ds.getConnection();
             PreparedStatement ps = c.prepareStatement("UPDATE todo SET selesai = ? WHERE id = ?")) {
            ps.setBoolean(1, todo.isSelesai());
            ps.setInt(2, todo.getId());
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new IllegalStateException("Gagal memperbarui todo", e);
        }
    }

    private Todo baca(ResultSet rs) throws SQLException {
        return new Todo(rs.getInt("id"), rs.getString("judul"), rs.getBoolean("selesai"));
    }
}
