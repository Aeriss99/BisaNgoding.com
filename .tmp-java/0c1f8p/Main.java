import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner input = new Scanner("Budi\n20");
        String nama = input.nextLine();
        int umur = input.nextInt();

        System.out.println("Nama: " + nama);
        System.out.println("Umur: " + umur);
    }
}