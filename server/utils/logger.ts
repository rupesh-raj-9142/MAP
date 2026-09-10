export const logger = {
  info: (...args: any[]) => {
    console.log(`[INFO] [${new Date().toISOString()}]`, ...sanitize(args));
  },
  warn: (...args: any[]) => {
    console.warn(`[WARN] [${new Date().toISOString()}]`, ...sanitize(args));
  },
  error: (...args: any[]) => {
    console.error(`[ERROR] [${new Date().toISOString()}]`, ...sanitize(args));
  },
  debug: (...args: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`[DEBUG] [${new Date().toISOString()}]`, ...sanitize(args));
    }
  }
};

function sanitize(args: any[]): any[] {
  return args.map(arg => {
    if (typeof arg === 'string') {
      return arg
        .replace(/password(=|":")[^&"]+/gi, 'password=***')
        .replace(/key(=|":")[^&"]+/gi, 'key=***')
        .replace(/token(=|":")[^&"]+/gi, 'token=***')
        .replace(/Bearer [A-Za-z0-9\-._~+/]+=*/gi, 'Bearer ***');
    }
    if (arg && typeof arg === 'object') {
      try {
        const copy = JSON.parse(JSON.stringify(arg));
        maskSensitiveKeys(copy);
        return copy;
      } catch {
        return arg;
      }
    }
    return arg;
  });
}

function maskSensitiveKeys(obj: any) {
  if (!obj || typeof obj !== 'object') return;
  for (const key of Object.keys(obj)) {
    if (['password', 'passwordHash', 'token', 'secret', 'apiKey', 'authorization'].includes(key.toLowerCase())) {
      obj[key] = '***';
    } else if (typeof obj[key] === 'object') {
      maskSensitiveKeys(obj[key]);
    }
  }
}
