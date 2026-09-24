public class Main {
    public static void main(String[] args) {
        Pegawai p1 = new Pegawai("Andi");
        Pegawai p2 = new Pegawai("Rina", 4500000);
        p1.info();
        p2.info();
    }
}

class Pegawai {
    String nama;
    int gaji;

    Pegawai(String nama) {
        this(nama, 3000000);
    }

    Pegawai(String nama, int gaji) {
        this.nama = nama;
        this.gaji = gaji;
    }

    void info() {
        System.out.println(nama + " - " + gaji);
    }
}