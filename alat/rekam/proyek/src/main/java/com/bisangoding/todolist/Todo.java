package com.bisangoding.todolist;

public class Todo {
    private final int id;
    private final String judul;
    private boolean selesai;

    public Todo(int id, String judul) {
        this.id = id;
        this.judul = judul;
    }

    public int getId() {
        return id;
    }

    public String getJudul() {
        return judul;
    }

    public boolean isSelesai() {
        return selesai;
    }

    public void selesaikan() {
        selesai = true;
    }

    @Override
    public String toString() {
        return id + ". [" + (selesai ? "x" : " ") + "] " + judul;
    }
}
