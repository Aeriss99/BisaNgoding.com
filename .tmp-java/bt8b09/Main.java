public class Main {
    public static void main(String[] args) {
        int jumlah = 0;
        int angka = 1;
        while (angka <= 10) {
            jumlah += angka;
            angka++;
        }
        System.out.println("Total: " + jumlah);
    }
}