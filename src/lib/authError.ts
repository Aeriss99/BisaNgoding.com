export function petakanErrorAuth(error: any): string {
  const code = typeof error === 'string' ? error : error?.code;
  switch (code) {
    case 'invalid_credentials':
      return 'Email atau password salah.';
    case 'email_not_confirmed':
      return 'Email belum dikonfirmasi. Cek kotak masuk atau folder spam.';
    case 'user_already_exists':
      return 'Email sudah terdaftar. Silakan masuk atau pakai Lupa password.';
    case 'weak_password':
      return 'Password terlalu lemah. Pakai minimal 8 karakter.';
    case 'otp_expired':
      return 'Kode salah atau sudah kedaluwarsa. Minta kode baru.';
    case 'over_email_send_rate_limit':
      return 'Terlalu sering meminta email. Coba lagi beberapa menit lagi.';
    default: {
      const msg = error?.message?.toLowerCase() || '';
      if (msg.includes('invalid credentials') || msg.includes('invalid login credentials')) {
        return 'Email atau password salah.';
      }
      if (msg.includes('email not confirmed')) {
        return 'Email belum dikonfirmasi. Cek kotak masuk atau folder spam.';
      }
      if (msg.includes('user already registered') || msg.includes('user already exists')) {
        return 'Email sudah terdaftar. Silakan masuk atau pakai Lupa password.';
      }
      if (msg.includes('token has expired') || msg.includes('token is invalid') || msg.includes('otp expired') || msg.includes('invalid token')) {
        return 'Kode salah atau sudah kedaluwarsa. Minta kode baru.';
      }
      return 'Gagal. Silakan coba lagi.';
    }
  }
}
