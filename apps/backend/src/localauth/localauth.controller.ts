import { Controller, Post, Body, Logger, Req, UseGuards, Get, Res,ForbiddenException } from '@nestjs/common';
import { LocalauthService } from './localauth.service';
import { ApiBody, ApiOperation, ApiProperty, ApiResponse, ApiTags,ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from './localauth.guard';
import { SignupDto } from './dto/signup.dto';
import {LoginDto,MfaSetupRequestDto} from './dto/login.dto';
import { ForgotPasswordInitDto, VerifyOtpDto, ResetPasswordDto } from './dto/forgot-password.dto';
import { SYSTEM_ROLES, SystemRoleName } from '../common/constants/system-roles';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';





class PermissionDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;
  
  @ApiProperty({ example: 'create_users' })
  name: string;
  
  @ApiProperty({ example: 'users' })
  resource: string;
  
  @ApiProperty({ example: 'create' })
  action: string;
  
  @ApiProperty({ example: 'Create new users', required: false })
  description?: string;
}

class LocalAuthUserResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;
  
  @ApiProperty({ example: 'John Doe' })
  name: string;
  
  @ApiProperty({ example: 'john.doe@example.com' })
  email: string;
  
  @ApiProperty({ 
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'ID of the tenant the user is currently logged in with',
    required: false 
  })
  tenantId?: string;
  
  @ApiProperty({ 
    description: 'Information about the tenant the user is currently logged in with',
    example: { id: '550e8400-e29b-41d4-a716-446655440000', name: 'ACME Corporation' },
    required: false
  })
  tenant?: { id: string; name: string };
  
  @ApiProperty({ 
    description: 'System role of the user',
    enum: SYSTEM_ROLES,
    example: 'END_USER_ADMIN',
    required: false
  })
  systemRole?: SystemRoleName;

  @ApiProperty({ 
    description: 'System role ID of the user',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false
  })
  systemRoleId?: string;
  
  @ApiProperty({ 
    type: [PermissionDto],
    description: 'Array of permissions assigned to the user',
    required: false
  })
  permissions?: PermissionDto[];
}

class AuthResponseDto {
  @ApiProperty({ 
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT access token for authentication' 
  })
  accessToken: string;
  
  @ApiProperty({ 
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT refresh token to obtain new access tokens' 
  })
  refreshToken: string;
  
  @ApiProperty({ 
    type: LocalAuthUserResponseDto,
    description: 'Information about the authenticated user'
  })
  user: LocalAuthUserResponseDto;
}

@Controller('localauth')
@ApiTags('localauth')
@ApiBearerAuth()
export class LocalauthController {
    private logger = new Logger(LocalauthController.name);

    constructor(private localAuthService: LocalauthService) {}
        
        @Post('signup')
        @ApiOperation({ summary: 'Sign up a new user' })
        @ApiResponse({ status: 201, description: 'User signed up successfully.' })
        @ApiResponse({ status: 400, description: 'Bad Request.' })
        @ApiBody({
            type: SignupDto,
            description: 'User signup information with organization options',
            examples: {
                newOrganization: {
                    summary: 'Create a new organization',
                    value: {
                        name: 'John Doe',
                        email: 'john.doe@example.com',
                        password: 'Password123',
                        confirmPassword: 'Password123',
                        phoneNumber: '+11234567890',
                        isOrganizationCreator: true,
                        organizationName: 'ACME Corporation',
                        organizationDescription: 'A global company specializing in widgets'
                    }
                },
                joinOrganization: {
                    summary: 'Join an existing organization',
                    value: {
                        name: 'Jane Smith',
                        email: 'jane.smith@example.com',
                        password: 'Password123',
                        confirmPassword: 'Password123',
                        phoneNumber: '+11234567891',
                        isOrganizationCreator: false,
                        tenantId: '550e8400-e29b-41d4-a716-446655440000'
                    }
                }
            }
        })  
        
