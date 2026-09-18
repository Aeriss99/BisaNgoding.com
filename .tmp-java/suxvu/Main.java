public class Main {
    public static void main(String[] args) {
        Siswa s = new Siswa();
        System.out.println(s.nama);
        System.out.println(s.umur);

        s.nama = "Budi";
        s.umur = 17;
        System.out.println(s.nama);
        System.out.println(s.umur);
    }
}

class Siswa {
    String nama;
    int umur;
}