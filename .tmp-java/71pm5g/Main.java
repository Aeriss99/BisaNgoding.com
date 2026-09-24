public class Main {
    static int kali2(int angka) {
        int hasil = angka * 2;
        return hasil;
    }

    public static void main(String[] args) {
        int x = 10;

        if (x > 5) {
            String pesan = "x lebih dari 5";
            System.out.println(pesan);
        }

        for (int i = 0; i < 2; i++) {
            int kuadrat = i * i;
            System.out.println("i=" + i + ", kuadrat=" + kuadrat);
        }

        System.out.println(kali2(x));
    }
}