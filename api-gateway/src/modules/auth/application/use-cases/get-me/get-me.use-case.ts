import { Injectable, NotFoundException } from '@nestjs/common';
import { AbstractUseCase } from '~/common/abstract-use-case';
import { AbstractUserRepository } from '~/modules/auth/application/gateways/repositories/abstract-user.repository';
import { UserMapper } from '~/modules/auth/domain/mappers/user.mapper';
import {
  IGetMeUseCaseInput,
  IGetMeUseCaseOutput,
} from './get-me.interface';

@Injectable()
export class GetMeUseCase extends AbstractUseCase<
  IGetMeUseCaseInput,
  IGetMeUseCaseOutput
> {
  constructor(
    private readonly userRepository: AbstractUserRepository,
  ) {
    super();
  }

  async execute(input: IGetMeUseCaseInput): Promise<IGetMeUseCaseOutput> {
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      user: UserMapper.toDto(user),
    };
  }
}
