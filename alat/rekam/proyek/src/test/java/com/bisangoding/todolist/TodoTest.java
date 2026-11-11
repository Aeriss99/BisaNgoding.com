package com.bisangoding.todolist;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class TodoTest {
    @Test
    void todoBaruBelumSelesai() {
        Todo t = new Todo(1, "Belajar");
        assertFalse(t.isSelesai());
    }

    @Test
    void selesaikanMengubahStatus() {
        Todo t = new Todo(1, "Belajar");
        t.selesaikan();
        assertTrue(t.isSelesai());
    }

    @Test
    void toStringMenampilkanTanda() {
        Todo t = new Todo(2, "Beli kopi");
        t.selesaikan();
        assertEquals("2. [x] Beli kopi", t.toString());
    }
}
