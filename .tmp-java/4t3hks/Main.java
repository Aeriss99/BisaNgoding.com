public class Main {
    public static void main(String[] args) {
        int umur = 15;
        String status = umur >= 17 ? "Dewasa" : "Remaja";
        System.out.println(status);

        int a = 8;
        int b = 12;
        int terbesar = a > b ? a : b;
        System.out.println("Terbesar: " + terbesar);
    }
}