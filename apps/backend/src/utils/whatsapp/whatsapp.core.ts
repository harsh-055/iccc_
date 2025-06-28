export interface IWhatsAppService {
    sendMessage(to: string[], message: string, imageUrl?: string, videoUrl?: string,): Promise<boolean>;
    sendVerificationCode(to: string): Promise<boolean>;
    verifyVerificationCode(to: string, code: string): Promise<boolean>;
}
