import { UserEntity } from '~/modules/auth/domain/entities/user.entity';
import { IUserProps } from '~/modules/auth/domain/entities/user.interface';

export abstract class AbstractUserRepository {
  abstract create(user: UserEntity): Promise<UserEntity>;
  abstract findByEmail(email: string): Promise<UserEntity | null>;
  abstract findById(id: string): Promise<UserEntity | null>;
  abstract update(
    id: string,
    data: Partial<IUserProps>,
  ): Promise<UserEntity>;
  abstract softDelete(id: string): Promise<void>;
}
