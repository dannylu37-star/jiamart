import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(config: ConfigService) {
    const clientID = config.get<string>('GOOGLE_CLIENT_ID', 'placeholder');
    const clientSecret = config.get<string>('GOOGLE_CLIENT_SECRET', 'placeholder');
    super({
      clientID,
      clientSecret,
      callbackURL: config.get<string>('GOOGLE_CALLBACK_URL', 'http://localhost:3000/api/v1/auth/google/callback'),
      scope: ['email', 'profile'],
    } as any);
  }
  async validate(_at: string, _rt: string, profile: any, done: Function) {
    const { emails, photos, displayName } = profile;
    done(null, { email: emails[0].value, name: displayName, avatar: photos?.[0]?.value });
  }
}
