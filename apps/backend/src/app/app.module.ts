import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { OrganisationsModule } from '../organisations/organisations.module';
import { MfaModule } from '../mfa/mfa.module';
import { DbModule } from '../db/db.module';
import { MailModule } from '../lib/mail.module';

@Module({
  imports: [MailModule, DbModule, AuthModule, UsersModule, OrganisationsModule, MfaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
