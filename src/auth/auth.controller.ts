import { Controller, Post, Body, Get, Query, Header, Req } from '@nestjs/common';
import { SignInCredentialsDto } from './dto/signIn-credentials.dto';
import { SignUpCredentialsDto } from './dto/signUp-credentials.dto';
import { SignFirebaseDto, SignVkDto } from './dto/social-credentials.dto';
import { SignUpManagerDto } from './dto/signUp-manager.dto';
import {
  ResetPasswordEmailDto,
  ResetPasswordEmailResponse,
  ResetPasswordEmailVerifyDto,
  ResetPasswordPhoneDto,
} from './dto/reset-password.dto';
import { ResponseDto, ResponseSocialDto } from './dto/response.dto';
import { AuthService } from './auth.service';
import {
  ApiTags,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { User } from '../models/user.model';
import { ErrorDto } from '../dto/simple-response.dto';
import { EditEmailVerifyDto } from './dto/edit-email.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/signup')
  @ApiCreatedResponse({ type: ResponseDto, description: 'Пользователь создан' })
  @ApiConflictResponse({ description: 'Пользователь уже существует', type: ErrorDto })
  @ApiBadRequestResponse({ type: ErrorDto })
  signUp(@Body() signUpCredentialsDto: SignUpCredentialsDto): Promise<{ accessToken: string; user: Partial<User> }> {
    return this.authService.signUp(signUpCredentialsDto);
  }

  @Post('/signup/manager')
  @ApiOperation({ summary: 'Первичная регистрация менеджера' })
  @ApiCreatedResponse({ type: ResponseDto })
  @ApiConflictResponse({ description: 'Пользователь с этим email уже существует', type: ErrorDto })
  @ApiBadRequestResponse({ type: ErrorDto })
  signUpManager(@Body() signUpManagerDto: SignUpManagerDto) {
    return this.authService.signUpManager(signUpManagerDto);
  }

  @Post('/firebase')
  @ApiOperation({ summary: 'Авторизация, регистрация facebook, google' })
  @ApiOkResponse({ type: ResponseSocialDto })
  @ApiBadRequestResponse({ type: ErrorDto })
  signByFirebase(@Body() signDto: SignFirebaseDto) {
    return this.authService.signByFirebase(signDto);
  }

  @Post('/vk')
  @ApiOperation({ summary: 'Авторизация, регистрация VK' })
  @ApiOkResponse({ type: ResponseSocialDto })
  @ApiBadRequestResponse({ type: ErrorDto })
  signByVk(@Body() signDto: SignVkDto, @Req() req) {
    const ip = req.ip.startsWith('::ffff:') ? req.ip.slice(7) : req.ip;
    return this.authService.signByVk(signDto, ip);
  }

  @Post('/signin')
  @ApiOkResponse({
    type: ResponseDto,
    description: 'Пользователь вошел',
  })
  @ApiBadRequestResponse({ type: ErrorDto })
  @ApiNotFoundResponse({ description: 'Пользователь не найден', type: ErrorDto })
  @ApiUnauthorizedResponse({ description: 'Неверно введены данные', type: ErrorDto })
  signIn(@Body() signInCredentialsDto: SignInCredentialsDto): Promise<{ accessToken: string; user: Partial<User> }> {
    return this.authService.signIn(signInCredentialsDto);
  }

  @Post('/reset-password/phone')
  @ApiOperation({
    summary: 'Изменения пароля через телефон',
  })
  @ApiOkResponse({
    type: ResponseDto,
    description: 'Пользователь изменил пароль',
  })
  @ApiNotFoundResponse({ description: 'Пользователь не найден', type: ErrorDto })
  @ApiBadRequestResponse({ description: 'Пароли не совпадают', type: ErrorDto })
  resetPasswordPhone(
    @Body() resetPasswordDto: ResetPasswordPhoneDto,
  ): Promise<{ accessToken: string; user: Partial<User> }> {
    return this.authService.resetPasswordPhone(resetPasswordDto);
  }

  @Post('/reset-password/email')
  @ApiOperation({
    summary: 'Отправка на почту письмо для изменения пароля',
  })
  @ApiOkResponse({
    type: ResetPasswordEmailResponse,
    description:
      'На указанный e-mail отправлено письмо с ссылкой на сброс пароля. После перехода по ссылке Вам будет доступно изменение пароля.',
  })
  @ApiBadRequestResponse({ type: ErrorDto })
  @ApiNotFoundResponse({ description: 'Пользователь не найден', type: ErrorDto })
  resetPasswordEmail(@Body() resetPasswordDto: ResetPasswordEmailDto) {
    return this.authService.resetPasswordEmail(resetPasswordDto);
  }

  @Post('/reset-password/email/verify')
  @ApiOperation({
    summary: 'Подтверждение изменения пароля через email',
  })
  @ApiOkResponse({
    type: ResponseDto,
    description: 'Пользователь изменил пароль',
  })
  @ApiBadRequestResponse({
    type: ErrorDto,
    description: 'Срок действия запроса на сброс пароля истек, или ссылка уже использована',
  })
  resetPasswordEmailVerify(@Body() resetPasswordDto: ResetPasswordEmailVerifyDto) {
    return this.authService.resetPasswordEmailVerify(resetPasswordDto);
  }

  @Get('/edit-email/verify')
  @Header('content-type', 'text/html')
  @ApiOperation({ summary: 'Подтверждение изменения email' })
  @ApiOkResponse({ type: String, description: 'Пользователь изменил email' })
  @ApiBadRequestResponse({
    type: ErrorDto,
    description: 'Срок действия запроса изменения электронной почты истек, или ссылка уже использована',
  })
  editEmailVerify(@Query() editEmailDto: EditEmailVerifyDto) {
    return this.authService.editEmailVerfiy(editEmailDto);
  }
}
