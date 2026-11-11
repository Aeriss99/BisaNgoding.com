package com.bisangoding.web;

import java.util.*;

/** Hasil satu permintaan ke ServerUji: status, header, dan isi. Dicetak seperti curl -i. */
public class Respons {
    final int status;
    final Map<String, List<String>> header;
    final String isi;

    Respons(int status, Map<String, List<String>> header, String isi) {
        this.status = status;
        this.header = header;
        this.isi = isi;
    }

    public int status() {
        return status;
    }

    /** Nilai header pertama, atau null. Nama header tidak membedakan huruf besar kecil. */
    public String header(String nama) {
        for (Map.Entry<String, List<String>> e : header.entrySet()) {
            if (e.getKey().equalsIgnoreCase(nama)) {
                return e.getValue().get(0);
            }
        }
        return null;
    }

    public String isi() {
        return isi;
    }

    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder("HTTP " + status + " " + ServerUji.alasan(status)).append('\n');
        for (Map.Entry<String, List<String>> e : header.entrySet()) {
            for (String v : e.getValue()) {
                sb.append(e.getKey()).append(": ").append(v).append('\n');
            }
        }
        sb.append('\n').append(isi);
        String hasil = sb.toString();
        while (hasil.endsWith("\n")) {
            hasil = hasil.substring(0, hasil.length() - 1);
        }
        return hasil;
    }
}
