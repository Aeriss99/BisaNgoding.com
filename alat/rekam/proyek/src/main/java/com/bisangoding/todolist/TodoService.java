package com.bisangoding.todolist;

import java.util.List;

public class TodoService {
    private final TodoRepository repo;

    public TodoService(TodoRepository repo) {
        this.repo = repo;
    }

    public Todo tambah(String judul) {
        if (judul == null || judul.trim().isEmpty()) {
            throw new IllegalArgumentException("Judul tidak boleh kosong");
        }
        if (judul.trim().length() > 50) {
            throw new IllegalArgumentException("Judul maksimal 50 huruf");
        }
        return repo.simpan(judul.trim());
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
