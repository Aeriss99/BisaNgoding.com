package com.bisangoding.todolist;

public class App {
    public static void main(String[] args) {
        TodoService service = new TodoService(new TodoRepositoryMemori());
        service.tambah("Belajar unit test");
        service.tambah("Beli kopi");
        service.selesaikan(1);
        for (Todo t : service.semua()) {
            System.out.println(t);
        }
    }
}
