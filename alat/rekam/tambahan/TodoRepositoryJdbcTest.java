package com.bisangoding.todolist;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;

import org.h2.jdbcx.JdbcDataSource;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class TodoRepositoryJdbcTest {
    TodoRepositoryJdbc repo;

    @BeforeEach
    void siapkan() throws SQLException {
        JdbcDataSource ds = new JdbcDataSource();
        ds.setURL("jdbc:h2:mem:uji;MODE=MySQL;DB_CLOSE_DELAY=-1");
        try (Connection c = ds.getConnection(); Statement st = c.createStatement()) {
            st.execute("DROP TABLE IF EXISTS todo");
            st.execute("CREATE TABLE todo (id INT AUTO_INCREMENT PRIMARY KEY, judul VARCHAR(100) NOT NULL, selesai BOOLEAN NOT NULL DEFAULT FALSE)");
        }
        repo = new TodoRepositoryJdbc(ds);
    }

    @Test
    void simpanMemberiIdBerurutan() {
        assertEquals(1, repo.simpan("Belajar").getId());
        assertEquals(2, repo.simpan("Beli kopi").getId());
    }

    @Test
    void perbaruiMenyimpanStatusSelesai() {
        Todo t = repo.simpan("Belajar");
        t.selesaikan();
        repo.perbarui(t);
        assertTrue(repo.cari(t.getId()).isSelesai());
    }

    @Test
    void hapusMenghilangkanData() {
        Todo t = repo.simpan("Belajar");
        assertTrue(repo.hapus(t.getId()));
        assertNull(repo.cari(t.getId()));
    }
}
