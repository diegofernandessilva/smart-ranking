import { Injectable, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AbstractUseCase } from '~/common/abstract-use-case';
import { AbstractIdGenerator } from '~/modules/auth/application/gateways/providers/abstract-id-generator';
import { AbstractUserRepository } from '~/modules/auth/application/gateways/repositories/abstract-user.repository';
import { UserEntity } from '~/modules/auth/domain/entities/user.entity';
import { UserMapper } from '~/modules/auth/domain/mappers/user.mapper';
import { Email } from '~/modules/auth/domain/value-objects/email.vo';
import { Password } from '~/modules/auth/domain/value-objects/password.vo';
import { PhoneNumber } from '~/modules/auth/domain/value-objects/phone-number.vo';
import {
  IRegisterUseCaseInput,
  IRegisterUseCaseOutput,
} from './register.interface';

const BCRYPT_SALT_ROUNDS = 12;

@Injectable()
export class RegisterUseCase extends AbstractUseCase<
  IRegisterUseCaseInput,
  IRegisterUseCaseOutput
> {
  constructor(
    private readonly userRepository: AbstractUserRepository,
    private readonly idGenerator: AbstractIdGenerator,
  ) {
    super();
  }

  async execute(input: IRegisterUseCaseInput): Promise<IRegisterUseCaseOutput> {
    const email = new Email(input.email);
    const password = new Password(input.password);
    const phoneNumber = new PhoneNumber(input.phoneNumber);

    const existingUser = await this.userRepository.findByEmail(email.value);
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(password.value, BCRYPT_SALT_ROUNDS);

    const user = UserEntity.create(this.idGenerator.generate(), {
      email,
      password: Password.fromHash(hashedPassword),
      name: input.name,
      phoneNumber,
    });

    const createdUser = await this.userRepository.create(user);

    return {
      user: UserMapper.toDto(createdUser),
    };
  }
}
