import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<UserModel>;

@Schema({ timestamps: true, collection: 'users' })
export class UserModel {
  @Prop({ required: true, unique: true })
  email!: string;

  @Prop({ required: true })
  password!: string;

  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  phoneNumber!: string;

  @Prop({ required: true, enum: ['ADMIN', 'PLAYER'], default: 'PLAYER' })
  role!: string;

  @Prop({ required: true, default: true })
  isActive!: boolean;

  @Prop({ required: true, default: 0 })
  failedLoginAttempts!: number;

  @Prop()
  lockedUntil?: Date;

  @Prop()
  passwordResetToken?: string;

  @Prop()
  passwordResetExpires?: Date;

  @Prop()
  lastPasswordChange?: Date;

  @Prop({ type: Date, default: null })
  deletedAt!: Date | null;

  createdAt!: Date;
  updatedAt!: Date;
}

export const UserSchema = SchemaFactory.createForClass(UserModel);

UserSchema.index({ email: 1, deletedAt: 1 }, { unique: true });
