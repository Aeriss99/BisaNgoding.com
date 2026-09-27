import { describe, it, expect, beforeAll } from 'vitest';
import * as path from 'path';
import * as fs from 'fs';
import mermaid from 'mermaid';

describe('Mermaid Validation', () => {
  const contentDir = path.resolve(__dirname, '../../content');
  
  beforeAll(async () => {
    mermaid.initialize({ startOnLoad: false });
  });

  const getMermaidBlocks = (dir: string): { file: string, content: string }[] => {
    let blocks: { file: string, content: string }[] = [];
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) {
        blocks = blocks.concat(getMermaidBlocks(fullPath));
      } else if (fullPath.endsWith('.json')) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        try {
          const lesson = JSON.parse(content);
          if (lesson.cards) {
            lesson.cards.forEach((card: any) => {
              if (card.content && typeof card.content === 'string') {
                const matches = Array.from(card.content.matchAll(/```mermaid\n([\s\S]*?)```/g));
                for (const match of matches) {
                  blocks.push({
                    file: fullPath.replace(contentDir, ''),
                    content: match[1].trim() as string
                  });
                }
              }
            });
          }
        } catch (e) {
          // ignore parse error, other tests handle it
        }
      }
    }
    return blocks;
  };

  const allBlocks = getMermaidBlocks(contentDir);

  if (allBlocks.length === 0) {
    it('skips when no blocks', () => {
      expect(true).toBe(true);
    });
  }

  for (const block of allBlocks) {
    it(`validates mermaid in ${block.file}`, async () => {
      let err: any = null;
      let success = false;
      for (let i = 0; i < 3; i++) {
        try {
          await mermaid.parse(block.content);
          success = true;
          break;
        } catch (e) {
          err = e;
        }
      }
      if (!success) {
        throw new Error(`Failed to parse mermaid after 3 attempts in ${block.file}: ${err?.message || err}`);
      }
      expect(success).toBe(true);
    });
  }
});
