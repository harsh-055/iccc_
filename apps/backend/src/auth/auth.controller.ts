import { Controller, Post, Req, Res } from '@nestjs/common';
import { Response, Request } from 'express';
import SuperTokens from 'supertokens-node';
// import ThirdPartyEmailPassword from 'supertokens-node/recipe/thirdpartyemailpassword';
import Session from 'supertokens-node/recipe/session';

@Controller('auth')
export class AuthController {
  // 📌 Sign-up API
  // @Post('signup')
  // async signUp(@Req() req: Request, @Res() res: Response) {
  //     try {
  //         const { email, password } = req.body;
  //         const response = await ThirdPartyEmailPassword.signUp(email, password);
  //         if (response.status === 'OK') {
  //             await Session.createNewSession(req,res,'public' ,response.user.id);
  //             return res.status(200).json({ message: "Signup successful", user: response.user });
  //         } else {
  //             return res.status(400).json({ error: response.status });
  //         }
  //     } catch (error) {
  //         return res.status(500).json({ error: "Something went wrong" });
  //     }
  // }
  // // 📌 Sign-in API
  // @Post('signin')
  // async signIn(@Req() req: Request, @Res() res: Response) {
  //     try {
  //         const { email, password } = req.body;
  //         const response = await ThirdPartyEmailPassword.signIn(email, password);
  //         if (response.status === 'OK') {
  //             await Session.createNewSession(req,res,'public' ,response.user.id);
  //             return res.status(200).json({ message: "Signin successful", user: response.user });
  //         } else {
  //             return res.status(400).json({ error: "Invalid credentials" });
  //         }
  //     } catch (error) {
  //         return res.status(500).json({ error: "Something went wrong" });
  //     }
  // }
  // // 📌 Sign-out API
  // @Post('signout')
  // async signOut(@Req() req: Request, @Res() res: Response) {
  //     try {
  //         // await Session.revokeSession(req, res);
  //         return res.status(200).json({ message: "Signout successful" });
  //     } catch (error) {
  //         return res.status(500).json({ error: "Something went wrong" });
  //     }
  // }
}
