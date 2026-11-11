package com.bisangoding.todolist;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class Banyak {
    private static final Logger log = LoggerFactory.getLogger(Banyak.class);

    public static void main(String[] args) {
        for (int i = 1; i <= 60; i++) {
            log.info("Memproses pesanan nomor {} dari 60", i);
        }
    }
}
