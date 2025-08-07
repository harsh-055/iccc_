export interface ISmsService {
  sendSms(to: string[], body: string): Promise<boolean>;
  sendVerificationCode(to: string, code?: string): Promise<boolean>;
  verifyVerificationCode(to: string, code: string): Promise<boolean>;
}
