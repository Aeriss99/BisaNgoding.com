package com.bisangoding.todolist;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public class Todo {
    private final int id;
    private final String judul;
    private boolean selesai;

    public void selesaikan() {
        selesai = true;
    }

    @Override
    public String toString() {
        return id + ". [" + (selesai ? "x" : " ") + "] " + judul;
    }
}
