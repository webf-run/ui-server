export function getUrlType(urlStr: string): 'HTTP' | 'File' {
  if (urlStr.startsWith('http')) {
    return 'HTTP';
  } else {
    return 'File'
  }
}
