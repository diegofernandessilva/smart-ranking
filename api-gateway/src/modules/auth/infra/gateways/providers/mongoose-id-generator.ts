import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { AbstractIdGenerator } from '~/modules/auth/application/gateways/providers/abstract-id-generator';

@Injectable()
export class MongooseIdGenerator extends AbstractIdGenerator {
  generate(): string {
    return new Types.ObjectId().toString();
  }
}
