package com.bisangoding.todolist;

import java.util.List;

public interface TodoRepository {
    Todo simpan(String judul);

    List<Todo> semua();

    Todo cari(int id);

    boolean hapus(int id);

    void perbarui(Todo todo);
}
