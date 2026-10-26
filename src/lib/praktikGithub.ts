import type { LayarGitHub } from '../types/schema';
import { isiTemplate as isiTpl, pecahTeks as pecah, type BagianTeks } from './praktikTerminal';

const KUNCI_SIMPAN = 'bn_praktik_github';

export { type BagianTeks };
export const isiTemplate = isiTpl;
export const pecahTeks = pecah;

export function bacaVariabelGitHub(): Record<string, string> {
  try {
    const raw = localStorage.getItem(KUNCI_SIMPAN);
    const data = raw ? JSON.parse(raw) : {};
    return data && typeof data === 'object' ? (data as Record<string, string>) : {};
  } catch {
    return {};
  }
}

export function simpanVariabelGitHub(baru: Record<string, string>): Record<string, string> {
  const gabung = { ...bacaVariabelGitHub(), ...baru };
  try {
    localStorage.setItem(KUNCI_SIMPAN, JSON.stringify(gabung));
  } catch {
  }
  return gabung;
}

const TAB_REPO: Record<string, string> = {
  'tab-code': 'Code',
  'tab-issues': 'Issues',
  'tab-pulls': 'Pull requests',
  'tab-actions': 'Actions',
  'tab-projects': 'Projects',
  'tab-wiki': 'Wiki',
  'tab-security': 'Security',
  'tab-insights': 'Insights',
  'tab-settings': 'Settings',
  'tab-discussions': 'Discussions',
};

export function ambilElemenLayar(layar: LayarGitHub): Record<string, string> {
  const hasil: Record<string, string> = {};

  if (layar.templat !== 'form_umum' && layar.templat !== 'form_gist') {
    Object.assign(hasil, TAB_REPO);
  }

  switch (layar.templat) {
    case 'repo':
      hasil['btn-code'] = '<> Code';
      hasil['banner-compare'] = 'Compare & pull request';
      break;

    case 'daftar_issue':
      hasil['btn-new-issue'] = 'New issue';
      if (Array.isArray(layar.items)) {
        for (const item of layar.items) {
          hasil[item.id] = item.judul;
        }
      }
      break;

    case 'form_issue':
      hasil['input-title'] = 'Title';
      hasil['input-body'] = 'Description';
      hasil['btn-create'] = 'Create';
      hasil['btn-cancel'] = 'Cancel';
      break;

    case 'pull_request':
      hasil['tab-conversation'] = 'Conversation';
      hasil['tab-files'] = 'Files changed';
      hasil['btn-merge'] = 'Merge pull request';
      hasil['btn-confirm-merge'] = 'Confirm merge';
      hasil['btn-submit-review'] = 'Submit review';
      hasil['btn-approve'] = 'Approve';
      break;

    case 'form_pr':
      hasil['btn-compare'] = 'Compare & pull request';
      hasil['btn-create-pr'] = 'Create pull request';
      hasil['input-title'] = 'Title';
      break;

    case 'pengaturan':
      hasil['menu-general'] = 'General';
      hasil['menu-collaborators'] = 'Collaborators';
      hasil['menu-pages'] = 'Pages';
      hasil['menu-copilot'] = 'Copilot';
      hasil['btn-setup-discussions'] = 'Set up discussions';
      hasil['btn-add-people'] = 'Add people';
      hasil['btn-save-pages'] = 'Save';
      hasil['btn-source-actions'] = 'GitHub Actions';
      hasil['btn-save-copilot'] = 'Save';
      break;

    case 'projects':
      hasil['btn-new-project'] = 'New project';
      hasil['btn-board'] = 'Board';
      hasil['btn-table'] = 'Table';
      break;

    case 'form_gist':
      hasil['input-desc'] = 'Gist description';
      hasil['input-filename'] = 'Filename';
      hasil['btn-create-secret'] = 'Create secret gist';
      hasil['btn-create-public'] = 'Create public gist';
      break;

    case 'form_umum':
      hasil['input-judul'] = 'Judul';
      hasil['input-isi'] = 'Isi';
      hasil['btn-simpan'] = 'Simpan';
      break;
  }

  if (layar.elemen) {
    Object.assign(hasil, layar.elemen);
  }

  return hasil;
}
