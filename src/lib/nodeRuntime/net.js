const v4 = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;
export const isIPv4 = (s) => v4.test(s);
export const isIPv6 = (s) => typeof s === 'string' && s.includes(':') && /^[0-9a-f:.]+$/i.test(s);
export const isIP = (s) => (isIPv4(s) ? 4 : isIPv6(s) ? 6 : 0);
export default { isIP, isIPv4, isIPv6 };
