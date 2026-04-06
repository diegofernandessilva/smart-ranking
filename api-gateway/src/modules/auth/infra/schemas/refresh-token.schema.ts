import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type RefreshTokenDocument = HydratedDocument<RefreshTokenModel>;

@Schema({ timestamps: true, collection: 'refresh_tokens' })
export class RefreshTokenModel {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'UserModel',
    required: true,
  })
  userId!: string;

  @Prop({ required: true, unique: true })
  tokenHash!: string;

  @Prop({ required: true })
  expiresAt!: Date;

  @Prop({ default: false })
  isRevoked!: boolean;

  @Prop()
  replacedByHash?: string;

  @Prop({ type: Date, default: null })
  deletedAt!: Date | null;

  createdAt!: Date;
  updatedAt!: Date;
}

export const RefreshTokenSchema =
  SchemaFactory.createForClass(RefreshTokenModel);

RefreshTokenSchema.index({ userId: 1, expiresAt: 1 });
