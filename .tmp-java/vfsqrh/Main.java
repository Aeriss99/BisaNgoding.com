public class Main {
    public static void main(String[] args) {
        String kalimat = "  Belajar Java Itu Seru  ";
        String rapi = kalimat.trim();

        System.out.println(rapi);
        System.out.println(rapi.length());
        System.out.println(rapi.toUpperCase());
        System.out.println(rapi.contains("Java"));
        System.out.println(rapi.replace("Seru", "Mudah"));
        System.out.println(rapi.charAt(0));
        System.out.println(rapi.substring(8, 12));
    }
}