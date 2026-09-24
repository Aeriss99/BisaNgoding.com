public class Main {
    public static void main(String[] args) {
        Mahasiswa m1 = new Mahasiswa("Budi", "Informatika");
        Mahasiswa m2 = new Mahasiswa("Sari", "Akuntansi");
        m1.info();
        m2.info();
    }
}

class Mahasiswa {
    String nama;
    String jurusan;

    Mahasiswa(String nama, String jurusan) {
        this.nama = nama;
        this.jurusan = jurusan;
    }

    void info() {
        System.out.println(nama + " - " + jurusan);
    }
}