package com.bisangoding.todolist;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class TodoServiceTest {
    @Mock
    TodoRepository repo;

    @InjectMocks
    TodoService service;

    @Test
    void tambahMenyimpanJudulYangSudahDirapikan() {
        when(repo.simpan("Belajar")).thenReturn(new Todo(1, "Belajar"));
        Todo t = service.tambah("  Belajar  ");
        assertEquals(1, t.getId());
        verify(repo).simpan("Belajar");
    }

    @Test
    void tambahJudulKosongDitolak() {
        IllegalArgumentException e = assertThrows(IllegalArgumentException.class, () -> service.tambah(" "));
        assertEquals("Judul tidak boleh kosong", e.getMessage());
        verify(repo, never()).simpan(" ");
    }

    @Test
    void selesaikanTodoYangTidakAda() {
        when(repo.cari(9)).thenReturn(null);
        assertThrows(TodoTidakDitemukanException.class, () -> service.selesaikan(9));
    }

    @Test
    void selesaikanMenyimpanPerubahan() {
        Todo t = new Todo(1, "Belajar");
        when(repo.cari(1)).thenReturn(t);
        service.selesaikan(1);
        assertEquals(true, t.isSelesai());
        verify(repo).perbarui(t);
    }
}
