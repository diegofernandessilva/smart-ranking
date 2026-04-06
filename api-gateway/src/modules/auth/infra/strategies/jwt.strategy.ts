import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { IJwtPayload } from '~/core/decorators/current-user.decorator';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_PUBLIC_KEY')!,
      algorithms: ['RS256'],
    });
  }

  validate(payload: { sub: string; email: string; role: string }): IJwtPayload {
    return {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
