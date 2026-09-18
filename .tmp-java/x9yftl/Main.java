public class Main {
    public static void main(String[] args) {
        Karyawan[] daftar = { new Tetap("Andi"), new Harian("Budi", 20) };

        for (Karyawan k : daftar) {
            k.info();
        }
    }
}

abstract class Karyawan {
    String nama;

    Karyawan(String nama) {
        this.nama = nama;
    }

    abstract int gaji();

    void info() {
        System.out.println(nama + ": " + gaji());
    }
}

class Tetap extends Karyawan {
    Tetap(String nama) {
        super(nama);
    }

    @Override
    int gaji() {
        return 5000000;
    }
}

class Harian extends Karyawan {
    int hari;

    Harian(String nama, int hari) {
        super(nama);
        this.hari = hari;
    }

    @Override
    int gaji() {
        return hari * 150000;
    }
}