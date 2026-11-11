package com.bisangoding.todolist;

public class TodoTidakDitemukanException extends RuntimeException {
    public TodoTidakDitemukanException(int id) {
        super("Todo nomor " + id + " tidak ditemukan");
    }
}
