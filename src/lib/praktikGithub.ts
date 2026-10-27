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
      hasil['btn-new-discussion'] = 'New discussion';
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

    case 'daftar_pr':
      hasil['btn-new-pr'] = 'New pull request';
      break;

    case 'pull_request':
      hasil['tab-conversation'] = 'Conversation';
      hasil['tab-files'] = 'Files changed';
      hasil['btn-resolve-conflicts'] = 'Resolve conflicts';
      hasil['btn-hapus-marker'] = 'Hapus marker';
      hasil['btn-mark-resolved'] = 'Mark as resolved';
      hasil['btn-commit-merge'] = 'Commit merge';
      hasil['btn-submit-review'] = 'Submit review';
      hasil['opt-approve'] = 'Approve';
      hasil['btn-approve'] = 'Approve';
      hasil['btn-confirm-review'] = 'Submit review';
      hasil['btn-merge'] = 'Merge pull request';
      hasil['btn-confirm-merge'] = 'Confirm merge';
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
      hasil['check-discussions'] = 'Discussions';
      hasil['btn-setup-discussions'] = 'Set up discussions';
      hasil['btn-add-people'] = 'Add people';
      hasil['input-collaborator'] = 'Username';
      hasil['btn-submit-invite'] = 'Add';
      hasil['btn-select-deploy-branch'] = 'Deploy from a branch';
      hasil['btn-select-branch-main'] = 'main';
      hasil['btn-save-pages'] = 'Save';
      hasil['btn-visit-site'] = 'Visit site';
      hasil['btn-source-actions'] = 'GitHub Actions';
      hasil['btn-save-copilot'] = 'Save';
      break;

    case 'projects':
      hasil['tab-projects'] = 'Projects';
      hasil['btn-new-project'] = 'New project';
      hasil['btn-board'] = 'Board';
      hasil['btn-table'] = 'Table';
      hasil['input-title'] = 'Title';
      hasil['btn-create-project'] = 'Create';
      break;

    case 'form_gist':
      hasil['input-desc'] = 'Gist description';
      hasil['input-filename'] = 'Filename';
      hasil['btn-create-secret'] = 'Create secret gist';
      hasil['btn-create-public'] = 'Create public gist';
      hasil['btn-new-gist'] = 'New gist';
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
