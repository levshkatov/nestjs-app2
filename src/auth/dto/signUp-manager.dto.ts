import { SignUpCredentialsDto } from './signUp-credentials.dto';
import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class SignUpManagerDto extends PickType(SignUpCredentialsDto, ['password', 'confirmPassword']) {
  @ApiProperty({
    example: 'test@gmail.com',
  })
  @IsEmail(undefined, {
    message: 'Email введен неверно',
  })
  email: string;
}
