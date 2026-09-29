import { Body, Controller, Post } from '@nestjs/common';
import { RegistrationService } from '../services/registration.service.js';
import {
  type RegisterInput,
  registerSchema,
} from '../schemas/register.schema.js';
import {
  type VerifyRegistrationInput,
  verifyRegistrationSchema,
} from '../schemas/verify-registration.schema.js';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import {
  ApiRegistration,
  ApiVerifyRegistration,
} from '../swagger/registration.swagger.js';

@Controller('auth')
export class RegistrationController {
  constructor(private readonly registrationService: RegistrationService) {}

  @Post('register')
  @ApiRegistration()
  register(@Body(new ZodValidationPipe(registerSchema)) body: RegisterInput) {
    return this.registrationService.register(body);
  }

  @Post('register/verify')
  @ApiVerifyRegistration()
  verifyRegistration(
    @Body(new ZodValidationPipe(verifyRegistrationSchema))
    body: VerifyRegistrationInput,
  ) {
    return this.registrationService.verifyRegistration(body);
  }
}
