import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { ATURAN_PUSTAKA, classpathPustaka, jarUntuk } from '../lib/javaPustaka';
import { teksPrompt } from '../lib/praktikTerminal';

const folderJar = path.resolve(__dirname, '../../public/java-lib');

describe('javaPustaka: library Java di browser', () => {
  it('semua jar di aturan ada di public/java-lib', () => {
    for (const a of ATURAN_PUSTAKA) for (const j of a.jar) expect(fs.existsSync(path.join(folderJar, j)), j).toBe(true);
  });

  it('kode tanpa library tidak memuat jar apa pun', () => {
    expect(jarUntuk('import java.util.*;\npublic class Main {}')).toEqual([]);
    expect(classpathPustaka('System.out.println("halo");')).toBe('');
  });

  it('JUnit dan Mockito: bisangoding.jar sekali saja, di depan', () => {
    const jar = jarUntuk('import org.junit.jupiter.api.*;\nimport org.mockito.Mockito;');
    expect(jar[0]).toBe('bisangoding.jar');
    expect(jar.filter((j) => j === 'bisangoding.jar').length).toBe(1);
    expect(jar).toContain('mockito-core-4.11.0.jar');
    expect(jar).toContain('junit-jupiter-engine-5.10.5.jar');
  });

  it('dikenali dari import: Logback, Lombok, H2, Jackson, Validator', () => {
    expect(jarUntuk('import org.slf4j.Logger;')).toContain('logback-classic-1.3.15.jar');
    expect(jarUntuk('import lombok.*;')).toEqual(['lombok-1.18.34.jar']);
    expect(jarUntuk('ds.setURL("jdbc:h2:mem:todolist");')).toEqual(['h2-2.2.224.jar']);
    expect(jarUntuk('import com.fasterxml.jackson.databind.*;')).toContain('jackson-datatype-jsr310-2.17.2.jar');
    expect(jarUntuk('import jakarta.validation.constraints.*;')).toContain('hibernate-validator-7.0.5.Final.jar');
  });

  it('classpath CheerpJ memakai folder /app/<base>/java-lib/', () => {
    expect(classpathPustaka('import lombok.*;')).toBe('/app/java-lib/lombok-1.18.34.jar');
    expect(classpathPustaka('import lombok.*;', '/BisaNgoding.com/')).toBe('/app/BisaNgoding.com/java-lib/lombok-1.18.34.jar');
    expect(classpathPustaka('jdbc:h2:mem:x import lombok.Getter;').split(':').length).toBe(2);
  });
});

describe('teksPrompt terminal tiruan', () => {
  it('folder biasa diberi $, prompt seperti mysql> tetap', () => {
    expect(teksPrompt('~/todolist')).toBe('~/todolist $');
    expect(teksPrompt('mysql>')).toBe('mysql>');
    expect(teksPrompt('root@server:~#')).toBe('root@server:~#');
  });
});
