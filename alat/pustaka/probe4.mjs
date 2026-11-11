import { chromium } from 'playwright';
const JEJAK = `
  static StringBuilder j = new StringBuilder();
  static synchronized void jejak(String s) { j.append(s).append(" ").append(System.currentTimeMillis() - T0).append("ms\\n"); try { java.io.FileOutputStream f = new java.io.FileOutputStream("/files/jejak.txt"); f.write(j.toString().getBytes()); f.close(); } catch (Exception e) {} }
  static long T0 = System.currentTimeMillis();`;
const P = {
  annotated: { cp: '', code: `
import java.lang.reflect.*;
import java.lang.annotation.*;
import java.util.*;
@Retention(RetentionPolicy.RUNTIME) @Target({ElementType.FIELD, ElementType.TYPE_USE}) @interface Wajib {}
class Daftar { @Wajib String nama; List<@Wajib String> tag; int umur; }
public class Main {${JEJAK}
  public static void main(String[] a) throws Exception {
    jejak("mulai");
    Field f = Daftar.class.getDeclaredField("nama");
    jejak("anotasi field " + Arrays.toString(f.getDeclaredAnnotations()));
    jejak("generic " + Daftar.class.getDeclaredField("tag").getGenericType());
    AnnotatedType t = f.getAnnotatedType();
    jejak("annotatedType field " + t.getType());
    jejak("anotasi tipe " + Arrays.toString(t.getAnnotations()));
    AnnotatedType t2 = Daftar.class.getDeclaredField("tag").getAnnotatedType();
    jejak("tag " + t2.getClass().getSimpleName());
    if (t2 instanceof AnnotatedParameterizedType) jejak("arg " + Arrays.toString(((AnnotatedParameterizedType) t2).getAnnotatedActualTypeArguments()[0].getAnnotations()));
    Method m = Object.class.getMethod("toString");
    jejak("return " + m.getAnnotatedReturnType().getType());
    Method w = Object.class.getMethod("wait", long.class);
    jejak("param " + w.getAnnotatedParameterTypes().length);
    jejak("receiver " + m.getAnnotatedReceiverType());
    for (Method x : Object.class.getDeclaredMethods()) { x.getAnnotatedReturnType(); x.getAnnotatedParameterTypes(); x.getAnnotatedExceptionTypes(); }
    jejak("semua method Object");
    for (Constructor<?> c : Object.class.getDeclaredConstructors()) { c.getAnnotatedReturnType(); c.getAnnotatedParameterTypes(); }
    jejak("constructor");
    Daftar.class.getAnnotatedSuperclass(); Daftar.class.getAnnotatedInterfaces();
    jejak("superclass");
    System.out.println("selesai");
  }
}` },
};
const browser = await chromium.launch();
for (const k of Object.keys(P)) {
  const page = await browser.newPage();
  await page.goto('http://localhost:8080/index.html');
  await page.evaluate(() => window.siap);
  const t = Date.now();
  let r;
  try { r = await Promise.race([page.evaluate(({ code, cp }) => window.jalankan(code, cp), P[k]), new Promise((_, j) => setTimeout(() => j(new Error('timeout 60s')), 60000))]); }
  catch (e) {
    let jj = '(tidak terbaca)';
    try { jj = await Promise.race([page.evaluate(async () => { try { return await (await cjFileBlob('/files/jejak.txt')).text(); } catch (e) { return 'galat ' + e; } }), new Promise((s) => setTimeout(() => s('(halaman macet)'), 10000))]); } catch (_) {}
    r = { galat: String(e), jejak: jj };
  }
  if (r.exit === 0 || r.exit) { try { r.jejak = await page.evaluate(async () => (await (await cjFileBlob('/files/jejak.txt')).text())); } catch (_) {} }
  console.log(`===== ${k} (${Date.now() - t} ms)\n` + JSON.stringify(r, null, 1).slice(0, 6000));
  await page.close();
}
await browser.close();
