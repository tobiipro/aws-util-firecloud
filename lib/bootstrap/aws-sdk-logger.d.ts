declare module 'aws-sdk/lib/config' {
    interface Logger {
        isTTY?: boolean;
    }
}
export {};
