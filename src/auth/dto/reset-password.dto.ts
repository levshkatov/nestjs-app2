import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';
import { SignUpCredentialsDto } from './signUp-credentials.dto';

export class ResetPasswordPhoneDto extends PickType(SignUpCredentialsDto, [
  'phone',
  'password',
  'confirmPassword',
  'firebaseIdToken',
] as const) {}

export class ResetPasswordEmailDto {
  @ApiProperty({
    example: 'test@gmail.com',
  })
  @IsEmail(undefined, {
    message: 'Email введен неверно',
  })
  email: string;
}

export class ResetPasswordEmailVerifyDto extends PickType(SignUpCredentialsDto, [
  'password',
  'confirmPassword',
] as const) {
  @ApiProperty()
  @IsNotEmpty({
    message: 'Ссылка восстановления неверна',
  })
  resetToken: string;
}

export class ResetPasswordEmailResponse {
  // TODO maybe need more fields

  @ApiProperty()
  message: string;
}
