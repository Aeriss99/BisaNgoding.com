package com.bisangoding.todolist;

import java.util.ArrayList;
import java.util.List;

public class TodoRepositoryMemori implements TodoRepository {
    private final List<Todo> data = new ArrayList<>();
    private int idBerikut = 1;

    public Todo simpan(String judul) {
        Todo t = new Todo(idBerikut++, judul);
        data.add(t);
        return t;
    }

    public List<Todo> semua() {
        return new ArrayList<>(data);
    }

    public Todo cari(int id) {
        for (Todo t : data) {
            if (t.getId() == id) {
                return t;
            }
        }
        return null;
    }

    public boolean hapus(int id) {
        Todo t = cari(id);
        return t != null && data.remove(t);
    }

    public void perbarui(Todo todo) {
    }
}
