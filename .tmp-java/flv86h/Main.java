public class Main {
    static String predikat(int n) {
        if (n >= 85) {
            return "A";
        } else if (n >= 70) {
            return "B";
        } else if (n >= 55) {
            return "C";
        }
        return "D";
    }

    public static void main(String[] args) {
        String[] nama = {"Andi", "Bela", "Citra"};
        int[] nilai = {88, 67, 74};
        int total = 0;

        for (int i = 0; i < nama.length; i++) {
            System.out.println(nama[i] + ": " + nilai[i] + " (" + predikat(nilai[i]) + ")");
            total += nilai[i];
        }

        System.out.println("Rata-rata kelas: " + (total / nilai.length));
    }
}