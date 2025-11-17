import { jwtDecode } from 'jwt-decode';

const ACCESS_TOKEN_KEY = 'synergy_access_token';

class TokenStorage {
    private inMemoryToken: string | null = null;

    constructor() {
        if (typeof window !== 'undefined') {
            this.inMemoryToken = sessionStorage.getItem(ACCESS_TOKEN_KEY);
        }
    }

    getAccessToken(): string | null {
        return this.inMemoryToken;
    }

    setAccessToken(token: string | null): void {
        this.inMemoryToken = token;

        if (typeof window === 'undefined') {
            return;
        }

        if (token) {
            sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
        } else {
            sessionStorage.removeItem(ACCESS_TOKEN_KEY);
        }
    }

    clear(): void {
        this.setAccessToken(null);
    }

    hasValidToken(): boolean {
        const token = this.getAccessToken();
        if (!token) {
            return false;
        }

        try {
            const decoded: any = jwtDecode(token);
            return decoded.exp * 1000 > Date.now();
        } catch (error) {
            return false;
        }
    }
}

const tokenStorage = new TokenStorage();

export { ACCESS_TOKEN_KEY };
export default tokenStorage;
