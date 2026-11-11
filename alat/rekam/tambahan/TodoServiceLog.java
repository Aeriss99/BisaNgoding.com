package com.bisangoding.todolist;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class TodoService {
    private static final Logger log = LoggerFactory.getLogger(TodoService.class);
    private final TodoRepository repo;

    public TodoService(TodoRepository repo) {
        this.repo = repo;
    }

    public Todo tambah(String judul) {
        log.debug("Menambah todo dengan judul '{}'", judul);
        if (judul == null || judul.trim().isEmpty()) {
            throw new IllegalArgumentException("Judul tidak boleh kosong");
        }
        if (judul.trim().length() > 50) {
            throw new IllegalArgumentException("Judul maksimal 50 huruf");
        }
        Todo t = repo.simpan(judul.trim());
        log.info("Todo baru disimpan: {}", t);
        return t;
    }

    public void selesaikan(int id) {
        Todo t = repo.cari(id);
        if (t == null) {
            throw new TodoTidakDitemukanException(id);
        }
        t.selesaikan();
        repo.perbarui(t);
    }

    public void hapus(int id) {
        if (!repo.hapus(id)) {
            throw new TodoTidakDitemukanException(id);
        }
    }

    public List<Todo> semua() {
        return repo.semua();
    }
}
