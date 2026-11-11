package com.bisangoding.todolist;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;

public class App {
    public static void main(String[] args) {
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(System.getenv().getOrDefault("DB_URL", "jdbc:mysql://localhost:3306/todolist"));
        config.setUsername("root");
        config.setPassword(System.getenv("DB_PASSWORD"));
        try (HikariDataSource ds = new HikariDataSource(config)) {
            TodoService service = new TodoService(new TodoRepositoryJdbc(ds));
            if (args.length > 0) {
                service.tambah(String.join(" ", args));
            }
            for (Todo t : service.semua()) {
                System.out.println(t);
            }
        }
    }
}
