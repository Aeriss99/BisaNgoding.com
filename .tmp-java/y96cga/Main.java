public class Main {
    public static void main(String[] args) {
        Siswa s = new Siswa();
        s.setNama("Dina");
        s.setUmur(-5);
        System.out.println(s.getNama());
        System.out.println(s.getUmur());
        s.setUmur(18);
        System.out.println(s.getUmur());
    }
}

class Siswa {
    private String nama;
    private int umur;

    String getNama() {
        return nama;
    }

    void setNama(String nama) {
        this.nama = nama;
    }

    int getUmur() {
        return umur;
    }

    void setUmur(int umur) {
        if (umur > 0) {
            this.umur = umur;
        }
    }
}