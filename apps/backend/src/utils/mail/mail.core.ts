export interface IMailService {
    sendMail(to: string[], subject: string, body: string, from?: string): Promise<boolean>;
    sendVerificationCode(to:string): Promise<boolean>;
    verifyVerificationCode(to: string, code: string): Promise<boolean>;
}
  