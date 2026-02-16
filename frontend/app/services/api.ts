import tokenStorage from './tokenStorage';

const API_URL = '/api';

interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
}

class ApiClient {
  private async request<T = any>(
    method: string,
    url: string,
    body?: any
  ): Promise<ApiResponse<T>> {
    const token = tokenStorage.getAccessToken();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const fullUrl = url.startsWith('http') ? url : `${API_URL}${url}`;

    const options: RequestInit = {
      method,
      headers,
    };

    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(fullUrl, options);
      
      let data: T;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = (await response.text()) as any;
      }

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return {
        data,
        status: response.status,
        statusText: response.statusText,
      };
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  get<T = any>(url: string) {
    return this.request<T>('GET', url);
  }

  post<T = any>(url: string, data?: any) {
    return this.request<T>('POST', url, data);
  }

  put<T = any>(url: string, data?: any) {
    return this.request<T>('PUT', url, data);
  }

  patch<T = any>(url: string, data?: any) {
    return this.request<T>('PATCH', url, data);
  }

  delete<T = any>(url: string) {
    return this.request<T>('DELETE', url);
  }
}

const api = new ApiClient();

export default api;
