import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../utils/jwt';
import { Request } from 'express';
import { PrismaService } from '../../db/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // First try Authorization Bearer header
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        // Then try auth_token cookie
        (req: Request) => {
          const token = req.cookies?.auth_token;
          return token || null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: JwtPayload) {
    // Fetch user roles from database
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    return {
      userId: payload.sub,
      email: payload.email,
      roles: user?.roles || [],
    };
  }
}
