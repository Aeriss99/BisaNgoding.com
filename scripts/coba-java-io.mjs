// Mencoba operasi file Java di CheerpJ (Java 8 bawaan) lewat window.runJavaCode.
import { chromium } from 'playwright';
const P = (body, impor = 'import java.io.*;\nimport java.nio.file.*;\nimport java.util.*;\n') =>
  `${impor}public class Main { public static void main(String[] args) throws Exception {\n${body}\n} }`;
const PROGRAM = {
  userdir: P('System.out.println(System.getProperty("user.dir")); System.out.println(new File("a.txt").getAbsolutePath());'),
  relatifTulisBaca: P('try (PrintWriter w = new PrintWriter(new FileWriter("catatan.txt"))) { w.println("Kopi 3"); w.println("Teh 5"); }\ntry (BufferedReader r = new BufferedReader(new FileReader("catatan.txt"))) { String b; while ((b = r.readLine()) != null) System.out.println("> " + b); }\nSystem.out.println(new File("catatan.txt").exists() + " " + new File("catatan.txt").length());'),
  relatifLagi: P('System.out.println(new File("catatan.txt").exists());'),
  filesTulisBaca: P('try (PrintWriter w = new PrintWriter(new FileWriter("/files/c2.txt"))) { w.println("A"); }\ntry (BufferedReader r = new BufferedReader(new FileReader("/files/c2.txt"))) { System.out.println(r.readLine()); }'),
  append: P('try (FileWriter w = new FileWriter("log.txt", true)) { w.write("x\\n"); }\ntry (FileWriter w = new FileWriter("log.txt", true)) { w.write("y\\n"); }\nSystem.out.println(new String(Files.readAllBytes(Paths.get("log.txt")), "UTF-8").replace("\\n", "|"));'),
  nio: P('Path p = Paths.get("nio.txt"); Files.write(p, Arrays.asList("satu", "dua")); System.out.println(Files.readAllLines(p)); System.out.println(Files.exists(p) + " " + Files.size(p));'),
  dir: P('File d = new File("data"); System.out.println(d.mkdir() + " " + d.isDirectory()); File f = new File(d, "x.txt"); new FileWriter(f).close(); System.out.println(Arrays.toString(d.list())); System.out.println(f.delete() + " " + f.exists());'),
  tidakAda: P('try { new FileReader("tidak-ada.txt"); } catch (FileNotFoundException e) { System.out.println("FNF " + e.getMessage()); }'),
  stringReader: P('BufferedReader r = new BufferedReader(new StringReader("a\\nb")); System.out.println(r.readLine() + r.readLine());'),
  scannerFile: P('try (PrintWriter w = new PrintWriter("angka.txt")) { w.println("3 4 5"); }\nScanner s = new Scanner(new File("angka.txt")); int t = 0; while (s.hasNextInt()) t += s.nextInt(); System.out.println(t);'),
  dataStream: P('try (DataOutputStream o = new DataOutputStream(new FileOutputStream("d.bin"))) { o.writeInt(42); o.writeUTF("hai"); }\ntry (DataInputStream i = new DataInputStream(new FileInputStream("d.bin"))) { System.out.println(i.readInt() + i.readUTF()); }'),
};
const browser = await chromium.launch();
for (const mode of ['8', '21']) {
  const page = await (await browser.newContext()).newPage();
  await page.goto(`http://localhost:4173/?java=${mode}`, { waitUntil: 'load' });
  await page.waitForFunction(() => typeof window.runJavaCode === 'function');
  console.log(`\n=== JAVA ${mode} ===`);
  for (const [nama, code] of Object.entries(PROGRAM)) {
    const r = await page.evaluate(async (code) => { try { return await window.runJavaCode(code, ''); } catch (e) { return { stdout: '', stderr: String(e), exitCode: -9 }; } }, code);
    console.log(`${nama}: exit=${r.exitCode} out=${JSON.stringify((r.stdout || '').trim())} err=${JSON.stringify((r.stderr || '').slice(0, 300))}`);
  }
}
await browser.close();
