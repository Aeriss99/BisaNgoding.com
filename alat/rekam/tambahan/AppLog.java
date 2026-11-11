package com.bisangoding.todolist;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class App {
    private static final Logger log = LoggerFactory.getLogger(App.class);

    public static void main(String[] args) {
        log.info("Aplikasi Todolist mulai");
        TodoService service = new TodoService(new TodoRepositoryMemori());
        service.tambah("Belajar logging");
        service.tambah("Beli kopi");
        log.debug("Jumlah todo sekarang {}", service.semua().size());
        try {
            service.selesaikan(9);
        } catch (TodoTidakDitemukanException e) {
            log.warn("Gagal menyelesaikan: {}", e.getMessage());
        }
        log.info("Aplikasi selesai");
    }
}
