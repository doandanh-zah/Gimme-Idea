const debugEnabled =
    (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env
        ?.NEXT_PUBLIC_DEBUG_LOGS === 'true';

const SENSITIVE_KEY_PATTERN = /(token|secret|password|authorization|api[-_]?key|private[-_]?key|refresh[-_]?token)/i;
const BEARER_PATTERN = /Bearer\s+[A-Za-z0-9\-._~+/]+=*/i;

function redactString(value: string): string {
    if (BEARER_PATTERN.test(value)) {
        return value.replace(BEARER_PATTERN, 'Bearer [REDACTED]');
    }

    if (value.length > 120 && /[A-Za-z0-9\-._~+/]{32,}/.test(value)) {
        return '[REDACTED_LONG_TOKEN]';
    }

    return value;
}

function sanitize(value: unknown, depth = 0): unknown {
    if (depth > 3) return '[TRUNCATED]';

    if (typeof value === 'string') return redactString(value);
    if (typeof value === 'number' || typeof value === 'boolean' || value == null) return value;

    if (Array.isArray(value)) {
        return value.slice(0, 20).map((item) => sanitize(item, depth + 1));
    }

    if (typeof value === 'object') {
        const output: Record<string, unknown> = {};
        for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
            output[key] = SENSITIVE_KEY_PATTERN.test(key) ? '[REDACTED]' : sanitize(val, depth + 1);
        }
        return output;
    }

    return String(value);
}

function sanitizeArgs(args: unknown[]): unknown[] {
    return args.map((arg) => sanitize(arg));
}

export const logger = {
    debug: (...args: unknown[]) => {
        if (!debugEnabled) return;
        console.log(...sanitizeArgs(args));
    },
    info: (...args: unknown[]) => {
        if (!debugEnabled) return;
        console.info(...sanitizeArgs(args));
    },
    warn: (...args: unknown[]) => {
        console.warn(...sanitizeArgs(args));
    },
    error: (...args: unknown[]) => {
        console.error(...sanitizeArgs(args));
    },
};

export const isDebugLoggingEnabled = debugEnabled;