        async signup(@Body() data: SignupDto, @Req() req: Request): Promise<any> {
            try {
                return await this.localAuthService.createUser(data,req);
            } catch (error) {
                this.logger.error('Error during signup', error);
                
                // Check if this is a PrismaClientKnownRequestError (unique constraint)
                if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
                    throw new ForbiddenException('A user with this email already exists');
                }
                
                // For our previously thrown ForbiddenException
                if (error.status === 403) {
                    throw error;
                }
                
                throw error;
            }
        }





        @Post('login')
        
        @ApiOperation({ summary: 'User login' })
        @ApiResponse({ status: 200,
             description: 'Login successful', 
             type: LoginDto
            })
        @ApiResponse({ status: 401, description: 'Invalid credentials' })
        @ApiResponse({ status: 400, description: 'Validation failed' })
        @Throttle({ default: { limit: 1, ttl: 6000 } })
        @UseGuards(ThrottlerGuard) 


        @ApiBody({
            type: LoginDto,
            description: 'User login credentials with optional tenant and system role selection',
            examples: {
                standard: {
                    summary: 'Standard login',
                    value: {
                        email: 'aishvary.pratap@lenscorp.ai',
                        password: 'Lenscorp123'
                    }
                },
                withMfa: {
                    summary: 'Login with MFA token',
                    value: {
                        email: 'john.doe@example.com',
                        password: 'Password123',
                        mfaToken: '123456'
                    }
                },
                withTenantId: {
                    summary: 'Login with specific tenant ID',
                    value: {
                        email: 'john.doe@example.com',
                        password: 'Password123',
                        tenantId: '550e8400-e29b-41d4-a716-446655440000'
                    }
                },
                withTenantName: {
                    summary: 'Login with tenant name',
                    value: {
                        email: 'john.doe@example.com',
                        password: 'Password123',
                        tenantName: 'ACME Corporation'
                    }
                },
                withSystemRole: {
                    summary: 'Login with system role validation',
                    value: {
                        email: 'admin@example.com',
                        password: 'Password123',
                        systemRole: 'ADMIN'
                    }
                },
                // withAllOptions: {
                //     summary: 'Login with all options',
                //     value: {
                //         email: 'admin@example.com',
                //         password: 'Password123',
                //         mfaToken: '123456',
                //         tenantId: '550e8400-e29b-41d4-a716-446655440000',
                //         systemRole: 'SUPER_ADMIN'
                //     }
                // }
            }
        })
        async login(@Body() data: LoginDto, @Req() req: Request): Promise<any> {
            return this.localAuthService.login(req, data);
        }

        
        @UseGuards(AuthGuard)
        @Get('getSessions')
        @ApiOperation({ summary: 'Get user sessions' })
        @ApiResponse({ status: 200, description: 'User sessions retrieved successfully.' })
        @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or expired token.' })

        async getProfile(@Req() req){
            return await this.localAuthService.getSessions(req);
        }





        @UseGuards(AuthGuard)
        @Post('refreshToken')
        @ApiOperation({ summary: 'Refresh authentication token' })
        @ApiResponse({ status: 200, description: 'Token refreshed successfully.' })
        @ApiResponse({ status: 401, description: 'Unauthorized - Invalid refresh token.' })
        @ApiBody({
            description: 'Refresh token information',
            examples: {
                refreshToken: {
                    summary: 'Refresh token example',
                    value: {
                        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
                    }
                }
            }
        })
        refreshToken(@Req() req:Request,@Body() Body:any){
            return this.localAuthService.refreshToken(req,{refreshToken:Body.token})
        }

        @UseGuards(AuthGuard)
        @Post('activateMFA')
        @ApiOperation({ summary: 'Activate Multi-Factor Authentication for user' })
        @ApiResponse({ status: 200, description: 'MFA QR code image returned successfully.' })
        @ApiResponse({ status: 401, description: 'Unauthorized - Invalid token.' })
        async activateMFA(@Req() req: Request,@Res() res: any): Promise<any> {
            const imgBuffer =  await this.localAuthService.activateUserMFA(req);
            res.setHeader('Content-Type', 'image/png');
            res.send(imgBuffer);
        }



        @UseGuards(AuthGuard)
        @Post('deactivateMFA')
        @ApiOperation({ summary: 'Deactivate Multi-Factor Authentication for user' })
        @ApiResponse({ status: 200, description: 'MFA deactivated successfully.' })
        @ApiResponse({ status: 401, description: 'Unauthorized - Invalid token.' })

        async deactivateMFA(@Req() req: Request,@Res() res: any): Promise<any> {
            return await this.localAuthService.disableUserMFA(req);
        }

        @UseGuards(AuthGuard)
        @Get('logout')
        @ApiOperation({ summary: 'User logout' })
        @ApiResponse({ status: 200, description: 'User logged out successfully.' })
        @ApiResponse({ status: 401, description: 'Unauthorized - Invalid token.' })
        logout(@Req() req:Request,@Body() Body:any){
            return this.localAuthService.logout(req)
        }






        
        @Post('forgot-password')
        @ApiOperation({ summary: 'Initiate forgot password process' })
        @ApiResponse({ status: 200, description: 'OTP sent successfully.' })
        @ApiResponse({ status: 404, description: 'User not found.' })
        @ApiBody({
            type: ForgotPasswordInitDto,
            description: 'Email and optional phone number for password reset',
            examples: {
                withEmail: {
                    summary: 'Reset with email',
                    value: {
                        email: 'john.doe@example.com'
                    }
                },
                withPhone: {
                    summary: 'Reset with email and phone',
                    value: {
                        email: 'john.doe@example.com',
                        phoneNumber: '+11234567890'
                    }
                }
            }
        })
        async forgotPassword(@Body() data: ForgotPasswordInitDto) {
            return await this.localAuthService.initiateForgotPassword(data);
        }

        
        @Post('verify-otp')
        @ApiOperation({ summary: 'Verify OTP for password reset' })
        @ApiResponse({ status: 200, description: 'OTP verified successfully.' })
        @ApiResponse({ status: 400, description: 'Invalid OTP.' })
        @ApiBody({
            type: VerifyOtpDto,
            description: 'Email and OTP for verification',
            examples: {
                verifyOtp: {
                    summary: 'Verify OTP',
                    value: {
                        email: 'john.doe@example.com',
                        otp: '123456'
                    }
                }
            }
        })
        async verifyOtp(@Body() data: VerifyOtpDto) {
            return await this.localAuthService.verifyOtp(data);
        }

        
        @Post('reset-password')
        @ApiOperation({ summary: 'Reset password with verified OTP' })
        @ApiResponse({ status: 200, description: 'Password reset successfully.' })
        @ApiResponse({ status: 400, description: 'Invalid OTP or passwords do not match.' })
        @ApiBody({
            type: ResetPasswordDto,
            description: 'Email, OTP, and new password for reset',
            examples: {
                resetPassword: {
                    summary: 'Reset password',
                    value: {
                        email: 'john.doe@example.com',
                        otp: '123456',
                        newPassword: 'NewPassword123',
                        confirmPassword: 'NewPassword123'
                    }
                }
            }
        })
        async resetPassword(@Body() data: ResetPasswordDto) {
            return await this.localAuthService.resetPassword(data);
        }




        
        @Post('get-mfa-setup')
        @ApiOperation({ 
            summary: 'Get MFA setup information for login flow',
            description: 'Returns QR code and setup instructions when user needs to set up MFA during login. This is a public endpoint that requires valid credentials.'
        })
        @ApiResponse({ 
            status: 200, 
            description: 'MFA setup information returned successfully.',
            schema: {
                type: 'object',
                properties: {
                    qrCodeUrl: { type: 'string', description: 'Base64 encoded QR code image' },
                    secret: { type: 'string', description: 'Manual entry key for authenticator apps' },
                    instructions: { type: 'string', description: 'Setup instructions' }
                }
            }
        })
        @ApiResponse({ status: 401, description: 'Unauthorized - Invalid credentials.' })
        @ApiResponse({ status: 403, description: 'Forbidden - MFA not enabled for user.' })
        @ApiBody({
            description: 'User credentials to verify before providing MFA setup',
            examples: {
                getMfaSetup: {
                    summary: 'Get MFA Setup',
                    value: {
                        email: 'john.doe@example.com',
                        password: 'Password123'
                    }
                }
            }
        })
        async getMfaSetup(@Body() data: MfaSetupRequestDto) {
            return await this.localAuthService.getMfaSetupForLogin(data);
        }

       
        @Post('verify-mfa-setup')
        @ApiOperation({ 
            summary: 'Verify MFA setup completion',
            description: 'Verifies that user has successfully set up MFA by providing their first authentication token. This completes the MFA setup process without performing a full login.'
        })
        @ApiResponse({ 
            status: 200, 
            description: 'MFA setup verified and completed successfully.',
            schema: {
                type: 'object',
                properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'MFA setup completed successfully' },
                    setupComplete: { type: 'boolean', example: true }
                }
            }
        })
        @ApiResponse({ status: 401, description: 'Unauthorized - Invalid credentials.' })
        @ApiResponse({ status: 400, description: 'Invalid MFA token or setup already complete.' })
        @ApiBody({
            description: 'User credentials and MFA token to verify setup',
            examples: {
                verifySetup: {
                    summary: 'Verify MFA Setup',
                    value: {
                        email: 'john.doe@example.com',
                        password: 'Password123',
                        mfaToken: '123456'
                    }
                }
            }
        })
        async verifyMfaSetup(@Body() data: { email: string; password: string; mfaToken: string }) {
            return await this.localAuthService.verifyMfaSetup(data);
        }

        
        @Post('verify-mfa-login')
        @ApiOperation({ 
            summary: 'Complete login with MFA token',
            description: 'Completes the login process after MFA token verification. Use this when MFA token is required.'
        })
        @ApiResponse({ 
            status: 200, 
            description: 'Login completed successfully with MFA.',
            type: AuthResponseDto 
        })
        @ApiResponse({ status: 401, description: 'Unauthorized - Invalid credentials or MFA token.' })
        @ApiBody({
            description: 'Complete login credentials with MFA token',
            examples: {
                completeMfaLogin: {
                    summary: 'Complete MFA Login',
                    value: {
                        email: 'john.doe@example.com',
                        password: 'Password123',
                        mfaToken: '123456',
                        tenantId: '550e8400-e29b-41d4-a716-446655440000'
                    }
                }
            }
        })
        async verifyMfaLogin(@Body() data: LoginDto, @Req() req: Request): Promise<AuthResponseDto> {
            return this.localAuthService.login(req, data);
        }




}