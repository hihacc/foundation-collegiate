/**
 * TFC WhatsApp Automation Service Client
 * Calls the dedicated microservice at https://foundation-whatsapp.vercel.app
 */

const WHATSAPP_SERVICE_BASE_URL = process.env.WHATSAPP_SERVICE_URL || 'https://foundation-whatsapp1-production.up.railway.app';
const WHATSAPP_SERVICE_API_KEY = process.env.TFC_SERVICE_API_KEY || 'tfc_whatsapp_sec_key_2026_live_99x';

export interface WhatsAppResponse<T = any> {
  success: boolean;
  data: T | null;
  error: { code: string; message: string } | null;
  requestId?: string;
}

export class TfcWhatsAppService {
  private static async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<WhatsAppResponse<T>> {
    try {
      const url = `${WHATSAPP_SERVICE_BASE_URL}/api/v1${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
      const res = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': WHATSAPP_SERVICE_API_KEY,
          ...(options.headers || {})
        },
        cache: 'no-store'
      });

      const data = await res.json();
      return data;
    } catch (error: any) {
      return {
        success: false,
        data: null,
        error: {
          code: 'NETWORK_ERROR',
          message: error.message || 'Failed to communicate with WhatsApp service'
        }
      };
    }
  }

  // 1. Health Probe
  static async checkHealth() {
    return this.request('/health');
  }

  // 2. Operational Status
  static async getStatus() {
    return this.request('/status');
  }

  // 3. Accounts Management
  static async listAccounts() {
    return this.request('/accounts');
  }

  static async createAccount(name: string, phoneNumber?: string) {
    return this.request('/accounts', {
      method: 'POST',
      body: JSON.stringify({ name, phoneNumber })
    });
  }

  static async connectAccount(accountId: string) {
    return this.request(`/accounts/${accountId}/connect`, { method: 'POST' });
  }

  static async getQrCode(accountId: string) {
    return this.request(`/accounts/${accountId}/qr`);
  }

  static async confirmAccount(accountId: string, phoneNumber?: string) {
    return this.request(`/accounts/${accountId}/confirm`, {
      method: 'POST',
      body: JSON.stringify({ phoneNumber })
    });
  }

  static async disconnectAccount(accountId: string) {
    return this.request(`/accounts/${accountId}/disconnect`, { method: 'POST' });
  }

  // 4. Message Dispatch
  static async sendMessage(payload: {
    accountId: string;
    recipient: string;
    messageBody: string;
    messageType?: 'TEXT' | 'IMAGE' | 'DOCUMENT' | 'TEMPLATE';
    metadata?: Record<string, any>;
  }) {
    return this.request('/messages/send', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  static async sendBulkMessages(payload: {
    accountId: string;
    messages: Array<{
      recipient: string;
      messageBody: string;
      metadata?: Record<string, any>;
    }>;
  }) {
    return this.request('/messages/bulk', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  // 5. Message History & Logs
  static async listMessages(params: { accountId?: string; status?: string; limit?: number; offset?: number } = {}) {
    const query = new URLSearchParams();
    if (params.accountId) query.set('accountId', params.accountId);
    if (params.status) query.set('status', params.status);
    if (params.limit) query.set('limit', String(params.limit));
    if (params.offset) query.set('offset', String(params.offset));

    return this.request(`/messages?${query.toString()}`);
  }

  static async retryMessage(messageId: string) {
    return this.request(`/messages/${messageId}/retry`, { method: 'POST' });
  }

  static async scheduleMessage(payload: {
    accountId: string;
    recipient: string;
    messageBody: string;
    scheduledAt: string;
    metadata?: Record<string, any>;
  }) {
    return this.request('/messages/schedule', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  // 6. Institutional Automations
  static async triggerAutomation(payload: {
    triggerType: 'ADMISSION_CONFIRMATION' | 'FEE_DUE_REMINDER' | 'ATTENDANCE_ALERT' | 'RESULT_NOTIFICATION' | 'ANNOUNCEMENT' | 'CUSTOM_EVENT';
    recipient: string;
    variables: Record<string, any>;
    accountId?: string;
    customTemplate?: string;
  }) {
    return this.request('/automations/trigger', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }
}
