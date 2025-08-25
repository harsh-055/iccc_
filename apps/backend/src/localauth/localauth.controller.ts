import {
  Controller,
  Post,
  Body,
  Get,
  Res,
  Req,
} from '@nestjs/common';
import { LocalauthService } from './localauth.service';
import {
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';

@Controller('localauth')
@ApiTags('Local Authentication')
export class LocalauthController {
  constructor(private readonly localauthService: LocalauthService) {}

  @Post('signup')
  @ApiOperation({ summary: 'User registration' })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Validation failed' })
  @ApiResponse({ status: 409, description: 'Conflict - Email already exists' })
  @ApiBody({
    type: SignupDto,
    description: 'User registration data',
  })
  async signup(@Body() signupDto: SignupDto, @Req() req: any) {
    return this.localauthService.createUser(signupDto, req);
  }

  @Post('login')
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({
    status: 200,
    description: 'User logged in successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid credentials' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid credentials' })
  @ApiBody({
    type: LoginDto,
    description: 'User login credentials',
  })
  async login(@Body() loginDto: LoginDto, @Req() req: any) {
    return this.localauthService.login(req, loginDto);
  }

  @Get('logout')
  @ApiOperation({ summary: 'User logout' })
  @ApiResponse({
    status: 200,
    description: 'User logged out successfully',
  })
  async logout(@Req() req: any) {
    return this.localauthService.logout(req);
  }
}
